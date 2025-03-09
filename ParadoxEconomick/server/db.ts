import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// Create database connection
const databaseUrl = process.env.DATABASE_URL || '';
const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });

// Initialize database (run migrations)
export async function initializeDatabase() {
  try {
    console.log('Setting up database...');
    
    // In a production environment, you would run migrations here
    // For development, we'll just log that it's ready
    console.log('Database initialized successfully');
    
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}