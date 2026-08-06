BigInt.prototype.toJSON = function () {
  return Number(this);
};

const { PrismaClient } = require('@prisma/client');
const http = require('http');

const prisma = new PrismaClient();
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

async function audit() {
  console.log('====================================================');
  console.log('   PHASE 5 DEEP EMPIRICAL AUDIT & RAW DATA REPORT   ');
  console.log('====================================================\n');

  // Login
  const loginRes = await request('/auth/login', 'POST', {
    email: 'admin@cyber-platform.local',
    password: 'AdminPassword123!',
  });
  const token = loginRes.body.accessToken;

  // 1. AI INCIDENT SUMMARIZATION AUDIT
  console.log('----------------------------------------------------');
  console.log('1. AI INCIDENT SUMMARIZATION AUDIT');
  console.log('----------------------------------------------------');
  console.log(`GEMINI_API_KEY in process.env: ${process.env.GEMINI_API_KEY ? 'CONFIGURED' : 'NOT CONFIGURED (Using Fallback Engine)'}`);
  
  const reports = await prisma.incidentReport.findMany({
    take: 2,
    orderBy: { generatedAt: 'desc' },
  });
  console.log('\nRAW DATABASE RECORD (incident_reports table):');
  console.log(JSON.stringify(reports, null, 2));

  // 2. DIGITAL FORENSICS AUDIT
  console.log('\n----------------------------------------------------');
  console.log('2. DIGITAL FORENSICS AUDIT');
  console.log('----------------------------------------------------');
  const artifacts = await prisma.forensicArtifact.findMany({
    take: 1,
    orderBy: { createdAt: 'desc' },
    include: {
      custodyEvents: {
        orderBy: { timestamp: 'asc' },
      },
    },
  });
  console.log('\nRAW DATABASE RECORD (forensic_artifacts + custody_events):');
  console.log(JSON.stringify(artifacts, null, 2));

  // Test VirusTotal VT Lookup endpoint directly
  if (artifacts.length > 0) {
    const vtRes = await request(`/forensics/artifacts/${artifacts[0].id}/vt-lookup`, 'POST', {}, token);
    console.log('\nRAW VIRUSTOTAL API LOOKUP RESULT:');
    console.log(JSON.stringify(vtRes, null, 2));
  }

  // 3. MITRE ATT&CK AUDIT
  console.log('\n----------------------------------------------------');
  console.log('3. MITRE ATT&CK AUDIT');
  console.log('----------------------------------------------------');
  const seedCount = await prisma.mitreAttackTechnique.count();
  console.log(`Database Technique Count: ${seedCount}`);

  const coverageRes = await request('/mitre/coverage', 'GET', null, token);
  console.log('\nRAW API RESPONSE (GET /api/v1/mitre/coverage):');
  console.log(JSON.stringify(coverageRes.body, null, 2));

  const searchRes = await request('/mitre/techniques?search=Scanning', 'GET', null, token);
  console.log('\nRAW API RESPONSE (GET /api/v1/mitre/techniques?search=Scanning):');
  console.log(JSON.stringify(searchRes.body, null, 2));

  // 4. EXTERNAL SIEM AUDIT
  console.log('\n----------------------------------------------------');
  console.log('4. EXTERNAL SIEM AUDIT');
  console.log('----------------------------------------------------');
  const connectors = await prisma.siemConnector.findMany({
    include: {
      syncLogs: true,
    },
  });
  console.log('\nRAW DATABASE RECORD (siem_connectors + siem_sync_logs):');
  console.log(JSON.stringify(connectors, null, 2));

  // Inbound Webhook test
  const webhookTestPayload = {
    title: 'Wazuh Rule 5710: SSH Brute Force Detection',
    description: '15 failed password attempts from 192.168.1.105',
    severity: 'HIGH',
    id: 'wazuh-event-99412',
  };
  const webhookRes = await request('/siem/webhook/ingest', 'POST', webhookTestPayload);
  console.log('\nRAW INBOUND SIEM WEBHOOK RESPONSE (POST /api/v1/siem/webhook/ingest):');
  console.log(JSON.stringify(webhookRes, null, 2));

  const webhookAlert = await prisma.alert.findUnique({
    where: { id: webhookRes.body.id },
  });
  console.log('\nRAW DATABASE RECORD OF CREATED SIEM ALERT (alerts table):');
  console.log(JSON.stringify(webhookAlert, null, 2));

  // 5. AUTOMATED PLAYBOOKS AUDIT
  console.log('\n----------------------------------------------------');
  console.log('5. AUTOMATED PLAYBOOKS (SOAR-LITE) AUDIT');
  console.log('----------------------------------------------------');
  const playbooks = await prisma.playbook.findMany({
    take: 1,
    orderBy: { createdAt: 'desc' },
    include: {
      executions: {
        orderBy: { executedAt: 'desc' },
        take: 1,
      },
    },
  });
  console.log('\nRAW DATABASE RECORD (playbooks + playbook_executions):');
  console.log(JSON.stringify(playbooks, null, 2));

  if (playbooks.length > 0 && playbooks[0].executions.length > 0) {
    const exec = playbooks[0].executions[0];
    const actionsRun = exec.actionsRun;
    console.log('\nRAW PLAYBOOK ACTIONS EXECUTION DETAILED BREAKDOWN:');
    console.log(JSON.stringify(actionsRun, null, 2));
  }

  // 6. NOTIFICATIONS AUDIT
  console.log('\n----------------------------------------------------');
  console.log('6. NOTIFICATIONS AUDIT');
  console.log('----------------------------------------------------');
  const notifications = await prisma.notification.findMany({
    take: 5,
    orderBy: { sentAt: 'desc' },
  });
  console.log('\nRAW DATABASE RECORD (notifications table):');
  console.log(JSON.stringify(notifications, null, 2));
}

audit().catch(console.error).finally(() => prisma.$disconnect());
