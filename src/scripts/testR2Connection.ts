/**
 * R2 Connection Test Script
 * Test Cloudflare R2 bucket connection and create bucket if needed
 */

import { r2Storage } from '../services/r2StorageService';
import { S3Client, CreateBucketCommand, ListBucketsCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';

async function testR2Connection() {
  console.log('🔍 Testing Cloudflare R2 Connection...\n');

  // Check if R2 is configured
  if (!r2Storage.isReady()) {
    console.error('❌ R2 is not configured. Check your environment variables:');
    console.error('   - VITE_R2_ACCOUNT_ID');
    console.error('   - VITE_R2_ACCESS_KEY_ID');
    console.error('   - VITE_R2_SECRET_ACCESS_KEY');
    return;
  }

  console.log('✅ R2 configuration found');

  // Test connection
  const connected = await r2Storage.testConnection();

  if (connected) {
    console.log('✅ R2 bucket connection successful');
    console.log(`📦 Bucket: ${r2Storage.getBucketName()}`);
    console.log(`🌐 Public URL: ${r2Storage.getPublicUrl('')}`);
  } else {
    console.log('⚠️  Bucket connection failed. Attempting to create bucket...\n');

    try {
      const accountId = import.meta.env.VITE_R2_ACCOUNT_ID;
      const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID;
      const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;
      const bucketName = import.meta.env.VITE_R2_BUCKET_NAME || 'randevu-images';

      const client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      // List existing buckets
      console.log('📋 Listing existing buckets...');
      const listCommand = new ListBucketsCommand({});
      const { Buckets } = await client.send(listCommand);
      
      if (Buckets && Buckets.length > 0) {
        console.log('Existing buckets:');
        Buckets.forEach(bucket => {
          console.log(`  - ${bucket.Name}`);
        });
      }

      // Create bucket
      console.log(`\n🔨 Creating bucket: ${bucketName}`);
      const createCommand = new CreateBucketCommand({ Bucket: bucketName });
      await client.send(createCommand);
      console.log('✅ Bucket created successfully');

      // Configure CORS for web uploads
      console.log('🔧 Configuring CORS...');
      const corsCommand = new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ['*'],
              AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
              AllowedOrigins: ['*'],
              ExposeHeaders: ['ETag'],
              MaxAgeSeconds: 3000,
            },
          ],
        },
      });
      await client.send(corsCommand);
      console.log('✅ CORS configured');

      // Test again
      const retestConnected = await r2Storage.testConnection();
      if (retestConnected) {
        console.log('\n✅ Bucket setup complete and verified');
      }

    } catch (error: any) {
      console.error('❌ Failed to create bucket:', error.message);
      console.error('\n📝 Manual setup required:');
      console.error('   1. Go to: https://dash.cloudflare.com/');
      console.error('   2. Navigate to R2 Object Storage');
      console.error('   3. Create a bucket named "randevu-images"');
      console.error('   4. Enable public access if needed');
    }
  }

  console.log('\n✨ R2 connection test complete\n');
}

// Run test
testR2Connection().catch(console.error);
