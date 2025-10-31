# Backend Deployment Instructions

Your frontend is deployed at: **https://umevents-cd9d5.web.app**

## Backend Deployment Options

Due to permission issues with gcloud CLI, use one of these methods:

### Option 1: Google Cloud Console (Recommended)

1. **Enable Required APIs:**
   - Go to: https://console.cloud.google.com/apis/library?project=umevents-cd9d5
   - Enable these APIs:
     - Cloud Run API
     - Cloud Build API
     - Container Registry API

2. **Build Docker Image via Console:**
   - Go to: https://console.cloud.google.com/cloud-build/builds?project=umevents-cd9d5
   - Click "CREATE TRIGGER" or "RUN"
   - Use this build configuration:
   ```yaml
   steps:
   - name: 'gcr.io/cloud-builders/docker'
     args: ['build', '-t', 'gcr.io/umevents-cd9d5/umevents-backend', './backend']
   images:
   - 'gcr.io/umevents-cd9d5/umevents-backend'
   ```
   - Or manually build in Cloud Shell:
     ```bash
     gcloud builds submit --tag gcr.io/umevents-cd9d5/umevents-backend backend/
     ```

3. **Deploy to Cloud Run:**
   - Go to: https://console.cloud.google.com/run?project=umevents-cd9d5
   - Click "CREATE SERVICE"
   - Configure:
     - **Service name:** `umevents-backend`
     - **Region:** `asia-southeast1`
     - **Container image:** `gcr.io/umevents-cd9d5/umevents-backend`
     - **Port:** `8080`
     - **Memory:** `512Mi`
     - **CPU:** `1`
     - **Authentication:** Allow unauthenticated invocations
   
4. **Set Environment Variables:**
   After creating the service, edit it and add these environment variables:
   ```
   PORT=8080
   NODE_ENV=production
   FIREBASE_PROJECT_ID=umevents-cd9d5
   FIREBASE_PRIVATE_KEY=(from your backend/.env - keep \n characters)
   FIREBASE_CLIENT_EMAIL=(from your backend/.env)
   FIREBASE_CLIENT_ID=(from your backend/.env)
   FIREBASE_CLIENT_X509_CERT_URL=(from your backend/.env)
   FIREBASE_STORAGE_BUCKET=umevents-cd9d5.appspot.com
   FRONTEND_URL=https://umevents-cd9d5.web.app
   TOYYIBPAY_SECRET_KEY=(from your backend/.env)
   ADMIN_EMAILS=(comma-separated admin emails)
   ```

5. **Get Backend URL:**
   - After deployment, copy the Cloud Run service URL
   - Format: `https://umevents-backend-xxxxx-xx.a.run.app`

6. **Update Frontend API URL:**
   - Update `frontend/.env`:
     ```env
     VITE_API_URL=https://YOUR_CLOUD_RUN_URL/api
     ```
   - Rebuild and redeploy frontend:
     ```bash
     cd frontend
     npm run build
     firebase deploy --only hosting
     ```

### Option 2: Alternative - Deploy Backend to Firebase Functions

If Cloud Run permissions are an issue, you can use Firebase Functions:

1. Install Firebase Functions dependencies
2. Convert Express app to Cloud Functions
3. Deploy via Firebase CLI

### Option 3: Use Cloud Shell

1. Go to: https://shell.cloud.google.com/?project=umevents-cd9d5
2. Clone your repository
3. Run the deployment commands from there

## After Backend Deployment

1. **Test Backend:**
   ```bash
   curl https://YOUR_BACKEND_URL/api/health
   ```

2. **Update Frontend:**
   - Update `VITE_API_URL` in `frontend/.env`
   - Rebuild and redeploy frontend

3. **Update Backend CORS:**
   - Ensure `FRONTEND_URL` in backend matches `https://umevents-cd9d5.web.app`

## Troubleshooting

### Permission Issues:
- Make sure billing is enabled on the project
- Ensure you have "Owner" or "Editor" role on the project
- Check IAM permissions in: https://console.cloud.google.com/iam-admin/iam?project=umevents-cd9d5

### Build Issues:
- Check Cloud Build logs in console
- Verify Dockerfile syntax
- Ensure all dependencies are in package.json

### Runtime Issues:
- Check Cloud Run logs
- Verify all environment variables are set correctly
- Check Firebase credentials format (especially private key with \n)

## Current Status

✅ Frontend: Deployed at https://umevents-cd9d5.web.app
⏳ Backend: Needs deployment via Cloud Console or Cloud Shell

