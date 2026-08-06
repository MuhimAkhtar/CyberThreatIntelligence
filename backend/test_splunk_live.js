const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== REAL SPLUNK ENTERPRISE HEC CONNECTOR VERIFICATION ===\n');

  // 1. Authenticate against NestJS Backend
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cyber-platform.local', password: 'AdminPassword123!' }),
  });
  const { accessToken } = await loginRes.json();
  console.log('1. Authenticated as Admin on NestJS Platform');

  // 2. Upsert Splunk HEC Connector in PostgreSQL
  const splunkConnector = await prisma.siemConnector.upsert({
    where: { id: '77777777-8888-9999-aaaa-bbbbccccdddd' },
    update: {
      name: 'Production Splunk Enterprise HEC',
      type: 'SPLUNK_HEC',
      config: {
        host: 'localhost',
        port: 8088,
        token: '11111111-2222-3333-4444-555555555555',
        index: 'main',
        useHttps: true,
        verifySsl: false
      },
      enabled: true
    },
    create: {
      id: '77777777-8888-9999-aaaa-bbbbccccdddd',
      name: 'Production Splunk Enterprise HEC',
      type: 'SPLUNK_HEC',
      config: {
        host: 'localhost',
        port: 8088,
        token: '11111111-2222-3333-4444-555555555555',
        index: 'main',
        useHttps: true,
        verifySsl: false
      },
      enabled: true
    }
  });
  console.log('2. Registered Splunk HEC Connector in PostgreSQL:', splunkConnector.id);

  // 3. Test HEC Connection via NestJS API
  console.log('\n3. Testing Splunk HEC Connection via NestJS API...');
  const testRes = await fetch(`http://localhost:3000/api/v1/siem/connectors/${splunkConnector.id}/test`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const testResult = await testRes.json();
  console.log('HEC Test Result:', testResult);

  // 4. Forward Live Security Alerts to Splunk Enterprise
  console.log('\n4. Forwarding Live Security Alerts to Splunk Enterprise...');
  const fwdRes = await fetch(`http://localhost:3000/api/v1/siem/connectors/${splunkConnector.id}/forward`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ alertIds: [] })
  });
  const fwdResult = await fwdRes.json();
  console.log('Live Alert Forwarding Result:', fwdResult);

  // 5. Query PostgreSQL Sync Log
  const connectorDb = await prisma.siemConnector.findUnique({
    where: { id: splunkConnector.id },
    include: { syncLogs: { take: 5, orderBy: { executedAt: 'desc' } } }
  });
  console.log('\n=== RAW POSTGRESQL RECORD FOR SPLUNK CONNECTOR ===');
  console.log(JSON.stringify(connectorDb, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
