import os, base64
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, From, Attachment, FileContent, FileName, FileType, Disposition, ContentId
from dotenv import load_dotenv

from email_template import build_outreach_html, get_outreach_subject

load_dotenv(dotenv_path=".env.local")
sg = SendGridAPIClient(os.getenv("SENDGRID_API_KEY"))

# THE LOGIC WE ARE TESTING
RED_FLAGS = [
    "construction", "plumbing", "builders", "landscape", "tree", "roofing",
    "hvac", "electric", "poultry", "farm", "nursery", "excavating", "paving",
    "home improvement", "underground", "venturs", "repair", "services",
    "supply", "grading", "piping", "concrete", "asphalt", "shingle",
    "towing", "auto body", "salvage", "automotive", "lawn", "maintenance",
    "drilling", "mechanical", "glass", "flooring", "masonry", "exterior", "harley"
]


def run_logic_test(test_company_name, test_email):
    print(f"\n--- Testing Logic for: {test_company_name} ---")

    name_lower = test_company_name.lower()

    # 1. TEST THE SCRUBBER
    if any(flag in name_lower for flag in RED_FLAGS):
        print(f"🚫 LOGIC RESULT: Blocked. '{test_company_name}' contains a red flag keyword.")
        return

    print(f"✅ LOGIC RESULT: Passed. Sending outreach preview to {test_email}...")
    print(f"   Subject: {get_outreach_subject(test_company_name)}")

    # 2. EMAIL — same HTML as sender.py (via email_template)
    script_dir = os.path.dirname(__file__)
    logo_path = os.path.join(script_dir, "vantag-fleet-logo.png")

    with open(logo_path, "rb") as f:
        data = f.read()
        encoded_logo = base64.b64encode(data).decode()

    html_body = build_outreach_html(test_company_name)

    message = Mail(
        from_email=From("info@getvantagfleet.com", "Jason Lacey"),
        to_emails=test_email,
        subject=get_outreach_subject(test_company_name),
        html_content=html_body,
    )
    attachment = Attachment(
        FileContent(encoded_logo),
        FileName("logo.png"),
        FileType("image/png"),
        Disposition("inline"),
        ContentId("logo_cid"),
    )
    message.add_attachment(attachment)

    try:
        sg.send(message)
        print("✅ SUCCESS: Email Sent (same template as sender.py).")
    except Exception as e:
        print(f"❌ FAILED: {e}")


if __name__ == "__main__":
    my_real_email = "jasonlaceyyy8638@gmail.com"  # Change if needed

    # 1. Test the "Good" Lead
    run_logic_test("Lacey Transport LLC", my_real_email)

    # 2. Test the "Bad" Lead
    run_logic_test("Lacey Construction Services", my_real_email)
