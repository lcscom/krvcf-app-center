# KRVCF App Center — app.krvcf.com

[한국어](README.md) · **English**

A mini-app sharing platform styled after the vSphere Client (Clarity). **Users signed in with a Google account** submit web-link apps (Catalog) or single-file HTML simulators (Demo Room). **An app is published only after an approver reviews it.** Approvers sign in with Google or an email verification code, and every action is recorded in the audit log. Platform patches are applied from the Admin Console by uploading a zip.

```
app.krvcf.com      →  GitHub Pages (web/)            static frontend, free
app-api.krvcf.com  →  Cloudflare Worker (worker/)    API · auth · audit log · sandboxed runner · GitHub patching
                       ├─ D1  : apps · ratings · feedback · visits · approvers · review history · audit log · settings · analytics
                       ├─ KV  : uploaded HTML sources
                       ├─ Resend API      : sign-in codes · review requests · decision emails (optional)
                       ├─ Google Identity : creator & approver Google sign-in (required for submissions)
                       └─ GitHub API      : UI patch commits · rollback · redeploy → GitHub Actions
```

## Operations features (v9)

| Feature | Details |
|---|---|
| Notification center | Header 🔔 when signed in. Creators: approved/rejected, new review, private feedback, link down/recovered. Approvers: new and resubmitted review requests. Admins: reports, link down. Refreshes every minute; clicking opens My apps or the right Admin Console tab. Kept 90 days |
| Review replies | App owners reply to public reviews from Owner Studio → Reviews & feedback (edit/delete). Shown as "Reply from the author" under the review |
| Favorites sync | On sign-in, this browser's favorites merge into the account and follow you to other devices |
| Change review | The approved version is recorded as `approved_version`. When a live app is edited and resubmitted, the Admin Console review dialog offers **Compare changes** (line diff from the live version to the new one, with +/− counts). The Owner Studio pending banner and the version list's **Compare** use the same view |
| Link health | The daily cron checks 40 link apps (least recently checked first) with HEAD/GET. 401/403/429 count as reachable; 404, 5xx and timeouts mark the app "Unreachable" and notify the owner and admins. **Check all links** (admin) and **Check link** in the review dialog (approver+) |
| Share previews | **Share** copies `https://app-api.krvcf.com/s/<id>`. KakaoTalk, Slack and Teams build a preview from the app name, description and image (`icons/og.png` or the thumbnail); clicking opens the app. Unapproved apps reveal nothing and redirect home |
| Korean initials search | Search and Ctrl/⌘+K accept Hangul initial consonants, e.g. `ㅅㅇㅈ` → "사이저" |

Migration `0006_notifications_replies_links.sql` is applied automatically by the deploy workflow (live apps are backfilled with their current version as the approved version).

## Accounts and Owner Studio (v8)

| Item | Details |
|---|---|
| Who can submit | **Submitting, editing, deleting and restoring apps requires Google sign-in.** Signed-out visitors see a sign-in screen instead of the wizard. Google accounts that are not registered approvers sign in as **Creator** (`user`) with a 7-day session |
| Ownership | New apps are bound to the signed-in account (`apps.owner_email`), and review emails go to that address. No other account can edit, delete, restore or preview them |
| Owner Studio | **My apps** in the account menu and navigator (`#/studio`): KPIs (live / pending / rejected, 7-day views and runs, average rating, open reports) and the app list. Per-app management (`#/studio/<id>`): **Overview** (30-day views/runs chart, rating distribution, review history) · **Versions** (preview, restore) · **Reviews & feedback** (public reviews + private feedback) · **Settings** (details, delete by typing the app name) |
| Linking older apps | Apps registered with an **owner key** (up to v7) are linked from Owner Studio → **Link existing app** (app ID + owner key, or the exported JSON). If this browser holds keys, a **Link all** banner appears. Apps already linked to another account are refused |
| Administration | Admin Console **Users** tab: signed-in accounts, app counts, last sign-in, **Block** (sessions revoked at once, sign-in refused). **Change owner account** from the app review dialog |
| Security | Session tokens and owner keys are never accepted in URLs. Previews of pending apps or older versions use a **5-minute run ticket** valid for one app only (`/run/:id?rt=`), so a sandboxed page that reads its own URL cannot steal a session |

> **Required before go-live**: without the `GOOGLE_CLIENT_ID` secret nobody except the super admin (password) can submit apps. Set up *3-A. Google sign-in* first. Migration `0005_user_accounts.sql` is applied automatically by the deploy workflow.

## Community features (v7)

| Feature | Details |
|---|---|
| Tags | Up to 5 per app (lowercase, max 20 chars). Shown on cards and detail pages, `#/tag/<tag>` pages, **Popular tags** on Home, type `#tag` in search |
| Author pages | Click an author name → `#/author/<name>` (app count, total runs, average rating) |
| Version history | Every source change (HTML or URL) bumps the version with a **change note**; the last 10 are kept. Owners and admins can **preview** an older version (`/run/:id?v=N`) and **restore** it (recorded as a new version; non-admins go back to approval) |
| Public reviews | Stars + nickname + review text (one per browser, editable and deletable) with a rating-distribution chart. The old private feedback stays behind the **Private feedback** button |
| Reports | Spam, malicious code, broken, copyright, inappropriate, other (5 per IP per day). Handle them in the Admin Console **Reports & reviews** tab: resolve/dismiss, hide/delete reviews |
| Webhooks | Set a URL and events (new submission, approval decision, report, new review) in Settings. Google Chat and Slack get `{text}`, Discord gets `{content}`, anything else gets JSON. Each send is audited as `webhook.send` |
| RSS | `https://app-api.krvcf.com/feed.xml` — the 30 most recent approved apps |
| Quick jump | **Ctrl/⌘ + K** — search pages, apps, tags (`#`) and authors (`@`), then Enter. On mobile use **Quick jump** in the menu |

Migration `0004_tags_versions_comments_reports.sql` is applied automatically by the Worker workflow (existing apps are backfilled as v1).

## Roles and approval workflow

| Role | Sign-in | Can do |
|---|---|---|
| Creator | Google (required) | submit apps; edit (→ back to pending), delete and restore own apps; status, stats, reviews and feedback in Owner Studio |
| Approver | Google / email code | run and review pending apps, approve, reject (reason required), read feedback |
| Admin | Google / email code | approver tasks + manage approvers, audit/visit logs, settings, patch/rollback, backup |
| Super admin | `ADMIN_PASSWORD` | admin tasks + **grant/revoke the admin role** (break-glass account) |

1. A new or edited app becomes **Pending**. All active approvers receive a review-request email.
2. An approver opens **Review** in the Admin Console, runs the app, then approves or rejects (a reason is required to reject).
3. The decision and reason go to the author by email, the app's **review history** timeline, and the **audit log**.
4. Deactivating or deleting an approver revokes their sessions **immediately** (checked against the DB on every request).

Auto-approve, email notifications, log retention and the top notice banner are set in Admin Console → Settings.

## Languages — Korean / English

- **Language choice**: switch with the `EN` / `한국어` button in the header; the choice is remembered in the browser. Without a saved choice, the browser language decides (ko → Korean, otherwise English).
- **What is translated**: all UI text, placeholders and tooltips, toasts, dialogs, server error messages, date and number formats (`en-US`) and country names (Intl). **User content (app names, descriptions, authors) is never translated.**
- **API**: responses are localized from the `x-lang: en|ko` header, which the web app always sends. Without it, `Accept-Language` decides (non-Korean → English).
- **Emails**: sign-in codes, review requests, decisions, approver invitations and test emails are **bilingual (Korean + English)**. The sandbox error page also shows both languages.
- **How it works**: `web/i18n.js` translates rendered text in three passes: dictionary (exact match), then regex rules (sentences with numbers or names), then per-fragment matching split on `·` and `/`. A MutationObserver handles later renders. It never rewrites an unchanged value and stops observing if a mutation storm is detected.
- **Adding text**: when you add UI text, add its English to the `EN` dictionary (static strings) or `RX` rules (strings with variables) in `web/i18n.js`. For API messages, also update `MSG_EN` in `worker/src/index.js`.

## Mobile

| Item | Details |
|---|---|
| Bottom tab bar | Home · All apps · **Submit (+)** · Favorites · My apps (Admin when signed in). Shown at ≤600 px wide; the Recent Tasks panel is hidden there |
| Tables → cards | Every Admin Console table (pending, apps, approvers, audit log, feedback, …) renders as "column: value" cards, so there is no horizontal scrolling |
| Runner | Full screen with an icon-only header (one-line title), using `100dvh` to handle the mobile address bar |
| Dialogs | Bottom sheets with full-width buttons |
| Submit wizard | Steps scroll horizontally; Back/Next stay pinned to the bottom |
| Inputs | 16 px font size prevents iOS auto-zoom; touch targets are 40–44 px on touch devices |
| Notch | `viewport-fit=cover` plus safe-area insets (header, tab bar, runner) |
| Home-screen app | `manifest.webmanifest` + icons (192/512/maskable/apple-touch). Installs as a standalone app with shortcuts to Demo Room, Submit and Favorites |
| Other | Category chips scroll in one row, swipe left to close the navigator, and the selected admin tab auto-scrolls into view |

## Visitor analytics

| Metric | How it is computed |
|---|---|
| Visitors (UV) | Anonymous random per-browser ID (localStorage); only a hash is stored server-side. Falls back to an IP hash |
| Visitors today / new / returning | Counted once per day (KST) via `daily_seen`; an ID seen for the first time is "new" |
| Pageviews (PV) | Once per SPA route change (repeated renders of the same route are ignored) |
| Online now | 60-second heartbeat; active within the last 3 minutes |
| Total / 7-day / 30-day visitors | `visitors` table (kept permanently) |
| App views | Entering an app's detail page, counted at most once per visitor per 30 minutes |
| Referrers | Referrer domain of the first page in a session (otherwise "Direct") |
| Country · device · browser | Cloudflare country code and User-Agent (KakaoTalk, Naver and Whale in-app browsers are recognized) |

- **Excluded**: bot/crawler user agents and Admin Console screens.
- **Retention**: daily aggregates (`daily`, `app_daily`) are kept permanently. Page, referrer, country and device breakdowns are computed only within the raw visit-log retention window (default 30 days).
- **Where it shows**:
  - Home: today / total / online cards and trending apps
  - Bottom left: live counter
  - Admin Console → **Analytics** (approvers and above): daily trend chart (7 d / 30 d / 90 d / 1 y, with a table view), pageviews by hour, live visitor list, top pages and apps, referrers, countries, devices and browsers, auto-refresh every 30 seconds
- **D1 writes**: each pageview writes about 6–8 rows, so the free plan's 100,000 rows/day supports roughly 10,000 pageviews a day.

App cards and detail pages also show view counts and a **favorite (★)** toggle (left nav "Favorites" and a Home section). Home shows **recently viewed** apps, and lists can be sorted **by views**.

## Audit log

Each of the following is stored in `audit_log` with user, role, target, JSON detail, success flag, masked IP, country and User-Agent. In the Admin Console you can filter by condition and export to CSV.

`app.create / update / delete / review / run / preview / rate / feedback / feature` · `auth.login` (with failure reason) · `auth.otp_request` · `auth.logout` · `approver.create / update / delete` · `settings.update` · `repo.patch / rollback / redeploy` · `backup.export / restore` · `stats.reset` · `visits.clear` · `feedback.delete` · `mail.*` (delivery result)

Retention defaults to 180 days. A cron job removes older entries daily at 03:17 KST.

## UI patching (Admin Console → Patch / Deploy)

1. Drop a zip or individual files. Paths inside the zip are relative to the repo root (`web/app.js`), and a single top-level folder is stripped. `node_modules`, `.git` and `.dev.vars` are ignored.
2. The browser computes each file's git blob SHA and compares it with the repo, marking files **new / modified / unchanged**. Paths are editable, and loose files are auto-matched to a repo path with the same file name.
3. To delete files, include `patch.json` in the zip: `{"delete": ["web/old.js"]}`
4. **Apply patch** makes the Worker commit through the GitHub API. If the repo changed meanwhile, the conflict is detected and you are asked whether to force-apply.
5. Actions run for the changed areas (web/ → web, worker/ → API and DB migrations), and progress is tracked on screen.
6. **Roll back to this** in the commit history creates a new commit with that point's tree and redeploys. DB data is not rolled back.
7. When a new web version is deployed, open browsers show a "new version · reload" prompt. Static files carry `?v=<commit>`, so caching is not an issue.

---

## Deployment (one-time setup)

### 0. Setup script (steps B–H)

After creating and pushing the repository (step 1), the rest can run from one script. Requires Node.js 20+ and `gh auth login`.

```bash
node scripts/setup.mjs            # resume unfinished steps (answers & progress: ~/.krvcf-setup/)
node scripts/setup.mjs --all      # rerun every step (saved answers reused)
node scripts/setup.mjs --reset    # clear progress + delete Cloudflare Worker/D1/KV, start over
node scripts/setup.mjs --forget   # also delete saved answers
node scripts/setup.mjs --from F   # resume from a step
node scripts/setup.mjs --only G   # one step
node scripts/setup.mjs --check    # read-only health check
```

The Cloudflare token, Google client ID and GitHub patch token have no public creation API (or need a first token), so the script opens pre-filled pages and validates what you paste. Everything else — permission probes, DNS, Resend domain verification, Secrets, running and waiting for deployments, Pages and HTTPS, admin registration — is automatic. Secrets are never written to disk.

### 1. Create the repository

```bash
git init && git add . && git commit -m "KRVCF App Center"
gh repo create krvcf-app-center --public --source . --push
```

### 2. GitHub Secrets

| Secret | Required | Value / how to get it |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | ✅ | Cloudflare → API Tokens → template "Edit Cloudflare Workers", plus **Account · D1 : Edit**; Zone = krvcf.com |
| `CLOUDFLARE_ACCOUNT_ID` | ✅ | Account ID from the Cloudflare dashboard |
| `ADMIN_PASSWORD` | ✅ | Super admin password (make it long) |
| `SESSION_SECRET` | recommended | `openssl rand -base64 32` — session signing key (falls back to ADMIN_PASSWORD) |
| `GOOGLE_CLIENT_ID` | optional | see 3-A |
| `RESEND_API_KEY` | optional | see 3-B |
| `MAIL_FROM` | optional | default `KRVCF App Center <noreply@krvcf.com>` |
| `PATCH_GITHUB_TOKEN` | optional | see 3-C (for UI patching) |

```bash
gh secret set CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_ACCOUNT_ID
gh secret set ADMIN_PASSWORD
openssl rand -base64 32 | gh secret set SESSION_SECRET
```

Each run of the API workflow syncs every secret that has a value to the Worker (`wrangler secret bulk`). The repository name and branch (`GH_REPO`, `GH_BRANCH`) are filled in automatically.

### 3-A. Google sign-in (required for submissions)

1. In Google Cloud Console, go to APIs & Services → OAuth consent screen and configure it (External, app name "KRVCF App Center").
2. Go to Credentials → **OAuth client ID** → type **Web application**.
3. Under **Authorized JavaScript origins**, add `https://app.krvcf.com` (also `http://localhost:8080` for local testing).
4. Put the client ID (`…apps.googleusercontent.com`) in the `GOOGLE_CLIENT_ID` secret.

The Worker verifies the ID token itself against Google's public keys (RS256 signature, `iss`, `aud`, expiry, `email_verified`). Emails in the approvers table sign in as approvers/admins; everyone else signs in as a creator. Blocked accounts are refused.

### 3-B. Email codes and notifications (optional, Resend)

1. Sign up at resend.com and add `krvcf.com` under Domains. Add the SPF/DKIM records it shows to Cloudflare DNS, then click Verify.
2. Create a key under API Keys → Create (Sending access) and put it in `RESEND_API_KEY`.
3. Check delivery with Admin Console → Settings → **Test email**.

The Resend free plan allows 3,000 emails a month, 100 a day and 3 domains ([Resend pricing](https://resend.com/pricing)).

Codes are 6 digits and valid for 10 minutes. Attempts (5) and sends per IP and per email are rate-limited. The response never reveals whether an email is registered.

### 3-C. GitHub token for UI patching (optional)

Create it under GitHub → Settings → Developer settings → **Fine-grained personal access tokens**:
- Repository access: **this repository only**
- Permissions: **Contents: Read and write**, **Actions: Read and write**, **Workflows: Read and write** (only needed to patch workflow files), Metadata: Read

Store it as `PATCH_GITHUB_TOKEN`. GitHub does not allow secret names that start with `GITHUB_`, hence this name.

### 4. Deploy the API

Run Actions → **Deploy API (Cloudflare Worker)** → Run workflow. It runs these steps automatically:
create D1/KV → apply migrations (0001–0003) → deploy (`app-api.krvcf.com` custom domain wired automatically, `VERSION` = commit) → sync secrets

Check `https://app-api.krvcf.com/api/health`.

### 5. Deploy the web app (GitHub Pages + Cloudflare DNS)

1. In Settings → Pages, set Source to **GitHub Actions**.
2. Run Actions → **Deploy Web (GitHub Pages)** → Run workflow.
3. In Cloudflare DNS, add `CNAME app → <github-user>.github.io` as **DNS only (grey cloud)**.
4. Enter `app.krvcf.com` under Pages → Custom domain, then enable **Enforce HTTPS** once the certificate is issued.

### 6. First sign-in and approvers

1. Go to `https://app.krvcf.com/#/admin` and use "Super admin (password) sign-in".
2. In Settings, check that **Integrations** shows Google, email and GitHub as "Configured".
3. Add approver emails under Approvers (role: approver or admin, optionally send an invitation).
4. From then on, approvers sign in with Google or an email code.

After this, ship platform changes by uploading a zip under **Patch / Deploy**.

---

## Free-tier budget

| Service | Free limit | Used for |
|---|---|---|
| Cloudflare Workers | 100,000 requests/day | the whole API |
| D1 | 5M rows read and 100k rows written per day, 5 GB storage | all writes, including the audit log |
| KV | 100,000 reads and 1,000 writes per day, 1 GB storage | writes only when HTML is submitted or edited |
| Resend | 3,000 emails/month, 100/day | sign-in codes, review requests, decisions |
| GitHub Pages / Actions | free for public repositories | hosting, deployment |

Cloudflare limits: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)

The Workers free plan limits each request to 50 subrequests. When patching, text files are therefore inlined into one tree-creation call, and only binary files are uploaded as separate blobs (up to 35 per patch).

## Where settings live

| Setting | Location |
|---|---|
| Auto-approve, email notifications, log retention, notice | Admin Console → Settings (stored in D1, applied immediately) |
| API base URL | `web/config.js` |
| Allowed origins (CORS · iframe) | `ALLOWED_ORIGINS` in `worker/wrangler.toml` |
| Categories | `CATEGORIES` in `worker/src/index.js` and `CATS` in `web/app.js` |
| Translations | `web/i18n.js` (UI), `MSG_EN` in `worker/src/index.js` (API) |

## Local development

```bash
cd worker && npm install
cat > .dev.vars <<'EOV'
ADMIN_PASSWORD=test1234
MAIL_MODE=console
DEV_LOGIN=true
EOV
npm run dev                                  # http://localhost:8787
cd ../web && python3 -m http.server 8080     # http://localhost:8080
```

With `DEV_LOGIN=true`, the sign-in dialog shows a development form that impersonates a creator by email only (`POST /api/auth/dev`). It is always off in CI deployments (`VERSION=<commit SHA>`). With `MAIL_MODE=console`, emails are printed to the Worker log instead of being sent. Email sign-in codes are also shown on the sign-in screen, so **never set this in production**.

`samples/vsan-esa-sizer.html` is a bilingual sample app for testing Demo Room uploads.

## API summary

| Method | Path | Access |
|---|---|---|
| GET | `/api/config` · `/api/apps` · `/api/stats` | public |
| POST | `/api/apps` | signed-in Google user |
| GET | `/api/my/apps` · `/api/my/apps/:id`, POST `/api/my/claim` | signed-in user (own apps) |
| POST | `/api/apps/:id/run-ticket` | owner / approver+ (5-minute run ticket) |
| GET/POST | `/api/admin/users`, POST `/users/:email` · `/apps/:id/owner` | admin+ |
| POST | `/api/apps/:id/run` · `/rate` · `/feedback` · `/api/visit` · `/api/ping` | public |
| GET/PUT/DELETE | `/api/apps/:id` · GET `/source` · `/reviews` | owner (signed in) / approver / admin |
| POST | `/api/auth/password` · `/email/start` · `/email/verify` · `/google` · `/dev` (local only) · `/logout`, GET `/api/auth/me` | — |
| GET | `/api/admin/overview` · `/feedback` · `/analytics`, POST `/apps/:id/status` | approver+ |
| GET/POST/PUT/DELETE | `/api/admin/approvers[/:email]` | admin+ (admin role: super admin only) |
| GET | `/api/admin/audit?action=&actor=&q=&ok=&from=&to=&before=&limit=` | admin+ |
| GET/PUT | `/api/admin/settings`, POST `/test-mail` | admin+ |
| GET/DELETE | `/api/admin/visits`, DELETE `/feedback/:id`, POST `/apps/:id/feature` · `/reset-stats` | admin+ |
| GET | `/api/admin/repo/status` · `/tree` · `/runs?sha=` | admin+ |
| POST | `/api/admin/repo/patch` · `/rollback` · `/dispatch` | admin+ |
| GET/POST | `/api/admin/backup` · `/restore` | admin+ |
| GET | `/api/apps/:id/versions`, POST `/versions/:v/restore` | public (list) / owner or admin (restore) |
| GET/POST/DELETE | `/api/apps/:id/comments`, POST `/report` | public |
| GET | `/api/admin/reports?status=all` · `/comments`, POST `/reports/:id` · `/comments/:id` | approver+ |
| DELETE | `/api/admin/comments/:id`, POST `/test-webhook` | admin+ |
| GET | `/feed.xml` | RSS |
| GET | `/s/:id` | share preview (Open Graph) → forwards to the app |
| GET/POST | `/api/my/notifications`, POST `/api/my/notifications/read` | signed-in user |
| GET/POST | `/api/my/favs` | signed-in user |
| POST | `/api/my/apps/:id/comments/:cid/reply` | owner / admin |
| GET | `/api/apps/:id/versions/:v/source` | owner / approver+ |
| POST | `/api/admin/apps/:id/check-link` · `/api/admin/check-links` | approver+ · admin+ |
| GET | `/run/:id` | sandboxed runner (pending apps and `?v=N` need an `?rt=` run ticket) |

All endpoints accept `x-lang: en|ko` for localized messages.

---
Unofficial community project; not an official VMware or Broadcom service.
