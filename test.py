import urllib.request
import urllib.error
import json
import os
from dotenv import load_dotenv

load_dotenv("c:/Users/06aly/OneDrive/Desktop/up-school-app-preneur-project/backend/.env")
key = os.getenv("GEMINI_API_KEY", "")
key = key.replace('"', '').replace("'", "").strip()
print("Key length:", len(key))

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
headers = {"Content-Type": "application/json"}
data = {
    "contents": [{"parts": [{"text": "Merhaba, test."}]}]
}

try:
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        res_data = json.loads(response.read().decode("utf-8"))
        print("Success!", res_data["candidates"][0]["content"]["parts"][0]["text"])
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
except Exception as e:
    print("General Error:", e)
