import { v4 as uuidv4 } from 'uuid';
import Crawl from '../models/Crawl';
import CepResult from '../models/CepResult';
import { validateCepRange, generateCepRange } from '../utils/validators';
import { calculateTotalCeps } from '../utils/cep.utils';
import queueService from './queue.service';
import { CrawlStatusResponse, CrawlResultsResponse } from '../types/api.types';

class CepService {
  async createCrawl(cepStart: string, cepEnd: string): Promise<string> {
    const validation = validateCepRange(cepStart, cepEnd);
    
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const crawlId = uuidv4();
    const totalCeps = calculateTotalCeps(cepStart, cepEnd);

    const crawl = new Crawl({
      crawl_id: crawlId,
      cep_start: cepStart,
      cep_end: cepEnd,
      total_ceps: totalCeps,
      status: 'pending'
    });

    await crawl.save();

    const ceps = generateCepRange(cepStart, cepEnd);
    
    try {
      await queueService.enqueueMultipleCeps(crawlId, ceps);
      await Crawl.updateOne({ crawl_id: crawlId }, { status: 'running' });
    } catch (error) {
      await Crawl.updateOne({ crawl_id: crawlId }, { status: 'failed' });
      throw error;
    }

    return crawlId;
  }

  async getCrawlStatus(crawlId: string): Promise<CrawlStatusResponse | null> {
    const crawl = await Crawl.findOne({ crawl_id: crawlId });

    if (!crawl) {
      return null;
    }

    return {
      crawl_id: crawl.crawl_id,
      total_ceps: crawl.total_ceps,
      processed: crawl.processed,
      success: crawl.success,
      errors: crawl.errors,
      status: crawl.status
    };
  }

  async getCrawlResults(crawlId: string, page = 1, limit = 50): Promise<CrawlResultsResponse> {
    const skip = (page - 1) * limit;
    
    const results = await CepResult.find({ crawl_id: crawlId })
      .sort({ processed_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await CepResult.countDocuments({ crawl_id: crawlId });

    return {
      results: results.map(r => ({
        crawl_id: r.crawl_id,
        cep: r.cep,
        data: r.data,
        status: r.status,
        error_message: r.error_message,
        processed_at: r.processed_at
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

export default new CepService();
