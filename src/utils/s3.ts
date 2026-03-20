import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "us-east-1", 
  endpoint: (process.env.MINIO_ENDPOINT || '').trim(),
  credentials: {
    accessKeyId: (process.env.MINIO_ACCESS_KEY || '').trim(),
    secretAccessKey: (process.env.MINIO_SECRET_KEY || '').trim(),
  },
  forcePathStyle: true, 
});

export async function uploadFileToMinio(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  const bucketName = (process.env.MINIO_BUCKET_NAME || '').trim();
  
  const uploadParams = {
    Bucket: bucketName,
    Key: filename,
    Body: buffer,
    ContentType: mimeType,
  };

  const command = new PutObjectCommand(uploadParams);
  
  try {
    await s3Client.send(command);
    const endpointRegex = (process.env.MINIO_ENDPOINT || '').trim().replace(/\/+$/, '');
    return `${endpointRegex}/${bucketName}/${filename}`;
  } catch (error: any) {
    console.error("Error uploading to Minio:", error);
    throw new Error("S3 Upload failed: " + (error.message || JSON.stringify(error)));
  }
}
