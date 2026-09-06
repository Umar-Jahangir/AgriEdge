"""AgriEdge Rover — FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import get_settings
from app.database.session import init_db

settings = get_settings()

logging.basicConfig(
  level=getattr(logging, settings.log_level.upper(), logging.INFO),
  format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
  logger.info("Starting %s v%s (mock=%s, demo=%s)", settings.app_name, settings.app_version, settings.mock_mode, settings.demo_mode)
  init_db()
  yield
  logger.info("Shutting down %s", settings.app_name)


app = FastAPI(
  title=settings.app_name,
  description="Offline-first Edge AI Smart Farming Assistant — local API for Raspberry Pi",
  version=settings.app_version,
  lifespan=lifespan,
)

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
def root():
  return {
    "app": settings.app_name,
    "version": settings.app_version,
    "docs": "/docs",
    "health": "/api/health",
    "offline_capable": True,
    "mock_mode": settings.mock_mode,
  }
