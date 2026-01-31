import mongoose from 'mongoose';

export async function connectDatabase(): Promise<void> {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cep-crawler';
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('MongoDB conectado com sucesso');
  } catch (error) {
    console.error('Erro ao conectar MongoDB:', error);
    process.exit(1);
  }
}
