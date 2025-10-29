import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import dotenv from 'dotenv';

// Ensure environment variables are loaded even if this module is imported before server bootstrap
dotenv.config();

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

let app;
let db;
let auth;
let storage;

try {
  // Validate required environment variables
  if (!process.env.FIREBASE_PROJECT_ID) {
    throw new Error('FIREBASE_PROJECT_ID is required but not found in environment variables');
  }

  if (!getApps().length) {
    app = initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
  } else {
    app = getApps()[0];
  }

  db = getFirestore();
  auth = getAuth();
  storage = getStorage();

  console.log('✅ Firebase Admin initialized successfully');
  console.log(`📦 Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
  console.log(`🗄️  Database: ${db ? 'Connected' : 'Not connected'}`);
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error);
  console.error('Make sure you have:');
  console.error('1. Created a Firebase project in Firebase Console');
  console.error('2. Created a Firestore database (Production mode)');
  console.error('3. Set up all required environment variables in backend/.env');
  throw error;
}

export { db, auth, storage, app };

