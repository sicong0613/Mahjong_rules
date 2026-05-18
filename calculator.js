/**
 * calculator.js
 * 国标麻将计番器 WASM 封装 + 自定义番种扩展接口
 *
 * 依赖：data/fan_calculator.js（Emscripten 生成）需在本文件之前加载
 *
 * 使用：
 *   await Calculator.ready;
 *   const result = Calculator.calculate({ standing: '123m456s789p11p', winTile: '1p', selfDrawn: true });
 *
 * 控制台快速测试：
 *   testCalc('123m456s789p11p', '1p', { selfDrawn: true })
 */

const Calculator = (() => {

  // ─── 牌面记法 → tile 编码 ──────────────────────────────────────────────────
  // 万 1m-9m = 0x11-0x19 / 条 1s-9s = 0x21-0x29 / 饼 1p-9p = 0x31-0x39
  // 字牌: E东 S南 W西 N北 C中 F发 P白
  const TILE_MAP = {};
  for (let i = 1; i <= 9; i++) TILE_MAP[`${i}m`] = 0x10 + i;
  for (let i = 1; i <= 9; i++) TILE_MAP[`${i}s`] = 0x20 + i;
  for (let i = 1; i <= 9; i++) TILE_MAP[`${i}p`] = 0x30 + i;
  Object.assign(TILE_MAP, { E: 0x41, S: 0x42, W: 0x43, N: 0x44, C: 0x45, F: 0x46, P: 0x47 });

  // 解析牌面字符串，支持 "123m456s789p EE" 格式
  function parseTiles(str) {
    if (typeof str !== 'string') return str;
    const tiles = [];
    let digits = '';
    for (const ch of str) {
      if (' \t'.includes(ch))      { continue; }
      if ('0123456789'.includes(ch)) { digits += ch; }
      else if ('msp'.includes(ch)) { for (const d of digits) tiles.push(TILE_MAP[`${d}${ch}`]); digits = ''; }
      else if ('ESWNCFP'.includes(ch)) { tiles.push(TILE_MAP[ch]); }
    }
    return tiles;
  }

  // ─── 自定义番种扩展接口 ────────────────────────────────────────────────────
  //
  // 用于补充日麻番种和村规番种。每个探测器格式：
  //   { name: string, detect: (ctx) => FanResult[] | null }
  //
  // ctx 字段：
  //   standingTiles  number[]   立牌 tile 编码数组
  //   fixedPacks     number[]   副露牌组编码数组（make_pack 格式）
  //   winTile        number     和牌张 tile 编码
  //   winFlag        number     WIN_FLAG_* 位掩码
  //   prevalentWind  0-3        圈风（东南西北）
  //   seatWind       0-3        门风
  //   wasmFans       FanResult[] 国标计番结果（只读，供去重/互斥判断）
  //
  // FanResult: { fan: number, count: number, value: number, name: string }
  //
  // 示例（日麻立直）：
  //   Calculator.registerDetector({
  //     name: '立直',
  //     detect(ctx) {
  //       if (!ctx.riichi) return null;
  //       return [{ fan: 1001, count: 1, value: 1, name: '立直' }];
  //     }
  //   });
  //
  const _customDetectors = [];

  function registerDetector(detector) {
    _customDetectors.push(detector);
  }

  // ─── WASM 模块加载 ─────────────────────────────────────────────────────────
  let _M = null;

  const ready = new Promise((resolve, reject) => {
    if (typeof MahjongCalculator === 'undefined') {
      reject(new Error('[Calculator] fan_calculator.js 未加载'));
      return;
    }
    MahjongCalculator().then(m => { _M = m; resolve(m); }).catch(reject);
  });

  function _ensureLoaded() {
    if (!_M) throw new Error('[Calculator] 模块尚未就绪，请 await Calculator.ready');
    return _M;
  }

  // ─── 核心计番 ──────────────────────────────────────────────────────────────
  //
  // handInfo 参数：
  //   standing      string | number[]  立牌（牌面字符串或 tile 编码数组）
  //   winTile       string | number    和牌张
  //   packs         number[]           副露牌组，默认 []
  //   flowers       number             花牌数，默认 0
  //   selfDrawn     bool               自摸，默认 false
  //   lastTile      bool               和绝张，默认 false
  //   kongInvolved  bool               抢杠/杠上开花，默认 false
  //   wallLast      bool               妙手回春/海底捞月，默认 false
  //   prevalentWind 0-3                圈风，默认 0（东）
  //   seatWind      0-3                门风，默认 0（东）
  //   [自定义探测器可在 handInfo 中附加额外字段，如 riichi: true]
  //
  // 返回：
  //   { fans: FanResult[], total: number }
  //   或 { error: string, fans: [], total: 0 }
  //
  function calculate(handInfo) {
    const M = _ensureLoaded();

    const standing  = parseTiles(handInfo.standing);
    const winTile   = typeof handInfo.winTile === 'string'
                        ? parseTiles(handInfo.winTile)[0]
                        : handInfo.winTile;
    const packs     = handInfo.packs     ?? [];
    const flowers   = handInfo.flowers   ?? 0;
    const prevalent = handInfo.prevalentWind ?? 0;
    const seat      = handInfo.seatWind      ?? 0;

    let winFlag = M.WIN_FLAG_DISCARD;
    if (handInfo.selfDrawn)    winFlag |= M.WIN_FLAG_SELF_DRAWN;
    if (handInfo.lastTile)     winFlag |= M.WIN_FLAG_LAST_TILE;
    if (handInfo.kongInvolved) winFlag |= M.WIN_FLAG_KONG_INVOLVED;
    if (handInfo.wallLast)     winFlag |= M.WIN_FLAG_WALL_LAST;

    const wasmResult = M.calculateFan(standing, packs, winTile, flowers, winFlag, prevalent, seat);

    if (typeof wasmResult === 'number') {
      const msgs = { '-1': '张数错误', '-2': '某张牌超过4枚', '-3': '未和牌' };
      return { error: msgs[String(wasmResult)] ?? `未知错误 (${wasmResult})`, fans: [], total: 0 };
    }

    const fans = Array.from(wasmResult);

    // 自定义探测器（日麻/村规）
    const ctx = {
      standingTiles: standing,
      fixedPacks:    packs,
      winTile,
      winFlag,
      prevalentWind: prevalent,
      seatWind:      seat,
      wasmFans:      fans,
      ...handInfo,   // 透传 riichi 等自定义字段
    };
    for (const detector of _customDetectors) {
      try {
        const extra = detector.detect(ctx);
        if (Array.isArray(extra)) fans.push(...extra);
      } catch (e) {
        console.warn(`[Calculator] 探测器 "${detector.name}" 报错:`, e);
      }
    }

    // ─── 番种升格合并 ────────────────────────────────────────────────────────
    // 大七星：七对子 + 字一色 → 大七星（88番）
    {
      const qiIdx = fans.findIndex(f => f.name === '七对子');
      const ziIdx = fans.findIndex(f => f.name === '字一色');
      if (qiIdx !== -1 && ziIdx !== -1) {
        const [hi, lo] = qiIdx > ziIdx ? [qiIdx, ziIdx] : [ziIdx, qiIdx];
        fans.splice(hi, 1);
        fans.splice(lo, 1);
        fans.push({ fan: 88, count: 1, value: 88, name: '大七星' });
      }
    }

    const total = fans.reduce((sum, f) => sum + f.value * f.count, 0);
    return { fans, total };
  }

  // ─── 控制台测试辅助 ────────────────────────────────────────────────────────
  // 用法：testCalc('123m456s789p11p', '1p', { selfDrawn: true })
  function testCalc(standing, winTile, opts = {}) {
    Calculator.ready.then(() => {
      const result = calculate({ standing, winTile, ...opts });
      if (result.error) { console.error('[testCalc]', result.error); return; }
      console.group(`[testCalc] 合计 ${result.total} 番`);
      for (const f of result.fans) {
        console.log(`  ${f.name}  ×${f.count}  (${f.value}番/个)`);
      }
      console.groupEnd();
    });
  }

  // ─── 副露编码辅助 ──────────────────────────────────────────────────────────
  //
  // 用于构造 packs 数组，传入 calculate() 的 packs 参数。
  //
  // makeChow(middleTile, offer=1)
  //   middleTile: 顺子中间那张牌的记法，如 '2m' 表示 123m
  //   offer: 1=上家供 2=对家供 3=下家供（默认1=吃，只能从上家）
  //
  // makePung(tile, offer=1)
  //   tile: 刻子的牌，如 '1m' 表示 111m
  //   offer: 1=上家 2=对家 3=下家
  //
  // makeKong(tile, offer=1, concealed=false)
  //   concealed=true 表示暗杠
  //
  // 示例：吃了 123m，碰了 555s，立牌剩 789p11p，和 1p
  //   testCalc('789p11p', '1p', {
  //     packs: [Calculator.makeChow('2m'), Calculator.makePung('5s')]
  //   })
  //
  function makeChow(middleTileStr, offer = 1) {
    const M = _ensureLoaded();
    const tile = parseTiles(middleTileStr)[0];
    return M.makePack(offer, 1 /* PACK_TYPE_CHOW */, tile);
  }

  function makePung(tileStr, offer = 1) {
    const M = _ensureLoaded();
    const tile = parseTiles(tileStr)[0];
    return M.makePack(offer, 2 /* PACK_TYPE_PUNG */, tile);
  }

  function makeKong(tileStr, offer = 1, concealed = false) {
    const M = _ensureLoaded();
    const tile = parseTiles(tileStr)[0];
    return M.makePack(concealed ? 0 : offer, 3 /* PACK_TYPE_KONG */, tile);
  }

  // 直接用 tile 编码构造副露包（供 calc-ui.js 调用）
  function makePackRaw(offer, type, tileCode) {
    const M = _ensureLoaded();
    return M.makePack(offer, type, tileCode);
  }

  return { ready, calculate, registerDetector, parseTiles, makeChow, makePung, makeKong, makePackRaw, testCalc };

})();

// 挂到 window 供控制台直接调用
window.testCalc  = (standing, winTile, opts) => Calculator.testCalc(standing, winTile, opts);
window.makeChow  = (t, offer)              => Calculator.makeChow(t, offer);
window.makePung  = (t, offer)              => Calculator.makePung(t, offer);
window.makeKong  = (t, offer, concealed)   => Calculator.makeKong(t, offer, concealed);
