import requests
import os
import time
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")
supabase = create_client(os.getenv("NEXT_PUBLIC_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

def run_smart_scanner():
    print("🚀 Starting Global US Auth-For-Hire Deep Scan...")
    
    url = "https://data.transportation.gov/resource/kjg3-diqy.json"
    limit = 1000
    offset = 0  # This is the 'starting point'
    
    while True:
        print(f"📥 Fetching records {offset} to {offset + limit}...")
        
        # carrier_operation = 'A' is the DOT code for 'Authorized For-Hire' (Trucking Companies)
        # phy_country = 'US' ensures we stay in the States
        params = {
            "$where": "phy_country = 'US' AND carrier_operation = 'A'",
            "$limit": limit,
            "$offset": offset,
            "$order": "dot_number DESC" # Gets the most recent registrations first
        }

        try:
            response = requests.get(url, params=params)
            data = response.json()
            
            if not data:
                print("🏁 No more records found. Scan complete!")
                break

            new_leads = 0
            for record in data:
                email = record.get("email_address")
                # We only want leads we can actually email
                if not email or "@" not in email:
                    continue
                
                lead = {
                    "legal_name": record.get("legal_name"),
                    "email": email.strip().lower(),
                    "dot_number": record.get("dot_number"),
                    "status": "new" 
                }

                try:
                    # 'on_conflict' ensures we don't have the same DOT number twice
                    supabase.table("carrier_leads").upsert(lead, on_conflict="dot_number").execute()
                    new_leads += 1
                except Exception:
                    continue

            print(f"✅ Added {new_leads} new trucking companies. Moving to next batch...")
            
            # Increase the offset to get the next page
            offset += limit
            
            # Small pause to be polite to the FMCSA server
            time.sleep(1)

        except Exception as e:
            print(f"❌ Scan interrupted: {e}")
            break

if __name__ == "__main__":
    run_smart_scanner()





