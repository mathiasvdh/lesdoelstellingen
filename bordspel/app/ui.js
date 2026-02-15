// ============================================================
// DE ACADEMIE - UI Layer v3.0
// Complete multiplayer-aware rewrite
// Supports single-player and multiplayer (2-4 players via PeerJS)
// ============================================================

const UI = {
  // Setup state
  setupCards: [],
  setupSelected: [],
  setupIdeas: { weegschaal: 0, oog: 0, spiegel: 0, passer: 0, sfeer: 0 },
  // setupPhase removed - single-screen setup like Wingspan
  selectedLevenswerk: null,

  // Action state
  actionMode: null,      // null, 'placing', 'pick_ideas', 'pick_cards', 'place_books', etc.
  selectedCard: null,
  selectedDice: [],

  // Multi-step action state
  ideasToTake: 0,
  booksToPlace: 0,
  cardsToTake: 0,
  conversionAvailable: false,
  conversionType: null,
  currentRow: null,
  discardMode: false,

  // Multiplayer view state
  viewingPlayer: null,   // Which player's board we're viewing (null = own)

  // ==========================================================
  // INIT
  // ==========================================================
  init() {
    if (!this._bound) {
      this.bindEvents();
      this._bound = true;
    }
    this.showScreen('lobby');
  },

  // ==========================================================
  // SCREENS
  // ==========================================================
  showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const el = document.getElementById(name + '-screen');
    if (el) el.classList.remove('hidden');
  },

  // ==========================================================
  // LOBBY - Mode Selection
  // ==========================================================
  selectSinglePlayer() {
    const startCardsMap = Game.init('single');
    this.setupCards = startCardsMap['local'] || [];
    this.setupSelected = [];
    // Start with 1 of each idea type (like Wingspan: 1 of each food)
    this.setupIdeas = { weegschaal: 1, oog: 1, spiegel: 1, passer: 1, sfeer: 1 };
    this.selectedLevenswerk = null;
    // Show levenswerk section immediately (1 screen, all choices)
    document.getElementById('setup-levenswerk-section').style.display = '';
    document.getElementById('setup-subtitle').textContent = 'Kies kaarten, ideeën en levenswerk (totaal kaarten + ideeën = 5)';
    document.getElementById('setup-waiting').classList.add('hidden');
    document.getElementById('btn-start-game').classList.remove('hidden');
    this.showScreen('setup');
    this.renderSetup();
  },

  selectMultiplayer() {
    document.getElementById('mode-select').classList.add('hidden');
    document.getElementById('multi-options').classList.remove('hidden');
    document.getElementById('player-name').focus();
  },

  backToModes() {
    document.getElementById('multi-options').classList.add('hidden');
    document.getElementById('waiting-room').classList.add('hidden');
    document.getElementById('connection-error').classList.add('hidden');
    document.getElementById('mode-select').classList.remove('hidden');
  },

  // ==========================================================
  // LOBBY - Create / Join Room
  // ==========================================================
  async createRoom() {
    const name = document.getElementById('player-name').value.trim();
    if (!name) {
      document.getElementById('player-name').focus();
      return;
    }
    try {
      const code = await Network.createRoom(name);
      this.showWaitingRoom(code);
      this.setupNetworkCallbacks();
    } catch (err) {
      this.showConnectionError('Kon spel niet aanmaken: ' + err.message);
    }
  },

  async joinRoom() {
    const name = document.getElementById('player-name').value.trim();
    const code = document.getElementById('join-code').value.trim();
    if (!name) { document.getElementById('player-name').focus(); return; }
    if (!code || code.length < 4) { document.getElementById('join-code').focus(); return; }
    try {
      await Network.joinRoom(code, name);
      this.showWaitingRoom(code);
      this.setupNetworkCallbacks();
    } catch (err) {
      this.showConnectionError('Kon niet verbinden: ' + err.message);
    }
  },

  showWaitingRoom(code) {
    document.getElementById('multi-options').classList.add('hidden');
    document.getElementById('waiting-room').classList.remove('hidden');
    document.getElementById('display-room-code').textContent = code;
    this.updateStartButton();
  },

  showConnectionError(msg) {
    document.getElementById('multi-options').classList.add('hidden');
    document.getElementById('waiting-room').classList.add('hidden');
    document.getElementById('connection-error').classList.remove('hidden');
    document.getElementById('error-msg').textContent = msg;
  },

  leaveRoom() {
    Network.destroy();
    document.getElementById('waiting-room').classList.add('hidden');
    document.getElementById('multi-options').classList.remove('hidden');
  },

  copyRoomCode() {
    const code = document.getElementById('display-room-code').textContent;
    navigator.clipboard.writeText(code).then(() => {
      const btn = document.getElementById('btn-copy-code');
      btn.textContent = 'Gekopieerd!';
      setTimeout(() => { btn.textContent = 'Kopieer'; }, 2000);
    });
  },

  updatePlayerList(players) {
    const container = document.getElementById('player-list');
    container.innerHTML = '';
    const entries = Object.entries(players);
    for (const [id, p] of entries) {
      const div = document.createElement('div');
      div.className = 'player-item' + (p.isHost ? ' host' : '');
      const statusBadge = p.connected
        ? '<span class="player-badge connected-badge">Verbonden</span>'
        : '<span class="player-badge disconnected-badge">Verbroken</span>';
      const hostBadge = p.isHost ? '<span class="player-badge host-badge">Host</span>' : '';
      div.innerHTML = `
        <span class="player-icon">${p.isHost ? '👑' : '🎓'}</span>
        <span class="player-name">${p.name || id}</span>
        ${hostBadge}
        ${statusBadge}
      `;
      container.appendChild(div);
    }
    this.updateStartButton();
  },

  updateStartButton() {
    const btn = document.getElementById('btn-start-multi');
    const count = Network.getPlayerCount();
    const hint = document.getElementById('waiting-hint');
    if (Network.isHost) {
      btn.style.display = '';
      if (count >= 2) {
        btn.disabled = false;
        hint.textContent = `${count} speler(s) verbonden. Klaar om te starten!`;
      } else {
        btn.disabled = true;
        hint.textContent = 'Wacht op spelers... (2-4 spelers nodig)';
      }
    } else {
      btn.style.display = 'none';
      hint.textContent = `${count} speler(s) verbonden. Wacht tot de host start...`;
    }
  },

  // ==========================================================
  // NETWORK CALLBACKS
  // ==========================================================
  setupNetworkCallbacks() {
    Network.onPlayersUpdate = (players) => {
      this.updatePlayerList(players);
    };

    Network.onStateUpdate = (state) => {
      // Client received full state from host
      Game.loadState(state);
      this.onStateReceived();
    };

    Network.onMessage = (fromId, data) => {
      if (Network.isHost) {
        this.handleHostIncoming(fromId, data);
      } else {
        this.handleClientIncoming(fromId, data);
      }
    };

    Network.onDisconnect = () => {
      this.showConnectionError('Verbinding met host verloren.');
      this.showScreen('lobby');
    };
  },

  // ==========================================================
  // HOST: Start Multiplayer Game
  // ==========================================================
  startMultiplayerGame() {
    if (!Network.isHost) return;
    const playerIds = Object.keys(Network.players).filter(id => Network.players[id].connected);
    if (playerIds.length < 2) return;

    const startCardsMap = Game.init('multi', playerIds);
    Game.myId = Network.myId;

    // Set player names from network
    for (const id of playerIds) {
      const netPlayer = Network.players[id];
      if (netPlayer && Game.players[id]) {
        Game.players[id].name = netPlayer.name || id;
      }
    }

    // Send each player their setup cards
    for (const id of playerIds) {
      if (id === Network.myId) {
        // Local host setup
        this.setupCards = startCardsMap[id] || [];
        this.setupSelected = [];
        this.setupIdeas = { weegschaal: 1, oog: 1, spiegel: 1, passer: 1, sfeer: 1 };
        this.selectedLevenswerk = null;
      } else {
        // Send to client
        Network.sendTo(id, {
          type: 'setup_cards',
          cards: startCardsMap[id] || [],
          levenswerkOptions: (Game.levenswerkOptions[id] || []).map(lw => lw.id)
        });
      }
    }

    // Broadcast initial state to all
    Network.broadcastState(Game.getState());

    // Show setup screen for host
    document.getElementById('setup-levenswerk-section').style.display = '';
    document.getElementById('setup-subtitle').textContent = 'Kies kaarten, ideeën en levenswerk (totaal = 5)';
    document.getElementById('setup-waiting').classList.add('hidden');
    document.getElementById('btn-start-game').classList.remove('hidden');
    this.showScreen('setup');
    this.renderSetup();
  },

  // ==========================================================
  // HOST: Handle incoming messages from clients
  // ==========================================================
  handleHostIncoming(fromId, data) {
    if (data.type === 'setup_done') {
      // Client finished setup - reconstruct cards from IDs
      const startCards = Game.getPlayer(fromId).hand.length > 0
        ? Game.getPlayer(fromId).hand
        : ALL_CARDS;
      const selectedCards = (data.selectedCardIds || [])
        .map(id => startCards.find(c => c.id === id) || ALL_CARDS.find(c => c.id === id))
        .filter(Boolean);
      Game.finishSetup(fromId, selectedCards, data.ideas, data.levenswerkId);

      if (Game.allPlayersReady()) {
        Game.startPlaying();
        Network.broadcastState(Game.getState());
        Network.broadcast({ type: 'game_start' });
        this.enterGameScreen();
      } else {
        Network.broadcastState(Game.getState());
      }
    }

    if (data.type === 'action') {
      // Client performed an action - validate it's their turn
      if (Game.getCurrentPlayerId() !== fromId) return;
      this.executeAction(data.action, fromId);
      Network.broadcastState(Game.getState());

      if (Game.gameOver) {
        Network.broadcast({ type: 'game_over' });
      }
    }
  },

  // ==========================================================
  // CLIENT: Handle incoming messages from host
  // ==========================================================
  handleClientIncoming(fromId, data) {
    if (data.type === 'setup_cards') {
      // Received setup cards from host
      Game.myId = Network.myId;

      // Reconstruct cards from ids
      this.setupCards = data.cards || [];
      this.setupSelected = [];
      this.setupIdeas = { weegschaal: 1, oog: 1, spiegel: 1, passer: 1, sfeer: 1 };
      this.selectedLevenswerk = null;

      // Reconstruct levenswerk options
      if (data.levenswerkOptions) {
        Game.levenswerkOptions[Network.myId] = data.levenswerkOptions
          .map(id => ALL_LEVENSWERK.find(lw => lw.id === id))
          .filter(Boolean);
      }

      document.getElementById('setup-levenswerk-section').style.display = '';
      document.getElementById('setup-subtitle').textContent = 'Kies kaarten, ideeën en levenswerk (totaal = 5)';
      document.getElementById('setup-waiting').classList.add('hidden');
      document.getElementById('btn-start-game').classList.remove('hidden');
      this.showScreen('setup');
      this.renderSetup();
    }

    if (data.type === 'game_start') {
      this.enterGameScreen();
    }

    if (data.type === 'game_over') {
      this.showEndScreen();
    }
  },

  // Client received state update
  onStateReceived() {
    if (Game.phase === 'playing') {
      if (document.getElementById('game-screen').classList.contains('hidden')) {
        this.enterGameScreen();
      } else {
        this.renderAll();
      }
    } else if (Game.phase === 'gameOver') {
      this.showEndScreen();
    }
  },

  // ==========================================================
  // HOST: Execute action on authoritative game state
  // ==========================================================
  executeAction(action, playerId) {
    switch (action.type) {
      case 'place_philosopher': {
        const card = Game.getPlayer(playerId).hand.find(c => c.id === action.cardId);
        if (card && Game.canPlacePhilosopher(card, action.row, playerId)) {
          Game.placePhilosopher(card, action.row, playerId);
        }
        break;
      }
      case 'lezen': {
        // Take ideas from library
        for (const pick of action.picks) {
          Game.takeFromLibrary(pick.index, pick.asType, playerId);
        }
        Game.activateBrownPowers('lezen', playerId);
        Game.useTurn(playerId);
        break;
      }
      case 'schrijven': {
        // Place books
        for (const cardId of action.bookTargets) {
          Game.placeBookOn(cardId, playerId);
        }
        Game.activateBrownPowers('schrijven', playerId);
        Game.useTurn(playerId);
        break;
      }
      case 'spreken': {
        // Draw cards
        for (const pick of action.picks) {
          if (pick.type === 'open') {
            Game.drawFromOpen(pick.index, playerId);
          } else {
            Game.drawFromDeck(playerId);
          }
        }
        Game.activateBrownPowers('spreken', playerId);
        Game.useTurn(playerId);
        break;
      }
    }
  },

  // ==========================================================
  // Send action to host (client) or execute locally (host/single)
  // ==========================================================
  sendAction(action) {
    if (Game.mode === 'single') {
      // Single player: execute immediately (legacy path)
      return;
    }
    if (Network.isHost) {
      // Host: execute on local state, broadcast
      this.executeAction(action, Game.myId);
      Network.broadcastState(Game.getState());
      if (Game.gameOver) {
        Network.broadcast({ type: 'game_over' });
        this.showEndScreen();
      }
      this.renderAll();
    } else {
      // Client: send to host, will receive state update
      Network.sendToHost({ type: 'action', action });
    }
  },

  // ==========================================================
  // SETUP PHASE
  // ==========================================================
  renderSetup() {
    this.renderSetupIdeas();
    this.renderSetupCards();
    this.renderLevenswerk();
    this.updateSetupButton();
  },

  renderSetupIdeas() {
    const container = document.getElementById('setup-idea-selectors');
    container.innerHTML = '';
    for (const type of IDEA_TYPES) {
      const div = document.createElement('div');
      const isKept = this.setupIdeas[type] > 0;
      div.className = 'idea-selector' + (isKept ? ' kept' : ' discarded');
      div.innerHTML = `
        <span class="idea-symbol" style="color: var(--${type})">${IDEA_SYMBOLS[type]}</span>
        <span class="idea-name">${IDEA_NAMES[type]}</span>
        <button class="idea-toggle" data-type="${type}">${isKept ? 'Houd' : 'Weg'}</button>
      `;
      container.appendChild(div);
    }
    document.getElementById('setup-ideas-count').textContent = this.getSetupIdeaTotal();
  },

  renderSetupCards() {
    const container = document.getElementById('setup-hand');
    container.innerHTML = '';
    for (const card of this.setupCards) {
      const el = this.createCardMini(card);
      if (this.setupSelected.includes(card.id)) {
        el.classList.add('selected');
      } else if (this.getSetupTotal() >= 5) {
        el.classList.add('unselected');
      }
      el.addEventListener('click', () => this.toggleSetupCard(card.id));
      container.appendChild(el);
    }
    document.getElementById('setup-cards-count').textContent = this.setupSelected.length;
  },

  getSetupIdeaTotal() {
    return Object.values(this.setupIdeas).reduce((a, b) => a + b, 0);
  },

  getSetupTotal() {
    return this.setupSelected.length + this.getSetupIdeaTotal();
  },

  toggleSetupCard(id) {
    if (this.setupSelected.includes(id)) {
      this.setupSelected = this.setupSelected.filter(x => x !== id);
    } else {
      if (this.getSetupTotal() < 5) {
        this.setupSelected.push(id);
      }
    }
    this.renderSetupCards();
    this.updateSetupButton();
  },

  updateSetupButton() {
    const btn = document.getElementById('btn-start-game');
    const total = this.getSetupTotal();
    const hasLevenswerk = !!this.selectedLevenswerk;
    const ready = total === 5 && hasLevenswerk;
    btn.disabled = !ready;
    if (!hasLevenswerk && total === 5) {
      btn.textContent = 'Kies nog een Levenswerk';
    } else if (total !== 5) {
      btn.textContent = `Nog ${5 - total} kaarten/ideeën kiezen`;
    } else {
      btn.textContent = Game.mode === 'multi' ? 'Klaar!' : 'Start het Spel!';
    }
  },

  renderLevenswerk() {
    const container = document.getElementById('setup-levenswerk');
    container.innerHTML = '';
    const myId = Game.myId || 'local';
    const options = Game.levenswerkOptions[myId] || [];
    for (const lw of options) {
      const div = document.createElement('div');
      div.className = 'levenswerk-option' + (this.selectedLevenswerk === lw.id ? ' selected' : '');
      div.innerHTML = `
        <div class="lw-name">${lw.naam}</div>
        <div class="lw-desc">${lw.beschrijving}</div>
      `;
      div.addEventListener('click', () => {
        this.selectedLevenswerk = lw.id;
        this.renderLevenswerk();
        this.updateSetupButton();
      });
      container.appendChild(div);
    }
  },

  startGame() {
    const selectedCards = this.setupCards.filter(c => this.setupSelected.includes(c.id));
    const myId = Game.myId || 'local';

    if (Game.mode === 'single') {
      // Single player: finish setup and start
      Game.finishSetup('local', selectedCards, { ...this.setupIdeas }, this.selectedLevenswerk);
      Game.startPlaying();
      this.enterGameScreen();
    } else {
      // Multiplayer: send setup to host or process locally if host
      if (Network.isHost) {
        Game.finishSetup(myId, selectedCards, { ...this.setupIdeas }, this.selectedLevenswerk);
        if (Game.allPlayersReady()) {
          Game.startPlaying();
          Network.broadcastState(Game.getState());
          Network.broadcast({ type: 'game_start' });
          this.enterGameScreen();
        } else {
          Network.broadcastState(Game.getState());
          // Show waiting state
          document.getElementById('btn-start-game').classList.add('hidden');
          document.getElementById('setup-waiting').classList.remove('hidden');
        }
      } else {
        // Client: send card IDs to host (cards serialize better as IDs)
        Network.sendToHost({
          type: 'setup_done',
          selectedCardIds: selectedCards.map(c => c.id),
          ideas: { ...this.setupIdeas },
          levenswerkId: this.selectedLevenswerk
        });
        document.getElementById('btn-start-game').classList.add('hidden');
        document.getElementById('setup-waiting').classList.remove('hidden');
      }
    }
  },

  // ==========================================================
  // ENTER GAME SCREEN
  // ==========================================================
  enterGameScreen() {
    this.viewingPlayer = null;
    this.cancelAction();
    this.showScreen('game');

    // Show/hide multiplayer elements
    const isMulti = Game.mode === 'multi';
    document.getElementById('turn-indicator').classList.toggle('hidden', !isMulti);
    document.getElementById('player-tabs').classList.toggle('hidden', !isMulti);
    document.getElementById('scoreboard-panel').classList.toggle('hidden', !isMulti);

    this.renderAll();
  },

  // ==========================================================
  // GAME RENDERING
  // ==========================================================
  renderAll() {
    this.renderTopBar();
    this.renderTurnIndicator();
    this.renderPlayerTabs();
    this.renderIdeas();
    this.renderLibrary();
    this.renderBooks();
    this.renderOpenCards();
    this.renderBoard();
    this.renderHand();
    this.renderLevenswerkPanel();
    this.renderScoreboard();
    this.updateLog();
    this.updateActionButtons();
  },

  getViewedPlayerId() {
    return this.viewingPlayer || Game.myId;
  },

  isViewingOwnBoard() {
    return !this.viewingPlayer || this.viewingPlayer === Game.myId;
  },

  renderTopBar() {
    document.getElementById('round-display').textContent = `${Game.round + 1}/4`;
    document.getElementById('round-name').textContent = ROUND_NAMES[Game.round] || '';

    const currentPlayer = Game.getCurrentPlayer();
    if (currentPlayer) {
      document.getElementById('turn-display').textContent =
        `${Game.turn + 1}/${TURNS_PER_ROUND[Game.round]}`;
      document.getElementById('cubes-display').textContent = currentPlayer.cubesLeft;
    }

    document.getElementById('deck-count').textContent = Game.deck.length;

    // Round goal
    const goal = Game.roundGoals[Game.round];
    if (goal) {
      document.getElementById('round-goal-display').textContent = goal.naam;
      document.getElementById('round-goal-display').title = goal.beschrijving;
    }

    // Score for viewed player
    const viewId = this.getViewedPlayerId();
    const score = Game.calculateScore(viewId);
    document.getElementById('score-display').textContent = score.total;
  },

  renderTurnIndicator() {
    if (Game.mode !== 'multi') return;
    const indicator = document.getElementById('turn-indicator');
    const textEl = document.getElementById('turn-indicator-text');
    indicator.classList.remove('hidden');

    if (Game.isMyTurn()) {
      indicator.className = 'my-turn';
      textEl.textContent = '🎯 Jouw beurt!';
    } else {
      indicator.className = 'other-turn';
      const name = Game.getPlayerName(Game.getCurrentPlayerId());
      textEl.textContent = `⏳ ${name} is aan de beurt...`;
    }
  },

  renderPlayerTabs() {
    if (Game.mode !== 'multi') return;
    const container = document.getElementById('player-tabs-list');
    container.innerHTML = '';

    for (const pid of Game.turnOrder) {
      const p = Game.players[pid];
      if (!p) continue;

      const isActive = this.getViewedPlayerId() === pid;
      const isCurrent = Game.getCurrentPlayerId() === pid;
      const score = Game.calculateScore(pid);

      const tab = document.createElement('button');
      tab.className = 'player-tab'
        + (isActive ? ' active' : '')
        + (isCurrent ? ' current-turn' : '');

      const isMe = pid === Game.myId;
      const nameLabel = isMe ? `${p.name || 'Jij'} (jij)` : (p.name || pid);

      tab.innerHTML = `
        <span>${nameLabel}</span>
        <span class="tab-score">${score.total} VP</span>
      `;
      tab.addEventListener('click', () => {
        this.viewingPlayer = pid === Game.myId ? null : pid;
        this.cancelAction();
        this.renderAll();
      });
      container.appendChild(tab);
    }
  },

  renderScoreboard() {
    if (Game.mode !== 'multi') return;
    const container = document.getElementById('scoreboard');
    container.innerHTML = '';

    const scores = Game.turnOrder.map(pid => ({
      pid,
      name: Game.getPlayerName(pid),
      score: Game.calculateScore(pid).total
    })).sort((a, b) => b.score - a.score);

    const topScore = scores.length > 0 ? scores[0].score : 0;

    for (const entry of scores) {
      const div = document.createElement('div');
      div.className = 'score-entry' + (entry.score === topScore && topScore > 0 ? ' leader' : '');
      div.innerHTML = `
        <span class="score-name">${entry.name}${entry.pid === Game.myId ? ' (jij)' : ''}</span>
        <span class="score-pts">${entry.score}</span>
      `;
      container.appendChild(div);
    }
  },

  updateActionButtons() {
    // Disable action buttons when not our turn or viewing another player
    const canAct = (Game.mode === 'single' || Game.isMyTurn())
      && this.isViewingOwnBoard()
      && !Game.gameOver
      && this.actionMode === null;

    const myPlayer = Game.getMyPlayer();
    const hasCubes = myPlayer && myPlayer.cubesLeft > 0;

    document.querySelector('.btn-lezen').disabled = !canAct || !hasCubes;
    document.querySelector('.btn-schrijven').disabled = !canAct || !hasCubes;
    document.querySelector('.btn-spreken').disabled = !canAct || !hasCubes;
  },

  renderIdeas() {
    const container = document.getElementById('idea-counts');
    container.innerHTML = '';
    const viewId = this.getViewedPlayerId();
    const p = Game.getPlayer(viewId);
    if (!p) return;

    for (const type of IDEA_TYPES) {
      const div = document.createElement('div');
      div.className = `idea-item ${type}`;
      div.innerHTML = `
        <span>${IDEA_SYMBOLS[type]}</span>
        <span class="count">${p.ideas[type]}</span>
      `;
      container.appendChild(div);
    }
  },

  renderLibrary() {
    const container = document.getElementById('library-dice');
    container.innerHTML = '';
    for (let i = 0; i < Game.library.length; i++) {
      const type = Game.library[i];
      const div = document.createElement('div');
      div.className = `die ${type}`;
      div.dataset.index = i;
      div.textContent = type === 'wild' ? '?' : IDEA_SYMBOLS[type];
      if (this.selectedDice.includes(i)) div.classList.add('selected');
      if (this.actionMode === 'pick_ideas') {
        div.addEventListener('click', () => this.clickDie(i));
      }
      container.appendChild(div);
    }
  },

  renderBooks() {
    const viewId = this.getViewedPlayerId();
    const p = Game.getPlayer(viewId);
    document.getElementById('books-on-board').textContent = p ? p.booksOnBoard : 0;
  },

  renderOpenCards() {
    const container = document.getElementById('open-cards');
    container.innerHTML = '';

    for (let i = 0; i < Game.openCards.length; i++) {
      const card = Game.openCards[i];
      const el = this.createCardMini(card);
      if (this.actionMode === 'pick_cards') {
        el.classList.add('highlight-pick');
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => this.pickOpenCard(i));
      } else {
        el.addEventListener('click', () => this.showCardDetail(card));
      }
      container.appendChild(el);
    }

    const deckBtn = document.getElementById('btn-draw-deck');
    deckBtn.style.display = this.actionMode === 'pick_cards' ? '' : 'none';
  },

  renderBoard() {
    const viewId = this.getViewedPlayerId();
    const p = Game.getPlayer(viewId);
    if (!p) return;

    for (const row of ['lezen', 'schrijven', 'spreken']) {
      const container = document.getElementById(`row-${row}`);
      container.innerHTML = '';
      const cards = p.board[row];

      for (let i = 0; i < 5; i++) {
        const slot = document.createElement('div');
        slot.className = 'board-slot';

        const costLabel = BOOK_COST_PER_COLUMN[i];
        if (i >= cards.length) {
          const costBadge = document.createElement('div');
          costBadge.className = 'slot-cost-badge';
          costBadge.textContent = costLabel > 0 ? `${costLabel}B` : '';
          slot.appendChild(costBadge);
        }

        if (i < cards.length) {
          const card = cards[i];
          slot.classList.add('filled');
          const cardEl = document.createElement('div');
          cardEl.className = `board-card power-bg-${card.kracht_type}`;
          cardEl.innerHTML = `
            <span class="card-vp">${card.vp}</span>
            <div class="card-traditie-badge traditie-${card.traditie || 'contemplatief'}">${TRADITIE_SYMBOLS[card.traditie] || ''}</div>
            <div class="card-name">${card.naam}</div>
            <div class="card-power-short"><span class="power-dot ${card.kracht_type}"></span>${this.shortPower(card.kracht)}</div>
            <div class="card-books-display">${this.renderBookSlots(card)}</div>
            ${card.tucked > 0 ? `<div class="tuck-count">${card.tucked} ref.</div>` : ''}
            ${card.cached > 0 ? `<div class="cache-count">${card.cached} opg.</div>` : ''}
          `;
          cardEl.addEventListener('click', () => this.showCardDetail(card));

          // Only allow book placement on own board
          if (this.isViewingOwnBoard()) {
            if (this.actionMode === 'place_books' && card.books < card.boek_capaciteit) {
              cardEl.classList.add('book-target');
              cardEl.addEventListener('click', (e) => {
                e.stopPropagation();
                this.placeBookOnCard(card.id);
              });
            }
            if (this.actionMode === 'remove_books' && card.books > 0) {
              cardEl.classList.add('book-remove-target');
              cardEl.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeBookFromCard(card);
              });
            }
          }

          slot.appendChild(cardEl);
        } else {
          slot.classList.add('empty');
          // Only show placement highlights on own board
          if (this.isViewingOwnBoard() && this.actionMode === 'placing' && this.selectedCard && i === cards.length) {
            const skill = ROW_TO_SKILL[row];
            if (this.selectedCard.vaardigheden.includes(skill) &&
                Game.canPlacePhilosopher(this.selectedCard, row, Game.myId)) {
              slot.classList.add('highlight');
              const costText = BOOK_COST_PER_COLUMN[i] > 0 ? ` (${BOOK_COST_PER_COLUMN[i]} boek)` : '';
              slot.title = `Plaats hier${costText}`;
              slot.addEventListener('click', () => this.confirmPlace(row));
            }
          }
        }

        container.appendChild(slot);
      }
    }
  },

  renderBookSlots(card) {
    let html = '';
    for (let i = 0; i < card.boek_capaciteit; i++) {
      if (i < card.books) {
        html += '<div class="book-icon">B</div>';
      } else {
        html += '<div class="book-slot-empty"></div>';
      }
    }
    return html;
  },

  shortPower(text) {
    let t = text.replace(/^(Tijdens de beurt|Bij Aanstelling|Tijdgeest|Einde van de ronde|Einde van het spel):\s*/i, '');
    if (t.length > 55) return t.substring(0, 52) + '...';
    return t;
  },

  renderHand() {
    const container = document.getElementById('hand-cards');
    container.innerHTML = '';

    // Always show own hand
    const myPlayer = Game.getMyPlayer();
    if (!myPlayer) return;

    document.getElementById('hand-count').textContent = `(${myPlayer.hand.length})`;

    for (const card of myPlayer.hand) {
      const el = this.createCardMini(card);

      if (this.discardMode) {
        el.classList.add('discard-target');
        el.addEventListener('click', () => this.discardCard(card));
      } else {
        const canAct = (Game.mode === 'single' || Game.isMyTurn())
          && this.isViewingOwnBoard()
          && !Game.gameOver
          && this.actionMode === null;
        const hasCubes = myPlayer.cubesLeft > 0;

        if (canAct && hasCubes) {
          el.addEventListener('click', () => this.startPlacing(card));
        } else {
          el.addEventListener('click', () => this.showCardDetail(card));
        }
      }

      container.appendChild(el);
    }
  },

  renderLevenswerkPanel() {
    const container = document.getElementById('levenswerk-display');
    if (!container) return;
    const viewId = this.getViewedPlayerId();
    const p = Game.getPlayer(viewId);
    if (!p || !p.levenswerk) {
      container.innerHTML = '<p style="color:var(--text-dim);font-size:12px">Geen gekozen</p>';
      return;
    }
    container.innerHTML = `
      <div class="lw-panel-card">
        <div class="lw-name">${p.levenswerk.naam}</div>
        <div class="lw-desc">${p.levenswerk.beschrijving}</div>
      </div>
    `;
  },

  // ==========================================================
  // CARD ELEMENT CREATION
  // ==========================================================
  createCardMini(card) {
    const div = document.createElement('div');
    div.className = 'card-mini';
    div.dataset.id = card.id;

    const costs = card.kosten.map(c =>
      `<span class="cost-symbol ${c}">${IDEA_SYMBOLS[c]}</span>`
    ).join('');

    const skills = card.vaardigheden.map(s =>
      `<span class="skill-badge ${s}">${s}</span>`
    ).join('');

    const traditieBadge = card.traditie
      ? `<span class="traditie-mini traditie-${card.traditie}" title="${TRADITIE_NAMES[card.traditie] || ''}">${TRADITIE_SYMBOLS[card.traditie] || ''}</span>`
      : '';

    // Book capacity as visual icons
    let bookIcons = '';
    for (let i = 0; i < card.boek_capaciteit; i++) {
      bookIcons += '<span class="book-cap-icon">📖</span>';
    }

    div.innerHTML = `
      <span class="card-vp">${card.vp}</span>
      ${traditieBadge}
      <div class="card-skills">${skills}</div>
      <div class="card-name">${card.naam}</div>
      <div class="card-stroming">${card.stroming || ''}</div>
      <div class="card-costs">${costs || '<span style="color:var(--green);font-size:10px">Gratis</span>'}</div>
      <div class="card-power"><span class="power-dot ${card.kracht_type}"></span>${card.kracht}</div>
      <div class="card-bottom-row">
        <span class="card-books-info">${bookIcons || '—'}</span>
      </div>
    `;
    return div;
  },

  formatDate(year) {
    if (year === null || year === undefined) return 'heden';
    if (year < 0) return `${Math.abs(year)} v.Chr.`;
    return year.toString();
  },

  // ==========================================================
  // CARD DETAIL MODAL
  // ==========================================================
  showCardDetail(card) {
    if (this.actionMode === 'place_books' || this.actionMode === 'remove_books') return;

    const modal = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');

    const costs = card.kosten.map(c =>
      `<span class="cost-symbol ${c}" style="width:24px;height:24px;font-size:14px">${IDEA_SYMBOLS[c]}</span>`
    ).join('');

    const skills = card.vaardigheden.map(s =>
      `<span class="skill-badge ${s}" style="font-size:14px;padding:3px 8px">${s === 'L' ? 'Lezen' : s === 'S' ? 'Schrijven' : 'Spreken'}</span>`
    ).join(' ');

    const powerLabels = {
      bruin: 'Tijdens de beurt',
      roze: 'Tijdgeest',
      wit: 'Bij Aanstelling',
      groenblauw: 'Einde van de ronde',
      geel: 'Einde van het spel'
    };

    const traditieName = card.traditie ? (TRADITIE_NAMES[card.traditie] + ' ' + TRADITIE_SYMBOLS[card.traditie]) : '';

    content.innerHTML = `
      <div class="modal-card-detail">
        <div class="card-name" style="font-size:22px;font-family:Merriweather,serif;color:var(--bg-dark)">${card.naam}</div>
        <div style="color:var(--text-light);margin-top:2px">${this.formatDate(card.geboren)} - ${this.formatDate(card.overleden)}</div>
        <div style="color:var(--gold);font-style:italic;margin-top:2px">${card.stroming || ''}</div>
        ${traditieName ? `<div class="modal-traditie"><span class="traditie-badge traditie-${card.traditie}">${traditieName}</span></div>` : ''}
        <div style="margin:10px 0">${skills}</div>
        <div style="display:flex;gap:6px;margin:8px 0">${costs || '<span style="color:var(--green);font-weight:600">Gratis</span>'}</div>
        <div style="margin:6px 0;color:var(--text)">
          <strong>VP:</strong> ${card.vp} &nbsp;
          <strong>Boek-capaciteit:</strong> ${card.boek_capaciteit} &nbsp;
          ${card.invloed ? `<strong>Invloed:</strong> ${card.invloed}` : ''}
        </div>
        <div style="margin-top:10px;padding:10px;background:white;border-radius:8px;border:1px solid #ece4d4">
          <span class="power-dot ${card.kracht_type}"></span>
          <strong>${powerLabels[card.kracht_type] || card.kracht_type}:</strong> ${card.kracht}
        </div>
        ${card.citaat ? `<div style="font-style:italic;color:var(--text-dim);margin-top:10px;border-left:3px solid var(--gold);padding-left:10px">"${card.citaat}"</div>` : ''}
        ${card.books !== undefined ? `
          <div style="margin-top:12px;padding-top:10px;border-top:1px solid #ece4d4">
            <strong>Boeken:</strong> ${card.books}/${card.boek_capaciteit} &nbsp;
            <strong>Referenties:</strong> ${card.tucked || 0} &nbsp;
            <strong>Opgeslagen:</strong> ${card.cached || 0}
          </div>
        ` : ''}
      </div>
    `;

    modal.classList.remove('hidden');
  },

  hideModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
  },

  // ==========================================================
  // ACTIONS - PLACE PHILOSOPHER
  // ==========================================================
  startPlacing(card) {
    const myPlayer = Game.getMyPlayer();
    if (!myPlayer || myPlayer.cubesLeft <= 0) return;
    if (Game.mode === 'multi' && !Game.isMyTurn()) return;

    this.actionMode = 'placing';
    this.selectedCard = card;

    const costText = card.kosten.length > 0
      ? card.kosten.map(c => IDEA_SYMBOLS[c]).join(' ')
      : 'Gratis';

    // Check if 2:1 trade is needed
    let tradeHint = '';
    if (card.kosten.length > 0) {
      const costCount = {};
      for (const c of card.kosten) costCount[c] = (costCount[c] || 0) + 1;
      let deficit = 0;
      for (const type of IDEA_TYPES) {
        const needed = costCount[type] || 0;
        const have = myPlayer.ideas[type];
        if (have < needed) deficit += (needed - have);
      }
      if (deficit > 0) {
        tradeHint = ` <span style="color:var(--orange);font-size:12px">(2:1 ruil: ${deficit * 2} extra ideeën nodig)</span>`;
      }
    }

    this.showActionBar(`<strong>${card.naam}</strong> aanstellen &mdash; Kosten: ${costText}${tradeHint}. Klik op een lege plek in een rij.`);
    this.renderBoard();
    this.renderHand();
  },

  confirmPlace(row) {
    const card = this.selectedCard;
    if (!card) return;
    if (!Game.canPlacePhilosopher(card, row, Game.myId)) {
      Game.addLog(`Kan ${card.naam} niet plaatsen: onvoldoende middelen`, 'spend');
      return;
    }

    if (Game.mode === 'single') {
      Game.placePhilosopher(card, row, 'local');
      this.cancelAction();
      this.checkGameOver();
      this.renderAll();
    } else {
      // Multiplayer: send action
      this.sendAction({
        type: 'place_philosopher',
        cardId: card.id,
        row
      });
      this.cancelAction();
      // For host: renderAll was called in sendAction
      // For client: will get state update
      if (!Network.isHost) {
        this.cancelAction();
      }
    }
  },

  // ==========================================================
  // ACTIONS - LEZEN (Gain Ideas)
  // ==========================================================
  startLezen() {
    const myPlayer = Game.getMyPlayer();
    if (!myPlayer || myPlayer.cubesLeft <= 0) return;
    if (Game.mode === 'multi' && !Game.isMyTurn()) return;

    const benefit = Game.getRowBenefit('lezen', Game.myId);
    this.currentRow = 'lezen';
    this.actionMode = 'pick_ideas';
    this.ideasToTake = benefit.ideas;
    this.conversionAvailable = benefit.conversion;
    this.conversionType = 'card_to_idea';
    this.selectedDice = [];
    this._lezenPicks = [];   // Track picks for multiplayer
    this.showActionBar(`<strong>Lezen:</strong> Kies ${this.ideasToTake} idee(ën) uit de Bibliotheek.`);
    this.renderAll();
  },

  clickDie(index) {
    if (this.actionMode !== 'pick_ideas') return;
    const dieType = Game.library[index];

    if (this.selectedDice.includes(index)) {
      this.selectedDice = this.selectedDice.filter(i => i !== index);
      this._lezenPicks = (this._lezenPicks || []).filter(p => p.index !== index);
      this.renderLibrary();
      return;
    }

    if (this.selectedDice.length >= this.ideasToTake) return;

    if (dieType === 'wild') {
      this.pendingWildIndex = index;
      this.showWildChoice();
      return;
    }

    this.selectedDice.push(index);
    if (!this._lezenPicks) this._lezenPicks = [];
    this._lezenPicks.push({ index, asType: dieType });

    if (this.selectedDice.length >= this.ideasToTake) {
      this.confirmIdeas();
    } else {
      this.showActionBar(`<strong>Lezen:</strong> Kies nog ${this.ideasToTake - this.selectedDice.length} idee(ën).`);
      this.renderLibrary();
    }
  },

  showWildChoice() {
    const bar = document.getElementById('action-bar-content');
    bar.innerHTML = `<strong>Kies een idee-type voor de joker:</strong> ` +
      IDEA_TYPES.map(t =>
        `<button class="choice-btn" onclick="UI.resolveWild('${t}')">${IDEA_SYMBOLS[t]} ${IDEA_NAMES[t]}</button>`
      ).join(' ');
  },

  resolveWild(type) {
    const idx = this.pendingWildIndex;
    this.selectedDice.push(idx);
    if (!this._lezenPicks) this._lezenPicks = [];
    this._lezenPicks.push({ index: idx, asType: type });

    if (this.selectedDice.length >= this.ideasToTake) {
      this.confirmIdeas();
    } else {
      this.showActionBar(`<strong>Lezen:</strong> Kies nog ${this.ideasToTake - this.selectedDice.length} idee(ën).`);
      this.renderLibrary();
    }
  },

  confirmIdeas() {
    if (Game.mode === 'single') {
      for (const idx of this.selectedDice) {
        const type = Game.library[idx];
        const actualType = (type === 'wild') ? Game.bestIdeaType('local') : type;
        Game.takeFromLibrary(idx, actualType, 'local');
      }
      this.selectedDice = [];

      // Check for conversion
      const myPlayer = Game.getMyPlayer();
      if (this.conversionAvailable && myPlayer && myPlayer.hand.length > 0) {
        this.offerConversion('card_to_idea');
      } else {
        this.finishRowAction('lezen');
      }
    } else {
      // Multiplayer: send all picks as one action
      this.sendAction({
        type: 'lezen',
        picks: this._lezenPicks || []
      });
      this._lezenPicks = [];
      this.selectedDice = [];
      this.cancelAction();
    }
  },

  // ==========================================================
  // ACTIONS - SCHRIJVEN (Place Books)
  // ==========================================================
  startSchrijven() {
    const myPlayer = Game.getMyPlayer();
    if (!myPlayer || myPlayer.cubesLeft <= 0) return;
    if (Game.mode === 'multi' && !Game.isMyTurn()) return;

    const benefit = Game.getRowBenefit('schrijven', Game.myId);
    this.currentRow = 'schrijven';

    const allCards = Game.getAllBoardCards(Game.myId);
    const canReceive = allCards.filter(c => c.books < c.boek_capaciteit);

    if (canReceive.length === 0) {
      Game.addLog('Geen filosoof kan nog boeken ontvangen', 'spend');
      if (Game.mode === 'single') {
        Game.activateBrownPowers('schrijven', 'local');
        Game.useTurn('local');
        this.cancelAction();
        this.checkGameOver();
        this.renderAll();
      } else {
        this.sendAction({ type: 'schrijven', bookTargets: [] });
        this.cancelAction();
      }
      return;
    }

    this.booksToPlace = Math.min(benefit.books, canReceive.length);
    this.conversionAvailable = benefit.conversion;
    this.conversionType = 'idea_to_book';
    this.actionMode = 'place_books';
    this._schrijvenTargets = [];  // Track targets for multiplayer
    this.showActionBar(`<strong>Schrijven:</strong> Plaats ${this.booksToPlace} boek(en) op je filosofen.`);
    this.renderAll();
  },

  placeBookOnCard(cardId) {
    if (this.actionMode !== 'place_books') return;

    if (Game.mode === 'single') {
      if (Game.placeBookOn(cardId, 'local')) {
        Game.addLog('+1 boek geplaatst', 'gain');
        this.booksToPlace--;
        if (this.booksToPlace <= 0) {
          const myPlayer = Game.getMyPlayer();
          if (this.conversionAvailable && Game.getTotalIdeas(Game.myId) > 0) {
            const canReceive = Game.getAllBoardCards(Game.myId).filter(c => c.books < c.boek_capaciteit);
            if (canReceive.length > 0) {
              this.offerConversion('idea_to_book');
              return;
            }
          }
          this.finishRowAction('schrijven');
        } else {
          this.showActionBar(`<strong>Schrijven:</strong> Plaats nog ${this.booksToPlace} boek(en).`);
        }
        this.renderAll();
      }
    } else {
      // Multiplayer: collect book targets
      if (!this._schrijvenTargets) this._schrijvenTargets = [];
      this._schrijvenTargets.push(cardId);
      this.booksToPlace--;
      this.showActionBar(`<strong>Schrijven:</strong> Plaats nog ${this.booksToPlace} boek(en).`);
      // Visual feedback: update locally
      this.renderAll();

      if (this.booksToPlace <= 0) {
        this.sendAction({
          type: 'schrijven',
          bookTargets: this._schrijvenTargets
        });
        this._schrijvenTargets = [];
        this.cancelAction();
      }
    }
  },

  // ==========================================================
  // ACTIONS - SPREKEN (Draw Cards)
  // ==========================================================
  startSpreken() {
    const myPlayer = Game.getMyPlayer();
    if (!myPlayer || myPlayer.cubesLeft <= 0) return;
    if (Game.mode === 'multi' && !Game.isMyTurn()) return;

    const benefit = Game.getRowBenefit('spreken', Game.myId);
    this.currentRow = 'spreken';
    this.cardsToTake = benefit.cards;
    this.conversionAvailable = benefit.conversion;
    this.conversionType = 'book_to_card';
    this.actionMode = 'pick_cards';
    this._sprekenPicks = [];  // Track picks for multiplayer
    this.showActionBar(`<strong>Spreken:</strong> Trek ${this.cardsToTake} kaart(en) uit de open rij of van de stapel.`);
    this.renderAll();
  },

  pickOpenCard(index) {
    if (this.actionMode !== 'pick_cards') return;

    if (Game.mode === 'single') {
      const card = Game.drawFromOpen(index, 'local');
      if (card) {
        Game.addLog(`${card.naam} getrokken (open)`, 'gain');
        this.cardsToTake--;
        this.renderAll();
        if (this.cardsToTake <= 0) {
          this.afterCardsDone();
        } else {
          this.showActionBar(`<strong>Spreken:</strong> Trek nog ${this.cardsToTake} kaart(en).`);
        }
      }
    } else {
      // Multiplayer: collect picks
      if (!this._sprekenPicks) this._sprekenPicks = [];
      this._sprekenPicks.push({ type: 'open', index });
      this.cardsToTake--;
      if (this.cardsToTake <= 0) {
        this.sendAction({
          type: 'spreken',
          picks: this._sprekenPicks
        });
        this._sprekenPicks = [];
        this.cancelAction();
      } else {
        this.showActionBar(`<strong>Spreken:</strong> Trek nog ${this.cardsToTake} kaart(en).`);
      }
    }
  },

  drawFromDeckAction() {
    if (this.actionMode !== 'pick_cards') return;

    if (Game.mode === 'single') {
      const card = Game.drawFromDeck('local');
      if (card) {
        Game.addLog(`${card.naam} getrokken (stapel)`, 'gain');
        this.cardsToTake--;
        this.renderAll();
        if (this.cardsToTake <= 0) {
          this.afterCardsDone();
        } else {
          this.showActionBar(`<strong>Spreken:</strong> Trek nog ${this.cardsToTake} kaart(en).`);
        }
      }
    } else {
      // Multiplayer: collect picks
      if (!this._sprekenPicks) this._sprekenPicks = [];
      this._sprekenPicks.push({ type: 'deck' });
      this.cardsToTake--;
      if (this.cardsToTake <= 0) {
        this.sendAction({
          type: 'spreken',
          picks: this._sprekenPicks
        });
        this._sprekenPicks = [];
        this.cancelAction();
      } else {
        this.showActionBar(`<strong>Spreken:</strong> Trek nog ${this.cardsToTake} kaart(en).`);
      }
    }
  },

  afterCardsDone() {
    // Single player conversion
    const myPlayer = Game.getMyPlayer();
    if (this.conversionAvailable && myPlayer && myPlayer.booksOnBoard > 0) {
      this.offerConversion('book_to_card');
    } else {
      this.finishRowAction('spreken');
    }
  },

  // ==========================================================
  // CONVERSION SYSTEM (single player only - multiplayer handles server-side)
  // ==========================================================
  offerConversion(type) {
    this.actionMode = 'offer_conversion';
    let html = '';
    if (type === 'card_to_idea') {
      html = `<strong>Bonus:</strong> Wil je 1 kaart uit je hand inleveren voor +1 idee?
        <button class="btn btn-small btn-yes" onclick="UI.acceptConversion('card_to_idea')">Ja</button>
        <button class="btn btn-small btn-no" onclick="UI.declineConversion()">Nee</button>`;
    } else if (type === 'idea_to_book') {
      html = `<strong>Bonus:</strong> Wil je 1 idee betalen voor +1 boek?
        <button class="btn btn-small btn-yes" onclick="UI.acceptConversion('idea_to_book')">Ja</button>
        <button class="btn btn-small btn-no" onclick="UI.declineConversion()">Nee</button>`;
    } else if (type === 'book_to_card') {
      html = `<strong>Bonus:</strong> Wil je 1 boek inleveren voor +1 kaart?
        <button class="btn btn-small btn-yes" onclick="UI.acceptConversion('book_to_card')">Ja</button>
        <button class="btn btn-small btn-no" onclick="UI.declineConversion()">Nee</button>`;
    }
    this.showActionBar(html);
  },

  acceptConversion(type) {
    if (type === 'card_to_idea') {
      this.actionMode = 'discard_for_idea';
      this.discardMode = true;
      this.showActionBar('<strong>Kies een kaart uit je hand om in te leveren voor +1 idee.</strong>');
      this.renderHand();
    } else if (type === 'idea_to_book') {
      this.showIdeaPayChoice();
    } else if (type === 'book_to_card') {
      this.actionMode = 'remove_books';
      this.booksToRemove = 1;
      this.showActionBar('<strong>Klik op een boek om in te leveren voor +1 kaart.</strong>');
      this.renderBoard();
    }
  },

  declineConversion() {
    this.finishRowAction(this.currentRow);
  },

  discardCard(card) {
    if (this.actionMode !== 'discard_for_idea') return;
    const myPlayer = Game.getMyPlayer();
    if (!myPlayer) return;
    myPlayer.hand = myPlayer.hand.filter(c => c.id !== card.id);
    Game.addLog(`${card.naam} ingeleverd`, 'spend');
    this.discardMode = false;

    this.actionMode = 'pick_ideas';
    this.ideasToTake = 1;
    this.conversionAvailable = false;
    this.selectedDice = [];
    this.showActionBar('<strong>Bonus:</strong> Kies 1 idee uit de Bibliotheek.');
    this.renderAll();
  },

  showIdeaPayChoice() {
    const myPlayer = Game.getMyPlayer();
    if (!myPlayer) return;
    const types = IDEA_TYPES.filter(t => myPlayer.ideas[t] > 0);
    const bar = document.getElementById('action-bar-content');
    bar.innerHTML = `<strong>Welk idee betaal je?</strong> ` +
      types.map(t =>
        `<button class="choice-btn" onclick="UI.payIdeaForBook('${t}')">${IDEA_SYMBOLS[t]} ${IDEA_NAMES[t]} (${myPlayer.ideas[t]})</button>`
      ).join(' ');
  },

  payIdeaForBook(type) {
    const myPlayer = Game.getMyPlayer();
    if (!myPlayer) return;
    myPlayer.ideas[type]--;
    Game.addLog(`-1 ${IDEA_NAMES[type]} (conversie)`, 'spend');

    this.actionMode = 'place_books';
    this.booksToPlace = 1;
    this.conversionAvailable = false;
    this.showActionBar('<strong>Bonus:</strong> Plaats 1 extra boek op een filosoof.');
    this.renderAll();
  },

  removeBookFromCard(card) {
    if (card.books <= 0) return;
    const myPlayer = Game.getMyPlayer();
    if (!myPlayer) return;
    card.books--;
    myPlayer.booksOnBoard--;
    Game.addLog('-1 boek ingeleverd (conversie)', 'spend');

    this.actionMode = 'pick_cards';
    this.cardsToTake = 1;
    this.conversionAvailable = false;
    this.showActionBar('<strong>Bonus:</strong> Trek 1 kaart (open rij of stapel).');
    this.renderAll();
  },

  // ==========================================================
  // FINISH ROW ACTION (single player)
  // ==========================================================
  finishRowAction(row) {
    Game.activateBrownPowers(row, Game.myId);
    Game.useTurn(Game.myId);
    this.cancelAction();
    this.checkGameOver();
    this.renderAll();
  },

  // ==========================================================
  // ACTION BAR
  // ==========================================================
  showActionBar(html) {
    const bar = document.getElementById('action-bar');
    const content = document.getElementById('action-bar-content');
    bar.classList.remove('hidden');
    content.innerHTML = html;
    document.getElementById('game-log').classList.add('has-action-bar');
  },

  hideActionBar() {
    document.getElementById('action-bar').classList.add('hidden');
    document.getElementById('game-log').classList.remove('has-action-bar');
  },

  cancelAction() {
    this.actionMode = null;
    this.selectedCard = null;
    this.selectedDice = [];
    this.ideasToTake = 0;
    this.booksToPlace = 0;
    this.cardsToTake = 0;
    this.conversionAvailable = false;
    this.conversionType = null;
    this.currentRow = null;
    this.discardMode = false;
    this._lezenPicks = [];
    this._schrijvenPicks = [];
    this._sprekenPicks = [];
    this.hideActionBar();
  },

  // ==========================================================
  // HELP PANEL
  // ==========================================================
  showHelp(topic) {
    const overlay = document.getElementById('help-overlay');
    const content = document.getElementById('help-content');
    const data = HELP_DATA[topic || 'overzicht'];
    if (!data) return;

    content.innerHTML = `<h2>${data.titel}</h2>${data.tekst}`;
    overlay.classList.remove('hidden');

    document.querySelectorAll('.help-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.topic === (topic || 'overzicht'));
    });
  },

  hideHelp() {
    document.getElementById('help-overlay').classList.add('hidden');
  },

  // ==========================================================
  // GAME OVER
  // ==========================================================
  checkGameOver() {
    if (Game.gameOver) {
      this.showEndScreen();
    }
  },

  showEndScreen() {
    const container = document.getElementById('final-score-breakdown');

    if (Game.mode === 'multi') {
      // Multiplayer: show all players ranked
      const results = Game.turnOrder.map(pid => ({
        pid,
        name: Game.getPlayerName(pid),
        score: Game.calculateScore(pid),
        isMe: pid === Game.myId
      })).sort((a, b) => b.score.total - a.score.total);

      let html = '<div class="player-scores">';
      results.forEach((r, idx) => {
        const rank = idx + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
        const winnerClass = rank === 1 ? ' winner' : '';
        const meLabel = r.isMe ? ' (jij)' : '';
        html += `
          <div class="end-player-score${winnerClass}">
            <span class="end-rank">${medal}</span>
            <span class="end-name">${r.name}${meLabel}</span>
            <span class="end-total">${r.score.total} VP</span>
          </div>
        `;
      });
      html += '</div>';

      // Show own detailed breakdown
      const myScore = Game.calculateScore(Game.myId);
      const myPlayer = Game.getMyPlayer();
      const lw = myPlayer ? myPlayer.levenswerk : null;
      const lwText = lw ? `${lw.naam}` : 'Geen';

      html += '<h2 style="margin:20px 0 12px;font-size:18px;color:var(--bg-dark)">Jouw Score</h2>';
      html += `
        <div class="score-row"><span class="score-label">Filosofen (VP)</span><span class="score-value">${myScore.philosopherVP}</span></div>
        <div class="score-row"><span class="score-label">Boeken</span><span class="score-value">${myScore.bookVP}</span></div>
        <div class="score-row"><span class="score-label">Referenties</span><span class="score-value">${myScore.tuckVP}</span></div>
        <div class="score-row"><span class="score-label">Opgeslagen ideeën</span><span class="score-value">${myScore.cachedVP}</span></div>
        <div class="score-row"><span class="score-label">Rondedoelen</span><span class="score-value">${myScore.roundGoalVP}</span></div>
        <div class="score-row"><span class="score-label">Levenswerk (${lwText})</span><span class="score-value">${myScore.levenswerkVP}</span></div>
        <div class="score-row"><span class="score-label">Eindspel-krachten</span><span class="score-value">${myScore.gameEndVP}</span></div>
        <div class="score-row total"><span class="score-label">TOTAAL</span><span class="score-value">${myScore.total} VP</span></div>
      `;

      container.innerHTML = html;
    } else {
      // Single player
      const score = Game.calculateScore('local');
      const myPlayer = Game.getPlayer('local');
      const lw = myPlayer ? myPlayer.levenswerk : null;
      const lwText = lw ? `${lw.naam}: ${lw.beschrijving}` : 'Geen';

      container.innerHTML = `
        <div class="score-row"><span class="score-label">Filosofen (VP)</span><span class="score-value">${score.philosopherVP}</span></div>
        <div class="score-row"><span class="score-label">Boeken</span><span class="score-value">${score.bookVP}</span></div>
        <div class="score-row"><span class="score-label">Referenties</span><span class="score-value">${score.tuckVP}</span></div>
        <div class="score-row"><span class="score-label">Opgeslagen ideeën</span><span class="score-value">${score.cachedVP}</span></div>
        <div class="score-row"><span class="score-label">Rondedoelen</span><span class="score-value">${score.roundGoalVP}</span></div>
        <div class="score-row"><span class="score-label">Levenswerk (${lwText})</span><span class="score-value">${score.levenswerkVP}</span></div>
        <div class="score-row"><span class="score-label">Eindspel-krachten</span><span class="score-value">${score.gameEndVP}</span></div>
        <div class="score-row total"><span class="score-label">TOTAAL</span><span class="score-value">${score.total} VP</span></div>
      `;
    }
    this.showScreen('end');
  },

  // ==========================================================
  // LOG
  // ==========================================================
  updateLog() {
    const container = document.getElementById('log-entries');
    if (!container) return;
    const last20 = Game.log.slice(-20);
    container.innerHTML = last20.map(e =>
      `<div class="log-entry ${e.type}">${e.msg}</div>`
    ).join('');
    container.scrollTop = container.scrollHeight;
  },

  // ==========================================================
  // EVENTS
  // ==========================================================
  bindEvents() {
    // === LOBBY ===
    document.getElementById('btn-single').addEventListener('click', () => this.selectSinglePlayer());
    document.getElementById('btn-multi').addEventListener('click', () => this.selectMultiplayer());
    document.getElementById('btn-back-to-modes').addEventListener('click', () => this.backToModes());
    document.getElementById('btn-create-room').addEventListener('click', () => this.createRoom());
    document.getElementById('btn-join-room').addEventListener('click', () => this.joinRoom());
    document.getElementById('btn-copy-code').addEventListener('click', () => this.copyRoomCode());
    document.getElementById('btn-start-multi').addEventListener('click', () => this.startMultiplayerGame());
    document.getElementById('btn-leave-room').addEventListener('click', () => this.leaveRoom());
    document.getElementById('btn-error-back').addEventListener('click', () => this.backToModes());

    // Enter key to join room
    document.getElementById('join-code').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.joinRoom();
    });
    document.getElementById('player-name').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') document.getElementById('btn-create-room').focus();
    });

    // === SETUP ===
    document.getElementById('setup-idea-selectors').addEventListener('click', (e) => {
      const btn = e.target.closest('.idea-toggle');
      if (!btn) return;
      const type = btn.dataset.type;
      if (!type) return;
      // Toggle: 1 → 0 or 0 → 1 (max 1 per type)
      if (this.setupIdeas[type] > 0) {
        this.setupIdeas[type] = 0;
      } else {
        if (this.getSetupTotal() < 5) {
          this.setupIdeas[type] = 1;
        }
      }
      this.renderSetup();
    });

    document.getElementById('btn-start-game').addEventListener('click', () => this.startGame());

    // === GAME ACTIONS ===
    document.querySelector('.btn-lezen').addEventListener('click', () => {
      if (this.actionMode === null && !Game.gameOver) this.startLezen();
    });
    document.querySelector('.btn-schrijven').addEventListener('click', () => {
      if (this.actionMode === null && !Game.gameOver) this.startSchrijven();
    });
    document.querySelector('.btn-spreken').addEventListener('click', () => {
      if (this.actionMode === null && !Game.gameOver) this.startSpreken();
    });

    document.getElementById('btn-draw-deck').addEventListener('click', () => {
      this.drawFromDeckAction();
    });

    document.getElementById('btn-cancel-action').addEventListener('click', () => {
      this.cancelAction();
      this.renderAll();
    });

    // === MODAL ===
    document.getElementById('modal-close').addEventListener('click', () => this.hideModal());
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal-overlay')) this.hideModal();
    });

    // === HELP ===
    document.getElementById('btn-help').addEventListener('click', () => this.showHelp('overzicht'));
    document.querySelectorAll('.help-tab').forEach(tab => {
      tab.addEventListener('click', () => this.showHelp(tab.dataset.topic));
    });
    document.getElementById('help-close').addEventListener('click', () => this.hideHelp());
    document.getElementById('help-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('help-overlay')) this.hideHelp();
    });

    // === NEW GAME ===
    document.getElementById('btn-new-game').addEventListener('click', () => {
      Network.destroy();
      this.setupCards = [];
      this.setupSelected = [];
      this.setupIdeas = { weegschaal: 1, oog: 1, spiegel: 1, passer: 1, sfeer: 1 };
      this.selectedLevenswerk = null;
      this.viewingPlayer = null;
      document.getElementById('setup-levenswerk-section').style.display = 'none';
      document.getElementById('mode-select').classList.remove('hidden');
      document.getElementById('multi-options').classList.add('hidden');
      document.getElementById('waiting-room').classList.add('hidden');
      document.getElementById('connection-error').classList.add('hidden');
      this.showScreen('lobby');
    });
  }
};

// ============================================================
// START
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  UI.init();
});
