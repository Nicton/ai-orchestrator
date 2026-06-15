import { prisma } from './db.js';
import { runRolePrompt } from './llm.js';
import { safeJsonParse } from './json.js';

export type Questionnaire = {
  // Free-form, but we keep a predictable top-level shape.
  goal?: string;
  context?: string;
  actors?: string[];
  constraints?: string[];
  inScope?: string[];
  outOfScope?: string[];
  acceptanceCriteria?: string[];
  openQuestions?: string[];
  jira?: {
    projectKey?: string;
    issueType?: string;
    labels?: string[];
  };
  raw?: any;
};

export type RequirementCardDraft = {
  title: string;
  summary: string;
  userStory: string;
  scope: any;
  affectedArea: any;
  acceptanceCriteria: any;
  openQuestions: any;
  attachments: any;
  markdown: string;
};

export async function generateQuestionnaireFromTranscript(opts: { intakeId: string }) {
  const intake = await prisma.intake.findUnique({
    where: { id: opts.intakeId },
    include: { transcript: true },
  });
  if (!intake) throw new Error('Intake not found');
  if (!intake.transcript?.text) throw new Error('Transcript is missing. Transcribe first.');

  const prompt = `You are a product requirements analyst.

Given a transcript of a voice message from a customer, extract a structured questionnaire/brief.

Return STRICT JSON (no markdown, no comments) matching this TypeScript type:

type Questionnaire = {
  goal?: string;
  context?: string;
  actors?: string[];
  constraints?: string[];
  inScope?: string[];
  outOfScope?: string[];
  acceptanceCriteria?: string[];
  openQuestions?: string[];
  jira?: { projectKey?: string; issueType?: string; labels?: string[] };
  raw?: any;
}

Rules:
- Be conservative: if unsure, put it into openQuestions.
- Keep each item short.

Transcript:\n"""\n${intake.transcript.text}\n"""\n`;

  const llm = await runRolePrompt('requirements_intake.questionnaire', prompt);

  let json: Questionnaire;
  try {
    json = safeJsonParse<Questionnaire>(llm.text);
  } catch {
    throw new Error(`LLM did not return valid JSON for questionnaire. model=${llm.model}`);
  }

  return { questionnaire: json, model: llm.model };
}

export async function generateRequirementCardFromQuestionnaire(opts: { intakeId: string }) {
  const intake = await prisma.intake.findUnique({
    where: { id: opts.intakeId },
    include: { transcript: true, questionnaire: true },
  });
  if (!intake) throw new Error('Intake not found');
  if (!intake.questionnaire?.answers) throw new Error('Questionnaire is missing. Generate questionnaire first.');

  const questionnaireJson = intake.questionnaire.answers as any;

  const prompt = `You are a senior product manager.

Using the questionnaire JSON below, produce a RequirementCard draft.
Return STRICT JSON (no markdown) matching:

type RequirementCardDraft = {
  title: string;
  summary: string;
  userStory: string;
  scope: any;
  affectedArea: any;
  acceptanceCriteria: any;
  openQuestions: any;
  attachments: any;
  markdown: string;
}

Rules:
- title: concise.
- summary: 2-5 sentences.
- userStory: classic format.
- markdown: a clean, human-friendly card combining all fields.
- If info is missing, add explicit openQuestions.

Questionnaire JSON:\n${JSON.stringify(questionnaireJson, null, 2)}\n`;

  const llm = await runRolePrompt('requirements_intake.requirement_card', prompt);

  let json: RequirementCardDraft;
  try {
    json = safeJsonParse<RequirementCardDraft>(llm.text);
  } catch {
    throw new Error(`LLM did not return valid JSON for requirement card. model=${llm.model}`);
  }

  return { card: json, model: llm.model };
}
