const app = require('./server');

async function run() {
  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://localhost:${port}`;

  try {
    // 1. Obtain token
    let res = await fetch(`${base}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'tester' })
    });
    const { token } = await res.json();
    if (!token) throw new Error('Token not returned');

    // 2. Create conversation
    res = await fetch(`${base}/conversation`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { conversationId } = await res.json();
    if (!conversationId) throw new Error('Conversation not created');

    // 3. Send message
    res = await fetch(`${base}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ conversationId, message: 'Hola mundo' })
    });
    const msg = await res.json();
    if (!msg || msg.text !== 'Hola mundo') throw new Error('Send failed');

    // 4. Retrieve messages
    res = await fetch(`${base}/messages/${conversationId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!Array.isArray(data.messages) || data.messages.length !== 1) {
      throw new Error('Messages retrieval failed');
    }

    console.log('All tests passed');
  } catch (err) {
    console.error('Test failed', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

run();
