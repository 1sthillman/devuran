# 🚀 Quick Start Guide

Get Google Maps Integration running in 15 minutes.

## Prerequisites

- Node.js 18+
- Redis installed and running
- Firebase project created
- Google Cloud project created

## Step 1: Clone and Install (2 min)

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

## Step 2: Configure Firebase (3 min)

### 2.1 Get Firebase Credentials

1. Go to Firebase Console → Project Settings
2. Service Accounts → Generate New Private Key
3. Save as `service-account-key.json` in project root
4. Copy Web SDK config to `.env`:

```env
VITE_FIREBASE_API_KEY=AIzaXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
# ... etc
```

### 2.2 Deploy Firestore Rules & Indexes

```bash
firebase login
firebase init firestore
firebase deploy --only firestore
```

Wait 10-15 minutes for indexes to build.

### 2.3 Initialize Sample Data

```bash
node scripts/init-firestore.js
```

## Step 3: Configure Google OAuth (5 min)

### 3.1 Create OAuth Credentials

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID
3. Application type: Web application
4. Authorized redirect URIs:
   - `http://localhost:3000/api/v1/google/oauth/callback`
5. Copy Client ID and Secret to `.env`:

```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

### 3.2 Enable Google Business Profile API

```bash
gcloud services enable mybusiness.googleapis.com
```

Or enable in Cloud Console → APIs & Services → Library

## Step 4: Configure Redis (2 min)

### Local Redis

```bash
# Start Redis
redis-server
```

### Or use Docker

```bash
docker run -d -p 6379:6379 redis:7-alpine
```

Update `.env`:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Step 5: Generate Encryption Key (1 min)

```bash
node scripts/generate-encryption-key.js
```

Copy the output to `.env`:
```env
ENCRYPTION_KEY=your-generated-key-here
```

## Step 6: Start Application (2 min)

### Terminal 1: Backend

```bash
npm run build
npm start
```

Backend running at: http://localhost:3000

### Terminal 2: Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend running at: http://localhost:5173

## Step 7: Create Test User

### Option A: Firebase Auth Console

1. Go to Firebase Console → Authentication
2. Add user manually:
   - Email: owner@example.com
   - Password: (your choice)
   - UID: sample-user-id (important!)

### Option B: Using Firebase Auth REST API

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Use Firebase Auth
firebase auth:import users.json
```

## Step 8: Test the Integration (5 min)

### 8.1 Login

1. Go to http://localhost:5173
2. Login with your test user

### 8.2 Connect Google Account

1. Navigate to http://localhost:5173/integrations/google-maps
2. Click "Google Hesabı Bağla"
3. Authorize with your Google Business Profile account
4. You should see "Bağlantı başarılı" message

### 8.3 Sync Locations

1. Click "Senkronize Et" button
2. Your GBP locations should appear in the table

### 8.4 Activate a Location

1. Click ✅ on a verified location
2. Wait for appointment URL to be generated
3. Click 📋 to copy URL
4. Click 🔗 to test the appointment page

### 8.5 Book an Appointment

1. Visit the appointment URL
2. Select a service
3. Pick a date and time
4. Fill customer info
5. Complete booking
6. Check confirmation page

### 8.6 View in Dashboard

1. Go to "İstatistikler" tab
2. See your test booking in metrics
3. Check "Loglar" tab for operation history

## Troubleshooting

### Redis Connection Failed

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not, start Redis
redis-server
```

### Firebase Permission Denied

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Check user has correct role
# In Firestore, verify users/sample-user-id has roles: ['business_owner']
```

### OAuth Redirect URI Mismatch

Make sure Google Cloud Console OAuth redirect URI **exactly** matches:
```
http://localhost:3000/api/v1/google/oauth/callback
```

### Firestore Indexes Not Ready

Wait 10-15 minutes after deploying indexes. Check status:
```bash
firebase firestore:indexes
```

### Port Already in Use

```bash
# Backend (3000)
lsof -ti:3000 | xargs kill

# Frontend (5173)
lsof -ti:5173 | xargs kill
```

## Verification Checklist

- [ ] Backend running on http://localhost:3000
- [ ] Frontend running on http://localhost:5173
- [ ] Redis responding to `redis-cli ping`
- [ ] Firestore rules deployed
- [ ] Firestore indexes built
- [ ] OAuth credentials configured
- [ ] Test user created in Firebase Auth
- [ ] Sample data in Firestore
- [ ] Can login to dashboard
- [ ] Can connect Google account
- [ ] Can sync locations
- [ ] Can activate location
- [ ] Can view appointment page
- [ ] Can create booking

## Next Steps

Once everything works locally:

1. **Production Setup**: Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. **Invite Real Users**: Add business owners to Firebase Auth
3. **Monitor**: Set up logging and error tracking
4. **Scale**: Configure production Redis and upgrade Firestore

## Need Help?

- Documentation: Check all `*_SUMMARY.md` files
- Issues: Create GitHub issue
- Email: support@yourcompany.com

---

**Total Time:** ~15 minutes  
**Difficulty:** Easy  
**Status:** Ready to use! 🎉
