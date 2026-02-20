from app.services.google_maps import google_maps_service
from app.services.ranking_engine import ranking_engine
import json
import sys
import traceback

place_id = "ChIJ6alPom9T0xQRMGEPlkiUZF8" # Angora Mobilya
print(f"Testing Analysis for place_id: {place_id}")

try:
    # 1. Fetch details
    print("Fetching details from Google Maps...")
    details = google_maps_service.get_place_details(place_id)
    
    if not details:
        print("ERROR: No details returned from Google Maps Service.")
        sys.exit(1)
        
    print("Details fetched successfully.")
    # print(json.dumps(details, indent=2)) # Uncomment to see full data if needed

    # 2. Run Analysis (This is likely where it crashes)
    print("Running RankingEngine.analyze_business...")
    analysis = ranking_engine.analyze_business(details)
    
    print("Analysis Success!")
    print(json.dumps(analysis, indent=2, default=str))

except Exception as e:
    print("\nCRITICAL FAILURE IN ANALYSIS:")
    print(f"Error Type: {type(e).__name__}")
    print(f"Error Message: {str(e)}")
    print("\nStack Trace:")
    traceback.print_exc()
