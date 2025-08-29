const express = require('express');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const { body, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

app.use(express.json());
app.use(morgan('dev'));

// In-memory data store
const conversations = new Map(); // conversationId -> [messages]

function generateToken(username) {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}

// POST /token - generate token for a username
app.post('/token',
  body('username').isString().trim().notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { username } = req.body;
    const token = generateToken(username);
    res.json({ token });
  }
);

// POST /conversation - create new conversation
app.post('/conversation', authenticateToken, (req, res) => {
  const conversationId = uuidv4();
  conversations.set(conversationId, []);
  res.json({ conversationId });
});

// POST /send - send message to conversation
app.post('/send',
  authenticateToken,
  body('conversationId').isUUID(),
  body('message').isString().trim().notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
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

// GET /messages/:conversationId - retrieve messages
app.get('/messages/:conversationId',
  authenticateToken,
  param('conversationId').isUUID(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { conversationId } = req.params;
    if (!conversations.has(conversationId)) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }
    res.json({ messages: conversations.get(conversationId) });
  }
);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
  });
}

module.exports = app;
