import { ValidationResult } from '../types/validation.types';

export const CEP_REGEX = /^\d{8}$/;
export const MAX_RANGE_SIZE = 10000;

export function isValidCepFormat(cep: string): boolean {
  return CEP_REGEX.test(cep);
}

export function validateCepRange(cepStart: string, cepEnd: string): ValidationResult {
  if (!isValidCepFormat(cepStart)) {
    return { valid: false, error: 'cep_start deve ter 8 dígitos numéricos' };
  }

  if (!isValidCepFormat(cepEnd)) {
    return { valid: false, error: 'cep_end deve ter 8 dígitos numéricos' };
  }

  const start = parseInt(cepStart, 10);
  const end = parseInt(cepEnd, 10);

  if (start > end) {
    return { valid: false, error: 'cep_start deve ser menor ou igual a cep_end' };
  }

  const rangeSize = end - start + 1;
  if (rangeSize > MAX_RANGE_SIZE) {
    return { 
      valid: false, 
      error: `Range muito grande. Máximo permitido: ${MAX_RANGE_SIZE} CEPs` 
    };
  }

  return { valid: true };
}

export function generateCepRange(cepStart: string, cepEnd: string): string[] {
  const start = parseInt(cepStart, 10);
  const end = parseInt(cepEnd, 10);
  const ceps: string[] = [];

  for (let i = start; i <= end; i++) {
    ceps.push(i.toString().padStart(8, '0'));
  }

  return ceps;
}
