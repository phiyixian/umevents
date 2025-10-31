# Deployment Summary

## ✅ Deployment Complete!

### Frontend
- **Status:** ✅ Deployed
- **URL:** https://umevents-cd9d5.web.app
- **Platform:** Firebase Hosting

### Backend
- **Status:** ✅ Deployed
- **URL:** https://umevents-backend-x5bkuhgbwq-as.a.run.app
- **Platform:** Google Cloud Run
- **Region:** asia-southeast1
- **Revision:** umevents-backend-00004-ftt

## Next Steps

### 1. Update Frontend API URL (Important!)

The frontend needs to know the backend URL. Update `frontend/.env`:

```env
VITE_API_URL=https://umevents-backend-x5bkuhgbwq-as.a.run.app/api
```

Then rebuild and redeploy frontend:
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### 2. Update Backend Environment Variables

Set these in Cloud Run (see `UPDATE_ENV_VARIABLES.md` for details):

**Required:**
- `FRONTEND_URL=https://umevents-cd9d5.web.app`
- `TOYYIBPAY_SECRET_KEY=your_secret_key`
- All Firebase credentials

**Quick Update via CLI:**
```bash
gcloud run services update umevents-backend \
  --region asia-southeast1 \
  --project umevents-cd9d5 \
  --set-env-vars "FRONTEND_URL=https://umevents-cd9d5.web.app"
```

### 3. Verify Deployment

Test the health endpoint:
```bash
curl https://umevents-backend-x5bkuhgbwq-as.a.run.app/api/health
```

Should return: `{"status":"ok","message":"UMEvents API is running"}`

## Useful Commands

### View Backend Logs
```bash
gcloud run services logs read umevents-backend \
  --region asia-southeast1 \
  --project umevents-cd9d5 \
  --limit 50
```

### View Current Environment Variables
```bash
gcloud run services describe umevents-backend \
  --region asia-southeast1 \
  --project umevents-cd9d5 \
  --format 'export'
```

### Redeploy Frontend
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### Redeploy Backend
```bash
gcloud builds submit --tag gcr.io/umevents-cd9d5/umevents-backend --project=umevents-cd9d5 backend/
gcloud run deploy umevents-backend \
  --image gcr.io/umevents-cd9d5/umevents-backend \
  --region asia-southeast1 \
  --project umevents-cd9d5 \
  --platform managed \
  --allow-unauthenticated
```

## Files Created

1. **UPDATE_ENV_VARIABLES.md** - Complete guide on updating environment variables
2. **DEPLOYMENT_SUMMARY.md** - This file

## Important Links

- **Frontend:** https://umevents-cd9d5.web.app
- **Firebase Console:** https://console.firebase.google.com/project/umevents-cd9d5
- **Cloud Run Console:** https://console.cloud.google.com/run?project=umevents-cd9d5
- **Cloud Build Console:** https://console.cloud.google.com/cloud-build/builds?project=umevents-cd9d5

