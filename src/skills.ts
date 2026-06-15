import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

export function loadSkillMarkdown(roleOrSkill: string): { id: string; markdown: string } {
  // Expect copied skills/ folder at repo root.
  const candidates = [
    path.resolve(process.cwd(), 'skills', roleOrSkill, 'SKILL.md'),
    // Sometimes pipelines refer to roles like 00-manager but UI may pass "manager"; allow basic aliasing.
    path.resolve(process.cwd(), 'skills', normalizeRole(roleOrSkill), 'SKILL.md'),
  ];

  for (const p of candidates) {
    if (existsSync(p)) {
      return { id: roleOrSkill, markdown: readFileSync(p, 'utf8') };
    }
  }

  return { id: roleOrSkill, markdown: `---\nname: ${roleOrSkill}\ndescription: (missing SKILL.md)\n---\n\nNo SKILL.md found for ${roleOrSkill}.` };
}

function normalizeRole(s: string): string {
  const v = s.trim();
  if (v.toLowerCase() === 'manager') return '00-manager';
  if (v.toLowerCase() === 'analyst') return '01-analyst';
  if (v.toLowerCase() === 'qa_architect' || v.toLowerCase() === 'qa-architect') return '02-qa-architect';
  if (v.toLowerCase() === 'critic') return '06-critic';
  return v;
}
