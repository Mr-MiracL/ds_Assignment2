import { SQSHandler } from "aws-lambda"; // 引入 Lambda 的 SQS 处理器类型
import {
  DynamoDBClient,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb"; // 引入 DynamoDB 客户端及写入命令
import {
  S3Client,
} from "@aws-sdk/client-s3"; // 引入 S3 客户端用于验证文件存在

// 创建 S3 和 DynamoDB 客户端
const s3 = new S3Client({});
const dynamo = new DynamoDBClient({});

// 允许的图片类型
const allowedExtensions = [".jpeg", ".png"];

// 从环境变量读取表名（CDK 中配置）
const tableName = process.env.TABLE_NAME!;

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    const body = JSON.parse(record.body); // SQS 消息体中嵌套 SNS/S3 事件
    const s3Info = body.Records?.[0]?.s3; // 提取 S3 信息

    if (!s3Info) {
      console.log("No S3 info in message");
      continue;
    }

    const objectKey = decodeURIComponent(s3Info.object.key.replace(/\+/g, " ")); // 解码 Key 中的空格和特殊字符

    const ext = objectKey.slice(objectKey.lastIndexOf(".")).toLowerCase(); // 获取文件扩展名

    if (!allowedExtensions.includes(ext)) {
      console.log(`Unsupported file type: ${ext}`);
      throw new Error("Unsupported file type"); // 抛出异常，消息将进入 DLQ
    }

    // 写入 DynamoDB（图片记录）
    const putCommand = new PutItemCommand({
      TableName: tableName,
      Item: {
        id: { S: objectKey }, // 主键为文件名
        createdAt: { S: new Date().toISOString() }, // 添加时间戳
      },
    });

    await dynamo.send(putCommand); // 执行写入

    console.log(`Image ${objectKey} recorded.`);
  }
};
