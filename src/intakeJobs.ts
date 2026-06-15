import { prisma } from './db.js';
import { IntakeJobStatus, type IntakeJobTypeValue } from './prismaEnums.js';

export async function enqueueIntakeJob(opts: {
  intakeId: string;
  type: IntakeJobTypeValue;
  payload?: any;
  runAfter?: Date;
}) {
  return prisma.intakeJob.create({
    data: {
      intakeId: opts.intakeId,
      type: opts.type,
      status: IntakeJobStatus.PENDING,
      payload: opts.payload,
      runAfter: opts.runAfter,
    },
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
