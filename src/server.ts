import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { connectDatabase } from './config/database';
import cepRoutes from './routes/cep.routes';

async function buildApp() {
  const fastify = Fastify({
    logger: true
  });

  await fastify.register(cors, {
    origin: true
  });

  await fastify.register(cepRoutes);

  fastify.get('/health', async (request, reply) => {
    return { status: 'ok' };
  });

  return fastify;
}

async function start() {
  try {
    await connectDatabase();
    
    const app = await buildApp();
    
    const port = parseInt(process.env.PORT || '3000', 10);
    const host = '0.0.0.0';
    
    await app.listen({ port, host });
    console.log(`Servidor rodando em http://${host}:${port}`);
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

start();
