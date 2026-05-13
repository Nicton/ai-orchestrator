const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const selEl = document.getElementById('sel');
const pollMsEl = document.getElementById('pollMs');

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
function eventToState(ev){
  if (!ev) return 'idle';
  if (ev.type === 'tool.start') {
    const tool = ev.call?.tool || '';
    if (tool.includes('read') || tool.includes('load')) return 'read';
    return 'type';
  }
  if (ev.type === 'stage.status') {
    if (ev.status === 'running') return 'walk';
    if (ev.status === 'failed') return 'wait';
    if (ev.status === 'completed') return 'idle';
  }
  if (ev.type === 'stage.result') return 'idle';
  if (ev.type === 'log' && ev.level === 'error') return 'wait';
  return 'idle';
}

let latestByAgent = new Map();
let agents = []; // computed list
let selectedAgentId = null;

function recomputeAgents(){
  const ids = Array.from(latestByAgent.keys()).sort();
  // fallback: show at least 6 known ids (handy when no events)
  const base = ids.length ? ids : ['00-manager','00-engineer','00-reviewer','00-researcher','00-designer','00-writer'];

  const cols = 6;
  const spacing = 140;
  const startX = 120;
  const startY = 120;

  agents = base.map((id, i) => {
    const h = hashStr(id);
    const sprite = spriteImgs[h % spriteImgs.length];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * spacing;
    const y = startY + row * spacing;
    const last = latestByAgent.get(id);
    const state = eventToState(last);
    return { id, x, y, sprite, last, state };
  });
}

function drawOffice(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // background grid
  ctx.save();
  ctx.globalAlpha = 0.20;
  ctx.strokeStyle = '#23305f';
  for (let x=0;x<=canvas.width;x+=40){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
  for (let y=0;y<=canvas.height;y+=40){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }
  ctx.restore();

  // simple desks
  for (const a of agents){
    ctx.fillStyle = '#141b34';
    ctx.strokeStyle = '#273467';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(a.x-34, a.y+22, 68, 26, 8);
    ctx.fill();
    ctx.stroke();
  }

  // agents
  for (const a of agents){
    const frameW = 32;
    const frameH = 48;
    // sprite sheet is 4x4-ish in Pixel Agents; we just sample a standing frame.
    const sx = 0, sy = 0;

    const t = Date.now();
    const bob = (a.state === 'walk' || a.state === 'type') ? Math.sin(t/120) * 2 : 0;

    // highlight
    if (a.id === selectedAgentId){
      ctx.save();
      ctx.strokeStyle = '#5f7cff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(a.x-26, a.y-54, 52, 62, 12);
      ctx.stroke();
      ctx.restore();
    }

    ctx.drawImage(a.sprite, sx, sy, frameW, frameH, a.x-16, a.y-48 + bob, frameW, frameH);

    // name
    ctx.fillStyle = '#eaf0ff';
    ctx.font = '12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(a.id, a.x, a.y + 64);

    // state bubble
    if (a.state !== 'idle'){
      ctx.fillStyle = '#0b1020';
      ctx.strokeStyle = '#314275';
      ctx.beginPath();
      ctx.roundRect(a.x-26, a.y-78, 52, 18, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#9fb0e6';
      ctx.font = '11px Inter, system-ui, Arial';
      ctx.fillText(a.state, a.x, a.y-65);
    }
  }
}

function hitTest(x,y){
  // check within sprite bounds
  for (const a of agents){
    if (x >= a.x-18 && x <= a.x+18 && y >= a.y-52 && y <= a.y+8) return a;
  }
  return null;
}

canvas.addEventListener('click', (e) => {
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) * (canvas.width / r.width);
  const y = (e.clientY - r.top) * (canvas.height / r.height);
  const a = hitTest(x,y);
  if (!a) return;
  selectedAgentId = a.id;
  selEl.textContent = JSON.stringify({ id: a.id, state: a.state, lastEvent: a.last }, null, 2);
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
loop();

let pollTimer = null;
function schedulePoll(){
  if (pollTimer) clearInterval(pollTimer);
  const ms = clamp(Number(pollMsEl.value || 1000), 250, 10000);
  pollTimer = setInterval(refresh, ms);
}

pollMsEl.addEventListener('change', schedulePoll);
schedulePoll();
