// Test Firebase connection
require('dotenv').config({ path: '.env.local' });

const { initializeApp, getApps } = require('firebase/app');
const { getAuth, connectAuthEmulator } = require('firebase/auth');
const { getFirestore, connectFirestoreEmulator, collection, getDocs } = require('firebase/firestore');

console.log('\n=== Testing Firebase Connection ===\n');

// Check environment variables
console.log('Environment Variables:');
console.log('API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✓ Set' : '✗ Missing');
console.log('AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '✓ Set' : '✗ Missing');
console.log('PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✓ Set' : '✗ Missing');
console.log('STORAGE_BUCKET:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? '✓ Set' : '✗ Missing');
console.log('MESSAGING_SENDER_ID:', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? '✓ Set' : '✗ Missing');
console.log('APP_ID:', process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? '✓ Set' : '✗ Missing');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('\n--- Initializing Firebase ---');
try {
  const app = initializeApp(firebaseConfig);
  console.log('✓ Firebase app initialized successfully');
  console.log('  Project ID:', app.options.projectId);

  // Test Auth
  console.log('\n--- Testing Auth ---');
  try {
    const auth = getAuth(app);
    console.log('✓ Auth instance created');
    console.log('  Current user:', auth.currentUser ? auth.currentUser.uid : 'Not signed in');
  } catch (authError) {
    console.error('✗ Auth error:', authError.message);
  }

  // Test Firestore
  console.log('\n--- Testing Firestore ---');
  try {
    const db = getFirestore(app);
    console.log('✓ Firestore instance created');

    // Try to read from articles collection
    console.log('\n--- Testing Firestore Read ---');
    const articlesRef = collection(db, 'articles');
    getDocs(articlesRef)
      .then((snapshot) => {
        console.log('✓ Successfully connected to Firestore');
        console.log(`  Articles collection exists, found ${snapshot.size} documents`);
        console.log('\n=== All tests passed! ===\n');
      })
      .catch((firestoreError) => {
        console.error('✗ Firestore read error:', firestoreError.code);
        console.error('  Message:', firestoreError.message);

        if (firestoreError.code === 'permission-denied') {
          console.log('\n⚠️  ISSUE FOUND: Firestore Security Rules');
          console.log('  The connection works, but security rules are blocking access.');
          console.log('  You need to update Firestore security rules in Firebase Console.');
          console.log('\n  Suggested rules for development:');
          console.log('  rules_version = \'2\';');
          console.log('  service cloud.firestore {');
          console.log('    match /databases/{database}/documents {');
          console.log('      match /articles/{articleId} {');
          console.log('        allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;');
          console.log('        allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;');
          console.log('      }');
          console.log('    }');
          console.log('  }');
        } else if (firestoreError.code === 'unavailable') {
          console.log('\n⚠️  ISSUE FOUND: Network/Connection');
          console.log('  Cannot reach Firestore. Check your internet connection.');
        } else {
          console.log('\n⚠️  ISSUE FOUND: Unknown Firestore error');
          console.log('  Check Firebase Console for project status.');
        }
        console.log('\n=== Test completed with errors ===\n');
      });
  } catch (dbError) {
    console.error('✗ Firestore initialization error:', dbError.message);
  }

} catch (error) {
  console.error('✗ Firebase initialization failed:', error.message);
  console.log('\n⚠️  ISSUE FOUND: Firebase initialization failed');
  console.log('  Check your API keys and project configuration.');
  console.log('\n=== Test failed ===\n');
}
