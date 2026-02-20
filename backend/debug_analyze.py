import urllib.request
import urllib.error

def test_id(place_id, label):
    url = f'http://localhost:8000/api/v1/businesses/analyze?place_id={place_id}'
    print(f"Testing {label}: {url}")
    try:
        # POST request requires data, even empty
        req = urllib.request.Request(url, data=b"", method='POST')
        with urllib.request.urlopen(req) as response:
            print(f"{label} Success: {response.getcode()}")
    except urllib.error.HTTPError as e:
        print(f"{label} Failed: {e.code}")
        try:
             print(e.read().decode('utf-8'))
        except:
             pass
    except Exception as e:
        print(f"{label} Error: {e}")

# ID from debug_output.txt (Burger King)
valid_id = "ChIJc9DrH-lN0xQRfQeMPOcC4Ic"
test_id(valid_id, "Clean Valid ID")
test_id(valid_id + ":1", "Bad Suffix ID")
