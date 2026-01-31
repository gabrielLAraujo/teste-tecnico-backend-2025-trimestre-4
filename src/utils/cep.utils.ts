import { generateCepRange } from './validators';

export function calculateTotalCeps(cepStart: string, cepEnd: string): number {
  const start = parseInt(cepStart, 10);
  const end = parseInt(cepEnd, 10);
  return end - start + 1;
}

export { generateCepRange };
