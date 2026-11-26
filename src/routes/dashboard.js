import express from 'express';
import config from '../config/config.js';
import logger from '../utilities/logger.js';
import { getRepoHealth, getAllReposHealth } from '../services/health.js';
import { buildDigest, buildDigestsForAllRepos } from '../services/digest.js';
import github from '../services/github.js';

const router = express.Router();

router.get('/api/repos', (_req, res) => {
  const repos = Object.values(config.repositories).map((r) => ({
    name: r.name,
    discord: Boolean(r.discord),
    telegram: Boolean(r.telegram || config.telegram.chatId),
    digest: r.digest,
    health: r.health
  }));
  res.json({ ok: true, repos });
});

router.get('/api/health', async (req, res) => {
  try {
    const repo = String(req.query.repo || '').trim().toLowerCase();
    const reports = repo ? [await getRepoHealth(repo, req.query)] : await getAllReposHealth(req.query);
    res.json({ ok: true, count: reports.length, reports });
  } catch (err) {
    logger.error(`Health API error: ${err.message}`);
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/api/status', async (_req, res) => {
  let githubApi = { configured: github.isGitHubApiConfigured() };
  if (githubApi.configured) {
    try {
      const rl = await github.getRateLimit();
      githubApi.rateLimit = rl?.rate || rl?.resources?.core || null;
    } catch (err) {
      githubApi.error = err.message;
    }
  }

  res.json({
    ok: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    github: {
      webhookConfigured: Boolean(config.github.secret),
      apiConfigured: githubApi.configured,
      appConfigured: Boolean(config.github.app.appId && config.github.app.privateKey && config.github.app.installationId),
      tokenConfigured: Boolean(config.github.token),
      rateLimit: githubApi.rateLimit || null,
      apiError: githubApi.error || null
    },
    telegram: { configured: Boolean(config.telegram.botToken) },
    digest: config.digest,
    dashboard: config.dashboard,
    repositories: Object.keys(config.repositories).length
  });
});

router.get('/api/overview', async (req, res) => {
  try {
    const repo = String(req.query.repo || '').trim().toLowerCase();
    const [healthReports, digestReports] = await Promise.all([
      repo ? getRepoHealth(repo, req.query).then((r) => [r]) : getAllReposHealth(req.query),
      repo ? buildDigest(repo, req.query).then((r) => [r]).catch((e) => [{ repo, error: e.message }]) : buildDigestsForAllRepos(req.query).catch(() => [])
    ]);
    res.json({ ok: true, health: healthReports, digest: digestReports });
  } catch (err) {
    logger.error(`Overview API error: ${err.message}`);
    res.status(500).json({ ok: false, error: err.message });
  }
});

function dashboardHtml() {
  const title = 'Git Notifier — Repo Health Dashboard';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    :root { --bg:#0b1020; --panel:#121933; --panel2:#182042; --text:#e7ecff; --muted:#9aa7cc; --ok:#2ecc71; --warn:#f39c12; --bad:#e74c3c; --line:#263056; --accent:#7aa2ff; }
    * { box-sizing:border-box; }
    body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:linear-gradient(180deg,#090e1b,#0b1020 30%); color:var(--text); }
    header { padding:24px; border-bottom:1px solid var(--line); position:sticky; top:0; backdrop-filter: blur(8px); background:rgba(11,16,32,.85); }
    h1 { margin:0; font-size:24px; } p { color:var(--muted); }
    .wrap { max-width:1400px; margin:0 auto; padding:24px; }
    .controls { display:flex; gap:12px; flex-wrap:wrap; margin-top:12px; }
    select, button, input { background:var(--panel2); color:var(--text); border:1px solid var(--line); padding:10px 12px; border-radius:10px; }
    button { cursor:pointer; } button:hover { border-color:var(--accent); }
    .grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap:14px; margin:18px 0; }
    .card { background:var(--panel); border:1px solid var(--line); border-radius:14px; padding:16px; }
    .kpi { font-size:28px; font-weight:700; margin-top:6px; }
    .muted { color:var(--muted); font-size:13px; }
    .score { font-size:34px; font-weight:800; }
    .ok { color:var(--ok); } .warn { color:var(--warn); } .bad { color:var(--bad); }
    .cols { display:grid; grid-template-columns: repeat(auto-fit,minmax(420px,1fr)); gap:16px; }
    table { width:100%; border-collapse:collapse; font-size:14px; }
    th, td { padding:10px 8px; border-bottom:1px solid var(--line); text-align:left; vertical-align:top; }
    th { color:var(--muted); font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.04em; }
    a { color:var(--accent); text-decoration:none; } a:hover { text-decoration:underline; }
    .pill { display:inline-block; padding:2px 8px; border-radius:999px; font-size:12px; border:1px solid var(--line); color:var(--muted); }
    .empty { color:var(--muted); padding:12px 0; }
    .row { display:flex; gap:10px; align-items:center; justify-content:space-between; flex-wrap:wrap; }
    .statusline { font-size:13px; color:var(--muted); margin-top:8px; }
    pre { white-space:pre-wrap; word-break:break-word; background:#0a0f1e; padding:12px; border-radius:10px; border:1px solid var(--line); color:#c8d4ff; }
    @media (max-width:700px){ .cols { grid-template-columns:1fr; } }
  </style>
</head>
<body>
  <header>
    <div class="wrap" style="padding:0 24px;">
      <div class="row">
        <div>
          <h1>🩺 Git Notifier — Repo Health Dashboard</h1>
          <p style="margin:6px 0 0">PRs velhos, issues sem label, falhas de Actions, digest e status da API GitHub.</p>
        </div>
        <div class="statusline" id="statusline">Loading...</div>
      </div>
      <div class="controls">
        <select id="repoSelect"><option value="">All repositories</option></select>
        <button id="refreshBtn">Refresh</button>
        <button id="digestBtn">Send digest now</button>
      </div>
    </div>
  </header>
  <div class="wrap">
    <div class="grid" id="kpis"></div>
    <div class="cols">
      <div class="card"><h2>Stale PRs</h2><div id="stalePrs"></div></div>
      <div class="card"><h2>Stale / Unlabeled Issues</h2><div id="issues"></div></div>
      <div class="card"><h2>Failing GitHub Actions</h2><div id="actions"></div></div>
      <div class="card"><h2>Recent Workflow Runs</h2><div id="runs"></div></div>
    </div>
    <div class="card" style="margin-top:16px;"><h2>Raw status</h2><pre id="raw">Loading...</pre></div>
  </div>
<script>
const $ = (id) => document.getElementById(id);
const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function scoreClass(s){ return s>=80?'ok':s>=50?'warn':'bad'; }
function fmtDate(s){ if(!s) return '-'; const d=new Date(s); return isNaN(d)?esc(s):d.toLocaleString(); }
function link(url, text){ return url ? '<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(text)+'</a>' : esc(text); }
function table(rows, cols){ if(!rows.length) return '<div class="empty">None 🎉</div>'; return '<table><thead><tr>'+cols.map(c=>'<th>'+esc(c.h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+cols.map(c=>'<td>'+c.f(r)+'</td>').join('')+'</tr>').join('')+'</tbody></table>'; }
async function getJSON(url, opts){ const r = await fetch(url, opts); const t = await r.text(); let d; try{ d=JSON.parse(t);}catch{ throw new Error('Bad JSON: '+t.slice(0,200)); } if(!r.ok || d.ok===false) throw new Error(d.error || r.statusText); return d; }
async function loadRepos(){ const d = await getJSON('/api/repos'); const sel=$('repoSelect'); const current=sel.value; sel.innerHTML='<option value="">All repositories</option>'+d.repos.map(r=>'<option value="'+esc(r.name)+'">'+esc(r.name)+'</option>').join(''); sel.value=current; }
async function load(){ $('statusline').textContent='Loading...'; $('refreshBtn').disabled=true; try {
  const repo = $('repoSelect').value;
  const qs = repo ? '?repo='+encodeURIComponent(repo) : '';
  const [overview, status] = await Promise.all([getJSON('/api/overview'+qs), getJSON('/api/status')]);
  const reports = overview.health || [];
  const totals = reports.reduce((a,r)=>{ const m=r.metrics||{}; a.repos++; a.score+=Number(r.score||0); a.openPrs+=m.openPrs||0; a.stalePrs+=m.stalePrs||0; a.openIssues+=m.openIssues||0; a.staleIssues+=m.staleIssues||0; a.unlabeled+=m.unlabeledIssues||0; a.failing+=m.failingRuns||0; return a; }, {repos:0,score:0,openPrs:0,stalePrs:0,openIssues:0,staleIssues:0,unlabeled:0,failing:0});
  const avg = totals.repos ? Math.round(totals.score/totals.repos) : 0;
  $('kpis').innerHTML = [
    ['Average score', '<span class="score '+scoreClass(avg)+'">'+avg+'/100</span>', totals.repos+' repo(s)'],
    ['Open PRs', totals.openPrs, totals.stalePrs+' stale'],
    ['Open Issues', totals.openIssues, totals.staleIssues+' stale'],
    ['Unlabeled Issues', totals.unlabeled, 'needs triage'],
    ['Failing Actions', totals.failing, 'recent runs'],
    ['GitHub API', status.github.apiConfigured?'<span class="ok">configured</span>':'<span class="warn">not configured</span>', status.github.rateLimit?('remaining '+esc(status.github.rateLimit.remaining)+'/'+esc(status.github.rateLimit.limit)):'no rate limit data']
  ].map(([k,v,s])=>'<div class="card"><div class="muted">'+esc(k)+'</div><div class="kpi">'+v+'</div><div class="muted">'+esc(String(s))+'</div></div>').join('');

  const allStalePrs = reports.flatMap(r => (r.stalePrs||[]).map(x=>({...x,repo:r.repo})));
  const allStaleIssues = reports.flatMap(r => (r.staleIssues||[]).map(x=>({...x,repo:r.repo,type:'stale'})));
  const allUnlabeled = reports.flatMap(r => (r.unlabeledIssues||[]).map(x=>({...x,repo:r.repo,type:'unlabeled'})));
  const allFailing = reports.flatMap(r => (r.failingRuns||[]).map(x=>({...x,repo:r.repo})));
  const allRuns = reports.flatMap(r => (r.recentRuns||[]).map(x=>({...x,repo:r.repo}))).sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));

  $('stalePrs').innerHTML = table(allStalePrs, [
    {h:'Repo',f:r=>esc(r.repo)}, {h:'PR',f:r=>link(r.url,'#'+r.number+' '+(r.title||''))}, {h:'Author',f:r=>'@'+esc(r.author||'?')}, {h:'Idle',f:r=>esc(r.idleDays)+'d'}, {h:'Updated',f:r=>fmtDate(r.updatedAt)}
  ]);
  $('issues').innerHTML = table([...allStaleIssues,...allUnlabeled].slice(0,50), [
    {h:'Repo',f:r=>esc(r.repo)}, {h:'Issue',f:r=>link(r.url,'#'+r.number+' '+(r.title||''))}, {h:'Type',f:r=>'<span class="pill">'+esc(r.type)+'</span>'}, {h:'Idle',f:r=>esc(r.idleDays)+'d'}, {h:'Labels',f:r=>esc((r.labels||[]).join(', ')||'-')}
  ]);
  $('actions').innerHTML = table(allFailing, [
    {h:'Repo',f:r=>esc(r.repo)}, {h:'Workflow',f:r=>link(r.url,r.name||'workflow')}, {h:'Branch',f:r=>'<code>'+esc(r.branch||'-')+'</code>'}, {h:'Conclusion',f:r=>'<span class="bad">'+esc(r.conclusion||'-')+'</span>'}, {h:'When',f:r=>fmtDate(r.updatedAt||r.createdAt)}
  ]);
  $('runs').innerHTML = table(allRuns.slice(0,20), [
    {h:'Repo',f:r=>esc(r.repo)}, {h:'Workflow',f:r=>link(r.url,r.name||'workflow')}, {h:'Branch',f:r=>'<code>'+esc(r.branch||'-')+'</code>'}, {h:'Status',f:r=>esc(r.status||'-')}, {h:'Conclusion',f:r=>esc(r.conclusion||'-')}, {h:'When',f:r=>fmtDate(r.updatedAt||r.createdAt)}
  ]);
  $('raw').textContent = JSON.stringify({status, overview}, null, 2);
  $('statusline').textContent = 'Updated '+new Date().toLocaleString()+' · API '+(status.github.apiConfigured?'ready':'not configured');
} catch(e){ $('statusline').textContent = 'Error: '+e.message; $('raw').textContent = String(e.stack||e); }
  $('refreshBtn').disabled=false;
}
$('refreshBtn').addEventListener('click', load);
$('repoSelect').addEventListener('change', load);
$('digestBtn').addEventListener('click', async ()=>{ const repo=$('repoSelect').value; $('digestBtn').disabled=true; try{ const r=await getJSON('/api/digest/send'+(repo?'?repo='+encodeURIComponent(repo):''),{method:'POST'}); alert('Digest sent: '+JSON.stringify(r.deliveries||r)); }catch(e){ alert('Digest failed: '+e.message);} $('digestBtn').disabled=false; });
loadRepos().then(load).catch(e=>{ $('statusline').textContent='Error: '+e.message; $('raw').textContent=String(e.stack||e); });
</script>
</body>
</html>`;
}

router.get(config.dashboard.path, (_req, res) => {
  res.type('html').send(dashboardHtml());
});

export default router;
