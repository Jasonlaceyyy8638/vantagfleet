// Supabase Edge Function: send welcome + Motive onboarding email via SendGrid.
// Triggered by database webhook on INSERT into profiles.
// Deno runtime – use fetch for SendGrid and Supabase Auth Admin API.

const SENDGRID_URL = 'https://api.sendgrid.com/v3/mail/send';

function getFirstName(fullName: string | null | undefined): string {
  if (!fullName || typeof fullName !== 'string') return 'there';
  const trimmed = fullName.trim();
  if (!trimmed) return 'there';
  const first = trimmed.split(/\s+/)[0];
  return first || 'there';
}

function emailFooter(appUrl: string): { text: string; html: string } {
  const base = (appUrl || '').replace(/\/$/, '');
  const privacyUrl = base ? `${base}/privacy` : '#';
  const termsUrl = base ? `${base}/terms` : '#';
  return {
    text: base ? `\n\n---\nPrivacy Policy: ${privacyUrl}\nTerms of Service: ${termsUrl}\n© VantagFleet` : '',
    html: base ? `<p style="margin-top:24px;font-size:12px;color:#94a3b8;">Privacy Policy: <a href="${privacyUrl}" style="color:#f59e0b;">${privacyUrl}</a> &nbsp;|&nbsp; Terms of Service: <a href="${termsUrl}" style="color:#f59e0b;">${termsUrl}</a></p><p style="font-size:11px;color:#64748b;">© VantagFleet</p>` : '',
  };
}

/** Founder Welcome (first 5): 90-day credit, full access, direct feedback line. */
function buildFounderWelcomeEmail(firstName: string, appUrl: string): { subject: string; text: string; html: string } {
  const dashboardUrl = appUrl ? `${appUrl.replace(/\/$/, '')}/dashboard` : '';
  const footer = emailFooter(appUrl);
  const signOff = 'The VantagFleet Team, Founder of VantagFleet';
  const text = `Hi ${firstName},

You made it. You're one of the first 5 carriers to join our Founder's Beta.

I've applied a 90-day credit to your account for the Fleet Master Plan. You now have full access to:
• Live GPS Tracking
• Audit-Ready IFTA Exports
• The AI Fuel Scanner

Since you're a Founding Carrier, you have a direct line to me for feedback.

Welcome to the future of fleet management.

- ${signOff}${footer.text}`;

  const html = [
    `<p>Hi <strong>${firstName}</strong>,</p>`,
    `<p>You made it. You're one of the first 5 carriers to join our Founder's Beta.</p>`,
    `<p>I've applied a <strong>90-day credit</strong> to your account for the Fleet Master Plan. You now have full access to:</p>`,
    '<ul><li>Live GPS Tracking</li><li>Audit-Ready IFTA Exports</li><li>The AI Fuel Scanner</li></ul>',
    `<p>Since you're a Founding Carrier, you have a direct line to me for feedback.</p>`,
    `<p>Welcome to the future of fleet management.</p>`,
    dashboardUrl ? `<p><a href="${dashboardUrl}" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#0f172a;font-weight:700;text-decoration:none;border-radius:8px;">Go to Dashboard</a></p>` : '',
    `<p>- ${signOff}</p>`,
    footer.html,
  ]
    .filter(Boolean)
    .join('');

  return {
    subject: "Welcome to the VantagFleet Inner Circle! (Founder's Access)",
    text,
    html,
  };
}

function buildStandardEmailBody(firstName: string, isBetaTester: boolean, appUrl: string): { text: string; html: string } {
  const guide = `
1. Log In: Head over to your VantagFleet Dashboard.
2. Go to Connections: Click on the Settings gear icon in the sidebar and select 'Integrations'.
3. Find Motive: Click the 'Connect Motive' button.
4. Authorize: You will be redirected to the Motive login page. Enter your credentials and click 'Allow' to grant VantagFleet secure access to your fleet data.
5. Watch the Magic: Once redirected back, you'll see your trucks and drivers automatically appear in your VantagFleet account.`;

  const liveMapUrl = appUrl ? `${appUrl.replace(/\/$/, '')}/dashboard#live-map` : '';
  const hasMapAccess = isBetaTester; // At welcome time: beta = map access; others see upgrade CTA.

  let text = `Hi ${firstName},

Welcome to VantagFleet. You've officially taken the first step toward an automated, audit-proof back office.

To get your dashboard up and running, we need to link your Motive (formerly KeepTruckin) account. This allows us to automatically import your trucks, live GPS locations, and mileage data so you don't have to type a single thing.

How to Sync Your Fleet in 3 Minutes:
${guide}`;

  if (hasMapAccess) {
    text += liveMapUrl
      ? `

Your Live Map is ready! Once you connect Motive, you can track your trucks in real-time here: ${liveMapUrl}`
      : `

Your Live Map is ready! Once you connect Motive, you can track your trucks in real-time from your dashboard.`;
  } else {
    text += `

Want to see your trucks on a live map? Upgrade to Fleet Master at any time to unlock real-time GPS tracking.`;
  }

  if (isBetaTester) {
    text += `

P.S. As a Beta Founder, your 20% lifetime discount is already locked into your account!`;
  }

  text += `

What happens next?
Live Tracking: Your map will now show your trucks' real-time locations.
Automatic IFTA: We will start pulling your state-by-state mileage logs immediately.
AI Receipt Scanning: You can now start uploading fuel receipts to see your Live Profitability.

Need a hand?
If you run into any issues during the sync, just hit reply to this email or click the "Support" button in your dashboard. We're here to help you keep the wheels turning.

Welcome to the future of the road,

The VantagFleet Team
Built by a Carrier. Not a Tech Company.`;
  const footer = emailFooter(appUrl);
  text += footer.text;

  const mapSectionHtml = hasMapAccess
    ? liveMapUrl
      ? `<p>Your Live Map is ready! Once you connect Motive, you can track your trucks in real-time <a href="${liveMapUrl}" style="color:#FFB000;">here</a>.</p>`
      : '<p>Your Live Map is ready! Once you connect Motive, you can track your trucks in real-time from your dashboard.</p>'
    : '<p>Want to see your trucks on a live map? Upgrade to Fleet Master at any time to unlock real-time GPS tracking.</p>';

  const html = [
    `<p>Hi <strong>${firstName}</strong>,</p>`,
    `<p>Welcome to VantagFleet. You've officially taken the first step toward an automated, audit-proof back office.</p>`,
    `<p>To get your dashboard up and running, we need to link your Motive (formerly KeepTruckin) account. This allows us to automatically import your trucks, live GPS locations, and mileage data so you don't have to type a single thing.</p>`,
    `<h3>How to Sync Your Fleet in 3 Minutes:</h3>`,
    '<ol><li>Log In: Head over to your VantagFleet Dashboard.</li><li>Go to Connections: Click on the Settings gear icon in the sidebar and select &#39;Integrations&#39;.</li><li>Find Motive: Click the &#39;Connect Motive&#39; button.</li><li>Authorize: You will be redirected to the Motive login page. Enter your credentials and click &#39;Allow&#39; to grant VantagFleet secure access to your fleet data.</li><li>Watch the Magic: Once redirected back, you&#39;ll see your trucks and drivers automatically appear in your VantagFleet account.</li></ol>',
    mapSectionHtml,
    isBetaTester ? '<p><strong>P.S.</strong> As a Beta Founder, your 20% lifetime discount is already locked into your account!</p>' : '',
    '<h3>What happens next?</h3>',
    '<ul><li><strong>Live Tracking:</strong> Your map will now show your trucks&#39; real-time locations.</li><li><strong>Automatic IFTA:</strong> We will start pulling your state-by-state mileage logs immediately.</li><li><strong>AI Receipt Scanning:</strong> You can now start uploading fuel receipts to see your Live Profitability.</li></ul>',
    '<h3>Need a hand?</h3>',
    '<p>If you run into any issues during the sync, just hit reply to this email or click the &#34;Support&#34; button in your dashboard. We&#39;re here to help you keep the wheels turning.</p>',
    '<p>Welcome to the future of the road,</p>',
    '<p><strong>The VantagFleet Team</strong><br>Built by a Carrier. Not a Tech Company.</p>',
    footer.html,
  ]
    .filter(Boolean)
    .join('');

  return { text, html };
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let payload: { record?: { user_id?: string; full_name?: string | null; is_beta_tester?: boolean; is_founder?: boolean }; user_id?: string; full_name?: string | null; is_beta_tester?: boolean; is_founder?: boolean };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const record = payload.record ?? payload;
  const userId = record.user_id;
  if (!userId || typeof userId !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing user_id in payload' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const fullName = record.full_name ?? null;
  const isBetaTester = record.is_beta_tester === true;
  const isFounder = record.is_founder === true;

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let email: string;
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('Auth admin user fetch failed:', res.status, errText);
      return new Response(JSON.stringify({ error: 'Could not resolve user email' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userData = await res.json();
    email = userData?.email;
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'User has no email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    console.error('Auth request failed:', e);
    return new Response(JSON.stringify({ error: 'Auth service error' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const sendgridKey = Deno.env.get('SENDGRID_API_KEY');
  const fromEmail = Deno.env.get('SENDGRID_SUPPORT_FROM_EMAIL') ?? Deno.env.get('SENDGRID_FROM_EMAIL') ?? 'VantagFleet <support@vantagfleet.com>';
  if (!sendgridKey) {
    console.error('SENDGRID_API_KEY not set');
    return new Response(JSON.stringify({ error: 'Email not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const appUrl = Deno.env.get('APP_URL') ?? Deno.env.get('NEXT_PUBLIC_APP_URL') ?? '';
  const firstName = getFirstName(fullName);

  let subject: string;
  let text: string;
  let html: string;
  if (isFounder) {
    const founder = buildFounderWelcomeEmail(firstName, appUrl);
    subject = founder.subject;
    text = founder.text;
    html = founder.html;
  } else {
    const standard = buildStandardEmailBody(firstName, isBetaTester, appUrl);
    subject = 'Welcome to the Cab! 🚛 Here is how to sync your Motive Fleet.';
    text = standard.text;
    html = standard.html;
  }

  const fromName = fromEmail.includes('<') ? fromEmail.replace(/^([^<]+)\s*<.+>$/, '$1').trim() : 'VantagFleet';
  const fromAddr = fromEmail.includes('<') ? fromEmail.replace(/^.+<([^>]+)>$/, '$1').trim() : fromEmail;

  try {
    const sgRes = await fetch(SENDGRID_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: fromAddr, name: fromName },
        subject,
        content: [
          { type: 'text/plain', value: text },
          { type: 'text/html', value: html },
        ],
      }),
    });

    if (!sgRes.ok) {
      const errBody = await sgRes.text();
      console.error('SendGrid error:', sgRes.status, errBody);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (e) {
    console.error('SendGrid request failed:', e);
    return new Response(JSON.stringify({ error: 'Email send failed' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, to: email }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
