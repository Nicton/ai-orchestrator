import { readFileSync } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

export type PipelineSpec = {
  version: number;
  name: string;
  mode?: string;
  stages: Array<{
    id: string;
    role?: string;
    skill?: string;
    depends_on?: string[];
    outputs?: string[];
    optional?: boolean;
    gates?: string[];
  }>;
  future_parallel_lanes?: any;
  notes?: string[];
};

export function loadPipelineSpec(pipelinePath: string): PipelineSpec {
  const abs = path.isAbsolute(pipelinePath) ? pipelinePath : path.resolve(process.cwd(), pipelinePath);
  const raw = readFileSync(abs, 'utf8');
  const doc = yaml.load(raw);
  if (!doc || typeof doc !== 'object') throw new Error(`Invalid pipeline YAML: ${pipelinePath}`);
  const spec = doc as PipelineSpec;
  if (!spec.stages?.length) throw new Error(`Pipeline has no stages: ${pipelinePath}`);
  return spec;
}

export function stageRoleOrSkill(s: PipelineSpec['stages'][number]): string {
  return s.skill || s.role || 'UNKNOWN';
}

export function pipelineToMermaid(
  spec: PipelineSpec,
  opts?: {
    stageStatus?: Record<string, string | undefined>;
    stageTokens?: Record<string, number | undefined>;
  },
): string {
  // DAG visualization, optionally annotated with per-stage status.
  const lines: string[] = [];
  lines.push('flowchart TD');

  for (const s of spec.stages) {
    const st = opts?.stageStatus?.[s.id];
    const tok = opts?.stageTokens?.[s.id];
    const extra = [st ? `• ${st}` : null, tok ? `• tok ${tok}` : null].filter(Boolean).join(' ');
    const label = `${s.id}\\n(${stageRoleOrSkill(s)})${extra ? `\\n${extra}` : ''}`;
    lines.push(`  ${safeId(s.id)}["${escape(label)}"]`);
  }

  for (const s of spec.stages) {
    const deps = s.depends_on || [];
    for (const d of deps) {
      lines.push(`  ${safeId(d)} --> ${safeId(s.id)}`);
    }
  }

  // Styles
  lines.push('');
  lines.push('classDef done fill:#0a6a44,stroke:#1ad17f,color:#eaf0ff;');
  lines.push('classDef running fill:#776300,stroke:#ffd75f,color:#eaf0ff;');
  lines.push('classDef pending fill:#545f89,stroke:#9fb0e6,color:#eaf0ff;');
  lines.push('classDef failed fill:#7a2030,stroke:#ff6b81,color:#eaf0ff;');
  lines.push('classDef skipped fill:#4f4f4f,stroke:#b0b0b0,color:#eaf0ff;');

  if (opts?.stageStatus) {
    for (const [id, st] of Object.entries(opts.stageStatus)) {
      if (!st) continue;
      const cls = st.toLowerCase();
      if (['done', 'running', 'pending', 'failed', 'skipped'].includes(cls)) {
        lines.push(`class ${safeId(id)} ${cls};`);
      }
    }
  }

  return lines.join('\n');
}

function safeId(id: string) {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

function escape(s: string) {
  return s.replaceAll('"', "'");
}
