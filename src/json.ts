// Minimal JSON extraction/repair helpers for LLM outputs.
// Not perfect, but handles the most common failure modes (markdown fences, leading text).

export function extractFirstJsonObject(text: string): string {
  const s = String(text || '');

  // Strip markdown fences if present
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1] : s;

  const start = candidate.indexOf('{');
  if (start < 0) throw new Error('No JSON object start found');

  // Basic brace matching
  let depth = 0;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;

    if (depth === 0) {
      return candidate.slice(start, i + 1);
    }
  }

  throw new Error('Unbalanced braces while extracting JSON');
}

export function safeJsonParse<T = any>(text: string): T {
  const raw = extractFirstJsonObject(text);
  return JSON.parse(raw) as T;
}
