/* Hunter Island cooperative expedition server. Run: node server.cjs */
'use strict';
const http = require('node:http');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { performance } = require('node:perf_hooks');

const CHARACTERS = ['tom', 'jerry', 'cassia', 'wangcai'];
const SEATS = ['p1', 'p2', 'p3', 'p4'];
const TYPES = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg', '.ico':'image/x-icon', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.wav':'audio/wav', '.ogg':'audio/ogg', '.mp3':'audio/mpeg'};
const codeAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const fail = (status, message) => Object.assign(new Error(message), { status });
const stopped = () => ({x:0, y:0, sprint:false});
function compileSimulation() {
  const scripts = ['world.js','sim.js'].map(filename =>
    new vm.Script(fs.readFileSync(path.join(__dirname, filename), 'utf8'), {filename}));
  // Each expedition owns its world cache, even when many rooms explore at once.
  return () => {
    const ctx = vm.createContext({console,performance});
    ctx.window = ctx;
    ctx.self = ctx;
    for (const script of scripts) script.runInContext(ctx);
    return ctx.Sim;
  };
}
function sendJSON(res, status, value) {
  if (res.destroyed || res.writableEnded) return;
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store'});
  res.end(JSON.stringify(value));
}
async function bodyOf(req) {
  if (!(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    throw fail(415, '此操作需要 JSON 格式。');
  }
  let size = 0;
  const chunks = [];
  for await (const part of req) {
    const buf = Buffer.isBuffer(part) ? part : Buffer.from(part);
    if ((size += buf.length) > 4096) throw fail(413, '資料太長。');
    chunks.push(buf);
  }
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString());
    if (data && typeof data === 'object' && !Array.isArray(data)) return data;
  } catch {}
  throw fail(400, '資料格式錯誤。');
}
function publicRoom(room) {
  const characters = [...room.members.values()].map(m => m.character);
  return {code:room.code, characters, free:CHARACTERS.filter(c => !characters.includes(c)), status:room.state.status};
}
function newMember(actor, character) {
  return {token:crypto.randomBytes(24).toString('base64url'), actor, character, stream:null, lastSeen:Date.now(), input:stopped(), inputTime:0, sequence:0, actionIds:new Set(), budgetAt:0, budget:0};
}
function visit(room, m) {
  room.lastActive = m.lastSeen = Date.now();
  if (room.state.players[m.actor]) room.state.players[m.actor].connected = true;
}
function stopMember(m) {
  m.input = stopped();
  m.inputTime = 0;
}
function safeAction(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || typeof raw.type !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]{0,39}$/.test(raw.type)) throw fail(400, '無效的遊戲操作。');
  const entries = Object.entries(raw);
  if (entries.length > 10) throw fail(400, '無效的遊戲操作。');
  const result = Object.create(null);
  const unsafe = new Set(['__proto__', 'prototype', 'constructor', 'toString', 'valueOf', 'hasOwnProperty', '__defineGetter__', '__defineSetter__', '__lookupGetter__', '__lookupSetter__', 'actor', 'actorId', 'player', 'players']);
  for (const [k, v] of entries) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,31}$/.test(k) || unsafe.has(k) || unsafe.has(v)) throw fail(400, '無效的遊戲操作。');
    if (typeof v === 'string' && /^[\w.:,|@#/-]{1,80}$/.test(v)) result[k] = v;
    else if (typeof v === 'boolean' || (Number.isSafeInteger(v) && Math.abs(v) <= 1000000)) result[k] = v;
    else throw fail(400, '無效的遊戲操作。');
  }
  return result;
}
function frameResponse(res, event, msg) {
  if (!res || res.destroyed || res.writableEnded) return;
  if (res.writableLength > 1024 * 1024) { res.destroy(); return; }
  res.write('event: ' + event + '\ndata: ' + msg + '\n\n');
}

function createExpeditionServer({simulation} = {}) {
  const makeSimulation = simulation ? () => simulation : compileSimulation();
  const rooms = new Map();
  const gameRoot = fs.realpathSync(__dirname);
  function endRoom(room, reason) {
    rooms.delete(room.code);
    for (const m of room.members.values()) {
      if (!m.stream) continue;
      frameResponse(m.stream, 'ended', JSON.stringify({message:reason}));
      m.stream.end();
    }
    room.members.clear();
  }
  function diff(cache, data, ignore) {
    const values = {}, removed = [];
    let changed = false;
    for (const [key, value] of Object.entries(data)) {
      if (key === ignore) continue;
      const json = JSON.stringify(value);
      if (cache.get(key) !== json) {cache.set(key,json); values[key] = value; changed = true;}
    }
    for (const key of cache.keys()) {
      if (Object.hasOwn(data,key)) continue;
      cache.delete(key); removed.push(key); changed = true;
    }
    return changed ? {values,removed} : null;
  }
  function sync(room) {
    // Inventory, conversation logs, and fog maps are independent of movement updates.
    const top = diff(room.cache, room.state, 'players');
    const players = {}, gone = [];
    for (const [id, player] of Object.entries(room.state.players)) {
      if (!room.actorCache.has(id)) room.actorCache.set(id, new Map());
      const change = diff(room.actorCache.get(id), player);
      if (change) players[id] = change;
    }
    for (const id of room.actorCache.keys()) if (!room.state.players[id]) {room.actorCache.delete(id); gone.push(id);}
    if (!top && !Object.keys(players).length && !gone.length) return;
    const before = room.version++;
    const packet = JSON.stringify({prior:before, version:room.version, values:top?.values || {}, removed:top?.removed || [], players, gone});
    for (const m of room.members.values()) frameResponse(m.stream, 'patch', packet);
  }
  function attach(room, member, res) {
    const old = member.stream;
    visit(room, member);
    sync(room);
    member.stream = res;
    if (old) old.end();
    res.writeHead(200, {'Content-Type':'text/event-stream', 'Cache-Control':'no-store, no-transform', 'X-Accel-Buffering':'no', 'Connection':'keep-alive'});
    res.write('retry: 1200\n\n');
    frameResponse(res, 'state', JSON.stringify({state:room.state, version:room.version}));
    res.once('close', () => {
      if (member.stream !== res) return;
      member.stream = null;
      member.lastSeen = Date.now();
      stopMember(member);
    });
  }
  async function request(req, res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    const url = new URL(req.url, 'http://island.local');
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] !== 'api') {
      if (!['GET','HEAD'].includes(req.method)) throw fail(405, '不支援的請求。');
      let name;
      try { name = decodeURIComponent(url.pathname).replace(/^\//, '') || 'index.html'; } catch {throw fail(400, '檔案名稱無效。');}
      if (!/^(?:assets\/)?[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(name) || !TYPES[path.extname(name)] || name.includes('..')) throw fail(404, '找不到此檔案。');
      let real;
      try {real = fs.realpathSync(path.join(gameRoot, name));} catch {throw fail(404, '找不到此檔案。');}
      if (!real.startsWith(gameRoot + path.sep)) throw fail(404, '找不到此檔案。');
      const stat = fs.statSync(real);
      if (!stat.isFile()) throw fail(404, '找不到此檔案。');
      res.writeHead(200, {'Content-Type':TYPES[path.extname(name)], 'Content-Length':stat.size, 'Cache-Control':'no-cache'});
      if (req.method === 'HEAD') return res.end();
      return fs.createReadStream(real).on('error', () => res.destroy()).pipe(res);
    }
    if (req.headers.origin) {
      let origin;
      try {origin = new URL(req.headers.origin);} catch {throw fail(403, '來源無效。');}
      if (!['http:', 'https:'].includes(origin.protocol) || origin.host !== req.headers.host) throw fail(403, '請在遊戲頁面中操作。');
    }
    if (url.pathname === '/api/ping' && req.method === 'GET') return sendJSON(res, 200, {game:'hunter-island', protocol:1});
    if (parts[1] !== 'rooms') throw fail(404, '找不到此服務。');
    if (parts.length === 2 && req.method === 'POST') {
      const options = await bodyOf(req);
      if (rooms.size >= 32) throw fail(503, '目前房間已滿，請稍後再試。');
      if (!['tom','jerry'].includes(options.character)) throw fail(400, '請由 Tom 或 Jerry 領隊。');
      const loadout = options.loadout ?? [];
      const Sim = makeSimulation();
      const gear = Sim.loadouts.map(g => g.id);
      if (!Array.isArray(loadout) || loadout.length > 2 || new Set(loadout).size !== loadout.length || loadout.some(id => !gear.includes(id))) throw fail(400, '行囊選擇無效。');
      let code;
      do { code = Array.from({length:6}, () => codeAlphabet[crypto.randomInt(codeAlphabet.length)]).join(''); } while (rooms.has(code));
      const seed = Number.isSafeInteger(options.seed) ? options.seed >>> 0 : crypto.randomInt(0x7fffffff);
      const state = Sim.newGame({character:options.character, loadout, seed});
      const m = newMember('p1', options.character);
      const room = {code, state, sim:Sim, version:0, cache:new Map(), actorCache:new Map(), members:new Map([[m.token,m]]), lastActive:Date.now(), lastPing:Date.now()};
      rooms.set(code, room);
      state.players.p1.connected = true;
      sync(room);
      return respondSession(room, m, res);
    }
    const room = rooms.get(parts[2]);
    if (!room) throw fail(404, '找不到房間，請核對六位房號。');
    if (req.method === 'GET' && parts.length === 3) return sendJSON(res, 200, publicRoom(room));
    if (parts.length !== 4) throw fail(404, '找不到此服務。');
    const operation = parts[3];
    if (operation === 'join' && req.method === 'POST') {
      const options = await bodyOf(req);
      if (rooms.get(room.code) !== room) throw fail(404, '房間已關閉。');
      if (room.state.status !== 'playing') throw fail(409, '這次遠征已經結束。');
      if (!publicRoom(room).free.includes(options.character)) throw fail(409, '該角色已有人使用，請另選角色。');
      const used = new Set([...room.members.values()].map(m=>m.actor));
      const actor = SEATS.find(id => !used.has(id));
      if (!actor) throw fail(409, '房間已滿。');
      const m = newMember(actor, options.character);
      room.sim.addPlayer(room.state, actor, m.character);
      room.members.set(m.token, m);
      visit(room, m);
      sync(room);
      return respondSession(room, m, res);
    }
    const token = (req.headers.authorization || '').replace(/^Bearer /, '') || (operation === 'stream' ? url.searchParams.get('key') : null);
    const m = room.members.get(token);
    if (!m) throw fail(403, '這個房間的連線憑證已失效。');
    if (req.method === 'GET' && operation === 'stream') return attach(room,m,res);
    if (req.method === 'GET' && operation === 'state') {
      visit(room, m);
      return sendJSON(res, 200, {state:room.state, version:room.version});
    }
    if (req.method !== 'POST') throw fail(405, '不支援的請求。');
    const data = await bodyOf(req);
    if (rooms.get(room.code) !== room || room.members.get(token) !== m) throw fail(403, '這次連線已結束。');
    if (operation === 'leave') {
      if (m.actor === 'p1') endRoom(room, '領隊已結束房間。');
      else {
        room.members.delete(m.token);
        if (m.stream) m.stream.end();
        room.sim.removePlayer(room.state, m.actor);
        sync(room);
      }
      return sendJSON(res, 200, {ok:true});
    }
    if (operation !== 'input' && operation !== 'action') throw fail(404, '找不到此服務。');
    const now = Date.now();
    if (now - m.budgetAt >= 1000) {m.budgetAt = now; m.budget = 0;}
    if (++m.budget > 75) throw fail(429, '操作太快，請稍候。');
    visit(room, m);
    if (operation === 'input') {
      if (![data.x, data.y].every(n => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 1) || typeof data.sprint !== 'boolean' || !Number.isSafeInteger(data.seq)) throw fail(400, '移動資料無效。');
      if (data.seq > m.sequence) {
        m.sequence = data.seq; m.inputTime = now;
        m.input = {x:data.x, y:data.y, sprint:data.sprint};
      }
    } else if (room.state.status === 'playing' && !room.state.players[m.actor]?.dead) {
      const action = safeAction(data.action);
      if (typeof data.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(data.id)) throw fail(400, '無效的遊戲操作。');
      if (!m.actionIds.has(data.id)) {
        room.sim.act(room.state, m.actor, action);
        m.actionIds.add(data.id);
        if (m.actionIds.size > 128) m.actionIds.delete(m.actionIds.values().next().value);
        sync(room);
      }
    }
    return sendJSON(res, 200, {ok:true});
  }
  function respondSession(room, m, res) {
    sendJSON(res, 200, {session:{code:room.code, actor:m.actor, character:m.character, host:m.actor === 'p1'}, token:m.token, state:room.state, version:room.version});
  }
  const server = http.createServer((req, res) => {
    request(req, res).catch(err => {
      if (!err.status) console.error('Hunter Island:', err.message);
      if (!res.headersSent) sendJSON(res, err.status || 500, {error:err.status ? err.message : '遠征服務暫時無法處理操作。'});
      else res.destroy();
    });
  });
  let last = performance.now();
  const timer = setInterval(() => {
    const current = performance.now(), now = Date.now();
    const dt = Math.min((current - last) / 1000, 0.25);
    last = current;
    for (const room of rooms.values()) {
      try {
        const inputs = {};
        let active = false;
        for (const m of room.members.values()) {
          const online = !!m.stream || now - m.lastSeen < 4500;
          if (online) {room.lastActive = now; active = true;}
          const player = room.state.players[m.actor];
          if (player) player.connected = online;
          if (!online && m.actor !== 'p1' && now - m.lastSeen > 120000) {
            room.members.delete(m.token);
            room.sim.removePlayer(room.state, m.actor);
            continue;
          }
          if (!online || now - m.inputTime > 1450) stopMember(m);
          inputs[m.actor] = m.input;
        }
        if (!active && now - room.lastActive > 600000) {endRoom(room, '房間已因閒置而關閉。'); continue;}
        if (active && room.state.status === 'playing') room.sim.step(room.state, inputs, dt);
        sync(room);
        if (now - room.lastPing > 15000) {
          for (const m of room.members.values()) if (m.stream) m.stream.write(': heartbeat\n\n');
          room.lastPing = now;
        }
      } catch (err) {console.error('Hunter Island:', err.message); endRoom(room,'房間運行中斷，請重新建立。');}
    }
  }, 50);
  timer.unref();
  server.closeRoomTimers = () => {
    clearInterval(timer);
    for (const room of [...rooms.values()]) endRoom(room, '遠征服務已關閉。');
  };
  server.on('close', server.closeRoomTimers);
  return server;
}
module.exports = {createExpeditionServer};
if (require.main === module) {
  const port = Number(process.env.PORT || 4177);
  const host = process.env.HOST || '0.0.0.0';
  const server = createExpeditionServer();
  server.on('error', err => {console.error(err.code === 'EADDRINUSE' ? '這個連接埠已在使用。請先關閉舊房間，或透過 PORT 指定其他連接埠。' : err.message); process.exitCode=1;});
  server.listen(port, host, () => {
    console.log('獵人島 Hunter Island\n本機遊玩  http://localhost:' + server.address().port);
    if (host === '0.0.0.0' || host === '::') for (const group of Object.values(os.networkInterfaces())) for (const address of group || []) if (address.family === 'IPv4' && !address.internal) console.log('同網路好友  http://' + address.address + ':' + server.address().port);
    console.log('保持此視窗開啟。結束時按 Ctrl+C。');
  });
}
