import stripe
from typing import Optional
from app.core.config import settings

stripe.api_key = settings.STRIPE_API_KEY

class StripeService:
    def create_checkout_session(self, tenant_id: str, plan_type: str, success_url: str, cancel_url: str) -> str:
        # Map plan_type to Price ID (Mock mapping for now)
        # In production, these should be in config or DB
        price_map = {
            "PRO": "price_mock_pro",
            "AGENCY": "price_mock_agency"
        }
        
        price_id = price_map.get(plan_type)
        if not price_id:
            raise ValueError("Invalid plan type")

        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[
                    {
                        'price': price_id,
                        'quantity': 1,
                    },
                ],
                mode='subscription',
                success_url=success_url,
                cancel_url=cancel_url,
                client_reference_id=str(tenant_id),
                metadata={
                    "tenant_id": str(tenant_id),
                    "plan_type": plan_type
                }
            )
            return checkout_session.url
        except Exception as e:
            print(f"Stripe Error: {e}")
            # Mock return for development if no real key
            if "sk_test" in settings.STRIPE_API_KEY:
                 return f"{success_url}?session_id=mock_session_id"
            raise e

    def create_portal_session(self, customer_id: str, return_url: str) -> str:
        try:
            portal_session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url,
            )
            return portal_session.url
        except Exception as e:
            print(f"Stripe Error: {e}")
            raise e

stripe_service = StripeService()
