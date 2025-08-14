import * as mysql from 'mysql2/promise';

async function main() {
  let initialPool: mysql.Pool | null = null;
  let dbPool: mysql.Pool | null = null;
  let conn: mysql.PoolConnection | null = null;
  let dbConn: mysql.PoolConnection | null = null;

  try {
    // First create the database if it doesn't exist
    initialPool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      port: 3306,
    });

    conn = await initialPool.getConnection();
    await conn.execute('CREATE DATABASE IF NOT EXISTS test_db');
    conn.release();
    await initialPool.end();

    // Now connect with the database selected
    dbPool = mysql.createPool({
      host: 'localhost',
      user: 'root',
      database: 'test_db',
      port: 3306,
    });

    dbConn = await dbPool.getConnection();

    // Drop existing tables if they exist (to avoid conflicts with changed schema)
    await dbConn.execute('DROP TABLE IF EXISTS employees');
    await dbConn.execute('DROP TABLE IF EXISTS offices');

    // Create tables using raw SQL (since we're doing initial setup)
    await dbConn.execute(`
      CREATE TABLE IF NOT EXISTS offices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        identification_code VARCHAR(8) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    await dbConn.execute(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        office_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        department_name VARCHAR(100) NOT NULL,
        position VARCHAR(255) NOT NULL,
        birthday DATE NOT NULL,
        joined_at TIMESTAMP NOT NULL,
        retired_at TIMESTAMP NULL,
        is_part_timer BOOLEAN NOT NULL DEFAULT FALSE,
        estimated_total_income DECIMAL(12,0) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (office_id) REFERENCES offices(id)
      );
    `);

    console.log('Database and tables created successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    // Release connections before ending pools
    if (conn) {
      try {
        conn.release();
      } catch (e) {
        // Ignore release error if connection is already released
      }
    }
    if (dbConn) {
      try {
        dbConn.release();
      } catch (e) {
        // Ignore release error if connection is already released
      }
    }
    // End pools after releasing all connections
    if (initialPool) {
      try {
        await initialPool.end();
      } catch (e) {
        // Ignore end error if pool is already closed
      }
    }
    if (dbPool) {
      try {
        await dbPool.end();
      } catch (e) {
        // Ignore end error if pool is already closed
      }
    }
  }
}

main();
