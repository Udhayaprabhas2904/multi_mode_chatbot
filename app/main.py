from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse


# ============================================================
# API ROUTERS
# ============================================================

from app.api.chat import router as chat_router
from app.api.documents import router as document_router
from app.api.websocket import router as websocket_router


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

FRONTEND_DIR = BASE_DIR / "frontend"


# ============================================================
# CREATE FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Multi-Mode RAG Assistant",
    description=(
        "A multi-mode Retrieval-Augmented Generation chatbot "
        "with Sales Assistant and AI Tutor modes."
    ),
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# API ROUTES
# ============================================================

# Chat API
app.include_router(
    chat_router
)

# PDF Upload / Document API
app.include_router(
    document_router
)

# WebSocket Chat API
app.include_router(
    websocket_router
)


# ============================================================
# STATIC FRONTEND
# ============================================================

# This makes:
#
# /static/style.css
# /static/app.js
# /static/...
#
# available from the frontend.

app.mount(
    "/static",
    StaticFiles(
        directory=str(FRONTEND_DIR)
    ),
    name="static",
)


# ============================================================
# HOME PAGE
# ============================================================

@app.get(
    "/",
    include_in_schema=False
)
async def home():
    """
    Serve the main frontend application.
    """

    return FileResponse(
        str(FRONTEND_DIR / "index.html")
    )


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get(
    "/health",
    tags=["System"]
)
async def health():
    """
    Check whether the FastAPI server is running.
    """

    return {
        "status": "healthy",
        "service": "Multi-Mode RAG Assistant",
        "version": "1.0.0",
    }


# ============================================================
# API INFORMATION
# ============================================================

@app.get(
    "/api",
    tags=["System"]
)
async def api_info():
    """
    Basic API information.
    """

    return {
        "application": "Multi-Mode RAG Assistant",
        "version": "1.0.0",
        "modes": [
            "sales",
            "tutor"
        ],
        "endpoints": {
            "upload": "/api/upload",
            "chat": "/api/chat",
            "websocket": "/ws/chat",
            "health": "/health",
            "docs": "/docs",
        },
    }