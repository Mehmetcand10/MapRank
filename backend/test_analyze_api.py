import requests

API_URL = "http://localhost:8000/api/v1"
# Use a known place ID (e.g. from previous logs or a common one like Google Plex or just "textquery" search result)
# Let's first search to get a valid ID
video_game_store_query = "Kadıköy Video Game Store"

def test_analyze():
    # 1. Register a new user to ensure we have a valid token
    import time
    username = f"testUser_{int(time.time())}@example.com"
    password = "password123"
    print(f"Registering new user {username}...")
    session = requests.Session()
    
    try:
        reg_res = session.post(f"{API_URL}/auth/register", json={"email": username, "password": password})
        if reg_res.status_code == 200:
            print("Registration successful.")
        elif reg_res.status_code == 400 and "already exists" in reg_res.text:
             print("User already exists, proceeding to login.")
        else:
             print(f"Registration failed: {reg_res.status_code} {reg_res.text}")
             return

        # Login to get token
        login_res = session.post(f"{API_URL}/auth/login/access-token", data={"username": username, "password": password})
        if login_res.status_code == 200:
            token = login_res.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print("Login successful.")
        else:
            print(f"Login failed: {login_res.status_code} {login_res.text}")
            return

    except Exception as e:
        print(f"Auth failed: {e}")
        return

    # 2. Search to get a place_id
    print(f"Searching for '{video_game_store_query}'...")
    search_res = session.get(f"{API_URL}/businesses/search", params={"query": video_game_store_query, "location": "Istanbul"}, headers=headers)
    
    if search_res.status_code != 200:
        print(f"Search failed: {search_res.status_code} {search_res.text}")
        return

    results = search_res.json()
    if not results:
        print("No results found.")
        return

    place_id = results[0]["google_place_id"]
    name = results[0]["name"]
    print(f"Found place: {name} ({place_id})")

    # 3. Analyze the place
    print(f"Analyzing place_id: {place_id}...")
    analyze_res = session.post(f"{API_URL}/businesses/analyze", params={"place_id": place_id}, headers=headers)
    
    if analyze_res.status_code == 200:
        data = analyze_res.json()
        print("Analysis successful!")
        print(f"Score: {data.get('score')}")
        print(f"Metrics: {data.get('metrics')}")
    else:
        print(f"Analysis failed: {analyze_res.status_code} {analyze_res.text}")

if __name__ == "__main__":
    test_analyze()
