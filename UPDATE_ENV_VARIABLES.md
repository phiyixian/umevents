# How to Update Environment Variables

This guide shows you how to update environment variables in Google Cloud Run and Firebase.

## Current URLs

- **Frontend:** https://umevents-cd9d5.web.app
- **Backend:** https://umevents-backend-x5bkuhgbwq-as.a.run.app

## Method 1: Google Cloud Console (Recommended - Easiest)

### Step 1: Access Cloud Run Console
1. Go to: https://console.cloud.google.com/run?project=umevents-cd9d5
2. Click on `umevents-backend` service

### Step 2: Edit Environment Variables
1. Click **"EDIT & DEPLOY NEW REVISION"** button
2. Scroll down to **"Variables & Secrets"** section
3. Click on **"Variables & Secrets"** tab
4. You'll see a table with current environment variables

### Step 3: Add/Update Variables
- **To add a new variable:**
  - Click **"ADD VARIABLE"**
  - Enter the **Variable name** (e.g., `TOYYIBPAY_SECRET_KEY`)
  - Enter the **Value**
  - Click **"ADD"**

- **To update an existing variable:**
  - Click the **pencil icon** next to the variable
  - Update the value
  - Click **"SAVE"**

- **To delete a variable:**
  - Click the **trash icon** next to the variable

### Step 4: Deploy
1. Scroll down and click **"DEPLOY"**
2. Wait for deployment to complete (1-2 minutes)

## Method 2: Google Cloud CLI (Command Line)

### Update Single Environment Variable

```bash
gcloud run services update umevents-backend \
  --region asia-southeast1 \
  --project umevents-cd9d5 \
  --set-env-vars VARIABLE_NAME=value
```

**Example:**
```bash
gcloud run services update umevents-backend \
  --region asia-southeast1 \
  --project umevents-cd9d5 \
  --set-env-vars TOYYIBPAY_SECRET_KEY=your_secret_key_here
```

### Update Multiple Environment Variables

```bash
gcloud run services update umevents-backend \
  --region asia-southeast1 \
  --project umevents-cd9d5 \
  --set-env-vars "VAR1=value1,VAR2=value2,VAR3=value3"
```

**Example:**
```bash
gcloud run services update umevents-backend \
  --region asia-southeast1 \
  --project umevents-cd9d5 \
  --set-env-vars "FRONTEND_URL=https://umevents-cd Renewal5.web.app,TOYYIBPAY_SECRET_KEY=abc123"
```

### Update Firebase Private Key (Special Case)

The Firebase private key contains newlines. You need to escape them with `\n`:

```bash
gcloud run services update umevents-backend \
  --region asia-southeast1 \
  --project umevents-cd9d5 \
  --set-env-vars "FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

**Tip:** Replace actual newlines in your key with `\n`

### View Current Environment Variables

```bash
gcloud run services describe umevents-backend \
  --region asia-southeast1 \
  --project umevents-cd9d5 \
  --format 'value(spec.template.spec.containers[0].env)'
```

Or to see in a readable format:
```bash
gcloud run services describe umevents-backend \
  --region asia-southeast1 \
  --project umevents-cd9d5 \
  --format 'export'
```

### Remove an Environment Variable

```bash
gcloud run services update umevents-backend \
  --region asia-southeast1 \
  --project umevents-cd9d5 \
  --remove-env-vars VARIABLE_NAME
```

## Required Environment Variables

### Backend (Cloud Run)

```bash
# Required Variables
PORT=8080
NODE_ENV=production

# Firebase Configuration
FIREBASE_PROJECT_ID=umevents-cd9d5
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=your-service-account@umevents-cd9d5.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
FIREBASE_STORAGE_BUCKET=umevents-cd9d5.appspot.com

# Application URLs
FRONTEND_URL=https://umevents-cd9d5.web.app
BACKEND_URL=https://umevents-backend-x5bkuhgbwq-as.a.run.app

# Payment Integration
TOYYIBPAY_SECRET_KEY=your_toyyibpay_secret_key
TOYYIBPAY_API_URL=https://toyyibpay.com/index.php/api
# OR for testing: https://dev.toyyibpay.com/index.php/api

# Admin Configuration
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

## Updating Frontend Environment Variables

### Step 1: Edit `frontend/.env`

```env
VITE_API_URL=https://umevents-backend-x5bkuhgbwq-as.a.run.app/api
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=umevents-cd9d5.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=umevents-cd9d5
VITE_FIREBASE_STORAGE_BUCKET=umevents-cd9d5.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Step 2: Rebuild and Redeploy Frontend

```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

## Quick Update Scripts

### Update Backend URL in Frontend

```bash
# Edit frontend/.env with new backend URL
# Then rebuild and deploy
cd frontend
npm run build
firebase deploy --only hosting
```

### Update Frontend URL in Backend

```bash
gcloud run services update umevents-backend \
  --region asia-southeast1 \
  --project umevents-cd9d5 \
  --set-env-vars "FRONTEND_URL=https://umevents-cd9d5.web.app"
```

### Update ToyyibPay Secret Key

```bash
gcloud run services update umevents-backend \
  --region asia-southeast1 \
 NotNull --project umevents-cd9d5 \
  --set-env-vars "TOYYIBPAY_SECRET_KEY=your_new_secret_key"
```

## Troubleshooting

### Variables Not Updating?
- Wait a few minutes after deployment
- Check if deployment completed successfully
- Verify variable names are correct (case-sensitive)
尽的

### Permission Errors?
- Ensure you have "Cloud Run Admin" or "Editor" role
- Check IAM permissions: https://console.cloud.google.com/iam 즌admin/iam?project=umevents-cd9d5

### See Deployment Logs
```bash
gcloud run services logs read umevents-backend \
  --region asia-southeast1 \
  --project umevents-cd9d5 \
  --limit 50
```

## Important Notes

1. **After updating backend env vars:** The service automatically redeploys with new variables
2. **After updating frontend .env:** You must rebuild and redeploy to Firebase Hosting
3. **Private Key Format:** Always use `\n` for newlines in Firebase private key
4. **No Spaces:** Don't include spaces around `=` in env var values
5. **Quotes:** Use quotes for values containing spaces or special cas

