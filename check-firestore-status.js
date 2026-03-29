// More detailed Firestore connection check
require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, limit, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('Checking Firestore status...\n');
console.log('Project ID:', firebaseConfig.projectId);
console.log('Auth Domain:', firebaseConfig.authDomain);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Try to access Firestore settings to check if database exists
console.log('\nAttempting to access Firestore...');

const testQuery = query(collection(db, 'articles'), limit(1));

getDocs(testQuery)
  .then((snapshot) => {
    console.log('✅ SUCCESS: Firestore database is accessible!');
    console.log(`   Found ${snapshot.size} document(s) in articles collection`);

    if (snapshot.empty) {
      console.log('\n📝 Note: Articles collection is empty (this is normal for a new project)');
    }

    console.log('\n✅ Your Firebase setup is working correctly!');
    console.log('   Next steps:');
    console.log('   1. Start the dev server: npm run dev');
    console.log('   2. Sign in with Google');
    console.log('   3. Try adding an article');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ ERROR:', error.code);
    console.error('   Message:', error.message);

    if (error.code === 'not-found') {
      console.log('\n🔍 DIAGNOSIS: Firestore database does not exist');
      console.log('\n📋 SOLUTION:');
      console.log('   1. Go to: https://console.firebase.google.com/project/the-librarian-9b852/firestore');
      console.log('   2. Click "Create Database"');
      console.log('   3. Choose a location (e.g., us-central1)');
      console.log('   4. Select "Start in test mode" for development');
      console.log('   5. Run this script again to verify');
    } else if (error.code === 'permission-denied') {
      console.log('\n🔍 DIAGNOSIS: Database exists but security rules are blocking access');
      console.log('\n📋 SOLUTION:');
      console.log('   1. Go to: https://console.firebase.google.com/project/the-librarian-9b852/firestore/rules');
      console.log('   2. Update rules to allow authenticated users:');
      console.log('\n   rules_version = \'2\';');
      console.log('   service cloud.firestore {');
      console.log('     match /databases/{database}/documents {');
      console.log('       match /articles/{articleId} {');
      console.log('         allow read, write: if request.auth != null;');
      console.log('       }');
      console.log('     }');
      console.log('   }');
    } else if (error.code === 'unavailable') {
      console.log('\n🔍 DIAGNOSIS: Cannot reach Firestore servers');
      console.log('\n📋 SOLUTION:');
      console.log('   - Check your internet connection');
      console.log('   - Verify Firebase project status at console.firebase.google.com');
      console.log('   - Check if you have any firewall/proxy blocking Firebase');
    } else {
      console.log('\n🔍 DIAGNOSIS: Unknown error');
      console.log('\n📋 SOLUTION:');
      console.log('   - Check Firebase Console: https://console.firebase.google.com/project/the-librarian-9b852');
      console.log('   - Verify project is active and not suspended');
      console.log('   - Check billing status if on a paid plan');
    }

    process.exit(1);
  });

// Set timeout to detect hanging
setTimeout(() => {
  console.log('\n⏱️  Taking too long... This might indicate network issues or database not found');
  console.log('   The script will continue running in the background...');
}, 5000);
