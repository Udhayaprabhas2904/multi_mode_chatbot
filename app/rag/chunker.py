from langchain_text_splitters import RecursiveCharacterTextSplitter


def split_documents(documents):

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1500,
        chunk_overlap=150,
        separators=[
            "\n\n",
            "\n",
            ". ",
            " ",
            ""
        ],
    )

    chunks = splitter.split_documents(documents)

    print()
    print("=" * 60)
    print("CHUNKING DOCUMENT")
    print("=" * 60)

    print(f"PDF pages loaded   : {len(documents)}")
    print(f"Text chunks created: {len(chunks)}")

    print()
    print("CHUNK PREVIEW")
    print("-" * 60)

    for index, chunk in enumerate(chunks, start=1):

        metadata = chunk.metadata or {}

        page = metadata.get("page", "Unknown")
        content = chunk.page_content.strip()

        print()
        print(f"--- CHUNK {index} ---")
        print(f"Page          : {page}")
        print(f"Content length: {len(content)}")
        print(f"Content       : {content[:300]}")

    print()
    print("=" * 60)

    return chunks