const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const connector = await prisma.siemConnector.findUnique({
    where: { id: '9a74a32f-b1a7-4ff0-a398-85169e84d393' },
    include: { syncLogs: true },
  });
  console.log('=== RAW POSTGRESQL RECORD FOR REAL WAZUH 4.10.0 CONNECTOR ===\n');
  console.log(JSON.stringify(connector, null, 2));
}

main().finally(() => prisma.$disconnect());
