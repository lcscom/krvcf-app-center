/**
 * KRVCF App Center API — Cloudflare Worker (Free plan)
 *  - D1 : apps · ratings · feedback · visits · approvers · review history · audit log · settings · analytics
 *  - KV : uploaded HTML sources (html:<id>)
 *  - /run/<id> : runs user HTML isolated by a CSP sandbox (opaque origin)
 *  - Roles: owner (ADMIN_PASSWORD) > admin > approver  (admin/approver sign in with Google or email OTP)
 *  - Creators: any Google account signs in as role `user`; submitting/editing apps requires sign-in, apps are owned by owner_email
 *  - /api/admin/repo/* : commit patches to the GitHub repo from the Admin Console → Actions auto-deploy
 *  - Responses are localized: `x-lang: en|ko` header, else Accept-Language (non-Korean → English)
 */

const CATEGORIES = ['Compute', 'Storage', 'Network', 'Private AI', 'DR', 'Security', 'Dashboard', 'Tools', 'Code'];
const MAX_HTML = 10 * 1024 * 1024;
const MAX_SHOTS = 8;                 // screenshots per app
const MAX_IMAGE = 2 * 1024 * 1024;   // per uploaded image (the browser resizes before upload)
const ID_RE = '([a-z0-9]{6,16})';
const TOKEN_TTL = 12 * 3600000;
const USER_TOKEN_TTL = 7 * 86400000;
const DEFAULT_SETTINGS = {
  auto_approve: 'false',
  notify_submit: 'true',
  notify_author: 'true',
  audit_days: '180',
  visit_days: '30',
  notice: '',
  webhook_url: '',
  webhook_events: 'submit,decision,report',
};
const enc = (s) => new TextEncoder().encode(s);

/* ───────── Localized API messages (Korean source → English) ───────── */
const MSG_EN = {
  '서버 오류가 발생했습니다.': 'A server error occurred.', 'Not found': 'Not found', '앱을 찾을 수 없습니다.': 'App not found.',
  'HTML 소스를 첨부하세요.': 'Please attach the HTML source.', 'HTML은 10MB 이하만 허용됩니다.': 'HTML must be 10 MB or smaller.', 'JSON 형식이 올바르지 않습니다.': 'Invalid JSON.',
  'https:// 로 시작하는 앱 URL을 입력하세요.': 'Enter an app URL starting with https://.', '관리자 권한이 필요합니다.': 'Admin permission required.',
  '관리자 삭제는 최고 관리자만 할 수 있습니다.': 'Only the super admin can delete admins.', '관리자 역할 부여·변경은 최고 관리자만 할 수 있습니다.': 'Only the super admin can grant or change the admin role.',
  '등록된 승인자라면 인증 코드가 발송됩니다. (10분 유효)': 'If the email belongs to a registered approver, a code has been sent (valid 10 min).',
  '로그인 시도가 너무 많습니다. 15분 후 다시 시도하세요.': 'Too many sign-in attempts. Try again in 15 minutes.', '로그인이 필요합니다.': 'Sign-in required.',
  '롤백할 커밋 sha 가 필요합니다.': 'A commit SHA to roll back to is required.', 'sha 가 필요합니다.': 'A commit SHA is required.', 'workflow 는 pages 또는 worker': 'workflow must be pages or worker',
  '메일 발송에 실패했습니다. RESEND_API_KEY / MAIL_FROM 도메인 인증을 확인하세요.': 'Email failed. Check RESEND_API_KEY and MAIL_FROM domain verification.',
  '바이너리 파일은 한 번에 35개까지 가능합니다 (Workers 무료 플랜 서브요청 한도).': 'Up to 35 binary files per patch (Workers free-plan subrequest limit).',
  '데모 URL은 http:// 또는 https:// 로 시작하는 주소여야 합니다.': 'The demo URL must start with http:// or https://.', '실행 가능한 데모 URL을 입력하세요.': 'Enter a runnable demo URL.', '데모 접속 방법을 입력하세요.': 'Describe how to access the demo.',
  'GitHub 저장소 주소를 입력하세요. 예: https://github.com/owner/repo': 'Enter a GitHub repository URL, e.g. https://github.com/owner/repo',
  'GitHub 저장소를 찾을 수 없습니다 (비공개이거나 주소가 틀림).': 'GitHub repository not found (private or wrong address).',
  'GitHub 불러오기 한도(하루 30회)를 초과했습니다.': 'GitHub import limit (30 per day) reached.',
  'AI 모델이 설정되지 않았습니다.': 'No AI model is configured.', 'AI 모델 이름을 입력하세요.': 'Enter the AI model name.',
  'AI API 주소는 https:// 여야 합니다.': 'The AI API base URL must use https://.', 'API 키가 없습니다.': 'No API key is set.',
  '스크린샷은 https:// 이미지 주소만 허용됩니다.': 'Screenshots must be https:// image URLs.', '이미지는 2MB 이하만 올릴 수 있습니다.': 'Images must be 2 MB or smaller.',
  'PNG, JPEG, GIF, WebP 이미지만 올릴 수 있습니다.': 'Only PNG, JPEG, GIF and WebP images can be uploaded.', '이미지 업로드 한도(하루 60장)를 초과했습니다.': 'Image upload limit (60 per day) reached.',
  '반려 사유를 입력하세요.': 'Please enter a rejection reason.', '백업 파일 형식이 올바르지 않습니다.': 'Invalid backup file.', '변경 사항이 없습니다 (현재 저장소와 동일).': 'No changes (identical to the repository).',
  '변경할 파일이 없습니다.': 'No files to change.', '본인은 삭제할 수 없습니다.': 'You cannot delete yourself.', '본인의 역할·상태는 변경할 수 없습니다.': 'You cannot change your own role or status.',
  '비밀번호 로그인이 설정되지 않았습니다.': 'Password sign-in is not configured.', '비밀번호가 올바르지 않습니다.': 'Incorrect password.', '상태 값이 올바르지 않습니다.': 'Invalid status.',
  '설명을 입력하세요.': 'Please enter a description.', '소유 키 또는 관리자 권한이 필요합니다.': 'Owner key or admin permission required.',
  '소유자 또는 관리자만 소스를 볼 수 있습니다.': 'Only the owner or admins can view the source.', '소유자 또는 승인자만 볼 수 있습니다.': 'Only the owner or approvers can view this.',
  '수신 이메일을 입력하세요.': 'Enter a recipient email.', '승인된 앱만 평가할 수 있습니다.': 'Only approved apps can be rated.', '승인자를 찾을 수 없습니다.': 'Approver not found.',
  '시도 횟수를 초과했습니다. 코드를 다시 요청하세요.': 'Too many attempts. Request a new code.', '썸네일은 https:// URL만 허용됩니다.': 'Thumbnail must be an https:// URL.',
  '앱 유형이 올바르지 않습니다.': 'Invalid app type.', '앱 이름을 입력하세요.': 'Please enter an app name.', '요청 크기가 너무 큽니다.': 'Request too large.',
  '요청이 너무 많습니다.': 'Too many requests.', '요청이 너무 많습니다. 잠시 후 다시 시도하세요.': 'Too many requests. Please try again shortly.',
  '이 이메일로 너무 자주 요청했습니다. 10분 후 다시 시도하세요.': 'Too many requests for this email. Try again in 10 minutes.',
  '이메일 인증이 설정되지 않았습니다 (RESEND_API_KEY).': 'Email sign-in is not configured (RESEND_API_KEY).', '이메일 형식이 올바르지 않습니다.': 'Invalid email address.',
  '이메일과 6자리 코드를 입력하세요.': 'Enter your email and the 6-digit code.', '이미 등록된 이메일입니다.': 'This email is already registered.',
  '인증 메일 발송에 실패했습니다. 관리자에게 문의하세요.': 'Could not send the verification email. Contact an admin.', '작성자 이름을 입력하세요.': 'Please enter the author name.',
  '잠시 후 다시 시도하세요.': 'Please try again shortly.', '카테고리를 선택하세요.': 'Please choose a category.', '코드가 만료되었습니다. 다시 요청하세요.': 'The code has expired. Request a new one.',
  '코드가 올바르지 않습니다.': 'Incorrect code.', '평점은 1~5 사이여야 합니다.': 'Rating must be between 1 and 5.', '피드백 내용을 입력하세요.': 'Please enter your feedback.',
  '피드백은 시간당 10건까지 가능합니다.': 'Up to 10 feedback messages per hour.', '하루 등록 한도(20건)를 초과했습니다.': 'Daily submission limit (20) exceeded.',
  '한 번에 최대 400개 파일까지 패치할 수 있습니다.': 'Up to 400 files per patch.', '현재 버전과 동일합니다.': 'Identical to the current version.',
  'GitHub 연동이 설정되지 않았습니다 (PATCH_GITHUB_TOKEN 시크릿).': 'GitHub integration is not configured (PATCH_GITHUB_TOKEN secret).',
  'Google 로그인이 설정되지 않았습니다 (GOOGLE_CLIENT_ID).': 'Google sign-in is not configured (GOOGLE_CLIENT_ID).', 'Google 인증에 실패했습니다.': 'Google authentication failed.',
  'Google 인증 정보가 올바르지 않습니다.': 'Invalid Google credential.', 'Google 토큰 형식 오류': 'Malformed Google token', 'Google 서명 키를 찾을 수 없습니다.': 'Google signing key not found.',
  'Google 공개키를 가져오지 못했습니다.': 'Could not fetch Google public keys.', 'SESSION_SECRET 또는 ADMIN_PASSWORD 시크릿이 필요합니다.': 'SESSION_SECRET or ADMIN_PASSWORD secret is required.',
  '리뷰를 찾을 수 없습니다.': 'Review not found.', '웹훅 전송에 실패했습니다. URL을 확인하세요.': 'Webhook delivery failed. Check the URL.',
  '웹훅 URL은 https:// 주소여야 합니다.': 'Webhook URL must start with https://.', '해당 버전을 찾을 수 없습니다.': 'Version not found.', '이미 현재 버전입니다.': 'That is already the current version.',
  '해당 버전의 소스가 없습니다.': 'Source for that version is not available.', '리뷰는 시간당 10건까지 가능합니다.': 'Up to 10 reviews per hour.',
  '앱을 등록하려면 Google 계정으로 로그인하세요.': 'Sign in with your Google account to submit an app.', '이 앱의 소유자만 관리할 수 있습니다.': 'Only the owner of this app can manage it.',
  '차단된 계정입니다. 관리자에게 문의하세요.': 'This account has been blocked. Contact an admin.', '사용자를 찾을 수 없습니다.': 'User not found.',
  '개발용 로그인이 비활성화되어 있습니다.': 'Development sign-in is disabled.', '하루 등록 한도(10건)를 초과했습니다.': 'Daily submission limit (10) exceeded.',
  '연결할 앱 ID와 소유 키를 입력하세요.': 'Enter the app ID and owner key to link.',
  '승인자·관리자 계정은 최고 관리자만 차단할 수 있습니다.': 'Only the super admin can block approver or admin accounts.',
  '리뷰를 찾을 수 없습니다.': 'Review not found.', '링크 앱만 점검할 수 있습니다.': 'Only link apps can be checked.', '요청 형식이 올바르지 않습니다.': 'Invalid request format.', '해당 버전을 찾을 수 없습니다.': 'Version not found.',
  '한 번 이상 로그인한 활성 계정만 소유자로 지정할 수 있습니다.': 'Only an active account that has signed in at least once can be the owner.',
  '신고 사유를 선택하세요.': 'Please choose a reason.', '신고는 하루 5건까지 가능합니다.': 'Up to 5 reports per day.', '신고를 찾을 수 없습니다.': 'Report not found.',
};
const MSG_EN_RX = [
  [/^(.+) 은\(는\) 등록된 승인자가 아닙니다\. 관리자에게 승인자 등록을 요청하세요\.$/, '$1 is not a registered approver. Ask an admin to add you.'],
  [/^저장소가 그 사이 변경되었습니다 \(현재 (\w+)\)\. 새로고침 후 다시 비교하세요\.$/, 'The repository changed in the meantime (now $1). Refresh and compare again.'],
  [/^허용되지 않는 경로: (.+)$/, 'Path not allowed: $1'],
  [/^승인자 권한이 없는 계정입니다 \((.+)\)\.$/, 'This account ($1) does not have approver access.'],
];
function pickLang(req) {
  const x = (req.headers.get('x-lang') || '').toLowerCase();
  if (x === 'en' || x === 'ko') return x;
  return /^\s*ko\b/i.test(req.headers.get('accept-language') || '') ? 'ko' : 'en';
}
function localize(lang, msg) {
  if (lang !== 'en' || typeof msg !== 'string') return msg;
  if (MSG_EN[msg]) return MSG_EN[msg];
  for (const [re, rep] of MSG_EN_RX) if (re.test(msg)) return msg.replace(re, rep);
  return msg;
}
const dec = (u) => new TextDecoder().decode(u);

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const cors = corsHeaders(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const c = { req, env, ctx, url, ip: clientIp(req), lang: pickLang(req), _s: undefined };
    try {
      const res = await route(c);
      if (!url.pathname.startsWith('/run/')) for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
      return res;
    } catch (e) {
      const status = e.status || 500;
      if (status === 500) console.error(e && e.stack ? e.stack : e);
      return json({ error: localize(c.lang, status === 500 ? '서버 오류가 발생했습니다.' : e.message) }, status, cors);
    }
  },

  async scheduled(_event, env) {
    const s = await getSettings(env);
    const now = Date.now();
    await env.DB.batch([
      env.DB.prepare('DELETE FROM visits WHERE ts < ?').bind(now - Number(s.visit_days || 30) * 86400000),
      env.DB.prepare('DELETE FROM audit_log WHERE ts < ?').bind(now - Number(s.audit_days || 180) * 86400000),
      env.DB.prepare('DELETE FROM ratelimit WHERE reset_at < ?').bind(now),
      env.DB.prepare('DELETE FROM otp WHERE exp < ?').bind(now),
      env.DB.prepare('DELETE FROM presence WHERE ts < ?').bind(now - 86400000),
      env.DB.prepare('DELETE FROM daily_seen WHERE day < ?').bind(kstDay(now - 3 * 86400000)),
      env.DB.prepare('DELETE FROM notifications WHERE ts < ?').bind(now - 90 * 86400000),
    ]);
    // Free plan: 50 subrequests per invocation → 20 links (HEAD + possible GET fallback)
    await checkLinks({ env, ctx: { waitUntil: () => {} }, ip: 'cron', req: new Request('https://cron/'), url: new URL('https://cron/'), lang: 'ko' }, 20);
  },
};

/* ───────────────────────── Router ───────────────────────── */
async function route(c) {
  const p = c.url.pathname.replace(/\/+$/, '') || '/';
  const m = c.req.method;
  let mm;

  if (p === '/' || p === '/api/health') return json({ ok: true, service: 'krvcf-app-api', version: c.env.VERSION || 'dev', time: Date.now() });
  if ((mm = p.match(new RegExp(`^/run/${ID_RE}$`)))) return runApp(c, mm[1]);
  if ((mm = p.match(/^\/img\/([a-z0-9]{16})$/)) && (m === 'GET' || m === 'HEAD')) return serveImage(c, mm[1]);

  // public
  if (p === '/api/config' && m === 'GET') return publicConfig(c);
  if (p === '/api/apps' && m === 'GET') return listApps(c);
  if (p === '/api/apps' && m === 'POST') return createApp(c);
  if (p === '/api/stats' && m === 'GET') return publicStats(c);
  if (p === '/api/visit' && m === 'POST') return visit(c);
  if (p === '/api/ping' && m === 'POST') return ping(c);
  if (p === '/api/mine' && m === 'POST') return mine(c);
  if ((p === '/feed.xml' || p === '/api/feed.xml') && m === 'GET') return rssFeed(c);
  if ((mm = p.match(new RegExp(`^/s/${ID_RE}$`))) && m === 'GET') return sharePage(c, mm[1]);
  if ((mm = p.match(new RegExp(`^/api/apps/${ID_RE}$`)))) {
    if (m === 'GET') return getApp(c, mm[1]);
    if (m === 'PUT') return updateApp(c, mm[1]);
    if (m === 'DELETE') return deleteApp(c, mm[1]);
  }
  if ((mm = p.match(new RegExp(`^/api/apps/${ID_RE}/versions/(\\d+)/restore$`))) && m === 'POST') return restoreVersion(c, mm[1], Number(mm[2]));
  if ((mm = p.match(new RegExp(`^/api/apps/${ID_RE}/versions/(\\d+)/source$`))) && m === 'GET') return versionSource(c, mm[1], Number(mm[2]));
  if ((mm = p.match(new RegExp(`^/api/apps/${ID_RE}/(run|run-ticket|rate|feedback|source|reviews|versions|comments|report)$`)))) {
    const [, id, act] = mm;
    if (act === 'run-ticket' && m === 'POST') return runTicket(c, id);
    if (act === 'run' && m === 'POST') return countRun(c, id);
    if (act === 'rate' && m === 'POST') return rate(c, id);
    if (act === 'feedback' && m === 'POST') return feedback(c, id);
    if (act === 'source' && m === 'GET') return source(c, id);
    if (act === 'reviews' && m === 'GET') return reviews(c, id);
    if (act === 'versions' && m === 'GET') return listVersions(c, id);
    if (act === 'comments' && m === 'GET') return listComments(c, id);
    if (act === 'comments' && m === 'POST') return postComment(c, id);
    if (act === 'comments' && m === 'DELETE') return deleteMyComment(c, id);
    if (act === 'report' && m === 'POST') return reportApp(c, id);
  }

  // auth
  if ((p === '/api/auth/password' || p === '/api/admin/login') && m === 'POST') return authPassword(c);
  if (p === '/api/auth/email/start' && m === 'POST') return authEmailStart(c);
  if (p === '/api/auth/email/verify' && m === 'POST') return authEmailVerify(c);
  if (p === '/api/auth/google' && m === 'POST') return authGoogle(c);
  if (p === '/api/auth/dev' && m === 'POST') return authDev(c);
  if (p === '/api/auth/me' && m === 'GET') return authMe(c);
  if (p === '/api/auth/logout' && m === 'POST') return authLogout(c);

  // signed-in creators (Owner Studio)
  if (p.startsWith('/api/my/')) {
    const s = await session(c);
    if (!s) fail(401, '로그인이 필요합니다.');
    if (p === '/api/my/apps' && m === 'GET') return myApps(c, s);
    if (p === '/api/my/claim' && m === 'POST') return claimApps(c, s);
    if (p === '/api/my/github-import' && m === 'POST') return githubImport(c, s);
    if (p === '/api/my/images' && m === 'POST') return uploadImage(c, s);
    if (p === '/api/my/notifications' && m === 'GET') return myNotifications(c, s);
    if (p === '/api/my/notifications/read' && m === 'POST') return readNotifications(c, s);
    if (p === '/api/my/favs' && m === 'GET') return myFavs(c, s);
    if (p === '/api/my/favs' && m === 'POST') return setFavs(c, s);
    if ((mm = p.match(new RegExp(`^/api/my/apps/${ID_RE}/comments/(\\d+)/reply$`))) && m === 'POST') return replyComment(c, s, mm[1], Number(mm[2]));
    if ((mm = p.match(new RegExp(`^/api/my/apps/${ID_RE}$`))) && m === 'GET') return myAppDetail(c, s, mm[1]);
    fail(404, 'Not found');
  }

  // staff
  if (p.startsWith('/api/admin/')) {
    const s = await session(c);
    if (!isStaff(s)) fail(401, '로그인이 필요합니다.');
    return adminRoute(c, s, p.slice('/api/admin/'.length), m);
  }
  fail(404, 'Not found');
}

/* ───────────────────────── Public ───────────────────────── */
async function publicConfig(c) {
  const s = await getSettings(c.env);
  return json({
    auth: { google: c.env.GOOGLE_CLIENT_ID || null, email: mailEnabled(c.env), password: !!c.env.ADMIN_PASSWORD, dev: devLoginOn(c) },
    submitRequiresLogin: true,
    notice: s.notice || '',
    autoApprove: s.auto_approve === 'true',
    githubImport: { ai: await aiReady(c.env) },
    version: c.env.VERSION || 'dev',
  });
}

async function listApps(c) {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM apps WHERE status='approved' ORDER BY featured DESC, runs DESC, created_at DESC"
  ).all();
  return json({ apps: results.map((r) => pub(r, 0)) }, 200, { 'cache-control': 'public, max-age=10' });
}

async function publicStats(c) {
  const DB = c.env.DB;
  const now = Date.now();
  const [a, v, t, tot, on, tr] = await DB.batch([
    DB.prepare(
      "SELECT SUM(CASE WHEN type='link' THEN 1 ELSE 0 END) AS links, SUM(CASE WHEN type='html' THEN 1 ELSE 0 END) AS htmls, COALESCE(SUM(runs),0) AS runs, COALESCE(SUM(views),0) AS views FROM apps WHERE status='approved'"
    ),
    DB.prepare("SELECT v FROM counters WHERE k='visits'"),
    DB.prepare('SELECT pv, uv FROM daily WHERE day=?').bind(kstDay(now)),
    DB.prepare('SELECT COUNT(*) AS n FROM visitors'),
    DB.prepare('SELECT COUNT(*) AS n FROM presence WHERE ts > ?').bind(now - ONLINE_WINDOW),
    DB.prepare(
      `SELECT a.*, SUM(d.views) AS w_views, SUM(d.runs) AS w_runs FROM app_daily d JOIN apps a ON a.id=d.app_id
       WHERE d.day >= ? AND a.status='approved' GROUP BY d.app_id ORDER BY (SUM(d.views) + SUM(d.runs) * 3) DESC LIMIT 6`
    ).bind(kstDay(now - 6 * 86400000)),
  ]);
  const r = a.results[0] || {};
  const td = t.results[0] || {};
  return json({
    links: r.links || 0, htmls: r.htmls || 0, runs: r.runs || 0, views: r.views || 0,
    visits: (v.results[0] && v.results[0].v) || 0,
    todayVisitors: td.uv || 0, todayPv: td.pv || 0,
    totalVisitors: (tot.results[0] && tot.results[0].n) || 0,
    online: (on.results[0] && on.results[0].n) || 0,
    trending: tr.results.map((x) => ({ ...pub(x, 0), weekViews: x.w_views || 0, weekRuns: x.w_runs || 0 })),
  }, 200, { 'cache-control': 'public, max-age=15' });
}

async function getApp(c, id) {
  const row = await findApp(c.env, id);
  const level = await accessLevel(c, row);
  if (row.status !== 'approved' && level === 0) fail(404, '앱을 찾을 수 없습니다.');
  const s = await session(c);
  const manage = isAdmin(s) || isOwnerSession(s, row);
  return json({ app: pub(row, level, { guide: true, signedIn: !!s }), manage, owned: isOwnerSession(s, row), claimable: !!s && !row.owner_email && s.r !== 'owner' });
}

async function source(c, id) {
  const row = await findApp(c.env, id);
  if ((await accessLevel(c, row)) === 0) fail(403, '소유자 또는 관리자만 소스를 볼 수 있습니다.');
  if (row.type !== 'html') return json({ html: null });
  return json({ html: (await c.env.HTML.get('html:' + id)) || '' });
}

async function reviews(c, id) {
  const row = await findApp(c.env, id);
  if ((await accessLevel(c, row)) === 0) fail(403, '소유자 또는 승인자만 볼 수 있습니다.');
  const { results } = await c.env.DB.prepare('SELECT ts, actor, action, note FROM app_reviews WHERE app_id=? ORDER BY id DESC LIMIT 100').bind(id).all();
  return json({ reviews: results });
}

async function createApp(c) {
  const { env } = c;
  const s = await session(c);
  if (!s) { await audit(c, 'app.create', 'app', null, { reason: 'not_signed_in' }, false); fail(401, '앱을 등록하려면 Google 계정으로 로그인하세요.'); }
  const ownerEmail = s.r === 'owner' ? null : s.e;
  if (ownerEmail && !isAdmin(s) && !(await hit(env, 'submit-user:' + ownerEmail, 10, 86400000))) {
    await audit(c, 'app.create', 'app', null, { reason: 'rate_limited_user' }, false, ownerEmail);
    fail(429, '하루 등록 한도(10건)를 초과했습니다.');
  }
  if (!(await hit(env, 'submit:' + (await sha256(c.ip)), 20, 86400000))) {
    await audit(c, 'app.create', 'app', null, { reason: 'rate_limited' }, false);
    fail(429, '하루 등록 한도(20건)를 초과했습니다.');
  }
  const b = await readJson(c.req, MAX_HTML + 512 * 1024);
  const v = validate(b, null);
  const id = randomId(10);
  const key = randomKey();
  const now = Date.now();
  const st = await getSettings(env);
  const status = st.auto_approve === 'true' ? 'approved' : 'pending';
  if (v.type === 'html') { await env.HTML.put('html:' + id, v.html); await env.HTML.put(`html:${id}:v1`, v.html); }
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO apps (id,type,name,url,category,description,thumbnail,author_name,author_email,owner_key_hash,status,size,created_at,updated_at,reviewed_by,reviewed_at,tags,version,changelog,owner_email,approved_version,demo_url,access_guide,access_private,screenshots)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?,?,?,?,?,?)`
    ).bind(id, v.type, v.name, v.url, v.category, v.description, v.thumbnail, v.author, ownerEmail || v.email, await sha256(key), status, v.size, now, now,
      status === 'approved' ? 'system (auto-approve)' : null, status === 'approved' ? now : null, tagStr(v.tags), v.changelog, ownerEmail, status === 'approved' ? 1 : null,
      v.demoUrl, v.accessGuide, v.accessPrivate ? 1 : 0, v.screenshots.length ? JSON.stringify(v.screenshots) : null),
    env.DB.prepare('INSERT INTO app_versions (app_id,version,ts,actor,type,url,size,note) VALUES (?,1,?,?,?,?,?,?)').bind(id, now, v.author, v.type, v.url, v.size, v.changelog || 'initial'),
    env.DB.prepare('INSERT INTO app_reviews (app_id,ts,actor,action,note) VALUES (?,?,?,?,?)').bind(id, now, v.author, 'submitted', null),
    ...(status === 'approved' ? [env.DB.prepare('INSERT INTO app_reviews (app_id,ts,actor,action,note) VALUES (?,?,?,?,?)').bind(id, now, 'system', 'approved', '자동 승인 설정 / auto-approve')] : []),
  ]);
  await audit(c, 'app.create', 'app', id, { name: v.name, type: v.type, category: v.category, size: v.size, status, owner: ownerEmail }, true, ownerEmail || s.e, s.r);
  if (status === 'pending') await notifyStaff(c, 'app.pending', id, { name: v.name, author: v.author });
  if (status === 'pending' && st.notify_submit === 'true') c.ctx.waitUntil(notifyApprovers(c, { id, name: v.name, author: v.author, type: v.type, category: v.category, description: v.description }, '신규 등록'));
  c.ctx.waitUntil(webhook(c, 'submit', { app: id, text: `[KRVCF App Center] ${status === 'approved' ? '신규 공개 / New app' : '승인 요청 / Review request'}: ${v.name} (by ${v.author})\n${siteUrl(env)}/#/${status === 'approved' ? 'app/' + id : 'admin'}` }));
  return json({ id, ownerKey: ownerEmail ? undefined : key, status, owner: ownerEmail }, 201);
}

async function updateApp(c, id) {
  const { env } = c;
  let row = await findApp(env, id);
  const { s, admin: byAdmin0 } = await requireManage(c, row);
  row = await findApp(env, id); // may have just been linked to the account
  const b = await readJson(c.req, MAX_HTML + 512 * 1024);
  const v = validate(b, row, byAdmin0);
  if (row.owner_email && !byAdmin0) v.email = row.owner_email; // contact email is the verified account
  // a new version is recorded whenever the runnable source changes (HTML body or link URL)
  const srcChanged = v.html !== null || (row.type === 'link' && v.url !== row.url);
  const newVer = srcChanged ? (row.version || 1) + 1 : row.version || 1;
  if (v.html !== null) { await env.HTML.put('html:' + id, v.html); await env.HTML.put(`html:${id}:v${newVer}`, v.html); }
  const st = await getSettings(env);
  let status = row.status;
  const byAdmin = byAdmin0;
  if (!byAdmin) status = st.auto_approve === 'true' ? 'approved' : 'pending';
  const now = Date.now();
  const actor = s.e;
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE apps SET name=?, url=?, category=?, description=?, thumbnail=?, author_name=?, author_email=?, status=?,
         size=CASE WHEN ? THEN ? ELSE size END, updated_at=?, tags=?, version=?, changelog=CASE WHEN ? THEN ? ELSE changelog END,
         approved_version=CASE WHEN ?='approved' THEN ? ELSE approved_version END, demo_url=?, access_guide=?, access_private=?, screenshots=? WHERE id=?`
    ).bind(v.name, v.url, v.category, v.description, v.thumbnail, v.author, v.email, status, v.html !== null ? 1 : 0, v.size, now, tagStr(v.tags), newVer, srcChanged ? 1 : 0, v.changelog, status, newVer,
      v.demoUrl, v.accessGuide, v.accessPrivate ? 1 : 0, v.screenshots.length ? JSON.stringify(v.screenshots) : null, id),
    ...(srcChanged ? [env.DB.prepare('INSERT OR REPLACE INTO app_versions (app_id,version,ts,actor,type,url,size,note) VALUES (?,?,?,?,?,?,?,?)')
      .bind(id, newVer, now, actor, row.type, v.url, v.html !== null ? v.size : row.size, v.changelog)] : []),
    env.DB.prepare('INSERT INTO app_reviews (app_id,ts,actor,action,note) VALUES (?,?,?,?,?)').bind(id, now, actor, byAdmin ? 'edited' : 'resubmitted', v.html !== null ? 'HTML 소스 변경 포함 / includes HTML change' : null),
  ]);
  const changed = ['name', 'url', 'category', 'description', 'thumbnail', 'author', 'email', 'demoUrl', 'accessGuide'].filter((k) => {
    const col = { author: 'author_name', email: 'author_email', demoUrl: 'demo_url', accessGuide: 'access_guide' }[k] || k;
    return (row[col] || null) !== (v[k] || null);
  });
  if (!!row.access_private !== v.accessPrivate) changed.push('accessPrivate');
  if ((row.screenshots || null) !== (v.screenshots.length ? JSON.stringify(v.screenshots) : null)) {
    changed.push('screenshots');
    c.ctx.waitUntil(dropUnusedImages(env, parseShots(row.screenshots), v.screenshots));
  }
  if (v.html !== null) changed.push('html');
  if (tagStr(v.tags) !== (row.tags || '')) changed.push('tags');
  if (srcChanged) c.ctx.waitUntil(pruneVersions(env, id, newVer));
  await audit(c, 'app.update', 'app', id, { name: v.name, changed, version: newVer, statusFrom: row.status, statusTo: status, via: byAdmin ? 'admin' : 'owner' }, true);
  if (!byAdmin && status === 'pending') await notifyStaff(c, 'app.resubmitted', id, { name: v.name, author: v.author, version: newVer, approved: row.approved_version || null });
  if (!byAdmin && status === 'pending' && st.notify_submit === 'true') c.ctx.waitUntil(notifyApprovers(c, { id, name: v.name, author: v.author, type: row.type, category: v.category, description: v.description }, '수정 후 재승인 요청'));
  return json({ app: pub(await findApp(env, id), byAdmin ? 2 : 1) });
}

async function deleteApp(c, id) {
  const row = await findApp(c.env, id);
  const { admin } = await requireManage(c, row);
  await removeApp(c.env, id);
  await audit(c, 'app.delete', 'app', id, { name: row.name, type: row.type, status: row.status, owner: row.owner_email || null, via: admin ? 'admin' : 'owner' });
  return json({ ok: true });
}

async function mine(c) {
  const b = await readJson(c.req, 64 * 1024);
  const items = Array.isArray(b.items) ? b.items.slice(0, 100) : [];
  const out = [];
  for (const it of items) {
    if (!it || typeof it.id !== 'string' || typeof it.key !== 'string') continue;
    const row = await c.env.DB.prepare('SELECT * FROM apps WHERE id=?').bind(it.id).first();
    if (!row) { out.push({ id: it.id, missing: true }); continue; }
    if (row.owner_email || !row.owner_key_hash || !timingSafeEq(await sha256(it.key), row.owner_key_hash)) { out.push({ id: it.id, invalid: true }); continue; }
    out.push(pub(row, 1));
  }
  return json({ apps: out });
}

async function countRun(c, id) {
  const row = await findApp(c.env, id);
  if (row.status !== 'approved') return json({ ok: true, counted: false });
  const voter = await voterId(c.ip);
  if (!(await hit(c.env, `run:${voter}:${id}`, 1, 300000))) return json({ ok: true, counted: false, runs: row.runs });
  const day = kstDay();
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE apps SET runs = runs + 1 WHERE id=?').bind(id),
    c.env.DB.prepare('INSERT INTO daily (day, runs) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET runs = runs + 1').bind(day),
    c.env.DB.prepare('INSERT INTO app_daily (app_id, day, runs) VALUES (?, ?, 1) ON CONFLICT(app_id, day) DO UPDATE SET runs = runs + 1').bind(id, day),
  ]);
  await audit(c, 'app.run', 'app', id, { name: row.name, type: row.type });
  return json({ ok: true, counted: true, runs: row.runs + 1 });
}

async function rate(c, id) {
  const { env } = c;
  const row = await findApp(env, id);
  if (row.status !== 'approved') fail(400, '승인된 앱만 평가할 수 있습니다.');
  const b = await readJson(c.req, 4096);
  const stars = Number(b.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) fail(400, '평점은 1~5 사이여야 합니다.');
  const voter = await voterId(c.ip);
  if (!(await hit(env, `rate:${voter}`, 30, 3600000))) fail(429, '잠시 후 다시 시도하세요.');
  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO ratings (app_id,voter,stars,created_at) VALUES (?,?,?,?) ON CONFLICT(app_id,voter) DO UPDATE SET stars=excluded.stars, created_at=excluded.created_at'
    ).bind(id, voter, stars, Date.now()),
    env.DB.prepare(
      'UPDATE apps SET rating_sum=(SELECT COALESCE(SUM(stars),0) FROM ratings WHERE app_id=?), rating_count=(SELECT COUNT(*) FROM ratings WHERE app_id=?) WHERE id=?'
    ).bind(id, id, id),
  ]);
  const r = await findApp(env, id);
  await audit(c, 'app.rate', 'app', id, { name: row.name, stars });
  return json({ ok: true, rating: avg(r), ratingCount: r.rating_count, mine: stars });
}

async function feedback(c, id) {
  const row = await findApp(c.env, id);
  const b = await readJson(c.req, 16 * 1024);
  const message = str(b.message, 1000);
  if (!message) fail(400, '피드백 내용을 입력하세요.');
  if (!(await hit(c.env, 'fb:' + (await sha256(c.ip)), 10, 3600000))) fail(429, '피드백은 시간당 10건까지 가능합니다.');
  await c.env.DB.prepare('INSERT INTO feedback (app_id,message,ip,created_at) VALUES (?,?,?,?)').bind(id, message, maskIp(c.ip), Date.now()).run();
  await audit(c, 'app.feedback', 'app', id, { name: row.name, length: message.length });
  if (row.owner_email) await notify(c, [row.owner_email], 'feedback.new', id, { name: row.name, excerpt: message.slice(0, 120) });
  return json({ ok: true });
}

const ONLINE_WINDOW = 3 * 60000;
const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|kakaotalk-scrap|python-requests|curl\/|wget|httpclient|monitor|uptime/i;
const kstDay = (ts = Date.now()) => new Date(ts + 9 * 3600000).toISOString().slice(0, 10);
function parseUA(u = '') {
  const device = /iPad|Tablet/i.test(u) ? 'tablet' : /Mobi|Android|iPhone/i.test(u) ? 'mobile' : 'desktop';
  const browser = /KAKAOTALK/i.test(u) ? 'KakaoTalk' : /NAVER\(/i.test(u) ? 'Naver' : /Whale/i.test(u) ? 'Whale' : /SamsungBrowser/i.test(u) ? 'Samsung'
    : /Edg\//i.test(u) ? 'Edge' : /OPR\//i.test(u) ? 'Opera' : /Firefox|FxiOS/i.test(u) ? 'Firefox' : /Chrome|CriOS/i.test(u) ? 'Chrome' : /Safari/i.test(u) ? 'Safari' : 'Other';
  return { device, browser };
}
function refDomain(ref, env) {
  if (!ref) return '(직접 방문)';
  try {
    const h = new URL(ref).hostname.replace(/^www\./, '').slice(0, 100);
    return h === new URL(siteUrl(env)).hostname ? '(직접 방문)' : h || '(직접 방문)';
  } catch (_) { return '(직접 방문)'; }
}
// Prefer a random per-browser visitor ID (localStorage), else IP — only hashes are stored
async function visitorHash(c, vid) {
  return (await sha256('v:' + (/^[a-z0-9]{16,40}$/.test(vid || '') ? 'id:' + vid : c.ip))).slice(0, 16);
}

async function visit(c) {
  const { env } = c;
  const DB = env.DB;
  const ua = c.req.headers.get('user-agent') || '';
  if (BOT_RE.test(ua)) return json({ ok: true, bot: true });
  let b = {};
  try { b = await readJson(c.req, 4096); } catch (_) { /* ignore */ }
  if (!(await hit(env, 'pv:' + (await sha256(c.ip)).slice(0, 16), 60, 60000))) return json({ ok: true, limited: true });
  const vh = await visitorHash(c, str(b.vid, 40));
  const now = Date.now();
  const day = kstDay(now);
  const { device, browser } = parseUA(ua);
  const country = (c.req.cf && c.req.cf.country) || null;
  const path = str(b.path, 200) || '#/';
  const ref = b.entry ? refDomain(str(b.ref, 500), env) : null; // record the referrer only on the first page of a session
  let appId = /^[a-z0-9]{6,16}$/.test(b.app || '') ? b.app : null;

  const seen = await DB.prepare('INSERT OR IGNORE INTO daily_seen (day, vh) VALUES (?, ?)').bind(day, vh).run();
  const newToday = seen.meta.changes > 0 ? 1 : 0;
  const ins = await DB.prepare('INSERT OR IGNORE INTO visitors (vh, first_ts, last_ts, pv, country, device) VALUES (?, ?, ?, 1, ?, ?)').bind(vh, now, now, country, device).run();
  const newVisitor = ins.meta.changes > 0 ? 1 : 0;
  let countApp = false;
  if (appId) {
    const a = await DB.prepare("SELECT id FROM apps WHERE id=? AND status='approved'").bind(appId).first();
    if (!a) appId = null;
    else countApp = await hit(env, `av:${vh}:${appId}`, 1, 1800000); // count a view at most once per visitor per 30 minutes
  }
  const st = [
    DB.prepare('INSERT INTO visits (ts, ip, vh, country, path, ua, ref, device, browser, app_id) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .bind(now, maskIp(c.ip), vh, country, path, str(ua, 200), ref, device, browser, appId),
    DB.prepare("INSERT INTO counters (k, v) VALUES ('visits', 1) ON CONFLICT(k) DO UPDATE SET v = v + 1"),
    DB.prepare(`INSERT INTO daily (day, pv, uv, new_uv, app_views) VALUES (?, 1, ?, ?, ?)
      ON CONFLICT(day) DO UPDATE SET pv = pv + 1, uv = uv + excluded.uv, new_uv = new_uv + excluded.new_uv, app_views = app_views + excluded.app_views`)
      .bind(day, newToday, newVisitor, countApp ? 1 : 0),
    DB.prepare('INSERT INTO presence (vh, ts, path) VALUES (?, ?, ?) ON CONFLICT(vh) DO UPDATE SET ts = excluded.ts, path = excluded.path').bind(vh, now, path),
  ];
  if (!newVisitor) st.push(DB.prepare('UPDATE visitors SET last_ts=?, pv=pv+1, country=COALESCE(?, country), device=? WHERE vh=?').bind(now, country, device, vh));
  if (countApp) {
    st.push(DB.prepare('UPDATE apps SET views = views + 1 WHERE id=?').bind(appId));
    st.push(DB.prepare('INSERT INTO app_daily (app_id, day, views) VALUES (?, ?, 1) ON CONFLICT(app_id, day) DO UPDATE SET views = views + 1').bind(appId, day));
  }
  await DB.batch(st);
  return json({ ok: true, newVisitor: !!newVisitor, newToday: !!newToday });
}

// 60-second heartbeat — returns the live visitor count
async function ping(c) {
  const ua = c.req.headers.get('user-agent') || '';
  let b = {};
  try { b = await readJson(c.req, 2048); } catch (_) { /* ignore */ }
  const now = Date.now();
  if (!BOT_RE.test(ua)) {
    const vh = await visitorHash(c, str(b.vid, 40));
    await c.env.DB.prepare('INSERT INTO presence (vh, ts, path) VALUES (?, ?, ?) ON CONFLICT(vh) DO UPDATE SET ts = excluded.ts, path = COALESCE(excluded.path, presence.path)')
      .bind(vh, now, str(b.path, 200) || null).run();
  }
  const r = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM presence WHERE ts > ?').bind(now - ONLINE_WINDOW).first();
  return json({ online: (r && r.n) || 0 });
}

async function analytics(c) {
  const DB = c.env.DB;
  const days = Math.min(Math.max(parseInt(c.url.searchParams.get('days'), 10) || 30, 7), 365);
  const now = Date.now();
  const startDay = kstDay(now - (days - 1) * 86400000);
  const since = now - days * 86400000;
  const st = await getSettings(c.env);
  const R = await DB.batch([
    DB.prepare('SELECT * FROM daily WHERE day >= ? ORDER BY day').bind(startDay),
    DB.prepare('SELECT COUNT(*) AS n FROM presence WHERE ts > ?').bind(now - ONLINE_WINDOW),
    DB.prepare('SELECT COUNT(*) AS n FROM visitors'),
    DB.prepare('SELECT COUNT(*) AS n FROM visitors WHERE last_ts >= ?').bind(now - 7 * 86400000),
    DB.prepare('SELECT COUNT(*) AS n FROM visitors WHERE last_ts >= ?').bind(now - 30 * 86400000),
    DB.prepare("SELECT v FROM counters WHERE k='visits'"),
    DB.prepare("SELECT CAST(strftime('%H', (ts / 1000) + 32400, 'unixepoch') AS INTEGER) AS h, COUNT(*) AS pv, COUNT(DISTINCT vh) AS uv FROM visits WHERE ts >= ? GROUP BY h").bind(kstDayStart()),
    DB.prepare('SELECT path, COUNT(*) AS pv, COUNT(DISTINCT vh) AS uv FROM visits WHERE ts >= ? GROUP BY path ORDER BY pv DESC LIMIT 15').bind(since),
    DB.prepare(`SELECT d.app_id AS id, a.name, a.type, SUM(d.views) AS views, SUM(d.runs) AS runs FROM app_daily d LEFT JOIN apps a ON a.id = d.app_id
      WHERE d.day >= ? GROUP BY d.app_id ORDER BY (SUM(d.views) + SUM(d.runs)) DESC LIMIT 15`).bind(startDay),
    DB.prepare('SELECT ref AS k, COUNT(*) AS n FROM visits WHERE ts >= ? AND ref IS NOT NULL GROUP BY ref ORDER BY n DESC LIMIT 10').bind(since),
    DB.prepare("SELECT COALESCE(country, '??') AS k, COUNT(DISTINCT vh) AS n FROM visits WHERE ts >= ? GROUP BY k ORDER BY n DESC LIMIT 10").bind(since),
    DB.prepare("SELECT COALESCE(device, 'unknown') AS k, COUNT(DISTINCT vh) AS n FROM visits WHERE ts >= ? GROUP BY k ORDER BY n DESC").bind(since),
    DB.prepare("SELECT COALESCE(browser, 'Other') AS k, COUNT(DISTINCT vh) AS n FROM visits WHERE ts >= ? GROUP BY k ORDER BY n DESC LIMIT 8").bind(since),
    DB.prepare('SELECT p.path, p.ts, v.country, v.device, v.first_ts FROM presence p LEFT JOIN visitors v ON v.vh = p.vh WHERE p.ts > ? ORDER BY p.ts DESC LIMIT 50').bind(now - ONLINE_WINDOW),
    DB.prepare('SELECT COUNT(*) AS n FROM visits WHERE ts >= ? AND ref IS NOT NULL').bind(since),
  ]);
  const rows = (i) => R[i].results;
  const one = (i) => (R[i].results[0] && R[i].results[0].n) || 0;
  const byDay = Object.fromEntries(rows(0).map((d) => [d.day, d]));
  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = kstDay(now - i * 86400000);
    const d = byDay[day] || {};
    series.push({ day, pv: d.pv || 0, uv: d.uv || 0, newUv: d.new_uv || 0, appViews: d.app_views || 0, runs: d.runs || 0 });
  }
  const hourly = Array.from({ length: 24 }, (_, h) => ({ h, pv: 0, uv: 0 }));
  rows(6).forEach((r) => { if (hourly[r.h]) { hourly[r.h].pv = r.pv; hourly[r.h].uv = r.uv; } });
  const today = series[series.length - 1];
  const yesterday = series[series.length - 2] || { pv: 0, uv: 0, newUv: 0 };
  const sum = (k) => series.reduce((t, x) => t + x[k], 0);
  return json({
    days, rawRetentionDays: Number(st.visit_days || 30),
    kpi: {
      online: one(1), totalVisitors: one(2), visitors7: one(3), visitors30: one(4),
      totalPv: (R[5].results[0] && R[5].results[0].v) || 0,
      today, yesterday,
      periodPv: sum('pv'), periodUvSum: sum('uv'), periodNew: sum('newUv'), periodRuns: sum('runs'), periodAppViews: sum('appViews'),
      sessions: one(14),
    },
    series, hourly,
    pages: rows(7), apps: rows(8), referrers: rows(9), countries: rows(10), devices: rows(11), browsers: rows(12), online: rows(13),
  });
}

/* ─────────────── v7: tags · versions · reviews · reports · webhooks · RSS ─────────────── */
const WEBHOOK_EVENTS = ['submit', 'decision', 'report', 'comment'];
const REPORT_REASONS = ['spam', 'malicious', 'broken', 'copyright', 'inappropriate', 'other'];
const MAX_VERSIONS = 10;

function parseTags(v) {
  const arr = Array.isArray(v) ? v : String(v || '').split(/[,#]/);
  const out = [];
  for (let t of arr) {
    t = String(t).trim().toLowerCase().replace(/\s+/g, '-').slice(0, 20);
    if (t && /^[\p{L}\p{N}][\p{L}\p{N}._+-]*$/u.test(t) && !out.includes(t)) out.push(t);
    if (out.length >= 5) break;
  }
  return out;
}
const tagStr = (tags) => (tags && tags.length ? ',' + tags.join(',') + ',' : '');

// keep only the latest MAX_VERSIONS versions (metadata + KV sources)
async function pruneVersions(env, id, latest) {
  const cutoff = latest - MAX_VERSIONS;
  if (cutoff < 1) return;
  const { results } = await env.DB.prepare('SELECT version FROM app_versions WHERE app_id=? AND version<=?').bind(id, cutoff).all();
  for (const r of results) await env.HTML.delete(`html:${id}:v${r.version}`);
  await env.DB.prepare('DELETE FROM app_versions WHERE app_id=? AND version<=?').bind(id, cutoff).run();
}

async function listVersions(c, id) {
  const row = await findApp(c.env, id);
  const level = await accessLevel(c, row);
  if (row.status !== 'approved' && level === 0) fail(404, '앱을 찾을 수 없습니다.');
  const { results } = await c.env.DB.prepare('SELECT * FROM app_versions WHERE app_id=? ORDER BY version DESC').bind(id).all();
  const cur = row.version || 1;
  return json({
    current: cur,
    versions: results.map((v) => ({
      version: v.version, ts: v.ts, note: v.note, size: v.size, current: v.version === cur,
      actor: level >= 1 ? v.actor : undefined, url: level >= 1 ? v.url : undefined,
    })),
  });
}

async function restoreVersion(c, id, ver) {
  const { env } = c;
  const row = await findApp(env, id);
  const { s } = await requireManage(c, row);
  const vrow = await env.DB.prepare('SELECT * FROM app_versions WHERE app_id=? AND version=?').bind(id, ver).first();
  if (!vrow) fail(404, '해당 버전을 찾을 수 없습니다.');
  if (ver === (row.version || 1)) fail(400, '이미 현재 버전입니다.');
  const newVer = (row.version || 1) + 1;
  const now = Date.now();
  let size = row.size;
  if (row.type === 'html') {
    const html = await env.HTML.get(`html:${id}:v${ver}`);
    if (html === null) fail(404, '해당 버전의 소스가 없습니다.');
    await env.HTML.put('html:' + id, html);
    await env.HTML.put(`html:${id}:v${newVer}`, html);
    size = vrow.size;
  }
  const url = row.type === 'link' ? vrow.url : row.url;
  const st = await getSettings(env);
  const byAdmin = isAdmin(s);
  const status = byAdmin ? row.status : st.auto_approve === 'true' ? 'approved' : 'pending';
  const note = `restored v${ver}`; // localized in the UI
  const actor = s.e;
  await env.DB.batch([
    env.DB.prepare("UPDATE apps SET url=?, size=?, version=?, changelog=?, status=?, updated_at=?, approved_version=CASE WHEN ?='approved' THEN ? ELSE approved_version END WHERE id=?").bind(url, size, newVer, note, status, now, status, newVer, id),
    env.DB.prepare('INSERT OR REPLACE INTO app_versions (app_id,version,ts,actor,type,url,size,note) VALUES (?,?,?,?,?,?,?,?)').bind(id, newVer, now, actor, row.type, url, size, note),
    env.DB.prepare('INSERT INTO app_reviews (app_id,ts,actor,action,note) VALUES (?,?,?,?,?)').bind(id, now, actor, byAdmin ? 'edited' : 'resubmitted', note),
  ]);
  c.ctx.waitUntil(pruneVersions(env, id, newVer));
  await audit(c, 'app.restore', 'app', id, { name: row.name, from: row.version, restored: ver, version: newVer, status }, true);
  if (!byAdmin && status === 'pending') await notifyStaff(c, 'app.resubmitted', id, { name: row.name, author: row.author_name, version: newVer, approved: row.approved_version || null });
  if (!byAdmin && status === 'pending' && st.notify_submit === 'true') {
    c.ctx.waitUntil(notifyApprovers(c, { id, name: row.name, author: row.author_name, type: row.type, category: row.category, description: row.description }, '수정 후 재승인 요청'));
  }
  return json({ app: pub(await findApp(env, id), byAdmin ? 2 : 1) });
}

async function recalcRating(env, id) {
  await env.DB.prepare('UPDATE apps SET rating_sum=(SELECT COALESCE(SUM(stars),0) FROM ratings WHERE app_id=?), rating_count=(SELECT COUNT(*) FROM ratings WHERE app_id=?) WHERE id=?')
    .bind(id, id, id).run();
}

async function listComments(c, id) {
  const row = await findApp(c.env, id);
  if (row.status !== 'approved' && (await accessLevel(c, row)) === 0) fail(404, '앱을 찾을 수 없습니다.');
  const voter = await voterId(c.ip);
  const [list, dist, mine, myRating] = await c.env.DB.batch([
    c.env.DB.prepare("SELECT id, voter, nickname, stars, body, ts, reply, reply_ts FROM comments WHERE app_id=? AND hidden=0 AND body<>'' ORDER BY ts DESC LIMIT 100").bind(id),
    c.env.DB.prepare('SELECT stars, COUNT(*) AS n FROM ratings WHERE app_id=? GROUP BY stars').bind(id),
    c.env.DB.prepare('SELECT nickname, stars, body, hidden FROM comments WHERE app_id=? AND voter=?').bind(id, voter),
    c.env.DB.prepare('SELECT stars FROM ratings WHERE app_id=? AND voter=?').bind(id, voter),
  ]);
  const d = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  dist.results.forEach((r) => { d[r.stars] = r.n; });
  const m = mine.results[0] || (myRating.results[0] ? { stars: myRating.results[0].stars, body: '', nickname: null } : null);
  return json({
    comments: list.results.map((x) => ({ id: x.id, nickname: x.nickname || null, stars: x.stars, body: x.body, ts: x.ts, mine: x.voter === voter, reply: x.reply || null, replyTs: x.reply_ts || null })),
    distribution: d,
    mine: m,
  });
}

async function postComment(c, id) {
  const { env } = c;
  const row = await findApp(env, id);
  if (row.status !== 'approved') fail(400, '승인된 앱만 평가할 수 있습니다.');
  const b = await readJson(c.req, 16 * 1024);
  const stars = Number(b.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) fail(400, '평점은 1~5 사이여야 합니다.');
  const body = str(b.body, 1000);
  const nickname = str(b.nickname, 30) || null;
  const voter = await voterId(c.ip);
  if (!(await hit(env, `cm:${voter}`, 10, 3600000))) fail(429, '리뷰는 시간당 10건까지 가능합니다.');
  const prev = await env.DB.prepare('SELECT body FROM comments WHERE app_id=? AND voter=?').bind(id, voter).first();
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO ratings (app_id,voter,stars,created_at) VALUES (?,?,?,?) ON CONFLICT(app_id,voter) DO UPDATE SET stars=excluded.stars, created_at=excluded.created_at')
      .bind(id, voter, stars, now),
    env.DB.prepare(`INSERT INTO comments (app_id,voter,nickname,stars,body,ts) VALUES (?,?,?,?,?,?) ON CONFLICT(app_id,voter) DO UPDATE SET nickname=excluded.nickname, stars=excluded.stars, body=excluded.body, ts=excluded.ts,
         reply=CASE WHEN comments.body=excluded.body AND comments.stars=excluded.stars THEN comments.reply ELSE NULL END,
         reply_ts=CASE WHEN comments.body=excluded.body AND comments.stars=excluded.stars THEN comments.reply_ts ELSE NULL END`)
      .bind(id, voter, nickname, stars, body, now),
  ]);
  await recalcRating(env, id);
  const r = await findApp(env, id);
  await audit(c, prev ? 'app.comment_edit' : 'app.comment', 'app', id, { name: row.name, stars, length: body.length });
  if (row.owner_email && (!prev || prev.body !== body)) await notify(c, [row.owner_email], 'review.new', id, { name: row.name, stars, nickname, excerpt: body.slice(0, 120) });
  if (body && (!prev || prev.body !== body)) {
    c.ctx.waitUntil(webhook(c, 'comment', { app: id, text: `[KRVCF App Center] 새 리뷰 / New review ★${stars}: ${row.name}${nickname ? ` — ${nickname}` : ''}\n${body.slice(0, 300)}\n${siteUrl(env)}/#/app/${id}` }));
  }
  return json({ ok: true, rating: avg(r), ratingCount: r.rating_count });
}

async function deleteMyComment(c, id) {
  const voter = await voterId(c.ip);
  const r = await c.env.DB.prepare('DELETE FROM comments WHERE app_id=? AND voter=?').bind(id, voter).run();
  if (r.meta.changes) await audit(c, 'app.comment_delete', 'app', id, { by: 'author' });
  return json({ ok: true, deleted: r.meta.changes });
}

async function reportApp(c, id) {
  const { env } = c;
  const row = await findApp(env, id);
  const b = await readJson(c.req, 8192);
  const reason = REPORT_REASONS.includes(b.reason) ? b.reason : fail(400, '신고 사유를 선택하세요.');
  const detail = str(b.detail, 1000) || null;
  if (!(await hit(env, 'rp:' + (await sha256(c.ip)), 5, 86400000))) fail(429, '신고는 하루 5건까지 가능합니다.');
  const r = await env.DB.prepare('INSERT INTO reports (app_id,reason,detail,ip,ts) VALUES (?,?,?,?,?)').bind(id, reason, detail, maskIp(c.ip), Date.now()).run();
  await audit(c, 'app.report', 'app', id, { name: row.name, reason, report: r.meta.last_row_id });
  await notifyStaff(c, 'report.new', id, { name: row.name, reason }, ['owner', 'admin']);
  c.ctx.waitUntil(webhook(c, 'report', { app: id, text: `[KRVCF App Center] 신고 접수 / App reported (${reason}): ${row.name}${detail ? `\n${detail.slice(0, 300)}` : ''}\n${siteUrl(env)}/#/admin` }));
  return json({ ok: true });
}

async function adminReports(c) {
  const where = c.url.searchParams.get('status') === 'all' ? '' : "WHERE r.status='open'";
  const { results } = await c.env.DB.prepare(`SELECT r.*, a.name AS app_name, a.status AS app_status FROM reports r LEFT JOIN apps a ON a.id=r.app_id ${where} ORDER BY r.id DESC LIMIT 300`).all();
  return json({ reports: results });
}

async function handleReport(c, s, rid) {
  const b = await readJson(c.req, 4096);
  if (!['resolved', 'dismissed', 'open'].includes(b.status)) fail(400, '상태 값이 올바르지 않습니다.');
  const r = await c.env.DB.prepare('SELECT * FROM reports WHERE id=?').bind(rid).first();
  if (!r) fail(404, '신고를 찾을 수 없습니다.');
  await c.env.DB.prepare('UPDATE reports SET status=?, handled_by=?, handled_at=?, note=? WHERE id=?').bind(b.status, s.e, Date.now(), str(b.note, 500) || null, rid).run();
  await audit(c, 'report.handle', 'report', String(rid), { app: r.app_id, from: r.status, to: b.status });
  return json({ ok: true });
}

async function adminComments(c) {
  const { results } = await c.env.DB.prepare("SELECT cm.id, cm.app_id, cm.nickname, cm.stars, cm.body, cm.ts, cm.hidden, a.name AS app_name FROM comments cm LEFT JOIN apps a ON a.id=cm.app_id WHERE cm.body<>'' ORDER BY cm.id DESC LIMIT 300").all();
  return json({ comments: results });
}

async function moderateComment(c, cid) {
  const b = await readJson(c.req, 1024);
  const r = await c.env.DB.prepare('SELECT * FROM comments WHERE id=?').bind(cid).first();
  if (!r) fail(404, '리뷰를 찾을 수 없습니다.');
  await c.env.DB.prepare('UPDATE comments SET hidden=? WHERE id=?').bind(b.hidden ? 1 : 0, cid).run();
  await audit(c, b.hidden ? 'comment.hide' : 'comment.unhide', 'comment', String(cid), { app: r.app_id });
  return json({ ok: true });
}

// Google Chat / Slack / Discord / generic JSON webhook
async function webhook(c, event, payload, force = false) {
  const st = await getSettings(c.env);
  const url = st.webhook_url;
  if (!url || !isHttps(url)) return false;
  if (!force && !(st.webhook_events || '').split(',').includes(event)) return false;
  const host = new URL(url).hostname;
  const text = payload.text || '';
  const body = /(^|\.)chat\.googleapis\.com$/.test(host) || /(^|\.)slack\.com$/.test(host) ? { text }
    : /(^|\.)discord(app)?\.com$/.test(host) ? { content: text.slice(0, 1900) }
      : { event, site: siteUrl(c.env), ...payload };
  let ok = false;
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json; charset=UTF-8' }, body: JSON.stringify(body) });
    ok = r.ok;
  } catch (_) { /* network error */ }
  await audit(c, 'webhook.send', 'webhook', event, { host, ok, app: payload.app || null }, ok, 'system', 'system');
  return ok;
}

async function rssFeed(c) {
  const site = siteUrl(c.env);
  const { results } = await c.env.DB.prepare("SELECT * FROM apps WHERE status='approved' ORDER BY created_at DESC LIMIT 30").all();
  const x = (s) => String(s ?? '').replace(/[<>&'"]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[ch]));
  const items = results.map((a) => `<item><title>${x(a.name)}</title><link>${site}/#/app/${a.id}</link><guid isPermaLink="false">${a.id}</guid><pubDate>${new Date(a.created_at).toUTCString()}</pubDate><category>${x(a.category)}</category><description>${x(a.description.slice(0, 500))} — ${x(a.author_name)}</description></item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>KRVCF App Center</title><link>${site}</link><description>VCF community mini apps &amp; HTML simulators</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=300' } });
}

/* ─────────────── Sandboxed runner (/run/<id>) ─────────────── */
async function runApp(c, id) {
  const { env } = c;
  const row = await env.DB.prepare('SELECT * FROM apps WHERE id=?').bind(id).first();
  if (!row) return htmlMsg(404, '앱을 찾을 수 없습니다.');
  const level = (await runTicketOk(c, id)) ? 1 : 0;
  if (row.status !== 'approved' && level === 0) return htmlMsg(404, '승인되지 않은 앱입니다.');
  if (row.status !== 'approved') await audit(c, 'app.preview', 'app', id, { name: row.name, status: row.status });
  if (row.type === 'link') return Response.redirect(row.url, 302);
  const reqVer = Number(c.url.searchParams.get('v')) || 0;
  if (reqVer && level === 0) return htmlMsg(404, '앱을 찾을 수 없습니다.');
  const html = await env.HTML.get(reqVer ? `html:${id}:v${reqVer}` : 'html:' + id);
  if (html === null) return htmlMsg(404, 'HTML 소스가 없습니다.');
  const ancestors = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean).join(' ');
  return new Response(injectShim(html), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy': `sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads allow-pointer-lock; frame-ancestors 'self' ${ancestors}`,
      'cache-control': row.status === 'approved' && level === 0 && !reqVer ? 'public, max-age=60' : 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    },
  });
}

// Short-lived (5 min) ticket that lets the sandboxed runner show a pending app or an older version.
// It is scoped to one app and grants nothing else, so it is harmless if the previewed HTML reads its own URL.
async function runTicket(c, id) {
  const row = await findApp(c.env, id);
  if ((await accessLevel(c, row)) === 0) fail(403, '소유자 또는 관리자만 소스를 볼 수 있습니다.');
  const exp = Date.now() + 300000;
  return json({ rt: `${exp}.${await hmac(secretKey(c.env), `rt:${id}:${exp}`)}`, exp });
}
async function runTicketOk(c, id) {
  const [exp, sig] = String(c.url.searchParams.get('rt') || '').split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return timingSafeEq(sig, await hmac(secretKey(c.env), `rt:${id}:${exp}`));
}

const SHIM = `<script>(function(){function M(){var d={};return{getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null},setItem:function(k,v){d[k]=String(v)},removeItem:function(k){delete d[k]},clear:function(){d={}},key:function(i){return Object.keys(d)[i]||null},get length(){return Object.keys(d).length}}}['localStorage','sessionStorage'].forEach(function(n){try{window[n].getItem('_')}catch(e){try{Object.defineProperty(window,n,{value:M(),configurable:true})}catch(_){}}});try{document.cookie}catch(e){try{Object.defineProperty(document,'cookie',{get:function(){return''},set:function(){},configurable:true})}catch(_){}}})();</script>`;
function injectShim(html) {
  let m = html.match(/<head[^>]*>/i);
  if (m) return html.slice(0, m.index + m[0].length) + SHIM + html.slice(m.index + m[0].length);
  m = html.match(/<html[^>]*>/i);
  if (m) return html.slice(0, m.index + m[0].length) + SHIM + html.slice(m.index + m[0].length);
  m = html.match(/^\s*<!doctype[^>]*>/i);
  if (m) return m[0] + SHIM + html.slice(m[0].length);
  return SHIM + html;
}
const HTML_MSG_EN = { '앱을 찾을 수 없습니다.': 'App not found.', '승인되지 않은 앱입니다.': 'This app is not approved.', 'HTML 소스가 없습니다.': 'HTML source not found.' };
function htmlMsg(status, msg) {
  msg = `${msg}<br><span style="font-size:13px;color:#9aa">${HTML_MSG_EN[msg] || ''}</span>`;
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>${status}</title><body style="font-family:sans-serif;display:grid;place-items:center;height:100vh;margin:0;color:#565656"><div><h2>${status}</h2><p>${msg}</p></div>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } }
  );
}

/* ───────────────────────── Auth ───────────────────────── */
function secretKey(env) {
  const k = env.SESSION_SECRET || env.ADMIN_PASSWORD;
  if (!k) fail(500, 'SESSION_SECRET 또는 ADMIN_PASSWORD 시크릿이 필요합니다.');
  return k;
}
async function issueToken(env, r, e, n, method) {
  const payload = b64u(enc(JSON.stringify({ r, e, n, m: method, iat: Date.now(), exp: Date.now() + (r === 'user' ? USER_TOKEN_TTL : TOKEN_TTL) })));
  return payload + '.' + (await hmac(secretKey(env), payload));
}
async function session(c) {
  if (c._s !== undefined) return c._s;
  c._s = null;
  const a = c.req.headers.get('authorization') || '';
  const t = a.startsWith('Bearer ') ? a.slice(7) : null; // never from the URL (it would leak into sandboxed pages)
  if (!t || !(c.env.SESSION_SECRET || c.env.ADMIN_PASSWORD)) return null;
  const [pl, sig] = t.split('.');
  if (!pl || !sig || !timingSafeEq(sig, await hmac(secretKey(c.env), pl))) return null;
  let p;
  try { p = JSON.parse(dec(b64uDec(pl))); } catch (_) { return null; }
  if (!p.exp || p.exp < Date.now()) return null;
  if (p.r === 'user') {
    const u = await c.env.DB.prepare('SELECT name, blocked FROM users WHERE email=?').bind(p.e).first();
    if (!u || u.blocked) return null; // blocking revokes sessions immediately
    p.n = u.name || p.n;
  } else if (p.r !== 'owner') {
    const row = await c.env.DB.prepare('SELECT a.role, a.active, a.name, u.blocked FROM approvers a LEFT JOIN users u ON u.email=a.email WHERE a.email=?').bind(p.e).first();
    if (!row || !row.active || row.blocked) return null; // deactivation/deletion/blocking revokes sessions immediately
    p.r = row.role;
    p.n = row.name || p.n;
  }
  c._s = p;
  return p;
}
const isStaff = (s) => !!s && ['owner', 'admin', 'approver'].includes(s.r);
const isAdmin = (s) => !!s && (s.r === 'owner' || s.r === 'admin');

async function authResult(c, r, e, n, method, picture) {
  const token = await issueToken(c.env, r, e, n, method);
  return json({ token, user: { role: r, email: e, name: n, method, picture: picture || null }, expiresAt: Date.now() + (r === 'user' ? USER_TOKEN_TTL : TOKEN_TTL) });
}

async function authPassword(c) {
  const { env } = c;
  if (!env.ADMIN_PASSWORD) fail(400, '비밀번호 로그인이 설정되지 않았습니다.');
  if (!(await hit(env, 'login:' + (await sha256(c.ip)), 10, 900000))) fail(429, '로그인 시도가 너무 많습니다. 15분 후 다시 시도하세요.');
  const b = await readJson(c.req, 4096);
  const ok = timingSafeEq(await sha256('pw:' + str(b.password, 200)), await sha256('pw:' + env.ADMIN_PASSWORD));
  if (!ok) {
    await audit(c, 'auth.login', 'user', 'owner', { method: 'password' }, false, 'owner');
    fail(401, '비밀번호가 올바르지 않습니다.');
  }
  await audit(c, 'auth.login', 'user', 'owner', { method: 'password' }, true, 'owner', 'owner');
  return authResult(c, 'owner', 'owner', '최고 관리자', 'password');
}

async function authEmailStart(c) {
  const { env } = c;
  if (!mailEnabled(env)) fail(400, '이메일 인증이 설정되지 않았습니다 (RESEND_API_KEY).');
  const b = await readJson(c.req, 4096);
  const email = normEmail(b.email);
  if (!email) fail(400, '이메일 형식이 올바르지 않습니다.');
  if (!(await hit(env, 'otp-ip:' + (await sha256(c.ip)), 8, 900000))) fail(429, '요청이 너무 많습니다. 잠시 후 다시 시도하세요.');
  if (!(await hit(env, 'otp-mail:' + email, 3, 600000))) fail(429, '이 이메일로 너무 자주 요청했습니다. 10분 후 다시 시도하세요.');
  const ap = await env.DB.prepare('SELECT email, name, active FROM approvers WHERE email=?').bind(email).first();
  const out = { ok: true, message: localize(c.lang, '등록된 승인자라면 인증 코드가 발송됩니다. (10분 유효)') };
  if (!ap || !ap.active) {
    await audit(c, 'auth.otp_request', 'user', email, { registered: false }, false, email);
    return json(out);
  }
  const code = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
  await env.DB.prepare('INSERT INTO otp (email,code_hash,exp,attempts,created_at) VALUES (?,?,?,0,?) ON CONFLICT(email) DO UPDATE SET code_hash=excluded.code_hash, exp=excluded.exp, attempts=0, created_at=excluded.created_at')
    .bind(email, await sha256(`otp:${email}:${code}:${secretKey(env)}`), Date.now() + 600000, Date.now()).run();
  const codeBox = `<p style="font-size:30px;letter-spacing:6px;font-weight:700;color:#0072a3">${code}</p>`;
  const sent = await sendMail(env, [email], `[KRVCF App Center] 로그인 인증 코드 / Sign-in code: ${code}`,
    mailLayout('승인자 로그인 인증 코드', `<p>${esc(ap.name || email)}님, 아래 코드를 10분 안에 입력하세요.</p>${codeBox}<p style="color:#737373;font-size:12px">본인이 요청하지 않았다면 이 메일을 무시하세요.</p>`, env,
      'Approver sign-in code', `<p>Hi ${esc(ap.name || email)}, enter this code within 10 minutes.</p>${codeBox}<p style="color:#737373;font-size:12px">If you didn't request this, you can ignore this email.</p>`));
  await audit(c, 'auth.otp_request', 'user', email, { registered: true, sent }, sent, email);
  if (!sent) fail(502, '인증 메일 발송에 실패했습니다. 관리자에게 문의하세요.');
  if (env.MAIL_MODE === 'console') out.devCode = code;
  return json(out);
}

async function authEmailVerify(c) {
  const { env } = c;
  const b = await readJson(c.req, 4096);
  const email = normEmail(b.email);
  const code = str(b.code, 10).replace(/\D/g, '');
  if (!email || code.length !== 6) fail(400, '이메일과 6자리 코드를 입력하세요.');
  const row = await env.DB.prepare('SELECT * FROM otp WHERE email=?').bind(email).first();
  if (!row || row.exp < Date.now()) { await audit(c, 'auth.login', 'user', email, { method: 'email', reason: 'expired' }, false, email); fail(401, '코드가 만료되었습니다. 다시 요청하세요.'); }
  if (row.attempts >= 5) { await audit(c, 'auth.login', 'user', email, { method: 'email', reason: 'too_many_attempts' }, false, email); fail(429, '시도 횟수를 초과했습니다. 코드를 다시 요청하세요.'); }
  if (!timingSafeEq(await sha256(`otp:${email}:${code}:${secretKey(env)}`), row.code_hash)) {
    await env.DB.prepare('UPDATE otp SET attempts=attempts+1 WHERE email=?').bind(email).run();
    await audit(c, 'auth.login', 'user', email, { method: 'email', reason: 'wrong_code' }, false, email);
    fail(401, '코드가 올바르지 않습니다.');
  }
  await env.DB.prepare('DELETE FROM otp WHERE email=?').bind(email).run();
  return loginApprover(c, email, null, 'email');
}

let GOOGLE_KEYS = { keys: null, exp: 0 };
async function googleKeys() {
  if (GOOGLE_KEYS.keys && GOOGLE_KEYS.exp > Date.now()) return GOOGLE_KEYS.keys;
  const r = await fetch('https://www.googleapis.com/oauth2/v3/certs');
  if (!r.ok) fail(502, 'Google 공개키를 가져오지 못했습니다.');
  const j = await r.json();
  const m = (r.headers.get('cache-control') || '').match(/max-age=(\d+)/);
  GOOGLE_KEYS = { keys: j.keys, exp: Date.now() + (m ? Number(m[1]) * 1000 : 3600000) };
  return j.keys;
}
async function authGoogle(c) {
  const { env } = c;
  if (!env.GOOGLE_CLIENT_ID) fail(400, 'Google 로그인이 설정되지 않았습니다 (GOOGLE_CLIENT_ID).');
  if (!(await hit(env, 'gl:' + (await sha256(c.ip)), 20, 900000))) fail(429, '요청이 너무 많습니다.');
  const b = await readJson(c.req, 16 * 1024);
  const parts = String(b.credential || '').split('.');
  if (parts.length !== 3) fail(400, 'Google 인증 정보가 올바르지 않습니다.');
  let hdr, pl;
  try { hdr = JSON.parse(dec(b64uDec(parts[0]))); pl = JSON.parse(dec(b64uDec(parts[1]))); } catch (_) { fail(400, 'Google 토큰 형식 오류'); }
  const jwk = (await googleKeys()).find((k) => k.kid === hdr.kid);
  if (!jwk || hdr.alg !== 'RS256') fail(401, 'Google 서명 키를 찾을 수 없습니다.');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64uDec(parts[2]), enc(parts[0] + '.' + parts[1]));
  const email = normEmail(pl.email);
  const reason = !valid ? 'bad_signature'
    : !['accounts.google.com', 'https://accounts.google.com'].includes(pl.iss) ? 'bad_issuer'
      : pl.aud !== env.GOOGLE_CLIENT_ID ? 'bad_audience'
        : !pl.exp || pl.exp * 1000 < Date.now() ? 'expired'
          : !pl.email_verified || !email ? 'email_not_verified' : null;
  if (reason) { await audit(c, 'auth.login', 'user', email || '-', { method: 'google', reason }, false, email || 'unknown'); fail(401, 'Google 인증에 실패했습니다.'); }
  return loginGoogle(c, email, str(pl.name, 80) || null, isHttps(pl.picture) ? str(pl.picture, 500) : null, 'google');
}

// Local development only: impersonate a Google account (DEV_LOGIN=true in .dev.vars, `wrangler dev`)
function devLoginOn(c) {
  // never active in CI deployments: they always set VERSION to the commit SHA
  return c.env.DEV_LOGIN === 'true' && (!c.env.VERSION || c.env.VERSION === 'dev');
}
async function authDev(c) {
  if (!devLoginOn(c)) fail(404, '개발용 로그인이 비활성화되어 있습니다.');
  const b = await readJson(c.req, 4096);
  const email = normEmail(b.email);
  if (!email) fail(400, '이메일 형식이 올바르지 않습니다.');
  return loginGoogle(c, email, str(b.name, 80) || email.split('@')[0], null, 'dev');
}

// Google sign-in: registered approvers get a staff session, everyone else a creator (`user`) session.
async function loginGoogle(c, email, name, picture, method) {
  const { env } = c;
  const now = Date.now();
  const u = await env.DB.prepare('SELECT * FROM users WHERE email=?').bind(email).first();
  if (u && u.blocked) {
    await audit(c, 'auth.login', 'user', email, { method, reason: 'blocked' }, false, email);
    fail(403, '차단된 계정입니다. 관리자에게 문의하세요.');
  }
  await env.DB.prepare(`INSERT INTO users (email,name,picture,created_at,last_login,login_count) VALUES (?,?,?,?,?,1)
    ON CONFLICT(email) DO UPDATE SET name=COALESCE(excluded.name, users.name), picture=COALESCE(excluded.picture, users.picture), last_login=excluded.last_login, login_count=users.login_count+1`)
    .bind(email, name, picture, now, now).run();
  const ap = await env.DB.prepare('SELECT * FROM approvers WHERE email=?').bind(email).first();
  if (ap && ap.active) return loginApprover(c, email, name, method, picture); // (blocked accounts were refused above)
  await audit(c, 'auth.login', 'user', email, { method, role: 'user', first: !u }, true, email, 'user');
  return authResult(c, 'user', email, (u && u.name) || name || email, method, picture || (u && u.picture));
}

async function loginApprover(c, email, name, method, picture) {
  const { env } = c;
  const ap = await env.DB.prepare('SELECT * FROM approvers WHERE email=?').bind(email).first();
  if (!ap || !ap.active) {
    await audit(c, 'auth.login', 'user', email, { method, reason: ap ? 'inactive' : 'not_registered' }, false, email);
    fail(403, `${email} 은(는) 등록된 승인자가 아닙니다. 관리자에게 승인자 등록을 요청하세요.`);
  }
  await env.DB.prepare('UPDATE approvers SET last_login=?, last_method=?, login_count=login_count+1, name=COALESCE(name, ?) WHERE email=?')
    .bind(Date.now(), method, name, email).run();
  await audit(c, 'auth.login', 'user', email, { method }, true, email, ap.role);
  return authResult(c, ap.role, email, ap.name || name || email, method, picture);
}

async function authMe(c) {
  const s = await session(c);
  if (!s) fail(401, '로그인이 필요합니다.');
  const u = s.r === 'owner' ? null : await c.env.DB.prepare('SELECT picture FROM users WHERE email=?').bind(s.e).first();
  return json({ user: { role: s.r, email: s.e, name: s.n, method: s.m, picture: (u && u.picture) || null }, expiresAt: s.exp });
}
async function authLogout(c) {
  const s = await session(c);
  if (s) await audit(c, 'auth.logout', 'user', s.e, {});
  return json({ ok: true });
}

/* ───────────────────────── v9: notifications · favorites · replies · change review · link health · share ───────────────────────── */
async function notify(c, emails, kind, appId, data) {
  const to = [...new Set((emails || []).filter(Boolean))];
  if (!to.length) return;
  const now = Date.now();
  const d = JSON.stringify(data || {});
  try {
    await c.env.DB.batch(to.map((e) => c.env.DB.prepare('INSERT INTO notifications (email,kind,app_id,data,ts) VALUES (?,?,?,?,?)').bind(e, kind, appId || null, d, now)));
  } catch (e) { console.error('notify', e); } // notifications must never break the main action
}
async function notifyStaff(c, kind, appId, data, roles = ['owner', 'admin', 'approver']) {
  const { results } = await c.env.DB.prepare(`SELECT email FROM approvers WHERE active=1 AND role IN (${roles.map(() => '?').join(',')})`).bind(...roles).all();
  // the password super admin has no approvers row; its session email is the pseudo address 'owner'
  await notify(c, [...results.map((r) => r.email), ...(roles.includes('owner') ? ['owner'] : [])], kind, appId, data);
}
const safeJson = (t) => { try { return JSON.parse(t || '{}'); } catch (_) { return {}; } };
async function myNotifications(c, s) {
  const limit = Math.min(Math.max(Number(c.url.searchParams.get('limit')) || 30, 1), 100);
  const [list, un] = await c.env.DB.batch([
    c.env.DB.prepare('SELECT id, kind, app_id, data, ts, read_at FROM notifications WHERE email=? ORDER BY id DESC LIMIT ?').bind(s.e, limit),
    c.env.DB.prepare('SELECT COUNT(*) AS n FROM notifications WHERE email=? AND read_at IS NULL').bind(s.e),
  ]);
  return json({
    unread: un.results[0].n,
    items: list.results.map((n) => ({ id: n.id, kind: n.kind, app: n.app_id, data: safeJson(n.data), ts: n.ts, read: !!n.read_at })),
  }, 200, { 'cache-control': 'no-store' });
}
async function readNotifications(c, s) {
  const b = await readJson(c.req, 8192);
  const now = Date.now();
  if (b.all) await c.env.DB.prepare('UPDATE notifications SET read_at=? WHERE email=? AND read_at IS NULL').bind(now, s.e).run();
  else {
    const ids = (Array.isArray(b.ids) ? b.ids : []).map(Number).filter(Number.isInteger).slice(0, 100);
    if (ids.length) await c.env.DB.prepare(`UPDATE notifications SET read_at=? WHERE email=? AND read_at IS NULL AND id IN (${ids.map(() => '?').join(',')})`).bind(now, s.e, ...ids).run();
  }
  return json({ ok: true });
}

async function myFavs(c, s) {
  const { results } = await c.env.DB.prepare('SELECT f.app_id FROM user_favs f JOIN apps a ON a.id=f.app_id WHERE f.email=? ORDER BY f.ts DESC').bind(s.e).all();
  return json({ ids: results.map((r) => r.app_id) });
}
// body: { add: [ids], remove: [ids] } → returns the account's full list
async function setFavs(c, s) {
  const b = await readJson(c.req, 16 * 1024);
  const clean = (a) => (Array.isArray(a) ? a : []).filter((x) => typeof x === 'string' && /^[a-z0-9]{6,16}$/.test(x)).slice(0, 200);
  const add = clean(b.add), remove = clean(b.remove);
  const now = Date.now();
  const st = [];
  for (const id of add) st.push(c.env.DB.prepare('INSERT OR IGNORE INTO user_favs (email,app_id,ts) SELECT ?,?,? WHERE EXISTS (SELECT 1 FROM apps WHERE id=?)').bind(s.e, id, now, id));
  for (const id of remove) st.push(c.env.DB.prepare('DELETE FROM user_favs WHERE email=? AND app_id=?').bind(s.e, id));
  if (st.length) await c.env.DB.batch(st);
  return myFavs(c, s);
}

async function replyComment(c, s, id, cid) {
  const row = await findApp(c.env, id);
  if (!isAdmin(s) && !isOwnerSession(s, row)) fail(403, '이 앱의 소유자만 관리할 수 있습니다.');
  const cm = await c.env.DB.prepare('SELECT * FROM comments WHERE id=? AND app_id=?').bind(cid, id).first();
  if (!cm) fail(404, '리뷰를 찾을 수 없습니다.');
  const b = await readJson(c.req, 8192);
  if (typeof b.reply !== 'string') fail(400, '요청 형식이 올바르지 않습니다.');
  const reply = str(b.reply, 1000) || null;
  await c.env.DB.prepare('UPDATE comments SET reply=?, reply_ts=? WHERE id=?').bind(reply, reply ? Date.now() : null, cid).run();
  await audit(c, reply ? 'app.reply' : 'app.reply_delete', 'app', id, { name: row.name, comment: cid, length: reply ? reply.length : 0 });
  return json({ ok: true });
}

// Source of a specific version, for change review (owner / approver+)
async function versionSource(c, id, ver) {
  const row = await findApp(c.env, id);
  if ((await accessLevel(c, row)) === 0) fail(403, '소유자 또는 관리자만 소스를 볼 수 있습니다.');
  const v = await c.env.DB.prepare('SELECT * FROM app_versions WHERE app_id=? AND version=?').bind(id, ver).first();
  if (!v) fail(404, '해당 버전을 찾을 수 없습니다.');
  const html = v.type === 'html' ? await c.env.HTML.get(`html:${id}:v${ver}`) : null;
  if (v.type === 'html' && html === null) fail(404, '해당 버전의 소스가 없습니다.');
  return json({ version: ver, type: v.type, url: v.url || null, html, ts: v.ts, note: v.note || null }, 200, { 'cache-control': 'no-store' });
}

// Link health: HEAD (fallback GET) with a short timeout. 401/403/429 still mean "reachable".
async function probe(url) {
  const once = async (method) => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 8000);
    try {
      const r = await fetch(url, { method, redirect: 'follow', signal: ctl.signal, headers: { 'user-agent': 'KRVCF-AppCenter-LinkCheck/1.0 (+https://app.krvcf.com)' } });
      return r.status;
    } finally { clearTimeout(t); }
  };
  try {
    let st = await once('HEAD');
    if (st === 405 || st === 501 || st === 400) st = await once('GET');
    const ok = st < 400 || [401, 403, 429].includes(st);
    return { ok, error: ok ? null : `HTTP ${st}` };
  } catch (e) {
    const msg = String((e && e.message) || e);
    // limits of the Workers runtime itself say nothing about the target site
    if (/subrequest|internal error|Too many|exceeded/i.test(msg)) return { ok: null, error: msg.slice(0, 120) };
    return { ok: false, error: e && e.name === 'AbortError' ? 'timeout' : msg.slice(0, 120) };
  }
}
const LINK_FAILS_TO_ALERT = 2; // consecutive failed checks before an app is marked unreachable
async function checkLinks(c, limit, manual, onlyId) {
  const { env } = c;
  const { results } = onlyId
    ? await env.DB.prepare("SELECT * FROM apps WHERE id=? AND type='link'").bind(onlyId).all()
    : await env.DB.prepare("SELECT * FROM apps WHERE type='link' AND status IN ('approved','pending') ORDER BY COALESCE(link_checked_at,0) ASC LIMIT ?").bind(limit).all();
  if (onlyId && !results.length) fail(400, '링크 앱만 점검할 수 있습니다.');
  const out = [];
  const deadline = Date.now() + (manual ? 25000 : 20000); // keep requests and cron runs short
  for (let i = 0; i < results.length && Date.now() < deadline; i += 5) {
    const chunk = results.slice(i, i + 5);
    const probes = await Promise.all(chunk.map((a) => probe(a.url)));
    for (let j = 0; j < chunk.length; j++) {
      const a = chunk[j], r = probes[j];
      if (r.ok === null) { out.push({ id: a.id, name: a.name, status: 'unknown', error: r.error }); continue; }
      const fails = r.ok ? 0 : (a.link_fails || 0) + 1;
      const st = r.ok ? 'ok' : fails >= LINK_FAILS_TO_ALERT ? 'broken' : a.link_status || 'ok';
      await env.DB.prepare('UPDATE apps SET link_status=?, link_checked_at=?, link_error=?, link_fails=? WHERE id=?').bind(st, Date.now(), r.error, fails, a.id).run();
      if (st === 'broken' && a.link_status !== 'broken') {
        await notify(c, [a.owner_email], 'link.broken', a.id, { name: a.name, error: r.error });
        await notifyStaff(c, 'link.broken', a.id, { name: a.name, error: r.error }, ['owner', 'admin']);
      }
      if (st === 'ok' && a.link_status === 'broken') await notify(c, [a.owner_email], 'link.recovered', a.id, { name: a.name });
      out.push({ id: a.id, name: a.name, status: r.ok ? 'ok' : 'failed', marked: st, fails, error: r.error });
    }
  }
  if (manual) {
    await audit(c, 'link.check', 'app', onlyId || null, { checked: out.length, failed: out.filter((x) => x.status === 'failed').length });
    return json({ results: out });
  }
  return out;
}

// Share page with Open Graph tags (KakaoTalk / Slack / Teams previews), then forwards to the SPA
async function sharePage(c, id) {
  const row = await c.env.DB.prepare('SELECT * FROM apps WHERE id=?').bind(id).first();
  const site = siteUrl(c.env);
  const live = !!row && row.status === 'approved';
  const target = live ? `${site}/#/app/${id}` : site;
  const title = live ? `${row.name} — KRVCF App Center` : 'KRVCF App Center';
  const desc = live ? String(row.description || '').slice(0, 180) : 'VCF 커뮤니티 미니 앱 · HTML 시뮬레이터 공유 플랫폼';
  const img = live && isHttps(row.thumbnail) ? row.thumbnail : `${site}/icons/og.png`;
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(title)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta property="og:type" content="website"><meta property="og:site_name" content="KRVCF App Center">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}"><meta property="og:url" content="${esc(`${c.url.origin}/s/${id}`)}">
<meta name="twitter:card" content="summary_large_image"><meta name="description" content="${esc(desc)}">
<meta http-equiv="refresh" content="0;url=${esc(target)}"><link rel="canonical" href="${esc(target)}">
</head><body style="font-family:system-ui,sans-serif;padding:24px"><a href="${esc(target)}">${esc(title)}</a><script>location.replace(${JSON.stringify(target)})</script></body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=60', 'x-robots-tag': 'noindex' } });
}

/* ───────────────────────── Owner Studio (/api/my/*) ───────────────────────── */
async function myApps(c, s) {
  const { env } = c;
  const since = kstDay(Date.now() - 6 * 86400000);
  const { results } = await env.DB.prepare(
    `SELECT a.*,
       (SELECT COUNT(*) FROM comments WHERE app_id=a.id AND hidden=0) AS n_comments,
       (SELECT COUNT(*) FROM feedback WHERE app_id=a.id) AS n_feedback,
       (SELECT COUNT(*) FROM reports WHERE app_id=a.id AND status='open') AS n_reports,
       (SELECT COALESCE(SUM(views),0) FROM app_daily WHERE app_id=a.id AND day>=?) AS w_views,
       (SELECT COALESCE(SUM(runs),0) FROM app_daily WHERE app_id=a.id AND day>=?) AS w_runs
     FROM apps a WHERE a.owner_email=? ORDER BY a.updated_at DESC`
  ).bind(since, since, s.e).all();
  const u = s.r === 'owner' ? null : await env.DB.prepare('SELECT name, picture, created_at, login_count FROM users WHERE email=?').bind(s.e).first();
  return json({
    me: { email: s.e, name: s.n, role: s.r, picture: (u && u.picture) || null, since: (u && u.created_at) || null },
    apps: results.map((r) => ({ ...pub(r, 1), comments: r.n_comments, feedback: r.n_feedback, openReports: r.n_reports, weekViews: r.w_views, weekRuns: r.w_runs })),
  });
}

async function myAppDetail(c, s, id) {
  const { env } = c;
  const row = await findApp(env, id);
  if (!isAdmin(s) && !isOwnerSession(s, row)) fail(403, '이 앱의 소유자만 관리할 수 있습니다.');
  const since = kstDay(Date.now() - 29 * 86400000);
  const [daily, fb, rv, cm, rp, ver] = await env.DB.batch([
    env.DB.prepare('SELECT day, views, runs FROM app_daily WHERE app_id=? AND day>=? ORDER BY day').bind(id, since),
    env.DB.prepare('SELECT id, message, created_at FROM feedback WHERE app_id=? ORDER BY id DESC LIMIT 100').bind(id),
    env.DB.prepare('SELECT ts, actor, action, note FROM app_reviews WHERE app_id=? ORDER BY id DESC LIMIT 50').bind(id),
    env.DB.prepare('SELECT id, nickname, stars, body, ts, hidden, reply, reply_ts FROM comments WHERE app_id=? ORDER BY ts DESC LIMIT 100').bind(id),
    env.DB.prepare("SELECT reason, COUNT(*) AS n FROM reports WHERE app_id=? AND status='open' GROUP BY reason").bind(id),
    env.DB.prepare('SELECT version, ts, note, size, url FROM app_versions WHERE app_id=? ORDER BY version DESC').bind(id),
  ]);
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const { results: rs } = await env.DB.prepare('SELECT stars, COUNT(*) AS n FROM ratings WHERE app_id=? GROUP BY stars').bind(id).all();
  for (const r of rs) dist[r.stars] = r.n;
  return json({
    app: pub(row, 1), owner: row.owner_email || null,
    daily: daily.results, feedback: fb.results, history: rv.results, distribution: dist,
    comments: cm.results.map((x) => ({ ...x, hidden: !!x.hidden })),
    openReports: rp.results, versions: ver.results.map((v) => ({ ...v, current: v.version === (row.version || 1) })),
  });
}

async function claimApps(c, s) {
  if (s.r === 'owner') fail(400, '연결할 앱 ID와 소유 키를 입력하세요.');
  if (!(await hit(c.env, 'claim:' + s.e, 30, 3600000))) fail(429, '요청이 너무 많습니다.');
  const b = await readJson(c.req, 64 * 1024);
  const items = Array.isArray(b.items) ? b.items.slice(0, 50) : [];
  if (!items.length) fail(400, '연결할 앱 ID와 소유 키를 입력하세요.');
  const out = [];
  for (const it of items) {
    const id = typeof it?.id === 'string' && /^[a-z0-9]{6,16}$/.test(it.id) ? it.id : null;
    const key = typeof it?.key === 'string' ? it.key.trim().slice(0, 200) : '';
    if (!id || !key) { out.push({ id: it?.id || null, result: 'invalid' }); continue; }
    const row = await c.env.DB.prepare('SELECT * FROM apps WHERE id=?').bind(id).first();
    if (!row) { out.push({ id, result: 'missing' }); continue; }
    if (row.owner_email) { out.push(row.owner_email === s.e ? { id, name: row.name, result: 'already' } : { id, result: 'owned' }); continue; }
    if (!timingSafeEq(await sha256(key), row.owner_key_hash)) {
      await audit(c, 'app.claim', 'app', id, { reason: 'bad_key' }, false, s.e, s.r);
      out.push({ id, result: 'bad_key' }); continue;
    }
    await linkOwner(c, s, row);
    out.push({ id, name: row.name, result: 'linked' });
  }
  return json({ results: out });
}

/* ───────────────────────── Staff / Admin ───────────────────────── */
async function adminRoute(c, s, sub, m) {
  const { env } = c;
  const needAdmin = () => { if (!isAdmin(s)) fail(403, '관리자 권한이 필요합니다.'); };
  let mm;

  // approver or higher
  if (sub === 'overview' && m === 'GET') return adminOverview(c, s);
  if ((mm = sub.match(new RegExp(`^apps/${ID_RE}/status$`))) && m === 'POST') return reviewApp(c, s, mm[1]);
  if (sub === 'analytics' && m === 'GET') return analytics(c);
  if (sub === 'reports' && m === 'GET') return adminReports(c);
  if ((mm = sub.match(/^reports\/(\d+)$/)) && m === 'POST') return handleReport(c, s, Number(mm[1]));
  if (sub === 'comments' && m === 'GET') return adminComments(c);
  if ((mm = sub.match(/^comments\/(\d+)$/)) && m === 'POST') return moderateComment(c, Number(mm[1]));
  if (sub === 'feedback' && m === 'GET') {
    const { results } = await env.DB.prepare('SELECT f.id, f.app_id, f.message, f.ip, f.created_at, a.name AS app_name FROM feedback f LEFT JOIN apps a ON a.id=f.app_id ORDER BY f.id DESC LIMIT 500').all();
    return json({ feedback: results });
  }

  // admin
  if ((mm = sub.match(new RegExp(`^apps/${ID_RE}/check-link$`))) && m === 'POST') return checkLinks(c, 1, true, mm[1]); // approvers too
  needAdmin();
  if (sub === 'users' && m === 'GET') return adminUsers(c);
  if (sub === 'check-links' && m === 'POST') return checkLinks(c, 50, true);
  if ((mm = sub.match(/^users\/([^/]+)$/)) && m === 'POST') return blockUser(c, s, decodeURIComponent(mm[1]));
  if ((mm = sub.match(new RegExp(`^apps/${ID_RE}/owner$`))) && m === 'POST') return setAppOwner(c, mm[1]);
  if ((mm = sub.match(new RegExp(`^apps/${ID_RE}/feature$`))) && m === 'POST') {
    const row = await findApp(env, mm[1]);
    const b = await readJson(c.req, 1024);
    await env.DB.prepare('UPDATE apps SET featured=? WHERE id=?').bind(b.featured ? 1 : 0, mm[1]).run();
    await audit(c, b.featured ? 'app.feature' : 'app.unfeature', 'app', mm[1], { name: row.name });
    return json({ ok: true });
  }
  if ((mm = sub.match(/^feedback\/(\d+)$/)) && m === 'DELETE') {
    const f = await env.DB.prepare('SELECT * FROM feedback WHERE id=?').bind(Number(mm[1])).first();
    await env.DB.prepare('DELETE FROM feedback WHERE id=?').bind(Number(mm[1])).run();
    await audit(c, 'feedback.delete', 'feedback', mm[1], f ? { app: f.app_id, message: f.message.slice(0, 200) } : {});
    return json({ ok: true });
  }
  if (sub === 'visits' && m === 'GET') {
    const { results } = await env.DB.prepare('SELECT ts, ip, country, path, ua FROM visits ORDER BY id DESC LIMIT 1000').all();
    return json({ visits: results });
  }
  if (sub === 'visits' && m === 'DELETE') {
    await env.DB.prepare('DELETE FROM visits').run();
    await audit(c, 'visits.clear', 'system', null, {});
    return json({ ok: true });
  }
  if (sub === 'audit' && m === 'GET') return auditList(c);
  if (sub === 'reset-stats' && m === 'POST') {
    await env.DB.batch([
      env.DB.prepare('UPDATE apps SET runs=0, views=0, rating_sum=0, rating_count=0'),
      env.DB.prepare('DELETE FROM daily'),
      env.DB.prepare('DELETE FROM daily_seen'),
      env.DB.prepare('DELETE FROM app_daily'),
      env.DB.prepare('DELETE FROM visitors'),
      env.DB.prepare('DELETE FROM presence'),
      env.DB.prepare('DELETE FROM ratings'),
      env.DB.prepare("UPDATE counters SET v=0 WHERE k='visits'"),
    ]);
    await audit(c, 'stats.reset', 'system', null, {});
    return json({ ok: true });
  }
  if (sub === 'settings' && m === 'GET') return json({ settings: await getSettings(env), env: integrationStatus(env) });
  if (sub === 'settings' && m === 'PUT') return saveSettings(c, s);
  if (sub.startsWith('ai')) {
    if (!isAdmin(s)) fail(403, '관리자 권한이 필요합니다.');
    if (sub === 'ai' && m === 'GET') return json({ ai: await aiPublicConfig(env) });
    if (sub === 'ai' && m === 'PUT') return saveAiConfig(c, s);
    if (sub === 'ai/models' && m === 'POST') return aiModels(c);
    if (sub === 'ai/test' && m === 'POST') return aiTest(c);
  }
  if (sub === 'approvers' && m === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM approvers ORDER BY role DESC, created_at').all();
    return json({ approvers: results });
  }
  if (sub === 'approvers' && m === 'POST') return upsertApprover(c, s, null);
  if ((mm = sub.match(/^approvers\/(.+)$/))) {
    const email = normEmail(decodeURIComponent(mm[1]));
    if (m === 'PUT') return upsertApprover(c, s, email);
    if (m === 'DELETE') return deleteApprover(c, s, email);
  }
  if ((mm = sub.match(/^comments\/(\d+)$/)) && m === 'DELETE') {
    const r = await env.DB.prepare('SELECT * FROM comments WHERE id=?').bind(Number(mm[1])).first();
    if (!r) fail(404, '리뷰를 찾을 수 없습니다.');
    await env.DB.prepare('DELETE FROM comments WHERE id=?').bind(r.id).run();
    await audit(c, 'comment.delete', 'comment', String(r.id), { app: r.app_id, body: r.body.slice(0, 200) });
    return json({ ok: true });
  }
  if (sub === 'test-webhook' && m === 'POST') {
    const ok = await webhook(c, 'test', { text: `[KRVCF App Center] 웹훅 테스트 / Webhook test — ${siteUrl(env)}` }, true);
    if (!ok) fail(502, '웹훅 전송에 실패했습니다. URL을 확인하세요.');
    return json({ ok: true });
  }
  if (sub === 'backup' && m === 'GET') return adminBackup(c);
  if (sub === 'restore' && m === 'POST') return adminRestore(c);
  if (sub === 'test-mail' && m === 'POST') {
    const to = s.r === 'owner' ? normEmail((await readJson(c.req, 1024)).email) : s.e;
    if (!to) fail(400, '수신 이메일을 입력하세요.');
    const ok = await sendMail(env, [to], '[KRVCF App Center] 테스트 메일 / Test email', mailLayout('테스트 메일', '<p>메일 발송 설정이 정상입니다.</p>', env, 'Test email', '<p>Email delivery is configured correctly.</p>'));
    await audit(c, 'mail.test', 'mail', to, {}, ok);
    if (!ok) fail(502, '메일 발송에 실패했습니다. RESEND_API_KEY / MAIL_FROM 도메인 인증을 확인하세요.');
    return json({ ok: true });
  }

  // GitHub patch / deploy
  if (sub === 'repo/status' && m === 'GET') return repoStatus(c);
  if (sub === 'repo/tree' && m === 'GET') return repoTree(c);
  if (sub === 'repo/runs' && m === 'GET') return repoRuns(c);
  if (sub === 'repo/patch' && m === 'POST') return repoPatch(c, s);
  if (sub === 'repo/rollback' && m === 'POST') return repoRollback(c, s);
  if (sub === 'repo/dispatch' && m === 'POST') return repoDispatch(c);
  fail(404, 'Not found');
}

async function adminOverview(c, s) {
  const { env } = c;
  const [apps, cnt, today, fbc, rep] = await env.DB.batch([
    env.DB.prepare('SELECT * FROM apps ORDER BY created_at DESC'),
    env.DB.prepare("SELECT v FROM counters WHERE k='visits'"),
    env.DB.prepare('SELECT uv AS n FROM daily WHERE day = ?').bind(kstDay()),
    env.DB.prepare('SELECT COUNT(*) AS n FROM feedback'),
    env.DB.prepare("SELECT COUNT(*) AS n FROM reports WHERE status='open'"),
  ]);
  const list = apps.results.map((r) => pub(r, 2));
  return json({
    me: { role: s.r, email: s.e, name: s.n },
    stats: {
      approved: list.filter((a) => a.status === 'approved').length,
      pending: list.filter((a) => a.status === 'pending').length,
      rejected: list.filter((a) => a.status === 'rejected').length,
      runs: list.reduce((t, a) => t + a.runs, 0),
      visits: (cnt.results[0] && cnt.results[0].v) || 0,
      todayVisitors: (today.results[0] && today.results[0].n) || 0,
      feedback: (fbc.results[0] && fbc.results[0].n) || 0,
      openReports: (rep.results[0] && rep.results[0].n) || 0,
    },
    apps: list,
  });
}

async function reviewApp(c, s, id) {
  const { env } = c;
  const row = await findApp(env, id);
  const b = await readJson(c.req, 8192);
  if (!['pending', 'approved', 'rejected'].includes(b.status)) fail(400, '상태 값이 올바르지 않습니다.');
  const note = str(b.note, 500) || null;
  if (b.status === 'rejected' && !note) fail(400, '반려 사유를 입력하세요.');
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("UPDATE apps SET status=?, review_note=?, reviewed_by=?, reviewed_at=?, updated_at=?, approved_version=CASE WHEN ?='approved' THEN version ELSE approved_version END WHERE id=?").bind(b.status, note, s.e, now, now, b.status, id),
    env.DB.prepare('INSERT INTO app_reviews (app_id,ts,actor,action,note) VALUES (?,?,?,?,?)').bind(id, now, s.e, b.status, note),
  ]);
  await audit(c, 'app.review', 'app', id, { name: row.name, from: row.status, to: b.status, note });
  if (row.owner_email && b.status !== 'pending' && b.status !== row.status) await notify(c, [row.owner_email], 'app.' + b.status, id, { name: row.name, note, by: s.n || s.e });
  if (b.status !== 'pending') c.ctx.waitUntil(webhook(c, 'decision', { app: id, text: `[KRVCF App Center] ${b.status === 'approved' ? '승인 / Approved' : '반려 / Rejected'}: ${row.name} — ${s.e}${note ? `\n${note}` : ''}\n${siteUrl(env)}/#/app/${id}` }));
  const st = await getSettings(env);
  if (row.author_email && st.notify_author === 'true' && b.status !== 'pending' && b.status !== row.status) {
    const ok = b.status === 'approved';
    const link = `${siteUrl(env)}/#/app/${id}`;
    const noteBox = note ? `<p style="background:#f5f6f7;padding:10px 12px;border-left:3px solid #0072a3">${esc(note)}</p>` : '';
    c.ctx.waitUntil(sendMail(env, [row.author_email], `[KRVCF App Center] '${row.name}' ${ok ? '승인 완료 / Approved' : '반려 / Not approved'}`,
      mailLayout(ok ? '앱이 승인되어 공개되었습니다' : '앱 등록이 반려되었습니다',
        `<p><b>${esc(row.name)}</b> 앱이 ${ok ? '승인되어 App Center에 공개되었습니다.' : '반려되었습니다.'}</p>${noteBox}<p><a href="${ok ? link : `${siteUrl(env)}/#/studio/${id}`}">${ok ? '앱 보기' : '내 앱 관리에서 수정 후 재제출'}</a></p>`, env,
        ok ? 'Your app has been approved' : 'Your app was not approved',
        `<p><b>${esc(row.name)}</b> ${ok ? 'is now published on App Center.' : 'was not approved.'}</p>${noteBox}<p><a href="${ok ? link : `${siteUrl(env)}/#/studio/${id}`}">${ok ? 'View app' : 'Edit and resubmit from My apps'}</a></p>`))
      .then((sent) => audit(c, 'mail.author_notice', 'app', id, { to: row.author_email, status: b.status }, sent)));
  }
  return json({ ok: true });
}

async function auditList(c) {
  const q = c.url.searchParams;
  const where = [];
  const args = [];
  if (q.get('action')) { where.push('action LIKE ?'); args.push(q.get('action').replace(/\*/g, '%') + (q.get('action').includes('*') ? '' : '%')); }
  if (q.get('actor')) { where.push('actor LIKE ?'); args.push('%' + q.get('actor') + '%'); }
  if (q.get('target')) { where.push('target_id = ?'); args.push(q.get('target')); }
  if (q.get('q')) { where.push('(detail LIKE ? OR target_id LIKE ? OR actor LIKE ?)'); const v = '%' + q.get('q') + '%'; args.push(v, v, v); }
  if (q.get('ok') === '0' || q.get('ok') === '1') { where.push('ok = ?'); args.push(Number(q.get('ok'))); }
  if (q.get('from')) { where.push('ts >= ?'); args.push(Number(q.get('from'))); }
  if (q.get('to')) { where.push('ts <= ?'); args.push(Number(q.get('to'))); }
  if (q.get('before')) { where.push('id < ?'); args.push(Number(q.get('before'))); }
  const limit = Math.min(Math.max(Number(q.get('limit')) || 200, 1), 2000);
  const sql = `SELECT * FROM audit_log ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC LIMIT ${limit}`;
  const { results } = await c.env.DB.prepare(sql).bind(...args).all();
  const { results: actions } = await c.env.DB.prepare('SELECT action, COUNT(*) AS n FROM audit_log GROUP BY action ORDER BY action').all();
  return json({ logs: results, actions });
}

async function saveSettings(c, s) {
  const b = await readJson(c.req, 16 * 1024);
  const before = await getSettings(c.env);
  const changed = {};
  const stmts = [];
  for (const k of Object.keys(DEFAULT_SETTINGS)) {
    if (!(k in b)) continue;
    let v = String(b[k] ?? '');
    if (['auto_approve', 'notify_submit', 'notify_author'].includes(k)) v = v === 'true' ? 'true' : 'false';
    if (k === 'audit_days') v = String(Math.min(Math.max(parseInt(v, 10) || 180, 7), 3650));
    if (k === 'visit_days') v = String(Math.min(Math.max(parseInt(v, 10) || 30, 1), 365));
    if (k === 'notice') v = v.slice(0, 300);
    if (k === 'webhook_url') { v = v.trim().slice(0, 500); if (v && !isHttps(v)) fail(400, '웹훅 URL은 https:// 주소여야 합니다.'); }
    if (k === 'webhook_events') v = v.split(',').map((x) => x.trim()).filter((x) => WEBHOOK_EVENTS.includes(x)).join(',');
    if (v === before[k]) continue;
    changed[k] = { from: before[k], to: v };
    stmts.push(c.env.DB.prepare('INSERT INTO settings (k,v,updated_at,updated_by) VALUES (?,?,?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v, updated_at=excluded.updated_at, updated_by=excluded.updated_by').bind(k, v, Date.now(), s.e));
  }
  if (stmts.length) await c.env.DB.batch(stmts);
  await audit(c, 'settings.update', 'settings', null, changed);
  return json({ settings: await getSettings(c.env) });
}

async function upsertApprover(c, s, emailParam) {
  const { env } = c;
  const b = await readJson(c.req, 4096);
  const email = emailParam || normEmail(b.email);
  if (!email) fail(400, '이메일 형식이 올바르지 않습니다.');
  const existing = await env.DB.prepare('SELECT * FROM approvers WHERE email=?').bind(email).first();
  if (emailParam && !existing) fail(404, '승인자를 찾을 수 없습니다.');
  if (!emailParam && existing) fail(409, '이미 등록된 이메일입니다.');
  const role = b.role === 'admin' ? 'admin' : b.role === 'approver' ? 'approver' : (existing ? existing.role : 'approver');
  if ((role === 'admin' || (existing && existing.role === 'admin')) && s.r !== 'owner') fail(403, '관리자 역할 부여·변경은 최고 관리자만 할 수 있습니다.');
  if (existing && email === s.e && (b.active === false || role !== existing.role)) fail(400, '본인의 역할·상태는 변경할 수 없습니다.');
  const name = 'name' in b ? str(b.name, 60) || null : existing ? existing.name : null;
  const active = 'active' in b ? (b.active ? 1 : 0) : existing ? existing.active : 1;
  if (existing) {
    await env.DB.prepare('UPDATE approvers SET name=?, role=?, active=? WHERE email=?').bind(name, role, active, email).run();
    await audit(c, 'approver.update', 'approver', email, { from: { role: existing.role, active: !!existing.active, name: existing.name }, to: { role, active: !!active, name } });
  } else {
    await env.DB.prepare('INSERT INTO approvers (email,name,role,active,created_at,created_by) VALUES (?,?,?,?,?,?)').bind(email, name, role, active, Date.now(), s.e).run();
    await audit(c, 'approver.create', 'approver', email, { role, name });
    if (b.invite && mailEnabled(env)) {
      const methods = [env.GOOGLE_CLIENT_ID ? 'Google 계정' : null, '이메일 인증 코드'].filter(Boolean).join(' 또는 ');
      const methodsEn = [env.GOOGLE_CLIENT_ID ? 'your Google account' : null, 'an email verification code'].filter(Boolean).join(' or ');
      c.ctx.waitUntil(sendMail(env, [email], '[KRVCF App Center] 승인자로 등록되었습니다 / You are now an approver',
        mailLayout('승인자 등록 안내', `<p>${esc(name || email)}님이 KRVCF App Center의 <b>${role === 'admin' ? '관리자' : '승인자'}</b>로 등록되었습니다.</p><p>${methods}로 로그인해 신규 앱 승인 업무를 진행할 수 있습니다.</p><p><a href="${siteUrl(env)}/#/admin">관리 콘솔 열기</a></p>`, env,
          'You have been added as an approver', `<p>${esc(name || email)}, you are now ${role === 'admin' ? 'an <b>admin</b>' : 'an <b>approver</b>'} on KRVCF App Center.</p><p>Sign in with ${methodsEn} to review new app submissions.</p><p><a href="${siteUrl(env)}/#/admin">Open the Admin Console</a></p>`))
        .then((ok) => audit(c, 'mail.invite', 'approver', email, {}, ok)));
    }
  }
  return json({ approver: await env.DB.prepare('SELECT * FROM approvers WHERE email=?').bind(email).first() });
}

async function deleteApprover(c, s, email) {
  const ex = await c.env.DB.prepare('SELECT * FROM approvers WHERE email=?').bind(email).first();
  if (!ex) fail(404, '승인자를 찾을 수 없습니다.');
  if (email === s.e) fail(400, '본인은 삭제할 수 없습니다.');
  if (ex.role === 'admin' && s.r !== 'owner') fail(403, '관리자 삭제는 최고 관리자만 할 수 있습니다.');
  await c.env.DB.prepare('DELETE FROM approvers WHERE email=?').bind(email).run();
  await audit(c, 'approver.delete', 'approver', email, { role: ex.role, name: ex.name });
  return json({ ok: true });
}

async function adminUsers(c) {
  const { results } = await c.env.DB.prepare(
    `SELECT u.*, (SELECT COUNT(*) FROM apps WHERE owner_email=u.email) AS apps,
       (SELECT COUNT(*) FROM apps WHERE owner_email=u.email AND status='approved') AS approved,
       (SELECT role FROM approvers WHERE email=u.email AND active=1) AS staff_role
     FROM users u ORDER BY COALESCE(u.last_login, u.created_at) DESC LIMIT 1000`
  ).all();
  return json({ users: results.map((u) => ({ ...u, blocked: !!u.blocked })) });
}
async function blockUser(c, s, email) {
  const e = normEmail(email);
  const u = e && (await c.env.DB.prepare('SELECT * FROM users WHERE email=?').bind(e).first());
  if (!u) fail(404, '사용자를 찾을 수 없습니다.');
  if (e === s.e) fail(400, '본인의 역할·상태는 변경할 수 없습니다.');
  const staff = await c.env.DB.prepare('SELECT role FROM approvers WHERE email=?').bind(e).first();
  if (staff && s.r !== 'owner') fail(403, '승인자·관리자 계정은 최고 관리자만 차단할 수 있습니다.');
  const b = await readJson(c.req, 4096);
  const blocked = !!b.blocked;
  const note = str(b.note, 300) || null;
  await c.env.DB.prepare('UPDATE users SET blocked=?, blocked_note=? WHERE email=?').bind(blocked ? 1 : 0, blocked ? note : null, e).run();
  await audit(c, blocked ? 'user.block' : 'user.unblock', 'user', e, { note });
  return json({ ok: true });
}
async function setAppOwner(c, id) {
  const row = await findApp(c.env, id);
  const b = await readJson(c.req, 4096);
  const e = b.email ? normEmail(b.email) : null;
  if (b.email && !e) fail(400, '이메일 형식이 올바르지 않습니다.');
  if (e) {
    const u = await c.env.DB.prepare('SELECT blocked FROM users WHERE email=?').bind(e).first();
    if (!u || u.blocked) fail(400, '한 번 이상 로그인한 활성 계정만 소유자로 지정할 수 있습니다.');
  }
  await c.env.DB.prepare('UPDATE apps SET owner_email=? WHERE id=?').bind(e, id).run();
  await audit(c, 'app.owner_change', 'app', id, { name: row.name, from: row.owner_email || null, to: e });
  return json({ ok: true });
}

async function adminBackup(c) {
  const { env } = c;
  const [apps, ratings, fb, cnt, ap, rv, st, dly, adly, cm, rp, av, us, fv] = await env.DB.batch([
    env.DB.prepare('SELECT * FROM apps'),
    env.DB.prepare('SELECT * FROM ratings'),
    env.DB.prepare('SELECT * FROM feedback'),
    env.DB.prepare('SELECT * FROM counters'),
    env.DB.prepare('SELECT * FROM approvers'),
    env.DB.prepare('SELECT * FROM app_reviews'),
    env.DB.prepare('SELECT * FROM settings'),
    env.DB.prepare('SELECT * FROM daily'),
    env.DB.prepare('SELECT * FROM app_daily'),
    env.DB.prepare('SELECT * FROM comments'),
    env.DB.prepare('SELECT * FROM reports'),
    env.DB.prepare('SELECT * FROM app_versions'),
    env.DB.prepare('SELECT * FROM users'),
    env.DB.prepare('SELECT * FROM user_favs'),
  ]);
  const html = {};
  const htmlVersions = {};
  for (const a of apps.results) if (a.type === 'html') html[a.id] = await env.HTML.get('html:' + a.id);
  for (const v of av.results) {
    if (v.type !== 'html') continue;
    const h = await env.HTML.get(`html:${v.app_id}:v${v.version}`);
    if (h !== null) htmlVersions[`${v.app_id}:v${v.version}`] = h;
  }
  await audit(c, 'backup.export', 'system', null, { apps: apps.results.length });
  return json({
    version: 2, exportedAt: new Date().toISOString(), apps: apps.results, html, ratings: ratings.results, feedback: fb.results,
    counters: cnt.results, approvers: ap.results, reviews: rv.results, settings: st.results, daily: dly.results, appDaily: adly.results, comments: cm.results, reports: rp.results, versions: av.results, users: us.results, favs: fv.results, htmlVersions,
  });
}

async function adminRestore(c) {
  const { env } = c;
  const b = await readJson(c.req, 95 * 1024 * 1024);
  if (![1, 2].includes(b.version) || !Array.isArray(b.apps)) fail(400, '백업 파일 형식이 올바르지 않습니다.');
  const stmts = [];
  for (const a of b.apps) {
    stmts.push(env.DB.prepare(
      `INSERT OR REPLACE INTO apps (id,type,name,url,category,description,thumbnail,author_name,author_email,owner_key_hash,status,review_note,featured,views,runs,rating_sum,rating_count,size,created_at,updated_at,reviewed_by,reviewed_at,tags,version,changelog,owner_email,approved_version,demo_url,access_guide,access_private,screenshots)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(a.id, a.type, a.name, a.url, a.category, a.description, a.thumbnail, a.author_name, a.author_email, a.owner_key_hash, a.status, a.review_note,
      a.featured || 0, a.views || 0, a.runs || 0, a.rating_sum || 0, a.rating_count || 0, a.size || 0, a.created_at, a.updated_at, a.reviewed_by || null, a.reviewed_at || null, a.tags || '', a.version || 1, a.changelog || null, a.owner_email || null, a.approved_version || null, a.demo_url || null, a.access_guide || null, a.access_private ? 1 : 0, a.screenshots || null));
  }
  for (const r of b.ratings || []) stmts.push(env.DB.prepare('INSERT OR REPLACE INTO ratings (app_id,voter,stars,created_at) VALUES (?,?,?,?)').bind(r.app_id, r.voter, r.stars, r.created_at));
  for (const f of b.feedback || []) stmts.push(env.DB.prepare('INSERT OR REPLACE INTO feedback (id,app_id,message,ip,created_at) VALUES (?,?,?,?,?)').bind(f.id, f.app_id, f.message, f.ip, f.created_at));
  for (const x of b.counters || []) stmts.push(env.DB.prepare('INSERT OR REPLACE INTO counters (k,v) VALUES (?,?)').bind(x.k, x.v));
  for (const x of b.approvers || []) stmts.push(env.DB.prepare('INSERT OR REPLACE INTO approvers (email,name,role,active,created_at,created_by,last_login,last_method,login_count) VALUES (?,?,?,?,?,?,?,?,?)').bind(x.email, x.name, x.role, x.active, x.created_at, x.created_by, x.last_login, x.last_method || null, x.login_count || 0));
  for (const x of b.reviews || []) stmts.push(env.DB.prepare('INSERT OR REPLACE INTO app_reviews (id,app_id,ts,actor,action,note) VALUES (?,?,?,?,?,?)').bind(x.id, x.app_id, x.ts, x.actor, x.action, x.note));
  for (const x of b.settings || []) stmts.push(env.DB.prepare('INSERT OR REPLACE INTO settings (k,v,updated_at,updated_by) VALUES (?,?,?,?)').bind(x.k, x.v, x.updated_at, x.updated_by));
  for (const x of b.daily || []) stmts.push(env.DB.prepare('INSERT OR REPLACE INTO daily (day,pv,uv,new_uv,app_views,runs) VALUES (?,?,?,?,?,?)').bind(x.day, x.pv || 0, x.uv || 0, x.new_uv || 0, x.app_views || 0, x.runs || 0));
  for (const x of b.comments || []) stmts.push(env.DB.prepare('INSERT OR REPLACE INTO comments (id,app_id,voter,nickname,stars,body,ts,hidden,reply,reply_ts) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(x.id, x.app_id, x.voter, x.nickname, x.stars, x.body || '', x.ts, x.hidden || 0, x.reply || null, x.reply_ts || null));
  for (const x of b.favs || []) stmts.push(env.DB.prepare('INSERT OR REPLACE INTO user_favs (email,app_id,ts) VALUES (?,?,?)').bind(x.email, x.app_id, x.ts));
  for (const x of b.reports || []) stmts.push(env.DB.prepare('INSERT OR REPLACE INTO reports (id,app_id,reason,detail,ip,ts,status,handled_by,handled_at,note) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(x.id, x.app_id, x.reason, x.detail, x.ip, x.ts, x.status, x.handled_by, x.handled_at, x.note));
  for (const x of b.versions || []) stmts.push(env.DB.prepare('INSERT OR REPLACE INTO app_versions (app_id,version,ts,actor,type,url,size,note) VALUES (?,?,?,?,?,?,?,?)').bind(x.app_id, x.version, x.ts, x.actor, x.type, x.url, x.size || 0, x.note));
  for (const x of b.users || []) stmts.push(env.DB.prepare('INSERT OR REPLACE INTO users (email,name,picture,created_at,last_login,login_count,blocked,blocked_note) VALUES (?,?,?,?,?,?,?,?)').bind(x.email, x.name || null, x.picture || null, x.created_at, x.last_login || null, x.login_count || 0, x.blocked ? 1 : 0, x.blocked_note || null));
  for (const x of b.appDaily || []) stmts.push(env.DB.prepare('INSERT OR REPLACE INTO app_daily (app_id,day,views,runs) VALUES (?,?,?,?)').bind(x.app_id, x.day, x.views || 0, x.runs || 0));
  for (let i = 0; i < stmts.length; i += 50) await env.DB.batch(stmts.slice(i, i + 50));
  let htmlCount = 0;
  for (const [id, h] of Object.entries(b.html || {})) if (typeof h === 'string') { await env.HTML.put('html:' + id, h); htmlCount++; }
  for (const [k, h] of Object.entries(b.htmlVersions || {})) if (typeof h === 'string' && /^[a-z0-9]{6,16}:v\d+$/.test(k)) await env.HTML.put('html:' + k, h);
  await audit(c, 'backup.restore', 'system', null, { apps: b.apps.length, html: htmlCount, approvers: (b.approvers || []).length });
  return json({ ok: true, apps: b.apps.length, html: htmlCount });
}

/* ─────────────── Screenshots (uploaded images in KV) ─────────────── */
function parseShots(v) {
  try { const a = JSON.parse(v || '[]'); return Array.isArray(a) ? a.filter((x) => x && typeof x.url === 'string') : []; } catch (_) { return []; }
}
const IMG_SIG = [
  ['image/png', (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47],
  ['image/jpeg', (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  ['image/gif', (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46],
  ['image/webp', (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50],
];
async function uploadImage(c, s) {
  const { env } = c;
  const len = Number(c.req.headers.get('content-length') || 0);
  if (len > MAX_IMAGE) fail(413, '이미지는 2MB 이하만 올릴 수 있습니다.');
  if (!isAdmin(s) && !(await hit(env, 'img-upload:' + s.e, 60, 86400000))) fail(429, '이미지 업로드 한도(하루 60장)를 초과했습니다.');
  const buf = new Uint8Array(await c.req.arrayBuffer());
  if (buf.length > MAX_IMAGE) fail(413, '이미지는 2MB 이하만 올릴 수 있습니다.');
  const type = (IMG_SIG.find(([, ok]) => buf.length > 12 && ok(buf)) || [])[0]; // sniff the bytes, ignore the declared type (no SVG)
  if (!type) fail(400, 'PNG, JPEG, GIF, WebP 이미지만 올릴 수 있습니다.');
  const id = randomId(16);
  await env.HTML.put('img:' + id, buf, { metadata: { type, owner: s.e, ts: Date.now(), size: buf.length } });
  await audit(c, 'image.upload', 'image', id, { size: buf.length, type }, true, s.e, s.r);
  return json({ id, path: `/img/${id}`, size: buf.length, type }, 201); // the client prefixes its API base
}
async function serveImage(c, id) {
  const { value, metadata } = await c.env.HTML.getWithMetadata('img:' + id, { type: 'arrayBuffer' });
  if (!value) return new Response('Not found', { status: 404 });
  return new Response(c.req.method === 'HEAD' ? null : value, {
    headers: {
      'content-type': metadata?.type || 'application/octet-stream', 'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; sandbox", 'cross-origin-resource-policy': 'cross-origin',
    },
  });
}
// called after the DB change: an uploaded image is deleted only when no app references it any more
async function dropUnusedImages(env, before, after) {
  const keep = new Set(after.map((x) => x.url));
  for (const x of before) {
    const m = !keep.has(x.url) && String(x.url).match(/\/img\/([a-z0-9]{16})$/);
    if (!m) continue;
    const used = await env.DB.prepare('SELECT 1 FROM apps WHERE screenshots LIKE ? LIMIT 1').bind(`%/img/${m[1]}"%`).first();
    if (!used) { try { await env.HTML.delete('img:' + m[1]); } catch (_) { /* noop */ } }
  }
}

/* ─────────────── GitHub import + AI description (v11) ─────────────── */
// Admin picks one provider. The API key is AES-GCM encrypted (key derived from SESSION_SECRET) and never sent back.
const AI_PROVIDERS = {
  anthropic: { base: 'https://api.anthropic.com', label: 'Anthropic Claude' },
  openai: { base: 'https://api.openai.com/v1', label: 'OpenAI' },
  gemini: { base: 'https://generativelanguage.googleapis.com/v1beta/openai', label: 'Google Gemini (OpenAI-compatible)' },
  compat: { base: '', label: 'OpenAI-compatible (vLLM, Azure, etc.)' },
};
// local dev only (DEV_LOGIN): allow an http://localhost mock
const aiBaseOk = (c, u) => isHttps(u) || (devLoginOn(c) && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(u));
async function aiCryptoKey(env) {
  const secret = env.SESSION_SECRET || env.ADMIN_PASSWORD;
  if (!secret) fail(400, 'SESSION_SECRET이 없어 API 키를 암호화할 수 없습니다.');
  const raw = await crypto.subtle.digest('SHA-256', enc('krvcf-ai-key:' + secret));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function aiConfig(env) {
  const rows = (await env.DB.prepare("SELECT k, v FROM settings WHERE k IN ('ai_config','secret:ai_key')").all()).results;
  const m = Object.fromEntries(rows.map((r) => [r.k, r.v]));
  let cfg = {};
  try { cfg = JSON.parse(m.ai_config || '{}'); } catch (_) { /* reset */ }
  cfg = { provider: '', baseUrl: '', model: '', enabled: false, dailyLimit: 200, ...cfg };
  let key = null;
  if (m['secret:ai_key']) {
    try {
      const [iv, ct] = m['secret:ai_key'].split('.');
      key = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64uDec(iv) }, await aiCryptoKey(env), b64uDec(ct)));
    } catch (_) { key = null; } // SESSION_SECRET changed → key must be entered again
  }
  return { ...cfg, key };
}
async function aiPublicConfig(env) {
  const c = await aiConfig(env);
  const { results } = await env.DB.prepare("SELECT updated_at, updated_by FROM settings WHERE k='ai_config'").all();
  return {
    provider: c.provider, baseUrl: c.baseUrl, model: c.model, enabled: !!c.enabled, dailyLimit: c.dailyLimit,
    keySet: !!c.key, keyHint: c.key ? '••••' + c.key.slice(-4) : null, providers: AI_PROVIDERS,
    updatedAt: results[0]?.updated_at || null, updatedBy: results[0]?.updated_by || null,
  };
}
async function aiReady(env) {
  try { const c = await aiConfig(env); return !!(c.enabled && c.provider && c.model && c.key); } catch (_) { return false; }
}
async function saveAiConfig(c, s) {
  const { env } = c;
  const b = await readJson(c.req, 16 * 1024);
  const cur = await aiConfig(env);
  const provider = AI_PROVIDERS[b.provider] ? b.provider : b.provider === '' ? '' : fail(400, '지원하지 않는 AI 제공자입니다.');
  const baseUrl = str(b.baseUrl, 300).replace(/\/+$/, '');
  if (baseUrl && !aiBaseOk(c, baseUrl)) fail(400, 'AI API 주소는 https:// 여야 합니다.');
  if (provider === 'compat' && !baseUrl) fail(400, 'OpenAI 호환 API 주소를 입력하세요.');
  const model = str(b.model, 120);
  const enabled = !!b.enabled;
  if (enabled && !model) fail(400, 'AI 모델 이름을 입력하세요.');
  const dailyLimit = Math.min(Math.max(parseInt(b.dailyLimit, 10) || 200, 1), 5000);
  const cfg = { provider, baseUrl, model, enabled, dailyLimit };
  const now = Date.now();
  const stmts = [env.DB.prepare('INSERT INTO settings (k,v,updated_at,updated_by) VALUES (?,?,?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v, updated_at=excluded.updated_at, updated_by=excluded.updated_by').bind('ai_config', JSON.stringify(cfg), now, s.e)];
  let keyChange = null;
  if (b.clearKey) { stmts.push(env.DB.prepare("DELETE FROM settings WHERE k='secret:ai_key'")); keyChange = 'cleared'; }
  else if (typeof b.apiKey === 'string' && b.apiKey.trim()) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aiCryptoKey(env), enc(b.apiKey.trim().slice(0, 500)));
    stmts.push(env.DB.prepare('INSERT INTO settings (k,v,updated_at,updated_by) VALUES (?,?,?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v, updated_at=excluded.updated_at, updated_by=excluded.updated_by').bind('secret:ai_key', `${b64u(iv)}.${b64u(ct)}`, now, s.e));
    keyChange = 'set';
  }
  if (enabled && !(keyChange === 'set' || (cur.key && keyChange !== 'cleared'))) fail(400, 'API 키가 없습니다.');
  await env.DB.batch(stmts);
  const diff = {};
  for (const k of ['provider', 'baseUrl', 'model', 'enabled', 'dailyLimit']) if (cur[k] !== cfg[k]) diff[k] = { from: cur[k], to: cfg[k] };
  if (keyChange) diff.apiKey = keyChange; // the key itself is never logged
  await audit(c, 'settings.ai', 'settings', null, diff);
  return json({ ai: await aiPublicConfig(env) });
}
function aiEndpoint(cfg) {
  const base = (cfg.baseUrl || AI_PROVIDERS[cfg.provider]?.base || '').replace(/\/+$/, '');
  if (!cfg.provider || !base) fail(400, 'AI 모델이 설정되지 않았습니다.');
  return base;
}
async function aiFetch(url, init, ms = 45000) {
  let r;
  try { r = await fetch(url, { ...init, signal: AbortSignal.timeout(ms) }); } catch (e) { fail(502, `AI API 연결 실패: ${String(e.message || e).slice(0, 120)}`); }
  const t = await r.text();
  let d; try { d = JSON.parse(t); } catch (_) { d = null; }
  if (!r.ok) fail(502, `AI API ${r.status}: ${String((d && (d.error?.message || d.error?.type || d.message)) || t).slice(0, 200)}`);
  return d;
}
async function aiChat(cfg, system, user, maxTokens = 1800) {
  if (!cfg.key) fail(400, 'API 키가 없습니다.');
  if (!cfg.model) fail(400, 'AI 모델 이름을 입력하세요.');
  const base = aiEndpoint(cfg);
  if (cfg.provider === 'anthropic') {
    const d = await aiFetch(`${base}/v1/messages`, {
      method: 'POST',
      headers: { 'x-api-key': cfg.key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: cfg.model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
    });
    return (d.content || []).filter((x) => x.type === 'text').map((x) => x.text).join('').trim();
  }
  const d = await aiFetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${cfg.key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: cfg.model, max_tokens: maxTokens, temperature: 0.3, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
  });
  return String(d.choices?.[0]?.message?.content || '').trim();
}
async function aiFromBody(c, b) {
  // test/models may run with unsaved form values; an empty key means "use the saved key"
  const saved = await aiConfig(c.env);
  const cfg = {
    provider: AI_PROVIDERS[b.provider] ? b.provider : saved.provider,
    baseUrl: b.baseUrl !== undefined ? str(b.baseUrl, 300).replace(/\/+$/, '') : saved.baseUrl,
    model: b.model !== undefined ? str(b.model, 120) : saved.model,
    key: (typeof b.apiKey === 'string' && b.apiKey.trim()) || saved.key,
  };
  if (cfg.baseUrl && !aiBaseOk(c, cfg.baseUrl)) fail(400, 'AI API 주소는 https:// 여야 합니다.');
  return cfg;
}
async function aiModels(c) {
  const cfg = await aiFromBody(c, await readJson(c.req, 8192));
  if (!cfg.key) fail(400, 'API 키가 없습니다.');
  const base = aiEndpoint(cfg);
  const d = cfg.provider === 'anthropic'
    ? await aiFetch(`${base}/v1/models?limit=100`, { headers: { 'x-api-key': cfg.key, 'anthropic-version': '2023-06-01' } }, 15000)
    : await aiFetch(`${base}/models`, { headers: { authorization: `Bearer ${cfg.key}` } }, 15000);
  const ids = (d.data || d.models || []).map((x) => String(x.id || x.name || '').replace(/^models\//, '')).filter(Boolean);
  return json({ models: [...new Set(ids)].slice(0, 300) });
}
async function aiTest(c) {
  const cfg = await aiFromBody(c, await readJson(c.req, 8192));
  const t0 = Date.now();
  const out = await aiChat(cfg, 'Reply with one short Korean sentence.', 'KRVCF App Center AI 연결 테스트입니다. "연결 성공"이라고 답하세요.', 60);
  await audit(c, 'ai.test', 'settings', null, { provider: cfg.provider, model: cfg.model, ms: Date.now() - t0 });
  return json({ ok: true, ms: Date.now() - t0, reply: out.slice(0, 200), model: cfg.model });
}

function parseGithubRepo(u) {
  const t = str(u, 300).replace(/\.git$/, '').replace(/\/+$/, '');
  const m = t.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9-]{1,39})\/([A-Za-z0-9._-]{1,100})(?:[/?#].*)?$/) || t.match(/^([A-Za-z0-9-]{1,39})\/([A-Za-z0-9._-]{1,100})$/);
  if (!m) fail(400, 'GitHub 저장소 주소를 입력하세요. 예: https://github.com/owner/repo');
  return { owner: m[1], repo: m[2] };
}
async function ghPublic(env, path, accept = 'application/vnd.github+json') {
  const go = (auth) => fetch(`${env.GH_PUBLIC_API || 'https://api.github.com'}${path}`, { headers: { accept, 'user-agent': 'krvcf-app-center', 'x-github-api-version': '2022-11-28', ...(auth ? { authorization: `Bearer ${env.GH_TOKEN}` } : {}) }, signal: AbortSignal.timeout(15000) });
  let r = await go(!!env.GH_TOKEN); // the patch token raises the rate limit; fall back to anonymous if it is refused
  if (env.GH_TOKEN && (r.status === 401 || r.status === 403)) r = await go(false);
  return r;
}
// screenshots referenced by the README: markdown ![alt](src) and <img src>, relative paths resolved to raw.githubusercontent.com
function readmeImages(md, owner, repo, ref) {
  const out = [];
  const add = (src, alt) => {
    src = String(src || '').trim().replace(/^<|>$/g, '').split(/\s+/)[0];
    if (!src || /^data:/i.test(src)) return;
    let u;
    if (/^https?:\/\//i.test(src)) u = src;
    else if (src.startsWith('//')) u = 'https:' + src;
    else u = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${src.replace(/^\.?\//, '')}`;
    u = u.replace(/^http:/i, 'https:')
      .replace(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/(.+)$/i, 'https://raw.githubusercontent.com/$1/$2/$3');
    const path = u.split(/[?#]/)[0].toLowerCase();
    const badge = /shields\.io|badge|badgen\.net|travis-ci|circleci|codecov|coveralls|githubusercontent\.com\/.+\/workflows\/|\/actions\/workflows\/|img\.shields|forthebadge|sonarcloud|deepscan|snyk\.io|komarev|star-history|contrib\.rocks|buymeacoffee|ko-fi/.test(u.toLowerCase());
    const imgExt = /\.(png|jpe?g|gif|webp)$/.test(path) || /user-images\.githubusercontent\.com|github\.com\/user-attachments\/assets\//.test(u);
    if (badge || !imgExt || path.endsWith('.svg')) return;
    if (!out.some((x) => x.url === u)) out.push({ url: u, caption: str(String(alt || '').replace(/[\[\]]/g, ''), 120) });
  };
  for (const m of md.matchAll(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) add(m[2], m[1]);
  for (const m of md.matchAll(/<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)) add(m[1], (m[0].match(/\balt\s*=\s*["']([^"']*)["']/i) || [])[1]);
  return out.slice(0, 12);
}
function mdToText(md) {
  return String(md || '')
    .replace(/<!--[\s\S]*?-->/g, '').replace(/```[\s\S]*?```/g, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s*/gm, '').replace(/[*_`>|]/g, '').replace(/\n{3,}/g, '\n\n').trim();
}
async function githubImport(c, s) {
  const { env } = c;
  const b = await readJson(c.req, 4096);
  const { owner, repo } = parseGithubRepo(b.url);
  if (!isAdmin(s) && !(await hit(env, 'gh-import:' + s.e, 30, 86400000))) fail(429, 'GitHub 불러오기 한도(하루 30회)를 초과했습니다.');
  const t0 = Date.now();
  const mr = await ghPublic(env, `/repos/${owner}/${repo}`);
  if (mr.status === 404) fail(404, 'GitHub 저장소를 찾을 수 없습니다 (비공개이거나 주소가 틀림).');
  if (!mr.ok) fail(502, `GitHub API ${mr.status}`);
  const meta = await mr.json();
  if (meta.private) fail(404, 'GitHub 저장소를 찾을 수 없습니다 (비공개이거나 주소가 틀림).');
  const rr = await ghPublic(env, `/repos/${owner}/${repo}/readme`, 'application/vnd.github.raw');
  const readme = rr.ok ? (await rr.text()).slice(0, 60000) : '';
  const pagesUrl = meta.has_pages ? (meta.name.toLowerCase() === `${meta.owner.login.toLowerCase()}.github.io` ? `https://${meta.owner.login.toLowerCase()}.github.io/` : `https://${meta.owner.login.toLowerCase()}.github.io/${meta.name}/`) : null;
  const homepage = isHttpUrl(meta.homepage || '') ? meta.homepage : null;
  const images = readmeImages(readme, meta.owner.login, meta.name, meta.default_branch || 'main');
  const repoInfo = {
    url: meta.html_url, fullName: meta.full_name, description: meta.description || '', homepage, pagesUrl,
    topics: meta.topics || [], language: meta.language || null, stars: meta.stargazers_count || 0,
    license: meta.license?.spdx_id || null, updatedAt: meta.pushed_at || null, readmeChars: readme.length, images,
  };
  // fallback: repository description + first README paragraphs, no AI
  const plain = mdToText(readme);
  const base = {
    name: str(meta.name.replace(/[-_]+/g, ' '), 80),
    description: str([meta.description, plain.split(/\n\n/).filter((x) => x.trim().length > 30).slice(0, 3).join('\n\n')].filter(Boolean).join('\n\n'), 1500),
    tags: parseTags(meta.topics || []), category: null, demoUrl: homepage || pagesUrl || '', accessGuide: '',
  };
  const cfg = await aiConfig(env);
  const ready = !!(cfg.enabled && cfg.provider && cfg.model && cfg.key);
  if (!ready) {
    await audit(c, 'ai.github_import', 'repo', meta.full_name, { ai: false, ms: Date.now() - t0 }, true, s.e, s.r);
    return json({ repo: repoInfo, draft: base, ai: false, reason: 'not_configured' });
  }
  if (!(await hit(env, 'ai-global', cfg.dailyLimit || 200, 86400000))) {
    await audit(c, 'ai.github_import', 'repo', meta.full_name, { ai: false, reason: 'daily_limit' }, false, s.e, s.r);
    return json({ repo: repoInfo, draft: base, ai: false, reason: 'daily_limit' });
  }
  const lang = c.lang === 'en' ? 'English' : 'Korean';
  const system = `You write catalog entries for "KRVCF App Center", a community catalog of web apps and tools for VMware / infrastructure engineers.
Use ONLY facts found in the repository metadata and README. Do not invent features, URLs, accounts or numbers.
Return ONE JSON object and nothing else, with exactly these keys:
{"name": string (<= 60 chars, human-friendly app name),
 "description": string (${lang}, plain text without markdown symbols, 3-8 short lines: what it does, who it is for, key features as "- " lines, how to use; <= 1200 chars),
 "tags": array of up to 5 short lowercase keywords,
 "category": one of ${JSON.stringify(CATEGORIES)},
 "demoUrl": a runnable demo/live URL explicitly given in the metadata or README, else "",
 "accessGuide": string (${lang}, how to access or run it: live URL, required account/VPN, or install/run commands from the README; <= 600 chars; "" if unknown)}`;
  const user = `Repository: ${meta.full_name}
URL: ${meta.html_url}
Description: ${meta.description || '-'}
Homepage: ${homepage || '-'}
GitHub Pages: ${pagesUrl || '-'}
Topics: ${(meta.topics || []).join(', ') || '-'}
Primary language: ${meta.language || '-'}
License: ${repoInfo.license || '-'}

README (may be truncated):
"""
${readme.slice(0, 14000) || '(no README)'}
"""`;
  try {
    const out = await aiChat(cfg, system, user);
    const jm = out.match(/\{[\s\S]*\}/);
    const d = JSON.parse(jm ? jm[0] : out);
    const draft = {
      name: str(d.name, 80) || base.name,
      description: str(d.description, 2000) || base.description,
      tags: parseTags(Array.isArray(d.tags) ? d.tags : base.tags).slice(0, 5),
      category: CATEGORIES.includes(d.category) ? d.category : null,
      demoUrl: isHttpUrl(str(d.demoUrl, 1000)) ? str(d.demoUrl, 1000) : base.demoUrl,
      accessGuide: str(d.accessGuide, 2000),
    };
    await audit(c, 'ai.github_import', 'repo', meta.full_name, { ai: true, provider: cfg.provider, model: cfg.model, ms: Date.now() - t0 }, true, s.e, s.r);
    return json({ repo: repoInfo, draft, ai: true, model: cfg.model });
  } catch (e) {
    await audit(c, 'ai.github_import', 'repo', meta.full_name, { ai: false, provider: cfg.provider, model: cfg.model, error: String(e.message || e).slice(0, 200) }, false, s.e, s.r);
    return json({ repo: repoInfo, draft: base, ai: false, reason: 'ai_error', error: String(e.message || e).slice(0, 200) });
  }
}

/* ─────────────── GitHub patch / deploy ─────────────── */
const branch = (env) => env.GH_BRANCH || 'main';
async function gh(env, path, init = {}) {
  if (!env.GH_TOKEN || !env.GH_REPO) fail(400, 'GitHub 연동이 설정되지 않았습니다 (PATCH_GITHUB_TOKEN 시크릿).');
  const r = await fetch(`${env.GH_API || 'https://api.github.com'}/repos/${env.GH_REPO}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${env.GH_TOKEN}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28',
      'user-agent': 'krvcf-app-center', 'content-type': 'application/json', ...(init.headers || {}),
    },
  });
  const t = await r.text();
  let d; try { d = t ? JSON.parse(t) : {}; } catch (_) { d = { message: t.slice(0, 200) }; }
  if (!r.ok) fail(r.status === 409 || r.status === 422 ? 409 : 502, `GitHub API ${r.status}: ${d.message || ''}`);
  return d;
}
const mapRun = (r) => ({ id: r.id, name: r.name, sha: r.head_sha, status: r.status, conclusion: r.conclusion, url: r.html_url, event: r.event, createdAt: r.created_at, updatedAt: r.updated_at });

async function repoStatus(c) {
  const { env } = c;
  if (!env.GH_TOKEN || !env.GH_REPO) return json({ configured: false, apiVersion: env.VERSION || 'dev' });
  const [ref, commits, runs] = await Promise.all([
    gh(env, `/git/ref/heads/${branch(env)}`),
    gh(env, `/commits?sha=${branch(env)}&per_page=20`),
    gh(env, `/actions/runs?branch=${branch(env)}&per_page=20`),
  ]);
  return json({
    configured: true, repo: env.GH_REPO, branch: branch(env), head: ref.object.sha, apiVersion: env.VERSION || 'dev',
    commits: commits.map((x) => ({ sha: x.sha, message: x.commit.message, author: (x.commit.author || {}).name, date: (x.commit.author || {}).date, url: x.html_url })),
    runs: (runs.workflow_runs || []).map(mapRun),
  });
}

async function repoTree(c) {
  const ref = await gh(c.env, `/git/ref/heads/${branch(c.env)}`);
  const t = await gh(c.env, `/git/trees/${ref.object.sha}?recursive=1`);
  return json({ head: ref.object.sha, truncated: !!t.truncated, entries: t.tree.filter((e) => e.type === 'blob').map((e) => ({ path: e.path, sha: e.sha, size: e.size, mode: e.mode })) });
}

async function repoRuns(c) {
  const sha = str(c.url.searchParams.get('sha'), 40);
  if (!/^[0-9a-f]{7,40}$/.test(sha)) fail(400, 'sha 가 필요합니다.');
  const d = await gh(c.env, `/actions/runs?head_sha=${sha}&per_page=10`);
  return json({ runs: (d.workflow_runs || []).map(mapRun) });
}

function safePath(p) {
  p = String(p || '').replace(/\\/g, '/').replace(/^\.\/+/, '');
  if (!p || p.length > 300 || p.startsWith('/') || p.split('/').some((x) => x === '..' || x === '') || /^\.git(\/|$)/.test(p) || /[\x00-\x1f]/.test(p)) fail(400, `허용되지 않는 경로: ${p}`);
  return p;
}

async function repoPatch(c, s) {
  const { env } = c;
  const b = await readJson(c.req, 40 * 1024 * 1024);
  const files = Array.isArray(b.files) ? b.files : [];
  const deletes = Array.isArray(b.deletes) ? b.deletes.map(safePath) : [];
  if (!files.length && !deletes.length) fail(400, '변경할 파일이 없습니다.');
  if (files.length > 400) fail(400, '한 번에 최대 400개 파일까지 패치할 수 있습니다.');
  const binCount = files.filter((f) => f.encoding === 'base64').length;
  if (binCount > 35) fail(400, '바이너리 파일은 한 번에 35개까지 가능합니다 (Workers 무료 플랜 서브요청 한도).');
  const message = str(b.message, 500) || `Patch via App Center (${files.length + deletes.length} files)`;
  const ref = await gh(env, `/git/ref/heads/${branch(env)}`);
  const head = ref.object.sha;
  if (b.baseSha && b.baseSha !== head && !b.force) fail(409, `저장소가 그 사이 변경되었습니다 (현재 ${head.slice(0, 7)}). 새로고침 후 다시 비교하세요.`);
  const base = await gh(env, `/git/commits/${head}`);
  const tree = [];
  for (const f of files) {
    const path = safePath(f.path);
    const mode = f.mode === '100755' ? '100755' : '100644';
    if (f.encoding === 'base64') {
      const blob = await gh(env, '/git/blobs', { method: 'POST', body: JSON.stringify({ content: String(f.content || ''), encoding: 'base64' }) });
      tree.push({ path, mode, type: 'blob', sha: blob.sha });
    } else {
      tree.push({ path, mode, type: 'blob', content: String(f.content ?? '') });
    }
  }
  for (const path of deletes) tree.push({ path, mode: '100644', type: 'blob', sha: null });
  const nt = await gh(env, '/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: base.tree.sha, tree }) });
  if (nt.sha === base.tree.sha) fail(400, '변경 사항이 없습니다 (현재 저장소와 동일).');
  const nc = await gh(env, '/git/commits', { method: 'POST', body: JSON.stringify({ message: `${message}\n\nPatched-by: ${s.e} via KRVCF App Center`, tree: nt.sha, parents: [head] }) });
  await gh(env, `/git/refs/heads/${branch(env)}`, { method: 'PATCH', body: JSON.stringify({ sha: nc.sha, force: false }) });
  await audit(c, 'repo.patch', 'commit', nc.sha, { message, base: head, files: files.map((f) => f.path), deletes });
  return json({ ok: true, sha: nc.sha, url: nc.html_url, base: head });
}

async function repoRollback(c, s) {
  const { env } = c;
  const b = await readJson(c.req, 4096);
  const sha = str(b.sha, 40);
  if (!/^[0-9a-f]{7,40}$/.test(sha)) fail(400, '롤백할 커밋 sha 가 필요합니다.');
  const ref = await gh(env, `/git/ref/heads/${branch(env)}`);
  const head = ref.object.sha;
  const target = await gh(env, `/git/commits/${sha}`);
  const cur = await gh(env, `/git/commits/${head}`);
  if (target.tree.sha === cur.tree.sha) fail(400, '현재 버전과 동일합니다.');
  const nc = await gh(env, '/git/commits', { method: 'POST', body: JSON.stringify({ message: `Rollback to ${target.sha.slice(0, 7)}: ${target.message.split('\n')[0]}\n\nRolled-back-by: ${s.e} via KRVCF App Center`, tree: target.tree.sha, parents: [head] }) });
  await gh(env, `/git/refs/heads/${branch(env)}`, { method: 'PATCH', body: JSON.stringify({ sha: nc.sha, force: false }) });
  await audit(c, 'repo.rollback', 'commit', nc.sha, { to: target.sha, from: head });
  return json({ ok: true, sha: nc.sha, url: nc.html_url });
}

async function repoDispatch(c) {
  const b = await readJson(c.req, 1024);
  const wf = b.workflow === 'worker' ? 'worker.yml' : b.workflow === 'pages' ? 'pages.yml' : fail(400, 'workflow 는 pages 또는 worker');
  await gh(c.env, `/actions/workflows/${wf}/dispatches`, { method: 'POST', body: JSON.stringify({ ref: branch(c.env) }) });
  await audit(c, 'repo.redeploy', 'workflow', wf, {});
  return json({ ok: true });
}

/* ───────────────────────── Mail ───────────────────────── */
const mailEnabled = (env) => !!env.RESEND_API_KEY || env.MAIL_MODE === 'console';
const siteUrl = (env) => (env.SITE_URL || 'https://app.krvcf.com').replace(/\/$/, '');
// Bilingual (Korean + English) emails
function mailLayout(title, body, env, titleEn, bodyEn) {
  const sec = (t, b, lang) => `<div lang="${lang}" style="padding:20px;color:#313131;font-size:14px;line-height:1.6"><h2 style="font-size:18px;font-weight:500;margin:0 0 12px">${t}</h2>${b}</div>`;
  return `<div style="font-family:-apple-system,'Segoe UI','Malgun Gothic',sans-serif;max-width:560px;margin:0 auto;border:1px solid #d7dbdd;border-radius:6px;overflow:hidden">
  <div style="background:#0e2a38;color:#fff;padding:14px 20px;font-size:16px"><b>KRVCF</b> App Center</div>
  ${sec(title, body, 'ko')}${titleEn ? `<div style="border-top:1px dashed #d7dbdd;margin:0 20px"></div>${sec(titleEn, bodyEn, 'en')}` : ''}
  <div style="padding:12px 20px;background:#f5f6f7;color:#737373;font-size:11.5px">${siteUrl(env)} · 비공식 커뮤니티 서비스 · Unofficial community service</div></div>`;
}
async function sendMail(env, to, subject, html) {
  const list = [...new Set(to.filter(Boolean))];
  if (!list.length) return false;
  if (env.MAIL_MODE === 'console') { console.log('[mail]', list.join(','), subject); return true; }
  if (!env.RESEND_API_KEY) return false;
  const from = env.MAIL_FROM || 'KRVCF App Center <noreply@krvcf.com>';
  const body = list.length === 1
    ? { url: 'https://api.resend.com/emails', data: { from, to: list, subject, html } }
    : { url: 'https://api.resend.com/emails/batch', data: list.slice(0, 100).map((t) => ({ from, to: [t], subject, html })) };
  try {
    const r = await fetch(body.url, { method: 'POST', headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify(body.data) });
    if (!r.ok) console.error('resend', r.status, await r.text());
    return r.ok;
  } catch (e) {
    console.error('resend', e);
    return false;
  }
}
async function notifyApprovers(c, app, kind) {
  const { results } = await c.env.DB.prepare('SELECT email FROM approvers WHERE active=1').all();
  const to = results.map((r) => r.email);
  if (!to.length || !mailEnabled(c.env)) return;
  const kindEn = { '신규 등록': 'new submission', '수정 후 재승인 요청': 'resubmitted after edit' }[kind] || kind;
  const btn = (t) => `<p><a href="${siteUrl(c.env)}/#/admin" style="display:inline-block;background:#0072a3;color:#fff;padding:8px 16px;border-radius:3px;text-decoration:none">${t}</a></p>`;
  const table = (l) => `<table style="font-size:14px;border-collapse:collapse">
      <tr><td style="color:#737373;padding:3px 14px 3px 0">${l[0]}</td><td><b>${esc(app.name)}</b></td></tr>
      <tr><td style="color:#737373;padding:3px 14px 3px 0">${l[1]}</td><td>${app.type === 'html' ? l[3] : l[4]} · ${esc(app.category)}</td></tr>
      <tr><td style="color:#737373;padding:3px 14px 3px 0">${l[2]}</td><td>${esc(app.author)}</td></tr></table>
      <p style="color:#565656">${esc(String(app.description || '').slice(0, 300))}</p>`;
  const ok = await sendMail(c.env, to, `[KRVCF App Center] 승인 요청 / Review request (${kind} · ${kindEn}): ${app.name}`,
    mailLayout(`승인 요청 — ${kind}`, table(['앱 이름', '유형', '작성자', 'HTML 데모', '웹 링크']) + btn('관리 콘솔에서 검토하기'), c.env,
      `Review request — ${kindEn}`, table(['App', 'Type', 'Author', 'HTML demo', 'Web link']) + btn('Review in the Admin Console')));
  await audit(c, 'mail.approver_notice', 'app', app.id, { recipients: to.length, kind }, ok, 'system', 'system');
}

/* ───────────────────────── Audit ───────────────────────── */
async function audit(c, action, targetType, targetId, detail, ok = true, actorOverride, roleOverride) {
  try {
    const s = c._s === undefined ? await session(c) : c._s;
    const actor = actorOverride || (s ? s.e : 'anonymous');
    const role = roleOverride || (s ? s.r : actorOverride && /^(owner-key|author):/.test(actorOverride) ? 'author' : 'guest');
    await c.env.DB.prepare('INSERT INTO audit_log (ts,actor,role,action,target_type,target_id,detail,ok,ip,country,ua) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
      .bind(Date.now(), String(actor).slice(0, 120), role, action, targetType || null, targetId ? String(targetId).slice(0, 120) : null,
        detail ? JSON.stringify(detail).slice(0, 4000) : null, ok ? 1 : 0, maskIp(c.ip), (c.req.cf && c.req.cf.country) || null,
        str(c.req.headers.get('user-agent'), 200))
      .run();
  } catch (e) {
    console.error('audit failed', action, e);
  }
}

/* ───────────────────────── Helpers ───────────────────────── */
function fail(status, msg) {
  const e = new Error(msg);
  e.status = status;
  throw e;
}
function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra } });
}
function corsHeaders(req, env) {
  const origin = req.headers.get('origin');
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const h = {
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization,x-owner-key,x-lang',
    'access-control-max-age': '86400',
    vary: 'Origin',
  };
  if (origin && (allowed.includes(origin) || allowed.includes('*'))) h['access-control-allow-origin'] = origin;
  return h;
}
async function readJson(req, maxBytes) {
  const len = Number(req.headers.get('content-length') || 0);
  if (len > maxBytes) fail(413, '요청 크기가 너무 큽니다.');
  const t = await req.text();
  if (t.length > maxBytes) fail(413, '요청 크기가 너무 큽니다.');
  try { return t ? JSON.parse(t) : {}; } catch (_) { fail(400, 'JSON 형식이 올바르지 않습니다.'); }
}
const str = (v, max) => (typeof v === 'string' ? v : '').trim().slice(0, max);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
function normEmail(v) {
  const e = str(v, 120).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}
function isHttpUrl(u) {
  try { const x = new URL(u); return (x.protocol === 'https:' || x.protocol === 'http:') && !!x.hostname; } catch (_) { return false; }
}
function isHttps(u) {
  try { return new URL(u).protocol === 'https:'; } catch (_) { return false; }
}
function validate(b, existing, lenient = false) {
  const type = existing ? existing.type : b.type === 'html' || b.type === 'link' ? b.type : fail(400, '앱 유형이 올바르지 않습니다.');
  const name = str(b.name, 80);
  if (!name) fail(400, '앱 이름을 입력하세요.');
  const author = str(b.author, 40);
  if (!author) fail(400, '작성자 이름을 입력하세요.');
  const email = str(b.email, 120);
  if (email && !normEmail(email)) fail(400, '이메일 형식이 올바르지 않습니다.');
  const category = CATEGORIES.includes(b.category) ? b.category : fail(400, '카테고리를 선택하세요.');
  const description = str(b.description, 2000);
  if (!description) fail(400, '설명을 입력하세요.');
  const thumbnail = str(b.thumbnail, 500);
  if (thumbnail && !isHttps(thumbnail)) fail(400, '썸네일은 https:// URL만 허용됩니다.');
  let url = null, html = null, size = 0;
  if (type === 'link') {
    url = str(b.url, 1000);
    if (!isHttps(url)) fail(400, 'https:// 로 시작하는 앱 URL을 입력하세요.');
  } else if (typeof b.html === 'string' && b.html.trim()) {
    html = b.html;
    size = enc(html).length;
    if (size > MAX_HTML) fail(413, 'HTML은 10MB 이하만 허용됩니다.');
  } else if (!existing) fail(400, 'HTML 소스를 첨부하세요.');
  // catalog (link) apps: a runnable demo URL and how to get in are required (admins may edit legacy apps without them)
  let demoUrl = str(b.demoUrl, 1000) || null, accessGuide = str(b.accessGuide, 2000) || null;
  const accessPrivate = !!b.accessPrivate && !!accessGuide;
  if (demoUrl && !isHttpUrl(demoUrl)) fail(400, '데모 URL은 http:// 또는 https:// 로 시작하는 주소여야 합니다.');
  if (type === 'link' && !lenient) {
    if (!demoUrl) fail(400, '실행 가능한 데모 URL을 입력하세요.');
    if (!accessGuide) fail(400, '데모 접속 방법을 입력하세요.');
  }
  const shots = Array.isArray(b.screenshots) ? b.screenshots : [];
  if (shots.length > MAX_SHOTS) fail(400, `스크린샷은 최대 ${MAX_SHOTS}장까지 등록할 수 있습니다.`);
  const screenshots = shots.map((x) => ({ url: str(typeof x === 'string' ? x : x?.url, 1000), caption: str(x?.caption, 120) }))
    .filter((x) => x.url).map((x) => { if (!isHttps(x.url) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/img\/[a-z0-9]{16}$/.test(x.url)) fail(400, '스크린샷은 https:// 이미지 주소만 허용됩니다.'); return x.caption ? x : { url: x.url }; });
  const tags = parseTags(b.tags);
  const changelog = str(b.changelog, 300) || null;
  return { screenshots, type, name, author, email: email ? email.toLowerCase() : null, category, description, thumbnail: thumbnail || null, url, html, size, tags, changelog, demoUrl, accessGuide, accessPrivate };
}
async function findApp(env, id) {
  const row = await env.DB.prepare('SELECT * FROM apps WHERE id=?').bind(id).first();
  if (!row) fail(404, '앱을 찾을 수 없습니다.');
  return row;
}
async function removeApp(env, id) {
  const shotRow = await env.DB.prepare('SELECT screenshots FROM apps WHERE id=?').bind(id).first();
  const { results: vers } = await env.DB.prepare('SELECT version FROM app_versions WHERE app_id=?').bind(id).all();
  for (const v of vers) await env.HTML.delete(`html:${id}:v${v.version}`);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM app_versions WHERE app_id=?').bind(id),
    env.DB.prepare('DELETE FROM comments WHERE app_id=?').bind(id),
    env.DB.prepare('DELETE FROM reports WHERE app_id=?').bind(id),
    env.DB.prepare('DELETE FROM notifications WHERE app_id=?').bind(id),
    env.DB.prepare('DELETE FROM user_favs WHERE app_id=?').bind(id),
    env.DB.prepare('DELETE FROM apps WHERE id=?').bind(id),
    env.DB.prepare('DELETE FROM ratings WHERE app_id=?').bind(id),
    env.DB.prepare('DELETE FROM feedback WHERE app_id=?').bind(id),
  ]);
  await env.HTML.delete('html:' + id);
  if (shotRow) await dropUnusedImages(env, parseShots(shotRow.screenshots), []);
}
const avg = (r) => (r.rating_count ? Math.round((r.rating_sum / r.rating_count) * 10) / 10 : 0);

// level 0: public / 1: owner / 2: approver·admin
// opt.guide: include the access guide (detail views). Private guides need a signed-in viewer or owner/staff.
function pub(r, level, opt = {}) {
  const o = {
    id: r.id, type: r.type, name: r.name, url: r.type === 'link' ? r.url : null, category: r.category,
    description: r.description, thumbnail: r.thumbnail || null, author: r.author_name, runs: r.runs, views: r.views || 0,
    rating: avg(r), ratingCount: r.rating_count, size: r.size, featured: !!r.featured,
    createdAt: r.created_at, updatedAt: r.updated_at,
    tags: r.tags ? String(r.tags).split(',').filter(Boolean) : [], version: r.version || 1, changelog: r.changelog || null,
  };
  if (r.demo_url) o.demoUrl = r.demo_url;
  const shots = parseShots(r.screenshots);
  if (shots.length) o.screenshots = shots;
  if (r.access_guide) {
    o.hasAccessGuide = true; o.accessPrivate = !!r.access_private;
    if (level >= 1 || (opt.guide && (!r.access_private || opt.signedIn))) o.accessGuide = r.access_guide;
  }
  if (r.type === 'link' && r.link_status) { o.linkStatus = r.link_status; o.linkCheckedAt = r.link_checked_at || null; }
  if (level >= 1) { o.status = r.status; o.note = r.review_note || null; o.reviewedAt = r.reviewed_at || null; o.approvedVersion = r.approved_version || null; o.linkError = r.link_error || null; }
  if (level >= 2) { o.email = r.author_email || null; o.reviewedBy = r.reviewed_by || null; o.owner = r.owner_email || null; }
  return o;
}
async function ownerKeyOk(c, row) {
  const k = c.req.headers.get('x-owner-key');
  return !!k && !row.owner_email && !!row.owner_key_hash && timingSafeEq(await sha256(k), row.owner_key_hash);
}
const isOwnerSession = (s, row) => !!s && s.r !== 'owner' && !!row.owner_email && s.e === row.owner_email;
async function accessLevel(c, row) {
  const s = await session(c);
  if (isStaff(s)) return 2;
  if (isOwnerSession(s, row) || (await ownerKeyOk(c, row))) return 1;
  return 0;
}
// Manage (edit / delete / restore) requires a signed-in owner or an admin.
// A legacy app (no owner_email) is linked to the signed-in account when its owner key is presented.
async function requireManage(c, row) {
  const s = await session(c);
  if (!s) fail(401, '로그인이 필요합니다.');
  if (isAdmin(s)) return { s, admin: true };
  if (isOwnerSession(s, row)) return { s, admin: false };
  if (!row.owner_email && s.r !== 'owner' && (await ownerKeyOk(c, row))) {
    await linkOwner(c, s, row);
    return { s, admin: false, linked: true };
  }
  fail(403, '이 앱의 소유자만 관리할 수 있습니다.');
}
async function linkOwner(c, s, row) {
  // the legacy owner key is retired once the app belongs to an account
  await c.env.DB.prepare("UPDATE apps SET owner_email=?, author_email=COALESCE(author_email, ?), owner_key_hash='' WHERE id=? AND owner_email IS NULL").bind(s.e, s.e, row.id).run();
  await audit(c, 'app.claim', 'app', row.id, { name: row.name, owner: s.e }, true, s.e, s.r);
}
async function getSettings(env) {
  const s = { ...DEFAULT_SETTINGS };
  if (env.AUTO_APPROVE === 'true') s.auto_approve = 'true';
  try {
    const { results } = await env.DB.prepare('SELECT k, v FROM settings').all();
    for (const r of results) if (!r.k.startsWith('secret:') && r.k !== 'ai_config') s[r.k] = r.v;
  } catch (_) { /* before migration */ }
  return s;
}
function integrationStatus(env) {
  return {
    password: !!env.ADMIN_PASSWORD, sessionSecret: !!env.SESSION_SECRET, google: !!env.GOOGLE_CLIENT_ID,
    mail: mailEnabled(env), mailFrom: env.MAIL_FROM || 'KRVCF App Center <noreply@krvcf.com>',
    github: !!(env.GH_TOKEN && env.GH_REPO), repo: env.GH_REPO || null, branch: branch(env), version: env.VERSION || 'dev',
  };
}
async function hit(env, key, max, windowMs) {
  const now = Date.now();
  const row = await env.DB.prepare('SELECT count, reset_at FROM ratelimit WHERE k=?').bind(key).first();
  if (!row || row.reset_at < now) {
    await env.DB.prepare('INSERT INTO ratelimit (k,count,reset_at) VALUES (?,1,?) ON CONFLICT(k) DO UPDATE SET count=1, reset_at=excluded.reset_at').bind(key, now + windowMs).run();
    return true;
  }
  if (row.count >= max) return false;
  await env.DB.prepare('UPDATE ratelimit SET count=count+1 WHERE k=?').bind(key).run();
  return true;
}
const clientIp = (req) => req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || '0.0.0.0';
function maskIp(ip) {
  if (ip.includes('.')) return ip.split('.').slice(0, 3).join('.') + '.x';
  return ip.split(':').slice(0, 4).join(':') + ':x';
}
const voterId = async (ip) => (await sha256('voter:' + ip)).slice(0, 24);
function kstDayStart() {
  const kst = Date.now() + 9 * 3600000;
  return kst - (kst % 86400000) - 9 * 3600000;
}
async function sha256(s) {
  const d = await crypto.subtle.digest('SHA-256', enc(s));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
async function hmac(secret, data) {
  const key = await crypto.subtle.importKey('raw', enc(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64u(await crypto.subtle.sign('HMAC', key, enc(data)));
}
function timingSafeEq(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
function b64u(buf) {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64uDec(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Uint8Array.from(atob(s), (ch) => ch.charCodeAt(0));
}
function randomId(n) {
  const a = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return [...crypto.getRandomValues(new Uint8Array(n))].map((x) => a[x % 36]).join('');
}
const randomKey = () => b64u(crypto.getRandomValues(new Uint8Array(24)));
