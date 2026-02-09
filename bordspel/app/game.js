// ============================================================
// DE ACADEMIE - Game Engine
// ============================================================

const IDEA_TYPES = ['weegschaal', 'oog', 'spiegel', 'passer', 'sfeer'];

const IDEA_SYMBOLS = {
  weegschaal: '\u2696',
  oog: '\uD83D\uDC41',
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

const ROUND_NAMES = ['De Oudheid', 'De Middeleeuwen', 'De Verlichting', 'De Moderne Tijd'];
const TURNS_PER_ROUND = [8, 7, 6, 5];

const SKILL_MAP = { 'L': 'lezen', 'S': 'schrijven', 'Sp': 'spreken' };
const ROW_TO_SKILL = { 'lezen': 'L', 'schrijven': 'S', 'spreken': 'Sp' };

// Read benefits per philosopher count in row
const LEZEN_BENEFITS = [
  { ideas: 1, reroll: false },
  { ideas: 1, reroll: false },
  { ideas: 2, reroll: false },
  { ideas: 2, reroll: true },
  { ideas: 3, reroll: false },
  { ideas: 3, reroll: true }
];

const SCHRIJVEN_BENEFITS = [
  { books: 1 }, { books: 1 }, { books: 2 },
  { books: 2 }, { books: 3 }, { books: 3 }
];

const SPREKEN_BENEFITS = [
  { cards: 1, fromOpen: false },
  { cards: 1, fromOpen: false },
  { cards: 1, fromOpen: true },
  { cards: 2, fromOpen: false },
  { cards: 2, fromOpen: true },
  { cards: 3, fromOpen: false }
];

// ============================================================
// Game State
// ============================================================
const Game = {
  deck: [],
  openCards: [],
  library: [],        // 5 dice results
  round: 0,           // 0-indexed
  turn: 0,
  cubesLeft: 0,
  totalCubes: 8,

  player: {
    hand: [],
    board: { lezen: [], schrijven: [], spreken: [] },
    ideas: { weegschaal: 0, oog: 0, spiegel: 0, passer: 0, sfeer: 0 },
    booksOnBoard: 0,
    tuckedCards: 0,
  },

  // Action state
  currentAction: null,  // 'placing', 'lezen', 'schrijven', 'spreken', 'choosing_ideas', etc.
  selectedCard: null,
  selectedRow: null,
  pendingChoices: [],

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
    this.totalCubes = TURNS_PER_ROUND[0];
    this.gameOver = false;
    this.currentAction = null;
    this.selectedCard = null;
    this.selectedRow = null;
    this.log = [];

    this.player = {
      hand: [],
      board: { lezen: [], schrijven: [], spreken: [] },
      ideas: { weegschaal: 0, oog: 0, spiegel: 0, passer: 0, sfeer: 0 },
      booksOnBoard: 0,
      tuckedCards: 0,
    };

    // Draw 5 starting cards
    const startCards = [];
    for (let i = 0; i < 5; i++) {
      if (this.deck.length > 0) startCards.push(this.deck.pop());
    }
    return startCards;
  },

  // ==========================================================
  // SETUP PHASE
  // ==========================================================
  finishSetup(selectedCards, ideas) {
    this.player.hand = selectedCards;
    this.player.ideas = { ...ideas };
    this.addLog('Spel gestart!', 'important');
    this.addLog(`Ronde 1: ${ROUND_NAMES[0]}`, 'important');
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
    this.addLog(`+1 ${IDEA_NAMES[type]} idee`, 'gain');
    return type;
  },

  // ==========================================================
  // ACTIONS
  // ==========================================================
  canPlacePhilosopher(card, row) {
    const skill = ROW_TO_SKILL[row];
    if (!card.vaardigheden.includes(skill)) return false;
    if (this.player.board[row].length >= 5) return false;
    // Check costs
    const costCount = {};
    for (const c of card.kosten) {
      costCount[c] = (costCount[c] || 0) + 1;
    }
    for (const [type, count] of Object.entries(costCount)) {
      if (this.player.ideas[type] < count) return false;
    }
    return true;
  },

  placePhilosopher(card, row) {
    // Pay costs
    for (const c of card.kosten) {
      this.player.ideas[c]--;
      this.addLog(`-1 ${IDEA_NAMES[c]} idee`, 'spend');
    }
    // Remove from hand
    this.player.hand = this.player.hand.filter(c => c.id !== card.id);
    // Place on board
    const boardCard = {
      ...card,
      books: 0,
      tucked: 0,
    };
    this.player.board[row].push(boardCard);
    this.addLog(`${card.naam} aangesteld in ${row}`, 'important');

    // Execute white (Bij Aanstelling) power
    if (card.kracht_type === 'wit') {
      this.executeWhitePower(boardCard);
    }

    this.useTurn();
  },

  // Row actions
  activateRow(row) {
    const philCount = this.player.board[row].length;

    if (row === 'lezen') {
      const benefit = LEZEN_BENEFITS[Math.min(philCount, 5)];
      if (benefit.reroll) {
        this.rollLibrary();
        this.addLog('Bibliotheek hergegooid', 'gain');
      }
      this.pendingIdeasToTake = benefit.ideas;
      this.addLog(`Lezen: pak ${benefit.ideas} idee(en) uit de Bibliotheek`, 'important');
    } else if (row === 'schrijven') {
      const benefit = SCHRIJVEN_BENEFITS[Math.min(philCount, 5)];
      this.pendingBooksToPlace = benefit.books;
      this.addLog(`Schrijven: leg ${benefit.books} boek(en)`, 'important');
    } else if (row === 'spreken') {
      const benefit = SPREKEN_BENEFITS[Math.min(philCount, 5)];
      this.pendingSprekenCards = benefit.cards;
      this.pendingSprekenFromOpen = benefit.fromOpen;
      this.addLog(`Spreken: trek ${benefit.cards} kaart(en)`, 'important');
    }

    // Activate brown powers from right to left
    const row_cards = this.player.board[row];
    for (let i = row_cards.length - 1; i >= 0; i--) {
      if (row_cards[i].kracht_type === 'bruin') {
        this.executeBrownPower(row_cards[i]);
      }
    }
  },

  // ==========================================================
  // POWER EXECUTION (simplified but functional)
  // ==========================================================
  executeBrownPower(card) {
    const p = this.player;
    const kracht = card.kracht.toLowerCase();

    // Pattern matching for common power types
    // Extra ideas
    if (kracht.includes('pak 1') && kracht.includes('idee')) {
      const types = this.parseIdeaTypes(kracht);
      if (types.length > 0) {
        for (const t of types) {
          p.ideas[t]++;
          this.addLog(`${card.naam}: +1 ${IDEA_NAMES[t]}`, 'gain');
        }
      } else if (kracht.includes('willekeurig') || kracht.includes('bibliotheek')) {
        const t = this.randomIdeaType();
        p.ideas[t]++;
        this.addLog(`${card.naam}: +1 ${IDEA_NAMES[t]}`, 'gain');
      } else if (kracht.includes('naar keuze')) {
        // Give a random one for simplicity in auto-mode
        const t = this.bestIdeaType();
        p.ideas[t]++;
        this.addLog(`${card.naam}: +1 ${IDEA_NAMES[t]}`, 'gain');
      }
    }

    // Pak 2 ideas
    if (kracht.includes('pak 2') && kracht.includes('idee')) {
      const types = this.parseIdeaTypes(kracht);
      if (types.length >= 2) {
        for (const t of types.slice(0, 2)) {
          p.ideas[t]++;
          this.addLog(`${card.naam}: +1 ${IDEA_NAMES[t]}`, 'gain');
        }
      } else if (types.length === 1) {
        p.ideas[types[0]] += 2;
        this.addLog(`${card.naam}: +2 ${IDEA_NAMES[types[0]]}`, 'gain');
      } else {
        for (let i = 0; i < 2; i++) {
          const t = this.randomIdeaType();
          p.ideas[t]++;
          this.addLog(`${card.naam}: +1 ${IDEA_NAMES[t]}`, 'gain');
        }
      }
    }

    // Trek kaart(en)
    if (kracht.includes('trek 1 kaart') || kracht.includes('trek 1 kaart')) {
      if (!kracht.includes('trek 2')) {
        this.drawCards(1);
        this.addLog(`${card.naam}: +1 kaart`, 'gain');
      }
    }
    if (kracht.includes('trek 2 kaart')) {
      this.drawCards(2);
      this.addLog(`${card.naam}: +2 kaarten`, 'gain');
    }

    // Leg boek(en)
    if (kracht.includes('leg 1 boek') && !kracht.includes('leg 2')) {
      this.autoPlaceBook(card);
    }
    if (kracht.includes('leg 2 boek')) {
      this.autoPlaceBook(card);
      this.autoPlaceBook(card);
    }

    // Citeer / Refereer (tuck)
    if (kracht.includes('citeer 1 kaart') || kracht.includes('refereer')) {
      if (this.deck.length > 0) {
        card.tucked++;
        p.tuckedCards++;
        this.deck.pop(); // consume from deck
        this.addLog(`${card.naam}: +1 referentie`, 'gain');
      }
    }

    // Hergooi bibliotheek
    if (kracht.includes('hergooi') && kracht.includes('bibliotheek')) {
      this.rollLibrary();
      this.addLog(`${card.naam}: Bibliotheek hergegooid`, 'gain');
    }
  },

  executeWhitePower(card) {
    const p = this.player;
    const kracht = card.kracht.toLowerCase();

    if (kracht.includes('trek 2 kaart')) {
      this.drawCards(2);
      this.addLog(`${card.naam}: +2 kaarten (Bij Aanstelling)`, 'gain');
    } else if (kracht.includes('trek') && kracht.includes('kaart')) {
      this.drawCards(1);
      this.addLog(`${card.naam}: +1 kaart (Bij Aanstelling)`, 'gain');
    }

    if (kracht.includes('pak') && kracht.includes('idee')) {
      const types = this.parseIdeaTypes(kracht);
      for (const t of types) {
        p.ideas[t]++;
        this.addLog(`${card.naam}: +1 ${IDEA_NAMES[t]} (Bij Aanstelling)`, 'gain');
      }
      if (types.length === 0) {
        const t = this.randomIdeaType();
        p.ideas[t]++;
        this.addLog(`${card.naam}: +1 ${IDEA_NAMES[t]} (Bij Aanstelling)`, 'gain');
      }
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
    // Return the type with the fewest
    let min = Infinity, best = 'weegschaal';
    for (const t of IDEA_TYPES) {
      if (this.player.ideas[t] < min) {
        min = this.player.ideas[t];
        best = t;
      }
    }
    return best;
  },

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
      // Refill
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

  autoPlaceBook(preferCard) {
    // Place a book on any philosopher that has capacity
    // Prefer the specified card
    const allCards = [
      ...this.player.board.lezen,
      ...this.player.board.schrijven,
      ...this.player.board.spreken
    ];

    if (preferCard && preferCard.books < preferCard.boek_capaciteit) {
      preferCard.books++;
      this.player.booksOnBoard++;
      this.addLog(`+1 boek op ${preferCard.naam}`, 'gain');
      return true;
    }

    for (const c of allCards) {
      if (c.books < c.boek_capaciteit) {
        c.books++;
        this.player.booksOnBoard++;
        this.addLog(`+1 boek op ${c.naam}`, 'gain');
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
      this.addLog(`+1 boek op ${card.naam}`, 'gain');
      return true;
    }
    return false;
  },

  // ==========================================================
  // TURN MANAGEMENT
  // ==========================================================
  useTurn() {
    this.cubesLeft--;
    this.turn++;

    if (this.cubesLeft <= 0) {
      this.endRound();
    }
  },

  endRound() {
    this.addLog(`Ronde ${this.round + 1} afgelopen`, 'important');
    this.round++;

    if (this.round >= 4) {
      this.endGame();
      return;
    }

    this.turn = 0;
    this.cubesLeft = TURNS_PER_ROUND[this.round];
    this.totalCubes = TURNS_PER_ROUND[this.round];
    this.addLog(`Ronde ${this.round + 1}: ${ROUND_NAMES[this.round]}`, 'important');
  },

  endGame() {
    this.gameOver = true;
    this.addLog('Spel afgelopen!', 'important');
  },

  // ==========================================================
  // SCORING
  // ==========================================================
  calculateScore() {
    const p = this.player;
    let philosopherVP = 0;
    let bookVP = 0;
    let tuckVP = 0;
    let ideaVP = 0;

    for (const row of ['lezen', 'schrijven', 'spreken']) {
      for (const card of p.board[row]) {
        philosopherVP += card.vp;
        bookVP += card.books;
        tuckVP += card.tucked;
      }
    }

    for (const t of IDEA_TYPES) {
      ideaVP += p.ideas[t];
    }

    return {
      philosopherVP,
      bookVP,
      tuckVP,
      ideaVP,
      total: philosopherVP + bookVP + tuckVP + ideaVP
    };
  },

  getTotalIdeas() {
    let total = 0;
    for (const t of IDEA_TYPES) total += this.player.ideas[t];
    return total;
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
// Utility
// ============================================================
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
