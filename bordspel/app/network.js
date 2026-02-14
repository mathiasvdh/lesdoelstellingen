// ============================================================
// DE ACADEMIE - Network Layer (PeerJS WebRTC)
// Host-authoritative multiplayer for 2-4 players
// ============================================================

const Network = {
  peer: null,
  connections: [],   // host: array of connections to clients
  hostConn: null,    // client: connection to host
  isHost: false,
  myId: null,
  roomCode: null,
  playerName: '',
  players: {},       // { peerId: { name, connected } }
  heartbeatInterval: null,
  lastHeartbeats: {},
  onStateUpdate: null,
  onPlayersUpdate: null,
  onMessage: null,
  onDisconnect: null,

  // Generate 4-char room code
  generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  },

  // ========== HOST ==========
  createRoom(playerName) {
    return new Promise((resolve, reject) => {
      this.roomCode = this.generateCode();
      this.playerName = playerName;
      this.isHost = true;
      const peerId = 'academie-' + this.roomCode;

      this.peer = new Peer(peerId);

      this.peer.on('open', (id) => {
        this.myId = id;
        this.players[id] = { name: playerName, connected: true, isHost: true };
        if (this.onPlayersUpdate) this.onPlayersUpdate(this.players);
        this.startHeartbeat();
        resolve(this.roomCode);
      });

      this.peer.on('connection', (conn) => {
        conn.on('open', () => {
          this.connections.push(conn);
          conn.on('data', (data) => this.handleHostMessage(conn, data));
          conn.on('close', () => this.handleDisconnect(conn));
        });
      });

      this.peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
          // Room code already taken, try again
          this.roomCode = this.generateCode();
          this.peer.destroy();
          this.createRoom(playerName).then(resolve).catch(reject);
        } else {
          reject(err);
        }
      });

      this.peer.on('disconnected', () => {
        this.peer.reconnect();
      });
    });
  },

  handleHostMessage(conn, data) {
    if (data.type === 'heartbeat') {
      this.lastHeartbeats[conn.peer] = Date.now();
      return;
    }
    if (data.type === 'join') {
      this.players[conn.peer] = { name: data.name, connected: true, isHost: false };
      if (this.onPlayersUpdate) this.onPlayersUpdate(this.players);
      // Send current player list to all
      this.broadcast({ type: 'players', players: this.getPlayerList() });
      return;
    }
    if (data.type === 'action') {
      if (this.onMessage) this.onMessage(conn.peer, data);
      return;
    }
    if (data.type === 'setup_done') {
      if (this.onMessage) this.onMessage(conn.peer, data);
      return;
    }
  },

  handleDisconnect(conn) {
    this.connections = this.connections.filter(c => c !== conn);
    if (this.players[conn.peer]) {
      this.players[conn.peer].connected = false;
      if (this.onPlayersUpdate) this.onPlayersUpdate(this.players);
      this.broadcast({ type: 'players', players: this.getPlayerList() });
    }
  },

  // ========== CLIENT ==========
  joinRoom(code, playerName) {
    return new Promise((resolve, reject) => {
      this.roomCode = code.toUpperCase();
      this.playerName = playerName;
      this.isHost = false;
      const hostId = 'academie-' + this.roomCode;

      this.peer = new Peer();

      this.peer.on('open', (id) => {
        this.myId = id;
        this.hostConn = this.peer.connect(hostId, { reliable: true });

        this.hostConn.on('open', () => {
          this.hostConn.send({ type: 'join', name: playerName });
          this.startHeartbeat();
          resolve(this.roomCode);
        });

        this.hostConn.on('data', (data) => this.handleClientMessage(data));

        this.hostConn.on('close', () => {
          if (this.onDisconnect) this.onDisconnect();
        });

        this.hostConn.on('error', (err) => reject(err));
      });

      this.peer.on('error', (err) => {
        reject(err);
      });

      this.peer.on('disconnected', () => {
        this.peer.reconnect();
      });

      // Timeout after 10 seconds
      setTimeout(() => reject(new Error('Verbinding mislukt - controleer de code')), 10000);
    });
  },

  handleClientMessage(data) {
    if (data.type === 'heartbeat') {
      this.lastHeartbeats['host'] = Date.now();
      return;
    }
    if (data.type === 'players') {
      this.players = {};
      for (const p of data.players) {
        this.players[p.id] = { name: p.name, connected: p.connected, isHost: p.isHost };
      }
      if (this.onPlayersUpdate) this.onPlayersUpdate(this.players);
      return;
    }
    if (data.type === 'state') {
      if (this.onStateUpdate) this.onStateUpdate(data.state);
      return;
    }
    if (data.type === 'setup_cards') {
      if (this.onMessage) this.onMessage('host', data);
      return;
    }
    if (data.type === 'game_start' || data.type === 'game_over') {
      if (this.onMessage) this.onMessage('host', data);
      return;
    }
  },

  // ========== COMMUNICATION ==========
  // Host sends to all clients
  broadcast(data) {
    for (const conn of this.connections) {
      try { conn.send(data); } catch(e) { /* ignore dead connections */ }
    }
  },

  // Host sends to specific client
  sendTo(peerId, data) {
    const conn = this.connections.find(c => c.peer === peerId);
    if (conn) try { conn.send(data); } catch(e) {}
  },

  // Client sends to host
  sendToHost(data) {
    if (this.hostConn) {
      try { this.hostConn.send(data); } catch(e) {}
    }
  },

  // Send state to all clients (host only)
  broadcastState(state) {
    this.broadcast({ type: 'state', state: state });
  },

  // ========== HEARTBEAT ==========
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isHost) {
        for (const conn of this.connections) {
          try { conn.send({ type: 'heartbeat' }); } catch(e) {}
        }
        // Check for dead clients
        const now = Date.now();
        for (const conn of this.connections) {
          if (this.lastHeartbeats[conn.peer] && now - this.lastHeartbeats[conn.peer] > 15000) {
            this.handleDisconnect(conn);
          }
        }
      } else if (this.hostConn) {
        try { this.hostConn.send({ type: 'heartbeat' }); } catch(e) {}
      }
    }, 3000);
  },

  // ========== HELPERS ==========
  getPlayerList() {
    return Object.entries(this.players).map(([id, p]) => ({
      id, name: p.name, connected: p.connected, isHost: p.isHost || false
    }));
  },

  getPlayerCount() {
    return Object.values(this.players).filter(p => p.connected).length;
  },

  destroy() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.peer) this.peer.destroy();
    this.connections = [];
    this.hostConn = null;
    this.players = {};
  }
};
