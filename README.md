# 🧠 SmartDoc AI

**AI-Powered Document Analyzer using RAG + LLMs**

Built by **Gowtham Manikanta Chilukabathula** | M.S. Information Systems, University of Memphis

[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://postgresql.org)
[![AWS](https://img.shields.io/badge/Deployed-AWS-orange)](https://aws.amazon.com)
[![Azure](https://img.shields.io/badge/Deployed-Azure-blue)](https://azure.microsoft.com)

---

## 🚀 What It Does

SmartDoc AI lets you upload any PDF or text document and ask natural language questions about it. The system uses a **Retrieval-Augmented Generation (RAG)** pipeline to find the most relevant sections and generate accurate, source-cited answers.

**Live Demo:** `http://YOUR_EC2_IP:3000`
**API Docs:** `http://YOUR_EC2_IP:8000/docs`

---

## 🏗️ Architecture

```
User → React Frontend
         ↓
    FastAPI Backend (REST API)
         ↓
    LangChain RAG Pipeline
    ├── Document Loader (PDF/TXT)
    ├── Text Splitter (chunks)
    ├── HuggingFace Embeddings
    ├── FAISS Vector Store
    └── LLM (GPT-3.5/GPT-4)
         ↓
    PostgreSQL (document metadata + query history)
         ↓
    Deployed: AWS EC2 + Azure Container Apps
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, custom CSS |
| Backend | Python 3.11, FastAPI |
| AI/ML | LangChain, HuggingFace Embeddings, FAISS, OpenAI GPT |
| Database | PostgreSQL 15 |
| DevOps | Docker, Docker Compose, Nginx |
| Cloud | AWS EC2 + RDS / Azure Container Apps + PostgreSQL |

---

## ⚡ Quick Start (Local)

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/smartdoc-ai.git
cd smartdoc-ai

# 2. Add your OpenAI API key (optional - demo mode works without it)
echo "OPENAI_API_KEY=your_key_here" > .env

# 3. Run with Docker Compose
docker-compose up --build

# 4. Open browser
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/documents/upload` | Upload and process a document |
| GET | `/api/documents` | List all documents |
| POST | `/api/query` | Ask a question about a document |
| GET | `/api/documents/{id}/queries` | Get query history |
| DELETE | `/api/documents/{id}` | Delete a document |

---

## 🔑 Key Features

- **RAG Pipeline**: Splits documents into chunks, creates vector embeddings, retrieves semantically relevant context
- **Confidence Scoring**: Each answer includes a confidence percentage
- **Source Citations**: Shows exactly which document sections were used
- **Query History**: All queries stored in PostgreSQL for analysis
- **Demo Mode**: Works without OpenAI API key for testing
- **Docker Ready**: One command deployment with Docker Compose
- **Dual Cloud**: Deployed on both AWS and Azure

---

## 📊 What I Learned Building This

- Full-stack REST API development with FastAPI and React
- RAG (Retrieval-Augmented Generation) pipeline architecture
- Vector embeddings and FAISS vector store implementation
- Docker containerization and multi-service orchestration
- PostgreSQL schema design and query optimization
- AWS EC2 deployment and Nginx reverse proxy configuration
- Azure Container Apps and Static Web Apps deployment
- CI/CD pipeline setup for automated deployment

---

## 🚀 Deployment

See detailed guides:
- [AWS Deployment Guide](docs/DEPLOY_AWS.md)
- [Azure Deployment Guide](docs/DEPLOY_AZURE.md)

---

*Built as a portfolio project demonstrating full-stack AI engineering capabilities*
*Stack: Python + FastAPI + LangChain + React + PostgreSQL + Docker + AWS + Azure*
