/* ── 状态 ───────────────────────────────────────────── */
const state = {
  search:       '',
  fanFilter:    null,        // null = 全部，或具体番数
  tagFilters:   new Set(),   // AND 逻辑
  calcMode:     false,
  selected:     new Set(),   // 计番模式中已勾选的 id
  showDlc:      false,
  lang:         'zh',        // 'zh' | 'en'
  jumpOriginId: null,        // 跳转前的来源卡片 id
};

/* ── DOM 引用 ────────────────────────────────────────── */
const $fanList    = document.getElementById('fan-list');
const $fanChips   = document.getElementById('fan-chips');
const $tagChips   = document.getElementById('tag-chips');
const $summary    = document.getElementById('results-summary');
const $calcBar    = document.getElementById('calc-bar');
const $calcCount  = document.getElementById('calc-count');
const $calcTotal  = document.getElementById('calc-total');
const $searchInput= document.getElementById('search-input');

/* ── 初始化 ─────────────────────────────────────────── */
function init() {
  renderFilterChips();
  renderAll();
  bindEvents();
  const hash = window.location.hash.slice(1);
  if (hash) scrollToFanCard(hash);
}

/* ── 事件绑定 ────────────────────────────────────────── */
function bindEvents() {
  $searchInput.addEventListener('input', e => {
    state.search = e.target.value.trim();
    renderAll();
  });

  document.getElementById('calc-close').addEventListener('click', toggleCalcMode);
  document.getElementById('calc-clear').addEventListener('click', () => {
    state.selected.clear();
    updateCalcBar();
    document.querySelectorAll('.calc-checkbox').forEach(cb => cb.checked = false);
    document.querySelectorAll('.fan-card').forEach(c => c.classList.remove('calc-selected'));
  });

  document.getElementById('dlc-toggle').addEventListener('click', () => {
    state.showDlc = !state.showDlc;
    document.getElementById('dlc-toggle').textContent =
      state.showDlc ? '隐藏 DLC' : '显示 DLC';
    renderAll();
  });

  document.getElementById('lang-toggle').addEventListener('click', () => {
    state.lang = state.lang === 'zh' ? 'en' : 'zh';
    document.getElementById('lang-toggle').textContent =
      state.lang === 'zh' ? 'Eng' : '中文';
    document.documentElement.dataset.lang = state.lang;
    renderAll();
    updateCalcI18n();
  });

  document.getElementById('clear-filters').addEventListener('click', () => {
    state.fanFilter  = null;
    state.tagFilters.clear();
    state.search     = '';
    $searchInput.value = '';
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    renderAll();
  });

  document.addEventListener('touchstart', e => {
    if (e.target.closest('.term')) e.stopPropagation();
  }, { passive: true });

  document.addEventListener('click', e => {
    const term = e.target.closest('.term');
    if (term) {
      if (term === _activeTerm) { hideTermPopup(); return; }
      _activeTerm = term;
      showTermPopup(term, term.dataset.term);
      return;
    }
    if (!e.target.closest('#term-popup')) hideTermPopup();
  });
}

/* ── 渲染筛选 chips ─────────────────────────────────── */
function renderFilterChips() {
  // 番数 chips
  FAN_TIERS.forEach(({ fan, label }) => {
    const btn = document.createElement('button');
    btn.className = `chip fan-chip`;
    btn.dataset.fan = fan;
    btn.textContent = fan === 0 ? '立直' : `${fan}番`;
    if (label) btn.textContent += ` ${label}`;
    btn.addEventListener('click', () => {
      state.fanFilter = state.fanFilter === fan ? null : fan;
      document.querySelectorAll('.fan-chip').forEach(c => c.classList.remove('active'));
      if (state.fanFilter !== null) btn.classList.add('active');
      renderAll();
    });
    $fanChips.appendChild(btn);
  });

  // 标签 chips
  ALL_TAGS.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'chip tag-chip';
    btn.textContent = tag;
    btn.dataset.tag = tag;
    btn.addEventListener('click', () => {
      if (state.tagFilters.has(tag)) {
        state.tagFilters.delete(tag);
        btn.classList.remove('active');
      } else {
        state.tagFilters.add(tag);
        btn.classList.add('active');
      }
      renderAll();
    });
    $tagChips.appendChild(btn);
  });
}

/* ── 过滤逻辑 ────────────────────────────────────────── */
function getFiltered() {
  const q = state.search.toLowerCase();
  return FANS_DATA.filter(f => {
    if (f.dlc && !state.showDlc) return false;
    if (state.fanFilter !== null && f.fan !== state.fanFilter) return false;
    if (state.tagFilters.size > 0) {
      for (const t of state.tagFilters) {
        if (!f.tags.includes(t)) return false;
      }
    }
    if (q) {
      const haystack = [f.name, ...(f.nameAlt || []), f.desc, ...(f.tags)].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

/* ── 主渲染 ─────────────────────────────────────────── */
function renderAll() {
  const filtered = getFiltered();
  $fanList.innerHTML = '';

  if (filtered.length === 0) {
    $fanList.innerHTML = '<div class="empty-state">没有符合条件的番种</div>';
    $summary.textContent = '';
    return;
  }

  const total = FANS_DATA.filter(f => !f.dlc || state.showDlc).length;
  $summary.textContent = filtered.length === total
    ? `共 ${total} 种番种`
    : `筛选结果：${filtered.length} / ${total} 种`;

  // 按番数分组
  const grouped = new Map();
  FAN_TIERS.forEach(({ fan }) => grouped.set(fan, []));
  filtered.forEach(f => {
    if (grouped.has(f.fan)) grouped.get(f.fan).push(f);
  });

  FAN_TIERS.forEach(({ fan, label }) => {
    const items = grouped.get(fan);
    if (!items || items.length === 0) return;

    const section = document.createElement('section');
    section.className = 'fan-tier';
    section.id = `tier-${fan}`;

    const header = document.createElement('div');
    header.className = 'tier-header';
    header.innerHTML = `
      <span class="tier-fan-badge badge-${fan}">${fan === 0 ? '立直' : fan}</span>
      <span class="tier-label">${label || (fan + ' 番')}</span>
      <span class="tier-count">${items.length} 种</span>
      <span class="tier-arrow">▼</span>
    `;
    header.addEventListener('click', () => section.classList.toggle('collapsed'));

    const grid = document.createElement('div');
    grid.className = 'fan-grid';
    items.forEach(f => grid.appendChild(buildCard(f)));

    section.appendChild(header);
    section.appendChild(grid);
    $fanList.appendChild(section);
  });
}

/* ── 牌图渲染 ────────────────────────────────────────── */
const TILE_LABELS = {
  '1m':'一万','2m':'二万','3m':'三万','4m':'四万','5m':'五万',
  '6m':'六万','7m':'七万','8m':'八万','9m':'九万','0m':'赤五万',
  '1p':'一饼','2p':'二饼','3p':'三饼','4p':'四饼','5p':'五饼',
  '6p':'六饼','7p':'七饼','8p':'八饼','9p':'九饼','0p':'赤五饼',
  '1s':'一索','2s':'二索','3s':'三索','4s':'四索','5s':'五索',
  '6s':'六索','7s':'七索','8s':'八索','9s':'九索','0s':'赤五索',
  'E':'东','S':'南','W':'西','N':'北',
  'Z':'中','F':'发','B':'白',
  'X':'牌背','front':'牌面',
};

function makeTileImg(code) {
  const img = document.createElement('img');
  img.className = 'tile';
  img.src = `img/tiles/${code}.svg`;
  img.alt = TILE_LABELS[code] || code;
  img.title = TILE_LABELS[code] || code;
  img.onerror = function() {
    const span = document.createElement('span');
    span.className = 'tile tile-text';
    span.textContent = TILE_LABELS[code] || code;
    this.replaceWith(span);
  };
  return img;
}

function renderTiles(notation) {
  const row = document.createElement('div');
  row.className = 'tile-row';
  notation.trim().split(/\s+/).forEach(tok => {
    if (tok === '|') {
      const sep = document.createElement('span');
      sep.className = 'tile-sep';
      row.appendChild(sep);
      return;
    }
    if (tok.startsWith('>')) {
      const wrap = document.createElement('span');
      wrap.className = 'tile-rotated-wrap';
      wrap.appendChild(makeTileImg(tok.slice(1)));
      row.appendChild(wrap);
      return;
    }
    row.appendChild(makeTileImg(tok));
  });
  return row;
}

function renderRiver(notation) {
  const wrap = document.createElement('div');
  wrap.className = 'tile-river-wrap';
  const label = document.createElement('span');
  label.className = 'tile-river-label';
  label.textContent = '牌河';
  wrap.appendChild(label);
  const grid = document.createElement('div');
  grid.className = 'tile-river';
  notation.trim().split(/\s+/).forEach(tok => {
    const img = makeTileImg(tok);
    img.classList.add('tile-river-mark');
    grid.appendChild(img);
  });
  wrap.appendChild(grid);
  return wrap;
}

function renderWait(waitArr) {
  const row = document.createElement('div');
  row.className = 'tile-wait-row';
  const label = document.createElement('span');
  label.className = 'tile-wait-label';
  label.textContent = '听牌';
  row.appendChild(label);
  waitArr.forEach(code => {
    const img = makeTileImg(code);
    img.classList.add('tile-wait-mark');
    row.appendChild(img);
  });
  return row;
}

/* ── 桌面端双列同步展开 ──────────────────────────────── */
function toggleCardWithPair(card) {
  const newExpanded = !card.classList.contains('expanded');
  card.classList.toggle('expanded', newExpanded);

  if (window.innerWidth >= 900) {
    const grid  = card.closest('.fan-grid');
    const cards = Array.from(grid.querySelectorAll('.fan-card'));
    const idx   = cards.indexOf(card);
    const pair  = idx % 2 === 0 ? cards[idx + 1] : cards[idx - 1];
    if (pair) pair.classList.toggle('expanded', newExpanded);
  }
}

/* ── 构建单张卡片 ────────────────────────────────────── */
function buildCard(f) {
  const card = document.createElement('div');
  card.className = 'fan-card';
  card.dataset.id = f.id;

  const displayName = state.lang === 'en' && f.nameEn ? f.nameEn : f.name;
  const altText  = f.nameAlt?.length ? ` <span class="card-name-alt">/ ${f.nameAlt.join(' / ')}</span>` : '';
  const tagsHtml = f.tags.map(t =>
    `<span class="tag tag-${t}">${t}</span>`
  ).join('');

  const condHtml = f.conditions
    ? `<div class="detail-row"><strong>条件</strong><span>${f.conditions}</span></div>` : '';
  const excludeNames = f.excludes?.filter(Boolean) || [];
  const exclHtml = excludeNames.length
    ? `<div class="detail-row detail-excludes"><strong>不计</strong><span>${excludeNames.join('、')}</span></div>` : '';
  const htNames = (f.handTypes || []).join('、');
  const htHtml = htNames
    ? `<div class="detail-row"><strong>牌型</strong><span>${htNames}</span></div>` : '';
  const meldHtml = `<div class="detail-row"><strong>副露</strong><span>${f.meldAllowed ? '允许' : '不允许（必须门清）'}</span></div>`;
  const srcHtml  = `<div class="detail-row"><strong>来源</strong><span>${f.source}</span></div>`;
  const notesHtml = f.notes
    ? `<p class="card-notes">${f.notes}</p>` : '';
  const tipsHtml = f.tips
    ? `<p class="card-tips">${f.tips}</p>` : '';

  const isChecked = state.selected.has(f.id);
  const calcHtml = `
    <div class="calc-check-wrap">
      <input type="checkbox" class="calc-checkbox" id="chk-${f.id}" ${isChecked ? 'checked' : ''}>
      <label class="calc-check-label" for="chk-${f.id}">计入 ${f.fan === 0 ? '立直' : f.fan + ' 番'}</label>
    </div>`;

  card.innerHTML = `
    <div class="card-main">
      <div class="card-top">
        <span class="fan-badge badge-${f.fan}">${f.fan === 0 ? '立' : f.fan}</span>
        <span class="card-name" translate="no">${displayName}</span>${altText}
        <span class="card-source">${f.source}</span>
      </div>
      <p class="card-desc">${f.desc}</p>
      <div class="card-tags">${tagsHtml}</div>
      ${f.example ? '<div class="tile-primary"></div>' : ''}
    </div>
    <div class="card-details">
      ${condHtml}${exclHtml}
      ${f.examples?.length ? '<div class="tile-examples"></div>' : ''}
      ${tipsHtml}
      ${htHtml}${meldHtml}${srcHtml}${notesHtml}
    </div>
    ${calcHtml}
  `;

  if (f.example) {
    card.querySelector('.tile-primary').appendChild(renderTiles(f.example));
  }

  if (f.examples?.length) {
    const wrap = card.querySelector('.tile-examples');
    f.examples.forEach(({ label, tiles, river, wait }) => {
      const item = document.createElement('div');
      item.className = 'tile-example';
      if (label) {
        const lbl = document.createElement('div');
        lbl.className = 'tile-example-label';
        lbl.textContent = label;
        item.appendChild(lbl);
      }
      if (river) item.appendChild(renderRiver(river));
      if (tiles) item.appendChild(renderTiles(tiles));
      if (wait?.length) item.appendChild(renderWait(wait));
      wrap.appendChild(item);
    });
  }

  if (isChecked) card.classList.add('calc-selected');

  card.querySelector('.card-main').addEventListener('click', e => {
    if (!state.calcMode && !e.target.closest('.term')) toggleCardWithPair(card);
  });

  const checkbox = card.querySelector('.calc-checkbox');
  checkbox.addEventListener('change', e => {
    e.stopPropagation();
    if (e.target.checked) {
      state.selected.add(f.id);
      card.classList.add('calc-selected');
    } else {
      state.selected.delete(f.id);
      card.classList.remove('calc-selected');
    }
    updateCalcBar();
  });

  linkifyText(card);
  return card;
}

/* ── 术语联动 ────────────────────────────────────────── */
let _termMap = null, _termPattern = null, _activeTerm = null;

function getTermMap() {
  if (_termMap) return _termMap;
  _termMap = new Map();
  if (typeof GLOSSARY !== 'undefined') {
    for (const [term, def] of Object.entries(GLOSSARY))
      _termMap.set(term, { type: 'gloss', def });
  }
  FANS_DATA.forEach(f => {
    _termMap.set(f.name, { type: 'fan', data: f });
    (f.nameAlt || []).forEach(alt => _termMap.set(alt, { type: 'fan', data: f }));
  });
  return _termMap;
}

function getTermPattern() {
  if (_termPattern) return _termPattern;
  const terms = [...getTermMap().keys()].sort((a, b) => b.length - a.length);
  _termPattern = new RegExp(
    terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g'
  );
  return _termPattern;
}

function linkifyText(rootEl) {
  const pattern = getTermPattern();
  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
      if (node.parentElement?.closest(
        '.tile-row,.tile-river,.tile-wait-row,.card-tags,.calc-check-wrap,.term,.fan-badge,.card-source,.card-top'
      )) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  nodes.forEach(textNode => {
    const text = textNode.textContent;
    pattern.lastIndex = 0;
    if (!pattern.test(text)) return;
    pattern.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0, match;
    while ((match = pattern.exec(text)) !== null) {
      if (match.index > last)
        frag.appendChild(document.createTextNode(text.slice(last, match.index)));
      const span = document.createElement('span');
      span.className = 'term';
      span.dataset.term = match[0];
      span.setAttribute('translate', 'no');
      if (state.lang === 'en') {
        const entry = getTermMap().get(match[0]);
        let enText = null;
        if (entry?.type === 'fan' && entry.data.nameEn) enText = entry.data.nameEn;
        else if (entry?.type === 'gloss') enText = GLOSSARY_TERM_EN?.[match[0]];
        span.textContent = enText || match[0];
      } else {
        span.textContent = match[0];
      }
      frag.appendChild(span);
      last = match.index + match[0].length;
    }
    if (last < text.length)
      frag.appendChild(document.createTextNode(text.slice(last)));
    textNode.parentNode.replaceChild(frag, textNode);
  });
}

function showTermPopup(termEl, termName) {
  let popup = document.getElementById('term-popup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'term-popup';
    document.body.appendChild(popup);
  }
  const entry = getTermMap().get(termName);
  if (!entry) return;
  if (entry.type === 'fan') {
    const f = entry.data;
    const popupName = state.lang === 'en' && f.nameEn ? f.nameEn : f.name;
    popup.innerHTML = `
      <div class="term-popup-head">
        <span class="fan-badge badge-${f.fan} term-popup-badge">${f.fan === 0 ? '立' : f.fan}</span>
        <strong class="term-popup-name" translate="no">${popupName}</strong>
      </div>
      <p class="term-popup-desc">${f.desc}</p>
      <button class="term-popup-goto" data-id="${f.id}">→ 查看完整</button>`;
    popup.querySelector('.term-popup-goto').addEventListener('click', e => {
      e.stopPropagation();
      const originCard = termEl.closest('.fan-card');
      hideTermPopup();
      scrollToFanCard(f.id, originCard?.dataset.id ?? null);
    });
  } else {
    popup.innerHTML = `
      <div class="term-popup-head"><strong class="term-popup-name">${termName}</strong></div>
      <p class="term-popup-desc">${entry.def}</p>`;
  }
  popup.classList.remove('hidden');
  const rect = termEl.getBoundingClientRect();
  const W = 250, M = 8;
  let left = rect.left + window.scrollX;
  if (left + W > window.innerWidth - M) left = window.innerWidth - W - M;
  if (left < M) left = M;
  popup.style.left = left + 'px';
  popup.style.top  = (rect.bottom + window.scrollY + 6) + 'px';
}

function hideTermPopup() {
  _activeTerm = null;
  document.getElementById('term-popup')?.classList.add('hidden');
}

function scrollToFanCard(id, originId = null) {
  document.querySelectorAll('.card-highlight').forEach(c => c.classList.remove('card-highlight'));
  hideBackButton();
  state.jumpOriginId = null;

  const f = FANS_DATA.find(x => x.id === id);
  if (!f) return;
  let needsRender = false;
  if (state.fanFilter !== null && state.fanFilter !== f.fan) {
    state.fanFilter = null;
    document.querySelectorAll('.fan-chip').forEach(c => c.classList.remove('active'));
    needsRender = true;
  }
  if (f.dlc && !state.showDlc) {
    state.showDlc = true;
    document.getElementById('dlc-toggle').textContent = '隐藏 DLC';
    needsRender = true;
  }
  if (needsRender) renderAll();
  const card = document.querySelector(`.fan-card[data-id="${id}"]`);
  if (!card) return;
  card.closest('.fan-tier')?.classList.remove('collapsed');
  if (!card.classList.contains('expanded')) card.classList.add('expanded');
  setTimeout(() => {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('card-highlight');
    if (originId) {
      state.jumpOriginId = originId;
      showBackButton();
    }
  }, 50);
}

function showBackButton() {
  let btn = document.getElementById('back-to-origin');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'back-to-origin';
    btn.className = 'btn-outline hidden';
    btn.textContent = '← 回到原条目';
    btn.addEventListener('click', () => {
      document.querySelectorAll('.card-highlight').forEach(c => c.classList.remove('card-highlight'));
      const id = state.jumpOriginId;
      state.jumpOriginId = null;
      hideBackButton();
      if (id) {
        const card = document.querySelector(`.fan-card[data-id="${id}"]`);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    document.body.appendChild(btn);
  }
  btn.classList.remove('hidden');
}

function hideBackButton() {
  document.getElementById('back-to-origin')?.classList.add('hidden');
}

/* ── 计番模式 ────────────────────────────────────────── */
function toggleCalcMode() {
  state.calcMode = !state.calcMode;
  document.body.classList.toggle('calc-mode', state.calcMode);
  $calcBar.classList.toggle('hidden', !state.calcMode);

  const btn = document.getElementById('calc-toggle');
  btn.textContent = state.calcMode ? '退出计番' : '计番';

  if (!state.calcMode) {
    state.selected.clear();
  }
  updateCalcBar();
}

function updateCalcBar() {
  let total = 0;
  state.selected.forEach(id => {
    const f = FANS_DATA.find(x => x.id === id);
    if (f) total += f.fan;
  });
  $calcCount.textContent = state.selected.size;
  $calcTotal.textContent = total;
}

/* ── 计番 UI 国际化 ─────────────────────────────────── */
// 纯 UI 文本（不在 fans.js / GLOSSARY_TERM_EN 里的词条）
const HC_UI_EN = {
  '← 返回': '← Back',
  '手牌计番': 'Hand Calc',
  '清空': 'Clear',
  '取消': 'Cancel',
  '计 算': 'Calculate',
  '吃/碰': 'Chow/Pung',
  '张': 'tiles',
  '合计': 'Total',
  '无番和': 'No scoring fans',
  '庄赢': 'Dealer',
};

// 通用翻译查找：fans.js nameEn → GLOSSARY_TERM_EN → HC_UI_EN → null
function lookupEn(zh) {
  if (typeof FANS_DATA !== 'undefined') {
    const f = FANS_DATA.find(e => e.name === zh || (e.nameAlt && e.nameAlt.includes(zh)));
    if (f?.nameEn) return f.nameEn;
  }
  if (typeof GLOSSARY_TERM_EN !== 'undefined' && GLOSSARY_TERM_EN[zh]) return GLOSSARY_TERM_EN[zh];
  return HC_UI_EN[zh] || null;
}
window.hcLookupEn = lookupEn;

// 更新算番界面中所有 [data-i18n] 元素
function updateCalcI18n() {
  const isEn = state.lang === 'en';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = isEn ? (lookupEn(key) || key) : key;
  });
}

/* ── 启动 ────────────────────────────────────────────── */
init();
