#!/usr/bin/env node
// KRVCF App Center — first-time setup, steps B to H of the install guide, in one script.
//
//   node scripts/setup.mjs                # resume: runs every step not finished yet (B → H)
//   node scripts/setup.mjs --all          # run every step again (saved answers are reused)
//   node scripts/setup.mjs --from F       # run from a step (B C D E F G H)
//   node scripts/setup.mjs --only G       # run one step
//   node scripts/setup.mjs --reset        # forget progress (keep saved answers), optionally delete Cloudflare Worker/D1/KV, run all
//   node scripts/setup.mjs --forget       # also delete the saved answers (~/.krvcf-setup/secrets.json)
//   node scripts/setup.mjs --check        # read-only health check of an existing install
//
// Needs: Node 18+, GitHub CLI `gh` signed in (`gh auth login`), run from the repository root.
// Optional env vars (skip the prompts): CLOUDFLARE_API_TOKEN, ADMIN_PASSWORD, GOOGLE_CLIENT_ID,
//   RESEND_FULL_KEY (Resend full-access key, used once to set up the domain), PATCH_GITHUB_TOKEN.
// Everything you type is saved as you go, outside the repo, so a failed run never loses it:
//   ~/.krvcf-setup/state.json    progress (account id, zone id, finished steps)
//   ~/.krvcf-setup/secrets.json  answers (tokens, client ID, admin password) — file mode 600, never committed
// Override the folder with KRVCF_HOME.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync, renameSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import readline from 'node:readline';

/* ───────────── small helpers ───────────── */
const C = { b: (s) => `\x1b[1m${s}\x1b[0m`, g: (s) => `\x1b[32m${s}\x1b[0m`, y: (s) => `\x1b[33m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`, d: (s) => `\x1b[2m${s}\x1b[0m`, c: (s) => `\x1b[36m${s}\x1b[0m` };
const ok = (m) => console.log(`  ${C.g('✔')} ${m}`);
const warn = (m) => console.log(`  ${C.y('!')} ${m}`);
const info = (m) => console.log(`  ${C.d('·')} ${m}`);
const die = (m) => {
  console.log(`\n  ${C.r('✖')} ${m}\n`);
  console.log(`  ${C.d('입력값과 진행 상황은 ~/.krvcf-setup 에 저장돼 있습니다. 원인을 고친 뒤 같은 명령을 다시 실행하면 실패한 단계부터 이어서 합니다.')}\n`);
  process.exit(1);
};
const head = (k, t) => console.log(`\n${C.b(C.c(`━━ ${k}. ${t} `))}${C.c('━'.repeat(Math.max(3, 56 - t.length)))}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, process.env.SETUP_FAST ? 5 : ms)); // SETUP_FAST: tests only

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: !!process.stdin.isTTY });
let muted = false;
rl._writeToOutput = function (s) { if (!muted) rl.output.write(s); }; // hides typed secrets on a TTY
// line queue: works for both a keyboard and piped input (answers given ahead of the prompts)
const lines = [], waiters = [];
let closed = false;
rl.on('line', (l) => (waiters.length ? waiters.shift()(l) : lines.push(l)));
rl.on('close', () => { closed = true; while (waiters.length) waiters.shift()(''); });
const nextLine = () => (lines.length ? Promise.resolve(lines.shift()) : closed ? Promise.resolve('') : new Promise((r) => waiters.push(r)));
const flush = () => { if (process.stdin.isTTY) lines.length = 0; };
const ask = async (q, def = '') => {
  flush();
  process.stdout.write(`  ${C.b('?')} ${q}${def ? C.d(` [${def}]`) : ''}: `);
  const a = (await nextLine()).trim();
  if (!process.stdin.isTTY) process.stdout.write(`${a}\n`);
  return a || def;
};
const askSecret = async (q) => {
  flush();
  process.stdout.write(`  ${C.b('?')} ${q} ${C.d('(입력 내용은 표시되지 않음)')}: `);
  muted = true;
  const a = (await nextLine()).trim();
  muted = false;
  process.stdout.write('\n');
  return a;
};
const yes = async (q, def = 'y') => /^y/i.test(await ask(`${q} (y/n)`, def));

function openUrl(url) {
  const cmd = process.platform === 'darwin' ? ['open', [url]] : process.platform === 'win32' ? ['cmd', ['/c', 'start', '""', url.replace(/&/g, '^&')]] : ['xdg-open', [url]];
  const r = spawnSync(cmd[0], cmd[1], { stdio: 'ignore' });
  console.log(`  ${C.c('↗')} ${r.status === 0 ? '브라우저에서 열었습니다' : '아래 주소를 브라우저에서 여세요'}:\n    ${C.d(url)}`);
}

function gh(args, { input, json = false, allowFail = false } = {}) {
  const r = spawnSync('gh', args, { encoding: 'utf8', input, maxBuffer: 32 * 1024 * 1024 });
  if (r.error) die(`gh 실행 실패: ${r.error.message} — GitHub CLI를 설치하세요 (https://cli.github.com)`);
  if (r.status !== 0 && !allowFail) die(`gh ${args.join(' ')}\n    ${(r.stderr || r.stdout).trim()}`);
  if (r.status !== 0) return null;
  return json ? JSON.parse(r.stdout || 'null') : r.stdout.trim();
}

async function http(url, { method = 'GET', headers = {}, body, timeout = 20000 } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(url, { method, headers: { 'content-type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body), signal: ctl.signal });
    const text = await r.text();
    let data = null;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: r.status, ok: r.ok, data };
  } catch (e) {
    return { status: 0, ok: false, data: String(e.message || e) };
  } finally { clearTimeout(t); }
}

/* ───────────── project facts (read from the repo, so a changed domain just works) ───────────── */
if (!existsSync('worker/wrangler.toml') || !existsSync('web/config.js')) die('저장소 루트(krvcf-app-center)에서 실행하세요: node scripts/setup.mjs');
const [major] = process.versions.node.split('.').map(Number);
if (major < 18) die(`Node.js 18 이상이 필요합니다 (현재 ${process.versions.node}).`);

const toml = readFileSync('worker/wrangler.toml', 'utf8');
const API_HOST = (toml.match(/pattern\s*=\s*"([^"]+)"/) || [])[1];
const WEB_HOST = existsSync('web/CNAME') ? readFileSync('web/CNAME', 'utf8').trim() : (toml.match(/SITE_URL\s*=\s*"https:\/\/([^"/]+)/) || [])[1];
if (!API_HOST || !WEB_HOST) die('wrangler.toml의 routes pattern 또는 web/CNAME에서 도메인을 읽지 못했습니다.');
const ZONE = API_HOST.split('.').slice(-2).join('.');

const STORE = process.env.KRVCF_HOME || join(homedir(), '.krvcf-setup');
mkdirSync(STORE, { recursive: true, mode: 0o700 });
const STATE_PATH = join(STORE, 'state.json'), SECRETS_PATH = join(STORE, 'secrets.json');
const readJson = (f) => { try { return JSON.parse(readFileSync(f, 'utf8')); } catch { return {}; } };
const writeJson = (f, o, mode) => { const t = f + '.tmp'; writeFileSync(t, JSON.stringify(o, null, 2), { mode }); if (mode) chmodSync(t, mode); renameSync(t, f); };
const STATE_FILE = '.setup-state.json'; // legacy location (repo) — migrated once
const state = { ...(existsSync(STATE_FILE) ? readJson(STATE_FILE) : {}), ...readJson(STATE_PATH) };
const save = () => writeJson(STATE_PATH, state, 0o600);
const secrets = readJson(SECRETS_PATH);
const keep = (k, v) => { secrets[k] = v; writeJson(SECRETS_PATH, secrets, 0o600); };   // saved immediately
const drop = (k) => { delete secrets[k]; writeJson(SECRETS_PATH, secrets, 0o600); };
const markDone = (k) => { state.done = { ...(state.done || {}), [k]: true }; save(); };

/* ───────────── preflight ───────────── */
function preflight() {
  head('0', '사전 점검');
  const ver = gh(['--version']).split('\n')[0];
  ok(ver);
  if (gh(['auth', 'status'], { allowFail: true }) === null) die('GitHub CLI 로그인이 필요합니다: gh auth login');
  const repo = gh(['repo', 'view', '--json', 'nameWithOwner,owner,visibility,defaultBranchRef'], { json: true });
  if (state.repo && state.repo !== repo.nameWithOwner) { warn(`저장소가 ${state.repo} → ${repo.nameWithOwner}로 바뀌어 진행 기록을 초기화합니다 (입력값은 유지).`); state.done = {}; }
  state.repo = repo.nameWithOwner;
  state.owner = repo.owner.login;
  ok(`저장소 ${C.b(repo.nameWithOwner)} (${repo.visibility.toLowerCase()}, 기본 브랜치 ${repo.defaultBranchRef?.name})`);
  if (repo.visibility !== 'PUBLIC') warn('비공개 저장소입니다. GitHub 무료 플랜에서는 Pages를 공개 저장소에서만 쓸 수 있습니다(Pro·Team은 가능).');
  if (repo.defaultBranchRef?.name !== 'main') die('기본 브랜치가 main이어야 워크플로가 동작합니다: git branch -m main && git push -u origin main');
  ok(`도메인: 웹 ${C.b(WEB_HOST)} · API ${C.b(API_HOST)} · 존 ${ZONE}`);
  const saved = Object.keys(secrets);
  ok(`저장 위치 ${STORE}${saved.length ? ` · 저장된 입력값: ${saved.join(', ')}` : ''}`);
  if (!existsSync('.gitignore') || !readFileSync('.gitignore', 'utf8').includes(STATE_FILE)) {
    writeFileSync('.gitignore', (existsSync('.gitignore') ? readFileSync('.gitignore', 'utf8').replace(/\n?$/, '\n') : '') + STATE_FILE + '\n');
    info(`.gitignore에 ${STATE_FILE} 추가`);
  }
  save();
}

/* ───────────── B. Cloudflare ───────────── */
const CF = process.env.SETUP_CF_API || 'https://api.cloudflare.com/client/v4'; // override only for testing
const cf = (path, opt = {}) => http(CF + path, { ...opt, headers: { authorization: `Bearer ${secrets.CLOUDFLARE_API_TOKEN}` } });
const cfErr = (r) => (Array.isArray(r.data?.errors) && r.data.errors.length ? r.data.errors.map((e) => `${e.code} ${e.message}`).join('; ') : `HTTP ${r.status}`);

const tokenActive = async () => { const v = await cf('/user/tokens/verify'); return v.ok && v.data?.result?.status === 'active' ? null : cfErr(v); };
async function getCfToken() {
  if (process.env.CLOUDFLARE_API_TOKEN && !secrets.CLOUDFLARE_API_TOKEN) keep('CLOUDFLARE_API_TOKEN', process.env.CLOUDFLARE_API_TOKEN);
  for (;;) {
    if (!secrets.CLOUDFLARE_API_TOKEN) {
      const t = await askSecret('Cloudflare API 토큰');
      if (!t) { warn('토큰이 필요합니다.'); continue; }
      secrets.CLOUDFLARE_API_TOKEN = t;
    }
    const err = await tokenActive();
    if (!err) { keep('CLOUDFLARE_API_TOKEN', secrets.CLOUDFLARE_API_TOKEN); return; }
    warn(`Cloudflare 토큰이 유효하지 않습니다 (${err}). 다시 입력하세요.`);
    drop('CLOUDFLARE_API_TOKEN');
  }
}

function openCfTokenForm() {
  // Pre-filled token form (Cloudflare "API token template URL")
  const perms = [
    { key: 'workers_scripts', type: 'edit' }, { key: 'workers_kv_storage', type: 'edit' }, { key: 'workers_routes', type: 'edit' },
    { key: 'd1', type: 'edit' }, { key: 'account_settings', type: 'read' }, { key: 'dns', type: 'edit' }, { key: 'zone', type: 'read' },
  ];
  info('권한이 미리 채워진 토큰 생성 화면을 엽니다. 확인할 것:');
  info(`  Account Resources = 내 계정 · Zone Resources = Specific zone → ${ZONE} 로 좁히기 권장`);
  info('  Continue to summary → Create Token → 표시된 토큰 복사 (한 번만 보임)');
  openUrl(`https://dash.cloudflare.com/profile/api-tokens?permissionGroupKeys=${encodeURIComponent(JSON.stringify(perms))}&accountId=*&zoneId=all&name=${encodeURIComponent('krvcf-app-center deploy')}`);
}

async function stepB() {
  head('B', 'Cloudflare API 토큰 · Account ID');
  if (secrets.CLOUDFLARE_API_TOKEN && !(await tokenActive())) info('저장된 Cloudflare 토큰 사용');
  else if (!process.env.CLOUDFLARE_API_TOKEN) {
    drop('CLOUDFLARE_API_TOKEN');
    openCfTokenForm();
  }
  await getCfToken();
  ok('토큰 유효 (active)');

  const acc = await cf('/accounts?per_page=50');
  const list = acc.data?.result || [];
  if (!list.length) die('토큰으로 볼 수 있는 계정이 없습니다. Account Settings: Read 권한과 Account Resources를 확인하세요.');
  let account = list[0];
  if (list.length > 1) {
    list.forEach((a, i) => info(`${i + 1}) ${a.name} · ${a.id}`));
    const prev = list.findIndex((a) => a.id === state.accountId);
    account = list[Number(await ask('사용할 계정 번호', String(prev >= 0 ? prev + 1 : 1))) - 1] || list[0];
  }
  state.accountId = account.id;
  ok(`Account ID ${account.id} (${account.name})`);

  const z = await cf(`/zones?name=${ZONE}`);
  const zone = z.data?.result?.[0];
  if (!zone) die(`존 ${ZONE}을 찾지 못했습니다. 토큰 Zone Resources에 ${ZONE}이 포함되어야 합니다 (Zone: Read). ${cfErr(z)}`);
  if (zone.status !== 'active') die(`존 ${ZONE} 상태가 ${zone.status}입니다. 네임서버를 Cloudflare로 옮겨 Active가 되어야 합니다.`);
  state.zoneId = zone.id;
  ok(`존 ${ZONE} active · ${zone.id}`);

  // permission probes (read calls that need the same permission groups)
  const probes = [
    ['D1', `/accounts/${account.id}/d1/database?per_page=1`],
    ['Workers KV', `/accounts/${account.id}/storage/kv/namespaces?per_page=1`],
    ['Workers Scripts', `/accounts/${account.id}/workers/scripts`],
    ['DNS', `/zones/${zone.id}/dns_records?per_page=1`],
    ['Workers Routes', `/zones/${zone.id}/workers/routes`],
  ];
  let missing = 0;
  for (const [name, path] of probes) {
    let r = await cf(path);
    for (let i = 0; i < 4 && !r.ok; i++) { await sleep(4000); r = await cf(path); } // a new token can take a few seconds to apply everywhere
    if (r.ok) ok(`권한 ${name}`);
    else { missing++; warn(`권한 ${name} 없음 → 토큰에 추가하세요 (${cfErr(r)})`); }
  }
  if (missing) die('부족한 권한을 토큰에 추가한 뒤(토큰 값은 그대로 유지됨) 다시 실행하세요: node scripts/setup.mjs --from B');

  // API hostname must not already have a CNAME (Workers custom domain would fail)
  const ex = await cf(`/zones/${zone.id}/dns_records?name=${API_HOST}`);
  for (const rec of ex.data?.result || []) {
    if (rec.type === 'CNAME' || rec.type === 'A' || rec.type === 'AAAA') {
      warn(`${API_HOST}에 기존 ${rec.type} 레코드(${rec.content})가 있어 Worker 커스텀 도메인을 만들 수 없습니다.`);
      if (await yes('이 레코드를 삭제할까요?', 'n')) {
        const d = await cf(`/zones/${zone.id}/dns_records/${rec.id}`, { method: 'DELETE' });
        d.ok ? ok('삭제했습니다') : die(`삭제 실패: ${cfErr(d)}`);
      } else die('레코드를 정리한 뒤 다시 실행하세요.');
    }
  }
  ok(`${API_HOST}: 기존 레코드 없음 (배포 때 자동 생성)`);
  markDone('B');
}

/* ───────────── C. Google sign-in client ID ───────────── */
async function stepC() {
  head('C', 'Google 로그인 클라이언트 ID');
  const GID = /^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/;
  if (process.env.GOOGLE_CLIENT_ID) keep('GOOGLE_CLIENT_ID', process.env.GOOGLE_CLIENT_ID);
  else if (GID.test(secrets.GOOGLE_CLIENT_ID || '')) info(`저장된 Client ID 사용: ${secrets.GOOGLE_CLIENT_ID}`);
  else {
    info('Google은 웹 클라이언트 ID를 만드는 공개 API가 없어 이 단계만 화면에서 합니다(약 3분).');
    info(`1) Branding: 앱 이름 "KRVCF App Center", 홈페이지 https://${WEB_HOST}, 승인된 도메인 ${ZONE}`);
    info('2) Audience: External → Publish app (기본 범위만 쓰므로 검수 불필요)');
    info('3) Clients → Create client → Web application');
    info(`4) Authorized JavaScript origins: ${C.b(`https://${WEB_HOST}`)}  (로컬 테스트용: http://localhost, http://localhost:8080)`);
    info('   Redirect URI는 비워 둡니다 → Create → Client ID 복사');
    openUrl('https://console.cloud.google.com/auth/clients');
    for (;;) {
      const v = (await ask('Client ID (건너뛰려면 -)')).replace(/\s+/g, '');
      if (!v) continue; // stray Enter: ask again instead of skipping
      if (v === '-') { warn('건너뜀 — 이 값이 없으면 최고 관리자 외에는 앱을 등록할 수 없습니다. 나중에: node scripts/setup.mjs --only C'); return; }
      if (GID.test(v)) { keep('GOOGLE_CLIENT_ID', v); break; }
      warn('형식이 다릅니다. 예: 1234567890-abc123.apps.googleusercontent.com');
    }
  }
  ok('Client ID 확인');
  markDone('C');
}

/* ───────────── D. Optional: Resend mail + UI patch token ───────────── */
const RS = process.env.SETUP_RESEND_API || 'https://api.resend.com'; // override only for testing
async function stepD() {
  head('D', '선택 연동: 메일(Resend) · UI 패치 토큰');
  // D-1 Resend
  if (secrets.RESEND_API_KEY && secrets.MAIL_FROM) ok(`저장된 메일 설정 사용 (${secrets.MAIL_FROM})`);
  else if (await yes('승인 결과·인증 코드 메일을 쓰시겠어요? (Resend)', 'n')) {
    const key = process.env.RESEND_FULL_KEY || await (async () => {
      info('resend.com 가입 → API Keys → Create API Key (Full access) → 복사. 이 키는 도메인 설정에 한 번만 쓰고 저장하지 않습니다.');
      openUrl('https://resend.com/api-keys');
      for (;;) { const k = await askSecret('Resend API 키 (re_…, Full access 권장)'); if (k) return k; }
    })();
    const H = { authorization: `Bearer ${key}` };
    let dom = null;
    const list = await http(`${RS}/domains`, { headers: H });
    if (!list.ok && list.data?.name === 'restricted_api_key') {
      warn('발송 전용(Sending access) 키입니다 → 도메인 자동 설정은 건너뛰고 이 키를 발송용으로 씁니다.');
      info(`Resend → Domains 에서 ${ZONE} 이 Verified 상태여야 메일이 나갑니다. 자동 설정을 원하면 Full access 키로: node scripts/setup.mjs --only D`);
      keep('RESEND_API_KEY', key);
      for (;;) {
        const f = await ask('보내는 사람', `KRVCF App Center <noreply@${ZONE}>`);
        if (f.includes(`@${ZONE}`)) { keep('MAIL_FROM', f); break; }
        warn(`보내는 주소는 @${ZONE} 이어야 합니다.`);
      }
    } else {
    if (!list.ok) die(`Resend 키 확인 실패: HTTP ${list.status} ${JSON.stringify(list.data)} — 키를 다시 확인한 뒤 같은 명령을 다시 실행하세요.`);
    dom = (list.data?.data || []).find((d) => d.name === ZONE);
    if (!dom) {
      const cr = await http(`${RS}/domains`, { method: 'POST', headers: H, body: { name: ZONE } });
      if (!cr.ok) die(`Resend 도메인 추가 실패: ${JSON.stringify(cr.data)}`);
      dom = cr.data; ok(`Resend 도메인 ${ZONE} 추가`);
    } else ok(`Resend 도메인 ${ZONE} 이미 있음 (${dom.status})`);
    const det = await http(`${RS}/domains/${dom.id}`, { headers: H });
    const records = det.data?.records || dom.records || [];
    await getCfToken();
    for (const r of records) await upsertDns({ type: r.type, name: fqdn(r.name), content: r.value, priority: r.priority, ttl: 1, proxied: false }, `Resend ${r.record}`);
    await http(`${RS}/domains/${dom.id}/verify`, { method: 'POST', headers: H });
    info('Resend 도메인 인증 대기 (최대 3분)…');
    let status = '';
    for (let i = 0; i < 18; i++) {
      await sleep(10000);
      status = (await http(`${RS}/domains/${dom.id}`, { headers: H })).data?.status || '';
      if (status === 'verified') break;
    }
    status === 'verified' ? ok('Resend 도메인 인증 완료') : warn(`아직 ${status || '확인 중'} — DNS 전파 후 Resend 화면에서 Verify를 눌러도 됩니다.`);
    const k = await http(`${RS}/api-keys`, { method: 'POST', headers: H, body: { name: 'krvcf-app-center', permission: 'sending_access', domain_id: dom.id } });
    if (k.ok && k.data?.token) { keep('RESEND_API_KEY', k.data.token); ok('발송 전용 API 키 생성 (sending_access, 이 도메인 한정)'); }
    else { warn(`발송 전용 키 생성 실패 — 입력한 키를 그대로 씁니다 (${JSON.stringify(k.data)})`); keep('RESEND_API_KEY', key); }
    for (;;) {
      const f = await ask('보내는 사람', `KRVCF App Center <noreply@${ZONE}>`);
      if (f.includes(`@${ZONE}`)) { keep('MAIL_FROM', f); break; }
      warn(`보내는 주소는 인증한 도메인 @${ZONE} 이어야 합니다.`);
    }
    }
  } else info('메일 건너뜀 (앱 안 알림·Google 로그인은 정상 동작)');

  // D-2 GitHub fine-grained PAT for the Admin Console "Patch / Deploy" tab
  const patOk = async (t) => { const r = await http(`https://api.github.com/repos/${state.repo}`, { headers: { authorization: `Bearer ${t}`, accept: 'application/vnd.github+json', 'user-agent': 'krvcf-setup' } }); return r.ok && r.data?.permissions?.push ? null : `HTTP ${r.status}`; };
  if (process.env.PATCH_GITHUB_TOKEN) keep('PATCH_GITHUB_TOKEN', process.env.PATCH_GITHUB_TOKEN);
  else if (secrets.PATCH_GITHUB_TOKEN && !(await patOk(secrets.PATCH_GITHUB_TOKEN))) ok('저장된 GitHub 패치 토큰 사용 (쓰기 권한 확인)');
  else if ((secrets.PATCH_GITHUB_TOKEN && (drop('PATCH_GITHUB_TOKEN'), warn('저장된 패치 토큰이 이 저장소에 쓸 수 없어 새로 받습니다.'), true)) || await yes('관리 콘솔에서 zip 패치를 올릴 수 있게 GitHub 토큰을 만들까요? (권장)', 'y')) {
    const repoName = state.repo.split('/')[1];
    info(`권한이 미리 채워진 화면을 엽니다. ${C.b('Repository access → Only select repositories → ' + repoName)} 만 직접 고르세요.`);
    const q = new URLSearchParams({ name: `${repoName}-patch`, description: 'KRVCF App Center admin console: patch & deploy', target_name: state.owner, expires_in: '366', contents: 'write', actions: 'write', workflows: 'write' });
    openUrl(`https://github.com/settings/personal-access-tokens/new?${q}`);
    for (;;) {
      const t = await askSecret('github_pat_… 토큰 (건너뛰려면 Enter)');
      if (!t) { warn('건너뜀 — 나중에: node scripts/setup.mjs --only D'); break; }
      const e = await patOk(t);
      if (!e) { keep('PATCH_GITHUB_TOKEN', t); ok('토큰이 저장소에 쓰기 권한을 가집니다'); break; }
      warn(`이 토큰으로 ${state.repo}에 쓸 수 없습니다 (${e}). 저장소 선택과 Contents: Read and write를 확인하세요.`);
    }
  }
  markDone('D');
}

/* ───────────── Cloudflare DNS helper ───────────── */
const fqdn = (n) => (!n || n === '@' ? ZONE : n.endsWith('.' + ZONE) || n === ZONE ? n : `${n}.${ZONE}`);
async function upsertDns(rec, label) {
  if (!state.zoneId) die('존 ID가 없습니다. 먼저 B단계를 실행하세요: node scripts/setup.mjs --from B');
  const q = await cf(`/zones/${state.zoneId}/dns_records?type=${rec.type}&name=${encodeURIComponent(rec.name)}`);
  const cur = (q.data?.result || []);
  const same = cur.find((x) => x.content.replace(/\.$/, '').toLowerCase() === String(rec.content).replace(/\.$/, '').toLowerCase());
  if (same) {
    if (rec.type === 'CNAME' && same.proxied !== rec.proxied) {
      const u = await cf(`/zones/${state.zoneId}/dns_records/${same.id}`, { method: 'PATCH', body: { proxied: rec.proxied } });
      u.ok ? ok(`${label}: ${rec.name} 프록시 ${rec.proxied ? '켬' : '끔'}`) : die(`DNS 수정 실패: ${cfErr(u)}`);
    } else ok(`${label}: ${rec.type} ${rec.name} 이미 있음`);
    return;
  }
  if (rec.type === 'CNAME' && cur.length) {
    warn(`${rec.name}에 다른 CNAME(${cur[0].content})이 있습니다.`);
    if (!(await yes(`${rec.content}(으)로 바꿀까요?`, 'y'))) die('DNS를 정리한 뒤 다시 실행하세요.');
    const u = await cf(`/zones/${state.zoneId}/dns_records/${cur[0].id}`, { method: 'PATCH', body: { content: rec.content, proxied: rec.proxied } });
    return u.ok ? ok(`${label}: ${rec.name} → ${rec.content}`) : die(`DNS 수정 실패: ${cfErr(u)}`);
  }
  const body = { type: rec.type, name: rec.name, content: rec.content, ttl: 1 };
  if (rec.type === 'CNAME' || rec.type === 'A') body.proxied = !!rec.proxied;
  if (rec.type === 'MX') body.priority = Number(rec.priority ?? 10);
  const r = await cf(`/zones/${state.zoneId}/dns_records`, { method: 'POST', body });
  r.ok ? ok(`${label}: ${rec.type} ${rec.name} 추가`) : die(`DNS 추가 실패 (${rec.type} ${rec.name}): ${cfErr(r)}`);
}

/* ───────────── E. GitHub Secrets ───────────── */
function setSecret(name, value) {
  gh(['secret', 'set', name, '--repo', state.repo], { input: value });
  ok(`Secret ${name}`);
}
async function stepE() {
  head('E', 'GitHub Secrets 등록');
  const existing = new Set((gh(['secret', 'list', '--repo', state.repo, '--json', 'name'], { json: true }) || []).map((s) => s.name));
  await getCfToken();
  if (!state.accountId) die('Account ID가 없습니다. 먼저 B단계를 실행하세요.');
  setSecret('CLOUDFLARE_API_TOKEN', secrets.CLOUDFLARE_API_TOKEN);
  setSecret('CLOUDFLARE_ACCOUNT_ID', state.accountId);

  if (process.env.ADMIN_PASSWORD) keep('ADMIN_PASSWORD', process.env.ADMIN_PASSWORD);
  if (secrets.ADMIN_PASSWORD) { setSecret('ADMIN_PASSWORD', secrets.ADMIN_PASSWORD); info(`최고 관리자 비밀번호: 저장된 값 사용 (확인: ${SECRETS_PATH})`); }
  else if (existing.has('ADMIN_PASSWORD') && await yes('GitHub에 ADMIN_PASSWORD가 이미 있습니다. 그 비밀번호를 알고 있나요? (n = 새로 만듦)', 'n')) {
    const pw = await askSecret('그 비밀번호를 입력하세요 (H단계 로그인에 사용, 로컬에 저장)');
    if (pw) keep('ADMIN_PASSWORD', pw);
    info('ADMIN_PASSWORD 유지');
  } else {
    let pw;
    for (;;) {
      pw = await askSecret('최고 관리자 비밀번호 12자 이상 (Enter = 24자 자동 생성)');
      if (!pw) { pw = randomBytes(18).toString('base64url'); console.log(`\n    ${C.y('최고 관리자 비밀번호')}: ${C.b(pw)}\n    ${C.d(`${SECRETS_PATH} 에도 저장됩니다. 비밀번호 관리자에 옮겨 두세요.`)}\n`); }
      if (pw.length >= 12) break;
      warn(`${pw.length}자입니다. 12자 이상 입력하거나 Enter로 자동 생성하세요.`);
    }
    keep('ADMIN_PASSWORD', pw);
    setSecret('ADMIN_PASSWORD', pw);
  }
  if (existing.has('SESSION_SECRET')) info('SESSION_SECRET 유지 (바꾸면 전원 로그아웃)');
  else setSecret('SESSION_SECRET', randomBytes(32).toString('base64'));

  for (const k of ['GOOGLE_CLIENT_ID', 'PATCH_GITHUB_TOKEN', 'RESEND_API_KEY', 'MAIL_FROM']) {
    if (secrets[k]) setSecret(k, secrets[k]);
    else info(`${k}: ${existing.has(k) ? '기존 값 유지' : '없음 (선택)'}`);
  }
  if (!secrets.GOOGLE_CLIENT_ID && !existing.has('GOOGLE_CLIENT_ID')) warn('GOOGLE_CLIENT_ID가 없습니다 — 일반 사용자는 앱을 등록할 수 없습니다.');
  markDone('E');
}

/* ───────────── workflow runner ───────────── */
async function runWorkflow(file, label) {
  const before = new Date(Date.now() - 5000).toISOString();
  gh(['workflow', 'enable', file, '--repo', state.repo], { allowFail: true });
  gh(['workflow', 'run', file, '--repo', state.repo, '--ref', 'main']);
  info(`${label} 워크플로 실행 요청 — 실행 ID를 찾는 중…`);
  let run = null;
  for (let i = 0; i < 30 && !run; i++) {
    await sleep(3000);
    const runs = gh(['run', 'list', '--repo', state.repo, '--workflow', file, '--limit', '5', '--json', 'databaseId,createdAt,event,url'], { json: true }) || [];
    run = (Array.isArray(runs) ? runs : []).find((r) => r.event === 'workflow_dispatch' && r.createdAt >= before);
  }
  if (!run) die(`${label} 실행을 찾지 못했습니다. GitHub → Actions 탭을 확인하세요.`);
  info(`진행 상황: ${run.url}`);
  const w = spawnSync('gh', ['run', 'watch', String(run.databaseId), '--repo', state.repo, '--exit-status', '--interval', '5'], { stdio: 'inherit' });
  if (w.status !== 0) {
    const log = gh(['run', 'view', String(run.databaseId), '--repo', state.repo, '--log-failed'], { allowFail: true }) || '';
    console.log(C.d(log.split('\n').slice(-25).join('\n')));
    die(`${label} 실패 — 위 로그와 가이드 K(문제 해결)를 참고하세요.`);
  }
  ok(`${label} 완료`);
}

/* ───────────── F. API (Worker) ───────────── */
async function stepF() {
  head('F', 'API(Worker) 배포');
  await runWorkflow('worker.yml', 'Deploy API');
  info(`https://${API_HOST}/api/health 응답 대기 (인증서 발급에 몇 분 걸릴 수 있음)…`);
  let h = null;
  for (let i = 0; i < 60; i++) {
    h = await http(`https://${API_HOST}/api/health`, { timeout: 8000 });
    if (h.ok && h.data?.ok) break;
    await sleep(10000);
  }
  if (!h?.ok) die(`API가 응답하지 않습니다 (${h?.status} ${typeof h?.data === 'string' ? h.data.slice(0, 120) : ''}). 몇 분 뒤: node scripts/setup.mjs --check`);
  ok(`health ok · version ${h.data.version}`);
  if (h.data.version === 'dev') warn('version이 dev입니다 — CI가 아닌 수동 배포로 보입니다.');
  const cfg = await http(`https://${API_HOST}/api/config`);
  if (cfg.data?.auth?.dev) die('auth.dev가 true입니다. DEV_LOGIN이 운영에 설정되어 있으니 즉시 제거하세요.');
  cfg.data?.auth?.google ? ok('Google 로그인 설정됨') : warn('Google 로그인 미설정 (C단계)');
  markDone('F');
}

/* ───────────── G. Web (GitHub Pages) + DNS ───────────── */
async function stepG() {
  head('G', `웹 배포와 ${WEB_HOST} 연결`);
  const cur = gh(['api', `repos/${state.repo}/pages`], { json: true, allowFail: true });
  if (!cur) { gh(['api', '-X', 'POST', `repos/${state.repo}/pages`, '-f', 'build_type=workflow']); ok('Pages 활성화 (Source: GitHub Actions)'); }
  else if (cur.build_type !== 'workflow') { gh(['api', '-X', 'PUT', `repos/${state.repo}/pages`, '-f', 'build_type=workflow']); ok('Pages Source → GitHub Actions'); }
  else ok('Pages 이미 활성화 (GitHub Actions)');

  info('도메인 탈취 방지를 위해 GitHub 계정에서 도메인 소유 인증을 권장합니다(선택, 화면에서 TXT 1개).');
  info(`  https://github.com/settings/pages → Add a domain → ${ZONE}`);

  // GitHub first, then DNS (GitHub's recommended order)
  gh(['api', '-X', 'PUT', `repos/${state.repo}/pages`, '-f', `cname=${WEB_HOST}`]);
  ok(`Pages 커스텀 도메인 ${WEB_HOST}`);
  await getCfToken();
  await upsertDns({ type: 'CNAME', name: WEB_HOST, content: `${state.owner.toLowerCase()}.github.io`, proxied: false }, 'Pages');

  await runWorkflow('pages.yml', 'Deploy Web');

  info('HTTPS 인증서 발급 대기 (보통 수십 분, 최대 24시간). 최대 20분 기다립니다…');
  let enforced = false;
  for (let i = 0; i < 40 && !enforced; i++) {
    const p = gh(['api', `repos/${state.repo}/pages`], { json: true, allowFail: true });
    if (p?.https_enforced) { enforced = true; break; }
    const st = p?.https_certificate?.state;
    if (st === 'approved' || st === 'issued') {
      enforced = gh(['api', '-X', 'PUT', `repos/${state.repo}/pages`, '-F', 'https_enforced=true'], { allowFail: true }) !== null;
    }
    if (!enforced) await sleep(30000);
  }
  enforced ? ok('Enforce HTTPS 켬') : warn('인증서가 아직입니다. 나중에 다시: node scripts/setup.mjs --only G');

  const v = await http(`https://${WEB_HOST}/version.json`, { timeout: 8000 });
  v.ok && v.data?.sha ? ok(`https://${WEB_HOST} 응답 · ${String(v.data.sha).slice(0, 7)}`) : warn(`https://${WEB_HOST} 가 아직 응답하지 않습니다 (DNS 전파 대기).`);
  markDone('G');
}

/* ───────────── H. First admin ───────────── */
async function stepH() {
  head('H', '최고 관리자 로그인 · 관리자 등록');
  const API = `https://${API_HOST}`;
  let login;
  for (let i = 0; i < 3; i++) {
    const pw = secrets.ADMIN_PASSWORD || await askSecret('최고 관리자 비밀번호 (E단계 값)');
    login = await http(`${API}/api/auth/password`, { method: 'POST', body: { password: pw } });
    if (login.ok) { keep('ADMIN_PASSWORD', pw); break; }
    if (login.status !== 401 && login.status !== 403) break;
    warn('비밀번호가 맞지 않습니다.'); delete secrets.ADMIN_PASSWORD;
  }
  if (!login.ok) die(`최고 관리자 로그인 실패: ${JSON.stringify(login.data)} — 시크릿 동기화가 끝났는지(F단계) 확인하세요.`);
  const A = { authorization: `Bearer ${login.data.token}` };
  ok('최고 관리자 로그인');

  const st = await http(`${API}/api/admin/settings`, { headers: A });
  const env = st.data?.env || {};
  for (const [k, label] of [['google', 'Google 로그인'], ['mail', '메일'], ['github', 'UI 패치(GitHub)'], ['sessionSecret', 'SESSION_SECRET']]) env[k] ? ok(`연동 ${label}`) : info(`연동 ${label}: 미설정`);

  const ghEmail = gh(['api', 'user', '--jq', '.email'], { allowFail: true }) || '';
  const email = await ask('관리자로 등록할 내 Google 이메일 (건너뛰려면 -)', ghEmail && ghEmail !== 'null' ? ghEmail : '');
  if (email && email !== '-') {
    const name = await ask('표시 이름', email.split('@')[0]);
    const r = await http(`${API}/api/admin/approvers`, { method: 'POST', headers: A, body: { email, name, role: 'admin', invite: !!env.mail } });
    if (r.ok) ok(`${email} → 관리자 등록`);
    else if (r.status === 409) ok(`${email} 이미 등록됨`);
    else warn(`등록 실패: ${JSON.stringify(r.data)}`);
    if (env.mail && (await yes(`${email}로 테스트 메일을 보낼까요?`, 'y'))) {
      const t = await http(`${API}/api/admin/test-mail`, { method: 'POST', headers: A, body: { email } });
      t.ok ? ok('테스트 메일 발송') : warn(`테스트 메일 실패: ${JSON.stringify(t.data)}`);
    }
  }
  const more = await ask('승인자로 추가할 이메일 (쉼표로 구분, 없으면 Enter)');
  for (const e of more.split(',').map((x) => x.trim()).filter(Boolean)) {
    const r = await http(`${API}/api/admin/approvers`, { method: 'POST', headers: A, body: { email: e, role: 'approver', invite: !!env.mail } });
    r.ok || r.status === 409 ? ok(`${e} → 승인자`) : warn(`${e}: ${JSON.stringify(r.data)}`);
  }
  await http(`${API}/api/auth/logout`, { method: 'POST', headers: A });
  markDone('H');
}

/* ───────────── check (read-only) ───────────── */
async function check() {
  head('✓', '설치 확인');
  const h = await http(`https://${API_HOST}/api/health`, { timeout: 8000 });
  h.ok && h.data?.ok ? ok(`API health · version ${h.data.version}`) : warn(`API health 실패 (${h.status})`);
  const c = await http(`https://${API_HOST}/api/config`, { timeout: 8000 });
  if (c.ok) {
    c.data.auth?.google ? ok('Google 로그인 설정됨') : warn('Google 로그인 미설정');
    c.data.auth?.dev ? warn(C.r('auth.dev = true — 운영에서 DEV_LOGIN을 즉시 제거하세요')) : ok('개발용 로그인 꺼짐');
  }
  const w = await http(`https://${WEB_HOST}/version.json`, { timeout: 8000 });
  w.ok ? ok(`웹 ${WEB_HOST} · ${String(w.data?.sha || '').slice(0, 7)}`) : warn(`웹 ${WEB_HOST} 응답 없음 (${w.status})`);
  if (state.repo) {
    const p = gh(['api', `repos/${state.repo}/pages`], { json: true, allowFail: true });
    if (p) (p.https_enforced ? ok : warn)(`Pages HTTPS ${p.https_enforced ? '강제' : '미강제'} · 인증서 ${p.https_certificate?.state || '-'}`);
  }
  console.log(`\n  다음: https://${WEB_HOST} 에서 Google로 로그인 → 앱 등록 → 관리 콘솔에서 승인 (가이드 H-4)\n`);
}

/* ───────────── reset: delete Cloudflare resources made by earlier runs ───────────── */
async function resetCloud() {
  head('R', 'Cloudflare 기존 리소스 삭제');
  if (!secrets.CLOUDFLARE_API_TOKEN && !process.env.CLOUDFLARE_API_TOKEN) { info('삭제하려면 Cloudflare API 토큰이 필요합니다 (B단계에서도 그대로 씀).'); openCfTokenForm(); }
  await getCfToken();
  if (!state.accountId) {
    const acc = await cf('/accounts?per_page=50');
    state.accountId = acc.data?.result?.[0]?.id; save();
    if (!state.accountId) return warn('계정을 찾지 못해 건너뜁니다.');
  }
  const A = `/accounts/${state.accountId}`;
  const workerName = (toml.match(/^name\s*=\s*"([^"]+)"/m) || [])[1];
  const d1Name = (toml.match(/database_name\s*=\s*"([^"]+)"/) || [])[1];
  const kvTitle = (readFileSync('worker/scripts/provision.mjs', 'utf8').match(/KV_TITLE\s*=\s*'([^']+)'/) || [])[1];
  info(`대상: Worker ${workerName} · D1 ${d1Name} · KV ${kvTitle} (계정 ${state.accountId})`);
  if (!(await yes('이 세 가지를 삭제할까요? D1의 앱·로그 데이터가 모두 지워집니다', 'y'))) return info('삭제 안 함');
  const w = await cf(`${A}/workers/scripts/${workerName}?force=true`, { method: 'DELETE' });
  w.ok ? ok(`Worker ${workerName} 삭제`) : w.status === 404 ? info(`Worker ${workerName} 없음`) : warn(`Worker 삭제 실패: ${cfErr(w)}`);
  const d = await cf(`${A}/d1/database?name=${encodeURIComponent(d1Name)}&per_page=100`);
  const db = (d.data?.result || []).find((x) => x.name === d1Name);
  if (db) { const r = await cf(`${A}/d1/database/${db.uuid}`, { method: 'DELETE' }); r.ok ? ok(`D1 ${d1Name} 삭제`) : warn(`D1 삭제 실패: ${cfErr(r)}`); }
  else info(`D1 ${d1Name} 없음`);
  let ns = null;
  for (let page = 1; page <= 10 && !ns; page++) {
    const k = await cf(`${A}/storage/kv/namespaces?per_page=100&page=${page}`);
    const list = k.data?.result || [];
    ns = list.find((x) => x.title === kvTitle);
    if (list.length < 100) break;
  }
  if (ns) { const r = await cf(`${A}/storage/kv/namespaces/${ns.id}`, { method: 'DELETE' }); r.ok ? ok(`KV ${kvTitle} 삭제`) : warn(`KV 삭제 실패: ${cfErr(r)}`); }
  else info(`KV ${kvTitle} 없음`);
}

/* ───────────── main ───────────── */
const STEPS = { B: stepB, C: stepC, D: stepD, E: stepE, F: stepF, G: stepG, H: stepH };
const argv = process.argv.slice(2);
const flag = (n) => { const i = argv.indexOf(n); return i >= 0 ? (argv[i + 1] || '').toUpperCase() : null; };
try {
  console.log(C.b('\nKRVCF App Center 설치 (B → H)'));
  if (argv.includes('--forget')) { for (const k of Object.keys(secrets)) delete secrets[k]; writeJson(SECRETS_PATH, secrets, 0o600); ok('저장된 입력값을 지웠습니다.'); }
  if (argv.includes('--reset') || argv.includes('--forget')) { state.done = {}; save(); ok('진행 기록 초기화 (처음부터 다시)'); }
  preflight();
  if (existsSync(STATE_FILE)) { try { unlinkSync(STATE_FILE); } catch {} }
  if (argv.includes('--check')) await check();
  else {
    if (argv.includes('--reset') && !argv.includes('--keep-cloud')) await resetCloud();
    const only = flag('--only'), from = flag('--from');
    const keys = Object.keys(STEPS);
    if ((only && !STEPS[only]) || (from && !STEPS[from])) die('단계는 B C D E F G H 중 하나입니다.');
    const done = state.done || {};
    const run = only ? [only] : from ? keys.slice(keys.indexOf(from)) : argv.includes('--all') ? keys : keys.filter((k) => !done[k]);
    const skipped = keys.filter((k) => !run.includes(k) && done[k]);
    if (skipped.length && !only) info(`이미 끝난 단계 건너뜀: ${skipped.join(' ')} (다시 하려면 --all 또는 --from <단계>)`);
    if (run.some((k) => ['D', 'E', 'F', 'G'].includes(k)) && !run.includes('B') && !state.zoneId) die('B단계 기록이 없습니다. --from B로 실행하세요.');
    for (const k of run) {
      state.current = k; save();
      await STEPS[k]();
    }
    delete state.current; save();
    await check();
    console.log(C.g(C.b('  설치 스크립트 완료.')) + C.d(' 위에 ! 표시가 있으면 해당 단계만 다시: node scripts/setup.mjs --only <단계>'));
  }
} finally { rl.close(); }
