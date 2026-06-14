import sys
import os

# Add backend directory to sys.path so 'app' package can be imported correctly
backend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.append(backend_path)

from app.main import app
