import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const rows = await prisma.stageRun.findMany({ where: { status: 'RUNNING' }, select: { id: true, runId: true, stageId: true, startedAt: true } });
console.log(rows);
await prisma.$disconnect();
