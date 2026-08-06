const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.threatFeed.update({
  where: { id: 'feed-otx-001' },
  data: { lastSyncAt: null }
}).then(f => {
  console.log('Reset lastSyncAt to null for', f.id);
  console.log('lastSyncAt is now:', f.lastSyncAt);
}).finally(() => p.$disconnect());
