const express = require('express');
const { CopilotClient } = require('@microsoft/copilot-sdk');

const app = express();
app.use(express.json());

const connectionString = process.env.COPILOT_CONNECTION_STRING;
const copilot = new CopilotClient({ connectionString });

app.get('/api/copilot/token', async (req, res) => {
  try {
    const token = await copilot.getToken();
    res.json(token);
  } catch (err) {
    console.error('Token error', err);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

app.post('/api/copilot/conversation', async (req, res) => {
  try {
    const conversation = await copilot.createConversation(req.body);
    res.json(conversation);
  } catch (err) {
    console.error('Conversation error', err);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

app.post('/api/copilot/send', async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    const result = await copilot.sendMessage({ conversationId, message });
    res.json(result);
  } catch (err) {
    console.error('Send error', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.get('/api/copilot/messages', async (req, res) => {
  try {
    const { conversationId } = req.query;
    const messages = await copilot.getMessages({ conversationId });
    res.json(messages);
  } catch (err) {
    console.error('Messages error', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
