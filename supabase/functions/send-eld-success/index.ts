// Supabase Edge Function: send "Your Fleet is Synced" email when user connects an ELD (Motive, Geotab, Samsara).
// Invoked with POST body: { user_id, org_id, eld_provider } (eld_provider: 'motive' | 'geotab' | 'samsara').
// Fetches user email, first name, truck count, org tier; sends via SendGrid with dynamic template content.

const SENDGRID_URL = 'https://api.sendgrid.com/v3/mail/send';

function getFirstName(fullName: string | null | undefined): string {
  if (!fullName || typeof fullName !== 'string') return 'there';
  const first = fullName.trim().split(/\s+/)[0];
  return first || 'there';
}

function eldDisplayName(provider: string): string {
  const p = (provider || '').toLowerCase();
  if (p === 'motive') return 'Motive';
  if (p === 'geotab') return 'Geotab';
  if (p === 'samsara') return 'Samsara';
  return provider || 'ELD';
}

function emailFooter(baseUrl: string): { text: string; html: string } {
  const base = (baseUrl || '').replace(/\/$/, '');
  const privacyUrl = base ? `${base}/privacy` : '#';
  const termsUrl = base ? `${base}/terms` : '#';
  return {
    text: base ? `\n\n---\nPrivacy Policy: ${privacyUrl}\nTerms of Service: ${termsUrl}\n© VantagFleet` : '',
    html: base ? `<p style="margin-top:24px;font-size:12px;color:#94a3b8;">Privacy Policy: <a href="${privacyUrl}" style="color:#f59e0b;">${privacyUrl}</a> &nbsp;|&nbsp; Terms of Service: <a href="${termsUrl}" style="color:#f59e0b;">${termsUrl}</a></p><p style="font-size:11px;color:#64748b;">© VantagFleet</p>` : '',
  };
}

function buildEldSuccessEmail(params: {
  firstName: string;
  eldProviderName: string;
  truckCount: number;
  includeDispatcherBullet: boolean;
  mapLink: string;
  iftaLink: string;
  baseUrl?: string;
}): { text: string; html: string } {
  const { firstName, eldProviderName, truckCount, includeDispatcherBullet, mapLink, iftaLink, baseUrl = '' } = params;

  let text = `Hi ${firstName},

Great news! Your ${eldProviderName} account has been successfully linked to VantagFleet.

Our system is currently pulling in your trucks, drivers, and GPS history. You don't have to lift a finger—your back office is now running on autopilot.

What's happening right now:
Live Map: Your ${eldProviderName} GPS units are now broadcasting to your VantagFleet dashboard.

IFTA Automation: We are processing your state-by-state mileage. Your quarterly reports are being generated in the background.

Vehicle Sync: All ${truckCount} truck${truckCount !== 1 ? 's' : ''} have been imported with their VINs and current odometer readings.

What to do next:
Check the Live Map: See exactly where your fleet is right now: ${mapLink}

Review IFTA: Take a look at your preliminary mileage logs: ${iftaLink}
`;

  if (includeDispatcherBullet) {
    text += `
Add Dispatchers: (Fleet Master & Enterprise) Invite your team to view the map and manage loads.
`;
  }

  const footer = emailFooter(baseUrl);
  text += `
Welcome to the future of fleet management.

Best,
The VantagFleet Team
Built by a Carrier. Not a Tech Company.`;
  text += footer.text;

  const dispatcherHtml = includeDispatcherBullet
    ? '<li><strong>Add Dispatchers:</strong> (Fleet Master & Enterprise) Invite your team to view the map and manage loads.</li>'
    : '';

  const html = [
    `<p>Hi <strong>${firstName}</strong>,</p>`,
    `<p>Great news! Your <strong>${eldProviderName}</strong> account has been successfully linked to VantagFleet.</p>`,
    `<p>Our system is currently pulling in your trucks, drivers, and GPS history. You don't have to lift a finger—your back office is now running on autopilot.</p>`,
    `<h3>What's happening right now:</h3>`,
    `<ul>`,
    `<li><strong>Live Map:</strong> Your ${eldProviderName} GPS units are now broadcasting to your VantagFleet dashboard.</li>`,
    `<li><strong>IFTA Automation:</strong> We are processing your state-by-state mileage. Your quarterly reports are being generated in the background.</li>`,
    `<li><strong>Vehicle Sync:</strong> All ${truckCount} truck${truckCount !== 1 ? 's' : ''} have been imported with their VINs and current odometer readings.</li>`,
    `</ul>`,
    `<h3>What to do next:</h3>`,
    `<ul>`,
    `<li><strong>Check the Live Map:</strong> See exactly where your fleet is right now: <a href="${mapLink}" style="color:#FFB000;">${mapLink}</a></li>`,
    `<li><strong>Review IFTA:</strong> Take a look at your preliminary mileage logs: <a href="${iftaLink}" style="color:#FFB000;">${iftaLink}</a></li>`,
    dispatcherHtml,
    `</ul>`,
    `<p>Welcome to the future of fleet management.</p>`,
    `<p>Best,<br><strong>The VantagFleet Team</strong><br>Built by a Carrier. Not a Tech Company.</p>`,
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

  let payload: { user_id?: string; org_id?: string; eld_provider?: string };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userId = payload.user_id;
  const orgId = payload.org_id;
  const eldProvider = (payload.eld_provider || '').toString().trim().toLowerCase();

  if (!userId || !orgId) {
    return new Response(JSON.stringify({ error: 'Missing user_id or org_id' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const validProviders = ['motive', 'geotab', 'samsara'];
  if (!validProviders.includes(eldProvider)) {
    return new Response(JSON.stringify({ error: 'Invalid eld_provider' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const headers = {
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    apikey: serviceRoleKey,
  };

  let email: string;
  try {
    const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, { headers });
    if (!userRes.ok) {
      const errText = await userRes.text();
      console.error('Auth user fetch failed:', userRes.status, errText);
      return new Response(JSON.stringify({ error: 'Could not resolve user email' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userData = await userRes.json();
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

  let fullName: string | null = null;
  try {
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?user_id=eq.${encodeURIComponent(userId)}&org_id=eq.${encodeURIComponent(orgId)}&select=full_name`,
      { headers: { ...headers, Prefer: 'return=representation' } }
    );
    if (profileRes.ok) {
      const profileList = await profileRes.json();
      if (Array.isArray(profileList) && profileList.length > 0 && profileList[0].full_name) {
        fullName = profileList[0].full_name;
      }
    }
  } catch {
    // non-fatal
  }

  let truckCount = 0;
  try {
    const vehiclesRes = await fetch(
      `${supabaseUrl}/rest/v1/vehicles?org_id=eq.${encodeURIComponent(orgId)}&provider=eq.${encodeURIComponent(eldProvider)}&select=id`,
      { headers: { ...headers, Range: '0-0', Prefer: 'count=exact' } }
    );
    const range = vehiclesRes.headers.get('Content-Range');
    if (range) {
      const m = range.match(/\/(\d+)$/);
      if (m) truckCount = Math.max(0, parseInt(m[1], 10));
    }
  } catch {
    // non-fatal
  }

  let tier = '';
  try {
    const orgRes = await fetch(
      `${supabaseUrl}/rest/v1/organizations?id=eq.${encodeURIComponent(orgId)}&select=tier`,
      { headers: { ...headers, Prefer: 'return=representation' } }
    );
    if (orgRes.ok) {
      const orgList = await orgRes.json();
      if (Array.isArray(orgList) && orgList.length > 0 && orgList[0].tier) {
        tier = String(orgList[0].tier).trim().toLowerCase();
      }
    }
  } catch {
    // non-fatal
  }

  const includeDispatcherBullet =
    tier === 'enterprise' || tier === 'fleet_master' || tier === 'fleet master';

  const appUrl = Deno.env.get('APP_URL') ?? Deno.env.get('NEXT_PUBLIC_APP_URL') ?? '';
  const base = (appUrl || '').replace(/\/$/, '');
  const mapLink = base ? `${base}/dashboard/map` : '#';
  const iftaLink = base ? `${base}/dashboard/ifta` : '#';

  const firstName = getFirstName(fullName);
  const eldProviderName = eldDisplayName(eldProvider);
  const { text, html } = buildEldSuccessEmail({
    firstName,
    eldProviderName,
    truckCount,
    includeDispatcherBullet,
    mapLink,
    iftaLink,
    baseUrl: base,
  });

  const sendgridKey = Deno.env.get('SENDGRID_API_KEY');
  const fromEmail = Deno.env.get('SENDGRID_SUPPORT_FROM_EMAIL') ?? Deno.env.get('SENDGRID_FROM_EMAIL') ?? 'VantagFleet <support@vantagfleet.com>';
  if (!sendgridKey) {
    console.error('SENDGRID_API_KEY not set');
    return new Response(JSON.stringify({ error: 'Email not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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
        subject: '🚛 Your Fleet is Synced! Automation is now Active.',
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
