# Repo Map

## Main app

- `src/app.ts`: Fastify server and API registration
- `src/public/index.html`: single-page UI with tabs
- `src/db.ts`: Prisma bootstrapping
- `prisma/schema.prisma`: database schema

## Existing related modules

- `src/intake.ts`: voice/text intake endpoints
- `src/requirementIntake.ts`: questionnaire and requirement card generation
- `src/llm.ts`: role-based LLM execution

## Main content roots for the knowledge assistant

- `workspaces/documentation`: primary documentation workspace
- `docs`: curated repo documentation
- `product`: extra product-specific markdown

## New knowledge assistant area

- `src/knowledge.ts`: knowledge search, answer composition, query logging, analytics
- `docs/knowledge-assistant/*`: feature documents and working notes

## Expected operational commands

- `npm run build`
- `npx prisma generate`
- `npm run db:push`

`db:push` is required after schema changes if the target database has not yet been updated.
