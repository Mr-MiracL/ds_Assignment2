import { SNSHandler } from "aws-lambda";
import {
  SESClient,
  SendEmailCommand,
  SendEmailCommandInput,
} from "@aws-sdk/client-ses";
import { SES_EMAIL_FROM, SES_EMAIL_TO, SES_REGION } from "../env"; 

const ses = new SESClient({ region: SES_REGION });

const FROM = SES_EMAIL_FROM;
const TO = SES_EMAIL_TO;

export const handler: SNSHandler = async (event) => {
  console.log("Received status update:", JSON.stringify(event));

  for (const record of event.Records) {
    const { id, status, reason } = JSON.parse(record.Sns.Message);

    const subject = `Review Result: ${status}`;
    const htmlBody = `
      <h2>Your information has been reviewed:</h2>
      <p><strong>Image ID:</strong> ${id}</p>
      <p><strong>Status:</strong> ${status}</p>
      <p><strong>Reason:</strong> ${reason}</p>
    `;

    const params: SendEmailCommandInput = {
      Destination: { ToAddresses: [TO] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: htmlBody, Charset: "UTF-8" },
        },
      },
      Source: FROM,
    };

    try {
      await ses.send(new SendEmailCommand(params));
      console.log(`Email sent to photographer regarding image: ${id}`);
    } catch (err) {
      console.error("Failed to send email", err);
    }
  }
};
