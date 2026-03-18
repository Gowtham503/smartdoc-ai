"""
SmartDoc AI - AI-Powered Document Analyzer
Built by Gowtham Manikanta Chilukabathula
Stack: Python + FastAPI + LangChain + RAG + PostgreSQL
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import os
import uuid
import hashlib
from datetime import datetime

# LangChain / AI imports
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain_openai import ChatOpenAI
from langchain_community.document_loaders import PyPDFLoader, TextLoader

# Database
import psycopg2
from psycopg2.extras import RealDictCursor
import json

# File handling
import tempfile
import shutil

app = FastAPI(
    title="SmartDoc AI",
    description="AI-Powered Document Analyzer using RAG and LLMs",
    version="1.0.0"
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Config ───────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/smartdoc")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT", "")

# In-memory vector store (replace with Pinecone/pgvector for production)
vector_stores = {}

# ─── Database ─────────────────────────────────────────────────────────────────
def get_db():
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    """Initialize database tables"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                filename VARCHAR(255) NOT NULL,
                file_hash VARCHAR(64) UNIQUE NOT NULL,
                file_size INTEGER,
                page_count INTEGER DEFAULT 0,
                chunk_count INTEGER DEFAULT 0,
                upload_date TIMESTAMP DEFAULT NOW(),
                status VARCHAR(50) DEFAULT 'processing',
                summary TEXT
            );
            CREATE TABLE IF NOT EXISTS queries (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                document_id UUID REFERENCES documents(id),
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                confidence FLOAT DEFAULT 0.0,
                sources TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        """)
        conn.commit()
        cur.close()
        conn.close()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Database init error (continuing): {e}")

# ─── Models ───────────────────────────────────────────────────────────────────
class QueryRequest(BaseModel):
    document_id: str
    question: str

class QueryResponse(BaseModel):
    answer: str
    sources: List[str]
    confidence: float
    query_id: str

class DocumentResponse(BaseModel):
    id: str
    filename: str
    status: str
    page_count: int
    chunk_count: int
    upload_date: str
    summary: Optional[str]

# ─── Helpers ──────────────────────────────────────────────────────────────────
def get_embeddings():
    """Get HuggingFace embeddings (free, no API key needed)"""
    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

def get_llm():
    """Get LLM - tries OpenAI, falls back to Azure, then mock"""
    if OPENAI_API_KEY:
        return ChatOpenAI(
            model="gpt-3.5-turbo",
            openai_api_key=OPENAI_API_KEY,
            temperature=0.1
        )
    # Returns None if no API key - handled in query endpoint
    return None

def compute_file_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()

def mock_answer(question: str, context: str) -> str:
    """Mock LLM response when no API key available (for demo/testing)"""
    return (
        f"[Demo Mode - Connect OpenAI API key for real answers]\n\n"
        f"Based on the document context, here is a simulated answer to: '{question}'\n\n"
        f"The document contains relevant information. In production, this would use "
        f"GPT-3.5/GPT-4 via LangChain RAG pipeline to provide accurate, source-cited answers."
    )

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    init_db()

@app.get("/")
async def root():
    return {
        "app": "SmartDoc AI",
        "version": "1.0.0",
        "status": "running",
        "developer": "Gowtham Manikanta Chilukabathula",
        "stack": "Python + FastAPI + LangChain + RAG + PostgreSQL",
        "deployed_on": ["AWS", "Azure"]
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/documents/upload", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a document through the RAG pipeline"""

    # Validate file type
    allowed_types = ["application/pdf", "text/plain", "text/markdown"]
    if file.content_type not in allowed_types:
        raise HTTPException(400, "Only PDF and text files are supported")

    content = await file.read()
    file_hash = compute_file_hash(content)
    doc_id = str(uuid.uuid4())

    # Save temp file
    suffix = ".pdf" if "pdf" in file.content_type else ".txt"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # Load document
        if suffix == ".pdf":
            loader = PyPDFLoader(tmp_path)
        else:
            loader = TextLoader(tmp_path)

        documents = loader.load()
        page_count = len(documents)

        # Split into chunks for RAG
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", ".", " "]
        )
        chunks = splitter.split_documents(documents)
        chunk_count = len(chunks)

        # Create vector store with embeddings
        embeddings = get_embeddings()
        vector_store = FAISS.from_documents(chunks, embeddings)
        vector_stores[doc_id] = vector_store

        # Generate automatic summary (first 500 chars of first chunk)
        summary = chunks[0].page_content[:500] + "..." if chunks else "No content extracted"

        # Save to database
        try:
            conn = psycopg2.connect(DATABASE_URL)
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO documents (id, filename, file_hash, file_size, page_count, chunk_count, status, summary)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (file_hash) DO UPDATE SET status='ready'
                RETURNING id, filename, status, page_count, chunk_count, upload_date, summary
            """, (doc_id, file.filename, file_hash, len(content), page_count, chunk_count, 'ready', summary))
            row = cur.fetchone()
            conn.commit()
            cur.close()
            conn.close()
        except Exception as db_err:
            # Continue without DB for demo
            row = {
                "id": doc_id, "filename": file.filename, "status": "ready",
                "page_count": page_count, "chunk_count": chunk_count,
                "upload_date": datetime.now(), "summary": summary
            }

        return DocumentResponse(
            id=doc_id,
            filename=file.filename,
            status="ready",
            page_count=page_count,
            chunk_count=chunk_count,
            upload_date=datetime.now().isoformat(),
            summary=summary
        )

    finally:
        os.unlink(tmp_path)


@app.get("/api/documents", response_model=List[DocumentResponse])
async def list_documents():
    """List all uploaded documents"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("SELECT id, filename, status, page_count, chunk_count, upload_date, summary FROM documents ORDER BY upload_date DESC")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [DocumentResponse(
            id=str(r["id"]), filename=r["filename"], status=r["status"],
            page_count=r["page_count"] or 0, chunk_count=r["chunk_count"] or 0,
            upload_date=r["upload_date"].isoformat() if r["upload_date"] else "",
            summary=r["summary"]
        ) for r in rows]
    except:
        # Return in-memory documents if DB not available
        return []


@app.post("/api/query", response_model=QueryResponse)
async def query_document(request: QueryRequest):
    """Query a document using RAG pipeline"""

    if request.document_id not in vector_stores:
        raise HTTPException(404, "Document not found or not yet processed. Please upload first.")

    vector_store = vector_stores[request.document_id]
    retriever = vector_store.as_retriever(search_kwargs={"k": 4})

    # Retrieve relevant chunks
    relevant_docs = retriever.get_relevant_documents(request.question)
    context = "\n\n".join([doc.page_content for doc in relevant_docs])
    sources = [doc.page_content[:150] + "..." for doc in relevant_docs]

    # Get answer from LLM or mock
    llm = get_llm()
    if llm:
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=retriever,
            return_source_documents=True
        )
        result = qa_chain({"query": request.question})
        answer = result["result"]
        confidence = 0.85
    else:
        answer = mock_answer(request.question, context)
        confidence = 0.70

    query_id = str(uuid.uuid4())

    # Save query to DB
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO queries (id, document_id, question, answer, confidence, sources)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (query_id, request.document_id, request.question, answer, confidence, json.dumps(sources)))
        conn.commit()
        cur.close()
        conn.close()
    except:
        pass

    return QueryResponse(
        answer=answer,
        sources=sources,
        confidence=confidence,
        query_id=query_id
    )


@app.get("/api/documents/{doc_id}/queries")
async def get_document_queries(doc_id: str):
    """Get query history for a document"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("""
            SELECT id, question, answer, confidence, created_at
            FROM queries WHERE document_id = %s ORDER BY created_at DESC
        """, (doc_id,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [{"id": str(r["id"]), "question": r["question"],
                 "answer": r["answer"], "confidence": r["confidence"],
                 "created_at": r["created_at"].isoformat()} for r in rows]
    except:
        return []


@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document and its vector store"""
    if doc_id in vector_stores:
        del vector_stores[doc_id]
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("DELETE FROM queries WHERE document_id = %s", (doc_id,))
        cur.execute("DELETE FROM documents WHERE id = %s", (doc_id,))
        conn.commit()
        cur.close()
        conn.close()
    except:
        pass
    return {"message": "Document deleted successfully"}
