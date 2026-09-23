import os
import shutil
import tempfile
import uuid
from pathlib import Path

import psycopg
from dotenv import load_dotenv
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



# ENVIRONMENT


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL is missing from your .env file."
    )



# DATABASE URL


def get_psycopg_database_url():
    """
    Convert SQLAlchemy-style PostgreSQL URL into a
    psycopg-compatible URL.

    Example:
    postgresql+psycopg://...
    becomes:
    postgresql://...
    """

    if DATABASE_URL.startswith(
        "postgresql+psycopg://"
    ):
        return DATABASE_URL.replace(
            "postgresql+psycopg://",
            "postgresql://",
            1,
        )

    return DATABASE_URL


PSYCOPG_DATABASE_URL = get_psycopg_database_url()



# PROJECT DIRECTORIES


BASE_DIR = Path(__file__).resolve().parent.parent.parent

DOCUMENTS_DIR = BASE_DIR / "documents"

SALES_DOCUMENTS_DIR = DOCUMENTS_DIR / "sales"

TUTOR_DOCUMENTS_DIR = DOCUMENTS_DIR / "education"


# Create folders if they do not exist

SALES_DOCUMENTS_DIR.mkdir(
    parents=True,
    exist_ok=True,
)

TUTOR_DOCUMENTS_DIR.mkdir(
    parents=True,
    exist_ok=True,
)



# ROUTER


router = APIRouter(
    prefix="/api/documents",
    tags=["Documents"],
)



# MAXIMUM PDF SIZE
MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024



# DATABASE TABLE
def create_documents_table():
    """
    Create the uploaded_documents table if it does not exist.
    """

    print(
        "Checking uploaded_documents table..."
    )

    try:

        with psycopg.connect(
            PSYCOPG_DATABASE_URL
        ) as connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS uploaded_documents (
                        id UUID PRIMARY KEY,

                        filename TEXT NOT NULL,

                        mode TEXT NOT NULL
                            CHECK (mode IN ('sales', 'tutor')),

                        file_size BIGINT NOT NULL,

                        pages INTEGER DEFAULT 0,

                        chunks INTEGER DEFAULT 0,

                        status TEXT NOT NULL
                            DEFAULT 'indexed',

                        file_path TEXT,

                        created_at TIMESTAMP
                            DEFAULT CURRENT_TIMESTAMP
                    )
                    """
                )

            connection.commit()

        print(
            "uploaded_documents table ready."
        )

    except Exception as error:

        print(
            "Could not create uploaded_documents table:"
        )

        print(
            type(error).__name__,
            str(error),
        )

        raise



# INITIALIZE DATABASE TABLE
create_documents_table()



# GET UPLOADED DOCUMENTS
@router.get("")
async def get_documents():
    """
    Return all uploaded documents.

    This endpoint is used by the frontend
    Uploaded Documents panel.
    """

    print()
    
    print("LOADING UPLOADED DOCUMENTS")
   

    try:

        with psycopg.connect(
            PSYCOPG_DATABASE_URL
        ) as connection:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT
                        id,
                        filename,
                        mode,
                        file_size,
                        pages,
                        chunks,
                        status,
                        created_at
                    FROM uploaded_documents
                    ORDER BY created_at DESC
                    """
                )

                rows = cursor.fetchall()


        documents = []


        for row in rows:

            (
                document_id,
                filename,
                mode,
                file_size,
                pages,
                chunks,
                status,
                created_at,
            ) = row


            documents.append(
                {
                    "id": str(document_id),

                    "document_id": str(
                        document_id
                    ),

                    "filename": filename,

                    "mode": mode,

                    "file_size": file_size,

                    "pages": pages,

                    "chunks": chunks,

                    "status": status,

                    "created_at": (
                        created_at.isoformat()
                        if created_at
                        else None
                    ),
                }
            )


        print(
            f"Documents found: {len(documents)}"
        )

   


        return {
            "documents": documents
        }


    except Exception as error:

        print()
        print(
            "DOCUMENT LIST ERROR"
        )

        print(
            "Error type:",
            type(error).__name__,
        )

        print(
            "Error message:",
            str(error),
        )

       


        raise HTTPException(
            status_code=500,
            detail=(
                "Could not load uploaded documents."
            ),
        )



# UPLOAD PDF


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    mode: str = Form(...),
):

    print()
  
    print("STARTING PDF UPLOAD")
 


    # VALIDATE MODE
    

    if mode not in [
        "sales",
        "tutor",
    ]:

        raise HTTPException(
            status_code=400,
            detail=(
                "Mode must be either "
                "'sales' or 'tutor'."
            ),
        )


    print(
        f"Selected mode: {mode}"
    )


    
    # VALIDATE FILENAME
    

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail=(
                "No filename was provided."
            ),
        )


    original_filename = Path(
        file.filename
    ).name


    if not original_filename.lower().endswith(
        ".pdf"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Only PDF files are supported."
            ),
        )


    print(
        f"Filename: {original_filename}"
    )


    
    # CREATE DOCUMENT ID
   

    document_id = uuid.uuid4()

    print(
        f"Document ID: {document_id}"
    )


    
    # SELECT PERMANENT STORAGE DIRECTORY
    

    if mode == "sales":

        permanent_directory = (
            SALES_DOCUMENTS_DIR
        )

    else:

        permanent_directory = (
            TUTOR_DOCUMENTS_DIR
        )


    permanent_path = (
        permanent_directory
        / f"{document_id}.pdf"
    )


    
    # TEMPORARY FILE
    

    total_size = 0

    temp_path = None


    try:

        
        # STEP 1: SAVE PDF TEMPORARILY
       

        print()
        print(
            "[1/5] Saving PDF..."
        )


        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".pdf",
        ) as temp:

            temp_path = temp.name


            while True:

                data = await file.read(
                    1024 * 1024
                )


                if not data:

                    break


                total_size += len(data)


               
                # 1 GB LIMIT
               

                if total_size > MAX_FILE_SIZE:

                    raise HTTPException(
                        status_code=413,
                        detail=(
                            "Maximum PDF size is 1 GB."
                        ),
                    )


                temp.write(data)


        print(
            "PDF saved successfully "
            f"({total_size / (1024 * 1024):.2f} MB)"
        )


       
        # STEP 2: READ PDF
      

        print()
        print(
            "[2/5] Reading PDF..."
        )


        try:

            documents = load_pdf(
                temp_path
            )

        except Exception as error:

            print(
                "PDF loading error:",
                str(error),
            )

            raise HTTPException(
                status_code=400,
                detail=(
                    "Could not read the PDF. "
                    "Please make sure the PDF is valid "
                    "and contains readable content."
                ),
            )


        print(
            "PDF loaded successfully. "
            f"Pages: {len(documents)}"
        )


        if not documents:

            raise HTTPException(
                status_code=400,
                detail=(
                    "The PDF does not contain "
                    "readable text."
                ),
            )


       
        # STEP 3: CREATE CHUNKS
        
        print()
        print(
            "[3/5] Creating text chunks..."
        )


        try:

            chunks = split_documents(
                documents
            )

        except Exception as error:

            print(
                "Chunking error:",
                str(error),
            )

            raise HTTPException(
                status_code=500,
                detail=(
                    "Failed to split the PDF "
                    "into text chunks."
                ),
            )


        print(
            "Chunks created successfully: "
            f"{len(chunks)}"
        )


        if not chunks:

            raise HTTPException(
                status_code=400,
                detail=(
                    "No readable text chunks were "
                    "created from the PDF."
                ),
            )


        
        # STEP 4: CREATE EMBEDDINGS + STORE VECTORS
       

        print()
        print(
            "[4/5] Creating embeddings "
            "and storing vectors..."
        )


        try:

            add_documents(
                chunks,
                mode=mode,
                source=original_filename,
                document_id=document_id,
            )


        except Exception as error:

            error_text = str(error)


            print()
           
            print("VECTORSTORE ERROR")
            
            print(
                "Error type:",
                type(error).__name__,
            )

            print(
                "Error message:",
                error_text,
            )

           

            # GEMINI QUOTA ERROR
            

            if (
                "RESOURCE_EXHAUSTED"
                in error_text
                or "429"
                in error_text
                or "quota"
                in error_text.lower()
            ):

                raise HTTPException(
                    status_code=429,
                    detail=(
                        "Embedding quota has been exceeded. "
                        "Please try again later."
                    ),
                )


           
            # POSTGRESQL CONNECTION ERROR
           

            if (
                "connection"
                in error_text.lower()
                and (
                    "timeout"
                    in error_text.lower()
                    or "refused"
                    in error_text.lower()
                )
            ):

                raise HTTPException(
                    status_code=503,
                    detail=(
                        "Could not connect to PostgreSQL. "
                        "Please make sure the PostgreSQL "
                        "Docker container is running."
                    ),
                )


           
            # OTHER VECTORSTORE ERROR
          

            raise HTTPException(
                status_code=500,
                detail=(
                    "Failed while creating embeddings "
                    "or saving the document to PostgreSQL."
                ),
            )


       
        # STEP 5: PERMANENTLY STORE ORIGINAL PDF
       

        print()
        print(
            "[5/5] Storing uploaded PDF..."
        )


        try:

            shutil.copy2(
                temp_path,
                permanent_path,
            )

        except Exception as error:

            print(
                "Permanent PDF storage error:",
                str(error),
            )


            raise HTTPException(
                status_code=500,
                detail=(
                    "The PDF was indexed, but the "
                    "original PDF could not be stored."
                ),
            )


        print(
            "PDF stored at:",
            permanent_path,
        )


       
        # SAVE DOCUMENT METADATA
       
        print()
        print(
            "Saving document metadata..."
        )


        try:

            with psycopg.connect(
                PSYCOPG_DATABASE_URL
            ) as connection:

                with connection.cursor() as cursor:

                    cursor.execute(
                        """
                        INSERT INTO uploaded_documents
                        (
                            id,
                            filename,
                            mode,
                            file_size,
                            pages,
                            chunks,
                            status,
                            file_path
                        )
                        VALUES
                        (
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s
                        )
                        """,
                        (
                            document_id,
                            original_filename,
                            mode,
                            total_size,
                            len(documents),
                            len(chunks),
                            "indexed",
                            str(permanent_path),
                        ),
                    )


                connection.commit()


        except Exception as error:

            print(
                "Database metadata error:",
                str(error),
            )


         
            # Remove permanent PDF if metadata fails
            

            if permanent_path.exists():

                try:

                    permanent_path.unlink()

                except Exception:

                    pass


            raise HTTPException(
                status_code=500,
                detail=(
                    "The PDF was indexed, but its "
                    "document information could not "
                    "be saved."
                ),
            )


        
        # SUCCESS
       

        print()
        
        print("PDF UPLOAD SUCCESSFUL")
        

        print(
            f"Filename     : {original_filename}"
        )

        print(
            f"Document ID  : {document_id}"
        )

        print(
            f"Mode         : {mode}"
        )

        print(
            f"Pages        : {len(documents)}"
        )

        print(
            f"Chunks       : {len(chunks)}"
        )

        print(
            f"File size    : "
            f"{total_size / (1024 * 1024):.2f} MB"
        )

        print(
            f"Stored file  : {permanent_path}"
        )

       


        
        # RESPONSE
       

        return {

            "success": True,

            "message": (
                "PDF uploaded and indexed successfully."
            ),

            "document_id": str(
                document_id
            ),

            "filename": (
                original_filename
            ),

            "mode": mode,

            "pages": len(documents),

            "chunks": len(chunks),

            "file_size": total_size,

            "status": "indexed",

        }


   
    # CLEANUP TEMPORARY FILE
    
    finally:

        if (
            temp_path
            and os.path.exists(temp_path)
        ):

            try:

                os.remove(
                    temp_path
                )

                print(
                    "Temporary PDF deleted."
                )

            except Exception as error:

                print(
                    "Could not delete temporary PDF:",
                    error,
                )