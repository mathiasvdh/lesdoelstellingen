// ============================================================
// DE ACADEMIE - Game Engine v3.0
// Supports single-player and multiplayer (2-4 players)
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

const BOOK_COST_PER_COLUMN = [0, 1, 1, 2, 2];

const SKILL_MAP = { 'L': 'lezen', 'S': 'schrijven', 'Sp': 'spreken' };
const ROW_TO_SKILL = { 'lezen': 'L', 'schrijven': 'S', 'spreken': 'Sp' };

// ============================================================
// Row benefits - matches Wingspan exactly
// ============================================================
const LEZEN_BENEFITS = [
  { ideas: 1, conversion: false },
  { ideas: 1, conversion: true },
  { ideas: 2, conversion: false },
  { ideas: 2, conversion: true },
  { ideas: 3, conversion: false },
  { ideas: 3, conversion: true }
];

const SCHRIJVEN_BENEFITS = [
  { books: 2, conversion: false },
  { books: 2, conversion: true },
  { books: 3, conversion: false },
  { books: 3, conversion: true },
  { books: 4, conversion: false },
  { books: 4, conversion: true }
];

const SPREKEN_BENEFITS = [
  { cards: 1, conversion: false },
  { cards: 1, conversion: true },
  { cards: 2, conversion: false },
  { cards: 2, conversion: true },
  { cards: 3, conversion: false },
  { cards: 3, conversion: true }
];

// ============================================================
// Round Goals
// ============================================================
const ALL_ROUND_GOALS = [
  { id: 'rg1', naam: 'Het Grote Debat', beschrijving: 'Meeste filosofen in de Spreken-rij', scoreFn: 'spreken_count' },
  { id: 'rg2', naam: 'De Encyclopedie', beschrijving: 'Meeste boeken op het bord', scoreFn: 'books_count' },
  { id: 'rg3', naam: 'De Analytische School', beschrijving: 'Meeste Empirische filosofen met boeken', scoreFn: 'empirisch_books' },
  { id: 'rg4', naam: 'De Contemplatieve Traditie', beschrijving: 'Meeste Contemplatieve filosofen met boeken', scoreFn: 'contemplatief_books' },
  { id: 'rg5', naam: 'De Dialoog der Tradities', beschrijving: 'Meeste filosofen in de Lezen-rij', scoreFn: 'lezen_count' },
  { id: 'rg6', naam: 'Het Oeuvre', beschrijving: 'Meeste referenties (geciteerde kaarten)', scoreFn: 'tucked_count' },
  { id: 'rg7', naam: 'De Polymath', beschrijving: 'Meeste filosofen in de Schrijven-rij', scoreFn: 'schrijven_count' },
  { id: 'rg8', naam: 'Intellectueel Kapitaal', beschrijving: 'Meeste opgeslagen ideeen op filosofen', scoreFn: 'cached_count' },
  { id: 'rg9', naam: 'Kritische Massa', beschrijving: 'Meeste Dialectische filosofen met boeken', scoreFn: 'dialectisch_books' },
  { id: 'rg10', naam: 'De Ethische School', beschrijving: 'Meeste Normatieve filosofen met boeken', scoreFn: 'normatief_books' },
  { id: 'rg11', naam: 'De Brede Academie', beschrijving: 'Filosofen in alle drie de rijen (tel kleinste rij)', scoreFn: 'min_row' },
  { id: 'rg12', naam: 'De Invloedrijken', beschrijving: 'Meeste filosofen met invloed >= 5', scoreFn: 'high_influence' },
];

// ============================================================
// Levenswerk
// ============================================================
const ALL_LEVENSWERK = [
  { id: 'lw1', naam: 'Stichter van een School', beschrijving: '4+ filosofen van dezelfde traditie', scoreFn: 'same_traditie_4' },
  { id: 'lw2', naam: 'Meester-Lezer', beschrijving: '4+ filosofen in de Lezen-rij', scoreFn: 'lezen_4' },
  { id: 'lw3', naam: 'De Synthese', beschrijving: 'Minstens 1 filosoof van elke traditie (excl. eclectisch)', scoreFn: 'all_tradities' },
  { id: 'lw4', naam: 'Bibliothecaris', beschrijving: '8+ boeken op het bord', scoreFn: 'books_8' },
  { id: 'lw5', naam: 'Kroniekschrijver', beschrijving: '5+ referenties', scoreFn: 'tucked_5' },
  { id: 'lw6', naam: 'Universeel Genie', beschrijving: '3+ filosofen in elke rij', scoreFn: 'all_rows_3' },
  { id: 'lw7', naam: 'De Verzamelaar', beschrijving: '4+ filosofen met 0 boekkosten', scoreFn: 'free_4' },
  { id: 'lw8', naam: 'Diep Denken', beschrijving: '3+ filosofen met 3+ ideekosten', scoreFn: 'expensive_3' },
  { id: 'lw9', naam: 'Meester-Schrijver', beschrijving: '4+ filosofen in de Schrijven-rij', scoreFn: 'schrijven_4' },
  { id: 'lw10', naam: 'Redenaar', beschrijving: '4+ filosofen in de Spreken-rij', scoreFn: 'spreken_4' },
  { id: 'lw11', naam: 'De Empirist', beschrijving: '3+ Empirische filosofen', scoreFn: 'empirisch_3' },
  { id: 'lw12', naam: 'De Dialecticus', beschrijving: '3+ Dialectische filosofen', scoreFn: 'dialectisch_3' },
  { id: 'lw13', naam: 'Intellectueel Kapitalist', beschrijving: '4+ opgeslagen ideeen', scoreFn: 'cached_4' },
  { id: 'lw14', naam: 'De Boekenplank', beschrijving: '3+ filosofen met volle boekcapaciteit', scoreFn: 'full_books_3' },
];

// ============================================================
// Game State
// ============================================================
const Game = {
  mode: 'single', // 'single' or 'multi'
  deck: [],
  openCards: [],
  library: [],
  round: 0,
  turn: 0,

  // Multiplayer
  players: {},       // { playerId: playerState }
  turnOrder: [],     // [playerId, ...]
  currentPlayerIndex: 0,
  myId: 'local',     // This client's ID

  roundGoals: [],
  roundGoalScores: {},  // { playerId: [scores] }
  levenswerkOptions: {}, // { playerId: [options] }

  log: [],
  gameOver: false,
  phase: 'lobby',    // 'lobby', 'setup', 'playing', 'gameOver'

  // ==========================================================
  // INIT
  // ==========================================================
  init(mode, playerIds) {
    this.mode = mode || 'single';
    this.deck = shuffle([...ALL_CARDS]);
    this.openCards = [this.deck.pop(), this.deck.pop(), this.deck.pop()];
    this.rollLibrary();
    this.round = 0;
    this.turn = 0;
    this.gameOver = false;
    this.log = [];
    this.roundGoalScores = {};
    this.phase = 'setup';

    // Pick 4 random round goals
    const shuffledGoals = shuffle([...ALL_ROUND_GOALS]);
    this.roundGoals = shuffledGoals.slice(0, 4);

    const ids = playerIds || ['local'];
    this.turnOrder = [...ids];
    this.currentPlayerIndex = 0;
    this.players = {};

    const startCardsPerPlayer = {};

    for (const id of ids) {
      this.players[id] = this.createPlayer(id === 'local' && this.mode === 'single' ? 'Jij' : '');
      this.roundGoalScores[id] = [];

      // Deal 5 start cards per player
      const cards = [];
      for (let i = 0; i < 5; i++) {
        if (this.deck.length > 0) cards.push(this.deck.pop());
      }
      startCardsPerPlayer[id] = cards;

      // Pick 4 levenswerk options per player (unique)
      const shuffledLW = shuffle([...ALL_LEVENSWERK]);
      this.levenswerkOptions[id] = shuffledLW.slice(0, 4);
    }

    return startCardsPerPlayer;
  },

  createPlayer(name) {
    return {
      name: name || '',
      hand: [],
      board: { lezen: [], schrijven: [], spreken: [] },
      ideas: { weegschaal: 0, oog: 0, spiegel: 0, passer: 0, sfeer: 0 },
      booksOnBoard: 0,
      tuckedCards: 0,
      cachedIdeas: 0,
      levenswerk: null,
      levenswerkId: null,
      cubesLeft: TURNS_PER_ROUND[0],
      ready: false,
    };
  },

  // ==========================================================
  // PLAYER HELPERS
  // ==========================================================
  getPlayer(id) {
    return this.players[id || this.myId];
  },

  getMyPlayer() {
    return this.players[this.myId];
  },

  getCurrentPlayerId() {
    return this.turnOrder[this.currentPlayerIndex];
  },

  getCurrentPlayer() {
    return this.players[this.getCurrentPlayerId()];
  },

  isMyTurn() {
    return this.getCurrentPlayerId() === this.myId;
  },

  getPlayerName(id) {
    const p = this.players[id];
    return p ? (p.name || id) : id;
  },

  // ==========================================================
  // SETUP
  // ==========================================================
  finishSetup(playerId, selectedCards, ideas, levenswerkId) {
    const p = this.players[playerId];
    if (!p) return;
    p.hand = selectedCards;
    p.ideas = { ...ideas };
    p.levenswerkId = levenswerkId;
    p.levenswerk = ALL_LEVENSWERK.find(lw => lw.id === levenswerkId) || null;
    p.ready = true;
  },

  allPlayersReady() {
    return this.turnOrder.every(id => this.players[id] && this.players[id].ready);
  },

  startPlaying() {
    this.phase = 'playing';
    this.addLog('Spel gestart!', 'important');
    this.addLog(`Ronde 1: ${ROUND_NAMES[0]}`, 'important');
    this.addLog(`Rondedoel: ${this.roundGoals[0].naam}`, 'important');
  },

  // ==========================================================
  // LIBRARY (dice)
  // ==========================================================
  rollLibrary() {
    this.library = [];
    for (let i = 0; i < 5; i++) this.library.push(this.rollDie());
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

  takeFromLibrary(index, asType, playerId) {
    const p = this.players[playerId || this.getCurrentPlayerId()];
    const die = this.library[index];
    const type = die === 'wild' ? asType : die;
    p.ideas[type]++;
    this.library[index] = this.rollDie();
    this.addLog(`${this.getPlayerName(playerId)}: +1 ${IDEA_NAMES[type]}`, 'gain');
    return type;
  },

  // ==========================================================
  // PLACEMENT
  // ==========================================================
  getBookCostForColumn(row, playerId) {
    const p = this.players[playerId || this.getCurrentPlayerId()];
    const col = p.board[row].length;
    return BOOK_COST_PER_COLUMN[col] || 0;
  },

  canPlacePhilosopher(card, row, playerId) {
    const p = this.players[playerId || this.getCurrentPlayerId()];
    const skill = ROW_TO_SKILL[row];
    if (!card.vaardigheden.includes(skill)) return false;
    if (p.board[row].length >= 5) return false;

    const costCount = {};
    for (const c of card.kosten) costCount[c] = (costCount[c] || 0) + 1;
    for (const [type, count] of Object.entries(costCount)) {
      if (p.ideas[type] < count) return false;
    }

    const bookCost = this.getBookCostForColumn(row, playerId);
    if (bookCost > 0 && p.booksOnBoard < bookCost) return false;
    return true;
  },

  placePhilosopher(card, row, playerId) {
    const pid = playerId || this.getCurrentPlayerId();
    const p = this.players[pid];

    // Pay idea costs
    for (const c of card.kosten) {
      p.ideas[c]--;
      this.addLog(`${p.name}: -1 ${IDEA_NAMES[c]}`, 'spend');
    }

    // Pay book cost
    const bookCost = this.getBookCostForColumn(row, pid);
    if (bookCost > 0) {
      this.removeBooks(bookCost, pid);
      this.addLog(`${p.name}: -${bookCost} boek(en)`, 'spend');
    }

    // Remove from hand
    p.hand = p.hand.filter(c => c.id !== card.id);

    // Place on board
    const boardCard = { ...card, books: 0, tucked: 0, cached: 0 };
    p.board[row].push(boardCard);
    this.addLog(`${p.name}: ${card.naam} aangesteld in ${row}`, 'important');

    // Execute white power
    if (card.kracht_type === 'wit') {
      this.executePower(boardCard, 'wit', pid);
    }

    // Execute pink powers for OTHER players (multiplayer)
    if (this.mode === 'multi') {
      for (const otherId of this.turnOrder) {
        if (otherId === pid) continue;
        for (const c of this.getAllBoardCards(otherId)) {
          if (c.kracht_type === 'roze') {
            this.executePower(c, 'roze', otherId);
          }
        }
      }
    }

    this.useTurn(pid);
  },

  removeBooks(count, playerId) {
    const p = this.players[playerId || this.getCurrentPlayerId()];
    let remaining = count;
    for (const row of ['lezen', 'schrijven', 'spreken']) {
      for (const card of p.board[row]) {
        while (card.books > 0 && remaining > 0) {
          card.books--;
          p.booksOnBoard--;
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
  getRowBenefit(row, playerId) {
    const p = this.players[playerId || this.getCurrentPlayerId()];
    const count = p.board[row].length;
    const idx = Math.min(count, 5);
    if (row === 'lezen') return LEZEN_BENEFITS[idx];
    if (row === 'schrijven') return SCHRIJVEN_BENEFITS[idx];
    if (row === 'spreken') return SPREKEN_BENEFITS[idx];
  },

  activateBrownPowers(row, playerId) {
    const pid = playerId || this.getCurrentPlayerId();
    const cards = this.players[pid].board[row];
    for (let i = cards.length - 1; i >= 0; i--) {
      if (cards[i].kracht_type === 'bruin') {
        this.executePower(cards[i], 'bruin', pid);
      }
    }
  },

  // ==========================================================
  // POWER EXECUTION
  // ==========================================================
  executePower(card, type, playerId) {
    const pid = playerId || this.getCurrentPlayerId();
    const p = this.players[pid];
    const kracht = card.kracht.toLowerCase();

    // --- GAIN IDEAS ---
    const ideaMatch = kracht.match(/pak (\d+)/);
    const wantsIdeas = ideaMatch && (kracht.includes('idee') || kracht.includes('ideeën') || kracht.includes('en pak'));
    if (ideaMatch && wantsIdeas) {
      const amount = parseInt(ideaMatch[1]);
      const types = this.parseIdeaTypes(kracht);
      if (types.length > 0) {
        for (let i = 0; i < Math.min(amount, types.length); i++) {
          p.ideas[types[i]]++;
          this.addLog(`${card.naam}: +1 ${IDEA_NAMES[types[i]]}`, 'gain');
        }
        for (let i = types.length; i < amount; i++) {
          p.ideas[types[0]]++;
          this.addLog(`${card.naam}: +1 ${IDEA_NAMES[types[0]]}`, 'gain');
        }
      } else if (kracht.includes('willekeurig') || kracht.includes('bibliotheek') || kracht.includes('en pak')) {
        for (let i = 0; i < amount; i++) {
          const t = this.randomIdeaType();
          p.ideas[t]++;
          this.addLog(`${card.naam}: +1 ${IDEA_NAMES[t]}`, 'gain');
        }
      } else if (kracht.includes('naar keuze')) {
        for (let i = 0; i < amount; i++) {
          const t = this.bestIdeaType(pid);
          p.ideas[t]++;
          this.addLog(`${card.naam}: +1 ${IDEA_NAMES[t]}`, 'gain');
        }
      }
    }

    // --- DRAW CARDS ---
    const cardMatch = kracht.match(/trek (\d+) kaart/);
    if (cardMatch) {
      const n = parseInt(cardMatch[1]);
      this.drawCards(n, pid);
      this.addLog(`${card.naam}: +${n} kaart(en)`, 'gain');
    }

    // --- PLACE BOOKS ---
    if (kracht.includes('leg') && kracht.includes('boek')) {
      const bookMatch = kracht.match(/leg (\d+) boek/);
      if (bookMatch) {
        const n = parseInt(bookMatch[1]);
        if (kracht.includes('op elke filosoof')) {
          const row = this.findCardRow(card, pid);
          const targets = row ? p.board[row] : this.getAllBoardCards(pid);
          for (const target of targets) {
            for (let i = 0; i < n; i++) {
              if (target.books < target.boek_capaciteit) {
                target.books++;
                p.booksOnBoard++;
              }
            }
          }
        } else {
          for (let i = 0; i < n; i++) this.autoPlaceBook(card, pid);
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
          p.tuckedCards++;
          this.deck.pop();
        }
      }
    }

    // --- CACHE IDEAS ---
    if (kracht.includes('sla') && kracht.includes('op')) {
      const cacheMatch = kracht.match(/sla (\d+)/);
      const n = cacheMatch ? parseInt(cacheMatch[1]) : 1;
      for (let i = 0; i < n; i++) {
        const t = this.bestIdeaType(pid);
        if (p.ideas[t] > 0) {
          p.ideas[t]--;
          card.cached++;
          p.cachedIdeas++;
        }
      }
    }

    // --- REROLL LIBRARY ---
    if (kracht.includes('hergooi') && kracht.includes('bibliotheek')) {
      this.rollLibrary();
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

  bestIdeaType(playerId) {
    const p = this.players[playerId || this.getCurrentPlayerId()];
    let min = Infinity, best = 'weegschaal';
    for (const t of IDEA_TYPES) {
      if (p.ideas[t] < min) { min = p.ideas[t]; best = t; }
    }
    return best;
  },

  // ==========================================================
  // CARD & BOOK HELPERS
  // ==========================================================
  drawCards(n, playerId) {
    const p = this.players[playerId || this.getCurrentPlayerId()];
    for (let i = 0; i < n; i++) {
      if (this.deck.length > 0) p.hand.push(this.deck.pop());
    }
  },

  drawFromOpen(index, playerId) {
    const p = this.players[playerId || this.getCurrentPlayerId()];
    if (index >= 0 && index < this.openCards.length) {
      const card = this.openCards[index];
      p.hand.push(card);
      if (this.deck.length > 0) {
        this.openCards[index] = this.deck.pop();
      } else {
        this.openCards.splice(index, 1);
      }
      return card;
    }
    return null;
  },

  drawFromDeck(playerId) {
    const p = this.players[playerId || this.getCurrentPlayerId()];
    if (this.deck.length > 0) {
      const card = this.deck.pop();
      p.hand.push(card);
      return card;
    }
    return null;
  },

  findCardRow(card, playerId) {
    const p = this.players[playerId || this.getCurrentPlayerId()];
    for (const row of ['lezen', 'schrijven', 'spreken']) {
      if (p.board[row].some(c => c.id === card.id)) return row;
    }
    return null;
  },

  autoPlaceBook(preferCard, playerId) {
    const p = this.players[playerId || this.getCurrentPlayerId()];
    const allCards = [...p.board.lezen, ...p.board.schrijven, ...p.board.spreken];

    if (preferCard && preferCard.books < preferCard.boek_capaciteit) {
      preferCard.books++;
      p.booksOnBoard++;
      return true;
    }
    for (const c of allCards) {
      if (c.books < c.boek_capaciteit) {
        c.books++;
        p.booksOnBoard++;
        return true;
      }
    }
    return false;
  },

  placeBookOn(cardId, playerId) {
    const p = this.players[playerId || this.getCurrentPlayerId()];
    const allCards = [...p.board.lezen, ...p.board.schrijven, ...p.board.spreken];
    const card = allCards.find(c => c.id === cardId);
    if (card && card.books < card.boek_capaciteit) {
      card.books++;
      p.booksOnBoard++;
      return true;
    }
    return false;
  },

  getAllBoardCards(playerId) {
    const p = this.players[playerId || this.getCurrentPlayerId()];
    if (!p) return [];
    return [...p.board.lezen, ...p.board.schrijven, ...p.board.spreken];
  },

  // ==========================================================
  // SCORING HELPERS
  // ==========================================================
  traditieCounts(playerId) {
    const counts = { contemplatief: 0, empirisch: 0, dialectisch: 0, normatief: 0, eclectisch: 0 };
    for (const c of this.getAllBoardCards(playerId)) {
      if (c.traditie) counts[c.traditie] = (counts[c.traditie] || 0) + 1;
    }
    return counts;
  },

  countTraditieWithBooks(traditie, playerId) {
    return this.getAllBoardCards(playerId).filter(c =>
      (c.traditie === traditie || c.traditie === 'eclectisch') && c.books > 0
    ).length;
  },

  countByCondition(fn, playerId) {
    return this.getAllBoardCards(playerId).filter(fn).length;
  },

  // Score a round goal for a specific player
  scoreRoundGoal(goal, playerId) {
    const pid = playerId;
    const p = this.players[pid];
    if (!p) return 0;
    switch (goal.scoreFn) {
      case 'spreken_count': return p.board.spreken.length;
      case 'books_count': return p.booksOnBoard;
      case 'empirisch_books': return this.countTraditieWithBooks('empirisch', pid);
      case 'contemplatief_books': return this.countTraditieWithBooks('contemplatief', pid);
      case 'lezen_count': return p.board.lezen.length;
      case 'tucked_count': return p.tuckedCards;
      case 'schrijven_count': return p.board.schrijven.length;
      case 'cached_count': return p.cachedIdeas;
      case 'dialectisch_books': return this.countTraditieWithBooks('dialectisch', pid);
      case 'normatief_books': return this.countTraditieWithBooks('normatief', pid);
      case 'min_row': return Math.min(p.board.lezen.length, p.board.schrijven.length, p.board.spreken.length);
      case 'high_influence': return this.countByCondition(c => c.invloed >= 5, pid);
      default: return 0;
    }
  },

  // Score a levenswerk for a specific player
  scoreLevenswerkFn(lw, playerId) {
    const pid = playerId;
    const p = this.players[pid];
    if (!p || !lw) return 0;
    const counts = this.traditieCounts(pid);
    switch (lw.scoreFn) {
      case 'same_traditie_4': return Math.max(...Object.values(counts)) >= 4 ? 5 : 0;
      case 'lezen_4': return p.board.lezen.length >= 4 ? 5 : 0;
      case 'all_tradities': return (counts.contemplatief > 0 && counts.empirisch > 0 && counts.dialectisch > 0 && counts.normatief > 0) ? 7 : 0;
      case 'books_8': return p.booksOnBoard >= 8 ? 5 : 0;
      case 'tucked_5': return p.tuckedCards >= 5 ? 5 : 0;
      case 'all_rows_3': return (p.board.lezen.length >= 3 && p.board.schrijven.length >= 3 && p.board.spreken.length >= 3) ? 8 : 0;
      case 'free_4': return this.countByCondition(c => c.kosten.length === 0, pid) >= 4 ? 4 : 0;
      case 'expensive_3': return this.countByCondition(c => c.kosten.length >= 3, pid) >= 3 ? 7 : 0;
      case 'schrijven_4': return p.board.schrijven.length >= 4 ? 5 : 0;
      case 'spreken_4': return p.board.spreken.length >= 4 ? 5 : 0;
      case 'empirisch_3': return (counts.empirisch || 0) >= 3 ? 5 : 0;
      case 'dialectisch_3': return (counts.dialectisch || 0) >= 3 ? 5 : 0;
      case 'cached_4': return p.cachedIdeas >= 4 ? 5 : 0;
      case 'full_books_3': return this.countByCondition(c => c.books >= c.boek_capaciteit && c.boek_capaciteit > 0, pid) >= 3 ? 5 : 0;
      default: return 0;
    }
  },

  // ==========================================================
  // TURN & ROUND MANAGEMENT
  // ==========================================================
  useTurn(playerId) {
    const pid = playerId || this.getCurrentPlayerId();
    const p = this.players[pid];
    p.cubesLeft--;
    this.turn++;

    if (this.mode === 'single') {
      if (p.cubesLeft <= 0) this.endRound();
    } else {
      // Move to next player with cubes remaining
      this.advanceToNextPlayer();
    }
  },

  advanceToNextPlayer() {
    // Check if all players are done for this round
    const allDone = this.turnOrder.every(id => this.players[id].cubesLeft <= 0);
    if (allDone) {
      this.endRound();
      return;
    }
    // Find next player with cubes left
    let attempts = 0;
    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.turnOrder.length;
      attempts++;
    } while (this.getCurrentPlayer().cubesLeft <= 0 && attempts < this.turnOrder.length * 2);
  },

  endRound() {
    const goal = this.roundGoals[this.round];
    if (goal) {
      for (const pid of this.turnOrder) {
        const score = this.scoreRoundGoal(goal, pid);
        if (!this.roundGoalScores[pid]) this.roundGoalScores[pid] = [];
        this.roundGoalScores[pid].push(score);
        this.addLog(`${this.getPlayerName(pid)} - ${goal.naam}: ${score} punten`, 'important');
      }
    }

    // Activate groenblauw powers for all players
    for (const pid of this.turnOrder) {
      for (const card of this.getAllBoardCards(pid)) {
        if (card.kracht_type === 'groenblauw') {
          this.executePower(card, 'groenblauw', pid);
        }
      }
    }

    this.refreshOpenCards();
    this.addLog(`Ronde ${this.round + 1} afgelopen`, 'important');
    this.round++;

    if (this.round >= 4) {
      this.endGame();
      return;
    }

    this.turn = 0;
    this.currentPlayerIndex = 0;
    // Reset cubes for all players
    for (const pid of this.turnOrder) {
      this.players[pid].cubesLeft = TURNS_PER_ROUND[this.round];
    }
    this.addLog(`Ronde ${this.round + 1}: ${ROUND_NAMES[this.round]}`, 'important');
    this.addLog(`Rondedoel: ${this.roundGoals[this.round].naam}`, 'important');
  },

  refreshOpenCards() {
    this.openCards = [];
    for (let i = 0; i < 3; i++) {
      if (this.deck.length > 0) this.openCards.push(this.deck.pop());
    }
  },

  endGame() {
    this.gameOver = true;
    this.phase = 'gameOver';
    this.addLog('Spel afgelopen!', 'important');
  },

  // ==========================================================
  // FINAL SCORING
  // ==========================================================
  calculateScore(playerId) {
    const pid = playerId || this.myId;
    const p = this.players[pid];
    if (!p) return { total: 0 };

    let philosopherVP = 0, bookVP = 0, tuckVP = 0, cachedVP = 0;
    for (const card of this.getAllBoardCards(pid)) {
      philosopherVP += card.vp;
      bookVP += card.books;
      tuckVP += card.tucked;
      cachedVP += card.cached;
    }

    let roundGoalVP = 0;
    for (const s of (this.roundGoalScores[pid] || [])) roundGoalVP += s;

    let levenswerkVP = 0;
    if (p.levenswerk) levenswerkVP = this.scoreLevenswerkFn(p.levenswerk, pid);

    let gameEndVP = 0;
    for (const card of this.getAllBoardCards(pid)) {
      if (card.kracht_type === 'geel') gameEndVP += this.scoreGeelPower(card, pid);
    }

    return {
      philosopherVP, bookVP, tuckVP, cachedVP,
      roundGoalVP, levenswerkVP, gameEndVP,
      total: philosopherVP + bookVP + tuckVP + cachedVP + roundGoalVP + levenswerkVP + gameEndVP
    };
  },

  getTotalIdeas(playerId) {
    const p = this.players[playerId || this.getCurrentPlayerId()];
    let total = 0;
    for (const t of IDEA_TYPES) total += p.ideas[t];
    return total;
  },

  scoreGeelPower(card, playerId) {
    const pid = playerId || this.myId;
    const p = this.players[pid];
    const k = card.kracht.toLowerCase();
    const allCards = this.getAllBoardCards(pid);

    if (k.includes('rij lezen')) return p.board.lezen.length;
    if (k.includes('rij schrijven')) return p.board.schrijven.length;
    if (k.includes('rij spreken')) return p.board.spreken.length;
    if (k.includes('per 2 boeken')) return Math.floor(p.booksOnBoard / 2);
    if (k.includes('dezelfde traditie als deze')) return allCards.filter(c => c.traditie === card.traditie).length;
    if (k.includes('per 3 idee')) return Math.floor(this.getTotalIdeas(pid) / 3);
    if (k.includes('elke rij')) {
      return (p.board.lezen.length > 0 && p.board.schrijven.length > 0 && p.board.spreken.length > 0) ? 2 : 0;
    }
    if (k.includes('referenties')) return Math.floor(p.tuckedCards / 2);
    if (k.includes('4+ filosofen van dezelfde traditie')) {
      const counts = {};
      for (const c of allCards) counts[c.traditie] = (counts[c.traditie] || 0) + 1;
      return Object.values(counts).some(v => v >= 4) ? 2 : 0;
    }
    return 0;
  },

  // ==========================================================
  // STATE SERIALIZATION (for network sync)
  // ==========================================================
  getState() {
    return {
      mode: this.mode,
      deck: this.deck,
      openCards: this.openCards,
      library: this.library,
      round: this.round,
      turn: this.turn,
      players: this.players,
      turnOrder: this.turnOrder,
      currentPlayerIndex: this.currentPlayerIndex,
      roundGoals: this.roundGoals.map(g => g.id),
      roundGoalScores: this.roundGoalScores,
      levenswerkOptions: Object.fromEntries(
        Object.entries(this.levenswerkOptions).map(([k, v]) => [k, v.map(lw => lw.id)])
      ),
      log: this.log.slice(-50),
      gameOver: this.gameOver,
      phase: this.phase,
    };
  },

  loadState(state) {
    this.mode = state.mode;
    this.deck = state.deck;
    this.openCards = state.openCards;
    this.library = state.library;
    this.round = state.round;
    this.turn = state.turn;
    this.players = state.players;
    this.turnOrder = state.turnOrder;
    this.currentPlayerIndex = state.currentPlayerIndex;
    this.roundGoals = state.roundGoals.map(id => ALL_ROUND_GOALS.find(g => g.id === id)).filter(Boolean);
    this.roundGoalScores = state.roundGoalScores;
    this.levenswerkOptions = Object.fromEntries(
      Object.entries(state.levenswerkOptions).map(([k, ids]) => [k, ids.map(id => ALL_LEVENSWERK.find(lw => lw.id === id)).filter(Boolean)])
    );
    this.log = state.log;
    this.gameOver = state.gameOver;
    this.phase = state.phase;

    // Reconstruct levenswerk references
    for (const pid of this.turnOrder) {
      const p = this.players[pid];
      if (p && p.levenswerkId) {
        p.levenswerk = ALL_LEVENSWERK.find(lw => lw.id === p.levenswerkId) || null;
      }
    }
  },

  // ==========================================================
  // LOGGING
  // ==========================================================
  addLog(msg, type) {
    this.log.push({ msg, type: type || '', time: Date.now() });
    if (typeof UI !== 'undefined' && UI.updateLog) UI.updateLog();
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
</ol>
<p>Bij <strong>multiplayer</strong> spelen 2-4 spelers om beurten. Roze krachten activeren bij acties van medespelers!</p>`
  },
  filosoof_plaatsen: {
    titel: 'Een Filosoof Aanstellen',
    tekst: `<p>Klik op een kaart in je hand om een filosoof te plaatsen.</p>
<p><strong>Kosten:</strong></p>
<ul>
<li><strong>Ideekosten</strong>: De symbolen linksboven op de kaart</li>
<li><strong>Boekkosten</strong>: Afhankelijk van de kolom: 0 / 1 / 1 / 2 / 2</li>
</ul>
<p>De filosoof moet het juiste vaardigheidsicoon hebben (L/S/Sp) voor de gekozen rij.</p>`
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
<p>Boeken mogen op <strong>elke filosoof</strong> in <strong>elke rij</strong> gelegd worden, zolang er capaciteit is.</p>`
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
<tr><td>5</td><td>3</td><td>1 boek inleveren → +1 kaart</td></tr></table>`
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
<li><strong>Contemplatief</strong> \uD83E\uDDD8 - Innerlijke reflectie, metafysica</li>
<li><strong>Empirisch</strong> \uD83D\uDD2C - Observatie, wetenschap</li>
<li><strong>Dialectisch</strong> \u2694\uFE0F - Debat, synthese</li>
<li><strong>Normatief</strong> \u2696\uFE0F - Ethiek, politiek</li>
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
<tr><td>Levenswerk</td><td>Bonus bij het behalen van je doel</td></tr>
<tr><td>Gele krachten</td><td>Bonus VP bij eindtelling</td></tr></table>`
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
