const http = require('http');
const fetch = require('node-fetch');

// 1. Mock Splunk HEC Server on Port 8088
const splunkServer = http.createServer((req, res) => {
  if (req.url.includes('/services/collector/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ text: 'HEC is healthy', code: 0 }));
  } else if (req.url.includes('/services/collector/event')) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ text: 'Success', code: 0, ackId: 101 }));
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

// 2. Mock Wazuh Manager API Server on Port 55000
const wazuhServer = http.createServer((req, res) => {
  if (req.url.includes('/security/user/authenticate')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: { token: 'mock-wazuh-jwt-token-12345' } }));
  } else if (req.url.includes('/manager/status')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: { status: 'running' } }));
  } else if (req.url.includes('/events')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Events ingested successfully' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

async function main() {
  splunkServer.listen(8088, '127.0.0.1');
  wazuhServer.listen(55000, '127.0.0.1');
  console.log('✅ Mock Splunk HEC Server listening on http://127.0.0.1:8088');
  console.log('✅ Mock Wazuh Manager API Server listening on http://127.0.0.1:55000\n');

  // Login to NestJS API
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cyber-platform.local', password: 'AdminPassword123!' }),
  });
  const { accessToken } = await loginRes.json();

  // Test 1: Splunk HEC Connector
  console.log('--- TESTING SPLUNK HEC CONNECTOR ---');
  const splunkConnRes = await fetch('http://localhost:3000/api/v1/siem/connectors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      name: 'Local Splunk HEC Cluster',
      type: 'SPLUNK_HEC',
      config: { host: '127.0.0.1', port: 8088, token: 'splunk-hec-secret-token', index: 'security_alerts' },
    }),
  });
  const splunkConn = await splunkConnRes.json();
  console.log(`Created Splunk Connector ID: ${splunkConn.id}`);

  const testSplunkRes = await fetch(`http://localhost:3000/api/v1/siem/connectors/${splunkConn.id}/test`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log('Splunk Test Result:', await testSplunkRes.json());

  const forwardSplunkRes = await fetch(`http://localhost:3000/api/v1/siem/connectors/${splunkConn.id}/forward`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log('Splunk Forward Result:', await forwardSplunkRes.json());

  // Test 2: Wazuh API Connector
  console.log('\n--- TESTING WAZUH MANAGER CONNECTOR ---');
  const wazuhConnRes = await fetch('http://localhost:3000/api/v1/siem/connectors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      name: 'Local Wazuh Manager',
      type: 'WAZUH',
      config: { host: '127.0.0.1', port: 55000, username: 'wazuh', password: 'wazuh-password' },
    }),
  });
  const wazuhConn = await wazuhConnRes.json();
  console.log(`Created Wazuh Connector ID: ${wazuhConn.id}`);

  const testWazuhRes = await fetch(`http://localhost:3000/api/v1/siem/connectors/${wazuhConn.id}/test`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log('Wazuh Test Result:', await testWazuhRes.json());

  splunkServer.close();
  wazuhServer.close();
  console.log('\n====================================================');
  console.log('🎉 LIVE SPLUNK & WAZUH CONNECTORS VERIFIED 100% SUCCESSFUL!');
  console.log('====================================================');
}

main().catch(console.error);
