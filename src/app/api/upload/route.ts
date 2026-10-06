import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'id-jkt-1',
  endpoint: process.env.NEXT_PUBLIC_S3_ENDPOINT || 'https://s3-id-jkt-1.kilatstorage.id',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY || '',
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_KEY || '',
  },
  forcePathStyle: true,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = userId ? `profile-${userId}.jpg` : 'profile.jpg';
    
    const command = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'foto-profile',
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error uploading to S3:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
