# UMEvents - Deployment Guide

This guide covers deploying UMEvents to production environments.

## Prerequisites

- Working local development environment
- Git repository
- All environment variables configured

## Deployment Options

### 1. Backend Deployment (Railway)

Railway is recommended for Node.js backend deployment.

#### Steps:

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Connect Repository**
   - New Project → Deploy from GitHub
   - Select your umevents repository
   - Set root directory to `backend`

3. **Configure Environment Variables**
   Add all variables from `backend/.env`:
   ```
   FIREBASE_PROJECT_ID
   FIREBASE_PRIVATE_KEY
   FIREBASE_CLIENT_EMAIL
   ... (all Firebase credentials)
   PORT (auto-set by Railway)
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-domain.com
   ```

4. **Deploy**
   - Railway will auto-deploy on push
   - Copy the deployment URL (e.g., `umevents-production.up.railway.app`)

#### Railway Configuration

Create `railway.json` in backend:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2. Frontend Deployment (Vercel)

Vercel is recommended for React applications.

#### Steps:

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Project**
   - New Project → Import Git Repository
   - Select umevents repository
   - Set root directory to `frontend`

3. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Set Environment Variables**
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   ```

5. **Deploy**
   - Click Deploy
   - Vercel will auto-deploy on every push to main

### 3. Alternative: Firebase Hosting (Full Stack)

Deploy both frontend and backend on Firebase.

#### Steps:

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Firebase**
   ```bash
   firebase init
   # Select: Hosting, Firestore
   ```

3. **Configure firebase.json**
   ```json
   {
     "hosting": {
       "public": "frontend/dist",
       "ignore": [
         "firebase.json",
         "**/.*",
         "**/node_modules/**"
       ],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

4. **Build and Deploy**
   ```bash
   cd frontend
   npm run build
   cd ..
   firebase deploy
   ```

### 4. Alternative: Digital Ocean App Platform

Deploy both services on Digital Ocean.

#### Steps:

1. Create App on Digital Ocean
2. Connect GitHub repository
3. Configure build settings for frontend and backend separately
4. Add environment variables
5. Deploy

## Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FRONTEND_URL=https://your-frontend-domain.com
TOYYIBPAY_SECRET_KEY=your-toyyibpay-key
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-url.com/api
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Post-Deployment Checklist

- [ ] Test user registration
- [ ] Test event creation
- [ ] Test ticket purchase
- [ ] Test payment callback
- [ ] Verify Firebase authentication
- [ ] Check analytics dashboard
- [ ] Test mobile responsiveness
- [ ] Monitor error logs
- [ ] Set up custom domain
- [ ] Configure SSL/HTTPS
- [ ] Enable CDN for static assets
- [ ] Set up monitoring (Sentry, etc.)

## Monitoring & Analytics

### Backend Monitoring
- Railway: Built-in metrics
- Add logging: Winston or Pino
- Error tracking: Sentry

### Frontend Monitoring
- Vercel Analytics (built-in)
- Google Analytics
- Error tracking: Sentry

## Scaling Considerations

1. **Database**
   - Firestore scales automatically
   - Use indexes for complex queries
   - Set up backup strategy

2. **Storage**
   - Firebase Storage for images
   - Consider CDN for static assets
   - Implement image optimization

3. **API**
   - Add caching (Redis) for popular queries
   - Implement rate limiting per user
   - Use load balancing for high traffic

## Security Checklist

- [ ] Enable HTTPS only
- [ ] Set secure cookie flags
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Use environment variables
- [ ] Implement CSRF protection
- [ ] Regular dependency updates
- [ ] Security headers (helmet)
- [ ] Input validation
- [ ] SQL injection prevention

## Backup Strategy

1. **Database Backups**
   - Firestore: Daily automatic backups
   - Export to GCS bucket
   - Test restore procedures

2. **Code Backups**
   - Git repository
   - Tag releases
   - Keep deployment history

## Cost Estimation

### Free Tier (Development)
- Firebase: Free
- Railway: Free Hobby plan
- Vercel: Free hobby plan
- Total: $0/month

### Production Tier (Low Traffic)
- Firebase: ~$25/month
- Railway: $5/month
- Vercel: $20/month
- Total: ~$50/month

### Production Tier (High Traffic)
- Firebase: Pay-as-you-go
- Railway: $20/month
- Vercel: $20/month
- CDN: $10/month
- Total: ~$100-200/month

## Troubleshooting

### Common Issues

**Backend won't start:**
- Check environment variables
- Verify port configuration
- Check logs for errors

**Frontend build fails:**
- Update Node.js version
- Clear node_modules and reinstall
- Check build logs

**CORS errors:**
- Update FRONTEND_URL in backend
- Check CORS configuration
- Verify API URL in frontend

## Custom Domain Setup

### Backend (Railway)
1. Add custom domain in Railway
2. Update DNS records
3. Configure SSL

### Frontend (Vercel)
1. Add domain in Vercel
2. Follow DNS instructions
3. Wait for SSL provisioning

## CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy Backend
        run: # Railway/Vercel auto-deploys
      - name: Deploy Frontend
        run: # Vercel auto-deploys
```

## Support

For deployment issues:
- Check platform logs
- Review environment variables
- Test locally first
- Contact platform support

---

## Cheapest Stack: Cloud Run (Backend) + Firebase Hosting (Frontend)

### Backend: Deploy to Cloud Run

1) Prerequisites
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

2) Build and deploy
```bash
cd backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/umevents-backend
gcloud run deploy umevents-backend \
  --image gcr.io/YOUR_PROJECT_ID/umevents-backend \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars "PORT=8080,FIREBASE_PROJECT_ID=...,FIREBASE_PRIVATE_KEY_ID=...,FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n,FIREBASE_CLIENT_EMAIL=...,FIREBASE_CLIENT_ID=...,FIREBASE_CLIENT_X509_CERT_URL=...,FIREBASE_STORAGE_BUCKET=...,FRONTEND_URL=https://your-frontend.web.app"
```
Note: Keep `\n` newlines in `FIREBASE_PRIVATE_KEY` and quote the value.

3) Copy the Cloud Run URL (e.g. `https://umevents-backend-xxxxx-…run.app`).

### Frontend: Deploy to Firebase Hosting

1) Set API base URL
```env
VITE_API_URL=https://YOUR_CLOUD_RUN_URL/api
```

2) Build and deploy
```bash
npm i -g firebase-tools
firebase login
firebase use YOUR_PROJECT_ID
cd frontend
npm ci
npm run build
firebase deploy --only hosting
```

### Post-deploy
- Update backend `FRONTEND_URL` env to your Firebase Hosting URL
- Verify health: `https://YOUR_CLOUD_RUN_URL/api/health`

