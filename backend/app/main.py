from fastapi import FastAPI, Depends, Request, Response, HTTPException
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
from app.models import Base, User, Tenant, Business, Keyword, Ranking, Subscription, UsageLog, GridRankSnapshot, GridPointRank, Report

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Standard CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# FAILSAFE: Manual CORS Middleware for error responses
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    if request.method == "OPTIONS":
        response = Response()
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response
        
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# Global Version Control
APP_VERSION = "v31-STABLE"

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

        # Check for businesses health/audit columns
        new_cols = [
            ("health_score", "FLOAT DEFAULT 0.0"),
            ("profile_completeness", "FLOAT DEFAULT 0.0"),
            ("last_audit_date", "TIMESTAMP")
        ]
        for col_name, col_type in new_cols:
            try:
                db.execute(text(f"ALTER TABLE businesses ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                db.commit()
                logger.info(f"Column {col_name} verified/added.")
            except Exception as e:
                logger.warning(f"Column {col_name} error: {str(e)}")
                db.rollback()

        # 3. Fix GridRank metadata rename (fail-safe migration)
        # We rename from either metadata_json or metadata to point_metadata
        for old_name in ["metadata_json", "metadata"]:
            try:
                db.execute(text(f"ALTER TABLE grid_point_ranks RENAME COLUMN {old_name} TO point_metadata"))
                db.commit()
                logger.info(f"Column {old_name} renamed to point_metadata in grid_point_ranks.")
            except Exception:
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
    logger.error(traceback.format_exc())
    
    response = JSONResponse(
        status_code=500,
        content={
            "detail": "Internal Server Error",
            "message": str(exc),
            "version": APP_VERSION
        }
    )
    return add_cors_to_response(response)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "version": APP_VERSION}
    )
    return add_cors_to_response(response)

def add_cors_to_response(response: Response) -> Response:
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "false"
    return response
