import https from 'https';
import { IViaCepData, HttpError } from '../types/viacep.types';

const VIA_CEP_URL = 'https://viacep.com.br/ws';

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, maxRetries = 3, delay = 1000): Promise<IViaCepData> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const data = await fetchUrl(url);
      return data;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const httpError = error as HttpError;
      const isTemporaryError = 
        (httpError.status && httpError.status >= 500) || 
        httpError.code === 'ECONNRESET' || 
        httpError.code === 'ETIMEDOUT';
      
      if (isTemporaryError) {
        await sleep(delay * attempt);
        continue;
      }
      
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

function fetchUrl(url: string): Promise<IViaCepData> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk.toString();
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data) as IViaCepData & { erro?: boolean };
            
            if (json.erro) {
              reject(new Error('CEP não encontrado'));
            } else {
              resolve(json);
            }
          } catch (error) {
            reject(new Error('Erro ao parsear resposta'));
          }
        } else if (res.statusCode === 429) {
          reject({ status: 429, message: 'Rate limit excedido' } as HttpError);
        } else {
          reject({ status: res.statusCode, message: 'Erro na requisição' } as HttpError);
        }
      });
    }).on('error', (error: NodeJS.ErrnoException) => {
      reject(error);
    });
  });
}

export async function getCepData(cep: string): Promise<IViaCepData> {
  const url = `${VIA_CEP_URL}/${cep}/json/`;
  return fetchWithRetry(url);
}
