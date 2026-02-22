from fastapi import FastAPI, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
import traceback
import logging
import time

from app.core.config import settings
from app.api.v1.api import api_router
from app.core.database import get_db, engine
from app.models import Base, User, Tenant, Business, Keyword, Ranking, Subscription, UsageLog # Use Base from app.models

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Standard CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware for Logging and CORS Failsafe
@app.middleware("http")
async def log_and_cors_failsafe(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
    except Exception as e:
        logger.error(f"Uncaught MiddleWare Exception: {str(e)}")
        logger.error(traceback.format_exc())
        response = JSONResponse(
            status_code=500,
            content={
                "detail": "Internal Server Error in Middleware",
                "message": str(e),
                "version": "v11"
            }
        )
    
    # Failsafe CORS headers
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    
    process_time = (time.time() - start_time) * 1000
    logger.info(f"[{request.method}] {request.url.path} - {response.status_code} ({process_time:.2f}ms)")
    return response

@app.get("/")
def root():
    return {"message": "MapRank API is alive", "version": "v11"}

@app.get("/health/v7")
def health_v7():
    return {"status": "ok", "version": "v11"}

@app.get("/health/db")
def health_db_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "db": "connected", "version": "v11"}
    except Exception as e:
        logger.error(f"DB Health Check Failed: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "db": str(e), "version": "v11"}
        )

@app.get("/health/tables")
def health_tables_check(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'"))
        tables = [row[0] for row in result.fetchall()]
        return {"status": "ok", "tables": tables, "version": "v11"}
    except Exception as e:
        logger.error(f"Tables Check Failed: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "error": str(e), "version": "v11"}
        )

@app.get("/health/migrate")
def health_migrate():
    try:
        logger.info("Running manual migration (create_all)...")
        # Log how many tables are in metadata
        table_count = len(Base.metadata.tables)
        logger.info(f"Metadata has {table_count} tables: {list(Base.metadata.tables.keys())}")
        
        Base.metadata.create_all(bind=engine)
        
        return {
            "status": "ok", 
            "message": "Database tables created successfully", 
            "tables_in_metadata": list(Base.metadata.tables.keys()),
            "table_count": table_count,
            "version": "v11"
        }
    except Exception as e:
        logger.error(f"Migration Failed: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e), "version": "v11"}
        )

@app.get("/health/test-hash")
def test_hash(pw: str = "very_long_password_that_exceeds_seventy_two_bytes_limit_for_bcrypt_to_test_pre_hashing"):
    from app.core.security import get_password_hash
    try:
        h = get_password_hash(pw)
        return {"status": "ok", "hash_len": len(h), "input_len": len(pw), "version": "v11"}
    except Exception as e:
        return {"status": "error", "message": str(e), "version": "v11"}

app.include_router(api_router, prefix=settings.API_V1_STR)

# Global Exception Handler (redundancy)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Exception Handler: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal Server Error",
            "message": str(exc),
            "version": "v11"
        }
    )

@app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
async def catch_all(request: Request, path_name: str):
    return JSONResponse(
        status_code=404,
        content={"error": "Not Found", "requested_path": path_name, "version": "v11"}
    )
