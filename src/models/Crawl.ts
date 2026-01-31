import mongoose, { Document, Schema } from 'mongoose';
import { CrawlStatus } from '../types/models.types';

export interface ICrawl extends Omit<Document, 'errors'> {
  crawl_id: string;
  cep_start: string;
  cep_end: string;
  total_ceps: number;
  processed: number;
  success: number;
  errors: number;
  status: CrawlStatus;
  createdAt: Date;
  updatedAt: Date;
}

const crawlSchema = new Schema<ICrawl>({
  crawl_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  cep_start: {
    type: String,
    required: true
  },
  cep_end: {
    type: String,
    required: true
  },
  total_ceps: {
    type: Number,
    required: true
  },
  processed: {
    type: Number,
    default: 0
  },
  success: {
    type: Number,
    default: 0
  },
  errors: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'finished', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true,
  suppressReservedKeysWarning: true
});

export default mongoose.model<ICrawl>('Crawl', crawlSchema);
