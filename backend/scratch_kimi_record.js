const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const report = await prisma.incidentReport.findUnique({
    where: { id: '62d35365-6ede-44e9-a154-ce61cf6eebca' },
  });
  console.log('=== RAW DATABASE RECORD FROM KIMI 3 MODAL CLOUD INFERENCE ===\n');
  console.log(JSON.stringify(report, null, 2));
}

main().finally(() => prisma.$disconnect());
