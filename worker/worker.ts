import 'dotenv/config';
import mongoose from 'mongoose';
import { ReceiveMessageCommand, DeleteMessageCommand, Message } from '@aws-sdk/client-sqs';
import { sqsClient } from '../src/config/queue';
import { connectDatabase } from '../src/config/database';
import { getCepData } from '../src/services/viacep.service';
import Crawl from '../src/models/Crawl';
import CepResult from '../src/models/CepResult';
import { QueueMessage } from '../src/types/queue.types';
import pLimit from 'p-limit';

const QUEUE_URL = process.env.QUEUE_URL || 'http://localhost:9324/queue/cep-queue';
const RATE_LIMIT_PER_SECOND = parseInt(process.env.RATE_LIMIT_PER_SECOND || '5', 10);
const MAX_MESSAGES = 10;
const WAIT_TIME = 20;

const limit = pLimit(RATE_LIMIT_PER_SECOND);

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function receiveMessages(): Promise<Message[]> {
  try {
    const command = new ReceiveMessageCommand({
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: MAX_MESSAGES,
      WaitTimeSeconds: WAIT_TIME,
      AttributeNames: ['All']
    });

    const result = await sqsClient.send(command);
    return result.Messages || [];
  } catch (error) {
    console.error('Erro ao receber mensagens:', error);
    return [];
  }
}

async function deleteMessage(receiptHandle: string | undefined): Promise<void> {
  if (!receiptHandle) return;
  
  try {
    const command = new DeleteMessageCommand({
      QueueUrl: QUEUE_URL,
      ReceiptHandle: receiptHandle
    });

    await sqsClient.send(command);
  } catch (error) {
    console.error('Erro ao deletar mensagem:', error);
  }
}

async function processCep(crawlId: string, cep: string): Promise<void> {
  try {
    const cepData = await getCepData(cep);

    const result = new CepResult({
      crawl_id: crawlId,
      cep: cep,
      data: cepData,
      status: 'success'
    });

    await result.save();

    await Crawl.updateOne(
      { crawl_id: crawlId },
      {
        $inc: {
          processed: 1,
          success: 1
        }
      }
    );

    console.log(`CEP ${cep} processado com sucesso para crawl ${crawlId}`);
  } catch (error) {
    const err = error as Error;
    const errorMessage = err.message || 'Erro desconhecido';
    
    const result = new CepResult({
      crawl_id: crawlId,
      cep: cep,
      data: null,
      status: 'error',
      error_message: errorMessage
    });

    await result.save();

    await Crawl.updateOne(
      { crawl_id: crawlId },
      {
        $inc: {
          processed: 1,
          errors: 1
        }
      }
    );

    console.log(`Erro ao processar CEP ${cep} para crawl ${crawlId}:`, errorMessage);
  }

  await updateCrawlStatus(crawlId);
}

async function updateCrawlStatus(crawlId: string): Promise<void> {
  const crawl = await Crawl.findOne({ crawl_id: crawlId });
  
  if (!crawl) {
    return;
  }

  if (crawl.processed === crawl.total_ceps) {
    await Crawl.updateOne(
      { crawl_id: crawlId },
      { status: 'finished' }
    );
    console.log(`Crawl ${crawlId} finalizado`);
  } else if (crawl.status === 'pending') {
    await Crawl.updateOne(
      { crawl_id: crawlId },
      { status: 'running' }
    );
  }
}

async function processQueue(): Promise<void> {
  console.log('Worker iniciado. Aguardando mensagens...');
  console.log(`Rate limit: ${RATE_LIMIT_PER_SECOND} requisições por segundo`);

  while (true) {
    try {
      const messages = await receiveMessages();

      if (messages.length === 0) {
        await sleep(1000);
        continue;
      }

      const promises = messages.map(message => 
        limit(async () => {
          try {
            if (!message.Body) return;
            
            const data = JSON.parse(message.Body) as QueueMessage;
            const { crawl_id, cep } = data;

            await processCep(crawl_id, cep);
            await deleteMessage(message.ReceiptHandle);
          } catch (error) {
            console.error('Erro ao processar mensagem:', error);
          }
        })
      );

      await Promise.all(promises);

      await sleep(100);
    } catch (error) {
      console.error('Erro no loop principal:', error);
      await sleep(5000);
    }
  }
}

async function start(): Promise<void> {
  try {
    await connectDatabase();
    console.log('Worker conectado ao MongoDB');
    await processQueue();
  } catch (error) {
    console.error('Erro ao iniciar worker:', error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('Encerrando worker...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Encerrando worker...');
  await mongoose.connection.close();
  process.exit(0);
});

start();
