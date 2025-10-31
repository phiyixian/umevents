# Quick Deployment Guide

This guide will help you deploy UMEvents to production using Google Cloud Run (backend) and Firebase Hosting (frontend).

## Prerequisites

1. **Google Cloud SDK** installed and authenticated
   ```bash
   # Install: https://cloud.google.com/sdk/docs/install
   gcloud auth login
   gcloud config set project umevents-cd9d5
   ```

2. **Firebase CLI** installed and authenticated
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

3. **Environment Variables** ready:
   - Backend `.env` file with all required variables
   - Frontend `.env` file with Firebase config and API URL

## Quick Deploy (Automated)

### Windows (PowerShell)
```powershell
.\deploy.ps1
```

### Linux/Mac
```bash
chmod +x deploy.sh
./deploy.sh
```

## Manual Deploy (Step by Step)

### Step 1: Build Frontend

```bash
cd frontend
npm ci
npm run build
cd ..
```

**Important:** Before building, make sure your `frontend/.env` file has:
```env
VITE_API_URL=https://YOUR_CLOUD_RUN_URL/api
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=umevents-cd9d5.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=umevents-cd9d5
VITE_FIREBASE_STORAGE_BUCKET=umevents-cd9d5.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Step 2: Deploy Backend to Cloud Run

```bash
# Build Docker image
gcloud builds submit --tag gcr.io/umevents-cd9d5/umevents-backend backend/

# Deploy to Cloud Run
gcloud run deploy umevents-backend \
  --image gcr.io/umevents-cd9d5/umevents-backend \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --platform managed \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars "PORT=8080,FIREBASE_PROJECT_ID=umevents-cd9d5,FRONTEND_URL=https://umevents-cd9d5.web.app"
```

**Add all backend environment variables:**

You'll need to set all environment variables. You can do this via:

**Option A: Via gcloud command (for each variable):**
```bash
gcloud run services update umevents-backend \
  --region asia-southeast1 \
  --set-env-vars "FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n,FIREBASE_CLIENT_EMAIL=...,TOYYIBPAY_SECRET_KEY=..."
```

**Option B: Via Cloud Console (Recommended):**
1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click on `umevents-backend` service
3. Click "EDIT & DEPLOY NEW REVISION"
4. Go to "Variables & Secrets" tab
5. Add all your environment variables from `backend/.env`

**Required Backend Environment Variables:**
- `PORT=8080`
- `NODE_ENV=production`
- `FIREBASE_PROJECT_ID=umevents-cd9d5`
- `FIREBASE_PRIVATE_KEY` (full key with `\n` for newlines)
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_CLIENT_ID`
- `FIREBASE_CLIENT_X509_CERT_URL`
- `FIREBASE_STORAGE_BUCKET=umevents-cd9d5.appspot.com`
- `FRONTEND_URL=https://umevents-cd9d5.web.app` (update after frontend deploy)
- `TOYYIBPAY_SECRET_KEY`
- `ADMIN_EMAILS` (comma-separated list of admin emails)

**Get your Cloud Run URL:**
```bash
gcloud run services describe umevents-backend \
  --region asia-southeast1 \
  --format 'value(status.url)'
```

Copy this URL - you'll need it for the frontend API URL.

### Step 3: Update Frontend API URL

Update `frontend/.env`:
```env
VITE_API_URL=https://YOUR_CLOUD_RUN_URL/api
```

Then rebuild:
```bash
cd frontend
npm run build
cd ..
```

### Step 4: Deploy Frontend to Firebase Hosting

```bash
firebase deploy --only hosting
```

Or if you need to specify project:
```bash
firebase deploy --only hosting --project umevents-cd9d5
```

### Step 5: Update Backend FRONTEND_URL

After frontend is deployed, update the backend environment variable:
```bash
gcloud run services update umevents-backend \
  --region asia-southeast1 \
  --set-env-vars "FRONTEND_URL=https://umevents-cd9d5.web.app"
```

Or via Cloud Console.

## Verify Deployment

1. **Backend Health Check:**
   ```bash
   curl https://YOUR_CLOUD_RUN_URL/api/health
   ```

2. **Frontend:**
   Visit: https://umevents-cd9d5.web.app

3. **Test Features:**
   - User registration
   - Club registration
   - Event creation
   - Ticket purchase
   - Payment callback

## Troubleshooting

### Backend won't start
- Check Cloud Run logs: `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=umevents-backend" --limit 50`
- Verify all environment variables are set correctly
- Check that Firebase credentials are correctly formatted (especially `FIREBASE_PRIVATE_KEY` with `\n`)

### Frontend build fails
- Check `frontend/.env` exists and has all required variables
- Ensure `VITE_API_URL` is set correctly
- Clear `node_modules` and rebuild: `rm -rf node_modules && npm ci && npm run build`

### CORS errors
- Verify `FRONTEND_URL` in backend matches your Firebase Hosting URL exactly
- Check Cloud Run logs for CORS-related errors

### Image upload fails
- Verify `FIREBASE_STORAGE_BUCKET` is set correctly
- Ensure Firebase Storage is enabled in Firebase Console
- Check storage bucket permissions

## Updating Deployment

To update your deployment:

1. **Make code changes**
2. **Rebuild frontend:**
   ```bash
   cd frontend && npm run build && cd ..
   ```

3. **Redeploy backend:**
   ```bash
   gcloud builds submit --tag gcr.io/umevents-cd9d5/umevents-backend backend/
   gcloud run deploy umevents-backend --image gcr.io/umevents-cd9d5/umevents-backend --region asia-southeast1
   ```

4. **Redeploy frontend:**
   ```bash
   firebase deploy --only hosting
   ```

## Cost

- **Cloud Run:** Free tier includes 2 million requests/month
- **Firebase Hosting:** Free tier includes 10 GB storage and 360 MB/day bandwidth
- **Firebase/Firestore:** Free tier available
- **Total Estimated Cost:** $0-5/month for low traffic

## Support

If you encounter issues:
1. Check Cloud Run logs
2. Check Firebase Console logs
3. Verify all environment variables
4. Test locally first

