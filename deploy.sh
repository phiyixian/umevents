#!/bin/bash

# UMEvents Deployment Script
# Deploys backend to Cloud Run and frontend to Firebase Hosting

set -e  # Exit on error

echo "🚀 Starting UMEvents deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${YELLOW}⚠️  gcloud CLI not found. Please install Google Cloud SDK:${NC}"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Firebase CLI not found. Installing...${NC}"
    npm install -g firebase-tools
fi

PROJECT_ID="umevents-cd9d5"
REGION="asia-southeast1"
BACKEND_SERVICE="umevents-backend"

echo -e "${BLUE}📦 Step 1: Building frontend...${NC}"
cd frontend
npm ci
npm run build
cd ..

echo -e "${BLUE}🐳 Step 2: Building Docker image for backend...${NC}"
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${BACKEND_SERVICE} --project=${PROJECT_ID} backend/

echo -e "${BLUE}☁️  Step 3: Deploying backend to Cloud Run...${NC}"
# Note: You'll need to set environment variables manually or via --set-env-vars
gcloud run deploy ${BACKEND_SERVICE} \
  --image gcr.io/${PROJECT_ID}/${BACKEND_SERVICE} \
  --region ${REGION} \
  --project ${PROJECT_ID} \
  --allow-unauthenticated \
  --platform managed \
  --port 8080 \
  --memory 512Mi \
  --cpu 1

# Get the Cloud Run URL
BACKEND_URL=$(gcloud run services describe ${BACKEND_SERVICE} --region ${REGION} --project ${PROJECT_ID} --format 'value(status.url)')

echo -e "${GREEN}✅ Backend deployed to: ${BACKEND_URL}${NC}"
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo "   1. Set environment variables in Cloud Run console"
echo "   2. Update FRONTEND_URL in backend environment"
echo "   3. Update VITE_API_URL in frontend/.env before building"

echo -e "${BLUE}🔥 Step 4: Deploying frontend to Firebase Hosting...${NC}"
firebase deploy --only hosting --project ${PROJECT_ID}

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${BLUE}Backend URL: ${BACKEND_URL}${NC}"
echo -e "${BLUE}Frontend URL: https://${PROJECT_ID}.web.app${NC}"

