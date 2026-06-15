import { loadPipelineSpec, stageRoleOrSkill } from './pipeline.js';
import { prisma } from './db.js';

export type DocgenCreateRequest = {
  title?: string;
  filePath: string;
  mode: 'create' | 'update';
  comment?: string;
  links?: string[];
  createdBy?: string;
  externalRef?: string;
};

export async function createDocgenRun(req: DocgenCreateRequest) {
  const pipelinePath = 'core/orchestration/docgen.pipeline.v1.yaml';
  const spec = loadPipelineSpec(pipelinePath);

  const links = (req.links || []).filter(Boolean);
  const inputText = JSON.stringify(
    {
      kind: 'docgen_request',
      filePath: req.filePath,
      mode: req.mode,
      comment: req.comment || '',
      links,
      createdBy: req.createdBy || '',
      externalRef: req.externalRef || '',
      // Writerside expectations
      output: {
        format: 'writerside.topic.xml',
        requirements: {
          mustStartWithXmlDeclaration: true,
          mustIncludeTopicRoot: true,
          includeAiOwnedMarkerWhenCreate: true,
        },
      },
    },
    null,
    2,
  );

  const run = await prisma.pipelineRun.create({
    data: {
      title: req.title || `docgen:${req.filePath}`,
      pipelineId: spec.name,
      inputText,
      externalRef: req.externalRef,
      createdBy: req.createdBy,
      status: 'PENDING',
      stages: {
        create: spec.stages.map((s) => ({
          stageId: s.id,
          stageName: s.id,
          roleOrSkill: stageRoleOrSkill(s),
          dependsOn: s.depends_on || [],
          status: 'PENDING',
        })),
      },
    },
    include: { stages: true },
  });

  return run;
}

export async function getDocgenTaskView(runId: string) {
  const run = await prisma.pipelineRun.findUnique({
    where: { id: runId },
    include: { stages: true },
  });
  if (!run) return null;

  // emulate legacy Task shape: {id,status,resultText}
  const status = run.status;
  let resultText: string | null = null;

  if (status === 'DONE') {
    // Prefer stage docgen_writer output
    const writerStage = run.stages.find((s: any) => s.stageId === 'docgen_writer');
    if (writerStage?.resultText) {
      try {
        const parsed = JSON.parse(writerStage.resultText);
        const xml = parsed?.artifacts?.find?.((a: any) => a.kind === 'writerside_topic_xml')?.text;
        if (typeof xml === 'string') resultText = xml;
      } catch {
        // ignore
      }
    }

    // fallback: store run.resultText if used
    if (!resultText && run.resultText) resultText = run.resultText;
  }

  return {
    id: run.id,
    status,
    resultText,
    pipelineId: run.pipelineId,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  };
}
