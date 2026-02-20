from pydantic import BaseModel
from typing import Optional, List

class ReviewBase(BaseModel):
    author_name: str
    rating: int
    text: str
    relative_time_description: str
    time: int
    profile_photo_url: Optional[str] = None

class Review(ReviewBase):
    sentiment: Optional[str] = "neutral" # positive, negative, neutral
    reply_draft: Optional[str] = None

class ReplyDraftRequest(BaseModel):
    review_text: str
    rating: int
    author_name: str
    tone: str = "professional" # professional, friendly, apologetic

class ReplyDraftResponse(BaseModel):
    draft: str

