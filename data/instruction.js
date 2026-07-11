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
//   collapse    — 洋红可折叠框（默认收起；title 为标题，text 支持 HTML）
//   warning     — 深红可折叠框（默认展开；title 为标题，text 支持 HTML）
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
      { type: 'warning', title: '须知', text: '本网站介绍的玩法（包括以下入门内容）属于本村村规杂糅玩法。本规则仅作无物料麻将使用，本规则/网站对使用此规则的任何赌博行为不负任何责任。本网站坚决反对任何形式的赌博行为，<strong>赌狗好死</strong>。<br>不同地区的麻将玩法截然不同，请尊重当桌的村规，并保证在开玩前对部分争议规则进行充分讨论。' },
      { type: 'collapse', title: '村规详情（本页面被折叠的均属于进阶知识，初学者可跳过不看）', text: '本玩法形式上为将国标的番种和立直麻将的番种合并后简并在了立直麻将的玩法框架下，将日麻的少部分番种同步到国标番数体系后，通过一个番数点数将番数换算回日麻的点数计算，去规避自摸三倍的规则。本麻将规则下的场况介于国标和日麻之间，对国标高强度进攻和日麻过度防守的情况都进行了削弱与综合。本规则偏向半竞技麻将，因此不会收录癞子玩法，也不会收录明显不符合牌理的和牌形。' },
      { type: 'h3', text: '牌的种类与数量' },
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
      { type: 'info', text: '值得新玩家注意的是，「一索」为特殊形状，又称幺鸡，并非字牌，需加以识别。'},
      { type: 'p', text: '其中 <strong>1 和 9</strong> 称为<strong>幺九牌或者老头牌</strong>，在国标规则中有不少相关的特殊的番种加成。<br>可见「断幺」，「混全带幺九」，「纯全带幺九」，「混幺九」，「清幺九」，「十三幺」等。' },

      { type: 'h3', text: '字牌（共 28 张）' },
      { type: 'p', text: '字牌不分大小，分为<strong>风牌</strong>和<strong>三元牌(又称箭牌)</strong>，每种 4 张。' },
      { type: 'tile-suites', groups: [
        { label: '风牌（东南西北）', tiles: 'E S W N' },
        { label: '三元牌（白发中）', tiles: 'B F Z' },
      ]},
      { type: 'tip', text: '字牌没有顺序，<strong>不能组成顺子</strong>，只能碰/杠成刻子或杠子。三元牌（中发白）的刻子额外计「箭刻」（2 番）。' },

      { type: 'h3', text: '花牌（共 8 张）' },
      { type: 'info', text: '本玩法不包含花牌，此处仅作基本介绍。' },
      { type: 'p', text: '花牌（梅兰菊竹 / 春夏秋冬）<strong>不参与组面子</strong>。摸到后立即亮出并从岭上补一张牌，每张花牌通常计 1 番。' },

      { type: 'h3', text: '基本概念（顺子，刻子，面子，雀头）' },
      { type: 'info', text: '面子，顺子，刻子为各地麻将中的核心概念，与吃碰杠和皆有关，故在此介绍；须牢记。' },
      { type: 'ul', items: [
        '<strong>顺子</strong>：三张同花色的连续数牌组成一个顺子。',
        '<strong>刻子</strong>：三张相同牌组成一个刻子。<details><summary>「杠」</summary>‘杠’视为特殊的刻子，虽然由四张牌构成，仍然视为一组三张牌的刻子，以保持手牌数不变。也就是开杠后的四张牌不能参与其他顺子的组成。详见「3. 吃、碰、杠」。</details>',
        '<strong>面子</strong>：顺子和刻子统称为面子，可以被认为是麻将做牌的基本单位。',
        '<strong>雀头</strong>：两张一样的牌，是大部分和牌形状中必须要存在的一部分。',
      ]},
      { type: 'info', text: '应注意，数牌即可组成顺子刻子和雀头，而字牌只可组成刻子和雀头。' },
    ],
  },

  // ── 1. 牌局设置 ──────────────────────────────────────
  {
    id: 's1',
    title: '1. 牌局设置',
    blocks: [
      { type: 'h3', text: '人数与座位' },
      { type: 'p', text: '标准麻将 <strong>4 人</strong>游戏。通过投骰子/抽风牌等方式确定初始庄家后，确定其为<strong>东风</strong>；其余三人依逆时针方向为南、西、北。座次上既可以通过庄家投骰子，也可以自己互相约定好即可。' },

      { type: 'h3', text: '圈风与门风' },
      { type: 'ul', items: [
        '<strong>圈风</strong>：全桌共用的当局风向，东风则为东圈，半庄按 东圈 → 南圈推进。',
        '<strong>门风</strong>：每位玩家自己的座位风。庄家为东风，下家（顺时针）为南风，依此类推。',
        '圈风牌与门风牌组成刻子时均可额外计番（各 2 番，见「圈风刻」「门风刻」）。',
      ]},

      { type: 'collapse', title: '关于圈风轮换', text: '在四人半庄麻将中，如起始点棒为25000点，而南四场结束时无人被击飞也无人点棒超过30000，则进入西风局，称为西入。此时任意玩家的击飞或者任意玩家和牌后点棒超过30000则结束游戏。同理东风场的南入。南入/西入结束时不会进一步西入/北入，而是按当前比分结束牌局。'},

      { type: 'h3', text: '配牌' },
      { type: 'ul', items: [
        '<strong>码牌</strong>：洗牌后每人抓取34张牌（17张×2）背面朝上置于身前，作为「牌山」（牌墙）。',
        '<strong>掷骰</strong>：由庄家掷骰确认从何处开牌。<details><summary>（详情）</summary>如点数为5，则从庄为1开始依次逆时针数到5，为庄自己（称掷骰确定的玩家为A）。然后由A在自己面前的牌山从左往右数5摞（即5×2张），把第5和第6摞分开。从第6摞开始算作牌头，第5摞即为牌尾。牌山尾端往回数的7摞共14张牌为王牌山，王牌山之前的牌则称为「海底」，即正常顺序摸牌的最后一张牌。</details>',
        '<strong>摸牌</strong>：各人依次序从牌头按顺时针从牌山摸 <strong>13 张</strong>作为起始手牌，庄家多摸一张。<details><summary>（详情）</summary>摸牌顺序为东南西北；各自摸4张3轮，然后庄摸一张，跳3张再摸一张，闲家依次摸一张。庄家摸 14 张并第一个直接出牌。庄家天和自摸时可以选择这14张中的任意一张作为自己的自摸牌，故天和国士必定十三面，四暗刻则必定单骑。</details>',
        '<strong>分牌</strong>：由庄家分开王牌山与海底，并确认宝牌指示牌<details><summary>（王牌山详情）</summary>王牌山为牌山尾端的7摞14张牌。牌山尾俯视图示意：左侧2摞为开杠摸的岭上牌，右侧5摞的顶牌为表宝牌指示牌，立直和牌后同时翻开对应里宝指示牌。杠和立直的规则详见「3. 吃、碰、杠」.进行杠后，手牌会缺1张，此时便摸取一张岭上牌进行补充。之后翻开第一张宝牌指示牌。<br>应当注意到的是，王牌山必须保持14张牌，因此开杠从岭上摸牌后，需要从海底取牌从而保证王牌山牌数不变。</details>',
        '<strong>和牌与连庄</strong>：满足和牌条件（详见「4. 和牌」）则可以和牌。如果庄未和牌，则产生过庄，庄变为当前庄的下家；如果庄和牌则产生连庄，庄位置不变。<details><summary>（连庄与荒牌流局）</summary>上述情况未考虑荒牌流局，在荒牌流局情况下，庄未听牌，则产生过庄；若庄听牌则产生连庄。<br>连庄：例如东二局第一次连庄则称为东二局一本场（“本场”与“连庄”，同源于日语“レンチャン”，音为renchan），庄需要将一个100点点棒放在自己副露区作为标记。第m局连庄n次，称为东/南m局n本场，n个100点点棒提示。此时任意一家产生和牌时，如果自摸则每家需要额外支付n×100点，或者点炮者额外支付3×n×100点。其他流局是否增加n本场计数和是否过庄见「流局」。</details>',

      ]},
    ],
  },

  // ── 2. 游戏流程 ──────────────────────────────────────
  {
    id: 's2',
    title: '2. 游戏流程',
    blocks: [
      { type: 'steps', items: [
        '<strong>摸牌</strong>：轮到自己时，从牌墙头部摸一张加入手牌（手牌变为 14 张）。',
        '<strong>判断</strong>：检查 14 张是否构成合法和牌。若和牌则自摸，详见 「4. 和牌」。',
        '<strong>出牌</strong>：不能和牌则选一张打出，手牌回到 13 张。打出的牌按次序放到自己面前的牌河中。此时其他人可以吃碰杠或和这张牌。',
        '<strong>他家响应</strong>：别人打出的牌可以<strong>吃/碰/杠</strong>（见下节），或<strong>和牌</strong>（见「4. 和牌」）。',
        '<strong>流局</strong>：摸完海底牌打出后仍无人和牌或达成其它流局条件，本局流局，重新开始。',
      ]},
      { type: 'info', text: '顺序为顺时针：庄家先出 → 下家（顺时针）摸牌 → 如此循环。碰/杠会打断正常顺序，副露后需重新出牌再由其下家继续。请务必大声喊出吃碰杠避免有人摸到不属于他的牌。' },
    ],
  },

  // ── 3. 吃碰杠 ────────────────────────────────────────
  {
    id: 's3',
    title: '3. 吃、碰、杠',
    blocks: [
      { type: 'p', text: '利用<strong>别人打出的牌</strong>凑成面子，称为<strong>副露</strong>。副露的面子需正面朝上放在自己面前，不再是手牌的一部分，但仍计入和牌。' },

      { type: 'h3', text: '吃（仅限上家）' },
      { type: 'p', text: '只有<strong>上家</strong>（顺时针前一位）打出的牌可以吃。从手中拿出两张数牌，与上家打出的牌凑成<strong>顺子</strong>，然后出一张牌。' },
      // 横摆牌在最左（>前缀），表示来自上家（坐你左边）
      { type: 'hand', label: '例：手中有 2万 4万，上家打出 3万 → 吃成顺子 234万', tiles: '>3m 2m 4m' },

      { type: 'h3', text: '碰（任意一家）' },
      { type: 'p', text: '<strong>任意一家</strong>打出的牌都可以碰。从手中拿出两张相同的牌，凑成<strong>刻子</strong>，然后出一张牌。碰的优先级<strong>高于吃</strong>，可打断轮序。' },
      // 碰对家时横置牌居中（E >E E），碰下家时横置牌居右（E E >E）
      { type: 'hand', label: '例：手中有 东东，对家打出 东 → 碰成刻子 东东东', tiles: 'E >E E' },

      { type: 'h3', text: '杠（任意来源）' },
      { type: 'p', text: '凑到 4 张完全相同的牌可以杠，组成<strong>杠子</strong>，视为一种特殊的刻子。杠后须从<strong>岭上</strong>（牌墙末端）摸一张补牌，若无自摸则翻出下一个宝牌指示牌，之后再出一张。杠的优先级最高。每杠一次都会额外揭示一个表宝指示牌。' },
      { type: 'concept-grid', items: [
        { label: '明杠', tiles: '5p 0p >5p 5p', note: '手中三张，别人打出第四张时杠。牌例为从对家明杠，第二或第三张牌中选择一张横摆即可。为了避免出现‘和’早于‘杠’的‘快慢刀’现象，明杠别人的牌与和牌同时发生不计算抢杠。' },
        { label: '加杠', tiles: '3s 3s >3s >3s', note: '已碰成的刻子，自摸到第四张后加杠，视为一种明杠。加杠的牌应横着与原来叠置的牌上下重叠放置，图例中为先碰了下家，后加杠。' },
        { label: '暗杠', tiles: 'X 9m 9m X',   note: '手中自摸到四张，无需别人打出，向所有人展示四张一样后，中间或者两边的两张反扣，视为暗杠，暗杠不破坏门前清。只有国士无双可以抢暗杠。' },
      ]},
      { type: 'tip', text: '杠子虽有四张，但认为是一种特殊的刻子，即认为其仍为三张。<br>每次杠后手牌减少一张（面子变为杠子），但从岭上补一张后再打出一张，整体仍保持 13 张立牌。和的那张（摸或别人打出）使总数回到 14 张方可和牌。' },

      { type: 'h3', text: '立直' },
      { type: 'tip', text: '立直（riichi）来源于日麻，与吃碰杠不同，并非各地麻将的关键组成部分。但是其规则在本玩法中较重要，因而在此说明。' },
      { type: 'p', text: '立直本质上是一种“报听”（见「听牌」）。<br>玩家通过横置打出的舍牌，并将1000点的点棒置于牌桌上，完成立直报听的操作。' },
      { type: 'tip', text: '<strong>立直的收益与代价</strong><br>立直后若不和牌则只能摸切（不改变听牌型的暗杠除外），而不能再对自己的牌型做出更改。且立直后不能抓炮自己的舍牌与别人在立直后打过的舍牌（详见下方「立直振听与防守方法」）。若别人和牌，则置于牌桌的立直棒归和牌的人所有。<br>作为收益，立直和牌可以立刻获得两番，且解锁更多立直相关的牌型，并获得翻开里宝指示牌的权力。（详见下方「宝牌与其指示牌」）'},
      
      { type: 'p', text: '<br><strong>立直振听与防守方法</strong>' },
      { type: 'ul', items: [
        '<strong>舍牌振听</strong>：如果立直玩家听的牌中，包含该玩家之前打出去过的牌（包括被别人吃碰走的牌），即进入舍牌振听。<br><strong>例</strong>：立直玩家听一万和四万。如果其在一开始打过一张一万，现在即使别人打出一万或者四万，该玩家都不能胡，只能等待自摸。',
        '<strong>立直振听</strong>：若玩家（此处称其为A）立直后，别的玩家打出了A听牌范围内的牌，但A却没有和牌，那么此后玩家A即只能自摸。',
        '<strong>防守方法</strong>：综上，玩家立直后，其自己的舍牌堆与所有其它玩家在立直后打出的舍牌堆都是安全牌']},
      { type: 'collapse', title: '宝牌与其指示牌', text: '“宝牌”是一种特殊的番，每张宝牌在本规则中计2番。但是须注意宝牌的两番不计入起和标准（即宝牌无役）。<br>首先，三张<strong>赤五</strong>天然就是宝牌。除赤五外，游戏中的宝牌还由<strong>宝牌指示牌</strong>按如下规则决定。<div style="margin-top:10px;"><div style="font-size:.78em;font-weight:600;color:var(--text-muted);margin-bottom:4px;">指示牌 → 宝牌对应关系（数牌：顺序下一张，9接回1）</div><div style="display:grid;grid-template-columns:2.2em repeat(9,auto);gap:2px;align-items:center;margin-bottom:6px;"><span style="font-size:.7em;color:var(--text-muted);">万</span><img class="tile-sm" src="img/tiles/1m.svg" alt="一万"><img class="tile-sm" src="img/tiles/2m.svg" alt="二万"><img class="tile-sm" src="img/tiles/3m.svg" alt="三万"><img class="tile-sm" src="img/tiles/4m.svg" alt="四万"><img class="tile-sm" src="img/tiles/5m.svg" alt="五万"><img class="tile-sm" src="img/tiles/6m.svg" alt="六万"><img class="tile-sm" src="img/tiles/7m.svg" alt="七万"><img class="tile-sm" src="img/tiles/8m.svg" alt="八万"><img class="tile-sm" src="img/tiles/9m.svg" alt="九万"><span></span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span></span><img class="tile-sm" src="img/tiles/2m.svg" alt="二万"><img class="tile-sm" src="img/tiles/3m.svg" alt="三万"><img class="tile-sm" src="img/tiles/4m.svg" alt="四万"><img class="tile-sm" src="img/tiles/5m.svg" alt="五万"><img class="tile-sm" src="img/tiles/6m.svg" alt="六万"><img class="tile-sm" src="img/tiles/7m.svg" alt="七万"><img class="tile-sm" src="img/tiles/8m.svg" alt="八万"><img class="tile-sm" src="img/tiles/9m.svg" alt="九万"><img class="tile-sm" src="img/tiles/1m.svg" alt="一万" style="outline:2px solid var(--accent);border-radius:3px;"></div><div style="display:grid;grid-template-columns:2.2em repeat(9,auto);gap:2px;align-items:center;margin-bottom:6px;"><span style="font-size:.7em;color:var(--text-muted);">饼</span><img class="tile-sm" src="img/tiles/1p.svg" alt="一饼"><img class="tile-sm" src="img/tiles/2p.svg" alt="二饼"><img class="tile-sm" src="img/tiles/3p.svg" alt="三饼"><img class="tile-sm" src="img/tiles/4p.svg" alt="四饼"><img class="tile-sm" src="img/tiles/5p.svg" alt="五饼"><img class="tile-sm" src="img/tiles/6p.svg" alt="六饼"><img class="tile-sm" src="img/tiles/7p.svg" alt="七饼"><img class="tile-sm" src="img/tiles/8p.svg" alt="八饼"><img class="tile-sm" src="img/tiles/9p.svg" alt="九饼"><span></span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span></span><img class="tile-sm" src="img/tiles/2p.svg" alt="二饼"><img class="tile-sm" src="img/tiles/3p.svg" alt="三饼"><img class="tile-sm" src="img/tiles/4p.svg" alt="四饼"><img class="tile-sm" src="img/tiles/5p.svg" alt="五饼"><img class="tile-sm" src="img/tiles/6p.svg" alt="六饼"><img class="tile-sm" src="img/tiles/7p.svg" alt="七饼"><img class="tile-sm" src="img/tiles/8p.svg" alt="八饼"><img class="tile-sm" src="img/tiles/9p.svg" alt="九饼"><img class="tile-sm" src="img/tiles/1p.svg" alt="一饼" style="outline:2px solid var(--accent);border-radius:3px;"></div><div style="display:grid;grid-template-columns:2.2em repeat(9,auto);gap:2px;align-items:center;margin-bottom:12px;"><span style="font-size:.7em;color:var(--text-muted);">索</span><img class="tile-sm" src="img/tiles/1s.svg" alt="一索"><img class="tile-sm" src="img/tiles/2s.svg" alt="二索"><img class="tile-sm" src="img/tiles/3s.svg" alt="三索"><img class="tile-sm" src="img/tiles/4s.svg" alt="四索"><img class="tile-sm" src="img/tiles/5s.svg" alt="五索"><img class="tile-sm" src="img/tiles/6s.svg" alt="六索"><img class="tile-sm" src="img/tiles/7s.svg" alt="七索"><img class="tile-sm" src="img/tiles/8s.svg" alt="八索"><img class="tile-sm" src="img/tiles/9s.svg" alt="九索"><span></span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span></span><img class="tile-sm" src="img/tiles/2s.svg" alt="二索"><img class="tile-sm" src="img/tiles/3s.svg" alt="三索"><img class="tile-sm" src="img/tiles/4s.svg" alt="四索"><img class="tile-sm" src="img/tiles/5s.svg" alt="五索"><img class="tile-sm" src="img/tiles/6s.svg" alt="六索"><img class="tile-sm" src="img/tiles/7s.svg" alt="七索"><img class="tile-sm" src="img/tiles/8s.svg" alt="八索"><img class="tile-sm" src="img/tiles/9s.svg" alt="九索"><img class="tile-sm" src="img/tiles/1s.svg" alt="一索" style="outline:2px solid var(--accent);border-radius:3px;"></div><div style="font-size:.78em;font-weight:600;color:var(--text-muted);margin-bottom:4px;">字牌（各自成环）</div><div style="display:flex;align-items:center;gap:4px;margin-bottom:6px;flex-wrap:wrap;"><span style="font-size:.72em;color:var(--text-muted);min-width:2.4em;">风牌</span><img class="tile-sm" src="img/tiles/E.svg" alt="东"><span>→</span><img class="tile-sm" src="img/tiles/S.svg" alt="南"><span>→</span><img class="tile-sm" src="img/tiles/W.svg" alt="西"><span>→</span><img class="tile-sm" src="img/tiles/N.svg" alt="北"><span>→</span><img class="tile-sm" src="img/tiles/E.svg" alt="东" style="opacity:.4;outline:2px solid var(--accent);border-radius:3px;"></div><div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;"><span style="font-size:.72em;color:var(--text-muted);min-width:2.4em;">三元</span><img class="tile-sm" src="img/tiles/B.svg" alt="白"><span>→</span><img class="tile-sm" src="img/tiles/F.svg" alt="发"><span>→</span><img class="tile-sm" src="img/tiles/Z.svg" alt="中"><span>→</span><img class="tile-sm" src="img/tiles/B.svg" alt="白" style="opacity:.4;outline:2px solid var(--accent);border-radius:3px;"></div></div><br>应当注意到，一局游戏中可以翻出多张宝牌指示牌（详见「杠」），因此也可以存在多种宝牌。若翻出多张相同的宝牌指示牌，则同一张宝牌可以计多次。如，若翻出m张<strong>三万</strong>作为宝牌指示牌，则和牌时每张<strong>四万</strong>都可以计m×2番。<br>表宝牌（杠n次后即有n+1张表宝指示牌）下方的牌为里宝指示牌。立直和牌后，可以翻出里宝牌指示牌，即可以直接增加一倍的宝牌种类。' },
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
      { type: 'info', text: '「33332」和「七对子」是最基本的和牌牌型，其余特殊牌型可以查看完整的速查表。' },
      { type: 'collapse', title: '见逃与振听', text: '为了避免恶意盯和某一个人的牌这种违背竞技精神的行为，虽然不像日麻设置严格的同巡振听和舍牌振听规则，但是：当玩家见逃不和某一张牌，在下一次该玩家出牌之前都不可以和这张牌，但不影响和其他的听牌，以及该玩家的自摸。<br>例：非立直的纯全带幺九听14万的两面，4万只有平和，见逃4万在下一次打牌前都不可以和其他人的4万，但是可以和1万和自摸4万，打牌后解除这个状态直到玩家下一次见逃。' },

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
        '<strong>有役才能和</strong>：本规则要求和牌番种中至少有一个 <strong>2番</strong>及以上的番种（两番以上的非宝牌番种称为役）（也可改为总计多少番以上才允许和）。不足则不能和牌。',
        '<strong>相加原则</strong>：一副牌通常满足各种番型，可将满足的番型所对应的番数全部相加，结果即为最终番数。有不同的拆解牌面办法时，按最高番数的拆法计算。',
        '<strong>不计原则</strong>：番种之间构成必然条件时，只计较高的一种。例如「十三幺」，「七对子」等必然门清，就不再另计「门清」。',
        '<strong>副露限制</strong>：有些番种要求<strong>门清</strong>（不能吃碰杠），具体见速查表中的标签。',
      ]},

      { type: 'h3', text: '支付方式（常见）' },
      { type: 'ul', items: [
        '放炮：炮手独自支付全额。',
        '自摸（庄）：三闲家各付 1 份（共 3 份）。',
        '自摸（闲）：庄家付 2 份，另两闲各付 1 份（共 4 份）。',
        '庄和：同样番数的牌，庄和牌点数是闲的约1.5倍。',
      ]},

      { type: 'collapse', title: '番-点 计算规则其一', text: '番数不等于直接的点数，或者部分赌博麻将的钱数，各地换算不同（如每番 1 分的加法、或按 2 的n次方指数增加等）。具体换算规则以各地桌规为准。首页速查表中每张卡片的彩色标签即为该番种的番数。正因为大部分地方规则都是类赌博麻将的番数换算规则，而实际对局内的平衡性也较差，导致麻将一直在涉赌边缘徘徊，也让纯粹的竞技麻将（即国标和立直麻将）的推广遇到了极大的阻碍。本网站以及本规则坚决反对任何形式的完全不具备竞技平衡性的麻将玩法，以及任何形式的有料麻将玩法。坚决鄙视与拒绝任何赌狗行为。<strong>赌狗好死</strong>！' },
      { type: 'collapse', title: '番-点 计算规则其二', text: '在小于等于15番的和牌采用一番一分的对应，属于小牌范畴。16番以上以阶梯计分：16~21番为满贯，闲8000；22~27番为跳满，闲12000；28~35番为倍满，闲16000；36~49番为三倍满，闲24000；50~63番为累计役满，闲32000。为了体现役满大牌的独特地位，所有小于等于48番的番种累计仅累加至累计役满。然后累加计算每个来自64番的番种为一次一倍役满，闲32000；每个来自88番的番种为一次两倍役满，闲64000。' },

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
        // 役牌：门风刻/圈风刻/箭刻 合成一张卡（特殊分组，仅此一处）
        { groupName: '役牌', ids: ['men_feng_ke', 'quan_feng_ke', 'jian_ke'] },
        { id: 'men_qian_qing' },
        { id: 'ping_he' },
        { id: 'si_gui_yi' },
        { id: 'shuang_tong_ke' },
        { id: 'shuang_an_ke' },
        { id: 'an_gang' },
        { id: 'duan_yao' },
        { id: 'peng_peng_he' },
        { id: 'hun_yi_se' },
        { id: 'wu_men_qi' },
        { id: 'san_se_san_bu_gao' },
        { id: 'hua_long' },
        { id: 'san_se_san_tong_shun' },
        { id: 'san_se_san_jie_gao' },
        { id: 'qing_long' },
        { id: 'yi_se_san_bu_gao' },
        { id: 'qi_dui_zi' },
        { id: 'qing_yi_se' },
      ]},
    ],
  },

];
