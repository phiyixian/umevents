# Google Sign-In Setup Guide

This guide will help you enable Google sign-in for UMEvents.

## 🔧 Firebase Configuration

### Step 1: Enable Google Authentication in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication**
4. Click on **Sign-in method** tab
5. Click on **Google** provider
6. Toggle **Enable** switch to ON
7. Enter your project support email
8. Click **Save**

### Step 2: Configure OAuth Consent Screen (If needed)

If this is your first time setting up OAuth:

1. Click on **Web SDK configuration**
2. Copy the **Web client ID** and **Web client secret**
3. If asked, configure OAuth consent screen in Google Cloud Console

### Step 3: Add Authorized Domains

In Firebase Console:
1. Go to **Authentication > Settings**
2. Click on **Authorized domains**
3. Add your domain (e.g., `localhost`, `yourapp.vercel.app`)

## 🎨 Frontend Configuration

### The Google Sign-In is already implemented!

The following features are already built-in:

- ✅ Google sign-in button on Login page
- ✅ Google sign-in button on Register page
- ✅ Automatic user document creation for first-time Google users
- ✅ Handles existing Google users
- ✅ Stores Google profile information

### How it Works

1. **First-time Google users:**
   - User clicks "Sign in with Google"
   - Google popup appears
   - User selects Google account
   - User document automatically created in Firestore
   - User redirected to dashboard

2. **Returning Google users:**
   - User clicks "Sign in with Google"
   - Google popup appears
   - User logs in with existing account
   - User document fetched from Firestore
   - User redirected to dashboard

## 📝 Environment Variables

Make sure your Firebase config in `frontend/.env` includes:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

## 🧪 Testing Google Sign-In

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to login or register page

3. Click "Sign in with Google" or "Sign up with Google"

4. Select your Google account

5. You should be redirected to the dashboard

## 🐛 Troubleshooting

### Error: "popup-closed-by-user"
- User closed the popup window
- This is normal behavior, just try again

### Error: "auth/popup-blocked"
- Browser is blocking popups
- Allow popups for localhost/your domain

### Error: "auth/unauthorized-domain"
- Add your domain to Firebase authorized domains
- Go to Authentication > Settings > Authorized domains

### Error: "auth/configuration-not-found"
- Google sign-in not enabled in Firebase
- Follow Step 1 above

## 🔒 Security Notes

- Google sign-in is secure and uses OAuth 2.0
- Firebase handles all authentication securely
- User data is stored in Firestore
- No passwords are stored for Google users

## 📋 User Data Stored

For Google users, the following data is automatically stored:

```javascript
{
  uid: string,
  email: string,
  name: string,
  photoURL: string,
  role: 'student',
  provider: 'google',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## 🎯 Additional Features

Users who sign in with Google can:
- ✅ Update their profile information
- ✅ Add missing details (student ID, faculty, etc.)
- ✅ Purchase tickets
- ✅ Create events (if club role assigned)
- ✅ View analytics

## 💡 Tips

1. **For UM students:** Recommend using UM email (@siswa.um.edu.my) when possible
2. **For Clubs:** Can use Google sign-in then request club verification
3. **Profile completion:** Encourage Google users to complete their profile in settings

## 🚀 Production Deployment

When deploying to production:

1. Add your domain to Firebase authorized domains
2. Test Google sign-in on production domain
3. Ensure HTTPS is enabled (required for OAuth)
4. Update environment variables with production values

## ✅ Checklist

Before going live:
- [ ] Google sign-in enabled in Firebase
- [ ] Authorized domains added
- [ ] Test login flow
- [ ] Test registration flow
- [ ] Verify user documents are created
- [ ] Test on mobile browsers
- [ ] Verify HTTPS is working

That's it! Google sign-in is now fully integrated and ready to use.


