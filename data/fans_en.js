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
    shi_san_yao: "East, South, West, North, Red, Green, and White, plus the 1 and 9 of characters, bamboo, and dots as a 13-tile shape, with one extra copy of any one of those tiles as the pair.",
    da_si_xi: "Triplets of each of the four wind tiles: East, South, West, and North, plus any pair.",
    da_san_yuan: "Triplets of each of the three dragon tiles: Red, Green, and White, plus any one meld and any pair.",
    lv_yi_se: "A legal four-meld-and-a-pair winning hand made from 2, 3, 4, 6, and 8 bamboo and Green dragons. It may also appear as Seven Pairs, Dragon Seven Pairs, or Luxury Seven Pairs.",
    jiu_lian_bao_deng: "1112345678999 in one suit, plus any one extra tile of that same suit.",
    si_gang_zi: "Four kongs plus a single wait on the final pair. The kongs may be open or concealed.",
    lian_qi_dui: "Seven consecutive pairs of numbered tiles in the same suit.",
    si_an_ke_dan_qi: "Four concealed triplets plus a single wait on the final pair. In MCR this is counted only as Four Concealed Pungs and Single Tile Wait. In some source rules, Riichi Four Concealed Pungs on a single wait counts as double yakuman.",
    da_qi_xing: "An All Honors Seven Pairs hand: two each of East, South, West, North, Red, Green, and White. All seven honor types must be present.",
    tian_he: "The dealer's initial 14-tile hand directly satisfies the winning condition.",
    di_he: "A non-dealer's initial 13-tile hand is in tenpai, and they win by self-draw on the first turn with no calls made.",
    ren_he: "A non-dealer's initial 13-tile hand is in tenpai, and they win on the dealer's first discard.",
    qing_yao_jiu: "A four-meld-and-a-pair or Seven Pairs winning hand made entirely of terminal tiles.",
    zi_yi_se: "A four-meld-and-a-pair or Seven Pairs winning hand made entirely of honor tiles, meaning wind tiles and dragon tiles.",
    xiao_si_xi: "Three wind triplets plus one wind pair, together with any one legal meld.",
    xiao_san_yuan: "Two dragon triplets plus one dragon pair, together with any two legal melds.",
    si_an_ke: "Four concealed triplets plus a pair.",
    yi_se_shuang_long_hui: "In one suit: 123, 123, 55, 789, and 789.",
    yi_se_si_tong_shun: "Four completely identical sequences in the same suit.",
    yi_se_si_jie_gao: "Four same-suit triplets whose numbers increase successively by one, plus any pair.",
    san_an_gang: "Three concealed kongs; this necessarily also includes Three Kongs and Three Concealed Pungs, for a total of 48 points.",
    liu_ju_man_guan: "At an exhaustive draw, all of your discards are terminals or honors, and none of your discards has been called for chii, pon, or kan. Because winning is relatively easy in this ruleset and the penalty for opening the hand is practically meaningless, this is extremely difficult to achieve and is therefore promoted to sanbaiman.",
    shi_shang_san_nian: "After declaring Double Riichi, win by Last Draw or Last Tile Claim.",
    ming_pai_li_zhi: "Reveal the entire hand when declaring riichi. Dealing into Open Riichi while not in riichi counts as yakuman.",
    yi_se_si_bu_gao: "Four same-suit sequences whose numbers increase successively by one or two, plus a pair.",
    san_gang_zi: "The winning hand contains three kongs, whether open or concealed.",
    hun_yao_jiu: "The winning hand contains only terminal tiles and honor tiles, meaning all tiles are terminal-or-honor tiles, with no other numbered tiles.",
    yue_jian_hua_kai: "The tile drawn for Kong Win is exactly the last drawable tile of the hand.",
    gang_zhen: "Win on the tile discarded by another player after they drew the last drawable tile as a kong replacement tile.",
    er_bei_kou: "With a closed hand, there are two sets of completely identical sequences, meaning two Pure Double Chows.",
    qi_dui_zi: "A winning hand made of seven pairs; four identical tiles are allowed and are treated as two pairs.",
    qi_xing_bu_kao: "Seven single honor tiles, East, South, West, North, Red, Green, and White, plus seven numbered tiles selected from the 147, 258, and 369 groups in the three suits without shifting suits.",
    quan_shuang_ke: "An All Pungs hand made entirely from even-numbered tiles: 2, 4, 6, and 8.",
    qing_yi_se: "A winning hand made from numbered tiles of exactly one suit, either four melds and a pair or Seven Pairs.",
    yi_se_san_tong_shun: "Three completely identical sequences in the same suit.",
    yi_se_san_jie_gao: "Three same-suit triplets whose numbers increase successively by one.",
    quan_da: "A winning hand made entirely from numbered tiles 7, 8, and 9.",
    quan_zhong: "A winning hand made entirely from numbered tiles 4, 5, and 6.",
    quan_xiao: "A winning hand made entirely from numbered tiles 1, 2, and 3.",
    chun_quan_dai_yao_jiu: "In a four-meld-and-a-pair winning hand, every meld and the pair contains a terminal tile.",
    qing_long: "The full 1 through 9 run in one suit, meaning one each of 123, 456, and 789.",
    san_se_shuang_long_hui: "Two suits each contain one terminal-sequence pair, 123 plus 789, and the 5 of the third suit is used as the pair.",
    yi_se_san_bu_gao: "Three same-suit sequences whose numbers increase successively by one or two, such as 123+234+345 or 123+345+567.",
    quan_dai_wu: "Every meld and the pair contains a numbered 5 tile.",
    san_tong_ke: "One triplet, or kong, of the same number in each of the three suits.",
    san_an_ke: "Three concealed triplets, meaning three triplets drawn by yourself.",
    er_li_zhi: "On the first turn with no calls made, draw a tile, reach tenpai, and declare riichi.",
    quan_bu_kao: "Numbered tiles from the 147, 258, and 369 groups in the three suits without shifting suits, plus any 14 of East, South, West, North, Red, Green, and White.",
    zu_he_long: "The 147, 258, and 369 groups across the three suits form a special sequence, without shifting suits, together with one meld and one pair.",
    da_yu_wu: "A winning hand made of sequences, triplets, and the pair using numbers 6 through 9.",
    xiao_yu_wu: "A winning hand made of sequences, triplets, and the pair using numbers 1 through 4.",
    san_feng_ke: "Three triplets, or kongs, of wind tiles.",
    hua_long: "Three sequences in three different suits connect to form the complete numbered run from 1 to 9, such as 123 characters + 456 bamboo + 789 dots.",
    tui_bu_dao: "A four-meld-and-a-pair or Seven Pairs hand made from tiles whose face patterns have no up-down distinction. This includes 1, 2, 3, 4, 5, 8, and 9 dots; 2, 4, 5, 6, 8, and 9 bamboo; and White dragons.",
    san_se_san_tong_shun: "One sequence of the same numbers in each of the three suits.",
    san_se_san_jie_gao: "One triplet in each of the three suits, with the numbers increasing successively by one.",
    wu_fan_he: "A winning hand that has no scoring pattern other than Chicken Hand.",
    miao_shou_hui_chun: "Win by self-drawing the last tile that can be drawn.",
    hai_di_lao_yue: "Win on another player's discard of the last tile of the hand, not by self-draw.",
    gang_shang_kai_hua: "After declaring a kong, win by self-drawing the replacement tile from the dead wall.",
    qiang_gang_he: "Win on the tile another player adds to make an open kong; Thirteen Orphans may rob a concealed kong, but other hands may not.",
    gang_shang_kai_chong: "Win on the tile another player discards after declaring a kong.",
    shuang_an_gang: "Two concealed kongs. Counted as a house-rule pattern here; in MCR it is 6 points.",
    hun_yi_se: "A winning hand made from numbered tiles of one suit plus honor tiles.",
    san_se_san_bu_gao: "One sequence in each of the three suits, with the numbers increasing successively by one, such as 234 characters + 345 bamboo + 456 dots.",
    wu_men_qi: "The winning hand contains all five tile groups: the three numbered suits, wind tiles, and dragon tiles.",
    quan_qiu_ren: "Win entirely by chii and pon calls, then win on another player's discard with a single wait, meaning four open melds and a single wait.",
    ming_an_gang: "One concealed kong plus one open kong. Counted as a house-rule pattern here; in MCR it is either not counted or counted as 5 points by common rules.",
    shuang_jian_ke: "Two triplets, or kongs, of dragon tiles: Red, Green, and White.",
    quan_dai_yao: "In the winning hand, every meld and the pair contains a terminal tile, meaning 1 or 9, or an honor tile.",
    shuang_ming_gang: "Two open kongs.",
    he_jue_zhang: "Win on a tile for which three copies have already appeared in exposed melds and discard pools, meaning the last remaining copy on the table.",
    jian_ke: "A triplet or kong of dragon tiles: Red, Green, and White.",
    quan_feng_ke: "A triplet or kong of the wind tile corresponding to the current round wind, also called the prevailing wind. For example, in the South round, the round wind is South.",
    men_feng_ke: "A triplet or kong of the wind tile corresponding to your own seat wind. For example, the player opposite the dealer is West.",
    peng_peng_he: "A winning hand made of four triplets, or kongs, plus a pair.",
    ping_he: "Four sequences plus a non-honor pair, regardless of the wait shape.",
    si_gui_yi: "All four copies of one tile appear in the winning hand without being used as a kong, such as a triplet of 1 characters plus a sequence containing 1 characters.",
    shuang_tong_ke: "Two triplets, or kongs, of the same number in two different suits.",
    shuang_an_ke: "Two concealed triplets.",
    an_gang: "Four identical tiles drawn into your own hand and declared as a concealed kong.",
    duan_yao: "The hand contains no terminal tiles, meaning 1s and 9s, and no honor tiles.",
    li_zhi: "With a closed hand, rotate this discard sideways and declare riichi after reaching tenpai. If no one wins on the riichi declaration tile, pay a 1000-point stick to the riichi-stick area. After that, you may only draw and discard the drawn tile, and may not change the wait; a concealed kong is allowed only if it does not change the wait. The discard furiten and missed-win furiten rules apply: if your winning range after riichi includes one of your own discards, or if you pass on another player's discard after declaring riichi, you may not win on any other player's tile and may only win by self-draw. Riichi sticks go to the winner of the hand; if you win, you take your own riichi stick back. If the hand ends in exhaustive draw, the riichi sticks return to the bank.",
    yi_fa: "After declaring riichi, win within one turn, including your next draw after the riichi declaration, with no calls made.",
    yi_ban_gao: "Two completely identical sequences in the same suit.",
    xi_xiang_feng: "Two sequences of the same numbers in different suits.",
    lian_liu: "Six adjacent numbered tiles in the same suit; triplet forms are allowed, such as the Short Straight in 222 characters, 333 characters, 456 characters, 777 characters, and Red.",
    lao_shao_fu: "The 123 and 789 sequences in the same suit.",
    yao_jiu_ke: "A triplet or kong of terminal tiles, meaning numbered 1s or 9s.",
    ming_gang: "One open kong.",
    que_yi_men: "The hand is missing one of the three numbered suits.",
    wu_zi: "No honor tiles, meaning no wind tiles or dragon tiles.",
    ting_dan_zhang: "A tenpai shape with only one winning tile, because of an edge wait, closed wait, or single wait for the pair.",
    men_qian_qing: "No calls have been made, meaning no chii, pon, or open kong; concealed kongs are allowed.",
    bu_qiu_ren: "Win by self-draw with a closed hand. This may combine with Closed Hand.",
    fei_men_qing_zi_mo: "Win by self-draw with an open hand, meaning after calls or exposed melds.",
    hua_pai: "Each flower tile revealed during flower replacement adds 1 point.",
    bao_pai: "After winning by riichi, reveal ura-dora indicators; or count the normal visible dora indicators during play; or count red dora tiles in the hand. Each dora tile in the hand adds 2 points. Dora are not yaku and therefore do not count as the minimum winning requirement.",
    jiu_pai: "On the first draw, if no one has called before then and your hand has nine types, not nine copies, of terminal-or-honor tiles, meaning the orphan tiles needed for Thirteen Orphans, you may reveal the hand and redeal the hand. The dealer does not pass, it does not count as dealer continuation, and it is equivalent to a redeal.",
    si_feng: "If all four players discard the same wind tile on the first uninterrupted turn with no calls, redeal the hand. The dealer does not pass, it does not count as dealer continuation, and it is equivalent to a redeal.",
    si_gang: "When more than one player has declared kongs, the fourth kong is declared: the kong is made, the replacement tile is drawn, the fifth dora indicator is revealed, and if no one wins on the kong declarer's discard, the hand aborts by Four Kongs and is redealt. The dealer does not pass, it does not count as dealer continuation, and it is equivalent to a redeal.",
    huang_pai: "After the last drawable tile is drawn and the player's discard is made, if no one wins, the hand ends in exhaustive draw. At that time, players not in tenpai must pay noten penalties to players in tenpai, even if they have no yaku and are only in shape-tenpai. With one player in tenpai, that player collects 1000 points from each other player. With two players in tenpai, each tenpai player collects 1500 points from a different noten player. With three players in tenpai, each player collects 1000 points from the noten player. If everyone is in tenpai or everyone is not in tenpai, there is no penalty. If the dealer is not in tenpai, the dealer passes; if the dealer is in tenpai, the dealer continues and the honba count increases.",
    zha_hu: "False win: after claiming a win and revealing the hand, the hand is checked and found not to meet the winning conditions, such as an invalid win, winning by ron while in furiten, no yaku, or other situations where winning is not allowed. Depending on the situation, a minor mistake by a beginner may be taken back and play continues, with the revealed hand as the penalty; a repeat offender with a minor case may not win for the rest of the hand and may only chii, pon, or deal in as a nuisance; a malicious and serious case involving deception, concealment, or other attempts at unfair play is penalized by paying 8000 points to each of the three other players.",
    zha_li_zhi: "After exhaustive draw or after another player wins, all riichi players must undergo a riichi check. A player who was not in tenpai pays 4000 points to each of the other three players.",
    chu_qian: "Being caught cheating, or other conduct that violates the spirit of fair play. Goodbye.",
    zi_hua: "When replacing flowers, obtaining the flower tile corresponding to your own seat, Plum, Orchid, Chrysanthemum, or Bamboo, or Spring, Summer, Autumn, or Winter, gives an additional +1 point on top of the flower tile point.",
    zi_ji_jie: "When replacing flowers, obtaining the season tile corresponding to your own seat gives an additional +1 point on top of the flower tile point.",
    si_jun_zi: "One player collects all four flower tiles, Plum, Orchid, Chrysanthemum, and Bamboo, or all four seasons, and gains an additional +4 points on top of the four flower tile points.",
    ba_xian_guo_hai: "The same player replaces flowers 8 times or directly receives 8 flower tiles, then immediately reveals them and wins by self-draw for 64 points without needing a discard-play operation.",
    hua_he: "After replacing flowers 6 times, win by drawing the 7th flower, as an 8-point self-draw.",
    lan_yi_se: "A winning hand made from East, South, West, and North wind tiles, White dragons, and 8 dots.",
    hei_yi_se: "A winning hand made from triplets of 2, 4, and 8 dots and any East, South, West, and North wind tiles.",
    hong_yi_se: "A winning hand made from 1, 5, 7, and 9 bamboo and Red dragons.",
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
