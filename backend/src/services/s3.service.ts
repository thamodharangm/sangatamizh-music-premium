import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT,
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
});

const BUCKET = process.env.S3_BUCKET || 'music-bucket';

export async function getSignedPutUrl(key: string, contentType: string): Promise<string> {
  const params = {
    Bucket: BUCKET,
    Key: key,
    Expires: 60 * 5, // 5 minutes
    ContentType: contentType,
  };

  return s3.getSignedUrlPromise('putObject', params);
}

export async function getSignedGetUrl(key: string): Promise<string> {
  const params = {
    Bucket: BUCKET,
    Key: key,
    Expires: 60 * 10, // 10 minutes
  };

  return s3.getSignedUrlPromise('getObject', params);
}

export async function downloadFile(key: string): Promise<Buffer> {
  const params = {
    Bucket: BUCKET,
    Key: key,
  };

  const data = await s3.getObject(params).promise();
  return data.Body as Buffer;
}

export async function uploadFile(key: string, body: Buffer, contentType: string): Promise<void> {
  const params = {
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  };

  await s3.putObject(params).promise();
}
