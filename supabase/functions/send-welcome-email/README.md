# send-welcome-email

Supabase Edge Function that sends the **Welcome & Motive Onboarding** email via SendGrid when a new row is inserted into `profiles`.

## Trigger

Invoked by the database webhook (trigger on `profiles` INSERT). See migration `064_webhook_send_welcome_email.sql`.

**Auth:** The trigger calls this function via HTTP without a JWT. In Supabase Dashboard → Edge Functions → send-welcome-email → Settings, either allow **“Invoke without authorization”** for this function, or add an `Authorization: Bearer SERVICE_ROLE_KEY` header in the trigger (e.g. from vault).

## Secrets (set in Dashboard → Edge Functions → send-welcome-email → Secrets)

| Secret | Description |
|--------|-------------|
| `SENDGRID_API_KEY` | SendGrid API key (from .env / SendGrid dashboard) |
| `SENDGRID_FROM_EMAIL` | From address, e.g. `VantagFleet <info@vantagfleet.com>` |
| `SUPABASE_URL` | Project URL, e.g. `https://YOUR_PROJECT_REF.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (to look up user email from Auth) |
| `APP_URL` | (Optional) Frontend URL for links, e.g. `https://vantagfleet.com` — used for “Live Map is ready” link |

## Deploy

```bash
supabase functions deploy send-welcome-email
```

Then set the secrets:

```bash
supabase secrets set SENDGRID_API_KEY=your_key SENDGRID_FROM_EMAIL="VantagFleet <info@vantagfleet.com>"
# SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are often set automatically; if not, set them too.
```

## Payload

The trigger sends a JSON body:

```json
{
  "record": {
    "user_id": "uuid",
    "full_name": "Jane Doe",
    "is_beta_tester": true
  }
}
```

The function resolves the user's email via the Auth Admin API and sends the welcome email with optional Beta Founder P.S. when `is_beta_tester` is true.

**Conditional map section:** If the user has map access (beta tester at welcome time), the email includes “Your Live Map is ready! Once you connect Motive, you can track your trucks in real-time here: [Link].” (Link uses `APP_URL` + `/dashboard#live-map` when set.) If not (e.g. Solo Pro path), the email includes “Want to see your trucks on a live map? Upgrade to Fleet Master at any time to unlock real-time GPS tracking.”
