const jsonServer = require('json-server');

const server = jsonServer.create();

// Load seed data directly so Vercel Node File Trace bundles db.json automatically
const rawData = require('../db.json');
// Deep copy in-memory so serverless mutations stay isolated per instance
const data = JSON.parse(JSON.stringify(rawData));

const router = jsonServer.router(data);
const middlewares = jsonServer.defaults({ logger: false });

// Enable CORS for all requests
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

server.use(middlewares);

// Strip /api prefix if present so router matches /products, /categories, etc.
server.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    req.url = req.url.replace(/^\/api/, '') || '/';
  }
  next();
});

server.use(router);

module.exports = server;
