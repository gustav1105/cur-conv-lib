import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let pool: Pool | undefined;

export const initDB = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    pool.on('connect', () => {
      console.log('Connected to the database');
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }
};

export const query = async (text: string, params?: any[]) => {
  if (!pool) {
    throw new Error('Database connection has not been initialized.');
  }

  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

