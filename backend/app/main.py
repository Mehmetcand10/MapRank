from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import time
import traceback

from app.core.config import settings
from app.api.v1.api import api_router
from app.core.database import get_db

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Custom Logging Middleware to see every request in Railway Logs
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    origin = request.headers.get("origin")
    method = request.method
    path = request.url.path
    print(f"--- Incoming Request: {method} {path} | Origin: {origin} ---")
    
    try:
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        print(f"--- Response: {response.status_code} | Time: {process_time:.2f}ms ---")
        return response
    except Exception as e:
        print(f"--- ERROR in Request: {str(e)} ---")
        print(traceback.format_exc())
        raise e

# Robust CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://maprank-production-b0f1.up.railway.app",
        "https://maprank-frontend.vercel.app",
        "https://maprank.vercel.app", # Common Vercel pattern
        "*" # Fallback for mobile/other origins
    ],
    allow_credentials=False, # Changed to False for maximal compatibility with "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "MapRank API is alive", "version": "v4"}

@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "version": "v4", "cors": "robust"}

@app.get("/health/db")
def health_db_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        print(f"DB Health Check Failed: {str(e)}")
        return {"status": "error", "db": str(e), "note": "Check Railway DB variables"}

# Include the main router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Catch-all for debugging 404s
@app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
async def catch_all(request: Request, path_name: str):
    print(f"!!! Catch-all triggered for: {path_name} !!!")
    return {"error": "Not Found", "requested_path": path_name, "version": "v4"}
