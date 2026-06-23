/* Searchify — the single shared header for every page + theme switcher + language switcher.
   Each page includes <div id="app-nav"></div> and <script src="/nav.js"></script>.
   Theme persists in localStorage('searchify_theme'): light | dark | (absent = follow OS).
   Language persists in localStorage('searchify_lang'): fr | en | ru (default fr — главный язык общения).
   Pages localize themselves on load by reading window.SearchifyI18N.getLang(); the switcher
   reloads the page so every page re-localizes from the shared key. */
(function () {
  var LANGS = ['fr', 'en', 'ru'];
  var LANG_LABELS = { fr: 'FR', en: 'EN', ru: 'RU' };

  function getLang() {
    try { var l = localStorage.getItem('searchify_lang'); if (LANGS.indexOf(l) >= 0) return l; } catch (e) {}
    return 'fr';
  }
  function setLang(l) {
    if (LANGS.indexOf(l) < 0) return;
    try { localStorage.setItem('searchify_lang', l); } catch (e) {}
    // reload so every page (and its own i18n dict) re-localizes from the shared key
    location.reload();
  }
  // Exposed so any page can read the active language and (optionally) react.
  window.SearchifyI18N = { getLang: getLang, setLang: setLang, langs: LANGS };

  // Nav link labels per language. Each item: [href, emoji, {fr,en,ru}].
  var NAV = [
    ['/', '🔎', { fr: 'Recherche', en: 'Search', ru: 'Поиск' }],
    ['/graph', '🕸', { fr: 'Graphe', en: 'Graph', ru: 'Граф' }],
    ['/quality', '📊', { fr: 'Qualité', en: 'Quality', ru: 'Качество' }],
    ['/ideas', '💡', { fr: 'Idées', en: 'Ideas', ru: 'Идеи' }],
    ['/bugs', '🐞', { fr: 'Bugs', en: 'Bugs', ru: 'БАГи' }],
    ['/tasks', '🆕', { fr: 'Nouvelles tâches', en: 'New tasks', ru: 'Новые задачи' }],
    ['/testing', '🧪', { fr: 'Test de tâches', en: 'Task testing', ru: 'Тестирование задач' }],
    ['/releases', '🚀', { fr: 'Release Notes', en: 'Release Notes', ru: 'Релиз-ноты' }],
    ['/doc-sync', '🔄', { fr: 'Doc Sync', en: 'Doc Sync', ru: 'Doc Sync' }],
    ['/pre-planning', '🧭', { fr: 'Pré-planning', en: 'Pre-planning', ru: 'Pre-planning' }],
  ];
  var T = {
    admin: { fr: 'Admin', en: 'Admin', ru: 'Админ' },
    logout: { fr: 'Déconnexion', en: 'Log out', ru: 'Выйти' },
    langTitle: { fr: 'Langue', en: 'Language', ru: 'Язык' },
    verTitle: { fr: 'Version du build', en: 'Build version', ru: 'Версия сборки' },
    verCommit: { fr: 'commit n°', en: 'commit #', ru: 'коммит №' },
    verLoading: { fr: 'chargement…', en: 'loading…', ru: 'загрузка…' },
  };
  function tr(dict) { return dict[getLang()] || dict.en || dict.fr; }

  function applyTheme(t) {
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  }
  function storedTheme() { try { return localStorage.getItem('searchify_theme'); } catch (e) { return null; } }
  function effectiveDark() {
    var t = storedTheme();
    if (t) return t === 'dark';
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function setTheme(t) { try { localStorage.setItem('searchify_theme', t); } catch (e) {} applyTheme(t); updateIcon(); }
  function updateIcon() {
    var b = document.getElementById('themeToggle'); if (!b) return;
    var d = effectiveDark(); b.textContent = d ? '☀' : '🌙'; b.title = d ? 'Light theme' : 'Dark theme';
  }
  applyTheme(storedTheme());

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]); }); }

  // --- Build/version badge (header) — small popover, no overlay/backdrop. ---
  var verData = null;
  function fmtDate(iso) {
    if (!iso) return '';
    var loc = getLang() === 'ru' ? 'ru-RU' : (getLang() === 'fr' ? 'fr-FR' : 'en-US');
    try { return new Date(iso).toLocaleString(loc); } catch (e) { return iso; }
  }
  function fillVerPop() {
    var pop = document.getElementById('verPop'); if (!pop) return;
    if (!verData) { pop.innerHTML = '<div class="ver-meta">' + esc(tr(T.verLoading)) + '</div>'; return; }
    var num = verData.number != null ? esc(tr(T.verCommit)) + verData.number : '';
    pop.innerHTML =
      '<div class="ver-head">' + esc(tr(T.verTitle)) + '</div>' +
      '<div class="ver-msg">' + esc(verData.subject || '—') + '</div>' +
      '<div class="ver-meta">' + esc(fmtDate(verData.date)) + (num ? ' · ' + num : '') + (verData.sha ? ' · ' + esc(verData.sha) : '') + '</div>';
  }
  function setupVersionBadge() {
    var wrap = document.querySelector('.ver-wrap');
    var btn = document.getElementById('verBtn');
    var pop = document.getElementById('verPop');
    if (!wrap || !btn || !pop) return;
    var pinned = false;
    function show() { fillVerPop(); pop.classList.add('open'); }
    function hide() { pop.classList.remove('open'); }
    wrap.addEventListener('mouseenter', show);
    wrap.addEventListener('mouseleave', function () { if (!pinned) hide(); });
    btn.addEventListener('click', function (e) { e.stopPropagation(); pinned = !pinned; if (pinned) show(); else hide(); });
    document.addEventListener('click', function (e) { if (pinned && !wrap.contains(e.target)) { pinned = false; hide(); } });
    if (verData) { fillVerPop(); }
    else fetch('/api/app-version').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { verData = d; fillVerPop(); }).catch(function () {});
  }

  function render(me) {
    var mount = document.getElementById('app-nav'); if (!mount) return;
    var here = location.pathname.replace(/\/$/, '') || '/';
    var authed = !!me;
    var lang = getLang();
    var links = authed ? NAV.map(function (it) {
      var active = (here === it[0] || (it[0] !== '/' && here.indexOf(it[0]) === 0)) ? ' active' : '';
      return '<a class="navlink' + active + '" href="' + it[0] + '">' + it[1] + ' ' + esc(it[2][lang] || it[2].en) + '</a>';
    }).join('') : '';
    var admin = (authed && me.role === 'admin') ? '<a class="navlink' + (here === '/admin' ? ' active' : '') + '" href="/admin">⚙️ ' + esc(tr(T.admin)) + '</a>' : '';
    var langSel = '<select class="lang-select" id="langSelect" title="' + esc(tr(T.langTitle)) + '" aria-label="' + esc(tr(T.langTitle)) + '">'
      + LANGS.map(function (l) { return '<option value="' + l + '"' + (l === lang ? ' selected' : '') + '>' + LANG_LABELS[l] + '</option>'; }).join('')
      + '</select>';
    var right = authed ? '<span class="who">' + esc(me.name || me.email || '') + '</span><button class="navlink" id="navLogout">' + esc(tr(T.logout)) + '</button>' : '';
    var themeBtn = '<button class="theme-toggle" id="themeToggle" aria-label="Toggle theme"></button>';
    var verWrap = '<span class="ver-wrap"><button class="ver-btn" id="verBtn" title="' + esc(tr(T.verTitle)) + '" aria-label="' + esc(tr(T.verTitle)) + '">📒</button><div class="ver-pop" id="verPop"></div></span>';
    mount.className = 'app-nav';
    mount.innerHTML =
      '<a class="brand" href="/">Searchify</a>' + links + admin +
      '<span class="nav-right">' + right + verWrap + langSel + themeBtn + '</span>';
    setupVersionBadge();
    updateIcon();
    var tg = document.getElementById('themeToggle');
    if (tg) tg.addEventListener('click', function () { setTheme(effectiveDark() ? 'light' : 'dark'); });
    var ls = document.getElementById('langSelect');
    if (ls) ls.addEventListener('change', function () { setLang(this.value); });
    var lo = document.getElementById('navLogout');
    if (lo) lo.addEventListener('click', async function () { try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) {} location.href = '/'; });
    if (window.matchMedia) { try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateIcon); } catch (e) {} }
  }

  function init() {
    fetch('/api/auth/me').then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { render(d && d.user); })
      .catch(function () { render(null); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
