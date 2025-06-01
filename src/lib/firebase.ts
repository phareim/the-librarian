
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
// Import getAuth directly, remove initializeAuth and inMemoryPersistence for now
import { getAuth, type Auth } from 'firebase/auth';
// Import getFirestore directly, remove initializeFirestore and memoryLocalCache for now
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
    return null;
  }
  if (!authInstance) {
    try {
      // Use getAuth(app) instead of initializeAuth with specific persistence
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
    return null;
  }
  if (!dbInstance) {
    try {
      // Use getFirestore(app) instead of initializeFirestore with specific cache
      dbInstance = getFirestore(app);
    } catch (error) {
      console.error("Error getting Firebase Firestore instance:", error);
      dbInstance = null; // Ensure instance is null on error
    }
  }
  return dbInstance;
}

export { app };
