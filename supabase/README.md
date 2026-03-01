# Supabase – VantagFleet

Run migrations in **numeric order** in the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql).

## Migrations (run in order)

| Order | File | Description |
|-------|------|-------------|
| 1 | `migrations/001_initial_schema_and_rls.sql` | Multi-tenant schema, organizations, profiles, drivers, vehicles, compliance_docs, RLS |
| 2 | `migrations/002_signup_and_invites.sql` | Sign-up org-claiming, org_invites, get_invite_by_token |
| 3 | `migrations/003_fleet_compliance_2026.sql` | Fleet compliance: maintenance logs, compliance_reminders, loads, inspections |
| 4 | `migrations/004_roadside_tokens.sql` | roadside_tokens, get_roadside_summary RPC |
| 5 | `migrations/005_loads_state_for_ifta.sql` | loads.state_code for IFTA |
| 6 | `migrations/006_organizations_stripe_customer_id.sql` | organizations.stripe_customer_id |
| 7 | `migrations/007_platform_roles.sql` | platform_roles (ADMIN / EMPLOYEE) for /admin |
| 8 | `migrations/008_users_role_enum.sql` | user_role enum, public.users (CUSTOMER / SUPPORT / ADMIN) |
| 9 | `migrations/009_admin_logs.sql` | admin_logs audit trail (refunds, org create/update) |

## Scripts (run as needed)

- **`scripts/promote_by_user_id.sql`** – Promote a user to SUPPORT by their **user ID** (no email needed). Replace the UUID with the id from **Authentication → Users** in the Supabase dashboard (or from `SELECT id, email FROM auth.users;`). Use this when you don’t have employee emails yet—e.g. after the first person signs up.
- **`scripts/promote_user_to_support.sql`** – Same thing but by **email**. Edit the email variable first.

## Folder structure

```
supabase/
├── README.md           ← this file (migrations list)
├── migrations/         ← run in order in Supabase SQL Editor
│   ├── 001_initial_schema_and_rls.sql
│   ├── 002_signup_and_invites.sql
│   ├── 003_fleet_compliance_2026.sql
│   ├── 004_roadside_tokens.sql
│   ├── 005_loads_state_for_ifta.sql
│   ├── 006_organizations_stripe_customer_id.sql
│   ├── 007_platform_roles.sql
│   ├── 008_users_role_enum.sql
│   └── 009_admin_logs.sql
└── scripts/
    └── promote_user_to_support.sql
```

To add a new migration: create `migrations/010_description.sql`, add it to the table above, then run it in the SQL Editor.
