// Cloudflare Worker — 麻将番型统计
// 统计单位：一副和牌。fan_counts.count = 含该番种的牌副数(m)，
// total = upload_log 行数(n)，前端展示的频率即 m/n。
// 接口：
//   GET  /api/fan-stats                          → 返回全量番型计数（公开）
//   POST /api/fan-stats  body:{fans:[...],tiles:{concealed,win,melds},player} → 上报一副和牌（有限流）
//   GET  /api/fan-stats/export?token=&format=    → 导出 fan_counts（json/csv，管理员）
//   PUT  /api/fan-stats/import?token=            → 覆盖导入 fan_counts（管理员）
//   GET  /api/fan-logs?token=&limit=&offset=&ip= → 审计日志（管理员）
//   PUT  /api/fan-logs/import?token=             → 批量导入逐副记录（管理员）
//   DELETE /api/fan-logs?token=&id=              → 删除单条记录并重算计数
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
const MAX_PLAYER_LEN     = 24;   // 和牌人名最大字符数
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
      if (path.endsWith('/api/fan-logs/import')) {
        if (request.method === 'PUT') return await importLogs(request, env);
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

  // 牌型（可选）：结构化 {concealed,win,melds}，兼容旧平铺数组
  const tiles = sanitizeTiles(body?.tiles);

  // 和牌人（可选，仅用于追踪；非登录/鉴权）
  const player = (typeof body?.player === 'string' ? body.player.trim() : '').slice(0, MAX_PLAYER_LEN);

  // 上传时间 + 按 IP 判定的地点/时区（Cloudflare 边缘提供，服务端记录）
  const ts  = Date.now();
  const geo = buildGeo(request.cf, ts);

  // 写审计日志（一行 = 一副牌）
  await env.DB
    .prepare('INSERT INTO upload_log (ts, ip, tiles, fans, geo, player) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(ts, ip, JSON.stringify(tiles), JSON.stringify(fans), JSON.stringify(geo), player)
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
        .prepare('SELECT id, ts, ip, tiles, fans, geo, player FROM upload_log WHERE ip = ? ORDER BY ts DESC LIMIT ? OFFSET ?')
        .bind(ip, limit, offset).all()
    : await env.DB
        .prepare('SELECT id, ts, ip, tiles, fans, geo, player FROM upload_log ORDER BY ts DESC LIMIT ? OFFSET ?')
        .bind(limit, offset).all();

  return json(results);
}

// ── PUT /api/fan-logs/import ───────────────────────────────────────
// 批量导入逐副记录（完整记录）。body 为「副」数组，每副可为：
//   ["平和","断幺"]                                  ← 仅番型汇总（简写）
//   {fans:[...], ts?, player?, ip?, tiles?, geo?}    ← 完整记录，任一字段可省略/null
// 省略/null 的字段在 admin 里不显示。每副插入一行 upload_log，随后重算 fan_counts。
// 追加式：不清空已有记录；total 随之增长，占比更稳定。
async function importLogs(request, env) {
  if (!checkAdmin(request, env)) return adminError(env);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'invalid json' }, 400); }
  const rows = Array.isArray(body) ? body : body?.hands;
  if (!Array.isArray(rows) || rows.length === 0)
    return json({ error: 'expected non-empty array of hands' }, 400);

  const inserts = [];
  for (const row of rows) {
    const isObj = row && typeof row === 'object' && !Array.isArray(row);
    const rawFans = Array.isArray(row) ? row : (isObj ? row.fans : null);
    if (!Array.isArray(rawFans)) continue;
    const fans = [...new Set(
      rawFans.filter(n => typeof n === 'string' && n.length > 0 && n.length <= MAX_FAN_NAME_LEN)
    )].slice(0, MAX_FANS_PER_UPLOAD);
    if (fans.length === 0) continue;

    const ts     = isObj && Number.isFinite(row.ts) && row.ts > 0 ? row.ts : 0; // 0 = 时间留空
    const player = isObj && typeof row.player === 'string' ? row.player.trim().slice(0, MAX_PLAYER_LEN) : '';
    const ip     = isObj && typeof row.ip === 'string' && row.ip.trim() ? row.ip.trim().slice(0, 45) : 'import';
    const tiles  = isObj && row.tiles != null ? sanitizeTiles(row.tiles) : {};
    const geo    = isObj ? sanitizeGeo(row.geo, ts) : {};

    inserts.push(env.DB
      .prepare('INSERT INTO upload_log (ts, ip, tiles, fans, geo, player) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(ts, ip, JSON.stringify(tiles), JSON.stringify(fans), JSON.stringify(geo), player));
  }
  if (inserts.length === 0) return json({ error: 'no valid hands' }, 400);

  // 分块批量插入（保守分块，避免超过 D1 batch 限制）
  const CHUNK = 50;
  for (let i = 0; i < inserts.length; i += CHUNK) {
    await env.DB.batch(inserts.slice(i, i + CHUNK));
  }

  // 从 upload_log 重算 fan_counts（每副去重）
  await env.DB.batch([
    env.DB.prepare('DELETE FROM fan_counts'),
    env.DB.prepare(`
      INSERT INTO fan_counts (name, count)
      SELECT value AS name, COUNT(*) AS count FROM (
        SELECT DISTINCT upload_log.id AS hid, j.value AS value
        FROM upload_log, json_each(upload_log.fans) j
      ) GROUP BY value
    `),
  ]);

  return json({ ok: true, imported: inserts.length });
}

// ── DELETE /api/fan-logs ───────────────────────────────────────────
// 按 id 删单条，或按 ip 删该 IP 全部；随后从剩余日志重算番型计数
async function deleteLogs(request, env) {
  if (!checkAdmin(request, env)) return adminError(env);

  const url = new URL(request.url);
  const id  = url.searchParams.get('id');
  const ip  = url.searchParams.get('ip');

  if (id != null && id !== '') {
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum)) return json({ error: 'invalid id' }, 400);
    await env.DB.prepare('DELETE FROM upload_log WHERE id = ?').bind(idNum).run();
  } else if (ip) {
    await env.DB.prepare('DELETE FROM upload_log WHERE ip = ?').bind(ip).run();
  } else {
    return json({ error: 'id or ip required' }, 400);
  }

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
// 用 Intl 把 UTC 时刻按 IANA 时区换算成本地时间——自动应用夏令时。
// 返回 {local, offset, tzAbbr}；时区非法或无效则返回 {}。
function computeLocal(tz, ts) {
  try {
    const d = new Date(ts);
    const p = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(d).reduce((a, x) => (a[x.type] = x.value, a), {});
    const hh = p.hour === '24' ? '00' : p.hour;     // en-CA 可能返回 24 时
    const local = `${p.year}-${p.month}-${p.day} ${hh}:${p.minute}:${p.second}`;
    const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +hh, +p.minute, +p.second);
    const offset = Math.round((asUTC - d.getTime()) / 60000);
    const tzAbbr = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
      .formatToParts(d).find(x => x.type === 'timeZoneName')?.value || null;
    return { local, offset, tzAbbr };
  } catch { return {}; }
}

// 从 Cloudflare 的 request.cf（按访客 IP 判定）取地点与 IANA 时区
function buildGeo(cf, ts) {
  cf = cf || {};
  const tz = cf.timezone || null;                 // IANA，如 America/New_York
  const geo = {
    country: cf.country || null, region: cf.region || null, city: cf.city || null,
    tz, offset: null, local: null, tzAbbr: null,
  };
  if (tz) Object.assign(geo, computeLocal(tz, ts));
  return geo;
}

// 校验导入的 geo：只保留合法字段；给了 tz 和有效 ts 但没给 local 时自动按夏令时算
function sanitizeGeo(g, ts) {
  if (!g || typeof g !== 'object' || Array.isArray(g)) return {};
  const str = (v, max) => (typeof v === 'string' && v.length) ? v.slice(0, max) : null;
  const geo = {
    country: str(g.country, 8), region: str(g.region, 40), city: str(g.city, 40),
    tz: str(g.tz, 40), local: str(g.local, 25), tzAbbr: str(g.tzAbbr, 12),
    offset: Number.isFinite(g.offset) ? g.offset : null,
  };
  if (geo.tz && !geo.local && ts > 0) Object.assign(geo, computeLocal(geo.tz, ts));
  return geo;
}

// 校验牌型：结构化 {concealed,win,melds} 或旧的平铺数组
function sanitizeTiles(bt) {
  const isCode = t => typeof t === 'string' && t.length > 0 && t.length <= MAX_TILE_CODE_LEN;
  const codeList = (arr, max) => Array.isArray(arr) ? arr.filter(isCode).slice(0, max) : [];
  if (bt && typeof bt === 'object' && !Array.isArray(bt)) {
    return {
      concealed: codeList(bt.concealed, MAX_TILES_PER_HAND),
      win: isCode(bt.win) ? bt.win : null,
      melds: (Array.isArray(bt.melds) ? bt.melds : []).slice(0, 6).map(m => codeList(m, 4)),
    };
  }
  return codeList(bt, MAX_TILES_PER_HAND);
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
