import mongoose, { Document, Schema } from 'mongoose';
import { CepResultStatus } from '../types/models.types';
import { IViaCepData } from '../types/viacep.types';

export interface ICepResult extends Document {
  crawl_id: string;
  cep: string;
  data: IViaCepData | null;
  status: CepResultStatus;
  error_message: string | null;
  processed_at: Date;
}

const cepResultSchema = new Schema<ICepResult>({
  crawl_id: {
    type: String,
    required: true,
    index: true
  },
  cep: {
    type: String,
    required: true
  },
  data: {
    type: Schema.Types.Mixed,
    default: null
  },
  status: {
    type: String,
    enum: ['success', 'error'],
    required: true
  },
  error_message: {
    type: String,
    default: null
  },
  processed_at: {
    type: Date,
    default: Date.now
  }
});

cepResultSchema.index({ crawl_id: 1, cep: 1 });

export default mongoose.model<ICepResult>('CepResult', cepResultSchema);
