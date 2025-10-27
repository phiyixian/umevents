# UMEvents - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] Firebase account (free tier)
- [ ] Code editor (VS Code recommended)

### Installation Steps

1. **Clone and Install**
```bash
git clone <repository-url>
cd umevents
npm run install:all
```

2. **Set Up Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project "umevents"
   - Enable Authentication (Email/Password)
   - Create Firestore Database
   - Enable Storage
   - Generate Service Account Key

3. **Configure Environment Variables**

Create `backend/.env`:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL=your-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_X509_CERT_URL=your-cert-url
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
PORT=5000
FRONTEND_URL=http://localhost:5173
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

4. **Run the Application**

```bash
# From root directory
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

### First Steps After Launch

1. Register as a student:
   - Go to http://localhost:5173/register
   - Use your UM email (ends with @siswa.um.edu.my)
   - Fill in student details

2. Create an event (as club):
   - In registration, set role to "club"
   - Request club verification
   - Once approved, create events

3. Browse and purchase tickets:
   - Browse events at /events
   - Click on event to view details
   - Purchase ticket
   - Complete payment

### Key Features Available

✅ User registration and authentication
✅ Event browsing and creation
✅ Ticket purchasing with QR codes
✅ Payment processing (mock)
✅ Analytics dashboard
✅ Profile management

### Development Tips

- Backend logs will show in terminal running `npm run dev:backend`
- Frontend hot-reloads automatically
- Check `backend/server.js` for API routes
- Check `frontend/src/App.jsx` for routing

### Troubleshooting

**Port already in use:**
```bash
# Change port in backend/.env
PORT=5001
```

**Firebase connection errors:**
- Verify all credentials in .env files
- Check Firebase project settings

**Module not found:**
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Next Steps

- Read the full [SETUP.md](./SETUP.md) for detailed configuration
- Integrate real payment gateway (ToyyibPay or Billplz)
- Deploy to production (Railway, Vercel)
- Add more features from the roadmap

### Project Structure

```
umevents/
├── frontend/        # React app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   └── config/
│   └── package.json
├── backend/         # Express API
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   └── config/
├── package.json     # Root workspace
└── README.md
```

### Support

- Documentation: See SETUP.md
- Issues: Open GitHub issue
- Questions: Contact team

Happy coding! 🎉

