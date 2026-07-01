import { S3Client, CreateBucketCommand, PutBucketCorsCommand, ListBucketsCommand } from '@aws-sdk/client-s3';

const accountId = 'c885d9b3bfb94036e6aa37d894548072';
const accessKeyId = 'f75e1f2bdd7e84e58e7da613078e184d';
const secretAccessKey = 'dcdcb07e1ad7dd91d42687b954c48381d04c3ea62e6bfa282e02ce4122ba2f66';
const bucketName = 'randevu-images';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function createBucket() {
  try {
    console.log('🔍 Checking existing buckets...');
    
    // List buckets
    const listCommand = new ListBucketsCommand({});
    const { Buckets } = await client.send(listCommand);
    
    if (Buckets) {
      console.log('📦 Existing buckets:');
      Buckets.forEach(bucket => console.log(`   - ${bucket.Name}`));
      
      // Check if bucket already exists
      if (Buckets.find(b => b.Name === bucketName)) {
        console.log(`\n✅ Bucket "${bucketName}" already exists!`);
        return;
      }
    }

    console.log(`\n🔨 Creating bucket: ${bucketName}`);
    const createCommand = new CreateBucketCommand({ Bucket: bucketName });
    await client.send(createCommand);
    console.log('✅ Bucket created successfully!');

    // Configure CORS
    console.log('\n🔧 Configuring CORS...');
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
    console.log('✅ CORS configured!');

    console.log('\n🎉 R2 Bucket Setup Complete!');
    console.log(`📦 Bucket: ${bucketName}`);
    console.log(`🌐 Public URL: https://${bucketName}.${accountId}.r2.dev`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

createBucket();
