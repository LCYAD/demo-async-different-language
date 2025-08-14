/// <reference types="bun-types" />

import * as mysql from 'mysql2/promise';

async function main() {
  let pool: mysql.Pool | null = null;
  let conn: mysql.PoolConnection | null = null;

  try {
    // Connect to the database
    pool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      database: 'test_db',
      port: 3306,
    });

    conn = await pool.getConnection();

    // Drop tables in correct order due to foreign key constraints
    await conn.execute('DROP TABLE IF EXISTS employees');
    await conn.execute('DROP TABLE IF EXISTS offices');

    console.log('All tables dropped successfully!');
  } catch (error) {
    console.error('Error cleaning database:', error);
    process.exit(1);
  } finally {
    if (conn) {
      try {
        conn.release();
      } catch (e) {
        // Ignore release error if connection is already released
      }
    }
    if (pool) {
      try {
        await pool.end();
      } catch (e) {
        // Ignore end error if pool is already closed
      }
    }
  }
}

main();
