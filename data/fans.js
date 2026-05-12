// 番种数据 — 所有字段说明：
// id: 唯一标识符
// name: 主名称  nameAlt: 别名列表
// fan: 番数值
// desc: 简短描述
// conditions: 达成条件（可选）
// excludes: 不计的番种名称列表（对应 name 字段）
// handTypes: 适用牌型 — "33332" | "七对" | "不靠" | "国士"，空数组=不限/特殊
// meldAllowed: 是否允许副露（false = 必须门清）
// tags: 筛选标签
// source: 规则来源
// notes: 补充说明（可选）
// dlc: 是否为 DLC 规则（默认不显示）
// example: 主例牌（卡片收起时显示）— 牌码以空格分隔，| 为面子间隔
//          数牌：1m-9m 万 / 1p-9p 饼 / 1s-9s 索；赤五：0m 0p 0s；字牌：E=东 S=南 W=西 N=北 Z=中 F=发 B=白
//          特殊：X=牌背（暗杠）  front=空白牌面
// examples: [{ label, tiles }] 展开后显示的多副例牌
// tips: 常见疑问说明（由用户提供）

const FANS_DATA = [

  // ─────────────────────────────────────────────────────
  //  88 番  役满
  // ─────────────────────────────────────────────────────
  { id: "shi_san_yao", name: "十三幺", nameAlt: ["国士无双"], fan: 88,
    desc: "东南西北中发白，加上一万九万一条九条一饼九饼，其中任意一张作雀头。",
    conditions: "必须门清。可以抢暗杠（不计杠振）。可听 13 面（国士无双十三面）。",
    excludes: ["门前清", "五门齐"],
    handTypes: ["国士"], meldAllowed: false,
    tags: ["字牌", "幺九", "门清", "特殊牌型"], source: "国标/日麻",
    notes: "（村）舍牌不含任意国士牌时达成 13 面听牌，称「国士无振 13 面」，可额外计 64 番。",
    example: "1m 1m 1p 9p 1s 9s E S W N Z F B | 9m ",
    examples: [
      { label: "国士无双十三面", tiles: "1m 9m 1p 9p 1s 9s E S W N Z F B", wait:   ["1m", "9m", "1p", "9p", "1s", "9s", "E", "S", "W", "N", "Z", "F", "B"] },
      { label: "国士无振十三面", tiles: "1m 9m 1p 9p 1s 9s E S W N Z F B", wait:   ["1m", "9m", "1p", "9p", "1s", "9s", "E", "S", "W", "N", "Z", "F", "B"], river: "2s 5s 6p 3m 4m 7p 7p",},
 ],
    tips: "共计13 张的幺九字牌各一张，其中任意一种再凑一张作雀头，共 14 张。字牌（东南西北中发白）和幺九（一九万、一九饼、一九索）都算在内。" },

  { id: "da_si_xi", name: "大四喜", fan: 88,
    desc: "东南西北四种风牌各一刻子，加任意雀头。",
    conditions: "可以吃碰杠。",
    excludes: ["碰碰和", "三风刻", "门风刻", "圈风刻"],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["风牌", "刻子", "字牌"], source: "国标",
    example: "E E E | S S S | W W W | N N N | 2s 2s",
    tips: "雀头可以是任意牌（字牌或数牌均可）。四组风刻本身已完整，雀头只是凑 14 张用。" },

  { id: "da_san_yuan", name: "大三元", fan: 88,
    desc: "中发白三元牌各一刻子，加任意一个面子和任意雀头。",
    conditions: "可以吃碰杠。",
    excludes: ["双箭刻", "箭刻"],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["三元牌", "刻子", "字牌"], source: "国标",
    example: "Z Z Z | F F F | B B B | 1m 2m 3m | 5p 5p",
    tips: "中发白三刻固定，第四组面子和雀头随意搭配即可。雀头可以是字牌或数牌，不要求和前三组相关。" },

  { id: "lv_yi_se", name: "绿一色", fan: 88,
    desc: "由 2、3、4、6、8 条和发牌组成的合法 33332 胡牌。",
    excludes: ["混一色"],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["一色", "三元牌"], source: "国标",
    notes: "计清一色（纯正绿一色时）、箭刻及其他可复合番种。",
    example: "2s 3s 4s | 6s 6s 6s | 2s 3s 4s | F F F | 8s 8s",
    examples: [
      { label: "含发刻", tiles: "2s 3s 4s | 6s 6s 6s | 2s 3s 4s | F F F | 8s 8s" },
      { label: "纯绿（无发）", tiles: "2s 3s 4s | 2s 3s 4s | 6s 6s 6s | 8s 8s 8s | 4s 4s" },
      { label: "七对子", tiles: "2s 2s 2s 2s 3s 3s 4s 4s 6s 6s 8s 8s F F" },
    ],
    tips: "只能用索子中的 2、3、4、6、8，以及发牌（绿色字牌），不能有其他牌。含发时不计清一色；纯索子无发时同时计清一色。" },

  { id: "jiu_lian_bao_deng", name: "九莲宝灯", fan: 88,
    desc: "同一花色的 1112345678999 加任意一张该花色牌。",
    conditions: "必须门清。可听 9 张（纯正九莲），也可缺一张听单张缺口。部分规则严格要求必须听9张的情况才算",
    excludes: ["清一色", "门前清", "幺九刻"],
    handTypes: ["33332"], meldAllowed: false,
    tags: ["一色", "幺九", "门清"], source: "国标",
    notes: "（村）舍牌不含该花色牌的纯正九莲称「无振纯九」，额外计 64 番。",
    example: "1p 1p 1p 2p 3p 4p 5p 5p 7p 8p 9p 9p 9p | 6p",
    examples: [
      { label: "纯正九莲宝灯", tiles: "1p 1p 1p 2p 3p 4p 5p 6p 7p 8p 9p 9p 9p", wait:   ["1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p"] },
      { label: "无振纯九", tiles: "1p 1p 1p 2p 3p 4p 5p 6p 7p 8p 9p 9p 9p", wait:   ["1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p"], river: "2s 5s E 3m 4m S Z", },
      { label: "高目九莲低目清一色", tiles: "1p 1p 1p 3p 4p 5p 5p 6p 7p 8p 9p 9p 9p | 2p",  wait:   ["4p", "5p", "7p", "8p"] },
    ],
    tips: "基本形为 1112345678999，手里保持这 13 张后，摸到该花色任意一张均可和牌（共 9 种张），称「纯正九莲」。将牌不可以是字牌。" },

  { id: "si_gang_zi", name: "四杠子", fan: 88,
    desc: "四个杠子加单吊最后一张雀头。",
    excludes: ["碰碰和", "听单张"],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["杠子"], source: "国标",
    notes: "可复合暗刻系列（4/3/2 暗刻，只取最高）。",
    example: "1m 1m 1m 1m | X E E X | X 9p 9p X | B B B B | Z Z",
    tips: "四组杠子（每组 4 张相同），加单张将牌，共 18 张展示。杠可以是暗杠或明杠。" },

  { id: "lian_qi_dui", name: "连七对", fan: 88,
    desc: "同种花色连续 7 个对子。",
    conditions: "必须门清。",
    excludes: ["门前清", "清一色", "七对子", "平和"],
    handTypes: ["七对"], meldAllowed: false,
    tags: ["一色", "七对", "门清"], source: "国标",
    notes: "2~8 的连七对分别称大数邻（万）、大竹林（条）、大车轮（饼）。",
    example: "1p 1p | 2p 2p | 3p 3p | 4p 4p | 5p 5p | 6p 6p | 7p 7p",
    examples: [
      { label: "大车轮（2~8 饼）", tiles: "2p 2p | 3p 3p | 4p 4p | 5p 5p | 6p 6p | 7p 7p | 8p 8p" },
      { label: "大竹林（2~8 索）", tiles: "2s 2s | 3s 3s | 4s 4s | 5s 5s | 6s 6s | 7s 7s | 8s 8s" },
      { label: "大数邻（2~8 万）", tiles: "2m 2m | 3m 3m | 4m 4m | 5m 5m | 6m 6m | 7m 7m | 8m 8m" },
      { label: "低目清一色可能", tiles: "2m 2m | 3m 3m | 4m 4m | 5m 5m | 6m 6m | 7m 7m | 8m", wait:   ["2m", "5m", "8m"] },
    ],
    tips: "7 对的序号必须连续，如 3456789 或 2345678 均可。三种特殊命名（大车轮/大竹林/大数邻）专指 2~8 连七对，起止不同则只称连七对。" },

  { id: "tian_he", name: "天和", fan: 88,
    desc: "庄家起手 14 张配牌直接满足胡牌条件。",
    conditions: "庄家限定，必须门清自摸。",
    excludes: ["不求人"],
    handTypes: ["33332", "七对", "不靠", "国士"], meldAllowed: false,
    tags: ["特殊和牌", "门清", "自摸", "村规"], source: "村规",
    example: "1m 2m 3m | 4m 5m 6m | 7m 8m 9m | 1p 2p 3p | 5p 5p",
    tips: "庄家专属，起手 14 张（含补张前的初始牌）直接可以胡牌即为天和。理论上可以复合其他番种（如清一色）。" },

  { id: "si_an_ke_dan_qi", name: "四暗刻单骑", fan: 88,
    desc: "四组暗刻加单吊最后一张雀头。",
    excludes: ["听单张", "碰碰和", "门前清"],
    handTypes: ["33332"], meldAllowed: false,
    tags: ["暗刻", "门清", "村规"], source: "村规",
    example: "1m 1m 1m | 9p 9p 9p | E E E | Z Z Z | N | N",
    tips: "四组暗刻全部为手牌中自摸的刻子（不可碰牌），听牌时为单张将牌的单骑听，区别于双碰听的普通四暗刻（64 番）。" },

  { id: "da_qi_xing", name: "大七星", fan: 88,
    desc: "字一色的七对子牌型（东南西北中发白各两张）。",
    excludes: ["七对子", "字一色"],
    handTypes: ["七对"], meldAllowed: false,
    tags: ["字牌", "七对", "门清"], source: "古役",
    example: "E E | S S | W W | N N | Z Z | F F | B B",
    tips: "7 种字牌（东南西北中发白）各恰好两张，共 14 张。牌型完全固定，只有这一种组合。" },

  // ─────────────────────────────────────────────────────
  //  64 番  役满
  // ─────────────────────────────────────────────────────
  { id: "di_he", name: "地和", fan: 64,
    desc: "闲家起手 13 张满足听牌，第一巡无人鸣牌时自摸胡牌。",
    conditions: "闲家限定，必须门清自摸。",
    excludes: ["不求人"],
    handTypes: ["33332", "七对", "不靠"], meldAllowed: false,
    tags: ["特殊和牌", "门清", "自摸", "村规"], source: "村规" ,
    example: "1s 2s 3s | 4s 5s 6s | 7s 8s 9s | B B | E E | E", },


  { id: "ren_he", name: "人和", fan: 64,
    desc: "闲家起手 13 张满足听牌，胡庄家打出的第一张牌。",
    conditions: "闲家限定，必须门清。",
    excludes: ["门前清"],
    handTypes: ["33332", "七对", "不靠"], meldAllowed: false,
    tags: ["特殊和牌", "门清", "村规"], source: "村规" },

  { id: "qing_yao_jiu", name: "清幺九", nameAlt: ["清老头"], fan: 64,
    desc: "完全由数字 1 和 9 组成的 33332 或七对子胡牌。",
    excludes: ["纯全带幺九", "无字"],
    handTypes: ["33332", "七对"], meldAllowed: true,
    tags: ["幺九", "无字"], source: "国标/日麻" },

  { id: "zi_yi_se", name: "字一色", fan: 64,
    desc: "全是字牌（风牌和三元牌）的 33332 或七对子胡牌。",
    excludes: [],
    handTypes: ["33332", "七对"], meldAllowed: true,
    tags: ["字牌", "风牌", "三元牌"], source: "国标" },

  { id: "xiao_si_xi", name: "小四喜", fan: 64,
    desc: "三组风牌刻子加一组风牌雀头，再加任意一个合法面子。",
    excludes: ["三风刻"],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["风牌", "刻子", "字牌"], source: "国标" },

  { id: "xiao_san_yuan", name: "小三元", fan: 64,
    desc: "两组三元牌刻子加一组三元牌雀头，再加任意两个合法面子。",
    excludes: ["箭刻", "双箭刻"],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["三元牌", "刻子", "字牌"], source: "国标" },

  { id: "si_an_ke", name: "四暗刻", fan: 64,
    desc: "四组暗刻加雀头。",
    conditions: "必须门清自摸（双碰听牌时胡别人打的牌，只算三暗刻+一明刻）。",
    excludes: ["门前清", "碰碰和", "不求人"],
    handTypes: ["33332"], meldAllowed: false,
    tags: ["暗刻", "刻子", "门清", "自摸"], source: "国标" },

  { id: "yi_se_shuang_long_hui", name: "一色双龙会", fan: 64,
    desc: "同一花色的 123、123、5（雀头）、789、789。",
    conditions: "必须门清。",
    excludes: ["老少副", "一般高", "清一色", "平和", "缺一门", "七对子"],
    handTypes: ["33332"], meldAllowed: false,
    tags: ["一色", "顺子", "门清"], source: "国标" },

  // ─────────────────────────────────────────────────────
  //  48 番  倍满
  // ─────────────────────────────────────────────────────
  { id: "yi_se_si_tong_shun", name: "一色四同顺", fan: 48,
    desc: "同种花色四个完全相同的顺子。",
    excludes: ["一色三节高", "一般高", "四归一"],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["一色", "顺子"], source: "国标" },

  { id: "yi_se_si_jie_gao", name: "一色四节高", fan: 48,
    desc: "同种花色四个序数依次递增 1 位的刻子，加任意雀头。",
    excludes: ["碰碰和", "一色三同顺"],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["一色", "刻子"], source: "国标" },

  { id: "san_an_gang", name: "三暗杠", fan: 48,
    desc: "三个暗杠（必然同时具备三杠子和三暗刻，合计 48 番）。",
    excludes: ["三杠子", "三暗刻"],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["暗杠", "杠子", "暗刻"], source: "国标" },

  { id: "liu_ju_man_guan", name: "流局满贯", nameAlt: ["幺九振切"], fan: 48,
    desc: "荒牌流局时，自家舍牌全为幺九及字牌，且没被人吃碰杠过自己的舍牌。",
    conditions: "完成流局结算后，向其余三家进行一次等效自摸 48 番结算，无论如何都下庄。",
    excludes: [],
    handTypes: [], meldAllowed: false,
    tags: ["流局", "幺九", "字牌", "广港日"], source: "广港日" },

  { id: "chun_quan_dai_yao_jiu", name: "纯全带幺九", fan: 48,
    desc: "33332 胡牌模式下，所有面子和雀头都包含幺九牌。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["幺九"], source: "广港日",
    notes: "存在副露则降低至 32 番。" },

  { id: "shi_shang_san_nian", name: "石上三年", fan: 48,
    desc: "二立直后以海底（妙手回春）或河底（海底捞月）形式胡牌。",
    excludes: ["二立直", "妙手回春", "海底捞月"],
    handTypes: ["33332", "七对"], meldAllowed: false,
    tags: ["立直", "特殊和牌", "日麻"], source: "日麻" },

  { id: "ming_pai_li_zhi", name: "明牌立直", nameAlt: ["Open RIICHI"], fan: 48,
    desc: "立直时公布全部手牌及听牌。",
    excludes: ["立直", "门前清"],
    handTypes: ["33332", "七对"], meldAllowed: false,
    tags: ["立直", "门清", "日麻"], source: "日麻" },

  // ─────────────────────────────────────────────────────
  //  32 番  跳满
  // ─────────────────────────────────────────────────────
  { id: "yi_se_si_bu_gao", name: "一色四步高", fan: 32,
    desc: "同种花色四个序数依次递增 1 位或 2 位的顺子，加雀头。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["一色", "顺子"], source: "国标" },

  { id: "san_gang_zi", name: "三杠子", fan: 32,
    desc: "胡牌中存在三个杠子（明暗不限）。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["杠子"], source: "国标" },

  { id: "hun_yao_jiu", name: "混幺九", nameAlt: ["混老头"], fan: 32,
    desc: "胡牌中只有老头牌（1 和 9）和字牌，没有其他数字牌。",
    excludes: [],
    handTypes: ["33332", "七对"], meldAllowed: true,
    tags: ["幺九", "字牌"], source: "国标" },

  { id: "yue_jian_hua_kai", name: "月见花开", fan: 32,
    desc: "岭上开花所摸的恰好是本局最后一张可摸的牌。",
    excludes: ["杠上开花", "妙手回春"],
    handTypes: ["33332", "七对"], meldAllowed: true,
    tags: ["特殊和牌", "杠子", "自摸", "村规"], source: "村规" },

  { id: "gang_zhen", name: "杠振", fan: 32,
    desc: "胡其他家岭上摸到的最后一张可摸的牌后打出的那张牌（放铳）。",
    excludes: ["海底捞月", "杠上开铳"],
    handTypes: ["33332", "七对"], meldAllowed: true,
    tags: ["特殊和牌", "村规"], source: "村规" },

  // ─────────────────────────────────────────────────────
  //  24 番
  // ─────────────────────────────────────────────────────
  { id: "qi_dui_zi", name: "七对子", fan: 24,
    desc: "七组对子组成的胡牌，允许出现四张一样的牌（作为两个对子）。",
    conditions: "必须门清。",
    excludes: ["门前清", "听单张"],
    handTypes: ["七对"], meldAllowed: false,
    tags: ["七对", "门清"], source: "国标" },

  { id: "qi_xing_bu_kao", name: "七星不靠", fan: 24,
    desc: "7 个单张字牌（东南西北中发白）加 3 种花色各自从 147、258、369 中选出共 7 张不能错位的数字牌。",
    conditions: "必须门清。听牌范围不止一张。",
    excludes: ["全不靠", "五门齐", "门前清"],
    handTypes: ["不靠"], meldAllowed: false,
    tags: ["字牌", "特殊牌型", "门清"], source: "国标" },

  { id: "quan_shuang_ke", name: "全双刻", fan: 24,
    desc: "全部由双数数字牌（2、4、6、8）组成的碰碰胡。",
    excludes: ["无字", "碰碰和", "断幺"],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["刻子", "断幺", "无字", "对对胡"], source: "国标" },

  { id: "qing_yi_se", name: "清一色", fan: 24,
    desc: "由同一种花色数字牌组成的胡牌（33332 或七对子）。",
    excludes: ["缺一门", "无字"],
    handTypes: ["33332", "七对"], meldAllowed: true,
    tags: ["一色", "无字"], source: "国标",
    notes: "必然包含两次缺一门，故不计缺一门。" },

  { id: "yi_se_san_tong_shun", name: "一色三同顺", fan: 24,
    desc: "同种花色三个完全相同的顺子。",
    excludes: ["一色三节高", "一般高"],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["一色", "顺子"], source: "国标" },

  { id: "yi_se_san_jie_gao", name: "一色三节高", fan: 24,
    desc: "同种花色三个序数依次递增 1 位的刻子。",
    excludes: ["一色三同顺"],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["一色", "刻子"], source: "国标" },

  { id: "quan_da", name: "全大", fan: 24,
    desc: "全部由 7、8、9 数字牌组成的胡牌。",
    excludes: ["大于5"],
    handTypes: ["33332", "七对"], meldAllowed: true,
    tags: ["无字", "断幺"], source: "国标" },

  { id: "quan_zhong", name: "全中", fan: 24,
    desc: "全部由 4、5、6 数字牌组成的胡牌。",
    excludes: ["断幺"],
    handTypes: ["33332", "七对"], meldAllowed: true,
    tags: ["无字", "断幺"], source: "国标" },

  { id: "quan_xiao", name: "全小", fan: 24,
    desc: "全部由 1、2、3 数字牌组成的胡牌。",
    excludes: ["小于5"],
    handTypes: ["33332", "七对"], meldAllowed: true,
    tags: ["无字", "断幺"], source: "国标" },

  // ─────────────────────────────────────────────────────
  //  16 番
  // ─────────────────────────────────────────────────────
  { id: "qing_long", name: "清龙", nameAlt: ["一气通贯"], fan: 16,
    desc: "同一种花色的 1~9 完整相连（即 123、456、789 各一组）。",
    excludes: ["连6"],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["一色", "顺子"], source: "国标/日麻" },

  { id: "san_se_shuang_long_hui", name: "三色双龙会", fan: 16,
    desc: "两种花色各一组老少副（123+789），第三种花色的 5 作雀头。",
    excludes: ["喜相逢", "老少副", "平和", "无字"],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["顺子", "无字"], source: "国标" },

  { id: "yi_se_san_bu_gao", name: "一色三步高", fan: 16,
    desc: "同种花色三个序数依次递增 1 位或 2 位的顺子（如 123+234+345 或 123+345+567）。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["一色", "顺子"], source: "国标" },

  { id: "quan_dai_wu", name: "全带5", fan: 16,
    desc: "每组面子及雀头都包含 5 的数字牌。",
    excludes: ["断幺"],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["断幺", "无字"], source: "国标" },

  { id: "san_tong_ke", name: "三同刻", nameAlt: ["三色同刻"], fan: 16,
    desc: "三种花色各一组序数相同的刻子（或杠）。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["刻子"], source: "国标/日麻" },

  { id: "san_an_ke", name: "三暗刻", fan: 16,
    desc: "三组暗刻（由自己摸上来的三组刻子）。",
    conditions: "双碰听牌胡别人打的牌只算两暗刻+一明刻，不计三暗刻。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["暗刻"], source: "国标" },

  { id: "er_li_zhi", name: "二立直", nameAlt: ["双立直", "w Riichi"], fan: 16,
    desc: "在第一巡无人鸣牌的情况下摸牌后即达到听牌状态并宣布立直。",
    conditions: "必须门清。产生立直的振听规则。",
    excludes: ["门前清", "立直"],
    handTypes: ["33332", "七对"], meldAllowed: false,
    tags: ["立直", "门清", "日麻"], source: "日麻" },

  // ─────────────────────────────────────────────────────
  //  12 番
  // ─────────────────────────────────────────────────────
  { id: "quan_bu_kao", name: "全不靠", fan: 12,
    desc: "3 种花色各自从 147、258、369 中不能错位的数字牌，加东南西北中发白中的任意 14 张。",
    conditions: "必须门清。听牌范围不止一张。",
    excludes: ["五门齐", "门前清"],
    handTypes: ["不靠"], meldAllowed: false,
    tags: ["特殊牌型", "门清"], source: "国标" },

  { id: "zu_he_long", name: "组合龙", fan: 12,
    desc: "三种花色的 147、258、369 作为特殊「顺子」（不能错位），再带一个面子和一个雀头。",
    conditions: "组合龙本身不可以用吃牌形成。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["特殊牌型"], source: "国标" },

  { id: "da_yu_wu", name: "大于5", fan: 12,
    desc: "由数字 6~9 的顺子、刻子、将牌组成的和牌。",
    excludes: ["无字"],
    handTypes: ["33332", "七对"], meldAllowed: true,
    tags: ["无字", "断幺"], source: "国标" },

  { id: "xiao_yu_wu", name: "小于5", fan: 12,
    desc: "由数字 1~4 的顺子、刻子、将牌组成的和牌。",
    excludes: ["无字"],
    handTypes: ["33332", "七对"], meldAllowed: true,
    tags: ["无字", "断幺"], source: "国标" },

  { id: "san_feng_ke", name: "三风刻", fan: 12,
    desc: "三个风牌刻子（或杠）。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["风牌", "刻子", "字牌"], source: "国标" },

  // ─────────────────────────────────────────────────────
  //  8 番
  // ─────────────────────────────────────────────────────
  { id: "hua_long", name: "花龙", fan: 8,
    desc: "三种不同花色的三组顺子连接成 1 到 9 的完整数字牌（如 123 万 + 456 条 + 789 饼）。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["顺子"], source: "国标" },

  { id: "tui_bu_dao", name: "推不倒", fan: 8,
    desc: "由牌面图形没有上下区别的牌组成的 33332 或七对子。包括 1234589 饼、245689 条、白板。",
    excludes: ["缺一门"],
    handTypes: ["33332", "七对"], meldAllowed: true,
    tags: ["特殊牌型"], source: "国标" },

  { id: "san_se_san_tong_shun", name: "三色三同顺", nameAlt: ["三色同顺"], fan: 8,
    desc: "三种花色各一组序数相同的顺子。",
    excludes: ["喜相逢"],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["顺子"], source: "国标/日麻" },

  { id: "san_se_san_jie_gao", name: "三色三节高", fan: 8,
    desc: "三种花色各一组序数依次递增 1 位的刻子。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["刻子"], source: "国标" },

  { id: "wu_fan_he", name: "无番和", fan: 8,
    desc: "除无番和以外什么番都没有的和牌。",
    conditions: "需要所有人确认。推倒后当场无人发现则不算诈和。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["特殊牌型"], source: "国标",
    notes: "不得是绝张、自摸、妙手回春、海底捞月（广港日）、河底捞鱼或杠振。" },

  { id: "miao_shou_hui_chun", name: "妙手回春", nameAlt: ["海底捞月（广港日）"], fan: 8,
    desc: "自摸能摸到的最后一张牌。",
    excludes: [],
    handTypes: ["33332", "七对", "不靠"], meldAllowed: true,
    tags: ["特殊和牌", "自摸"], source: "国标" },

  { id: "hai_di_lao_yue", name: "海底捞月", nameAlt: ["河底捞鱼（广港日）"], fan: 8,
    desc: "和别人打出的本局最后一张牌（非自摸）。",
    excludes: [],
    handTypes: ["33332", "七对", "不靠"], meldAllowed: true,
    tags: ["特殊和牌"], source: "国标" },

  { id: "gang_shang_kai_hua", name: "杠上开花", nameAlt: ["岭上开花（广港日）"], fan: 8,
    desc: "开杠后摸岭上牌自摸胡牌。",
    excludes: [],
    handTypes: ["33332", "七对"], meldAllowed: true,
    tags: ["特殊和牌", "杠子", "自摸"], source: "国标" },

  { id: "qiang_gang_he", name: "抢杠和", fan: 8,
    desc: "和其他人开明杠的牌（国士可抢暗杠，其余不可）。",
    excludes: ["和绝张"],
    handTypes: ["33332", "七对"], meldAllowed: true,
    tags: ["特殊和牌"], source: "国标" },

  { id: "gang_shang_kai_chong", name: "杠上开铳", fan: 8,
    desc: "和其他人开杠后打出的牌。",
    excludes: [],
    handTypes: ["33332", "七对"], meldAllowed: true,
    tags: ["特殊和牌", "杠子"], source: "广港日川" },

  { id: "shuang_an_gang", name: "双暗杠", fan: 8,
    desc: "两个暗杠。",
    excludes: ["双暗刻"],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["暗杠", "杠子"], source: "国标" },

  // ─────────────────────────────────────────────────────
  //  6 番
  // ─────────────────────────────────────────────────────
  { id: "peng_peng_he", name: "碰碰和", fan: 6,
    desc: "由四组刻子（或杠）加雀头组成的和牌。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["刻子", "对对胡"], source: "国标" },

  { id: "hun_yi_se", name: "混一色", fan: 6,
    desc: "由一种花色数字牌加字牌组成的和牌。",
    excludes: ["缺一门"],
    handTypes: ["33332", "七对"], meldAllowed: true,
    tags: ["一色", "字牌"], source: "国标",
    notes: "必然包含两次缺一门，故不计缺一门。" },

  { id: "san_se_san_bu_gao", name: "三色三步高", fan: 6,
    desc: "三种花色各一组序数依次递增 1 位的顺子（如 234 万 + 345 条 + 456 饼）。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["顺子"], source: "国标" },

  { id: "wu_men_qi", name: "五门齐", fan: 6,
    desc: "和牌时三种数字牌（万条饼）、风牌、三元牌齐全。",
    excludes: [],
    handTypes: ["33332", "不靠"], meldAllowed: true,
    tags: ["字牌", "风牌", "三元牌"], source: "国标" },

  { id: "quan_qiu_ren", name: "全求人", fan: 6,
    desc: "全靠吃牌、碰牌，最后单吊别人打出的牌胡牌（四副露单吊）。",
    excludes: ["听单张"],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["副露"], source: "国标" },

  { id: "ming_an_gang", name: "明暗杠", fan: 6,
    desc: "一个暗杠加一个明杠。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["杠子", "暗杠"], source: "国标" },

  { id: "shuang_jian_ke", name: "双箭刻", fan: 6,
    desc: "两组三元牌（中发白）刻子或杠。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["三元牌", "刻子", "字牌"], source: "国标" },

  // ─────────────────────────────────────────────────────
  //  4 番
  // ─────────────────────────────────────────────────────
  { id: "quan_dai_yao", name: "全带幺", nameAlt: ["混全带幺九"], fan: 4,
    desc: "和牌时每组面子和雀头都包含老头牌（1 或 9）或字牌。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["幺九", "字牌"], source: "日麻" },

  { id: "shuang_ming_gang", name: "双明杠", fan: 4,
    desc: "两个明杠。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["杠子"], source: "国标" },

  { id: "he_jue_zhang", name: "和绝张", fan: 4,
    desc: "和到此前场上副露和牌河区域已经出现三张（即场上最后一张）的牌。",
    excludes: [],
    handTypes: ["33332", "七对"], meldAllowed: true,
    tags: ["特殊和牌"], source: "国标" },

  // ─────────────────────────────────────────────────────
  //  2 番
  // ─────────────────────────────────────────────────────
  { id: "jian_ke", name: "箭刻", fan: 2,
    desc: "三元牌（中发白）的刻子或杠。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["三元牌", "刻子", "字牌"], source: "国标" },

  { id: "quan_feng_ke", name: "圈风刻", nameAlt: ["场风刻"], fan: 2,
    desc: "当前圈风（场风）对应的风牌刻子或杠。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["风牌", "刻子", "字牌"], source: "国标/日麻" },

  { id: "men_feng_ke", name: "门风刻", fan: 2,
    desc: "自己座位对应的风牌刻子或杠。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["风牌", "刻子", "字牌"], source: "国标" },

  { id: "men_qian_qing", name: "门前清", fan: 2,
    desc: "没有鸣牌（吃碰明杠），允许暗杠。",
    excludes: [],
    handTypes: ["33332", "七对", "不靠"], meldAllowed: false,
    tags: ["门清"], source: "国标" },

  { id: "bu_qiu_ren", name: "不求人", nameAlt: ["门清自摸和"], fan: 2,
    desc: "门清状态下以自摸形式胡牌。可以与门前清复合。",
    conditions: "村规修正：必然门清的牌型只失去门前清的 2 番，仍可计此 2 番。",
    excludes: [],
    handTypes: ["33332", "七对", "不靠"], meldAllowed: false,
    tags: ["门清", "自摸"], source: "国标" },

  { id: "ping_he", name: "平和", fan: 2,
    desc: "四组顺子加非字牌雀头。无论听牌形式。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["顺子"], source: "国标" },

  { id: "si_gui_yi", name: "四归一", fan: 2,
    desc: "同一种牌的四张以非杠牌的形式出现在胡牌中（如 1 万刻子 + 含 1 万的顺子）。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["特殊牌型"], source: "国标" },

  { id: "shuang_tong_ke", name: "双同刻", nameAlt: ["双色同刻"], fan: 2,
    desc: "两种不同花色的同种序数刻子（或杠）。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["刻子", "村规"], source: "村规" },

  { id: "shuang_an_ke", name: "双暗刻", fan: 2,
    desc: "两个暗刻。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["暗刻"], source: "国标" },

  { id: "an_gang", name: "暗杠", fan: 2,
    desc: "自己手里摸上来四张一样的牌并杠出。",
    conditions: "暗杠时向所有人展示后扣下。暗杠不破坏暗刻的计算。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["暗杠", "杠子"], source: "国标" },

  { id: "duan_yao", name: "断幺", fan: 2,
    desc: "牌里不包括老头牌（1 和 9）和字牌。",
    excludes: ["无字"],
    handTypes: ["33332", "七对"], meldAllowed: true,
    tags: ["断幺", "无字"], source: "国标" },

  { id: "yi_fa", name: "一发", fan: 2,
    desc: "宣布立直后一巡内（包括自己立直后下一次摸牌），在无人鸣牌的情况下胡牌。",
    excludes: [],
    handTypes: ["33332", "七对"], meldAllowed: false,
    tags: ["立直", "门清", "日麻"], source: "日麻" },

  // ─────────────────────────────────────────────────────
  //  1 番
  // ─────────────────────────────────────────────────────
  { id: "yi_ban_gao", name: "一般高", nameAlt: ["一杯口"], fan: 1,
    desc: "同种花色两个完全相同的顺子。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["顺子", "一色"], source: "国标" },

  { id: "xi_xiang_feng", name: "喜相逢", fan: 1,
    desc: "不同花色两个序数相同的顺子。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["顺子"], source: "国标" },

  { id: "lian_liu", name: "连6", fan: 1,
    desc: "同种花色 6 张相邻的数字牌（允许刻子形式，如 222 万 333 万 456 万 777 万 中的连 6）。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["一色"], source: "国标" },

  { id: "lao_shao_fu", name: "老少副", fan: 1,
    desc: "同种花色的 123 和 789 两组顺子。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["顺子", "一色", "幺九"], source: "国标" },

  { id: "yao_jiu_ke", name: "幺九刻", fan: 1,
    desc: "老头牌（数字 1 或 9）的刻子或杠。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["幺九", "刻子"], source: "国标" },

  { id: "ming_gang", name: "明杠", fan: 1,
    desc: "一个明杠。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["杠子", "副露"], source: "国标" },

  { id: "que_yi_men", name: "缺一门", fan: 1,
    desc: "缺少一种花色的数字牌。",
    excludes: [],
    handTypes: ["33332", "七对"], meldAllowed: true,
    tags: ["花色"], source: "国标" },

  { id: "wu_zi", name: "无字", fan: 1,
    desc: "没有字牌（风牌和三元牌）。",
    excludes: [],
    handTypes: ["33332", "七对"], meldAllowed: true,
    tags: ["无字"], source: "国标" },

  { id: "ting_dan_zhang", name: "听单张", fan: 1,
    desc: "以边张、坎张或单吊将牌形式听牌，胡牌范围只有一张牌。",
    excludes: [],
    handTypes: ["33332", "七对"], meldAllowed: true,
    tags: ["特殊牌型"], source: "国标" },

  { id: "fei_men_qing_zi_mo", name: "非门清自摸", fan: 1,
    desc: "有鸣牌（副露）的情况下自摸胡牌。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["副露", "自摸"], source: "国标" },

  { id: "hua_pai", name: "花牌", fan: 1,
    desc: "补花时每张被补出的花牌加 1 番。",
    excludes: [],
    handTypes: [], meldAllowed: true,
    tags: ["特殊牌型"], source: "国标",
    notes: "一般不开花牌。" },

  { id: "bao_pai", name: "宝牌", fan: 1,
    desc: "立直胡牌后翻出宝牌指示牌，手里每张宝牌加 1 番。",
    conditions: "宝牌指示牌的下一张为宝牌（数字牌 9→1 循环，风牌东南西北循环，三元牌中发白循环）。",
    excludes: [],
    handTypes: ["33332", "七对"], meldAllowed: false,
    tags: ["立直", "日麻"], source: "日麻",
    notes: "与立直 8 番二选一：开宝牌时按宝牌+番种计；不开时不满 8 番记 8 番。" },

  // ─────────────────────────────────────────────────────
  //  0 番  立直
  // ─────────────────────────────────────────────────────
  { id: "li_zhi", name: "立直", fan: 0,
    desc: "门清状态下宣布听牌立直。之后只能摸切，不能改听（暗杠若不改听则可以暗杠）。",
    conditions: "允许在不满足当前场规起胡要求的情况下胡牌。产生振听规则。",
    excludes: ["门前清"],
    handTypes: ["33332", "七对"], meldAllowed: false,
    tags: ["立直", "门清", "日麻"], source: "日麻",
    notes: "不开宝牌时不满 8 番的胡牌记作 8 番。未胡 -2 分，其他人抢先胡牌额外 +2 分。" },

  // ─────────────────────────────────────────────────────
  //  DLC  （默认不显示）
  // ─────────────────────────────────────────────────────
  { id: "zi_hua", name: "自花", fan: 1,
    desc: "补花时获得自己座位对应的花牌（梅兰菊竹 / 春夏秋冬），在花牌基础上额外 +1 番。",
    excludes: [], handTypes: [], meldAllowed: true,
    tags: ["特殊牌型"], source: "DLC", dlc: true },

  { id: "zi_ji_jie", name: "自季节", fan: 1,
    desc: "补花时获得自己座位对应的季节牌，在花牌基础上额外 +1 番。",
    excludes: [], handTypes: [], meldAllowed: true,
    tags: ["特殊牌型"], source: "DLC", dlc: true },

  { id: "si_jun_zi", name: "四君子/四季", fan: 4,
    desc: "一人集齐四张花牌（梅兰菊竹或春夏秋冬），在 4 花牌基础上额外 +4 番。",
    excludes: [], handTypes: [], meldAllowed: true,
    tags: ["特殊牌型"], source: "DLC", dlc: true },

  { id: "ba_xian_guo_hai", name: "八仙过海", fan: 64,
    desc: "同一人补花 8 次或直接拿到 8 张花牌，立刻亮出直接自摸 64 番（无需打牌操作）。",
    excludes: [], handTypes: [], meldAllowed: true,
    tags: ["特殊和牌"], source: "DLC", dlc: true },

  { id: "hua_he", name: "花和", fan: 8,
    desc: "补花 6 次后和第 7 张花，自摸 8 番。",
    excludes: [], handTypes: [], meldAllowed: true,
    tags: ["特殊和牌"], source: "DLC", dlc: true },

  { id: "lan_yi_se", name: "蓝一色", fan: 88,
    desc: "由东南西北风牌、白板和八饼组成的和牌。",
    excludes: ["混一色"],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["字牌", "风牌", "一色"], source: "DLC", dlc: true,
    notes: "必然碰碰胡，不计混一色。" },

  { id: "hei_yi_se", name: "黑一色", fan: 88,
    desc: "由 2、4、8 饼的刻子和任意东南西北风牌组成的和牌。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["字牌", "风牌", "一色"], source: "DLC", dlc: true,
    notes: "必然碰碰胡混一色。" },

  { id: "hong_yi_se", name: "红一色", nameAlt: ["红孔雀"], fan: 88,
    desc: "由 1、5、7、9 条和红中组成的和牌。",
    excludes: [],
    handTypes: ["33332"], meldAllowed: true,
    tags: ["三元牌", "一色"], source: "DLC", dlc: true,
    notes: "必然碰碰胡混一色。" },
];

// 所有番数层级（用于分组显示）
const FAN_TIERS = [
  { fan: 88, label: "役满" },
  { fan: 64, label: "役满" },
  { fan: 48, label: "倍满" },
  { fan: 32, label: "跳满" },
  { fan: 24, label: "" },
  { fan: 16, label: "" },
  { fan: 12, label: "" },
  { fan: 8,  label: "" },
  { fan: 6,  label: "" },
  { fan: 4,  label: "" },
  { fan: 2,  label: "" },
  { fan: 1,  label: "" },
  { fan: 0,  label: "立直" },
];

// 所有可用标签（用于筛选栏）
const ALL_TAGS = [
  "顺子", "刻子", "杠子", "七对", "对对胡",
  "暗刻", "暗杠",
  "一色", "无字", "字牌", "风牌", "三元牌", "幺九", "断幺",
  "门清", "副露", "自摸", "立直",
  "特殊牌型", "特殊和牌", "流局",
  "日麻", "村规",
];
