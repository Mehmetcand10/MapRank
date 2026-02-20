from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app import schemas
from app.api import deps
from app.services.stripe_service import stripe_service
from app.services.tenant_service import tenant_service

router = APIRouter()

class Plan(BaseModel):
    id: str
    name: str
    price: float
    features: List[str]

class CheckoutRequest(BaseModel):
    plan_type: str

@router.get("/plans", response_model=List[Plan])
def list_plans() -> Any:
    """
    List available subscription plans.
    """
    return [
        Plan(id="FREE", name="Starter", price=0, features=["3 Searches/mo", "Basic Analysis"]),
        Plan(id="PRO", name="Pro", price=29, features=["Unlimited Searches", "Deep Analysis", "Rank Tracking"]),
        Plan(id="AGENCY", name="Agency", price=99, features=["Whitelabel Reports", "API Access", "Priority Support"]),
    ]

@router.post("/checkout")
def create_checkout_session(
    checkout_in: CheckoutRequest,
    db: Session = Depends(deps.get_db),
    current_user: schemas.User = Depends(deps.get_current_user),
) -> Any:
    """
    Create Stripe Checkout Session.
    """
    tenant = tenant_service.get(db, tenant_id=current_user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # In a real app, successful_url should be frontend URL
    base_url = "http://localhost:3000/settings?tab=billing" 
    
    url = stripe_service.create_checkout_session(
        tenant_id=str(tenant.id),
        plan_type=checkout_in.plan_type,
        success_url=f"{base_url}&success=true",
        cancel_url=f"{base_url}&canceled=true"
    )
    
    return {"url": url}

@router.post("/portal")
def create_portal_session(
    db: Session = Depends(deps.get_db),
    current_user: schemas.User = Depends(deps.get_current_user),
) -> Any:
    """
    Create Stripe Customer Portal Session for managing subscription.
    """
    tenant = tenant_service.get(db, tenant_id=current_user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    if not tenant.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No active subscription found")

    base_url = "http://localhost:3000/settings?tab=billing"
    
    url = stripe_service.create_portal_session(
        customer_id=tenant.stripe_customer_id,
        return_url=base_url
    )
    
    return {"url": url}
