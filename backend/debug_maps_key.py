import googlemaps
import os
from dotenv import load_dotenv

# Load .env explicitly
load_dotenv(dotenv_path=".env")

api_key = os.getenv("GOOGLE_MAPS_API_KEY")
print(f"Testing API Key: {api_key[:5]}...{api_key[-5:] if api_key else 'None'}")

if not api_key:
    print("Error: No API key found in .env")
    exit(1)

try:
    gmaps = googlemaps.Client(key=api_key)
    # Burger King place_id from search results
    place_id = "ChIJc9DrH-lN0xQRfQeMPOcC4Ic"
    
    print(f"Attempting to fetch details for {place_id}...")
    
    # Try the same fields as the service
    fields = ['name', 'formatted_address', 'rating', 'user_ratings_total', 'reviews']
    
    result = gmaps.place(place_id=place_id, fields=fields)
    
    if result.get('status') == 'OK':
        print("Success! API is working.")
        print(result.get('result'))
    else:
        print(f"API Returned Error Status: {result.get('status')}")
        print(result)

except Exception as e:
    print(f"EXCEPTION: {e}")
