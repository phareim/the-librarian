
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
const googleAuthProvider = new GoogleAuthProvider();

if (apiKey && authDomain && projectId && appId) {
  const firebaseConfig = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };

  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (error) {
      console.error("Firebase initialization error:", error);
      app = null; // Ensure app is null if initialization fails
    }
  } else {
    app = getApp();
  }
} else {
  console.warn(
    "Firebase configuration is missing or incomplete. " +
    "Please ensure NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, " +
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID, and NEXT_PUBLIC_FIREBASE_APP_ID are set in your .env.local file. " +
    "Firebase features will be disabled."
  );
}

export function getFirebaseAuth(): Auth | null {
  if (!app) {
    // Warning for app not initialized is already handled above
    return null;
  }
  if (!authInstance) {
    try {
      authInstance = getAuth(app);
    } catch (error) {
      console.error("Error getting Firebase Auth instance:", error);
      authInstance = null; // Ensure instance is null on error
    }
  }
  return authInstance;
}

export function getFirebaseFirestore(): Firestore | null {
  if (!app) {
    // Warning for app not initialized is already handled above
    return null;
  }
  if (!dbInstance) {
    try {
      dbInstance = getFirestore(app);
    } catch (error) {
      console.error("Error getting Firebase Firestore instance:", error);
      dbInstance = null; // Ensure instance is null on error
    }
  }
  return dbInstance;
}

// Export app and googleAuthProvider directly as they don't have the same lazy-init needs for storage.
export { app, googleAuthProvider };
