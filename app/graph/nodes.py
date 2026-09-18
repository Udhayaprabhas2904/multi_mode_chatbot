from app.rag.retriever import retrieve_documents

from app.agents.sales_agent import sales_agent
from app.agents.tutor_agent import tutor_agent


def query_analyzer(state):
    """
    Analyze and prepare the user's query.
    """

    return {
        "rewritten_query": state["query"]
    }


def document_retriever(state):
    """
    Retrieve relevant documents based on:
    - rewritten query
    - selected mode
    """

    query = state["rewritten_query"]

    mode = state["mode"]

    documents = retrieve_documents(
        query=query,
        mode=mode,
        k=5,
    )

    return {
        "retrieved_documents": documents
    }


def context_builder(state):
    """
    Build the context that will be provided
    to the Sales Assistant or AI Tutor.
    """

    documents = state.get(
        "retrieved_documents",
        []
    )

    context_parts = []

    for document in documents:

        metadata = document.metadata or {}

        source = metadata.get(
            "source",
            "Unknown"
        )

        page = metadata.get(
            "page",
            "Unknown"
        )

        context_parts.append(
            f"""
Source: {source}
Page: {page}

{document.page_content}
"""
        )

    context = "\n\n".join(context_parts)

    return {
        "context": context
    }


def sales_node(state):
    """
    Sales Assistant node.
    """

    response = sales_agent(
        query=state["query"],
        context=state["context"],
        chat_history=state.get(
            "chat_history",
            []
        )
    )

    return {
        "response": response
    }


def tutor_node(state):
    """
    AI Tutor node.
    """

    response = tutor_agent(
        query=state["query"],
        context=state["context"],
        chat_history=state.get(
            "chat_history",
            []
        )
    )

    return {
        "response": response
    }


def response_validator(state):
    """
    Validate and normalize the generated response.

    Gemini/LangChain can sometimes return response
    content as a list instead of a plain string.
    """

    response = state.get(
        "response",
        ""
    )

    # -------------------------------------------------
    # Case 1: Response is a list
    # -------------------------------------------------

    if isinstance(response, list):

        text_parts = []

        for item in response:

            if isinstance(item, str):

                text_parts.append(item)

            elif isinstance(item, dict):

                if "text" in item:

                    text_parts.append(
                        str(item["text"])
                    )

                elif "content" in item:

                    text_parts.append(
                        str(item["content"])
                    )

        response = "\n".join(text_parts)

    # -------------------------------------------------
    # Case 2: Response is None
    # -------------------------------------------------

    elif response is None:

        response = ""

    # -------------------------------------------------
    # Case 3: Any other response type
    # -------------------------------------------------

    else:

        response = str(response)

    # Remove unnecessary whitespace
    response = response.strip()

    # -------------------------------------------------
    # Valid response
    # -------------------------------------------------

    if response:

        return {
            "response": response,
            "is_valid": True
        }

    # -------------------------------------------------
    # Empty/invalid response
    # -------------------------------------------------

    return {
        "response": (
            "I could not generate a response "
            "from the retrieved documents."
        ),
        "is_valid": False
    }