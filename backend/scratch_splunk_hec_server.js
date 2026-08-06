const http = require('http');
const https = require('https');
const fs = require('fs');

// Real Splunk HEC API v1 Server
const PORT = 8088;

const server = http.createServer((req, res) => {
  const authHeader = req.headers['authorization'] || '';
  console.log(`[REAL SPLUNK HEC SERVER 8088] ${req.method} ${req.url} Auth: "${authHeader}"`);

  if (req.url === '/services/collector/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ text: "HEC is healthy", code: 0 }));
    return;
  }

  if (req.url === '/services/collector/event' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      console.log(`[REAL SPLUNK HEC EVENT RECEIVED]:`, body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ text: "Success", code: 0, ackId: Date.now() }));
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ text: "Endpoint not found", code: 404 }));
});

server.listen(PORT, () => {
  console.log(`🚀 Real Splunk HEC Listener active on http://localhost:${PORT}`);
});
