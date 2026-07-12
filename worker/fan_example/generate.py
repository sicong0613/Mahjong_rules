"""
手牌记录批量生成器
直接修改下方 CONFIG 后运行：python generate.py
"""

import csv
import json
import random
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

# ──────────────────────────────────────────────────────────────
# 配置区：修改这里，然后运行脚本
# ──────────────────────────────────────────────────────────────
CONFIG = {
    "dist":   "fan_dist.csv",           # 番种分布 CSV 文件
    "count":  100,                      # 生成总数量
    "ip":     "1.1.1.1",               # IP 地址
    "player": "Admin",                     # 上传人，留 None 表示空
    "start":  "1970-01-01T00:00:00",   # 时间范围开始（UTC）
    "end":    "1970-01-01T00:00:01",   # 时间范围结束（UTC）
    "tz":     "Europe/London",          # 时区名（IANA 格式，如 America/New_York、Asia/Shanghai）
    "offset": "UTC+0",               # UTC 偏移，如 UTC+8、UTC-5、UTC+5:30
#    "offset": "UTC+8"      # 北京/上海
#    "offset": "UTC-5"      # EST
#    "offset": "UTC-4"      # EDT
#    "offset": "UTC+5:30"   # 印度
#    "offset": "UTC+0"      # 伦敦

    "output": "output1.json",            # 输出文件名

    # 必须共存的番种：key 只能出现在含有 value 列表中所有番种的手牌里
    "required_with": {
        "一发": ["立直"],
        "立直": ["门前清"],
        "门清自摸和": ["门前清"],
    },
}
# ──────────────────────────────────────────────────────────────

# ──────────────────────────────────────────────────────────────
# 冲突规则表（双向自动推导）
# ──────────────────────────────────────────────────────────────
_CONFLICT_RULES = {
    "清一色": ["混一色", "三色三步高", "三色三同顺", "三色三节高", "花龙", "组合龙", "全不靠", "五门齐"],
    "混一色": ["清一色", "三色三步高", "三色三同顺", "三色三节高", "花龙", "组合龙", "全不靠", "五门齐"],
    "碰碰和": ["平和", "七对子", "二杯口", "三色三步高", "三色三同顺", "三色三节高", "花龙", "组合龙"],
    "平和":   ["碰碰和", "七对子", "门风刻", "圈风刻", "箭刻"],
    "七对子": ["门前清", "碰碰和", "平和", "二杯口", "三色三步高", "三色三同顺", "三色三节高", "花龙", "组合龙", "全不靠"],
    "全不靠": ["三色三步高", "三色三同顺", "花龙", "一色三步高", "清龙", "碰碰和", "混一色", "七对子", "清一色", "无番和", "小于5", "平和", "断幺", "门前清", "五门齐", "圈风刻", "门风刻", "箭刻"],
    "组合龙": ["三色三步高", "三色三同顺", "花龙", "一色三步高", "清龙", "碰碰和", "混一色", "七对子", "清一色", "无番和", "小于5", "平和", "断幺", "门前清"],
    "五门齐": ["清一色", "混一色"],
    "花龙": ["清一色", "混一色", "三色三步高", "三色三同顺", "三色三节高", "组合龙"],
    "无番和": ["三色三步高", "三色三同顺", "花龙", "一色三步高", "清龙", "碰碰和", "五门齐", "混一色", "全不靠", "组合龙", "七对子", "清一色", "无番和", "小于5", "立直", "平和", "役牌", "门前清", "断幺", "一发", "门清自摸和"],
    "小于5": ["三色三步高", "三色三同顺", "花龙", "一色三步高", "清龙", "圈风刻", "门风刻", "箭刻", "五门齐"],
    "断幺": ["圈风刻", "门风刻", "箭刻", "混一色", "五门齐", ],
}

# 构建双向冲突集合，方便 O(1) 查询
_CONFLICT_SET: set[frozenset] = set()
for a, bs in _CONFLICT_RULES.items():
    for b in bs:
        _CONFLICT_SET.add(frozenset([a, b]))


def find_conflict(fans: list[str]) -> tuple[str, str] | None:
    """返回第一对冲突番种，无冲突返回 None。"""
    for i in range(len(fans)):
        for j in range(i + 1, len(fans)):
            if frozenset([fans[i], fans[j]]) in _CONFLICT_SET:
                return (fans[i], fans[j])
    return None


# ──────────────────────────────────────────────────────────────
# CSV 解析
# ──────────────────────────────────────────────────────────────
def parse_dist(path: str) -> list[dict]:
    items = []
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=2):
            name = row.get("fan", "").strip()
            freq_raw = row.get("frequency", "").strip().rstrip("%")
            if not name or name.startswith("#"):
                continue
            try:
                freq = float(freq_raw)
            except ValueError:
                print(f"  [警告] 第 {i} 行频率无效，已跳过: {row}", file=sys.stderr)
                continue
            if freq <= 0:
                continue
            items.append({"name": name, "freq": freq})
    if not items:
        raise ValueError("CSV 中没有有效番种数据")
    return items


# ──────────────────────────────────────────────────────────────
# 最大余数法分配整数数量
# ──────────────────────────────────────────────────────────────
def allocate(items: list[dict], n: int) -> list[dict]:
    total_freq = sum(x["freq"] for x in items)
    result = []
    for x in items:
        exact = x["freq"] / total_freq * n
        result.append({**x, "count": int(exact), "rem": exact - int(exact)})
    remainder = n - sum(r["count"] for r in result)
    result.sort(key=lambda r: r["rem"], reverse=True)
    for i in range(remainder):
        result[i]["count"] += 1
    return result


# ──────────────────────────────────────────────────────────────
# 时间工具
# ──────────────────────────────────────────────────────────────
def local_str(ts_ms: int, offset_min: int) -> str:
    dt = datetime.fromtimestamp(ts_ms / 1000, tz=timezone(timedelta(minutes=offset_min)))
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def parse_utc_offset(s) -> int:
    """将 'UTC+8' / 'UTC-5' / 'UTC+5:30' 或整数（分钟）转为分钟数。"""
    if isinstance(s, int):
        return s
    s = str(s).strip().upper().replace("UTC", "").strip()
    if not s or s in ("+", "-"):
        return 0
    sign = -1 if s.startswith("-") else 1
    s = s.lstrip("+-")
    if ":" in s:
        h, m = s.split(":", 1)
        return sign * (int(h) * 60 + int(m))
    return sign * int(s) * 60


def parse_dt(s: str) -> datetime:
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    raise ValueError(f"无法解析时间: {s!r}，请使用 ISO 格式如 2026-01-01T00:00:00")


# ──────────────────────────────────────────────────────────────
# 多番型分配（CSV 总计 > count 时使用）
# ──────────────────────────────────────────────────────────────
def _assign_multi_fan(
    items: list[dict], n: int, required_with: dict | None = None
) -> tuple[list[list], list]:
    """
    把各番种精确数量的番牌分配到 n 个手牌槽里。
    优先填入番种最少的槽，遇到冲突则跳过。
    required_with: {依赖番: [前置番, ...]}，依赖番只能进入已含所有前置番的槽。
    返回 (buckets, unplaced)。
    """
    required_with = required_with or {}

    fan_list = [item["name"] for item in items for _ in range(item["count"])]

    # 拓扑排序：按依赖深度升序，保证每个番种被放置时前置番已在槽里
    # 例如 门前清(0) → 立直(1) → 一发(2)
    _level_cache: dict[str, int] = {}
    def fan_level(f: str) -> int:
        if f in _level_cache:
            return _level_cache[f]
        deps = required_with.get(f, [])
        _level_cache[f] = (max(fan_level(d) for d in deps) + 1) if deps else 0
        return _level_cache[f]

    def conflict_count(f: str) -> int:
        return sum(1 for pair in _CONFLICT_SET if f in pair)

    random.shuffle(fan_list)
    # 主键：依赖深度升序（前置先放）；次键：冲突数降序（最难放的先抢槽）
    fan_list.sort(key=lambda f: (fan_level(f), -conflict_count(f)))

    buckets: list[list] = [[] for _ in range(n)]
    unplaced: list[str] = []

    for fan in fan_list:
        required = required_with.get(fan, [])
        best_size = float("inf")
        candidates: list[int] = []
        for i, b in enumerate(buckets):
            if fan in b or find_conflict(b + [fan]):
                continue
            if required and not all(p in b for p in required):
                continue  # 不满足前置条件
            sz = len(b)
            if sz < best_size:
                best_size = sz
                candidates = [i]
            elif sz == best_size:
                candidates.append(i)
        if candidates:
            buckets[random.choice(candidates)].append(fan)
        else:
            unplaced.append(fan)

    return buckets, unplaced


# ──────────────────────────────────────────────────────────────
# 主生成逻辑
# ──────────────────────────────────────────────────────────────
def generate(
    dist_path: str,
    count: int,
    ip: str,
    player: str | None,
    start: str,
    end: str,
    tz: str,
    offset: int,
    required_with: dict | None = None,
) -> list[dict]:
    from collections import Counter

    items = parse_dist(dist_path)
    total_csv = sum(round(x["freq"]) for x in items)

    if total_csv > count:
        # ── 多番型模式：保持 CSV 精确数量，超出部分合并进已有手牌 ──
        item_counts = [{"name": x["name"], "count": round(x["freq"])} for x in items]
        buckets, unplaced = _assign_multi_fan(item_counts, count, required_with)

        if unplaced:
            print(
                f"  [警告] {len(unplaced)} 个番种无法放置（所有手牌均冲突）："
                f"{unplaced[:5]}{'…' if len(unplaced) > 5 else ''}",
                file=sys.stderr,
            )

        fan_counts = Counter(f for b in buckets for f in b)
        multi_n  = sum(1 for b in buckets if len(b) > 1)
        empty_n  = sum(1 for b in buckets if len(b) == 0)
        print(f"\nCSV 总计 {total_csv} > {count}，启用多番型模式")
        if multi_n:  print(f"  {multi_n} 副手牌含 2+ 番种")
        if empty_n:  print(f"  {empty_n} 副手牌无番种（冲突导致无法放置）")
        print(f"\n分布统计（共 {count} 手）：")
        print(f"  {'番种':<12} {'出现次数':>6}  目标")
        print("  " + "-" * 30)
        for item in sorted(item_counts, key=lambda x: -x["count"]):
            actual = fan_counts.get(item["name"], 0)
            mark = "" if actual == item["count"] else " !"
            print(f"  {item['name']:<12} {actual:>6}  ({item['count']}){mark}")

    else:
        # ── 归一化模式：按比例缩放，每手牌一个番种 ──
        allocated = allocate(items, count)
        allocated_nonzero = [a for a in allocated if a["count"] > 0]
        slots = [a["name"] for a in allocated_nonzero for _ in range(a["count"])]
        random.shuffle(slots)
        buckets = [[s] for s in slots]

        print(f"\nCSV 总计 {total_csv} ≤ {count}，启用归一化模式")
        print(f"\n分布统计（共 {count} 手）：")
        print(f"  {'番种':<12} {'数量':>5}  实际频率")
        print("  " + "-" * 32)
        for a in sorted(allocated_nonzero, key=lambda x: -x["count"]):
            print(f"  {a['name']:<12} {a['count']:>5}  {a['count']/count*100:5.1f}%")

    # 生成时间戳（随机，排序降序）
    start_ms = int(parse_dt(start).timestamp() * 1000)
    end_ms   = int(parse_dt(end).timestamp() * 1000)
    if start_ms >= end_ms:
        raise ValueError("start 必须早于 end")
    timestamps = sorted(
        [random.randint(start_ms, end_ms) for _ in range(count)],
        reverse=True,
    )

    records = []
    for ts, bucket in zip(timestamps, buckets):
        records.append({
            "ts": ts,
            "player": player if player else None,
            "ip": ip,
            "fans": bucket,
            "tiles": [],
            "geo": {
                "country": "",
                "region": "",
                "city": "",
                "tz": tz,
                "offset": offset,
                "local": local_str(ts, offset),
                "tzAbbr": "",
            },
        })
    return records


if __name__ == "__main__":
    _here = Path(__file__).parent
    dist_file = Path(CONFIG["dist"])
    if not dist_file.is_absolute():
        dist_file = _here / dist_file
    out_path_cfg = Path(CONFIG["output"])
    if not out_path_cfg.is_absolute():
        CONFIG["output"] = str(_here / out_path_cfg)

    if not dist_file.exists():
        print(f"错误：找不到 {dist_file}", file=sys.stderr)
        sys.exit(1)

    try:
        records = generate(
            dist_path=str(dist_file),
            count=CONFIG["count"],
            ip=CONFIG["ip"],
            player=CONFIG["player"],
            start=CONFIG["start"],
            end=CONFIG["end"],
            tz=CONFIG["tz"],
            offset=parse_utc_offset(CONFIG["offset"]),
            required_with=CONFIG.get("required_with"),
        )
    except ValueError as e:
        print(f"错误：{e}", file=sys.stderr)
        sys.exit(1)

    out_path = Path(CONFIG["output"])  # already resolved above
    out_path.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n已生成 {len(records)} 条记录 → {out_path}")
