/* KRVCF App Center — SPA (vanilla JS, hash routing) */
(() => {
  'use strict';

  /* ───────── Config ───────── */
  const CFG = window.APP_CONFIG || {};
  const LOC = (window.I18N && window.I18N.locale) || 'ko-KR';
  const EN_UI = !!(window.I18N && window.I18N.lang === 'en');
  const IS_MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const L = (ko, en) => (EN_UI ? en : ko); // sentences split by HTML tags are composed per language
  const API = (CFG.API_BASE || '').replace(/\/$/, '');
  const SITE = (CFG.SITE_URL || (location.origin + location.pathname)).replace(/\/$/, '');
  const CATS = [
    { k: 'Compute', ko: '컴퓨트', i: 'cpu' },
    { k: 'Storage', ko: '스토리지', i: 'db' },
    { k: 'Network', ko: '네트워크', i: 'net' },
    { k: 'Private AI', ko: 'Private AI', i: 'spark' },
    { k: 'DR', ko: 'DR / 백업', i: 'dr' },
    { k: 'Security', ko: '보안', i: 'lock' },
    { k: 'Dashboard', ko: '대시보드', i: 'gauge' },
    { k: 'Tools', ko: '도구', i: 'wrench' },
    { k: 'Code', ko: '코드', i: 'code' },
  ];
  const CAT = Object.fromEntries(CATS.map((c) => [c.k, c]));
  const TYPE_LABEL = { link: '카탈로그', html: '데모룸' };
  const STATUS_LABEL = { approved: '승인됨', pending: '승인 대기', rejected: '반려됨' };
  const MAX_HTML = 10 * 1024 * 1024;

  const P = {
    home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/><path d="m10 8 4 2-4 2z" fill="currentColor"/>',
    plus: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    folder: '<path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
    shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="currentColor" stroke="none"/>',
    play: '<path d="M7 4v16l13-8z" fill="currentColor" stroke="none"/>',
    share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
    ext: '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    up: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
    down: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="m3 7 9 6 9-6"/>',
    git: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="9" r="2.5"/><path d="M6 8.5v7M18 11.5c0 4-6 3-11 5"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    log: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    pulse: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
    trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    rss: '<path d="M5 11a8 8 0 0 1 8 8M5 5a14 14 0 0 1 14 14"/><circle cx="6" cy="18" r="1.5" fill="currentColor"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    rocket: '<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2"/><path d="M9 15 6 12c1-4 5-9 13-9 0 8-5 12-9 13z"/><circle cx="14.5" cy="9.5" r="1.5"/>',
    logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
    pin: '<path d="M12 17v5M8 3h8l-1 6 3 3H6l3-3z"/>',
    cpu: '<rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
    db: '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.5"/><path d="M4.5 5.5v13c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-13"/><path d="M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5"/>',
    net: '<rect x="9" y="2.5" width="6" height="5" rx="1"/><rect x="2.5" y="16.5" width="6" height="5" rx="1"/><rect x="15.5" y="16.5" width="6" height="5" rx="1"/><path d="M12 7.5V12M5.5 16.5V12h13v4.5"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    dr: '<path d="M3 12a9 9 0 0 1 15.4-6.4L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.4 6.4L3 16"/><path d="M3 21v-5h5"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10.5" rx="1.5"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/><circle cx="12" cy="15.5" r="1.3"/>',
    gauge: '<path d="M3.5 17a9 9 0 1 1 17 0"/><path d="m12 13 4.5-4.5"/><circle cx="12" cy="13" r="1.4"/>',
    wrench: '<path d="M14.5 6.5a4 4 0 0 0 5 5L21 13l-8 8-3-3 1.5-1.5a4 4 0 0 0-5-5L3 10l3-3 1.5 1.5a4 4 0 0 0 5-5z"/>',
    code: '<path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  };
  const ico = (n, s = 16) =>
    `<svg class="ico" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const main = $('#main');

  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* noop */ } },
  };

  const state = {
    apps: [], loaded: false, apiOk: null, stats: null,
    view: ls.get('krvcf.view', 'card'), sort: ls.get('krvcf.sort', 'popular'), q: '',
    navOpen: ls.get('krvcf.navOpen', { link: true, html: true }),
    admin: null, adminTab: 'summary',
  };

  /* ───────── Utils ───────── */
  const fmtDate = (t) => (t ? new Date(t).toLocaleDateString(LOC, { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-');
  const fmtTime = (t) => (t ? new Date(t).toLocaleString(LOC, { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-');
  const fmtSize = (b) => (!b ? '-' : b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(2) + ' MB');
  const fmtNum = (n) => Number(n || 0).toLocaleString(LOC);
  const catLabel = (k) => (CAT[k] ? CAT[k].ko : k);
  const getSess = () => { const x = ls.get('krvcf.session', null); if (x && x.expiresAt > Date.now()) return x; if (x) ls.set('krvcf.session', null); return null; };
  const setSess = (x) => ls.set('krvcf.session', x);
  const token = () => (getSess() || {}).token || null;
  const role = () => ((getSess() || {}).user || {}).role || null;
  const isStaff = () => ['owner', 'admin', 'approver'].includes(role());
  const isAdmin = () => ['owner', 'admin'].includes(role());
  const ROLE_LABEL = { owner: '최고 관리자', admin: '관리자', approver: '승인자', user: L('크리에이터', 'Creator') };
  const me = () => (getSess() || {}).user || null;
  const myKeys = () => ls.get('krvcf.myapps', []);
  const myKey = (id) => (myKeys().find((x) => x.id === id) || {}).key;
  const saveMyKey = (id, key, name) => {
    const arr = myKeys().filter((x) => x.id !== id);
    arr.unshift({ id, key, name, savedAt: Date.now() });
    ls.set('krvcf.myapps', arr);
  };
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  function hashNum(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function gradient(id) {
    const h = hashNum(id); const a = h % 360; const b = (a + 35 + ((h >> 9) % 70)) % 360;
    return `linear-gradient(135deg,hsl(${a} 58% 40%),hsl(${b} 66% 26%))`;
  }
  function initials(name) {
    const w = String(name || '').trim().split(/\s+/).filter(Boolean);
    return (w.length > 1 ? w[0][0] + w[1][0] : (w[0] || '?').slice(0, 2)).toUpperCase();
  }
  function thumb(app, icoSize = 34) {
    const ci = (CAT[app.category] || {}).i || 'grid';
    const tsrc = app.thumbnail || (app.screenshots && app.screenshots[0] && app.screenshots[0].url) || '';
    const img = tsrc ? `<img class="thumb-img" src="${esc(tsrc)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : '';
    return `<div class="thumb${tsrc ? ' has-img' : ''}" style="background:${gradient(app.id)}">${img}<span class="thumb-ico">${ico(ci, icoSize)}</span><span class="thumb-init">${esc(initials(app.name))}</span></div>`;
  }
  document.addEventListener('error', (e) => {
    const t = e.target;
    if (t && t.classList && t.classList.contains('thumb-img')) { t.parentElement.classList.remove('has-img'); t.remove(); }
  }, true);
  function stars(r, n) {
    return `<span class="stars">${ico('star', 13)} ${r ? r.toFixed(1) : '0.0'}<span class="t">(${fmtNum(n)})</span></span>`;
  }

  /* ───────── API ───────── */
  async function api(path, opts = {}) {
    const headers = Object.assign({}, opts.headers || {});
    let body = opts.body;
    if (typeof Blob !== 'undefined' && body instanceof Blob) headers['content-type'] = body.type || 'application/octet-stream';
    else if (body !== undefined && typeof body !== 'string') { headers['content-type'] = 'application/json'; body = JSON.stringify(body); }
    const tok = token();
    if (tok) headers.authorization = 'Bearer ' + tok;
    headers['x-lang'] = EN_UI ? 'en' : 'ko';
    let r;
    try {
      r = await fetch(API + path, { method: opts.method || 'GET', headers, body });
    } catch (_) {
      setApi(false);
      throw new Error('API 서버에 연결할 수 없습니다.');
    }
    setApi(true);
    const t = await r.text();
    let d; try { d = t ? JSON.parse(t) : {}; } catch (_) { d = { error: t.slice(0, 200) }; }
    if (r.status === 401 && tok && !path.startsWith('/api/auth/')) {
      setSess(null); updateUser(); state.my = null; state.studio = null; renderNav();
      toast(L('로그인이 만료되었거나 해제되었습니다. 다시 로그인하세요.', 'Your session expired or was revoked. Please sign in again.'), 'error', 5000);
    } else if (r.status === 401 && tok && path === '/api/auth/me') { setSess(null); updateUser(); }
    if (!r.ok) throw Object.assign(new Error(d.error || 'HTTP ' + r.status), { status: r.status });
    return d;
  }
  function setApi(ok) {
    if (state.apiOk === ok) return;
    state.apiOk = ok;
    const el = $('#apiState');
    el.className = 'tasks-api ' + (ok ? 'ok' : 'bad');
    el.innerHTML = `<i></i>${ok ? 'API 연결됨' : 'API 연결 실패'}`;
  }
  async function loadApps(force) {
    if (state.loaded && !force) return state.apps;
    try {
      const d = await api('/api/apps');
      state.apps = d.apps || [];
      state.loaded = true;
    } catch (e) {
      state.apps = state.apps || [];
      state.loadError = e.message;
    }
    renderNav();
    return state.apps;
  }
  // Approved apps run from a public, cacheable URL. Previews (pending app / older version) use a short-lived
  // run ticket scoped to this app, so no session token or owner key ever reaches the sandboxed page.
  async function runUrl(app, ownerKey, ver) {
    if (!ver && (!app.status || app.status === 'approved')) return `${API}/run/${app.id}`;
    const { rt } = await api(`/api/apps/${app.id}/run-ticket`, { method: 'POST', body: {}, headers: ownerKey ? { 'x-owner-key': ownerKey } : {} });
    const p = new URLSearchParams({ rt });
    if (ver) p.set('v', ver);
    return `${API}/run/${app.id}?${p}`;
  }

  /* ───────── Recent Tasks ───────── */
  const tasks = [];
  function task(name, target) {
    const t = { name, target, status: 'run', msg: '진행 중', start: Date.now(), end: null };
    tasks.unshift(t); if (tasks.length > 60) tasks.pop();
    renderTasks();
    return {
      ok(msg) { t.status = 'ok'; t.msg = msg || '완료'; t.end = Date.now(); renderTasks(); },
      fail(msg) { t.status = 'fail'; t.msg = '실패' + (msg ? ': ' + msg : ''); t.end = Date.now(); renderTasks(); },
    };
  }
  async function runTask(name, target, fn, okMsg) {
    const t = task(name, target);
    try { const r = await fn(); t.ok(okMsg); return r; } catch (e) { t.fail(e.message); toast(e.message, 'error'); throw e; }
  }
  function renderTasks() {
    $('#tasksCount').textContent = tasks.length;
    const last = tasks[0];
    $('#tasksLast').innerHTML = last ? `${esc(last.name)} — ${esc(last.target)} · <span class="st-${last.status}">${esc(last.msg)}</span>` : '';
    $('#tasksBody').innerHTML = tasks.length
      ? tasks.map((t) => `<tr><td>${esc(t.name)}</td><td>${esc(t.target)}</td><td class="st-${t.status}">${t.status === 'ok' ? ico('check', 13) + ' ' : ''}${esc(t.msg)}</td><td>${fmtTime(t.start)}</td><td>${t.end ? fmtTime(t.end) : '-'}</td></tr>`).join('')
      : '<tr><td colspan="5" class="empty">아직 작업이 없습니다.</td></tr>';
  }

  /* ───────── Toasts / modals ───────── */
  function toast(msg, type = 'info', ms = 3200) {
    const el = document.createElement('div');
    el.className = 'toast ' + type; el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), ms);
  }
  const modals = [];
  function modal({ title = '', body = '', foot = '', cls = '', bgCls = '', closable = true, raw = false, onClose } = {}) {
    const bg = document.createElement('div');
    bg.className = 'modal-bg ' + bgCls;
    bg.innerHTML = raw ? body : `<div class="modal ${cls}" role="dialog" aria-modal="true"><div class="modal-hd"><span>${title}</span>${closable ? `<button class="icon-btn" data-close aria-label="닫기">${ico('x', 18)}</button>` : ''}</div><div class="modal-bd">${body}</div>${foot ? `<div class="modal-ft">${foot}</div>` : ''}</div>`;
    $('#modalRoot').appendChild(bg);
    const m = { el: bg, close() { if (!bg.isConnected) return; bg.remove(); modals.splice(modals.indexOf(m), 1); if (onClose) onClose(); } };
    modals.push(m);
    bg.addEventListener('click', (e) => { if ((e.target === bg && closable && !raw) || e.target.closest('[data-close]')) m.close(); });
    return m;
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modals.length && !document.fullscreenElement) modals[modals.length - 1].close();
  });
  function confirmBox(title, msg, okLabel = '확인', danger = false) {
    return new Promise((res) => {
      let done = false;
      const m = modal({
        title, body: `<p>${msg}</p>`,
        foot: `<button class="btn" data-close>취소</button><button class="btn ${danger ? 'btn-danger solid' : 'btn-primary'}" data-ok>${esc(okLabel)}</button>`,
        onClose: () => { if (!done) res(false); },
      });
      $('[data-ok]', m.el).onclick = () => { done = true; m.close(); res(true); };
    });
  }
  function promptBox(title, label, { placeholder = '', okLabel = '확인', multiline = false, value = '' } = {}) {
    return new Promise((res) => {
      let done = false;
      const input = multiline
        ? `<textarea class="textarea" data-in placeholder="${esc(placeholder)}">${esc(value)}</textarea>`
        : `<input class="input" data-in placeholder="${esc(placeholder)}" value="${esc(value)}">`;
      const m = modal({
        title, body: `<p style="margin-top:0">${label}</p>${input}`,
        foot: `<button class="btn" data-close>취소</button><button class="btn btn-primary" data-ok>${esc(okLabel)}</button>`,
        onClose: () => { if (!done) res(null); },
      });
      const el = $('[data-in]', m.el); el.focus();
      $('[data-ok]', m.el).onclick = () => { done = true; const v = el.value; m.close(); res(v); };
    });
  }
  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; }
    catch (_) {
      const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (_) { /* noop */ }
      ta.remove(); return ok;
    }
  }
  function download(name, text, type = 'application/json') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ───────── Navigator ───────── */
  function counts(type) {
    const o = { _all: 0 };
    for (const a of state.apps) if (!type || a.type === type) { o._all++; o[a.category] = (o[a.category] || 0) + 1; }
    return o;
  }
  function renderNav() {
    const all = counts(), lc = counts('link'), hc = counts('html');
    const group = (key, label, icon, c) => `
      <a class="nav-item ${state.navOpen[key] ? 'open' : ''}" href="#/${key === 'link' ? 'catalog' : 'demo'}" data-nav="${key === 'link' ? 'catalog' : 'demo'}">
        <span class="caret" data-tg="${key}"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8 4l10 8-10 8z"/></svg></span>${ico(icon)}<span>${label}</span><span class="cnt">${c._all}</span></a>
      <div class="nav-children ${state.navOpen[key] ? 'open' : ''}">
        ${CATS.filter((x) => c[x.k]).map((x) => `<a class="nav-item" href="#/${key === 'link' ? 'catalog' : 'demo'}/${encodeURIComponent(x.k)}" data-nav="${key === 'link' ? 'catalog' : 'demo'}/${esc(x.k)}">${ico(x.i, 14)}<span>${x.ko}</span><span class="cnt">${c[x.k] || 0}</span></a>`).join('')}
      </div>`;
    $('#nav').innerHTML = `
      <div class="nav-sec">탐색</div>
      <a class="nav-item" href="#/" data-nav="home">${ico('home')}<span>홈</span></a>
      <a class="nav-item" href="#/all" data-nav="all">${ico('grid')}<span>전체 앱</span><span class="cnt">${all._all}</span></a>
      ${group('link', '카탈로그', 'link', lc)}
      ${group('html', '데모룸', 'monitor', hc)}
      <a class="nav-item" href="#/favs" data-nav="favs">${ico('star')}<span>즐겨찾기</span><span class="cnt">${favs().length || ''}</span></a>
      <div class="nav-sec">작업</div>
      <a class="nav-item" href="#/submit" data-nav="submit">${ico('plus')}<span>앱 등록</span></a>
      <a class="nav-item" href="#/studio" data-nav="studio">${ico('folder')}<span>${L('내 앱 관리', 'My apps')}</span><span class="cnt">${state.myCount || ''}</span></a>
      <a class="nav-item" href="#/admin" data-nav="admin">${ico('shield')}<span>관리 콘솔</span></a>
      <div class="live-count" id="liveCount"></div>
      <div class="nav-foot" style="padding-bottom:0"><a href="${API}/feed.xml" target="_blank" rel="noopener">${ico('rss', 13)} RSS</a> · <a href="javascript:void 0" data-palette>${ico('search', 13)} ${L('빠른 이동', 'Quick jump')} <kbd class="kbd">${IS_MAC ? '⌘K' : 'Ctrl K'}</kbd></a></div>
      <div class="nav-foot">비공식 커뮤니티 페이지입니다. VMware·Broadcom의 공식 서비스가 아니며, 등록된 앱의 책임은 작성자에게 있습니다.</div>`;
    setActiveNav();
  }
  function setActiveNav() {
    const { parts } = parseHash();
    const key = parts.length ? (parts[0] === 'app' || parts[0] === 'submit' && parts[1] ? '' : parts[0] === 'studio' ? 'studio' : parts.slice(0, 2).join('/')) : 'home';
    $$('#nav .nav-item').forEach((el) => el.classList.toggle('active', el.dataset.nav === key));
    const top = parts[0] || 'home';
    const tb = { home: 'home', all: 'all', catalog: 'all', demo: 'all', app: 'all', tag: 'all', author: 'all', submit: 'submit', favs: 'favs', mine: 'mine', studio: 'mine', admin: 'mine' }[top];
    $$('#tabbar a').forEach((a) => a.classList.toggle('on', a.dataset.tb === tb));
    renderLive();
  }
  $('#nav').addEventListener('click', (e) => {
    const tg = e.target.closest('[data-tg]');
    if (tg) {
      e.preventDefault(); e.stopPropagation();
      const k = tg.dataset.tg; state.navOpen[k] = !state.navOpen[k]; ls.set('krvcf.navOpen', state.navOpen); renderNav();
      return;
    }
    if (e.target.closest('.nav-item')) document.body.classList.remove('nav-open');
  });
  $('#navToggle').onclick = () => document.body.classList.toggle('nav-open');
  $('#navScrim').onclick = () => document.body.classList.remove('nav-open');
  $('#tasksToggle').onclick = () => document.body.classList.toggle('tasks-open');
  $('#themeBtn').onclick = () => {
    const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('krvcf.theme', t); } catch (_) { /* noop */ }
  };
  function avatar(u, size = 26) {
    if (!u) return '';
    const nm = u.role === 'owner' || u.email === 'owner' ? 'Admin' : u.name || u.email || '?';
    return u.picture ? `<img class="avatar" src="${esc(u.picture)}" alt="" width="${size}" height="${size}" referrerpolicy="no-referrer">`
      : `<span class="avatar" style="width:${size}px;height:${size}px;background:${gradient(u.email || nm)};font-size:${Math.round(size * 0.42)}px">${esc(initials(nm).slice(0, 1))}</span>`;
  }
  const USER_ICO = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
  function updateUser() {
    const u = me();
    const b = $('#userBtn');
    b.innerHTML = u ? `${avatar(u, 26)}<span id="userLabel" data-notr>${esc(u.name || u.email)}</span>` : `${USER_ICO}<span id="userLabel">${L('로그인', 'Sign in')}</span>`;
    b.title = u ? `${ROLE_LABEL[u.role] || ''} · ${u.email}` : L('Google 계정으로 로그인', 'Sign in with Google');
    b.setAttribute('href', u ? '#/studio' : 'javascript:void 0');
    if ($('#tabbar') && $('#tabbar').innerHTML) renderTabbar();
    if (!u) state.myCount = 0;
  }

  /* Global search */
  const gq = $('#gq');
  gq.addEventListener('input', debounce(() => {
    state.q = gq.value.trim();
    const r = parseHash().parts[0];
    if (['all', 'catalog', 'demo', 'tag', 'author'].includes(r)) renderListBody();
    else if (state.q) location.hash = '#/all';
  }, 180));

  /* ───────── Router ───────── */
  function parseHash() {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    return { parts: path.split('/').filter(Boolean).map((s) => { try { return decodeURIComponent(s); } catch (_) { return s; } }), params: new URLSearchParams(qs || '') };
  }
  let currentView = '';
  async function render() {
    const { parts } = parseHash();
    const r = parts[0] || 'home';
    currentView = r;
    while (modals.length) modals[modals.length - 1].close(); // dialogs never outlive the page they were opened on
    setActiveNav();
    track(parts);
    document.body.classList.remove('nav-open');
    main.scrollTop = 0;
    try {
      switch (r) {
        case 'home': return await viewHome();
        case 'all': return await viewList('all', parts[1]);
        case 'favs': return await viewList('fav');
        case 'catalog': return await viewList('link', parts[1]);
        case 'demo': return await viewList('html', parts[1]);
        case 'app': return await viewDetail(parts[1]);
        case 'tag': return await viewList('all', undefined, { tag: parts[1] });
        case 'author': return await viewList('all', undefined, { author: parts[1] });
        case 'submit': return await viewSubmit(parts[1]);
        case 'mine': location.replace('#/studio'); return;
        case 'studio': return await viewStudio(parts[1], parts[2]);
        case 'admin': return await viewAdmin();
        default: main.innerHTML = page('', `<div class="empty-state">${ico('grid', 48)}<h2>페이지를 찾을 수 없습니다</h2><p><a href="#/">홈으로</a></p></div>`);
      }
    } catch (e) {
      main.innerHTML = page('', `<div class="alert danger">${esc(e.message)}</div>`);
    }
  }
  const noticeHtml = () => `<div id="noticeBar">${state.cfg && state.cfg.notice ? `<div class="notice-bar">${ico('chat')} ${esc(state.cfg.notice)}</div>` : ''}</div>`;
  const page = (crumbs, html) => `${noticeHtml()}<div class="page">${crumbs ? `<div class="crumbs">${crumbs}</div>` : ''}${html}</div>`;
  const apiAlert = () => (state.loadError && !state.apps.length
    ? `<div class="alert danger">${ico('x')}<div><b>API 서버에 연결할 수 없습니다.</b><br>config.js 의 API_BASE(<span class="mono">${esc(API || '미설정')}</span>)와 Worker 배포 상태를 확인하세요.</div></div>` : '');

  /* ───────── Home ───────── */
  async function viewHome() {
    main.innerHTML = page('', '<div class="skel" style="height:120px;margin-bottom:16px"></div><div class="skel" style="height:300px"></div>');
    await loadApps();
    await loadStats();
    if (currentView !== 'home') return;
    const st = state.stats;
    const apps = state.apps;
    const byId = Object.fromEntries(apps.map((a) => [a.id, a]));
    const popular = [...apps].sort((a, b) => b.runs - a.runs || b.views - a.views).slice(0, 6);
    const recent = [...apps].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
    const featured = apps.filter((a) => a.featured).slice(0, 4);
    const favList = favs().map((id) => byId[id]).filter(Boolean);
    const seenList = recentSeen().map((id) => byId[id]).filter(Boolean).slice(0, 6);
    const trending = (st && st.trending) || [];
    const all = counts();
    const mrow = (a, right) => `<li data-id="${a.id}">${thumb(a, 18)}<div class="mt"><b>${esc(a.name)}</b><span>${TYPE_LABEL[a.type]} · ${esc(catLabel(a.category))} · ${esc(a.author)}</span></div><div class="mr">${right}</div></li>`;
    main.innerHTML = page('', `
      <section class="hero">
        <div class="hero-in">
          <div class="eyebrow">${ico('spark', 12)} VCF Community</div>
          <h1>KRVCF App Center</h1>
          <p>VCF 커뮤니티가 만든 미니 앱과 HTML 시뮬레이터를 공유하고 바로 실행하세요.</p>
          <form class="hero-search" id="heroForm" role="search">${ico('search', 18)}<input id="heroQ" type="search" autocomplete="off" placeholder="${L('앱 이름, 작성자, #태그로 찾기', 'Find apps by name, author or #tag')}"><button class="btn btn-primary" type="submit">${L('검색', 'Search')}</button></form>
          <div class="hero-cta"><a class="btn btn-primary" href="#/submit">${ico('plus')} 앱 등록</a><a class="btn btn-ghost" href="#/all">${ico('grid')} 전체 앱 보기</a></div>
        </div>
        <div class="hero-stats">
          <div><b>${fmtNum(st ? st.links + st.htmls : apps.length)}</b><span>등록된 앱</span></div>
          <div><b>${fmtNum(st ? st.runs : apps.reduce((t, a) => t + a.runs, 0))}</b><span>누적 실행</span></div>
          <div><b>${st ? fmtNum(st.todayVisitors) : '-'}</b><span>오늘 방문자</span></div>
          <div><b>${st ? fmtNum(st.totalVisitors) : '-'}</b><span>누적 방문자</span></div>
          <div class="live"><b><i class="dot"></i>${st ? fmtNum(st.online) : '-'}</b><span>현재 접속</span></div>
        </div>
      </section>
      ${apiAlert()}
      ${favList.length ? `<div class="portlet" style="margin-bottom:16px"><div class="portlet-hd">${ico('star')} 즐겨찾기<span class="acts"><a href="#/favs">모두 보기</a></span></div><div class="portlet-bd"><div class="cards">${favList.slice(0, 4).map(card).join('')}</div></div></div>` : ''}
      ${featured.length ? `<div class="sec-hd"><h2>${ico('pin', 18)} 추천 앱</h2></div><div class="cards hrow" style="margin-bottom:24px">${featured.map(card).join('')}</div>` : ''}
      ${popular.length ? `<div class="sec-hd"><h2>${ico('trend', 18)} ${L('인기 앱', 'Popular apps')}</h2><a href="#/all">${L('모두 보기', 'View all')} →</a></div><div class="cards hrow" style="margin-bottom:24px">${popular.slice(0, 4).map(card).join('')}</div>` : ''}
      <div class="row2">
        <div class="portlet"><div class="portlet-hd">${ico('trend')} 이번 주 인기<span class="acts" style="font-size:12px;color:var(--muted)">최근 7일 조회·실행</span></div><div class="portlet-bd flush">
          ${trending.length ? `<ul class="mlist">${trending.map((a, i) => mrow({ ...a, name: `${i + 1}. ${a.name}` }, `${ico('eye', 11)} ${fmtNum(a.weekViews)} · ${ico('play', 11)} ${fmtNum(a.weekRuns)}`)).join('')}</ul>`
          : popular.length ? `<ul class="mlist">${popular.map((a) => mrow(a, `${ico('play', 11)} ${fmtNum(a.runs)}<br>${stars(a.rating, a.ratingCount)}`)).join('')}</ul>` : emptyMini()}</div></div>
        <div class="portlet"><div class="portlet-hd">${ico('clock')} ${seenList.length ? '최근 본 앱' : '최근 등록'}<span class="acts"><a href="#/all">모두 보기</a></span></div><div class="portlet-bd flush">
          ${seenList.length ? `<ul class="mlist">${seenList.map((a) => mrow(a, `${ico('eye', 11)} ${fmtNum(a.views)}`)).join('')}</ul>`
          : recent.length ? `<ul class="mlist">${recent.map((a) => mrow(a, fmtDate(a.createdAt))).join('')}</ul>` : emptyMini()}</div></div>
      </div>
      <div class="portlet"><div class="portlet-hd">${ico('grid')} 카테고리</div><div class="portlet-bd"><div class="ctiles">
        ${CATS.map((c) => `<a class="ctile" href="#/all/${encodeURIComponent(c.k)}">${ico(c.i, 20)}<span>${c.ko}</span><span class="n">${all[c.k] || 0}</span></a>`).join('')}
      </div></div></div>
      ${tagCloud(apps)}
      <div class="disclaimer"><b>Legal Notice & Disclaimer</b> — 본 사이트는 비공식 커뮤니티 페이지이며 VMware 또는 Broadcom의 공식 서비스가 아닙니다. 등록된 앱은 작성자의 책임이며, 데모룸 HTML 앱은 격리된 샌드박스에서 실행됩니다. 앱 사용으로 인한 문제나 데이터 손실에 대한 책임은 사용자에게 있습니다.</div>`);
    bindAppClicks(main);
    $('#heroForm').onsubmit = (e) => { e.preventDefault(); const v = $('#heroQ').value.trim(); gq.value = v; state.q = v; location.hash = '#/all'; };
  }
  const statCard = (i, l, v, sub = '', cls = '') => `<div class="stat ${cls}"><div class="si">${ico(i, 20)}</div><div><div class="sv">${typeof v === 'number' ? fmtNum(v) : esc(v)}</div><div class="sl">${l}</div>${sub ? `<div class="ss">${sub}</div>` : ''}</div></div>`;
  const emptyMini = () => `<div class="empty-state" style="padding:30px">아직 등록된 앱이 없습니다.<br><a href="#/submit">첫 앱을 등록해 보세요 →</a></div>`;

  /* ───────── Visit tracking · live presence · favorites ───────── */
  function visitorId() {
    let v = ls.get('krvcf.vid', null);
    if (!v || !/^[a-z0-9]{16,40}$/.test(v)) {
      const a = 'abcdefghijklmnopqrstuvwxyz0123456789';
      v = [...crypto.getRandomValues(new Uint8Array(24))].map((x) => a[x % 36]).join('');
      ls.set('krvcf.vid', v);
    }
    return v;
  }
  let lastTracked = '';
  function track(parts) {
    const path = '#/' + parts.join('/');
    if (parts[0] === 'admin' || path === lastTracked) return;
    lastTracked = path;
    let entry = false;
    try { if (!sessionStorage.getItem('krvcf.entry')) { sessionStorage.setItem('krvcf.entry', '1'); entry = true; } } catch (_) { /* noop */ }
    api('/api/visit', { method: 'POST', body: { vid: visitorId(), path: path.slice(0, 200), app: parts[0] === 'app' ? parts[1] : undefined, entry, ref: entry ? document.referrer : undefined } }).catch(() => {});
  }
  async function loadStats() {
    try { state.stats = await api('/api/stats'); } catch (_) { /* noop */ }
    renderLive();
  }
  function renderLive() {
    const el = $('#liveCount'); const s = state.stats; if (!el || !s) return;
    el.innerHTML = L(`<span class="live-dot"></span>현재 <b>${fmtNum(s.online)}</b>명 · 오늘 <b>${fmtNum(s.todayVisitors)}</b> · 전체 <b>${fmtNum(s.totalVisitors)}</b>`,
      `<span class="live-dot"></span><b>${fmtNum(s.online)}</b> online · today <b>${fmtNum(s.todayVisitors)}</b> · total <b>${fmtNum(s.totalVisitors)}</b>`);
  }
  async function heartbeat() {
    if (document.visibilityState !== 'visible') return;
    try {
      const d = await api('/api/ping', { method: 'POST', body: { vid: visitorId(), path: location.hash.split('?')[0].slice(0, 200) || '#/' } });
      if (state.stats) { state.stats.online = d.online; renderLive(); }
    } catch (_) { /* noop */ }
  }
  const favs = () => ls.get('krvcf.favs', []);
  const isFav = (id) => favs().includes(id);
  function toggleFav(id) {
    const f = favs(); const on = !f.includes(id);
    ls.set('krvcf.favs', on ? [id, ...f] : f.filter((x) => x !== id));
    if (me()) api('/api/my/favs', { method: 'POST', body: on ? { add: [id] } : { remove: [id] } }).catch(() => {});
    $$(`[data-fav="${id}"]`).forEach((b) => { b.classList.toggle('on', on); b.title = on ? '즐겨찾기 해제' : '즐겨찾기'; });
    toast(on ? '즐겨찾기에 추가했습니다.' : '즐겨찾기에서 제거했습니다.', 'success', 1800);
    renderNav();
    if (parseHash().parts[0] === 'favs') renderListBody();
  }
  const recentSeen = () => ls.get('krvcf.recent', []);
  const pushRecent = (id) => ls.set('krvcf.recent', [id, ...recentSeen().filter((x) => x !== id)].slice(0, 20));
  const favBtn = (id, big) => `<button class="${big ? 'btn' : 'fav-btn'} ${isFav(id) ? 'on' : ''}" data-fav="${id}" title="${isFav(id) ? '즐겨찾기 해제' : '즐겨찾기'}">${ico('star', big ? 14 : 16)}${big ? ' 즐겨찾기' : ''}</button>`;

  /* ───────── Lists (all / catalog / demo room) ───────── */
  let listCtx = null;
  async function viewList(type, cat, opt = {}) {
    if (cat && !CAT[cat]) cat = undefined;
    listCtx = { type, cat, tag: opt.tag || null, author: opt.author || null };
    const special = opt.tag || opt.author;
    const title = opt.tag ? `#${esc(opt.tag)}` : opt.author ? esc(opt.author) : { all: '전체 앱', link: '카탈로그', html: '데모룸', fav: '즐겨찾기' }[type];
    const sub = {
      all: '등록된 모든 미니 앱과 시뮬레이터',
      fav: '별표로 저장한 앱 (이 브라우저에 저장)',
      link: '외부 웹 링크로 연결되는 미니 앱 — 새 탭에서 실행됩니다.',
      html: '첨부된 HTML 시뮬레이터 — 격리된 전체 화면 모달에서 즉시 실행됩니다.',
    }[type];
    const route = { all: 'all', link: 'catalog', html: 'demo', fav: 'favs' }[type];
    const c = counts(type === 'all' || type === 'fav' ? null : type);
    const crumbs = special ? `<a href="#/">홈</a> / <a href="#/all">전체 앱</a> / <span data-notr>${title}</span>` : `<a href="#/">홈</a> / ${cat ? `<a href="#/${route}">${title}</a> / ${esc(catLabel(cat))}` : title}`;
    main.innerHTML = page(crumbs, `
      <div class="page-hd"><div>${special ? `<div class="t2" style="font-size:12.5px">${opt.tag ? `${ico('tag', 13)} ${L('태그', 'Tag')}` : `${ico('user', 13)} ${L('작성자', 'Author')}`}</div>` : ''}<h1 ${special ? 'data-notr' : ''}>${cat ? esc(catLabel(cat)) : title}</h1><p id="listSub">${special ? (opt.tag ? L('이 태그가 달린 앱', 'Apps with this tag') : '') : sub}</p></div>
        <div class="acts"><a class="btn btn-primary" href="#/submit${type === 'all' ? '' : '?type=' + type}">${ico('plus')} 앱 등록</a></div></div>
      ${apiAlert()}
      <div class="chips" style="margin-bottom:14px;${special ? 'display:none' : ''}" id="catChips">
        <a class="chip ${!cat ? 'on' : ''}" href="#/${route}">전체 <span class="n">${c._all}</span></a>
        ${CATS.map((x) => `<a class="chip ${cat === x.k ? 'on' : ''}" href="#/${route}/${encodeURIComponent(x.k)}">${ico(x.i, 13)} ${x.ko} <span class="n">${c[x.k] || 0}</span></a>`).join('')}
      </div>
      <div class="toolbar">
        <label class="lsearch">${ico('list', 14)}<input id="lq" placeholder="목록 내 필터" value="${esc(state.q)}"></label>
        <select class="select" id="sortSel" style="width:auto">
          <option value="popular">인기순 (실행 수)</option><option value="views">조회순</option><option value="rating">평점 높은 순</option><option value="newest">최신 등록순</option><option value="name">이름순 (가나다)</option>
        </select>
        <span class="grow"></span><span class="count" id="listCount"></span>
        <div class="btn-group"><button class="btn btn-sm ${state.view === 'card' ? 'on' : ''}" data-view="card" title="카드 보기">${ico('grid', 14)}</button><button class="btn btn-sm ${state.view === 'grid' ? 'on' : ''}" data-view="grid" title="목록 보기">${ico('list', 14)}</button></div>
        <button class="icon-btn" id="refreshBtn" title="새로고침">${ico('refresh')}</button>
      </div>
      <div id="listBody"><div class="cards">${'<div class="skel" style="height:250px"></div>'.repeat(4)}</div></div>`);
    $('#sortSel').value = state.sort;
    $('#sortSel').onchange = (e) => { state.sort = e.target.value; ls.set('krvcf.sort', state.sort); renderListBody(); };
    $('#lq').oninput = debounce((e) => { state.q = e.target.value.trim(); gq.value = state.q; renderListBody(); }, 150);
    $$('[data-view]').forEach((b) => (b.onclick = () => {
      state.view = b.dataset.view; ls.set('krvcf.view', state.view);
      $$('[data-view]').forEach((x) => x.classList.toggle('on', x === b)); renderListBody();
    }));
    $('#refreshBtn').onclick = () => runTask('목록 새로고침', title, async () => { await loadApps(true); renderListBody(); });
    await loadApps();
    if (listCtx && listCtx.type === type) renderListBody();
  }
  function filtered() {
    const { type, cat } = listCtx;
    const q = state.q.toLowerCase();
    const fv = favs();
    const { tag, author } = listCtx;
    let arr = state.apps.filter((a) => (type === 'all' || a.type === type || (type === 'fav' && fv.includes(a.id))) && (!cat || a.category === cat) &&
      (!tag || (a.tags || []).includes(tag)) && (!author || a.author === author) &&
      textMatch([a.name, a.description, a.author, a.category, catLabel(a.category), ...(a.tags || []).map((t) => '#' + t)].join(' '), q));
    const s = state.sort;
    arr.sort((a, b) =>
      s === 'rating' ? b.rating - a.rating || b.ratingCount - a.ratingCount
        : s === 'newest' ? b.createdAt - a.createdAt
          : s === 'name' ? a.name.localeCompare(b.name, 'ko')
            : s === 'views' ? b.views - a.views
            : b.featured - a.featured || b.runs - a.runs);
    return arr;
  }
  function renderListBody() {
    const el = $('#listBody'); if (!el || !listCtx) return;
    const arr = filtered();
    $('#listCount').textContent = `${fmtNum(arr.length)}개 항목`;
    if (listCtx.author && $('#listSub')) {
      const runs = arr.reduce((t, a) => t + a.runs, 0); const rated = arr.filter((a) => a.ratingCount);
      const avgR = rated.length ? (rated.reduce((t, a) => t + a.rating * a.ratingCount, 0) / rated.reduce((t, a) => t + a.ratingCount, 0)).toFixed(1) : '-';
      $('#listSub').textContent = L(`앱 ${arr.length}개 · 누적 실행 ${fmtNum(runs)} · 평균 평점 ${avgR}`, `${arr.length} app${arr.length === 1 ? "" : "s"} · ${fmtNum(runs)} total runs · avg rating ${avgR}`);
    }
    if (!arr.length) {
      el.innerHTML = `<div class="empty-state">${ico(listCtx.type === 'html' ? 'monitor' : 'grid', 48)}<h3>앱이 없습니다</h3><p>${state.q ? '검색 조건에 맞는 앱이 없습니다.' : '이 분류에 등록된 앱이 아직 없습니다.'}</p><a class="btn btn-primary" href="#/submit">${ico('plus')} 앱 등록</a></div>`;
      return;
    }
    el.innerHTML = state.view === 'grid'
      ? `<div class="gridwrap"><table class="grid"><thead><tr><th>이름</th><th>유형</th><th>카테고리</th><th>평점</th><th>조회</th><th>실행</th><th>작성자</th><th>등록일</th><th></th></tr></thead><tbody>
          ${arr.map((a) => `<tr class="clickrow" data-id="${a.id}"><td><div class="nm">${thumb(a, 14)}<span>${esc(a.name)}</span>${a.featured ? '<span class="lbl feat">추천</span>' : ''}</div></td>
            <td><span class="lbl ${a.type}">${TYPE_LABEL[a.type]}</span></td><td>${esc(catLabel(a.category))}</td><td>${stars(a.rating, a.ratingCount)}</td>
            <td>${fmtNum(a.views)}</td><td>${fmtNum(a.runs)}</td><td>${esc(a.author)}</td><td>${fmtDate(a.createdAt)}</td>
            <td><button class="btn btn-sm btn-primary" data-run="${a.id}">${ico('play', 11)} 실행</button></td></tr>`).join('')}
        </tbody></table></div>`
      : `<div class="cards">${arr.map(card).join('')}</div>`;
    bindAppClicks(el);
  }
  function card(a) {
    return `<article class="card" data-id="${a.id}" tabindex="0">
      <div class="card-thumb">${thumb(a)}${favBtn(a.id)}</div>
      <div class="card-bd">
        <div class="card-meta"><span class="lbl ${a.type}">${a.type === 'html' ? 'HTML 데모' : '웹 링크'}</span><span class="lbl">${esc(catLabel(a.category))}</span>${a.featured ? '<span class="lbl feat">추천</span>' : ''}</div>
        <h3 title="${esc(a.name)}">${esc(a.name)}</h3><p class="desc">${esc(a.description)}</p>
        ${a.tags && a.tags.length ? `<div class="tags" data-notr>${a.tags.slice(0, 3).map((t) => `<span class="tag" data-tag="${esc(t)}">#${esc(t)}</span>`).join('')}</div>` : ''}
      </div>
      <div class="card-ft">${stars(a.rating, a.ratingCount)}<span title="조회">${ico('eye', 11)} ${fmtNum(a.views)}</span><span title="실행">${ico('play', 11)} ${fmtNum(a.runs)}</span><span class="author" data-author="${esc(a.author)}" data-notr>${esc(a.author)}</span>
        <button class="btn btn-sm btn-primary" data-run="${a.id}">실행</button></div>
    </article>`;
  }
  function bindAppClicks(root) {
    root.onclick = (e) => {
      const fv = e.target.closest('[data-fav]');
      if (fv) { e.stopPropagation(); toggleFav(fv.dataset.fav); return; }
      const run = e.target.closest('[data-run]');
      if (run) { e.stopPropagation(); const a = state.apps.find((x) => x.id === run.dataset.run); if (a) launch(a); return; }
      const au = e.target.closest('[data-author]');
      if (au) { e.stopPropagation(); location.hash = '#/author/' + encodeURIComponent(au.dataset.author); return; }
      const tg = e.target.closest('[data-tag]');
      if (tg) { e.stopPropagation(); location.hash = '#/tag/' + encodeURIComponent(tg.dataset.tag); return; }
      const it = e.target.closest('[data-id]');
      if (it && root.contains(it)) location.hash = '#/app/' + it.dataset.id;
    };
    root.onkeydown = (e) => { if (e.key === 'Enter' && e.target.matches('[data-id]')) location.hash = '#/app/' + e.target.dataset.id; };
  }

  /* ───────── Run ───────── */
  function countRun(app) {
    if (app.status && app.status !== 'approved') return;
    api(`/api/apps/${app.id}/run`, { method: 'POST', body: {} })
      .then((d) => { if (d.counted) { app.runs = d.runs; const g = state.apps.find((x) => x.id === app.id); if (g) g.runs = d.runs; } })
      .catch(() => { /* noop */ });
  }
  function launch(app, ownerKey) {
    const t = task('앱 실행', app.name);
    countRun(app);
    if (app.type === 'link') {
      window.open(app.url, '_blank', 'noopener');
      t.ok('새 탭에서 열림');
      return;
    }
    openRunner(app, ownerKey, t);
  }
  async function openRunner(app, ownerKey, t, ver) {
    let src;
    try { src = await runUrl(app, ownerKey, ver); } catch (e) { if (t) t.fail(e.message); toast(e.message, 'error'); return; }
    const myRate = ls.get('krvcf.rated', {})[app.id] || 0;
    const m = modal({
      raw: true, bgCls: 'runner-bg', closable: false,
      body: `<div class="runner" role="dialog" aria-modal="true">
        <div class="runner-hd">
          <span class="ttl">${ico('monitor', 16)} <span>${esc(app.name)}</span></span>${ver ? `<span class="lbl pending">v${ver} ${L('미리보기', 'preview')}</span>` : app.status && app.status !== 'approved' ? `<span class="lbl pending">${STATUS_LABEL[app.status]} 미리보기</span>` : ''}
          <span class="sp"></span>
          ${ver || (app.status && app.status !== 'approved') ? '' : `<span class="rate-in" data-rate>${[1, 2, 3, 4, 5].map((n) => `<button data-s="${n}" class="${n <= myRate ? 'on' : ''}" title="${n}점">${ico('star', 17)}</button>`).join('')}</span>
          <button class="hdr-btn" data-act="fb" title="피드백">${ico('chat', 16)}<span class="lb"> 피드백</span></button>`}
          <a class="hdr-btn" href="${esc(src)}" target="_blank" rel="noopener" title="새 탭에서 열기">${ico('ext', 16)}<span class="lb"> 새 탭</span></a>
          <button class="hdr-btn" data-act="fs" title="전체화면">${ico('full', 15)}</button>
          <button class="hdr-btn" data-act="close" title="닫기 (Esc)">${ico('x', 17)}</button>
        </div>
        <div class="loading">불러오는 중…</div>
        <iframe src="${esc(src)}" title="${esc(app.name)}" sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads allow-pointer-lock" allow="fullscreen; clipboard-write" referrerpolicy="no-referrer"></iframe>
      </div>`,
    });
    const root = m.el;
    const ifr = $('iframe', root);
    ifr.onload = () => { const l = $('.loading', root); if (l) l.remove(); if (t) t.ok('데모룸 모달에서 실행'); t = null; };
    root.addEventListener('click', async (e) => {
      const act = e.target.closest('[data-act]');
      if (act) {
        const a = act.dataset.act;
        if (a === 'close') { if (document.fullscreenElement) await document.exitFullscreen().catch(() => {}); m.close(); }
        if (a === 'fs') { const r = $('.runner', root); document.fullscreenElement ? document.exitFullscreen() : r.requestFullscreen && r.requestFullscreen().catch(() => toast('전체화면을 사용할 수 없습니다.', 'error')); }
        if (a === 'fb') feedbackModal(app);
      }
      const s = e.target.closest('[data-s]');
      if (s) submitRating(app, Number(s.dataset.s), $('[data-rate]', root));
    });
    bindRateHover($('[data-rate]', root));
  }
  function bindRateHover(box) {
    if (!box) return;
    box.addEventListener('mouseover', (e) => {
      const s = e.target.closest('[data-s]'); if (!s) return;
      $$('[data-s]', box).forEach((b) => b.classList.toggle('hov', Number(b.dataset.s) <= Number(s.dataset.s)));
    });
    box.addEventListener('mouseleave', () => $$('[data-s]', box).forEach((b) => b.classList.remove('hov')));
  }
  async function submitRating(app, n, box) {
    await runTask('평점 제출', app.name, async () => {
      const d = await api(`/api/apps/${app.id}/rate`, { method: 'POST', body: { stars: n } });
      const r = ls.get('krvcf.rated', {}); r[app.id] = n; ls.set('krvcf.rated', r);
      app.rating = d.rating; app.ratingCount = d.ratingCount;
      const g = state.apps.find((x) => x.id === app.id); if (g) { g.rating = d.rating; g.ratingCount = d.ratingCount; }
      if (box) $$('[data-s]', box).forEach((b) => b.classList.toggle('on', Number(b.dataset.s) <= n));
      toast(`${n}점으로 평가했습니다. 감사합니다!`, 'success');
      const live = $('#liveRating'); if (live) live.innerHTML = ratingBlock(app);
    }, `${n}점`).catch(() => {});
  }
  function feedbackModal(app) {
    const m = modal({
      title: `피드백 — ${esc(app.name)}`,
      body: `<p style="margin-top:0">개선 의견이나 오류를 작성자·관리자에게 전달합니다.</p><textarea class="textarea" data-in maxlength="1000" placeholder="의견을 입력하세요 (최대 1,000자)"></textarea>`,
      foot: '<button class="btn" data-close>취소</button><button class="btn btn-primary" data-ok>보내기</button>',
    });
    const ta = $('[data-in]', m.el); ta.focus();
    $('[data-ok]', m.el).onclick = () => sendFeedback(app, ta.value, () => m.close());
  }
  async function sendFeedback(app, msg, done) {
    if (!msg.trim()) return toast('피드백 내용을 입력하세요.', 'error');
    await runTask('피드백 전송', app.name, async () => {
      await api(`/api/apps/${app.id}/feedback`, { method: 'POST', body: { message: msg } });
      toast('피드백을 보냈습니다.', 'success'); if (done) done();
    }).catch(() => {});
  }
  async function share(app) {
    const url = `${API}/s/${app.id}`; // Open Graph preview page that forwards to the app
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      try { await navigator.share({ title: app.name, text: app.description.slice(0, 100), url }); return; } catch (_) { /* fallthrough */ }
    }
    (await copyText(url)) ? toast('공유 링크를 복사했습니다: ' + url, 'success', 4000) : toast(url, 'info', 8000);
    task('공유 링크 복사', app.name).ok();
  }

  /* ───────── Detail ───────── */
  const ratingBlock = (a) => {
    const pct = (a.rating / 5) * 100;
    return `<div style="display:flex;gap:28px;flex-wrap:wrap">
      <div><div class="sl" style="font-size:12px;color:var(--muted)">조회 수</div><div style="font-size:30px;font-weight:300">${fmtNum(a.views)}</div></div>
      <div><div class="sl" style="font-size:12px;color:var(--muted)">실행 수</div><div style="font-size:30px;font-weight:300">${fmtNum(a.runs)}</div></div>
      <div style="flex:1;min-width:160px"><div class="sl" style="font-size:12px;color:var(--muted)">평균 평점</div>
        <div style="font-size:30px;font-weight:300">${a.rating ? a.rating.toFixed(1) : '-'} <span style="font-size:13px;color:var(--muted)">/ 5 · ${fmtNum(a.ratingCount)}명</span></div>
        <div class="meter"><i style="width:${pct}%;background:var(--star)"></i></div></div></div>`;
  };
  async function viewDetail(id) {
    main.innerHTML = page('', '<div class="skel" style="height:90px;margin-bottom:16px"></div><div class="skel" style="height:320px"></div>');
    const key = myKey(id);
    let app;
    try {
      var resp = await api(`/api/apps/${id}`, { headers: key ? { 'x-owner-key': key } : {} });
      app = resp.app;
    } catch (e) {
      main.innerHTML = page(`<a href="#/">홈</a>`, `<div class="empty-state">${ico('grid', 48)}<h2>앱을 찾을 수 없습니다</h2><p>${esc(e.message)}</p><a class="btn" href="#/all">전체 앱으로</a></div>`);
      return;
    }
    if (parseHash().parts[1] !== id) return;
    const g = state.apps.find((x) => x.id === id); if (g) Object.assign(g, app);
    const canEdit = !!resp.manage;
    const linkable = !!resp.claimable && !!key;
    const route = app.type === 'link' ? 'catalog' : 'demo';
    const approved = !app.status || app.status === 'approved';
    main.innerHTML = page(`<a href="#/">홈</a> / <a href="#/${route}">${TYPE_LABEL[app.type]}</a> / <a href="#/${route}/${encodeURIComponent(app.category)}">${esc(catLabel(app.category))}</a> / ${esc(app.name)}`, `
      ${app.status && app.status !== 'approved' ? `<div class="alert ${app.status === 'rejected' ? 'danger' : 'warn'}">${ico('clock')}<div>이 앱은 <b>${STATUS_LABEL[app.status]}</b> 상태라 소유자와 관리자에게만 보입니다.${app.note ? `<br>관리자 메모: ${esc(app.note)}` : ''}</div></div>` : ''}
      ${resp.owned || (canEdit && isAdmin()) ? `<div class="ownerbar">${ico('folder', 16)}<span>${resp.owned ? L('내가 등록한 앱입니다.', 'You own this app.') : L('관리자 권한으로 관리할 수 있습니다.', 'You can manage this app as an admin.')}</span><a class="btn btn-sm btn-primary" href="#/studio/${id}">${ico('gauge', 13)} ${L('관리 모드', 'Owner Studio')}</a></div>` : ''}
      ${linkable ? `<div class="ownerbar warn">${ico('key', 16)}<span>${L('이 브라우저에 이 앱의 소유 키가 있습니다. 내 계정에 연결하면 어디서든 관리할 수 있습니다.', 'This browser has the owner key for this app. Link it to your account to manage it anywhere.')}</span><button class="btn btn-sm btn-primary" id="dLink">${L('내 계정에 연결', 'Link to my account')}</button></div>` : ''}
      ${app.linkStatus === 'broken' ? `<div class="alert warn">${ico('link')}<div>${L(`최근 점검(${fmtTime(app.linkCheckedAt)})에서 이 링크에 연결할 수 없었습니다. 일시적인 문제일 수 있습니다.`, `This link could not be reached at the last check (${fmtTime(app.linkCheckedAt)}). It may be temporary.`)}</div></div>` : ''}
      <div class="objhd">${thumb(app, 30)}
        <div><h1>${esc(app.name)}</h1>
          <div class="sub"><span class="lbl ${app.type}">${app.type === 'html' ? 'HTML 데모' : '웹 링크'}</span><span class="lbl">${esc(catLabel(app.category))}</span>${app.featured ? '<span class="lbl feat">추천</span>' : ''}<span class="lbl" data-notr>v${app.version || 1}</span><span>by <a href="#/author/${encodeURIComponent(app.author)}" data-notr>${esc(app.author)}</a></span></div>
          ${app.tags && app.tags.length ? `<div class="tags" style="margin-top:8px" data-notr>${app.tags.map((t) => `<a class="tag" href="#/tag/${encodeURIComponent(t)}">#${esc(t)}</a>`).join('')}</div>` : ''}</div>
        <div class="acts">
          <button class="btn btn-primary" id="dRun">${ico('play', 13)} 앱 실행</button>
          ${app.demoUrl ? `<a class="btn" id="dDemo" href="${esc(app.demoUrl)}" target="_blank" rel="noopener">${ico('ext', 13)} ${L('데모 실행', 'Open demo')}</a>` : ''}
          ${approved ? `${favBtn(id, true)}<button class="btn" id="dShare">${ico('share', 14)} 공유</button>` : ''}
          ${canEdit ? `<a class="btn" href="#/submit/${id}">${ico('edit', 14)} 수정</a>` : ''}
        </div></div>
      <div class="detail-grid"><div class="d-main">
      <div class="portlet" style="margin-bottom:16px"><div class="portlet-hd">${ico('chat')} 설명</div><div class="portlet-bd"><p class="desc-full">${esc(app.description)}</p></div></div>
      ${shotGallery(app)}
      ${app.demoUrl || app.hasAccessGuide ? `<div class="portlet access" style="margin-bottom:16px"><div class="portlet-hd">${ico('key')} ${L('데모 · 접속 방법', 'Demo & access')}${app.accessPrivate ? `<span class="lbl" style="margin-left:8px">${L('로그인 사용자 전용', 'Signed-in only')}</span>` : ''}<span class="acts">${app.accessGuide ? `<button class="btn btn-sm btn-link" id="dCopyGuide">${ico('copy', 13)} ${L('복사', 'Copy')}</button>` : ''}</span></div><div class="portlet-bd">
        ${app.demoUrl ? `<div class="demo-url">${ico('link', 14)}<a href="${esc(app.demoUrl)}" target="_blank" rel="noopener" data-notr>${esc(app.demoUrl)}</a>${/^http:/i.test(app.demoUrl) ? `<span class="lbl pending">${L('http · 내부망/랩 주소일 수 있음', 'http · may be an internal/lab address')}</span>` : ''}</div>` : ''}
        ${app.accessGuide ? `<p class="desc-full" data-notr>${esc(app.accessGuide)}</p>`
          : app.hasAccessGuide ? `<div class="alert info" style="margin:0">${ico('lock')}<div>${L('접속 방법(테스트 계정 등)은 로그인한 사용자에게만 보입니다.', 'The access guide (test accounts, etc.) is visible to signed-in users only.')} <button class="btn btn-sm btn-primary" id="dGuideLogin" style="margin-left:6px">${L('로그인', 'Sign in')}</button></div></div>` : ''}
      </div></div>` : ''}
      <div class="portlet" style="margin-bottom:16px"><div class="portlet-hd">${ico('git')} ${L('버전 기록', 'Version history')}<span class="acts" style="font-size:12.5px;color:var(--muted)">${L('최근 10개 보관', 'Last 10 kept')}</span></div><div class="portlet-bd flush" id="dVer"><div class="skel" style="height:40px;margin:12px"></div></div></div>
      ${approved ? `<div class="portlet" id="reviews"><div class="portlet-hd">${ico('star')} ${L('리뷰 및 평점', 'Reviews & ratings')}<span class="acts"><button class="btn btn-sm btn-link" id="dPriv">${ico('chat', 13)} ${L('비공개 피드백', 'Private feedback')}</button></span></div><div class="portlet-bd" id="dRev"><div class="skel" style="height:80px"></div></div></div>` : ''}
      <div class="report-row"><button class="btn btn-sm btn-link" id="dReport">${ico('flag', 13)} ${L('이 앱 신고하기', 'Report this app')}</button></div>
      </div><aside class="d-side">
        <div class="portlet"><div class="portlet-hd">${ico('gauge')} 사용 현황</div><div class="portlet-bd" id="liveRating">${ratingBlock(app)}</div></div>
        <div class="portlet"><div class="portlet-hd">${ico('list')} 앱 정보</div><div class="portlet-bd"><dl class="kv">
          <dt>유형</dt><dd>${app.type === 'html' ? '데모룸 · HTML 시뮬레이터 (샌드박스 실행)' : '카탈로그 · 외부 웹 링크'}</dd>
          <dt>카테고리</dt><dd>${esc(catLabel(app.category))}</dd>
          <dt>작성자</dt><dd><a href="#/author/${encodeURIComponent(app.author)}" data-notr>${esc(app.author)}</a></dd>
          <dt>${L('버전', 'Version')}</dt><dd>v${app.version || 1}${app.changelog ? ` · <span data-notr>${esc(app.changelog)}</span>` : ''}</dd>
          ${app.type === 'link' ? `<dt>URL</dt><dd><a href="${esc(app.url)}" target="_blank" rel="noopener">${esc(app.url)}</a></dd>` : `<dt>파일 크기</dt><dd>${fmtSize(app.size)}</dd>`}
          ${app.demoUrl ? `<dt>${L('데모 URL', 'Demo URL')}</dt><dd><a href="${esc(app.demoUrl)}" target="_blank" rel="noopener" data-notr>${esc(app.demoUrl)}</a></dd>` : ''}
          <dt>등록일</dt><dd>${fmtDate(app.createdAt)}</dd><dt>수정일</dt><dd>${fmtDate(app.updatedAt)}</dd>
          <dt>앱 ID</dt><dd class="mono">${esc(app.id)}</dd>
        </dl></div></div>
      ${app.status ? `<div class="portlet" style="margin-bottom:16px"><div class="portlet-hd">${ico('clock')} 승인 이력${app.reviewedBy ? `<span class="acts" style="font-size:12.5px;color:var(--muted)">최종 검토: ${esc(app.reviewedBy)}</span>` : ''}</div><div class="portlet-bd" id="dHist"><div class="skel" style="height:40px"></div></div></div>` : ''}
      </aside></div>`);
    $('#dRun').onclick = () => launch(app, key);
    if ($('#dDemo')) $('#dDemo').onclick = () => countRun(app);
    $$('[data-shot]', main).forEach((b) => (b.onclick = () => openShot(app, +b.dataset.shot)));
    if ($('#dCopyGuide')) $('#dCopyGuide').onclick = async () => toast((await copyText(`${app.demoUrl ? app.demoUrl + '\n\n' : ''}${app.accessGuide}`)) ? L('데모 URL과 접속 방법을 복사했습니다.', 'Demo URL and access guide copied.') : L('복사하지 못했습니다.', 'Copy failed.'));
    if ($('#dGuideLogin')) $('#dGuideLogin').onclick = () => signInModal(L('로그인하면 데모 접속 방법을 볼 수 있습니다.', 'Sign in to see how to access the demo.'), () => viewDetail(id));
    if (approved) pushRecent(id);
    $$('[data-fav]', main).forEach((b) => (b.onclick = () => toggleFav(id)));
    if ($('#dHist')) api(`/api/apps/${id}/reviews`, { headers: key ? { 'x-owner-key': key } : {} })
      .then((d) => { if ($('#dHist')) $('#dHist').innerHTML = timeline(d.reviews); })
      .catch((e) => { if ($('#dHist')) $('#dHist').textContent = e.message; });
    if ($('#dShare')) $('#dShare').onclick = () => share(app);
    loadVersions(app, key, canEdit);
    if ($('#dRev')) { loadReviews(app); $('#dPriv').onclick = () => feedbackModal(app); }
    $('#dReport').onclick = () => reportModal(app);
    if ($('#dLink')) $('#dLink').onclick = () => claimKeys([{ id, key }]).then(() => viewDetail(id));
  }

  /* ───────── v7: tags, versions, reviews, reports ───────── */
  const verNote = (v) => {
    const m = String(v.note || '').match(/^(?:v\d+ 복원 \/ )?restored v(\d+)$/);
    if (m) return L(`v${m[1]} 복원`, `Restored v${m[1]}`);
    return v.note && v.note !== 'initial' ? v.note : v.version === 1 ? L('최초 등록', 'Initial version') : L('수정', 'Updated');
  };
  const starRow = (n) => `<span class="srow" aria-label="${n}/5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? 'on' : ''}">${ico('star', 13)}</i>`).join('')}</span>`;
  const normTags = (v) => [...new Set(String(v || '').split(/[,\s#]+/).map((t) => t.trim().toLowerCase().replace(/[^\p{L}\p{N}._+-]/gu, '').slice(0, 20)).filter(Boolean))].slice(0, 5);
  function tagCounts(apps) {
    const m = {};
    apps.forEach((a) => (a.tags || []).forEach((t) => (m[t] = (m[t] || 0) + 1)));
    return Object.entries(m).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }
  function tagCloud(apps) {
    const tc = tagCounts(apps).slice(0, 30);
    if (!tc.length) return '';
    const max = tc[0][1];
    return `<div class="portlet" style="margin-top:16px"><div class="portlet-hd">${ico('tag')} ${L('인기 태그', 'Popular tags')}</div><div class="portlet-bd"><div class="tags cloud" data-notr>
      ${tc.map(([t, n]) => `<a class="tag" href="#/tag/${encodeURIComponent(t)}" style="font-size:${(12 + 4 * (n / max)).toFixed(1)}px">#${esc(t)} <span class="n">${n}</span></a>`).join('')}</div></div></div>`;
  }
  async function loadVersions(app, key, canEdit, afterRestore) {
    const el = $('#dVer'); if (!el) return;
    const h = key ? { 'x-owner-key': key } : {};
    try {
      const d = await api(`/api/apps/${app.id}/versions`, { headers: h });
      if (!$('#dVer')) return;
      if (!d.versions.length) { el.innerHTML = `<div class="t2" style="padding:12px 16px">${L('기록이 없습니다.', 'No history yet.')}</div>`; return; }
      el.innerHTML = `<ul class="vlist">${d.versions.map((v) => `<li>
        <span class="vno ${v.current ? 'cur' : ''}">v${v.version}</span>
        <div class="vm"><b data-notr>${esc(verNote(v))}</b>
          <span>${fmtFull(v.ts)}${v.actor ? ` · <span data-notr>${esc(v.actor)}</span>` : ''}${v.size ? ` · ${fmtSize(v.size)}` : ''}${v.current ? ` · <b class="ok">${L('현재', 'Current')}</b>` : ''}</span></div>
        ${canEdit && !v.current ? `<div class="va">${app.type === 'html' ? `<button class="btn btn-sm" data-vpv="${v.version}">${ico('eye', 13)} ${L('미리보기', 'Preview')}</button>` : v.url ? `<a class="btn btn-sm" href="${esc(v.url)}" target="_blank" rel="noopener">${ico('link', 13)} URL</a>` : ''}
          <button class="btn btn-sm" data-vdf="${v.version}">${ico('git', 13)} ${L('현재와 비교', 'Compare')}</button><button class="btn btn-sm" data-vrs="${v.version}">${ico('undo', 13)} ${L('복원', 'Restore')}</button></div>` : ''}
      </li>`).join('')}</ul>`;
      $$('[data-vpv]', el).forEach((b) => (b.onclick = () => openRunner(app, key, task(L('버전 미리보기', 'Version preview'), `${app.name} v${b.dataset.vpv}`), Number(b.dataset.vpv))));
      $$('[data-vdf]', el).forEach((b) => (b.onclick = () => diffModal(app, Number(b.dataset.vdf), d.current, key)));
      $$('[data-vrs]', el).forEach((b) => (b.onclick = async () => {
        const v = Number(b.dataset.vrs);
        const warn = !isAdmin() ? `<br><br>${L('복원하면 다시 관리자 승인 대기 상태가 될 수 있습니다.', 'Restoring may put the app back into the approval queue.')}` : '';
        if (!(await confirmBox(L('버전 복원', 'Restore version'), L(`v${v}의 소스를 새 버전으로 복원합니다.`, `Restore the source of v${v} as a new version.`) + warn, L('복원', 'Restore')))) return;
        await runTask(L('버전 복원', 'Restore version'), app.name, async () => {
          await api(`/api/apps/${app.id}/versions/${v}/restore`, { method: 'POST', headers: h });
          toast(L(`v${v}를 복원했습니다.`, `Restored v${v}.`), 'success');
          await loadApps(true); state.studio = null; afterRestore ? afterRestore() : viewDetail(app.id);
        }).catch(() => {});
      }));
    } catch (e) { if ($('#dVer')) el.innerHTML = `<div class="t2" style="padding:12px 16px">${esc(e.message)}</div>`; }
  }
  async function loadReviews(app) {
    const el = $('#dRev'); if (!el) return;
    let d;
    try { d = await api(`/api/apps/${app.id}/comments`); } catch (e) { el.textContent = e.message; return; }
    if (!$('#dRev')) return;
    const total = Object.values(d.distribution).reduce((a, b) => a + b, 0);
    const mine = d.mine || { stars: 0, body: '', nickname: '' };
    let pick = mine.stars || 0;
    const nick = mine.nickname || ls.get('krvcf.nick', '');
    el.innerHTML = `<div class="rv-top">
        <div class="rv-sum"><div class="big">${total ? (app.rating || 0).toFixed(1) : '-'}</div>${starRow(Math.round(app.rating || 0))}<div class="t2">${L(`${fmtNum(total)}개 평점`, `${fmtNum(total)} rating${total === 1 ? "" : "s"}`)}</div></div>
        <div class="rv-dist">${[5, 4, 3, 2, 1].map((n) => `<div class="rv-bar"><span>${n}</span><span class="tr"><i style="width:${total ? (100 * d.distribution[n]) / total : 0}%"></i></span><span class="c">${d.distribution[n]}</span></div>`).join('')}</div>
      </div>
      <div class="rv-form">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><b>${mine.stars ? L('내 리뷰', 'Your review') : L('리뷰 작성', 'Write a review')}</b>
          <span class="rate-in" id="dRate">${[1, 2, 3, 4, 5].map((n) => `<button data-s="${n}" class="${n <= pick ? 'on' : ''}" title="${n}">${ico('star', 22)}</button>`).join('')}</span></div>
        <input class="input" id="rvNick" maxlength="30" value="${esc(nick)}" placeholder="${L('닉네임 (선택)', 'Nickname (optional)')}">
        <textarea class="textarea" id="rvBody" maxlength="1000" placeholder="${L('다른 사용자에게 공개되는 리뷰입니다. 별점만 남겨도 됩니다.', 'Public review visible to everyone. You can leave stars only.')}">${esc(mine.body || '')}</textarea>
        ${mine.hidden ? `<div class="alert warn" style="margin:0">${ico('shield')}<div>${L('내 리뷰가 관리자에 의해 숨김 처리되어 다른 사용자에게 보이지 않습니다.', 'Your review was hidden by a moderator and is not visible to others.')}</div></div>` : ''}
        <div class="rv-acts">${mine.body ? `<button class="btn btn-sm btn-danger" id="rvDel">${ico('trash', 13)} ${L('삭제', 'Delete')}</button>` : ''}<button class="btn btn-primary btn-sm" id="rvSend">${mine.stars ? L('리뷰 수정', 'Update review') : L('리뷰 등록', 'Post review')}</button></div>
      </div>
      <ul class="rv-list">${d.comments.length ? d.comments.map((c) => `<li class="${c.mine ? 'mine' : ''}">
        <div class="rv-h">${starRow(c.stars)}<b data-notr>${esc(c.nickname || L('익명', 'Anonymous'))}</b>${c.mine ? `<span class="lbl">${L('나', 'You')}</span>` : ''}<span class="t2">${fmtDate(c.ts)}</span></div>
        <p data-notr>${esc(c.body)}</p>${c.reply ? `<div class="rv-reply"><div class="rv-h">${ico('chat', 13)}<b>${L('작성자 답글', 'Reply from the author')}</b><span class="t2">${fmtDate(c.replyTs)}</span></div><p data-notr>${esc(c.reply)}</p></div>` : ''}</li>`).join('') : `<li class="empty t2">${L('아직 공개 리뷰가 없습니다. 첫 리뷰를 남겨 보세요.', 'No public reviews yet. Be the first.')}</li>`}</ul>`;
    const rate = $('#dRate');
    bindRateHover(rate);
    rate.onclick = (e) => { const b = e.target.closest('[data-s]'); if (!b) return; pick = Number(b.dataset.s); $$('[data-s]', rate).forEach((x) => x.classList.toggle('on', Number(x.dataset.s) <= pick)); };
    $('#rvSend').onclick = async () => {
      if (!pick) return toast(L('별점을 선택하세요.', 'Pick a star rating.'), 'error');
      const btn = $('#rvSend'); btn.disabled = true;
      try {
        const nickname = $('#rvNick').value.trim(); ls.set('krvcf.nick', nickname);
        const r = await api(`/api/apps/${app.id}/comments`, { method: 'POST', body: JSON.stringify({ stars: pick, body: $('#rvBody').value.trim(), nickname }) });
        const rated = ls.get('krvcf.rated', {}); rated[app.id] = pick; ls.set('krvcf.rated', rated);
        app.rating = r.rating; app.ratingCount = r.ratingCount;
        const g = state.apps.find((x) => x.id === app.id); if (g) Object.assign(g, { rating: r.rating, ratingCount: r.ratingCount });
        const live = $('#liveRating'); if (live) live.innerHTML = ratingBlock(app);
        toast(L('리뷰를 저장했습니다.', 'Review saved.'), 'success');
        loadReviews(app);
      } catch (e) { toast(e.message, 'error'); btn.disabled = false; }
    };
    if ($('#rvDel')) $('#rvDel').onclick = async () => {
      if (!(await confirmBox(L('리뷰 삭제', 'Delete review'), L('공개 리뷰 글을 삭제합니다. 별점은 유지됩니다.', 'Delete your public review text. Your star rating stays.'), L('삭제', 'Delete'), true))) return;
      try { await api(`/api/apps/${app.id}/comments`, { method: 'DELETE' }); toast(L('삭제했습니다.', 'Deleted.'), 'success'); loadReviews(app); } catch (e) { toast(e.message, 'error'); }
    };
  }
  const REPORT_REASONS = [
    ['spam', '스팸·광고', 'Spam or advertising'], ['malicious', '악성 코드·피싱', 'Malicious code or phishing'], ['broken', '동작하지 않음', 'Broken / does not work'],
    ['copyright', '저작권 침해', 'Copyright infringement'], ['inappropriate', '부적절한 콘텐츠', 'Inappropriate content'], ['other', '기타', 'Other'],
  ];
  const reasonLabel = (k) => { const r = REPORT_REASONS.find((x) => x[0] === k); return r ? L(r[1], r[2]) : k; };
  function reportModal(app) {
    const m = modal({
      title: L('앱 신고', 'Report app'),
      body: `<p class="t2" style="margin-top:0">${L('신고 내용은 관리자에게만 전달됩니다.', 'Reports are only visible to administrators.')} <b data-notr>${esc(app.name)}</b></p>
        <div class="radios">${REPORT_REASONS.map(([k], i) => `<label class="radio"><input type="radio" name="rr" value="${k}" ${i === 0 ? 'checked' : ''}> ${reasonLabel(k)}</label>`).join('')}</div>
        <textarea class="textarea" id="rrDetail" maxlength="1000" style="margin-top:12px" placeholder="${L('상세 내용 (선택)', 'Details (optional)')}"></textarea>`,
      foot: `<button class="btn" data-close>${L('취소', 'Cancel')}</button><button class="btn btn-danger solid" id="rrSend">${ico('flag', 13)} ${L('신고', 'Report')}</button>`,
    });
    $('#rrSend', m.el).onclick = async () => {
      const reason = ($('input[name=rr]:checked', m.el) || {}).value;
      try {
        await api(`/api/apps/${app.id}/report`, { method: 'POST', body: JSON.stringify({ reason, detail: $('#rrDetail', m.el).value.trim() }) });
        m.close(); toast(L('신고가 접수되었습니다. 감사합니다.', 'Report submitted. Thank you.'), 'success');
      } catch (e) { toast(e.message, 'error'); }
    };
  }
  async function deleteFlow(app, key, after) {
    if (!(await confirmBox('앱 삭제', `<b>${esc(app.name)}</b> 앱을 삭제합니다. 평점·피드백도 함께 삭제되며 되돌릴 수 없습니다.`, '삭제', true))) return;
    await runTask('앱 삭제', app.name, async () => {
      await api(`/api/apps/${app.id}`, { method: 'DELETE', headers: key ? { 'x-owner-key': key } : {} });
      ls.set('krvcf.myapps', myKeys().filter((x) => x.id !== app.id));
      state.apps = state.apps.filter((x) => x.id !== app.id);
      renderNav(); toast('삭제했습니다.', 'success');
      if (after) after();
    }).catch(() => {});
  }



  /* ───────── v9: Korean initial-consonant (초성) search ───────── */
  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const chosung = (s) => String(s).replace(/[가-힣]/g, (ch) => CHO[Math.floor((ch.charCodeAt(0) - 0xac00) / 588)]);
  const isChoQuery = (q) => /^[ㄱ-ㅎ\s]+$/.test(q) && /[ㄱ-ㅎ]/.test(q);
  function textMatch(hay, q) {
    if (!q) return true;
    const h = String(hay).toLowerCase();
    if (h.includes(q)) return true;
    return isChoQuery(q) && chosung(h).replace(/\s+/g, '').includes(q.replace(/\s+/g, ''));
  }

  /* ───────── v9: notifications ───────── */
  const NOTI = {
    'app.approved': ['check', 'ok', (d) => L(`'${d.name}' 앱이 승인되어 공개되었습니다.`, `'${d.name}' was approved and is now live.`)],
    'app.rejected': ['x', 'bad', (d) => L(`'${d.name}' 앱이 반려되었습니다.`, `'${d.name}' was not approved.`) + (d.note ? ` — ${d.note}` : '')],
    'app.pending': ['clock', '', (d) => L(`새 승인 요청: '${d.name}' (${d.author})`, `New review request: '${d.name}' (${d.author})`)],
    'app.resubmitted': ['git', '', (d) => L(`수정 후 재승인 요청: '${d.name}' v${d.version}`, `Resubmitted after edit: '${d.name}' v${d.version}`)],
    'review.new': ['star', '', (d) => L(`'${d.name}'에 새 리뷰 ★${d.stars}`, `New ★${d.stars} review on '${d.name}'`) + (d.excerpt ? ` — “${d.excerpt}”` : '')],
    'feedback.new': ['chat', '', (d) => L(`'${d.name}'에 비공개 피드백이 도착했습니다.`, `New private feedback on '${d.name}'.`) + (d.excerpt ? ` — “${d.excerpt}”` : '')],
    'report.new': ['flag', 'bad', (d) => L(`신고 접수: '${d.name}' (${reasonLabel(d.reason)})`, `App reported: '${d.name}' (${reasonLabel(d.reason)})`)],
    'link.broken': ['link', 'bad', (d) => L(`'${d.name}' 링크에 연결할 수 없습니다 (${d.error || '-'}).`, `'${d.name}' link is unreachable (${d.error || '-'}).`)],
    'link.recovered': ['check', 'ok', (d) => L(`'${d.name}' 링크 연결이 복구되었습니다.`, `'${d.name}' link is reachable again.`)],
  };
  const notiHref = (n) => ({ 'app.pending': '#/admin', 'app.resubmitted': '#/admin', 'report.new': '#/admin' }[n.kind]
    || (n.app ? `#/studio/${n.app}${n.kind === 'review.new' || n.kind === 'feedback.new' ? '/feedback' : ''}` : '#/studio'));
  const notiTab = (n) => ({ 'app.pending': 'pending', 'app.resubmitted': 'pending', 'report.new': 'moderation' }[n.kind]);
  let notiTimer = null;
  async function pollNoti() {
    clearTimeout(notiTimer);
    const b = $('#bellBtn');
    if (!me() || !b) { if (b) b.hidden = true; return; }
    b.hidden = false;
    try {
      const d = await api('/api/my/notifications?limit=30');
      state.noti = d;
      const n = $('#bellN'); n.hidden = !d.unread; n.textContent = d.unread > 99 ? '99+' : d.unread;
      b.title = L(`알림 ${d.unread ? `(읽지 않음 ${d.unread})` : ''}`, `Notifications${d.unread ? ` (${d.unread} unread)` : ''}`);
      document.title = (d.unread ? `(${d.unread}) ` : '') + document.title.replace(/^\(\d+\+?\) /, '');
      if ($('#notiPanel')) drawNoti();
    } catch (_) { /* ignore */ }
    if (document.visibilityState === 'visible') notiTimer = setTimeout(pollNoti, 60000);
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pollNoti(); });
  function drawNoti() {
    const p = $('#notiPanel'); if (!p) return;
    const d = state.noti || { items: [], unread: 0 };
    p.innerHTML = `<div class="np-hd"><b>${L('알림', 'Notifications')}</b>${d.unread ? `<button class="btn btn-sm btn-link" data-readall>${L('모두 읽음', 'Mark all read')}</button>` : ''}</div>
      <ul class="np-list">${d.items.length ? d.items.map((n) => {
        const k = NOTI[n.kind] || ['bell', '', () => n.kind];
        return `<li class="${n.read ? '' : 'unread'}" data-nid="${n.id}"><span class="np-ico ${k[1]}">${ico(k[0], 15)}</span><div class="np-tx"><span data-notr>${esc(k[2](n.data || {}))}</span><time>${fmtTime(n.ts)}</time></div></li>`;
      }).join('') : `<li class="empty">${ico('bell', 28)}<span>${L('새 알림이 없습니다.', 'You are all caught up.')}</span></li>`}</ul>`;
  }
  function toggleNoti() {
    let p = $('#notiPanel'); if (p) { p.remove(); return; }
    const um = $('#userMenu'); if (um) um.remove();
    p = document.createElement('div'); p.id = 'notiPanel'; p.className = 'menu npanel';
    document.body.appendChild(p); drawNoti(); pollNoti();
    p.addEventListener('click', async (e) => {
      if (e.target.closest('[data-readall]')) {
        await api('/api/my/notifications/read', { method: 'POST', body: { all: true } }).catch(() => {});
        return pollNoti();
      }
      const li = e.target.closest('[data-nid]'); if (!li) return;
      const n = state.noti.items.find((x) => String(x.id) === li.dataset.nid);
      p.remove();
      if (n && !n.read) api('/api/my/notifications/read', { method: 'POST', body: { ids: [n.id] } }).then(pollNoti).catch(() => {});
      if (n) { if (notiTab(n)) state.adminTab = notiTab(n); state.studio = null; const h = notiHref(n); if (location.hash === h) render(); else location.hash = h; }
    });
    setTimeout(() => document.addEventListener('click', function h(ev) { if (!p.contains(ev.target) && !ev.target.closest('#bellBtn')) { p.remove(); document.removeEventListener('click', h); } }), 0);
  }

  /* ───────── v9: favorites synced to the account ───────── */
  async function syncFavs() {
    if (!me()) return;
    try {
      const flag = 'krvcf.favs.merged:' + me().email;
      const d = ls.get(flag, false) ? await api('/api/my/favs') : await api('/api/my/favs', { method: 'POST', body: { add: favs() } });
      ls.set(flag, true);
      ls.set('krvcf.favs', d.ids);
      renderNav();
      if (parseHash().parts[0] === 'favs') renderListBody();
    } catch (_) { /* keep local list */ }
  }

  /* ───────── v9: change review (line diff) ───────── */
  // Myers O(ND) diff on lines → [{t:' '|'-'|'+', a, b, s}]
  function lineDiff(A, B) {
    const n = A.length, m = B.length, max = n + m, off = max + 1;
    const v = new Int32Array(2 * max + 3); const trace = [];
    let done = false;
    for (let d = 0; d <= max && !done; d++) {
      trace.push(v.slice(off - d - 1, off + d + 2)); // only k ∈ [-d-1, d+1] is read back → O(D²) memory instead of O(D·(N+M))
      for (let k = -d; k <= d; k += 2) {
        let x = k === -d || (k !== d && v[off + k - 1] < v[off + k + 1]) ? v[off + k + 1] : v[off + k - 1] + 1;
        let y = x - k;
        while (x < n && y < m && A[x] === B[y]) { x++; y++; }
        v[off + k] = x;
        if (x >= n && y >= m) { done = true; break; }
      }
      if (d > 6000 || d * (n + m) > 2e7) return null; // too different — caller shows a summary instead
    }
    const ops = []; let x = n, y = m;
    for (let d = trace.length - 1; d >= 0; d--) {
      const vv = trace[d], o = d + 1; const k = x - y; // vv[o + k] ≙ v[off + k]
      const pk = k === -d || (k !== d && vv[o + k - 1] < vv[o + k + 1]) ? k + 1 : k - 1;
      const px = vv[o + pk], py = px - pk;
      while (x > px && y > py) { ops.push({ t: ' ', a: x, b: y, s: A[x - 1] }); x--; y--; }
      if (d > 0) { if (x === px) ops.push({ t: '+', b: y, s: B[y - 1] }); else ops.push({ t: '-', a: x, s: A[x - 1] }); }
      x = px; y = py;
    }
    return ops.reverse();
  }
  function diffHtml(ops, ctx = 3) {
    const keep = new Array(ops.length).fill(false);
    ops.forEach((o, i) => { if (o.t !== ' ') for (let j = Math.max(0, i - ctx); j <= Math.min(ops.length - 1, i + ctx); j++) keep[j] = true; });
    let out = '', gap = 0;
    ops.forEach((o, i) => {
      if (!keep[i]) { gap++; return; }
      if (gap) { out += `<tr class="gap"><td colspan="3">⋯ ${L(`변경 없는 ${gap}줄`, `${gap} unchanged lines`)}</td></tr>`; gap = 0; }
      out += `<tr class="${o.t === '+' ? 'add' : o.t === '-' ? 'del' : ''}"><td class="ln">${o.t !== '+' ? o.a : ''}</td><td class="ln">${o.t !== '-' ? o.b : ''}</td><td class="code"><span class="sg">${o.t}</span>${esc(o.s) || ' '}</td></tr>`;
    });
    if (gap) out += `<tr class="gap"><td colspan="3">⋯ ${L(`변경 없는 ${gap}줄`, `${gap} unchanged lines`)}</td></tr>`;
    return out;
  }
  async function diffModal(app, from, to, key) {
    const h = key ? { 'x-owner-key': key } : {};
    const m = modal({ title: `${L('변경 비교', 'Compare changes')} · v${from} → v${to}`, cls: 'wide diffm', body: `<div class="skel" style="height:240px"></div>`, foot: `<button class="btn" data-close>${L('닫기', 'Close')}</button>` });
    try {
      const [a, b] = await Promise.all([api(`/api/apps/${app.id}/versions/${from}/source`, { headers: h }), api(`/api/apps/${app.id}/versions/${to}/source`, { headers: h })]);
      const bd = $('.modal-bd', m.el);
      if (a.type === 'link' || b.type === 'link') {
        bd.innerHTML = `<table class="grid"><thead><tr><th></th><th>v${from}</th><th>v${to}</th></tr></thead><tbody>
          <tr><td>URL</td><td class="wrap" data-notr>${esc(a.url || '-')}</td><td class="wrap" data-notr>${esc(b.url || '-')}</td></tr>
          <tr><td>${L('변경 메모', 'Note')}</td><td class="wrap" data-notr>${esc(verNote(a))}</td><td class="wrap" data-notr>${esc(verNote(b))}</td></tr></tbody></table>`;
        return;
      }
      const A = a.html.split(/\r?\n/), B = b.html.split(/\r?\n/);
      const ops = A.length + B.length > 20000 ? null : lineDiff(A, B);
      if (!ops) { bd.innerHTML = `<div class="alert warn">${ico('shield')}<div>${L('변경 범위가 너무 커서 줄 단위 비교를 생략했습니다.', 'The change is too large for a line-by-line comparison.')} (${fmtSize(a.html.length)} → ${fmtSize(b.html.length)})</div></div>`; return; }
      const add = ops.filter((o) => o.t === '+').length, del = ops.filter((o) => o.t === '-').length;
      bd.innerHTML = `<div class="diff-sum"><span class="lbl approved">+${add}</span><span class="lbl rejected">−${del}</span><span class="t2">${fmtSize(a.html.length)} → ${fmtSize(b.html.length)} · ${fmtFull(a.ts)} → ${fmtFull(b.ts)}</span>
        ${b.note ? `<span class="t2" data-notr>· ${esc(verNote(b))}</span>` : ''}</div>
        ${add || del ? `<div class="diffwrap"><table class="diff" data-notr><tbody>${diffHtml(ops)}</tbody></table></div>` : `<div class="empty-state" style="padding:30px">${ico('check', 30)}<br>${L('두 버전의 소스가 같습니다.', 'The two versions are identical.')}</div>`}`;
    } catch (e) { $('.modal-bd', m.el).innerHTML = `<div class="alert danger">${esc(e.message)}</div>`; }
  }

  /* ───────── v7: quick-jump palette (Ctrl/Cmd+K) ───────── */
  let palOpen = null;
  async function openPalette() {
    if (palOpen) return;
    const pages = [
      ['#/', 'home', L('홈', 'Home')], ['#/all', 'grid', L('전체 앱', 'All apps')], ['#/catalog', 'link', L('카탈로그', 'Catalog')], ['#/demo', 'monitor', L('데모룸', 'Demo room')],
      ['#/submit', 'plus', L('앱 등록', 'Submit app')], ['#/favs', 'star', L('즐겨찾기', 'Favorites')], ['#/mine', 'folder', L('내 워크스페이스', 'My workspace')], ['#/admin', 'gear', L('관리 콘솔', 'Admin console')],
    ];
    const m = modal({
      cls: 'palette', bgCls: 'pal-bg', title: '',
      body: `<div class="pal-in">${ico('search', 16)}<input id="palQ" autocomplete="off" spellcheck="false" placeholder="${L('앱, 태그, 작성자, 페이지로 이동…', 'Jump to an app, tag, author or page…')}"><kbd class="kbd">Esc</kbd></div><ul class="pal-list" id="palL" role="listbox"></ul>
        <div class="pal-ft"><span><kbd class="kbd">↑</kbd><kbd class="kbd">↓</kbd> ${L('이동', 'navigate')}</span><span><kbd class="kbd">Enter</kbd> ${L('열기', 'open')}</span><span>#${L('태그', 'tag')} · @${L('작성자', 'author')} · ${L('초성 검색 (ㅂㅅ)', 'Korean initials (ㅂㅅ)')}</span></div>`,
      onClose: () => { palOpen = null; },
    });
    palOpen = m;
    const q = $('#palQ', m.el), list = $('#palL', m.el);
    let items = [], sel = 0;
    const draw = () => {
      const raw = q.value.trim().toLowerCase();
      const mode = raw[0] === '#' ? 'tag' : raw[0] === '@' ? 'author' : '';
      const t = mode ? raw.slice(1) : raw;
      const has = (x) => textMatch(x || '', t);
      items = [];
      if (!mode) pages.filter(([, , n]) => !t || has(n)).forEach(([h, i, n]) => items.push({ h, i, n, k: L('페이지', 'Page') }));
      if (!mode && t) state.apps.filter((a) => has(a.name) || has(a.description) || (a.tags || []).some(has)).sort((a, b) => b.runs - a.runs).slice(0, 8)
        .forEach((a) => items.push({ h: '#/app/' + a.id, i: a.type === 'html' ? 'monitor' : 'link', n: a.name, k: TYPE_LABEL[a.type], u: 1 }));
      if (mode !== 'author') tagCounts(state.apps).filter(([g]) => textMatch(g, t)).slice(0, mode ? 12 : 4)
        .forEach(([g, n]) => items.push({ h: '#/tag/' + encodeURIComponent(g), i: 'tag', n: '#' + g, k: L(`앱 ${n}개`, `${n} app${n === 1 ? "" : "s"}`), u: 1 }));
      if (mode !== 'tag') {
        const au = {}; state.apps.forEach((a) => (au[a.author] = (au[a.author] || 0) + 1));
        Object.entries(au).filter(([a]) => textMatch(a, t)).sort((a, b) => b[1] - a[1]).slice(0, mode ? 12 : 4)
          .forEach(([a, n]) => items.push({ h: '#/author/' + encodeURIComponent(a), i: 'user', n: a, k: L(`작성자 · 앱 ${n}개`, `Author · ${n} app${n === 1 ? "" : "s"}`), u: 1 }));
      }
      if (!mode && !t) items = items.slice(0, 12);
      sel = Math.min(sel, Math.max(0, items.length - 1));
      list.innerHTML = items.length ? items.map((x, i) => `<li role="option" class="${i === sel ? 'on' : ''}" data-i="${i}">${ico(x.i, 15)}<span class="pn" ${x.u ? 'data-notr' : ''}>${esc(x.n)}</span><span class="pk">${esc(x.k)}</span></li>`).join('')
        : `<li class="empty">${L('결과가 없습니다.', 'No results.')}</li>`;
      const on = $('li.on', list); if (on) on.scrollIntoView({ block: 'nearest' });
    };
    const go = (i) => { const x = items[i]; if (!x) return; m.close(); location.hash = x.h; };
    q.oninput = () => { sel = 0; draw(); };
    q.onkeydown = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(1, items.length); draw(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + items.length) % Math.max(1, items.length); draw(); }
      else if (e.key === 'Enter') { e.preventDefault(); go(sel); }
    };
    list.onclick = (e) => { const li = e.target.closest('[data-i]'); if (li) go(Number(li.dataset.i)); };
    list.onmousemove = (e) => { const li = e.target.closest('[data-i]'); if (li && Number(li.dataset.i) !== sel) { sel = Number(li.dataset.i); $$('li', list).forEach((x) => x.classList.toggle('on', x === li)); } };
    draw(); q.focus();
    if (!state.apps.length) loadApps().then(() => { if (palOpen === m) draw(); }).catch(() => {});
  }
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') { e.preventDefault(); palOpen ? palOpen.close() : openPalette(); }
  });
  document.addEventListener('click', (e) => { if (e.target.closest('[data-palette],#gqKbd')) { e.preventDefault(); openPalette(); } });
  if ($('#gqKbd')) $('#gqKbd').textContent = IS_MAC ? '⌘K' : 'Ctrl K';

  /* ───────── Submit / edit wizard ───────── */
  let wiz = null;
  const WSTEPS = ['유형 선택', '기본 정보', '소스', '검토 및 완료'];
  function signInGate(crumb, title, text) {
    main.innerHTML = page(`<a href="#/">홈</a> / ${crumb}`, `<div class="gate"><div class="gate-card">
      <div class="gate-ico">${ico('shield', 28)}</div><h1>${title}</h1><p>${text}</p>
      <div id="gateBox" class="signin-box"></div>
      <div class="gate-steps"><div><b>1</b>${L('Google로 로그인', 'Sign in with Google')}</div><div><b>2</b>${L('앱 정보·소스 입력', 'Add details & source')}</div><div><b>3</b>${L('관리자 승인 후 공개', 'Published after review')}</div></div>
    </div></div>`);
    mountSignIn($('#gateBox'));
  }
  async function viewSubmit(editId) {
    const { params } = parseHash();
    if (!me()) return signInGate(editId ? L('앱 수정', 'Edit app') : '앱 등록', editId ? L('앱을 수정하려면 로그인하세요', 'Sign in to edit your app') : L('앱 등록은 로그인 후 가능합니다', 'Sign in to submit an app'),
      L('KRVCF App Center는 작성자 확인을 위해 Google 계정 로그인 후에만 앱을 등록할 수 있습니다. 등록한 앱은 <b>내 앱 관리</b>에서 수정·삭제하고 통계를 볼 수 있습니다.', 'To keep authors accountable, apps can only be submitted after signing in with a Google account. You can then edit, delete and track your apps in <b>My apps</b>.'));
    const u = me();
    wiz = {
      step: 1, editId: editId || null, type: params.get('type') === 'link' ? 'link' : 'html',
      name: '', author: ls.get('krvcf.author', '') || (u.role === 'owner' ? '' : u.name || ''), email: u.role === 'owner' ? ls.get('krvcf.email', '') : u.email, category: '', description: '', thumbnail: '',
      url: '', tags: '', changelog: '', html: '', htmlChanged: false, fileName: '', srcMode: 'file', agree: false, done: null, origStatus: null,
      demoUrl: '', accessGuide: '', accessPrivate: false, screenshots: [], ghUrl: '', ghRes: null,
    };
    if (editId) {
      main.innerHTML = page('', '<div class="skel" style="height:520px"></div>');
      const key = myKey(editId);
      try {
        const h = key ? { 'x-owner-key': key } : {};
        const { app, manage, claimable } = await api(`/api/apps/${editId}`, { headers: h });
        if (!manage && !(claimable && key)) {
          main.innerHTML = page(`<a href="#/">홈</a> / ${L('앱 수정', 'Edit app')}`, `<div class="alert warn">${ico('key')}<div>${L('이 앱의 소유자만 수정할 수 있습니다. 예전에 소유 키로 등록한 앱이라면 <a href="#/studio">내 앱 관리</a> → <b>기존 앱 연결</b>에서 계정에 연결하세요.', 'Only the owner can edit this app. If you registered it earlier with an owner key, link it to your account from <a href="#/studio">My apps</a> → <b>Link existing app</b>.')}</div></div>`);
          return;
        }
        Object.assign(wiz, { type: app.type, name: app.name, author: app.author, email: isAdmin() ? app.email || '' : wiz.email, category: app.category, description: app.description, thumbnail: app.thumbnail || '', url: app.url || '', tags: (app.tags || []).join(', '), origStatus: app.status, size: app.size, step: 2,
          demoUrl: app.demoUrl || '', accessGuide: app.accessGuide || '', accessPrivate: !!app.accessPrivate, screenshots: (app.screenshots || []).map((x) => ({ ...x })) });
        if (app.type === 'html') {
          const s = await api(`/api/apps/${editId}/source`, { headers: h });
          wiz.html = s.html || ''; wiz.fileName = '현재 등록된 HTML'; wiz.srcMode = 'file';
        }
      } catch (e) {
        main.innerHTML = page('', `<div class="alert danger">${esc(e.message)}</div>`); return;
      }
    }
    renderWizard();
  }
  function renderWizard() {
    const w = wiz;
    const title = w.editId ? '앱 수정' : '새 앱 등록';
    main.innerHTML = page(`<a href="#/">홈</a> / ${title}`, `
      <div class="wizard">
        <aside class="wiz-steps"><h2>${title}</h2><ol>
          ${WSTEPS.map((s, i) => `<li class="${w.done ? 'done' : i + 1 === w.step ? 'on' : i + 1 < w.step ? 'done' : ''}" data-step="${i + 1}"><span class="no">${i + 1 < w.step || w.done ? '✓' : i + 1}</span>${s}</li>`).join('')}
        </ol></aside>
        <div class="wiz-main"><div class="wiz-body" id="wizBody"></div>
          <div class="wiz-ft" id="wizFt"></div></div>
      </div>`);
    $$('.wiz-steps li.done').forEach((li) => (li.onclick = () => { if (w.done) return; const s = Number(li.dataset.step); if (s < w.step && !(w.editId && s === 1)) { w.step = s; renderWizard(); } }));
    if (w.done) return renderWizardDone();
    const body = $('#wizBody');
    if (w.step === 1) {
      body.innerHTML = `<h3>유형 선택</h3><p class="hint">앱이 표시될 위치와 실행 방식을 선택하세요.</p>
        <div class="typecards">
          <label class="typecard ${w.type === 'html' ? 'on' : ''}" data-type="html"><span class="ti">${ico('monitor', 22)}</span><div><b>데모룸 — HTML 시뮬레이터</b><p>단일 HTML 파일(최대 10MB)을 업로드하면 격리된 샌드박스에서 전체 화면 모달로 즉시 실행됩니다. 계산기, 사이징 도구, UI 시뮬레이터에 적합합니다.</p></div></label>
          <label class="typecard ${w.type === 'link' ? 'on' : ''}" data-type="link"><span class="ti">${ico('link', 22)}</span><div><b>카탈로그 — 외부 웹 링크</b><p>이미 호스팅 중인 웹앱(https)을 링크로 등록합니다. 실행 시 새 탭으로 열립니다. ${L('<b>실행 가능한 데모 URL</b>과 <b>접속 방법</b>(테스트 계정, VPN 등)을 함께 입력합니다.', 'You also provide a <b>runnable demo URL</b> and <b>how to access it</b> (test account, VPN, etc.).')}</p></div></label>
        </div>`;
      $$('[data-type]', body).forEach((el) => (el.onclick = () => { w.type = el.dataset.type; renderWizard(); }));
    }
    if (w.step === 2) {
      const aiOn = !!(state.cfg && state.cfg.githubImport && state.cfg.githubImport.ai);
      body.innerHTML = `<h3>기본 정보</h3><p class="hint">카탈로그에 표시될 정보를 입력하세요.</p>
        <div class="gh-import"><div class="gh-hd">${ico('git', 15)}<b>${L('GitHub에서 불러오기', 'Import from GitHub')}</b><span class="lbl ${aiOn ? 'approved' : ''}">${aiOn ? L('AI 작성', 'AI-written') : 'README'}</span></div>
          <div class="inline-row"><input class="input" id="ghUrl" maxlength="300" value="${esc(w.ghUrl)}" placeholder="https://github.com/owner/repo"><button type="button" class="btn btn-primary btn-sm" id="ghGo">${ico('down', 12)} ${L('불러오기', 'Import')}</button></div>
          <div class="help">${aiOn ? L('공개 저장소의 설명·README를 AI가 읽고 이름, 설명, 태그, 카테고리, 데모 URL, 접속 방법을 작성하고 README의 스크린샷을 가져옵니다. 결과는 아래에서 고칠 수 있습니다.', 'AI reads the public repository and README to draft the name, description, tags, category, demo URL and access guide, and pulls screenshots from the README. You can edit everything below.')
            : L('공개 저장소의 설명·README 첫 부분과 스크린샷을 가져옵니다. (관리 콘솔 → 설정에서 AI 모델을 연결하면 AI가 설명을 작성합니다.)', 'Pulls the repository description, the start of the README and its screenshots. (Connect an AI model in Admin Console → Settings to have AI write the description.)')}</div>
          <div id="ghRes">${ghResHtml()}</div></div>
        ${fieldIn('name', '앱 이름', true, `<input class="input" data-k="name" maxlength="80" value="${esc(w.name)}" placeholder="예: vSAN ESA 용량 계산기">`)}
        ${fieldIn('author', '작성자 이름', true, `<input class="input" data-k="author" maxlength="40" value="${esc(w.author)}" placeholder="표시될 이름 또는 닉네임">`)}
        ${isAdmin() && (w.editId || role() === 'owner') ? fieldIn('email', '작성자 이메일', false, `<input class="input" data-k="email" type="email" maxlength="120" value="${esc(w.email)}" placeholder="name@example.com">`, '관리자에게만 보이며, 승인 관련 연락에 사용됩니다.')
          : fieldIn('email', L('소유자 계정', 'Owner account'), false, `<div class="acct">${avatar(me(), 24)}<b data-notr>${esc(me().email)}</b><span class="lbl approved">Google</span></div>`, L('앱은 이 계정에 연결되며, 승인 결과 알림도 이 주소로 갑니다.', 'The app is linked to this account and review notifications go to this address.'))}
        ${fieldIn('category', '카테고리', true, `<select class="select" data-k="category"><option value="">선택하세요</option>${CATS.map((c) => `<option value="${esc(c.k)}" ${w.category === c.k ? 'selected' : ''}>${c.ko}</option>`).join('')}</select>`)}
        ${fieldIn('description', '설명', true, `<textarea class="textarea" data-k="description" maxlength="2000" placeholder="무엇을 하는 앱인지, 사용법과 참고 사항을 적어 주세요.">${esc(w.description)}</textarea>`)}
        ${fieldIn('tags', L('태그', 'Tags'), false, `<input class="input" data-k="tags" maxlength="120" value="${esc(w.tags)}" placeholder="${L('예: vsan, sizing, 계산기', 'e.g. vsan, sizing, calculator')}">`, L('쉼표로 구분, 최대 5개 · 각 20자 이하. 검색과 태그 페이지에 사용됩니다.', 'Comma-separated, up to 5, 20 characters each. Used for search and tag pages.'))}
        ${fieldIn('thumbnail', '썸네일 URL', false, `<input class="input" data-k="thumbnail" maxlength="500" value="${esc(w.thumbnail)}" placeholder="https://… (비워 두면 그라데이션 자동 생성)">`, '이미지 https 주소. 비워 두면 첫 번째 스크린샷, 그것도 없으면 그라데이션 썸네일이 자동으로 쓰입니다.')}
        ${fieldIn('screenshots', L('스크린샷', 'Screenshots'), false, '<div class="shots-ed" id="shotsEd"></div>', L(`최대 ${MAX_SHOTS}장 · 이미지 파일을 올리거나(자동 축소, 장당 2MB 이하) https 이미지 주소를 추가하세요. 끌어다 놓기·붙여넣기도 됩니다. 첫 장이 대표 이미지입니다.`, `Up to ${MAX_SHOTS} · upload image files (auto-resized, 2 MB max each) or add https image URLs. Drag-and-drop and paste work too. The first one is the cover.`))}`;
      bindWizInputs(body);
      renderShotsEd();
      $('#ghUrl').oninput = (e) => { w.ghUrl = e.target.value; };
      $('#ghUrl').onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); ghImport(); } };
      $('#ghGo').onclick = ghImport;
    }
    if (w.step === 3) {
      if (w.type === 'link') {
        body.innerHTML = `<h3>${L('앱 URL · 데모 접속', 'App URL & demo access')}</h3><p class="hint">${L('카탈로그에 걸릴 주소와, 사용자가 바로 실행해 볼 수 있는 데모 정보를 입력하세요.', 'Enter the catalog address and the demo users can run right away.')}</p>
          ${fieldIn('url', '앱 URL', true, `<input class="input" data-k="url" maxlength="1000" value="${esc(w.url)}" placeholder="https://example.com/my-app">`, L('카탈로그의 "앱 실행" 버튼이 여는 주소입니다. https:// 만 허용됩니다.', 'Opened by the catalog "Run app" button. https:// only.'))}
          ${fieldIn('demoUrl', L('데모 URL', 'Demo URL'), true, `<div class="inline-row"><input class="input" data-k="demoUrl" maxlength="1000" value="${esc(w.demoUrl)}" placeholder="https://demo.example.com"><button type="button" class="btn btn-sm" id="sameUrl">${L('앱 URL과 같음', 'Same as app URL')}</button></div>`, L('지금 바로 실행해 볼 수 있는 주소입니다. 사내·랩 환경이면 http:// 도 가능합니다.', 'An address that can be run right now. http:// is allowed for internal/lab environments.'))}
          ${fieldIn('accessGuide', L('접속 방법', 'How to access'), true, `<textarea class="textarea" data-k="accessGuide" maxlength="2000" rows="5" placeholder="${L('예)\n1. 사내 VPN 접속 후 데모 URL 열기\n2. 테스트 계정: demo@krvcf.com / Demo!2026\n3. Chrome 최신 버전 권장, 데모 데이터는 매일 03시 초기화', 'e.g.\n1. Connect to the corporate VPN, then open the demo URL\n2. Test account: demo@krvcf.com / Demo!2026\n3. Latest Chrome recommended; demo data resets daily at 03:00')}">${esc(w.accessGuide)}</textarea>`, L('필요한 네트워크(VPN·내부망), 테스트 계정, 권장 브라우저, 데모 시나리오 등을 적어 주세요.', 'Network (VPN/internal), test account, recommended browser, demo scenario, etc.'))}
          <label class="check" style="margin:-4px 0 16px"><input type="checkbox" id="accPriv" ${w.accessPrivate ? 'checked' : ''}><span>${L('접속 방법은 <b>로그인한 사용자에게만</b> 보이기 (계정·비밀번호를 적었다면 권장)', 'Show the access guide <b>only to signed-in users</b> (recommended if it contains credentials)')}</span></label>
          ${fieldIn('changelog', L('변경 내용', 'Change note'), false, `<input class="input" data-k="changelog" maxlength="300" value="${esc(w.changelog)}" placeholder="${w.editId ? L('예: 계산 오류 수정, 다크 모드 추가', 'e.g. Fixed calculation bug, added dark mode') : L('예: 최초 버전', 'e.g. Initial release')}">`, L('버전 기록에 표시됩니다.', 'Shown in the version history.'))}`;
        $('#accPriv').onchange = (e) => { w.accessPrivate = e.target.checked; };
        $('#sameUrl').onclick = () => { const i = $('[data-k="demoUrl"]', body); i.value = w.demoUrl = w.url.trim(); i.focus(); };
        bindWizInputs(body);
      } else {
        body.innerHTML = `<h3>HTML 소스</h3><p class="hint">단일 HTML 파일을 업로드하거나 코드를 붙여넣으세요. CSS/JS는 파일 안에 포함하거나 CDN을 사용하세요.</p>
          <div class="btn-group segs"><button class="btn btn-sm ${w.srcMode === 'file' ? 'on' : ''}" data-mode="file">${ico('up', 13)} 파일 업로드</button><button class="btn btn-sm ${w.srcMode === 'paste' ? 'on' : ''}" data-mode="paste">${ico('code', 13)} 직접 붙여넣기</button></div>
          ${w.srcMode === 'file'
            ? `<label class="drop" id="drop"><input type="file" accept=".html,.htm,text/html" hidden id="fileIn">${ico('up', 36)}<div style="margin-top:8px"><b>HTML 파일 선택</b> 또는 여기로 끌어다 놓기</div><div style="font-size:12px;margin-top:4px">.html / .htm · 최대 10MB</div></label>`
            : `<textarea class="textarea code" id="pasteIn" spellcheck="false" placeholder="<!doctype html>&#10;<html>…</html>">${esc(w.html)}</textarea>`}
          <div id="fileBar"></div>
          <div class="alert info" style="margin-top:16px">${ico('shield')}<div>업로드된 HTML은 별도 도메인의 <b>샌드박스(불투명 origin)</b>에서 실행되어 플랫폼·다른 앱의 데이터에 접근할 수 없습니다. localStorage는 실행 중 메모리로 대체됩니다.</div></div>
          <div style="margin-top:16px" id="clWrap">${fieldIn('changelog', L('변경 내용', 'Change note'), false, `<input class="input" data-k="changelog" maxlength="300" value="${esc(w.changelog)}" placeholder="${w.editId ? L('예: 계산 오류 수정, 다크 모드 추가', 'e.g. Fixed calculation bug, added dark mode') : L('예: 최초 버전', 'e.g. Initial release')}">`, L('버전 기록에 표시됩니다.', 'Shown in the version history.'))}</div>`;
        $$('[data-k]', $('#clWrap')).forEach((el) => (el.oninput = () => { wiz[el.dataset.k] = el.value; }));
        $$('[data-mode]', body).forEach((b) => (b.onclick = () => { w.srcMode = b.dataset.mode; renderWizard(); }));
        renderFileBar();
        if (w.srcMode === 'file') {
          const drop = $('#drop'), fi = $('#fileIn');
          fi.onchange = () => fi.files[0] && readHtmlFile(fi.files[0]);
          drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); };
          drop.ondragleave = () => drop.classList.remove('over');
          drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) readHtmlFile(f); };
        } else {
          $('#pasteIn').oninput = (e) => { w.html = e.target.value; w.htmlChanged = true; w.fileName = '붙여넣은 코드'; renderFileBar(); };
        }
      }
    }
    if (w.step === 4) {
      const rows = [
        ['유형', w.type === 'html' ? '데모룸 · HTML 시뮬레이터' : '카탈로그 · 외부 웹 링크'], ['앱 이름', w.name], ['작성자', w.author], [L('소유자 계정', 'Owner account'), w.email || '-'],
        ['카테고리', catLabel(w.category)], [L('태그', 'Tags'), normTags(w.tags).map((t) => '#' + t).join(' ') || '-'], ['썸네일', w.thumbnail || (w.screenshots.length ? L('첫 번째 스크린샷', 'First screenshot') : '자동 생성')],
        [L('스크린샷', 'Screenshots'), w.screenshots.length ? L(`${w.screenshots.length}장`, `${w.screenshots.length}`) : '-'],
        ...(w.changelog ? [[L('변경 내용', 'Change note'), w.changelog]] : []),
        ...(w.type === 'link' ? [[L('데모 URL', 'Demo URL'), w.demoUrl], [L('접속 방법', 'How to access') + (w.accessPrivate ? L(' (로그인 사용자만)', ' (signed-in only)') : ''), w.accessGuide]] : []),
        w.type === 'link' ? ['URL', w.url] : ['HTML', `${w.fileName || '-'} (${fmtSize(byteLen(w.html))})${w.editId && !w.htmlChanged ? ' · 변경 없음' : ''}`],
        ['설명', w.description],
      ];
      body.innerHTML = `<h3>검토 및 완료</h3><p class="hint">입력 내용을 확인하세요. ${w.editId && !isAdmin() ? '수정하면 다시 관리자 승인 대기 상태가 됩니다.' : w.editId ? '' : '등록 후 관리자 승인을 거쳐 공개됩니다.'}</p>
        <div class="gridwrap" style="box-shadow:none;margin-bottom:16px"><table class="grid review"><tbody>${rows.map(([k, v]) => `<tr><td>${k}</td><td class="wrap" style="white-space:pre-wrap">${esc(v)}</td></tr>`).join('')}</tbody></table></div>
        ${w.type === 'html' && w.html ? `<button class="btn btn-sm" id="pvBtn" style="margin-bottom:16px">${ico('eye', 13)} 실행 미리보기</button>` : ''}
        <label class="check"><input type="checkbox" id="agree" ${w.agree ? 'checked' : ''}><span>앱에 악성 코드·개인정보·저작권 침해 요소가 없으며, 게시에 대한 책임이 본인에게 있음에 동의합니다.</span></label>`;
      $('#agree').onchange = (e) => { w.agree = e.target.checked; renderFt(); };
      if ($('#pvBtn')) $('#pvBtn').onclick = previewHtml;
    }
    renderFt();
  }
  const byteLen = (s) => new Blob([s || '']).size;
  function fieldIn(k, label, req, input, help) {
    return `<div class="field"><label>${label}${req ? '<span class="req">*</span>' : ''}</label>${input}${help ? `<div class="help">${help}</div>` : ''}</div>`;
  }
  function bindWizInputs(root) {
    $$('[data-k]', root).forEach((el) => (el.oninput = el.onchange = () => { wiz[el.dataset.k] = el.value; }));
    const f = $('[data-k]', root); if (f && !wiz.editId) f.focus();
  }
  function readHtmlFile(f) {
    if (f.size > MAX_HTML) return toast('HTML 파일은 10MB 이하만 가능합니다.', 'error');
    if (!/\.html?$/i.test(f.name) && f.type !== 'text/html') return toast('.html 또는 .htm 파일만 업로드할 수 있습니다.', 'error');
    const r = new FileReader();
    r.onload = () => {
      wiz.html = String(r.result); wiz.fileName = f.name; wiz.htmlChanged = true;
      if (!wiz.name) { const m = wiz.html.match(/<title[^>]*>([^<]{1,80})<\/title>/i); if (m) wiz.name = m[1].trim(); }
      renderFileBar(); toast(`${f.name} 파일을 불러왔습니다.`, 'success');
    };
    r.onerror = () => toast('파일을 읽을 수 없습니다.', 'error');
    r.readAsText(f, 'utf-8');
  }
  function renderFileBar() {
    const el = $('#fileBar'); if (!el) return;
    el.innerHTML = wiz.html
      ? `<div class="filebar">${ico('code')}<span class="grow">${esc(wiz.fileName || 'HTML')} · ${fmtSize(byteLen(wiz.html))}</span><button class="btn btn-sm" id="pv2">${ico('eye', 13)} 미리보기</button>${wiz.srcMode === 'file' ? `<button class="icon-btn" id="clr" title="제거">${ico('x')}</button>` : ''}</div>`
      : '';
    if ($('#pv2')) $('#pv2').onclick = (e) => { e.preventDefault(); previewHtml(); };
    if ($('#clr')) $('#clr').onclick = (e) => { e.preventDefault(); wiz.html = ''; wiz.fileName = ''; wiz.htmlChanged = true; renderFileBar(); };
  }
  function previewHtml() {
    const m = modal({ title: `미리보기 — ${esc(wiz.name || wiz.fileName || 'HTML')}`, cls: 'wide', body: '<iframe sandbox="allow-scripts allow-forms allow-modals allow-popups" referrerpolicy="no-referrer"></iframe>' });
    $('iframe', m.el).srcdoc = wiz.html;
  }

  /* ───────── v11: GitHub import + screenshots ───────── */
  const MAX_SHOTS = 8;
  function ghResHtml() {
    const r = wiz && wiz.ghRes; if (!r) return '';
    const why = r.ai ? L(`AI(${r.model})가 작성했습니다. 내용을 확인하고 고치세요.`, `Drafted by AI (${r.model}). Please review and edit.`)
      : r.reason === 'ai_error' ? L(`AI 호출에 실패해 README 기준으로 채웠습니다 (${r.error || ''}).`, `AI call failed, filled from the README (${r.error || ''}).`)
      : r.reason === 'daily_limit' ? L('오늘 AI 사용 한도를 넘어 README 기준으로 채웠습니다.', 'Daily AI limit reached; filled from the README.')
      : L('README 기준으로 채웠습니다.', 'Filled from the README.');
    return `<div class="gh-res">${ico('check', 13)}<div><a href="${esc(r.repo.url)}" target="_blank" rel="noopener" data-notr>${esc(r.repo.fullName)}</a> · ★ ${fmtNum(r.repo.stars)}${r.repo.language ? ` · <span data-notr>${esc(r.repo.language)}</span>` : ''} · ${L(`스크린샷 ${r.added}장 추가`, `${r.added} screenshot(s) added`)}<br><span class="t2">${esc(why)}</span></div></div>`;
  }
  async function ghImport() {
    const w = wiz; const url = ($('#ghUrl').value || '').trim(); w.ghUrl = url;
    if (!url) return toast(L('GitHub 저장소 주소를 입력하세요.', 'Enter a GitHub repository URL.'), 'error');
    const btn = $('#ghGo'); btn.disabled = true;
    let d;
    try { d = await runTask(L('GitHub 불러오기', 'GitHub import'), url, () => api('/api/my/github-import', { method: 'POST', body: { url } })); }
    catch (_) { btn.disabled = false; return; }
    const dr = d.draft || {};
    const filled = ['name', 'description'].some((k) => (w[k] || '').trim()) || normTags(w.tags).length || w.category;
    const overwrite = !filled || (await confirmBox(L('GitHub 내용 적용', 'Apply GitHub content'), L('이미 입력한 이름·설명·태그·카테고리를 GitHub에서 가져온 내용으로 바꿀까요?<br><span class="t2">취소하면 비어 있는 칸만 채웁니다.</span>', 'Replace the name, description, tags and category you already entered with the imported content?<br><span class="t2">Cancel fills only the empty fields.</span>'), L('바꾸기', 'Replace')));
    const put = (k, v) => { if (v && (overwrite || !String(w[k] || '').trim())) w[k] = v; };
    put('name', dr.name); put('description', dr.description); put('tags', (dr.tags || []).join(', ')); put('category', dr.category);
    if (dr.demoUrl && !w.demoUrl) w.demoUrl = dr.demoUrl;
    if (dr.accessGuide && !w.accessGuide) w.accessGuide = dr.accessGuide;
    if (w.type === 'link' && !w.url) w.url = d.repo.homepage && /^https:/i.test(d.repo.homepage) ? d.repo.homepage : d.repo.pagesUrl || d.repo.url;
    let added = 0;
    for (const im of d.repo.images || []) {
      if (w.screenshots.length >= MAX_SHOTS) break;
      if (w.screenshots.some((x) => x.url === im.url)) continue;
      w.screenshots.push(im.caption ? { url: im.url, caption: im.caption } : { url: im.url }); added++;
    }
    w.ghRes = { ...d, added };
    renderWizard();
    toast(d.ai ? L('AI가 작성한 내용을 채웠습니다. 확인 후 다음으로 진행하세요.', 'AI draft applied. Review it, then continue.') : L('GitHub 내용을 채웠습니다.', 'GitHub content applied.'), 'success');
  }
  function renderShotsEd() {
    const el = $('#shotsEd'); if (!el) return;
    const w = wiz; const n = w.screenshots.length;
    el.innerHTML = `${w.screenshots.map((x, i) => `<div class="shot-it">
        <img src="${esc(x.url)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.classList.add('bad')">
        ${i === 0 ? `<span class="lbl approved cover">${L('대표', 'Cover')}</span>` : ''}
        <div class="shot-bar"><button type="button" class="icon-btn" data-mv="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''} title="${L('앞으로', 'Move left')}">‹</button><button type="button" class="icon-btn" data-mv="${i}" data-d="1" ${i === n - 1 ? 'disabled' : ''} title="${L('뒤로', 'Move right')}">›</button><span class="sp"></span><button type="button" class="icon-btn" data-rm="${i}" title="${L('삭제', 'Remove')}">${ico('x', 13)}</button></div>
        <input class="input cap" data-cap="${i}" maxlength="120" value="${esc(x.caption || '')}" placeholder="${L('설명 (선택)', 'Caption (optional)')}">
      </div>`).join('')}
      ${n < MAX_SHOTS ? `<label class="shot-add" title="${L('이미지 업로드', 'Upload images')}"><input type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple hidden id="shotFile">${ico('up', 22)}<span>${L('이미지 올리기', 'Upload')}</span></label>
        <button type="button" class="shot-add" id="shotUrl">${ico('link', 20)}<span>${L('URL 추가', 'Add URL')}</span></button>` : ''}`;
    el.onclick = (e) => {
      const mv = e.target.closest('[data-mv]'); const rm = e.target.closest('[data-rm]');
      if (mv) { const i = +mv.dataset.mv, j = i + +mv.dataset.d; [w.screenshots[i], w.screenshots[j]] = [w.screenshots[j], w.screenshots[i]]; renderShotsEd(); }
      if (rm) { w.screenshots.splice(+rm.dataset.rm, 1); renderShotsEd(); }
    };
    $$('[data-cap]', el).forEach((inp) => (inp.oninput = () => { const x = w.screenshots[+inp.dataset.cap]; if (inp.value.trim()) x.caption = inp.value; else delete x.caption; }));
    if ($('#shotFile')) $('#shotFile').onchange = (e) => { addShotFiles([...e.target.files]); e.target.value = ''; };
    if ($('#shotUrl')) $('#shotUrl').onclick = async () => {
      const u = ((await promptBox(L('스크린샷 URL', 'Screenshot URL'), L('https:// 로 시작하는 이미지 주소', 'Image address starting with https://'), { placeholder: 'https://…/screen.png' })) || '').trim();
      if (!u) return;
      if (!/^https:\/\/\S+$/i.test(u)) return toast(L('https:// 이미지 주소만 추가할 수 있습니다.', 'Only https:// image URLs can be added.'), 'error');
      w.screenshots.push({ url: u.replace(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\//i, 'https://raw.githubusercontent.com/$1/$2/') }); renderShotsEd();
    };
    el.ondragover = (e) => { e.preventDefault(); el.classList.add('over'); };
    el.ondragleave = () => el.classList.remove('over');
    el.ondrop = (e) => { e.preventDefault(); el.classList.remove('over'); addShotFiles([...e.dataTransfer.files]); };
    el.onpaste = (e) => { const fs = [...(e.clipboardData || {}).files || []]; if (fs.length) { e.preventDefault(); addShotFiles(fs); } };
    el.tabIndex = -1;
  }
  async function shrinkImage(file) {
    const LIMIT = 2 * 1024 * 1024;
    if (file.type === 'image/gif' && file.size <= LIMIT) return file; // keep animation
    const bmp = await createImageBitmap(file);
    for (const [maxW, q] of [[1920, 0.86], [1600, 0.8], [1280, 0.75], [1024, 0.7]]) {
      const k = Math.min(1, maxW / Math.max(bmp.width, bmp.height));
      if (k === 1 && file.size <= LIMIT && /^image\/(png|jpeg|webp)$/.test(file.type) && file.size < 600 * 1024) return file;
      const cv = document.createElement('canvas'); cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
      cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
      const blob = await new Promise((r) => cv.toBlob(r, 'image/webp', q)) || await new Promise((r) => cv.toBlob(r, 'image/jpeg', q));
      if (blob && blob.size <= LIMIT) return blob;
    }
    throw new Error(L('이미지를 2MB 이하로 줄이지 못했습니다.', 'Could not shrink the image below 2 MB.'));
  }
  async function addShotFiles(files) {
    const w = wiz;
    const imgs = files.filter((f) => /^image\/(png|jpeg|gif|webp)$/.test(f.type));
    if (!imgs.length) return toast(L('PNG, JPEG, GIF, WebP 이미지만 올릴 수 있습니다.', 'Only PNG, JPEG, GIF and WebP images can be uploaded.'), 'error');
    const room = MAX_SHOTS - w.screenshots.length;
    if (imgs.length > room) toast(L(`최대 ${MAX_SHOTS}장까지라 ${room}장만 올립니다.`, `Max ${MAX_SHOTS}; uploading ${room}.`), 'error');
    for (const f of imgs.slice(0, Math.max(0, room))) {
      try {
        const d = await runTask(L('스크린샷 업로드', 'Screenshot upload'), f.name, async () => api('/api/my/images', { method: 'POST', body: await shrinkImage(f) }));
        w.screenshots.push({ url: API + d.path }); renderShotsEd();
      } catch (_) { /* toast shown */ }
    }
  }
  function shotGallery(app) {
    const sh = app.screenshots || []; if (!sh.length) return '';
    return `<div class="portlet" style="margin-bottom:16px"><div class="portlet-hd">${ico('monitor')} ${L('스크린샷', 'Screenshots')}<span class="acts" style="font-size:12.5px;color:var(--muted)">${sh.length}</span></div><div class="portlet-bd"><div class="shots">
      ${sh.map((x, i) => `<button type="button" class="shot" data-shot="${i}" title="${esc(x.caption || '')}"><img src="${esc(x.url)}" alt="${esc(x.caption || '')}" loading="lazy" referrerpolicy="no-referrer">${x.caption ? `<span class="cap" data-notr>${esc(x.caption)}</span>` : ''}</button>`).join('')}</div></div></div>`;
  }
  function openShot(app, i) {
    const sh = app.screenshots || [];
    const m = modal({ raw: true, bgCls: 'shot-bg', body: `<div class="shot-view" role="dialog" aria-modal="true"><button class="hdr-btn x" data-close title="${L('닫기', 'Close')}">${ico('x', 18)}</button>
      ${sh.length > 1 ? `<button class="nav prev" data-nav="-1">‹</button><button class="nav next" data-nav="1">›</button>` : ''}<figure><img referrerpolicy="no-referrer"><figcaption data-notr></figcaption></figure></div>` });
    const show = () => { const x = sh[i]; $('img', m.el).src = x.url; $('figcaption', m.el).textContent = `${i + 1} / ${sh.length}${x.caption ? ' · ' + x.caption : ''}`; };
    m.el.onclick = (e) => { const n = e.target.closest('[data-nav]'); if (n) { i = (i + +n.dataset.nav + sh.length) % sh.length; show(); } else if (e.target.closest('[data-close]') || e.target === m.el.firstElementChild) m.close(); };
    const key = (e) => { if (!document.body.contains(m.el)) return document.removeEventListener('keydown', key); if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { i = (i + (e.key === 'ArrowRight' ? 1 : -1) + sh.length) % sh.length; show(); } };
    document.addEventListener('keydown', key);
    show();
  }
  function renderFt() {
    const w = wiz;
    $('#wizFt').innerHTML = `<button class="btn btn-link left" id="wCancel">취소</button>
      ${w.step > 1 && !(w.editId && w.step === 2) ? '<button class="btn" id="wBack">뒤로</button>' : ''}
      ${w.step < 4 ? '<button class="btn btn-primary" id="wNext">다음</button>' : `<button class="btn btn-primary" id="wDone" ${w.agree ? '' : 'disabled'}>${w.editId ? '저장' : '완료'}</button>`}`;
    $('#wCancel').onclick = () => history.length > 1 ? history.back() : (location.hash = '#/');
    if ($('#wBack')) $('#wBack').onclick = () => { w.step--; renderWizard(); };
    if ($('#wNext')) $('#wNext').onclick = () => { const err = checkStep(w.step); if (err) return toast(err, 'error'); w.step++; renderWizard(); };
    if ($('#wDone')) $('#wDone').onclick = submitWizard;
  }
  function checkStep(s) {
    const w = wiz;
    if (s === 2) {
      if (!w.name.trim()) return '앱 이름을 입력하세요.';
      if (!w.author.trim()) return '작성자 이름을 입력하세요.';
      if (isAdmin() && w.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(w.email.trim())) return '이메일 형식이 올바르지 않습니다.';
      if (!w.category) return '카테고리를 선택하세요.';
      if (!w.description.trim()) return '설명을 입력하세요.';
      if (w.thumbnail && !/^https:\/\//i.test(w.thumbnail.trim())) return '썸네일은 https:// 주소만 가능합니다.';
    }
    if (s === 3) {
      if (w.type === 'link' && !/^https:\/\/[^\s]+\.[^\s]+/i.test(w.url.trim())) return 'https:// 로 시작하는 URL을 입력하세요.';
      if (w.type === 'link' && !/^https?:\/\/[^\s/]+/i.test(w.demoUrl.trim())) return L('실행 가능한 데모 URL을 입력하세요 (http:// 또는 https://).', 'Enter a runnable demo URL (http:// or https://).');
      if (w.type === 'link' && !w.accessGuide.trim()) return L('데모 접속 방법을 입력하세요.', 'Describe how to access the demo.');
      if (w.type === 'html' && !w.html.trim()) return 'HTML 파일을 업로드하거나 코드를 붙여넣으세요.';
      if (w.type === 'html' && byteLen(w.html) > MAX_HTML) return 'HTML은 10MB 이하만 가능합니다.';
    }
    return '';
  }
  async function submitWizard() {
    const w = wiz;
    const btn = $('#wDone'); btn.disabled = true; btn.textContent = '처리 중…';
    ls.set('krvcf.author', w.author.trim()); if (role() === 'owner') ls.set('krvcf.email', w.email.trim());
    const body = { type: w.type, name: w.name, author: w.author, email: w.email, category: w.category, description: w.description, thumbnail: w.thumbnail, url: w.url, tags: normTags(w.tags), changelog: w.changelog, screenshots: w.screenshots,
      ...(w.type === 'link' || w.demoUrl || w.accessGuide ? { demoUrl: w.demoUrl.trim(), accessGuide: w.accessGuide.trim(), accessPrivate: w.accessPrivate } : {}) };
    if (w.type === 'html' && (!w.editId || w.htmlChanged)) body.html = w.html;
    try {
      if (w.editId) {
        const key = myKey(w.editId);
        const d = await runTask('앱 수정', w.name, () => api(`/api/apps/${w.editId}`, { method: 'PUT', body, headers: key ? { 'x-owner-key': key } : {} }));
        w.done = { id: w.editId, status: d.app.status, edit: true };
      } else {
        const d = await runTask('앱 등록 요청', w.name, () => api('/api/apps', { method: 'POST', body }));
        if (d.ownerKey) saveMyKey(d.id, d.ownerKey, w.name);
        w.done = { id: d.id, key: d.ownerKey, status: d.status };
        refreshMyCount();
      }
      state.studio = null;
      await loadApps(true);
      renderWizard();
    } catch (_) {
      btn.disabled = false; btn.textContent = w.editId ? '저장' : '완료';
    }
  }
  function renderWizardDone() {
    const d = wiz.done;
    $('#wizBody').innerHTML = `<div style="text-align:center;padding:20px 0 10px"><div style="width:64px;height:64px;border-radius:50%;background:var(--success-soft);color:var(--success);display:grid;place-items:center;margin:0 auto 14px">${ico('check', 34)}</div>
      <h3>${d.edit ? '수정 사항을 저장했습니다' : d.status === 'approved' ? '앱이 등록·공개되었습니다' : '등록 요청이 완료되었습니다'}</h3>
      <p class="hint">${d.status === 'approved' ? '지금 바로 카탈로그에서 확인할 수 있습니다.' : L('관리자 승인 후 카탈로그에 공개됩니다. 진행 상태와 통계는 <b>내 앱 관리</b>에서 확인하세요.', 'It will be published after an admin review. Track its status and stats in <b>My apps</b>.')}</p></div>
      ${d.key ? `<div class="alert warn">${ico('key')}<div><b>${L('최고 관리자 계정으로 등록한 앱입니다.', 'Submitted with the super-admin account.')}</b> ${L('이 앱은 Google 계정에 연결되지 않았습니다. 아래 소유 키로 나중에 크리에이터 계정에 연결할 수 있습니다.', 'This app is not linked to a Google account. Use the owner key below to link it to a creator account later.')}</div></div>
        <div class="field"><label>앱 ID</label><div class="keybox"><code>${esc(d.id)}</code></div></div>
        <div class="field"><label>소유 키</label><div class="keybox"><code id="okey">${esc(d.key)}</code><button class="icon-btn" id="cpKey" title="복사">${ico('copy')}</button></div></div>` : ''}`;
    $('#wizFt').innerHTML = `<a class="btn" href="#/studio/${d.id}">${ico('folder', 14)} ${L('관리 모드로 이동', 'Open in Owner Studio')}</a><a class="btn" href="#/app/${d.id}">${ico('eye', 14)} 앱 상세 보기</a><button class="btn btn-primary" id="again">${ico('plus', 14)} 다른 앱 등록</button>`;
    if ($('#cpKey')) $('#cpKey').onclick = async () => { await copyText(L(`앱 ID: ${d.id}\n소유 키: ${d.key}`, `App ID: ${d.id}\nOwner key: ${d.key}`)); toast('앱 ID와 소유 키를 복사했습니다.', 'success'); };
    $('#again').onclick = () => { location.hash === '#/submit' ? viewSubmit() : (location.hash = '#/submit'); };
    renderNav();
  }

  /* ───────── v8: Owner Studio (내 앱 관리) ───────── */
  const STUDIO_TABS = [['overview', '개요', 'Overview', 'gauge'], ['versions', '버전', 'Versions', 'git'], ['feedback', '리뷰·피드백', 'Reviews & feedback', 'chat'], ['settings', '설정', 'Settings', 'gear']];
  async function viewStudio(id, tab) {
    if (!me()) return signInGate(L('내 앱 관리', 'My apps'), L('내 앱을 관리하려면 로그인하세요', 'Sign in to manage your apps'),
      L('Google 계정으로 로그인하면 내가 등록한 앱의 승인 상태, 조회·실행 통계, 리뷰와 피드백을 한 곳에서 보고 수정·삭제할 수 있습니다.', 'Sign in with Google to see the review status, views and runs, reviews and feedback of your apps — and edit or delete them — in one place.'));
    return id ? studioApp(id, tab || 'overview') : studioHome();
  }
  const studioHd = (sub, acts) => {
    const u = me();
    return `<div class="studio-hd"><div class="studio-who">${avatar(u, 44)}<div><div class="eyebrow">${ico('folder', 12)} Owner Studio</div><h1>${L('내 앱 관리', 'My apps')}</h1><p data-notr>${esc(u.name || '')} · ${esc(u.email)}</p></div></div><div class="acts">${acts || ''}</div></div>${sub || ''}`;
  };
  async function studioHome() {
    state.studio = null; // per-app cache is only for tab switches; re-entering an app reloads it
    main.innerHTML = page(`<a href="#/">홈</a> / ${L('내 앱 관리', 'My apps')}`, `${studioHd('', `<button class="btn" id="sLink">${ico('key', 14)} ${L('기존 앱 연결', 'Link existing app')}</button><a class="btn btn-primary" href="#/submit">${ico('plus', 14)} 앱 등록</a>`)}
      <div id="studioBody"><div class="skel" style="height:110px;margin-bottom:16px"></div><div class="skel" style="height:260px"></div></div>`);
    $('#sLink').onclick = linkModal;
    let d;
    try { d = state.my = await api('/api/my/apps'); state.myCount = d.apps.length; renderNav(); }
    catch (e) { if (e.status === 401) return render(); $('#studioBody').innerHTML = `<div class="alert danger">${esc(e.message)}</div>`; return; }
    if (parseHash().parts[0] !== 'studio' || parseHash().parts[1]) return;
    const A = d.apps;
    const sum = (k) => A.reduce((t, a) => t + (a[k] || 0), 0);
    const rated = A.filter((a) => a.ratingCount);
    const avgR = rated.length ? (rated.reduce((t, a) => t + a.rating * a.ratingCount, 0) / rated.reduce((t, a) => t + a.ratingCount, 0)).toFixed(1) : '-';
    const by = (st) => A.filter((a) => a.status === st).length;
    const legacy = myKeys().filter((k) => !A.some((a) => a.id === k.id));
    const reps = sum('openReports');
    $('#studioBody').innerHTML = `
      ${legacy.length ? `<div class="ownerbar warn">${ico('key', 16)}<span>${L(`이 브라우저에 소유 키로 등록한 앱 <b>${legacy.length}개</b>가 있습니다. 계정에 연결하면 어느 기기에서든 관리할 수 있습니다.`, `This browser holds owner keys for <b>${legacy.length}</b> app(s). Link them to your account to manage them from any device.`)}</span><button class="btn btn-sm btn-primary" id="sLinkAll">${L('모두 연결', 'Link all')}</button></div>` : ''}
      ${by('rejected') ? `<div class="alert danger">${ico('x')}<div>${L(`반려된 앱이 ${by('rejected')}개 있습니다. 반려 사유를 확인하고 수정 후 다시 제출하세요.`, `${by('rejected')} app(s) were not approved. Check the reason, fix and resubmit.`)}</div></div>` : ''}
      <div class="kpis">
        ${kpi(L('내 앱', 'My apps'), fmtNum(A.length), L(`공개 ${by('approved')} · 대기 ${by('pending')} · 반려 ${by('rejected')}`, `${by('approved')} live · ${by('pending')} pending · ${by('rejected')} rejected`))}
        ${kpi(L('최근 7일 조회', 'Views, last 7 days'), fmtNum(sum('weekViews')), L(`실행 ${fmtNum(sum('weekRuns'))}`, `${fmtNum(sum('weekRuns'))} runs`))}
        ${kpi(L('누적 실행', 'Total runs'), fmtNum(sum('runs')), L(`조회 ${fmtNum(sum('views'))}`, `${fmtNum(sum('views'))} views`))}
        ${kpi(L('평균 평점', 'Average rating'), avgR, L(`평점 ${fmtNum(sum('ratingCount'))}개 · 리뷰 ${fmtNum(sum('comments'))}개`, `${fmtNum(sum('ratingCount'))} ratings · ${fmtNum(sum('comments'))} reviews`))}
        ${kpi(L('미처리 신고', 'Open reports'), fmtNum(reps), reps ? L('관리자가 검토 중입니다', 'Under admin review') : L('없음', 'None'), reps ? 'warn' : '')}
      </div>
      ${A.length ? `<div class="portlet"><div class="portlet-hd">${ico('list')} ${L('앱 목록', 'Apps')}<span class="acts" style="font-size:12.5px;color:var(--muted)">${L('최근 수정순', 'Recently updated')}</span></div><div class="portlet-bd flush">
        <div class="gridwrap" style="box-shadow:none;border:0"><table class="grid studio-tbl"><thead><tr><th>${L('앱', 'App')}</th><th>${L('상태', 'Status')}</th><th>${L('버전', 'Version')}</th><th>${L('7일 조회 / 실행', '7-day views / runs')}</th><th>${L('평점', 'Rating')}</th><th>${L('리뷰 · 피드백', 'Reviews · feedback')}</th><th>${L('수정일', 'Updated')}</th><th></th></tr></thead><tbody>
        ${A.map((a) => `<tr data-sid="${a.id}" class="clickable">
          <td><div class="nm">${thumb(a, 14)}<b data-notr>${esc(a.name)}</b></div><div class="t2" style="font-size:12px;margin:2px 0 0 36px">${TYPE_LABEL[a.type]} · ${esc(catLabel(a.category))}</div></td>
          <td><span class="lbl ${a.status}">${STATUS_LABEL[a.status]}</span>${a.linkStatus === 'broken' ? ` <span class="lbl rejected">${ico('link', 10)} ${L('연결 불가', 'Unreachable')}</span>` : ''}${a.openReports ? ` <span class="lbl rejected" title="${L('미처리 신고', 'Open reports')}">${ico('flag', 10)} ${a.openReports}</span>` : ''}${a.status === 'rejected' && a.note ? `<div class="note-line" data-notr>${esc(a.note)}</div>` : ''}</td>
          <td class="mono">v${a.version}</td><td>${fmtNum(a.weekViews)} / ${fmtNum(a.weekRuns)}</td><td>${stars(a.rating, a.ratingCount)}</td>
          <td>${fmtNum(a.comments)} · ${fmtNum(a.feedback)}</td><td>${fmtDate(a.updatedAt)}</td>
          <td><div class="acts"><a class="btn btn-sm btn-primary" href="#/studio/${a.id}">${ico('gauge', 11)} ${L('관리', 'Manage')}</a><a class="btn btn-sm" href="#/submit/${a.id}">${ico('edit', 11)} ${L('수정', 'Edit')}</a></div></td></tr>`).join('')}
        </tbody></table></div></div></div>`
        : `<div class="portlet"><div class="empty-state" style="padding:46px 20px">${ico('folder', 46)}<h3>${L('아직 등록한 앱이 없습니다', 'You have no apps yet')}</h3><p>${L('HTML 시뮬레이터나 웹앱 링크를 등록해 커뮤니티와 공유해 보세요.', 'Share an HTML simulator or a web app link with the community.')}</p><a class="btn btn-primary" href="#/submit">${ico('plus')} ${L('첫 앱 등록', 'Submit your first app')}</a></div></div>`}`;
    $('#studioBody').onclick = (e) => {
      if (e.target.closest('a,button')) return;
      const tr = e.target.closest('[data-sid]'); if (tr) location.hash = '#/studio/' + tr.dataset.sid;
    };
    if ($('#sLinkAll')) $('#sLinkAll').onclick = () => claimKeys(legacy.map(({ id, key }) => ({ id, key }))).then(studioHome);
  }
  const kpi = (l, v, sub, cls = '') => `<div class="kpi ${cls}"><div class="kl">${l}</div><div class="kv">${v}</div><div class="ks">${sub || ''}</div></div>`;

  async function claimKeys(items) {
    if (!items.length) return;
    const CL = { linked: L('연결됨', 'linked'), already: L('이미 내 계정', 'already yours'), owned: L('다른 계정 소유', 'owned by another account'), bad_key: L('키 불일치', 'wrong key'), missing: L('삭제된 앱', 'deleted'), invalid: L('형식 오류', 'invalid') };
    try {
      const { results } = await runTask(L('기존 앱 연결', 'Link existing apps'), `${items.length}`, () => api('/api/my/claim', { method: 'POST', body: { items } }));
      const ok = results.filter((r) => r.result === 'linked' || r.result === 'already');
      const drop = new Set(results.filter((r) => ['linked', 'already', 'missing'].includes(r.result)).map((r) => r.id));
      ls.set('krvcf.myapps', myKeys().filter((k) => !drop.has(k.id)));
      const bad = results.filter((r) => !['linked', 'already'].includes(r.result));
      toast(L(`${ok.length}개 앱을 계정에 연결했습니다.`, `Linked ${ok.length} app(s) to your account.`) + (bad.length ? ' ' + bad.map((r) => `${r.name || r.id}: ${CL[r.result] || r.result}`).join(', ') : ''), bad.length && !ok.length ? 'error' : 'success', 6000);
      await refreshMyCount();
      return results;
    } catch (_) { return null; }
  }
  function linkModal() {
    const m = modal({
      title: L('기존 앱 연결', 'Link existing app'),
      body: `<p style="margin-top:0">${L('Google 로그인 도입 전에 <b>소유 키</b>로 등록한 앱을 내 계정에 연결합니다. 연결 후에는 소유 키 없이 어느 기기에서든 관리할 수 있습니다.', 'Link apps you registered with an <b>owner key</b> (before Google sign-in) to your account. Once linked, you can manage them from any device without the key.')}</p>
        <div class="field" style="grid-template-columns:90px 1fr"><label>${L('앱 ID', 'App ID')}</label><input class="input mono" data-id placeholder="a1b2c3d4e5"></div>
        <div class="field" style="grid-template-columns:90px 1fr"><label>${L('소유 키', 'Owner key')}</label><input class="input mono" data-key placeholder="${L('등록 완료 화면에 표시된 키', 'Key shown after submission')}"></div>
        <label class="btn btn-sm">${ico('up', 13)} ${L('내보낸 키 파일(JSON)에서 가져오기', 'Import from an exported key file (JSON)')}<input type="file" accept=".json,application/json" hidden data-file></label>`,
      foot: `<button class="btn" data-close>${L('취소', 'Cancel')}</button><button class="btn btn-primary" data-ok>${L('연결', 'Link')}</button>`,
    });
    const go = async (items) => { const r = await claimKeys(items); if (r) { m.close(); if (parseHash().parts[0] === 'studio') studioHome(); } };
    $('[data-file]', m.el).onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then((t) => {
        const items = (JSON.parse(t).items || []).filter((x) => x && x.id && x.key).map(({ id, key }) => ({ id, key }));
        if (!items.length) throw new Error(L('키 항목이 없습니다.', 'No key entries found.'));
        go(items);
      }).catch((err) => toast(L('키 파일을 읽을 수 없습니다: ', 'Cannot read the key file: ') + err.message, 'error'));
    };
    $('[data-ok]', m.el).onclick = () => {
      const id = $('[data-id]', m.el).value.trim(), key = $('[data-key]', m.el).value.trim();
      if (!id || !key) return toast(L('앱 ID와 소유 키를 입력하세요.', 'Enter the app ID and owner key.'), 'error');
      go([{ id, key }]);
    };
  }

  async function studioApp(id, tab) {
    if (!STUDIO_TABS.some((t) => t[0] === tab)) tab = 'overview';
    const cached = state.studio && state.studio.app.id === id ? state.studio : null;
    if (!cached) main.innerHTML = page(`<a href="#/">홈</a> / <a href="#/studio">${L('내 앱 관리', 'My apps')}</a>`, '<div class="skel" style="height:90px;margin-bottom:16px"></div><div class="skel" style="height:320px"></div>');
    let d = cached;
    if (!d) {
      try { d = state.studio = await api(`/api/my/apps/${id}`); }
      catch (e) {
        if (e.status === 401) return render();
        main.innerHTML = page(`<a href="#/">홈</a> / <a href="#/studio">${L('내 앱 관리', 'My apps')}</a>`, `<div class="empty-state">${ico('shield', 46)}<h2>${e.status === 403 ? L('이 앱을 관리할 권한이 없습니다', 'You cannot manage this app') : L('앱을 찾을 수 없습니다', 'App not found')}</h2><p>${esc(e.message)}</p><a class="btn" href="#/studio">${L('내 앱 목록', 'My apps')}</a></div>`);
        return;
      }
    }
    const p = parseHash().parts; if (p[0] !== 'studio' || p[1] !== id) return;
    const a = d.app;
    const live = a.status === 'approved';
    main.innerHTML = page(`<a href="#/">홈</a> / <a href="#/studio">${L('내 앱 관리', 'My apps')}</a> / <span data-notr>${esc(a.name)}</span>`, `
      <div class="objhd studio-app">${thumb(a, 30)}
        <div><div class="eyebrow">${ico('folder', 12)} Owner Studio</div><h1 data-notr>${esc(a.name)}</h1>
          <div class="sub"><span class="lbl ${a.status}">${STATUS_LABEL[a.status]}</span><span class="lbl ${a.type}">${TYPE_LABEL[a.type]}</span><span class="lbl">${esc(catLabel(a.category))}</span><span class="lbl" data-notr>v${a.version}</span><span>${L('수정', 'Updated')} ${fmtDate(a.updatedAt)}</span></div></div>
        <div class="acts">
          <button class="btn" id="sRun">${ico('play', 13)} ${live ? L('실행', 'Run') : L('미리보기', 'Preview')}</button>
          ${live ? `<a class="btn" href="#/app/${a.id}">${ico('eye', 14)} ${L('공개 페이지', 'Public page')}</a>` : ''}
          <a class="btn btn-primary" href="#/submit/${a.id}">${ico('edit', 14)} ${L('수정', 'Edit')}</a>
        </div></div>
      ${a.status === 'pending' ? `<div class="alert warn">${ico('clock')}<div>${L('관리자 승인 대기 중입니다. 승인되면 공개 목록에 표시되고 결과가 메일로 안내됩니다.', 'Waiting for admin review. Once approved it appears in the public catalog and you get an email.')}</div></div>` : ''}
      ${a.status === 'rejected' ? `<div class="alert danger">${ico('x')}<div><b>${L('반려되었습니다.', 'Not approved.')}</b>${a.note ? ` ${L('사유', 'Reason')}: <span data-notr>${esc(a.note)}</span>` : ''}<br>${L('내용을 수정해 저장하면 다시 승인 대기 상태가 됩니다.', 'Edit and save the app to resubmit it for review.')} <a href="#/submit/${a.id}">${L('지금 수정', 'Edit now')} →</a></div></div>` : ''}
      ${a.linkStatus === 'broken' ? `<div class="alert danger">${ico('link')}<div><b>${L('링크에 연결할 수 없습니다.', 'The link is unreachable.')}</b> ${L('자동 점검', 'Automatic check')} ${fmtTime(a.linkCheckedAt)} · <span data-notr>${esc(a.linkError || '-')}</span><br>${L('URL을 확인하고 수정하세요. 다음 점검에서 연결되면 자동으로 해제됩니다.', 'Check the URL and update it. The warning clears automatically when the next check succeeds.')}</div></div>` : ''}
      ${a.status === 'pending' && a.approvedVersion && a.approvedVersion !== a.version ? `<div class="ownerbar">${ico('git', 16)}<span>${L(`마지막 승인 버전은 v${a.approvedVersion}입니다. 재승인 전까지 앱은 공개 목록에서 숨겨지고, 승인되면 v${a.version}이 공개됩니다.`, `The last approved version is v${a.approvedVersion}. The app is hidden from the catalog until v${a.version} is approved.`)}</span><button class="btn btn-sm" id="sDiff">${L('변경 비교', 'Compare')}</button></div>` : ''}
      ${d.openReports.length ? `<div class="alert warn">${ico('flag')}<div>${L('미처리 신고', 'Open reports')}: ${d.openReports.map((r) => `${reasonLabel(r.reason)} ${r.n}`).join(' · ')}. ${L('관리자가 검토 중입니다.', 'An admin is reviewing them.')}</div></div>` : ''}
      <div class="tabs" id="sTabs">${STUDIO_TABS.map(([k, ko, en, i]) => `<a class="tab ${tab === k ? 'on' : ''}" href="#/studio/${a.id}/${k}">${ico(i, 14)} ${L(ko, en)}${k === 'feedback' && d.feedback.length ? `<span class="n">${d.feedback.length}</span>` : ''}</a>`).join('')}</div>
      <div id="sBody"></div>`);
    $('#sRun').onclick = () => launch(a);
    if ($('#sDiff')) $('#sDiff').onclick = () => diffModal(a, a.approvedVersion, a.version);
    const el = $('#sBody');
    if (tab === 'overview') studioOverview(el, d);
    if (tab === 'versions') {
      el.innerHTML = `<div class="portlet"><div class="portlet-hd">${ico('git')} ${L('버전 기록', 'Version history')}<span class="acts" style="font-size:12.5px;color:var(--muted)">${L('최근 10개 보관 · 복원하면 새 버전으로 기록', 'Last 10 kept · restoring creates a new version')}</span></div><div class="portlet-bd flush" id="dVer"><div class="skel" style="height:40px;margin:12px"></div></div></div>`;
      loadVersions(a, null, true, () => { state.studio = null; studioApp(a.id, 'versions'); });
    }
    if (tab === 'feedback') studioFeedback(el, d);
    if (tab === 'settings') studioSettings(el, d);
  }
  function fillDays(rows, n) {
    const m = Object.fromEntries(rows.map((r) => [r.day, r]));
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const day = new Date(Date.now() + 9 * 3600000 - i * 86400000).toISOString().slice(0, 10);
      out.push({ day, views: (m[day] && m[day].views) || 0, runs: (m[day] && m[day].runs) || 0 });
    }
    return out;
  }
  function studioOverview(el, d) {
    const a = d.app;
    const series = fillDays(d.daily, 30);
    const v30 = series.reduce((t, x) => t + x.views, 0), r30 = series.reduce((t, x) => t + x.runs, 0);
    const total = Object.values(d.distribution).reduce((x, y) => x + y, 0);
    el.innerHTML = `
      <div class="kpis">
        ${kpi(L('30일 조회', 'Views, 30 days'), fmtNum(v30), L(`누적 ${fmtNum(a.views)}`, `${fmtNum(a.views)} all time`))}
        ${kpi(L('30일 실행', 'Runs, 30 days'), fmtNum(r30), L(`누적 ${fmtNum(a.runs)}`, `${fmtNum(a.runs)} all time`))}
        ${kpi(L('평점', 'Rating'), a.ratingCount ? a.rating.toFixed(1) : '-', L(`평점 ${fmtNum(a.ratingCount)}개`, `${fmtNum(a.ratingCount)} ratings`))}
        ${kpi(L('리뷰 · 피드백', 'Reviews · feedback'), `${fmtNum(d.comments.filter((c) => !c.hidden).length)} · ${fmtNum(d.feedback.length)}`, L('공개 리뷰 · 비공개 피드백', 'public reviews · private feedback'))}
      </div>
      <div class="portlet" style="margin-bottom:16px"><div class="portlet-hd">${ico('trend')} ${L('최근 30일 추이', 'Last 30 days')}
        <span class="acts legend"><span><i style="background:${chartColors().uv}"></i>${L('조회', 'Views')}</span><span><i style="background:${chartColors().pv}"></i>${L('실행', 'Runs')}</span></span></div>
        <div class="portlet-bd"><div class="chart" id="sChart"><div class="g-tip" hidden></div></div>${!v30 && !r30 ? `<p class="t2" style="text-align:center;margin:6px 0 0">${L('아직 집계된 조회·실행이 없습니다. 승인 후 공개되면 집계가 시작됩니다.', 'No views or runs yet. Counting starts once the app is published.')}</p>` : ''}</div></div>
      <div class="row2">
        <div class="portlet"><div class="portlet-hd">${ico('star')} ${L('평점 분포', 'Rating distribution')}</div><div class="portlet-bd">
          <div class="rv-dist" style="max-width:none">${[5, 4, 3, 2, 1].map((n) => `<div class="rv-bar"><span>${n}</span><span class="tr"><i style="width:${total ? (100 * d.distribution[n]) / total : 0}%"></i></span><span class="c">${d.distribution[n]}</span></div>`).join('')}</div></div></div>
        <div class="portlet"><div class="portlet-hd">${ico('clock')} ${L('승인 이력', 'Review history')}</div><div class="portlet-bd">${timeline(d.history.slice(0, 8))}</div></div>
      </div>`;
    const box = $('#sChart');
    const W = Math.max(320, Math.round(box.clientWidth || 900));
    box.insertAdjacentHTML('afterbegin', appChart(series, W));
    bindAppChart(box, series, W);
  }
  // 30-day views (area) and runs (line): same unit (counts) → one axis
  function appChart(series, W) {
    const H = 220, Lp = 40, R = 12, T = 12, B = 28, n = series.length;
    const max = niceMax(Math.max(1, ...series.map((x) => Math.max(x.views, x.runs))));
    const x = (i) => Lp + (i * (W - Lp - R)) / (n - 1), y = (v) => T + (H - T - B) * (1 - v / max);
    const line = (k) => series.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[k]).toFixed(1)}`).join('');
    const c = chartColors(); const step = Math.max(1, Math.ceil(n / Math.max(3, Math.floor(W / 90))));
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${L('최근 30일 조회·실행 추이', 'Views and runs over the last 30 days')}">
      ${ticksOf(max).map((f) => { const v = max * f; return `<line x1="${Lp}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="g-line"/><text x="${Lp - 8}" y="${y(v) + 4}" class="g-ax" text-anchor="end">${fmtShort(Math.round(v))}</text>`; }).join('')}
      ${series.map((d, i) => ((i % step === 0 && n - 1 - i >= step * 0.6) || i === n - 1 ? `<text x="${x(i)}" y="${H - 8}" class="g-ax" text-anchor="middle">${d.day.slice(5).replace('-', '/')}</text>` : '')).join('')}
      <path d="${line('views')}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z" fill="${c.uv}" fill-opacity=".10"/>
      <path d="${line('views')}" fill="none" stroke="${c.uv}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="${line('runs')}" fill="none" stroke="${c.pv}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <g class="g-hover" style="display:none"><line class="g-xh" y1="${T}" y2="${H - B}"/><circle r="4.5" class="g-dot" fill="${c.uv}" data-k="views"/><circle r="4.5" class="g-dot" fill="${c.pv}" data-k="runs"/></g>
      <rect class="g-hit" x="${Lp}" y="${T}" width="${W - Lp - R}" height="${H - T - B}" fill="transparent"/></svg>`;
  }
  function bindAppChart(box, series, W) {
    const svg = $('svg', box), tip = $('.g-tip', box); if (!svg) return;
    const H = 220, Lp = 40, R = 12, T = 12, B = 28, n = series.length;
    const max = niceMax(Math.max(1, ...series.map((x) => Math.max(x.views, x.runs))));
    const x = (i) => Lp + (i * (W - Lp - R)) / (n - 1), y = (v) => T + (H - T - B) * (1 - v / max);
    const g = $('.g-hover', svg), xh = $('.g-xh', svg);
    const show = (ev) => {
      const r = svg.getBoundingClientRect();
      const i = Math.max(0, Math.min(n - 1, Math.round(((((ev.clientX - r.left) / r.width) * W - Lp) / (W - Lp - R)) * (n - 1))));
      const d = series[i]; const c = chartColors();
      g.style.display = ''; xh.setAttribute('x1', x(i)); xh.setAttribute('x2', x(i));
      $$('.g-dot', svg).forEach((el) => { el.setAttribute('cx', x(i)); el.setAttribute('cy', y(d[el.dataset.k])); });
      tip.innerHTML = `<b>${d.day}</b><div><i style="background:${c.uv}"></i>${L('조회', 'Views')} <b>${fmtNum(d.views)}</b></div><div><i style="background:${c.pv}"></i>${L('실행', 'Runs')} <b>${fmtNum(d.runs)}</b></div>`;
      tip.hidden = false;
      tip.style.left = Math.min(Math.max((x(i) / W) * r.width, 70), r.width - 70) + 'px';
      tip.style.top = (Math.min(y(d.views), y(d.runs)) / H) * r.height + 'px';
    };
    const hide = () => { g.style.display = 'none'; tip.hidden = true; };
    svg.addEventListener('mousemove', show); svg.addEventListener('mouseleave', hide);
    svg.addEventListener('touchstart', (e) => show(e.touches[0]), { passive: true });
  }
  function studioFeedback(el, d) {
    el.innerHTML = `<div class="row2">
      <div class="portlet"><div class="portlet-hd">${ico('star')} ${L('공개 리뷰', 'Public reviews')}<span class="acts" style="font-size:12.5px;color:var(--muted)">${fmtNum(d.comments.length)}</span></div><div class="portlet-bd">
        <ul class="rv-list">${d.comments.length ? d.comments.map((c) => `<li class="${c.hidden ? 'muted' : ''}"><div class="rv-h">${starRow(c.stars)}<b data-notr>${esc(c.nickname || L('익명', 'Anonymous'))}</b>${c.hidden ? `<span class="lbl rejected">${L('관리자 숨김', 'Hidden by admin')}</span>` : ''}<span class="t2">${fmtDate(c.ts)}</span></div>${c.body ? `<p data-notr>${esc(c.body)}</p>` : ''}
          ${c.reply ? `<div class="rv-reply"><div class="rv-h">${ico('chat', 13)}<b>${L('내 답글', 'Your reply')}</b><span class="t2">${fmtDate(c.reply_ts)}</span></div><p data-notr>${esc(c.reply)}</p></div>` : ''}
          ${c.body && !c.hidden ? `<div class="rv-ra"><button class="btn btn-sm btn-link" data-rp="${c.id}">${ico('chat', 12)} ${c.reply ? L('답글 수정', 'Edit reply') : L('답글 달기', 'Reply')}</button>${c.reply ? `<button class="btn btn-sm btn-link" data-rpd="${c.id}">${L('답글 삭제', 'Delete reply')}</button>` : ''}</div>` : ''}</li>`).join('')
          : `<li class="empty t2">${L('아직 리뷰가 없습니다.', 'No reviews yet.')}</li>`}</ul></div></div>
      <div class="portlet"><div class="portlet-hd">${ico('chat')} ${L('비공개 피드백', 'Private feedback')}<span class="acts" style="font-size:12.5px;color:var(--muted)">${L('작성자와 관리자만 볼 수 있습니다', 'Only you and admins can see this')}</span></div><div class="portlet-bd">
        <ul class="fb-list">${d.feedback.length ? d.feedback.map((f) => `<li><div class="t2" style="font-size:12px">${fmtFull(f.created_at)}</div><p data-notr>${esc(f.message)}</p></li>`).join('')
          : `<li class="empty t2">${L('받은 피드백이 없습니다.', 'No feedback received.')}</li>`}</ul></div></div></div>`;
    const save = (cid, reply) => runTask(L('리뷰 답글', 'Review reply'), d.app.name, () => api(`/api/my/apps/${d.app.id}/comments/${cid}/reply`, { method: 'POST', body: { reply } }))
      .then(() => { toast(reply ? L('답글을 게시했습니다.', 'Reply posted.') : L('답글을 삭제했습니다.', 'Reply deleted.'), 'success'); state.studio = null; studioApp(d.app.id, 'feedback'); }).catch(() => {});
    el.onclick = (e) => {
      const r = e.target.closest('[data-rp]');
      if (r) {
        const c = d.comments.find((x) => String(x.id) === r.dataset.rp);
        const li = r.closest('li'); if ($('.rv-form-in', li)) return;
        li.insertAdjacentHTML('beforeend', `<div class="rv-form-in"><textarea class="textarea" maxlength="1000" placeholder="${L('리뷰 작성자에게 공개 답글을 남깁니다.', 'Write a public reply to this reviewer.')}">${esc(c.reply || '')}</textarea>
          <div class="rv-acts"><button class="btn btn-sm" data-rc>${L('취소', 'Cancel')}</button><button class="btn btn-sm btn-primary" data-rs>${L('게시', 'Post')}</button></div></div>`);
        const f = $('.rv-form-in', li); $('textarea', f).focus();
        $('[data-rc]', f).onclick = () => f.remove();
        $('[data-rs]', f).onclick = () => { const v = $('textarea', f).value.trim(); if (!v) return toast(L('답글 내용을 입력하세요.', 'Enter a reply.'), 'error'); save(c.id, v); };
        return;
      }
      const dl = e.target.closest('[data-rpd]');
      if (dl) confirmBox(L('답글 삭제', 'Delete reply'), L('이 답글을 삭제합니다.', 'Delete this reply?'), L('삭제', 'Delete'), true).then((ok) => ok && save(Number(dl.dataset.rpd), ''));
    };
  }
  function studioSettings(el, d) {
    const a = d.app;
    el.innerHTML = `
      <div class="portlet" style="margin-bottom:16px"><div class="portlet-hd">${ico('list')} ${L('앱 정보', 'App details')}<span class="acts"><a class="btn btn-sm" href="#/submit/${a.id}">${ico('edit', 12)} ${L('수정', 'Edit')}</a></span></div><div class="portlet-bd"><dl class="kv">
        <dt>${L('앱 ID', 'App ID')}</dt><dd class="mono">${esc(a.id)}</dd>
        <dt>${L('작성자 표시 이름', 'Author display name')}</dt><dd data-notr>${esc(a.author)}</dd>
        <dt>${L('소유자 계정', 'Owner account')}</dt><dd data-notr>${esc(d.owner || L('미연결 (소유 키 방식)', 'Not linked (owner key)'))}</dd>
        <dt>${L('태그', 'Tags')}</dt><dd data-notr>${(a.tags || []).map((t) => '#' + esc(t)).join(' ') || '-'}</dd>
        ${a.type === 'link' ? `<dt>URL</dt><dd><a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.url)}</a></dd>` : `<dt>${L('파일 크기', 'File size')}</dt><dd>${fmtSize(a.size)}</dd>`}
        ${a.demoUrl ? `<dt>${L('데모 URL', 'Demo URL')}</dt><dd><a href="${esc(a.demoUrl)}" target="_blank" rel="noopener" data-notr>${esc(a.demoUrl)}</a></dd>` : ''}${a.accessGuide ? `<dt>${L('접속 방법', 'How to access')}${a.accessPrivate ? L(' (로그인 전용)', ' (signed-in)') : ''}</dt><dd class="desc-full" data-notr>${esc(a.accessGuide)}</dd>` : a.type === 'link' ? `<dt>${L('접속 방법', 'How to access')}</dt><dd class="t2">${L('미입력 (다음 수정 때 필수)', 'Missing (required on next edit)')}</dd>` : ''}
        <dt>${L('등록일', 'Created')}</dt><dd>${fmtFull(a.createdAt)}</dd>
      </dl><p class="t2" style="margin:12px 0 0;font-size:12.5px">${L('관리자가 아닌 소유자가 수정하면 다시 승인 대기 상태가 됩니다.', 'Edits by owners send the app back for review.')}</p></div></div>
      <div class="portlet danger-zone"><div class="portlet-hd">${ico('trash')} ${L('위험 구역', 'Danger zone')}</div><div class="portlet-bd">
        <div class="dz-row"><div><b>${L('앱 삭제', 'Delete app')}</b><p>${L('앱과 모든 버전, 평점, 리뷰, 피드백이 영구 삭제됩니다. 되돌릴 수 없습니다.', 'Permanently deletes the app with all versions, ratings, reviews and feedback. This cannot be undone.')}</p></div>
          <button class="btn btn-danger" id="sDel">${ico('trash', 13)} ${L('앱 삭제', 'Delete app')}</button></div></div></div>`;
    $('#sDel').onclick = async () => {
      const typed = await promptBox(L('앱 삭제', 'Delete app'), L(`확인을 위해 앱 이름 "${a.name}"을(를) 입력하세요.`, `Type the app name "${a.name}" to confirm.`), { placeholder: a.name, okLabel: L('영구 삭제', 'Delete permanently') });
      if (typed === null) return;
      if (typed.trim() !== a.name) return toast(L('앱 이름이 일치하지 않습니다.', 'The app name does not match.'), 'error');
      await runTask(L('앱 삭제', 'Delete app'), a.name, async () => {
        await api(`/api/apps/${a.id}`, { method: 'DELETE' });
        ls.set('krvcf.myapps', myKeys().filter((x) => x.id !== a.id));
        state.apps = state.apps.filter((x) => x.id !== a.id); state.studio = null;
        toast(L('삭제했습니다.', 'Deleted.'), 'success'); location.hash = '#/studio';
      }).catch(() => {});
    };
  }

  /* ───────── Shared: review history / time ───────── */
  const REVIEW_LABEL = { submitted: '등록 요청', resubmitted: '수정 후 재요청', approved: '승인', rejected: '반려', pending: '승인 대기로 변경', edited: '관리자 수정' };
  const fmtFull = (t) => (t ? new Date(t).toLocaleString(LOC, { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-');
  function timeline(list) {
    if (!list || !list.length) return '<span style="color:var(--muted)">이력이 없습니다.</span>';
    return `<ul class="timeline">${list.map((r) => `<li class="${esc(r.action)}"><b>${esc(REVIEW_LABEL[r.action] || r.action)}</b> · ${esc(r.actor)}<div class="tm">${fmtFull(r.ts)}</div>${r.note ? `<div style="margin-top:3px;color:var(--text-2)" data-notr>${esc(/restored v\d+$/.test(r.note) ? verNote({ note: r.note }) : /includes HTML change$/.test(r.note) ? L('HTML 소스 변경 포함', 'Includes an HTML change') : r.note)}</div>` : ''}</li>`).join('')}</ul>`;
  }

  /* ───────── User menu / sign-in ───────── */
  $('#userBtn').addEventListener('click', (e) => {
    const se = getSess();
    e.preventDefault();
    if (!se) { signInModal(); return; }
    let m = $('#userMenu'); if (m) { m.remove(); return; }
    m = document.createElement('div'); m.id = 'userMenu'; m.className = 'menu';
    m.innerHTML = `<div class="who"><div style="display:flex;gap:10px;align-items:center">${avatar(se.user, 36)}<div style="min-width:0"><b data-notr>${esc(se.user.name || se.user.email)}</b><span data-notr>${esc(se.user.email)}</span></div></div>
      <div style="margin-top:8px"><span class="role ${se.user.role}">${ROLE_LABEL[se.user.role]}</span> <span style="font-size:11.5px;color:var(--muted)">${({ google: 'Google', email: '이메일 인증', password: '비밀번호', dev: 'Dev' })[se.user.method] || ''} · ${L('', 'until ')}${new Date(se.expiresAt).toLocaleString(LOC, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}${L('까지', '')}</span></div></div>
      <a href="#/studio">${ico('folder')} ${L('내 앱 관리', 'My apps')}</a><a href="#/submit">${ico('plus')} ${L('앱 등록', 'Submit app')}</a>
      ${['owner', 'admin', 'approver'].includes(se.user.role) ? `<a href="#/admin">${ico('shield')} 관리 콘솔</a>` : ''}<button data-logout>${ico('logout')} 로그아웃</button>`;
    document.body.appendChild(m);
    m.addEventListener('click', (ev) => { if (ev.target.closest('[data-logout]')) logout(); if (ev.target.closest('a,button')) m.remove(); });
    setTimeout(() => document.addEventListener('click', function h(ev) { if (!m.contains(ev.target) && !ev.target.closest('#userBtn')) { m.remove(); document.removeEventListener('click', h); } }), 0);
  });
  async function logout() {
    await api('/api/auth/logout', { method: 'POST', body: {} }).catch(() => {});
    setSess(null); updateUser(); state.admin = null; state.my = null; state.studio = null; state.noti = null; renderNav(); pollNoti();
    if ($('#notiPanel')) $('#notiPanel').remove();
    ls.set('krvcf.favs', []); document.title = document.title.replace(/^\(\d+\+?\) /, '');
    task('로그아웃', 'App Center').ok();
    const r = parseHash().parts[0];
    if (r === 'admin') viewAdmin();
    else if (r === 'studio' || r === 'submit') render();
  }

  /* ───────── v8: creator sign-in (Google) ───────── */
  function afterSignIn(d, quiet) {
    setSess(d); updateUser(); state.my = null; state.studio = null; renderNav();
    if (!quiet) toast(L(`${d.user.name || d.user.email} 님, 로그인되었습니다.`, `Signed in as ${d.user.name || d.user.email}.`), 'success');
    refreshMyCount();
    if (['submit', 'studio'].includes(parseHash().parts[0])) render();
    syncFavs(); pollNoti();
  }
  // Renders the Google button (and the local dev form when the API allows it) into `box`.
  async function mountSignIn(box, onDone) {
    if (!state.cfg) await loadConfig();
    const a = (state.cfg && state.cfg.auth) || {};
    box.innerHTML = `${a.google ? `<div class="g-wrap"><div class="g-btn"></div></div>` : ''}
      ${a.dev ? `<form class="dev-login"><div class="t2" style="font-size:12px;margin-bottom:6px">${ico('code', 12)} ${L('로컬 개발용 로그인 (DEV_LOGIN)', 'Local development sign-in (DEV_LOGIN)')}</div>
        <div style="display:flex;gap:8px"><input class="input" type="email" data-dev-email required placeholder="you@example.com" value="${esc(ls.get('krvcf.devEmail', ''))}"><button class="btn" type="submit">${L('로그인', 'Sign in')}</button></div></form>` : ''}
      ${!a.google && !a.dev ? `<div class="alert warn" style="margin:0">${ico('shield')}<div>${state.cfg ? L('Google 로그인이 아직 설정되지 않았습니다. 관리자에게 GOOGLE_CLIENT_ID 설정을 요청하세요.', 'Google sign-in is not configured yet. Ask an admin to set GOOGLE_CLIENT_ID.') : L('API 서버에 연결할 수 없습니다.', 'Cannot reach the API server.')}</div></div>` : ''}`;
    const done = (d) => { afterSignIn(d); if (onDone) onDone(d); };
    if (a.google) {
      loadGoogle().then(() => {
        const el = $('.g-btn', box); if (!el) return;
        window.google.accounts.id.initialize({
          client_id: a.google, ux_mode: 'popup',
          callback: (r) => runTask(L('Google 로그인', 'Google sign-in'), 'App Center', () => api('/api/auth/google', { method: 'POST', body: { credential: r.credential } })).then(done).catch(() => {}),
        });
        window.google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', locale: EN_UI ? 'en' : 'ko', width: Math.min(320, box.clientWidth || 320) });
      }).catch(() => { const el = $('.g-btn', box); if (el) el.innerHTML = `<span style="color:var(--danger);font-size:13px">${L('Google 로그인 스크립트를 불러오지 못했습니다.', 'Could not load the Google sign-in script.')}</span>`; });
    }
    if (a.dev) $('.dev-login', box).onsubmit = (e) => {
      e.preventDefault(); const email = $('[data-dev-email]', box).value.trim(); ls.set('krvcf.devEmail', email);
      runTask(L('개발용 로그인', 'Dev sign-in'), email, () => api('/api/auth/dev', { method: 'POST', body: { email } })).then(done).catch(() => {});
    };
  }
  function signInModal(reason, onDone) {
    const m = modal({
      title: L('로그인', 'Sign in'), cls: 'signin',
      body: `<div class="signin-hd">${ico('grid', 22)}<div><b>KRVCF App Center</b><p>${esc(reason || L('Google 계정으로 로그인하면 앱을 등록하고 내 앱을 관리할 수 있습니다.', 'Sign in with Google to submit apps and manage the ones you own.'))}</p></div></div>
        <div id="siBox" class="signin-box"></div>
        <ul class="signin-pts"><li>${ico('check', 13)} ${L('앱 등록·수정·삭제', 'Submit, edit and delete apps')}</li><li>${ico('check', 13)} ${L('내 앱 통계·리뷰·피드백 확인', 'Stats, reviews and feedback for your apps')}</li><li>${ico('check', 13)} ${L('이름·이메일·프로필 사진만 사용합니다', 'Only your name, email and profile photo are used')}</li></ul>`,
      foot: `<a class="btn btn-link" href="#/admin" data-close>${ico('shield', 13)} ${L('승인자·관리자 로그인', 'Approver / admin sign-in')}</a>`,
    });
    mountSignIn($('#siBox', m.el), (d) => { m.close(); if (onDone) onDone(d); });
    return m;
  }
  async function refreshMyCount() {
    if (!me()) return;
    try { state.my = await api('/api/my/apps'); state.myCount = state.my.apps.length; renderNav(); } catch (_) { /* ignore */ }
  }
  let gLoad = null;
  function loadGoogle() {
    if (window.google && window.google.accounts) return Promise.resolve();
    if (gLoad) return gLoad;
    gLoad = new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
      s.onload = res; s.onerror = () => { gLoad = null; rej(new Error('load')); };
      document.head.appendChild(s);
    });
    return gLoad;
  }
  async function viewLogin() {
    if (!state.cfg) await loadConfig();
    const a = (state.cfg && state.cfg.auth) || {};
    main.innerHTML = page(`<a href="#/">홈</a> / 로그인`, `<div class="login-wrap"><div class="portlet"><div class="portlet-hd">${ico('shield')} 승인자 · 관리자 로그인</div><div class="portlet-bd">
      <p style="margin-top:0;color:var(--text-2);font-size:13.5px">관리자가 승인자로 등록한 이메일만 로그인할 수 있습니다.</p>
      ${me() && me().role === 'user' ? `<div class="alert warn">${ico('shield')}<div>${L(`현재 <b>${esc(me().email)}</b> 크리에이터 계정으로 로그인되어 있습니다. 이 계정에는 승인자 권한이 없습니다.`, `You are signed in as creator <b>${esc(me().email)}</b>, which has no approver access.`)} <a href="#/studio">${L('내 앱 관리로 이동', 'Go to My apps')}</a></div></div>` : ''}
      ${a.google ? `<div class="login-sec"><h4>Google 계정</h4><div id="gBtn" style="min-height:44px"></div></div>` : ''}
      ${a.email ? `<div class="login-sec"><h4>이메일 인증 코드</h4><form id="otpForm"><div style="display:flex;gap:8px"><input class="input" type="email" id="otpEmail" placeholder="name@company.com" required autocomplete="email"><button class="btn btn-primary" id="otpSend" type="submit">코드 받기</button></div>
        <div id="otpStep2" hidden style="margin-top:12px"><input class="input otp" id="otpCode" inputmode="numeric" maxlength="6" placeholder="000000" autocomplete="one-time-code"><button class="btn btn-primary" type="button" id="otpVerify" style="width:100%;margin-top:10px">인증 후 로그인</button><div id="otpMsg" style="font-size:12.5px;color:var(--muted);margin-top:8px"></div></div></form></div>` : ''}
      ${!a.google && !a.email ? `<div class="alert warn">${ico('mail')}<div>Google·이메일 인증이 아직 설정되지 않았습니다. 최고 관리자 비밀번호로 로그인한 뒤 설정 탭의 연동 상태를 확인하세요.</div></div>` : ''}
      ${a.password ? `<div class="login-sec"><details ${!a.google && !a.email ? 'open' : ''}><summary style="cursor:pointer;font-size:13px;color:var(--muted)">최고 관리자(비밀번호) 로그인</summary><form id="pwForm" style="margin-top:10px;display:flex;gap:8px"><input class="input" type="password" id="pw" placeholder="ADMIN_PASSWORD" autocomplete="current-password" required><button class="btn" type="submit">로그인</button></form></details></div>` : ''}
      ${!state.cfg ? `<div class="alert danger">${ico('x')}<div>API 서버에 연결할 수 없습니다.</div></div>` : ''}
    </div></div></div>`);
    const done = (d) => {
      afterSignIn(d, true);
      if (d.user.role === 'user') toast(L(`승인자 권한이 없는 계정입니다 (${d.user.email}). 크리에이터로 로그인되었습니다.`, `${d.user.email} has no approver access. Signed in as a creator.`), 'error', 6000);
      else toast(`${d.user.name || d.user.email} 님, 로그인되었습니다.`, 'success');
      viewAdmin();
    };
    if (a.google) {
      loadGoogle().then(() => {
        if (!$('#gBtn')) return;
        window.google.accounts.id.initialize({
          client_id: a.google, ux_mode: 'popup',
          callback: (r) => runTask('Google 로그인', 'App Center', () => api('/api/auth/google', { method: 'POST', body: { credential: r.credential } })).then(done).catch(() => {}),
        });
        window.google.accounts.id.renderButton($('#gBtn'), { theme: 'outline', size: 'large', text: 'signin_with', locale: 'ko', width: 320 });
      }).catch(() => { if ($('#gBtn')) $('#gBtn').innerHTML = '<span style="color:var(--danger);font-size:13px">Google 로그인 스크립트를 불러오지 못했습니다.</span>'; });
    }
    if (a.email) {
      let busy = false;
      $('#otpForm').onsubmit = async (e) => {
        e.preventDefault();
        const email = $('#otpEmail').value.trim();
        await runTask('인증 코드 요청', email, async () => {
          const d = await api('/api/auth/email/start', { method: 'POST', body: { email } });
          $('#otpStep2').hidden = false;
          $('#otpMsg').textContent = d.message + (d.devCode ? ` (개발 모드 코드: ${d.devCode})` : '');
          $('#otpSend').textContent = '재발송'; $('#otpCode').focus();
        }).catch(() => {});
      };
      const verify = () => {
        if (busy) return; busy = true;
        runTask('이메일 로그인', $('#otpEmail').value.trim(), () => api('/api/auth/email/verify', { method: 'POST', body: { email: $('#otpEmail').value.trim(), code: $('#otpCode').value } }))
          .then(done).catch(() => {}).finally(() => { busy = false; });
      };
      $('#otpVerify').onclick = verify;
      $('#otpCode').oninput = (e) => { if (e.target.value.replace(/\D/g, '').length === 6) verify(); };
    }
    if (a.password) $('#pwForm').onsubmit = (e) => { e.preventDefault(); runTask('관리자 로그인', 'App Center', () => api('/api/auth/password', { method: 'POST', body: { password: $('#pw').value } })).then(done).catch(() => {}); };
  }

  /* ───────── Admin console ───────── */
  const TABS = [
    ['summary', '요약', 0], ['analytics', '방문 통계', 0], ['pending', '승인 대기', 0], ['apps', '전체 앱', 0], ['feedback', '피드백', 0], ['moderation', L('신고·리뷰', 'Reports & reviews'), 0],
    ['users', L('사용자', 'Users'), 1], ['approvers', '승인자 관리', 1], ['audit', '감사 로그', 1], ['visits', '방문 로그(원본)', 1], ['settings', '설정', 1], ['patch', '패치 / 배포', 1], ['backup', '백업 / 복원', 1],
  ];
  async function viewAdmin() {
    if (!isStaff()) return viewLogin();
    const se = getSess();
    main.innerHTML = page(`<a href="#/">홈</a> / 관리 콘솔`, `
      <div class="page-hd"><div><h1>관리 콘솔</h1><p><span class="role ${se.user.role}">${ROLE_LABEL[se.user.role]}</span> ${esc(se.user.name || '')} · ${esc(se.user.email)}</p></div>
        <div class="acts"><button class="btn" id="aRefresh">${ico('refresh', 14)} 새로고침</button><button class="btn" id="aLogout">${ico('logout', 14)} 로그아웃</button></div></div>
      <div class="tabs" id="aTabs"></div><div id="aBody"><div class="skel" style="height:300px"></div></div>`);
    $('#aLogout').onclick = logout;
    $('#aRefresh').onclick = () => loadAdmin();
    if (!TABS.some((t) => t[0] === state.adminTab && (!t[2] || isAdmin()))) state.adminTab = 'summary';
    await loadAdmin();
  }
  async function loadAdmin() {
    try { state.admin = await api('/api/admin/overview'); }
    catch (e) { if (!isStaff()) return viewAdmin(); if ($('#aBody')) $('#aBody').innerHTML = `<div class="alert danger">${esc(e.message)}</div>`; return; }
    if (state.admin.me && getSess()) { const se = getSess(); se.user.role = state.admin.me.role; setSess(se); }
    renderAdmin();
  }
  function renderAdmin() {
    const d = state.admin; if (!d || !$('#aTabs')) return;
    const pend = d.apps.filter((a) => a.status === 'pending');
    $('#aTabs').innerHTML = TABS.filter((t) => !t[2] || isAdmin()).map(([k, l]) => `<button class="tab ${state.adminTab === k ? 'on' : ''}" data-tab="${k}">${l}${k === 'pending' && pend.length ? `<span class="n">${pend.length}</span>` : ''}${k === 'moderation' && d.stats.openReports ? `<span class="n">${d.stats.openReports}</span>` : ''}</button>`).join('');
    $$('[data-tab]').forEach((b) => (b.onclick = () => { state.adminTab = b.dataset.tab; renderAdmin(); }));
    const on = $('#aTabs .tab.on'); if (on && $('#aTabs').scrollWidth > $('#aTabs').clientWidth) $('#aTabs').scrollLeft = on.offsetLeft - ($('#aTabs').clientWidth - on.offsetWidth) / 2;
    const el = $('#aBody'); el.onclick = null; el.onchange = null;
    ({ summary: tabSummary, analytics: tabAnalytics, pending: tabApps, apps: tabApps, feedback: tabFeedback, moderation: tabModeration, users: tabUsers, approvers: tabApprovers, audit: tabAudit, visits: tabVisits, settings: tabSettings, patch: tabPatch, backup: tabBackup })[state.adminTab](el, d);
  }

  function tabSummary(el, d) {
    const s = d.stats;
    const pend = d.apps.filter((a) => a.status === 'pending').slice(0, 8);
    el.innerHTML = `<div class="stats">${statCard('clock', '승인 대기', s.pending)}${statCard('check', '승인된 앱', s.approved)}${statCard('x', '반려', s.rejected)}${statCard('play', '누적 실행', s.runs)}${statCard('users', '오늘 방문자', s.todayVisitors)}${statCard('chat', '피드백', s.feedback)}${statCard('flag', L('미처리 신고', 'Open reports'), s.openReports || 0, '', s.openReports ? 'warn' : '')}</div>
      <div class="row2">
        <div class="portlet"><div class="portlet-hd">${ico('clock')} 승인 대기 중<span class="acts"><a href="javascript:void 0" data-go="pending">모두 보기</a></span></div><div class="portlet-bd flush">
          ${pend.length ? `<ul class="mlist">${pend.map((a) => `<li data-rvid="${a.id}">${thumb(a, 18)}<div class="mt"><b>${esc(a.name)}</b><span>${TYPE_LABEL[a.type]} · ${esc(a.author)} · ${fmtTime(a.updatedAt)}</span></div><div class="mr"><span class="btn btn-sm btn-primary">검토</span></div></li>`).join('')}</ul>` : `<div class="empty-state" style="padding:30px">${ico('check', 30)}<br>대기 중인 앱이 없습니다.</div>`}</div></div>
        ${isAdmin() ? `<div class="portlet"><div class="portlet-hd">${ico('log')} 최근 활동<span class="acts"><a href="javascript:void 0" data-go="audit">감사 로그</a></span></div><div class="portlet-bd flush" id="sumAudit"><div class="skel" style="height:120px;margin:12px"></div></div></div>`
        : `<div class="portlet"><div class="portlet-hd">${ico('shield')} 승인자 안내</div><div class="portlet-bd" style="font-size:13.5px;color:var(--text-2)">승인 대기 앱을 실행해 보고 <b>승인</b> 또는 <b>반려(사유 필수)</b>하세요. 모든 결정은 작성자에게 메일로 전달되고 감사 로그에 기록됩니다.</div></div>`}
      </div>`;
    el.onclick = (e) => {
      const g = e.target.closest('[data-go]'); if (g) { state.adminTab = g.dataset.go; renderAdmin(); return; }
      const it = e.target.closest('[data-rvid]'); if (it) reviewModal(d.apps.find((a) => a.id === it.dataset.rvid));
    };
    if (isAdmin()) api('/api/admin/audit?limit=12').then((r) => {
      const x = $('#sumAudit'); if (!x) return;
      x.innerHTML = `<table class="grid compact"><tbody>${r.logs.map((l) => `<tr><td>${fmtTime(l.ts)}</td><td>${esc(l.actor)}</td><td>${esc(ACTION_LABEL[l.action] || l.action)}</td><td class="${l.ok ? 'res-ok' : 'res-fail'}">${l.ok ? '성공' : '실패'}</td></tr>`).join('') || '<tr><td class="empty">기록 없음</td></tr>'}</tbody></table>`;
    }).catch(() => {});
  }

  function reviewModal(a) {
    if (!a) return;
    const m = modal({
      title: `앱 검토 — ${esc(a.name)}`,
      body: `<dl class="kv" style="margin-bottom:12px"><dt>유형</dt><dd>${TYPE_LABEL[a.type]} · ${esc(catLabel(a.category))}</dd><dt>작성자</dt><dd>${esc(a.author)}${a.email ? ` · ${esc(a.email)}` : ' · 이메일 없음(결과 메일 미발송)'}</dd>
        <dt>${L('소유자 계정', 'Owner account')}</dt><dd>${a.owner ? `${esc(a.owner)} <span class="lbl approved">Google</span>` : L('미연결 (소유 키 방식)', 'Not linked (owner key)')}${isAdmin() ? ` <button class="btn btn-sm btn-link" data-own>${L('변경', 'Change')}</button>` : ''}</dd>
        <dt>현재 상태</dt><dd><span class="lbl ${a.status}">${STATUS_LABEL[a.status]}</span></dd>${a.type === 'link' ? `<dt>URL</dt><dd><a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.url)}</a></dd>` : `<dt>크기</dt><dd>${fmtSize(a.size)}</dd>`}${a.demoUrl ? `<dt>${L('데모 URL', 'Demo URL')}</dt><dd><a href="${esc(a.demoUrl)}" target="_blank" rel="noopener" data-notr>${esc(a.demoUrl)}</a></dd>` : ''}${a.accessGuide ? `<dt>${L('접속 방법', 'How to access')}${a.accessPrivate ? L(' (로그인 전용)', ' (signed-in)') : ''}</dt><dd class="desc-full" data-notr>${esc(a.accessGuide)}</dd>` : a.type === 'link' ? `<dt>${L('접속 방법', 'How to access')}</dt><dd class="t2">${L('미입력 (다음 수정 때 필수)', 'Missing (required on next edit)')}</dd>` : ''}<dt>등록 · 수정</dt><dd>${fmtFull(a.createdAt)} · ${fmtFull(a.updatedAt)}</dd></dl>
        <p class="desc-full" style="background:var(--panel-2);padding:10px;border-radius:3px;max-height:140px;overflow:auto">${esc(a.description)}</p>
        ${a.approvedVersion && a.approvedVersion !== a.version ? `<div class="ownerbar" style="margin:10px 0 0">${ico('git', 16)}<span>${L(`마지막 승인 버전 v${a.approvedVersion} 이후 소스가 바뀌었습니다 (현재 v${a.version}).`, `The source changed since the last approved v${a.approvedVersion} (now v${a.version}).`)}</span><button class="btn btn-sm btn-primary" data-df>${L('변경 비교', 'Compare changes')}</button></div>` : !a.approvedVersion && a.status === 'pending' ? `<div class="t2" style="margin-top:10px;font-size:12.5px">${ico('plus', 12)} ${L('처음 승인 요청된 신규 앱입니다.', 'New app awaiting its first approval.')}</div>` : ''}
        ${a.type === 'link' && a.linkStatus ? `<div style="margin-top:8px;font-size:12.5px">${a.linkStatus === 'broken' ? `<span class="lbl rejected">${ico('link', 10)} ${L('연결 불가', 'Unreachable')}</span> <span data-notr>${esc(a.linkError || '')}</span>` : `<span class="lbl approved">${ico('link', 10)} ${L('연결 정상', 'Reachable')}</span>`} <span class="t2">${fmtTime(a.linkCheckedAt)}</span></div>` : ''}
        <div style="display:flex;gap:8px;margin:10px 0"><button class="btn btn-sm" data-pv>${ico('play', 11)} 실행해 보기</button>${a.type === 'link' ? `<button class="btn btn-sm" data-lc>${ico('link', 11)} ${L('링크 점검', 'Check link')}</button>` : ''}</div>
        <h4 style="margin:8px 0;font-size:13px">승인 이력</h4><div data-hist><div class="skel" style="height:30px"></div></div>
        <h4 style="margin:12px 0 6px;font-size:13px">검토 의견 <span style="font-weight:400;color:var(--muted)">(반려 시 필수 · 작성자에게 전달)</span></h4>
        <textarea class="textarea" data-note maxlength="500" style="min-height:70px" placeholder="예: 외부 스크립트 출처 확인 필요"></textarea>`,
      foot: `<button class="btn" data-close>닫기</button>${a.status !== 'pending' ? '<button class="btn" data-s="pending">대기로</button>' : ''}${a.status !== 'rejected' ? '<button class="btn btn-danger" data-s="rejected">반려</button>' : ''}${a.status !== 'approved' ? `<button class="btn btn-primary" data-s="approved">${ico('check', 13)} 승인</button>` : ''}`,
    });
    api(`/api/apps/${a.id}/reviews`).then((r) => { const h = $('[data-hist]', m.el); if (h) h.innerHTML = timeline(r.reviews); }).catch(() => {});
    $('[data-pv]', m.el).onclick = () => launch(a);
    if ($('[data-df]', m.el)) $('[data-df]', m.el).onclick = () => diffModal(a, a.approvedVersion, a.version);
    if ($('[data-lc]', m.el)) $('[data-lc]', m.el).onclick = () => runTask(L('링크 점검', 'Link check'), a.name, () => api(`/api/admin/apps/${a.id}/check-link`, { method: 'POST', body: {} }))
      .then((r) => {
        const x = r.results[0];
        if (!x) return toast(L('시간 안에 점검하지 못했습니다.', 'The check did not finish in time.'), 'error');
        const msg = { ok: L('정상적으로 연결됩니다.', 'The link is reachable.'), unknown: L(`지금은 확인할 수 없습니다: ${x.error}`, `Cannot check right now: ${x.error}`) }[x.status]
          || L(`연결 실패 (${x.fails}회 연속${x.marked === 'broken' ? ' · 연결 불가로 표시' : ''}): ${x.error}`, `Failed (${x.fails} in a row${x.marked === 'broken' ? ' · marked unreachable' : ''}): ${x.error}`);
        toast(msg, x.status === 'ok' ? 'success' : 'error', 6000); loadAdmin();
      }).catch(() => {});
    if ($('[data-own]', m.el)) $('[data-own]', m.el).onclick = async () => {
      const v = await promptBox(L('소유자 계정 변경', 'Change owner account'), L('새 소유자의 Google 이메일 (비우면 연결 해제)', "New owner's Google email (empty = unlink)"), { placeholder: a.owner || 'name@gmail.com' });
      if (v === null) return;
      await runTask(L('소유자 변경', 'Change owner'), a.name, () => api(`/api/admin/apps/${a.id}/owner`, { method: 'POST', body: { email: v.trim() || null } }))
        .then(() => { m.close(); toast(L('소유자를 변경했습니다.', 'Owner changed.'), 'success'); loadAdmin(); }).catch(() => {});
    };
    $$('[data-s]', m.el).forEach((b) => (b.onclick = async () => {
      const st = b.dataset.s; const note = $('[data-note]', m.el).value.trim();
      if (st === 'rejected' && !note) { $('[data-note]', m.el).focus(); return toast('반려 사유를 입력하세요.', 'error'); }
      await runTask({ approved: '앱 승인', rejected: '앱 반려', pending: '승인 대기로 변경' }[st], a.name, () => api(`/api/admin/apps/${a.id}/status`, { method: 'POST', body: { status: st, note } }))
        .then(async () => { m.close(); toast(`${a.name}: ${STATUS_LABEL[st]}`, 'success'); await loadApps(true); loadAdmin(); }).catch(() => {});
    }));
  }

  function tabApps(el, d) {
    const pendTab = state.adminTab === 'pending';
    const f = state.appFilter || (state.appFilter = { q: '', st: '' });
    const list = d.apps.filter((a) => (pendTab ? a.status === 'pending' : !f.st || a.status === f.st) &&
      (!f.q || [a.name, a.author, a.email, a.owner, a.description].join(' ').toLowerCase().includes(f.q.toLowerCase())));
    el.innerHTML = `${pendTab
      ? `<div class="alert info">${ico('clock')}<div>신규·수정된 앱은 승인 후에만 공개됩니다. <b>검토</b>에서 실행해 보고 승인 또는 반려(사유 필수)하세요. 결정은 작성자 메일·승인 이력·감사 로그에 남습니다.</div></div>`
      : `<div class="filters"><input class="input" id="afq" placeholder="이름·작성자·이메일 검색" value="${esc(f.q)}"><select class="select" id="afst"><option value="">전체 상태</option>${Object.entries(STATUS_LABEL).map(([k, v]) => `<option value="${k}" ${f.st === k ? 'selected' : ''}>${v}</option>`).join('')}</select><span style="font-size:13px;color:var(--muted)">${list.length}개</span>${isAdmin() ? `<button class="btn btn-sm" id="aLinks" style="margin-left:auto">${ico('link', 12)} ${L('링크 일괄 점검', 'Check all links')}</button>` : ''}</div>`}
      ${list.length ? `<div class="gridwrap"><table class="grid"><thead><tr><th>앱 이름</th><th>유형</th><th>카테고리</th><th>작성자</th><th>상태</th>${pendTab ? '' : '<th>실행</th><th>평점</th>'}${!pendTab && isAdmin() ? '<th>추천</th>' : ''}<th>최종 검토</th><th>등록일</th><th>작업</th></tr></thead><tbody>
        ${list.map((a) => `<tr><td><div class="nm">${thumb(a, 14)}<a href="#/app/${a.id}">${esc(a.name)}</a></div><div style="font-size:12px;color:var(--muted);max-width:320px;white-space:normal">${esc(a.description.slice(0, 110))}</div></td>
          <td><span class="lbl ${a.type}">${TYPE_LABEL[a.type]}</span></td><td>${esc(catLabel(a.category))}</td>
          <td>${esc(a.author)}${a.owner ? `<div style="font-size:12px" title="${L('소유자 계정', 'Owner account')}">${ico('user', 11)} <a href="mailto:${esc(a.owner)}">${esc(a.owner)}</a></div>` : `<div style="font-size:12px;color:var(--muted)">${ico('key', 11)} ${L('계정 미연결', 'No account')}${a.email ? ` · ${esc(a.email)}` : ''}</div>`}</td>
          <td><span class="lbl ${a.status}">${STATUS_LABEL[a.status]}</span>${a.status === 'pending' && a.approvedVersion && a.approvedVersion !== a.version ? ` <span class="lbl" title="${L('마지막 승인 버전 이후 변경됨', 'Changed since the last approved version')}">v${a.approvedVersion}→v${a.version}</span>` : ''}${a.linkStatus === 'broken' ? ` <span class="lbl rejected">${ico('link', 10)} ${L('연결 불가', 'Unreachable')}</span>` : ''}</td>
          ${pendTab ? '' : `<td>${fmtNum(a.runs)}</td><td>${stars(a.rating, a.ratingCount)}</td>`}
          ${!pendTab && isAdmin() ? `<td><label class="switch"><input type="checkbox" data-feat="${a.id}" ${a.featured ? 'checked' : ''}><i></i></label></td>` : ''}
          <td style="font-size:12.5px">${a.reviewedBy ? `${esc(a.reviewedBy)}<div style="color:var(--muted)">${fmtTime(a.reviewedAt)}</div>` : '-'}</td><td>${fmtDate(a.createdAt)}</td>
          <td><div class="acts"><button class="btn btn-sm btn-primary" data-rv="${a.id}">${ico('check', 11)} 검토</button><button class="btn btn-sm" data-pv="${a.id}" title="실행">${ico('play', 11)}</button>
            ${isAdmin() ? `<a class="btn btn-sm" href="#/submit/${a.id}" title="수정">${ico('edit', 11)}</a><button class="btn btn-sm btn-danger" data-del="${a.id}" title="삭제">${ico('trash', 11)}</button>` : ''}</div></td></tr>`).join('')}
        </tbody></table></div>` : `<div class="gridwrap"><div class="empty-state">${ico('check', 44)}<h3>${pendTab ? '승인 대기 중인 앱이 없습니다' : '조건에 맞는 앱이 없습니다'}</h3></div></div>`}`;
    if (!pendTab) {
      $('#afq').oninput = debounce((e) => { f.q = e.target.value; renderAdmin(); const x = $('#afq'); if (x) { x.focus(); x.setSelectionRange(x.value.length, x.value.length); } }, 300);
      $('#afst').onchange = (e) => { f.st = e.target.value; renderAdmin(); };
    }
    const find = (id) => d.apps.find((a) => a.id === id);
    el.onclick = (e) => {
      if (e.target.closest('#aLinks')) {
        return runTask(L('링크 일괄 점검', 'Check all links'), L('최대 50개', 'up to 50'), () => api('/api/admin/check-links', { method: 'POST', body: {} }))
          .then((r) => { const bad = r.results.filter((x) => x.status === 'failed'); toast(L(`${r.results.length}개 점검 · 실패 ${bad.length}개 (2회 연속 실패 시 연결 불가로 표시)`, `${r.results.length} checked · ${bad.length} failed (marked unreachable after 2 failures in a row)`), bad.length ? 'error' : 'success', 6000); loadAdmin(); }).catch(() => {});
      }
      const t = e.target.closest('[data-rv],[data-pv],[data-del]'); if (!t) return;
      if (t.dataset.rv) reviewModal(find(t.dataset.rv));
      if (t.dataset.pv) launch(find(t.dataset.pv));
      if (t.dataset.del) deleteFlow(find(t.dataset.del), null, () => loadAdmin());
    };
    el.onchange = async (e) => {
      const fe = e.target.closest('[data-feat]'); if (!fe) return;
      const a = find(fe.dataset.feat);
      await runTask(fe.checked ? '추천 지정' : '추천 해제', a.name, () => api(`/api/admin/apps/${a.id}/feature`, { method: 'POST', body: { featured: fe.checked } }))
        .then(() => { a.featured = fe.checked; loadApps(true); }).catch(() => { fe.checked = !fe.checked; });
    };
  }

  async function tabFeedback(el) {
    el.innerHTML = '<div class="skel" style="height:200px"></div>';
    let list; try { list = (await api('/api/admin/feedback')).feedback; } catch (e) { el.innerHTML = `<div class="alert danger">${esc(e.message)}</div>`; return; }
    el.innerHTML = `<div class="gridwrap"><table class="grid"><thead><tr><th>시간</th><th>앱</th><th>내용</th><th>IP</th>${isAdmin() ? '<th></th>' : ''}</tr></thead><tbody>
      ${list.length ? list.map((f) => `<tr><td>${fmtFull(f.created_at)}</td><td>${f.app_name ? `<a href="#/app/${esc(f.app_id)}">${esc(f.app_name)}</a>` : `<span class="mono">${esc(f.app_id)}</span>`}</td><td style="white-space:normal;max-width:520px;word-break:break-word">${esc(f.message)}</td><td class="mono">${esc(f.ip || '-')}</td>${isAdmin() ? `<td><button class="icon-btn" data-delfb="${f.id}" title="삭제">${ico('trash', 14)}</button></td>` : ''}</tr>`).join('') : '<tr><td colspan="5" class="empty">피드백이 없습니다.</td></tr>'}
    </tbody></table></div>`;
    el.onclick = (e) => {
      const b = e.target.closest('[data-delfb]'); if (!b) return;
      runTask('피드백 삭제', '#' + b.dataset.delfb, () => api(`/api/admin/feedback/${b.dataset.delfb}`, { method: 'DELETE' })).then(() => tabFeedback(el)).catch(() => {});
    };
  }


  async function tabUsers(el) {
    const f = state.userF || (state.userF = { q: '' });
    el.innerHTML = `<div class="alert info">${ico('user')}<div>${L('Google로 로그인한 크리에이터 계정입니다. 앱 등록·수정은 로그인한 계정만 할 수 있고, <b>차단</b>하면 즉시 로그아웃되며 다시 로그인할 수 없습니다(등록된 앱은 유지).', 'Creator accounts that signed in with Google. Only signed-in accounts can submit or edit apps. <b>Blocking</b> signs the user out immediately and prevents sign-in (their apps stay).')}</div></div>
      <div class="filters"><input class="input" id="ufq" placeholder="${L('이메일·이름 검색', 'Search email or name')}" value="${esc(f.q)}"><span id="ucnt" style="font-size:13px;color:var(--muted)"></span></div><div id="uList"><div class="skel" style="height:160px"></div></div>`;
    let users = [];
    try { users = (await api('/api/admin/users')).users; } catch (e) { $('#uList').innerHTML = `<div class="alert danger">${esc(e.message)}</div>`; return; }
    const draw = () => {
      const q = f.q.toLowerCase();
      const list = users.filter((u) => !q || [u.email, u.name].join(' ').toLowerCase().includes(q));
      $('#ucnt').textContent = L(`${list.length}명`, `${list.length} users`);
      $('#uList').innerHTML = list.length ? `<div class="gridwrap"><table class="grid"><thead><tr><th>${L('사용자', 'User')}</th><th>${L('역할', 'Role')}</th><th>${L('앱 (공개)', 'Apps (live)')}</th><th>${L('최근 로그인', 'Last sign-in')}</th><th>${L('로그인 수', 'Sign-ins')}</th><th>${L('가입일', 'Joined')}</th><th>${L('상태', 'Status')}</th><th></th></tr></thead><tbody>
        ${list.map((u) => `<tr><td><div class="nm">${avatar({ email: u.email, name: u.name, picture: u.picture }, 22)}<div><b data-notr>${esc(u.name || '-')}</b><div style="font-size:12px" data-notr>${esc(u.email)}</div></div></div></td>
          <td>${u.staff_role ? `<span class="role ${u.staff_role}">${ROLE_LABEL[u.staff_role]}</span>` : `<span class="role user">${ROLE_LABEL.user}</span>`}</td>
          <td>${fmtNum(u.apps)} (${fmtNum(u.approved)})</td><td>${fmtTime(u.last_login)}</td><td>${fmtNum(u.login_count)}</td><td>${fmtDate(u.created_at)}</td>
          <td>${u.blocked ? `<span class="lbl rejected">${L('차단됨', 'Blocked')}</span>${u.blocked_note ? `<div class="note-line" data-notr>${esc(u.blocked_note)}</div>` : ''}` : `<span class="lbl approved">${L('활성', 'Active')}</span>`}</td>
          <td class="acts-cell">${u.blocked ? `<button class="btn btn-sm" data-ub="${esc(u.email)}" data-b="0">${L('차단 해제', 'Unblock')}</button>` : `<button class="btn btn-sm btn-danger" data-ub="${esc(u.email)}" data-b="1">${L('차단', 'Block')}</button>`}</td></tr>`).join('')}
        </tbody></table></div>` : `<div class="gridwrap"><div class="empty-state">${ico('user', 40)}<h3>${L('로그인한 사용자가 없습니다', 'No users yet')}</h3></div></div>`;
    };
    draw();
    $('#ufq').oninput = debounce((e) => { f.q = e.target.value; draw(); }, 200);
    el.onclick = async (e) => {
      const b = e.target.closest('[data-ub]'); if (!b) return;
      const block = b.dataset.b === '1'; let note = '';
      if (block) { note = await promptBox(L('사용자 차단', 'Block user'), L(`${b.dataset.ub} 차단 사유 (선택)`, `Reason for blocking ${b.dataset.ub} (optional)`), { okLabel: L('차단', 'Block') }); if (note === null) return; }
      runTask(block ? L('사용자 차단', 'Block user') : L('차단 해제', 'Unblock user'), b.dataset.ub, () => api(`/api/admin/users/${encodeURIComponent(b.dataset.ub)}`, { method: 'POST', body: { blocked: block, note } }))
        .then(() => tabUsers(el)).catch(() => {});
    };
  }
  async function tabApprovers(el) {
    el.innerHTML = '<div class="skel" style="height:220px"></div>';
    let list; try { list = (await api('/api/admin/approvers')).approvers; } catch (e) { el.innerHTML = `<div class="alert danger">${esc(e.message)}</div>`; return; }
    const owner = role() === 'owner';
    const ca = (state.cfg && state.cfg.auth) || {};
    const methods = [ca.google ? 'Google 로그인' : null, ca.email ? '이메일 인증 코드' : null].filter(Boolean).join(' 또는 ');
    const me = getSess().user.email;
    el.innerHTML = `<div class="alert ${methods ? 'info' : 'warn'}">${ico('users')}<div>등록된 이메일만 <b>${methods || '(인증 수단 미설정 — 설정 탭 확인)'}</b>으로 로그인할 수 있습니다. <b>승인자</b>는 앱 승인·반려를, <b>관리자</b>는 승인자 관리·로그·설정·패치까지 할 수 있습니다.${owner ? '' : ' 관리자 역할은 최고 관리자만 부여할 수 있습니다.'} 비활성화·삭제하면 기존 로그인 세션도 즉시 끊깁니다.</div></div>
      <div class="portlet" style="margin-bottom:16px"><div class="portlet-hd">${ico('plus')} 승인자 등록</div><div class="portlet-bd">
        <form id="apForm" class="filters" style="margin:0"><input class="input" type="email" id="apEmail" placeholder="email@company.com" required style="min-width:240px"><input class="input" id="apName" placeholder="이름 (선택)">
        <select class="select" id="apRole"><option value="approver">승인자</option>${owner ? '<option value="admin">관리자</option>' : ''}</select>
        <label class="check" style="font-size:13px"><input type="checkbox" id="apInvite" ${ca.email ? 'checked' : 'disabled'}> 안내 메일 발송</label>
        <button class="btn btn-primary btn-sm" type="submit">${ico('plus', 12)} 등록</button></form></div></div>
      <div class="gridwrap"><table class="grid"><thead><tr><th>이메일</th><th>이름</th><th>역할</th><th>상태</th><th>최근 로그인</th><th>로그인 수</th><th>등록</th><th>작업</th></tr></thead><tbody>
      ${list.length ? list.map((x) => {
        const self = x.email === me; const can = !self && (owner || x.role !== 'admin');
        return `<tr><td><b>${esc(x.email)}</b>${self ? ' <span class="lbl">나</span>' : ''}</td><td>${esc(x.name || '-')}</td><td><span class="role ${x.role}">${ROLE_LABEL[x.role]}</span></td>
          <td>${x.active ? '<span class="lbl approved">활성</span>' : '<span class="lbl gone">비활성</span>'}</td>
          <td>${x.last_login ? `${fmtFull(x.last_login)}<div style="font-size:12px;color:var(--muted)">${({ google: 'Google', email: '이메일 코드' })[x.last_method] || ''}</div>` : '<span style="color:var(--muted)">없음</span>'}</td>
          <td>${fmtNum(x.login_count)}</td><td style="font-size:12.5px">${fmtDate(x.created_at)}<div style="color:var(--muted)">${esc(x.created_by || '')}</div></td>
          <td><div class="acts">${can ? `<button class="btn btn-sm" data-act="toggle" data-e="${esc(x.email)}">${x.active ? '비활성화' : '활성화'}</button>${owner ? `<button class="btn btn-sm" data-act="role" data-e="${esc(x.email)}">${x.role === 'admin' ? '승인자로' : '관리자로'}</button>` : ''}<button class="btn btn-sm" data-act="rename" data-e="${esc(x.email)}" title="이름 변경">${ico('edit', 11)}</button><button class="btn btn-sm btn-danger" data-act="del" data-e="${esc(x.email)}" title="삭제">${ico('trash', 11)}</button>` : ''}</div></td></tr>`;
      }).join('') : '<tr><td colspan="8" class="empty">등록된 승인자가 없습니다. 위에서 이메일을 등록하세요.</td></tr>'}</tbody></table></div>`;
    $('#apForm').onsubmit = async (e) => {
      e.preventDefault();
      const email = $('#apEmail').value.trim();
      await runTask('승인자 등록', email, () => api('/api/admin/approvers', { method: 'POST', body: { email, name: $('#apName').value.trim(), role: $('#apRole').value, invite: $('#apInvite').checked } }))
        .then(() => { toast(`${email} 을(를) 등록했습니다.`, 'success'); tabApprovers(el); }).catch(() => {});
    };
    el.onclick = async (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const x = list.find((y) => y.email === b.dataset.e);
      const path = `/api/admin/approvers/${encodeURIComponent(x.email)}`;
      let body = null; let label = '';
      if (b.dataset.act === 'toggle') { body = { active: !x.active }; label = x.active ? '승인자 비활성화' : '승인자 활성화'; }
      if (b.dataset.act === 'role') { body = { role: x.role === 'admin' ? 'approver' : 'admin' }; label = '승인자 역할 변경'; }
      if (b.dataset.act === 'rename') { const n = await promptBox('이름 변경', esc(x.email), { value: x.name || '' }); if (n === null) return; body = { name: n }; label = '승인자 이름 변경'; }
      if (b.dataset.act === 'del') {
        if (!(await confirmBox('승인자 삭제', `<b>${esc(x.email)}</b> 을(를) 삭제합니다. 현재 로그인 세션도 즉시 무효화됩니다.`, '삭제', true))) return;
        return runTask('승인자 삭제', x.email, () => api(path, { method: 'DELETE' })).then(() => tabApprovers(el)).catch(() => {});
      }
      if (body) runTask(label, x.email, () => api(path, { method: 'PUT', body })).then(() => tabApprovers(el)).catch(() => {});
    };
  }


  async function tabModeration(el) {
    const f = state.modF || (state.modF = { all: false });
    el.innerHTML = `<div class="portlet" style="margin-bottom:16px"><div class="portlet-hd">${ico('flag')} ${L('앱 신고', 'App reports')}<span class="acts"><label class="radio" style="font-size:12.5px"><input type="checkbox" id="mAll" ${f.all ? 'checked' : ''}> ${L('처리된 신고 포함', 'Include handled')}</label></span></div><div class="portlet-bd flush" id="mRep"><div class="skel" style="height:120px;margin:12px"></div></div></div>
      <div class="portlet"><div class="portlet-hd">${ico('chat')} ${L('공개 리뷰', 'Public reviews')}</div><div class="portlet-bd flush" id="mCom"><div class="skel" style="height:120px;margin:12px"></div></div></div>`;
    $('#mAll').onchange = (e) => { f.all = e.target.checked; tabModeration(el); };
    const RS = { open: L('미처리', 'Open'), resolved: L('조치 완료', 'Resolved'), dismissed: L('기각', 'Dismissed') };
    try {
      const { reports } = await api('/api/admin/reports' + (f.all ? '?status=all' : ''));
      const x = $('#mRep'); if (!x) return;
      x.innerHTML = reports.length ? `<div class="gridwrap" style="box-shadow:none"><table class="grid"><thead><tr><th>${L('일시', 'Time')}</th><th>${L('앱', 'App')}</th><th>${L('사유', 'Reason')}</th><th>${L('상세', 'Details')}</th><th>${L('상태', 'Status')}</th><th></th></tr></thead><tbody>
        ${reports.map((r) => `<tr><td>${fmtTime(r.ts)}</td><td>${r.app_name ? `<a href="#/app/${esc(r.app_id)}" data-notr>${esc(r.app_name)}</a>` : `<span class="t2">${L('삭제된 앱', 'Deleted app')}</span>`}</td><td>${reasonLabel(r.reason)}</td>
          <td class="wrap" data-notr>${esc(r.detail || '-')}</td><td><span class="lbl ${r.status === 'open' ? 'pending' : r.status === 'resolved' ? 'approved' : ''}">${RS[r.status] || r.status}</span>${r.handled_by ? `<div class="t2" style="font-size:11.5px">${esc(r.handled_by)}</div>` : ''}</td>
          <td class="acts-cell">${r.status === 'open' ? `${r.app_name ? `<button class="btn btn-sm" data-rv="${esc(r.app_id)}">${L('앱 검토', 'Review app')}</button>` : ''}<button class="btn btn-sm btn-primary" data-rs="${r.id}" data-st="resolved">${L('조치 완료', 'Resolve')}</button><button class="btn btn-sm" data-rs="${r.id}" data-st="dismissed">${L('기각', 'Dismiss')}</button>` : `<button class="btn btn-sm" data-rs="${r.id}" data-st="open">${L('다시 열기', 'Reopen')}</button>`}</td></tr>`).join('')}</tbody></table></div>`
        : `<div class="empty-state" style="padding:30px">${ico('check', 30)}<br>${L('미처리 신고가 없습니다.', 'No open reports.')}</div>`;
      x.onclick = async (e) => {
        const rv = e.target.closest('[data-rv]'); if (rv) { const a = state.admin.apps.find((q) => q.id === rv.dataset.rv); if (a) reviewModal(a); return; }
        const b = e.target.closest('[data-rs]'); if (!b) return;
        let note = '';
        if (b.dataset.st !== 'open') { note = await promptBox(L('신고 처리', 'Handle report'), L('처리 메모 (선택)', 'Handling note (optional)'), { placeholder: '' }); if (note === null) return; }
        runTask(L('신고 처리', 'Handle report'), '#' + b.dataset.rs, () => api(`/api/admin/reports/${b.dataset.rs}`, { method: 'POST', body: { status: b.dataset.st, note: note || '' } }))
          .then(() => { toast(L('처리했습니다.', 'Done.'), 'success'); loadAdmin(); }).catch(() => {});
      };
    } catch (e) { if ($('#mRep')) $('#mRep').innerHTML = `<div class="alert danger">${esc(e.message)}</div>`; }
    try {
      const { comments } = await api('/api/admin/comments');
      const x = $('#mCom'); if (!x) return;
      x.innerHTML = comments.length ? `<div class="gridwrap" style="box-shadow:none"><table class="grid"><thead><tr><th>${L('일시', 'Time')}</th><th>${L('앱', 'App')}</th><th>${L('평점', 'Rating')}</th><th>${L('작성자', 'Author')}</th><th>${L('내용', 'Content')}</th><th></th></tr></thead><tbody>
        ${comments.map((c) => `<tr class="${c.hidden ? 'muted-row' : ''}"><td>${fmtTime(c.ts)}</td><td><a href="#/app/${esc(c.app_id)}" data-notr>${esc(c.app_name || c.app_id)}</a></td><td>${starRow(c.stars)}</td><td data-notr>${esc(c.nickname || L('익명', 'Anonymous'))}</td>
          <td class="wrap" data-notr>${esc(c.body)}</td><td class="acts-cell"><button class="btn btn-sm" data-ch="${c.id}" data-h="${c.hidden ? 0 : 1}">${c.hidden ? L('숨김 해제', 'Unhide') : L('숨기기', 'Hide')}</button>${isAdmin() ? `<button class="btn btn-sm btn-danger" data-cd="${c.id}">${ico('trash', 12)}</button>` : ''}</td></tr>`).join('')}</tbody></table></div>`
        : `<div class="empty-state" style="padding:30px">${ico('chat', 30)}<br>${L('공개 리뷰가 없습니다.', 'No public reviews.')}</div>`;
      x.onclick = async (e) => {
        const h = e.target.closest('[data-ch]');
        if (h) return runTask(L('리뷰 관리', 'Moderate review'), '#' + h.dataset.ch, () => api(`/api/admin/comments/${h.dataset.ch}`, { method: 'POST', body: { hidden: h.dataset.h === '1' } })).then(() => tabModeration(el)).catch(() => {});
        const dl = e.target.closest('[data-cd]'); if (!dl) return;
        if (!(await confirmBox(L('리뷰 삭제', 'Delete review'), L('이 리뷰를 영구 삭제합니다. 별점은 유지됩니다.', 'Permanently delete this review. The star rating stays.'), L('삭제', 'Delete'), true))) return;
        runTask(L('리뷰 삭제', 'Delete review'), '#' + dl.dataset.cd, () => api(`/api/admin/comments/${dl.dataset.cd}`, { method: 'DELETE' })).then(() => tabModeration(el)).catch(() => {});
      };
    } catch (e) { if ($('#mCom')) $('#mCom').innerHTML = `<div class="alert danger">${esc(e.message)}</div>`; }
  }
  const ACTION_LABEL = {
    'app.create': '앱 등록', 'app.update': '앱 수정', 'app.delete': '앱 삭제', 'app.review': '승인 처리', 'app.run': '앱 실행', 'app.preview': '승인 전 미리보기',
    'app.rate': '평점', 'app.feedback': '피드백', 'app.feature': '추천 지정', 'app.unfeature': '추천 해제',
    'auth.login': '로그인', 'auth.logout': '로그아웃', 'auth.otp_request': '인증 코드 요청',
    'approver.create': '승인자 등록', 'approver.update': '승인자 변경', 'approver.delete': '승인자 삭제', 'settings.update': '설정 변경',
    'repo.patch': '패치 커밋', 'repo.rollback': '롤백', 'repo.redeploy': '재배포', 'backup.export': '백업', 'backup.restore': '복원',
    'stats.reset': '통계 초기화', 'visits.clear': '방문 로그 삭제', 'feedback.delete': '피드백 삭제',
    'app.comment': L('리뷰 작성', 'Review posted'), 'app.comment_edit': L('리뷰 수정', 'Review edited'), 'app.comment_delete': L('리뷰 삭제', 'Review deleted'), 'app.report': L('앱 신고', 'App reported'), 'app.restore': L('버전 복원', 'Version restored'),
    'report.handle': L('신고 처리', 'Report handled'), 'comment.hide': L('리뷰 숨김', 'Review hidden'), 'comment.unhide': L('리뷰 숨김 해제', 'Review unhidden'), 'comment.delete': L('리뷰 영구 삭제', 'Review purged'), 'webhook.send': L('웹훅 전송', 'Webhook sent'),
    'app.reply': L('리뷰 답글', 'Review reply'), 'app.reply_delete': L('리뷰 답글 삭제', 'Review reply deleted'), 'link.check': L('링크 점검', 'Link check'),
    'app.claim': L('앱 계정 연결', 'App linked to account'), 'app.owner_change': L('소유자 변경', 'Owner changed'), 'user.block': L('사용자 차단', 'User blocked'), 'user.unblock': L('사용자 차단 해제', 'User unblocked'),
    'mail.test': '테스트 메일', 'mail.invite': '초대 메일', 'mail.author_notice': '작성자 결과 메일', 'mail.approver_notice': '승인 요청 메일',
  };
  async function tabAudit(el) {
    const f = state.auditF || (state.auditF = { action: '', actor: '', q: '', ok: '', period: '7' });
    el.innerHTML = `<div class="filters"><select class="select" id="fa"><option value="">전체 작업</option></select><input class="input" id="factor" placeholder="사용자(이메일)" value="${esc(f.actor)}"><input class="input" id="fq" placeholder="대상·상세 검색" value="${esc(f.q)}">
      <select class="select" id="fok"><option value="">전체 결과</option><option value="1">성공</option><option value="0">실패</option></select>
      <select class="select" id="fp"><option value="1">최근 24시간</option><option value="7">최근 7일</option><option value="30">최근 30일</option><option value="all">전체</option></select>
      <button class="btn btn-sm btn-primary" id="fgo">${ico('refresh', 12)} 조회</button><span style="flex:1"></span><button class="btn btn-sm" id="fcsv">${ico('down', 12)} CSV 내보내기</button></div>
      <div id="auditBody"><div class="skel" style="height:240px"></div></div>`;
    $('#fok').value = f.ok; $('#fp').value = f.period;
    let rows = [];
    const qs = (before) => {
      const p = new URLSearchParams({ limit: '300' });
      if (f.action) p.set('action', f.action); if (f.actor) p.set('actor', f.actor); if (f.q) p.set('q', f.q); if (f.ok) p.set('ok', f.ok);
      if (f.period !== 'all') p.set('from', String(Date.now() - Number(f.period) * 86400000));
      if (before) p.set('before', before);
      return p.toString();
    };
    const draw = (hasMore) => {
      const b = $('#auditBody'); if (!b) return;
      b.innerHTML = `<div class="gridwrap"><table class="grid compact"><thead><tr><th>시간</th><th>사용자</th><th>역할</th><th>작업</th><th>대상</th><th>결과</th><th>IP / 국가</th><th></th></tr></thead><tbody>
        ${rows.length ? rows.map((l, i) => `<tr class="clickrow" data-i="${i}"><td>${fmtFull(l.ts)}</td><td>${esc(l.actor)}</td><td>${esc(l.role || '')}</td><td>${esc(ACTION_LABEL[l.action] || l.action)} <span class="mono" style="color:var(--muted);font-size:11px">${esc(l.action)}</span></td>
          <td class="mono">${esc(l.target_type || '')}${l.target_id ? ':' + esc(l.target_id.slice(0, 24)) : ''}</td><td class="${l.ok ? 'res-ok' : 'res-fail'}">${l.ok ? '성공' : '실패'}</td><td class="mono">${esc(l.ip || '')} ${esc(l.country || '')}</td><td>${ico('eye', 13)}</td></tr>`).join('') : '<tr><td colspan="8" class="empty">기록이 없습니다.</td></tr>'}
        </tbody></table></div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:12.5px;color:var(--muted)"><span>${fmtNum(rows.length)}건 표시 · 행을 누르면 상세 · 보관 기간은 설정 탭에서 변경</span>${hasMore ? '<button class="btn btn-sm" id="fmore">더 보기</button>' : ''}</div>`;
      if ($('#fmore')) $('#fmore').onclick = () => load(true);
    };
    const load = async (more) => {
      try {
        const r = await api('/api/admin/audit?' + qs(more && rows.length ? rows[rows.length - 1].id : null));
        rows = more ? rows.concat(r.logs) : r.logs;
        const sel = $('#fa');
        if (sel && !more) { sel.innerHTML = '<option value="">전체 작업</option>' + r.actions.map((a) => `<option value="${esc(a.action)}">${esc(ACTION_LABEL[a.action] || a.action)} (${a.n})</option>`).join(''); sel.value = f.action; }
        draw(r.logs.length === 300);
      } catch (e) { if ($('#auditBody')) $('#auditBody').innerHTML = `<div class="alert danger">${esc(e.message)}</div>`; }
    };
    $('#fgo').onclick = () => { Object.assign(f, { action: $('#fa').value, actor: $('#factor').value.trim(), q: $('#fq').value.trim(), ok: $('#fok').value, period: $('#fp').value }); load(false); };
    ['#factor', '#fq'].forEach((s) => ($(s).onkeydown = (e) => { if (e.key === 'Enter') $('#fgo').click(); }));
    $('#fcsv').onclick = () => {
      if (!rows.length) return toast('내보낼 기록이 없습니다.', 'error');
      const h = ['time', 'actor', 'role', 'action', 'target_type', 'target_id', 'ok', 'ip', 'country', 'detail', 'ua'];
      const csv = '﻿' + [h.join(',')].concat(rows.map((l) => [new Date(l.ts).toISOString(), l.actor, l.role, l.action, l.target_type, l.target_id, l.ok, l.ip, l.country, l.detail, l.ua]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))).join('\n');
      download(`krvcf-audit-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv');
      task('감사 로그 CSV 내보내기', `${rows.length}건`).ok();
    };
    el.onclick = (e) => {
      const tr = e.target.closest('[data-i]'); if (!tr) return;
      const l = rows[Number(tr.dataset.i)];
      let det = l.detail; try { det = JSON.stringify(JSON.parse(l.detail), null, 2); } catch (_) { /* raw */ }
      modal({
        title: `${esc(ACTION_LABEL[l.action] || l.action)} · ${l.ok ? '성공' : '실패'}`,
        body: `<dl class="kv" style="margin-bottom:12px"><dt>시간</dt><dd>${fmtFull(l.ts)}</dd><dt>사용자</dt><dd>${esc(l.actor)} (${esc(l.role || '-')})</dd><dt>작업</dt><dd class="mono">${esc(l.action)}</dd><dt>대상</dt><dd class="mono">${esc(l.target_type || '-')} ${esc(l.target_id || '')}</dd><dt>IP</dt><dd>${esc(l.ip || '-')} ${esc(l.country || '')}</dd><dt>User-Agent</dt><dd style="font-size:12px">${esc(l.ua || '-')}</dd></dl><pre class="jsonbox">${esc(det || '(상세 없음)')}</pre>`,
      });
    };
    load(false);
  }

  async function tabVisits(el) {
    el.innerHTML = '<div class="skel" style="height:200px"></div>';
    let list; try { list = (await api('/api/admin/visits')).visits; } catch (e) { el.innerHTML = `<div class="alert danger">${esc(e.message)}</div>`; return; }
    el.innerHTML = `<div class="toolbar"><span class="count">최근 ${fmtNum(list.length)}건 (IP 마스킹 · 보관 기간은 설정 탭)</span><span class="grow"></span><button class="btn btn-sm btn-danger" id="vClear">${ico('trash', 12)} 방문 로그 비우기</button></div>
      <div class="gridwrap"><table class="grid compact"><thead><tr><th>시간</th><th>IP</th><th>국가</th><th>페이지</th><th>User-Agent</th></tr></thead><tbody>
      ${list.length ? list.map((l) => `<tr><td>${fmtFull(l.ts)}</td><td class="mono">${esc(l.ip)}</td><td>${esc(l.country || '-')}</td><td class="mono">${esc(l.path)}</td><td style="font-size:12px;color:var(--muted);white-space:normal;max-width:460px">${esc(l.ua)}</td></tr>`).join('') : '<tr><td colspan="5" class="empty">로그가 없습니다.</td></tr>'}
      </tbody></table></div>`;
    $('#vClear').onclick = async () => {
      if (!(await confirmBox('방문 로그 비우기', '방문 로그를 모두 삭제합니다. (감사 로그는 유지)', '삭제', true))) return;
      runTask('방문 로그 삭제', 'App Center', () => api('/api/admin/visits', { method: 'DELETE' })).then(() => tabVisits(el)).catch(() => {});
    };
  }

  async function tabSettings(el) {
    el.innerHTML = '<div class="skel" style="height:300px"></div>';
    let r; try { r = await api('/api/admin/settings'); } catch (e) { el.innerHTML = `<div class="alert danger">${esc(e.message)}</div>`; return; }
    const s = r.settings; const v = r.env;
    const sw = (k, t, dsc) => `<div class="setrow"><div class="t"><b>${t}</b><span>${dsc}</span></div><label class="switch"><input type="checkbox" data-sk="${k}" ${s[k] === 'true' ? 'checked' : ''}><i></i></label></div>`;
    const integ = [
      ['비밀번호 로그인', 'ADMIN_PASSWORD', v.password, '최고 관리자 비상 로그인'],
      ['세션 서명 키', 'SESSION_SECRET', v.sessionSecret, '없으면 ADMIN_PASSWORD로 서명 (비밀번호 변경 시 전체 세션 만료)'],
      ['Google 로그인', 'GOOGLE_CLIENT_ID', v.google, 'Google Cloud OAuth 웹 클라이언트 ID'],
      ['이메일 발송', 'RESEND_API_KEY', v.mail, `발신: ${v.mailFrom}`],
      ['GitHub 패치', 'PATCH_GITHUB_TOKEN', v.github, v.repo ? `${v.repo} @ ${v.branch}` : 'UI 패치·롤백·재배포에 필요'],
    ];
    el.innerHTML = `<div class="portlets">
      <div class="portlet"><div class="portlet-hd">${ico('check')} 승인 절차</div><div class="portlet-bd">
        ${sw('auto_approve', '자동 승인', '켜면 승인 절차 없이 즉시 공개됩니다. (기본: 끔 — 승인자 승인 필수)')}
        ${sw('notify_submit', '승인 요청 메일', '신규 등록·수정 시 활성 승인자 전원에게 메일 발송')}
        ${sw('notify_author', '작성자 결과 메일', '승인·반려 시 작성자 이메일로 결과와 사유 발송')}</div></div>
      <div class="portlet"><div class="portlet-hd">${ico('log')} 로그 보관 · 공지</div><div class="portlet-bd">
        <div class="field" style="grid-template-columns:150px 1fr"><label>감사 로그 보관(일)</label><input class="input" type="number" min="7" max="3650" id="sAudit" value="${esc(s.audit_days)}"></div>
        <div class="field" style="grid-template-columns:150px 1fr"><label>방문 로그 보관(일)</label><input class="input" type="number" min="1" max="365" id="sVisit" value="${esc(s.visit_days)}"></div>
        <div class="field" style="grid-template-columns:150px 1fr"><label>상단 공지</label><input class="input" maxlength="300" id="sNotice" value="${esc(s.notice)}" placeholder="비우면 표시하지 않음"></div>
        <div style="text-align:right"><button class="btn btn-primary btn-sm" id="setSave">저장</button></div></div></div></div>
      <div class="portlet" style="margin-bottom:16px"><div class="portlet-hd">${ico('bell')} ${L('웹훅 알림', 'Webhook notifications')}</div><div class="portlet-bd">
        <p class="t2" style="margin-top:0">${L('Google Chat · Slack · Discord 수신 웹훅 URL을 넣으면 자동으로 형식을 맞춰 보냅니다. 그 외 URL에는 JSON으로 POST합니다.', 'Paste a Google Chat, Slack or Discord incoming-webhook URL and the message format is chosen automatically. Any other URL receives a JSON POST.')}</p>
        <div class="field" style="grid-template-columns:150px 1fr"><label>Webhook URL</label><input class="input mono" id="sHook" maxlength="500" value="${esc(s.webhook_url || '')}" placeholder="https://chat.googleapis.com/v1/spaces/…"></div>
        <div class="field" style="grid-template-columns:150px 1fr"><label>${L('이벤트', 'Events')}</label><div class="checks">${[['submit', L('신규 등록·재승인 요청', 'New submission / resubmission')], ['decision', L('승인·반려 결정', 'Approval decision')], ['report', L('앱 신고', 'App report')], ['comment', L('새 리뷰', 'New review')]].map(([k, t]) => `<label class="radio"><input type="checkbox" data-hev="${k}" ${(s.webhook_events || '').split(',').includes(k) ? 'checked' : ''}> ${t}</label>`).join('')}</div></div>
        <div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn btn-sm" id="hookTest">${ico('send', 12)} ${L('테스트 전송', 'Send test')}</button><button class="btn btn-primary btn-sm" id="hookSave">${L('저장', 'Save')}</button></div></div></div>
      ${isAdmin() ? `<div class="portlet" style="margin-bottom:16px" id="aiBox"><div class="portlet-hd">${ico('star')} ${L('AI 모델 — GitHub 설명 자동 작성', 'AI model — GitHub description drafting')}</div><div class="portlet-bd"><div class="skel" style="height:120px"></div></div></div>` : ''}
      <div class="portlet"><div class="portlet-hd">${ico('wrench')} 연동 상태<span class="acts" style="font-size:12.5px;color:var(--muted)">API 버전 <span class="mono">${esc(String(v.version).slice(0, 7))}</span></span></div><div class="portlet-bd flush">
        <table class="grid"><tbody>${integ.map(([n, k, ok, dsc]) => `<tr><td><span class="${ok ? 'ok-dot' : 'no-dot'}"></span><b>${n}</b> <span class="mono" style="color:var(--muted);font-size:11.5px">${k}</span></td><td>${ok ? '<span class="res-ok">설정됨</span>' : '<span style="color:var(--muted)">미설정</span>'}</td><td style="color:var(--muted);font-size:12.5px;white-space:normal">${esc(dsc)}</td></tr>`).join('')}</tbody></table>
        <div style="padding:12px 16px;display:flex;gap:8px;align-items:center;border-top:1px solid var(--border-2)"><span style="font-size:12.5px;color:var(--muted);flex:1">시크릿은 GitHub 저장소 Secrets에 등록하면 다음 API 배포(패치 탭 → API 재배포)에 자동 반영됩니다.</span>${v.mail ? `<button class="btn btn-sm" id="testMail">${ico('mail', 12)} 테스트 메일</button>` : ''}</div></div></div>`;
    if ($('#aiBox')) aiSettings($('#aiBox'));
    const save = (patch) => runTask('설정 변경', Object.keys(patch).join(', '), () => api('/api/admin/settings', { method: 'PUT', body: patch }))
      .then(async () => { toast('설정을 저장했습니다.', 'success'); await loadConfig(); }).catch(() => tabSettings(el));
    $('#hookSave').onclick = () => save({ webhook_url: $('#sHook').value.trim(), webhook_events: $$('[data-hev]', el).filter((x) => x.checked).map((x) => x.dataset.hev).join(',') });
    $('#hookTest').onclick = () => runTask(L('웹훅 테스트', 'Webhook test'), $('#sHook').value.trim() || '-', () => api('/api/admin/test-webhook', { method: 'POST', body: {} }))
      .then(() => toast(L('테스트 메시지를 보냈습니다. (저장된 URL 기준)', 'Test message sent (using the saved URL).'), 'success')).catch(() => {});
    el.onchange = (e) => { const t = e.target; if (t.dataset.sk) save({ [t.dataset.sk]: t.checked ? 'true' : 'false' }); };
    $('#setSave').onclick = () => save({ audit_days: $('#sAudit').value, visit_days: $('#sVisit').value, notice: $('#sNotice').value });
    if ($('#testMail')) $('#testMail').onclick = async () => {
      let email = getSess().user.email;
      if (role() === 'owner') { email = await promptBox('테스트 메일', '수신 이메일 주소를 입력하세요.', { placeholder: 'name@company.com' }); if (!email) return; }
      runTask('테스트 메일 발송', email, () => api('/api/admin/test-mail', { method: 'POST', body: { email } })).then(() => toast('테스트 메일을 보냈습니다.', 'success')).catch(() => {});
    };
  }


  async function aiSettings(box) {
    const bd = $('.portlet-bd', box);
    let a; try { a = (await api('/api/admin/ai')).ai; } catch (e) { bd.innerHTML = `<div class="alert danger">${esc(e.message)}</div>`; return; }
    const P = a.providers;
    const row = (label, html, help) => `<div class="field" style="grid-template-columns:150px 1fr"><label>${label}</label><div>${html}${help ? `<div class="help">${help}</div>` : ''}</div></div>`;
    bd.innerHTML = `<p class="t2" style="margin-top:0">${L('앱 등록 화면의 <b>GitHub에서 불러오기</b>가 이 모델로 README를 읽고 이름·설명·태그·카테고리·데모 URL·접속 방법 초안을 씁니다. API 키는 암호화해 DB에 저장하며 화면·로그에 다시 표시하지 않습니다.', '<b>Import from GitHub</b> on the submit page uses this model to read the README and draft the name, description, tags, category, demo URL and access guide. The API key is stored encrypted and never shown or logged again.')}</p>
      ${row(L('사용', 'Enabled'), `<label class="switch"><input type="checkbox" id="aiOn" ${a.enabled ? 'checked' : ''}><i></i></label>`)}
      ${row(L('제공자', 'Provider'), `<select class="select" id="aiProv"><option value="">${L('선택하세요', 'Choose')}</option>${Object.entries(P).map(([k, v]) => `<option value="${k}" ${a.provider === k ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select>`)}
      ${row(L('API 주소', 'API base URL'), `<input class="input mono" id="aiBase" maxlength="300" value="${esc(a.baseUrl || '')}">`, L('비우면 제공자 기본 주소를 씁니다. OpenAI 호환(vLLM·Azure 등)은 필수이며 Cloudflare에서 접근 가능한 https 주소여야 합니다.', 'Empty = provider default. Required for OpenAI-compatible (vLLM, Azure…); must be https and reachable from Cloudflare.'))}
      ${row(L('API 키', 'API key'), `<div class="inline-row"><input class="input mono" id="aiKey" type="password" autocomplete="new-password" placeholder="${a.keySet ? L(`설정됨 ${a.keyHint} — 바꿀 때만 입력`, `Set ${a.keyHint} — type only to replace`) : L('미설정', 'Not set')}">${a.keySet ? `<button type="button" class="btn btn-sm" id="aiClear">${L('키 삭제', 'Remove key')}</button>` : ''}</div>`)}
      ${row(L('모델', 'Model'), `<div class="inline-row"><input class="input mono" id="aiModel" list="aiModels" maxlength="120" value="${esc(a.model || '')}" placeholder="${L('모델 ID — [목록]으로 불러오기', 'Model ID — use [List]')}"><datalist id="aiModels"></datalist><button type="button" class="btn btn-sm" id="aiList">${L('목록', 'List')}</button></div>`, L('제공자의 모델 목록 API에서 실제 사용 가능한 ID를 불러옵니다. 빠르고 저렴한 모델이면 충분합니다.', 'Loads the IDs your key can actually use from the provider. A fast, inexpensive model is enough.'))}
      ${row(L('하루 한도', 'Daily limit'), `<input class="input" id="aiLimit" type="number" min="1" max="5000" value="${esc(a.dailyLimit)}" style="max-width:140px">`, L('전체 사용자 합계 AI 호출 수(일반 사용자는 별도로 1인당 하루 30회). 넘으면 README 기준으로만 채웁니다.', 'Total AI calls per day across users (each user is also limited to 30/day). Beyond it, only the README is used.'))}
      <div style="display:flex;gap:8px;justify-content:flex-end;align-items:center"><span class="t2" style="flex:1;font-size:12.5px">${a.updatedAt ? L(`최종 변경 ${fmtFull(a.updatedAt)} · ${esc(a.updatedBy || '')}`, `Last changed ${fmtFull(a.updatedAt)} · ${esc(a.updatedBy || '')}`) : ''}</span>
        <button class="btn btn-sm" id="aiTest">${ico('send', 12)} ${L('연결 테스트', 'Test')}</button><button class="btn btn-primary btn-sm" id="aiSave">${L('저장', 'Save')}</button></div>`;
    const form = () => ({ provider: $('#aiProv', bd).value, baseUrl: $('#aiBase', bd).value.trim(), model: $('#aiModel', bd).value.trim(), apiKey: $('#aiKey', bd).value.trim() });
    const syncBase = () => { const p = P[$('#aiProv', bd).value]; $('#aiBase', bd).placeholder = p && p.base ? p.base : 'https://…/v1'; };
    $('#aiProv', bd).onchange = syncBase; syncBase();
    $('#aiList', bd).onclick = () => runTask(L('모델 목록', 'Model list'), $('#aiProv', bd).value || '-', () => api('/api/admin/ai/models', { method: 'POST', body: form() }))
      .then((d) => { $('#aiModels', bd).innerHTML = d.models.map((m) => `<option value="${esc(m)}">`).join(''); toast(L(`모델 ${d.models.length}개를 불러왔습니다. 모델 칸을 눌러 고르세요.`, `${d.models.length} models loaded. Click the model field to pick one.`), 'success'); $('#aiModel', bd).focus(); }).catch(() => {});
    $('#aiTest', bd).onclick = () => runTask(L('AI 연결 테스트', 'AI test'), $('#aiModel', bd).value || '-', () => api('/api/admin/ai/test', { method: 'POST', body: form() }))
      .then((d) => toast(L(`성공 (${d.ms}ms): ${d.reply}`, `OK (${d.ms} ms): ${d.reply}`), 'success', 6000)).catch(() => {});
    $('#aiSave', bd).onclick = () => runTask(L('AI 설정 저장', 'Save AI settings'), $('#aiModel', bd).value || '-', () => api('/api/admin/ai', { method: 'PUT', body: { ...form(), enabled: $('#aiOn', bd).checked, dailyLimit: $('#aiLimit', bd).value } }))
      .then(async () => { toast(L('AI 설정을 저장했습니다.', 'AI settings saved.'), 'success'); await loadConfig(); aiSettings(box); }).catch(() => {});
    if ($('#aiClear', bd)) $('#aiClear', bd).onclick = async () => {
      if (!(await confirmBox(L('API 키 삭제', 'Remove API key'), L('저장된 API 키를 지우고 AI 작성을 끕니다.', 'Removes the stored API key and turns AI drafting off.'), L('삭제', 'Remove'), true))) return;
      runTask(L('API 키 삭제', 'Remove API key'), 'AI', () => api('/api/admin/ai', { method: 'PUT', body: { ...form(), apiKey: '', clearKey: true, enabled: false, dailyLimit: $('#aiLimit', bd).value } }))
        .then(async () => { await loadConfig(); aiSettings(box); }).catch(() => {});
    };
  }
  function tabBackup(el) {
    el.innerHTML = `<div class="portlets">
      <div class="portlet"><div class="portlet-hd">${ico('down')} 백업</div><div class="portlet-bd"><p style="margin-top:0;color:var(--text-2)">앱·HTML 소스·평점·피드백·승인자·승인 이력·설정을 하나의 JSON으로 내려받습니다. (감사 로그는 감사 로그 탭에서 CSV로 내보내기)</p><button class="btn btn-primary" id="bkDown">${ico('down', 14)} 백업 다운로드</button></div></div>
      <div class="portlet"><div class="portlet-hd">${ico('up')} 복원</div><div class="portlet-bd"><p style="margin-top:0;color:var(--text-2)">백업 JSON을 올리면 같은 ID는 덮어쓰고 없는 항목은 추가합니다.</p><label class="btn">${ico('up', 14)} 백업 파일 선택<input type="file" accept=".json,application/json" hidden id="restoreIn"></label></div></div>
      <div class="portlet"><div class="portlet-hd">${ico('refresh')} 통계 초기화</div><div class="portlet-bd"><p style="margin-top:0;color:var(--text-2)">모든 앱의 실행 수·평점과 누적 방문 수를 0으로 만듭니다.</p><button class="btn btn-danger" id="bkReset">통계 초기화</button></div></div></div>`;
    $('#bkDown').onclick = () => runTask('전체 백업', 'App Center', async () => {
      const b = await api('/api/admin/backup');
      download(`krvcf-app-center-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(b));
    }, '다운로드됨').catch(() => {});
    $('#bkReset').onclick = async () => {
      if (!(await confirmBox('통계 초기화', '실행 수·평점·누적 방문 수를 0으로 초기화합니다. 되돌릴 수 없습니다.', '초기화', true))) return;
      runTask('통계 초기화', 'App Center', () => api('/api/admin/reset-stats', { method: 'POST', body: {} })).then(loadAdmin).catch(() => {});
    };
    $('#restoreIn').onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      if (!(await confirmBox('데이터 복원', `<b>${esc(f.name)}</b> (${fmtSize(f.size)}) 파일로 복원합니다. 같은 ID는 덮어씁니다.`, '복원', true))) return;
      runTask('데이터 복원', f.name, async () => {
        const r = await api('/api/admin/restore', { method: 'POST', body: await f.text(), headers: { 'content-type': 'application/json' } });
        toast(`복원 완료: 앱 ${r.apps}개, HTML ${r.html}개`, 'success'); await loadApps(true); loadAdmin();
      }).catch(() => {});
    };
  }

  /* ───────── Analytics ───────── */
  const chartColors = () => (document.documentElement.dataset.theme === 'dark' ? { uv: '#3a9cc6', pv: '#cf7f2c' } : { uv: '#0072a3', pv: '#c76a0f' });
  const fmtShort = (n) => (n >= 10000 ? (n / 1000).toFixed(n >= 100000 ? 0 : 1) + 'k' : fmtNum(n));
  function niceMax(v) { v = Math.max(v, 4); const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 4 ? 4 : m <= 5 ? 5 : m <= 8 ? 8 : 10) * p; }
  // 5 or 4 ticks so that steps are 1·2·4·5×10ⁿ
  const ticksOf = (max) => (/^[1245]0*$/.test(String(max / 5)) ? [0, 0.2, 0.4, 0.6, 0.8, 1] : [0, 0.25, 0.5, 0.75, 1]);
  const regionName = (() => { let dn = null; try { dn = new Intl.DisplayNames([LOC], { type: 'region' }); } catch (_) { /* noop */ } return (c) => { if (!c || c === '??') return '알 수 없음'; try { return dn ? dn.of(c) : c; } catch (_) { return c; } }; })();
  const flag = (c) => (c && /^[A-Z]{2}$/.test(c) ? String.fromCodePoint(...[...c].map((ch) => 0x1f1a5 + ch.charCodeAt(0))) : '🌐');
  const DEVICE_LABEL = { desktop: '데스크톱', mobile: '모바일', tablet: '태블릿', unknown: '알 수 없음' };
  function pathLabel(p) {
    const parts = String(p || '').replace(/^#\/?/, '').split('/').filter(Boolean).map((x) => { try { return decodeURIComponent(x); } catch (_) { return x; } });
    if (!parts.length) return '홈';
    if (parts[0] === 'app') { const a = ((state.admin && state.admin.apps) || state.apps).find((x) => x.id === parts[1]); return '앱 · ' + (a ? a.name : parts[1]); }
    const m = { all: '전체 앱', catalog: '카탈로그', demo: '데모룸', favs: '즐겨찾기', submit: '앱 등록', mine: '내 워크스페이스', studio: L('내 앱 관리', 'My apps'), tag: L('태그', 'Tag'), author: L('작성자', 'Author') };
    return (m[parts[0]] || parts[0]) + (parts[1] ? ' · ' + (CAT[parts[1]] ? catLabel(parts[1]) : '수정') : '');
  }
  const delta = (cur, prev) => {
    if (!prev && !cur) return '';
    if (!prev) return '<span class="dl">어제 기록 없음</span>';
    const d = Math.round(((cur - prev) / prev) * 100);
    return d === 0 ? '<span class="dl">어제와 같음</span>' : `<span class="dl ${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'} ${Math.abs(d)}% vs 어제</span>`;
  };

  // Daily UV (area+line) · PV (line) — same unit (counts), so a single axis
  function lineChart(series, W = 900) {
    const H = 250, L = 46, R = 14, T = 14, B = 30;
    const n = series.length;
    const max = niceMax(Math.max(1, ...series.map((d) => Math.max(d.pv, d.uv))));
    const x = (i) => L + (n <= 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (n - 1));
    const y = (v) => T + (H - T - B) * (1 - v / max);
    const line = (k) => series.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[k]).toFixed(1)}`).join('');
    const c = chartColors();
    const step = Math.max(1, Math.ceil(n / Math.max(3, Math.floor(W / 95))));
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="일별 방문자와 페이지뷰 추이">
      ${ticksOf(max).map((f) => { const v = max * f; return `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="g-line"/><text x="${L - 8}" y="${y(v) + 4}" class="g-ax" text-anchor="end">${fmtShort(Math.round(v))}</text>`; }).join('')}
      ${series.map((d, i) => ((i % step === 0 && n - 1 - i >= step * 0.6) || i === n - 1 ? `<text x="${x(i)}" y="${H - 9}" class="g-ax" text-anchor="middle">${d.day.slice(5).replace('-', '/')}</text>` : '')).join('')}
      <path d="${line('uv')}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z" fill="${c.uv}" fill-opacity=".10"/>
      <path d="${line('pv')}" fill="none" stroke="${c.pv}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="${line('uv')}" fill="none" stroke="${c.uv}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <g class="g-hover" style="display:none"><line class="g-xh" y1="${T}" y2="${H - B}"/><circle r="4.5" class="g-dot" fill="${c.pv}" data-k="pv"/><circle r="4.5" class="g-dot" fill="${c.uv}" data-k="uv"/></g>
      <rect class="g-hit" x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}" fill="transparent"/>
    </svg>`;
    // bindLineChart uses the same coordinate formulas
  }
  function bindLineChart(box, series, W = 900) {
    const svg = $('svg', box); const tip = $('.g-tip', box); if (!svg) return;
    const H = 250, L = 46, R = 14, T = 14, B = 30; const n = series.length;
    const max = niceMax(Math.max(1, ...series.map((d) => Math.max(d.pv, d.uv))));
    const x = (i) => L + (n <= 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (n - 1));
    const y = (v) => T + (H - T - B) * (1 - v / max);
    const g = $('.g-hover', svg); const xh = $('.g-xh', svg);
    const show = (ev) => {
      const r = svg.getBoundingClientRect();
      const px = ((ev.clientX - r.left) / r.width) * W;
      const i = Math.max(0, Math.min(n - 1, Math.round(((px - L) / (W - L - R)) * (n - 1))));
      const d = series[i];
      g.style.display = ''; xh.setAttribute('x1', x(i)); xh.setAttribute('x2', x(i));
      $$('.g-dot', svg).forEach((cEl) => { cEl.setAttribute('cx', x(i)); cEl.setAttribute('cy', y(d[cEl.dataset.k])); });
      const c = chartColors();
      tip.innerHTML = `<b>${d.day} (${'일월화수목금토'[new Date(d.day + 'T00:00:00+09:00').getDay()]})</b><div><i style="background:${c.uv}"></i>방문자 <b>${fmtNum(d.uv)}</b> <span>신규 ${fmtNum(d.newUv)}</span></div><div><i style="background:${c.pv}"></i>페이지뷰 <b>${fmtNum(d.pv)}</b></div><div class="t2">앱 조회 ${fmtNum(d.appViews)} · 실행 ${fmtNum(d.runs)}</div>`;
      tip.hidden = false;
      const left = (x(i) / W) * r.width;
      tip.style.left = Math.min(Math.max(left, 90), r.width - 90) + 'px';
      tip.style.top = (Math.min(y(d.uv), y(d.pv)) / H) * r.height + 'px';
    };
    const hide = () => { g.style.display = 'none'; tip.hidden = true; };
    svg.addEventListener('mousemove', show); svg.addEventListener('mouseleave', hide);
    svg.addEventListener('touchstart', (e) => show(e.touches[0]), { passive: true });
  }
  function barChart(rows, W = 900) { // today's PV by hour
    const H = 200, L = 40, R = 10, T = 10, B = 26; const n = rows.length;
    const max = niceMax(Math.max(1, ...rows.map((r) => r.pv)));
    const bw = (W - L - R) / n; const nowH = new Date(Date.now() + 9 * 3600000).getUTCHours();
    const c = chartColors();
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="오늘 시간대별 페이지뷰">
      ${[0, 0.5, 1].map((f) => `<line x1="${L}" x2="${W - R}" y1="${T + (H - T - B) * (1 - f)}" y2="${T + (H - T - B) * (1 - f)}" class="g-line"/><text x="${L - 8}" y="${T + (H - T - B) * (1 - f) + 4}" class="g-ax" text-anchor="end">${fmtShort(Math.round(max * f))}</text>`).join('')}
      ${rows.map((r, i) => {
        const h = ((H - T - B) * r.pv) / max; const bx = L + i * bw + 2; const w = Math.max(bw - 4, 2); const by = H - B - h;
        return `${h > 0 ? `<path d="M${bx},${H - B}V${by + Math.min(4, h)}Q${bx},${by} ${bx + Math.min(4, w / 2)},${by}H${bx + w - Math.min(4, w / 2)}Q${bx + w},${by} ${bx + w},${by + Math.min(4, h)}V${H - B}Z" fill="${c.uv}" fill-opacity="${i === nowH ? 1 : 0.55}"/>` : ''}
          ${i % (W < 600 ? 6 : 3) === 0 ? `<text x="${bx + w / 2}" y="${H - 8}" class="g-ax" text-anchor="middle">${i}시</text>` : ''}
          <rect x="${L + i * bw}" y="${T}" width="${bw}" height="${H - T - B}" fill="transparent" data-h="${i}"/>`;
      }).join('')}
    </svg>`;
  }
  function bindBarChart(box, rows) {
    const svg = $('svg', box); const tip = $('.g-tip', box); if (!svg) return;
    svg.addEventListener('mousemove', (e) => {
      const t = e.target.closest('[data-h]'); if (!t) { tip.hidden = true; return; }
      const r = rows[Number(t.dataset.h)]; const rc = svg.getBoundingClientRect(); const tb = t.getBoundingClientRect();
      tip.innerHTML = `<b>${r.h}:00 ~ ${r.h}:59</b><div>페이지뷰 <b>${fmtNum(r.pv)}</b> · 방문자 <b>${fmtNum(r.uv)}</b></div>`;
      tip.hidden = false; tip.style.left = Math.min(Math.max(tb.left - rc.left + tb.width / 2, 80), rc.width - 80) + 'px'; tip.style.top = '20px';
    });
    svg.addEventListener('mouseleave', () => (tip.hidden = true));
  }
  function rankList(rows, label, val, sub) {
    if (!rows.length) return '<div class="empty-state" style="padding:24px">데이터가 없습니다.</div>';
    const max = Math.max(1, ...rows.map(val));
    return `<ul class="rank">${rows.map((r) => `<li><div class="rk-t"><span class="rk-l">${label(r)}</span><span class="rk-v">${fmtNum(val(r))}${sub ? `<small>${sub(r)}</small>` : ''}</span></div><div class="rk-bar"><i style="width:${(val(r) / max) * 100}%"></i></div></li>`).join('')}</ul>`;
  }

  let anTimer = null;
  async function tabAnalytics(el) {
    clearInterval(anTimer);
    const days = state.anDays || 30;
    if (!$('#anRoot')) el.innerHTML = '<div id="anRoot"><div class="skel" style="height:360px"></div></div>';
    let d;
    try { d = await api('/api/admin/analytics?days=' + days); } catch (e) { el.innerHTML = `<div class="alert danger">${esc(e.message)}</div>`; return; }
    if (state.adminTab !== 'analytics' || !$('#anRoot')) return;
    const k = d.kpi; const c = chartColors();
    const t = k.today; const yd = k.yesterday;
    const ret = Math.max(0, t.uv - t.newUv);
    $('#anRoot').innerHTML = `
      <div class="toolbar"><div class="btn-group">${[7, 30, 90, 365].map((n) => `<button class="btn btn-sm ${days === n ? 'on' : ''}" data-days="${n}">${n === 365 ? '1년' : n + '일'}</button>`).join('')}</div>
        <span class="grow"></span><span class="count">${ico('pulse', 13)} 30초마다 자동 갱신 · ${new Date().toLocaleTimeString(LOC)}</span><button class="icon-btn" id="anReload" title="새로고침">${ico('refresh')}</button></div>
      <div class="stats">
        ${statCard('pulse', '현재 접속', k.online, '최근 3분 내 활동', 'live')}
        ${statCard('users', '오늘 방문자', t.uv, `${delta(t.uv, yd.uv)} · 신규 ${fmtNum(t.newUv)} / 재방문 ${fmtNum(ret)}`)}
        ${statCard('eye', '오늘 페이지뷰', t.pv, delta(t.pv, yd.pv))}
        ${statCard('users', '최근 7일 방문자', k.visitors7, `30일 ${fmtNum(k.visitors30)}명`)}
        ${statCard('globe', '누적 방문자', k.totalVisitors, `누적 페이지뷰 ${fmtNum(k.totalPv)}`)}
      </div>
      <div class="portlet" style="margin-bottom:16px"><div class="portlet-hd">${ico('chart')} 일별 추이 · 최근 ${days}일
        <span class="acts legend"><span><i style="background:${c.uv}"></i>방문자(UV) <b>${fmtNum(k.periodUvSum)}</b></span><span><i style="background:${c.pv}"></i>페이지뷰(PV) <b>${fmtNum(k.periodPv)}</b></span><span class="t2">신규 ${fmtNum(k.periodNew)} · 앱 조회 ${fmtNum(k.periodAppViews)} · 실행 ${fmtNum(k.periodRuns)}</span></span></div>
        <div class="portlet-bd"><div class="chart" id="anLine"><div class="g-tip" hidden></div></div>
        <details class="tblview"><summary>표로 보기</summary><div class="gridwrap" style="max-height:260px;box-shadow:none;margin-top:8px"><table class="grid compact"><thead><tr><th>날짜</th><th>방문자</th><th>신규</th><th>페이지뷰</th><th>앱 조회</th><th>실행</th></tr></thead><tbody>${[...d.series].reverse().map((s) => `<tr><td>${s.day}</td><td>${fmtNum(s.uv)}</td><td>${fmtNum(s.newUv)}</td><td>${fmtNum(s.pv)}</td><td>${fmtNum(s.appViews)}</td><td>${fmtNum(s.runs)}</td></tr>`).join('')}</tbody></table></div></details></div></div>
      <div class="row2">
        <div class="portlet"><div class="portlet-hd">${ico('clock')} 오늘 시간대별 페이지뷰<span class="acts t2">KST · 진한 막대 = 현재 시각</span></div><div class="portlet-bd"><div class="chart" id="anBar"><div class="g-tip" hidden></div></div></div></div>
        <div class="portlet"><div class="portlet-hd">${ico('pulse')} 실시간 접속 <span class="lbl approved" style="margin-left:4px">${fmtNum(k.online)}명</span></div><div class="portlet-bd flush" style="max-height:236px;overflow:auto">
          ${d.online.length ? `<table class="grid compact"><tbody>${d.online.map((o) => `<tr><td>${flag(o.country)} ${esc(regionName(o.country))}</td><td>${esc(DEVICE_LABEL[o.device] || o.device || '-')}</td><td style="white-space:normal">${esc(pathLabel(o.path))}</td><td>${o.first_ts && Date.now() - o.first_ts < 86400000 ? '<span class="lbl link">신규</span>' : '<span class="lbl">재방문</span>'}</td><td class="t2">${Math.max(0, Math.round((Date.now() - o.ts) / 1000))}초 전</td></tr>`).join('')}</tbody></table>` : '<div class="empty-state" style="padding:24px">현재 접속 중인 방문자가 없습니다.</div>'}</div></div>
      </div>
      <div class="row2">
        <div class="portlet"><div class="portlet-hd">${ico('list')} 인기 페이지</div><div class="portlet-bd">${rankList(d.pages, (r) => esc(pathLabel(r.path)), (r) => r.pv, (r) => ` · 방문자 ${fmtNum(r.uv)}`)}</div></div>
        <div class="portlet"><div class="portlet-hd">${ico('grid')} 인기 앱 (조회 + 실행)</div><div class="portlet-bd">${rankList(d.apps, (r) => `<a href="#/app/${esc(r.id)}">${esc(r.name || r.id)}</a>`, (r) => (r.views || 0) + (r.runs || 0), (r) => ` · 조회 ${fmtNum(r.views)} / 실행 ${fmtNum(r.runs)}`)}</div></div>
      </div>
      <div class="portlets">
        <div class="portlet"><div class="portlet-hd">${ico('link')} 유입 경로<span class="acts t2">세션 ${fmtNum(k.sessions)}</span></div><div class="portlet-bd">${rankList(d.referrers, (r) => esc(r.k), (r) => r.n)}</div></div>
        <div class="portlet"><div class="portlet-hd">${ico('globe')} 국가</div><div class="portlet-bd">${rankList(d.countries, (r) => `${flag(r.k)} ${esc(regionName(r.k))}`, (r) => r.n)}</div></div>
        <div class="portlet"><div class="portlet-hd">${ico('monitor')} 기기 · 브라우저</div><div class="portlet-bd">${rankList(d.devices, (r) => esc(DEVICE_LABEL[r.k] || r.k), (r) => r.n)}<div style="height:12px"></div>${rankList(d.browsers, (r) => esc(r.k), (r) => r.n)}</div></div>
      </div>
      <p class="t2" style="font-size:12px;margin:4px 0 0">일별 추이·누적 수치는 영구 집계입니다. 페이지·유입·국가·기기 분석은 원본 방문 로그 보관 기간(${d.rawRetentionDays}일, 설정 탭) 안에서 계산됩니다. 방문자는 브라우저별 익명 ID로 구분하며 봇·크롤러와 관리 콘솔 화면은 집계에서 제외합니다.</p>`;
    // render at the container's real width → 1:1 text size
    const wl = Math.max(300, Math.round($('#anLine').clientWidth));
    $('#anLine').insertAdjacentHTML('afterbegin', lineChart(d.series, wl));
    bindLineChart($('#anLine'), d.series, wl);
    const wb = Math.max(300, Math.round($('#anBar').clientWidth));
    $('#anBar').insertAdjacentHTML('afterbegin', barChart(d.hourly, wb));
    bindBarChart($('#anBar'), d.hourly);
    $$('[data-days]').forEach((b) => (b.onclick = () => { state.anDays = Number(b.dataset.days); tabAnalytics(el); }));
    $('#anReload').onclick = () => tabAnalytics(el);
    anTimer = setInterval(() => { if (state.adminTab === 'analytics' && $('#anRoot') && document.visibilityState === 'visible' && !$('#anLine .g-tip:not([hidden])')) tabAnalytics(el); else if (!$('#anRoot')) clearInterval(anTimer); }, 30000);
  }

  /* ───────── Patch / deploy (GitHub commit → Actions) ───────── */
  const IGNORE = /(^|\/)(node_modules|\.git|\.wrangler|__MACOSX)(\/|$)|(^|\/)(\.dev\.vars|\.DS_Store|Thumbs\.db)$/;
  async function gitSha(bytes) {
    const head = new TextEncoder().encode(`blob ${bytes.length}\0`);
    const all = new Uint8Array(head.length + bytes.length); all.set(head); all.set(bytes, head.length);
    const h = await crypto.subtle.digest('SHA-1', all);
    return [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, '0')).join('');
  }
  function toB64(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }
  function asText(bytes) { if (bytes.includes(0)) return null; try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch (_) { return null; } }
  let fflateP = null;
  const fflate = () => fflateP || (fflateP = import('https://cdn.jsdelivr.net/npm/fflate@0.8.2/esm/browser.js').catch((e) => { fflateP = null; throw new Error('zip 해제 모듈을 불러오지 못했습니다.'); }));
  const short = (x) => (x ? String(x).slice(0, 7) : '-');
  function runBadge(r) {
    const k = r.status === 'completed' ? r.conclusion || 'completed' : r.status;
    const lbl = { success: '성공', failure: '실패', cancelled: '취소', in_progress: '진행 중', queued: '대기', waiting: '대기', pending: '대기', skipped: '건너뜀', completed: '완료' }[k] || k;
    return `<a class="run-st ${esc(k)}" href="${esc(r.url)}" target="_blank" rel="noopener"><i></i>${esc(r.name)} · ${lbl}</a>`;
  }
  let deployTimer = null;
  async function tabPatch(el) {
    el.innerHTML = '<div class="skel" style="height:320px"></div>';
    let st; try { st = await api('/api/admin/repo/status'); } catch (e) { el.innerHTML = `<div class="alert danger">${esc(e.message)}</div>`; return; }
    if (!st.configured) {
      el.innerHTML = `<div class="alert warn">${ico('git')}<div><b>GitHub 연동이 설정되지 않았습니다.</b><br>저장소 Secrets에 <span class="mono">PATCH_GITHUB_TOKEN</span>(Fine-grained PAT — 이 저장소에 Contents·Actions 읽기/쓰기, Workflows 쓰기)을 등록하고 API 배포 워크플로를 한 번 실행하세요. README의 “UI 패치 설정” 참고.</div></div>`;
      return;
    }
    state.patchRepo = st.repo;
    const web = await fetch('version.json?_=' + Date.now(), { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const runsBySha = {}; st.runs.forEach((r) => (runsBySha[r.sha] = runsBySha[r.sha] || []).push(r));
    const pill = (k, v, ok, s) => `<div class="vpill"><div class="k">${k}</div><div class="v">${esc(short(v))}</div><div class="s ${ok ? 'res-ok' : 'st-mod'}">${s}</div></div>`;
    el.innerHTML = `<div class="vpills">
        ${pill(`저장소 HEAD · ${esc(st.branch)}`, st.head, true, esc(st.repo))}
        ${pill('웹 배포 버전', web && web.sha, web && web.sha === st.head, web ? (web.sha === st.head ? '최신 반영됨' : 'HEAD와 다름 — 배포 중이거나 web/ 변경 없음') : 'version.json 없음')}
        ${pill('API 배포 버전', st.apiVersion, st.apiVersion === st.head, st.apiVersion === st.head ? '최신 반영됨' : 'HEAD와 다름 — 배포 중이거나 worker/ 변경 없음')}</div>
      <div class="portlet" style="margin-bottom:16px"><div class="portlet-hd">${ico('up')} 패치 업로드<span class="acts"><button class="btn btn-sm" data-redeploy="pages">${ico('rocket', 12)} 웹 재배포</button> <button class="btn btn-sm" data-redeploy="worker">${ico('rocket', 12)} API 재배포</button></span></div><div class="portlet-bd">
        <label class="drop" id="pDrop"><input type="file" id="pFile" multiple hidden>${ico('up', 34)}<div style="margin-top:6px"><b>패치 zip 또는 개별 파일 선택</b> · 여기로 끌어다 놓기</div>
          <div style="font-size:12px;margin-top:4px">zip 내부 경로는 저장소 루트 기준(예: <span class="mono">web/app.js</span>) · 최상위 폴더 1개는 자동 제거 · ${L('<span class="mono">patch.json</span>의 <span class="mono">{"delete":[...]}</span>로 삭제 지정', '<span class="mono">patch.json</span> <span class="mono">{"delete":[...]}</span> lists files to delete')}</div></label>
        <div id="pDiff"></div></div></div>
      <div class="portlet" id="pDeploy" hidden style="margin-bottom:16px"><div class="portlet-hd">${ico('rocket')} 배포 진행 상황</div><div class="portlet-bd" id="pDeployBd"></div></div>
      <div class="portlet"><div class="portlet-hd">${ico('git')} 최근 커밋 · 배포 이력<span class="acts"><button class="icon-btn" id="pReload" title="새로고침">${ico('refresh')}</button></span></div><div class="portlet-bd flush"><div style="overflow:auto"><table class="grid"><thead><tr><th>커밋</th><th>메시지</th><th>작성</th><th>시간</th><th>배포 (Actions)</th><th></th></tr></thead><tbody>
        ${st.commits.map((c, i) => {
          const by = (c.message.match(/(Patched-by|Rolled-back-by): (\S+)/) || [])[2];
          return `<tr><td class="mono"><a href="${esc(c.url)}" target="_blank" rel="noopener">${short(c.sha)}</a>${i === 0 ? ' <span class="lbl approved">HEAD</span>' : ''}</td>
            <td style="white-space:normal;max-width:420px">${esc(c.message.split('\n')[0])}${by ? `<div style="font-size:11.5px;color:var(--muted)">UI 패치 · ${esc(by)}</div>` : ''}</td><td>${esc(c.author || '')}</td><td>${fmtFull(new Date(c.date).getTime())}</td>
            <td>${(runsBySha[c.sha] || []).map(runBadge).join('<br>') || '<span style="color:var(--muted);font-size:12px">-</span>'}</td>
            <td>${i > 0 ? `<button class="btn btn-sm" data-rb="${esc(c.sha)}">${ico('undo', 11)} 이 버전으로 롤백</button>` : ''}</td></tr>`;
        }).join('')}</tbody></table></div></div></div>`;
    $('#pReload').onclick = () => tabPatch(el);
    const drop = $('#pDrop'); const fi = $('#pFile');
    fi.onchange = () => { if (fi.files.length) preparePatch([...fi.files]); };
    drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); };
    drop.ondragleave = () => drop.classList.remove('over');
    drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer.files.length) preparePatch([...e.dataTransfer.files]); };
    el.onclick = async (e) => {
      const rb = e.target.closest('[data-rb]'); const rd = e.target.closest('[data-redeploy]');
      if (rb) {
        const c = st.commits.find((x) => x.sha === rb.dataset.rb);
        if (!(await confirmBox('버전 롤백', `<b>${short(c.sha)}</b> “${esc(c.message.split('\n')[0])}” 시점의 저장소 상태로 되돌리는 새 커밋을 만들고 자동 배포합니다.<br><span style="font-size:12px;color:var(--muted)">DB 데이터(앱·로그)는 되돌리지 않습니다.</span>`, '롤백', true))) return;
        runTask('버전 롤백', short(c.sha), () => api('/api/admin/repo/rollback', { method: 'POST', body: { sha: c.sha } }))
          .then((r) => { toast('롤백 커밋을 만들었습니다. 배포를 추적합니다.', 'success'); trackDeploy(r.sha, el); }).catch(() => {});
      }
      if (rd) {
        runTask(rd.dataset.redeploy === 'pages' ? '웹 재배포' : 'API 재배포', 'GitHub Actions', () => api('/api/admin/repo/dispatch', { method: 'POST', body: { workflow: rd.dataset.redeploy } }))
          .then(() => { toast('배포 워크플로를 실행했습니다.', 'success'); setTimeout(() => { if ($('#pReload')) tabPatch(el); }, 5000); }).catch(() => {});
      }
    };
  }

  async function preparePatch(files) {
    const box = $('#pDiff'); if (!box) return;
    box.innerHTML = '<div class="skel" style="height:120px;margin-top:12px"></div>';
    try {
      let items = []; let deletes = [];
      for (const f of files) {
        const bytes = new Uint8Array(await f.arrayBuffer());
        if (/\.zip$/i.test(f.name)) {
          const { unzipSync } = await fflate();
          for (const [p, b] of Object.entries(unzipSync(bytes))) if (!p.endsWith('/')) items.push({ path: p, bytes: b });
        } else items.push({ path: f.name, bytes, loose: true });
      }
      const zi = items.filter((i) => !i.loose);
      if (zi.length) {
        const tops = new Set(zi.map((i) => i.path.split('/')[0]));
        const root = [...tops][0];
        if (tops.size === 1 && zi.every((i) => i.path.includes('/')) && !['web', 'worker', 'samples', '.github'].includes(root)) zi.forEach((i) => (i.path = i.path.slice(root.length + 1)));
      }
      items = items.filter((i) => !IGNORE.test(i.path));
      const pj = items.find((i) => i.path === 'patch.json');
      if (pj) {
        try { deletes = (JSON.parse(new TextDecoder().decode(pj.bytes)).delete || []).map(String); } catch (_) { toast('patch.json 형식 오류 — 무시합니다.', 'error'); }
        items = items.filter((i) => i !== pj);
      }
      if (!items.length && !deletes.length) throw new Error('패치할 파일이 없습니다.');
      const tree = await api('/api/admin/repo/tree');
      const map = Object.fromEntries(tree.entries.map((e) => [e.path, e]));
      const byBase = {}; tree.entries.forEach((e) => { const b = e.path.split('/').pop(); (byBase[b] = byBase[b] || []).push(e.path); });
      for (const it of items) {
        if (it.loose) { const c = byBase[it.path] || []; if (c.length === 1) it.path = c[0]; }
        it.sha = await gitSha(it.bytes);
        classify(it, map);
      }
      deletes = deletes.filter((p) => map[p]);
      state.patch = { items, deletes, head: tree.head, map, showSame: false, msg: '' };
      drawPatch();
    } catch (e) {
      box.innerHTML = `<div class="alert danger" style="margin-top:12px">${ico('x')}<div>${esc(e.message || String(e))}</div></div>`;
    }
  }
  function classify(it, map) {
    const ex = map[it.path];
    it.state = !ex ? 'new' : ex.sha === it.sha ? 'same' : 'mod';
    it.mode = ex ? ex.mode : '100644';
    it.on = it.state !== 'same';
  }
  function drawPatch() {
    const P = state.patch; const box = $('#pDiff'); if (!P || !box) return;
    const cnt = { new: 0, mod: 0, same: 0 }; P.items.forEach((i) => cnt[i.state]++);
    const sel = P.items.filter((i) => i.on);
    const total = sel.reduce((s, i) => s + i.bytes.length, 0);
    const lbl = { new: '신규', mod: '변경', same: '동일' };
    const changeable = P.items.filter((i) => i.state !== 'same');
    box.innerHTML = `<div style="display:flex;gap:14px;align-items:center;margin:14px 0 8px;font-size:13px;flex-wrap:wrap"><b>비교 결과</b><span class="st-new">신규 ${cnt.new}</span><span class="st-mod">변경 ${cnt.mod}</span><span class="st-same">동일 ${cnt.same}</span>${P.deletes.length ? `<span class="st-del">삭제 ${P.deletes.length}</span>` : ''}<span style="color:var(--muted)">기준 커밋 <span class="mono">${short(P.head)}</span></span><span style="flex:1"></span><label class="check" style="font-size:12.5px"><input type="checkbox" id="pShowSame" ${P.showSame ? 'checked' : ''}> 동일 파일도 표시</label></div>
      <div class="gridwrap" style="max-height:340px;box-shadow:none"><table class="grid compact"><thead><tr><th style="width:30px"><input type="checkbox" id="pAll" ${changeable.length && changeable.every((i) => i.on) ? 'checked' : ''}></th><th>상태</th><th>경로 (저장소 기준 · 수정 가능)</th><th>크기</th></tr></thead><tbody>
        ${P.items.map((it, i) => (it.state === 'same' && !P.showSame ? '' : `<tr><td><input type="checkbox" data-on="${i}" ${it.on ? 'checked' : ''} ${it.state === 'same' ? 'disabled' : ''}></td><td class="st-${it.state}">${lbl[it.state]}</td><td><input class="path-in" data-path="${i}" value="${esc(it.path)}"></td><td>${fmtSize(it.bytes.length)}</td></tr>`)).join('')}
        ${P.deletes.map((p) => `<tr><td><input type="checkbox" checked disabled></td><td class="st-del">삭제</td><td class="mono">${esc(p)}</td><td>-</td></tr>`).join('')}
        ${!changeable.length && !P.deletes.length ? '<tr><td colspan="4" class="empty">저장소와 모두 동일합니다. 변경 사항이 없습니다.</td></tr>' : ''}
      </tbody></table></div>
      ${sel.some((i) => /^\.github\/workflows\//.test(i.path)) ? `<div class="alert warn" style="margin-top:10px">${ico('git')}<div>워크플로 파일 변경은 토큰에 <b>Workflows: Read and write</b> 권한이 필요합니다.</div></div>` : ''}
      ${sel.some((i) => /^worker\/migrations\//.test(i.path)) ? `<div class="alert info" style="margin-top:10px">${ico('db')}<div>DB 마이그레이션이 포함되어 있습니다. API 배포 시 자동 적용됩니다.</div></div>` : ''}
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><input class="input" id="pMsg" placeholder="커밋 메시지 (예: 승인 화면 개선)" style="flex:1;min-width:240px" value="${esc(P.msg)}"><button class="btn" id="pCancel">취소</button>
        <button class="btn btn-primary" id="pApply" ${sel.length || P.deletes.length ? '' : 'disabled'}>${ico('rocket', 13)} 패치 적용 (${sel.length + P.deletes.length}개 · ${fmtSize(total)})</button></div>
      <div style="font-size:12px;color:var(--muted);margin-top:6px">적용하면 <span class="mono">${esc(state.patchRepo || '')}</span>에 커밋되고 변경 영역(web/ → 웹, worker/ → API)의 GitHub Actions 배포가 자동 실행됩니다. 문제가 있으면 아래 이력에서 롤백하세요.</div>`;
    $('#pShowSame').onchange = (e) => { P.showSame = e.target.checked; drawPatch(); };
    $('#pAll').onchange = (e) => { changeable.forEach((i) => (i.on = e.target.checked)); drawPatch(); };
    $('#pMsg').oninput = (e) => (P.msg = e.target.value);
    box.onchange = (e) => {
      const on = e.target.dataset.on; const pth = e.target.dataset.path;
      if (on !== undefined) { P.items[on].on = e.target.checked; drawPatch(); }
      if (pth !== undefined) { const it = P.items[pth]; it.path = e.target.value.trim().replace(/^\/+/, ''); classify(it, P.map); drawPatch(); }
    };
    $('#pCancel').onclick = () => { state.patch = null; box.innerHTML = ''; const fi = $('#pFile'); if (fi) fi.value = ''; };
    $('#pApply').onclick = applyPatch;
  }
  async function applyPatch() {
    const P = state.patch; const sel = P.items.filter((i) => i.on);
    const paths = sel.map((i) => i.path);
    if (paths.some((p) => !p || p.includes('..'))) return toast('경로가 올바르지 않은 파일이 있습니다.', 'error');
    if (new Set(paths).size !== paths.length) return toast('중복된 경로가 있습니다.', 'error');
    const msg = (P.msg || '').trim() || `Patch via App Center: ${sel.length + P.deletes.length} files`;
    if (!(await confirmBox('패치 적용', `${L(`파일 <b>${sel.length}</b>개${P.deletes.length ? `, 삭제 <b>${P.deletes.length}</b>개` : ''}를 커밋하고 배포합니다.`, `<b>${sel.length}</b> files${P.deletes.length ? ` and <b>${P.deletes.length}</b> deletions` : ''} will be committed and deployed.`)}<br><span class="mono" style="font-size:12px">${esc(msg)}</span>`, '적용'))) return;
    const files = sel.map((i) => { const t = asText(i.bytes); return t !== null ? { path: i.path, mode: i.mode, encoding: 'utf-8', content: t } : { path: i.path, mode: i.mode, encoding: 'base64', content: toB64(i.bytes) }; });
    const btn = $('#pApply'); btn.disabled = true; btn.textContent = '커밋 중…';
    const body = { message: msg, files, deletes: P.deletes, baseSha: P.head };
    try {
      let r;
      try { r = await runTask('패치 커밋', `${files.length + P.deletes.length}개 파일`, () => api('/api/admin/repo/patch', { method: 'POST', body })); }
      catch (e) {
        if (e.status === 409 && (await confirmBox('충돌 감지', `${esc(e.message)}<br>그래도 현재 HEAD 위에 이 파일들을 적용할까요?`, '강제 적용', true)))
          r = await runTask('패치 커밋(강제)', `${files.length}개 파일`, () => api('/api/admin/repo/patch', { method: 'POST', body: { ...body, force: true } }));
        else throw e;
      }
      toast(`커밋 ${short(r.sha)} 완료 — 배포를 추적합니다.`, 'success');
      state.patch = null;
      trackDeploy(r.sha, $('#aBody'));
    } catch (_) {
      if (btn.isConnected) { btn.disabled = false; btn.textContent = '패치 적용'; }
    }
  }
  async function trackDeploy(sha, el) {
    clearTimeout(deployTimer);
    await tabPatch(el);
    const box = $('#pDeploy'); if (!box) return;
    box.hidden = false;
    const t0 = Date.now(); const tk = task('배포 추적', short(sha));
    const poll = async () => {
      const bd = $('#pDeployBd'); if (!bd) return tk.ok('화면 이동');
      let runs = []; try { runs = (await api('/api/admin/repo/runs?sha=' + sha)).runs; } catch (_) { /* retry */ }
      const done = runs.length && runs.every((r) => r.status === 'completed');
      const bad = runs.some((r) => r.status === 'completed' && !['success', 'skipped'].includes(r.conclusion));
      const webRun = runs.some((r) => /web|pages/i.test(r.name));
      bd.innerHTML = `<div style="font-size:13px;margin-bottom:8px">커밋 <span class="mono">${short(sha)}</span> · 경과 ${Math.round((Date.now() - t0) / 1000)}초</div>
        ${runs.length ? runs.map((r) => `<div style="padding:4px 0">${runBadge(r)}</div>`).join('') : `<div style="color:var(--muted)">${Date.now() - t0 < 90000 ? '워크플로 시작 대기 중…' : '실행된 워크플로가 없습니다 (web/·worker/ 외 파일만 바뀐 경우 정상).'}</div>`}
        ${done ? (bad ? `<div class="alert danger" style="margin-top:10px">${ico('x')}<div>배포가 실패했습니다. Actions 로그를 확인하거나 이전 버전으로 롤백하세요.</div></div>`
          : `<div class="alert success" style="margin-top:10px">${ico('check')}<div>배포 완료.${webRun ? ' <button class="btn btn-sm btn-primary" id="pReloadPage">새로고침해 새 화면 적용</button>' : ''}</div></div>`) : ''}`;
      if ($('#pReloadPage')) $('#pReloadPage').onclick = () => location.reload();
      if (done) { bad ? tk.fail('워크플로 실패') : tk.ok('배포 완료'); return; }
      if (!runs.length && Date.now() - t0 > 90000) { tk.ok('워크플로 없음'); return; }
      if (Date.now() - t0 > 15 * 60000) { tk.fail('15분 초과'); return; }
      deployTimer = setTimeout(poll, 5000);
    };
    poll();
  }

  /* ───────── Boot ───────── */
  async function loadConfig() {
    try { state.cfg = await api('/api/config'); } catch (_) { /* offline */ }
    const nb = $('#noticeBar');
    if (nb) nb.outerHTML = noticeHtml();
  }
  let webVer = null;
  async function checkVersion() {
    try {
      const v = await fetch('version.json?_=' + Date.now(), { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null));
      if (!v || !v.sha) return;
      if (webVer && webVer !== v.sha && !$('#updBar')) {
        const b = document.createElement('div'); b.id = 'updBar'; b.className = 'upd-bar';
        b.innerHTML = `${ico('rocket')} 새 버전(${esc(short(v.sha))})이 배포되었습니다. <button class="btn btn-sm btn-primary">새로고침</button>`;
        b.querySelector('button').onclick = () => location.reload();
        document.body.appendChild(b);
      }
      webVer = webVer || v.sha;
    } catch (_) { /* noop */ }
  }
  /* ───────── Mobile: bottom tab bar · table-to-card · swipe ───────── */
  function renderTabbar() {
    $('#tabbar').innerHTML = `
      <a href="#/" data-tb="home">${ico('home', 21)}<span>홈</span></a>
      <a href="#/all" data-tb="all">${ico('grid', 21)}<span>전체 앱</span></a>
      <a href="#/submit" data-tb="submit" class="tb-add" aria-label="앱 등록"><span class="circle">${ico('plus', 24)}</span><span>등록</span></a>
      <a href="#/favs" data-tb="favs">${ico('star', 21)}<span>즐겨찾기</span></a>
      <a href="#/studio" data-tb="mine">${me() ? avatar(me(), 22) : ico('folder', 21)}<span>${L('내 앱', 'My apps')}</span></a>`;
    setActiveNav();
  }
  // label each cell with its column name so tables can render as cards on mobile
  function cardify() {
    $$('table.grid', main).forEach((t) => {
      const hs = $$('thead th', t).map((th) => th.textContent.trim());
      if (!hs.length) return;
      t.classList.add('cardify');
      $$('tbody tr', t).forEach((tr) => [...tr.children].forEach((td, i) => { if (!td.hasAttribute('data-label')) td.setAttribute('data-label', td.colSpan > 1 ? '' : hs[i] || ''); }));
    });
  }
  new MutationObserver(debounce(cardify, 30)).observe(main, { childList: true, subtree: true });
  (() => { // swipe left to close the navigator
    let x0 = null;
    $('#nav').addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    $('#nav').addEventListener('touchend', (e) => { if (x0 !== null && e.changedTouches[0].clientX - x0 < -60) document.body.classList.remove('nav-open'); x0 = null; }, { passive: true });
  })();

  window.addEventListener('hashchange', render);
  renderTabbar();
  updateUser();
  renderNav();
  renderTasks();
  loadConfig().then(render);
  if (getSess()) api('/api/auth/me').then((d) => { const se = getSess(); if (se) { se.user = { ...se.user, ...d.user }; setSess(se); updateUser(); refreshMyCount(); syncFavs(); pollNoti(); } }).catch(() => {});
  $('#bellBtn').addEventListener('click', (e) => { e.preventDefault(); toggleNoti(); });
  loadApps().then(() => { if (!state.loadError) setApi(true); });
  checkVersion(); setInterval(checkVersion, 180000);
  loadStats(); setInterval(heartbeat, 60000);
  setTimeout(heartbeat, 3000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') heartbeat(); });
})();
