import urllib.request
import json
import os

def load_env():
    env = {}
    try:
        # Check current directory and parent directory
        paths = ['.env', '../.env', 'backend/.env']
        env_path = None
        for p in paths:
            if os.path.exists(p):
                env_path = p
                break
        
        if not env_path:
            print("Could not find .env file")
            return {}

        print(f"Loading .env from {env_path}")
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    k, v = line.split('=', 1)
                    env[k.strip()] = v.strip()
    except Exception as e:
        print(f"Error reading .env: {e}")
    return env

env = load_env()
api_key = env.get("GOOGLE_MAPS_API_KEY")

print(f"Testing API Key: {api_key[:5]}...{api_key[-5:] if api_key else 'None'}")

if not api_key:
    print("Error: No API key found in .env")
    exit(1)

place_id = "ChIJc9DrH-lN0xQRfQeMPOcC4Ic" # Burger King
fields = "name,formatted_address,rating,user_ratings_total,reviews"
url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&fields={fields}&key={api_key}"

print(f"Requesting: {url}")

try:
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read().decode('utf-8'))
        
        status = data.get("status")
        print(f"API Status: {status}")
        
        if status == 'OK':
            print("Success! API is working.")
            print(json.dumps(data.get("result"), indent=2, ensure_ascii=False))
        else:
            print(f"Error Message: {data.get('error_message')}")

except Exception as e:
    print(f"HTTP Request Failed: {e}")
