-- 番型计数（读取端用，实时更新）
CREATE TABLE IF NOT EXISTS fan_counts (
  name  TEXT    PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);

-- 上报审计日志（时间戳为 Unix ms，fans 为 JSON 数组）
CREATE TABLE IF NOT EXISTS upload_log (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  ts    INTEGER NOT NULL,
  ip    TEXT    NOT NULL,
  fans  TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_log_ts ON upload_log(ts);
CREATE INDEX IF NOT EXISTS idx_log_ip ON upload_log(ip);
