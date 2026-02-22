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
from app.models import Base, User, Tenant, Business, Keyword, Ranking, Subscription, UsageLog

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Robust CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Version Control
APP_VERSION = "v18-FINAL-STABILITY"

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
                "version": APP_VERSION
            }
        )
    
    # Force CORS headers
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    
    process_time = (time.time() - start_time) * 1000
    if not request.url.path.startswith("/health"): # Don't spam health check logs
        logger.info(f"[{request.method}] {request.url.path} - {response.status_code} ({process_time:.2f}ms)")
    return response

@app.get("/")
def root():
    return {"message": "MapRank API is alive", "version": APP_VERSION}

@app.get("/health")
@app.get("/health/v16")
def health_v16():
    return {"status": "ok", "version": APP_VERSION}

@app.get("/health/db")
def health_db_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "db": "connected", "version": APP_VERSION}
    except Exception as e:
        logger.error(f"DB Health Check Failed: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "db": str(e), "version": APP_VERSION}
        )

@app.get("/health/tables")
def health_tables_check(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'"))
        tables = [row[0] for row in result.fetchall()]
        return {"status": "ok", "tables": tables, "version": APP_VERSION}
    except Exception as e:
        logger.error(f"Tables Check Failed: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "error": str(e), "version": APP_VERSION}
        )

@app.get("/health/migrate")
def health_migrate(db: Session = Depends(get_db)):
    try:
        logger.info("Running Database Migrations/Sync...")
        
        # 1. Create tables if not exist
        Base.metadata.create_all(bind=engine)
        
        # 2. Check and add missing columns manually (SQLite/Postgres failsafe)
        # Check for is_my_business in businesses
        try:
            db.execute(text("ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_my_business BOOLEAN DEFAULT FALSE"))
            db.commit()
            logger.info("Column is_my_business verified/added.")
        except Exception as e:
            logger.warning(f"Column is_my_business might already exist or error: {str(e)}")
            db.rollback()

        # Check for score in rankings
        try:
            db.execute(text("ALTER TABLE rankings ADD COLUMN IF NOT EXISTS score FLOAT"))
            db.commit()
            logger.info("Column score verified/added.")
        except Exception as e:
            logger.warning(f"Column score might already exist or error: {str(e)}")
            db.rollback()

        return {
            "status": "ok", 
            "message": "Database sync successful", 
            "version": APP_VERSION
        }
    except Exception as e:
        logger.error(f"Migration Failed: {str(e)}")
        db.rollback()
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e), "version": APP_VERSION}
        )

@app.on_event("startup")
def startup_event():
    # Automatically sync DB on startup
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        health_migrate(db)
    finally:
        db.close()

@app.get("/health/test-hash")
def test_hash(pw: str = "test_password_with_long_string"):
    from app.core.security import get_password_hash
    try:
        h = get_password_hash(pw)
        return {"status": "ok", "hash_snippet": h[:10], "len": len(h), "version": APP_VERSION}
    except Exception as e:
        return {"status": "error", "message": str(e), "version": APP_VERSION}

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Exception Handler: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal Server Error",
            "message": str(exc),
            "version": APP_VERSION
        }
    )
