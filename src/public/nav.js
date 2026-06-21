/* Searchify — the single shared header for every page + theme switcher.
   Each page includes <div id="app-nav"></div> and <script src="/nav.js"></script>.
   Theme choice persists in localStorage('searchify_theme'): light | dark | (absent = follow OS). */
(function () {
  var items = [
    ['/', '🔎 Поиск'], ['/graph', '🕸 Граф'], ['/quality', '📊 Качество'],
    ['/ideas', '💡 Идеи'], ['/bugs', '🐞 БАГи'], ['/pre-planning', '🧭 Pre-planning'],
  ];
  function applyTheme(t) {
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  }
  function stored() { try { return localStorage.getItem('searchify_theme'); } catch (e) { return null; } }
  function effectiveDark() {
    var t = stored();
    if (t) return t === 'dark';
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function setTheme(t) { try { localStorage.setItem('searchify_theme', t); } catch (e) {} applyTheme(t); updateIcon(); }
  function updateIcon() {
    var b = document.getElementById('themeToggle'); if (!b) return;
    var d = effectiveDark(); b.textContent = d ? '☀' : '🌙'; b.title = d ? 'Светлая тема' : 'Тёмная тема';
  }
  applyTheme(stored()); // safety net (also set inline in <head> to avoid flash)

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]); }); }

  function render(me) {
    var mount = document.getElementById('app-nav'); if (!mount) return;
    var here = location.pathname.replace(/\/$/, '') || '/';
    var authed = !!me;
    var links = authed ? items.map(function (it) {
      var active = (here === it[0] || (it[0] !== '/' && here.indexOf(it[0]) === 0)) ? ' active' : '';
      return '<a class="navlink' + active + '" href="' + it[0] + '">' + it[1] + '</a>';
    }).join('') : '';
    var admin = (authed && me.role === 'admin') ? '<a class="navlink' + (here === '/admin' ? ' active' : '') + '" href="/admin">⚙️ Админ</a>' : '';
    var right = authed ? '<span class="who">' + esc(me.name || me.email || '') + '</span><button class="navlink" id="navLogout">Выйти</button>' : '';
    mount.className = 'app-nav';
    mount.innerHTML =
      '<a class="brand" href="/">Searchify</a>' + links + admin +
      '<span class="spacer"></span>' + right +
      '<button class="theme-toggle" id="themeToggle" aria-label="Toggle theme"></button>';
    updateIcon();
    var tg = document.getElementById('themeToggle');
    if (tg) tg.addEventListener('click', function () { setTheme(effectiveDark() ? 'light' : 'dark'); });
    var lo = document.getElementById('navLogout');
    if (lo) lo.addEventListener('click', async function () { try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) {} location.href = '/'; });
    // keep the toggle icon correct if the OS theme changes while on auto
    if (window.matchMedia) { try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateIcon); } catch (e) {} }
  }

  function init() {
    fetch('/api/auth/me').then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { render(d && d.user); })
      .catch(function () { render(null); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
