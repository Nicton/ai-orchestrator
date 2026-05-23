import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';
import { prisma } from './db.js';
import { transcribeAudioFile } from './llm.js';
import { generateQuestionnaireFromTranscript, generateRequirementCardFromQuestionnaire } from './requirementIntake.js';

const createIntakeSchema = z.object({
  customerName: z.string().min(1).max(200),
  customerEmail: z.string().email().optional(),
  customerId: z.string().min(1).max(200).optional(),

  inputKind: z.enum(['voice', 'text']).default('text'),
  inputText: z.string().min(1).optional(),

  locale: z.string().min(1).max(50).optional(),
  source: z.string().min(1).max(120).optional(),
});

function safeExtFromMime(mime: string | undefined) {
  if (!mime) return undefined;
  const m = mime.toLowerCase();
  if (m.includes('webm')) return 'webm';
  if (m.includes('wav')) return 'wav';
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3';
  if (m.includes('mp4') || m.includes('m4a')) return 'm4a';
  if (m.includes('ogg')) return 'ogg';
  return undefined;
}

async function saveMultipartFile(opts: {
  intakeId: string;
  audio: MultipartFile;
}): Promise<{ audioPath: string; audioMime?: string }>
{
  const { intakeId, audio } = opts;
  const dataDir = path.resolve(process.cwd(), 'data', 'intakes', intakeId);
  await fs.mkdir(dataDir, { recursive: true });

  const ext = safeExtFromMime(audio.mimetype) || 'bin';
  const dest = path.join(dataDir, `audio.${ext}`);

  const buf = await audio.toBuffer();
  await fs.writeFile(dest, buf);

  // Store relative path under ./data for portability in docker volume mounts.
  const rel = path.relative(process.cwd(), dest);
  return { audioPath: rel, audioMime: audio.mimetype };
}

export async function registerIntakeApi(app: FastifyInstance) {
  // Create intake (JSON)
  app.post('/api/intake', async (req: any, reply) => {
    const parsed = createIntakeSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    if (parsed.data.inputKind === 'text' && !parsed.data.inputText) {
      return reply.code(400).send({ error: 'inputText is required when inputKind=text' });
    }

    const intake = await prisma.intake.create({
      data: {
        customerId: parsed.data.customerId,
        customerName: parsed.data.customerName,
        customerEmail: parsed.data.customerEmail,
        inputKind: parsed.data.inputKind as any,
        inputText: parsed.data.inputText,
        locale: parsed.data.locale,
        source: parsed.data.source,
        status: 'RECEIVED' as any,
        events: {
          create: { type: 'INTAKE_CREATED', payload: { via: 'api', inputKind: parsed.data.inputKind } },
        },
      },
    });

    return reply.code(201).send({ id: intake.id, status: intake.status, createdAt: intake.createdAt });
  });

  // Create intake (multipart) with audio
  // Fields are the same as createIntakeSchema, plus file field name: "audio".
  app.post('/api/intake/upload', async (req: any, reply) => {
    if (!req.isMultipart()) return reply.code(415).send({ error: 'Expected multipart/form-data' });

    const fields: Record<string, any> = {};
    let audio: MultipartFile | undefined;

    for await (const part of req.parts()) {
      if (part.type === 'file') {
        if (part.fieldname === 'audio') audio = part;
        continue;
      }
      fields[part.fieldname] = part.value;
    }

    // Coerce types a bit (multipart gives strings)
    if (typeof fields.inputKind === 'string') fields.inputKind = fields.inputKind;

    const parsed = createIntakeSchema.safeParse(fields);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    if (!audio) return reply.code(400).send({ error: 'audio file is required (field name: audio)' });

    const intake = await prisma.intake.create({
      data: {
        customerId: parsed.data.customerId,
        customerName: parsed.data.customerName,
        customerEmail: parsed.data.customerEmail,
        inputKind: 'voice' as any,
        inputText: parsed.data.inputText,
        locale: parsed.data.locale,
        source: parsed.data.source,
        status: 'RECEIVED' as any,
        events: {
          create: { type: 'INTAKE_CREATED', payload: { via: 'upload', inputKind: 'voice' } },
        },
      },
    });

    const saved = await saveMultipartFile({ intakeId: intake.id, audio });

    await prisma.intake.update({
      where: { id: intake.id },
      data: {
        audioPath: saved.audioPath,
        audioMime: saved.audioMime,
        events: {
          create: { type: 'AUDIO_UPLOADED', payload: { path: saved.audioPath, mime: saved.audioMime } },
        },
      },
    });

    return reply.code(201).send({ id: intake.id, status: 'RECEIVED', audioPath: saved.audioPath });
  });

  // List
  app.get('/api/intake', async (req: any) => {
    const limit = Math.min(Number(req.query?.limit || 50), 200);
    const status = req.query?.status ? String(req.query.status) : undefined;

    const items = await prisma.intake.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        transcript: true,
        questionnaire: true,
        requirementCard: true,
        jiraLink: true,
      },
    });

    return {
      intakes: items.map((i) => ({
        id: i.id,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
        customerName: i.customerName,
        customerEmail: i.customerEmail,
        inputKind: i.inputKind,
        status: i.status,
        audioPath: i.audioPath,
        hasTranscript: Boolean(i.transcript),
        hasQuestionnaire: Boolean(i.questionnaire),
        hasRequirementCard: Boolean(i.requirementCard),
        jiraIssueKey: i.jiraLink?.issueKey,
      })),
    };
  });

  // Get
  app.get('/api/intake/:id', async (req: any, reply) => {
    const intake = await prisma.intake.findUnique({
      where: { id: String(req.params.id) },
      include: {
        transcript: true,
        questionnaire: true,
        requirementCard: true,
        jiraLink: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!intake) return reply.code(404).send({ error: 'Intake not found' });
    return intake;
  });

  // Transcribe audio (synchronous MVP)
  app.post('/api/intake/:id/transcribe', async (req: any, reply) => {
    const id = String(req.params.id);
    const intake = await prisma.intake.findUnique({ where: { id } });
    if (!intake) return reply.code(404).send({ error: 'Intake not found' });

    if (!intake.audioPath) return reply.code(400).send({ error: 'No audioPath on intake. Upload audio first.' });

    // if already exists, return existing
    const existing = await prisma.transcript.findUnique({ where: { intakeId: id } });
    if (existing) return reply.send({ ok: true, transcriptId: existing.id, cached: true });

    const absAudioPath = path.resolve(process.cwd(), intake.audioPath);
    const tr = await transcribeAudioFile(absAudioPath);

    const transcript = await prisma.transcript.create({
      data: {
        intakeId: id,
        text: tr.text,
        language: tr.language,
      },
    });

    await prisma.intake.update({
      where: { id },
      data: {
        status: 'TRANSCRIBED' as any,
        events: {
          create: { type: 'TRANSCRIBED', payload: { model: tr.model, language: tr.language } },
        },
      },
    });

    return reply.send({ ok: true, transcriptId: transcript.id });
  });

  // Generate questionnaire JSON from transcript
  app.post('/api/intake/:id/questionnaire', async (req: any, reply) => {
    const id = String(req.params.id);

    const existing = await prisma.questionnaireAnswerSet.findUnique({ where: { intakeId: id } });
    if (existing) return reply.send({ ok: true, questionnaireId: existing.id, cached: true });

    const gen = await generateQuestionnaireFromTranscript({ intakeId: id });

    const row = await prisma.questionnaireAnswerSet.create({
      data: {
        intakeId: id,
        answers: gen.questionnaire as any,
      },
    });

    await prisma.intake.update({
      where: { id },
      data: {
        status: 'QUESTIONNAIRE' as any,
        events: {
          create: { type: 'QUESTIONNAIRE_GENERATED', payload: { model: gen.model } },
        },
      },
    });

    return reply.send({ ok: true, questionnaireId: row.id });
  });

  // Generate requirement card draft from questionnaire
  app.post('/api/intake/:id/requirement-card', async (req: any, reply) => {
    const id = String(req.params.id);

    const existing = await prisma.requirementCard.findUnique({ where: { intakeId: id } });
    if (existing) return reply.send({ ok: true, requirementCardId: existing.id, cached: true });

    const gen = await generateRequirementCardFromQuestionnaire({ intakeId: id });

    const row = await prisma.requirementCard.create({
      data: {
        intakeId: id,
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
      where: { id },
      data: {
        status: 'DRAFT_READY' as any,
        events: {
          create: { type: 'REQUIREMENT_CARD_GENERATED', payload: { model: gen.model } },
        },
      },
    });

    return reply.send({ ok: true, requirementCardId: row.id });
  });
}
