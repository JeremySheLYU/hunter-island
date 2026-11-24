/* Title, expedition preparation, input, saves and the main render loop. */
(() => {
  'use strict';
  const q = (sel, root=document) => root.querySelector(sel);
  const screen=q('#screen'), canvas=q('#world'), hud=q('#hud'), toastNode=q('#system-toast');
  const SAVE='hunter-island.expedition.v1';
  const geom={
    play:'<path d="m7 4 13 8-13 8z" fill="currentColor" stroke="none"/>',
    arrow:'<path d="M4 12h14m-6-6 6 6-6 6"/>', back:'<path d="M20 12H5m6-6-6 6 6 6"/>',
    people:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m0-15a3 3 0 0 1 0 6m2 2c3 0 4 2 4 5v2"/>',
    handbook:'<path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1zM12 6v14"/>',
    sound:'<path d="M3 10h4l5-4v12l-5-4H3zM15 9q4 3 0 6m3-9q6 6 0 12"/>',
    quiet:'<path d="M3 10h4l5-4v12l-5-4H3zM16 9l6 6m0-6-6 6"/>',
    full:'<path d="M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5"/>',
    save:'<path d="M4 3h13l4 4v14H3V3zM7 3v6h9V3M7 21v-8h10v8"/>',
    camp:'<path d="m2 19 10-15 10 15zm5 0 5-8 5 8"/>'
  };
  const ico=(k)=>'<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">'+geom[k]+'</svg>';
  const esc=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const roles={
    tom:{name:'Tom',tag:'田徑好手',desc:'16 歲，跑得快，也消耗更多口糧。',tile:0},
    jerry:{name:'Jerry',tag:'謹慎的規劃者',desc:'17 歲，負重較高，怕水且對海鮮過敏。',tile:1},
    cassia:{name:'Cassia',tag:'野外嚮導',desc:'Jerry 的姊姊，耐寒、負重高，自備石工具。',tile:2},
    wangcai:{name:'旺財',tag:'黃金獵犬',desc:'跑得快、靠嗅覺記路。人類的話聽起來像亂碼。',tile:3}
  };
  const shortGear={flask:'在泉眼反覆汲水',map:'一路記錄足跡與地形',coat:'在夜風與雨中保暖',tool:'採木、取石更省力',salve:'受傷後恢復健康',torch:'夜間照明，驅離野獸'};
  let state=null, actor='p1', online=false, view='title', paused=false, mode='solo', guideBack='title';
  let setupRole='tom', selected=['map','flask'], listedRoom=null, joinCode='', netReady=null, busy=false, saveWarned=false;
  let renderTick=0,hudTick=0,saveTick=0,last=0,toastTimer=0;
  let stick={x:0,y:0,sprint:false},lastNetworkInput='', held=new Set(),lastTap=Object.create(null),fastKey=null;
  const dir={KeyW:[0,-1],ArrowUp:[0,-1],KeyS:[0,1],ArrowDown:[0,1],KeyA:[-1,0],ArrowLeft:[-1,0],KeyD:[1,0],ArrowRight:[1,0]};
  function notify(text){toastNode.textContent=text;toastNode.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastNode.classList.remove('show'),3200);}
  function resetInput(){held.clear();fastKey=null;lastTap=Object.create(null);stick={x:0,y:0,sprint:false};lastNetworkInput='';if(online)Net.move(0,0,false);}
  function save(){
    if(!state||online)return false;
    try{localStorage.setItem(SAVE,JSON.stringify(state));saveWarned=false;return true;}
    catch{if(!saveWarned)notify('瀏覽器未能儲存進度，請保持遊戲視窗開啟。');saveWarned=true;return false;}
  }
  function readSave(){
    try{const s=JSON.parse(localStorage.getItem(SAVE));return s?.version===1&&s.players?.p1&&s.status==='playing'&&Number.isFinite(s.time)?s:null;}
    catch{return null;}
  }
  function mark(){return '<svg viewBox="0 0 40 40" aria-hidden="true"><path fill="none" stroke="#ccb881" stroke-width="1.3" d="m20 1 18 19-18 19L2 20Z"/><path fill="#dae4bf" d="m8 25 8-13 4 6 4-10 9 17h-8l-3-6-3 5-3-5-4 6z"/><path fill="#efad64" d="M14 28h13v2H14z"/></svg>';}
  function mast(back=false){return '<header class="mast"><div class="brand">'+mark()+'<div><b>獵人島</b><small>HUNTER ISLAND</small></div></div><div class="top-actions">'+(back?'<button class="backbtn" data-do="back">'+ico('back')+' 返回</button>':'')+'<button class="iconbtn" data-do="sound" aria-label="'+(IslandSound.muted?'開啟聲音':'靜音')+'" title="'+(IslandSound.muted?'開啟聲音':'靜音')+'">'+ico(IslandSound.muted?'quiet':'sound')+'</button>'+(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen?'<button class="iconbtn" data-do="full" aria-label="切換全螢幕" title="切換全螢幕">'+ico('full')+'</button>':'')+'</div></header>';}
  const lead=(icon,label)=>'<span class="lead">'+ico(icon)+label+'</span>';
  const primary=(command,icon,label)=>'<button class="menu-primary" data-do="'+command+'">'+lead(icon,label)+ico('arrow')+'</button>';
  function folder(eyeline,heading,body){screen.innerHTML='<section class="shell folder-shell">'+mast(true)+'<div class="folder-wrap"><article class="folder"><span class="kicker">'+eyeline+'</span><h1>'+heading+'</h1>'+body+'</article></div></section>';}
  function overlay(eyeline,heading,body){screen.innerHTML='<div class="overlay"><article class="overlay-card" role="dialog" aria-modal="true" aria-label="'+esc(heading)+'"><span class="kicker">'+eyeline+'</span><h1>'+heading+'</h1>'+body+'</article></div>';}
  function exitSession(){resetInput();if(state&&!online)save();if(online)Net.leave();online=false;state=null;actor='p1';HUD.unmount();hud.hidden=true;hud.inert=true;canvas.hidden=true;paused=false;IslandSound.scene('menu');}
  function title(){view='title';paused=false;screen.hidden=false;hud.hidden=true;canvas.hidden=true;IslandSound.scene('menu');const stored=readSave();
    const day=stored?Math.floor(stored.time/1440)+1:0;
    screen.innerHTML='<section class="shell title-scene">'+mast()+'<div class="title-content"><div class="title-block"><div class="eyeline">WILDERNESS ADVENTURE</div><img class="wordmark" src="wordmark.png" alt="Be a Survival"><h1 class="title-track">獵人島<span>HUNTER ISLAND</span></h1><p class="motto">一張舊地圖，一座未知的島。<br>找到前人留下的寶藏，活著回到碼頭。</p><nav class="menu-choices" aria-label="主選單">'+primary(stored?'continue':'new',stored?'save':'play',stored?'繼續探險 · 第 '+day+' 天':'開始探險')+'<button class="menu-secondary" data-do="coop">'+ico('people')+' 多人同行</button><button class="menu-secondary" data-do="guide">'+ico('handbook')+' 探險手冊</button></nav>'+(stored?'<button class="new-link" data-do="new">展開新旅程</button>':'')+'</div></div><footer class="title-footer"><span class="foot-credit"><i></i> GAME CONCEPT BY SHE LYU</span><span class="input-note">鍵盤操作　／　觸控支援</span></footer></section>';
    if(Net.hasSession){const n=document.createElement('button');n.className='new-link';n.dataset.do='reconnect';n.textContent='重新加入上一個房間';q('.title-block').append(n);}
  }
  function beginSetup(kind){mode=kind;setupRole='tom';selected=['map','flask'];setup();}
  function roleButton(id,blocked=false){const r=roles[id];return '<button class="role" data-role="'+id+'" aria-pressed="'+(setupRole===id)+'" '+(blocked?'disabled':'')+'><span class="portrait" style="background-position:'+r.tile*100/3+'% 0"></span><span><b>'+r.name+'</b><small>'+r.tag+' · '+(blocked?'已加入':r.desc)+'</small></span></button>';}
  function setup(){const oldScroll=view==='setup'?(q('.folder-shell',screen)?.scrollTop||0):0;view='setup';const joining=mode==='join';
    const roleIds=joining?Object.keys(roles):['tom','jerry'];
    folder(joining?'MULTIPLAYER / JOIN':'CHAPTER 01 / OCT. 10',joining?'加入遠征隊':'出發前的露營店',
      '<p class="intro">'+(joining?'房號 '+esc(joinCode)+'。挑一位還沒上島的夥伴，一起完成這趟遠征。':'10 月 10 日，Tom 在跳蚤市場買到一張舊藏寶圖。Jerry 拉著他走進露營店。船就要開了，你要帶什麼？')+'</p><div class="field-title"><strong>選擇角色</strong><small>'+(joining?'共用島嶼、各自背包':'Ultimo 高中探險搭檔')+'</small></div><div class="char-grid">'+roleIds.map(id=>roleButton(id,joining&&!listedRoom.free.includes(id))).join('')+'</div>'+
      (joining?'':'<div class="field-title"><strong>出發裝備</strong><small>自備乾糧與飲水 · 另選 <b>'+selected.length+'/2</b> 件</small></div><div class="gear-grid">'+Sim.loadouts.map(it=>'<button class="gear" data-gear="'+esc(it.id)+'" aria-pressed="'+selected.includes(it.id)+'"><b>'+esc(it.name)+'</b><small>'+esc(shortGear[it.id]||it.desc)+'</small></button>').join('')+'</div>')+
      '<div class="response" role="status"></div><div class="actions"><button class="main-cta" data-do="embark" '+((!joining&&selected.length!==2)||busy?'disabled':'')+'>'+ico('camp')+' '+(joining?'加入房間':mode==='host'?'建立房間並登島':'整裝登島')+' '+ico('arrow')+'</button></div>');if(oldScroll)q('.folder-shell',screen).scrollTop=oldScroll;}
  function guide(from){guideBack=from;view='guide';const guideBody='<p class="intro">靠近碼頭上的 W，使用互動鍵打聽航海圖。日誌會寫下下一條線索。</p><dl class="guide-grid"><dt><kbd>WASD</kbd> ／ <kbd>↑↓←→</kbd></dt><dd>四向移動</dd><dt><kbd>Shift</kbd> ＋移動</dt><dd>奔跑，也可連按兩下方向鍵</dd><dt><kbd>E</kbd></dt><dd>與身邊人物或物件互動</dd><dt><kbd>B</kbd> ／ <kbd>C</kbd></dt><dd>背包 ／ 製作</dd><dt><kbd>J</kbd> ／ <kbd>M</kbd></dt><dd>日誌 ／ 地圖</dd><dt><kbd>Esc</kbd></dt><dd>關閉面板或暫停</dd></dl><div class="co-box"><h2>手機操作</h2><p>按住畫面上的方向控制移動，點互動鍵查看附近的行動。背包可使用物品，製作頁顯示配方和缺少的材料。</p></div><div class="co-box"><h2>野外筆記</h2><p>注意飽足、水分、疲勞和體溫。地圖靠探索逐步繪成。想給背包騰出空間，可以把物品放在原地，其他人也能拾取。</p></div><div class="actions"><button class="main-cta" data-do="back">返回 '+ico('back')+'</button></div>';
    if(from==='pause')overlay('FIELD GUIDE','探險手冊',guideBody);else folder('FIELD GUIDE','探險手冊',guideBody);
  }
  async function coop(){view='coop';netReady=null;drawCoop();const ready=await Net.available();if(view!=='coop')return;netReady=ready;drawCoop();}
  function drawCoop(){folder('EXPEDITION CREW','多人同行',
    '<p class="intro">一人開房，最多四人同島探索。Tom 或 Jerry 帶隊，Cassia 和旺財也能加入。</p>'+
    (netReady===null?'<p class="instructions">正在尋找遠征伺服器…</p>':netReady?'<div class="co-box"><h2>擔任隊長</h2><p>備好裝備，登島後把六位房號交給隊友。</p><button class="main-cta" data-do="host">'+ico('camp')+' 建立房間</button></div><div class="co-box"><h2>加入朋友</h2><p>請先從同一個伺服器網址開啟遊戲。</p><form class="network-form"><input class="text-input" name="room" aria-label="六位房號" placeholder="六位房號" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="6" required><button class="minor-cta" type="submit">尋找房間</button></form><div class="response" role="status"></div></div>':'<div class="co-box"><h2>啟動合作版</h2><p>在電腦上解壓完整遊戲包，執行 <code>node server.cjs</code>；Mac 也可雙擊 <code>Launch.command</code>。需要 Node.js 18 或以上。</p><p>用終端顯示的網址開啟遊戲。同一 Wi-Fi 的隊友可用手機輸入區域網路網址，再輸入房號。</p><div class="actions"><a class="minor-cta" href="http://localhost:4177/">開啟本機伺服器</a><button class="minor-cta" data-do="coop">重新檢查</button></div></div>'));}
  async function findRoom(code){if(busy)return;busy=true;try{const found=await Net.roomInfo(code);if(view!=='coop')return;listedRoom=found;joinCode=found.code;if(!found.free.length)throw Error('房間已滿。');mode='join';setupRole=found.free[0];busy=false;setup();}catch(err){message(err.message);}finally{busy=false;}}
  function message(s){const node=q('.response',screen);if(node)node.textContent=s;else notify(s);}
  function seed(){return crypto.getRandomValues(new Uint32Array(1))[0] || 1;}
  async function embark(overwrite=false){
    if(busy)return;if(mode==='solo'&&!overwrite&&readSave()){view='overwrite';overlay('NEW EXPEDITION','取代上次旅程？','<p>出航後，這次單人探險的進度會取代舊存檔。</p><div class="actions"><button class="minor-cta" data-do="setup">返回備裝</button><button class="main-cta" data-do="overwrite">取代並登島</button></div>');return;}
    busy=true;const b=q('[data-do=embark]');if(b)b.disabled=true;
    try{
      if(mode==='solo'){start(Sim.newGame({character:setupRole,loadout:selected,seed:seed()}),'p1',false);save();}
      else{const sess=mode==='join'?await Net.join(joinCode,setupRole):await Net.host({character:setupRole,loadout:selected,seed:seed()});start(Net.state,sess.actor,true);notify('已加入遠征隊 · 房號 '+sess.code);}
    }catch(err){message(err.message);}finally{busy=false;if(b)b.disabled=false;}
  }
  function start(s,id,net){if(!s?.players?.[id])throw Error('無法讀取遠征記錄。');state=s;actor=id;online=net;paused=false;resetInput();
    view='game';screen.innerHTML='';screen.hidden=true;canvas.hidden=false;hud.hidden=false;hud.inert=false;last=performance.now();hudTick=1;saveTick=0;
    IslandSound.scene('field');IslandSound.cue('begin');
    HUD.mount(hud,{act:act,move:(x,y,sprint)=>{stick={x,y,sprint};},pause:pause,mute:()=>IslandSound.toggle(),isMuted:()=>IslandSound.muted,getRoom:()=>online?Net.session?.code:null});
    HUD.update(state,actor);World.render(canvas,state,actor);checkEnding();}
  function act(a){if(!state||paused||state.status!=='playing')return;IslandSound.cue('action');if(online)Net.action(a);else{Sim.act(state,actor,a);HUD.update(state,actor);save();checkEnding();}}
  function pause(){if(!state||state.status!=='playing')return;resetInput();paused=true;view='pause';if(!online)save();screen.hidden=false;hud.inert=true;
    const party=Net.session;overlay(online?'EXPEDITION CREW':'CAMP BREAK',online?'隊伍選單':'探險暫停','<p>'+(online?'房號 <b>'+esc(party?.code)+'</b>。隊友仍在探索，島上的時間持續推進。':saveWarned?'目前進度仍在這個視窗中。':'已記錄這趟旅程，隨時可以接著走。')+'</p><div class="menu-choices">'+primary('resume','play','返回島上')+'<button class="menu-secondary" data-do="guide">'+ico('handbook')+' 操作手冊</button><button class="menu-secondary" data-do="sound">'+ico(IslandSound.muted?'quiet':'sound')+' '+(IslandSound.muted?'開啟聲音':'關閉聲音')+'</button>'+(online?'<button class="menu-secondary full" data-do="copy">複製房號</button>':'')+'<button class="menu-secondary full" data-do="exit">'+(online?'離開遠征隊':'儲存並返回主選單')+'</button></div>');}
  function resume(){view='game';paused=false;screen.hidden=true;screen.innerHTML='';hud.inert=false;hudTick=1;last=performance.now();}
  function checkEnding(){
    if(!state||state.status==='playing'||view==='ending')return;
    resetInput();if(!online)save();view='ending';paused=true;hud.hidden=true;hud.inert=true;screen.hidden=false;
    const end=Sim.view(state,actor).ending||{};const won=state.status==='won';IslandSound.cue(won?'win':'lost');IslandSound.scene('menu');
    overlay(won?'EXPEDITION COMPLETE':'END OF EXPEDITION',end.title||(won?'平安歸航':'旅程結束'),'<p>'+esc(end.body||'你的足跡已留在島上。')+'</p><div class="end-stats"><div><b>'+esc(end.days||Math.floor(state.time/1440)+1)+'</b><small>遠征天數</small></div><div><b>'+esc(end.discoveries??0)+'</b><small>已測繪地格</small></div><div><b>'+esc(end.samples??0)+'</b><small>自然樣本</small></div></div><div class="actions"><button class="main-cta" data-do="endhome">返回主選單 '+ico('arrow')+'</button></div>');
  }
  function back(){if(busy)return;if(view==='guide'&&guideBack==='pause'){pause();return;}if(view==='pause'||(view==='confirm-leave'&&state)){if(view==='pause')resume();else pause();return;}if(view==='overwrite'){setup();return;}if(view==='setup'&&mode!=='solo'){coop();return;}if(view==='ending'){exitSession();title();return;}title();}
  function toggleSound(){const off=IslandSound.toggle();if(!off)IslandSound.cue('tap');if(view==='pause'){pause();return;}
    for(const btn of screen.querySelectorAll('[data-do=sound]')){btn.innerHTML=ico(off?'quiet':'sound');btn.title=off?'開啟聲音':'靜音';btn.setAttribute('aria-label',btn.title);}}
  async function button(cmd){
    if(busy)return;if(cmd!=='sound')IslandSound.cue('tap');
    switch(cmd){
      case 'new': beginSetup('solo');break;
      case 'host':beginSetup('host');break;
      case 'continue':{const s=readSave();if(s)start(s,'p1',false);else title();break;}
      case 'coop':await coop();break;
      case 'reconnect':busy=true;try{const s=await Net.resume();if(s)start(Net.state,s.actor,true);else title();}catch(err){title();notify(err.message);}finally{busy=false;}break;
      case 'guide':guide(view==='pause'?'pause':'title');break;
      case 'embark':await embark();break;
      case 'overwrite':await embark(true);break;
      case 'setup':setup();break;
      case 'back':back();break;
      case 'sound':toggleSound();break;
      case 'full':try{const d=document.documentElement;if(document.fullscreenElement||document.webkitFullscreenElement)await (document.exitFullscreen||document.webkitExitFullscreen).call(document);else await (d.requestFullscreen||d.webkitRequestFullscreen).call(d);}catch{notify('目前的視窗無法切換全螢幕。');}break;
      case 'resume':resume();break;
      case 'copy':try{await navigator.clipboard.writeText(Net.session.code);notify('已複製房號 '+Net.session.code);}catch{notify('房號 '+Net.session.code);}break;
      case 'exit':if(online&&Net.session?.host){view='confirm-leave';overlay('EXPEDITION CREW','關閉隊伍房間？','<p>隊長離開會結束所有隊員的連線。</p><div class="actions"><button class="minor-cta" data-do="back">留在房間</button><button class="main-cta" data-do="endhome">關閉並離開</button></div>');}else{exitSession();title();}break;
      case 'endhome':exitSession();title();break;
    }
  }
  screen.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||b.disabled||busy)return;
    if(b.dataset.role){setupRole=b.dataset.role;IslandSound.cue();setup();q('[data-role="'+setupRole+'"]')?.focus({preventScroll:true});}
    else if(b.dataset.gear){const id=b.dataset.gear;if(selected.includes(id))selected=selected.filter(i=>i!==id);else if(selected.length<2)selected.push(id);else{message('背包可加選兩件裝備。先取消一件，再選新的。');return;}IslandSound.cue();setup();q('[data-gear="'+id+'"]')?.focus({preventScroll:true});}
    else if(b.dataset.do)button(b.dataset.do).catch(err=>notify(err.message));
  });
  screen.addEventListener('submit',e=>{e.preventDefault();findRoom(new FormData(e.target).get('room'));});
  window.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey||e.isComposing||e.target.matches('input,textarea,select'))return;
    if(e.code==='Escape'){e.preventDefault();if(e.repeat)return;if(view==='game'){if(!HUD.close())pause();}else if(view!=='title')back();return;}
    if(view!=='game'||!state)return;
    if(dir[e.code]){e.preventDefault();if(e.repeat||HUD.isModal())return;const t=performance.now();if(t-(lastTap[e.code]??-1000)<290)fastKey=e.code;lastTap[e.code]=t;held.add(e.code);return;}
    if(e.code==='ShiftLeft'||e.code==='ShiftRight'){held.add(e.code);return;}
    if(e.repeat)return;
    const tab={KeyB:'bag',KeyC:'craft',KeyJ:'journal',KeyM:'map'}[e.code];
    if(tab){e.preventDefault();resetInput();HUD.panel(tab);IslandSound.cue('map');}
    else if(e.code==='KeyE'){e.preventDefault();resetInput();HUD.interact();}
  });
  window.addEventListener('keyup',e=>{held.delete(e.code);if(e.code===fastKey)fastKey=null;});
  window.addEventListener('blur',()=>{resetInput();if(view==='game'&&!online)pause();});
  window.addEventListener('pagehide',()=>{save();resetInput();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){save();resetInput();if(view==='game'&&!online)pause();}else last=performance.now();});
  function movement(){if(paused||view!=='game'||HUD.isModal())return {x:0,y:0,sprint:false};
    let x=stick.x,y=stick.y;for(const code of held){if(dir[code]){x+=dir[code][0];y+=dir[code][1];}}
    const mag=Math.hypot(x,y);if(mag>1){x/=mag;y/=mag;}return {x,y,sprint:!!(stick.sprint||fastKey||held.has('ShiftLeft')||held.has('ShiftRight'))};}
  function frame(t){
    requestAnimationFrame(frame);
    if(!state||document.hidden||view==='ending')return;
    const dt=Math.min(.12,Math.max(0,(t-last)/1000));last=t;
    const input=movement();
    if(online){const key=input.x+','+input.y+','+input.sprint;if(lastNetworkInput!==key){Net.move(input.x,input.y,input.sprint);lastNetworkInput=key;}}
    else if(!paused&&!HUD.isModal()){
      Sim.step(state,{[actor]:input},dt);
      saveTick+=dt;if(saveTick>=4){saveTick=0;save();}
    }
    if(!paused){renderTick+=dt;hudTick+=dt;
      if(renderTick>=1/45){World.render(canvas,state,actor);renderTick=0;}
      if(hudTick>=.14){HUD.update(state,actor);hudTick=0;}
    }
    checkEnding();
  }
  Net.onstate=(s,sess)=>{if(online&&sess.actor===actor){state=s;checkEnding();}};
  Net.onstatus=notify;Net.onended=reason=>{if(online){exitSession();title();notify(reason);}};
  title();requestAnimationFrame(frame);
})();
