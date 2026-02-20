import requests
import json
import sys

# Configuration
API_URL = "http://localhost:8000/api/v1"
EMAIL = "test_user_reviews@example.com"
PASSWORD = "password123"
NAME = "Test Reviewer"

def verify_reviews_flow():
    session = requests.Session()
    
    # 1. Register/Login
    print(f"Logging in as {EMAIL}...")
    login_data = {"username": EMAIL, "password": PASSWORD}
    response = session.post(f"{API_URL}/auth/login", data=login_data)
    
    if response.status_code != 200:
        print("User not found, registering...")
        register_data = {"email": EMAIL, "password": PASSWORD, "full_name": NAME}
        reg_response = session.post(f"{API_URL}/auth/register", json=register_data)
        if reg_response.status_code not in [200, 201]:
            print(f"Registration failed: {reg_response.text}")
            sys.exit(1)
        # Login again
        response = session.post(f"{API_URL}/auth/login", data=login_data)
        
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        sys.exit(1)
        
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful.")

    # 2. Get Businesses
    print("\nFetching businesses...")
    response = session.get(f"{API_URL}/businesses/", headers=headers)
    if response.status_code != 200:
        print(f"Failed to fetch businesses: {response.text}")
        sys.exit(1)
        
    businesses = response.json()
    if not businesses:
        print("No businesses found. Searching and saving a business first...")
        # Search and save a business
        search_res = session.get(f"{API_URL}/businesses/search?query=kebap", headers=headers)
        if search_res.status_code != 200 or not search_res.json():
            print("Search failed or no results.")
            sys.exit(1)
            
        business_to_save = search_res.json()[0]
        place_id = business_to_save["google_place_id"]
        print(f"Saving business: {business_to_save['name']} ({place_id})")
        
        save_res = session.post(f"{API_URL}/businesses/", json={"google_place_id": place_id}, headers=headers)
        if save_res.status_code != 200:
            print(f"Failed to save business: {save_res.text}")
            sys.exit(1)
        target_place_id = place_id
    else:
        target_place_id = businesses[0]["google_place_id"]
        print(f"Using existing business: {businesses[0]['name']} ({target_place_id})")

    # 3. Get Reviews
    print(f"\nFetching reviews for place_id: {target_place_id}...")
    reviews_res = session.get(f"{API_URL}/reviews/?place_id={target_place_id}", headers=headers)
    
    if reviews_res.status_code != 200:
        print(f"Failed to fetch reviews: {reviews_res.text}")
        sys.exit(1)
        
    reviews = reviews_res.json()
    print(f"Found {len(reviews)} reviews.")
    
    if not reviews:
        print("No reviews found for this business. Skipping draft generation verification.")
        # Try to find a place with reviews if possible, but for now just exit gracefully
        return

    # 4. Generate Reply Draft
    target_review = reviews[0]
    print(f"\nGenerating reply draft for review by {target_review['author_name']}...")
    print(f"Review Text: {target_review.get('text', '')[:50]}...")
    
    draft_payload = {
        "review_text": target_review.get("text", "") or "Harika mekan",
        "rating": target_review.get("rating", 5),
        "author_name": target_review.get("author_name", "Misafir"),
        "tone": "friendly"
    }
    
    draft_res = session.post(f"{API_URL}/reviews/draft", json=draft_payload, headers=headers)
    
    if draft_res.status_code != 200:
        print(f"Failed to generate draft: {draft_res.text}")
        sys.exit(1)
        
    draft_data = draft_res.json()
    print("\n--- Generated Draft ---")
    print(draft_data["draft"])
    print("-----------------------")
    
    print("\n✅ Review System Verification Passed!")

if __name__ == "__main__":
    verify_reviews_flow()
