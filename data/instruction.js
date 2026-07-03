// 入门指南内容数据
// block 类型：
//   p           — 段落（text 支持 HTML）
//   h3          — 小标题
//   ul          — 无序列表（items 数组，支持 HTML）
//   steps       — 编号步骤列表（items 数组，支持 HTML）
//   tile-suites — 横排花色展示（groups: [{label, tiles}]，插入 {break:true} 可强制换行）
//   hand        — 手牌示例框（label, tiles，tiles 用 | 分割面子）
//   concept-grid— 概念卡格子（items: [{label, tiles, note}]）
//   info        — 蓝色提示框（text，支持 HTML）
//   tip         — 黄色提示框（text，支持 HTML）
//   common-hands— 常见和牌格子（items: [{fan, name, desc, tiles}]）
//
// tiles 字段格式与 fans.js 相同：
//   数牌 1m-9m（万）/ 1p-9p（饼）/ 1s-9s（索）
//   字牌 E=东 S=南 W=西 N=北 Z=中 F=发 B=白
//   X=牌背（暗杠）；| 用于面子间隔（渲染为空隙）

const INSTRUCTION_DATA = [

  // ── 0. 认识麻将 ──────────────────────────────────────
  {
    id: 's0',
    title: '0. 认识麻将',
    blocks: [
      { type: 'info', text: '须知：<br>本网站介绍的玩法（包括以下入门内容）属于村规杂糅玩法；以国标为主，广港日川为辅，加以日麻的点数计算规则。<br>不同地区的麻将玩法截然不同，除基本规则外，请勿将此网站用于其它牌桌。' },
      { type: 'p', text: '标准麻将共 <strong>136 张牌</strong>（不含花牌），分为数牌、字牌、花牌三类。' },

      { type: 'h3', text: '数牌（共 108 张）' },
      { type: 'p', text: '三种花色，每色各有 1–9 点，每点 4 张，每种花色 36 张。'},
      { type: 'tip', text: '每种花色中的「五」牌中有一张为特殊的「赤五」（即三张普通「五」+一张「赤五」）；整副牌中含有三张赤五，每多一张赤五多记一番，见「宝牌」。' },
      { type: 'tile-suites', groups: [
        { label: '万子', tiles: '1m 2m 3m 4m 5m 6m 7m 8m 9m' },
        { label: '饼子（筒子）', tiles: '1p 2p 3p 4p 5p 6p 7p 8p 9p' },
        { label: '索子（条子）', tiles: '1s 2s 3s 4s 5s 6s 7s 8s 9s' },
        { break: true },
        { label: '赤五', tiles: '0m 0p 0s' },
      ]},
      { type: 'info', text: '值得新玩家注意的是，‘一索’为特殊形状，又称幺鸡，并非字牌，需加以识别' },
      { type: 'p', text: '其中 <strong>1 和 9</strong> 称为<strong>幺九牌</strong>，在国标规则中有不少特殊的番种加成。<br>可见「断幺」，「混全带幺九」，「全带幺」，「混幺九」，「清幺九」，「十三幺」等。' },

      { type: 'h3', text: '字牌（共 28 张）' },
      { type: 'p', text: '字牌不分大小，分为<strong>风牌</strong>和<strong>三元牌(又称箭牌)</strong>，每种 4 张。' },
      { type: 'tile-suites', groups: [
        { label: '风牌（东南西北）', tiles: 'E S W N' },
        { label: '三元牌（中发白）', tiles: 'Z F B' },
      ]},
      { type: 'tip', text: '字牌没有顺序，<strong>不能组成顺子</strong>，只能碰/杠成刻子或杠子。三元牌（中发白）的刻子额外计「箭刻」（2 番）。' },

      { type: 'h3', text: '花牌（共 8 张）' },
      { type: 'info', text: '本玩法不包含花牌，此处仅作基本介绍。' },
      { type: 'p', text: '花牌（梅兰菊竹 / 春夏秋冬）<strong>不参与组面子</strong>。摸到后立即亮出并从岭上补一张牌，每张花牌通常计 1 番。' },

      { type: 'h3', text: '基本概念（顺子，刻子，面子）' },
      { type: 'info', text: '面子，顺子，刻子为各地麻将中的核心概念，与吃碰杠和皆有关，故在此介绍；须牢记。' },
      { type: 'ul', items: [
        '<strong>顺子<strong>：三张同花色的连续数牌组成一个顺子',
        '<strong>刻子<strong>：三张相同牌组成一个刻子。「杠」视为特殊的刻子，虽然由四张牌构成，仍然视为三张牌，以保持手牌数不变，详见「3. 吃、碰、杠」。',
        '<strong>面子<strong>：顺子和刻子统称为面子，可以被认为是麻将做牌的基本单位。',
      ]},
      { type: 'info', text: '应注意，数牌即可组成顺子也可组成刻子，而字牌只可组成刻子。' },
    ],
  },

  // ── 1. 牌局设置 ──────────────────────────────────────
  {
    id: 's1',
    title: '1. 牌局设置',
    blocks: [
      { type: 'h3', text: '人数与座位' },
      { type: 'p', text: '标准麻将 <strong>4 人</strong>游戏。确定初始庄家后，确定其为<strong>东风</strong>；其余三人依顺时针方向为南、西、北。' },

      { type: 'h3', text: '圈风与门风' },
      { type: 'ul', items: [
        '<strong>圈风</strong>：全桌共用的当局风向，全庄时按 东圈 → 南圈 → 西圈 → 北圈依次推进；半庄则只按 东圈 → 南圈推进。',
        '<strong>门风</strong>：每位玩家自己的座位风。庄家为东风，下家（顺时针）为南风，依此类推。',
        '圈风牌与门风牌组成刻子时均可额外计番（各 2 番，见「圈风刻」「门风刻」）。',
      ]},

      { type: 'h3', text: '配牌' },
      { type: 'ul', items: [
        '码牌：洗牌后每人抓取34张牌（17张×2）背面朝上置于身前，作为「牌山」（牌墙）。',
        '由庄家掷骰确认从哪里开始抓牌，牌山尾端则称为「海底」。',
        '各人依次摸 <strong>13 张</strong>作为起始手牌（庄家摸 14 张，并第一个出牌）。',
      ]},
    ],
  },

  // ── 2. 游戏流程 ──────────────────────────────────────
  {
    id: 's2',
    title: '2. 游戏流程',
    blocks: [
      { type: 'steps', items: [
        '<strong>摸牌</strong>：轮到自己时，从牌墙顶部摸一张加入手牌（手牌变为 14 张）。',
        '<strong>判断</strong>：检查 14 张是否构成合法和牌。详见 「4. 和牌」。',
        '<strong>出牌</strong>：不能和牌则选一张打出，手牌回到 13 张。打出的牌按次序放到自己面前的牌河中。',
        '<strong>他家响应</strong>：别人打出的牌可以<strong>吃/碰/杠</strong>（见下节），或<strong>和牌</strong>（见「4. 和牌」）。',
        '<strong>流局</strong>：牌墙只剩八张牌仍无人和牌或达成其它流局条件，本局流局，重新开始。',
      ]},
      { type: 'info', text: '顺序为顺时针：庄家先出 → 下家（顺时针）摸牌 → 如此循环。碰/杠会打断正常顺序，副露后需重新出牌再由其下家继续。' },
    ],
  },

  // ── 3. 吃碰杠 ────────────────────────────────────────
  {
    id: 's3',
    title: '3. 吃、碰、杠',
    blocks: [
      { type: 'p', text: '利用<strong>别人打出的牌</strong>（或自摸到的牌）凑成面子，称为<strong>副露</strong>。副露的面子需正面朝上放在自己面前，不再是手牌的一部分，但仍计入和牌。' },

      { type: 'h3', text: '吃（仅限上家）' },
      { type: 'p', text: '只有<strong>上家</strong>（顺时针前一位）打出的牌可以吃。从手中拿出两张数牌，与上家打出的牌凑成<strong>顺子</strong>，然后出一张牌。' },
      { type: 'hand', label: '例：手中有 2万 4万，上家打出 3万 → 吃成顺子 234万', tiles: '2m 3m 4m' },

      { type: 'h3', text: '碰（任意一家）' },
      { type: 'p', text: '<strong>任意一家</strong>打出的牌都可以碰。从手中拿出两张相同的牌，凑成<strong>刻子</strong>，然后出一张牌。碰的优先级<strong>高于吃</strong>，可打断轮序。' },
      { type: 'hand', label: '例：手中有 东东，任意一家打出 东 → 碰成刻子 东东东', tiles: 'E E E' },

      { type: 'h3', text: '杠（任意来源）' },
      { type: 'p', text: '凑到 4 张完全相同的牌可以杠，组成<strong>杠子</strong>，视为一种特殊的刻子。杠后须从<strong>岭上</strong>（牌墙末端）摸一张补牌，再出一张。杠的优先级最高。' },
      { type: 'concept-grid', items: [
        { label: '明杠', tiles: '5p 5p 5p 5p', note: '手中三张，别人打出第四张时杠。' },
        { label: '加杠', tiles: '3s 3s 3s 3s', note: '已碰成的刻子，自摸到第四张后加杠，视为一种明杠。' },
        { label: '暗杠', tiles: 'X 9m 9m X',   note: '手中自摸到四张，无需别人打出，中间两张反扣，视为暗刻。' },
      ]},
      { type: 'tip', text: '杠子虽有四张，但认为是一种特殊的刻子，即认为其仍为三张。<br>每次杠后手牌减少一张（面子变为杠子），但从岭上补一张后再打出一张，整体仍保持 13 张立牌。和的那张（摸或别人打出）使总数回到 14 张方可和牌。' },
    ],
  },

  // ── 4. 和牌 ──────────────────────────────────────────
  {
    id: 's4',
    title: '4. 和牌',
    blocks: [
      { type: 'h3', text: '标准形式：4 面子 + 1 雀头（33332）' },
      { type: 'p', text: '最常见的和牌结构是 <strong>4 个面子加 1 个雀头</strong>，共 14 张。' },
      { type: 'concept-grid', items: [
        { label: '顺子', tiles: '3p 4p 5p', note: '同花色连续三张数牌。字牌不能组顺子。' },
        { label: '刻子', tiles: 'Z Z Z',    note: '三张完全相同的牌。字牌和数牌均可。' },
        { label: '杠子', tiles: '7m 7m 7m 7m', note: '四张相同，占一个面子位，由吃/碰/杠获得。' },
        { label: '雀头（将）', tiles: '2s 2s', note: '两张相同的牌，每副和牌只有 1 个雀头。' },
      ]},
      { type: 'hand', label: '例：平和（4 顺子 + 无字牌雀头）', tiles: '1m 2m 3m | 4p 5p 6p | 7s 8s 9s | 3m 4m 5m | 2p 2p' },

      { type: 'h3', text: '特殊形式：七对子' },
      { type: 'p', text: '7 组不同的对子，共 14 张，每种牌最多只能有 1 对（不能拿 4 张当 2 对）。必须门清，不能吃碰杠。' },
      { type: 'hand', label: '例：七对子', tiles: '2m 2m | 5p 5p | 8p 8p | 3s 3s | 6s 6s | E E | Z Z' },

      { type: 'info', text: '<strong>自摸</strong>：自己摸到使手牌成和的那张牌，宣告自摸，所有其他玩家各付点数。<br><strong>放炮</strong>：自己打出的牌被别人和，称为放炮（放铳），炮手独自支付全部点数。' },
      { type: 'info', text: '「33332」和「七对子」是最基本的和牌牌型，其余牌型可以查看完整的速查表。' },
    ],
  },

  // ── 5. 计番规则 ──────────────────────────────────────
  {
    id: 's5',
    title: '5. 计番规则',
    blocks: [
      { type: 'info', text: '本网站带有计番功能，以下只需了解即可。' },
      { type: 'p', text: '麻将通过「番种」计分：每副和牌根据牌型满足的番种累加番数，再换算为点数。' },

      { type: 'h3', text: '核心原则' },
      { type: 'ul', items: [
        '<strong>最低起胡番数</strong>：本规则要求和牌番种中至少有一个 <strong>2番</strong>及以上的番种（可自定）。不足则不能胡牌。',
        '<strong>相加原则</strong>：一副牌通常满足各种番型，可将满足的番型所对应的番数全部相加，结果即为最终番数。',
        '<strong>不计原则</strong>：番种之间构成必然条件时，只计较高的一种。例如「十三幺」，「七对子」等必然门清，就不再另计「门清」。',
        '<strong>副露限制</strong>：有些番种要求<strong>门清</strong>（不能吃碰杠），具体见速查表中的标签。',
      ]},

      { type: 'h3', text: '支付方式（常见）' },
      { type: 'ul', items: [
        '放炮：炮手独自支付全额。',
        '自摸（庄）：三闲家各付 1 份（共 3 份）。',
        '自摸（闲）：庄家付 2 份，另两闲各付 1 份（共 4 份）。',
      ]},

      { type: 'tip', text: '番数不等于直接的点数，各地换算不同（如每番 1 分、或按 2 的幂递进等）。具体换算规则以各桌规为准。首页速查表中每张卡片的彩色标签即为该番种的番数。' },
    ],
  },

  // ── 6. 常见和牌 ──────────────────────────────────────
  {
    id: 's6',
    title: '6. 常见和牌牌型',
    blocks: [
      { type: 'p', text: '以下是初学者最常遇到的番型示例。完整列表（含条件、互斥规则和更多例牌）见<a href="index.html" style="color:var(--accent);">首页速查表</a>。' },
      // 只需写 fans.js 中的 id，名称/番数/描述/例牌均自动从 FANS_DATA 读取
      // 若需覆盖例牌，可额外加 tiles 字段（格式同 fans.js example）
      { type: 'common-hands', items: [
        { id: 'ping_he' },
        { id: 'duan_yao' },
        { id: 'hun_yi_se' },
        { id: 'peng_peng_he' },
        { id: 'qing_long' },
        { id: 'yi_se_san_bu_gao' },
        { id: 'qi_dui_zi' },
        { id: 'qing_yi_se' },
        { id: 'si_an_ke' },
        { id: 'jiu_lian_bao_deng' },
        { id: 'shi_san_yao' },
      ]},
    ],
  },

];
