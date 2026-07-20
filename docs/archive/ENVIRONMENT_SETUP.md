# 🔧 ENVIRONMENT CONFIGURATION

## Firebase Functions Environment Variables

### Required Variables

```bash
# Stripe API Keys
firebase functions:config:set stripe.secret_key="sk_test_YOUR_SECRET_KEY"
firebase functions:config:set stripe.publishable_key="pk_test_YOUR_PUBLISHABLE_KEY"

# Resend Email API
firebase functions:config:set resend.api_key="re_YOUR_API_KEY"

# Optional: Webhook secrets
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_WEBHOOK_SECRET"
```

### View Current Config
```bash
firebase functions:config:get
```

### Local Development (.env)

Create `functions/.env`:
```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
RESEND_API_KEY=re_YOUR_API_KEY
```

## Frontend Environment Variables

Create `.env.local`:
```env
# Firebase Config (from Firebase Console)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: Analytics
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Backend Validation Toggle (emergency switch)
VITE_USE_BACKEND_VALIDATION=true

# Environment
VITE_ENV=production
```

## Security Notes

1. **NEVER** commit `.env` files
2. **NEVER** hardcode API keys
3. Use Firebase Hosting for environment variables
4. Rotate keys regularly (every 90 days)
5. Use different keys for dev/staging/production

## Deployment Checklist

- [ ] Firebase Functions config set
- [ ] Frontend .env.local configured
- [ ] Stripe webhooks configured
- [ ] Resend domain verified
- [ ] Custom claims setup for admins
- [ ] Firestore indexes created
- [ ] Security rules deployed

## Testing

```bash
# Test Functions locally
cd functions
npm run serve

# Test with emulators
firebase emulators:start

# Test Functions deployment
firebase deploy --only functions --project staging
```

## Production Deployment

```bash
# 1. Set production config
firebase use production
firebase functions:config:set stripe.secret_key="sk_live_YOUR_KEY"

# 2. Deploy
firebase deploy

# 3. Verify
firebase functions:log --limit 10
```

## Troubleshooting

### Functions config not working
```bash
# Re-deploy functions
firebase deploy --only functions --force

# Check logs
firebase functions:log --only createReservationWithValidation
```

### Environment variables not loading
```bash
# Verify config
firebase functions:config:get

# Check runtime logs
gcloud functions logs read createReservationWithValidation --limit 50
```
