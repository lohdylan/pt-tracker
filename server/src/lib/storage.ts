import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = process.env.BUCKET_ENDPOINT
  ? new S3Client({
      region: process.env.BUCKET_REGION || "us-east-1",
      endpoint: process.env.BUCKET_ENDPOINT,
      credentials: {
        accessKeyId: process.env.BUCKET_ACCESS_KEY_ID!,
        secretAccessKey: process.env.BUCKET_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    })
  : null;

const BUCKET = process.env.BUCKET_NAME || "";

export function isS3Enabled(): boolean {
  return s3 !== null;
}

export async function uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
  if (!s3) throw new Error("S3 not configured");
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return key;
}

export async function getSignedFileUrl(key: string, expiresIn = 3600): Promise<string> {
  if (!s3) throw new Error("S3 not configured");
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}

export async function deleteFile(key: string): Promise<void> {
  if (!s3) throw new Error("S3 not configured");
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
