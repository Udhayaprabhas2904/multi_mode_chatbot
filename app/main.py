from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response


# API ROUTERS


from app.api.chat import router as chat_router
from app.api.documents import router as document_router
from app.api.websocket import router as websocket_router



# PATH CONFIGURATION

BASE_DIR = Path(__file__).resolve().parent.parent

# Frontend directory:

FRONTEND_DIR = BASE_DIR / "frontend"

INDEX_FILE = FRONTEND_DIR / "index.html"
CSS_FILE = FRONTEND_DIR / "style.css"
JS_FILE = FRONTEND_DIR / "app.js"



# FRONTEND FILE CHECK
print("MULTI-MODE RAG ASSISTANT")
print("Project directory :", BASE_DIR)
print("Frontend directory:", FRONTEND_DIR)
print("index.html        :", INDEX_FILE.exists())
print("style.css         :", CSS_FILE.exists())
print("app.js            :", JS_FILE.exists())

# CREATE FASTAPI APPLICATION

app = FastAPI(
    title="Multi-Mode RAG Assistant",
    description=(
        "A multi-mode Retrieval-Augmented Generation chatbot "
        "with Sales Assistant and AI Tutor modes."
    ),
    version="1.0.0",
)



# CORS


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# DEVELOPMENT CACHE CONTROL


@app.middleware("http")
async def disable_frontend_cache(request: Request, call_next):
    

    response = await call_next(request)

    path = request.url.path

    if (
        path == "/"
        or path.startswith("/static/")
    ):
        response.headers["Cache-Control"] = (
            "no-store, no-cache, must-revalidate, max-age=0"
        )

        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"

    return response


# API ROUTES

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

# STATIC FRONTEND FILES
app.mount(
    "/static",
    StaticFiles(
        directory=str(FRONTEND_DIR),
        check_dir=True,
    ),
    name="static",
)


# HOME PAGE
@app.get(
    "/",
    include_in_schema=False,
)
async def home():
    """
    Serve the main frontend application.
    """

    return FileResponse(
        INDEX_FILE,
        media_type="text/html",
    )



# FAVICON

@app.get(
    "/favicon.ico",
    include_in_schema=False,
)
async def favicon():
    """
    Avoid an unnecessary 404 request when the browser
    automatically requests /favicon.ico.

    A real favicon can be added later.
    """

    return Response(
        status_code=204
    )



# HEALTH CHECK
@app.get(
    "/health",
    tags=["System"],
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



# API INFORMATION
@app.get(
    "/api",
    tags=["System"],
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
            "tutor",
        ],

        "frontend": {
            "home": "/",
            "css": "/static/style.css",
            "javascript": "/static/app.js",
        },

        "endpoints": {
            "upload": "/api/upload",
            "chat": "/api/chat",
            "websocket": "/ws/chat",
            "health": "/health",
            "docs": "/docs",
        },
    }