export const DEMO_APP_URL = 'http://demo-app.local/';

export async function installDemoApp(page: { route: (...args: unknown[]) => unknown }) {
  await page.route('http://demo-app.local/**', async (route: { fulfill: (opts: { status: number; contentType: string; body: string }) => Promise<void> }) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: demoAppHtml(),
    });
  });
}

function demoAppHtml() {
  return String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>QA Core Demo App</title>
  <style>
    :root { font-family: Inter, Arial, sans-serif; color-scheme: light; }
    body { margin: 0; background: #f5f7fb; color: #1f2937; }
    [hidden] { display: none !important; }
    .page { max-width: 1100px; margin: 0 auto; padding: 24px; }
    .card { background: white; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,.08); padding: 24px; }
    .grid { display: grid; gap: 16px; }
    .toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; }
    input, select, button { font: inherit; }
    input, select { padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; }
    button { background: #2563eb; color: white; border: 0; border-radius: 10px; padding: 10px 16px; cursor: pointer; }
    button.secondary { background: white; color: #2563eb; border: 1px solid #93c5fd; }
    table { width: 100%; border-collapse: collapse; background: white; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; }
    tr:hover { background: #f8fafc; }
    .layout { display: grid; grid-template-columns: 1fr 320px; gap: 16px; align-items: start; }
    .drawer { background: white; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,.08); padding: 20px; position: sticky; top: 24px; }
    .kpi { display: inline-flex; align-items: center; justify-content: center; min-width: 32px; height: 32px; border-radius: 999px; background: #dbeafe; color: #1d4ed8; font-weight: 700; }
    .muted { color: #64748b; }
    .field { margin-bottom: 14px; }
    .field-label { font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
    .field-value { font-weight: 600; }
  </style>
</head>
<body>
  <main>
    <section class="page" data-testid="login-page">
      <div class="card" style="max-width: 520px; margin: 48px auto;">
        <h1>Sign in to QA Core Demo</h1>
        <p class="muted">Self-contained demo app served from Playwright routing.</p>
        <div class="grid">
          <label>
            <span class="field-label">Role</span>
            <select data-testid="role-select">
              <option value="qa-analyst">QA Analyst</option>
              <option value="team-lead">Team Lead</option>
            </select>
          </label>
          <button data-testid="sign-in-button">Enter workbench</button>
        </div>
      </div>
    </section>

    <section class="page" data-testid="dashboard-page" hidden>
      <div class="toolbar">
        <div>
          <h1 style="margin: 0;">Matter Workbench</h1>
          <div class="muted">Fluent-OOP architecture demo</div>
        </div>
        <div style="margin-left: auto;" class="muted">Signed in as <span data-testid="active-role">QA Analyst</span></div>
      </div>
      <div class="layout">
        <div class="card">
          <div class="toolbar" data-testid="search-toolbar">
            <input data-testid="matter-search-input" placeholder="Search by id, title, or owner" />
            <button data-testid="matter-search-button">Search</button>
            <span class="kpi" data-testid="results-count">3</span>
          </div>
          <table data-testid="results-table">
            <thead>
              <tr><th>Matter</th><th>Title</th><th>Status</th><th>Owner</th></tr>
            </thead>
            <tbody data-testid="results-body"></tbody>
          </table>
        </div>

        <aside class="drawer" data-testid="matter-details-drawer" hidden>
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <h2 style="margin:0;">Matter details</h2>
            <button class="secondary" data-testid="close-drawer-button">Close</button>
          </div>
          <div class="field">
            <div class="field-label">Matter ID</div>
            <div class="field-value" data-testid="details-id"></div>
          </div>
          <div class="field">
            <div class="field-label">Title</div>
            <div class="field-value" data-testid="details-title"></div>
          </div>
          <div class="field">
            <div class="field-label">Status</div>
            <div class="field-value" data-testid="details-status"></div>
          </div>
          <div class="field">
            <div class="field-label">Owner</div>
            <div class="field-value" data-testid="details-owner"></div>
          </div>
        </aside>
      </div>
    </section>
  </main>

  <script>
    const matters = [
      { id: 'MAT-101', title: 'Open renewal dispute', status: 'Open', owner: 'Ava' },
      { id: 'MAT-102', title: 'Contract review for vendor', status: 'Review', owner: 'Noah' },
      { id: 'MAT-103', title: 'Appeal preparation brief', status: 'Closed', owner: 'Ava' },
    ];

    const loginPage = document.querySelector('[data-testid="login-page"]');
    const dashboardPage = document.querySelector('[data-testid="dashboard-page"]');
    const roleSelect = document.querySelector('[data-testid="role-select"]');
    const signInButton = document.querySelector('[data-testid="sign-in-button"]');
    const activeRole = document.querySelector('[data-testid="active-role"]');
    const searchInput = document.querySelector('[data-testid="matter-search-input"]');
    const searchButton = document.querySelector('[data-testid="matter-search-button"]');
    const resultsBody = document.querySelector('[data-testid="results-body"]');
    const resultsCount = document.querySelector('[data-testid="results-count"]');
    const drawer = document.querySelector('[data-testid="matter-details-drawer"]');
    const closeDrawerButton = document.querySelector('[data-testid="close-drawer-button"]');

    const detailFields = {
      id: document.querySelector('[data-testid="details-id"]'),
      title: document.querySelector('[data-testid="details-title"]'),
      status: document.querySelector('[data-testid="details-status"]'),
      owner: document.querySelector('[data-testid="details-owner"]'),
    };

    function renderTable(query = '') {
      const normalized = query.trim().toLowerCase();
      const rows = matters.filter((matter) => {
        if (!normalized) return true;
        return Object.values(matter).some((value) => String(value).toLowerCase().includes(normalized));
      });

      resultsBody.innerHTML = '';
      for (const matter of rows) {
        const tr = document.createElement('tr');
        tr.dataset.testid = 'matter-row';
        tr.dataset.matterId = matter.id;
        tr.innerHTML = [
          '<td data-testid="matter-id">' + matter.id + '</td>',
          '<td data-testid="matter-title">' + matter.title + '</td>',
          '<td data-testid="matter-status">' + matter.status + '</td>',
          '<td data-testid="matter-owner">' + matter.owner + '</td>'
        ].join('');
        tr.addEventListener('click', () => openDrawer(matter));
        resultsBody.appendChild(tr);
      }

      resultsCount.textContent = String(rows.length);
      closeDrawer();
    }

    function openDrawer(matter) {
      detailFields.id.textContent = matter.id;
      detailFields.title.textContent = matter.title;
      detailFields.status.textContent = matter.status;
      detailFields.owner.textContent = matter.owner;
      drawer.hidden = false;
    }

    function closeDrawer() {
      drawer.hidden = true;
    }

    signInButton.addEventListener('click', () => {
      loginPage.hidden = true;
      dashboardPage.hidden = false;
      activeRole.textContent = roleSelect.selectedOptions[0].textContent;
      renderTable();
    });

    searchButton.addEventListener('click', () => renderTable(searchInput.value));
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') renderTable(searchInput.value);
    });
    closeDrawerButton.addEventListener('click', closeDrawer);
  </script>
</body>
</html>`;
}
