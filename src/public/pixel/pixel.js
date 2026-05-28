const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const selEl = document.getElementById('sel');
const selCardEl = document.getElementById('selCard');
const pollMsEl = document.getElementById('pollMs');
const verEl = document.getElementById('ver');

async function loadVersion(){
  try {
    const res = await fetch('/api/version');
    const v = await res.json();
    if (verEl) verEl.textContent = `ver: ${v.version} (${String(v.gitSha||'').slice(0,7)})`;
  } catch {
    if (verEl) verEl.textContent = 'ver: n/a';
  }
}
loadVersion();

const SPRITES = [
  './characters/char_0.png',
  './characters/char_1.png',
  './characters/char_2.png',
  './characters/char_3.png',
  './characters/char_4.png',
  './characters/char_5.png',
];

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function hashStr(s){
  let h = 2166136261;
  for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h>>>0);
}

async function loadImage(url){
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

const spriteImgs = await Promise.all(SPRITES.map(loadImage));

// Very small state machine.
// We keep it intentionally simple but more accurate than “read vs type”.
function toolTypeFromEvent(ev){
  const t = String(ev?.call?.tool || '').toLowerCase();
  if (!t) return null;

  // heuristics: we encode “what the agent is doing” rather than exact tool name
  if (t.includes('browser') || t.includes('playwright') || t.includes('navigate') || t.includes('click')) return 'browser';
  if (t.includes('exec') || t.includes('command') || t.includes('shell')) return 'command';
  if (t.includes('write') || t.includes('edit') || t.includes('patch') || t.includes('apply')) return 'write';
  if (t.includes('read') || t.includes('load') || t.includes('fetch') || t.includes('get') || t.includes('search')) return 'read';
  if (t.includes('llm') || t.includes('prompt') || t.includes('chat') || t.includes('generate')) return 'llm';
  return 'tool';
}

function eventToState(ev){
  if (!ev) return 'idle';

  if (ev.type === 'tool.start') {
    const kind = toolTypeFromEvent(ev);
    if (kind === 'read') return 'read';
    if (kind === 'write') return 'write';
    if (kind === 'command') return 'run';
    if (kind === 'browser') return 'browse';
    if (kind === 'llm') return 'think';
    return 'type';
  }

  if (ev.type === 'stage.status') {
    if (ev.status === 'waiting') return 'wait';
    if (ev.status === 'running') return 'walk';
    if (ev.status === 'failed') return 'failed';
    if (ev.status === 'completed') return 'idle';
  }

  if (ev.type === 'run.status') {
    if (ev.status === 'waiting') return 'wait';
    if (ev.status === 'failed') return 'failed';
    if (ev.status === 'running') return 'walk';
  }

  if (ev.type === 'stage.result') return 'idle';
  if (ev.type === 'log' && ev.level === 'error') return 'failed';
  return 'idle';
}

let latestByAgent = new Map();
let agents = []; // computed list
let selectedAgentId = null;

function recomputeAgents(){
  const ids = Array.from(latestByAgent.keys()).sort();
  // fallback: show at least 6 known ids (handy when no events)
  const base = ids.length ? ids : ['00-manager','00-engineer','00-reviewer','00-researcher','00-designer','00-writer'];

  // Fixed “office” seating (readable at a glance).
  // If we have more agents than seats, we’ll spill to extra rows.
  const seats = [
    // Left pod
    {x:140,y:150, team:'A'}, {x:260,y:150, team:'A'},
    {x:140,y:280, team:'A'}, {x:260,y:280, team:'A'},

    // Center pod
    {x:520,y:150, team:'B'}, {x:640,y:150, team:'B'},
    {x:520,y:280, team:'B'}, {x:640,y:280, team:'B'},

    // Right pod
    {x:900,y:150, team:'C'}, {x:1020,y:150, team:'C'},
    {x:900,y:280, team:'C'}, {x:1020,y:280, team:'C'},
  ];

  agents = base.map((id, i) => {
    const h = hashStr(id);
    const sprite = spriteImgs[h % spriteImgs.length];

    const seat = seats[i] || { x: 140 + (i % 6) * 140, y: 430 + Math.floor(i / 6) * 150, team: 'X' };

    const last = latestByAgent.get(id);
    const state = eventToState(last);
    return { id, x: seat.x, y: seat.y, team: seat.team, sprite, last, state };
  });
}

function shortToolLabel(ev){
  const t = String(ev?.call?.tool || '').trim();
  if (!t) return '';
  return t.replace(/^llm\./,'');
}

function iconForState(state){
  // ASCII-safe icons (render everywhere)
  if (state === 'read') return 'R';
  if (state === 'write') return 'W';
  if (state === 'run') return '>'; // command
  if (state === 'browse') return 'B';
  if (state === 'think') return 'L';
  if (state === 'wait') return '…';
  if (state === 'failed') return '!';
  return '';
}

function doingText(ev){
  if (!ev) return '';
  if (ev.type === 'tool.start') {
    const label = shortToolLabel(ev);
    return label ? `tool: ${label}` : 'tool…';
  }
  if (ev.type === 'stage.status') {
    if (ev.status === 'waiting') return 'waiting';
    if (ev.status === 'running') return 'running';
    if (ev.status === 'failed') return 'failed';
    if (ev.status === 'completed') return 'done';
    const msg = String(ev.message || '').trim();
    if (msg) return msg;
    return `stage ${ev.status}`;
  }
  if (ev.type === 'run.status') {
    return `run ${ev.status}`;
  }
  if (ev.type === 'stage.result') {
    return String(ev.result?.summary || 'result').trim();
  }
  return String(ev.type || '').trim();
}

function stateColor(state){
  if (state === 'read') return '#7ee3ff';
  if (state === 'write') return '#ffd27a';
  if (state === 'run') return '#b3ff8a';
  if (state === 'browse') return '#8affc6';
  if (state === 'think') return '#c9b3ff';
  if (state === 'walk') return '#b3ff8a';
  if (state === 'wait') return '#ffb86b';
  if (state === 'failed') return '#ff4d6d';
  return '#9fb0e6';
}

function drawOffice(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // soft background
  ctx.fillStyle = '#0b1020';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // ensure pixel-crisp scaling
  ctx.imageSmoothingEnabled = false;

  // walls / zones (simple, but reads like “office”)
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#0e1630';
  ctx.strokeStyle = '#223060';
  ctx.lineWidth = 3;

  const zones = [
    {x:60,y:70,w:320,h:290,label:'Team A'},
    {x:420,y:70,w:320,h:290,label:'Team B'},
    {x:780,y:70,w:360,h:290,label:'Team C'},
  ];

  for (const z of zones){
    ctx.beginPath();
    ctx.roundRect(z.x,z.y,z.w,z.h,18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#9fb0e6';
    ctx.font = '14px Inter, system-ui, Arial';
    ctx.textAlign = 'left';
    ctx.fillText(z.label, z.x+14, z.y+24);
    ctx.fillStyle = '#0e1630';
  }
  ctx.restore();

  // desks + tiny monitors
  for (const a of agents){
    ctx.fillStyle = '#141b34';
    ctx.strokeStyle = '#273467';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(a.x-44, a.y+18, 88, 30, 10);
    ctx.fill();
    ctx.stroke();

    // monitor
    ctx.fillStyle = '#0b1020';
    ctx.strokeStyle = '#314275';
    ctx.beginPath();
    ctx.roundRect(a.x-16, a.y+6, 32, 16, 6);
    ctx.fill();
    ctx.stroke();
  }

  // agents + overlays
  const SCALE = 4; // make characters larger + keep integer scaling for crisp pixels
  for (const a of agents){
    // Sprite sheets here are 112x96 = 7x4 frames of 16x24.
    const frameW = 16;
    const frameH = 24;
    // TODO: pick animation frame by state; for now use a decent standing frame (col=0,row=0).
    const sx = 0, sy = 0;

    const t = Date.now();
    const bob = (a.state === 'walk' || a.state === 'type') ? Math.sin(t/120) * 2 : 0;

    // highlight
    if (a.id === selectedAgentId){
      ctx.save();
      ctx.strokeStyle = '#5f7cff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(a.x-30, a.y-92, 60, 102, 14);
      ctx.stroke();
      ctx.restore();
    }

    // sprite with simple “halo” so it reads on dark bg
    const dw = frameW * SCALE;
    const dh = frameH * SCALE;
    const dx = a.x - dw/2;
    const dy = a.y - dh + bob;

    // halo box (cheap, but makes it pop)
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(dx-6, dy-6, dw+12, dh+12, 14);
    ctx.fill();
    ctx.restore();

    ctx.drawImage(a.sprite, sx, sy, frameW, frameH, dx, dy, dw, dh);

    // big status badge (name + doing)
    const doing = doingText(a.last);
    const badgeW = 160;
    const badgeH = doing ? 44 : 26;
    const bx = a.x - badgeW/2;
    const by = a.y - 104;

    ctx.fillStyle = '#0b1020';
    ctx.strokeStyle = '#314275';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, badgeW, badgeH, 12);
    ctx.fill();
    ctx.stroke();

    // state badge (color dot + 1-char icon)
    const stColor = stateColor(a.state);
    ctx.fillStyle = stColor;
    ctx.beginPath();
    ctx.arc(bx + 12, by + 13, 6, 0, Math.PI*2);
    ctx.fill();

    const ic = iconForState(a.state);
    if (ic){
      ctx.fillStyle = '#0b1020';
      ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ic, bx + 12, by + 16);
    }

    // name
    ctx.fillStyle = '#eaf0ff';
    ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(a.id, bx + 26, by + 17);

    if (doing){
      ctx.fillStyle = '#9fb0e6';
      ctx.font = '12px Inter, system-ui, Arial';
      // truncate to fit
      const maxChars = 34;
      const s = doing.length > maxChars ? doing.slice(0, maxChars-1) + '…' : doing;
      ctx.fillText(s, bx + 12, by + 36);
    }
  }
}

function hitTest(x,y){
  // check within sprite bounds (scaled)
  const SCALE = 4;
  const frameW = 16;
  const frameH = 24;
  const dw = frameW * SCALE;
  const dh = frameH * SCALE;

  for (const a of agents){
    const dx = a.x - dw/2;
    const dy = a.y - dh;
    if (x >= dx && x <= dx + dw && y >= dy && y <= dy + dh) return a;
  }
  return null;
}

function escapeHtml(s){
  return String(s ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

function agentDeepLink(runId, stageRunId){
  const u = new URL(window.location.origin + '/');
  if (runId) u.searchParams.set('openRun', runId);
  if (stageRunId) u.searchParams.set('openStage', stageRunId);
  return u.toString();
}

async function fetchAgentActivity(){
  const res = await fetch('/api/agents/activity');
  if (!res.ok) throw new Error('agents/activity fetch failed: ' + res.status);
  return await res.json();
}

async function renderSelected(agent){
  if (!agent){
    selCardEl.innerHTML = `<div class="muted">(click an agent)</div>`;
    return;
  }

  // Always show the last event summary fast; enrich with active tasks if possible.
  const last = agent.last;
  const doing = doingText(last);

  let activeTasks = [];
  try {
    const data = await fetchAgentActivity();
    const row = (data.agents || []).find(a => a.id === agent.id);
    activeTasks = row?.active || [];
  } catch (e) {
    // non-fatal
    console.warn('Failed to load agent activity', e);
  }

  const activeHtml = activeTasks.length ? activeTasks.map(t => {
    const runId = String(t.runId || '');
    const stageRunId = String(t.stageId || '');
    const title = String(t.runTitle || '').trim();
    return `
      <div style="margin-top:10px; border-top:1px solid #273467; padding-top:10px;">
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          <span class="pill" style="border-color:#314275; background:#141b34;">${escapeHtml(t.status || '-')}</span>
          <code style="color:#9fb0e6;">run ${escapeHtml(runId.slice(0,8))}</code>
          <code style="color:#9fb0e6;">stage ${escapeHtml(stageRunId)}</code>
        </div>
        ${title ? `<div class="muted" style="margin-top:6px;">${escapeHtml(title)}</div>` : ''}
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:8px; align-items:center;">
          <a href="${escapeHtml(agentDeepLink(runId))}" target="_blank">Open run</a>
          <a href="${escapeHtml(agentDeepLink(runId, stageRunId))}" target="_blank">Open stage</a>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">
          <button data-action="retry-stage" data-stage="${escapeHtml(stageRunId)}" style="background:#23305f;">Retry stage</button>
          <button data-action="skip-stage" data-stage="${escapeHtml(stageRunId)}" style="background:#23305f;">Skip stage</button>
        </div>
      </div>
    `;
  }).join('') : `<div class="muted" style="margin-top:8px;">No active StageRuns for this agent.</div>`;

  selCardEl.innerHTML = `
    <div style="font-weight:900;">${escapeHtml(agent.id)}</div>
    <div class="muted" style="margin-top:6px;">state: <b>${escapeHtml(agent.state)}</b>${doing ? ` • ${escapeHtml(doing)}` : ''}</div>
    <div class="muted" style="margin-top:10px;">Actions</div>
    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:6px; align-items:center;">
      <a href="/" target="_blank">Open dashboard</a>
      ${activeTasks[0]?.runId ? `<a href="${escapeHtml(agentDeepLink(activeTasks[0].runId))}" target="_blank">Open latest run</a>` : ''}
    </div>
    <div class="muted" style="margin-top:12px;">Active tasks</div>
    ${activeHtml}
  `;

  // Wire up quick actions (no architecture coupling; just calls existing API endpoints)
  selCardEl.querySelectorAll('button[data-action="retry-stage"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const stageRunId = btn.getAttribute('data-stage');
      if (!stageRunId) return;
      btn.disabled = true;
      try {
        const res = await fetch('/api/stages/' + encodeURIComponent(stageRunId) + '/retry', { method: 'POST' });
        if (!res.ok) throw new Error(await res.text());
        await refresh();
      } catch (e) {
        alert('Retry failed: ' + (e?.message || String(e)));
      } finally {
        btn.disabled = false;
      }
    });
  });

  selCardEl.querySelectorAll('button[data-action="skip-stage"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const stageRunId = btn.getAttribute('data-stage');
      if (!stageRunId) return;
      btn.disabled = true;
      try {
        const res = await fetch('/api/stages/' + encodeURIComponent(stageRunId) + '/skip', { method: 'POST' });
        if (!res.ok) throw new Error(await res.text());
        await refresh();
      } catch (e) {
        alert('Skip failed: ' + (e?.message || String(e)));
      } finally {
        btn.disabled = false;
      }
    });
  });

  // Keep raw JSON available for debugging (but hidden)
  selEl.textContent = JSON.stringify({ id: agent.id, state: agent.state, lastEvent: agent.last, activeTasks }, null, 2);
}

canvas.addEventListener('click', async (e) => {
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) * (canvas.width / r.width);
  const y = (e.clientY - r.top) * (canvas.height / r.height);
  const a = hitTest(x,y);
  if (!a) return;
  selectedAgentId = a.id;
  await renderSelected(a);
});

async function fetchEvents(limit=500){
  const res = await fetch('/api/events?limit=' + encodeURIComponent(String(limit)));
  if (!res.ok) throw new Error('events fetch failed: ' + res.status);
  return await res.json();
}

async function refresh(){
  try {
    statusEl.textContent = 'syncing…';
    const data = await fetchEvents(1000);
    const evs = data.events || [];

    // latest per agent (actor.id)
    const by = new Map();
    for (const ev of evs){
      const id = ev?.actor?.id;
      if (!id) continue;
      const prev = by.get(id);
      if (!prev || String(ev.ts) > String(prev.ts)) by.set(id, ev);
    }
    latestByAgent = by;
    recomputeAgents();
    // refresh selected card with enriched info
    if (selectedAgentId) {
      const a = agents.find(x => x.id === selectedAgentId);
      if (a) await renderSelected(a);
    }
    statusEl.textContent = `ok • agents ${agents.length}`;
  } catch (e){
    statusEl.textContent = 'error';
    console.error(e);
  }
}

document.getElementById('btnRefresh').addEventListener('click', refresh);

function loop(){
  drawOffice();
  requestAnimationFrame(loop);
}

await refresh();
recomputeAgents();
await renderSelected(agents.find(a => a.id === selectedAgentId) || null);
loop();

let pollTimer = null;
function schedulePoll(){
  if (pollTimer) clearInterval(pollTimer);
  const ms = clamp(Number(pollMsEl.value || 1000), 250, 10000);
  pollTimer = setInterval(refresh, ms);
}

pollMsEl.addEventListener('change', schedulePoll);
schedulePoll();
