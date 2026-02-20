import sys
import os

# Add /app to python path just in case, though it should be there
sys.path.append("/app")

from app.core.database import SessionLocal
from app.services.user_service import UserService
from app.schemas.user import UserCreate
import traceback

try:
    print("Starting user creation test...")
    db = SessionLocal()
    # Check if user exists first to avoid unique constraint error
    existing_user = UserService().get_by_email(db, "debug_user@example.com")
    if existing_user:
        print("User already exists, skipping creation.")
    else:
        print("Creating user...")
        user_in = UserCreate(email="debug_user@example.com", password="password123")
        UserService().create(db, user_in)
        print("User Created Successfully")
except Exception as e:
    print("AN ERROR OCCURRED:")
    traceback.print_exc()
finally:
    if 'db' in locals():
        db.close()
