// Cloudflare Worker — 麻将番型统计
// 统计单位：一副和牌。fan_counts.count = 含该番种的牌副数(m)，
// total = upload_log 行数(n)，前端展示的频率即 m/n。
// 接口：
//   GET  /api/fan-stats                          → 返回全量番型计数（公开）
//   POST /api/fan-stats  body:{fans:[...],tiles:[...]} → 上报一副和牌（有限流）
//   GET  /api/fan-stats/export?token=&format=    → 导出 fan_counts（json/csv，管理员）
//   PUT  /api/fan-stats/import?token=            → 覆盖导入 fan_counts（管理员）
//   GET  /api/fan-logs?token=&limit=&offset=&ip= → 审计日志（管理员）
//   DELETE /api/fan-logs?token=&ip=              → 清除某 IP 的记录并重算计数
//
// 注意：import 直接覆写 fan_counts，不触碰 upload_log。
// 若之后调用 DELETE /api/fan-logs 触发重算，手动导入的数据会被覆盖，需重新导入。

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const MAX_FANS_PER_UPLOAD = 25;   // 单副最多番种数
const MAX_FAN_NAME_LEN   = 12;   // 番种名最大字符数
const MAX_TILES_PER_HAND = 20;   // 单副最多牌数（含杠的第 4 张，留余量）
const MAX_TILE_CODE_LEN  = 3;    // 牌码最大字符数（如 1m / 0p）
const RATE_LIMIT_PER_HOUR = 20;  // 同一 IP 每小时最多上报次数

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

    const url  = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, ''); // strip trailing slash

    try {
      if (path.endsWith('/api/fan-stats/export')) {
        if (request.method === 'GET') return await exportStats(request, env);
      }
      if (path.endsWith('/api/fan-stats/import')) {
        if (request.method === 'PUT') return await importStats(request, env);
      }
      if (path.endsWith('/api/fan-stats')) {
        if (request.method === 'GET')  return await getStats(env);
        if (request.method === 'POST') return await postStats(request, env);
      }
      if (path.endsWith('/api/fan-logs')) {
        if (request.method === 'GET')    return await getLogs(request, env);
        if (request.method === 'DELETE') return await deleteLogs(request, env);
      }
      return new Response('Not Found', { status: 404 });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  },
};

// ── GET /api/fan-stats ─────────────────────────────────────────────
async function getStats(env) {
  const [{ results }, totalRow] = await Promise.all([
    env.DB.prepare('SELECT name, count FROM fan_counts ORDER BY count DESC').all(),
    env.DB.prepare('SELECT COUNT(*) AS n FROM upload_log').first(),
  ]);
  return json({ fans: results, total: totalRow?.n ?? 0 });
}

// ── POST /api/fan-stats ────────────────────────────────────────────
async function postStats(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  // 限流：每 IP 每小时最多 RATE_LIMIT_PER_HOUR 次
  const rlKey = `rl:${ip}`;
  const rl = (await env.KV.get(rlKey, 'json')) || { n: 0, exp: Date.now() + 3_600_000 };
  if (Date.now() > rl.exp) { rl.n = 0; rl.exp = Date.now() + 3_600_000; }
  if (rl.n >= RATE_LIMIT_PER_HOUR) return json({ error: 'rate limited' }, 429);
  rl.n++;
  await env.KV.put(rlKey, JSON.stringify(rl), { expirationTtl: 3600 });

  // 解析并校验 body
  let body;
  try { body = await request.json(); } catch { return json({ error: 'invalid json' }, 400); }

  const raw = body?.fans;
  if (!Array.isArray(raw) || raw.length === 0)
    return json({ error: 'fans must be non-empty array' }, 400);

  // 单副内番种去重：统计以「副」为单位，含该番的副数最多 +1
  const fans = [...new Set(
    raw.filter(n => typeof n === 'string' && n.length > 0 && n.length <= MAX_FAN_NAME_LEN)
  )].slice(0, MAX_FANS_PER_UPLOAD);
  if (fans.length === 0) return json({ error: 'no valid fan names' }, 400);

  // 牌型（可选）：整副牌的牌码
  const rawTiles = Array.isArray(body?.tiles) ? body.tiles : [];
  const tiles = rawTiles
    .filter(t => typeof t === 'string' && t.length > 0 && t.length <= MAX_TILE_CODE_LEN)
    .slice(0, MAX_TILES_PER_HAND);

  // 上传时间 + 按 IP 判定的地点/时区（Cloudflare 边缘提供，服务端记录）
  const ts  = Date.now();
  const geo = buildGeo(request.cf, ts);

  // 写审计日志（一行 = 一副牌）
  await env.DB
    .prepare('INSERT INTO upload_log (ts, ip, tiles, fans, geo) VALUES (?, ?, ?, ?, ?)')
    .bind(ts, ip, JSON.stringify(tiles), JSON.stringify(fans), JSON.stringify(geo))
    .run();

  // 原子累加计数（D1 batch），fans 已按副去重
  await env.DB.batch(
    fans.map(name =>
      env.DB
        .prepare('INSERT INTO fan_counts (name, count) VALUES (?, 1) ON CONFLICT(name) DO UPDATE SET count = count + 1')
        .bind(name)
    )
  );

  return json({ ok: true });
}

// ── GET /api/fan-stats/export ─────────────────────────────────────
async function exportStats(request, env) {
  if (!checkAdmin(request, env)) return adminError(env);

  const { results } = await env.DB
    .prepare('SELECT name, count FROM fan_counts ORDER BY count DESC')
    .all();

  const fmt = new URL(request.url).searchParams.get('format') || 'json';
  if (fmt === 'csv') {
    const csv = 'name,count\n' + results.map(r => `"${r.name}",${r.count}`).join('\n');
    return new Response(csv, {
      headers: { ...CORS, 'Content-Type': 'text/csv; charset=utf-8',
                 'Content-Disposition': 'attachment; filename="fan_counts.csv"' },
    });
  }
  return new Response(JSON.stringify(results, null, 2), {
    headers: { ...CORS, 'Content-Type': 'application/json',
               'Content-Disposition': 'attachment; filename="fan_counts.json"' },
  });
}

// ── PUT /api/fan-stats/import ─────────────────────────────────────
async function importStats(request, env) {
  if (!checkAdmin(request, env)) return adminError(env);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'invalid json' }, 400); }

  const rows = Array.isArray(body) ? body : body?.fans;
  if (!Array.isArray(rows) || rows.length === 0)
    return json({ error: 'expected non-empty array [{name, count}]' }, 400);

  const valid = rows.filter(r =>
    typeof r.name === 'string' && r.name.length > 0 && r.name.length <= MAX_FAN_NAME_LEN &&
    Number.isInteger(r.count) && r.count >= 0
  );
  if (valid.length === 0) return json({ error: 'no valid rows' }, 400);

  await env.DB.batch([
    env.DB.prepare('DELETE FROM fan_counts'),
    ...valid.map(r =>
      env.DB.prepare('INSERT INTO fan_counts (name, count) VALUES (?, ?)').bind(r.name, r.count)
    ),
  ]);

  return json({ ok: true, imported: valid.length });
}

// ── GET /api/fan-logs ──────────────────────────────────────────────
async function getLogs(request, env) {
  if (!checkAdmin(request, env)) return adminError(env);

  const url    = new URL(request.url);
  const limit  = Math.min(parseInt(url.searchParams.get('limit')  || '200'), 1000);
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const ip     = url.searchParams.get('ip') || null;

  const { results } = ip
    ? await env.DB
        .prepare('SELECT id, ts, ip, tiles, fans, geo FROM upload_log WHERE ip = ? ORDER BY ts DESC LIMIT ? OFFSET ?')
        .bind(ip, limit, offset).all()
    : await env.DB
        .prepare('SELECT id, ts, ip, tiles, fans, geo FROM upload_log ORDER BY ts DESC LIMIT ? OFFSET ?')
        .bind(limit, offset).all();

  return json(results);
}

// ── DELETE /api/fan-logs ───────────────────────────────────────────
// 删除指定 IP 的所有日志，并从剩余日志重算番型计数
async function deleteLogs(request, env) {
  if (!checkAdmin(request, env)) return adminError(env);

  const url = new URL(request.url);
  const ip  = url.searchParams.get('ip');
  if (!ip) return json({ error: 'ip required' }, 400);

  await env.DB.prepare('DELETE FROM upload_log WHERE ip = ?').bind(ip).run();

  // 从剩余日志重算 fan_counts（以「副」为单位：每副内番种去重后再计数）
  await env.DB.batch([
    env.DB.prepare('DELETE FROM fan_counts'),
    env.DB.prepare(`
      INSERT INTO fan_counts (name, count)
      SELECT value AS name, COUNT(*) AS count
      FROM (
        SELECT DISTINCT upload_log.id AS hid, j.value AS value
        FROM upload_log, json_each(upload_log.fans) j
      )
      GROUP BY value
    `),
  ]);

  return json({ ok: true });
}

// ── 地点 / 时区 ────────────────────────────────────────────────────
// 从 Cloudflare 的 request.cf（按访客 IP 判定）取地点与 IANA 时区，
// 再用 Intl 把 UTC 时刻换算成访客本地时间——Intl 会自动应用夏令时。
function buildGeo(cf, ts) {
  cf = cf || {};
  const tz = cf.timezone || null;                 // IANA，如 America/New_York
  const geo = {
    country: cf.country || null,                  // 如 US / CN
    region:  cf.region  || null,                  // 省 / 州
    city:    cf.city    || null,
    tz,                                           // IANA 时区名
    offset:  null,                                // 该时刻相对 UTC 的分钟数（含夏令时）
    local:   null,                                // 本地墙钟时间 YYYY-MM-DD HH:mm:ss
    tzAbbr:  null,                                // 时区缩写/偏移，如 EDT / GMT-4（体现夏令时）
  };
  if (tz) {
    try {
      const d = new Date(ts);
      const p = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz, hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }).formatToParts(d).reduce((a, x) => (a[x.type] = x.value, a), {});
      const hh = p.hour === '24' ? '00' : p.hour;   // en-CA 可能返回 24 时
      geo.local  = `${p.year}-${p.month}-${p.day} ${hh}:${p.minute}:${p.second}`;
      const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +hh, +p.minute, +p.second);
      geo.offset = Math.round((asUTC - d.getTime()) / 60000);
      geo.tzAbbr = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
        .formatToParts(d).find(x => x.type === 'timeZoneName')?.value || null;
    } catch { /* 非法时区名则仅保留地点字段 */ }
  }
  return geo;
}

// ── 工具 ──────────────────────────────────────────────────────────
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function checkAdmin(request, env) {
  const url   = new URL(request.url);
  const token = url.searchParams.get('token');
  return token && token === env.ADMIN_TOKEN;
}

// 401 响应，附带可诊断但不泄露 token 的原因
function adminError(env) {
  if (!env.ADMIN_TOKEN)
    return json({ error: 'ADMIN_TOKEN not configured on this Worker (add the secret and Deploy a new version)' }, 401);
  return json({ error: 'unauthorized: token does not match ADMIN_TOKEN' }, 401);
}
