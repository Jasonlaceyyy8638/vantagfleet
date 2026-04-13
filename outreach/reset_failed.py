import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")
supabase = create_client(os.getenv("NEXT_PUBLIC_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

def reset_failed_leads():
    print("🔄 Checking for leads that were never contacted...")
    
    # We are looking for anything that is STILL 'new' 
    # (Since the script failed, they never changed to 'contacted')
    leads = supabase.table("carrier_leads").select("id, legal_name").eq("status", "new").execute()
    
    if not leads.data:
        print("No leads need resetting.")
        return

    print(f"✅ Found {len(leads.data)} leads ready for retry tomorrow.")
    print("When you run sender.py tomorrow, it will start with these.")

if __name__ == "__main__":
    reset_failed_leads()