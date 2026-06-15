---
name: docgen-writer
description: Generate documentation in Markdown (Git/Confluence) or Writerside XML format. Supports product docs, technical docs, onboarding guides, open-questions files, and Confluence publishing.
---

# docgen-writer

## Mission
Generate complete, accurate documentation files. Primary format: **Markdown** for Git repos and Confluence. Secondary: Writerside XML.

## Supported output formats

### Markdown (default — for Git + Confluence)
- Internal documentation: `product/{module}/README.md`
- External documentation: `product/{module}/external/`
- Business vision: `product/{module}/business-vision/`
- Technical view: `product/{module}/technical-view/`
- Open questions: `product/{module}/OPEN-QUESTIONS.md`

### Writerside XML (legacy)
- Only when explicitly requested
- Full `.topic` file with `<?xml version="1.0" encoding="UTF-8"?>`

## Documentation structure (learned from Shiptify TMS project)

```
product/{module}/
├── README.md                    ← overview, navigation, key terms
├── business-vision/
│   ├── 01_user-types.md         ← roles + matrix
│   └── 02_user-journeys.md      ← flows + happy paths
├── feature-docs/
│   └── {feature}/README.md      ← pages, actions, mutations
├── technical-view/README.md     ← API endpoints, models, code paths
├── external/                    ← client-facing docs (Russian)
│   ├── README.md
│   ├── 01_what-is-X.md
│   ├── 04_how-it-works.md       ← include Mermaid flowchart
│   └── 07_faq.md
└── OPEN-QUESTIONS.md            ← contradictions + gaps + priorities
```

## Hard output rules

- Write ACTUAL full file content — not summaries or descriptions of what you would write
- Russian language for all content (filenames in English)
- Use Mermaid for diagrams (renders natively in GitLab)
- Tables for comparison, roles, API endpoints
- Never invent facts — note uncertainty as `(требует проверки)`
- 400-800 words per file (substantial content)
- `OPEN-QUESTIONS.md` must have: topic heading, question table (# | Question | Source), priority section

## Confluence publishing rules (learned)

- Use `jira` token from .env (NEVER `confluence` token — causes 401)
- When UPDATE (PUT) a page: ALWAYS expand `body.storage` in GET first, then use existing content
  ```javascript
  // WRONG — loses content:
  GET /wiki/rest/api/content/{id}?expand=version
  PUT with body: page.body?.storage?.value || '<p>.</p>'  // EMPTY!
  
  // CORRECT:
  GET /wiki/rest/api/content/{id}?expand=version,body.storage
  PUT with body: page.body.storage.value  // existing content preserved
  ```
- Title conflicts: add module prefix (e.g. "DOCK — FAQ" not just "FAQ")
- Verify space root ID before publishing (parent pages may change)
- Rate limit: 400ms sleep between API calls

## mdToStorage() — fixed table converter (critical)

The table regex MUST use `[ \t]*` (not `\s*`) after each row to avoid consuming blank lines and merging post-table text onto the same `</table>` line (which loses `<p>` wrappers).

```javascript
function processInline(text) {
  let s = esc(text.trim());
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  return s;
}

// Table regex — use [ \t]* (NOT \s*) to preserve blank lines after table
html = html.replace(
  /^\|(.+)\|[ \t]*\n\|[-| :]+\|[ \t]*\n((?:\|.+\|[ \t]*\n?)*)/gm,
  (_, header, rows) => {
    const ths = header.split('|').filter(c => c.trim()).map(c =>
      `<th><p>${processInline(c)}</p></th>`).join('');
    const trs = rows.trim().split('\n').filter(r => r.trim()).map(row => {
      const tds = row.split('|').slice(1, -1).map(c =>
        `<td><p>${processInline(c)}</p></td>`).join('');
      return `<tr>${tds}</tr>`;
    }).join('');
    return `<table><tbody><tr>${ths}</tr>${trs}</tbody></table>\n`; // trailing \n is critical
  }
);
```

For pages without source markdown, fix directly via:
```javascript
body.replace(
  /<\/table>([A-Za-zА-Яа-яёЁ][^\n]*?)(\n|<h[1-6]|<ul|<ol|<hr|<table|<ac:|<blockquote|$)/g,
  (_, text, follow) => `</table>\n<p>${text.trim()}</p>\n${follow}`
)
```

## RTM tracking and checklist-based workflow

Checklist files in `product/tms/shipments/` (`08_checklist-*.md` … `16_checklist-tms-ocr.md`) serve as the source of truth for requirements. Each entry is `REQ-DOMAIN-NNN`.

When writing new docs:
1. Read the relevant checklist file to extract all REQ items for the domain
2. Write documentation that covers each REQ, using the checklist as structure
3. After writing, note coverage in RTM-MASTER.md (row per domain, columns: total/covered/%)
4. Batch publish script pattern: PAGES array with `{ file, title, parentId }`, idempotent (create or update)

## Module documentation status

| Module | Checklist | Confluence parent | Status |
|--------|-----------|-------------------|--------|
| TMS Shipments | 08–16 | 609746945 | ~87% done |
| DOCK | 12_checklist-dock.md | create under 609583105 | in progress |
| Identity | product/identity/README.md | not yet published | planned |
| Chat | product/chat/README.md | not yet published | planned |

## Sources to use for documentation

Priority order:
1. Real code (backend services, models, routes, controllers)
2. Video transcriptions (onboarding videos)
3. Product slides (slides/*.pdf already processed)
4. Test cases (Qase export JSON)
5. Old Confluence pages
6. Existing documentation files

## Creativity budget
Low (2/10). Accuracy over prose. Flag unknowns explicitly.
