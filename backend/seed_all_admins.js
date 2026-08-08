const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seedAdminUsers() {
  console.log('Seeding / updating admin users in PostgreSQL database...');
  const passwordHash = await bcrypt.hash('AdminPassword123!', 10);

  const emailsToEnsure = [
    { email: 'user.admin@nctip.gov', firstName: 'NCTIP', lastName: 'Super Admin' },
    { email: 'admin@cyber-platform.local', firstName: 'Platform', lastName: 'Admin' },
    { email: 'analyst@soc.gov.pk', firstName: 'SOC', lastName: 'Analyst Lead' }
  ];

  for (const u of emailsToEnsure) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      await prisma.user.update({
        where: { email: u.email },
        data: { passwordHash: passwordHash, role: 'ADMIN', isActive: true },
      });
      console.log(`Updated user ${u.email} passwordHash & role ADMIN`);
    } else {
      await prisma.user.create({
        data: {
          email: u.email,
          passwordHash: passwordHash,
          firstName: u.firstName,
          lastName: u.lastName,
          role: 'ADMIN',
          isActive: true,
        },
      });
      console.log(`Created user ${u.email} with password AdminPassword123!`);
    }
  }
}

seedAdminUsers()
  .catch((err) => console.error('Error seeding admin users:', err))
  .finally(() => prisma.$disconnect());
