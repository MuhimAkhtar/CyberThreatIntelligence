import { PrismaClient, FeedType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin123!@#', 12);
  const analystPassword = await bcrypt.hash('Analyst123!@#', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cyber-platform.local' },
    update: {},
    create: {
      email: 'admin@cyber-platform.local',
      passwordHash: adminPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@cyber-platform.local' },
    update: {},
    create: {
      email: 'analyst@cyber-platform.local',
      passwordHash: analystPassword,
      firstName: 'SOC',
      lastName: 'Analyst',
      role: 'SOC_ANALYST',
    },
  });

  const otxFeed = await prisma.threatFeed.upsert({
    where: { id: 'feed-otx-001' },
    update: {},
    create: {
      id: 'feed-otx-001',
      name: 'AlienVault OTX Pulses',
      type: FeedType.OTX,
      enabled: true,
      fetchIntervalMinutes: 60,
      apiKeyEnvVar: 'OTX_API_KEY',
    },
  });

  const mispFeed = await prisma.threatFeed.upsert({
    where: { id: 'feed-misp-001' },
    update: {},
    create: {
      id: 'feed-misp-001',
      name: 'Local MISP Threat Feed',
      type: FeedType.MISP,
      baseUrl: 'http://localhost:8443',
      enabled: false,
      fetchIntervalMinutes: 60,
      apiKeyEnvVar: 'MISP_API_KEY',
    },
  });

  const nvdFeed = await prisma.threatFeed.upsert({
    where: { id: 'feed-nvd-001' },
    update: {},
    create: {
      id: 'feed-nvd-001',
      name: 'National Vulnerability Database (NVD API v2)',
      type: FeedType.NVD,
      enabled: true,
      fetchIntervalMinutes: 120,
      apiKeyEnvVar: 'NVD_API_KEY',
    },
  });

  console.log('Seeded users:', { admin: admin.email, analyst: analyst.email });
  console.log('Seeded feeds:', { otx: otxFeed.id, misp: mispFeed.id, nvd: nvdFeed.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
