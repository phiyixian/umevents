# UMEvents Deployment Script for Windows PowerShell
# Deploys backend to Cloud Run and frontend to Firebase Hosting

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting UMEvents deployment..." -ForegroundColor Cyan

$PROJECT_ID = "umevents-cd9d5"
$REGION = "asia-southeast1"
$BACKEND_SERVICE = "umevents-backend"

# Check if gcloud is installed
try {
    $null = Get-Command gcloud -ErrorAction Stop
} catch {
    Write-Host "⚠️  gcloud CLI not found. Please install Google Cloud SDK:" -ForegroundColor Yellow
    Write-Host "https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Check if firebase CLI is installed
try {
    $null = Get-Command firebase -ErrorAction Stop
} catch {
    Write-Host "⚠️  Firebase CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g firebase-tools
}

Write-Host "📦 Step 1: Building frontend..." -ForegroundColor Blue
Set-Location frontend
npm ci
npm run build
Set-Location ..

Write-Host "🐳 Step 2: Building Docker image for backend..." -ForegroundColor Blue
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${BACKEND_SERVICE} --project=${PROJECT_ID} backend/

Write-Host "☁️  Step 3: Deploying backend to Cloud Run..." -ForegroundColor Blue
# Note: You'll need to set environment variables manually or via --set-env-vars
gcloud run deploy ${BACKEND_SERVICE} `
  --image gcr.io/${PROJECT_ID}/${BACKEND_SERVICE} `
  --region ${REGION} `
  --project ${PROJECT_ID} `
  --allow-unauthenticated `
  --platform managed `
  --port 8080 `
  --memory 512Mi `
  --cpu 1

# Get the Cloud Run URL
$BACKEND_URL = gcloud run services describe ${BACKEND_SERVICE} --region ${REGION} --project ${PROJECT_ID} --format 'value(status.url)'

Write-Host "✅ Backend deployed to: $BACKEND_URL" -ForegroundColor Green
Write-Host "⚠️  Remember to:" -ForegroundColor Yellow
Write-Host "   1. Set environment variables in Cloud Run console" -ForegroundColor Yellow
Write-Host "   2. Update FRONTEND_URL in backend environment" -ForegroundColor Yellow
Write-Host "   3. Update VITE_API_URL in frontend/.env before building" -ForegroundColor Yellow

Write-Host "🔥 Step 4: Deploying frontend to Firebase Hosting..." -ForegroundColor Blue
firebase deploy --only hosting --project ${PROJECT_ID}

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "Backend URL: $BACKEND_URL" -ForegroundColor Blue
Write-Host "Frontend URL: https://${PROJECT_ID}.web.app" -ForegroundColor Blue

