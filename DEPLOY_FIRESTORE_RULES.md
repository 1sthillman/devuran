# Deploy Firestore Rules - Quick Guide

## Prerequisites
- Firebase CLI installed (`npm install -g firebase-tools`)
- Logged in to Firebase (`firebase login`)
- Firebase project initialized in this directory

## Deployment Command

```bash
firebase deploy --only firestore:rules
```

## Alternative: Manual Deployment via Firebase Console

If you don't have Firebase CLI installed, you can deploy manually:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on "Firestore Database" in the left sidebar
4. Click on the "Rules" tab
5. Copy the contents of `firestore.rules` file
6. Paste into the rules editor
7. Click "Publish"

## Verify Deployment

After deployment, test the following:

### 1. Test Ban Customer
1. Login as business owner
2. Go to CRM panel
3. Try to ban a customer
4. Should work without permission errors

### 2. Test Review Submission
1. Login as customer
2. Complete an appointment
3. Try to submit a review
4. Should work without errors

### 3. Check Firebase Console
1. Go to Firebase Console
2. Click on "Firestore Database"
3. Click on "Rules" tab
4. Verify the rules match the `firestore.rules` file
5. Check "Rules Playground" to test specific scenarios

## What Changed in the Rules

### customers Collection
**Before:**
```javascript
allow write: if request.auth != null && 
                exists(/databases/$(database)/documents/salons/$(request.resource.data.salonId)) &&
                get(/databases/$(database)/documents/salons/$(request.resource.data.salonId)).data.ownerId == request.auth.uid;
```

**After:**
```javascript
// Separate create/update/delete with proper validation
allow create, update: if request.auth != null && 
                         request.resource.data.salonId is string &&
                         exists(/databases/$(database)/documents/salons/$(request.resource.data.salonId)) &&
                         get(/databases/$(database)/documents/salons/$(request.resource.data.salonId)).data.ownerId == request.auth.uid;

allow delete: if request.auth != null && 
                 resource.data.salonId is string &&
                 exists(/databases/$(database)/documents/salons/$(resource.data.salonId)) &&
                 get(/databases/$(database)/documents/salons/$(resource.data.salonId)).data.ownerId == request.auth.uid;
```

### blockedBusinesses Collection (NEW)
```javascript
match /blockedBusinesses/{blockId} {
  // Users can read their own blocks
  allow read: if request.auth != null && resource.data.userId == request.auth.uid;
  
  // Users can create blocks
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
  
  // Users can delete their own blocks
  allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
}
```

## Troubleshooting

### Error: "Missing or insufficient permissions"
- Verify rules are deployed
- Check that user is authenticated
- Verify document ID format: `{salonId}_{userId}` for customers
- Check that salonId field exists in the document

### Error: "Document doesn't exist"
- Verify the salon exists in the database
- Check that the salonId is correct
- Verify the user owns the salon

### Error: "Firebase CLI not found"
- Install Firebase CLI: `npm install -g firebase-tools`
- Or use manual deployment via Firebase Console

## Rollback

If something goes wrong, you can rollback to previous rules:

1. Go to Firebase Console
2. Click on "Firestore Database"
3. Click on "Rules" tab
4. Click on "History" at the top
5. Select a previous version
6. Click "Restore"

## Testing After Deployment

Run through this checklist:

- [ ] Business can ban customer without errors
- [ ] Business can unban customer
- [ ] Customer can review completed appointment
- [ ] Customer cannot review cancelled appointment
- [ ] Customer cannot review same appointment twice
- [ ] Blocked businesses don't appear in search
- [ ] Banned customers cannot book appointments

## Support

If you encounter issues after deployment:
1. Check Firebase Console for error logs
2. Check browser console for JavaScript errors
3. Verify authentication is working
4. Test with Firebase Rules Playground
5. Check document structure matches expected format
