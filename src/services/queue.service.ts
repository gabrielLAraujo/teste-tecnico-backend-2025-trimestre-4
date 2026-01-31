import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { sqsClient } from '../config/queue';

class QueueService {
  private queueUrl: string;

  constructor() {
    this.queueUrl = process.env.QUEUE_URL || 'http://localhost:9324/queue/cep-queue';
  }

  async enqueueCep(crawlId: string, cep: string): Promise<string | undefined> {
    try {
      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify({
          crawl_id: crawlId,
          cep: cep
        })
      });

      const result = await sqsClient.send(command);
      return result.MessageId;
    } catch (error) {
      console.error('Erro ao enviar mensagem para fila:', error);
      throw error;
    }
  }

  async enqueueMultipleCeps(crawlId: string, ceps: string[]): Promise<(string | undefined)[]> {
    const promises = ceps.map(cep => this.enqueueCep(crawlId, cep));
    return Promise.all(promises);
  }
}

export default new QueueService();
