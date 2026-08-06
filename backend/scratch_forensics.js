BigInt.prototype.toJSON = function () {
  return Number(this);
};
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const artifacts = await prisma.forensicArtifact.findMany({
    include: { custodyEvents: true },
  });
  console.log(JSON.stringify(artifacts, null, 2));
}

main().finally(() => prisma.$disconnect());
