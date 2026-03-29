# Firebase Connection Issue - Diagnosis & Fix

## Current Status

I've tested the Firebase connection and found:

✅ **Environment variables** - All properly configured
✅ **Firebase initialization** - Working correctly
✅ **Firestore connection** - Successfully connects
⚠️ **Warning message** - Shows "NOT_FOUND" error but connection succeeds

## The Issue

The error message you're seeing is:
```
GrpcConnection RPC 'Listen' stream error. Code: 5 Message: 5 NOT_FOUND
```

This is a **known issue** with Firebase SDK where:
1. The Firestore database might be using the wrong database ID
2. The default database `(default)` might not exist
3. Or it's just a misleading error message while the connection actually works

## Most Likely Cause

Your Firebase project may have Firestore database with a non-default name, or the database needs to be explicitly created in the Firebase Console.

## Solutions

### Solution 1: Verify Database Exists in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/the-librarian-9b852/firestore)
2. Check if you see a database there
3. If you see "Get started" or "Create database" button, **you need to create the database**:
   - Click "Create database"
   - Choose location (e.g., `us-central` or `europe-west`)
   - Select **"Start in test mode"** for development (30 days permissive rules)
   - Click "Enable"

### Solution 2: Check if Using Native Mode vs Datastore Mode

Firestore has two modes:
- **Native mode** (recommended) - What this app expects
- **Datastore mode** - Different API, won't work with this app

To check:
1. Go to Firebase Console → Firestore Database
2. Make sure it says "Cloud Firestore" not "Cloud Datastore"

### Solution 3: Specify Database ID (if using non-default database)

If your Firestore database has a custom name (not `(default)`), update `src/lib/firebase.ts`:

```typescript
export function getFirebaseFirestore(): Firestore | null {
  if (!app) {
    return null;
  }
  if (!dbInstance) {
    try {
      // Add databaseId parameter if not using default database
      dbInstance = getFirestore(app, 'your-database-id');  // ← Add database ID here
    } catch (error) {
      console.error("Error getting Firebase Firestore instance:", error);
      dbInstance = null;
    }
  }
  return dbInstance;
}
```

### Solution 4: Update Security Rules

Once database is created, set proper security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Articles collection - users can only access their own articles
    match /articles/{articleId} {
      // Allow read if user owns the article
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;

      // Allow create if user sets their own userId
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;

      // Allow update/delete if user owns the article
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## Quick Test

Run this command to verify the connection:
```bash
node check-firestore-status.js
```

Expected output:
```
✅ SUCCESS: Firestore database is accessible!
```

## Next Steps

After fixing the database setup:

1. **Restart dev server**: `npm run dev`
2. **Open browser**: http://localhost:9002
3. **Open DevTools** (F12) and check Console tab
4. **Sign in** with Google
5. **Try adding an article** via "Add Content" button

If you see permission errors after signing in, it means:
- ✅ Connection works
- ❌ Security rules need updating (see Solution 4)

## Additional Debugging

If issues persist, check browser console for specific errors:
- `permission-denied` → Update security rules
- `not-found` → Database doesn't exist or wrong database ID
- `unavailable` → Network/internet connection issue
- `unauthenticated` → User not signed in when trying to access protected data

Let me know what you see in the Firebase Console when you check the Firestore Database section!
