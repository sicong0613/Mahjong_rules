/**
 * village.js — 村规计番后处理器
 *
 * 依赖（需在此文件之前加载）：
 *   fan_calculator.js + calculator.js + data/fans.js + data/wasm_name_map.js
 *
 * 使用：
 *   await Calculator.ready;
 *   const result = VillageCalc.compute({ hand, tile, isTsumo, melds, lastTile, kongWin, wallLast, riverLast });
 *
 * 参数说明：
 *   hand          string[]   服务器发来的 winner.hand（含摸牌时有14张，荣和时13张）
 *   tile          string     和牌张（格式如 "1m" "7z"）
 *   isTsumo       bool       是否自摸
 *   dealerWin     bool       和牌者是否庄家（也兼容 isDealer/dealer/isDealerWin/dealer_win/zhuangWin，用于点棒映射）
 *   melds         object[]   副露列表 {type, tiles}，type: chi/peng/gang/angang/jiagang
 *   lastTile      bool       和绝张
 *   kongWin       bool       杠上开花
 *   gangKaiChong  bool       杠上开铳
 *   qiangGang     bool       抢杠
 *   wallLast      bool       海底捞月（自摸最后一张）
 *   riverLast     bool       河底捞鱼（荣和最后一张）
 *   tianHe        bool       天和（也兼容 fan_tian_he）
 *   diHe          bool       地和（也兼容 fan_di_he）
 *   renHe         bool       人和（也兼容 fan_ren_he）
 *   liujuManguan  bool       流局满贯
 *   honba         number     本场数；荣和每本场+300，自摸每家+100
 *   prevalentWind 0-3        圈风（东南西北；暂不新增逻辑，仅透传）
 *   seatWind      0-3        门风（东南西北；暂不新增逻辑，仅透传）
 */

const VillageCalc = (() => {
  'use strict';

  // ─── 牌字符串 → WASM tile code ───────────────────────────────
  // 万: 1m-9m=0x11-0x19  条: 1s-9s=0x21-0x29  饼: 1p-9p=0x31-0x39
  // 字: 东南西北中发白=0x41-0x47
  function strToCode(t) {
    if (!t) return 0;
    const n = parseInt(t);
    const s = t.slice(-1);
    if (s === 'm') return (1 << 4) | n;
    if (s === 's') return (2 << 4) | n;
    if (s === 'p') return (3 << 4) | n;
    if (s === 'z') return (4 << 4) | n;
    return 0;
  }

  // 字牌代号转换（game 格式 → Calculator 字符串格式）
  const Z_TO_CALC = { '1z':'E','2z':'S','3z':'W','4z':'N','5z':'C','6z':'F','7z':'P' };
  function toCalcStr(tiles) {
    return tiles.map(t => t.endsWith('z') ? Z_TO_CALC[t] : t).join(' ');
  }

  // ─── 副露 → packs ────────────────────────────────────────────
  function buildPacks(melds) {
    return melds.map(m => {
      const t = m.tiles[0];
      if (m.type === 'chi')     return Calculator.makeChow(toCalcStr([m.tiles[1]]), 1);
      if (m.type === 'peng')    return Calculator.makePung(toCalcStr([t]), 1);
      if (m.type === 'gang')    return Calculator.makeKong(toCalcStr([t]), 1, false);
      if (m.type === 'angang')  return Calculator.makeKong(toCalcStr([t]), 1, true);
      if (m.type === 'jiagang') return Calculator.makeKong(toCalcStr([t]), 1, false);
      return null;
    }).filter(Boolean);
  }

  // ─── 是否有公开副露（吃/碰/明杠/加杠；暗杠不破坏门清）─────
  function hasOpenMeld(melds) {
    return melds.some(m => m.type === 'chi' || m.type === 'peng' || m.type === 'gang' || m.type === 'jiagang');
  }

  // ─── 必然门清番型（自摸时不额外追加门前清）───────────────────
  const NECESSARILY_CONCEALED = new Set([
    '十三幺','七对子','连七对','七星不靠','全不靠','九莲宝灯','四暗刻单骑','二杯口',
  ]);

  function fanValue(name, fallback) {
    return (typeof FANS_DATA !== 'undefined' && FANS_DATA.find(f => f.name === name))?.fan ?? fallback;
  }

  // ─── 番数 → 点棒映射（与网页计番器保持一致）────────────────────
  const FAN_POINTS_TABLE = [
    { max:  2, ron_d:   1500, tsumo_d:   500, ron_n:  1000, tsumo_nd:   500, tsumo_nn:   300 },
    { max:  3, ron_d:   2000, tsumo_d:   700, ron_n:  1300, tsumo_nd:   700, tsumo_nn:   400 },
    { max:  4, ron_d:   2400, tsumo_d:   800, ron_n:  1600, tsumo_nd:   800, tsumo_nn:   400 },
    { max:  5, ron_d:   2900, tsumo_d:  1000, ron_n:  2000, tsumo_nd:  1000, tsumo_nn:   500 },
    { max:  6, ron_d:   3400, tsumo_d:  1200, ron_n:  2300, tsumo_nd:  1200, tsumo_nn:   600 },
    { max:  7, ron_d:   3900, tsumo_d:  1300, ron_n:  2600, tsumo_nd:  1300, tsumo_nn:   700 },
    { max:  8, ron_d:   4800, tsumo_d:  1600, ron_n:  3200, tsumo_nd:  1600, tsumo_nn:   800 },
    { max:  9, ron_d:   5800, tsumo_d:  2000, ron_n:  3900, tsumo_nd:  2000, tsumo_nn:  1000 },
    { max: 10, ron_d:   6800, tsumo_d:  2300, ron_n:  4500, tsumo_nd:  2300, tsumo_nn:  1200 },
    { max: 11, ron_d:   7700, tsumo_d:  2800, ron_n:  5200, tsumo_nd:  2600, tsumo_nn:  1300 },
    { max: 12, ron_d:   8700, tsumo_d:  2900, ron_n:  5800, tsumo_nd:  2900, tsumo_nn:  1500 },
    { max: 13, ron_d:   9600, tsumo_d:  3200, ron_n:  6400, tsumo_nd:  3200, tsumo_nn:  1600 },
    { max: 14, ron_d:  10600, tsumo_d:  3600, ron_n:  7100, tsumo_nd:  3600, tsumo_nn:  1800 },
    { max: 15, ron_d:  11600, tsumo_d:  3900, ron_n:  7700, tsumo_nd:  3900, tsumo_nn:  2000 },
    { max: 21, ron_d:  12000, tsumo_d:  4000, ron_n:  8000, tsumo_nd:  4000, tsumo_nn:  2000 },
    { max: 27, ron_d:  18000, tsumo_d:  6000, ron_n: 12000, tsumo_nd:  6000, tsumo_nn:  3000 },
    { max: 35, ron_d:  24000, tsumo_d:  8000, ron_n: 16000, tsumo_nd:  8000, tsumo_nn:  4000 },
    { max: 49, ron_d:  36000, tsumo_d: 12000, ron_n: 24000, tsumo_nd: 12000, tsumo_nn:  6000 },
    { max: Infinity, ron_d: 48000, tsumo_d: 16000, ron_n: 32000, tsumo_nd: 16000, tsumo_nn: 8000 },
  ];

  const YAKUMAN_BASE = { ron_d: 48000, tsumo_d: 16000, ron_n: 32000, tsumo_nd: 16000, tsumo_nn: 8000 };

  function formatPointRow(row, selfDrawn, dealerWin, honba = 0) {
    const fmt = n => n.toLocaleString();
    const h = Math.max(0, Number(honba) || 0);
    const honbaText = h > 0 ? `，含${h}本场` : '';
    if (!selfDrawn &&  dealerWin) return `${fmt(row.ron_d + h * 300)} 点（点炮给庄${honbaText}）`;
    if ( selfDrawn &&  dealerWin) return `${fmt(row.tsumo_d + h * 100)} 点 all（庄·自摸${honbaText}）`;
    if (!selfDrawn && !dealerWin) return `${fmt(row.ron_n + h * 300)} 点（点炮给闲${honbaText}）`;
    return `庄 ${fmt(row.tsumo_nd + h * 100)} / 闲各 ${fmt(row.tsumo_nn + h * 100)} 点${honbaText}`;
  }

  function lookupPoints(result, selfDrawn, dealerWin, honba = 0) {
    if (!result || result.total < 2) return null;
    const highFans = (result.fans || []).filter(f => f.value >= 64);
    if (highFans.length > 0) {
      const mult = highFans.reduce((sum, f) => sum + (f.value >= 88 ? 2 : 1) * (f.count ?? 1), 0);
      const row = {
        ron_d:    YAKUMAN_BASE.ron_d    * mult,
        tsumo_d:  YAKUMAN_BASE.tsumo_d  * mult,
        ron_n:    YAKUMAN_BASE.ron_n    * mult,
        tsumo_nd: YAKUMAN_BASE.tsumo_nd * mult,
        tsumo_nn: YAKUMAN_BASE.tsumo_nn * mult,
      };
      return { ...row, limitMultiplier: mult, honba, text: formatPointRow(row, selfDrawn, dealerWin, honba) };
    }
    const row = FAN_POINTS_TABLE.find(r => result.total <= r.max);
    return row ? { ...row, honba, text: formatPointRow(row, selfDrawn, dealerWin, honba) } : null;
  }

  function withDisplayFields(result, selfDrawn, dealerWin, honba = 0) {
    const total = result.fans.reduce((s, f) => s + f.value * (f.count ?? 1), 0);
    const normalized = { ...result, total };
    const points = lookupPoints(normalized, selfDrawn, dealerWin, honba);
    const fanText = (normalized.fans || [])
      .map(f => `${f.name}${(f.count ?? 1) > 1 ? `×${f.count}` : ''} ${f.value * (f.count ?? 1)}番`)
      .join('、');
    return {
      ...normalized,
      points,
      pointsText: points?.text ?? null,
      pointText: points?.text ?? null,
      scoreText: points?.text ?? null,
      fanText,
      totalText: `${total}番`,
    };
  }

  // ─── 村规：门清自摸升格 ───────────────────────────────────────
  function applyMenQingTsumo(isTsumo, melds, result) {
    if (!isTsumo || hasOpenMeld(melds)) return result;
    const fans = [...result.fans];

    // 有副露自摸给"非门清自摸"；门清自摸给"门清自摸"；此处升格前者
    const idx = fans.findIndex(f => f.name === '非门清自摸');
    if (idx !== -1) fans[idx] = { ...fans[idx], name: '门清自摸' };

    // 门清自摸时再追加"门前清"（必然门清番型除外）
    if (fans.some(f => f.name === '门清自摸') &&
        !fans.some(f => f.name === '门前清') &&
        !fans.some(f => NECESSARILY_CONCEALED.has(f.name))) {
      fans.push({ fan: 2, count: 1, value: 2, name: '门前清' });
    }
    return fans === result.fans ? result : { ...result, fans };
  }

  // ─── 手动特殊状态后处理（对应计番器勾选框，门风/圈风/立直除外）────
  function applyCheckedRules(opts, result) {
    const fans = [...result.fans];

    // 天和 / 地和 / 人和：排斥门清相关自摸番
    const specialFan = opts.tianHe ? '天和' : opts.diHe ? '地和' : opts.renHe ? '人和' : null;
    if (specialFan) {
      const excluded = new Set(['门前清', '门清自摸', '非门清自摸', '天和', '地和', '人和']);
      const kept = fans.filter(f => !excluded.has(f.name));
      const v = fanValue(specialFan, 64);
      kept.unshift({ fan: v, count: 1, value: v, name: specialFan });
      return { ...result, fans: kept };
    }

    if (opts.kongWin && !fans.some(f => f.name === '杠上开花')) {
      const v = fanValue('杠上开花', 8);
      fans.push({ fan: v, count: 1, value: v, name: '杠上开花' });
    }

    // 月见花开 = 杠上开花 + 海底捞月同时成立
    if (opts.kongWin && opts.wallLast) {
      const hasKong = fans.some(f => f.name === '杠上开花');
      const hasSea  = fans.some(f => f.name === '海底捞月');
      if (hasKong && hasSea) {
        const kept = fans.filter(f => f.name !== '杠上开花' && f.name !== '海底捞月');
        kept.push({ fan: fanValue('月见花开', 32), count: 1, value: fanValue('月见花开', 32), name: '月见花开' });
        return { ...result, fans: kept };
      }
    }

    // 杠振 = 杠上开铳 + 河底捞鱼；杠上开铳单独成立时 8 番
    if (opts.gangKaiChong) {
      if (opts.riverLast) {
        const kept = fans.filter(f => f.name !== '河底捞鱼' && f.name !== '海底捞月');
        const v = fanValue('杠振', 32);
        kept.push({ fan: v, count: 1, value: v, name: '杠振' });
        return { ...result, fans: kept };
      }
      const v = fanValue('杠上开铳', 8);
      fans.push({ fan: v, count: 1, value: v, name: '杠上开铳' });
    }

    if (opts.qiangGang) {
      const v = fanValue('抢杠和', 8);
      fans.push({ fan: v, count: 1, value: v, name: '抢杠和' });
    }

    return { ...result, fans };
  }

  // ─── 四暗刻单骑 ───────────────────────────────────────────────
  // 条件：无公开副露 + WASM 检测到四暗刻 + 和牌张在13张立牌中恰好出现1次（即雀头）
  function detectSiAnKeShanJi(standing13, tile, melds, result) {
    if (hasOpenMeld(melds)) return result;
    if (!result.fans.some(f => f.name === '四暗刻')) return result;
    if (standing13.filter(t => t === tile).length !== 1) return result;

    const excluded = new Set(['四暗刻', '门前清', '听单张', '四暗刻单骑']);
    const kept = result.fans.filter(f => !excluded.has(f.name));
    const v = (typeof FANS_DATA !== 'undefined' && FANS_DATA.find(f => f.name === '四暗刻单骑'))?.fan ?? 88;
    kept.unshift({ fan: v, count: 1, value: v, name: '四暗刻单骑' });
    return { ...result, fans: kept };
  }

  // ─── 漏计番型修正（喜相逢/连6/老少副）────────────────────────
  // WASM 只计一次，此处以全手牌频率表重算，上限 2 次
  function fixUnderCountedFans(standing13, tile, melds, result) {
    const TARGETS = new Set(['喜相逢', '连6', '老少副']);
    if (!result.fans.some(f => TARGETS.has(f.name) && f.count < 2)) return result;

    const freq = new Map();
    const add = c => freq.set(c, (freq.get(c) || 0) + 1);
    for (const t of standing13) add(strToCode(t));
    add(strToCode(tile));
    for (const m of melds) for (const t of m.tiles) add(strToCode(t));

    const maxCount = name => {
      const f = new Map(freq);
      const get = c => f.get(c) || 0;
      const eat = (codes, n) => { for (const c of codes) f.set(c, get(c) - n); };
      let total = 0;
      if (name === '喜相逢') {
        for (let r = 1; r <= 7; r++)
          for (let a = 1; a <= 2; a++) for (let b = a + 1; b <= 3; b++) {
            const cA = [(a<<4)|r, (a<<4)|(r+1), (a<<4)|(r+2)];
            const cB = [(b<<4)|r, (b<<4)|(r+1), (b<<4)|(r+2)];
            const n = Math.min(Math.min(...cA.map(get)), Math.min(...cB.map(get)));
            if (n > 0) { eat([...cA, ...cB], n); total += n; }
          }
      } else if (name === '连6') {
        for (let s = 1; s <= 3; s++) for (let r = 1; r <= 4; r++) {
          const codes = [r,r+1,r+2,r+3,r+4,r+5].map(k => (s<<4)|k);
          const c1 = Math.min(get(codes[0]), get(codes[1]), get(codes[2]));
          const c2 = Math.min(get(codes[3]), get(codes[4]), get(codes[5]));
          const n = Math.min(c1, c2);
          if (n > 0) { eat(codes, n); total += n; }
        }
      } else { // 老少副
        for (let s = 1; s <= 3; s++) {
          const lo = [1,2,3].map(k => (s<<4)|k);
          const hi = [7,8,9].map(k => (s<<4)|k);
          const n = Math.min(Math.min(...lo.map(get)), Math.min(...hi.map(get)));
          if (n > 0) { eat([...lo, ...hi], n); total += n; }
        }
      }
      return Math.min(total, 2);
    };

    let changed = false;
    const fans = result.fans.map(f => {
      if (!TARGETS.has(f.name) || f.count >= 2) return f;
      const max = maxCount(f.name);
      if (max <= f.count) return f;
      changed = true;
      return { ...f, count: max };
    });
    return changed ? { ...result, fans } : result;
  }

  // ─── 二杯口检测 ───────────────────────────────────────────────
  // 路径A（七对子）/ 路径B（一般高×2）/ 路径C（一色双龙会）
  function detectErBeiKou(standing13, tile, melds, result, isTsumo, prevalentWind, seatWind) {
    if (hasOpenMeld(melds)) return result;
    if (result.fans.some(f => f.name === '一色双龙会'))
      return detectErBeiKouYiSe(result);
    if (result.fans.some(f => f.name === '七对子'))
      return detectErBeiKouQiDui(standing13, tile, melds, result, isTsumo, prevalentWind, seatWind);
    const yg = result.fans.find(f => f.name === '一般高');
    if (yg && yg.count >= 2)
      return detectErBeiKouSeq(result);
    return result;
  }

  function _erbVal() {
    return (typeof FANS_DATA !== 'undefined' && FANS_DATA.find(f => f.name === '二杯口'))?.fan ?? 32;
  }

  // 路径C：一色双龙会即二杯口，移除门前清
  function detectErBeiKouYiSe(result) {
    const v = _erbVal();
    const fans = result.fans.filter(f => f.name !== '门前清');
    fans.unshift({ fan: v, count: 1, value: v, name: '二杯口' });
    return { ...result, fans };
  }

  // 路径B：一般高×2，移除被吸收的番种
  function detectErBeiKouSeq(result) {
    const v = _erbVal();
    const drop = new Set(['一般高', '门前清']);
    const fans = result.fans.filter(f => !drop.has(f.name));
    fans.unshift({ fan: v, count: 1, value: v, name: '二杯口' });
    return { ...result, fans };
  }

  // 路径A：七对子 → 以一副明吃重跑 WASM
  function detectErBeiKouQiDui(standing13, tile, melds, result, isTsumo, prevalentWind, seatWind) {
    const allTiles = [...standing13, tile]; // 14 tiles

    // 字牌对子须 ≤ 1
    const freq14 = new Map();
    for (const t of allTiles) freq14.set(t, (freq14.get(t) || 0) + 1);
    let honorPairs = 0;
    for (const [t, cnt] of freq14) {
      if (t.endsWith('z') && cnt >= 2) honorPairs++;
    }
    if (honorPairs > 1) return result;

    // 贪婪扫描两套顺子对（在全14张中扫描）
    const tempFreq = new Map(freq14);
    let seq1 = null, seq2 = null;
    const SUITS = ['m', 's', 'p']; // WASM suit 1/2/3
    outer: for (const s of SUITS) {
      for (let r = 1; r <= 7; r++) {
        const t1 = `${r}${s}`, t2 = `${r+1}${s}`, t3 = `${r+2}${s}`;
        if ((tempFreq.get(t1)||0) >= 2 &&
            (tempFreq.get(t2)||0) >= 2 &&
            (tempFreq.get(t3)||0) >= 2) {
          tempFreq.set(t1, tempFreq.get(t1) - 2);
          tempFreq.set(t2, tempFreq.get(t2) - 2);
          tempFreq.set(t3, tempFreq.get(t3) - 2);
          if (!seq1) seq1 = [t1, t2, t3];
          else { seq2 = [t1, t2, t3]; break outer; }
        }
      }
    }
    if (!seq1 || !seq2) return result;

    // 剩余须恰好是一个对子（雀头）
    const leftover = [...tempFreq.entries()].filter(([, v]) => v > 0);
    if (leftover.length !== 1 || leftover[0][1] !== 2) return result;

    // 从13张立牌中移除 seq1，改为明吃 pack
    const newStanding = [...standing13];
    for (const t of seq1) {
      const idx = newStanding.indexOf(t);
      if (idx !== -1) newStanding.splice(idx, 1);
    }
    const openPack = Calculator.makePackRaw(1, 1, strToCode(seq1[1]));

    let combo = Calculator.calculate({
      standing: newStanding.map(strToCode),
      winTile:  strToCode(tile),
      packs:    [openPack],
      selfDrawn: isTsumo,
      prevalentWind: prevalentWind ?? 0,
      seatWind:      seatWind ?? 0,
    });
    if (combo.error) return result;

    // 规范化 combo 番名
    if (typeof WASM_NAME_MAP !== 'undefined') {
      combo = { ...combo, fans: combo.fans.map(f => WASM_NAME_MAP[f.name] ? { ...f, name: WASM_NAME_MAP[f.name] } : f) };
    }
    // 修正明吃导致的漏计（以原始全手牌频率计算）
    combo = fixUnderCountedFans(standing13, tile, [], combo);

    const drop = new Set(['一般高', '非门清自摸', '自摸', '门前清', '门清自摸', '无番和']);
    const fans = combo.fans.filter(f => !drop.has(f.name));

    const v = _erbVal();
    fans.unshift({ fan: v, count: 1, value: v, name: '二杯口' });

    // 二杯口必然门清，自摸时补门清自摸
    if (isTsumo) fans.push({ fan: 2, count: 1, value: 2, name: '门清自摸' });

    return { ...result, fans };
  }

  // ─── 九莲宝灯检测 ─────────────────────────────────────────────
  function detectJiuLian(standing13, tile, melds, result) {
    if (melds.length > 0) return result;
    const all14 = [...standing13, tile];
    const suit = all14[0]?.slice(-1);
    if (!suit || !['m','s','p'].includes(suit)) return result;
    if (!all14.every(t => t && t.endsWith(suit))) return result;

    const cnt = new Array(10).fill(0);
    for (const t of all14) cnt[parseInt(t)]++;
    const base = [0,3,1,1,1,1,1,1,1,3];
    for (let r = 1; r <= 9; r++) if (cnt[r] < base[r]) return result;

    const excluded = new Set(['清一色', '门前清', '幺九刻', '九莲宝灯']);
    const kept = result.fans.filter(f => !excluded.has(f.name));
    const jl = { fan: 88, count: 1, value: 88, name: '九莲宝灯' };
    return { fans: [jl, ...kept], total: kept.reduce((s, f) => s + f.value * f.count, 0) + 88 };
  }

  // ─── 纯全带幺九检测 ───────────────────────────────────────────
  function detectChunQuanDaiYaoJiu(standing13, tile, melds, result) {
    if (!result.fans.some(f => f.name === '全带幺')) return result;
    const allTiles = [...standing13, tile, ...melds.flatMap(m => m.tiles)];
    if (allTiles.some(t => t && t.endsWith('z'))) return result;

    const fans = result.fans.filter(f => f.name !== '全带幺' && f.name !== '无字');
    fans.push({ fan: 24, count: 1, value: 24, name: '纯全带幺九' });
    return { ...result, fans, total: fans.reduce((s, f) => s + f.value * f.count, 0) };
  }

  // ─── fans.js 番值覆盖 ─────────────────────────────────────────
  function applyFansJsValues(result) {
    if (typeof FANS_DATA === 'undefined') return result;
    const map = new Map();
    for (const f of FANS_DATA) {
      map.set(f.name, f.fan);
      if (f.nameAlt) for (const alt of f.nameAlt) if (!map.has(alt)) map.set(alt, f.fan);
    }
    const fans = result.fans.map(f => {
      const v = map.get(f.name);
      return v !== undefined ? { ...f, value: v } : f;
    });
    return { ...result, fans, total: fans.reduce((s, f) => s + f.value * f.count, 0) };
  }

  // ─── 主计算函数 ───────────────────────────────────────────────
  function compute(params) {
    const {
      hand, tile, melds, prevalentWind, seatWind,
      dealerWin,
      isDealer,
      isDealerWin,
      dealer,
      dealer_win,
      zhuangWin,
      lastTile = false,
      kongWin = false,
      gangKaiChong = false,
      qiangGang = false,
      wallLast = false,
      riverLast = false,
      tianHe = false,
      diHe = false,
      renHe = false,
      tian_he = false,
      di_he = false,
      ren_he = false,
      fan_tian_he = false,
      fan_di_he = false,
      fan_ren_he = false,
      liujuManguan = false,
      liuju_manguan = false,
      honba = 0,
    } = params;
    const opts = {
      lastTile: !!lastTile,
      kongWin: !!kongWin,
      gangKaiChong: !!gangKaiChong,
      qiangGang: !!qiangGang,
      wallLast: !!wallLast,
      riverLast: !!riverLast,
      tianHe: !!(tianHe || tian_he || fan_tian_he),
      diHe: !!(diHe || di_he || fan_di_he),
      renHe: !!(renHe || ren_he || fan_ren_he),
      liujuManguan: !!(liujuManguan || liuju_manguan),
    };
    let isTsumo = !!(params.isTsumo ?? params.selfDrawn);
    const winnerIsDealer = !!(dealerWin ?? isDealerWin ?? isDealer ?? dealer_win ?? zhuangWin ?? dealer ?? (seatWind === 0));

    // 复刻计番器勾选框联动：这些状态会强制自摸/非自摸，或排斥末张类条件。
    if (opts.tianHe) {
      isTsumo = true;
      opts.lastTile = false;
      opts.wallLast = false;
      opts.riverLast = false;
    } else if (opts.diHe) {
      isTsumo = true;
      opts.wallLast = false;
      opts.riverLast = false;
    } else if (opts.renHe) {
      isTsumo = false;
      opts.lastTile = false;
      opts.wallLast = false;
      opts.riverLast = false;
    }
    if (opts.kongWin || opts.wallLast) isTsumo = true;
    if (opts.riverLast || opts.gangKaiChong) isTsumo = false;

    if (opts.liujuManguan) {
      const v = fanValue('流局满贯', 48);
      return withDisplayFields(
        { total: v, fans: [{ fan: v, count: 1, value: v, name: '流局满贯' }] },
        isTsumo,
        winnerIsDealer,
        honba
      );
    }

    // 服务器在摸牌后将牌推入 hand，所以自摸时 hand 有14张（含和牌张）
    // 将和牌张从 hand 中分离出来，得到13张立牌
    let standing13 = hand;
    if (isTsumo) {
      const idx = hand.indexOf(tile);
      if (idx !== -1) {
        standing13 = [...hand];
        standing13.splice(idx, 1);
      }
    }

    const packs = buildPacks(melds || []);
    let result = Calculator.calculate({
      standing:      toCalcStr(standing13),
      winTile:       toCalcStr([tile]),
      packs,
      selfDrawn:     isTsumo,
      lastTile:      opts.lastTile,
      kongInvolved:  opts.kongWin,
      wallLast:      opts.wallLast || opts.riverLast,
      prevalentWind: prevalentWind ?? 0,
      seatWind:      seatWind      ?? 0,
    });
    if (result.error) return result;

    // Step 1: 广式命名修正（与计番器保持一致）
    const rename = { '妙手回春': '海底捞月' };
    if (opts.riverLast) rename['海底捞月'] = '河底捞鱼';
    result = { ...result, fans: result.fans.map(f => rename[f.name] ? { ...f, name: rename[f.name] } : f) };

    // Step 2: WASM 原始番名 → fans.js 规范名
    if (typeof WASM_NAME_MAP !== 'undefined') {
      result = { ...result, fans: result.fans.map(f =>
        WASM_NAME_MAP[f.name] ? { ...f, name: WASM_NAME_MAP[f.name] } : f
      )};
    }

    // Step 3: 四暗刻单骑
    result = detectSiAnKeShanJi(standing13, tile, melds || [], result);

    // Step 4: 村规门清自摸升格
    result = applyMenQingTsumo(isTsumo, melds || [], result);

    // Step 5: 勾选框对应村规后处理（天/地/人、月见、杠振、抢杠等）
    result = applyCheckedRules(opts, result);

    // Step 6: 漏计番型修正（喜相逢/连6/老少副）
    result = fixUnderCountedFans(standing13, tile, melds || [], result);

    // Step 7: 二杯口
    result = detectErBeiKou(standing13, tile, melds || [], result, isTsumo, prevalentWind ?? 0, seatWind ?? 0);

    // Step 8: 九莲宝灯
    result = detectJiuLian(standing13, tile, melds || [], result);

    // Step 9: fans.js 番值覆盖
    result = applyFansJsValues(result);

    // Step 10: 纯全带幺九（在 applyFansJsValues 之后，以免被覆盖）
    result = detectChunQuanDaiYaoJiu(standing13, tile, melds || [], result);

    // 重算合计，并补充点棒/番种展示字段，供多人平台直接拼消息。
    return withDisplayFields(result, isTsumo, winnerIsDealer, honba);
  }

  return { compute };
})();
