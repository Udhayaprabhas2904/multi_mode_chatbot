from app.rag.vectorstore import get_vectorstore


def retrieve_documents(query: str, mode: str, k: int = 5):

    vectorstore = get_vectorstore()

    results = vectorstore.similarity_search(
        query,
        k=k,
        filter={
            "mode": mode
        }
    )

    return results