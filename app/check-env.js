// Check if all required environment variables are set
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

console.log('Checking environment variables...\n');

let allSet = true;
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: NOT SET`);
    allSet = false;
  } else {
    // Show first 10 chars for security
    const preview = value.substring(0, 10) + '...';
    console.log(`✅ ${varName}: ${preview}`);
  }
});

console.log('\n' + (allSet ? '✅ All variables set!' : '❌ Some variables missing!'));
process.exit(allSet ? 0 : 1);
