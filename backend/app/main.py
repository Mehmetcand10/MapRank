from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.api.v1.api import api_router
from app.core.database import get_db

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

print("--- MAPRANK API STARTING ---")

# PERMISSIVE CORS: Allow everything since we use localStorage + Authorization headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "version": "v3", "cors": "permissive"}

@app.get("/health/db")
def health_db_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        return {"status": "error", "db": str(e)}

app.include_router(api_router, prefix=settings.API_V1_STR)
