import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")
supabase = create_client(os.getenv("NEXT_PUBLIC_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

def check_stats():
    # Count new leads
    new = supabase.table("carrier_leads").select("id", count="exact").eq("status", "new").execute()
    # Count contacted leads
    sent = supabase.table("carrier_leads").select("id", count="exact").eq("status", "contacted").execute()
    # Count skipped (if any)
    skipped = supabase.table("carrier_leads").select("id", count="exact").eq("status", "skipped").execute()

    print(f"\n--- VantagFleet Lead Stats ---")
    print(f"🆕 Ready to Email: {new.count}")
    print(f"📧 Already Sent:  {sent.count}")
    print(f"🚫 Automatically Skipped: {skipped.count}")
    print(f"------------------------------\n")

if __name__ == "__main__":
    check_stats()