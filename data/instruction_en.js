// English beginner guide content.

const INSTRUCTION_DATA = [
  {
    id: 's0',
    title: '0. Mahjong Tiles',
    blocks: [
      { type: 'warning', title: 'Notice', text: 'This site documents a house-rule mix for casual, no-stakes mahjong. Rules vary widely by table; agree on disputed rules before playing. This site opposes gambling.' },
      { type: 'h3', text: 'Tile Set' },
      { type: 'p', text: 'A standard mahjong set has <strong>136 tiles</strong> without flowers: three numbered suits and seven honor tiles.' },
      { type: 'h3', text: 'Numbered Suits' },
      { type: 'p', text: 'Characters, dots, and bamboo each run from 1 to 9, with four copies of every tile.' },
      { type: 'tile-suites', groups: [
        { label: 'Characters', tiles: '1m 2m 3m 4m 5m 6m 7m 8m 9m' },
        { label: 'Dots', tiles: '1p 2p 3p 4p 5p 6p 7p 8p 9p' },
        { label: 'Bamboo', tiles: '1s 2s 3s 4s 5s 6s 7s 8s 9s' },
        { break: true },
        { label: 'Red fives', tiles: '0m 0p 0s' },
      ]},
      { type: 'h3', text: 'Honor Tiles' },
      { type: 'p', text: 'Honor tiles are winds and dragons. They cannot form sequences.' },
      { type: 'tile-suites', groups: [
        { label: 'Winds', tiles: 'E S W N' },
        { label: 'Dragons', tiles: 'B F Z' },
      ]},
      { type: 'h3', text: 'Core Terms' },
      { type: 'ul', items: [
        '<strong>Sequence</strong>: three consecutive numbered tiles in one suit.',
        '<strong>Triplet</strong>: three identical tiles.',
        '<strong>Meld</strong>: a sequence, triplet, or kong.',
        '<strong>Pair</strong>: two identical tiles used as the head of most winning hands.',
      ]},
    ],
  },
  {
    id: 's1',
    title: '1. Table Setup',
    blocks: [
      { type: 'h3', text: 'Players and Seats' },
      { type: 'p', text: 'Mahjong is normally played by four players. The dealer is East; the other seats are South, West, and North in order.' },
      { type: 'h3', text: 'Round Wind and Seat Wind' },
      { type: 'ul', items: [
        '<strong>Prevalent wind</strong> is the round wind shared by the table.',
        '<strong>Seat wind</strong> is each player’s own wind.',
        'Triplets or kongs of either wind can score additional fan.',
      ]},
      { type: 'h3', text: 'Dealing' },
      { type: 'p', text: 'Players build the wall, determine the break, and draw starting hands. The dealer starts with 14 tiles and discards first; other players start with 13.' },
    ],
  },
  {
    id: 's2',
    title: '2. Turn Flow',
    blocks: [
      { type: 'steps', items: [
        '<strong>Draw</strong>: take one tile from the live wall.',
        '<strong>Check</strong>: if the hand is complete and legal, declare a win.',
        '<strong>Discard</strong>: otherwise discard one tile.',
        '<strong>Calls</strong>: other players may chii, pon, kong, or win on the discard when allowed.',
        '<strong>Drawn game</strong>: if the wall runs out or a draw condition is met, the hand ends without a winner.',
      ]},
      { type: 'info', text: 'Normal order is clockwise. Pon and kong interrupt the order; chii is only from the previous player.' },
    ],
  },
  {
    id: 's3',
    title: '3. Chii, Pon, Kong, Riichi',
    blocks: [
      { type: 'p', text: 'Using another player’s discard to complete a meld is called opening the hand. Open melds stay face up in front of you.' },
      { type: 'h3', text: 'Chii' },
      { type: 'p', text: 'Only the previous player’s discard may be called for a sequence.' },
      { type: 'hand', label: 'Example: 2-4 characters plus discarded 3 characters', tiles: '>3m 2m 4m' },
      { type: 'h3', text: 'Pon' },
      { type: 'p', text: 'Any player’s discard may be called to make a triplet. Pon has priority over chii.' },
      { type: 'hand', label: 'Example: East East plus a discarded East', tiles: 'E >E E' },
      { type: 'h3', text: 'Kong' },
      { type: 'p', text: 'Four identical tiles form a kong. After declaring a kong, draw a replacement tile and reveal the next dora indicator when applicable.' },
      { type: 'concept-grid', items: [
        { label: 'Open kong', tiles: '5p 0p >5p 5p', note: 'Made from a discard when you already have three matching tiles.' },
        { label: 'Added kong', tiles: '3s 3s >3s >3s', note: 'Extends an open triplet after drawing the fourth tile.' },
        { label: 'Concealed kong', tiles: 'X 9m 9m X', note: 'Made from four tiles in your own hand; it normally preserves closed-hand status.' },
      ]},
      { type: 'h3', text: 'Riichi' },
      { type: 'p', text: 'Riichi is a declaration made from a closed tenpai hand. After declaring, the player normally discards only drawn tiles and may gain riichi-related scoring patterns.' },
    ],
  },
  {
    id: 's4',
    title: '4. Winning Hands',
    blocks: [
      { type: 'h3', text: 'Standard Shape' },
      { type: 'p', text: 'The most common winning shape is four melds plus one pair, for 14 tiles total.' },
      { type: 'concept-grid', items: [
        { label: 'Sequence', tiles: '3p 4p 5p', note: 'Three consecutive tiles in one suit.' },
        { label: 'Triplet', tiles: 'Z Z Z', note: 'Three identical tiles.' },
        { label: 'Kong', tiles: '7m 7m 7m 7m', note: 'Four identical tiles occupying one meld slot.' },
        { label: 'Pair', tiles: '2s 2s', note: 'The pair of the hand.' },
      ]},
      { type: 'hand', label: 'Example: All Chows', tiles: '1m 2m 3m | 4p 5p 6p | 7s 8s 9s | 3m 4m 5m | 2p 2p' },
      { type: 'h3', text: 'Seven Pairs' },
      { type: 'p', text: 'Seven pairs is a special closed shape made from seven pairs.' },
      { type: 'hand', label: 'Example: Seven Pairs', tiles: '2m 2m | 5p 5p | 8p 8p | 3s 3s | 6s 6s | E E | Z Z' },
      { type: 'info', text: '<strong>Tsumo</strong> means winning on your own draw. <strong>Ron</strong> means winning on another player’s discard.' },
    ],
  },
  {
    id: 's5',
    title: '5. Scoring',
    blocks: [
      { type: 'p', text: 'Scoring is based on fan. A hand may satisfy several scoring patterns; compatible patterns are added together.' },
      { type: 'ul', items: [
        '<strong>Yaku requirement</strong>: this ruleset expects at least one non-dora scoring pattern worth 2 fan or more, unless the table agrees otherwise.',
        '<strong>Additive scoring</strong>: count every compatible pattern and use the best valid interpretation of the hand.',
        '<strong>Exclusions</strong>: if a high-value pattern already includes a lower one as a necessary condition, the lower one may be excluded.',
        '<strong>Closed restrictions</strong>: some patterns require a closed hand.',
      ]},
    ],
  },
  {
    id: 's6',
    title: '6. Common Hands',
    blocks: [
      { type: 'p', text: 'These are common scoring patterns for newer players. The full quick reference is on the main page.' },
      { type: 'common-hands', items: [
        { groupName: 'Value Honors', ids: ['men_feng_ke', 'quan_feng_ke', 'jian_ke'] },
        { id: 'men_qian_qing' },
        { id: 'ping_he' },
        { id: 'duan_yao' },
        { id: 'peng_peng_he' },
        { id: 'hun_yi_se' },
        { id: 'wu_men_qi' },
        { id: 'qi_dui_zi' },
        { id: 'qing_yi_se' },
      ]},
    ],
  },
];
