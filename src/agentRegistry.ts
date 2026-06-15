import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

export type AgentDescriptor = {
  id: string; // folder name
  name: string;
  description?: string;
  team?: string;
  teamTitle?: string;
  maturity?: string;
  type?: string;
  outputs?: string[];
  humanReviewRequired?: boolean;
  skillPath: string;
  skillMarkdown: string;
};

type TeamSpec = {
  version: number;
  teams: Record<
    string,
    {
      title: string;
      match: Array<{ prefix: string }>;
    }
  >;
};

type RegistrySpec = {
  version: number;
  registry: Record<
    string,
    {
      type?: string;
      maturity?: string;
      outputs?: string[];
      human_review_required?: boolean;
    }
  >;
};

export function listAgents(params?: { skillsDir?: string; registryPath?: string; teamsPath?: string }): AgentDescriptor[] {
  const skillsDir = params?.skillsDir || path.resolve(process.cwd(), 'skills');
  const registryPath = params?.registryPath || path.resolve(process.cwd(), 'core/skills/SKILL_REGISTRY.yaml');
  const teamsPath = params?.teamsPath || path.resolve(process.cwd(), 'core/skills/TEAMS.v1.yaml');

  const registry = readYamlIfExists<RegistrySpec>(registryPath);
  const teams = readYamlIfExists<TeamSpec>(teamsPath);

  const ids = readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const agents: AgentDescriptor[] = [];

  for (const id of ids) {
    const skillPath = path.join(skillsDir, id, 'SKILL.md');
    if (!existsSync(skillPath)) continue;
    const md = readFileSync(skillPath, 'utf8');
    const fm = parseFrontmatter(md);

    const reg = registry?.registry?.[id];

    const teamKey = pickTeam(id, teams);
    const teamTitle = teamKey ? teams?.teams?.[teamKey]?.title : undefined;

    agents.push({
      id,
      name: String(fm.name || id),
      description: fm.description ? String(fm.description) : undefined,
      team: teamKey || 'unknown',
      teamTitle: teamTitle || teams?.teams?.unknown?.title || 'Uncategorized',
      maturity: reg?.maturity,
      type: reg?.type,
      outputs: reg?.outputs,
      humanReviewRequired: reg?.human_review_required,
      skillPath,
      skillMarkdown: md,
    });
  }

  return agents;
}

function pickTeam(id: string, teams?: TeamSpec): string | undefined {
  const t = teams?.teams;
  if (!t) return undefined;
  for (const [key, spec] of Object.entries(t)) {
    for (const rule of spec.match || []) {
      if (rule?.prefix && id.startsWith(rule.prefix)) return key;
    }
  }
  return 'unknown';
}

function readYamlIfExists<T>(p: string): T | undefined {
  if (!existsSync(p)) return undefined;
  const raw = readFileSync(p, 'utf8');
  return yaml.load(raw) as T;
}

function parseFrontmatter(md: string): Record<string, unknown> {
  // Frontmatter in our skills is:
  // ---
  // name: ...
  // description: ...
  // ---
  if (!md.startsWith('---')) return {};
  const end = md.indexOf('\n---', 3);
  if (end === -1) return {};
  const fmText = md.slice(3, end);
  try {
    const obj = yaml.load(fmText);
    return (obj && typeof obj === 'object') ? (obj as any) : {};
  } catch {
    return {};
  }
}
