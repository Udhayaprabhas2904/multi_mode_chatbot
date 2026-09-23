Sure. Here is a **professional, emoji-free, single-block README.md** you can copy directly into your GitHub repository.

````markdown
# Multi-Mode RAG Chatbot

A document-grounded Retrieval-Augmented Generation (RAG) chatbot built with LangGraph, FastAPI, Google Gemini, PostgreSQL, and pgvector. The system supports two specialized modes: Sales Assistant and AI Tutor, allowing users to upload PDF documents and interact with their content through context-aware conversations.

## Features

- PDF document upload and processing
- Support for PDF files up to 1 GB
- Retrieval-Augmented Generation using uploaded documents
- Semantic document search using vector embeddings
- PostgreSQL with pgvector for vector storage and similarity search
- Local Hugging Face embeddings using `sentence-transformers/all-MiniLM-L6-v2`
- Google Gemini for response generation
- LangGraph-based workflow orchestration
- Sales Assistant mode
- AI Tutor mode
- Mode switching during the same conversation
- Metadata-based document filtering
- REST API support through FastAPI
- WebSocket support for real-time chat
- Document source and page references
- Read-aloud functionality
- Copy response functionality
- Responsive web interface
- Light and dark theme support

## Application Modes

### Sales Assistant

The Sales Assistant is designed to answer questions based on sales-related documents.

It can assist with:

- Product information
- Product features
- Pricing information
- Customer queries
- Policies and procedures
- Product comparisons
- Recommendations
- Frequently asked questions

### AI Tutor

The AI Tutor is designed to provide educational assistance based on uploaded learning materials.

It can assist with:

- Concept explanations
- Step-by-step explanations
- Study notes
- Examples
- Summaries
- Revision
- Practice questions
- Learning-oriented queries

Users can switch between Sales Assistant and AI Tutor modes at any time during a conversation.

## System Architecture

```text
User
 |
 v
Web Interface
 |
 v
FastAPI
 |
 v
LangGraph Workflow
 |
 +----------------------+
 |                      |
 v                      v
Sales Agent         Tutor Agent
 |                      |
 +----------+-----------+
            |
            v
     Document Retriever
            |
            v
    PostgreSQL + pgvector
            |
            v
       Relevant Context
            |
            v
        Gemini LLM
            |
            v
        Response
````

## LangGraph Workflow

```text
START
  |
  v
Query Analyzer
  |
  v
Document Retriever
  |
  v
Context Builder
  |
  v
Mode Router
  |
  +-------------------+
  |                   |
  v                   v
Sales Agent       Tutor Agent
  |                   |
  +---------+---------+
            |
            v
Response Validator
            |
            v
           END
```

## RAG Pipeline

The application follows a Retrieval-Augmented Generation pipeline.

### 1. Document Upload

The user uploads a PDF through the web interface.

### 2. Document Loading

The PDF is processed using PyPDF and converted into document objects.

### 3. Document Chunking

The extracted content is divided into smaller chunks to improve retrieval accuracy.

### 4. Embedding Generation

Document chunks are converted into vector representations using:

```text
sentence-transformers/all-MiniLM-L6-v2
```

### 5. Vector Storage

The embeddings and document metadata are stored in PostgreSQL using pgvector.

Example metadata includes:

```text
mode
source
document_id
page
```

### 6. Query Processing

The user's question is analyzed and passed to the retrieval layer.

### 7. Similarity Search

Relevant document chunks are retrieved using vector similarity search and filtered according to the selected mode.

### 8. Response Generation

The retrieved context is passed to the appropriate LangGraph agent, which uses Google Gemini to generate the response.

### 9. Response Validation

The generated response is validated and returned to the user with relevant document sources.

## Technology Stack

| Component               | Technology                         |
| ----------------------- | ---------------------------------- |
| Programming Language    | Python                             |
| Backend Framework       | FastAPI                            |
| Workflow                | LangGraph                          |
| RAG Framework           | LangChain                          |
| Large Language Model    | Google Gemini                      |
| Embeddings              | Hugging Face Sentence Transformers |
| Embedding Model         | all-MiniLM-L6-v2                   |
| Database                | PostgreSQL                         |
| Vector Search           | pgvector                           |
| PDF Processing          | PyPDF                              |
| Frontend                | HTML, CSS, JavaScript              |
| Real-Time Communication | WebSocket                          |
| Application Server      | Uvicorn                            |
| Configuration           | python-dotenv                      |

## Project Structure

```text
multi_mode_rag/
│
├── app/
│   ├── __init__.py
│   ├── main.py
│   │
│   ├── graph/
│   │   ├── __init__.py
│   │   ├── state.py
│   │   ├── workflow.py
│   │   ├── router.py
│   │   └── nodes.py
│   │
│   ├── rag/
│   │   ├── __init__.py
│   │   ├── loader.py
│   │   ├── chunker.py
│   │   ├── embeddings.py
│   │   ├── retriever.py
│   │   └── vectorstore.py
│   │
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── sales_agent.py
│   │   └── tutor_agent.py
│   │
│   ├── prompts/
│   │   ├── __init__.py
│   │   ├── sales_prompt.py
│   │   └── tutor_prompt.py
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── chat.py
│   │   ├── documents.py
│   │   └── websocket.py
│   │
│   └── models/
│       ├── __init__.py
│       └── schemas.py
│
├── documents/
│   ├── sales/
│   └── education/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── tests/
│
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .env
└── README.md
```

## Installation

### Prerequisites

Install the following before running the project:

* Python 3.10 or later
* PostgreSQL
* PostgreSQL pgvector extension
* Git
* Google Gemini API key

### Clone the Repository

```bash
git clone https://github.com/Udhayaprabhas2904/multi_mode_rag_chatbot.git
cd multi_mode_rag_chatbot
```

### Create a Virtual Environment

Windows:

```powershell
python -m venv venv
venv\Scripts\activate
```

Linux or macOS:

```bash
python3 -m venv venv
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

If required:

```bash
pip install sentence-transformers langchain-huggingface
```

## PostgreSQL Configuration

Create a PostgreSQL database for the application.

Example configuration:

```text
Database: multi_mode_rag
Host: localhost
Port: 5432
Username: postgres
```

Ensure that the pgvector extension is installed and available in the PostgreSQL database.

## Environment Configuration

Create a `.env` file in the project root:

```env
GOOGLE_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash-lite
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/multi_mode_rag
MAX_FILE_SIZE=1073741824
```

Do not commit the `.env` file or API keys to GitHub.

## Running the Application

Start the FastAPI server:

```bash
uvicorn app.main:app --reload
```

Open the application:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/health
```

## API Endpoints

| Method    | Endpoint                | Description             |
| --------- | ----------------------- | ----------------------- |
| GET       | `/`                     | Web application         |
| GET       | `/health`               | Health check            |
| GET       | `/api`                  | API information         |
| GET       | `/api/documents`        | List uploaded documents |
| POST      | `/api/documents/upload` | Upload and index a PDF  |
| POST      | `/api/chat`             | Send a chat request     |
| WebSocket | `/ws/chat`              | Real-time chat          |

## Usage

### Upload a Document

1. Open the application.
2. Select a PDF document.
3. Select the appropriate document type.
4. Click `Upload & Index PDF`.
5. Wait for the document to be processed successfully.

### Select a Mode

Choose one of the available modes:

```text
Sales Assistant
```

or

```text
AI Tutor
```

### Ask Questions

Example Sales Assistant query:

```text
What are the key features of this product?
```

Example AI Tutor query:

```text
What is Artificial Intelligence?
```

### Switch Modes

The user can switch between Sales Assistant and AI Tutor during the same conversation. Each message is processed according to the currently selected mode.

## Metadata-Based Retrieval

The application uses a single PostgreSQL and pgvector database while separating documents through metadata.

Sales documents use:

```text
mode = sales
```

Educational documents use:

```text
mode = tutor
```

The retriever applies the selected mode as a metadata filter before performing similarity search.

This allows both assistants to use the same vector database while retrieving only the relevant category of documents.

## Security Considerations

* Store API keys in environment variables.
* Do not commit `.env` files.
* Validate uploaded file types.
* Enforce file size limits.
* Sanitize user-generated and model-generated content before rendering HTML.
* Implement authentication before exposing the application publicly.
* Apply appropriate authorization for user-specific documents in multi-user deployments.

## Future Improvements

* User authentication and authorization
* Persistent conversation history
* Multi-user document isolation
* Background document processing
* Streaming model responses
* Improved document management
* Hybrid search
* RAG evaluation and monitoring
* Conversation export
* Production deployment
* Additional assistant modes

## Project Objective

The objective of this project is to demonstrate a multi-mode Retrieval-Augmented Generation system using LangGraph, where document retrieval, mode-based routing, specialized agents, context construction, and response validation are integrated into a single conversational workflow.

## Author

Udhayaprabha S

GitHub:
[https://github.com/Udhayaprabhas2904](https://github.com/Udhayaprabhas2904)

## License

This project is intended for educational and development purposes.

```
```
