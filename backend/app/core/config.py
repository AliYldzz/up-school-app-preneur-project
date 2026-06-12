import os
from dotenv import load_dotenv

# Load .env file if present in working directory
load_dotenv(override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
# Temizle: .env içindeki tırnak işaretlerini (varsa) kaldır
GEMINI_API_KEY = GEMINI_API_KEY.replace('"', '').replace("'", "").strip()
