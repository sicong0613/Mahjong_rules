// English presentation layer for the /en pages.
// It keeps the rule ids, examples, and calculator-facing data stable, while
// replacing visible Chinese labels with English text.

(function () {
  const tagMap = {
    "顺子": "Chows", "刻子": "Pungs", "杠子": "Kongs", "七对": "Seven Pairs",
    "对对胡": "All Pungs", "暗刻": "Concealed Pungs", "暗杠": "Concealed Kongs",
    "一色": "One Suit", "无字": "No Honors", "字牌": "Honors", "风牌": "Winds",
    "三元牌": "Dragons", "幺九": "Terminals", "断幺": "Simples", "门清": "Closed",
    "副露": "Open", "自摸": "Self Draw", "立直": "Riichi",
    "特殊牌型": "Special Shape", "特殊和牌": "Special Win", "流局": "Draw",
    "日麻": "Japanese Mahjong", "村规": "House Rule",
  };

  const sourceMap = {
    "国标": "MCR", "日麻": "Japanese Mahjong", "村规": "House Rule", "古役": "Classical",
    "DLC": "DLC", "广港日": "Mixed Rules", "国标/日麻": "MCR / Japanese Mahjong",
  };

  const handTypeMap = {
    "33332": "Four melds and a pair",
    "七对": "Seven pairs",
    "不靠": "Knitted / unconnected",
    "国士": "Thirteen orphans",
  };

  const tierLabelMap = {
    "两倍役满": "Double Yakuman",
    "役满": "Yakuman",
    "三倍满": "Sanbaiman",
    "倍满": "Baiman",
    "跳满": "Haneman",
    "流局与犯规": "Draws and Fouls",
  };

  const descOverrides = {
    shi_san_yao: "One of each terminal and honor tile, plus a duplicate of any one of them as the pair.",
    da_si_xi: "Triplets or kongs of all four winds, plus any pair.",
    da_san_yuan: "Triplets or kongs of all three dragon tiles, plus any other meld and pair.",
    lv_yi_se: "A legal hand made only from green tiles: 2, 3, 4, 6, 8 bamboo and green dragons.",
    jiu_lian_bao_deng: "A closed one-suit hand based on 1112345678999 plus any extra tile of that suit.",
    si_gang_zi: "Four kongs plus a pair.",
    lian_qi_dui: "Seven consecutive pairs in one suit.",
    si_an_ke_dan_qi: "Four concealed triplets or kongs with a single-tile wait for the pair.",
    da_qi_xing: "Seven pairs made entirely from honors, with all seven honor types represented.",
    tian_he: "The dealer wins immediately with the initial 14-tile hand.",
    di_he: "A non-dealer starts in tenpai and wins by self-draw on the first uninterrupted turn.",
    ren_he: "A non-dealer starts in tenpai and wins on the dealer's first discard.",
    qing_yao_jiu: "A winning hand made only from terminal tiles.",
    zi_yi_se: "A winning hand made entirely from honor tiles.",
    xiao_si_xi: "Triplets or kongs of three winds, with the fourth wind as the pair.",
    xiao_san_yuan: "Triplets or kongs of two dragon tiles, with the third dragon as the pair.",
    si_an_ke: "Four concealed triplets or kongs plus a pair.",
    yi_se_shuang_long_hui: "In one suit, two 123 chows, a pair of 5s, and two 789 chows.",
    yi_se_si_tong_shun: "Four identical chows in the same suit.",
    yi_se_si_jie_gao: "Four same-suit triplets whose numbers rise by one step each.",
    san_an_gang: "Three concealed kongs.",
    liu_ju_man_guan: "At exhaustive draw, all of your discards are terminals or honors and none were called.",
    shi_shang_san_nian: "Win on the last draw or last discard after declaring double riichi.",
    ming_pai_li_zhi: "Declare riichi while revealing the whole hand; dealing into open riichi may count as yakuman by table rule.",
    yi_se_si_bu_gao: "Four same-suit chows whose starting numbers rise by one or two steps.",
    san_gang_zi: "A winning hand containing three kongs, open or concealed.",
    hun_yao_jiu: "A winning hand made only from terminals and honors.",
    yue_jian_hua_kai: "Win by kong replacement draw when that replacement tile is the last drawable tile.",
    gang_zhen: "Win on the discard made after another player draws the final replacement tile from a kong.",
    er_bei_kou: "A closed hand containing two separate pairs of identical chows.",
    qi_dui_zi: "Seven pairs. Four identical tiles may be treated as two pairs under this ruleset.",
    qi_xing_bu_kao: "Seven single honor tiles plus knitted numbered tiles that do not form ordinary melds.",
    quan_shuang_ke: "A hand made entirely from triplets or kongs of even-numbered tiles, plus an even pair.",
    qing_yi_se: "A legal winning hand made entirely from one numbered suit.",
    yi_se_san_tong_shun: "Three identical chows in the same suit.",
    yi_se_san_jie_gao: "Three same-suit triplets whose numbers rise by one step each.",
    quan_da: "Every numbered tile in the hand is 7, 8, or 9.",
    quan_zhong: "Every numbered tile in the hand is 4, 5, or 6.",
    quan_xiao: "Every numbered tile in the hand is 1, 2, or 3.",
    chun_quan_dai_yao_jiu: "Every meld and the pair contains a terminal, and the hand has no honors.",
    qing_long: "One suit contains the complete 123, 456, and 789 straight.",
    san_se_shuang_long_hui: "Two suits each have 123 and 789 chows, with a pair of 5s in the third suit.",
    yi_se_san_bu_gao: "Three same-suit chows whose starting numbers rise by one or two steps.",
    quan_dai_wu: "Every meld and the pair contains a 5 tile.",
    san_tong_ke: "Three triplets or kongs of the same number in all three suits.",
    san_an_ke: "Three concealed triplets.",
    er_li_zhi: "Declare riichi on the first uninterrupted turn.",
    quan_bu_kao: "A special unconnected hand made from single honors and knitted numbered tiles.",
    zu_he_long: "The knitted 1-4-7, 2-5-8, and 3-6-9 pattern across the three suits.",
    da_yu_wu: "All numbered tiles in the hand are 6 through 9.",
    xiao_yu_wu: "All numbered tiles in the hand are 1 through 4.",
    san_feng_ke: "Triplets or kongs of three different wind tiles.",
    hua_long: "Three chows in different suits that together form 123, 456, and 789.",
    tui_bu_dao: "A hand made only from tiles whose printed patterns remain valid when rotated.",
    san_se_san_tong_shun: "The same chow appears once in each of the three suits.",
    san_se_san_jie_gao: "Three triplets or kongs in different suits with numbers rising by one step.",
    wu_fan_he: "A legal winning hand that has no scoring pattern under the normal table.",
    miao_shou_hui_chun: "Win by self-draw on the last tile of the wall.",
    hai_di_lao_yue: "Win on another player's discard of the last tile from the wall.",
    gang_shang_kai_hua: "Win by self-draw on the replacement tile after declaring a kong.",
    qiang_gang_he: "Win by robbing another player's added kong.",
    gang_shang_kai_chong: "Win on the discard made after another player's kong replacement draw.",
    shuang_an_gang: "Two concealed kongs.",
    hun_yi_se: "A legal winning hand made from one numbered suit plus honor tiles.",
    san_se_san_bu_gao: "Three chows in different suits whose numbers rise by one step.",
    wu_men_qi: "The hand contains all five tile groups: three suits, winds, and dragons.",
    quan_qiu_ren: "Win by discard after all four melds were called, leaving a single wait.",
    ming_an_gang: "One concealed kong and one open kong.",
    shuang_jian_ke: "Two dragon triplets or kongs.",
    quan_dai_yao: "Every meld and the pair contains a terminal or honor tile.",
    shuang_ming_gang: "Two open kongs.",
    he_jue_zhang: "Win on the last remaining copy of that tile visible from discards and melds.",
    jian_ke: "A triplet or kong of dragon tiles.",
    quan_feng_ke: "A triplet or kong of the prevalent wind.",
    men_feng_ke: "A triplet or kong of your seat wind.",
    peng_peng_he: "Four triplets or kongs plus a pair.",
    ping_he: "Four chows and a non-honor pair.",
    si_gui_yi: "All four copies of one tile appear in the winning hand without being used as a kong.",
    shuang_tong_ke: "Two triplets or kongs of the same number in two different suits.",
    shuang_an_ke: "Two concealed triplets.",
    an_gang: "A concealed kong made from four identical tiles drawn into your own hand.",
    duan_yao: "A hand with no terminals and no honor tiles.",
    li_zhi: "Declare riichi from a closed tenpai hand, then play under riichi restrictions.",
    yi_fa: "Win within one uninterrupted turn after declaring riichi.",
    yi_ban_gao: "Two identical chows in the same suit.",
    xi_xiang_feng: "Two identical-number chows in different suits.",
    lian_liu: "Six consecutive numbered tiles in one suit.",
    lao_shao_fu: "A 123 chow and a 789 chow in the same suit.",
    yao_jiu_ke: "A triplet or kong of terminal or honor tiles.",
    ming_gang: "One open kong.",
    que_yi_men: "The hand is missing one of the three numbered suits.",
    wu_zi: "The hand contains no honor tiles.",
    ting_dan_zhang: "Wait on only one tile because of an edge, closed, or pair wait.",
    men_qian_qing: "A hand with no chii, pon, or open kong. Concealed kongs do not break it.",
    bu_qiu_ren: "A closed hand won by self-draw.",
    fei_men_qing_zi_mo: "An open hand won by self-draw.",
    hua_pai: "Each flower tile revealed by replacement adds 1 fan.",
    bao_pai: "Each dora tile adds fan but does not count as a yaku by itself.",
    jiu_pai: "On the first draw, if no one has called and your starting hand has nine different terminal or honor types, the hand may be redealt.",
    si_feng: "If all four players discard the same wind tile on the first uninterrupted turn, the hand is redealt.",
    si_gang: "When the fourth kong is declared by more than one player and no one wins, the hand is redealt.",
    huang_pai: "The hand ends in exhaustive draw when the last drawable tile is discarded and no one wins.",
    zha_hu: "False win: declaring a win and revealing the hand when it is not actually legal.",
    zha_li_zhi: "False riichi: a riichi declaration is checked later and the player was not in tenpai.",
    chu_qian: "Cheating or other conduct that violates fair play.",
    zi_hua: "A flower matching your seat gives an extra fan in addition to the flower tile fan.",
    zi_ji_jie: "A season tile matching your seat gives an extra fan in addition to the flower tile fan.",
    si_jun_zi: "Collect all four flower tiles of one flower group or all four seasons.",
    ba_xian_guo_hai: "One player reveals all eight flower tiles and wins immediately by self-draw.",
    hua_he: "After six flower replacements, win by drawing the seventh flower.",
    lan_yi_se: "A winning hand made from winds, white dragons, and 8 dots.",
    hei_yi_se: "A winning hand made from triplets of 2, 4, and 8 dots plus wind tiles.",
    hong_yi_se: "A winning hand made from 1, 5, 7, and 9 bamboo plus red dragons.",
  };

  function cleanText(value) {
    if (!value) return "";
    return String(value)
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function genericDesc(f) {
    return f.fan === 0
      ? `Table rule entry for ${f.nameEn || f.id}.`
      : `English description pending for ${f.nameEn || f.id}.`;
  }

  const nameMap = new Map();
  FANS_DATA.forEach(f => nameMap.set(f.name, f.nameEn || f.name));

  const englishFans = FANS_DATA.map(f => {
    const name = f.nameEn || f.name;
    const examples = (f.examples || []).map((ex, i) => ({
      ...ex,
      label: ex.label && /^[\x00-\x7F\s\-()/]+$/.test(ex.label) ? ex.label : `Example ${i + 1}`,
    }));

    return {
      ...f,
      name,
      nameZh: f.name,   // 保留中文原名：/api/fan-stats 以中文名回传，英文页据此匹配统计
      nameAlt: (f.nameAlt || []).filter(x => /^[\x00-\x7F\s\-()/]+$/.test(x)),
      desc: descOverrides[f.id] || genericDesc({ ...f, nameEn: name }),
      conditions: f.meldAllowed === false ? "Closed hand required unless the specific rule text says otherwise." : "",
      excludes: (f.excludes || []).map(x => nameMap.get(x) || x).filter(x => /^[\x00-\x7F\s\-()/]+$/.test(x)),
      handTypes: (f.handTypes || []).map(x => handTypeMap[x] || x),
      tags: (f.tags || []).map(x => tagMap[x] || x),
      source: sourceMap[f.source] || f.source || "",
      notes: "",
      tips: "",
      examples,
    };
  });

  FANS_DATA.splice(0, FANS_DATA.length, ...englishFans);
  FAN_TIERS.splice(0, FAN_TIERS.length, ...FAN_TIERS.map(t => ({ ...t, label: tierLabelMap[t.label] || t.label })));
  ALL_TAGS.splice(0, ALL_TAGS.length, ...ALL_TAGS.map(t => tagMap[t] || t));
})();
