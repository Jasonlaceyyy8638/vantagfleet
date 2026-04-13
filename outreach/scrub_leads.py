import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")
supabase = create_client(os.getenv("NEXT_PUBLIC_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

def scrub_leads():
    print("🔍 Starting Deep Name Scrub...")
    
    # Selecting only columns we know exist from your screenshot
    leads = supabase.table("carrier_leads").select("id, legal_name").eq("status", "new").execute()
    
    if not leads.data:
        print("No new leads to scrub.")
        return

    # Expanded list of keywords that identify service/private fleets instead of pure trucking
    red_flags = [
        "construction", "plumbing", "builders", "landscape", "tree", "roofing", 
        "hvac", "electric", "poultry", "farm", "nursery", "excavating", "paving",
        "home improvement", "medical delivery", "underground", "venturs", "repair",
        "services", "supply", "grading", "piping", "concrete", "asphalt", "shingle",
        "towing", "auto body", "salvage", "automotive", "lawn", "maintenance"
    ]

    skipped_count = 0
    kept_count = 0

    for lead in leads.data:
        name = lead['legal_name'].lower()
        
        # Check if any red flag word is in the company name
        if any(flag in name for flag in red_flags):
            supabase.table("carrier_leads").update({"status": "skipped"}).eq("id", lead['id']).execute()
            print(f"🚫 SKIPPED: {lead['legal_name']}")
            skipped_count += 1
        else:
            # We keep pure 'Trucking' or 'Transport' companies
            print(f"✅ KEEPING: {lead['legal_name']}")
            kept_count += 1

    print(f"\n✨ Scrub Complete.")
    print(f"Total Skipped: {skipped_count}")
    print(f"Total Kept: {kept_count}")

if __name__ == "__main__":
    scrub_leads()