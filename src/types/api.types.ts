import { CrawlStatus } from './models.types';

export interface CreateCrawlRequest {
  cep_start: string;
  cep_end: string;
}

export interface CreateCrawlResponse {
  crawl_id: string;
}

export interface CrawlStatusResponse {
  crawl_id: string;
  total_ceps: number;
  processed: number;
  success: number;
  errors: number;
  status: CrawlStatus;
}

export interface CepResultItem {
  crawl_id: string;
  cep: string;
  data: any;
  status: 'success' | 'error';
  error_message: string | null;
  processed_at: Date;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CrawlResultsResponse {
  results: CepResultItem[];
  pagination: PaginationInfo;
}

export interface ErrorResponse {
  error: string;
}
