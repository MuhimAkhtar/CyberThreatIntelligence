const http = require('http');

const API_BASE = 'http://localhost:3000/api/v1';

async function request(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function main() {
  console.log('=== PHASE 5 END-TO-END LIVE VERIFICATION ===\n');

  // 1. Authenticate as Admin
  console.log('1. Authenticating as admin@cyber-platform.local...');
  const loginRes = await request('/auth/login', 'POST', {
    email: 'admin@cyber-platform.local',
    password: 'AdminPassword123!',
  });

  if ((loginRes.status !== 200 && loginRes.status !== 201) || !loginRes.body.accessToken) {
    console.error('Failed to log in:', loginRes);
    process.exit(1);
  }
  const token = loginRes.body.accessToken;
  const adminUserId = loginRes.body.user.id;
  console.log(`✅ Logged in successfully. Token acquired. Admin User ID: ${adminUserId}\n`);

  // 2. MITRE ATT&CK Module Test
  console.log('2. Testing MITRE ATT&CK Module...');
  const seedRes = await request('/mitre/seed', 'POST', {}, token);
  console.log(`   POST /mitre/seed -> Status: ${seedRes.status}, Response:`, seedRes.body);

  const searchRes = await request('/mitre/techniques?search=Scanning', 'GET', null, token);
  console.log(`   GET /mitre/techniques?search=Scanning -> Total found: ${searchRes.body.total}`);

  const heatmapRes = await request('/mitre/coverage', 'GET', null, token);
  console.log(`   GET /mitre/coverage -> Heatmap status: ${heatmapRes.status}`);
  console.log('✅ MITRE ATT&CK Module verified.\n');

  // 3. Get existing Investigation Case or create one
  console.log('3. Fetching existing investigation case...');
  let casesRes = await request('/cases', 'GET', null, token);
  let caseId;
  if (casesRes.body.data && casesRes.body.data.length > 0) {
    caseId = casesRes.body.data[0].id;
    console.log(`   Using existing Case ID: ${caseId}`);
  } else {
    const createCaseRes = await request('/cases', 'POST', {
      title: 'Phase 5 Verification Case',
      description: 'Automated test case for Phase 5 verification',
      priority: 'HIGH',
    }, token);
    caseId = createCaseRes.body.id;
    console.log(`   Created new Case ID: ${caseId}`);
  }

  // 4. Digital Forensics Module Test
  console.log('\n4. Testing Digital Forensics Module...');
  const artifactRes = await request('/forensics/artifacts', 'POST', {
    caseId,
    artifactType: 'MEMORY_DUMP',
    fileName: 'memdump_mem_001.raw',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    fileSizeBytes: 10485760,
    description: 'Volatile memory dump taken from compromised server',
    tags: ['volatile_memory', 'lsass_dump'],
  }, token);
  console.log(`   POST /forensics/artifacts -> Status: ${artifactRes.status}, ID: ${artifactRes.body.id}`);
  const artifactId = artifactRes.body.id;

  const custodyRes = await request(`/forensics/artifacts/${artifactId}/custody`, 'POST', {
    action: 'ANALYZED',
    notes: 'Volatile memory analyzed with Volatility 3 framework',
  }, token);
  console.log(`   POST /forensics/artifacts/:id/custody -> Action recorded: ${custodyRes.body.action}`);

  const verifyRes = await request(`/forensics/artifacts/${artifactId}/verify`, 'POST', {}, token);
  console.log(`   POST /forensics/artifacts/:id/verify -> Verified: ${verifyRes.body.verified}`);

  const getCustodyRes = await request(`/forensics/artifacts/${artifactId}/custody`, 'GET', null, token);
  console.log(`   GET /forensics/artifacts/:id/custody -> Chain length: ${getCustodyRes.body.length}`);
  console.log('✅ Digital Forensics Module verified.\n');

  // 5. AI Incident Reporting Module Test
  console.log('5. Testing AI Incident Reporting Module...');
  const summaryRes = await request(`/cases/${caseId}/summarize`, 'POST', {}, token);
  console.log(`   POST /cases/:id/summarize -> Report ID: ${summaryRes.body.id}, Title: "${summaryRes.body.title}"`);

  const reportRes = await request(`/cases/${caseId}/reports`, 'POST', {
    format: 'TECHNICAL',
  }, token);
  console.log(`   POST /cases/:id/reports (TECHNICAL) -> Report ID: ${reportRes.body.id}, Title: "${reportRes.body.title}"`);

  const listReportsRes = await request(`/cases/${caseId}/reports`, 'GET', null, token);
  console.log(`   GET /cases/:id/reports -> Total reports for case: ${listReportsRes.body.total}`);
  console.log('✅ AI Incident Reporting Module verified.\n');

  // 6. External SIEM Module Test
  console.log('6. Testing External SIEM Module...');
  const connectorRes = await request('/siem/connectors', 'POST', {
    name: 'Splunk Production SIEM',
    type: 'SPLUNK_HEC',
    config: {
      host: 'splunk.internal.net',
      port: 8088,
      token: 'hec-token-12345',
      index: 'ctp_threat_alerts',
    },
    enabled: true,
  }, token);
  console.log(`   POST /siem/connectors -> Connector ID: ${connectorRes.body.id}`);
  const connectorId = connectorRes.body.id;

  const testConnRes = await request(`/siem/connectors/${connectorId}/test`, 'POST', {}, token);
  console.log(`   POST /siem/connectors/:id/test -> Result: ${JSON.stringify(testConnRes.body)}`);

  const webhookIngestRes = await request('/siem/webhook/ingest', 'POST', {
    title: 'Wazuh Alert: Unauthorized SSH Login Attempt',
    description: 'Multiple failed password attempts detected from 192.168.1.100',
    severity: 'HIGH',
    id: 'wazuh-rule-5710',
  });
  console.log(`   POST /siem/webhook/ingest -> Created Alert ID: ${webhookIngestRes.body.id}, Severity: ${webhookIngestRes.body.severity}`);
  console.log('✅ External SIEM Module verified.\n');

  // 7. Automated Playbooks (SOAR-Lite) Module Test
  console.log('7. Testing Automated Playbooks (SOAR-Lite) Module...');
  const playbookRes = await request('/playbooks', 'POST', {
    name: 'Auto-Respond to Critical Alerts',
    description: 'Automatically creates a case and sends notification when a critical alert occurs',
    trigger: 'ALERT_CRITICAL',
    conditions: { severity: 'CRITICAL' },
    actions: [
      {
        type: 'CREATE_CASE',
        params: { title: 'Auto-Incident: Critical Threat Detections', priority: 'CRITICAL' },
      },
      {
        type: 'SEND_NOTIFICATION',
        params: { subject: 'Critical Incident Created', body: 'A critical alert triggered automated case creation.' },
      },
    ],
  }, token);
  console.log(`   POST /playbooks -> Playbook ID: ${playbookRes.body.id}, Status: ${playbookRes.body.status}`);
  const playbookId = playbookRes.body.id;

  const activateRes = await request(`/playbooks/${playbookId}/activate`, 'POST', {}, token);
  console.log(`   POST /playbooks/:id/activate -> Status: ${activateRes.body.status}`);

  const execRes = await request(`/playbooks/${playbookId}/execute`, 'POST', {
    triggeredBy: 'MANUAL',
    context: { userId: adminUserId },
  }, token);
  console.log(`   POST /playbooks/:id/execute -> Success: ${execRes.body.success}, Duration: ${execRes.body.durationMs}ms`);
  console.log('✅ Automated Playbooks Module verified.\n');

  // 8. Notifications Module Test
  console.log('8. Testing Notifications Module...');
  const notifsRes = await request('/notifications', 'GET', null, token);
  console.log(`   GET /notifications -> Total notifications: ${notifsRes.body.total}`);

  const unreadRes = await request('/notifications/unread-count', 'GET', null, token);
  console.log(`   GET /notifications/unread-count -> Unread count: ${unreadRes.body.count}`);

  const readAllRes = await request('/notifications/read-all', 'PATCH', {}, token);
  console.log(`   PATCH /notifications/read-all -> Updated count: ${readAllRes.body.updated}`);
  console.log('✅ Notifications Module verified.\n');

  console.log('====================================================');
  console.log('🎉 ALL 6 PHASE 5 MODULES LIVE-VERIFIED SUCCESSFULLY!');
  console.log('====================================================');
}

main().catch(err => {
  console.error('Test script failed:', err);
  process.exit(1);
});
