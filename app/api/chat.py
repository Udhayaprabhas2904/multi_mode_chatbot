from fastapi import APIRouter

from app.models.schemas import (
    ChatRequest,
    ChatResponse,
)

from app.graph.workflow import build_graph


router = APIRouter(
    prefix="/api",
    tags=["Chat"]
)


# Build the LangGraph workflow once when the application starts.
graph = build_graph()


@router.post(
    "/chat",
    response_model=ChatResponse
)
async def chat(request: ChatRequest):

    # Initial state sent to LangGraph
    initial_state = {
        "query": request.message,
        "mode": request.mode,
        "chat_history": [],
    }

    try:
        # Run the LangGraph workflow
        result = graph.invoke(initial_state)

    except Exception as e:
        # Print the real error in the Uvicorn terminal
        print()
        print("=" * 60)
        print("CHAT ERROR")
        print("=" * 60)
        print("Error type:", type(e).__name__)
        print("Error message:", str(e))
        print("=" * 60)
        print()

        # Let FastAPI return the 500 response
        raise

    # Get documents retrieved by the RAG workflow
    documents = result.get(
        "retrieved_documents",
        []
    )

    # Prepare source information
    sources = []

    for document in documents:

        metadata = document.metadata or {}

        sources.append({
            "source": metadata.get("source"),
            "page": metadata.get("page"),
        })

    # Return final chatbot response
    return ChatResponse(
        mode=request.mode,
        answer=result["response"],
        sources=sources,
    )