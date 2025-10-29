# Fix Firestore "NOT_FOUND" Error

The error `5 NOT_FOUND` means your Firestore database either doesn't exist or wasn't properly created.

## Quick Fix Steps

### 1. Go to Firebase Console
Visit: https://console.firebase.google.com/

### 2. Select Your Project
- Make sure you're using the correct project (check the project name matches your `.env` file)

### 3. Create Firestore Database
1. In the left menu, click **Firestore Database**
2. If you see "Get started", click it
3. If you already have a database, ensure it's created

### 4. Database Mode
- Select **Production mode** (not test mode)
- Choose a location close to Malaysia (e.g., `asia-southeast1` or `asia-southeast2`)

### 5. Set Up Security Rules (Important!)

Go to the **Rules** tab and set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to events for all authenticated users
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && 
        (request.auth.uid == resource.data.organizerId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Allow users to read their own user doc
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create, update: if request.auth != null;
    }
    
    // Tickets - allow users to read their own tickets
    match /tickets/{ticketId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null;
    }
    
    // Payments - users can read their own payments
    match /payments/{paymentId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null;
    }
    
    // Club verification requests - admins only for read, clubs can create
    match /clubVerificationRequests/{requestId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow create: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'club';
    }
    
    // Default deny for any other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Click **Publish**

### 6. Verify Your Environment Variables

Make sure your `backend/.env` file has all required variables:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

### 7. Get Service Account Credentials

If you don't have these yet:
1. Go to Project Settings (gear icon) → **Service Accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Copy the values from the JSON to your `.env` file

### 8. Restart Your Server

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

## Still Getting Errors?

### Error: Database not found
- Make sure Firestore is enabled in your project
- Verify the project ID in `.env` matches your Firebase project

### Error: Permission denied
- Check the security rules above
- Make sure you published the rules

### Error: Invalid credentials
- Re-download your service account JSON
- Make sure `FIREBASE_PRIVATE_KEY` preserves the `\n` characters (they must be inside quotes)

## Test Connection

Once set up, your console should show:
```
✅ Firebase Admin initialized successfully
📦 Project ID: your-project-id
🗄️  Database: Connected
```

If it shows "Not connected", the database wasn't created yet - follow steps 1-4 above.
