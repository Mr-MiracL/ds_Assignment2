import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";

export class EDAAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const Bucket = new s3.Bucket(this, "bucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
    });

    const DLQ = new sqs.Queue(this, "delete_queue", {
      retentionPeriod: Duration.days(1),
    });

    const imageQueue = new sqs.Queue(this, "message_queue", {
      visibilityTimeout: Duration.seconds(30),
      deadLetterQueue: {
        queue: DLQ,
        maxReceiveCount: 1,
      },
    });

    const imagesTable = new dynamodb.Table(this, "imagestable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const recordImageFn = new lambdanode.NodejsFunction(this, "recordImageFn", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: `${__dirname}/../lambdas/processImage.ts`,
      timeout: Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: imagesTable.tableName,
      },
    });

    Bucket.grantRead(recordImageFn);
    imagesTable.grantWriteData(recordImageFn);

    Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SqsDestination(imageQueue)
    );

    recordImageFn.addEventSource(
      new SqsEventSource(imageQueue, {
        batchSize: 1,
        maxBatchingWindow: Duration.seconds(5),
      })
    );

    const deleteInvalidFn = new lambdanode.NodejsFunction(this, "deleteInvalidFn", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: `${__dirname}/../lambdas/delete.ts`,
      timeout: Duration.seconds(10),
      memorySize: 128,
    });

    Bucket.grantDelete(deleteInvalidFn);

    deleteInvalidFn.addEventSource(
      new SqsEventSource(DLQ, {
        batchSize: 1,
        maxBatchingWindow: Duration.seconds(5),
      })
    );

  
    new cdk.CfnOutput(this, "bucketName", {
      value: Bucket.bucketName,
    });

    new cdk.CfnOutput(this, "tableName", {
      value: imagesTable.tableName,
    });
  }
}
