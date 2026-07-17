// Beginner guide content data
// block types:
//   p           — paragraph (text supports HTML)
//   h3          — subheading
//   ul          — unordered list (items array, supports HTML)
//   steps       — numbered step list (items array, supports HTML)
//   tile-suites — horizontal suit display (groups: [{label, tiles}], insert {break:true} to force a line break)
//   hand        — hand example box (label, tiles; use | in tiles to separate melds)
//   concept-grid— concept card grid (items: [{label, tiles, note}])
//   info        — blue info box (text supports HTML)
//   tip         — yellow tip box (text supports HTML)
//   collapse    — magenta collapsible box (collapsed by default; title is the heading, text supports HTML)
//   warning     — dark-red collapsible box (expanded by default; title is the heading, text supports HTML)
//   common-hands— common winning-hand grid (items: [{fan, name, desc, tiles}])
//
// tiles field format is the same as fans.js:
//   Numbered tiles: 1m-9m characters / 1p-9p dots / 1s-9s bamboo
//   Honor tiles: E=East S=South W=West N=North Z=Red F=Green B=White
//   X=tile back (concealed kong); | separates melds and renders as spacing

const INSTRUCTION_DATA = [

  // ── 0. Introduction to Mahjong ──────────────────────────────────────
  {
    id: 's0',
    title: '0. Introduction to Mahjong',
    blocks: [
      { type: 'warning', title: 'Notice', text: 'The rules introduced on this website, including the beginner guide below, are a mixed house-rule variant used by our group. These rules are intended only for mahjong played without material stakes. These rules and this website take no responsibility for any gambling behavior using these rules. This website firmly opposes all forms of gambling; <strong>gambling degenerates can go to hell</strong>.<br>Mahjong rules vary drastically by region. Please respect the house rules at the table and make sure any disputed rules are fully discussed before play begins.' },
      { type: 'collapse', title: 'House-rule details (all collapsed sections on this page are advanced knowledge and may be skipped by beginners)', text: 'In form, this variant combines the scoring patterns of MCR with the yaku of Riichi Mahjong, compresses them into a Riichi-style rules framework, converts a small number of Riichi yaku into the MCR point scale, and then converts points back into Riichi-style payment through a single point-to-score system, thereby avoiding the rule that self-draw payments are tripled. The game state under these mahjong rules lies between MCR and Riichi Mahjong, weakening and blending both MCR’s high-intensity attacking style and Riichi Mahjong’s excessive defensive tendency. This rule set leans toward semi-competitive mahjong, so it does not include wildcard rules, nor does it include winning shapes that obviously violate mahjong tile logic.' },
      { type: 'h3', text: 'Tile types and quantity' },
      { type: 'p', text: 'A standard mahjong set has <strong>136 tiles</strong>, excluding flower tiles, divided into numbered tiles, honor tiles, and flower tiles.' },

      { type: 'h3', text: 'Numbered tiles (108 total)' },
      { type: 'p', text: 'There are three suits. Each suit has numbers 1–9, four copies of each number, for 36 tiles per suit.'},
      { type: 'tip', text: 'Among the “five” tiles of each suit, one is a special <strong>red five</strong>, meaning three normal fives plus one red five. The full set contains three red fives; each additional red five in the winning hand adds one fan. See “Dora”.' },
      { type: 'tile-suites', groups: [
        { label: 'Characters', tiles: '1m 2m 3m 4m 5m 6m 7m 8m 9m' },
        { label: 'Dots / Circles', tiles: '1p 2p 3p 4p 5p 6p 7p 8p 9p' },
        { label: 'Bamboo / Sticks', tiles: '1s 2s 3s 4s 5s 6s 7s 8s 9s' },
        { break: true },
        { label: 'Red fives', tiles: '0m 0p 0s' },
      ]},
      { type: 'info', text: 'New players should note that the 1 bamboo has a special shape and is also called “sparrow”. It is not an honor tile and should be recognized separately.'},
      { type: 'p', text: 'Among them, <strong>1 and 9</strong> are called <strong>terminal tiles</strong>. In MCR rules, many special scoring patterns are related to them.<br>Examples include “All Simples”, “Terminals in All Sets”, “Pure Terminals in All Sets”, “All Terminals and Honors”, “All Terminals”, and “Thirteen Orphans”.' },

      { type: 'h3', text: 'Honor tiles (28 total)' },
      { type: 'p', text: 'Honor tiles have no numerical order. They are divided into <strong>wind tiles</strong> and <strong>dragon tiles</strong>, also called arrow tiles, with four copies of each type.' },
      { type: 'tile-suites', groups: [
        { label: 'Wind tiles (East, South, West, North)', tiles: 'E S W N' },
        { label: 'Dragon tiles (White, Green, Red)', tiles: 'B F Z' },
      ]},
      { type: 'tip', text: 'Honor tiles have no sequence order and <strong>cannot form sequences</strong>. They can only form triplets or kongs through pon/kan. A triplet of dragon tiles, Red, Green, or White, additionally scores “Dragon Pung” (2 fan).' },

      { type: 'h3', text: 'Flower tiles (8 total)' },
      { type: 'info', text: 'This variant does not include flower tiles; they are introduced here only as basic background.' },
      { type: 'p', text: 'Flower tiles, Plum/Orchid/Chrysanthemum/Bamboo and Spring/Summer/Autumn/Winter, <strong>do not participate in forming melds</strong>. When drawn, they are immediately revealed and replaced by drawing one tile from the dead wall. Each flower tile usually scores 1 fan.' },

      { type: 'h3', text: 'Basic concepts: sequence, triplet, meld, and pair' },
      { type: 'info', text: 'Melds, sequences, and triplets are core concepts in mahjong rules everywhere, and they are related to chii, pon, kan, and winning. They are introduced here and should be memorized.' },
      { type: 'ul', items: [
        '<strong>Sequence</strong>: three consecutive numbered tiles of the same suit form one sequence.',
        '<strong>Triplet</strong>: three identical tiles form one triplet.<details><summary>“Kan”</summary>A “kan” is treated as a special triplet. Although it consists of four tiles, it is still treated as one three-tile triplet in order to keep the hand size consistent. In other words, the four tiles used in a declared kan cannot also participate in forming other sequences. See “3. Chii, Pon, and Kan”.</details>',
        '<strong>Meld</strong>: sequence and triplet are collectively called melds, and they may be regarded as the basic building blocks of making a mahjong hand.',
        '<strong>Pair</strong>: two identical tiles. It is a required part of most winning hand shapes.',
      ]},
      { type: 'info', text: 'Note that numbered tiles can form sequences, triplets, and pairs, while honor tiles can only form triplets and pairs.' },
    ],
  },

  // ── 1. Game setup ──────────────────────────────────────
  {
    id: 's1',
    title: '1. Game Setup',
    blocks: [
      { type: 'h3', text: 'Players and seats' },
      { type: 'p', text: 'Standard mahjong is a <strong>4-player</strong> game. After the initial dealer is determined by rolling dice, drawing wind tiles, or another method, that player is assigned <strong>East</strong>. The other three players are South, West, and North in counterclockwise order. Seat order may be determined by the dealer rolling dice, or simply by mutual agreement.' },

      { type: 'h3', text: 'Round wind and seat wind' },
      { type: 'ul', items: [
        '<strong>Round wind</strong>: the wind direction shared by the whole table for the current round. If the round wind is East, it is the East round. In a hanchan, the round proceeds from East round → South round.',
        '<strong>Seat wind</strong>: each player’s own seat wind. The dealer is East; the next player, clockwise, is South; and so on.',
        'If the round wind tile or seat wind tile forms a triplet, it scores extra fan, 2 fan each. See “Prevalent Wind Pung” and “Seat Wind Pung”.',
      ]},

      { type: 'collapse', title: 'About round-wind rotation', text: 'In four-player hanchan mahjong, if the starting score is 25,000 points and, at the end of South 4, no player has been eliminated and no player has exceeded 30,000 points, the game enters the West round, called west continuation. At that point, the game ends if any player is eliminated or if any player wins a hand and exceeds 30,000 points. The same applies to south continuation after an East-only game. After south continuation or west continuation ends, the game does not continue further into west continuation or north continuation; it ends according to the current scores.'},

      { type: 'h3', text: 'Dealing tiles' },
      { type: 'ul', items: [
        '<strong>Building the wall</strong>: after shuffling, each player takes 34 tiles, arranged as 17 stacks of 2 tiles, face down in front of themselves as the “wall”.',
        '<strong>Rolling dice</strong>: the dealer rolls dice to determine where the wall is opened.<details><summary>(Details)</summary>If the roll is 5, count counterclockwise starting from the dealer as 1 until 5, which returns to the dealer, called player A. Then player A counts 5 stacks from left to right in the wall in front of themselves, meaning 5×2 tiles, and separates the 5th and 6th stacks. The 6th stack becomes the head of the wall, and the 5th stack becomes the tail of the wall. Counting backward from the wall tail, the last 7 stacks, 14 tiles in total, form the dead wall. The tiles before the dead wall are called the live wall ending, or “haitei”, meaning the final tile drawn in normal order.</details>',
        '<strong>Drawing the starting hand</strong>: each player draws <strong>13 tiles</strong> from the head of the wall in clockwise order to form the starting hand. The dealer draws one extra tile.<details><summary>(Details)</summary>The drawing order is East, South, West, North. Each player draws 4 tiles for 3 rounds; then the dealer draws one tile, skips 3 tiles and draws one more, and the non-dealers each draw one tile in order. The dealer has 14 tiles and discards first directly. If the dealer wins by Heavenly Hand self-draw, they may choose any one of those 14 tiles as their self-drawn tile; therefore Heavenly Hand Thirteen Orphans must be a thirteen-sided wait, and Four Concealed Pungs must be a single wait.</details>',
        '<strong>Separating the wall</strong>: the dealer separates the dead wall from the live wall and confirms the dora indicator.<details><summary>(Dead wall details)</summary>The dead wall is the final 7 stacks, 14 tiles, at the tail of the wall. From a top-down view of the wall tail: the 2 stacks on the left are the replacement tiles drawn after a kan, and the top tiles of the 5 stacks on the right are the visible dora indicators. After a riichi win, the corresponding ura-dora indicators below them are also revealed. See “3. Chii, Pon, and Kan” for kan and riichi rules. After declaring a kan, the hand is short by 1 tile, so one replacement tile is drawn from the dead wall. Then the first dora indicator is revealed.<br>Note that the dead wall must remain at 14 tiles; therefore, after drawing a replacement tile from the dead wall for a kan, one tile must be taken from the live wall ending to keep the dead wall tile count unchanged.</details>',
        '<strong>Winning and dealer continuation</strong>: if a hand satisfies the winning condition, see “4. Winning”, it may win. If the dealer does not win, the dealer passes, and the next player becomes dealer. If the dealer wins, dealer continuation occurs and the dealer position remains unchanged.<details><summary>(Dealer continuation and exhaustive draw)</summary>The above does not consider exhaustive draws. In an exhaustive draw, if the dealer is not in tenpai, the dealer passes; if the dealer is in tenpai, the dealer continues.<br>Dealer continuation: for example, the first dealer continuation in East 2 is called East 2, one honba. “Honba” and “dealer continuation” are both related to the Japanese term “renchan”. The dealer should place a 100-point stick in their open-meld area as a marker. If the m-th hand has continued n times, it is called East/South m, n honba, indicated by n 100-point sticks. At this time, when any player wins, each player pays an additional n×100 points on self-draw, or the discarder pays an additional 3×n×100 points on ron. See “Draws” for whether other drawn hands increase the honba count and whether the dealer passes.</details>',

      ]},
    ],
  },

  // ── 2. Game flow ──────────────────────────────────────
  {
    id: 's2',
    title: '2. Game Flow',
    blocks: [
      { type: 'steps', items: [
        '<strong>Draw</strong>: on your turn, draw one tile from the head of the wall and add it to your hand, making your hand 14 tiles.',
        '<strong>Check</strong>: check whether the 14 tiles form a legal winning hand. If they do, win by self-draw. See “4. Winning”.',
        '<strong>Discard</strong>: if you cannot win, choose one tile to discard, bringing the hand back to 13 tiles. Discarded tiles are placed in order in your own discard pool. At this moment, other players may chii, pon, kan, or win on that tile.',
        '<strong>Responses by other players</strong>: another player’s discarded tile may be used for <strong>chii/pon/kan</strong>, see the next section, or for <strong>winning</strong>, see “4. Winning”.',
        '<strong>Drawn hand</strong>: if the final live-wall tile has been drawn and discarded and no one wins, or if another draw condition is met, the hand is drawn and restarted.',
      ]},
      { type: 'info', text: 'The order is clockwise: dealer discards first → next player, clockwise, draws → repeat. Pon and kan interrupt the normal order. After calling an open meld, the caller must discard again, and then play continues from their next player. Make sure to clearly call out chii, pon, or kan so that no one draws a tile that does not belong to them.' },
    ],
  },

  // ── 3. Chii, Pon, and Kan ────────────────────────────────────────
  {
    id: 's3',
    title: '3. Chii, Pon, and Kan',
    blocks: [
      { type: 'p', text: 'Using <strong>tiles discarded by other players</strong> to complete melds is called <strong>calling an open meld</strong>. Open melds must be placed face up in front of you. They are no longer part of the concealed hand, but they still count toward the winning hand.' },

      { type: 'h3', text: 'Chii (only from the previous player)' },
      { type: 'p', text: 'Only a tile discarded by the <strong>previous player</strong>, the player before you in clockwise order, may be called for chii. Take two numbered tiles from your hand and combine them with the previous player’s discarded tile to form a <strong>sequence</strong>, then discard one tile.' },
      // A sideways tile placed on the far left (> prefix) indicates that it came from the previous player, who sits to your left
      { type: 'hand', label: 'Example: you have 2 characters and 4 characters; the previous player discards 3 characters → chii to form the 234 characters sequence', tiles: '>3m 2m 4m' },

      { type: 'h3', text: 'Pon (from any player)' },
      { type: 'p', text: 'A tile discarded by <strong>any player</strong> may be called for pon. Take two identical tiles from your hand and combine them with the discarded tile to form a <strong>triplet</strong>, then discard one tile. Pon has <strong>higher priority than chii</strong> and can interrupt the turn order.' },
      // When pon is called from the opposite player, the sideways tile is in the middle (E >E E); when called from the next player, the sideways tile is on the right (E E >E)
      { type: 'hand', label: 'Example: you have East East; the opposite player discards East → pon to form the East East East triplet', tiles: 'E >E E' },

      { type: 'h3', text: 'Kan (from any source)' },
      { type: 'p', text: 'When you collect 4 completely identical tiles, you may declare kan, forming a <strong>kong</strong>, which is treated as a special triplet. After a kan, you must draw one replacement tile from the <strong>dead wall</strong>, the end of the wall. If you do not win by self-draw, reveal the next dora indicator, then discard one tile. Kan has the highest priority. Each kan additionally reveals one visible dora indicator.' },
      { type: 'concept-grid', items: [
        { label: 'Open Kan', tiles: '5p 0p >5p 5p', note: 'You have three copies in your hand, and another player discards the fourth copy, allowing you to kan. The example shows an open kan from the opposite player; either the second or third tile may be turned sideways. To avoid a “slow/fast blade” situation where “win” is earlier than “kan”, declaring an open kan on another player’s tile at the same time as a win does not count as robbing a kan.' },
        { label: 'Added Kan', tiles: '3s 3s >3s >3s', note: 'After you have already called pon to form a triplet, you self-draw the fourth copy and add it as a kan. This is treated as a type of open kan. The added tile should be placed sideways and stacked above or below the tile that was originally turned sideways. In this example, you first pon from the next player, then add kan later.' },
        { label: 'Concealed Kan', tiles: 'X 9m 9m X',   note: 'You self-draw all four copies into your hand without needing another player’s discard. After showing all four identical tiles to everyone, turn either the two middle tiles or the two side tiles face down. This is treated as a concealed kan. A concealed kan does not break a closed hand. Only Thirteen Orphans may rob a concealed kan.' },
      ]},
      { type: 'tip', text: 'Although a kong has four tiles, it is regarded as a special triplet, meaning it is still treated as three tiles.<br>After each kan, the hand is short by one tile, because a meld has become a kong. But after drawing a replacement tile from the dead wall and then discarding one tile, the standing hand still remains at 13 tiles overall. The winning tile, whether drawn or discarded by another player, brings the total back to 14 tiles and makes winning possible.' },

      { type: 'h3', text: 'Riichi' },
      { type: 'tip', text: 'Riichi comes from Japanese mahjong. Unlike chii, pon, and kan, it is not a key component of mahjong in every region. However, its rules are important in this variant, so they are explained here.' },
      { type: 'p', text: 'Riichi is essentially a declaration of ready hand, or “declared tenpai”. See “Tenpai”.<br>A player completes the riichi declaration by turning the discarded tile sideways and placing a 1000-point stick on the table.' },
      { type: 'tip', text: '<strong>Benefits and costs of riichi</strong><br>After riichi, if you do not win, you may only draw and discard the tile you draw, except for a concealed kan that does not change the wait. You may no longer change your hand shape. Also, after riichi, you cannot win on your own discards or on tiles discarded by other players after your riichi if they put you in furiten; see “Riichi furiten and defensive methods” below. If someone else wins, the riichi stick placed on the table belongs to the winner.<br>As a benefit, winning after riichi immediately gives 2 fan, unlocks more riichi-related hand patterns, and grants the right to reveal ura-dora indicators. See “Dora and dora indicators” below.'},
      
      { type: 'p', text: '<br><strong>Riichi furiten and defensive methods</strong>' },
      { type: 'ul', items: [
        '<strong>Discard furiten</strong>: if the tiles waited on by a riichi player include any tile that player previously discarded, including tiles that other players called away with chii or pon, the player enters discard furiten.<br><strong>Example</strong>: a riichi player is waiting on 1 character and 4 characters. If that player discarded a 1 character earlier, then even if someone else now discards 1 character or 4 characters, the player cannot win and must wait for self-draw.',
        '<strong>Riichi furiten</strong>: if a player, called player A here, has declared riichi and another player discards a tile within A’s winning range, but A does not win, then from that point on player A may only win by self-draw.',
        '<strong>Defensive method</strong>: in summary, after a player declares riichi, that player’s own discard pool and all other players’ discard pools after the riichi declaration are safe tiles']},
      { type: 'collapse', title: 'Dora and dora indicators', text: '“Dora” is a special fan. Each dora tile counts as 2 fan in this rule set. However, note that the 2 fan from dora do not count toward the minimum winning requirement, meaning dora are not yaku.<br>First, the three <strong>red fives</strong> are naturally dora. Apart from red fives, dora in the game are determined by <strong>dora indicators</strong> according to the following rules.<div style="margin-top:10px;"><div style="font-size:.78em;font-weight:600;color:var(--text-muted);margin-bottom:4px;">Indicator → dora correspondence (numbered tiles: next tile in sequence; 9 loops back to 1)</div><div style="display:grid;grid-template-columns:2.2em repeat(9,auto);gap:2px;align-items:center;margin-bottom:6px;"><span style="font-size:.7em;color:var(--text-muted);">Characters</span><img class="tile-sm" src="img/tiles/1m.svg" alt="1 character"><img class="tile-sm" src="img/tiles/2m.svg" alt="2 characters"><img class="tile-sm" src="img/tiles/3m.svg" alt="3 characters"><img class="tile-sm" src="img/tiles/4m.svg" alt="4 characters"><img class="tile-sm" src="img/tiles/5m.svg" alt="5 characters"><img class="tile-sm" src="img/tiles/6m.svg" alt="6 characters"><img class="tile-sm" src="img/tiles/7m.svg" alt="7 characters"><img class="tile-sm" src="img/tiles/8m.svg" alt="8 characters"><img class="tile-sm" src="img/tiles/9m.svg" alt="9 characters"><span></span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span></span><img class="tile-sm" src="img/tiles/2m.svg" alt="2 characters"><img class="tile-sm" src="img/tiles/3m.svg" alt="3 characters"><img class="tile-sm" src="img/tiles/4m.svg" alt="4 characters"><img class="tile-sm" src="img/tiles/5m.svg" alt="5 characters"><img class="tile-sm" src="img/tiles/6m.svg" alt="6 characters"><img class="tile-sm" src="img/tiles/7m.svg" alt="7 characters"><img class="tile-sm" src="img/tiles/8m.svg" alt="8 characters"><img class="tile-sm" src="img/tiles/9m.svg" alt="9 characters"><img class="tile-sm" src="img/tiles/1m.svg" alt="1 character" style="outline:2px solid var(--accent);border-radius:3px;"></div><div style="display:grid;grid-template-columns:2.2em repeat(9,auto);gap:2px;align-items:center;margin-bottom:6px;"><span style="font-size:.7em;color:var(--text-muted);">Dots</span><img class="tile-sm" src="img/tiles/1p.svg" alt="1 dot"><img class="tile-sm" src="img/tiles/2p.svg" alt="2 dots"><img class="tile-sm" src="img/tiles/3p.svg" alt="3 dots"><img class="tile-sm" src="img/tiles/4p.svg" alt="4 dots"><img class="tile-sm" src="img/tiles/5p.svg" alt="5 dots"><img class="tile-sm" src="img/tiles/6p.svg" alt="6 dots"><img class="tile-sm" src="img/tiles/7p.svg" alt="7 dots"><img class="tile-sm" src="img/tiles/8p.svg" alt="8 dots"><img class="tile-sm" src="img/tiles/9p.svg" alt="9 dots"><span></span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span></span><img class="tile-sm" src="img/tiles/2p.svg" alt="2 dots"><img class="tile-sm" src="img/tiles/3p.svg" alt="3 dots"><img class="tile-sm" src="img/tiles/4p.svg" alt="4 dots"><img class="tile-sm" src="img/tiles/5p.svg" alt="5 dots"><img class="tile-sm" src="img/tiles/6p.svg" alt="6 dots"><img class="tile-sm" src="img/tiles/7p.svg" alt="7 dots"><img class="tile-sm" src="img/tiles/8p.svg" alt="8 dots"><img class="tile-sm" src="img/tiles/9p.svg" alt="9 dots"><img class="tile-sm" src="img/tiles/1p.svg" alt="1 dot" style="outline:2px solid var(--accent);border-radius:3px;"></div><div style="display:grid;grid-template-columns:2.2em repeat(9,auto);gap:2px;align-items:center;margin-bottom:12px;"><span style="font-size:.7em;color:var(--text-muted);">Bamboo</span><img class="tile-sm" src="img/tiles/1s.svg" alt="1 bamboo"><img class="tile-sm" src="img/tiles/2s.svg" alt="2 bamboo"><img class="tile-sm" src="img/tiles/3s.svg" alt="3 bamboo"><img class="tile-sm" src="img/tiles/4s.svg" alt="4 bamboo"><img class="tile-sm" src="img/tiles/5s.svg" alt="5 bamboo"><img class="tile-sm" src="img/tiles/6s.svg" alt="6 bamboo"><img class="tile-sm" src="img/tiles/7s.svg" alt="7 bamboo"><img class="tile-sm" src="img/tiles/8s.svg" alt="8 bamboo"><img class="tile-sm" src="img/tiles/9s.svg" alt="9 bamboo"><span></span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span style="display:block;text-align:center;">↓</span><span></span><img class="tile-sm" src="img/tiles/2s.svg" alt="2 bamboo"><img class="tile-sm" src="img/tiles/3s.svg" alt="3 bamboo"><img class="tile-sm" src="img/tiles/4s.svg" alt="4 bamboo"><img class="tile-sm" src="img/tiles/5s.svg" alt="5 bamboo"><img class="tile-sm" src="img/tiles/6s.svg" alt="6 bamboo"><img class="tile-sm" src="img/tiles/7s.svg" alt="7 bamboo"><img class="tile-sm" src="img/tiles/8s.svg" alt="8 bamboo"><img class="tile-sm" src="img/tiles/9s.svg" alt="9 bamboo"><img class="tile-sm" src="img/tiles/1s.svg" alt="1 bamboo" style="outline:2px solid var(--accent);border-radius:3px;"></div><div style="font-size:.78em;font-weight:600;color:var(--text-muted);margin-bottom:4px;">Honor tiles (each loops within its own cycle)</div><div style="display:flex;align-items:center;gap:4px;margin-bottom:6px;flex-wrap:wrap;"><span style="font-size:.72em;color:var(--text-muted);min-width:2.4em;">Winds</span><img class="tile-sm" src="img/tiles/E.svg" alt="East"><span>→</span><img class="tile-sm" src="img/tiles/S.svg" alt="South"><span>→</span><img class="tile-sm" src="img/tiles/W.svg" alt="West"><span>→</span><img class="tile-sm" src="img/tiles/N.svg" alt="North"><span>→</span><img class="tile-sm" src="img/tiles/E.svg" alt="East" style="opacity:.4;outline:2px solid var(--accent);border-radius:3px;"></div><div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;"><span style="font-size:.72em;color:var(--text-muted);min-width:2.4em;">Dragons</span><img class="tile-sm" src="img/tiles/B.svg" alt="White"><span>→</span><img class="tile-sm" src="img/tiles/F.svg" alt="Green"><span>→</span><img class="tile-sm" src="img/tiles/Z.svg" alt="Red"><span>→</span><img class="tile-sm" src="img/tiles/B.svg" alt="White" style="opacity:.4;outline:2px solid var(--accent);border-radius:3px;"></div></div><br>Note that multiple dora indicators may be revealed in one hand, see “Kan”, so multiple kinds of dora may also exist. If multiple identical dora indicators are revealed, the same dora tile may count multiple times. For example, if m copies of <strong>3 characters</strong> are revealed as dora indicators, then each <strong>4 characters</strong> in the winning hand may count as m×2 fan.<br>The tiles below the visible dora indicators, of which there are n+1 after n kans, are the ura-dora indicators. After winning with riichi, ura-dora indicators may be revealed, directly doubling the number of dora-indicator types available.' },
    ],
  },

  // ── 4. Winning ──────────────────────────────────────────
  {
    id: 's4',
    title: '4. Winning',
    blocks: [
      { type: 'h3', text: 'Standard form: 4 melds + 1 pair (33332)' },
      { type: 'p', text: 'The most common winning-hand structure is <strong>4 melds plus 1 pair</strong>, for a total of 14 tiles.' },
      { type: 'concept-grid', items: [
        { label: 'Sequence', tiles: '3p 4p 5p', note: 'Three consecutive numbered tiles of the same suit. Honor tiles cannot form sequences.' },
        { label: 'Triplet', tiles: 'Z Z Z',    note: 'Three completely identical tiles. Both honor tiles and numbered tiles may be used.' },
        { label: 'Kong', tiles: '7m 7m 7m 7m', note: 'Four identical tiles, occupying one meld slot, obtained through chii/pon/kan.' },
        { label: 'Pair / Eyes', tiles: '2s 2s', note: 'Two identical tiles. Each winning hand has exactly 1 pair.' },
      ]},
      { type: 'hand', label: 'Example: All Chows / Pinfu (4 sequences + non-honor pair)', tiles: '1m 2m 3m | 4p 5p 6p | 7s 8s 9s | 3m 4m 5m | 2p 2p' },

      { type: 'h3', text: 'Special form: Seven Pairs' },
      { type: 'p', text: '7 different pairs, for a total of 14 tiles. Each tile type may have at most 1 pair, meaning you cannot use 4 identical tiles as 2 pairs. The hand must be closed and cannot use chii, pon, or kan.' },
      { type: 'hand', label: 'Example: Seven Pairs', tiles: '2m 2m | 5p 5p | 8p 8p | 3s 3s | 6s 6s | E E | Z Z' },

      { type: 'info', text: '<strong>Tsumo / Self-draw</strong>: drawing the tile that completes your winning hand yourself, declaring self-draw; all other players each pay points.<br><strong>Dealing in</strong>: if a tile you discard is used by another player to win, this is called dealing in, or discard win; the discarder pays the full amount alone.' },
      { type: 'info', text: '“33332” and “Seven Pairs” are the most basic winning-hand shapes. Other special shapes can be found in the full quick-reference table.' },
      { type: 'collapse', title: 'Passing a win and furiten', text: 'To avoid behavior that violates competitive spirit, such as maliciously targeting one specific player’s tiles, this variant does not set strict same-turn furiten or discard furiten rules like Riichi Mahjong. However: when a player passes on winning with a certain tile, that player may not win on that same tile before their next discard. This does not affect other waited tiles or that player’s self-draw.<br>Example: a non-riichi Pure Terminals in All Sets hand has a two-sided wait on 1 and 4 characters. 4 characters only gives Pinfu. If the player passes on 4 characters, they may not win on another player’s 4 characters before their next discard, but they may still win on 1 character and may self-draw 4 characters. After discarding, this state is cleared until the next time the player passes on a win.' },

    ],
  },

  // ── 5. Scoring rules ──────────────────────────────────────
  {
    id: 's5',
    title: '5. Scoring Rules',
    blocks: [
      { type: 'info', text: 'This website includes a scoring calculator. The following only needs to be understood at a basic level.' },
      { type: 'p', text: 'Mahjong scores through “scoring patterns”: each winning hand adds up the points of all patterns satisfied by the hand shape, then converts the total into payment points.' },

      { type: 'h3', text: 'Core principles' },
      { type: 'ul', items: [
        '<strong>A yaku is required to win</strong>: this rule set requires at least one scoring pattern worth <strong>2 fan</strong> or more in the winning hand. Non-dora scoring patterns worth 2 fan or more are called yaku. This may also be changed into a requirement that the total fan must reach a certain threshold. If the requirement is not met, the hand cannot win.',
        '<strong>Additive principle</strong>: one hand usually satisfies multiple patterns. Add together the fan values corresponding to all satisfied patterns; the result is the final fan count. If the tiles can be decomposed in different ways, use the decomposition that gives the highest score.',
        '<strong>Non-counting principle</strong>: when one scoring pattern is a necessary condition of another, only the higher-scoring one is counted. For example, “Thirteen Orphans” and “Seven Pairs” are necessarily closed, so “Closed Hand” is not additionally counted.',
        '<strong>Open-meld restrictions</strong>: some patterns require a <strong>closed hand</strong>, meaning no chii, pon, or open kan. See the tags in the quick-reference table for details.',
      ]},

      { type: 'h3', text: 'Payment methods (common)' },
      { type: 'ul', items: [
        'Discard win: the discarder pays the full amount alone.',
        'Self-draw by dealer: the three non-dealers each pay 1 share, for 3 shares total.',
        'Self-draw by non-dealer: the dealer pays 2 shares, and the other two non-dealers each pay 1 share, for 4 shares total.',
        'Dealer win: for a hand with the same fan count, the dealer’s winning payment is about 1.5 times that of a non-dealer.',
      ]},

      { type: 'collapse', title: 'Fan-to-points calculation rule I', text: 'Fan count is not directly equal to payment points or to the money amount used in some gambling mahjong variants. Different regions use different conversions, such as additive scoring where each fan is 1 point, or exponential growth based on 2 to the n-th power. The specific conversion should follow the local table rules. In the homepage quick-reference table, the colored label on each card is the fan value of that scoring pattern. Precisely because most local rules use gambling-like fan conversion systems, and because their in-game balance is often poor, mahjong has long hovered near gambling, which has also greatly obstructed the promotion of purely competitive mahjong, namely MCR and Riichi Mahjong. This website and these rules firmly oppose any form of mahjong play that completely lacks competitive balance, as well as any form of mahjong played for material stakes. We firmly despise and reject all gambling-degenerate behavior. <strong>Gambling degenerates can go to hell</strong>!' },
      { type: 'collapse', title: 'Fan-to-points calculation rule II', text: 'Winning hands of 15 fan or less use a one-fan-to-one-point correspondence and are considered small hands. Hands of 16 fan or more are scored by tiers: 16–21 fan is mangan, 8000 for non-dealer; 22–27 fan is haneman, 12000 for non-dealer; 28–35 fan is baiman, 16000 for non-dealer; 36–49 fan is sanbaiman, 24000 for non-dealer; 50–63 fan is counted yakuman, 32000 for non-dealer. To reflect the special status of yakuman-level big hands, all accumulated patterns worth 48 fan or less only add up to counted yakuman at most. Then each scoring pattern originally worth 64 fan is counted as one single yakuman, 32000 for non-dealer; each scoring pattern originally worth 88 fan is counted as one double yakuman, 64000 for non-dealer.' },

    ],
  },

  // ── 6. Common winning hands ──────────────────────────────────────
  {
    id: 's6',
    title: '6. Common Winning Hand Patterns',
    blocks: [
      { type: 'p', text: 'The following are scoring-pattern examples that beginners encounter most often. For the full list, including conditions, exclusion rules, and more example hands, see the <a href="index.html" style="color:var(--accent);">homepage quick-reference table</a>.' },
      // Only the id from fans.js is needed; name/fan/description/example hand are all automatically read from FANS_DATA
      // To override the example hand, add an extra tiles field (same format as fans.js example)
      { type: 'common-hands', items: [
        // Value tiles: Seat Wind Pung / Prevalent Wind Pung / Dragon Pung are combined into one card (special grouping used only here)
        { groupName: 'Value Tiles', ids: ['men_feng_ke', 'quan_feng_ke', 'jian_ke'] },
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