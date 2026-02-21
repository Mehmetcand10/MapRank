from fastapi import FastAPI, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
import traceback
import logging

from app.core.config import settings
from app.api.v1.api import api_router
from app.core.database import get_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Standard CORS Middleware - Most reliable
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Exception: {str(exc)}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal Server Error",
            "message": str(exc),
            "traceback": traceback.format_exc().splitlines()[-3:], # Last bits of trace
            "version": "v6"
        }
    )

@app.get("/")
def root():
    return {"message": "MapRank API is alive", "version": "v6"}

@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "version": "v6"}

@app.get("/health/db")
def health_db_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "db": "connected", "version": "v6"}
    except Exception as e:
        logger.error(f"DB Health Check Failed: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "db": str(e), "version": "v6"}
        )

@app.get("/health/tables")
def health_tables_check(db: Session = Depends(get_db)):
    try:
        # Use a list to store table names
        table_names = db.execute(text("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'")).fetchall()
        return {"status": "ok", "tables": [t[0] for t in table_names], "version": "v6"}
    except Exception as e:
        logger.error(f"Tables Check Failed: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "error": str(e), "version": "v6"}
        )

app.include_router(api_router, prefix=settings.API_V1_STR)

# Simple catch-all for debugging
@app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
async def catch_all(request: Request, path_name: str):
    return JSONResponse(
        status_code=404,
        content={"error": "Not Found", "requested_path": path_name, "version": "v6"}
    )
