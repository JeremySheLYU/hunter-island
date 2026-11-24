/* The server owns expedition time, inventory and movement for all four seats. */
(() => {
  'use strict';
  const slot = 'hunter-island.coop.v1';
  let session = null, token = '', snapshot = null, version = -1;
  let stream = null, timer = null, lastFrame = 0, lastPoll = 0, syncing = false, streamErrors = 0;
  let held = {x:0, y:0, sprint:false}, lastMove = 0, sequence = 0, actionCount = 0;
  let actionQueue = Promise.resolve(), recovering = false;
  const msg = text => Net.onstatus?.(text);
  function saved() {try {return JSON.parse(sessionStorage.getItem(slot));} catch {return null;}}
  function persist(data) {try {if (data) sessionStorage.setItem(slot,JSON.stringify(data)); else sessionStorage.removeItem(slot);} catch {}}
  function canonical(code) {
    const value = String(code || '').trim().toUpperCase();
    if (!/^[A-Z2-9]{6}$/.test(value)) throw new Error('請輸入六位房號。');
    return value;
  }
  async function request(path, {method='GET', body, key, keepalive=false, timeout=6500} = {}) {
    if (!/^https?:$/.test(location.protocol)) throw new Error('多人模式需要從遠征伺服器網址開啟。');
    const controller = new AbortController();
    const abort = setTimeout(() => controller.abort(), timeout);
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (key) headers.Authorization = 'Bearer ' + key;
    try {
      const response = await fetch('/api/' + path, {method, headers, body:body === undefined ? undefined : JSON.stringify(body), signal:controller.signal, credentials:'same-origin', cache:'no-store', keepalive});
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw Object.assign(new Error(data.error || '遠征伺服器未能處理請求。'), {status:response.status});
      return data;
    } catch (error) {
      if (error.name === 'AbortError' || error.name === 'TypeError') throw new Error('連線逾時，請確認遠征伺服器與網路。');
      throw error;
    } finally {clearTimeout(abort);}
  }
  const endpoint = (s, op) => 'rooms/' + s.code + '/' + op;
  function clear() {
    if (stream) stream.close();
    stream = null;
    clearInterval(timer); timer = null;
    token = ''; session = null; snapshot = null; version = -1;
    held = {x:0,y:0,sprint:false}; syncing = false; recovering = false; streamErrors = 0;
    actionQueue = Promise.resolve();
  }
  function ended(reason) {
    clear();
    persist(null);
    msg(reason);
    Net.onended?.(reason);
  }
  function receiveState(data, s) {
    if (session !== s || !data.state || !Number.isFinite(data.version) || data.version < version) return;
    version = data.version;
    snapshot = data.state;
    lastFrame = Date.now();
    if (recovering) {recovering = false; msg('已重新連上房間。');}
    Net.onstate?.(snapshot, session);
  }
  async function refreshState(s) {
    if (syncing || session !== s) return;
    syncing = true; lastPoll = Date.now();
    try {receiveState(await request(endpoint(s,'state'), {key:token, timeout:4500}), s);}
    catch (error) {if (session === s && [403,404].includes(error.status)) ended(error.message);}
    finally {if (session === s) syncing = false;}
  }
  function connectStream(s) {
    if (typeof EventSource !== 'function') return;
    stream = new EventSource('/api/' + endpoint(s,'stream') + '?key=' + encodeURIComponent(token));
    stream.addEventListener('state', ev => {streamErrors=0; receiveState(JSON.parse(ev.data),s);});
    stream.addEventListener('patch', ev => {
      if (session !== s) return;
      const patch = JSON.parse(ev.data);
      if (patch.version <= version) return;
      if (patch.prior !== version || !snapshot) {refreshState(s); return;}
      Object.assign(snapshot, patch.values);
      for (const key of patch.removed) delete snapshot[key];
      for (const [id, update] of Object.entries(patch.players || {})) {
        if (!snapshot.players[id]) snapshot.players[id] = {};
        Object.assign(snapshot.players[id],update.values);
        for (const key of update.removed) delete snapshot.players[id][key];
      }
      for (const id of patch.gone || []) delete snapshot.players[id];
      version = patch.version; lastFrame = Date.now();
      if (recovering) {recovering = false; msg('已重新連上房間。');}
      Net.onstate?.(snapshot, session);
    });
    stream.addEventListener('ended', ev => {if (session === s) ended(JSON.parse(ev.data).message);});
    stream.onerror = () => {
      if (session !== s) return;
      if (++streamErrors >= 3) {stream.close(); stream=null;}
      if (!recovering) {recovering = true; msg('正在重新連線…');}
      refreshState(s);
    };
  }
  function pushMove(s) {
    if (!s || session !== s) return;
    lastMove = Date.now();
    sequence = Math.max(sequence + 1, lastMove * 1000);
    request(endpoint(s,'input'), {method:'POST', key:token, body:{...held,seq:sequence}, timeout:2600})
      .catch(err => {if (s === session && [403,404].includes(err.status)) ended(err.message);});
  }
  function install(s, key, data) {
    clear();
    session = s; token = key;
    persist({session:s,token:key});
    receiveState(data,s);
    connectStream(s);
    timer = setInterval(() => {
      const now = Date.now();
      if ((held.x || held.y) && now - lastMove >= 600) pushMove(s);
      const idle = !stream || stream.readyState !== 1;
      if (idle ? now - lastPoll > 350 : now - lastFrame > 3500 && now - lastPoll > 2500) refreshState(s);
    }, 160);
    return s;
  }
  const Net = {
    onstate:null, onstatus:null, onended:null,
    get state() {return snapshot;},
    get session() {return session;},
    get hasSession() {return !!saved()?.token;},
    async available() {
      try {const info = await request('ping',{timeout:1700}); return info.game === 'hunter-island' && info.protocol === 1;} catch {return false;}
    },
    async roomInfo(code) {return request('rooms/' + canonical(code));},
    async host(options) {
      if (session) throw new Error('請先退出目前的房間。');
      const data = await request('rooms', {method:'POST',body:options});
      return install(data.session,data.token,data);
    },
    async join(code,character) {
      if (session) throw new Error('請先退出目前的房間。');
      const data = await request('rooms/' + canonical(code) + '/join', {method:'POST',body:{character}});
      return install(data.session,data.token,data);
    },
    async resume() {
      if (session) return session;
      const cached = saved();
      if (!cached?.token || !cached.session?.code) return null;
      try {
        const data = await request(endpoint(cached.session,'state'), {key:cached.token});
        return install(cached.session,cached.token,data);
      } catch (err) {
        if ([403,404].includes(err.status)) persist(null);
        throw err;
      }
    },
    move(x,y,sprint=false) {
      const a = Math.max(-1,Math.min(1, Number(x) || 0));
      const b = Math.max(-1,Math.min(1, Number(y) || 0));
      if (!session || (a === held.x && b === held.y && !!sprint === held.sprint)) return;
      held = {x:a,y:b,sprint:!!sprint};
      pushMove(session);
    },
    action(action) {
      const s = session, key = token;
      if (!s) return Promise.resolve(false);
      const id = Date.now().toString(36) + '-' + (++actionCount).toString(36);
      actionQueue = actionQueue.then(async () => {
        if (session !== s) return false;
        try {
          await request(endpoint(s,'action'), {method:'POST',key,body:{id,action}});
          if (!stream || stream.readyState !== 1) await refreshState(s);
          return true;
        } catch (err) {
          if (session === s) {
            if ([403,404].includes(err.status)) ended(err.message);
            else msg(err.message);
          }
          return false;
        }
      });
      return actionQueue;
    },
    async leave() {
      const s = session, key = token;
      clear(); persist(null);
      if (!s) return true;
      try {await request(endpoint(s,'leave'), {method:'POST',body:{},key,keepalive:true,timeout:3000}); return true;}
      catch {return false;}
    }
  };
  window.addEventListener('blur', () => Net.move(0,0,false));
  window.Net = Net;
})();
