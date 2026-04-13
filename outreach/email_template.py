"""Single source of truth for carrier outreach HTML + signup URL (sender + test_me)."""

from html import escape
from urllib.parse import urlencode

SIGNUP_PATH = "https://vantagfleet.com/signup"


def outreach_signup_url() -> str:
    """Primary CTA: signup with UTMs for analytics."""
    q = urlencode(
        {
            "utm_source": "outreach",
            "utm_medium": "email",
            "utm_campaign": "carrier_cold",
        }
    )
    return f"{SIGNUP_PATH}?{q}"


def get_outreach_subject(company: str) -> str:
    safe = company.strip() or "your fleet"
    return f"90 days free — compliance tools for {safe}"


def build_outreach_html(company: str) -> str:
    """Shorter email: one hook, three bullets, one CTA + optional reply line."""
    name = escape((company or "").strip() or "there")
    cta_url = outreach_signup_url()

    return f"""
        <div style="background-color: #050505; padding: 40px 10px; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #0f0f0f; border: 1px solid #222222; border-radius: 12px; padding: 30px;">

                <div style="text-align: center; margin-bottom: 30px;">
                    <img src="cid:logo_cid" alt="VantagFleet" style="width: 140px; height: auto; display: block; margin: 0 auto;">
                    <p style="color: #666666 !important; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; margin-top: 15px; font-weight: bold;">Fleet compliance</p>
                </div>

                <p style="color: #ffffff !important; font-size: 17px; font-weight: bold;">Hi {name},</p>

                <p style="color: #e0e0e0 !important; font-size: 15px; line-height: 1.6;">
                    I&rsquo;m a <strong>9-year driver</strong> and still run. I built VantagFleet because most fleet software doesn&rsquo;t match how carriers actually run DOT compliance day to day.
                </p>

                <div style="background-color: #161616; padding: 22px; border-radius: 10px; margin: 22px 0; border: 1px solid #333333;">
                    <p style="color: #ffb400 !important; font-weight: bold; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Built for audit readiness</p>
                    <ul style="padding-left: 18px; color: #cccccc !important; font-size: 14px; line-height: 1.55; margin: 12px 0 0 0;">
                        <li style="margin-bottom: 10px;"><strong style="color: #ffffff !important;">Expiry &amp; DQ:</strong> CDL, med card, COI, registrations &mdash; alerts so nothing slips.</li>
                        <li style="margin-bottom: 10px;"><strong style="color: #ffffff !important;">ELD-aware ops:</strong> Motive, Geotab, Samsara sync for live map and fleet context.</li>
                        <li style="margin-bottom: 0;"><strong style="color: #ffffff !important;">Roadside &amp; IFTA-ready:</strong> Time-limited inspector links; fuel/IFTA workflows in one place.</li>
                    </ul>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                    <a href="{cta_url}"
                       style="background-color: #ffb400 !important; color: #000000 !important; padding: 16px 36px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block; font-size: 16px;">
                        <span style="color: #000000 !important;">Start 90 days free &rarr;</span>
                    </a>
                </div>

                <p style="color: #999999 !important; font-size: 13px; line-height: 1.5; margin: 0 0 8px 0;">
                    Prefer human? <strong style="color: #e0e0e0 !important;">Reply with your USDOT</strong> and I&rsquo;ll point you to the fastest setup.
                </p>

                <hr style="border: 0; border-top: 1px solid #222222; margin: 28px 0;">
                <p style="margin: 0; font-weight: bold; color: #ffffff !important; font-size: 16px;">Jason Lacey</p>
                <p style="margin: 0; font-size: 13px; color: #666666 !important;">Founder, VantagFleet | 9-Year Driver</p>
            </div>
        </div>
        """
