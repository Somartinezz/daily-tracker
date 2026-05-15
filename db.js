const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host:     process.env.DB_HOST     || 'localhost',
        port:     Number(process.env.DB_PORT) || 5432,
        user:     process.env.DB_USER     || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME     || 'daily_tracker',
      }
);

module.exports = pool;
