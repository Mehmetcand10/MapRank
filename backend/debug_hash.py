from passlib.context import CryptContext
import traceback

try:
    print("Testing password hashing...")
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hash = pwd_context.hash("test_password")
    print(f"Hash success: {hash}")
except Exception as e:
    print("Hashing Failed:")
    traceback.print_exc()
