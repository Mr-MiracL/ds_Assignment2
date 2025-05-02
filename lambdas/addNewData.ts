import { SNSHandler, SNSMessage } from "aws-lambda"; 
import {
  DynamoDBClient,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";

const dynamo = new DynamoDBClient({});

export const handler: SNSHandler = async (event) => {
  console.log("SNS Event:", JSON.stringify(event));

  for (const record of event.Records) {
    const snsMsg = record.Sns;

    const { id, value } = JSON.parse(snsMsg.Message);

    const metadataType = snsMsg.MessageAttributes?.metadata_type?.Value;

    const updateCommand = new UpdateItemCommand({
      TableName: process.env.TABLE_NAME!,
      Key: {
        id: { S: id },
      },
      UpdateExpression: `SET #meta = :val`,
      ExpressionAttributeNames: {
        "#meta": metadataType, 
      },
      ExpressionAttributeValues: {
        ":val": { S: value },
      },
    });

    try {
      await dynamo.send(updateCommand);
      console.log(`Updated image [${id}] - ${metadataType}: ${value}`);
    } catch (err) {
      console.error("DynamoDB update failed", err);
    }
  }
};
