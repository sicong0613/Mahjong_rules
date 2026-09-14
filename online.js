// online.js — 在线协助理牌：远程视频代打时，自动理牌并报告打牌的物理位置

(function () {
  'use strict';

  // ─── 牌面编码 / SVG 文件名映射（复制自 calc-ui.js，保持独立不依赖其内部实现）───
  const SUIT_CHARS  = ['', 'm', 's', 'p'];
  const HONOR_SVG   = { 0x41: 'E', 0x42: 'S', 0x43: 'W', 0x44: 'N', 0x45: 'Z', 0x46: 'F', 0x47: 'B' };
  const HONOR_LABEL = { 0x41: '东', 0x42: '南', 0x43: '西', 0x44: '北', 0x45: '中', 0x46: '发', 0x47: '白' };

  function tileToSvg(code, isRed) {
    const suit = code >> 4;
    const rank = code & 0xF;
    if (suit >= 1 && suit <= 3) return `${isRed ? '0' : rank}${SUIT_CHARS[suit]}.svg`;
    return `${HONOR_SVG[code] || 'X'}.svg`;
  }

  function tileLabel(code, isRed) {
    const suit = code >> 4;
    const rank = code & 0xF;
    if (suit >= 1 && suit <= 3) {
      const suitName = suit === 1 ? '万' : suit === 2 ? '条' : '饼';
      return `${isRed ? '赤' : rank}${suitName}`;
    }
    return HONOR_LABEL[code] || '?';
  }

  // 排序键：万(1xx) < 条(2xx) < 饼(3xx) < 字风东南西北(4xx) < 三元中发白
  function sortKey(t) {
    const suit = t.code >> 4;
    const rank = t.code & 0xF;
    if (suit >= 1 && suit <= 3) return suit * 100 + rank;
    return 400 + t.code;
  }

  // ─── 选牌器行定义（同 calc-ui.js）───
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
    rows.push([0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47].map(c => ({ code: c, isRed: false })));
    return rows;
  }
  const PICKER_ROWS = buildPickerRows();

  // ─── 状态 ────────────────────────────────────────────────────
  // phase: 'setup' | 'draw' | 'pending' | 'discardOnly' | 'insertDialog'
  //   setup       : 起手输入 13/14 张牌，尚未点「起牌」
  //   draw        : 立牌已定，等待摸牌/鸣别家牌 输入
  //   pending     : 摸牌区已有一张待处理的牌（自摸或待鸣），可选择鸣牌或直接打出
  //   discardOnly : 鸣牌（吃/碰）后或起手14张，必须从立牌区选1张打出
  //   insertDialog: 打出了立牌区的牌但摸牌区仍有牌未处理，等待用户指定插入位置
  let S;
  function resetState() {
    S = {
      phase: 'setup',
      inputBuffer: [],      // 起手输入缓冲 [{code,isRed}]
      standing: [],         // [{code,isRed,pos}] pos = 物理位置（1..N，连续）
      drawTile: null,       // {code,isRed} | null
      melds: [],            // [{type:'chow'|'pung'|'kong', concealed:bool, tiles:[{code,isRed}]}]
      meldMode: null,       // null | 'chi' | 'pon' | 'minggang' | 'angang' | 'gangUpgrade'
      upgradeTargetIdx: -1, // meldMode==='gangUpgrade' 时，待升级的碰在 melds 中的下标
      selectedStanding: new Set(), // 选中的立牌区下标（display 数组下标）
      selectedDraw: false,         // 摸牌区的牌是否被选中（单选打牌用）
      insertSide: 'left',   // 'left' | 'right'，插入弹窗当前选择的方向
    };
  }
  resetState();

  // ─── DOM 缓存 ─────────────────────────────────────────────────
  const dom = {};

  function el(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }

  function makeTileEl(code, isRed, size) {
    const d = el('div', `hc-tile hc-tile-${size}`);
    const img = document.createElement('img');
    img.src = `img/tiles/${tileToSvg(code, isRed)}`;
    img.alt = tileLabel(code, isRed);
    img.draggable = false;
    d.appendChild(img);
    return d;
  }

  function makeTileRaw(svgFile, size) {
    const d = el('div', `hc-tile hc-tile-${size} hc-tile-np`);
    const img = document.createElement('img');
    img.src = `img/tiles/${svgFile}`;
    img.draggable = false;
    d.appendChild(img);
    return d;
  }

  // ─── 计数（用于选牌器变暗）───────────────────────────────────
  function countAllTiles() {
    const m = new Map();
    const inc = (code, isRed) => {
      const vk = `${code}_${isRed ? 1 : 0}`;
      const tk = `${code}_total`;
      m.set(vk, (m.get(vk) || 0) + 1);
      m.set(tk, (m.get(tk) || 0) + 1);
    };
    for (const t of S.inputBuffer) inc(t.code, t.isRed);
    for (const t of S.standing)    inc(t.code, t.isRed);
    if (S.drawTile)                inc(S.drawTile.code, S.drawTile.isRed);
    for (const meld of S.melds) for (const t of meld.tiles) inc(t.code, t.isRed);
    return m;
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
    const pickable = S.phase === 'setup' || S.phase === 'draw';
    dom.picker.querySelectorAll('.hc-picker-tile').forEach(t => {
      t.style.pointerEvents = pickable ? '' : 'none';
      t.style.opacity = pickable ? '' : '.35';
    });
    // 退格键：起手输入阶段随时可用；摸牌区的牌被选中时也可用（删除摸错的牌）
    const backspaceable = pickable || (S.phase === 'pending' && S.meldMode === null && S.selectedDraw);
    const bsKey = dom.picker.querySelector('.hc-backspace-key');
    if (bsKey) {
      bsKey.style.pointerEvents = backspaceable ? '' : 'none';
      bsKey.style.opacity = backspaceable ? '' : '.35';
    }
  }

  // ─── 输入路由 ─────────────────────────────────────────────────
  function onPickerClick(td) {
    const t = { code: td.code, isRed: td.isRed };
    if (S.phase === 'setup') {
      if (S.inputBuffer.length >= 14) { showMsg('已达 14 张上限'); return; }
      S.inputBuffer.push(t);
      render();
    } else if (S.phase === 'draw') {
      S.drawTile = t;
      S.phase = 'pending';
      render();
    }
  }

  function backspace() {
    if (S.phase === 'setup') {
      S.inputBuffer.pop();
      render();
    } else if (S.phase === 'pending' && S.meldMode === null && S.selectedDraw) {
      // 摸牌区的牌需先选中，再退格删除，避免误触
      S.drawTile = null;
      S.selectedDraw = false;
      S.phase = 'draw';
      render();
    }
  }

  // ─── 立牌区重新编号（按物理原序连续编号）─────────────────────
  function renumberPositions() {
    const byPhysical = [...S.standing].sort((a, b) => a.pos - b.pos);
    byPhysical.forEach((t, i) => { t.pos = i + 1; });
  }

  function sortStandingDisplay() {
    S.standing.sort((a, b) => sortKey(a) - sortKey(b));
  }

  // ─── 起牌 ─────────────────────────────────────────────────────
  function doStart() {
    const n = S.inputBuffer.length;
    if (n !== 13 && n !== 14) return;
    S.standing = S.inputBuffer.map((t, i) => ({ code: t.code, isRed: t.isRed, pos: i + 1 }));
    S.inputBuffer = [];
    sortStandingDisplay();
    S.phase = n === 14 ? 'discardOnly' : 'draw';
    showMsg(n === 14 ? '起牌完成（14 张），请直接选择打出一张。' : '起牌完成，等待摸牌。');
    render();
  }

  // ─── 清空 ─────────────────────────────────────────────────────
  function doClear() {
    resetState();
    showMsg('');
    render();
  }

  // ─── 鸣牌按钮（吃/碰/明杠/暗杠）────────────────────────────────
  function findUpgradeTarget() {
    if (!S.drawTile) return -1;
    return S.melds.findIndex(m => m.type === 'pung' && m.tiles[0].code === S.drawTile.code);
  }

  function startMeldMode(mode) {
    if (!S.drawTile || S.phase !== 'pending') return;
    // 再次点击同一按钮 = 取消（明杠按钮对应 'minggang' 与 'gangUpgrade' 两种内部状态）
    const isSameButton = S.meldMode === mode ||
      (mode === 'minggang' && S.meldMode === 'gangUpgrade');
    if (isSameButton) {
      S.meldMode = null; S.selectedStanding.clear(); S.selectedDraw = false;
      render(); return;
    }
    S.selectedStanding.clear();
    S.selectedDraw = false;
    if (mode === 'minggang') {
      const idx = findUpgradeTarget();
      if (idx !== -1) {
        S.meldMode = 'gangUpgrade';
        S.upgradeTargetIdx = idx;
        render();
        return;
      }
    }
    S.meldMode = mode;
    render();
  }

  function requiredCountFor(mode) {
    if (mode === 'chi' || mode === 'pon') return 2;
    if (mode === 'minggang' || mode === 'angang') return 3;
    return 0; // gangUpgrade
  }

  function meldModeLabel(mode) {
    return { chi: '吃', pon: '碰', minggang: '明杠', angang: '暗杠', gangUpgrade: '加杠' }[mode] || '';
  }

  // ─── 立牌区点击 ───────────────────────────────────────────────
  function onStandingClick(idx) {
    if (S.phase === 'setup') {
      S.inputBuffer.splice(idx, 1);
      render(); return;
    }
    if (S.meldMode && S.meldMode !== 'gangUpgrade') {
      const need = requiredCountFor(S.meldMode);
      if (S.selectedStanding.has(idx)) {
        S.selectedStanding.delete(idx);
      } else if (S.selectedStanding.size < need) {
        S.selectedStanding.add(idx);
      } else {
        showMsg(`最多选择 ${need} 张牌`);
      }
      render(); return;
    }
    if (S.meldMode === 'gangUpgrade') return; // 加杠无需选牌
    if (S.phase === 'pending' || S.phase === 'discardOnly') {
      // 单选打牌模式：点击即为唯一选中，再点一次取消
      if (S.selectedStanding.has(idx) && !S.selectedDraw) {
        S.selectedStanding.clear();
      } else {
        S.selectedStanding.clear();
        S.selectedStanding.add(idx);
        S.selectedDraw = false;
      }
      render();
    }
  }

  function onDrawClick() {
    if (S.phase !== 'pending' || S.meldMode) return;
    if (S.selectedDraw) {
      S.selectedDraw = false;
    } else {
      S.selectedDraw = true;
      S.selectedStanding.clear();
    }
    render();
  }

  // ─── 鸣牌确认 ─────────────────────────────────────────────────
  function codesEqual(a, b) { return a.code === b.code; }

  function isValidChi(codes) {
    const suit = codes[0] >> 4;
    if (suit < 1 || suit > 3) return false;
    if (codes.some(c => (c >> 4) !== suit)) return false;
    const ranks = codes.map(c => c & 0xF).sort((a, b) => a - b);
    return ranks[1] === ranks[0] + 1 && ranks[2] === ranks[1] + 1 &&
           new Set(ranks).size === 3;
  }

  function confirmMeld() {
    const mode = S.meldMode;
    if (mode === 'gangUpgrade') {
      const target = S.melds[S.upgradeTargetIdx];
      target.tiles.push({ ...S.drawTile });
      target.type = 'kong';
      target.concealed = false;
      finishMeldSuccess('加杠', [S.drawTile], true);
      return;
    }
    const need = requiredCountFor(mode);
    if (S.selectedStanding.size !== need) return;
    const idxs = [...S.selectedStanding].sort((a, b) => a - b);
    const selTiles = idxs.map(i => S.standing[i]);
    const codes = [...selTiles.map(t => t.code), S.drawTile.code];

    let valid = false;
    if (mode === 'chi')      valid = isValidChi(codes);
    else if (mode === 'pon') valid = selTiles.every(t => codesEqual(t, S.drawTile));
    else                     valid = selTiles.every(t => codesEqual(t, S.drawTile)); // minggang/angang

    if (!valid) {
      showMsg(`所选牌无法组成${meldModeLabel(mode)}，请重新选择`);
      S.selectedStanding.clear();
      render(); return;
    }

    // 移除选中的立牌（倒序 splice 避免下标错位）
    const removed = [];
    for (let k = idxs.length - 1; k >= 0; k--) removed.unshift(S.standing.splice(idxs[k], 1)[0]);
    renumberPositions();

    const meldTiles = [...removed, { ...S.drawTile }].sort((a, b) => (a.code & 0xF) - (b.code & 0xF));
    const meldType = mode === 'chi' ? 'chow' : mode === 'pon' ? 'pung' : 'kong';
    S.melds.push({ type: meldType, concealed: mode === 'angang', tiles: meldTiles });

    const isKong = mode === 'minggang' || mode === 'angang';
    finishMeldSuccess(meldModeLabel(mode), meldTiles, isKong);
  }

  function finishMeldSuccess(label, tiles, isKong) {
    S.drawTile = null;
    S.meldMode = null;
    S.upgradeTargetIdx = -1;
    S.selectedStanding.clear();
    S.selectedDraw = false;
    if (isKong) {
      S.phase = 'draw';
      showMsg(`${label}成功，请摸牌。`, tiles);
    } else {
      S.phase = 'discardOnly';
      showMsg(`${label}成功，请选择打出一张。`, tiles);
    }
    render();
  }

  // ─── 打牌 ─────────────────────────────────────────────────────
  function doDiscard() {
    if (S.meldMode) return;
    if (S.selectedDraw) {
      const t = S.drawTile;
      S.drawTile = null;
      S.selectedDraw = false;
      S.phase = 'draw';
      showMsg('打出摸到的牌：', [t]);
      render();
      return;
    }
    if (S.selectedStanding.size !== 1) return;
    const idx = [...S.selectedStanding][0];
    const t = S.standing[idx];
    const n = S.standing.length;
    const leftPos = t.pos;
    const rightPos = n + 1 - leftPos;
    S.standing.splice(idx, 1);
    renumberPositions();
    S.selectedStanding.clear();

    if (S.drawTile) {
      S.phase = 'insertDialog';
      S.insertSide = 'left';
      showMsg(`打出：`, [t], `左起第 ${leftPos} 张 / 右起第 ${rightPos} 张`);
      render();
      openInsertDialog(t, leftPos, rightPos);
    } else {
      S.phase = 'draw';
      showMsg(`打出：`, [t], `左起第 ${leftPos} 张 / 右起第 ${rightPos} 张`);
      render();
    }
  }

  // ─── 插入弹窗 ─────────────────────────────────────────────────
  function openInsertDialog(discardedTile, leftPos, rightPos) {
    dom.insertDiscardInfo.innerHTML = '';
    dom.insertDiscardInfo.appendChild(
      buildMsgLine(`打出：`, [discardedTile], `左起第 ${leftPos} 张 / 右起第 ${rightPos} 张`)
    );
    const m = S.standing.length; // 当前立牌数，插入后变为 m+1
    const sel = dom.insertPos;
    sel.innerHTML = '';
    for (let k = 1; k <= m + 1; k++) {
      const opt = document.createElement('option');
      opt.value = k; opt.textContent = k;
      sel.appendChild(opt);
    }
    S.insertSide = 'left';
    dom.insertLeftBtn.classList.add('active');
    dom.insertRightBtn.classList.remove('active');
    dom.insertModal.classList.remove('hidden');
  }

  function closeInsertDialog() {
    dom.insertModal.classList.add('hidden');
  }

  function confirmInsert() {
    const m = S.standing.length;
    const k = parseInt(dom.insertPos.value, 10);
    const leftPos = S.insertSide === 'left' ? k : (m + 2 - k);
    for (const t of S.standing) if (t.pos >= leftPos) t.pos += 1;
    S.standing.push({ code: S.drawTile.code, isRed: S.drawTile.isRed, pos: leftPos });
    sortStandingDisplay();
    const insertedTile = { code: S.drawTile.code, isRed: S.drawTile.isRed };
    S.drawTile = null;
    S.phase = 'draw';
    closeInsertDialog();
    showMsg(`摸的`, [insertedTile], `已插入左起第 ${leftPos} 张`, /* append */ true);
    render();
  }

  // ─── 消息区 ───────────────────────────────────────────────────
  // 构建一行消息（文字前缀 + 牌图 + 强调后缀），供 #on-msg 和插入弹窗共用
  function buildMsgLine(prefix, tiles, suffix) {
    const line = el('div', 'on-msg-line');
    if (prefix) line.appendChild(document.createTextNode(prefix));
    if (tiles && tiles.length) {
      const wrap = el('span', 'on-msg-tiles');
      tiles.forEach(t => wrap.appendChild(makeTileEl(t.code, t.isRed, 'md')));
      line.appendChild(wrap);
    }
    if (suffix) {
      const s = el('strong'); s.textContent = suffix; s.style.color = 'var(--accent)';
      line.appendChild(s);
    }
    return line;
  }

  // append=false（默认）清空后显示一行；append=true 在已有内容后另起一行追加
  // （用于「打出左起X/右起Y」之后紧跟着的「已插入左起Z」提示，避免后者把前者覆盖掉）
  function showMsg(prefix, tiles, suffix, append) {
    if (!append) dom.msg.innerHTML = '';
    dom.msg.appendChild(buildMsgLine(prefix, tiles, suffix));
  }

  // ─── 渲染：立牌区 ─────────────────────────────────────────────
  function renderStanding() {
    dom.standingArea.innerHTML = '';
    if (S.phase === 'setup') {
      dom.setupCount.textContent = `${S.inputBuffer.length} 张（需 13 或 14 张）`;
      const slots = Math.max(13, S.inputBuffer.length);
      for (let i = 0; i < slots; i++) {
        const t = S.inputBuffer[i];
        if (t) {
          const tEl = makeTileEl(t.code, t.isRed, 'md');
          tEl.addEventListener('click', () => onStandingClick(i));
          dom.standingArea.appendChild(tEl);
        } else {
          dom.standingArea.appendChild(makeTileRaw('X.svg', 'md'));
        }
      }
      return;
    }
    dom.setupCount.textContent = `${S.standing.length} 张`;
    S.standing.forEach((t, i) => {
      const wrap = el('div', 'on-tile-wrap');
      const tEl = makeTileEl(t.code, t.isRed, 'md');
      const selected = S.selectedStanding.has(i);
      if (selected) tEl.classList.add('hc-selected');
      tEl.addEventListener('click', () => onStandingClick(i));
      wrap.appendChild(tEl);
      const badge = el('span', 'on-pos-badge');
      badge.textContent = t.pos;
      wrap.appendChild(badge);
      dom.standingArea.appendChild(wrap);
    });
  }

  // ─── 渲染：摸牌区 ─────────────────────────────────────────────
  function renderDraw() {
    dom.drawArea.innerHTML = '';
    if (!S.drawTile) {
      dom.drawArea.appendChild(makeTileRaw('X.svg', 'md'));
      return;
    }
    const tEl = makeTileEl(S.drawTile.code, S.drawTile.isRed, 'md');
    if (S.selectedDraw) tEl.classList.add('hc-selected');
    tEl.addEventListener('click', onDrawClick);
    dom.drawArea.appendChild(tEl);
  }

  // ─── 渲染：副露区 ─────────────────────────────────────────────
  function renderMelds() {
    dom.meldArea.innerHTML = '';
    S.melds.forEach(meld => {
      const card = el('div', 'hc-meld-card');
      const tilesDiv = el('div', 'hc-meld-tiles');
      meld.tiles.forEach((t, j) => {
        let tEl;
        if (meld.type === 'kong' && meld.concealed) {
          tEl = (j === 0 || j === 3) ? makeTileRaw('X.svg', 'md') : makeTileEl(t.code, t.isRed, 'md');
        } else {
          tEl = makeTileEl(t.code, t.isRed, 'md');
        }
        tilesDiv.appendChild(tEl);
      });
      card.appendChild(tilesDiv);
      const lbl = el('span', 'hc-meld-lbl');
      lbl.textContent = meld.type === 'chow' ? '吃' : meld.type === 'pung' ? '碰' : (meld.concealed ? '暗杠' : '明杠');
      card.appendChild(lbl);
      dom.meldArea.appendChild(card);
    });
  }

  // ─── 渲染：鸣牌按钮 & 提示 ──────────────────────────────────────
  function renderMeldButtons() {
    const base = S.phase === 'pending' && !!S.drawTile;
    [dom.chiBtn, dom.ponBtn, dom.minggangBtn, dom.angangBtn].forEach(b => b.disabled = !base);
    dom.chiBtn.classList.toggle('active', S.meldMode === 'chi');
    dom.ponBtn.classList.toggle('active', S.meldMode === 'pon');
    dom.minggangBtn.classList.toggle('active', S.meldMode === 'minggang' || S.meldMode === 'gangUpgrade');
    dom.angangBtn.classList.toggle('active', S.meldMode === 'angang');

    let hint = '';
    if (S.meldMode === 'gangUpgrade') {
      hint = `摸到的牌可直接加杠已有的碰，点击「确认」完成。`;
    } else if (S.meldMode) {
      const need = requiredCountFor(S.meldMode);
      hint = `请在立牌区选择 ${need} 张牌组成${meldModeLabel(S.meldMode)}（已选 ${S.selectedStanding.size}/${need}），再点「确认」。`;
    }
    dom.meldHint.textContent = hint;
  }

  // ─── 渲染：主操作按钮 ───────────────────────────────────────────
  function renderActionButtons() {
    dom.clearBtn.disabled = false;
    dom.startBtn.disabled = !(S.phase === 'setup' && (S.inputBuffer.length === 13 || S.inputBuffer.length === 14));
    dom.discardBtn.disabled = !(!S.meldMode && (S.phase === 'pending' || S.phase === 'discardOnly') &&
      (S.selectedDraw || S.selectedStanding.size === 1));
    let confirmEnabled = false;
    if (S.meldMode === 'gangUpgrade') confirmEnabled = true;
    else if (S.meldMode) confirmEnabled = S.selectedStanding.size === requiredCountFor(S.meldMode);
    dom.confirmBtn.disabled = !confirmEnabled;
  }

  // ─── 总渲染入口 ─────────────────────────────────────────────────
  function render() {
    if (S.phase !== 'setup') sortStandingDisplay(); // 兜底：任何状态变动后渲染前必定重新理牌
    renderStanding();
    renderDraw();
    renderMelds();
    renderMeldButtons();
    renderActionButtons();
    updatePickerCounts();
  }

  // ─── 帮助弹窗 ─────────────────────────────────────────────────
  function initHelpModal() {
    dom.helpBtn.addEventListener('click', () => dom.helpModal.classList.remove('hidden'));
    dom.helpClose.addEventListener('click', () => dom.helpModal.classList.add('hidden'));
    dom.helpModal.addEventListener('click', e => { if (e.target === dom.helpModal) dom.helpModal.classList.add('hidden'); });
  }

  // ─── 初始化 ───────────────────────────────────────────────────
  function init() {
    dom.standingArea  = document.getElementById('on-standing-area');
    dom.setupCount    = document.getElementById('on-setup-count');
    dom.drawArea      = document.getElementById('on-draw-area');
    dom.meldArea      = document.getElementById('on-meld-area');
    dom.meldHint      = document.getElementById('on-meld-hint');
    dom.msg           = document.getElementById('on-msg');
    dom.picker        = document.getElementById('on-picker');

    dom.chiBtn        = document.getElementById('on-chi-btn');
    dom.ponBtn        = document.getElementById('on-pon-btn');
    dom.minggangBtn   = document.getElementById('on-minggang-btn');
    dom.angangBtn     = document.getElementById('on-angang-btn');

    dom.clearBtn      = document.getElementById('on-clear-btn');
    dom.startBtn      = document.getElementById('on-start-btn');
    dom.sortBtn       = document.getElementById('on-sort-btn');
    dom.discardBtn    = document.getElementById('on-discard-btn');
    dom.confirmBtn    = document.getElementById('on-confirm-btn');

    dom.insertModal       = document.getElementById('on-insert-modal');
    dom.insertDiscardInfo = document.getElementById('on-insert-discard-info');
    dom.insertLeftBtn     = document.getElementById('on-insert-left');
    dom.insertRightBtn    = document.getElementById('on-insert-right');
    dom.insertPos         = document.getElementById('on-insert-pos');
    dom.insertConfirm     = document.getElementById('on-insert-confirm');

    dom.helpBtn   = document.getElementById('on-help-btn');
    dom.helpModal = document.getElementById('on-help-modal');
    dom.helpClose = document.getElementById('on-help-close');

    renderPicker();

    dom.clearBtn.addEventListener('click', doClear);
    dom.startBtn.addEventListener('click', doStart);
    dom.sortBtn.addEventListener('click', () => { sortStandingDisplay(); render(); });
    dom.discardBtn.addEventListener('click', doDiscard);
    dom.confirmBtn.addEventListener('click', () => {
      if (S.meldMode) confirmMeld();
    });

    dom.chiBtn.addEventListener('click', () => startMeldMode('chi'));
    dom.ponBtn.addEventListener('click', () => startMeldMode('pon'));
    dom.minggangBtn.addEventListener('click', () => startMeldMode('minggang'));
    dom.angangBtn.addEventListener('click', () => startMeldMode('angang'));

    dom.insertLeftBtn.addEventListener('click', () => {
      S.insertSide = 'left';
      dom.insertLeftBtn.classList.add('active');
      dom.insertRightBtn.classList.remove('active');
    });
    dom.insertRightBtn.addEventListener('click', () => {
      S.insertSide = 'right';
      dom.insertRightBtn.classList.add('active');
      dom.insertLeftBtn.classList.remove('active');
    });
    dom.insertConfirm.addEventListener('click', confirmInsert);

    initHelpModal();
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
