#!/usr/bin/env tsx

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../shared/schema';

// Create database connection
const databaseUrl = process.env.DATABASE_URL || '';
const sql = neon(databaseUrl);
const db = drizzle(sql);

// Function to push schema
async function pushSchema() {
  try {
    console.log('Pushing schema to database...');
    
    // Create Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user'
      )
    `;
    
    // Create Categories table
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL
      )
    `;
    
    // Create Products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        original_price DECIMAL(10, 2),
        stock INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        platform TEXT NOT NULL,
        region TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active'
      )
    `;
    
    // Create Orders table
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        telegram_user_id INTEGER,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        total_amount DECIMAL(10, 2) NOT NULL,
        payment_method_id INTEGER NOT NULL,
        payment_status TEXT NOT NULL DEFAULT 'pending',
        delivery_status TEXT NOT NULL DEFAULT 'pending',
        product_key TEXT,
        date TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    
    // Create Payment Methods table
    await sql`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        type TEXT NOT NULL
      )
    `;
    
    // Create Telegram Users table
    await sql`
      CREATE TABLE IF NOT EXISTS telegram_users (
        telegram_id INTEGER PRIMARY KEY,
        username TEXT,
        first_name TEXT NOT NULL,
        last_name TEXT,
        cashback_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
        last_interaction TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    
    console.log('Schema pushed successfully!');
  } catch (error) {
    console.error('Error pushing schema:', error);
    process.exit(1);
  }
}

// Run schema push
pushSchema()
  .then(() => {
    console.log('Schema push completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Schema push failed:', error);
    process.exit(1);
  });