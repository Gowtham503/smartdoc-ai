# ============================================================
# Azure Deployment Guide - SmartDoc AI
# Deploy on: Azure Container Apps + Azure Database for PostgreSQL
# ============================================================

# STEP 1: Install Azure CLI
# Windows: Download from https://aka.ms/installazurecliwindows
# Mac: brew install azure-cli
# Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# STEP 2: Login to Azure
az login

# STEP 3: Create Resource Group
az group create --name smartdoc-rg --location eastus

# STEP 4: Create Azure Container Registry (ACR)
az acr create --resource-group smartdoc-rg \
  --name smartdocregistry --sku Basic

az acr login --name smartdocregistry

# STEP 5: Build and push Docker images
# Backend
docker build -t smartdoc-backend ./backend
docker tag smartdoc-backend smartdocregistry.azurecr.io/smartdoc-backend:latest
docker push smartdocregistry.azurecr.io/smartdoc-backend:latest

# Frontend
docker build -t smartdoc-frontend ./frontend
docker tag smartdoc-frontend smartdocregistry.azurecr.io/smartdoc-frontend:latest
docker push smartdocregistry.azurecr.io/smartdoc-frontend:latest

# STEP 6: Create Azure Database for PostgreSQL
az postgres flexible-server create \
  --resource-group smartdoc-rg \
  --name smartdoc-db \
  --location eastus \
  --admin-user postgres \
  --admin-password YOUR_PASSWORD \
  --sku-name Standard_B1ms \
  --tier Burstable

# Get connection string
az postgres flexible-server show-connection-string \
  --server-name smartdoc-db --database-name smartdoc \
  --admin-user postgres --admin-password YOUR_PASSWORD

# STEP 7: Deploy Backend to Azure Container Apps
az containerapp env create \
  --name smartdoc-env \
  --resource-group smartdoc-rg \
  --location eastus

az containerapp create \
  --name smartdoc-backend \
  --resource-group smartdoc-rg \
  --environment smartdoc-env \
  --image smartdocregistry.azurecr.io/smartdoc-backend:latest \
  --target-port 8000 \
  --ingress external \
  --env-vars \
    DATABASE_URL=YOUR_POSTGRES_CONNECTION_STRING \
    OPENAI_API_KEY=YOUR_OPENAI_KEY \
    AZURE_OPENAI_ENDPOINT=YOUR_AZURE_OPENAI_ENDPOINT

# STEP 8: Deploy Frontend to Azure Static Web Apps
# (Easiest for React frontend)
az staticwebapp create \
  --name smartdoc-frontend \
  --resource-group smartdoc-rg \
  --source https://github.com/YOUR_USERNAME/smartdoc-ai \
  --location eastus2 \
  --branch main \
  --app-location "/frontend" \
  --output-location "build"

# ============================================================
# AZURE FREE TIER CHECKLIST
# ============================================================
# ✅ Azure Container Apps - 180,000 vCPU-seconds free/month
# ✅ Azure Database PostgreSQL - 750 hours free (Burstable B1ms)
# ✅ Azure Static Web Apps - Free tier available
# ✅ Azure Container Registry - 1 free registry
# Total cost: ~$0-5/month on free tiers

# ============================================================
# RESUME BULLET POINT (copy this exactly!)
# ============================================================
# "Architected and deployed SmartDoc AI, a full-stack AI-powered
#  document analyzer using Python, FastAPI, React, PostgreSQL,
#  LangChain RAG pipelines, and REST APIs — deployed on both
#  AWS EC2 and Azure Container Apps with Docker containerization
#  and CI/CD pipeline integration"
