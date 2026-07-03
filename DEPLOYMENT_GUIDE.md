# 🚀 DEPLOYMENT GUIDE - Critical Security Fixes

**Platform:** Devuran Multi-Sector Reservation System  
**Date:** 3 Temmuz 2026  
**Deployment Type:** Critical Security & Bug Fixes  
**Estimated Time:** 30-45 minutes  
**Downtime:** None (rolling deployment)

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### ✅ Required Before Starting

- [ ] Firestore database backup completed
- [ ] All team members notified
- [ ] Staging tests passed
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Firebase project access verified (`firebase login`)
- [ ] Node.js 18+ installed
- [ ] All dependencies installed (`npm install`)

### 🔍 Verification Commands

```bash
# Check Firebase CLI version
firebase --version  # Should be >= 12.0.0

# Check logged in user
firebase login:list

# Check current project
firebase projects:list
```

---

## 🎯 DEPLOYMENT STEPS

### STEP 1: Database Backup (5 minutes)

```bash
# Export Firestore data
gcloud config set project YOUR_PROJECT_ID

# Create backup
gcloud firestore export gs://YOUR_BACKUP_BUCKET/$(date +%Y-%m-%d)

# Verify backup
gsutil ls gs://YOUR_BACKUP_BUCKET/
```

**Expected Output:**
```
gs://YOUR_BACKUP_BUCKET/2026-07-03/
  all_namespaces/
  all_namespaces/all_kinds/
```

---

### STEP 2: Deploy Cloud Functions (10 minutes)

```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Build TypeScript
npm run build

# Deploy functions
firebase deploy --only functions

# Or deploy specific functions
firebase deploy --only functions:onBusinessUpdate,functions:onStaffDelete,functions:onBusinessDelete,functions:onStaffUpdate
```

**Expected Output:**
```
✔  functions[onBusinessUpdate(europe-west1)] Successful create operation.
✔  functions[onStaffDelete(europe-west1)] Successful create operation.
✔  functions[onBusinessDelete(europe-west1)] Successful create operation.
✔  functions[onStaffUpdate(europe-west1)] Successful create operation.

✔  Deploy complete!
```

**Verification:**
```bash
# Check function status
firebase functions:list

# Check logs
firebase functions:log --only onBusinessUpdate --limit 10
```

---

### STEP 3: Deploy Firestore Rules (2 minutes)

```bash
# Test rules locally (optional)
firebase emulators:start --only firestore

# Deploy rules
firebase deploy --only firestore:rules
```

**Expected Output:**
```
✔  firestore: released rules firestore.rules to cloud.firestore

✔  Deploy complete!
```

**Verification:**
```bash
# Rules should be updated immediately
# Check Firebase Console > Firestore > Rules tab
```

---

### STEP 4: Deploy Frontend (10 minutes)

```bash
# Navigate to project root
cd ..

# Install dependencies
npm install

# Build production bundle
npm run build

# Deploy to hosting
firebase deploy --only hosting

# Or if using Vercel/other hosting
# Upload dist/ folder to your hosting provider
```

**Expected Output:**
```
✔  hosting[YOUR_PROJECT]: file upload complete

✔  Deploy complete!

Hosting URL: https://YOUR_PROJECT.web.app
```

---

### STEP 5: Set Admin Custom Claims (5 minutes)

Create a file `set-admin-claims.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const adminEmails = [
  'adistow@gmail.com',
  'admin@restoqr.com',
  'minif@restoqr.com',
  'minifinise@gmail.com'
];

async function setAdminClaims() {
  console.log('🔧 Setting admin custom claims...\n');
  
  for (const email of adminEmails) {
    try {
      const user = await admin.auth().getUserByEmail(email);
      await admin.auth().setCustomUserClaims(user.uid, { admin: true });
      console.log(`✅ Admin claim set: ${email} (uid: ${user.uid})`);
    } catch (error) {
      console.error(`❌ Error for ${email}:`, error.message);
    }
  }
  
  console.log('\n✅ Admin claims setup complete!');
  process.exit(0);
}

setAdminClaims();
```

Run the script:

```bash
# Download service account key from Firebase Console
# Settings > Service Accounts > Generate New Private Key

# Place key as serviceAccountKey.json

# Run script
node set-admin-claims.js
```

**Expected Output:**
```
🔧 Setting admin custom claims...

✅ Admin claim set: adistow@gmail.com (uid: abc123...)
✅ Admin claim set: admin@restoqr.com (uid: def456...)
✅ Admin claim set: minif@restoqr.com (uid: ghi789...)
✅ Admin claim set: minifinise@gmail.com (uid: jkl012...)

✅ Admin claims setup complete!
```

---

### STEP 6: Database Migration - trialUsed Flag (5 minutes)

Create a file `migrate-trial-flag.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateTrialFlags() {
  console.log('🔄 Migrating trialUsed flags...\n');
  
  // Get all subscriptions that have used trial
  const subscriptions = await db.collection('subscriptions')
    .where('status', '==', 'trial')
    .get();
  
  console.log(`Found ${subscriptions.size} trial subscriptions`);
  
  const batch = db.batch();
  let count = 0;
  
  subscriptions.forEach(doc => {
    batch.update(doc.ref, { 
      trialUsed: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    count++;
  });
  
  if (count > 0) {
    await batch.commit();
    console.log(`✅ Updated ${count} subscriptions with trialUsed flag`);
  } else {
    console.log('ℹ️  No subscriptions to update');
  }
  
  // Also check expired trials
  const expiredTrials = await db.collection('subscriptions')
    .where('trialEndDate', '<', new Date().toISOString())
    .get();
  
  const batch2 = db.batch();
  let count2 = 0;
  
  expiredTrials.forEach(doc => {
    if (!doc.data().trialUsed) {
      batch2.update(doc.ref, { 
        trialUsed: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      count2++;
    }
  });
  
  if (count2 > 0) {
    await batch2.commit();
    console.log(`✅ Updated ${count2} expired trials with trialUsed flag`);
  }
  
  console.log('\n✅ Migration complete!');
  process.exit(0);
}

migrateTrialFlags();
```

Run:

```bash
node migrate-trial-flag.js
```

---

## 🧪 POST-DEPLOYMENT TESTING

### Test 1: Backend Validation

```bash
# Test price manipulation attempt
curl -X POST https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/createReservationWithValidation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -d '{
    "businessId": "test-business",
    "userId": "test-user",
    "type": "slot",
    "services": [{"id": "service-1"}],
    "totalPrice": 1,
    "date": "2026-07-05",
    "startTime": "10:00",
    "endTime": "11:00"
  }'
```

**Expected:** Price validation error if actual price != 1

### Test 2: Double Booking Prevention

Open 2 browser windows and try to book the same slot simultaneously.

**Expected:** Only 1 booking should succeed, other should get "Bu slot artık müsait değil" error.

### Test 3: Admin Custom Claims

Log in as admin user and check:

```javascript
// Browser console
firebase.auth().currentUser.getIdTokenResult()
  .then(token => console.log('Admin claim:', token.claims.admin));
```

**Expected:** `Admin claim: true`

### Test 4: Cascade Updates

1. Update a business name in Firebase Console
2. Check reservations collection - `businessName` should update
3. Check Cloud Functions logs for cascade messages

### Test 5: Staff Delete Orphan Prevention

1. Create a test staff member
2. Create a reservation with that staff
3. Delete the staff member
4. Check reservation status - should be `cancelled_by_business`

---

## 📊 MONITORING

### Firebase Console Checks

1. **Functions Tab**
   - All new functions deployed: ✅
   - Error rate < 1%: ✅
   - Avg execution time < 2s: ✅

2. **Firestore Tab**
   - Rules updated: ✅
   - Write operations increased (expected): ✅
   - No permission errors: ✅

3. **Authentication Tab**
   - Admin users have custom claims: ✅

### Cloud Functions Logs

```bash
# Monitor all functions
firebase functions:log --limit 100

# Monitor specific function
firebase functions:log --only onBusinessUpdate --limit 20

# Monitor errors only
firebase functions:log --only onBusinessUpdate --limit 20 | grep ERROR
```

### Key Log Messages to Watch

✅ **Good:**
```
[CASCADE] Business name updated: X → Y
[CASCADE] Updated N reservations
[ORPHAN PREVENTION] Cancelled N reservations
```

❌ **Bad:**
```
ERROR: Transaction failed
ERROR: Permission denied
ERROR: Deadline exceeded
```

---

## 🚨 ROLLBACK PROCEDURE

If critical issues occur:

### Quick Rollback (5 minutes)

```bash
# Rollback functions
firebase deploy --only functions --force

# Rollback rules
firebase deploy --only firestore:rules --force

# Rollback frontend
firebase hosting:channel:deploy rollback --expires 1h
```

### Full Rollback (10 minutes)

```bash
# 1. Disable backend validation
# Edit src/store/bookingStore.ts
const USE_BACKEND_VALIDATION = false;

# 2. Rebuild and deploy
npm run build
firebase deploy --only hosting

# 3. Restore old rules
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules

# 4. Delete new functions
firebase functions:delete onBusinessUpdate
firebase functions:delete onStaffDelete
firebase functions:delete onBusinessDelete
firebase functions:delete onStaffUpdate
```

---

## ✅ DEPLOYMENT COMPLETION CHECKLIST

- [ ] All Cloud Functions deployed successfully
- [ ] Firestore Rules updated and working
- [ ] Frontend deployed and accessible
- [ ] Admin custom claims set
- [ ] Database migration completed
- [ ] All post-deployment tests passed
- [ ] No error spikes in logs (24h monitoring)
- [ ] Team notified of completion
- [ ] Documentation updated

---

## 📞 SUPPORT CONTACTS

**Technical Issues:**
- Kiro AI Support: support@kiro.ai
- Firebase Support: https://firebase.google.com/support

**Emergency Rollback:**
- Contact: admin@restoqr.com
- Phone: +90 XXX XXX XXXX

---

**Deployment Completed:** _____________  
**Deployed By:** _____________  
**Verified By:** _____________  
**Notes:** _____________

---

## 🎉 SUCCESS CRITERIA

Deployment is considered successful when:

✅ Zero errors in Cloud Functions logs (first hour)  
✅ No spike in error rates (< 1% increase)  
✅ Backend validation working (check logs for rejections)  
✅ Admin users can access admin panel  
✅ No customer complaints about bookings  
✅ Double booking rate = 0%  

**If all criteria met → Deployment SUCCESS! 🎉**
