from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = settings.ALGORITHM

def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

import hashlib

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Pre-hash to handle passwords > 72 chars
    pw_hash = hashlib.sha256(plain_password.encode()).hexdigest()
    return pwd_context.verify(pw_hash, hashed_password)

def get_password_hash(password: str) -> str:
    # Pre-hash to handle passwords > 72 chars (bcrypt limit)
    # The output is 64 hex characters, which is well within 72 bytes.
    print(f"DEBUG_SECURITY: Hashing password of length {len(password)}")
    pw_hash = hashlib.sha256(password.encode()).hexdigest()
    return pwd_context.hash(pw_hash)
