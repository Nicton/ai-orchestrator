/**
 * One-off: delete an AppUser by email. Email from env DEL_EMAIL.
 * Sessions & ideas cascade; queries/feedback/corrections are SetNull (preserved, anonymized).
 *   docker exec -e NODE_PATH=/app/node_modules -e DEL_EMAIL=... -w /app <app> node /workspace/scripts/delete-user.cjs
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const email = String(process.env.DEL_EMAIL || '').toLowerCase().trim();

(async () => {
  if (!email) { console.log('ERR no DEL_EMAIL'); process.exit(1); }
  const user = await p.appUser.findUnique({ where: { email } });
  if (!user) { console.log('NOT_FOUND', email); await p.$disconnect(); return; }

  const [sessions, queries, ideas, feedbacks, corrections] = await Promise.all([
    p.appSession.count({ where: { userId: user.id } }),
    p.knowledgeQuery.count({ where: { userId: user.id } }),
    p.idea.count({ where: { userId: user.id } }),
    p.knowledgeFeedback.count({ where: { userId: user.id } }),
    p.knowledgeCorrection.count({ where: { userId: user.id } }),
  ]);
  console.log(`FOUND id=${user.id} role=${user.role} active=${user.isActive}`);
  console.log(`LINKED sessions=${sessions} ideas=${ideas} queries=${queries} feedbacks=${feedbacks} corrections=${corrections}`);

  await p.appUser.delete({ where: { id: user.id } });
  const still = await p.appUser.findUnique({ where: { email } });
  console.log(still ? 'DELETE_FAILED still present' : 'DELETED ' + email);
  await p.$disconnect();
})().catch(async (e) => { console.log('ERR', e.message); try { await p.$disconnect(); } catch {} process.exit(1); });
