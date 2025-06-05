# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import dao, metrics, enhanced_metrics
from app.core.config import settings
from app.db.session import init_db

app = FastAPI(
    title="DAO Portal API",
    description="API for DAO metrics and analytics",
    version="0.1.0",
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    docs_url=f"{settings.API_PREFIX}/docs",
    redoc_url=f"{settings.API_PREFIX}/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    await init_db()

# Include routers - Note that we're using API_PREFIX directly without adding /daos
app.include_router(dao.router, prefix=settings.API_PREFIX, tags=["DAOs"])
app.include_router(metrics.router, prefix=settings.API_PREFIX, tags=["Metrics"])
app.include_router(enhanced_metrics.router, prefix=settings.API_PREFIX, tags=["Enhanced Metrics"])

@app.get("/")
async def root():
    return {"message": "Welcome to DAO Portal API"}

@app.get("/health")
async def health():
    return {"status": "healthy", "message": "DAO Portal API is running"}

@app.get(f"{settings.API_PREFIX}")
async def api_root():
    return {"message": "Welcome to DAO Portal API V1"}
