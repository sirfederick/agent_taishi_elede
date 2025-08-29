const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const promClient = require('prom-client');

const app = express();
app.use(express.json());

// Logging
app.use(morgan('combined'));

// Monitoring
promClient.collectDefaultMetrics();

// CORS configuration for specific origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  }
}));

// In-memory store for refresh tokens
const refreshTokens = new Map();
const SECRET = process.env.JWT_SECRET || 'secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refreshSecret';

function generateTokens(user) {
  const accessToken = jwt.sign({ user }, SECRET, { expiresIn: '1s' });
  const refreshToken = jwt.sign({ user }, REFRESH_SECRET);
  refreshTokens.set(refreshToken, user);
  return { accessToken, refreshToken };
}

app.post('/auth/token', (req, res) => {
  const user = req.body.user || 'user';
  const tokens = generateTokens(user);
  res.json(tokens);
});

app.post('/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken || !refreshTokens.has(refreshToken)) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
  try {
    const { user } = jwt.verify(refreshToken, REFRESH_SECRET);
    const tokens = generateTokens(user);
    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

function authenticate(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.sendStatus(401);
    req.user = decoded.user;
    next();
  });
}

app.post('/chat', authenticate, (req, res) => {
  const { message } = req.body;
  res.json({ reply: `Echo: ${message}` });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

if (require.main === module) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => console.log(`Server listening on ${port}`));
}

module.exports = app;
