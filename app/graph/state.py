from typing import TypedDict


class GraphState(TypedDict, total=False):

    query: str

    mode: str

    chat_history: list

    rewritten_query: str

    retrieved_documents: list

    context: str

    response: str

    is_valid: bool