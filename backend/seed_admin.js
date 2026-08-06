const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Existing users:', users.map(u => ({ id: u.id, email: u.email, role: u.role })));

  const passwordHash = await bcrypt.hash('AdminPassword123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cyber-platform.local' },
    update: { passwordHash, isActive: true, role: 'ADMIN' },
    create: {
      email: 'admin@cyber-platform.local',
      firstName: 'Admin',
      lastName: 'User',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('Admin user updated/created:', admin.id, admin.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
