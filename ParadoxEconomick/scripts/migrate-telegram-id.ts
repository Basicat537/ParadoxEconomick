import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL ?? "";
const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql);

async function runMigration() {
  console.log("Starting telegram_user_id to bigint migration...");
  
  try {
    // Execute raw SQL to modify column type
    await sql`
      ALTER TABLE orders 
      ALTER COLUMN telegram_user_id TYPE bigint 
      USING telegram_user_id::bigint
    `;
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await sql.end();
  }
}

runMigration();