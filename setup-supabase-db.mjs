import pg from 'pg';
import fs from 'fs';
import dns from 'dns';

// Force IPv4
dns.setDefaultResultOrder('ipv4first');

const { Client } = pg;

// Try the connection pooler instead (IPv4 available)
const client = new Client({
  connectionString: 'postgresql://postgres.wjokjfaffcboifkxkhlz:3115OakDK!!!@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

const sql = fs.readFileSync('./supabase-quick-setup.sql', 'utf8');

async function run() {
  try {
    console.log('Connecting to Supabase...');
    await client.connect();
    console.log('Connected! Running SQL schema...');
    
    const result = await client.query(sql);
    console.log('✅ All tables created successfully!');
    console.log(result);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
