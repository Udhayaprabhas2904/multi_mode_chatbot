import os
import tempfile

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Form,
    HTTPException,
)

from app.rag.loader import load_pdf
from app.rag.chunker import split_documents
from app.rag.vectorstore import add_documents


router = APIRouter(
    prefix="/api",
    tags=["Documents"]
)


# ============================================================
# MAXIMUM PDF SIZE
# ============================================================

MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024


# ============================================================
# UPLOAD PDF
# ============================================================

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    mode: str = Form(...)
):

    print("\n========================================")
    print("STARTING PDF UPLOAD")
    print("========================================")

    # --------------------------------------------------------
    # Validate mode
    # --------------------------------------------------------

    if mode not in ["sales", "tutor"]:

        raise HTTPException(
            status_code=400,
            detail="Mode must be either 'sales' or 'tutor'."
        )

    print(f"Selected mode: {mode}")


    # --------------------------------------------------------
    # Validate filename
    # --------------------------------------------------------

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No filename was provided."
        )


    if not file.filename.lower().endswith(".pdf"):

        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported."
        )

    print(f"Filename: {file.filename}")


    # --------------------------------------------------------
    # Temporary file
    # --------------------------------------------------------

    total_size = 0
    temp_path = None


    try:

        # ====================================================
        # STEP 1: Save uploaded PDF
        # ====================================================

        print("\n[1/4] Saving PDF...")

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".pdf"
        ) as temp:

            temp_path = temp.name


            while True:

                data = await file.read(
                    1024 * 1024
                )

                if not data:
                    break


                total_size += len(data)


                if total_size > MAX_FILE_SIZE:

                    raise HTTPException(
                        status_code=413,
                        detail="Maximum PDF size is 1 GB."
                    )


                temp.write(data)


        print(
            f"PDF saved successfully "
            f"({total_size / (1024 * 1024):.2f} MB)"
        )


        # ====================================================
        # STEP 2: Read PDF
        # ====================================================

        print("\n[2/4] Reading PDF...")

        documents = load_pdf(
            temp_path
        )

        print(
            f"PDF loaded successfully. "
            f"Pages: {len(documents)}"
        )


        if not documents:

            raise HTTPException(
                status_code=400,
                detail="The PDF does not contain readable text."
            )


        # ====================================================
        # STEP 3: Split PDF into chunks
        # ====================================================

        print("\n[3/4] Creating text chunks...")

        chunks = split_documents(
            documents
        )

        print(
            f"Chunks created successfully: "
            f"{len(chunks)}"
        )


        if not chunks:

            raise HTTPException(
                status_code=400,
                detail="No readable text chunks were created from the PDF."
            )


        # ====================================================
        # STEP 4: Create embeddings and save to PostgreSQL
        # ====================================================

        print("\n[4/4] Creating Gemini embeddings...")

        try:

            add_documents(
                chunks,
                mode=mode,
                source=file.filename
            )

        except Exception as e:

            error_text = str(e)

            print("\n========================================")
            print("EMBEDDING / VECTORSTORE ERROR")
            print("========================================")
            print(error_text)
            print("========================================")


            # ----------------------------------------------
            # Gemini quota error
            # ----------------------------------------------

            if (
                "RESOURCE_EXHAUSTED" in error_text
                or "429" in error_text
                or "quota" in error_text.lower()
            ):

                raise HTTPException(
                    status_code=429,
                    detail=(
                        "Gemini embedding quota has been exceeded. "
                        "Please wait and try again. "
                        "If this continues, check your Gemini API "
                        "quota/billing settings."
                    )
                )


            # ----------------------------------------------
            # Other vector database errors
            # ----------------------------------------------

            raise HTTPException(
                status_code=500,
                detail=(
                    "Failed while creating embeddings or "
                    "saving documents to PostgreSQL. "
                    f"Error: {error_text}"
                )
            )


        # ====================================================
        # SUCCESS
        # ====================================================

        print("\n========================================")
        print("PDF UPLOAD SUCCESSFUL")
        print("========================================")


        return {
            "message": "PDF uploaded and indexed successfully.",
            "filename": file.filename,
            "mode": mode,
            "pages": len(documents),
            "chunks": len(chunks)
        }


    finally:

        # ----------------------------------------------------
        # Delete temporary PDF
        # ----------------------------------------------------

        if (
            temp_path
            and os.path.exists(temp_path)
        ):

            os.remove(temp_path)

            print("Temporary PDF deleted.")