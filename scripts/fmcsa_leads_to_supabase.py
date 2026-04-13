#!/usr/bin/env python3
"""
Ingest FMCSA Company Census (DOT open data) into Supabase `public.leads`.

Source: U.S. DOT Socrata dataset "Company Census File"
  https://data.transportation.gov/Trucking-and-Motorcoaches/Company-Census-File/az4n-8mr2

Filters (defaults):
  - Active / authorized carriers (status_code = 'A' when that column exists)
  - 5–50 power units (NBR_POWER_UNIT / nbr_power_unit)

Env (from .env.local or environment):
  SUPABASE_URL              — required
  SUPABASE_SERVICE_ROLE_KEY — required (service role bypasses RLS; never commit)

Optional:
  SOCRATA_APP_TOKEN        — raises Socrata throttles / allows higher throughput
  FMCSA_LOCAL_CSV          — if set, read this file instead of the API (exported CSV from DOT portal)

Usage:
  python scripts/fmcsa_leads_to_supabase.py --dry-run
  python scripts/fmcsa_leads_to_supabase.py --limit 5000
  python scripts/fmcsa_leads_to_supabase.py --require-email

Compliance: Use only for lawful B2B prospecting; respect CAN-SPAM and state privacy rules.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Iterator

import requests

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

try:
    from supabase import create_client
except ImportError:
    create_client = None

# ---------------------------------------------------------------------------
# FMCSA / Socrata
# ---------------------------------------------------------------------------

SOCRATA_DATASET = "az4n-8mr2"
SOCRATA_JSON_URL = f"https://data.transportation.gov/resource/{SOCRATA_DATASET}.json"

# Try these keys in order (Socrata lowercases; source CSV sometimes documents UPPERCASE).
DOT_KEYS = ("dot_number", "usdot", "usdot_number", "dotnumber", "DOT_NUMBER")
NAME_KEYS = ("legal_name", "legalname", "LEGAL_NAME")
EMAIL_KEYS = (
    "email_address",
    "phy_email",
    "physical_email",
    "email",
    "EMAIL_ADDRESS",
    "PHY_EMAIL",
)
POWER_KEYS = ("nbr_power_unit", "total_power_units", "power_units", "NBR_POWER_UNIT", "TOTAL_POWER_UNITS")
STATUS_KEYS = ("status_code", "STATUS_CODE", "carrier_status")


def _first_key(row: dict[str, Any], candidates: tuple[str, ...]) -> str | None:
    lower = {k.lower(): k for k in row.keys()}
    for c in candidates:
        if c in row:
            return c
        ck = c.lower()
        if ck in lower:
            return lower[ck]
    return None


def _parse_int(val: Any) -> int | None:
    if val is None or val == "":
        return None
    try:
        return int(float(str(val).strip()))
    except (TypeError, ValueError):
        return None


def _normalize_dot(raw: Any) -> str | None:
    if raw is None:
        return None
    s = str(raw).strip()
    if not s:
        return None
    return str(int(s)) if s.isdigit() else s


def _active_status(value: Any) -> bool:
    if value is None:
        return True  # if column missing, do not filter out
    v = str(value).strip().upper()
    # FMCSA: A = Authorized (active). I = Inactive, etc.
    return v in ("A", "ACTIVE", "AUTHORIZED", "1", "TRUE", "Y", "YES")


def normalize_census_row(row: dict[str, Any]) -> dict[str, Any] | None:
    k_dot = _first_key(row, DOT_KEYS)
    k_name = _first_key(row, NAME_KEYS)
    k_email = _first_key(row, EMAIL_KEYS)
    k_pu = _first_key(row, POWER_KEYS)
    k_stat = _first_key(row, STATUS_KEYS)

    if not k_dot or not k_name:
        return None

    dot = _normalize_dot(row.get(k_dot))
    name = str(row.get(k_name) or "").strip()
    if not dot or not name:
        return None

    if k_stat and not _active_status(row.get(k_stat)):
        return None

    pu = _parse_int(row.get(k_pu)) if k_pu else None
    email_raw = row.get(k_email) if k_email else None
    email = str(email_raw).strip().lower() if email_raw else None
    if email == "":
        email = None

    st_val = row.get(k_stat) if k_stat else None
    carrier_status = str(st_val).strip()[:32] if st_val is not None else None

    return {
        "dot_number": dot,
        "legal_name": name[:500],
        "email": email[:500] if email else None,
        "power_units": pu,
        "carrier_status": carrier_status,
        # Small audit blob only (full census row can be huge)
        "extra": {"dataset": SOCRATA_DATASET},
    }


def iter_socrata_pages(
    *,
    page_size: int,
    app_token: str | None,
    max_rows: int | None,
) -> Iterator[dict[str, Any]]:
    offset = 0
    yielded = 0
    session = requests.Session()
    while True:
        limit = page_size
        if max_rows is not None:
            limit = min(page_size, max_rows - yielded)
            if limit <= 0:
                break

        params: dict[str, str | int] = {
            "$limit": limit,
            "$offset": offset,
            "$order": "dot_number",
        }
        if app_token:
            params["$$app_token"] = app_token

        r = session.get(SOCRATA_JSON_URL, params=params, timeout=120)
        if not r.ok:
            raise RuntimeError(f"Socrata HTTP {r.status_code}: {r.text[:500]}")

        batch = r.json()
        if not batch:
            break

        for row in batch:
            yielded += 1
            yield row

        if len(batch) < limit:
            break
        offset += len(batch)
        time.sleep(0.15)  # be polite without app token


def iter_local_csv(path: Path) -> Iterator[dict[str, Any]]:
    with path.open(newline="", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            yield {k: (v.strip() if isinstance(v, str) else v) for k, v in row.items() if k}


# ---------------------------------------------------------------------------
# Supabase
# ---------------------------------------------------------------------------

def load_env() -> None:
    root = Path(__file__).resolve().parents[1]
    if load_dotenv:
        load_dotenv(root / ".env.local")
        load_dotenv(root / ".env")


def upsert_leads(
    rows: list[dict[str, Any]],
    *,
    dry_run: bool,
    batch_size: int,
) -> int:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if dry_run:
        return 0
    if not url or not key:
        raise SystemExit("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
    if create_client is None:
        raise SystemExit("Install supabase: pip install -r scripts/requirements-leads.txt")

    client = create_client(url, key)
    attempted = 0
    for i in range(0, len(rows), batch_size):
        chunk = rows[i : i + batch_size]
        payload = [
            {
                "dot_number": r["dot_number"],
                "legal_name": r["legal_name"],
                "email": r["email"],
                "power_units": r["power_units"],
                "carrier_status": r["carrier_status"],
                "source": "fmcsa_company_census",
                "extra": r.get("extra") or {},
            }
            for r in chunk
        ]
        attempted += len(payload)
        # Skip DOT numbers already in DB (no duplicate carriers).
        _insert_new_dots_only(client, payload)
    return attempted


def _insert_new_dots_only(client: Any, payload: list[dict[str, Any]]) -> None:
    if not payload:
        return
    dots = [r["dot_number"] for r in payload]
    res = client.table("leads").select("dot_number").in_("dot_number", dots).execute()
    existing = {str(r["dot_number"]) for r in (res.data or [])}
    fresh = [r for r in payload if str(r["dot_number"]) not in existing]
    if not fresh:
        return
    try:
        client.table("leads").insert(fresh).execute()
    except Exception as e:
        # Unique race or concurrency: safe to skip if duplicate key
        if "duplicate" not in str(e).lower() and "23505" not in str(e):
            raise


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="FMCSA census -> Supabase leads")
    parser.add_argument("--dry-run", action="store_true", help="Fetch & filter only; print counts")
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Max raw census rows to scan (API order). Omitting this uses 50,000 unless --full-census",
    )
    parser.add_argument(
        "--full-census",
        action="store_true",
        help="Scan entire Socrata dataset (can take a long time). Ignores default --limit cap.",
    )
    parser.add_argument("--min-power", type=int, default=5)
    parser.add_argument("--max-power", type=int, default=50)
    parser.add_argument("--require-email", action="store_true", help="Skip rows with no email")
    parser.add_argument("--page-size", type=int, default=1000, help="Socrata page size (max 50000 with token)")
    parser.add_argument("--batch-size", type=int, default=200)
    parser.add_argument(
        "--print-sample",
        type=int,
        default=0,
        help="Print first N normalized rows as JSON (debug column mapping)",
    )
    args = parser.parse_args()
    load_env()

    local_csv = os.environ.get("FMCSA_LOCAL_CSV")
    app_token = os.environ.get("SOCRATA_APP_TOKEN")

    # Unbounded API pulls are easy to run by mistake (hours + rate limits).
    effective_limit = args.limit
    if not local_csv and not args.full_census and effective_limit is None:
        effective_limit = 50_000
        print(
            "Note: no --limit; scanning first 50,000 raw API rows. "
            "Use --limit N or --full-census for more.",
            file=sys.stderr,
        )

    seen_dot: set[str] = set()
    normalized: list[dict[str, Any]] = []
    raw_seen = 0

    if local_csv:
        path = Path(local_csv).expanduser()
        if not path.is_file():
            raise SystemExit(f"FMCSA_LOCAL_CSV not found: {path}")
        iterator = iter_local_csv(path)
    else:
        iterator = iter_socrata_pages(
            page_size=args.page_size,
            app_token=app_token,
            max_rows=effective_limit,
        )

    for row in iterator:
        raw_seen += 1
        if effective_limit is not None and raw_seen > effective_limit:
            break
        n = normalize_census_row(row)
        if not n:
            continue
        pu = n.get("power_units")
        if pu is None or pu < args.min_power or pu > args.max_power:
            continue
        if args.require_email and not n.get("email"):
            continue
        if n["dot_number"] in seen_dot:
            continue
        seen_dot.add(n["dot_number"])
        normalized.append(n)

        if args.print_sample and len(normalized) <= args.print_sample:
            print(json.dumps(n, indent=2), file=sys.stderr)

    print(f"Scanned raw rows: {raw_seen}")
    print(f"Matched filters (unique DOT): {len(normalized)}")

    if args.dry_run:
        with_email = sum(1 for r in normalized if r.get("email"))
        print(f"With email: {with_email}")
        return

    # --print-sample is for column debugging only; do not require Supabase credentials
    if args.print_sample:
        with_email = sum(1 for r in normalized if r.get("email"))
        print(f"With email: {with_email}")
        print(
            "Preview only (--print-sample). Run without it to import to Supabase.",
            file=sys.stderr,
        )
        return

    attempted = upsert_leads(normalized, dry_run=False, batch_size=args.batch_size)
    print(f"Rows attempted for insert (new DOTs only): {attempted}")


if __name__ == "__main__":
    main()
