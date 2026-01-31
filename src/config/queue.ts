import { SQSClient } from '@aws-sdk/client-sqs';

export const sqsClient = new SQSClient({
  endpoint: process.env.ELASTICMQ_URL || 'http://localhost:9324',
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'x',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'x'
  }
});
