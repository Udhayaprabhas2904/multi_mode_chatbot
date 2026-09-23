from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    ChatRequest,
    ChatResponse,
)

from app.graph.workflow import build_graph


router = APIRouter(
    prefix="/api",
    tags=["Chat"],
)


# Build the LangGraph workflow once when the application starts.
graph = build_graph()


@router.post(
    "/chat",
    response_model=ChatResponse,
)
async def chat(request: ChatRequest):

    
    # Validate the request
   

    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Please enter a question.",
        )

    if request.mode not in {"sales", "tutor"}:
        raise HTTPException(
            status_code=400,
            detail="Invalid mode. Use 'sales' or 'tutor'.",
        )

   
    # Initial state sent to LangGraph
    
    initial_state = {
        "query": request.message.strip(),
        "mode": request.mode,
        "chat_history": [],
    }

   
    # Run LangGraph
   

    try:

        result = graph.invoke(initial_state)

    except Exception as e:

        # Print the real error in the Uvicorn terminal
        print()
        print("=" * 60)
        print("CHAT ERROR")
       
        print("Error type:", type(e).__name__)
        print("Error message:", str(e))
        
        print()

        error_message = str(e)

     
        # Gemini temporarily unavailable
       

        if (
            "503" in error_message
            or "UNAVAILABLE" in error_message
        ):
            raise HTTPException(
                status_code=503,
                detail=(
                    "The Gemini AI service is temporarily "
                    "unavailable. Please try again in a few seconds."
                ),
            )

       
        # Gemini/API rate limit
        

        if (
            "429" in error_message
            or "RESOURCE_EXHAUSTED" in error_message
            or "rate limit" in error_message.lower()
        ):
            raise HTTPException(
                status_code=429,
                detail=(
                    "The Gemini API rate limit has been reached. "
                    "Please wait a moment and try again."
                ),
            )

       
        # Other errors
       

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to generate a response. "
                "Please try again."
            ),
        )

    
    # Get documents retrieved by the RAG workflow
   
    documents = result.get(
        "retrieved_documents",
        [],
    )

   
    # Prepare source information
  

    sources = []

    for document in documents:

        metadata = document.metadata or {}

        sources.append(
            {
                "source": metadata.get(
                    "source",
                    "Unknown",
                ),
                "page": metadata.get(
                    "page",
                    "Unknown",
                ),
            }
        )

    
    # Get final response
 

    answer = result.get(
        "response",
        "",
    )

   
    # Return chatbot response
    

    return ChatResponse(
        mode=request.mode,
        answer=answer,
        sources=sources,
    )