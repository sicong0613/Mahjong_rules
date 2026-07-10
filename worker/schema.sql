-- 番型计数：count = 含该番种的「牌副数」(m)，读取端用，实时更新
-- 频率 = count / (upload_log 总行数 n) = m/n
CREATE TABLE IF NOT EXISTS fan_counts (
  name  TEXT    PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);

-- 上报审计日志：一行 = 一副和牌
--   ts    Unix ms（服务端上传时刻，UTC）
--   ip    Cloudflare CF-Connecting-IP（服务端记录）
--   tiles JSON 数组，整副牌的牌码（如 ["1m","2m",...]，红五记作 0m/0p/0s）
--   fans  JSON 数组，该副牌去重后的番种名
--   geo   JSON，按 IP 判定的地点与本地时间：
--         {country,region,city,tz,offset,local,tzAbbr}
--         tz 为 IANA 时区名，local/offset/tzAbbr 已按夏令时换算
CREATE TABLE IF NOT EXISTS upload_log (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  ts    INTEGER NOT NULL,
  ip    TEXT    NOT NULL,
  tiles TEXT    NOT NULL DEFAULT '[]',
  fans  TEXT    NOT NULL,
  geo   TEXT    NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_log_ts ON upload_log(ts);
CREATE INDEX IF NOT EXISTS idx_log_ip ON upload_log(ip);
