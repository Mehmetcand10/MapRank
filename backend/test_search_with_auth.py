
import requests
import string
import random

# Function to generate a random string
def get_random_string(length):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

BASE_URL = "http://localhost:8000/api/v1"

# 1. Register a user
email = f"test_{get_random_string(5)}@example.com"
password = "password123"
register_payload = {
    "email": email,
    "password": password,
    "full_name": "Test User",
    "business_name": "Test Business"
}

print(f"Registering user: {email}")
try:
    reg_response = requests.post(f"{BASE_URL}/auth/register", json=register_payload)
    if reg_response.status_code == 200:
        print("Registration successful")
    else:
        print(f"Registration failed (might already exist): {reg_response.text}")
except requests.exceptions.ConnectionError:
    print("Error: Could not connect to backend. Is it running on port 8000?")
    exit(1)

# 2. Login to get token
login_payload = {
    "username": email,
    "password": password
}

print("Logging in...")
login_response = requests.post(f"{BASE_URL}/auth/login/access-token", data=login_payload)

if login_response.status_code != 200:
    print(f"Login failed: {login_response.text}")
    exit(1)

token_data = login_response.json()
access_token = token_data["access_token"]
print("Login successful. Token acquired.")

# 3. Search for a business
query = "Starbucks"
print(f"Searching for '{query}'...")

headers = {
    "Authorization": f"Bearer {access_token}"
}

search_response = requests.get(f"{BASE_URL}/businesses/search?query={query}", headers=headers)

if search_response.status_code == 200:
    results = search_response.json()
    print(f"Found {len(results)} results.")
    for res in results:
        print(f"- {res.get('name')} ({res.get('address')}) - Score: {res.get('maprank_score')}")

    # 4. Try to save the first business
    if results:
        first_biz = results[0]
        place_id = first_biz.get("google_place_id")
        name = first_biz.get("name")
        
        print(f"\nAttempting to save: {name} ({place_id})")
        save_payload = {
            "google_place_id": place_id,
            "name": name
        }
        
        save_response = requests.post(f"{BASE_URL}/businesses/", json=save_payload, headers=headers)
        if save_response.status_code == 200:
            print("Business saved successfully!")
            print(save_response.json())
            
            # 5. Try to save again to verify 400 error
            print("\nAttempting to save again (should fail)...")
            save_response_2 = requests.post(f"{BASE_URL}/businesses/", json=save_payload, headers=headers)
            print(f"Second save response: {save_response_2.status_code} - {save_response_2.text}")
            
            # 6. Call Analyze endpoint to check is_tracked field
            print(f"\nCalling Analyze endpoint for {place_id}...")
            analyze_response = requests.post(f"{BASE_URL}/businesses/analyze?place_id={place_id}", headers=headers)
            if analyze_response.status_code == 200:
                analysis = analyze_response.json()
                is_tracked = analysis.get("is_tracked")
                print(f"Analyze Response is_tracked: {is_tracked}")
                if is_tracked:
                    print("SUCCESS: Business is correctly marked as tracked.")
                else:
                    print("FAILURE: Business should be tracked but is_tracked is False.")
            else:
                print(f"Analyze failed: {analyze_response.status_code} - {analyze_response.text}")
            
        else:
            print(f"Failed to save business: {save_response.status_code} - {save_response.text}")

else:
    print(f"Search failed: {search_response.status_code} - {search_response.text}")

