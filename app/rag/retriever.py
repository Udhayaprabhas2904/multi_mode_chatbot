from app.rag.vectorstore import get_vectorstore


def retrieve_documents(
    query: str,
    mode: str,
    k: int = 5
):

    print()
    print("=" * 60)
    print("RETRIEVAL DEBUG")
    print("=" * 60)

    print("Query :", query)
    print("Mode  :", mode)
    print("Top K :", k)

    vectorstore = get_vectorstore()

    results = vectorstore.max_marginal_relevance_search(
        query,
        k=k,
        fetch_k=15,
        lambda_mult=0.7,
        filter={
            "mode": mode
        }
    )

    print()
    print("Retrieved documents:", len(results))

    for index, document in enumerate(
        results,
        start=1
    ):

        metadata = document.metadata or {}

        print()
        print(f"--- DOCUMENT {index} ---")

        print(
            "Source:",
            metadata.get(
                "source",
                "Unknown"
            )
        )

        page = metadata.get(
            "page",
            "Unknown"
        )

        # PyPDFLoader uses zero-based page numbers.
        if isinstance(page, int):
            display_page = page + 1
        else:
            display_page = page

        print(
            "Page:",
            display_page
        )

        print(
            "Mode:",
            metadata.get(
                "mode",
                "Unknown"
            )
        )

        print(
            "Document ID:",
            metadata.get(
                "document_id",
                "Unknown"
            )
        )

        content = document.page_content or ""

        print(
            "Content length:",
            len(content)
        )

        print("Content preview:")
        print(content[:700])

    print()
    print("=" * 60)

    return results