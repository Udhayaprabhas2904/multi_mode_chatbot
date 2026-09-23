from app.rag.retriever import retrieve_documents

from app.agents.sales_agent import sales_agent
from app.agents.tutor_agent import tutor_agent


# Maximum number of documents sent to the LLM.
# Keeping this small helps reduce API usage.
TOP_K_DOCUMENTS = 3

# Maximum characters taken from each retrieved document.
# This prevents unnecessarily large prompts.
MAX_CHARS_PER_DOCUMENT = 4000


def query_analyzer(state):
    """
    Analyze and prepare the user's query.

    For now, the query is passed through unchanged.
    """

    query = state.get("query", "").strip()

    return {
        "rewritten_query": query
    }


def document_retriever(state):
    """
    Retrieve relevant documents based on:
    - rewritten query
    - selected mode

    The selected mode is important because:
        sales -> only sales documents
        tutor -> only tutor documents
    """

    query = state.get(
        "rewritten_query",
        ""
    ).strip()

    mode = state.get("mode")

    if not query:
        return {
            "retrieved_documents": []
        }

    if mode not in {"sales", "tutor"}:
        raise ValueError(
            "Invalid mode. Use 'sales' or 'tutor'."
        )

    documents = retrieve_documents(
        query=query,
        mode=mode,
        k=TOP_K_DOCUMENTS,
    )

    return {
        "retrieved_documents": documents
    }


def context_builder(state):
    """
    Build the context that will be provided
    to the Sales Assistant or AI Tutor.

    Only retrieved documents are included.
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

        content = document.page_content or ""

        # Limit the amount of text sent to the LLM.
        content = content[:MAX_CHARS_PER_DOCUMENT]

        context_parts.append(
            f"""
Source: {source}
Page: {page}

{content}
"""
        )

    context = "\n\n".join(
        context_parts
    ).strip()

    return {
        "context": context
    }


def sales_node(state):
    """
    Sales Assistant node.
    """

    response = sales_agent(
        query=state["query"],
        context=state.get(
            "context",
            ""
        ),
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
        context=state.get(
            "context",
            ""
        ),
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

    LangChain model responses can sometimes contain
    different content formats. This converts them
    into a normal string.
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

        response = "\n".join(
            text_parts
        )

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