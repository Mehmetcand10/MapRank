from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, tenants, billing, businesses, reviews, reports

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(billing.router, prefix="/billing", tags=["billing"])
api_router.include_router(businesses.router, prefix="/businesses", tags=["businesses"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
