const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Configure a PostgreSQL connection string.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX) || 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

const initializeDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id BIGSERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL DEFAULT 'Administrator',
        role TEXT NOT NULL DEFAULT 'admin' CHECK (role = 'admin'),
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS projects (
        id BIGSERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description VARCHAR(5000) NOT NULL,
        short_description VARCHAR(300),
        category TEXT NOT NULL CHECK (category IN ('Residential', 'Commercial', 'Industrial', 'Infrastructure', 'Interior', 'Renovation', 'Other')),
        status TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'upcoming')),
        location VARCHAR(200),
        client VARCHAR(150),
        start_date TIMESTAMPTZ,
        end_date TIMESTAMPTZ,
        area TEXT,
        value TEXT,
        images JSONB NOT NULL DEFAULT '[]'::jsonb,
        cover_image TEXT NOT NULL DEFAULT '',
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        featured BOOLEAN NOT NULL DEFAULT FALSE,
        is_published BOOLEAN NOT NULL DEFAULT TRUE,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS projects_category_status_idx ON projects(category, status);
      CREATE INDEX IF NOT EXISTS projects_featured_published_idx ON projects(featured, is_published);
      CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects(created_at DESC);

      CREATE TABLE IF NOT EXISTS contacts (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        company VARCHAR(150),
        service VARCHAR(150),
        budget VARCHAR(100),
        subject VARCHAR(200),
        message VARCHAR(2000) NOT NULL,
        status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'closed')),
        ip_address TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS contacts_status_created_idx ON contacts(status, created_at DESC);
      CREATE INDEX IF NOT EXISTS contacts_email_idx ON contacts(email);
    `);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const connectDB = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to connect to PostgreSQL.');
  }
  await pool.query('SELECT 1');
  await initializeDatabase();
  console.log('PostgreSQL connected and schema is ready');
};

const isDatabaseConnected = async () => {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
};

module.exports = { pool, connectDB, isDatabaseConnected };
