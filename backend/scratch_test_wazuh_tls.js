const https = require('https');

const agent = new https.Agent({
  rejectUnauthorized: false,
  minVersion: 'TLSv1.2',
  ciphers: 'DEFAULT@SECLEVEL=0'
});

const req = https.request({
  hostname: '127.0.0.1',
  port: 55000,
  path: '/security/user/authenticate',
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + Buffer.from('wazuh-wui:MyS3cr37P450r.*-').toString('base64'),
    'Content-Type': 'application/json'
  },
  agent: agent
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('HTTP STATUS:', res.statusCode, '\nBODY:', body));
});

req.on('error', err => console.error('TLS ERROR:', err));
req.end();
