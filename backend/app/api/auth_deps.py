from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas import TokenPayload

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login/access-token"
)

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> User:
    try:
        from app.services.user_service import UserService
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except JWTError:
        import logging
        logging.error(f"JWT Decode Error. Token snippet: {token[:10]}...")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials: JWT Decode Error",
        )
    except ValidationError as e:
        import logging
        logging.error(f"Token Validation Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Could not validate credentials: {str(e)}",
        )
    except Exception as e:
        import logging
        logging.error(f"Unexpected Auth Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials: Unexpected Error",
        )
    user = UserService().get(db, user_id=token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Self-healing: Ensure user has a tenant
    if not user.tenant_id:
        from app.services.tenant_service import tenant_service
        from app.schemas.tenant import TenantCreate
        from app.schemas.user import UserUpdate
        
        # Create tenant
        tenant_name = f"{user.email.split('@')[0]}'s Org"
        tenant = tenant_service.create(db, obj_in=TenantCreate(name=tenant_name))
        
        # Update user
        user = UserService().update(db, db_obj=user, obj_in=UserUpdate(tenant_id=tenant.id, role="OWNER"))
        
    return user
