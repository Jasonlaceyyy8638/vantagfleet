#!/usr/bin/env node
/**
 * Match Supabase vehicles to Motive vehicles by VIN and set motive_id.
 * Usage: node scripts/match-motive-vehicles-by-vin.mjs [orgId]
 * Requires: MOTIVE_API_KEY in .env, or org must have Motive OAuth connected.
 * Uses Supabase service role (SUPABASE_SERVICE_ROLE_KEY).
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const MOTIVE_API_BASE = 'https://api.gomotive.com/v1';

function getAuthHeaders() {
  const apiKey = process.env.MOTIVE_API_KEY?.trim();
  if (apiKey) return Promise.resolve({ Authorization: `Bearer ${apiKey}` });
  // OAuth path: would need orgId and to read carrier_integrations; for script we require API key for simplicity
  return Promise.resolve(null);
}

function normalizeVin(vin) {
  if (!vin || typeof vin !== 'string') return '';
  return vin.replace(/\s/g, '').toUpperCase();
}

async function fetchMotiveVehicles(orgId) {
  const headers = await getAuthHeaders();
  if (!headers) {
    console.error('MOTIVE_API_KEY is required. Set it in .env or use OAuth-connected org.');
    process.exit(1);
  }
  const res = await fetch(`${MOTIVE_API_BASE}/vehicles`, {
    headers: { ...headers, 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    console.error('Motive API error:', res.status, await res.text());
    process.exit(1);
  }
  const data = await res.json();
  const list = Array.isArray(data.vehicles) ? data.vehicles : Array.isArray(data) ? data : [];
  return list.map((v) => ({
    id: String(v.id),
    vin: v.vin ? normalizeVin(v.vin) : '',
    number: v.number,
    license_plate_state: v.license_plate_state,
  }));
}

async function main() {
  const orgId = process.argv[2];
  if (!orgId) {
    console.error('Usage: node scripts/match-motive-vehicles-by-vin.mjs <orgId>');
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const [motiveVehicles, { data: sbVehicles, error: sbError }] = await Promise.all([
    fetchMotiveVehicles(orgId),
    supabase.from('vehicles').select('id, vin, motive_id, unit_number').eq('org_id', orgId),
  ]);

  if (sbError) {
    console.error('Supabase error:', sbError.message);
    process.exit(1);
  }

  const vinToMotive = new Map();
  for (const v of motiveVehicles) {
    if (v.vin) vinToMotive.set(v.vin, v);
  }

  let matched = 0;
  let skipped = 0;
  let updated = 0;

  for (const row of sbVehicles || []) {
    const vin = row.vin ? normalizeVin(row.vin) : '';
    if (!vin) {
      skipped++;
      continue;
    }
    const motive = vinToMotive.get(vin);
    if (!motive) {
      skipped++;
      continue;
    }
    matched++;
    if (row.motive_id === motive.id) continue;
    const { error } = await supabase
      .from('vehicles')
      .update({ motive_id: motive.id, unit_number: motive.number || row.unit_number, updated_at: new Date().toISOString() })
      .eq('id', row.id);
    if (error) {
      console.error('Update failed for', row.id, error.message);
    } else {
      updated++;
      console.log('Matched:', row.unit_number || row.id, 'VIN', vin.slice(-6), '-> Motive', motive.id);
    }
  }

  console.log('Done. Matched by VIN:', matched, 'Updated:', updated, 'Skipped (no VIN or no match):', skipped);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
