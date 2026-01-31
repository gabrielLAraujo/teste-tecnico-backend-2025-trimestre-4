import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import cepService from '../services/cep.service';
import { CreateCrawlRequest, CreateCrawlResponse, CrawlStatusResponse, CrawlResultsResponse, ErrorResponse } from '../types/api.types';

async function cepRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const schema = {
    body: {
      type: 'object',
      required: ['cep_start', 'cep_end'],
      properties: {
        cep_start: {
          type: 'string',
          pattern: '^\\d{8}$'
        },
        cep_end: {
          type: 'string',
          pattern: '^\\d{8}$'
        }
      }
    }
  };

  fastify.post<{ Body: CreateCrawlRequest }>('/cep/crawl', { schema }, async (request, reply) => {
    try {
      const { cep_start, cep_end } = request.body;
      const crawlId = await cepService.createCrawl(cep_start, cep_end);
      
      return reply.code(202).send({ crawl_id: crawlId });
    } catch (error) {
      const err = error as Error;
      return reply.code(400).send({ error: err.message });
    }
  });

  fastify.get<{ Params: { crawl_id: string } }>('/cep/crawl/:crawl_id', async (request, reply) => {
    try {
      const { crawl_id } = request.params;
      const status = await cepService.getCrawlStatus(crawl_id);
      
      if (!status) {
        return reply.code(404).send({ error: 'Crawl não encontrado' });
      }
      
      return reply.send(status);
    } catch (error) {
      const err = error as Error;
      return reply.code(500).send({ error: err.message });
    }
  });

  fastify.get<{ 
    Params: { crawl_id: string };
    Querystring: { page?: string; limit?: string };
  }>('/cep/crawl/:crawl_id/results', async (request, reply) => {
    try {
      const { crawl_id } = request.params;
      const page = parseInt(request.query.page || '1', 10);
      const limit = parseInt(request.query.limit || '50', 10);
      
      const crawl = await cepService.getCrawlStatus(crawl_id);
      
      if (!crawl) {
        return reply.code(404).send({ error: 'Crawl não encontrado' });
      }
      
      const results = await cepService.getCrawlResults(crawl_id, page, limit);
      
      return reply.send(results);
    } catch (error) {
      const err = error as Error;
      return reply.code(500).send({ error: err.message });
    }
  });
}

export default cepRoutes;
