from fastapi import APIRouter, Depends
from typing import List
from app import schemas
from app.services.review_service import review_service
from app.api import deps, auth_deps

router = APIRouter()

@router.get("/", response_model=List[schemas.Review])
def read_reviews(
    place_id: str,
    current_user: schemas.User = Depends(auth_deps.get_current_user)
):
    """
    Get reviews for a specific place from Google Maps.
    """
    reviews = review_service.get_reviews(place_id)
    return reviews

@router.post("/draft", response_model=schemas.ReplyDraftResponse)
def generate_draft(
    request: schemas.ReplyDraftRequest,
    current_user: schemas.User = Depends(auth_deps.get_current_user)
):
    """
    Generate an AI draft reply for a review.
    """
    draft = review_service.generate_reply_draft(
        review_text=request.review_text,
        rating=request.rating,
        author_name=request.author_name,
        tone=request.tone
    )
    return {"draft": draft}
