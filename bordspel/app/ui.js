// ============================================================
// DE ACADEMIE - UI Layer
// ============================================================

const UI = {
  setupCards: [],      // cards available during setup
  setupSelected: [],   // selected card ids
  setupIdeas: { weegschaal: 0, oog: 0, spiegel: 0, passer: 0, sfeer: 0 },

  // Action state
  actionMode: null,    // null, 'pick_ideas', 'place_books', 'pick_cards'
  ideasToTake: 0,
  booksToPlace: 0,
  cardsToTake: 0,
  canTakeFromOpen: false,
  selectedDice: [],

  init() {
    this.setupCards = Game.init();
    this.bindEvents();
    this.showScreen('setup');
    this.renderSetup();
  },

  // ==========================================================
  // SCREENS
  // ==========================================================
  showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(name + '-screen').classList.remove('hidden');
  },

  // ==========================================================
  // SETUP
  // ==========================================================
  renderSetup() {
    this.renderSetupIdeas();
    this.renderSetupCards();
    this.updateSetupButton();
  },

  renderSetupIdeas() {
    const container = document.getElementById('setup-idea-selectors');
    container.innerHTML = '';
    for (const type of IDEA_TYPES) {
      const div = document.createElement('div');
      div.className = 'idea-selector';
      div.innerHTML = `
        <span class="idea-symbol" style="color: var(--${type})">${IDEA_SYMBOLS[type]}</span>
        <span class="idea-name">${IDEA_NAMES[type]}</span>
        <button class="idea-minus" data-type="${type}">-</button>
        <span class="idea-count" id="setup-idea-${type}">${this.setupIdeas[type]}</span>
        <button class="idea-plus" data-type="${type}">+</button>
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
    btn.disabled = total !== 5;
    btn.textContent = total === 5 ? 'Start het Spel' : `Nog ${5 - total} kiezen`;
  },

  startGame() {
    const selectedCards = this.setupCards.filter(c => this.setupSelected.includes(c.id));
    Game.finishSetup(selectedCards, { ...this.setupIdeas });
    this.showScreen('game');
    this.renderAll();
  },

  // ==========================================================
  // GAME RENDERING
  // ==========================================================
  renderAll() {
    this.renderTopBar();
    this.renderIdeas();
    this.renderLibrary();
    this.renderBooks();
    this.renderOpenCards();
    this.renderBoard();
    this.renderHand();
    this.updateLog();
  },

  renderTopBar() {
    document.getElementById('round-display').textContent = `${Game.round + 1}/4`;
    document.getElementById('round-name').textContent = ROUND_NAMES[Game.round] || '';
    document.getElementById('turn-display').textContent = `${Game.turn + 1}/${TURNS_PER_ROUND[Game.round]}`;
    document.getElementById('cubes-display').textContent = Game.cubesLeft;
    document.getElementById('deck-count').textContent = Game.deck.length;
    const score = Game.calculateScore();
    document.getElementById('score-display').textContent = score.total;
  },

  renderIdeas() {
    const container = document.getElementById('idea-counts');
    container.innerHTML = '';
    for (const type of IDEA_TYPES) {
      const div = document.createElement('div');
      div.className = `idea-item ${type}`;
      div.innerHTML = `
        <span>${IDEA_SYMBOLS[type]}</span>
        <span class="count">${Game.player.ideas[type]}</span>
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
      if (this.selectedDice.includes(i)) {
        div.classList.add('selected');
      }
      if (this.actionMode === 'pick_ideas') {
        div.addEventListener('click', () => this.clickDie(i));
      }
      container.appendChild(div);
    }
  },

  renderBooks() {
    document.getElementById('books-on-board').textContent = Game.player.booksOnBoard;
  },

  renderOpenCards() {
    const container = document.getElementById('open-cards');
    container.innerHTML = '';
    for (let i = 0; i < Game.openCards.length; i++) {
      const card = Game.openCards[i];
      const el = this.createCardMini(card);
      if (this.actionMode === 'pick_cards' && this.canTakeFromOpen) {
        el.classList.add('highlight-pick');
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => this.pickOpenCard(i));
      } else {
        el.addEventListener('click', () => this.showCardDetail(card));
      }
      container.appendChild(el);
    }
  },

  renderBoard() {
    for (const row of ['lezen', 'schrijven', 'spreken']) {
      const container = document.getElementById(`row-${row}`);
      container.innerHTML = '';
      const cards = Game.player.board[row];

      for (let i = 0; i < 5; i++) {
        const slot = document.createElement('div');
        slot.className = 'board-slot';

        if (i < cards.length) {
          const card = cards[i];
          slot.classList.add('filled');
          const cardEl = document.createElement('div');
          cardEl.className = 'board-card';
          cardEl.innerHTML = `
            <span class="card-vp">${card.vp}</span>
            <div class="card-name">${card.naam}</div>
            <div class="card-power-short"><span class="power-type ${card.kracht_type}"></span>${this.shortPower(card.kracht)}</div>
            <div class="card-books-display">
              ${this.renderBookSlots(card)}
            </div>
            ${card.tucked > 0 ? `<div class="tuck-count">${card.tucked} ref.</div>` : ''}
          `;
          cardEl.addEventListener('click', () => this.showCardDetail(card));

          if (this.actionMode === 'place_books' && card.books < card.boek_capaciteit) {
            cardEl.style.cursor = 'pointer';
            cardEl.style.outline = '2px solid var(--gold)';
            cardEl.addEventListener('click', (e) => {
              e.stopPropagation();
              this.placeBookOnCard(card.id);
            });
          }

          slot.appendChild(cardEl);
        } else {
          slot.classList.add('empty');
          if (this.actionMode === 'placing' && this.selectedCard) {
            const skill = ROW_TO_SKILL[row];
            if (this.selectedCard.vaardigheden.includes(skill) && i === cards.length) {
              slot.classList.add('highlight');
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
        html += '<div class="book-slot"></div>';
      }
    }
    return html;
  },

  shortPower(text) {
    if (text.length > 60) return text.substring(0, 57) + '...';
    return text;
  },

  renderHand() {
    const container = document.getElementById('hand-cards');
    container.innerHTML = '';
    document.getElementById('hand-count').textContent = `(${Game.player.hand.length})`;

    for (const card of Game.player.hand) {
      const el = this.createCardMini(card);

      if (this.actionMode === null && !Game.gameOver) {
        // Click to start placing
        el.addEventListener('click', () => this.startPlacing(card));
      } else {
        el.addEventListener('click', () => this.showCardDetail(card));
      }

      container.appendChild(el);
    }
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

    div.innerHTML = `
      <span class="card-vp">${card.vp}</span>
      <div class="card-skills">${skills}</div>
      <div class="card-name">${card.naam}</div>
      <div class="card-dates">${this.formatDate(card.geboren)} - ${this.formatDate(card.overleden)}</div>
      <div class="card-costs">${costs || '<span style="color:var(--green);font-size:10px">Gratis</span>'}</div>
      <div class="card-power"><span class="power-type ${card.kracht_type}"></span>${card.kracht}</div>
      <div class="card-books">Boeken: ${card.boek_capaciteit}</div>
    `;
    return div;
  },

  formatDate(year) {
    if (year === null) return 'heden';
    if (year < 0) return `${Math.abs(year)} v.Chr.`;
    return year.toString();
  },

  // ==========================================================
  // CARD DETAIL MODAL
  // ==========================================================
  showCardDetail(card) {
    const modal = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');

    const costs = card.kosten.map(c =>
      `<span class="cost-symbol ${c}">${IDEA_SYMBOLS[c]}</span>`
    ).join('');

    const skills = card.vaardigheden.map(s =>
      `<span class="skill-badge ${s}" style="font-size:14px;padding:3px 8px">${s === 'L' ? 'Lezen' : s === 'S' ? 'Schrijven' : 'Spreken'}</span>`
    ).join(' ');

    const powerColor = card.kracht_type === 'bruin' ? 'Tijdens Onderzoek' :
                       card.kracht_type === 'roze' ? 'Tijdgeest' : 'Bij Aanstelling';

    content.innerHTML = `
      <div class="modal-card-detail">
        <div class="card-name">${card.naam}</div>
        <div class="card-dates">${this.formatDate(card.geboren)} - ${this.formatDate(card.overleden)}</div>
        <div class="card-stroming">${card.stroming}</div>
        <div style="margin:8px 0">${skills}</div>
        <div class="card-costs">${costs || '<span style="color:var(--green)">Gratis</span>'}</div>
        <div style="margin:4px 0"><strong>VP:</strong> ${card.vp} &nbsp; <strong>Boek-capaciteit:</strong> ${card.boek_capaciteit}</div>
        <div class="card-power-text">
          <span class="power-type ${card.kracht_type}"></span>
          <strong>${powerColor}:</strong> ${card.kracht}
        </div>
        ${card.citaat ? `<div class="card-quote">"${card.citaat}"</div>` : ''}
        ${card.books !== undefined ? `<div style="margin-top:8px"><strong>Boeken:</strong> ${card.books}/${card.boek_capaciteit} &nbsp; <strong>Referenties:</strong> ${card.tucked}</div>` : ''}
      </div>
    `;

    modal.classList.remove('hidden');
  },

  hideModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
  },

  // ==========================================================
  // ACTIONS
  // ==========================================================

  // --- PLACE PHILOSOPHER ---
  startPlacing(card) {
    if (Game.cubesLeft <= 0) return;
    this.actionMode = 'placing';
    this.selectedCard = card;
    this.showActionBar(`<strong>${card.naam}</strong> aanstellen - Klik op een rij om te plaatsen. Kosten: ${card.kosten.map(c => IDEA_SYMBOLS[c]).join(' ') || 'Gratis'}`);
    this.renderBoard();
    this.renderHand();
  },

  confirmPlace(row) {
    const card = this.selectedCard;
    if (!card) return;
    if (!Game.canPlacePhilosopher(card, row)) {
      Game.addLog(`Kan ${card.naam} niet plaatsen: onvoldoende ideeen`, 'spend');
      return;
    }
    Game.placePhilosopher(card, row);
    this.cancelAction();
    this.checkGameOver();
    this.renderAll();
  },

  // --- LEZEN ---
  startLezen() {
    if (Game.cubesLeft <= 0) return;
    const philCount = Game.player.board.lezen.length;
    const benefit = LEZEN_BENEFITS[Math.min(philCount, 5)];

    Game.activateRow('lezen');

    this.actionMode = 'pick_ideas';
    this.ideasToTake = Game.pendingIdeasToTake || benefit.ideas;
    this.selectedDice = [];
    this.showActionBar(`<strong>Lezen:</strong> Kies ${this.ideasToTake} idee(en) uit de Bibliotheek.`);
    this.renderAll();
  },

  clickDie(index) {
    if (this.actionMode !== 'pick_ideas') return;

    const dieType = Game.library[index];
    if (this.selectedDice.includes(index)) {
      this.selectedDice = this.selectedDice.filter(i => i !== index);
    } else if (this.selectedDice.length < this.ideasToTake) {
      // If wild, ask for type
      if (dieType === 'wild') {
        this.pendingWildIndex = index;
        this.showWildChoice();
        return;
      }
      this.selectedDice.push(index);
    }

    if (this.selectedDice.length >= this.ideasToTake) {
      this.confirmIdeas();
    } else {
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
    Game.library[this.pendingWildIndex] = type;
    this.selectedDice.push(this.pendingWildIndex);
    // Immediately mark it back as wild internally but take as chosen type
    if (this.selectedDice.length >= this.ideasToTake) {
      this.confirmIdeas();
    } else {
      this.showActionBar(`<strong>Lezen:</strong> Kies nog ${this.ideasToTake - this.selectedDice.length} idee(en).`);
      this.renderLibrary();
    }
  },

  confirmIdeas() {
    for (const idx of this.selectedDice) {
      const type = Game.library[idx];
      const actualType = (type === 'wild') ? this.bestIdeaType() : type;
      Game.takeFromLibrary(idx, actualType);
    }
    Game.useTurn();
    this.cancelAction();
    this.checkGameOver();
    this.renderAll();
  },

  // --- SCHRIJVEN ---
  startSchrijven() {
    if (Game.cubesLeft <= 0) return;
    const philCount = Game.player.board.schrijven.length;
    const benefit = SCHRIJVEN_BENEFITS[Math.min(philCount, 5)];

    Game.activateRow('schrijven');

    // Check if there are any cards that can receive books
    const allCards = [
      ...Game.player.board.lezen,
      ...Game.player.board.schrijven,
      ...Game.player.board.spreken
    ];
    const canReceive = allCards.filter(c => c.books < c.boek_capaciteit);

    if (canReceive.length === 0) {
      Game.addLog('Geen filosoof kan nog boeken ontvangen', 'spend');
      Game.useTurn();
      this.cancelAction();
      this.checkGameOver();
      this.renderAll();
      return;
    }

    this.booksToPlace = Game.pendingBooksToPlace || benefit.books;
    this.booksToPlace = Math.min(this.booksToPlace, canReceive.length);
    this.actionMode = 'place_books';
    this.showActionBar(`<strong>Schrijven:</strong> Plaats ${this.booksToPlace} boek(en) op je filosofen.`);
    this.renderAll();
  },

  placeBookOnCard(cardId) {
    if (this.actionMode !== 'place_books') return;
    if (Game.placeBookOn(cardId)) {
      this.booksToPlace--;
      if (this.booksToPlace <= 0) {
        Game.useTurn();
        this.cancelAction();
        this.checkGameOver();
      } else {
        this.showActionBar(`<strong>Schrijven:</strong> Plaats nog ${this.booksToPlace} boek(en).`);
      }
      this.renderAll();
    }
  },

  // --- SPREKEN ---
  startSpreken() {
    if (Game.cubesLeft <= 0) return;
    const philCount = Game.player.board.spreken.length;
    const benefit = SPREKEN_BENEFITS[Math.min(philCount, 5)];

    Game.activateRow('spreken');

    this.cardsToTake = Game.pendingSprekenCards || benefit.cards;
    this.canTakeFromOpen = Game.pendingSprekenFromOpen || benefit.fromOpen;

    this.actionMode = 'pick_cards';
    this.showActionBar(`<strong>Spreken:</strong> Trek ${this.cardsToTake} kaart(en)${this.canTakeFromOpen ? ' (ook uit de open rij)' : ' van de stapel'}.`);
    this.renderAll();

    if (!this.canTakeFromOpen) {
      // Auto draw from deck
      this.autoDrawCards();
    }
  },

  pickOpenCard(index) {
    if (this.actionMode !== 'pick_cards') return;
    const card = Game.drawFromOpen(index);
    if (card) {
      Game.addLog(`${card.naam} getrokken (open)`, 'gain');
      this.cardsToTake--;
      if (this.cardsToTake <= 0) {
        Game.useTurn();
        this.cancelAction();
        this.checkGameOver();
      } else {
        this.showActionBar(`<strong>Spreken:</strong> Trek nog ${this.cardsToTake} kaart(en).`);
      }
      this.renderAll();
    }
  },

  drawFromDeckAction() {
    if (this.actionMode !== 'pick_cards') return;
    const card = Game.drawFromDeck();
    if (card) {
      Game.addLog(`${card.naam} getrokken (stapel)`, 'gain');
      this.cardsToTake--;
      if (this.cardsToTake <= 0) {
        Game.useTurn();
        this.cancelAction();
        this.checkGameOver();
      } else {
        this.showActionBar(`<strong>Spreken:</strong> Trek nog ${this.cardsToTake} kaart(en).`);
      }
      this.renderAll();
    }
  },

  autoDrawCards() {
    for (let i = 0; i < this.cardsToTake; i++) {
      const card = Game.drawFromDeck();
      if (card) {
        Game.addLog(`${card.naam} getrokken`, 'gain');
      }
    }
    this.cardsToTake = 0;
    Game.useTurn();
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

    if (this.actionMode === 'pick_cards' && this.canTakeFromOpen) {
      content.innerHTML += ` <button class="btn btn-small" onclick="UI.drawFromDeckAction()" style="margin-left:12px;background:var(--green);color:#111">Trek van stapel</button>`;
    }

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
    this.hideActionBar();
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
    const score = Game.calculateScore();
    const container = document.getElementById('final-score-breakdown');
    container.innerHTML = `
      <div class="score-row"><span class="score-label">Filosofen (VP)</span><span class="score-value">${score.philosopherVP}</span></div>
      <div class="score-row"><span class="score-label">Boeken</span><span class="score-value">${score.bookVP}</span></div>
      <div class="score-row"><span class="score-label">Referenties</span><span class="score-value">${score.tuckVP}</span></div>
      <div class="score-row"><span class="score-label">Overgebleven ideeen</span><span class="score-value">${score.ideaVP}</span></div>
      <div class="score-row total"><span class="score-label">TOTAAL</span><span class="score-value">${score.total} VP</span></div>
    `;
    this.showScreen('end');
  },

  // ==========================================================
  // LOG
  // ==========================================================
  updateLog() {
    const container = document.getElementById('log-entries');
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
    // Setup
    document.getElementById('setup-idea-selectors').addEventListener('click', (e) => {
      const btn = e.target;
      const type = btn.dataset.type;
      if (!type) return;
      if (btn.classList.contains('idea-plus')) {
        if (this.getSetupTotal() < 5) {
          this.setupIdeas[type]++;
        }
      } else if (btn.classList.contains('idea-minus')) {
        if (this.setupIdeas[type] > 0) {
          this.setupIdeas[type]--;
        }
      }
      this.renderSetup();
    });

    document.getElementById('btn-start-game').addEventListener('click', () => this.startGame());

    // Row action buttons
    document.querySelector('.btn-lezen').addEventListener('click', () => {
      if (this.actionMode === null && !Game.gameOver) this.startLezen();
    });
    document.querySelector('.btn-schrijven').addEventListener('click', () => {
      if (this.actionMode === null && !Game.gameOver) this.startSchrijven();
    });
    document.querySelector('.btn-spreken').addEventListener('click', () => {
      if (this.actionMode === null && !Game.gameOver) this.startSpreken();
    });

    // Cancel
    document.getElementById('btn-cancel-action').addEventListener('click', () => {
      this.cancelAction();
      this.renderAll();
    });

    // Modal
    document.getElementById('modal-close').addEventListener('click', () => this.hideModal());
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal-overlay')) this.hideModal();
    });

    // New game
    document.getElementById('btn-new-game').addEventListener('click', () => {
      this.setupCards = [];
      this.setupSelected = [];
      this.setupIdeas = { weegschaal: 0, oog: 0, spiegel: 0, passer: 0, sfeer: 0 };
      this.init();
    });
  }
};

// ============================================================
// START
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  UI.init();
});
