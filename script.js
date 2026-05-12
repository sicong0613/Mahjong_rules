/* ── 状态 ───────────────────────────────────────────── */
const state = {
  search:     '',
  fanFilter:  null,        // null = 全部，或具体番数
  tagFilters: new Set(),   // AND 逻辑
  calcMode:   false,
  selected:   new Set(),   // 计番模式中已勾选的 id
  showDlc:    false,
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
}

/* ── 事件绑定 ────────────────────────────────────────── */
function bindEvents() {
  $searchInput.addEventListener('input', e => {
    state.search = e.target.value.trim();
    renderAll();
  });

  document.getElementById('calc-toggle').addEventListener('click', toggleCalcMode);
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

  document.getElementById('clear-filters').addEventListener('click', () => {
    state.fanFilter  = null;
    state.tagFilters.clear();
    state.search     = '';
    $searchInput.value = '';
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    renderAll();
  });

  document.addEventListener('click', e => {
    const term = e.target.closest('.term');
    if (term) { showTermPopup(term, term.dataset.term); return; }
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

/* ── 构建单张卡片 ────────────────────────────────────── */
function buildCard(f) {
  const card = document.createElement('div');
  card.className = 'fan-card';
  card.dataset.id = f.id;

  const altText  = f.nameAlt?.length ? ` <span class="card-name-alt">/ ${f.nameAlt.join(' / ')}</span>` : '';
  const tagsHtml = f.tags.map(t =>
    `<span class="tag tag-${t}">${t}</span>`
  ).join('');

  // 详情内容
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

  // 计番 checkbox
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
        <span class="card-name">${f.name}</span>${altText}
        <span class="card-source">${f.source}</span>
      </div>
      <p class="card-desc">${f.desc}</p>
      <div class="card-tags">${tagsHtml}</div>
    </div>
    <div class="card-details">
      ${condHtml}${exclHtml}${htHtml}${meldHtml}${srcHtml}${notesHtml}
    </div>
    ${calcHtml}
  `;

  if (isChecked) card.classList.add('calc-selected');

  // 点击展开/收起（非计番模式，术语点击除外）
  card.querySelector('.card-main').addEventListener('click', e => {
    if (!state.calcMode && !e.target.closest('.term')) {
      card.classList.toggle('expanded');
    }
  });

  // 计番 checkbox 事件
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
let _termMap = null, _termPattern = null;

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
      span.textContent = match[0];
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
    popup.innerHTML = `
      <div class="term-popup-head">
        <span class="fan-badge badge-${f.fan} term-popup-badge">${f.fan === 0 ? '立' : f.fan}</span>
        <strong class="term-popup-name">${f.name}</strong>
      </div>
      <p class="term-popup-desc">${f.desc}</p>
      <button class="term-popup-goto" data-id="${f.id}">→ 查看完整</button>`;
    popup.querySelector('.term-popup-goto').addEventListener('click', e => {
      e.stopPropagation();
      hideTermPopup();
      scrollToFanCard(f.id);
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
  document.getElementById('term-popup')?.classList.add('hidden');
}

function scrollToFanCard(id) {
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
    setTimeout(() => card.classList.remove('card-highlight'), 2000);
  }, 50);
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

/* ── 启动 ────────────────────────────────────────────── */
init();
