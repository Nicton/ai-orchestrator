import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const olderThanMinutes = Number(process.env.OLDER_THAN_MINUTES || 10);
const cutoff = new Date(Date.now() - olderThanMinutes * 60_000);
console.log(`[reset-stuck] now=${new Date().toISOString()} cutoff=${cutoff.toISOString()}`);

const stuckStages = await prisma.stageRun.findMany({
  where: { status: 'RUNNING', startedAt: { lt: cutoff } },
  select: { id: true, runId: true, stageId: true, startedAt: true },
});

console.log(`[reset-stuck] found ${stuckStages.length} stuck stages older than ${olderThanMinutes}m`);
for (const s of stuckStages) {
  console.log(`[reset-stuck] resetting stageRun=${s.id} run=${s.runId} stage=${s.stageId} startedAt=${s.startedAt}`);
}

const res = await prisma.stageRun.updateMany({
  where: { status: 'RUNNING', startedAt: { lt: cutoff } },
  data: { status: 'PENDING', startedAt: null },
});
console.log(`[reset-stuck] updated: ${res.count}`);

await prisma.$disconnect();
