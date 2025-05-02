import { SQSHandler } from "aws-lambda"; 
import {
  DynamoDBClient,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import {
  S3Client,
} from "@aws-sdk/client-s3"; 

const s3 = new S3Client({});
const dynamo = new DynamoDBClient({});

const allowedExtensions = [".jpeg", ".png"];

const tableName = process.env.TABLE_NAME!;

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    const body = JSON.parse(record.body); 
    const s3Info = body.Records?.[0]?.s3;

    if (!s3Info) {
      console.log("No information in message");
      continue;
    }

    const objectKey = decodeURIComponent(s3Info.object.key.replace(/\+/g, " "));
    const ext = objectKey.slice(objectKey.lastIndexOf(".")).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      console.log(`Unsupported type: ${ext}`);
      throw new Error("Unsupported type");
    }

    const putCommand = new PutItemCommand({
      TableName: tableName,
      Item: {
        id: { S: objectKey }, 
        createdAt: { S: new Date().toISOString() }, 
      },
    });

    await dynamo.send(putCommand); 

    console.log(`Image ${objectKey} recorded.`);
  }
};
