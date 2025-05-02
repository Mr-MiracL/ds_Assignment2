import { SQSHandler } from "aws-lambda";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({}); 

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    const s3Info = body.Records?.[0]?.s3; 

    if (!s3Info) {
      console.log("Invalid S3 info");
      continue;
    }

    const bucket = s3Info.bucket.name;
    const key = decodeURIComponent(s3Info.object.key.replace(/\+/g, " "));

    try {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })); 
      console.log(`Deleted invalid image: ${key}`); 
    } catch (err) {
      console.error(`Failed to delete image: ${key}`, err); 
    }
  }
};
