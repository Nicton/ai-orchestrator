import { IntakeJobStatus, IntakeJobType } from '@prisma/client';
import { prisma } from './db.js';

export async function enqueueIntakeJob(opts: {
  intakeId: string;
  type: IntakeJobType;
  payload?: any;
  runAfter?: Date;
}) {
  // Best-effort idempotency under concurrency:
  // if there is already an active job (PENDING/RUNNING) for (intakeId,type), return it.
  // We keep this transactional to minimize race windows.
  return prisma.$transaction(async (tx) => {
    const existing = await tx.intakeJob.findFirst({
      where: {
        intakeId: opts.intakeId,
        type: opts.type,
        status: { in: [IntakeJobStatus.PENDING, IntakeJobStatus.RUNNING] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) return existing;

    return tx.intakeJob.create({
      data: {
        intakeId: opts.intakeId,
        type: opts.type,
        status: IntakeJobStatus.PENDING,
        payload: opts.payload,
        runAfter: opts.runAfter,
      },
    });
  });
}

export async function markIntakeJobDone(jobId: string) {
  return prisma.intakeJob.update({
    where: { id: jobId },
    data: { status: IntakeJobStatus.DONE, finishedAt: new Date() },
  });
}

export async function markIntakeJobFailed(jobId: string, errorMessage: string, runAfter?: Date) {
  return prisma.intakeJob.update({
    where: { id: jobId },
    data: {
      status: IntakeJobStatus.FAILED,
      errorMessage,
      finishedAt: new Date(),
      runAfter,
    },
  });
}
