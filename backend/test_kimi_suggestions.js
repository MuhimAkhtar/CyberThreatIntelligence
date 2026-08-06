const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== VERIFYING KIMI 3 MODAL CLOUD INTEGRATION & SUGGESTIONS ===\n');

  // 1. Authenticate as Admin
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cyber-platform.local', password: 'AdminPassword123!' }),
  });
  const { accessToken } = await loginRes.json();

  // 2. Fetch an existing Investigation Case
  const cases = await prisma.investigationCase.findMany({ take: 1 });
  if (cases.length === 0) {
    console.log('No cases found in DB.');
    return;
  }
  const caseId = cases[0].id;
  console.log(`Targeting Case ID: ${caseId} (${cases[0].title})`);

  // 3. Trigger Kimi 3 Report Generation via Platform API
  console.log('Requesting Kimi 3 AI Incident Summarization & Recommendations...');
  const reportRes = await fetch(`http://localhost:3000/api/v1/cases/${caseId}/summarize`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const report = await reportRes.json();

  console.log('\n==================================================');
  console.log('🤖 AI MODEL USED:', report.aiModelUsed);
  console.log('🔥 RISK SCORE:', report.riskScore);
  console.log('🎯 ATTACK TECHNIQUES:', report.attackTechniques);
  console.log('==================================================\n');
  console.log('📝 KIMI 3 GENERATED SUGGESTIONS & REPORT:\n');
  console.log(report.content);
}

main().catch(console.error).finally(() => prisma.$disconnect());
