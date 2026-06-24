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

  // Canonical nav items: id -> [href, emoji, {fr,en,ru}].
  var ITEM = {
    search: ['/', '🔎', { fr: 'Recherche', en: 'Search', ru: 'Поиск' }],
    quality: ['/quality', '📊', { fr: 'Qualité', en: 'Quality', ru: 'Качество' }],
    bugs: ['/bugs', '🐞', { fr: 'Bugs', en: 'Bugs', ru: 'БАГи' }],
    testing: ['/testing', '🧪', { fr: 'Test de tâches', en: 'Task testing', ru: 'Тестирование задач' }],
    releases: ['/releases', '🚀', { fr: 'Release Notes', en: 'Release Notes', ru: 'Релиз-ноты' }],
    preplanning: ['/pre-planning', '🧭', { fr: 'Pré-planning', en: 'Pre-planning', ru: 'Pre-planning' }],
    tasks: ['/tasks', '🆕', { fr: 'Nouvelles tâches', en: 'New tasks', ru: 'Новые задачи' }],
    develop: ['/develop', '🛠', { fr: 'Développer', en: 'Develop', ru: 'Разработать' }],
    graph: ['/graph', '🕸', { fr: 'Graphe', en: 'Graph', ru: 'Граф' }],
    ideas: ['/ideas', '💡', { fr: 'Idées', en: 'Ideas', ru: 'Идеи' }],
    docsync: ['/doc-sync', '🔄', { fr: 'Doc Sync', en: 'Doc Sync', ru: 'Doc Sync' }],
  };
  // Role groups shown as dropdowns in the header.
  var GROUPS = [
    { id: 'qa', label: { fr: 'Pour QA', en: 'For QA', ru: 'Для QA' }, items: ['quality', 'bugs', 'testing', 'releases', 'preplanning'] },
    { id: 'dev', label: { fr: 'Pour DEV', en: 'For DEV', ru: 'Для DEV' }, items: ['develop', 'releases', 'preplanning'] },
    { id: 'biz', label: { fr: 'Pour Business', en: 'For Business', ru: 'Для Business' }, items: ['tasks', 'releases', 'preplanning'] },
  ];
  // Standalone items shown after the groups (Search is first, before groups).
  var STANDALONE = ['graph', 'ideas'];
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
    var isAdmin = authed && me.role === 'admin';
    function itemActive(id) { var h = ITEM[id][0]; return here === h || (h !== '/' && here.indexOf(h) === 0); }
    function linkHtml(id, inMenu) {
      var it = ITEM[id];
      var active = itemActive(id) ? ' active' : '';
      return '<a class="navlink' + (inMenu ? ' menu-item' : '') + active + '" href="' + it[0] + '">' + it[1] + ' ' + esc(it[2][lang] || it[2].en) + '</a>';
    }
    var links = '';
    if (authed) {
      links += linkHtml('search', false);
      links += GROUPS.map(function (g) {
        var groupActive = g.items.some(itemActive) ? ' active' : '';
        var menu = g.items.map(function (id) { return linkHtml(id, true); }).join('');
        return '<div class="nav-group" data-group="' + g.id + '">'
          + '<button class="navlink nav-group-btn' + groupActive + '" type="button">' + esc(g.label[lang] || g.label.en) + ' <span class="caret">▾</span></button>'
          + '<div class="nav-menu">' + menu + '</div></div>';
      }).join('');
      links += STANDALONE.map(function (id) { return linkHtml(id, false); }).join('');
    }
    // Doc Sync lives in the admin area now (not for regular users).
    var docsync = isAdmin ? linkHtml('docsync', false) : '';
    var admin = isAdmin ? '<a class="navlink' + (here === '/admin' ? ' active' : '') + '" href="/admin">⚙️ ' + esc(tr(T.admin)) + '</a>' : '';
    links += docsync;
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
    // Dropdown groups: hover opens (CSS); click toggles (touch); outside click closes.
    var groups = mount.querySelectorAll('.nav-group');
    function closeGroups(except) { groups.forEach(function (g) { if (g !== except) g.classList.remove('open'); }); }
    groups.forEach(function (g) {
      var btn = g.querySelector('.nav-group-btn');
      if (btn) btn.addEventListener('click', function (e) { e.stopPropagation(); var open = g.classList.contains('open'); closeGroups(g); g.classList.toggle('open', !open); });
    });
    document.addEventListener('click', function () { closeGroups(null); });
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
