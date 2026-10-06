import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: 'id-jkt-1',
  endpoint: process.env.NEXT_PUBLIC_S3_ENDPOINT || 'https://s3-id-jkt-1.kilatstorage.id',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY || '',
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_KEY || '',
  },
  forcePathStyle: true,
});

export const getProfilePictureUrl = async (fileName: string) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'foto-profile',
      Key: fileName,
    });
    // Generate a signed URL valid for 1 hour (3600 seconds)
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return url;
  } catch (error) {
    console.error('Error generating S3 signed URL:', error);
    return null;
  }
};
