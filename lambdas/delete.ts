import { SQSHandler } from "aws-lambda";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({});

const extractS3Info = (recordBody: string) => {
  try {
    const body = JSON.parse(recordBody);
    return body.Records?.[0]?.s3 || null;
  } catch (err) {
    console.error("Failed to record body", err);
    return null;
  }
};

const deleteS3Object = async (bucket: string, key: string) => {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    console.log(`Deleted invalid image achieved: ${key}`);
  } catch (err) {
    console.error(`Failed to delete the target image: ${key}`, err);
  }
};

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    const s3Information = extractS3Info(record.body);

    if (!s3Information) {
      console.log("Invalid information of bucket");
      continue;
    }

    const bucket = s3Information.bucket.name;
    const key = decodeURIComponent(s3Information.object.key.replace(/\+/g, " "));

    await deleteS3Object(bucket, key);
  }
};
