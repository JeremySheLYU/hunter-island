/* Hunter Island · field instruments, pocket atlas and accessible touch controls. */
(() => {
  'use strict';

  const signs = {
    heart: ['.aa.aa.','abcccca','abcccca','.accca.','..aca..','...a...'],
    food: ['...aa...','..abca..','.abcbca.','abcbbcca','abcbccca','.acccca.','..aaaa..'],
    water: ['...a...', '..aca..','..aca..','.abcca.','abcccca','abcccca','.accba.','..aaa..'],
    energy:['....aa.','...aba.','..aba..','.abaaa.','aacbca.','...ca..','..ca...','..a....'],
    temp:['..aa..','.acca.','.abba.','.abba.','.abba.','aabbca','abbbca','.acca.','..aa..'],
    pulse:['........','..a.....','..aa..a.','.a.a.aaa','aa..aa..','....a...','........'],
    sun:['...a...','a.....a','..aaa..','aabcbaa','..aaa..','a.....a','...a...'],
    moon:['..aa....','.aca....','abca....','abca....','abcca...','.abccaaa','..abcca.','...aaa..'],
    wind:['.....aa.','....a..a','..aaaaa.','........','aaaaa...','....a.a.','.....a..'],
    fog:['........','..aaaa..','.abbbba.','...aaaaa','aaaaa...','..aaaa..','........'],
    rain:['....aa..','..aabba.','.abcccba','aaccbbba','.aaaaaa.','..a..a..','.a..a...'],
    bag:['..aaaa..','.abbbca.','.acccca.','aacccaaa','abccbcca','abaaaaca','abbbbbca','.aaaaaa.'],
    craft:['....aaa.','....abca','.aa..ac.','.abcac..','..aba...','..aca...','.aba.a..','aaa...a.'],
    journal:['.aaaaaa.','abbbccca','aacabcca','abbbccca','aacabcca','abbbccca','aaaaaaab','.aaaaaa.'],
    map:['....aa..','aa.aaca.','abacccaa','abaccaca','ababcbca','abaccaca','aaacbcaa','...aaa..'],
    pause:['.aa..aa.','.aa..aa.','.aa..aa.','.aa..aa.','.aa..aa.','.aa..aa.'],
    marker:['..aaaa..','.abccca.','.acaaca.','.abccca.','..acca..','...aa...','...a....'],
    team:['..aa..aa..','.abc..bca.','.acc..cca.','..aa..aa..','.abcaabcca','acccabccca','aaaaccaaaa'],
    compass:['...aa...','..abba..','.abbbba.','abbbccca','abcccbba','.abccba.','..acca..','...aa...'],
    hand:['...aa...','..abaa..','..abaaba','aaabaaab','ababbbba','.abbbbba','..abbba.','...aaa..'],
    wood:['.....aa.','....abca','...abcca','..abcca.','.abcca..','abcca...','abca....','.aa.....'],
    stone:['........','...aaa..','..abcca.','.abcccca','abcccbba','abbccbaa','.aaaaaa.'],
    fiber:['....a.a.','..a.aba.','.ab.bca.','.abaab.a','..abcaba','...abca.','...aba..','...a....'],
    herb:['....aa..','...abca.','.aabcaa.','abcbba..','.aaba.a.','...aabca','...abca.','...a....'],
    berry:['...aa.a.','..abca..','.aa.aa..','abbaaaca','acccabca','.acaaaca','..aaa.a.'],
    shell:['..aaaa..','.abcbba.','abcbcbca','acbcbcca','.acbcca.','..abba..','..aaaa..'],
    ration:['.aaaaaa.','abbbbcca','abcccaca','aabbccca','abcccaca','abccbbca','.aaaaaa.'],
    flask:['..aaaa..','..abca..','..acca..','.abccba.','abcccaba','abccccca','abcccbba','.aaaaaa.'],
    rope:['.aaaaa..','abcccca.','abaaaaca','.aaabcca','..abccca','.abccaa.','abccaa..','.aa.....'],
    fire:['.....a..','...aaa..','..acba..','.aacbca.','abcccaca','abcbbcba','.abbbca.','a.aaaa.a'],
    shelter:['...aa...','..abca..','..acca..','.abcbca.','.abcbca.','abbaaaca','abaaaaaa','aaa..aaa'],
    coal:['........','...aaa..','..abcca.','.abcbcca','abccccca','.acccca.','..aaaa..'],
    paper:['.aaaaa..','.abbbca.','.abbbcca','.abbbcca','.abbcbca','.abbbbca','.aaaaaaa'],
    coat:['.aa..aa.','aba..aba','abcaacba','abccccba','aabccbba','..bccb..','..bccb..','..aaaa..'],
    tool:['...aaaa.','..abbcca','.abcccca','..aaaca.','...aca..','..aca...','.aca....','.aa.....'],
    kit:['..aaaa..','..a..a..','.aaaaaa.','abbbacca','abbaccca','abccccca','abbbacca','.aaaaaa.'],
    lamp:['..aaaa..','..a..a..','.aaaaaa.','abccccba','abccbcba','abbcbbba','..abba..','.aaaaaa.'],
    treasure:['..aaaaa.','.abbbcca','ababcaca','aaaaacaa','abccccca','abbacca.','aaaaaaa.'],

  };
  const palettes = {
    heart:['#cd7767','#ffd0a1','#ed987c'], food:['#ad8551','#f2d59c','#dbac68'],
    water:['#6aabbd','#bdebed','#87c7d4'],energy:['#7c9c5d','#d5dfa0','#b3c77f'],
    temp:['#959f87','#e79b79','#dfdbc1'],pulse:['#d89985'],map:['#8b9c77','#d6ce92','#acc397'],
    bag:['#aa8457','#dab98a','#c99b6e'],craft:['#9a9b87','#cab892','#d9d9bd'],
    journal:['#b58a66','#dbbc8e','#f0d5a2'],sun:['#e8ae70','#e9cd91','#f5dfa9'],
    moon:['#94a8b3','#ced5bf','#abc2bb'],rain:['#8ca8a6','#c0d1bf','#8aafbb'],
    marker:['#b88763','#e7a371','#ffd09d'],wood:['#986e48','#ddad72','#c68c5b'],
    stone:['#788784','#cdd1b8','#a0b2a5'],fiber:['#738654','#c8ce88','#9db070'],
    herb:['#627b50','#d3c774','#a0b881'],berry:['#8d635a','#e4a67e','#c06e68'],
    shell:['#a58e79','#e7cba5','#d8aa93'], ration:['#a68b59','#f4da9d','#d2af71'],
    flask:['#718e86','#c9d7b8','#8abbb1'],fire:['#ba775e','#f8df9e','#f2ad69'],
    coal:['#627075','#99a7a3','#788787'],kit:['#a07c64','#c28f71','#e7c4a4'],
  };
  const iconCache = new Map();
  const html = v => String(v == null ? '' : v).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[x]);
  function icon(id) {
    id = id === 'pack' ? 'bag' : id;
    if (!signs[id]) id = 'compass';
    if (!iconCache.has(id)) {
      const cv=document.createElement('canvas'), lines=signs[id], colors=palettes[id]||['#8c9d84','#decd9f','#b6ba94'];
      cv.width=cv.height=Math.max(lines.length,...lines.map(s=>s.length));
      const g=cv.getContext('2d');
      if (!g) return '';
      const dy=Math.floor((cv.height-lines.length)/2);
      lines.forEach((row,y)=>[...row].forEach((ch,x)=>{
        const color=colors[ch.charCodeAt(0)-97];
        if(color){g.fillStyle=color;g.fillRect(x,y+dy,1,1);}
      }));
      iconCache.set(id,cv.toDataURL());
    }
    return '<img class="hu-ico" alt="" aria-hidden="true" draggable="false" src="'+iconCache.get(id)+'">';
  }
  const tabs = {
    bag:['背包','PACK','B','bag'], craft:['製作','WORKBENCH','C','craft'],
    journal:['手札','FIELD JOURNAL','J','journal'], map:['地圖','ISLAND ATLAS','M','map'],
    team:['隊伍','EXPEDITION PARTY','','team'], interaction:['附近互動','IN THE FIELD','E','hand']
  };
  const meters = [
    ['health','健康','heart','#e99a84'], ['energy','體力','energy','#b4c681'],
    ['hunger','飽足','food','#d7b076'], ['thirst','水分','water','#86c6d1']
  ];
  const dirs={up:[0,-1],left:[-1,0],right:[1,0],down:[0,1]};
  const dirNames={up:'向上',left:'向左',right:'向右',down:'向下'};
  const dirSigns={up:'▴',left:'◂',right:'▸',down:'▾'};
  let root, handlers, current, actor, vm, activePanel, restoreFocus, ui = {};
  let lastDraw=0, panelSignature='', cmds=[], lastMsg='', lastEcho='', notifyUntil=0, actorSig='';
  let notifyTimer=0;
  const pointers=new Map();
  const recent={};
  let lockedRun=false;
  function actKey(o){const i=cmds.push(o)-1;return 'data-command="'+i+'"';}
  function getNodes(){['vitals','portrait','character','fold','health','energy','hunger','thirst','thermo','bpm','condition','locality','teamTab','dock','stamp','weather','dayicon','quest','context','actionlabel','toast','dialog','body','modalTitle','modalIcon','modalTag','modalFoot','close'].forEach(k=>{ui[k]=root.querySelector('[data-hu="'+k+'"]');});}
  function mount(element, api) {
    unmount();root=element;handlers=api;activePanel=null;lastMsg='';lastEcho='';actorSig='';notifyUntil=0;
    Object.keys(recent).forEach(k=>delete recent[k]);
    root.innerHTML=`
      <section class="hu-card hu-vitals" data-hu="vitals" data-fold="no" aria-label="探險員狀態">
        <button class="hu-specimen hu-readable" data-op="fold" aria-expanded="true" title="收合或展開狀態">
          <span class="hu-portrait" data-hu="portrait"></span><span><span class="hu-tag">FIELD STATUS</span><span class="hu-character"><span data-hu="character"></span> <small data-hu="condition"></small></span></span><span class="hu-collapse" data-hu="fold">−</span>
        </button>
        <div class="hu-meter-grid">${meters.map(([key,label,id,color])=>`<div class="hu-meter" style="--mcolor:${color}" data-hu="${key}"><div class="hu-meter-title">${icon(id)}<span>${label}</span><b></b></div><div class="hu-meter-track"><i></i></div></div>`).join('')}</div>
        <div class="hu-telemetry"><span>${icon('temp')}<span data-hu="thermo"></span></span><span>${icon('pulse')}<span data-hu="bpm"></span></span></div>
      </section>
      <aside class="hu-right">
        <div class="hu-clockrow"><div class="hu-card hu-clock"><span data-hu="dayicon"></span><span><b data-hu="stamp"></b><small data-hu="weather"></small></span></div>
          <button class="hu-card hu-pause hu-readable" aria-label="暫停選單" title="暫停選單 (Esc)" data-op="pause">${icon('pause')}</button></div>
        <button class="hu-objective hu-card hu-readable" data-tab="journal" title="查看手札"><small>當前目標 <span data-hu="locality"></span></small><strong data-hu="quest"></strong></button>
      </aside>
      <nav class="hu-dock hu-card hu-readable" data-hu="dock" aria-label="探險工具">${Object.entries(tabs).filter(([id])=>id!=='interaction').map(([id,[name,,key,sym]])=>`<button data-tab="${id}" ${id==='team'?'data-hu="teamTab" hidden':''} title="${name}${key?' ('+key+')':''}">${icon(sym)}${name}${key?'<kbd>'+key+'</kbd>':''}</button>`).join('')}</nav>
      <div class="hu-touch"><div class="hu-pad" aria-label="移動方向">${Object.keys(dirs).map(id=>`<button class="hu-dir" data-dir="${id}" aria-label="${dirNames[id]}">${dirSigns[id]}</button>`).join('')}</div><button class="hu-touchrun" data-run aria-label="按住衝刺">衝刺</button></div>
      <button class="hu-act hu-readable" data-hu="context" data-op="interact">${icon('hand')}<span data-hu="actionlabel">附近互動</span><kbd>E</kbd></button>
      <div class="hu-toast hu-card" role="status" aria-live="polite" data-hu="toast" hidden></div>
      <div class="hu-backdrop" data-hu="dialog" hidden><section class="hu-dialog" role="dialog" aria-modal="true" aria-labelledby="hu-dialog-heading">
        <header class="hu-dialog-head"><span data-hu="modalIcon"></span><div><span class="hu-tag" data-hu="modalTag"></span><h2 id="hu-dialog-heading" data-hu="modalTitle"></h2></div><button class="hu-close" data-hu="close" data-op="close" title="關閉 (Esc)" aria-label="關閉視窗">×</button></header>
        <div class="hu-body" data-hu="body"></div><footer class="hu-dialog-foot" data-hu="modalFoot" aria-live="polite"></footer></section></div>`;
    getNodes();
    root.addEventListener('click',onClick);root.addEventListener('pointerdown',down);
    root.addEventListener('pointermove',movePointer);root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
    root.addEventListener('lostpointercapture',up);root.addEventListener('keydown',trap);
    window.addEventListener('blur',clearMoves);
  }
  function unmount() {
    if(!root)return;
    clearMoves();clearTimeout(notifyTimer);
    root.removeEventListener('click',onClick);root.removeEventListener('pointerdown',down);
    root.removeEventListener('pointermove',movePointer);root.removeEventListener('pointerup',up);root.removeEventListener('pointercancel',up);
    root.removeEventListener('lostpointercapture',up);root.removeEventListener('keydown',trap);window.removeEventListener('blur',clearMoves);
    root.replaceChildren();root=null;handlers=null;activePanel=null;current=vm=null;actor=null;ui={};lastDraw=0;cmds=[];
  }
  function drawMove(){
    if(!root)return;
    let x=0,y=0,run=false;
    for (const v of pointers.values()){if(v==='run')run=true;else if(dirs[v]){x+=dirs[v][0];y+=dirs[v][1];}}
    for(const b of root.querySelectorAll('[data-dir]'))b.dataset.down=[...pointers.values()].includes(b.dataset.dir)?'yes':'no';
    const b=root.querySelector('[data-run]');if(b)b.dataset.down=run||lockedRun?'yes':'no';
    handlers.move?.(Math.sign(x),Math.sign(y),!!(x||y)&&(run||lockedRun));
  }
  function clearMoves(){
    if(!pointers.size&&!lockedRun)return;
    pointers.clear();lockedRun=false;drawMove();
  }
  function down(e){
    const b=e.target.closest('[data-dir],[data-run]');if(!b||activePanel)return;
    e.preventDefault();const direction=b.dataset.dir||'run',now=performance.now();
    if(direction!=='run'){lockedRun=(now-(recent[direction]??-1e5)<300); recent[direction]=now;}
    pointers.set(e.pointerId,direction);
    try{b.setPointerCapture(e.pointerId);}catch{}
    drawMove();
  }
  function movePointer(e){
    if(!pointers.has(e.pointerId)||pointers.get(e.pointerId)==='run')return;
    const b=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-dir]');
    const val=b&&root.contains(b)?b.dataset.dir:'';
    if(pointers.get(e.pointerId)!==val){pointers.set(e.pointerId,val);drawMove();}
  }
  function up(e){
    if(!pointers.delete(e.pointerId))return;
    if(![...pointers.values()].some(v=>dirs[v]))lockedRun=false;
    drawMove();
  }
  function showMessage(msg){
    if(!ui.toast||!msg)return;
    ui.toast.textContent=msg;ui.toast.classList.toggle('hu-signal-toast',msg.includes('隊伍手勢'));notifyUntil=Date.now()+4500;ui.toast.hidden=!!activePanel;
    if(activePanel)ui.modalFoot.textContent=msg;
    clearTimeout(notifyTimer); notifyTimer=setTimeout(()=>{if(ui.toast)ui.toast.hidden=true;},4510);
  }
  function put(el,txt){const v=String(txt??'');if(el.textContent!==v)el.textContent=v;}
  function update(state,id,force=false) {
    if(!root||!state||!state.players?.[id])return;
    current=state;actor=id;const now=performance.now();
    // Keep simulation authoritative while avoiding per-frame DOM/layout work.
    if(!force&&vm&&now-lastDraw<120&&id===actorSig)return;
    lastDraw=now;vm=Sim.view(state,id);
    const v=vm,stats=v.stats||{};
    const coOp=Boolean(handlers.getRoom?.())||(v.party?.length||0)>1;ui.teamTab.hidden=!coOp;ui.dock.classList.toggle('hu-with-team',coOp);
    if(actorSig!==id||ui.portrait.dataset.role!==v.character){
      actorSig=id;ui.portrait.dataset.role=v.character;
    }
    put(ui.character,v.name);put(ui.condition,v.condition);ui.condition.title=v.condition||'';put(ui.locality,v.location);for(const [key] of meters){const n=Math.max(0,Math.min(100,Math.round(Number(stats[key])||0)));
      const node=ui[key];put(node.querySelector('b'),n);node.querySelector('i').style.width=n+'%';}
    put(ui.thermo,Number(stats.temp??0).toFixed(1)+' °C');put(ui.bpm,Math.round(stats.heart??0)+' bpm');
    put(ui.stamp,v.clock);put(ui.weather,'第 '+v.day+' 天 · '+v.weather);
    const hour=parseInt(v.clock,10),sym=/雨|風暴|雷/.test(v.weather)?'rain':/風/.test(v.weather)?'wind':/霧/.test(v.weather)?'fog':hour>=18||hour<6?'moon':'sun';
    if(ui.dayicon.dataset.sym!==sym){ui.dayicon.dataset.sym=sym;ui.dayicon.innerHTML=icon(sym);}
    put(ui.quest,v.objective);const any=(v.actions||[]).length>0;ui.context.hidden=!any;
    if(any)put(ui.actionlabel,(v.actions[0]?.label||'附近互動'));
    const echo=[v.message,v.log?.length,v.log?.[0]].join('|');
    if(echo!==lastEcho){if(v.message)showMessage(v.message);lastMsg=v.message;lastEcho=echo;}
    if(activePanel)drawPanel();
  }
  function panel(key){
    if(!tabs[key]||!root||!vm)return false;
    if(activePanel===key)return close();
    clearMoves();restoreFocus=root.contains(document.activeElement)?document.activeElement:null;
    activePanel=key;panelSignature='';ui.dialog.hidden=false;ui.toast.hidden=true;
    const [name,tag,,img]=tabs[key];put(ui.modalTitle,name);put(ui.modalTag,tag);ui.modalIcon.innerHTML=icon(img);
    ui.body.scrollTop=0;put(ui.modalFoot,vm.location||'獵人島');drawPanel(true);ui.close.focus({preventScroll:true});
    return true;
  }
  function close(){
    if(!activePanel||!root)return false;activePanel=null;panelSignature='';ui.dialog.hidden=true;cmds=[];
    if(Date.now()<notifyUntil&&lastMsg)ui.toast.hidden=false;
    if(restoreFocus?.isConnected)restoreFocus.focus({preventScroll:true});
    else if(root.contains(document.activeElement))document.activeElement.blur?.();
    restoreFocus=null;return true;
  }
  function trap(e){
    if(!activePanel||e.key!=='Tab')return;
    const focusable=[...ui.dialog.querySelectorAll('button:not([disabled]),[tabindex="0"]')];
    if(!focusable.length)return;
    const i=focusable.indexOf(document.activeElement);
    if(e.shiftKey&&i<=0){e.preventDefault();focusable.at(-1).focus();}
    else if(!e.shiftKey&&i===focusable.length-1){e.preventDefault();focusable[0].focus();}
  }
  function commandButton(a,cls=''){
    return '<button class="hu-btn '+cls+'" '+actKey(a.action)+(a.disabled?' disabled':'')+
      (a.reason?' title="'+html(a.reason)+'"':'')+'>'+html(a.label)+'</button>';
  }
  function row(sym,name,note,control,more=''){
    return '<div class="hu-item"><span class="hu-thumb">'+icon(sym)+'</span><div class="hu-item-main"><span class="hu-title">'+html(name)+'</span>'+
      (note?'<span class="hu-note">'+html(note)+'</span>':'')+more+'</div>'+(control?'<div class="hu-btns">'+control+'</div>':'')+'</div>';
  }
  function buildBag(v){
    const items=v.bag||[],n=Number(v.weight||0),cap=Number(v.capacity||0);
    return '<div class="hu-weight"><span>背負重量</span><span class="hu-mono">'+n.toFixed(1)+' / '+cap.toFixed(1)+' kg</span></div><div class="hu-weight-track"><i style="width:'+Math.min(n/(cap||1)*100,100)+'%"></i></div>'+
      '<div class="hu-list">'+(items.length?items.map(item=>row(item.icon,item.name+' ×'+item.qty,item.desc,(item.actions||[]).map(a=>commandButton(a)).join(''))).join(''):'<div class="hu-empty">背包裡還沒有物品。</div>')+'</div>';
  }
  function buildCraft(v){
    const available=(v.recipes||[]).filter(r=>r.available),locked=(v.recipes||[]).filter(r=>!r.available);
    function recipe(r){
      const more='<span class="hu-materials">'+html(r.materials||'')+'</span>'+(r.reason&&!r.available?'<span class="hu-note">'+html(r.reason)+'</span>':'');
      return row(r.icon,r.name,r.desc,commandButton({label:'製作',action:r.action,disabled:!r.available,reason:r.reason},r.available?'hu-primary':''),more);
    }
    return (available.length?'<h3 class="hu-section">可以製作 · '+available.length+'</h3><div class="hu-list">'+available.map(recipe).join('')+'</div>':'')+
      (locked.length?'<h3 class="hu-section">等待條件 · '+locked.length+'</h3><div class="hu-list">'+locked.map(recipe).join('')+'</div>':'');
  }
  function buildJournal(v){
    const q=(v.quests||[]).filter(t=>t.status!=='locked'&&!(v.sampleTotal&&t.name==='獵人島自然觀察簿')),log=v.log||[],samples=v.samples||[],room=handlers.getRoom?.();
    const qLabel=t=>({completed:'已完成',current:'進行中',available:'待接取',optional:'自由探索'})[t.status]||(t.done?'已完成':'進行中');
    return '<h3 class="hu-section">'+html(v.chapter||'島嶼探險')+'</h3><div class="hu-goal">'+html(v.objective)+'</div>'+
      (q.length?'<h3 class="hu-section">委託與線索</h3><div class="hu-list">'+q.map(t=>row(t.done?'journal':'marker',t.name,t.desc,'<span class="hu-badge">'+qLabel(t)+'</span>')).join('')+'</div>':'')+
      (v.sampleTotal?'<h3 class="hu-section">自然觀察簿 · '+samples.length+' / '+html(v.sampleTotal)+'</h3>'+(samples.length?'<div class="hu-samples">'+samples.map(n=>'<span>'+html(n)+'</span>').join('')+'</div>':'<p>靠近樹木、礦石或植物，選擇「記錄樣本」就能收下第一筆觀察。</p>'):'')+
      '<h3 class="hu-section">探險員紀錄</h3><p>'+html(v.name)+' · '+html(v.location)+' · '+html(v.condition||'狀態穩定')+(room?' · 房號 '+html(room):'')+'</p>'+
      (log.length?'<h3 class="hu-section">沿途見聞</h3>'+log.map(l=>'<div class="hu-entry">'+html(l)+'</div>').join(''):'');
  }
  function buildMap(v){
    return '<div class="hu-map-wrap"><canvas aria-label="已探索範圍與目前位置" role="img" width="430" height="280"></canvas></div>'+
      '<div class="hu-weight"><strong>'+html(v.location)+'</strong><span>'+html(v.mapped?'已繪製地圖':v.character==='wangcai'?'足跡記憶':'尚未繪製地圖')+'</span></div>'+
      (v.mapHint?'<p>'+html(v.mapHint)+'</p>':'')+
      '<div class="hu-legend"><span><i></i>目前位置</span>'+(v.mapped||v.character==='wangcai'?'<span><i class="hu-flag"></i>已知地標</span>':'')+'</div>';
  }
  const signals=[
    ['follow','☞','跟我來','向前指路','搖尾巴，引隊友前進'],
    ['water','💧','需要水','舉起水壺','舔舔嘴巴，看向水壺'],
    ['wait','✋','等我','舉手示意停步','蹲坐，抬起前爪'],
    ['thanks','👍','謝謝','豎起拇指','開心地搖尾巴']
  ];
  function buildTeam(v){
    const dog=v.character==='wangcai',room=handlers.getRoom?.();
    const contact=(v.party||[]).some(m=>m.id!==actor&&m.connected!==false);
    const members=(v.party||[]).map(m=>'<li><span class="hu-portrait" data-role="'+html(m.character)+'"></span><div><b>'+html(m.name)+(m.id===actor?' · 你':'')+'</b><span class="hu-note">'+html(m.connected===false?'已離線':m.down?'倒下，等待照應':'在隊伍中')+'</span></div></li>').join('');
    const latest=(v.log||[]).find(l=>typeof l==='string'&&l.includes('隊伍手勢'));
    return (room?'<div class="hu-weight"><strong>同行房號</strong><b class="hu-mono">'+html(room)+'</b></div>':'')+
      '<ul class="hu-roster">'+members+'</ul><h3 class="hu-section">向隊友打手勢</h3>'+(contact?'':'<p>等待隊友加入。隊友可在連線選單輸入房號。</p>')+'<div class="hu-signal-grid">'+
      signals.map(([id,mark,name,gesture,bark])=>'<button class="hu-signal" '+actKey({type:'signal',id})+(contact?'':' disabled')+'><span class="hu-signal-mark" aria-hidden="true">'+mark+'</span><span><b>'+name+'</b><small>'+html(dog?bark:gesture)+'</small></span></button>').join('')+'</div>'+
      (latest?'<h3 class="hu-section">最近的手勢</h3><p>'+html(latest)+'</p>':'');
  }
  function buildInteraction(v){
    return '<div class="hu-weight"><span>'+html(v.location)+'</span><span>'+html(v.condition||'')+'</span></div><div class="hu-list">'+
      (v.actions||[]).map((a,i)=>'<button class="hu-action-row" '+actKey(a.action)+(a.disabled?' disabled':'')+'><span class="hu-thumb">'+icon(i===0?'hand':'compass')+'</span><span><strong class="hu-title">'+html(a.label)+'</strong>'+
        (a.desc||a.reason?'<span class="hu-note">'+html(a.disabled?a.reason||a.desc:a.desc||a.reason)+'</span>':'')+'</span><span class="hu-arrow" aria-hidden="true">›</span></button>').join('')+'</div>';
  }
  function drawPanel(force=false){
    if(!activePanel||!vm)return;
    const v=vm,key=activePanel;
    const deps=key==='bag'?[v.bag,v.weight,v.capacity]:key==='craft'?[v.recipes]:key==='map'?[v.mapped,v.location,v.mapHint]:
      key==='team'?[v.party,v.character,v.log,handlers.getRoom?.()]:key==='journal'?[v.chapter,v.objective,v.quests,v.log,v.samples,v.sampleTotal,v.condition,v.location,v.name,handlers.getRoom?.()]:[v.actions,v.condition,v.location];
    const signature=key+JSON.stringify(deps);
    if(force||signature!==panelSignature){
      const prev=ui.body.scrollTop,focused=document.activeElement;
      const focusedAction=focused?.dataset?.command!=null?JSON.stringify(cmds[Number(focused.dataset.command)]):null;
      panelSignature=signature;cmds=[];
      const render={bag:buildBag,craft:buildCraft,map:buildMap,journal:buildJournal,team:buildTeam,interaction:buildInteraction};
      ui.body.innerHTML=render[key](v);ui.body.scrollTop=prev;
      if(focusedAction){const ix=cmds.findIndex(c=>JSON.stringify(c)===focusedAction);(ui.body.querySelector('[data-command="'+ix+'"]:not(:disabled)')||ui.close).focus({preventScroll:true});}
    }
    if(key==='map'){
      const c=ui.body.querySelector('canvas'); if(c)World.drawMap(c,current,actor);
    }
  }
  function interact(){if(activePanel)return false;return panel('interaction');}
  function onClick(e){
    if(e.target===ui.dialog){close();return;}
    const b=e.target.closest('button');if(!b||!root.contains(b))return;
    if(b.dataset.tab){panel(b.dataset.tab);return;}
    if(b.dataset.command!==undefined&&!b.disabled){
      const c=cmds[Number(b.dataset.command)];if(!c)return;
      if(activePanel==='interaction')close();handlers.act(c);
      if(current)update(current,actor,true);return;
    }
    switch(b.dataset.op){
      case 'close':close();break;
      case 'pause':clearMoves();handlers.pause?.();break;
      case 'interact':interact();break;
      case 'fold':{const yes=ui.vitals.dataset.fold!=='yes';ui.vitals.dataset.fold=yes?'yes':'no';b.setAttribute('aria-expanded',String(!yes));put(ui.fold,yes?'＋':'−');break;}
    }
  }
  window.HUD={mount,update,unmount,close,panel,interact,isModal:()=>!!activePanel};
})();
