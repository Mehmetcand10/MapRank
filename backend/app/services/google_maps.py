import googlemaps
from app.core.config import settings
from typing import Dict, Any, List

class GoogleMapsService:
    def __init__(self):
        self.client = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)

    def search_business(self, query: str, location: str = "Turkey") -> List[Dict[str, Any]]:
        """
        Searches for businesses using Text Search API.
        """
        # Combine query with location for better results
        full_query = f"{query} near {location}"
        
        try:
            places_result = self.client.places(query=full_query)
            
            results = []
            if places_result.get('status') == 'OK':
                for place in places_result.get('results', []):
                    results.append({
                        "google_place_id": place.get("place_id"),
                        "name": place.get("name"),
                        "address": place.get("formatted_address"),
                        "rating": place.get("rating", 0),
                        "user_ratings_total": place.get("user_ratings_total", 0),
                        "geometry": place.get("geometry", {}).get("location")
                    })
            return results
        except Exception as e:
            print(f"Google API Error: {e}")
            return []

    def get_place_details(self, place_id: str) -> Dict[str, Any]:
        """
        Fetches detailed information about a specific place.
        """
        try:
            # Fields to retrieve to save costs/latency
            fields = ['name', 'formatted_address', 'formatted_phone_number', 
                      'rating', 'user_ratings_total', 'reviews', 'website', 
                      'geometry', 'photos', 'business_status', 'type', 'opening_hours']
            
            details = self.client.place(place_id=place_id, fields=fields)
            
            return details.get('result', {})
        except Exception as e:
            print(f"Google API Error (get_place_details): {e}")
            return None

    def search_nearby(self, location: Dict[str, float], keyword: str = None, type: str = None, radius: int = 1500) -> List[Dict[str, Any]]:
        """
        Searches for nearby competitors using Places Nearby API.
        """
        try:
            # location should be {'lat': float, 'lng': float}
            # Prepare arguments, filtering out None values
            params = {
                "location": location,
                "radius": radius
            }
            if keyword:
                params["keyword"] = keyword
            if type:
                params["type"] = type
                
            places_result = self.client.places_nearby(**params)
            
            results = []
            if places_result.get('status') == 'OK':
                for place in places_result.get('results', []):
                    # Filter out purely geographic results to ensure we get businesses
                    types = place.get("types", [])
                    if "locality" in types or "political" in types or "route" in types:
                        continue
                        
                    results.append({
                        "google_place_id": place.get("place_id"),
                        "name": place.get("name"),
                        "rating": place.get("rating", 0),
                        "user_ratings_total": place.get("user_ratings_total", 0),
                        "address": place.get("vicinity"),
                        "types": types
                    })
            return results
        except Exception as e:
            print(f"Google API Error (Nearby): {e}")
            return []

google_maps_service = GoogleMapsService()
