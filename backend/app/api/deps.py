from typing import Generator
from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.auth_deps import get_current_user, reusable_oauth2
