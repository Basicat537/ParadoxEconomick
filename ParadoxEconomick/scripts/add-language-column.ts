import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function addLanguageColumn() {
  try {
    console.log('Adding language column to telegram_users table...');
    
    // Check if column exists
    try {
      await db.execute(sql`SELECT language FROM telegram_users LIMIT 1`);
      console.log('Column already exists, skipping...');
      return;
    } catch (error) {
      // Column doesn't exist, proceed with adding it
      console.log('Column does not exist, adding it...');
    }
    
    // Add the language column with a default value of 'en'
    await db.execute(sql`
      ALTER TABLE telegram_users 
      ADD COLUMN language TEXT NOT NULL DEFAULT 'en'
    `);
    
    console.log('Language column added successfully!');
  } catch (error) {
    console.error('Error adding language column:', error);
    process.exit(1);
  }
}

addLanguageColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });