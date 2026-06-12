import urllib.request
import urllib.error
import time

for attempt in range(4):
    try:
        # Cause a 400 Bad Request
        urllib.request.urlopen("https://httpbin.org/status/400")
    except urllib.error.HTTPError as e:
        if e.code in [429, 503]:
            print("429/503 caught")
            continue
        print(f"HTTPError {e.code} caught, raising")
        raise e
    except Exception as e:
        print("General exception caught:", e)
        time.sleep(1)
        continue
