# Firebase Connection Diagnosis

## Test Results

The Firebase SDK connection test shows:
- ✅ Environment variables are properly configured
- ✅ Firebase app initializes successfully
- ✅ Auth instance created
- ✅ Firestore instance created
- ⚠️ **WARNING**: Firestore shows "NOT_FOUND" error

## Likely Issue: Database Not Created

The error message `5 NOT_FOUND` suggests the Firestore database hasn't been created in your Firebase project.

## How to Fix

### Option 1: Create Firestore Database via Firebase Console

1. Go to https://console.firebase.google.com/project/the-librarian-9b852
2. Click on "Firestore Database" in the left sidebar
3. Click "Create database"
4. Choose a location (e.g., `us-central1`)
5. Start in **Production mode** or **Test mode**:
   - **Test mode**: Allows all reads/writes for 30 days (good for development)
   - **Production mode**: Requires proper security rules

### Option 2: Set Firestore Security Rules

If the database exists but you're getting permission errors, update the security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /articles/{articleId} {
      // Allow users to read their own articles
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;

      // Allow users to create articles with their own userId
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;

      // Allow users to update/delete their own articles
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Option 3: Enable Test Mode (Development Only)

For quick testing, use these permissive rules (⚠️ NOT for production):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Next Steps

1. Check if Firestore database exists in Firebase Console
2. If not, create the database
3. Set appropriate security rules
4. Restart your development server: `npm run dev`
5. Try signing in with Google and adding an article

## Additional Checks

### Verify Firebase Project Settings

Make sure your Firebase project (`the-librarian-9b852`) has:
- ✅ Authentication enabled (Google provider)
- ✅ Firestore Database created
- ✅ Billing enabled (if required for your usage tier)

### Check Browser Console

When you run the app, open browser DevTools (F12) and check for:
- Firebase initialization messages
- Authentication errors
- Firestore connection errors
