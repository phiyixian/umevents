# UMEvents Setup Guide

This guide will help you set up the UMEvents platform locally.

## Prerequisites

- Node.js 18+ installed
- Firebase account (free tier is sufficient)
- Git installed

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/umevents.git
cd umevents
```

## Step 2: Install Dependencies

Run the following command to install all dependencies for both frontend and backend:

```bash
npm run install:all
```

Or manually:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Step 3: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project called "umevents"
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password
   - Enable Google (recommended - see [GOOGLE_SIGNIN_SETUP.md](./GOOGLE_SIGNIN_SETUP.md))
4. Create a Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Choose a location close to Malaysia
5. Enable Storage:
   - Go to Storage
   - Get Started
6. Get Service Account:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save the JSON file

## Step 4: Environment Variables

### Backend Environment

Create `backend/.env` file:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-client-email@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# Server Configuration
PORT=5000
NODE_ENV=development
APP_URL=http://localhost:5000

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Frontend Environment

Create `frontend/.env` file:

```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

To get Firebase config:
- Go to Project Settings > General
- Under "Your apps", select Web app (or add one)
- Copy the config values

## Step 5: Install Additional Dependencies

For QR code generation in the backend:

```bash
cd backend
npm install qrcode
```

## Step 6: Run the Application

In the root directory, run:

```bash
npm run dev
```

This will start both frontend (http://localhost:5173) and backend (http://localhost:5000).

Or run separately:

### Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

### Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

## Step 7: Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

## Step 8: Create Your First User

1. Go to http://localhost:5173/register
2. Register with your UM email (e.g., yourname@siswa.um.edu.my)
3. Fill in your details
4. For club registration, use the role 'club' and additional club details will be required

## Firebase Firestore Collections

The app uses the following collections:
- `users` - User accounts
- `events` - Event listings
- `tickets` - Ticket purchases
- `payments` - Payment records
- `clubVerificationRequests` - Club approval requests
- `follows` - User following relationships

## Testing Payment Integration

For development, you can use the mock payment flow. To integrate real payments:

1. Sign up for [ToyyibPay](https://www.toyyibpay.com/) or [Billplz](https://www.billplz.com/)
2. Get your API keys
3. Add them to `backend/.env`:
   ```env
   TOYYIBPAY_SECRET_KEY=your-secret-key
   TOYYIBPAY_CATEGORY_CODE=your-category-code
   ```

## Troubleshooting

### Backend not starting
- Check if port 5000 is available
- Verify all environment variables are set correctly
- Check Firebase credentials are correct

### Frontend not connecting to backend
- Verify `VITE_API_URL` in `.env` matches backend URL
- Check CORS settings in `backend/server.js`

### Authentication errors
- Ensure Firebase Authentication is enabled
- Check email/password provider is enabled
- Verify API keys in `.env` files

### QR Code not generating
- Install `qrcode` package: `cd backend && npm install qrcode`

## Development Notes

- Backend uses Express.js with Firebase Admin SDK
- Frontend uses React with Vite
- State management with Zustand
- API calls with Axios
- UI styled with Tailwind CSS
- Charts with Chart.js (for analytics)

## Production Deployment

### Backend
- Deploy to Railway, Heroku, or any Node.js hosting
- Set `NODE_ENV=production`
- Update `FRONTEND_URL` to your production URL

### Frontend
- Build: `cd frontend && npm run build`
- Deploy to Vercel, Netlify, or Firebase Hosting
- Update environment variables

## Support

For issues, please open an issue on GitHub or contact support.

