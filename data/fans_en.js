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
    si_an_ke: "Four concealed triplets or kongs plus a pair.",
    qi_dui_zi: "Seven pairs. Four identical tiles may be treated as two pairs under this ruleset.",
    qing_yi_se: "A legal winning hand made entirely from one numbered suit.",
    hun_yi_se: "A legal winning hand made from one numbered suit plus honor tiles.",
    peng_peng_he: "Four triplets or kongs plus a pair.",
    ping_he: "Four chows and a non-honor pair.",
    duan_yao: "A hand with no terminals and no honor tiles.",
    men_qian_qing: "A hand with no chii, pon, or open kong. Concealed kongs do not break it.",
    bu_qiu_ren: "A closed hand won by self-draw.",
    fei_men_qing_zi_mo: "An open hand won by self-draw.",
    bao_pai: "Each dora tile adds fan but does not count as a yaku by itself.",
  };

  function cleanText(value) {
    if (!value) return "";
    return String(value)
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function genericDesc(f) {
    if (f.fan === 0) return `Table rule entry for ${f.nameEn || f.id}.`;
    return `${f.nameEn || f.id} is worth ${f.fan} fan. Use the example tiles to check the shape and combine it with other compatible patterns.`;
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
