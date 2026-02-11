// ============================================================
// DE ACADEMIE - Game Engine v2.0
// Volledig herwerkt volgens Wingspan-mechanieken
// ============================================================

const IDEA_TYPES = ['weegschaal', 'oog', 'spiegel', 'passer', 'sfeer'];

const IDEA_SYMBOLS = {
  weegschaal: '\u2696\uFE0F',
  oog: '\uD83D\uDC41\uFE0F',
  spiegel: '\uD83E\uDE9E',
  passer: '\uD83D\uDCD0',
  sfeer: '\u221E'
};

const IDEA_NAMES = {
  weegschaal: 'Ethiek',
  oog: 'Waarneming',
  spiegel: 'Identiteit',
  passer: 'Logica',
  sfeer: 'Metafysica'
};

const TRADITIE_SYMBOLS = {
  contemplatief: '\uD83E\uDDD8',
  empirisch: '\uD83D\uDD2C',
  dialectisch: '\u2694\uFE0F',
  normatief: '\u2696\uFE0F',
  eclectisch: '\u2B50'
};

const TRADITIE_NAMES = {
  contemplatief: 'Contemplatief',
  empirisch: 'Empirisch',
  dialectisch: 'Dialectisch',
  normatief: 'Normatief',
  eclectisch: 'Eclectisch'
};

const ROUND_NAMES = ['De Oudheid', 'De Middeleeuwen', 'De Verlichting', 'De Moderne Tijd'];
const TURNS_PER_ROUND = [8, 7, 6, 5];

// Book (egg) cost per column position (0-indexed)
const BOOK_COST_PER_COLUMN = [0, 1, 1, 2, 2];

const SKILL_MAP = { 'L': 'lezen', 'S': 'schrijven', 'Sp': 'spreken' };
const ROW_TO_SKILL = { 'lezen': 'L', 'schrijven': 'S', 'spreken': 'Sp' };

// ============================================================
// Row benefits - matches Wingspan exactly
// ============================================================
// Lezen (Forest/Gain Food): 1, 1+conv, 2, 2+conv, 3, 3+conv
// Conversion: discard 1 card from hand → gain 1 extra idea
const LEZEN_BENEFITS = [
  { ideas: 1, conversion: false },
  { ideas: 1, conversion: true },
  { ideas: 2, conversion: false },
  { ideas: 2, conversion: true },
  { ideas: 3, conversion: false },
  { ideas: 3, conversion: true }
];

// Schrijven (Grassland/Lay Eggs): 2, 2+conv, 3, 3+conv, 4, 4+conv
// Conversion: pay 1 idea → lay 1 extra book
const SCHRIJVEN_BENEFITS = [
  { books: 2, conversion: false },
  { books: 2, conversion: true },
  { books: 3, conversion: false },
  { books: 3, conversion: true },
  { books: 4, conversion: false },
  { books: 4, conversion: true }
];

// Spreken (Wetland/Draw Cards): 1, 1+conv, 2, 2+conv, 3, 3+conv
// Conversion: discard 1 book → draw 1 extra card
const SPREKEN_BENEFITS = [
  { cards: 1, conversion: false },
  { cards: 1, conversion: true },
  { cards: 2, conversion: false },
  { cards: 2, conversion: true },
  { cards: 3, conversion: false },
  { cards: 3, conversion: true }
];

// ============================================================
// Round Goals (Paradigmaverschuivingen)
// ============================================================
const ALL_ROUND_GOALS = [
  { id: 'rg1', naam: 'Het Grote Debat', beschrijving: 'Meeste filosofen in de Spreken-rij', score: g => g.player.board.spreken.length },
  { id: 'rg2', naam: 'De Encyclopedie', beschrijving: 'Meeste boeken op het bord', score: g => g.player.booksOnBoard },
  { id: 'rg3', naam: 'De Analytische School', beschrijving: 'Meeste Empirische filosofen met boeken', score: g => g.countTraditieWithBooks('empirisch') },
  { id: 'rg4', naam: 'De Contemplatieve Traditie', beschrijving: 'Meeste Contemplatieve filosofen met boeken', score: g => g.countTraditieWithBooks('contemplatief') },
  { id: 'rg5', naam: 'De Dialoog der Tradities', beschrijving: 'Meeste filosofen in de Lezen-rij', score: g => g.player.board.lezen.length },
  { id: 'rg6', naam: 'Het Oeuvre', beschrijving: 'Meeste referenties (geciteerde kaarten)', score: g => g.player.tuckedCards },
  { id: 'rg7', naam: 'De Polymath', beschrijving: 'Meeste filosofen in de Schrijven-rij', score: g => g.player.board.schrijven.length },
  { id: 'rg8', naam: 'Intellectueel Kapitaal', beschrijving: 'Meeste opgeslagen ideeen op filosofen', score: g => g.player.cachedIdeas },
  { id: 'rg9', naam: 'Kritische Massa', beschrijving: 'Meeste Dialectische filosofen met boeken', score: g => g.countTraditieWithBooks('dialectisch') },
  { id: 'rg10', naam: 'De Ethische School', beschrijving: 'Meeste Normatieve filosofen met boeken', score: g => g.countTraditieWithBooks('normatief') },
  { id: 'rg11', naam: 'De Brede Academie', beschrijving: 'Filosofen in alle drie de rijen (tel kleinste rij)', score: g => Math.min(g.player.board.lezen.length, g.player.board.schrijven.length, g.player.board.spreken.length) },
  { id: 'rg12', naam: 'De Invloedrijken', beschrijving: 'Meeste filosofen met invloed >= 5', score: g => g.countByCondition(c => c.invloed >= 5) },
];

// ============================================================
// Levenswerk (Bonus Cards / Personal Goals)
// ============================================================
const ALL_LEVENSWERK = [
  { id: 'lw1', naam: 'Stichter van een School', beschrijving: '4+ filosofen van dezelfde traditie', score: g => { const counts = g.traditieCounts(); return Math.max(...Object.values(counts)) >= 4 ? 5 : 0; } },
  { id: 'lw2', naam: 'Meester-Lezer', beschrijving: '4+ filosofen in de Lezen-rij', score: g => g.player.board.lezen.length >= 4 ? 5 : 0 },
  { id: 'lw3', naam: 'De Synthese', beschrijving: 'Minstens 1 filosoof van elke traditie (excl. eclectisch)', score: g => { const c = g.traditieCounts(); return (c.contemplatief > 0 && c.empirisch > 0 && c.dialectisch > 0 && c.normatief > 0) ? 7 : 0; } },
  { id: 'lw4', naam: 'Bibliothecaris', beschrijving: '8+ boeken op het bord', score: g => g.player.booksOnBoard >= 8 ? 5 : 0 },
  { id: 'lw5', naam: 'Kroniekschrijver', beschrijving: '5+ referenties', score: g => g.player.tuckedCards >= 5 ? 5 : 0 },
  { id: 'lw6', naam: 'Universeel Genie', beschrijving: '3+ filosofen in elke rij', score: g => (g.player.board.lezen.length >= 3 && g.player.board.schrijven.length >= 3 && g.player.board.spreken.length >= 3) ? 8 : 0 },
  { id: 'lw7', naam: 'De Verzamelaar', beschrijving: '4+ filosofen met 0 boekkosten', score: g => g.countByCondition(c => c.kosten.length === 0) >= 4 ? 4 : 0 },
  { id: 'lw8', naam: 'Diep Denken', beschrijving: '3+ filosofen met 3+ ideekosten', score: g => g.countByCondition(c => c.kosten.length >= 3) >= 3 ? 7 : 0 },
  { id: 'lw9', naam: 'Meester-Schrijver', beschrijving: '4+ filosofen in de Schrijven-rij', score: g => g.player.board.schrijven.length >= 4 ? 5 : 0 },
  { id: 'lw10', naam: 'Redenaar', beschrijving: '4+ filosofen in de Spreken-rij', score: g => g.player.board.spreken.length >= 4 ? 5 : 0 },
  { id: 'lw11', naam: 'De Empirist', beschrijving: '3+ Empirische filosofen', score: g => (g.traditieCounts().empirisch || 0) >= 3 ? 5 : 0 },
  { id: 'lw12', naam: 'De Dialecticus', beschrijving: '3+ Dialectische filosofen', score: g => (g.traditieCounts().dialectisch || 0) >= 3 ? 5 : 0 },
  { id: 'lw13', naam: 'Intellectueel Kapitalist', beschrijving: '4+ opgeslagen ideeen', score: g => g.player.cachedIdeas >= 4 ? 5 : 0 },
  { id: 'lw14', naam: 'De Boekenplank', beschrijving: '3+ filosofen met volle boekcapaciteit', score: g => g.countByCondition(c => c.books >= c.boek_capaciteit && c.boek_capaciteit > 0) >= 3 ? 5 : 0 },
];

// ============================================================
// Game State
// ============================================================
const Game = {
  deck: [],
  openCards: [],
  library: [],
  round: 0,
  turn: 0,
  cubesLeft: 0,

  roundGoals: [],
  roundGoalScores: [],
  levenswerkOptions: [],

  player: {
    hand: [],
    board: { lezen: [], schrijven: [], spreken: [] },
    ideas: { weegschaal: 0, oog: 0, spiegel: 0, passer: 0, sfeer: 0 },
    booksOnBoard: 0,
    tuckedCards: 0,
    cachedIdeas: 0,
    levenswerk: null,
  },

  currentAction: null,
  selectedCard: null,
  log: [],
  gameOver: false,

  // ==========================================================
  // INIT
  // ==========================================================
  init() {
    this.deck = shuffle([...ALL_CARDS]);
    this.openCards = [this.deck.pop(), this.deck.pop(), this.deck.pop()];
    this.rollLibrary();
    this.round = 0;
    this.turn = 0;
    this.cubesLeft = TURNS_PER_ROUND[0];
    this.gameOver = false;
    this.currentAction = null;
    this.selectedCard = null;
    this.log = [];
    this.roundGoalScores = [];

    // Pick 4 random round goals
    const shuffledGoals = shuffle([...ALL_ROUND_GOALS]);
    this.roundGoals = shuffledGoals.slice(0, 4);

    // Pick 4 levenswerk options (player chooses 1)
    const shuffledLW = shuffle([...ALL_LEVENSWERK]);
    this.levenswerkOptions = shuffledLW.slice(0, 4);

    this.player = {
      hand: [],
      board: { lezen: [], schrijven: [], spreken: [] },
      ideas: { weegschaal: 0, oog: 0, spiegel: 0, passer: 0, sfeer: 0 },
      booksOnBoard: 0,
      tuckedCards: 0,
      cachedIdeas: 0,
      levenswerk: null,
    };

    const startCards = [];
    for (let i = 0; i < 5; i++) {
      if (this.deck.length > 0) startCards.push(this.deck.pop());
    }
    return startCards;
  },

  // ==========================================================
  // SETUP
  // ==========================================================
  finishSetup(selectedCards, ideas, levenswerk) {
    this.player.hand = selectedCards;
    this.player.ideas = { ...ideas };
    this.player.levenswerk = levenswerk;
    this.addLog('Spel gestart!', 'important');
    this.addLog(`Ronde 1: ${ROUND_NAMES[0]}`, 'important');
    this.addLog(`Rondedoel: ${this.roundGoals[0].naam}`, 'important');
  },

  // ==========================================================
  // LIBRARY (dice)
  // ==========================================================
  rollLibrary() {
    this.library = [];
    for (let i = 0; i < 5; i++) {
      this.library.push(this.rollDie());
    }
  },

  rollDie() {
    const r = Math.random();
    if (r < 1/6) return 'weegschaal';
    if (r < 2/6) return 'oog';
    if (r < 3/6) return 'spiegel';
    if (r < 4/6) return 'passer';
    if (r < 5/6) return 'sfeer';
    return 'wild';
  },

  takeFromLibrary(index, asType) {
    const die = this.library[index];
    const type = die === 'wild' ? asType : die;
    this.player.ideas[type]++;
    this.library[index] = this.rollDie();
    this.addLog(`+1 ${IDEA_NAMES[type]}`, 'gain');
    return type;
  },

  // ==========================================================
  // PLACEMENT COST (egg cost equivalent)
  // ==========================================================
  getBookCostForColumn(row) {
    const col = this.player.board[row].length; // next column index
    return BOOK_COST_PER_COLUMN[col] || 0;
  },

  canPlacePhilosopher(card, row) {
    const skill = ROW_TO_SKILL[row];
    if (!card.vaardigheden.includes(skill)) return false;
    if (this.player.board[row].length >= 5) return false;

    // Check idea costs
    const costCount = {};
    for (const c of card.kosten) {
      costCount[c] = (costCount[c] || 0) + 1;
    }
    for (const [type, count] of Object.entries(costCount)) {
      if (this.player.ideas[type] < count) return false;
    }

    // Check book cost for column
    const bookCost = this.getBookCostForColumn(row);
    if (bookCost > 0 && this.player.booksOnBoard < bookCost) return false;

    return true;
  },

  placePhilosopher(card, row) {
    // Pay idea costs
    for (const c of card.kosten) {
      this.player.ideas[c]--;
      this.addLog(`-1 ${IDEA_NAMES[c]}`, 'spend');
    }

    // Pay book cost
    const bookCost = this.getBookCostForColumn(row);
    if (bookCost > 0) {
      this.removeBooks(bookCost);
      this.addLog(`-${bookCost} boek(en) (plaatsingskosten)`, 'spend');
    }

    // Remove from hand
    this.player.hand = this.player.hand.filter(c => c.id !== card.id);

    // Place on board
    const boardCard = {
      ...card,
      books: 0,
      tucked: 0,
      cached: 0,
    };
    this.player.board[row].push(boardCard);
    this.addLog(`${card.naam} aangesteld in ${row}`, 'important');

    // Execute white power
    if (card.kracht_type === 'wit') {
      this.executePower(boardCard, 'wit');
    }

    this.useTurn();
  },

  removeBooks(count) {
    let remaining = count;
    for (const row of ['lezen', 'schrijven', 'spreken']) {
      for (const card of this.player.board[row]) {
        while (card.books > 0 && remaining > 0) {
          card.books--;
          this.player.booksOnBoard--;
          remaining--;
        }
        if (remaining <= 0) break;
      }
      if (remaining <= 0) break;
    }
  },

  // ==========================================================
  // ROW ACTIONS
  // ==========================================================
  getRowBenefit(row) {
    const count = this.player.board[row].length;
    const idx = Math.min(count, 5);
    if (row === 'lezen') return LEZEN_BENEFITS[idx];
    if (row === 'schrijven') return SCHRIJVEN_BENEFITS[idx];
    if (row === 'spreken') return SPREKEN_BENEFITS[idx];
  },

  activateBrownPowers(row) {
    const cards = this.player.board[row];
    for (let i = cards.length - 1; i >= 0; i--) {
      if (cards[i].kracht_type === 'bruin') {
        this.executePower(cards[i], 'bruin');
      }
    }
  },

  // ==========================================================
  // POWER EXECUTION
  // ==========================================================
  executePower(card, type) {
    const kracht = card.kracht.toLowerCase();

    // --- GAIN IDEAS ---
    const ideaMatch = kracht.match(/pak (\d+)/);
    const wantsIdeas = ideaMatch && (kracht.includes('idee') || kracht.includes('ideeën') || kracht.includes('en pak'));
    if (ideaMatch && wantsIdeas) {
      const amount = parseInt(ideaMatch[1]);
      const types = this.parseIdeaTypes(kracht);

      if (types.length > 0) {
        for (let i = 0; i < Math.min(amount, types.length); i++) {
          this.player.ideas[types[i]]++;
          this.addLog(`${card.naam}: +1 ${IDEA_NAMES[types[i]]}`, 'gain');
        }
        for (let i = types.length; i < amount; i++) {
          this.player.ideas[types[0]]++;
          this.addLog(`${card.naam}: +1 ${IDEA_NAMES[types[0]]}`, 'gain');
        }
      } else if (kracht.includes('willekeurig') || kracht.includes('bibliotheek') || kracht.includes('en pak')) {
        for (let i = 0; i < amount; i++) {
          const t = this.randomIdeaType();
          this.player.ideas[t]++;
          this.addLog(`${card.naam}: +1 ${IDEA_NAMES[t]}`, 'gain');
        }
      } else if (kracht.includes('naar keuze')) {
        for (let i = 0; i < amount; i++) {
          const t = this.bestIdeaType();
          this.player.ideas[t]++;
          this.addLog(`${card.naam}: +1 ${IDEA_NAMES[t]}`, 'gain');
        }
      }
    }

    // --- DRAW CARDS ---
    const cardMatch = kracht.match(/trek (\d+) kaart/);
    if (cardMatch) {
      const n = parseInt(cardMatch[1]);
      this.drawCards(n);
      this.addLog(`${card.naam}: +${n} kaart(en)`, 'gain');
    }

    // --- PLACE BOOKS ---
    if (kracht.includes('leg') && kracht.includes('boek')) {
      const bookMatch = kracht.match(/leg (\d+) boek/);
      if (bookMatch) {
        const n = parseInt(bookMatch[1]);
        if (kracht.includes('op elke filosoof')) {
          // Place books on each philosopher in the relevant scope
          const row = this.findCardRow(card);
          const targets = row ? this.player.board[row] : this.getAllBoardCards();
          for (const target of targets) {
            for (let i = 0; i < n; i++) {
              if (target.books < target.boek_capaciteit) {
                target.books++;
                this.player.booksOnBoard++;
                this.addLog(`${card.naam}: +1 boek op ${target.naam}`, 'gain');
              }
            }
          }
        } else {
          for (let i = 0; i < n; i++) {
            this.autoPlaceBook(card);
          }
        }
      }
    }

    // --- TUCK / CITE ---
    if (kracht.includes('citeer') || kracht.includes('refereer')) {
      const tuckMatch = kracht.match(/citeer (\d+)/);
      const n = tuckMatch ? parseInt(tuckMatch[1]) : 1;
      for (let i = 0; i < n; i++) {
        if (this.deck.length > 0) {
          card.tucked++;
          this.player.tuckedCards++;
          this.deck.pop();
          this.addLog(`${card.naam}: +1 referentie`, 'gain');
        }
      }
    }

    // --- CACHE IDEAS ---
    if (kracht.includes('sla') && kracht.includes('op')) {
      const cacheMatch = kracht.match(/sla (\d+)/);
      const n = cacheMatch ? parseInt(cacheMatch[1]) : 1;
      for (let i = 0; i < n; i++) {
        const t = this.bestIdeaType();
        if (this.player.ideas[t] > 0) {
          this.player.ideas[t]--;
          card.cached++;
          this.player.cachedIdeas++;
          this.addLog(`${card.naam}: +1 opgeslagen idee`, 'gain');
        }
      }
    }

    // --- REROLL LIBRARY ---
    if (kracht.includes('hergooi') && kracht.includes('bibliotheek')) {
      this.rollLibrary();
      this.addLog(`${card.naam}: Bibliotheek hergegooid`, 'gain');
    }
  },

  parseIdeaTypes(text) {
    const found = [];
    if (text.includes('weegschaal')) found.push('weegschaal');
    if (text.includes('oog')) found.push('oog');
    if (text.includes('spiegel')) found.push('spiegel');
    if (text.includes('passer')) found.push('passer');
    if (text.includes('sfeer')) found.push('sfeer');
    return found;
  },

  randomIdeaType() {
    return IDEA_TYPES[Math.floor(Math.random() * IDEA_TYPES.length)];
  },

  bestIdeaType() {
    let min = Infinity, best = 'weegschaal';
    for (const t of IDEA_TYPES) {
      if (this.player.ideas[t] < min) {
        min = this.player.ideas[t];
        best = t;
      }
    }
    return best;
  },

  // ==========================================================
  // CARD & BOOK HELPERS
  // ==========================================================
  drawCards(n) {
    for (let i = 0; i < n; i++) {
      if (this.deck.length > 0) {
        this.player.hand.push(this.deck.pop());
      }
    }
  },

  drawFromOpen(index) {
    if (index >= 0 && index < this.openCards.length) {
      const card = this.openCards[index];
      this.player.hand.push(card);
      if (this.deck.length > 0) {
        this.openCards[index] = this.deck.pop();
      } else {
        this.openCards.splice(index, 1);
      }
      return card;
    }
    return null;
  },

  drawFromDeck() {
    if (this.deck.length > 0) {
      const card = this.deck.pop();
      this.player.hand.push(card);
      return card;
    }
    return null;
  },

  findCardRow(card) {
    for (const row of ['lezen', 'schrijven', 'spreken']) {
      if (this.player.board[row].some(c => c.id === card.id)) return row;
    }
    return null;
  },

  autoPlaceBook(preferCard) {
    const allCards = [
      ...this.player.board.lezen,
      ...this.player.board.schrijven,
      ...this.player.board.spreken
    ];

    if (preferCard && preferCard.books < preferCard.boek_capaciteit) {
      preferCard.books++;
      this.player.booksOnBoard++;
      return true;
    }

    for (const c of allCards) {
      if (c.books < c.boek_capaciteit) {
        c.books++;
        this.player.booksOnBoard++;
        return true;
      }
    }
    return false;
  },

  placeBookOn(cardId) {
    const allCards = [
      ...this.player.board.lezen,
      ...this.player.board.schrijven,
      ...this.player.board.spreken
    ];
    const card = allCards.find(c => c.id === cardId);
    if (card && card.books < card.boek_capaciteit) {
      card.books++;
      this.player.booksOnBoard++;
      return true;
    }
    return false;
  },

  getAllBoardCards() {
    return [
      ...this.player.board.lezen,
      ...this.player.board.schrijven,
      ...this.player.board.spreken
    ];
  },

  // ==========================================================
  // SCORING HELPERS
  // ==========================================================
  traditieCounts() {
    const counts = { contemplatief: 0, empirisch: 0, dialectisch: 0, normatief: 0, eclectisch: 0 };
    for (const c of this.getAllBoardCards()) {
      if (c.traditie) counts[c.traditie] = (counts[c.traditie] || 0) + 1;
    }
    return counts;
  },

  countTraditieWithBooks(traditie) {
    return this.getAllBoardCards().filter(c =>
      (c.traditie === traditie || c.traditie === 'eclectisch') && c.books > 0
    ).length;
  },

  countByCondition(fn) {
    return this.getAllBoardCards().filter(fn).length;
  },

  // ==========================================================
  // TURN & ROUND MANAGEMENT
  // ==========================================================
  useTurn() {
    this.cubesLeft--;
    this.turn++;

    if (this.cubesLeft <= 0) {
      this.endRound();
    }
  },

  endRound() {
    // Score round goal
    const goal = this.roundGoals[this.round];
    if (goal) {
      const score = goal.score(this);
      this.roundGoalScores.push(score);
      this.addLog(`Ronde ${this.round + 1} - ${goal.naam}: ${score} punten`, 'important');
    }

    // Activate teal powers (einde van de ronde)
    for (const card of this.getAllBoardCards()) {
      if (card.kracht_type === 'groenblauw') {
        this.executePower(card, 'groenblauw');
      }
    }

    // Reset open cards (like Wingspan card tray reset)
    this.refreshOpenCards();

    this.addLog(`Ronde ${this.round + 1} afgelopen`, 'important');
    this.round++;

    if (this.round >= 4) {
      this.endGame();
      return;
    }

    this.turn = 0;
    this.cubesLeft = TURNS_PER_ROUND[this.round];
    this.addLog(`Ronde ${this.round + 1}: ${ROUND_NAMES[this.round]}`, 'important');
    this.addLog(`Rondedoel: ${this.roundGoals[this.round].naam}`, 'important');
  },

  refreshOpenCards() {
    // Discard current open cards and draw new ones
    this.openCards = [];
    for (let i = 0; i < 3; i++) {
      if (this.deck.length > 0) {
        this.openCards.push(this.deck.pop());
      }
    }
  },

  endGame() {
    this.gameOver = true;
    this.addLog('Spel afgelopen!', 'important');
  },

  // ==========================================================
  // FINAL SCORING
  // ==========================================================
  calculateScore() {
    const p = this.player;
    let philosopherVP = 0;
    let bookVP = 0;
    let tuckVP = 0;
    let cachedVP = 0;

    for (const card of this.getAllBoardCards()) {
      philosopherVP += card.vp;
      bookVP += card.books;
      tuckVP += card.tucked;
      cachedVP += card.cached;
    }

    // Round goal points
    let roundGoalVP = 0;
    for (const s of this.roundGoalScores) {
      roundGoalVP += s;
    }

    // Levenswerk
    let levenswerkVP = 0;
    if (p.levenswerk && p.levenswerk.score) {
      levenswerkVP = p.levenswerk.score(this);
    }

    // Yellow (einde spel) powers
    let gameEndVP = 0;
    for (const card of this.getAllBoardCards()) {
      if (card.kracht_type === 'geel') {
        gameEndVP += this.scoreGeelPower(card);
      }
    }

    return {
      philosopherVP,
      bookVP,
      tuckVP,
      cachedVP,
      roundGoalVP,
      levenswerkVP,
      gameEndVP,
      total: philosopherVP + bookVP + tuckVP + cachedVP + roundGoalVP + levenswerkVP + gameEndVP
    };
  },

  getTotalIdeas() {
    let total = 0;
    for (const t of IDEA_TYPES) total += this.player.ideas[t];
    return total;
  },

  scoreGeelPower(card) {
    const k = card.kracht.toLowerCase();
    const allCards = this.getAllBoardCards();

    // "1 VP per filosoof in de rij Lezen/Schrijven/Spreken"
    if (k.includes('rij lezen')) return this.player.board.lezen.length;
    if (k.includes('rij schrijven')) return this.player.board.schrijven.length;
    if (k.includes('rij spreken')) return this.player.board.spreken.length;

    // "1 VP per 2 boeken op je bord"
    if (k.includes('per 2 boeken')) return Math.floor(this.player.booksOnBoard / 2);

    // "1 VP per filosoof met dezelfde traditie als deze kaart"
    if (k.includes('dezelfde traditie als deze')) return allCards.filter(c => c.traditie === card.traditie).length;

    // "1 VP per 3 ideeën in je bezit"
    if (k.includes('per 3 idee')) return Math.floor(this.getTotalIdeas() / 3);

    // "2 VP als je minstens 1 filosoof in elke rij hebt"
    if (k.includes('elke rij')) {
      const hasAll = this.player.board.lezen.length > 0 && this.player.board.schrijven.length > 0 && this.player.board.spreken.length > 0;
      return hasAll ? 2 : 0;
    }

    // "1 VP per 2 referenties op je bord"
    if (k.includes('referenties')) return Math.floor(this.player.tuckedCards / 2);

    // "2 VP als je 4+ filosofen van dezelfde traditie hebt"
    if (k.includes('4+ filosofen van dezelfde traditie')) {
      const counts = {};
      for (const c of allCards) counts[c.traditie] = (counts[c.traditie] || 0) + 1;
      return Object.values(counts).some(v => v >= 4) ? 2 : 0;
    }

    return 0;
  },

  // ==========================================================
  // LOGGING
  // ==========================================================
  addLog(msg, type = '') {
    this.log.push({ msg, type, time: Date.now() });
    if (typeof UI !== 'undefined' && UI.updateLog) {
      UI.updateLog();
    }
  }
};

// ============================================================
// Help System Data
// ============================================================
const HELP_DATA = {
  overzicht: {
    titel: 'Hoe speel je De Academie?',
    tekst: `<p>Bouw een filosofische academie door <strong>denkers te verzamelen</strong>, <strong>ideeen te synthetiseren</strong> en <strong>boeken te publiceren</strong>.</p>
<p>Het spel duurt <strong>4 rondes</strong> met afnemende beurten (8/7/6/5). Elke beurt kies je <strong>1 actie</strong>:</p>
<ol>
<li><strong>Filosoof aanstellen</strong> - Betaal ideeen + boeken en plaats een denker</li>
<li><strong>Lezen</strong> - Pak ideeen uit de Bibliotheek</li>
<li><strong>Schrijven</strong> - Leg boeken op je filosofen</li>
<li><strong>Spreken</strong> - Trek nieuwe filosofenkaarten</li>
</ol>`
  },
  filosoof_plaatsen: {
    titel: 'Een Filosoof Aanstellen',
    tekst: `<p>Klik op een kaart in je hand om een filosoof te plaatsen.</p>
<p><strong>Kosten:</strong></p>
<ul>
<li><strong>Ideekosten</strong>: De symbolen linksboven op de kaart</li>
<li><strong>Boekkosten</strong>: Afhankelijk van de kolom: 0 / 1 / 1 / 2 / 2</li>
</ul>
<p>De filosoof moet het juiste vaardigheidsicoon hebben (L/S/Sp) voor de gekozen rij.</p>
<p><strong>Tip:</strong> Twee ideeen van hetzelfde type kunnen als 1 idee van een ander type tellen!</p>`
  },
  lezen: {
    titel: 'Lezen (Kennis vergaren)',
    tekst: `<p>Pak ideeen uit de Bibliotheek. Hoe meer filosofen in de Lezen-rij, hoe meer ideeen je pakt.</p>
<table><tr><th>Filosofen</th><th>Ideeen</th><th>Bonus</th></tr>
<tr><td>0</td><td>1</td><td>-</td></tr>
<tr><td>1</td><td>1</td><td>1 kaart inleveren → +1 idee</td></tr>
<tr><td>2</td><td>2</td><td>-</td></tr>
<tr><td>3</td><td>2</td><td>1 kaart inleveren → +1 idee</td></tr>
<tr><td>4</td><td>3</td><td>-</td></tr>
<tr><td>5</td><td>3</td><td>1 kaart inleveren → +1 idee</td></tr></table>
<p>Na het pakken worden alle <strong>bruine krachten</strong> in de Lezen-rij geactiveerd (rechts → links).</p>`
  },
  schrijven: {
    titel: 'Schrijven (Publiceren)',
    tekst: `<p>Leg boeken op je filosofen. Hoe meer filosofen in de Schrijven-rij, hoe meer boeken.</p>
<table><tr><th>Filosofen</th><th>Boeken</th><th>Bonus</th></tr>
<tr><td>0</td><td>2</td><td>-</td></tr>
<tr><td>1</td><td>2</td><td>1 idee betalen → +1 boek</td></tr>
<tr><td>2</td><td>3</td><td>-</td></tr>
<tr><td>3</td><td>3</td><td>1 idee betalen → +1 boek</td></tr>
<tr><td>4</td><td>4</td><td>-</td></tr>
<tr><td>5</td><td>4</td><td>1 idee betalen → +1 boek</td></tr></table>
<p>Boeken mogen op <strong>elke filosoof</strong> in <strong>elke rij</strong> gelegd worden, zolang er capaciteit is.</p>
<p>Boeken zijn ook nodig als <strong>plaatsingskosten</strong> voor kolom 2+ (0/1/1/2/2).</p>`
  },
  spreken: {
    titel: 'Spreken (Dialoog voeren)',
    tekst: `<p>Trek nieuwe filosofenkaarten uit de <strong>open rij</strong> of de <strong>stapel</strong>.</p>
<table><tr><th>Filosofen</th><th>Kaarten</th><th>Bonus</th></tr>
<tr><td>0</td><td>1</td><td>-</td></tr>
<tr><td>1</td><td>1</td><td>1 boek inleveren → +1 kaart</td></tr>
<tr><td>2</td><td>2</td><td>-</td></tr>
<tr><td>3</td><td>2</td><td>1 boek inleveren → +1 kaart</td></tr>
<tr><td>4</td><td>3</td><td>-</td></tr>
<tr><td>5</td><td>3</td><td>1 boek inleveren → +1 kaart</td></tr></table>
<p>Je mag <strong>elke kaart</strong> kiezen uit de open rij of van de stapel trekken.</p>
<p>Aan het einde van elke ronde worden de open kaarten vervangen.</p>`
  },
  krachten: {
    titel: 'Krachttypes',
    tekst: `<p>Elke filosoof heeft een unieke kracht met een kleurcode:</p>
<ul>
<li><span style="color:#8B6914">&#9679; Bruin</span> - <strong>Tijdens de beurt</strong>: Activeert telkens als de rij wordt gebruikt</li>
<li><span style="color:#d63384">&#9679; Roze</span> - <strong>Tussen beurten</strong>: Activeert bij acties van medespelers</li>
<li><span style="color:#ccc">&#9679; Wit</span> - <strong>Bij Aanstelling</strong>: Eenmalig bij het plaatsen</li>
<li><span style="color:#0d9488">&#9679; Groenblauw</span> - <strong>Einde van de ronde</strong>: Activeert aan het einde van elke ronde</li>
<li><span style="color:#eab308">&#9679; Geel</span> - <strong>Einde van het spel</strong>: Geeft extra VP bij eindtelling</li>
</ul>`
  },
  tradities: {
    titel: 'Filosofische Tradities',
    tekst: `<p>Elke filosoof behoort tot een <strong>traditie</strong>. Dit bepaalt rondedoelen en levenswerk.</p>
<ul>
<li><strong>Contemplatief</strong> \uD83E\uDDD8 - Innerlijke reflectie, metafysica (Plato, Descartes, Husserl)</li>
<li><strong>Empirisch</strong> \uD83D\uDD2C - Observatie, wetenschap (Aristoteles, Locke, Popper)</li>
<li><strong>Dialectisch</strong> \u2694\uFE0F - Debat, synthese (Socrates, Hegel, Marx)</li>
<li><strong>Normatief</strong> \u2696\uFE0F - Ethiek, politiek (Kant, Rawls, Arendt)</li>
<li><strong>Eclectisch</strong> \u2B50 - Grensoverschrijdend, telt als elke traditie</li>
</ul>`
  },
  scoring: {
    titel: 'Puntentelling',
    tekst: `<p>Aan het einde tel je punten uit alle bronnen:</p>
<table><tr><th>Bron</th><th>Punten</th></tr>
<tr><td>Filosoof-VP</td><td>Waarde op elke kaart</td></tr>
<tr><td>Boeken</td><td>1 per boek op het bord</td></tr>
<tr><td>Referenties</td><td>1 per geciteerde kaart</td></tr>
<tr><td>Opgeslagen ideeen</td><td>1 per idee op een filosoof</td></tr>
<tr><td>Rondedoelen</td><td>Punten uit Paradigmaverschuivingen</td></tr>
<tr><td>Levenswerk</td><td>Bonus bij het behalen van je doel</td></tr></table>`
  }
};

// ============================================================
// Utility
// ============================================================
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
