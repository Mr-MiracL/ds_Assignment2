import { SNSHandler } from "aws-lambda";
import {
  DynamoDBClient,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const dynamo = new DynamoDBClient({});
const sns = new SNSClient({});

const tableName = process.env.TABLE_NAME!;
const notifyTopicArn = process.env.STATUS_NOTIFY_TOPIC_ARN!;

export const handler: SNSHandler = async (event) => {
  console.log("Received review message:", JSON.stringify(event));

  for (const record of event.Records) {
    const message = JSON.parse(record.Sns.Message);
    const { id, date, update } = message;
    const { status, reason } = update;

    if (!id || !status || !reason) {
      console.warn("lost data ,jump through messgae");
      continue;
    }

    const updateCmd = new UpdateItemCommand({
      TableName: tableName,
      Key: {
        id: { S: id },
      },
      UpdateExpression: "SET #s = :s, #r = :r",
      ExpressionAttributeNames: {
        "#s": "status",
        "#r": "reason",
      },
      ExpressionAttributeValues: {
        ":s": { S: status },
        ":r": { S: reason },
      },
    });

    await dynamo.send(updateCmd);
    console.log(`image [${id}] status update to ${status}`);

    await sns.send(new PublishCommand({
        TopicArn: notifyTopicArn,
        Message: JSON.stringify({
          id,
          status: update.status,
          reason: update.reason,
        }),
      }));
  
      console.log(`Status change published for ${id}`);
  }
};

