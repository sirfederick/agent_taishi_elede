const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const http = require('http');

const port = process.env.PORT || 3000;
const connectionString = process.env.COPILOT_CONNECTION_STRING;
const directLineSecret = process.env.COPILOT_DIRECTLINE_SECRET;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok' }));
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  if (connectionString) {
    console.log('COPILOT_CONNECTION_STRING loaded');
  }
  if (directLineSecret) {
    console.log('COPILOT_DIRECTLINE_SECRET loaded');
  }
});
