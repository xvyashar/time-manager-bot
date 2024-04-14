//* Import Modules
import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(process.env.DATABASE_URL as string);
    console.log(`Database connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export * from './user.schema';
export * from './group.schema';
