from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.graph.workflow import build_graph


# ROUTER


router = APIRouter(
    tags=["WebSocket"],
)



# LANGGRAPH


graph = build_graph()



# WEBSOCKET CHAT


@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """
    WebSocket endpoint for Sales Assistant
    and AI Tutor chat.
    """

   
    # ACCEPT CONNECTION
    

    await websocket.accept()

    print("WebSocket client connected.")

    # Conversation history for this connection
    chat_history = []

    try:

        
        # CONTINUOUS CHAT LOOP
      

        while True:

          
            # RECEIVE JSON
          

            try:
                data = await websocket.receive_json()

            except Exception as error:

                print(
                    "Invalid WebSocket data:",
                    error,
                )

                await websocket.send_json(
                    {
                        "type": "error",
                        "message": (
                            "Invalid message received. "
                            "Please send valid JSON."
                        ),
                    }
                )

                continue

          
            # READ REQUEST
           
            question = data.get("question")
            mode = data.get("mode")
            document_id = data.get("document_id")

          
            # VALIDATE QUESTION
            
            if question is None:
                await websocket.send_json(
                    {
                        "type": "error",
                        "message": "Please enter a question.",
                    }
                )
                continue

            if not isinstance(question, str):
                await websocket.send_json(
                    {
                        "type": "error",
                        "message": "Question must be text.",
                    }
                )
                continue

            question = question.strip()

            if not question:
                await websocket.send_json(
                    {
                        "type": "error",
                        "message": "Please enter a question.",
                    }
                )
                continue

           
            # VALIDATE MODE
           

            if mode not in {"sales", "tutor"}:

                await websocket.send_json(
                    {
                        "type": "error",
                        "message": (
                            "Invalid mode. "
                            "Please select Sales or AI Tutor."
                        ),
                    }
                )

                continue

           
            # DOCUMENT CHECK
            

            if document_id is None:

                await websocket.send_json(
                    {
                        "type": "error",
                        "message": (
                            "Please upload or select "
                            "a document first."
                        ),
                    }
                )

                continue

           
            # STATUS
          
            await websocket.send_json(
                {
                    "type": "status",
                    "message": "Understanding your question...",
                }
            )

            
            # BUILD LANGGRAPH STATE
            

            state = {
                "query": question,
                "mode": mode,
                "chat_history": chat_history,
            }

          
            # RETRIEVAL STATUS
           

            await websocket.send_json(
                {
                    "type": "status",
                    "message": (
                        "Searching the uploaded document..."
                    ),
                }
            )

          
            # RUN LANGGRAPH
            
            try:

                result = graph.invoke(state)

            except Exception as error:

                print()
             
                print("LANGGRAPH ERROR")
              
                print("Error type:", type(error).__name__)
                print("Error message:", str(error))
                
                print()

                await websocket.send_json(
                    {
                        "type": "error",
                        "message": (
                            "The chatbot could not "
                            "process your question. "
                            "Please try again."
                        ),
                    }
                )

                continue

            
            # GET ANSWER
            

            answer = result.get("response", "")

            if isinstance(answer, list):

                answer = "\n".join(
                    str(item)
                    for item in answer
                )

            if answer is None:
                answer = ""

            answer = str(answer).strip()

           
            # VALIDATE ANSWER
           

            if not answer:

                await websocket.send_json(
                    {
                        "type": "error",
                        "message": (
                            "I could not generate "
                            "a response."
                        ),
                    }
                )

                continue

          
            # GET RETRIEVED DOCUMENTS
           

            retrieved_documents = result.get(
                "retrieved_documents",
                [],
            )

       
            # BUILD SOURCES
            
            sources = []
            seen_sources = set()

            for document in retrieved_documents:

                metadata = document.metadata or {}

                source = metadata.get(
                    "source",
                    "Unknown",
                )

                page = metadata.get(
                    "page",
                    "Unknown",
                )

                source_key = (
                    source,
                    page,
                )

                if source_key in seen_sources:
                    continue

                seen_sources.add(source_key)

                sources.append(
                    {
                        "filename": source,
                        "source": source,
                        "page": page,
                    }
                )

           
            # UPDATE CHAT HISTORY
          
            chat_history.append(
                {
                    "role": "user",
                    "content": question,
                    "mode": mode,
                }
            )

            chat_history.append(
                {
                    "role": "assistant",
                    "content": answer,
                    "mode": mode,
                }
            )

            
            # SEND FINAL RESPONSE
           
            await websocket.send_json(
                {
                    "type": "done",
                    "mode": mode,
                    "answer": answer,
                    "sources": sources,
                }
            )

  
    # CLIENT DISCONNECTED
   

    except WebSocketDisconnect:

        print("WebSocket client disconnected.")

    
    # UNEXPECTED ERROR
    
    except Exception as error:

        print()
        
        print("WEBSOCKET ERROR")
        
        print("Error type:", type(error).__name__)
        print("Error message:", str(error))
        
        print()

        try:

            await websocket.send_json(
                {
                    "type": "error",
                    "message": (
                        "An unexpected server error occurred."
                    ),
                }
            )

        except Exception:
            pass