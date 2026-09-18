import os
import time

from dotenv import load_dotenv
from langchain_postgres import PGVector

from app.rag.embeddings import get_embeddings


# ---------------------------------------------------------
# Load environment variables
# ---------------------------------------------------------

load_dotenv()


# ---------------------------------------------------------
# Database configuration
# ---------------------------------------------------------

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL is missing from your .env file."
    )


# ---------------------------------------------------------
# Vector collection name
# ---------------------------------------------------------

COLLECTION_NAME = "multi_mode_documents"


# ---------------------------------------------------------
# Create / connect to PGVector
# ---------------------------------------------------------

def get_vectorstore():
    """
    Create a connection to PostgreSQL + pgvector.
    """

    print("Connecting to PostgreSQL + pgvector...")

    vectorstore = PGVector(
        embeddings=get_embeddings(),
        collection_name=COLLECTION_NAME,
        connection=DATABASE_URL,
        use_jsonb=True,
    )

    print("PostgreSQL + pgvector connection ready.")

    return vectorstore


# ---------------------------------------------------------
# Add documents to vector database
# ---------------------------------------------------------

def add_documents(
    documents,
    mode,
    source,
    batch_size=25,
):
    """
    Embed documents and store them in PostgreSQL + pgvector.

    Parameters
    ----------
    documents:
        List of LangChain Document objects.

    mode:
        Either "sales" or "tutor".

    source:
        Original PDF filename.

    batch_size:
        Number of chunks processed per batch.
    """

    # -----------------------------------------------------
    # Validate documents
    # -----------------------------------------------------

    if not documents:
        raise ValueError(
            "No documents were provided for indexing."
        )


    # -----------------------------------------------------
    # Validate mode
    # -----------------------------------------------------

    if mode not in {"sales", "tutor"}:
        raise ValueError(
            "Invalid mode. Mode must be 'sales' or 'tutor'."
        )


    # -----------------------------------------------------
    # Add metadata
    # -----------------------------------------------------

    print(
        f"Preparing {len(documents)} documents "
        f"for vector storage..."
    )

    for document in documents:

        if document.metadata is None:
            document.metadata = {}

        document.metadata["mode"] = mode
        document.metadata["source"] = source


    # -----------------------------------------------------
    # Create vector store
    # -----------------------------------------------------

    vectorstore = get_vectorstore()


    # -----------------------------------------------------
    # Batch calculation
    # -----------------------------------------------------

    total = len(documents)

    total_batches = (
        (total + batch_size - 1)
        // batch_size
    )


    print(f"Total documents: {total}")
    print(f"Batch size: {batch_size}")
    print(f"Total batches: {total_batches}")


    # -----------------------------------------------------
    # Process batches
    # -----------------------------------------------------

    for start in range(0, total, batch_size):

        end = min(
            start + batch_size,
            total
        )

        batch = documents[start:end]

        batch_number = (
            start // batch_size
        ) + 1


        print()
       
        print(
            f"Embedding batch "
            f"{batch_number}/{total_batches}"
        )
        print(
            f"Documents: "
            f"{start + 1}-{end} of {total}"
        )
        


        # -------------------------------------------------
        # Retry configuration
        # -------------------------------------------------

        max_retries = 5

        batch_completed = False


        # -------------------------------------------------
        # Retry loop
        # -------------------------------------------------

        for attempt in range(
            1,
            max_retries + 1
        ):

            try:

                print(
                    f"Attempt "
                    f"{attempt}/{max_retries}"
                )


                # -----------------------------------------
                # Insert batch
                # -----------------------------------------

                vectorstore.add_documents(
                    batch
                )


                print(
                    f"Batch "
                    f"{batch_number} "
                    f"completed successfully."
                )


                batch_completed = True

                break


            except Exception as e:

                error_text = str(e)


                # -----------------------------------------
                # Detect Gemini quota errors
                # -----------------------------------------

                is_quota_error = (
                    "RESOURCE_EXHAUSTED"
                    in error_text
                    or "429"
                    in error_text
                    or "quota"
                    in error_text.lower()
                )


                # -----------------------------------------
                # Non-quota error
                # -----------------------------------------

                if not is_quota_error:

                    print()
                   
                    print("VECTORSTORE ERROR")
                    
                    print(error_text)
                    

                    raise


                # -----------------------------------------
                # Quota error
                # -----------------------------------------

                print()
                print(
                    "Gemini embedding quota reached."
                )

                print(
                    f"Attempt "
                    f"{attempt}/{max_retries}"
                )


                # -----------------------------------------
                # Maximum retries reached
                # -----------------------------------------

                if attempt == max_retries:

                    print(
                        "Maximum retry attempts reached."
                    )

                    raise


                # -----------------------------------------
                # Wait before retry
                # -----------------------------------------

                wait_time = 60 * attempt

                print(
                    f"Waiting "
                    f"{wait_time} seconds "
                    f"before retry..."
                )

                time.sleep(wait_time)


        # -------------------------------------------------
        # Make sure batch succeeded
        # -------------------------------------------------

        if not batch_completed:

            raise RuntimeError(
                f"Batch {batch_number} "
                f"could not be indexed."
            )


        # -------------------------------------------------
        # Delay between batches
        # -------------------------------------------------

        if end < total:

            print(
                "Waiting 5 seconds "
                "before processing "
                "the next batch..."
            )

            time.sleep(5)


    # -----------------------------------------------------
    # Finished
    # -----------------------------------------------------

    print()
    
    print(
        f"Successfully indexed "
        f"{total} documents."
    )
    print(f"Mode: {mode}")
    print(f"Source: {source}")
    