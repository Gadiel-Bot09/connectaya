import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "us-east-1", // Minio default usually works with us-east-1
  endpoint: process.env.MINIO_ENDPOINT,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true, // Crucial for Minio compatibility
});

export async function uploadFileToMinio(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  const bucketName = process.env.MINIO_BUCKET_NAME!;
  
  const uploadParams = {
    Bucket: bucketName,
    Key: filename,
    Body: buffer,
    ContentType: mimeType,
  };

  const command = new PutObjectCommand(uploadParams);
  
  try {
    await s3Client.send(command);
    // Returns the direct static URL for the image
    const endpointRegex = process.env.MINIO_ENDPOINT?.replace(/\/+$/, '') || '';
    return `${endpointRegex}/${bucketName}/${filename}`;
  } catch (error) {
    console.error("Error uploading to Minio:", error);
    throw new Error("S3 Upload failed");
  }
}
