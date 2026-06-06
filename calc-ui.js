// calc-ui.js — 手牌输入与计番 UI

(function () {
  'use strict';

  // ─── SVG 文件名映射 ───────────────────────────────────────────
  const SUIT_CHARS  = ['', 'm', 's', 'p'];
  const HONOR_SVG   = { 0x41:'E', 0x42:'S', 0x43:'W', 0x44:'N', 0x45:'Z', 0x46:'F', 0x47:'B' };
  const HONOR_LABEL = { 0x41:'东', 0x42:'南', 0x43:'西', 0x44:'北', 0x45:'中', 0x46:'发', 0x47:'白' };

  function tileToSvg(code, isRed) {
    const suit = code >> 4;
    const rank = code & 0xF;
    if (suit >= 1 && suit <= 3) return `${isRed ? '0' : rank}${SUIT_CHARS[suit]}.svg`;
    return `${HONOR_SVG[code] || 'X'}.svg`;
  }

  // ─── 选牌器行定义 ─────────────────────────────────────────────
  // 每花色：1-5-赤5-6-9（赤五紧跟在5后面）
  function buildPickerRows() {
    const rows = [];
    for (let si = 1; si <= 3; si++) {
      const row = [];
      for (let r = 1; r <= 9; r++) {
        row.push({ code: (si << 4) | r, isRed: false });
        if (r === 5) row.push({ code: (si << 4) | 5, isRed: true });
      }
      rows.push(row);
    }
    // 字牌
    rows.push([0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47].map(c => ({ code: c, isRed: false })));
    return rows;
  }
  const PICKER_ROWS = buildPickerRows();

  // ─── 状态 ────────────────────────────────────────────────────
  let S;
  function resetState() {
    S = {
      mode: 'standing',
      standing: [],   // [{code, isRed}], 最多 13 - melds.length*3 张
      winTile: null,  // {code, isRed} | null
      melds: [],      // [{type, tile, tiles, concealed, promoted}]
      buffer: [],     // 副露/暗杠缓冲
      replacing: null,// {area:'standing'|'win', index} | null
      selfDrawn: false, lastTile: false, kongWin: false, wallLast: false, riverLast: false, gangKaiChong: false,
      riichi: false, riichiType: 'riichi',
      dora: 0, ippatsu: false, prevRedFives: 0, dealerWin: false,
      fan_tian_he: false, fan_di_he: false, fan_ren_he: false,
      flowers: 0, prevalentWind: 0, seatWind: 0,
    };
  }

  function maxStanding() {
    return 13 - S.melds.length * 3;
  }

  // 统计所有已使用的牌，返回两种 key：
  //   `${code}_total`  → 该牌面总数（红+普通合计）
  //   `${code}_0/1`    → 非红/红 各自数量
  function countAllTiles() {
    const m = new Map();
    const inc = (code, isRed) => {
      const vk = `${code}_${isRed ? 1 : 0}`;
      const tk = `${code}_total`;
      m.set(vk, (m.get(vk) || 0) + 1);
      m.set(tk, (m.get(tk) || 0) + 1);
    };
    for (const t of S.standing)        if (t) inc(t.code, t.isRed);
    if (S.winTile)                      inc(S.winTile.code, S.winTile.isRed);
    for (const meld of S.melds)
      for (const t of meld.tiles)       inc(t.code, t.isRed);
    for (const t of S.buffer)          inc(t.code, t.isRed);
    return m;
  }

  // ─── DOM 缓存 ─────────────────────────────────────────────────
  const dom = {};

  // ─── 工具 ─────────────────────────────────────────────────────
  function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }

  // 构建一个牌元素（img 版本）
  function makeTileEl(code, isRed, size) {
    const d = el('div', `hc-tile hc-tile-${size}`);
    const img = document.createElement('img');
    img.src = `img/tiles/${tileToSvg(code, isRed)}`;
    img.alt = HONOR_LABEL[code] || '';
    img.draggable = false;
    d.appendChild(img);
    return d;
  }

  // 构建指定 SVG 文件名的牌（牌背/牌面）
  function makeTileRaw(svgFile, size) {
    const d = el('div', `hc-tile hc-tile-${size} hc-tile-np`);
    const img = document.createElement('img');
    img.src = `img/tiles/${svgFile}`;
    img.draggable = false;
    d.appendChild(img);
    return d;
  }

  function makeEmptySlot(size, hint) {
    const d = el('div', `hc-tile hc-tile-${size} hc-empty`);
    if (hint) d.textContent = '?';
    return d;
  }

  // ─── 选牌器渲染 ───────────────────────────────────────────────
  function renderPicker() {
    dom.picker.innerHTML = '';
    PICKER_ROWS.forEach((row, ri) => {
      const rowEl = el('div', 'hc-picker-row');
      for (const td of row) {
        const t = makeTileEl(td.code, td.isRed, 'lg');
        t.classList.add('hc-picker-tile');
        t.dataset.code = td.code;
        t.dataset.red  = td.isRed ? '1' : '0';
        t.addEventListener('click', () => onPickerClick(td));
        rowEl.appendChild(t);
      }
      // 退格键放在最后一行（字牌行）的末尾
      if (ri === PICKER_ROWS.length - 1) {
        const bsBtn = el('button', 'hc-backspace-key');
        bsBtn.textContent = '⌫';
        bsBtn.title = '退格';
        bsBtn.addEventListener('click', backspace);
        rowEl.appendChild(bsBtn);
      }
      dom.picker.appendChild(rowEl);
    });
  }

  // 更新选牌器中已达上限的牌（变暗禁用）
  // 花色五：红五 max 1，普通五 max 3，合计 max 4
  function updatePickerCounts() {
    const counts = countAllTiles();
    dom.picker.querySelectorAll('.hc-picker-tile').forEach(t => {
      const code   = parseInt(t.dataset.code);
      const isRed  = t.dataset.red === '1';
      const total  = counts.get(`${code}_total`) || 0;
      const variant = counts.get(`${code}_${isRed ? 1 : 0}`) || 0;
      const rank = code & 0xF;
      const suit = code >> 4;
      const isSuitFive = rank === 5 && suit >= 1 && suit <= 3;
      const limit = isSuitFive ? (isRed ? 1 : 3) : 4;
      t.classList.toggle('hc-exhausted', variant >= limit || total >= 4);
    });
  }

  // ─── 输入路由 ─────────────────────────────────────────────────
  function onPickerClick(td) {
    const t = { code: td.code, isRed: td.isRed };

    if (S.replacing) {
      const { area, index } = S.replacing;
      if (area === 'standing') S.standing[index] = t;
      else S.winTile = t;
      S.replacing = null;
      render(); return;
    }

    if (S.mode === 'standing') {
      if (S.standing.length < maxStanding())   S.standing.push(t);
      else if (!S.winTile)                     S.winTile = t;
    } else if (S.mode === 'meld') {
      S.buffer.push(t);
      if (S.buffer.length === 3) flushBuffer();
    } else if (S.mode === 'minggang' || S.mode === 'angang') {
      // 开杠前校验：立牌 + 和牌张 + 已有副露中若已存在该牌，加上杠的4张会超过上限4张
      const existing = countAllTiles().get(`${t.code}_total`) || 0;
      if (existing + 4 > 4) { showToast('开杠后该牌总数将超过4张，请先移除立牌区中的同种牌'); return; }
      // 单击即生成四张杠；五万/五饼/五条固定为1红3正
      const rank = t.code & 0xF;
      const suit = t.code >> 4;
      const isSuitFive = rank === 5 && suit >= 1 && suit <= 3;
      const kongTiles = isSuitFive
        ? [{ code: t.code, isRed: false }, { code: t.code, isRed: false },
           { code: t.code, isRed: true  }, { code: t.code, isRed: false }]
        : [{...t}, {...t}, {...t}, {...t}];
      S.melds.push({
        type: 'kong', tile: t.code,
        tiles: kongTiles,
        concealed: S.mode === 'angang', promoted: false,
      });
      trimStandingToMax();
    }
    render();
  }

  function trimStandingToMax() {
    const max = maxStanding();
    if (S.standing.length > max) S.standing = S.standing.slice(0, max);
  }

  function flushBuffer() {
    if (S.mode === 'meld') {
      const meld = tryFormMeld(S.buffer);
      if (meld) { S.melds.push(meld); trimStandingToMax(); }
      else showToast('无效吃/碰：需要顺子或刻子');
    } else if (S.mode === 'minggang' || S.mode === 'angang') {
      const codes = S.buffer.map(t => t.code);
      if (codes.every(c => c === codes[0])) {
        S.melds.push({ type: 'kong', tile: codes[0], tiles: [...S.buffer],
                       concealed: S.mode === 'angang', promoted: false });
        trimStandingToMax();
      } else {
        showToast('杠需要4张相同的牌');
      }
    }
    S.buffer = [];
  }

  function tryFormMeld(tiles) {
    const codes = tiles.map(t => t.code);
    if (codes[0] === codes[1] && codes[1] === codes[2])
      return { type: 'pung', tile: codes[0], tiles: [...tiles], concealed: false, promoted: false };
    const suits = codes.map(c => c >> 4);
    const ranks = codes.map(c => c & 0xF).sort((a, b) => a - b);
    if (suits.every(s => s === suits[0]) && suits[0] >= 1 && suits[0] <= 3 &&
        ranks[0] + 1 === ranks[1] && ranks[1] + 1 === ranks[2])
      return { type: 'chow', tile: (suits[0] << 4) | ranks[1], tiles: [...tiles], concealed: false, promoted: false };
    return null;
  }

  // ─── 副露操作 ─────────────────────────────────────────────────
  function toggleConceal(i) {
    const m = S.melds[i];
    if (m.type !== 'kong') return;
    S.melds[i] = { ...m, concealed: !m.concealed };
    render();
  }

  function removeMeld(i) {
    S.melds.splice(i, 1);
    render();
  }

  // ─── 渲染 ──────────────────────────────────────────────────────
  function render() {
    renderStanding();
    renderWin();
    renderMelds();
    renderBuffer();
    updateModeButtons();
    updatePickerCounts();
    updateKongWinCheckbox();
    updateDoraDropdown();
    dom.calcBtn.disabled = !S.winTile || S.standing.length === 0 || !!S.replacing;
  }

  function countRedFives() {
    let n = 0;
    const chk = t => { if (t?.isRed) n++; };
    S.standing.forEach(chk);
    chk(S.winTile);
    S.melds.forEach(m => m.tiles.forEach(chk));
    return n;
  }

  // 根据手牌中赤五数量自动处理宝牌勾选框与下拉框
  function updateDoraDropdown() {
    const redFives = countRedFives();
    const cbDora  = document.getElementById('hc-dora');
    const selDora = document.getElementById('hc-dora-count');
    const delta   = redFives - S.prevRedFives; // >0 增加，<0 减少

    // 无效化低于赤五数的选项
    Array.from(selDora.options).forEach(opt => {
      opt.disabled = parseInt(opt.value) < redFives;
    });

    if (redFives > 0) {
      cbDora.checked  = true;
      cbDora.disabled = true;
      selDora.disabled = false;
      if (delta < 0) {
        // 赤五减少：宝牌数同步减少，但不低于剩余赤五数
        selDora.value = String(Math.max(parseInt(selDora.value) + delta, redFives));
      } else if (parseInt(selDora.value) < redFives) {
        selDora.value = String(redFives);
      }
    } else {
      cbDora.disabled = false;
      if (delta < 0 && cbDora.checked) {
        // 赤五全部删除：减去对应宝牌贡献
        const newVal = parseInt(selDora.value) + delta;
        if (newVal <= 0) {
          cbDora.checked   = false;
          selDora.disabled = true;
        } else {
          selDora.value = String(newVal);
        }
      }
    }

    S.prevRedFives = redFives;
    S.dora = cbDora.checked ? parseInt(selDora.value) : 0;
  }

  function updateKongWinCheckbox() {
    const hasKong     = S.melds.some(m => m.type === 'kong');
    const hasOpenMeld = S.melds.some(m => m.type === 'chow' || m.type === 'pung' || (m.type === 'kong' && !m.concealed));
    const cbKong   = document.getElementById('hc-kong-win');
    const cbGkc    = document.getElementById('hc-gang-kai-chong');
    const cbRiichi = document.getElementById('hc-riichi');
    cbKong.disabled   = !hasKong;
    cbGkc.disabled    = !hasKong;
    cbRiichi.disabled = hasOpenMeld;
    if (!hasKong     && S.kongWin)      { S.kongWin      = false; cbKong.checked   = false; }
    if (!hasKong     && S.gangKaiChong) { S.gangKaiChong = false; cbGkc.checked    = false; }
    if (hasOpenMeld  && S.riichi) {
      S.riichi = false; cbRiichi.checked = false;
      document.getElementById('hc-riichi-type').disabled = true;
      S.ippatsu = false;
      document.getElementById('hc-ippatsu').checked = false;
      document.getElementById('hc-ippatsu').disabled = true;
    }
    // 一发 requires 立直
    const cbIppatsu = document.getElementById('hc-ippatsu');
    if (!S.riichi) {
      cbIppatsu.disabled = true;
      if (S.ippatsu) { S.ippatsu = false; cbIppatsu.checked = false; }
    } else if (!hasOpenMeld) {
      cbIppatsu.disabled = false;
    }
  }

  // 点击已有牌 → 该槽清空等待重输；点击空槽 → 取消并还原
  function selectForReplace(area, index, savedTile) {
    if (S.replacing) {
      // 先还原上一个待替换槽
      if (S.replacing.area === 'standing') S.standing[S.replacing.index] = S.replacing.savedTile;
      else S.winTile = S.replacing.savedTile;
    }
    if (area === 'standing') S.standing[index] = null;
    else S.winTile = null;
    S.replacing = { area, index, savedTile };
    render();
  }

  function backspace() {
    if (S.replacing) {
      const { area, index } = S.replacing;
      S.replacing = null;
      if (area === 'standing') {
        // 删除选中槽（此时为 null），右边的牌自动归中
        S.standing.splice(index, 1);
      } else {
        // 和牌张被选中时，直接清除
        S.winTile = null;
      }
    } else {
      // 无选中：优先删和牌张，和牌张空时再删立牌区最右边的牌
      if (S.winTile) {
        S.winTile = null;
      } else if (S.standing.length > 0) {
        S.standing.pop();
      } else {
        return;
      }
    }
    render();
  }

  function cancelReplace() {
    if (!S.replacing) return;
    if (S.replacing.area === 'standing') S.standing[S.replacing.index] = S.replacing.savedTile;
    else S.winTile = S.replacing.savedTile;
    S.replacing = null;
    render();
  }

  function renderStanding() {
    dom.standingArea.innerHTML = '';
    const max = maxStanding();
    for (let i = 0; i < max; i++) {
      const t = S.standing[i];
      if (t) {
        const tEl = makeTileEl(t.code, t.isRed, 'md');
        tEl.addEventListener('click', () => selectForReplace('standing', i, t));
        dom.standingArea.appendChild(tEl);
      } else {
        const isActive = S.replacing?.area === 'standing' && S.replacing?.index === i;
        if (isActive) {
          const slot = makeTileRaw('X.svg', 'md');
          slot.classList.add('hc-replacing');
          slot.addEventListener('click', cancelReplace);
          dom.standingArea.appendChild(slot);
        } else {
          dom.standingArea.appendChild(makeTileRaw('X.svg', 'md'));
        }
      }
    }
    const filled = S.standing.filter(Boolean).length;
    dom.standingCount.textContent = `${filled}/${max}`;
  }

  function renderWin() {
    dom.winArea.innerHTML = '';
    if (S.winTile) {
      const tEl = makeTileEl(S.winTile.code, S.winTile.isRed, 'md');
      tEl.addEventListener('click', () => selectForReplace('win', 0, S.winTile));
      dom.winArea.appendChild(tEl);
    } else if (S.replacing?.area === 'win') {
      const slot = makeTileRaw('X.svg', 'md');
      slot.classList.add('hc-replacing');
      slot.addEventListener('click', cancelReplace);
      dom.winArea.appendChild(slot);
    } else {
      dom.winArea.appendChild(makeTileRaw('X.svg', 'md'));
    }
  }

  function renderMelds() {
    dom.meldArea.innerHTML = '';
    S.melds.forEach((meld, i) => {
      const card = el('div', 'hc-meld-card');
      const tilesDiv = el('div', 'hc-meld-tiles');
      meld.tiles.forEach((t, j) => {
        let tEl;
        if (meld.type === 'kong' && meld.concealed) {
          // 暗杠：牌背 实牌 实牌 牌背
          tEl = (j === 0 || j === 3)
            ? makeTileRaw('X.svg', 'md')
            : makeTileEl(t.code, t.isRed, 'md');
        } else {
          tEl = makeTileEl(t.code, t.isRed, 'md');
        }
        tilesDiv.appendChild(tEl);
      });
      card.appendChild(tilesDiv);

      const ctrl = el('div', 'hc-meld-ctrl');
      const lbl = el('span', 'hc-meld-lbl');
      const isEn = appLang() === 'en';
      lbl.textContent = isEn
        ? (meld.type === 'chow' ? 'Chow' : meld.type === 'pung' ? 'Pung' : meld.concealed ? 'Cls.Kong' : 'Opn.Kong')
        : (meld.type === 'chow' ? '吃' : meld.type === 'pung' ? '碰' : meld.concealed ? '暗杠' : '明杠');
      ctrl.appendChild(lbl);

      if (meld.type === 'kong') {
        const b = el('button', 'hc-btn-sm');
        b.textContent = isEn ? (meld.concealed ? 'Cls' : 'Opn') : (meld.concealed ? '暗' : '明');
        b.onclick = () => toggleConceal(i); ctrl.appendChild(b);
      }
      const rm = el('button', 'hc-btn-sm hc-btn-del'); rm.textContent = '✕';
      rm.onclick = () => removeMeld(i); ctrl.appendChild(rm);

      card.appendChild(ctrl);
      dom.meldArea.appendChild(card);
    });
  }

  function renderBuffer() {
    const show = S.buffer.length > 0;
    dom.bufferSection.classList.toggle('hidden', !show);
    if (!show) return;
    const needed = (S.mode === 'minggang' || S.mode === 'angang') ? 4 : 3;
    dom.bufferLabel.textContent = appLang() === 'en'
      ? `Building (${S.buffer.length}/${needed})`
      : `组合中 (${S.buffer.length}/${needed})`;
    dom.bufferArea.innerHTML = '';
    for (const t of S.buffer) dom.bufferArea.appendChild(makeTileEl(t.code, t.isRed, 'md'));
  }

  function updateModeButtons() {
    const remaining = maxStanding() - S.standing.filter(Boolean).length;
    let needReset = false;
    dom.modeBtns.forEach(b => {
      const mode = b.dataset.mode;
      let disabled = false;
      if (mode === 'meld' || mode === 'minggang' || mode === 'angang') disabled = remaining < 3;
      b.disabled = disabled;
      b.classList.toggle('active', mode === S.mode);
      if (disabled && mode === S.mode) needReset = true;
    });
    if (needReset) {
      S.mode = 'standing';
      S.buffer = [];
      dom.modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === 'standing'));
    }
  }

  // ─── 番数→点数对照表 ──────────────────────────────────────────
  // 列：点炮给庄 | 庄·自摸每闲付 | 点炮给闲 | 闲·自摸庄付 | 闲·自摸每闲付
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
    { max: 23, ron_d:  12000, tsumo_d:  4000, ron_n:  8000, tsumo_nd:  4000, tsumo_nn:  2000 },
    { max: 31, ron_d:  18000, tsumo_d:  6000, ron_n: 12000, tsumo_nd:  6000, tsumo_nn:  3000 },
    { max: 47, ron_d:  24000, tsumo_d:  8000, ron_n: 16000, tsumo_nd:  8000, tsumo_nn:  4000 },
    { max: 63, ron_d:  36000, tsumo_d: 12000, ron_n: 24000, tsumo_nd: 12000, tsumo_nn:  6000 },
    { max: 87, ron_d:  48000, tsumo_d: 16000, ron_n: 32000, tsumo_nd: 16000, tsumo_nn:  8000 },
    { max: 99, ron_d:  96000, tsumo_d: 32000, ron_n: 64000, tsumo_nd: 32000, tsumo_nn: 16000 },
    { max: Infinity, ron_d: 144000, tsumo_d: 48000, ron_n: 96000, tsumo_nd: 48000, tsumo_nn: 24000 },
  ];

  function lookupPoints(total, selfDrawn, dealerWin) {
    if (total < 2) return null;
    const row = FAN_POINTS_TABLE.find(r => total <= r.max);
    if (!row) return null;
    const isEn = appLang() === 'en';
    const fmt = n => n.toLocaleString();
    if (!selfDrawn &&  dealerWin) return isEn ? `${fmt(row.ron_d)} pts (ron → dealer)`       : `${fmt(row.ron_d)} 点（点炮给庄）`;
    if ( selfDrawn &&  dealerWin) return isEn ? `${fmt(row.tsumo_d)} pts × 3 all`             : `${fmt(row.tsumo_d)} 点 all（庄·自摸）`;
    if (!selfDrawn && !dealerWin) return isEn ? `${fmt(row.ron_n)} pts (ron → non-dealer)`    : `${fmt(row.ron_n)} 点（点炮给闲）`;
    /* selfDrawn && !dealerWin */ return isEn
      ? `Dealer ${fmt(row.tsumo_nd)} / Others ${fmt(row.tsumo_nn)} pts`
      : `庄 ${fmt(row.tsumo_nd)} / 闲各 ${fmt(row.tsumo_nn)} 点`;
  }

  // 必然门清番种：这些牌型结构上不允许副露，故自摸时只计不求人，不额外追加门前清
  const NECESSARILY_CONCEALED_FANS = new Set([
    '十三幺', '七对子', '连七对', '七星不靠', '全不靠', '九莲宝灯', '四暗刻单骑',
  ]);

  // ─── 村规后处理 ───────────────────────────────────────────────
  function applyVillageRules(result) {
    const fans = [...result.fans];

    // 村规1：门清自摸 → 不求人（2番）+ 门前清（2番）并列计算
    // 必然门清番种（十三幺/七对子等）只计不求人，不追加门前清
    if (S.selfDrawn && S.melds.length === 0) {
      // 1a. 必然门清番种：WASM给"非门清自摸和"(1番)时，升级为不求人(2番)
      const nonMenIdx = fans.findIndex(f => f.name === '非门清自摸和');
      if (nonMenIdx !== -1) fans[nonMenIdx] = { ...fans[nonMenIdx], name: '不求人' };

      // 1b. 有不求人时额外追加门前清（2番），但必然门清牌型除外
      const hasBuQiuRen = fans.some(f => f.name === '不求人');
      const hasMenQian  = fans.some(f => f.name === '门前清');
      const isNecessarilyConcealed = fans.some(f => NECESSARILY_CONCEALED_FANS.has(f.name));
      if (hasBuQiuRen && !hasMenQian && !isNecessarilyConcealed) {
        fans.push({ fan: 2, count: 1, value: 2, name: '门前清' });
      }
    }

    // 村规2：天和 / 地和 / 人和（手动勾选，排斥门前清/门清自摸和）
    const specialFan = S.fan_tian_he ? '天和' : S.fan_di_he ? '地和' : S.fan_ren_he ? '人和' : null;
    if (specialFan) {
      const excluded = new Set(['门前清', '不求人', '非门清自摸和', '天和', '地和', '人和']);
      const kept = fans.filter(f => !excluded.has(f.name));
      const entry = FANS_DATA?.find(f => f.name === specialFan);
      kept.unshift({ fan: entry?.fan ?? 88, count: 1, value: entry?.fan ?? 88, name: specialFan });
      return { ...result, fans: kept };
    }

    // 村规3：月见花开 = 杠上开花 + 海底捞月同时成立
    if (S.kongWin && S.wallLast) {
      const hasKong = fans.some(f => f.name === '杠上开花');
      const hasSea  = fans.some(f => f.name === '海底捞月');
      if (hasKong && hasSea) {
        const kept = fans.filter(f => f.name !== '杠上开花' && f.name !== '海底捞月');
        kept.push({ fan: 32, count: 1, value: 32, name: '月见花开' });
        return { ...result, fans: kept };
      }
    }

    // 广港日：杠振 = 杠上开铳 + 河底捞鱼 → 升格32番；杠上开铳单独成立时8番
    if (S.gangKaiChong) {
      if (S.riverLast) {
        // 杠振：过滤掉 WASM 给出的末张放铳番，整体替换
        const kept = fans.filter(f => f.name !== '河底捞月' && f.name !== '海底捞月');
        kept.push({ fan: 32, count: 1, value: 32, name: '杠振' });
        return { ...result, fans: kept };
      }
      fans.push({ fan: 8, count: 1, value: 8, name: '杠上开铳' });
    }

    return fans === result.fans ? result : { ...result, fans };
  }

  // ─── 四暗刻单骑检测 ───────────────────────────────────────────
  // 条件：无公开副露（暗杠不破坏门清）+ WASM检测到四暗刻 + 和牌张恰好是雀头（立牌中仅1张同码牌）
  // 必须在 applyVillageRules 之前调用，以便村规能识别 NECESSARILY_CONCEALED_FANS
  function detectSiAnKeShanJi(result) {
    if (S.melds.some(m => !m.concealed)) return result;
    if (!result.fans.some(f => f.name === '四暗刻')) return result;
    const winCode = S.winTile.code;
    const matchCount = S.standing.filter(t => t && t.code === winCode).length;
    if (matchCount !== 1) return result;   // 双碰等牌型排除

    const excluded = new Set(['四暗刻', '门前清', '听单张', '四暗刻单骑']);
    const kept = result.fans.filter(f => !excluded.has(f.name));
    const entry = FANS_DATA?.find(f => f.name === '四暗刻单骑');
    const fanVal = entry?.fan ?? 88;
    kept.unshift({ fan: fanVal, count: 1, value: fanVal, name: '四暗刻单骑' });
    return { ...result, fans: kept };
  }

  // ─── 九莲宝灯检测 ─────────────────────────────────────────────
  // 基础型：同一花色 1112345678999（13张），可和该花色任意一张
  function detectJiuLian(result) {
    if (S.melds.length > 0) return result;                   // 必须门清

    const allTiles = [...S.standing.map(t => t.code), S.winTile.code];
    const suit = allTiles[0] >> 4;
    if (suit < 1 || suit > 3) return result;                 // 必须数牌
    if (!allTiles.every(c => (c >> 4) === suit)) return result; // 必须同花色

    // 统计各阶数量
    const cnt = new Array(10).fill(0);
    for (const c of allTiles) cnt[c & 0xF]++;

    // 基础型需求：1≥3, 2-8≥1, 9≥3，共14张中恰好多1张
    const base = [0, 3, 1, 1, 1, 1, 1, 1, 1, 3];
    for (let r = 1; r <= 9; r++) {
      if (cnt[r] < base[r]) return result;
    }

    // 检测到九莲宝灯，剔除被排斥的番种
    const excluded = new Set(['清一色', '门前清', '幺九刻', '九莲宝灯']);
    const kept = result.fans.filter(f => !excluded.has(f.name));
    const jl = { fan: 88, count: 1, value: 88, name: '九莲宝灯' };
    return { fans: [jl, ...kept], total: kept.reduce((s, f) => s + f.value * f.count, 0) + 88 };
  }

  // ─── 纯全带幺九检测 ───────────────────────────────────────────
  // WASM 检测到全带幺（每组含幺九或字牌）且整副牌无字牌 → 升格纯全带幺九
  // 门清 24番，有副露 16番
  function detectChunQuanDaiYaoJiu(result) {
    if (!result.fans.some(f => f.name === '全带幺')) return result;

    const allTiles = [
      ...S.standing.filter(Boolean),
      S.winTile,
      ...S.melds.flatMap(m => m.tiles),
    ];
    if (allTiles.some(t => t && (t.code >> 4) === 4)) return result; // 有字牌，不成立

    // 有副露降至16番；此函数在 applyFansJsValues 之后运行，需自行计算 total
    const fanVal = S.melds.length > 0 ? 16 : 24;
    const fans = result.fans.filter(f => f.name !== '全带幺' && f.name !== '无字');
    fans.push({ fan: fanVal, count: 1, value: fanVal, name: '纯全带幺九' });
    return { ...result, fans, total: fans.reduce((s, f) => s + f.value * f.count, 0) };
  }

  // ─── fans.js 番值覆盖 ─────────────────────────────────────────
  // 按 fans.js 中定义的番数覆盖 WASM 内置值，实现自定义番值
  const _fanValueMap = (() => {
    const m = new Map();
    if (typeof FANS_DATA === 'undefined') return m;
    for (const f of FANS_DATA) {
      m.set(f.name, f.fan);
      if (f.nameAlt) for (const alt of f.nameAlt) if (!m.has(alt)) m.set(alt, f.fan);
    }
    return m;
  })();

  function applyFansJsValues(result) {
    const fans = result.fans.map(f => {
      const v = _fanValueMap.get(f.name);
      if (v === undefined) console.warn(`[fans.js 未命中] 番种名 "${f.name}" 在 fans.js 中找不到对应条目`);
      return v !== undefined ? { ...f, value: v } : f;
    });
    const total = fans.reduce((s, f) => s + f.value * f.count, 0);
    return { ...result, fans, total };
  }

  // ─── 计算 ──────────────────────────────────────────────────────
  function doCalculate() {
    const packs = S.melds.map(m => {
      if (m.type === 'chow')                return Calculator.makePackRaw(1, 1, m.tile);
      if (m.type === 'pung')                return Calculator.makePackRaw(1, 2, m.tile);
      if (m.type === 'kong' && m.concealed) return Calculator.makePackRaw(0, 3, m.tile);
      /* 明杠 */                            return Calculator.makePackRaw(1, 3, m.tile);
    });
    let result = Calculator.calculate({
      standing: S.standing.map(t => t.code), winTile: S.winTile.code, packs,
      flowers: S.flowers, selfDrawn: S.selfDrawn, lastTile: S.lastTile,
      kongInvolved: S.kongWin, wallLast: S.wallLast || S.riverLast,
      prevalentWind: S.prevalentWind, seatWind: S.seatWind,
    });
    if (!result.error) {
      // Step 1: 广式命名修正（依赖运行时状态，必须先做）
      // 妙手回春（末张自摸）→ 海底捞月；有副露自摸末张 → 河底捞月
      const rename = { '妙手回春': '海底捞月' };
      if (S.riverLast) rename['海底捞月'] = '河底捞月';
      result = {
        ...result,
        fans: result.fans.map(f => rename[f.name] ? { ...f, name: rename[f.name] } : f),
      };
      // Step 2: 应用 WASM_NAME_MAP（将 WASM 原始名统一为 fans.js 规范名）
      // 必须在 applyVillageRules 之前执行，否则排斥集合的名称匹配会失效
      if (typeof WASM_NAME_MAP !== 'undefined') {
        result = {
          ...result,
          fans: result.fans.map(f => WASM_NAME_MAP[f.name] ? { ...f, name: WASM_NAME_MAP[f.name] } : f),
        };
      }
      // Step 3: 四暗刻单骑检测（必须在村规前，以便村规识别必然门清牌型）
      result = detectSiAnKeShanJi(result);
      // Step 4 & 5: 村规后处理、九莲宝灯检测（此时所有番名已是规范名）
      result = applyVillageRules(result);
      result = detectJiuLian(result);
      result = applyFansJsValues(result);
      result = detectChunQuanDaiYaoJiu(result); // 必须在 applyFansJsValues 之后，以免自定义值被覆盖
      // 立直系：追加番种（与门前清并列）
      if (S.riichi) {
        const RIICHI_MAP = {
          riichi:        { name: '立直',     fan: 2  },
          double_riichi: { name: '二立直',   fan: 16 },
          open_riichi:   { name: '明牌立直', fan: 48 },
        };
        // 石上三年：二立直 + 海底/河底 → 升格48番，排斥底部番
        if (S.riichiType === 'double_riichi' && (S.wallLast || S.riverLast)) {
          const bottomName = S.wallLast ? '海底捞月' : '河底捞月';
          const fans = result.fans.filter(f => f.name !== bottomName);
          fans.push({ fan: 48, count: 1, value: 48, name: '石上三年' });
          result = { ...result, fans, total: fans.reduce((s, f) => s + f.value * f.count, 0) };
        } else {
          const r = RIICHI_MAP[S.riichiType] ?? RIICHI_MAP.riichi;
          const fans = [...result.fans, { fan: r.fan, count: 1, value: r.fan, name: r.name }];
          result = { ...result, fans, total: fans.reduce((s, f) => s + f.value * f.count, 0) };
        }
      }
      // 一发（立直后一巡内胡牌，与自摸互斥）
      if (S.ippatsu) {
        const fans = [...result.fans, { fan: 2, count: 1, value: 2, name: '一发' }];
        result = { ...result, fans, total: fans.reduce((s, f) => s + f.value * f.count, 0) };
      }
      // 宝牌（每张 1 番）
      if (S.dora > 0) {
        const fans = [...result.fans, { fan: 1, count: S.dora, value: 1, name: '宝牌' }];
        result = { ...result, fans, total: fans.reduce((s, f) => s + f.value * f.count, 0) };
      }
    }
    renderResult(result);
  }

  function appLang() { return document.documentElement.dataset.lang || 'zh'; }

  function fanDisplayName(zhName) {
    if (appLang() !== 'en') return zhName;
    return (typeof window.hcLookupEn === 'function' && window.hcLookupEn(zhName)) || zhName;
  }

  function renderResult(result) {
    dom.result.innerHTML = '';
    dom.result.classList.remove('hidden');
    if (result.error) {
      const e = el('p', 'hc-err'); e.textContent = result.error;
      dom.result.appendChild(e); return;
    }
    const isEn = appLang() === 'en';
    const total = el('div', 'hc-result-total');
    total.textContent = isEn ? `Total ${result.total} fan` : `合计 ${result.total} 番`;
    dom.result.appendChild(total);
    const pts = lookupPoints(result.total, S.selfDrawn, S.dealerWin);
    if (pts) {
      const ptEl = el('div', 'hc-result-points');
      ptEl.textContent = pts;
      dom.result.appendChild(ptEl);
    }
    if (result.fans.length === 0) {
      const none = el('p', 'hc-result-none');
      none.textContent = isEn ? 'No scoring fans' : '无番和';
      dom.result.appendChild(none); return;
    }
    const list = el('div', 'hc-result-list');
    for (const f of result.fans) {
      const row = el('div', 'hc-result-row');
      const name = el('span', 'hc-result-name'); name.textContent = fanDisplayName(f.name);
      const val  = el('span', 'hc-result-val');  val.textContent  = `×${f.count}　${f.value} 番`;
      row.appendChild(name); row.appendChild(val); list.appendChild(row);
    }
    dom.result.appendChild(list);
    dom.result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ─── Toast ─────────────────────────────────────────────────────
  let _toastTimer;
  function showToast(msg) {
    let t = document.getElementById('hc-toast');
    if (!t) { t = el('div', 'hc-toast'); t.id = 'hc-toast'; document.getElementById('hand-calc-page').appendChild(t); }
    t.textContent = msg;
    t.classList.add('hc-toast-show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => t.classList.remove('hc-toast-show'), 2200);
  }

  // ─── 开/关页面 ─────────────────────────────────────────────────
  function open() {
    resetState();
    ['hc-self-drawn','hc-dealer-win','hc-last-tile','hc-kong-win','hc-wall-last','hc-river-last','hc-gang-kai-chong',
     'hc-riichi','hc-fan-tian_he','hc-fan-di_he','hc-fan-ren_he','hc-dora','hc-ippatsu'].forEach(id => {
      const el = document.getElementById(id); el.checked = false; el.disabled = false;
    });
    const riichiTypeSel = document.getElementById('hc-riichi-type');
    riichiTypeSel.value = 'riichi'; riichiTypeSel.disabled = true;
    const doraCountSel = document.getElementById('hc-dora-count');
    doraCountSel.value = '1'; doraCountSel.disabled = true;
    document.getElementById('hc-ippatsu').disabled = true;
    document.getElementById('hc-flowers').value   = 0;
    document.getElementById('hc-prevalent').value = 0;
    document.getElementById('hc-seat').value      = 0;
    render();
    document.getElementById('hand-calc-page').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    document.getElementById('hand-calc-page').classList.add('hidden');
    document.body.style.overflow = '';
  }

  // ─── 番种↔条件联动接口 ────────────────────────────────────────
  //
  // 规则表格式（在 CUSTOM_RULES.md 确认后填入）：
  //   fanId: {
  //     set: { conditionKey: bool, ... }  // 勾选此番种时强制设置这些条件
  //   }
  //
  // conditionKey 对应 S 上的字段：
  //   selfDrawn | lastTile | kongWin | wallLast | riverLast
  //
  // 示例（待启用）：
  //   tian_he: { set: { selfDrawn: true  } }   // 天和必然自摸
  //   di_he:   { set: { selfDrawn: true  } }   // 地和必然自摸
  //   ren_he:  { set: { selfDrawn: false } }   // 人和必然点炮
  //
  const FAN_CONDITION_RULES = {
    tian_he: { set: { selfDrawn: true,  lastTile: false, wallLast: false, riverLast: false } },  // 天和必然自摸，排斥和绝张/海底/河底
    di_he:   { set: { selfDrawn: true,  wallLast: false, riverLast: false } },                   // 地和必然自摸，排斥海底/河底
    ren_he:  { set: { selfDrawn: false, lastTile: false, wallLast: false, riverLast: false } },  // 人和必然点炮，排斥和绝张/海底/河底
  };

  // 条件 key → checkbox element id
  const CONDITION_IDS = {
    selfDrawn: 'hc-self-drawn',
    lastTile:  'hc-last-tile',
    kongWin:   'hc-kong-win',
    wallLast:  'hc-wall-last',
    riverLast: 'hc-river-last',
  };

  // 正向：勾选/取消某番种 → 强制同步条件 checkbox
  function applyFanToConditions(fanId, checked) {
    const rule = FAN_CONDITION_RULES[fanId];
    if (!rule?.set) return;
    if (!checked) return; // 取消番种时不反向撤销条件（条件可能由别处设置）
    Object.entries(rule.set).forEach(([key, val]) => {
      S[key] = val;
      const cb = document.getElementById(CONDITION_IDS[key]);
      if (cb) cb.checked = val;
      // 维持 wallLast / riverLast 互斥
      if (key === 'wallLast'  && val) { S.riverLast = false; document.getElementById('hc-river-last').checked = false; }
      if (key === 'riverLast' && val) { S.wallLast  = false; document.getElementById('hc-wall-last').checked  = false; }
    });
  }

  // 反向：条件改变 → 取消所有与之矛盾的番种 checkbox
  function applyConditionToFans(conditionKey, newVal) {
    Object.entries(FAN_CONDITION_RULES).forEach(([fanId, rule]) => {
      const required = rule.set?.[conditionKey];
      if (required === undefined || required === newVal) return;
      const cb = document.getElementById(`hc-fan-${fanId}`);
      if (cb?.checked) { cb.checked = false; S[`fan_${fanId}`] = false; }
    });
  }

  // ─── 初始化 ────────────────────────────────────────────────────
  function init() {
    if (!document.getElementById('hand-calc-page')) return;
    dom.standingArea  = document.getElementById('hc-standing-area');
    dom.standingCount = document.getElementById('hc-standing-count');
    dom.winArea       = document.getElementById('hc-win-area');
    dom.meldArea      = document.getElementById('hc-meld-area');
    dom.bufferSection = document.getElementById('hc-buffer-section');
    dom.bufferArea    = document.getElementById('hc-buffer-area');
    dom.bufferLabel   = document.getElementById('hc-buffer-label');
    dom.picker        = document.getElementById('hc-picker');
    dom.result        = document.getElementById('hc-result');
    dom.calcBtn       = document.getElementById('hc-calc-btn');
    dom.modeBtns      = document.querySelectorAll('.hc-mode-btn');

    renderPicker();
    dom.modeBtns.forEach(btn => btn.addEventListener('click', () => {
      if (S.replacing) {
        if (S.replacing.area === 'standing') S.standing[S.replacing.index] = S.replacing.savedTile;
        else S.winTile = S.replacing.savedTile;
        S.replacing = null;
      }
      S.mode = btn.dataset.mode; S.buffer = []; render();
    }));
    document.getElementById('hand-calc-btn').addEventListener('click', open);
    document.getElementById('hc-back').addEventListener('click', close);
    document.getElementById('hc-kb-toggle').addEventListener('click', () => {
      const bottom = document.querySelector('.hc-bottom');
      const btn    = document.getElementById('hc-kb-toggle');
      const hidden = bottom.classList.toggle('hidden');
      btn.classList.toggle('kb-hidden', hidden);
      btn.title = hidden ? '展开键盘' : '收起键盘';
    });
    document.getElementById('hc-clear-all').addEventListener('click', () => {
      resetState();
      ['hc-self-drawn','hc-dealer-win','hc-last-tile','hc-kong-win','hc-wall-last','hc-river-last',
       'hc-riichi','hc-fan-tian_he','hc-fan-di_he','hc-fan-ren_he','hc-dora','hc-ippatsu'].forEach(id => {
        const el = document.getElementById(id); el.checked = false; el.disabled = false;
      });
      const riichiTypeSel = document.getElementById('hc-riichi-type');
      riichiTypeSel.value = 'riichi'; riichiTypeSel.disabled = true;
      const doraCountSel = document.getElementById('hc-dora-count');
      doraCountSel.value = '1'; doraCountSel.disabled = true;
      document.getElementById('hc-ippatsu').disabled = true;
      document.getElementById('hc-flowers').value   = 0;
      document.getElementById('hc-prevalent').value = 0;
      document.getElementById('hc-seat').value      = 0;
      render();
    });
    document.getElementById('hc-buffer-clear').addEventListener('click', () => { S.buffer = []; render(); });
    dom.calcBtn.addEventListener('click', () => Calculator.ready.then(doCalculate));
    document.getElementById('hc-dealer-win').addEventListener('change', e => {
      S.dealerWin = e.target.checked;
    });
    document.getElementById('hc-self-drawn').addEventListener('change', e => {
      S.selfDrawn = e.target.checked;
      // 自摸取消 → 海底捞月不再成立；自摸勾上 → 河底捞月不再成立
      if (!e.target.checked && S.wallLast)  { S.wallLast  = false; document.getElementById('hc-wall-last').checked  = false; }
      if ( e.target.checked && S.riverLast) { S.riverLast = false; document.getElementById('hc-river-last').checked = false; }
      // 自摸与杠上开铳互斥
      if (e.target.checked && S.gangKaiChong) { S.gangKaiChong = false; document.getElementById('hc-gang-kai-chong').checked = false; }
      // 自摸与一发互斥
      if (e.target.checked && S.ippatsu) { S.ippatsu = false; document.getElementById('hc-ippatsu').checked = false; }
      applyConditionToFans('selfDrawn', e.target.checked);
    });
    document.getElementById('hc-last-tile').addEventListener('change',  e => { S.lastTile   = e.target.checked; applyConditionToFans('lastTile',   e.target.checked); });
    document.getElementById('hc-kong-win').addEventListener('change',   e => {
      S.kongWin = e.target.checked;
      if (e.target.checked) {
        // 杠上开花必然自摸
        S.selfDrawn = true; document.getElementById('hc-self-drawn').checked = true;
        applyConditionToFans('selfDrawn', true);
        // 杠上开花与河底捞鱼互斥
        if (S.riverLast) { S.riverLast = false; document.getElementById('hc-river-last').checked = false; }
        // 杠上开花与杠上开铳互斥
        if (S.gangKaiChong) { S.gangKaiChong = false; document.getElementById('hc-gang-kai-chong').checked = false; }
      }
      applyConditionToFans('kongWin', e.target.checked);
    });
    document.getElementById('hc-wall-last').addEventListener('change',  e => {
      S.wallLast = e.target.checked;
      // 海底捞月互斥河底捞月；海底捞月必然自摸
      if (e.target.checked) {
        S.riverLast = false; document.getElementById('hc-river-last').checked = false;
        S.selfDrawn = true;  document.getElementById('hc-self-drawn').checked  = true;
        applyConditionToFans('selfDrawn', true);
        // 海底捞月（自摸）与杠上开铳互斥
        if (S.gangKaiChong) { S.gangKaiChong = false; document.getElementById('hc-gang-kai-chong').checked = false; }
      }
      applyConditionToFans('wallLast', e.target.checked);
    });
    document.getElementById('hc-river-last').addEventListener('change', e => {
      S.riverLast = e.target.checked;
      // 河底捞鱼互斥海底捞月；必然非自摸；与杠上开花互斥
      if (e.target.checked) {
        S.wallLast  = false; document.getElementById('hc-wall-last').checked  = false;
        S.selfDrawn = false; document.getElementById('hc-self-drawn').checked  = false;
        applyConditionToFans('selfDrawn', false);
        if (S.kongWin) { S.kongWin = false; document.getElementById('hc-kong-win').checked = false; }
      }
      applyConditionToFans('riverLast', e.target.checked);
    });
    ['tian_he', 'di_he', 'ren_he'].forEach(fanId => {
      document.getElementById(`hc-fan-${fanId}`).addEventListener('change', e => {
        S[`fan_${fanId}`] = e.target.checked;
        if (e.target.checked) {
          // 三者互斥
          ['tian_he', 'di_he', 'ren_he'].filter(id => id !== fanId).forEach(id => {
            S[`fan_${id}`] = false;
            document.getElementById(`hc-fan-${id}`).checked = false;
          });
        }
        applyFanToConditions(fanId, e.target.checked);
      });
    });
    document.getElementById('hc-riichi').addEventListener('change', e => {
      S.riichi = e.target.checked;
      const sel = document.getElementById('hc-riichi-type');
      sel.disabled = !e.target.checked;
      const cbIppatsu = document.getElementById('hc-ippatsu');
      if (!e.target.checked) {
        sel.value = 'riichi'; S.riichiType = 'riichi';
        S.ippatsu = false; cbIppatsu.checked = false; cbIppatsu.disabled = true;
      } else {
        cbIppatsu.disabled = false;
      }
    });
    document.getElementById('hc-riichi-type').addEventListener('change', e => {
      S.riichiType = e.target.value;
    });
    document.getElementById('hc-dora').addEventListener('change', e => {
      const selDora = document.getElementById('hc-dora-count');
      selDora.disabled = !e.target.checked;
      S.dora = e.target.checked ? parseInt(selDora.value) : 0;
    });
    document.getElementById('hc-dora-count').addEventListener('change', e => {
      if (document.getElementById('hc-dora').checked) S.dora = parseInt(e.target.value);
    });
    document.getElementById('hc-ippatsu').addEventListener('change', e => {
      S.ippatsu = e.target.checked;
      // 一发与自摸互斥
      if (e.target.checked && S.selfDrawn) {
        S.selfDrawn = false;
        document.getElementById('hc-self-drawn').checked = false;
        applyConditionToFans('selfDrawn', false);
      }
    });
    document.getElementById('hc-gang-kai-chong').addEventListener('change', e => {
      S.gangKaiChong = e.target.checked;
      if (e.target.checked) {
        // 杠上开铳为非自摸放铳，与自摸/杠上开花/海底捞月互斥
        if (S.selfDrawn) { S.selfDrawn = false; document.getElementById('hc-self-drawn').checked = false; applyConditionToFans('selfDrawn', false); }
        if (S.kongWin)   { S.kongWin   = false; document.getElementById('hc-kong-win').checked   = false; }
        if (S.wallLast)  { S.wallLast  = false; document.getElementById('hc-wall-last').checked  = false; }
      }
    });
    document.getElementById('hc-prevalent').addEventListener('change',  e => { S.prevalentWind = +e.target.value; });
    document.getElementById('hc-seat').addEventListener('change',       e => { S.seatWind      = +e.target.value; });
    document.getElementById('hc-flowers').addEventListener('change',    e => { S.flowers       = +e.target.value; });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
