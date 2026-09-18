from langchain_text_splitters import RecursiveCharacterTextSplitter


def split_documents(documents):

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1500,
        chunk_overlap=150,
    )

    chunks = splitter.split_documents(documents)

    print(f"PDF pages loaded: {len(documents)}")
    print(f"Text chunks created: {len(chunks)}")

    return chunks