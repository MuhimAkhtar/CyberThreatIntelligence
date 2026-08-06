const https = require('https');

function httpsRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request({ ...options, rejectUnauthorized: false }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function testRealWazuh() {
  console.log('=== TESTING REAL ENTERPRISE WAZUH MANAGER 4.10.0 ON PORT 55000 ===\n');

  // 1. Authenticate directly against Real Wazuh Manager REST API
  console.log('1. Authenticating directly against Real Wazuh Manager REST API (https://localhost:55000/security/user/authenticate)...');
  const authHeader = 'Basic ' + Buffer.from('wazuh-wui:MyS3cr37P450r.*-').toString('base64');
  
  const authRes = await httpsRequest({
    hostname: 'localhost',
    port: 55000,
    path: '/security/user/authenticate',
    method: 'POST',
    headers: { Authorization: authHeader },
  });

  console.log('Real Wazuh API Response Status:', authRes.status);
  console.log('Real Wazuh API Payload:', JSON.stringify(authRes.data, null, 2));

  if (!authRes.data?.data?.token) {
    console.error('❌ Wazuh authentication failed.');
    return;
  }
  const wazuhToken = authRes.data.data.token;
  console.log('✅ Acquired Real JWT Token from Wazuh Manager API!');

  // 2. Query Real Wazuh Manager Status Endpoint
  console.log('\n2. Fetching Real Wazuh Manager System Status (GET /manager/status)...');
  const statusRes = await httpsRequest({
    hostname: 'localhost',
    port: 55000,
    path: '/manager/status',
    method: 'GET',
    headers: { Authorization: `Bearer ${wazuhToken}` },
  });
  console.log('Real Wazuh Manager Status Payload:', JSON.stringify(statusRes.data, null, 2));

  // 3. Authenticate with NestJS Platform API & Create Real Wazuh Connector
  console.log('\n3. Logging into CTP NestJS Platform API...');
  const ctpLoginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cyber-platform.local', password: 'AdminPassword123!' }),
  });
  const ctpLoginData = await ctpLoginRes.json();
  const token = ctpLoginData.accessToken;

  console.log('\n4. Registering Real Production Wazuh Connector in PostgreSQL...');
  const connRes = await fetch('http://localhost:3000/api/v1/siem/connectors', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Production Wazuh Manager 4.10.0',
      type: 'WAZUH',
      config: {
        host: 'localhost',
        port: 55000,
        username: 'wazuh-wui',
        password: 'MyS3cr37P450r.*-',
        verifySsl: false
      },
    }),
  });
  const connector = await connRes.json();
  console.log(`✅ Created Real Wazuh Connector in DB! ID: ${connector.id}`);

  // 5. Test Connection via NestJS Service
  console.log('\n5. Executing live NestJS SIEM Connector test against Real Wazuh Manager...');
  const testRes = await fetch(`http://localhost:3000/api/v1/siem/connectors/${connector.id}/test`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const testData = await testRes.json();
  console.log('NestJS Connector Test Result:', JSON.stringify(testData, null, 2));

  // 6. Forward Alerts to Real Wazuh Manager
  console.log('\n6. Streaming live security alerts to Real Wazuh Manager...');
  const fwdRes = await fetch(`http://localhost:3000/api/v1/siem/connectors/${connector.id}/forward`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const fwdData = await fwdRes.json();
  console.log('Forwarding Result:', JSON.stringify(fwdData, null, 2));
}

testRealWazuh().catch(console.error);
