// ============================================================
// DE ACADEMIE - UI Layer v2.0
// Fully reworked to match Wingspan mechanics
// ============================================================

const UI = {
  setupCards: [],
  setupSelected: [],
  setupIdeas: { weegschaal: 0, oog: 0, spiegel: 0, passer: 0, sfeer: 0 },
  setupPhase: 1, // 1 = cards+ideas, 2 = levenswerk
  selectedLevenswerk: null,

  // Action state
  actionMode: null,
  selectedCard: null,
  selectedDice: [],

  // Multi-step action state
  ideasToTake: 0,
  booksToPlace: 0,
  cardsToTake: 0,
  conversionAvailable: false,
  conversionType: null, // 'card_to_idea', 'idea_to_book', 'book_to_card'
  currentRow: null,
  discardMode: false,

  init() {
    this.setupCards = Game.init();
    this.setupPhase = 1;
    this.selectedLevenswerk = null;
    if (!this._bound) {
      this.bindEvents();
      this._bound = true;
    }
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
  // SETUP PHASE 1: Cards + Ideas
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
    if (this.setupPhase === 1) {
      btn.disabled = total !== 5;
      btn.textContent = total === 5 ? 'Volgende: Kies Levenswerk' : `Nog ${5 - total} kiezen`;
    } else {
      btn.disabled = !this.selectedLevenswerk;
      btn.textContent = this.selectedLevenswerk ? 'Start het Spel!' : 'Kies een Levenswerk';
    }
  },

  goToLevenswerk() {
    this.setupPhase = 2;
    document.getElementById('setup-levenswerk-section').style.display = '';
    this.renderLevenswerk();
    this.updateSetupButton();
    document.getElementById('setup-levenswerk-section').scrollIntoView({ behavior: 'smooth' });
  },

  renderLevenswerk() {
    const container = document.getElementById('setup-levenswerk');
    container.innerHTML = '';
    for (const lw of Game.levenswerkOptions) {
      const div = document.createElement('div');
      div.className = 'levenswerk-option' + (this.selectedLevenswerk === lw ? ' selected' : '');
      div.innerHTML = `
        <div class="lw-name">${lw.naam}</div>
        <div class="lw-desc">${lw.beschrijving}</div>
      `;
      div.addEventListener('click', () => {
        this.selectedLevenswerk = lw;
        this.renderLevenswerk();
        this.updateSetupButton();
      });
      container.appendChild(div);
    }
  },

  startGame() {
    if (this.setupPhase === 1) {
      this.goToLevenswerk();
      return;
    }
    const selectedCards = this.setupCards.filter(c => this.setupSelected.includes(c.id));
    Game.finishSetup(selectedCards, { ...this.setupIdeas }, this.selectedLevenswerk);
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
    this.renderLevenswerkPanel();
    this.updateLog();
  },

  renderTopBar() {
    document.getElementById('round-display').textContent = `${Game.round + 1}/4`;
    document.getElementById('round-name').textContent = ROUND_NAMES[Game.round] || '';
    document.getElementById('turn-display').textContent =
      `${Game.turn + 1}/${TURNS_PER_ROUND[Game.round]}`;
    document.getElementById('cubes-display').textContent = Game.cubesLeft;
    document.getElementById('deck-count').textContent = Game.deck.length;

    // Round goal
    const goal = Game.roundGoals[Game.round];
    if (goal) {
      document.getElementById('round-goal-display').textContent = goal.naam;
      document.getElementById('round-goal-display').title = goal.beschrijving;
    }

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
      if (this.selectedDice.includes(i)) div.classList.add('selected');
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
      if (this.actionMode === 'pick_cards') {
        el.classList.add('highlight-pick');
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => this.pickOpenCard(i));
      } else {
        el.addEventListener('click', () => this.showCardDetail(card));
      }
      container.appendChild(el);
    }

    // Show/hide draw-from-deck button
    const deckBtn = document.getElementById('btn-draw-deck');
    if (this.actionMode === 'pick_cards') {
      deckBtn.style.display = '';
    } else {
      deckBtn.style.display = 'none';
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

        // Book cost indicator
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

          slot.appendChild(cardEl);
        } else {
          slot.classList.add('empty');
          if (this.actionMode === 'placing' && this.selectedCard && i === cards.length) {
            const skill = ROW_TO_SKILL[row];
            if (this.selectedCard.vaardigheden.includes(skill) &&
                Game.canPlacePhilosopher(this.selectedCard, row)) {
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
    // Remove prefix
    let t = text.replace(/^(Tijdens de beurt|Bij Aanstelling|Tijdgeest|Einde van de ronde|Einde van het spel):\s*/i, '');
    if (t.length > 55) return t.substring(0, 52) + '...';
    return t;
  },

  renderHand() {
    const container = document.getElementById('hand-cards');
    container.innerHTML = '';
    document.getElementById('hand-count').textContent = `(${Game.player.hand.length})`;

    for (const card of Game.player.hand) {
      const el = this.createCardMini(card);

      if (this.discardMode) {
        el.classList.add('discard-target');
        el.addEventListener('click', () => this.discardCard(card));
      } else if (this.actionMode === null && !Game.gameOver) {
        el.addEventListener('click', () => this.startPlacing(card));
      } else {
        el.addEventListener('click', () => this.showCardDetail(card));
      }

      container.appendChild(el);
    }
  },

  renderLevenswerkPanel() {
    const container = document.getElementById('levenswerk-display');
    if (!container) return;
    const lw = Game.player.levenswerk;
    if (!lw) {
      container.innerHTML = '<p style="color:var(--text-dim);font-size:12px">Geen gekozen</p>';
      return;
    }
    container.innerHTML = `
      <div class="lw-panel-card">
        <div class="lw-name">${lw.naam}</div>
        <div class="lw-desc">${lw.beschrijving}</div>
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

    const traditieBadge = card.traditie ?
      `<span class="traditie-mini traditie-${card.traditie}" title="${TRADITIE_NAMES[card.traditie] || ''}">${TRADITIE_SYMBOLS[card.traditie] || ''}</span>` : '';

    div.innerHTML = `
      <span class="card-vp">${card.vp}</span>
      ${traditieBadge}
      <div class="card-skills">${skills}</div>
      <div class="card-name">${card.naam}</div>
      <div class="card-dates">${this.formatDate(card.geboren)} - ${this.formatDate(card.overleden)}</div>
      <div class="card-costs">${costs || '<span style="color:var(--green);font-size:10px">Gratis</span>'}</div>
      <div class="card-power"><span class="power-dot ${card.kracht_type}"></span>${card.kracht}</div>
      <div class="card-bottom-row">
        <span class="card-books-info">Cap: ${card.boek_capaciteit}</span>
        ${card.invloed ? `<span class="card-invloed">Inv: ${card.invloed}</span>` : ''}
      </div>
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
        <div class="card-name" style="font-size:20px">${card.naam}</div>
        <div style="color:var(--text-dim)">${this.formatDate(card.geboren)} - ${this.formatDate(card.overleden)}</div>
        <div style="color:var(--gold-dim);font-style:italic">${card.stroming}</div>
        ${traditieName ? `<div class="modal-traditie"><span class="traditie-badge traditie-${card.traditie}">${traditieName}</span></div>` : ''}
        <div style="margin:8px 0">${skills}</div>
        <div style="display:flex;gap:6px;margin:8px 0">${costs || '<span style="color:var(--green)">Gratis</span>'}</div>
        <div style="margin:4px 0">
          <strong>VP:</strong> ${card.vp} &nbsp;
          <strong>Boek-capaciteit:</strong> ${card.boek_capaciteit} &nbsp;
          ${card.invloed ? `<strong>Invloed:</strong> ${card.invloed}` : ''}
        </div>
        <div class="card-power-text" style="margin-top:8px">
          <span class="power-dot ${card.kracht_type}"></span>
          <strong>${powerLabels[card.kracht_type] || card.kracht_type}:</strong> ${card.kracht}
        </div>
        ${card.citaat ? `<div style="font-style:italic;color:var(--text-dim);margin-top:8px;border-left:3px solid var(--gold-dim);padding-left:8px">"${card.citaat}"</div>` : ''}
        ${card.books !== undefined ? `
          <div style="margin-top:12px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.1)">
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
  // ACTIONS
  // ==========================================================

  // --- PLACE PHILOSOPHER ---
  startPlacing(card) {
    if (Game.cubesLeft <= 0) return;
    this.actionMode = 'placing';
    this.selectedCard = card;

    const costText = card.kosten.length > 0
      ? card.kosten.map(c => IDEA_SYMBOLS[c]).join(' ')
      : 'Gratis';

    this.showActionBar(`<strong>${card.naam}</strong> aanstellen &mdash; Kosten: ${costText}. Klik op een lege plek in een rij.`);
    this.renderBoard();
    this.renderHand();
  },

  confirmPlace(row) {
    const card = this.selectedCard;
    if (!card) return;
    if (!Game.canPlacePhilosopher(card, row)) {
      Game.addLog(`Kan ${card.naam} niet plaatsen: onvoldoende middelen`, 'spend');
      return;
    }
    Game.placePhilosopher(card, row);
    this.cancelAction();
    this.checkGameOver();
    this.renderAll();
  },

  // --- LEZEN (Gain Ideas) ---
  startLezen() {
    if (Game.cubesLeft <= 0) return;
    const benefit = Game.getRowBenefit('lezen');
    this.currentRow = 'lezen';
    this.actionMode = 'pick_ideas';
    this.ideasToTake = benefit.ideas;
    this.conversionAvailable = benefit.conversion;
    this.conversionType = 'card_to_idea';
    this.selectedDice = [];
    this.showActionBar(`<strong>Lezen:</strong> Kies ${this.ideasToTake} idee(en) uit de Bibliotheek.`);
    this.renderAll();
  },

  clickDie(index) {
    if (this.actionMode !== 'pick_ideas') return;
    const dieType = Game.library[index];

    if (this.selectedDice.includes(index)) {
      this.selectedDice = this.selectedDice.filter(i => i !== index);
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

    if (this.selectedDice.length >= this.ideasToTake) {
      this.confirmIdeas();
    } else {
      this.showActionBar(`<strong>Lezen:</strong> Kies nog ${this.ideasToTake - this.selectedDice.length} idee(en).`);
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
      const actualType = (type === 'wild') ? Game.bestIdeaType() : type;
      Game.takeFromLibrary(idx, actualType);
    }
    this.selectedDice = [];

    // Check for conversion: discard 1 card → gain 1 extra idea
    if (this.conversionAvailable && Game.player.hand.length > 0) {
      this.offerConversion('card_to_idea');
    } else {
      this.finishRowAction('lezen');
    }
  },

  // --- SCHRIJVEN (Place Books) ---
  startSchrijven() {
    if (Game.cubesLeft <= 0) return;
    const benefit = Game.getRowBenefit('schrijven');
    this.currentRow = 'schrijven';

    const allCards = Game.getAllBoardCards();
    const canReceive = allCards.filter(c => c.books < c.boek_capaciteit);

    if (canReceive.length === 0) {
      Game.addLog('Geen filosoof kan nog boeken ontvangen', 'spend');
      Game.activateBrownPowers('schrijven');
      Game.useTurn();
      this.cancelAction();
      this.checkGameOver();
      this.renderAll();
      return;
    }

    this.booksToPlace = Math.min(benefit.books, canReceive.length);
    this.conversionAvailable = benefit.conversion;
    this.conversionType = 'idea_to_book';
    this.actionMode = 'place_books';
    this.showActionBar(`<strong>Schrijven:</strong> Plaats ${this.booksToPlace} boek(en) op je filosofen.`);
    this.renderAll();
  },

  placeBookOnCard(cardId) {
    if (this.actionMode !== 'place_books') return;
    if (Game.placeBookOn(cardId)) {
      Game.addLog('+1 boek geplaatst', 'gain');
      this.booksToPlace--;
      if (this.booksToPlace <= 0) {
        // Check for conversion: pay 1 idea → +1 book
        if (this.conversionAvailable && Game.getTotalIdeas() > 0) {
          const canReceive = Game.getAllBoardCards().filter(c => c.books < c.boek_capaciteit);
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
  },

  // --- SPREKEN (Draw Cards) ---
  startSpreken() {
    if (Game.cubesLeft <= 0) return;
    const benefit = Game.getRowBenefit('spreken');
    this.currentRow = 'spreken';
    this.cardsToTake = benefit.cards;
    this.conversionAvailable = benefit.conversion;
    this.conversionType = 'book_to_card';
    this.actionMode = 'pick_cards';
    this.showActionBar(`<strong>Spreken:</strong> Trek ${this.cardsToTake} kaart(en) uit de open rij of van de stapel.`);
    this.renderAll();
  },

  pickOpenCard(index) {
    if (this.actionMode !== 'pick_cards') return;
    const card = Game.drawFromOpen(index);
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
  },

  drawFromDeckAction() {
    if (this.actionMode !== 'pick_cards') return;
    const card = Game.drawFromDeck();
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
  },

  afterCardsDone() {
    // Check for conversion: discard 1 book → +1 card
    if (this.conversionAvailable && Game.player.booksOnBoard > 0) {
      this.offerConversion('book_to_card');
    } else {
      this.finishRowAction('spreken');
    }
  },

  // ==========================================================
  // CONVERSION SYSTEM (bonus trades)
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
      // Player must pick a card to discard
      this.actionMode = 'discard_for_idea';
      this.discardMode = true;
      this.showActionBar('<strong>Kies een kaart uit je hand om in te leveren voor +1 idee.</strong>');
      this.renderHand();
    } else if (type === 'idea_to_book') {
      // Player must pick an idea type to pay
      this.showIdeaPayChoice();
    } else if (type === 'book_to_card') {
      // Remove 1 book, draw 1 card
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
    Game.player.hand = Game.player.hand.filter(c => c.id !== card.id);
    Game.addLog(`${card.naam} ingeleverd`, 'spend');
    this.discardMode = false;

    // Now pick 1 idea from library
    this.actionMode = 'pick_ideas';
    this.ideasToTake = 1;
    this.conversionAvailable = false;
    this.selectedDice = [];
    this.showActionBar('<strong>Bonus:</strong> Kies 1 idee uit de Bibliotheek.');
    this.renderAll();
  },

  showIdeaPayChoice() {
    const types = IDEA_TYPES.filter(t => Game.player.ideas[t] > 0);
    const bar = document.getElementById('action-bar-content');
    bar.innerHTML = `<strong>Welk idee betaal je?</strong> ` +
      types.map(t =>
        `<button class="choice-btn" onclick="UI.payIdeaForBook('${t}')">${IDEA_SYMBOLS[t]} ${IDEA_NAMES[t]} (${Game.player.ideas[t]})</button>`
      ).join(' ');
  },

  payIdeaForBook(type) {
    Game.player.ideas[type]--;
    Game.addLog(`-1 ${IDEA_NAMES[type]} (conversie)`, 'spend');

    // Place 1 bonus book
    this.actionMode = 'place_books';
    this.booksToPlace = 1;
    this.conversionAvailable = false;
    this.showActionBar('<strong>Bonus:</strong> Plaats 1 extra boek op een filosoof.');
    this.renderAll();
  },

  removeBookFromCard(card) {
    if (card.books <= 0) return;
    card.books--;
    Game.player.booksOnBoard--;
    Game.addLog('-1 boek ingeleverd (conversie)', 'spend');

    // Draw 1 card
    this.actionMode = 'pick_cards';
    this.cardsToTake = 1;
    this.conversionAvailable = false;
    this.showActionBar('<strong>Bonus:</strong> Trek 1 kaart (open rij of stapel).');
    this.renderAll();
  },

  // ==========================================================
  // FINISH ROW ACTION
  // ==========================================================
  finishRowAction(row) {
    // Activate brown powers right-to-left
    Game.activateBrownPowers(row);
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

    // Update tab active state
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
    const score = Game.calculateScore();
    const container = document.getElementById('final-score-breakdown');

    const lw = Game.player.levenswerk;
    const lwText = lw ? `${lw.naam}: ${lw.beschrijving}` : 'Geen';

    container.innerHTML = `
      <div class="score-row"><span class="score-label">Filosofen (VP)</span><span class="score-value">${score.philosopherVP}</span></div>
      <div class="score-row"><span class="score-label">Boeken</span><span class="score-value">${score.bookVP}</span></div>
      <div class="score-row"><span class="score-label">Referenties</span><span class="score-value">${score.tuckVP}</span></div>
      <div class="score-row"><span class="score-label">Opgeslagen ideeen</span><span class="score-value">${score.cachedVP}</span></div>
      <div class="score-row"><span class="score-label">Rondedoelen</span><span class="score-value">${score.roundGoalVP}</span></div>
      <div class="score-row"><span class="score-label">Levenswerk (${lwText})</span><span class="score-value">${score.levenswerkVP}</span></div>
      <div class="score-row"><span class="score-label">Eindspel-krachten</span><span class="score-value">${score.gameEndVP}</span></div>
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
    // Setup idea selectors
    document.getElementById('setup-idea-selectors').addEventListener('click', (e) => {
      const btn = e.target;
      const type = btn.dataset.type;
      if (!type) return;
      if (this.setupPhase !== 1) return;
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

    // Start game button (handles both phases)
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

    // Draw from deck button
    document.getElementById('btn-draw-deck').addEventListener('click', () => {
      this.drawFromDeckAction();
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

    // Help
    document.getElementById('btn-help').addEventListener('click', () => this.showHelp('overzicht'));
    document.querySelectorAll('.help-tab').forEach(tab => {
      tab.addEventListener('click', () => this.showHelp(tab.dataset.topic));
    });
    document.getElementById('help-close').addEventListener('click', () => this.hideHelp());
    document.getElementById('help-overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('help-overlay')) this.hideHelp();
    });

    // New game
    document.getElementById('btn-new-game').addEventListener('click', () => {
      this.setupCards = [];
      this.setupSelected = [];
      this.setupIdeas = { weegschaal: 0, oog: 0, spiegel: 0, passer: 0, sfeer: 0 };
      this.setupPhase = 1;
      this.selectedLevenswerk = null;
      document.getElementById('setup-levenswerk-section').style.display = 'none';
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
