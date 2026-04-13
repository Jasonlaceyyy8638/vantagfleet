import os, time, random, base64
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, From, Attachment, FileContent, FileName, FileType, Disposition, ContentId
from supabase import create_client
from dotenv import load_dotenv

from email_template import build_outreach_html, get_outreach_subject

# Load keys
load_dotenv(dotenv_path=".env.local")

supabase = create_client(os.getenv("NEXT_PUBLIC_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
sg = SendGridAPIClient(os.getenv("SENDGRID_API_KEY"))

# --- THE SCRUBBER LIST ---
# If a company has these words in their name, they are SKIPPED automatically.
RED_FLAGS = [
    "construction", "plumbing", "builders", "landscape", "tree", "roofing", 
    "hvac", "electric", "poultry", "farm", "nursery", "excavating", "paving",
    "home improvement", "underground", "venturs", "repair", "services", 
    "supply", "grading", "piping", "concrete", "asphalt", "shingle",
    "towing", "auto body", "salvage", "automotive", "lawn", "maintenance",
    "drilling", "mechanical", "glass", "flooring", "masonry", "exterior", "harley"
]

def run_outreach():
    # Fetch 100 new leads
    leads = supabase.table("carrier_leads").select("*").eq("status", "new").limit(100).execute()

    if not leads.data:
        print(f"[{time.strftime('%H:%M:%S')}] Inventory empty. System idling.")
        return

    # Path logic for the logo
    script_dir = os.path.dirname(__file__) 
    logo_path = os.path.join(script_dir, "vantag-fleet-logo.png")

    try:
        with open(logo_path, "rb") as f:
            data = f.read()
            encoded_logo = base64.b64encode(data).decode()
    except FileNotFoundError:
        print(f"❌ Error: Logo not found at {logo_path}.")
        return

    print(f"[{time.strftime('%H:%M:%S')}] Launching Batch: Checking {len(leads.data)} leads...")

    for lead in leads.data:
        company = lead['legal_name']
        email = lead['email']
        name_lower = company.lower()

        # --- AUTO-SCRUB LOGIC ---
        # This checks the name BEFORE sending.
        if any(flag in name_lower for flag in RED_FLAGS):
            # Mark as skipped in Supabase so we don't try again tomorrow
            supabase.table("carrier_leads").update({"status": "skipped"}).eq("id", lead['id']).execute()
            print(f"🚫 AUTO-SKIPPED: {company} (Non-Trucking)")
            continue # Move to the next lead immediately
        # ------------------------

        subject = get_outreach_subject(company)
        html_body = build_outreach_html(company)

        message = Mail(
            from_email=From("info@getvantagfleet.com", "Jason Lacey"),
            to_emails=email,
            subject=subject,
            html_content=html_body
        )

        attachment = Attachment(
            FileContent(encoded_logo),
            FileName("logo.png"),
            FileType("image/png"),
            Disposition("inline"), 
            ContentId("logo_cid")
        )
        message.add_attachment(attachment)
        
        try:
            sg.send(message)
            supabase.table("carrier_leads").update({"status": "contacted"}).eq("id", lead['id']).execute()
            print(f"[{time.strftime('%H:%M:%S')}] SENT: {company}")
            
            # 1-2 minute delay
            time.sleep(random.randint(60, 120))
            
        except Exception as e:
            print(f"FAILED: {company} - {e}")

if __name__ == "__main__":
    while True:
        run_outreach()
        print(f"[{time.strftime('%H:%M:%S')}] Daily batch complete. Sleeping...")
        time.sleep(86400)
