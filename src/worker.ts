import fetch from 'node-fetch';
import { IntakeJobStatus, IntakeJobType, RunStatus, StageStatus, TaskStatus } from '@prisma/client';
import { prisma } from './db.js';
import { config } from './config.js';
import { runRolePrompt, transcribeAudioFile } from './llm.js';
import { loadSkillMarkdown } from './skills.js';
import { executeCommand } from './youtrack.js';
import { generateQuestionnaireFromTranscript, generateRequirementCardFromQuestionnaire } from './requirementIntake.js';
import { appendEvent } from './bus/sink.js';
import { newEventId, nowIso } from './bus/events.js';

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

function buildStagePrompt(params: {
  runTitle?: string | null;
  pipelineId: string;
  stageId: string;
  stageName: string;
  roleOrSkill: string;
  skillMarkdown: string;
  runInputText: string;
  upstreamSummaries: Array<{ stageId: string; stageName: string; resultText: string | null }>;
}) {
  const upstreamBlock = params.upstreamSummaries
    .map((u) => `### Upstream: ${u.stageId} (${u.stageName})\n${u.resultText ?? '(no result)'}\n`)
    .join('\n');

  return [
    `You are an agent executing one stage in a QA automation pipeline.`,
    `Pipeline: ${params.pipelineId}`,
    `Run title: ${params.runTitle ?? '-'}`,
    `Stage: ${params.stageId} (${params.stageName})`,
    `Role/Skill: ${params.roleOrSkill}`,
    '',
    '---',
    'SKILL DEFINITION (authoritative):',
    params.skillMarkdown,
    '---',
    'RUN INPUT (original user request / ticket context):',
    params.runInputText,
    '---',
    'UPSTREAM RESULTS:',
    upstreamBlock || '(none)',
    '---',
    'OUTPUT CONTRACT:',
    'Return a single JSON object with:',
    '{',
    '  "summary": string,',
    '  "artifacts": [{"kind": string, "name"?: string, "contentType"?: string, "text"?: string, "url"?: string}],',
    '  "next": [{"stageId": string, "reason": string}]',
    '}',
    'Rules:',
    '- Do NOT invent URLs or evidence. If unknown, omit url and explain in summary.',
    '- Artifacts.text must contain actual content, not placeholders.',
    '- Keep it concise but complete for downstream stages.',
  ].join('\n');
}

async function processNextStageRun() {
  // Find a runnable stage: PENDING and all dependencies DONE/SKIPPED.
  // Important: do not stop at the first PENDING stage; scan for the first runnable one.
  const pending = await prisma.stageRun.findMany({
    where: { status: StageStatus.PENDING },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });
  if (!pending.length) return false;

  let candidate: (typeof pending)[number] | undefined;

  for (const s of pending) {
    if (!s.dependsOn?.length) {
      candidate = s;
      break;
    }

    const deps = await prisma.stageRun.findMany({
      where: { runId: s.runId, stageId: { in: s.dependsOn } },
      select: { stageId: true, status: true },
    });

    const depMap = new Map(deps.map((d) => [d.stageId, d.status]));
    const allReady = s.dependsOn.every((id) => {
      const st = depMap.get(id);
      return st === StageStatus.DONE || st === StageStatus.SKIPPED;
    });

    if (allReady) {
      candidate = s;
      break;
    }
  }

  if (!candidate) return false;

  const run = await prisma.pipelineRun.findUnique({ where: { id: candidate.runId } });
  if (!run) {
    await prisma.stageRun.update({
      where: { id: candidate.id },
      data: { status: StageStatus.FAILED, errorMessage: 'Parent run not found', finishedAt: new Date() },
    });
    return true;
  }

  // Lock stage
  const locked = await prisma.stageRun.updateMany({
    where: { id: candidate.id, status: StageStatus.PENDING },
    data: { status: StageStatus.RUNNING, startedAt: new Date() },
  });
  if (locked.count === 0) return true;

  console.log(`[worker] stage start run=${candidate.runId} stage=${candidate.stageId} role=${candidate.roleOrSkill}`);
  appendEvent({
    id: newEventId(),
    ts: nowIso(),
    type: 'stage.status',
    runId: candidate.runId,
    stageId: candidate.stageId,
    stageName: candidate.stageName,
    status: 'running',
    message: `stage start role=${candidate.roleOrSkill}`,
    actor: { kind: 'agent', id: candidate.roleOrSkill },
  });

  // Ensure run is RUNNING
  if (run.status === RunStatus.PENDING) {
    await prisma.pipelineRun.update({ where: { id: run.id }, data: { status: RunStatus.RUNNING, startedAt: new Date() } });
  }

  try {
    const upstream = await prisma.stageRun.findMany({
      where: { runId: run.id, stageId: { in: candidate.dependsOn } },
      select: { stageId: true, stageName: true, resultText: true },
    });

    const skill = loadSkillMarkdown(candidate.roleOrSkill);
    const prompt = buildStagePrompt({
      runTitle: run.title,
      pipelineId: run.pipelineId,
      stageId: candidate.stageId,
      stageName: candidate.stageName,
      roleOrSkill: candidate.roleOrSkill,
      skillMarkdown: skill.markdown,
      runInputText: run.inputText,
      upstreamSummaries: upstream,
    });

    appendEvent({
      id: newEventId(),
      ts: nowIso(),
      type: 'tool.start',
      runId: candidate.runId,
      stageId: candidate.stageId,
      actor: { kind: 'agent', id: candidate.roleOrSkill },
      llm: { provider: 'anthropic' },
      call: { tool: 'llm.runRolePrompt', input: { roleOrSkill: candidate.roleOrSkill } },
    });

    const llm = await runRolePrompt(candidate.roleOrSkill, prompt);

    appendEvent({
      id: newEventId(),
      ts: nowIso(),
      type: 'tool.end',
      runId: candidate.runId,
      stageId: candidate.stageId,
      actor: { kind: 'agent', id: candidate.roleOrSkill },
      llm: { provider: 'anthropic', model: llm.model },
      call: { tool: 'llm.runRolePrompt' },
    });

    const done = await prisma.stageRun.update({
      where: { id: candidate.id },
      data: {
        status: StageStatus.DONE,
        promptText: prompt,
        resultText: llm.text,
        model: llm.model,
        promptTokens: llm.promptTokens,
        completionTokens: llm.completionTokens,
        totalTokens: llm.totalTokens,
        finishedAt: new Date(),
      },
    });

    console.log(`[worker] stage done  run=${candidate.runId} stage=${candidate.stageId} role=${candidate.roleOrSkill} tokens=${done.totalTokens ?? '-'}`);

    appendEvent({
      id: newEventId(),
      ts: nowIso(),
      type: 'stage.result',
      runId: candidate.runId,
      stageId: candidate.stageId,
      actor: { kind: 'agent', id: candidate.roleOrSkill },
      llm: { provider: 'anthropic', model: llm.model },
      result: {
        kind: 'success',
        summary: `stage done tokens=${done.totalTokens ?? '-'}`,
        rawText: done.resultText ?? '',
      },
    });

    appendEvent({
      id: newEventId(),
      ts: nowIso(),
      type: 'stage.status',
      runId: candidate.runId,
      stageId: candidate.stageId,
      stageName: candidate.stageName,
      status: 'completed',
      message: 'stage completed',
      actor: { kind: 'agent', id: candidate.roleOrSkill },
      llm: { provider: 'openai', model: llm.model },
    });

    await prisma.artifact.create({
      data: {
        runId: run.id,
        stageRunId: done.id,
        kind: 'stage_result_raw',
        name: `${done.stageId}.json`,
        contentType: 'application/json',
        text: done.resultText ?? '',
      },
    });

    // If this was the last stage (no more PENDING runnable), we’ll mark DONE when all stages are finished.
    const remaining = await prisma.stageRun.count({
      where: { runId: run.id, status: { in: [StageStatus.PENDING, StageStatus.RUNNING] } },
    });

    if (remaining === 0) {
      await prisma.pipelineRun.update({
        where: { id: run.id },
        data: { status: RunStatus.DONE, resultText: 'Pipeline completed', finishedAt: new Date() },
      });

      // If run is linked to YouTrack, move issue to Done.
      const ext = String(run.externalRef || '').trim();
      if (config.youtrack.enabled && ext.startsWith('youtrack:')) {
        const idReadable = ext.slice('youtrack:'.length);
        const doneState = String(process.env.YOUTRACK_DONE_STATE || 'Done').trim();
        try {
          await executeCommand(idReadable, `State ${doneState}`, `Auto: pipeline DONE (run ${run.id})`);
          console.log(`[worker] youtrack moved to ${doneState}: ${idReadable}`);
        } catch (e: any) {
          console.error(`[worker] failed to set YouTrack state ${doneState} for ${idReadable}`, e?.message || e);
        }
      }
    }
  } catch (e: any) {
    console.error(`[worker] stage failed run=${candidate.runId} stage=${candidate.stageId} role=${candidate.roleOrSkill}`, e);
    appendEvent({
      id: newEventId(),
      ts: nowIso(),
      type: 'stage.status',
      runId: candidate.runId,
      stageId: candidate.stageId,
      stageName: candidate.stageName,
      status: 'failed',
      message: e?.message || String(e),
      actor: { kind: 'agent', id: candidate.roleOrSkill },
    });
    await prisma.stageRun.update({
      where: { id: candidate.id },
      data: { status: StageStatus.FAILED, errorMessage: e?.message || String(e), finishedAt: new Date() },
    });
    await prisma.pipelineRun.update({
      where: { id: run.id },
      data: { status: RunStatus.FAILED, errorMessage: `Stage failed: ${candidate.stageId}: ${e?.message || String(e)}`, finishedAt: new Date() },
    });
  }

  return true;
}

function backoffMs(attempt: number) {
  // 1m, 2m, 4m ... capped at 30m
  return Math.min(30 * 60_000, 60_000 * Math.pow(2, Math.max(0, attempt)));
}

async function processNextIntakeJob() {
  const now = new Date();
  const next = await prisma.intakeJob.findFirst({
    where: {
      status: IntakeJobStatus.PENDING,
      OR: [{ runAfter: null }, { runAfter: { lte: now } }],
    },
    orderBy: [{ runAfter: 'asc' }, { createdAt: 'asc' }],
  });
  if (!next) return false;

  const locked = await prisma.intakeJob.updateMany({
    where: { id: next.id, status: IntakeJobStatus.PENDING },
    data: { status: IntakeJobStatus.RUNNING, startedAt: new Date(), lockedAt: new Date() },
  });
  if (locked.count === 0) return true;

  try {
    if (next.type === IntakeJobType.TRANSCRIBE) {
      const intake = await prisma.intake.findUnique({ where: { id: next.intakeId } });
      if (!intake) throw new Error('Intake not found');
      if (!intake.audioPath) throw new Error('No audioPath on intake');

      const existing = await prisma.transcript.findUnique({ where: { intakeId: next.intakeId } });
      if (!existing) {
        const abs = new URL(`file:${process.cwd()}/`);
        // resolve relative path safely
        const filePath = new URL(intake.audioPath, abs).pathname;
        const tr = await transcribeAudioFile(filePath);

        await prisma.transcript.create({
          data: { intakeId: next.intakeId, text: tr.text, language: tr.language },
        });

        await prisma.intake.update({
          where: { id: next.intakeId },
          data: {
            status: 'TRANSCRIBED' as any,
            events: { create: { type: 'TRANSCRIBED', payload: { model: tr.model, language: tr.language } } },
          },
        });
      }
    }

    if (next.type === IntakeJobType.GENERATE_QUESTIONNAIRE) {
      const existing = await prisma.questionnaireAnswerSet.findUnique({ where: { intakeId: next.intakeId } });
      if (!existing) {
        const gen = await generateQuestionnaireFromTranscript({ intakeId: next.intakeId });
        await prisma.questionnaireAnswerSet.create({
          data: { intakeId: next.intakeId, answers: gen.questionnaire as any },
        });
        await prisma.intake.update({
          where: { id: next.intakeId },
          data: {
            status: 'QUESTIONNAIRE' as any,
            events: { create: { type: 'QUESTIONNAIRE_GENERATED', payload: { model: gen.model } } },
          },
        });
      }
    }

    if (next.type === IntakeJobType.GENERATE_REQUIREMENT_CARD) {
      const existing = await prisma.requirementCard.findUnique({ where: { intakeId: next.intakeId } });
      if (!existing) {
        const gen = await generateRequirementCardFromQuestionnaire({ intakeId: next.intakeId });
        await prisma.requirementCard.create({
          data: {
            intakeId: next.intakeId,
            title: gen.card.title,
            summary: gen.card.summary,
            userStory: gen.card.userStory,
            scope: gen.card.scope as any,
            affectedArea: gen.card.affectedArea as any,
            acceptanceCriteria: gen.card.acceptanceCriteria as any,
            openQuestions: gen.card.openQuestions as any,
            attachments: gen.card.attachments as any,
            markdown: gen.card.markdown,
          },
        });
        await prisma.intake.update({
          where: { id: next.intakeId },
          data: {
            status: 'DRAFT_READY' as any,
            events: { create: { type: 'REQUIREMENT_CARD_GENERATED', payload: { model: gen.model } } },
          },
        });
      }
    }

    if (next.type === IntakeJobType.CREATE_JIRA_ISSUE) {
      const intake = await prisma.intake.findUnique({ where: { id: next.intakeId } });
      if (!intake) throw new Error('Intake not found');

      const existing = await prisma.jiraIssueLink.findUnique({ where: { intakeId: next.intakeId } });
      if (!existing) {
        const marker = `intake:${next.intakeId}`;
        await prisma.jiraIssueLink.create({
          data: {
            intakeId: next.intakeId,
            intakeMarker: marker,
          },
        });

        // Until real Jira auth is wired, keep it explicit.
        await prisma.intake.update({
          where: { id: next.intakeId },
          data: {
            status: 'NEEDS_INFO' as any,
            events: { create: { type: 'JIRA_STUB_CREATED', payload: { marker, note: 'Jira integration not enabled yet' } } },
          },
        });
      }
    }

    await prisma.intakeJob.update({
      where: { id: next.id },
      data: { status: IntakeJobStatus.DONE, finishedAt: new Date(), errorMessage: null },
    });

    await prisma.intakeEvent.create({
      data: { intakeId: next.intakeId, type: 'JOB_DONE', payload: { jobId: next.id, type: next.type } },
    });
  } catch (e: any) {
    const err = e?.message || String(e);
    const attempts = (next.attempts ?? 0) + 1;
    const retryAt = new Date(Date.now() + backoffMs(attempts));

    await prisma.intakeJob.update({
      where: { id: next.id },
      data: {
        status: IntakeJobStatus.PENDING,
        attempts,
        errorMessage: err,
        runAfter: retryAt,
        lockedAt: null,
        startedAt: next.startedAt ?? new Date(),
      },
    });

    await prisma.intake.update({
      where: { id: next.intakeId },
      data: {
        status: 'ERROR' as any,
        errorMessage: err,
        events: { create: { type: 'JOB_FAILED', payload: { jobId: next.id, type: next.type, err, attempts, retryAt } } },
      },
    });
  }

  return true;
}

async function processNextTaskLegacy() {
  const next = await prisma.task.findFirst({
    where: { status: TaskStatus.PENDING },
    orderBy: { createdAt: 'asc' },
  });

  if (!next) return false;

  const locked = await prisma.task.updateMany({
    where: { id: next.id, status: TaskStatus.PENDING },
    data: { status: TaskStatus.RUNNING, startedAt: new Date() },
  });

  if (locked.count === 0) return true;

  try {
    const llm = await runRolePrompt(next.role, next.prompt);

    const done = await prisma.task.update({
      where: { id: next.id },
      data: {
        status: TaskStatus.DONE,
        resultText: llm.text,
        model: llm.model,
        promptTokens: llm.promptTokens,
        completionTokens: llm.completionTokens,
        totalTokens: llm.totalTokens,
        finishedAt: new Date(),
      },
    });

    if (done.callbackUrl) {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), config.callbackTimeoutMs);
      try {
        await fetch(done.callbackUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            taskId: done.id,
            status: done.status,
            role: done.role,
            model: done.model,
            result: done.resultText,
            usage: {
              promptTokens: done.promptTokens,
              completionTokens: done.completionTokens,
              totalTokens: done.totalTokens,
            },
            startedAt: done.startedAt,
            finishedAt: done.finishedAt,
          }),
          signal: controller.signal,
        });
      } catch (e) {
        console.error('[worker] callback failed', done.id, e);
      } finally {
        clearTimeout(t);
      }
    }
  } catch (e: any) {
    await prisma.task.update({
      where: { id: next.id },
      data: {
        status: TaskStatus.FAILED,
        errorMessage: e?.message || String(e),
        finishedAt: new Date(),
      },
    });
  }

  return true;
}

async function run() {
  console.log('[worker] started');
  while (true) {
    try {
      const hadStageWork = await processNextStageRun();
      if (hadStageWork) continue;

      const hadIntakeJob = await processNextIntakeJob();
      if (hadIntakeJob) continue;

      const hadLegacy = await processNextTaskLegacy();
      if (!hadLegacy) await sleep(config.workerPollMs);
    } catch (e) {
      console.error('[worker] loop error', e);
      await sleep(config.workerPollMs);
    }
  }
}

run();
