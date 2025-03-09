// Script to directly update database schema
import postgres from 'postgres';

async function runMigration() {
  console.log('Starting database migration...');
  
  const databaseUrl = process.env.DATABASE_URL || '';
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  const sql = postgres(databaseUrl);
  
  try {
    // 1. Создание временной таблицы
    console.log('Creating temporary table...');
    await sql`
      CREATE TABLE telegram_users_new (
        telegram_id BIGINT PRIMARY KEY,
        username TEXT,
        first_name TEXT NOT NULL,
        last_name TEXT,
        cashback_balance NUMERIC(10,2) NOT NULL DEFAULT '0',
        last_interaction TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    // 2. Копирование данных из старой таблицы (с преобразованием типов)
    console.log('Copying data to the new table...');
    await sql`
      INSERT INTO telegram_users_new (
        telegram_id,
        username,
        first_name,
        last_name,
        cashback_balance,
        last_interaction
      )
      SELECT 
        telegram_id::BIGINT,
        username,
        first_name,
        last_name,
        cashback_balance,
        last_interaction
      FROM telegram_users;
    `;

    // 3. Удаление старой таблицы
    console.log('Dropping old table...');
    await sql`DROP TABLE telegram_users;`;

    // 4. Переименование новой таблицы
    console.log('Renaming the new table...');
    await sql`ALTER TABLE telegram_users_new RENAME TO telegram_users;`;

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

runMigration()
  .then(() => {
    console.log('DB migration script finished successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('DB migration script failed:', error);
    process.exit(1);
  });