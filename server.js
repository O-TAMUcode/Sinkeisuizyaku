'use strict';
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const express = require('express');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, { pingInterval: 10000, pingTimeout: 20000 });

app.use(express.static(path.join(__dirname, 'public')));
app.get('/healthz', (_req, res) => res.send('ok'));

// ---- 設定 -------------------------------------------------------------
const DECK = [
  ['H', 20], ['O', 15], ['C', 10],
  ['N', 5], ['Cl', 5], ['Na', 5], ['Ag', 5],
  ['Fe', 3], ['Cu', 3], ['S', 3],
  ['BLANK', 6], // 白紙 = オールマイティー
];
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 20;
const MAX_NAME = 12;
const MAX_PW = 20;
const MATCH_MS = 1200; // ペア成立の表示時間
const MISS_MS = 1600;  // はずれの表示時間
const IDLE_MS = 10 * 60 * 1000; // 誰も接続していない部屋を消すまでの時間

const rooms = new Map();

// ---- ユーティリティ ---------------------------------------------------
const clean = (v, max) =>
  typeof v === 'string' ? Array.from(v.trim()).slice(0, max).join('') : '';
const newId = () => crypto.randomBytes(8).toString('hex');
const roomKey = (room) => 'room:' + room.pw;
const isActive = (p) => !!p && p.connected && !p.left;
const isMatch = (a, b) => a === 'BLANK' || b === 'BLANK' || a === b;

function buildDeck() {
  const cards = [];
  for (const [type, n] of DECK) {
    for (let i = 0; i < n; i++) cards.push({ type, state: 0 }); // 0=裏 1=表 2=取られた
  }
  for (let i = cards.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

// まだペアを作れる組み合わせが残っているか
function hasMove(cards) {
  const rem = cards.filter((c) => c.state !== 2);
  if (rem.length < 2) return false;
  if (rem.some((c) => c.type === 'BLANK')) return true;
  const seen = new Set();
  for (const c of rem) {
    if (seen.has(c.type)) return true;
    seen.add(c.type);
  }
  return false;
}

function publicState(room) {
  const reveal = room.phase === 'finished';
  const cur = room.players[room.turnIdx];
  return {
    pw: room.pw,
    phase: room.phase,
    hostId: room.hostId,
    players: room.players.map((p) => ({
      id: p.id, name: p.name, score: p.score, connected: p.connected, left: p.left,
    })),
    turnId: room.phase === 'playing' && cur ? cur.id : null,
    cards: room.cards.map((c) => ({
      s: c.state,
      t: c.state === 1 || (reveal && c.state === 0) ? c.type : undefined,
    })),
    busy: room.busy,
    result: room.result,
    message: room.message,
    remaining: room.cards.filter((c) => c.state !== 2).length,
    deck: DECK.map(([t, n]) => ({ t, n })),
    limits: { min: MIN_PLAYERS, max: MAX_PLAYERS },
  };
}

function broadcast(room) {
  room.updated = Date.now();
  io.to(roomKey(room)).emit('state', publicState(room));
}

function deleteRoom(room) {
  clearTimeout(room.timer);
  rooms.delete(room.pw);
  io.to(roomKey(room)).emit('closed');
}

function ensureHost(room) {
  const host = room.players.find((p) => p.id === room.hostId);
  if (isActive(host)) return;
  const next = room.players.find(isActive) || room.players.find((p) => !p.left);
  if (next) room.hostId = next.id;
}

// 次の人へ。めくっているカードは裏に戻す
function passTurn(room) {
  for (const i of room.flipped) if (room.cards[i].state === 1) room.cards[i].state = 0;
  room.flipped = [];
  const n = room.players.length;
  for (let k = 1; k <= n; k++) {
    const idx = (room.turnIdx + k) % n;
    if (isActive(room.players[idx])) { room.turnIdx = idx; break; }
  }
  const cur = room.players[room.turnIdx];
  room.message = cur ? `${cur.name}さんの番です` : '';
}

function finishGame(room) {
  room.phase = 'finished';
  room.busy = false;
  room.result = null;
  room.flipped = [];
  const best = Math.max(...room.players.map((p) => p.score));
  const winners = room.players.filter((p) => p.score === best).map((p) => p.name);
  room.message = winners.length > 1
    ? `おしまい！ 同点：${winners.join('、')}`
    : `おしまい！ ${winners[0]}さんの勝ち`;
}

function flipCard(room, player, index) {
  if (room.phase !== 'playing' || room.busy) return;
  const cur = room.players[room.turnIdx];
  if (!cur || cur.id !== player.id) return;
  if (!Number.isInteger(index) || index < 0 || index >= room.cards.length) return;
  const card = room.cards[index];
  if (card.state !== 0) return;

  card.state = 1;
  room.flipped.push(index);

  if (room.flipped.length === 1) {
    room.message = `${cur.name}さんがもう1枚めくります`;
    broadcast(room);
    return;
  }

  room.busy = true;
  const [a, b] = room.flipped;
  const ok = isMatch(room.cards[a].type, room.cards[b].type);
  room.result = ok ? 'match' : 'miss';
  room.message = ok ? 'ペア成立！' : 'ちがった…';
  broadcast(room);

  room.timer = setTimeout(() => {
    if (rooms.get(room.pw) !== room) return;
    room.busy = false;
    room.result = null;
    if (ok) {
      room.cards[a].state = 2;
      room.cards[b].state = 2;
      room.flipped = [];
      cur.score += 1;
      if (!hasMove(room.cards)) {
        finishGame(room);
      } else if (isActive(cur)) {
        room.message = `${cur.name}さん、もう一度どうぞ`;
      } else {
        passTurn(room);
      }
    } else {
      passTurn(room);
    }
    broadcast(room);
  }, ok ? MATCH_MS : MISS_MS);
}

function startGame(room) {
  room.cards = buildDeck();
  room.players.forEach((p) => { p.score = 0; });
  const act = room.players.filter(isActive);
  const first = act[crypto.randomInt(act.length)];
  room.turnIdx = room.players.indexOf(first);
  room.phase = 'playing';
  room.flipped = [];
  room.busy = false;
  room.result = null;
  room.message = `${first.name}さんから始めます`;
}

function leaveRoom(room, player) {
  if (room.phase === 'lobby') {
    room.players = room.players.filter((p) => p !== player);
  } else {
    player.left = true;
    player.connected = false;
  }
  player.sid = null;
  if (room.players.every((p) => p.left) || room.players.length === 0) {
    deleteRoom(room);
    return false;
  }
  ensureHost(room);
  const cur = room.players[room.turnIdx];
  if (room.phase === 'playing' && cur === player && !room.busy) passTurn(room);
  return true;
}

function ctxOf(socket) {
  const { pw, playerId } = socket.data || {};
  if (!pw) return null;
  const room = rooms.get(pw);
  if (!room) return null;
  const player = room.players.find((p) => p.id === playerId && !p.left);
  if (!player) return null;
  return { room, player };
}

function attach(socket, room, player) {
  if (player.sid && player.sid !== socket.id) {
    const old = io.sockets.sockets.get(player.sid);
    if (old) { old.data = {}; old.leave(roomKey(room)); }
  }
  player.sid = socket.id;
  player.connected = true;
  socket.data = { pw: room.pw, playerId: player.id };
  socket.join(roomKey(room));
}

// ---- Socket -----------------------------------------------------------
io.on('connection', (socket) => {
  socket.data = {};

  socket.on('create', (data, cb) => {
    cb = typeof cb === 'function' ? cb : () => {};
    if (ctxOf(socket)) return cb({ ok: false, error: 'すでに部屋に入っています' });
    const name = clean(data && data.name, MAX_NAME);
    const pw = clean(data && data.pw, MAX_PW);
    if (!name) return cb({ ok: false, error: '名前を入力してください' });
    if (!pw) return cb({ ok: false, error: 'パスワードを入力してください' });
    if (rooms.has(pw)) return cb({ ok: false, error: 'そのパスワードの部屋はすでにあります' });
    const player = { id: newId(), name, sid: null, score: 0, connected: true, left: false };
    const room = {
      pw, phase: 'lobby', hostId: player.id, players: [player],
      cards: [], turnIdx: 0, flipped: [], busy: false, result: null,
      message: '', timer: null, updated: Date.now(),
    };
    rooms.set(pw, room);
    attach(socket, room, player);
    cb({ ok: true, playerId: player.id, pw });
    broadcast(room);
  });

  socket.on('join', (data, cb) => {
    cb = typeof cb === 'function' ? cb : () => {};
    if (ctxOf(socket)) return cb({ ok: false, error: 'すでに部屋に入っています' });
    const name = clean(data && data.name, MAX_NAME);
    const pw = clean(data && data.pw, MAX_PW);
    if (!name) return cb({ ok: false, error: '名前を入力してください' });
    if (!pw) return cb({ ok: false, error: 'パスワードを入力してください' });
    const room = rooms.get(pw);
    if (!room) return cb({ ok: false, error: 'その部屋は見つかりません' });
    if (room.phase !== 'lobby') return cb({ ok: false, error: 'ゲーム中の部屋には入れません' });
    if (room.players.length >= MAX_PLAYERS) return cb({ ok: false, error: `満員です（最大${MAX_PLAYERS}人）` });
    if (room.players.some((p) => p.name === name)) return cb({ ok: false, error: '同じ名前の人がいます。名前を変えてください' });
    const player = { id: newId(), name, sid: null, score: 0, connected: true, left: false };
    room.players.push(player);
    attach(socket, room, player);
    cb({ ok: true, playerId: player.id, pw });
    broadcast(room);
  });

  socket.on('resume', (data, cb) => {
    cb = typeof cb === 'function' ? cb : () => {};
    const pw = clean(data && data.pw, MAX_PW);
    const room = rooms.get(pw);
    const player = room && room.players.find((p) => p.id === (data && data.playerId) && !p.left);
    if (!player) return cb({ ok: false });
    attach(socket, room, player);
    cb({ ok: true, playerId: player.id, pw });
    broadcast(room);
  });

  socket.on('leave', (_data, cb) => {
    cb = typeof cb === 'function' ? cb : () => {};
    const ctx = ctxOf(socket);
    if (!ctx) return cb({ ok: true });
    const { room, player } = ctx;
    socket.leave(roomKey(room));
    socket.data = {};
    if (leaveRoom(room, player)) broadcast(room);
    cb({ ok: true });
  });

  socket.on('start', () => {
    const ctx = ctxOf(socket);
    if (!ctx) return;
    const { room, player } = ctx;
    if (room.phase !== 'lobby' || room.hostId !== player.id) return;
    if (room.players.filter(isActive).length < MIN_PLAYERS) return;
    startGame(room);
    broadcast(room);
  });

  socket.on('again', () => {
    const ctx = ctxOf(socket);
    if (!ctx) return;
    const { room, player } = ctx;
    if (room.phase !== 'finished' || room.hostId !== player.id) return;
    room.players = room.players.filter((p) => !p.left);
    room.players.forEach((p) => { p.score = 0; });
    room.cards = [];
    room.phase = 'lobby';
    room.message = '';
    ensureHost(room);
    broadcast(room);
  });

  socket.on('flip', (index) => {
    const ctx = ctxOf(socket);
    if (!ctx) return;
    flipCard(ctx.room, ctx.player, index);
  });

  socket.on('disconnect', () => {
    const { pw, playerId } = socket.data || {};
    const room = pw && rooms.get(pw);
    const player = room && room.players.find((p) => p.id === playerId);
    if (!player || player.sid !== socket.id) return;
    player.connected = false;
    player.sid = null;
    ensureHost(room);
    const cur = room.players[room.turnIdx];
    if (room.phase === 'playing' && cur === player && !room.busy) passTurn(room);
    broadcast(room);
  });
});

// 誰も接続していない部屋を掃除
setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    if (room.players.every((p) => !p.connected) && now - room.updated > IDLE_MS) deleteRoom(room);
  }
}, 60 * 1000);

server.listen(PORT, () => console.log(`listening on ${PORT}`));
