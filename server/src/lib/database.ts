import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    throw new Error('A variável de ambiente MONGODB_URI não foi definida.');
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Conectado ao MongoDB');
};
