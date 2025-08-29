'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const promClient = require('prom-client');
const { body, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const app = express();

// --- Config ---
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refreshSecret';
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// --- Middlewares ---
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // permite curl / same-origin
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

// --- Métricas ---
promClient.collectDefaultMetrics();
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

// --- Auth (JWT + Refresh) ---
const refreshTokens = new Map(); // refreshToken -> username

function signAccess(username) {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '15m' });
}
function signRefresh(username) {
  return jwt.sign({ username }, REFRESH_SECRET, { expiresIn: '7d' });
}
function generateTokens(username) {
  const accessToken = signAccess(username);
  const refreshToken = signRefresh(username);
  refreshTokens.set(refreshToken, username);
  return { accessToken, refreshToken };
}

function authenticate(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: 'Token inválido' });
    // compat con payloads {username} o {user}
    req.user = { username: payload.username || payload.user || 'user' };
    next();
  });
}

// Emite access+refresh
app.post(
  '/auth/token',
  body('username').isString().trim().notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { username } = req.body;
    return res.json(generateTokens(username));
  }
);

// Refresca tokens (rota refresh)
app.post('/auth/refresh', (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken || !refreshTokens.has(refreshToken)) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
  try {
    const { username } = jwt.verify(refreshToken, REFRESH_SECRET);
    refreshTokens.delete(refreshToken); // rotación
    return res.json(generateTokens(username));
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// (Opcional) sólo access token simple, compat con tu rama main
app.post(
  '/token',
  body('username').isString().trim().notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { username } = req.body;
    return res.json({ token: signAccess(username) });
  }
);

// --- Chat mínimo (echo) ---
app.post('/chat', authenticate, (req, res) => {
  const { message } = req.body || {};
  return res.json({ reply: `Echo: ${message || ''}` });
});

// --- Conversaciones en memoria ---
const conversations = new Map(); // conversationId -> [messages]

app.post('/conversation', authenticate, (req, res) => {
  const conversationId = uuidv4();
  conversations.set(conversationId, []);
  res.json({ conversationId });
});

app.post(
  '/send',
  authenticate,
  body('conversationId').isUUID(),
  body('message').isString().trim().notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { conversationId, message } = req.body;
    if (!conversations.has(conversationId)) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }
    const msg = {
      id: uuidv4(),
      sender: req.user.username,
      text: message,
      timestamp: new Date().toISOString()
    };
    conversations.get(conversationId).push(msg);
    res.status(201).json(msg);
  }
);

app.get(
  '/messages/:conversationId',
  authenticate,
  param('conversationId').isUUID(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { conversationId } = req.params;
    if (!conversations.has(conversationId)) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }
    res.json({ messages: conversations.get(conversationId) });
  }
);

// --- Errores ---
app.use((err, req, res, next) => {
  // CORS u otros
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origen no permitido por CORS' });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// --- Start / Export ---
if (require.main === module) {
  app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));
}
module.exports = app;
