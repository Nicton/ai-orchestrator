import { prisma } from './db.js';
import { WfEventType, WfJobStatus, WfJobType, WfTaskStatus, type WfJobTypeValue, type WfTaskStatusValue } from './prismaEnums.js';

export async function wfCreateTask(params: {
  externalSource?: string;
  externalTaskId?: string;
  title: string;
  description?: string;
  projectId?: string;
  repositoryId?: string;
  reporterId?: string;
  assigneeId?: string;
  taskType?: string;
  priority?: string;
  deadlineAt?: Date;
}) {
  const task = await prisma.wfTask.create({
    data: {
      externalSource: params.externalSource,
      externalTaskId: params.externalTaskId,
      title: params.title,
      description: params.description,
      projectId: params.projectId,
      repositoryId: params.repositoryId,
      reporterId: params.reporterId,
      assigneeId: params.assigneeId,
      taskType: params.taskType,
      priority: params.priority,
      deadlineAt: params.deadlineAt,
      status: WfTaskStatus.NEW,
    },
  });

  await prisma.wfTaskEvent.create({
    data: {
      taskId: task.id,
      eventType: WfEventType.TASK_CREATED,
      actorType: 'system',
      payload: {
        externalSource: params.externalSource,
        externalTaskId: params.externalTaskId,
      },
    },
  });

  return task;
}

export async function wfEnqueueJob(taskId: string, type: WfJobTypeValue, payload?: any) {
  return prisma.wfJob.create({
    data: {
      taskId,
      type,
      status: WfJobStatus.PENDING,
      payload: payload ?? undefined,
    },
  });
}

export async function wfSetStatus(taskId: string, status: WfTaskStatusValue, reason?: string) {
  const task = await prisma.wfTask.update({
    where: { id: taskId },
    data: {
      status,
      ...(status === WfTaskStatus.BLOCKED ? { blockedReason: reason } : {}),
    },
  });

  await prisma.wfTaskEvent.create({
    data: {
      taskId,
      eventType: WfEventType.STATUS_CHANGED,
      actorType: 'system',
      payload: { status, reason },
    },
  });

  return task;
}
