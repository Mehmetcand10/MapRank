from app.services.google_maps import google_maps_service
import sys

place_id = "ChIJMcdhP2-4yhQR-4LfdtG5Ei4"
print(f"Testing place_id: {place_id}")

try:
    details = google_maps_service.get_place_details(place_id)
    if details:
        print("Success! Details found:")
        print(f"Name: {details.get('name')}")
        print(f"Address: {details.get('formatted_address')}")
    else:
        print("Failed: No details returned (None)")
except Exception as e:
    print(f"Error: {e}")
