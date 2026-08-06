const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== REVERTING ADMIN USER EMAIL BACK TO TEST ADDRESS ===\n');

  // Revert admin email back to admin@cyber-platform.local
  const updatedUser = await prisma.user.updateMany({
    where: {
      email: {
        in: ['muhimakhtar4@gmail.com', 'abc787980abc@gmail.com']
      }
    },
    data: {
      email: 'admin@cyber-platform.local'
    }
  });

  console.log(`✅ Updated ${updatedUser.count} user records back to 'admin@cyber-platform.local'`);

  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, email: true, firstName: true, lastName: true, role: true }
  });
  console.log('\nCurrent Admin User in PostgreSQL DB:');
  console.log(admin);
}

main().catch(console.error).finally(() => prisma.$disconnect());
