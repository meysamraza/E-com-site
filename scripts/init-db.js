const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function initDb() {
  const dbName = process.env.DB_NAME || 'ecom_db';
  const dbUser = process.env.DB_USER || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || 'postgres';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '5432', 10);

  // 1. Connect to default postgres DB to ensure target database exists
  const adminClient = new Client({
    host: dbHost,
    port: dbPort,
    database: 'postgres',
    user: dbUser,
    password: dbPassword,
  });

  try {
    console.log(`Checking if database "${dbName}" exists...`);
    await adminClient.connect();
    const checkRes = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (checkRes.rows.length === 0) {
      console.log(`Database "${dbName}" does not exist. Creating it now...`);
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully!`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.warn(`Note: Could not check/create database via 'postgres' DB: ${err.message}. Attempting direct connection...`);
  } finally {
    await adminClient.end().catch(() => {});
  }

  // 2. Connect to the target database and execute schema & seed
  const client = new Client({
    host: dbHost,
    port: dbPort,
    database: dbName,
    user: dbUser,
    password: dbPassword,
  });

  try {
    console.log(`Connecting to PostgreSQL at ${dbHost}:${dbPort}/${dbName}...`);
    await client.connect();
    console.log('Connected successfully!');

    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const seedPath = path.join(__dirname, '..', 'seed.sql');

    console.log('Applying schema.sql...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);
    console.log('Schema created successfully.');

    console.log('Applying seed.sql...');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await client.query(seedSql);
    console.log('Seed data inserted successfully.');

    console.log('\n Database initialization finished successfully!');
    console.log('Default credentials:');
    console.log(' - Admin:   admin@example.com   / admin123');
    console.log(' - Student: student@example.com / student123\n');
  } catch (err) {
    console.error(' Database initialization failed:', err.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

initDb();
