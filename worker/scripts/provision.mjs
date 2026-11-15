// Creates the D1 database and KV namespace if missing, and injects their IDs into wrangler.toml.
// Required env: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
import { readFileSync, writeFileSync } from 'node:fs';

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;
const D1_NAME = 'krvcf-apps';
const KV_TITLE = 'krvcf-apps-html';
const TOML = new URL('../wrangler.toml', import.meta.url);

if (!TOKEN || !ACCOUNT) {
  console.error('CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are required.');
  process.exit(1);
}

async function cf(path, init = {}) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json', ...(init.headers || {}) },
  });
  const d = await r.json();
  if (!d.success) throw new Error(`${path}: ${JSON.stringify(d.errors)}`);
  return d.result;
}

async function ensureD1() {
  const list = await cf(`/d1/database?name=${encodeURIComponent(D1_NAME)}&per_page=100`);
  const hit = list.find((d) => d.name === D1_NAME);
  if (hit) return hit.uuid;
  const created = await cf('/d1/database', { method: 'POST', body: JSON.stringify({ name: D1_NAME }) });
  console.log(`Created D1: ${D1_NAME}`);
  return created.uuid;
}

async function ensureKV() {
  for (let page = 1; page < 20; page++) {
    const list = await cf(`/storage/kv/namespaces?per_page=100&page=${page}`);
    const hit = list.find((n) => n.title === KV_TITLE);
    if (hit) return hit.id;
    if (list.length < 100) break;
  }
  const created = await cf('/storage/kv/namespaces', { method: 'POST', body: JSON.stringify({ title: KV_TITLE }) });
  console.log(`Created KV: ${KV_TITLE}`);
  return created.id;
}

const d1 = await ensureD1();
const kv = await ensureKV();
let toml = readFileSync(TOML, 'utf8');
toml = toml.replace(/database_id = "[^"]*"/, `database_id = "${d1}"`).replace(/(binding = "HTML"\s*\nid = )"[^"]*"/, `$1"${kv}"`);
writeFileSync(TOML, toml);
console.log(`D1=${d1}\nKV=${kv}`);
