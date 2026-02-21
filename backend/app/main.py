from fastapi import FastAPI, Depends, Request, Response
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

# Robust CORS Configuration (Pure Wildcard)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Logging & Hardcoded CORS Header Middleware
# This ensures even 422 or 500 errors get CORS headers
@app.middleware("http")
async def log_and_cors_headers(request: Request, call_next):
    start_time = time.time()
    origin = request.headers.get("origin")
    
    # Handle preflight (OPTIONS) manually if needed, or just let it pass
    if request.method == "OPTIONS":
        response = Response()
    else:
        try:
            response = await call_next(request)
        except Exception as e:
            print(f"--- SERVER ERROR: {str(e)} ---")
            print(traceback.format_exc())
            # Return a JSON error but with CORS headers
            from fastapi.responses import JSONResponse
            response = JSONResponse(
                status_code=500,
                content={"detail": "Internal Server Error", "error": str(e)}
            )
    
    # Force CORS headers on EVERY response
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    
    process_time = (time.time() - start_time) * 1000
    print(f"[{request.method}] {request.url.path} - {response.status_code} ({process_time:.2f}ms) | Origin: {origin}")
    
    return response

@app.get("/")
def root():
    return {"message": "MapRank API is alive", "version": "v5"}

@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "version": "v5", "cors": "manual_injection"}

@app.get("/health/db")
def health_db_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        print(f"DB Health Check Failed: {str(e)}")
        return {"status": "error", "db": str(e)}

app.include_router(api_router, prefix=settings.API_V1_STR)

# Catch-all for debugging 404s
@app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
async def catch_all(request: Request, path_name: str):
    print(f"!!! Catch-all triggered for: {path_name} !!!")
    return {"error": "Path Not Found", "requested_path": path_name, "version": "v5"}
