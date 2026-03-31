const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json({ limit: '1mb' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

// API key auth
app.use((req, res, next) => {
  if (req.path === '/health' && req.method === 'GET') return next();
  const key = req.headers['x-api-key'];
  if (!process.env.API_KEY || key !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  next();
});

// Health check (no auth required)
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Execute query
app.post('/query', async (req, res) => {
  const { sql, params } = req.body;
  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid sql field' });
  }
  if (sql.length > 10000) {
    return res.status(400).json({ error: 'Query too long (max 10000 chars)' });
  }

  try {
    const result = await pool.query(sql, params || []);
    res.json({ rows: result.rows, rowCount: result.rowCount });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const port = process.env.PORT || 3080;
app.listen(port, () => {
  console.log(`sql-proxy listening on :${port}`);
});
