from typing import Any
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session

from app import schemas
from app.api import deps
from app.core import security
from app.services.user_service import user_service

router = APIRouter()

@router.get("/me", response_model=schemas.User)
def read_user_me(
    current_user: schemas.User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.put("/me", response_model=schemas.User)
def update_user_me(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserUpdate,
    current_user: schemas.User = Depends(deps.get_current_user),
) -> Any:
    """
    Update own user.
    """
    user = user_service.update(db, db_obj=current_user, obj_in=user_in)
    return user

@router.post("/change-password", response_model=schemas.User)
def change_password(
    *,
    db: Session = Depends(deps.get_db),
    password_in: schemas.PasswordChange,
    current_user: schemas.User = Depends(deps.get_current_user),
) -> Any:
    """
    Change password.
    """
    if not security.verify_password(password_in.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")
    
    user_in = schemas.UserUpdate(password=password_in.new_password)
    user = user_service.update(db, db_obj=current_user, obj_in=user_in)
    return user
