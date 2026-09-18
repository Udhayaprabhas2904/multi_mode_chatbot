from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
)

from app.graph.workflow import build_graph


router = APIRouter(
    tags=["WebSocket"]
)


graph = build_graph()


@router.websocket("/ws/chat")
async def websocket_chat(
    websocket: WebSocket
):

    await websocket.accept()

    chat_history = []

    try:

        while True:

            data = await websocket.receive_json()

            mode = data.get("mode")

            message = data.get("message")

            if mode not in [
                "sales",
                "tutor"
            ]:

                await websocket.send_json({
                    "error": "Invalid mode."
                })

                continue

            state = {

                "query": message,

                "mode": mode,

                "chat_history": chat_history,
            }

            result = graph.invoke(
                state
            )

            answer = result["response"]

            chat_history.append({
                "role": "user",
                "content": message,
                "mode": mode
            })

            chat_history.append({
                "role": "assistant",
                "content": answer,
                "mode": mode
            })

            await websocket.send_json({

                "mode": mode,

                "answer": answer,

                "sources": [
                    {
                        "source": doc.metadata.get(
                            "source"
                        ),
                        "page": doc.metadata.get(
                            "page"
                        )
                    }

                    for doc in result.get(
                        "retrieved_documents",
                        []
                    )
                ]
            })

    except WebSocketDisconnect:

        print(
            "Client disconnected"
        )