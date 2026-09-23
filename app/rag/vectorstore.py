import os

from dotenv import load_dotenv
from langchain_postgres import PGVector

from app.rag.embeddings import get_embeddings


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL is missing from your .env file."
    )


# =========================================================
# VECTOR COLLECTION
# =========================================================

COLLECTION_NAME = "multi_mode_documents_local"


# =========================================================
# GET VECTORSTORE
# =========================================================

def get_vectorstore():

    print()
    print("=" * 60)
    print("CONNECTING TO POSTGRESQL + PGVECTOR")
    print("=" * 60)

    print(
        f"Collection: {COLLECTION_NAME}"
    )

    print(
        "Embedding model: "
        "sentence-transformers/all-MiniLM-L6-v2"
    )

    vectorstore = PGVector(
        embeddings=get_embeddings(),
        collection_name=COLLECTION_NAME,
        connection=DATABASE_URL,
        use_jsonb=True,
    )

    print(
        "PostgreSQL + pgvector connection ready."
    )

    print("=" * 60)

    return vectorstore


# =========================================================
# ADD DOCUMENTS
# =========================================================

def add_documents(
    documents,
    mode,
    source,
    document_id,
    batch_size=25,
):

    if not documents:
        raise ValueError(
            "No documents were provided for indexing."
        )

    if mode not in {"sales", "tutor"}:
        raise ValueError(
            "Invalid mode. "
            "Mode must be 'sales' or 'tutor'."
        )

    if not document_id:
        raise ValueError(
            "document_id is required for indexing."
        )

    document_id = str(document_id)

    if not source:
        raise ValueError(
            "source is required for indexing."
        )

    print()
    print("=" * 60)
    print("PREPARING DOCUMENTS FOR VECTOR STORAGE")
    print("=" * 60)

    print(f"Documents   : {len(documents)}")
    print(f"Mode        : {mode}")
    print(f"Source      : {source}")
    print(f"Document ID : {document_id}")
    print(f"Collection  : {COLLECTION_NAME}")

    print("=" * 60)


    # =====================================================
    # ADD METADATA
    # =====================================================

    for document in documents:

        if document.metadata is None:
            document.metadata = {}

        document.metadata["mode"] = mode
        document.metadata["source"] = source
        document.metadata["document_id"] = document_id


    # =====================================================
    # CREATE VECTORSTORE
    # =====================================================

    vectorstore = get_vectorstore()


    # =====================================================
    # PREVENT DUPLICATE DOCUMENT ID
    # =====================================================

    try:

        existing = vectorstore.similarity_search(
            documents[0].page_content,
            k=20,
            filter={
                "document_id": document_id
            }
        )

        if existing:

            print()
            print("=" * 60)
            print("DUPLICATE DOCUMENT DETECTED")
            print("=" * 60)

            print(
                f"Document ID already exists: "
                f"{document_id}"
            )

            print(
                "Skipping vector indexing."
            )

            print("=" * 60)

            return

    except Exception as error:

        print(
            "Duplicate check warning:",
            str(error)
        )

        print(
            "Continuing with indexing..."
        )


    # =====================================================
    # CALCULATE BATCHES
    # =====================================================

    total = len(documents)

    total_batches = (
        (total + batch_size - 1)
        // batch_size
    )

    print()
    print(
        f"Total documents : {total}"
    )

    print(
        f"Batch size      : {batch_size}"
    )

    print(
        f"Total batches   : {total_batches}"
    )


    # =====================================================
    # PROCESS BATCHES
    # =====================================================

    for start in range(
        0,
        total,
        batch_size
    ):

        end = min(
            start + batch_size,
            total
        )

        batch = documents[start:end]

        batch_number = (
            start // batch_size
        ) + 1

        print()
        print("-" * 60)

        print(
            f"Embedding batch "
            f"{batch_number}/{total_batches}"
        )

        print(
            f"Documents: "
            f"{start + 1}-{end} of {total}"
        )

        print(
            f"Document ID: {document_id}"
        )

        print("-" * 60)


        # =================================================
        # INSERT BATCH
        # =================================================

        try:

            vectorstore.add_documents(
                batch
            )

            print(
                f"Batch {batch_number} "
                "completed successfully."
            )

        except Exception as error:

            print()
            print("=" * 60)
            print("VECTORSTORE ERROR")
            print("=" * 60)

            print(
                "Error type:",
                type(error).__name__
            )

            print(
                "Error message:",
                str(error)
            )

            print(
                f"Batch: "
                f"{batch_number}/{total_batches}"
            )

            print(
                f"Document ID: "
                f"{document_id}"
            )

            print("=" * 60)

            raise


    # =====================================================
    # COMPLETE
    # =====================================================

    print()
    print("=" * 60)
    print("VECTOR INDEXING COMPLETED")
    print("=" * 60)

    print(
        f"Successfully indexed: "
        f"{total} chunks"
    )

    print(
        f"Mode       : {mode}"
    )

    print(
        f"Source     : {source}"
    )

    print(
        f"Document ID: {document_id}"
    )

    print(
        f"Collection : {COLLECTION_NAME}"
    )

    print("=" * 60)