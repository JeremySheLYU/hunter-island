/* Hunter Island – deterministic single-host expedition simulation. */
(() => {
  'use strict';
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const ITEMS = {};
  function item(id, name, weight, description, icon, extra = {}) {
    ITEMS[id] = {id, name, label:name, weight, description, desc:description, icon, ...extra};
  }
  item('wood','漂流木',0.55,'海風曬乾的木材。可用於營火及工具。','wood');
  item('stone','石片',0.42,'沉甸甸的石片，可以用來製作工具。','stone');
  item('fiber','韌草',0.16,'質地堅韌的長草，編繩和加固背囊都用得上。','fiber');
  item('berry','海島莓',0.18,'從島上採到的莓果，一份可回復一點飽足和水分。','berry',{food:13,water:3});
  item('shellfish','潮池貝',0.36,'潮間帶的貝類，可以在營火旁處理。Jerry 對海鮮過敏。','shell');
  item('meal','烤貝',0.28,'海味十足的熱食。Jerry 對貝類過敏。','shell',{food:32});
  item('ration','乾糧',0.4,'出發前裝好的口糧。一份補充 28 點飽足。','ration',{food:28});
  item('water','飲用水',0.52,'隨身攜帶的一份飲水，補充 32 點水分。','water',{water:32});
  item('rawWater','溪水',0.52,'從水源汲取的水。在遊戲的營火旁處理後可製成飲用水。','water');
  item('flask','隨行水壺',0.45,'可重複在泉眼汲水，裝好的水另計重量。','flask');
  item('rope','草繩',0.32,'編好的繩索。可改造背囊或搭建遮蔽處。','rope');
  item('campfire','營火組',1.05,'帶到適合的位置放下，提供溫暖、光與料理場所。','fire');
  item('shelter','棚架組',1.2,'放下後成為可以過夜的避風棚。','shelter');
  item('pouch','擴容背囊',0.45,'增加背負容量，同一人只需裝備一個。','pack');
  item('map','素描地圖',0.12,'記下走過的路。在山脊測繪時可以看得更遠。','map');
  item('charcoal','炭筆',0.08,'營火中的木炭，配上樹皮可以繪圖。','coal');
  item('paper','平整樹皮',0.12,'可用來記錄地形的薄片。','paper');
  item('coat','防風外套',0.72,'隨身穿戴，減低夜風與陣雨的影響。','coat');
  item('tool','石工具',0.55,'採集木料和石片更省力。','tool');
  item('salve','護理包',0.26,'整理擦傷或休息時使用，可恢復體力狀況。','kit',{heal:35});
  item('torch','提燈',0.54,'在夜間擴大觀察範圍，並讓野生動物保持距離。','lamp');
  item('trophy','潮汐紀錄盒',0.45,'舊探險隊留給後人的寶藏。帶它和你的記錄一起回到碼頭。','treasure');
  item('herb','乾燥香葉',0.09,'帶有清香的落葉，可整理為提燈的引火材料。','herb',{base:'tinder'});
  item('fruit','林果',0.3,'森林裡的季節果實。','berry',{food:17,water:5});
  item('tinder','乾苔',0.1,'乾燥而輕的苔絨，適合製作提燈。','fiber');
  item('bowl','樹皮杯',0.16,'方便在泉眼補充溪水的簡便容器。','flask');
  item('blanket','草編睡墊',0.62,'隨身帶著休息可緩解更多疲勞。','coat');
  item('trailmix','果乾包',0.23,'壓成小包的莓果和林果，比散裝更便於背負。','ration',{food:38,water:3});
  item('charm','繩結信物',0.04,'Lili 贈送的繩結，記錄一次互相照應的旅程。','rope');
  const FORMULAS = [
    ['rope', {fiber:2},1], ['tool',{wood:1,stone:1,fiber:1},1],
    ['campfire',{wood:2,stone:2},1], ['shelter',{wood:3,rope:1},1],
    ['pouch',{fiber:3,rope:1},1], ['bowl',{paper:2,fiber:1},1],
    ['map',{paper:1,charcoal:1},1], ['blanket',{fiber:4,tinder:1},1],
    ['torch',{wood:1,tinder:1,fiber:1},1,'fire'],
    ['water',{rawWater:1},1,'fire'], ['meal',{shellfish:1},1,'fire'],
    ['trailmix',{berry:2,fruit:1},1,'fire']
  ];
  const RECIPES = FORMULAS.map(([id, cost, count, need]) => ({
    id, name:ITEMS[id].name, description:ITEMS[id].description, cost, count, need:need || null
  }));
  const PROFILES = {
    tom:{name:'Tom',speed:1.13,capacity:10,hunger:1.05,water:1,heat:1},
    jerry:{name:'Jerry',speed:0.97,capacity:11.5,hunger:0.90,water:0.94,heat:1},
    cassia:{name:'Cassia',speed:1.05,capacity:14,hunger:0.93,water:0.9,heat:0.83},
    wangcai:{name:'旺財',speed:1.3,capacity:7,hunger:0.72,water:0.83,heat:0.75}
  };
  const SPECIMEN_TYPES = {
    wood:[['樟木','柳木','樺木','櫟木','榆木','杉木'],['漂枝','枝節','樹瘤','木屑','薄片'],'wood'],
    stone:[['玄武岩','石英','板岩','花崗岩','砂岩','片麻岩'],['圓礫','石片','碎粒','風化塊','稜角礫'],'stone'],
    fiber:[['蘆葦','芒草','莎草','白茅','蒲草','燈心草'],['稈節','葉鞘','穗梗','根束','纖束'],'fiber'],
    berry:[['樟樹','楓樹','榕樹','櫟樹','榆樹','樺樹'],['落葉','果殼','葉脈','芽鱗','種翅'],'tinder']
  };
  const SPECIMENS = {};
  for (const [family,[names,forms,base]] of Object.entries(SPECIMEN_TYPES)) {
    SPECIMENS[family] = [];
    for (const name of names) {
      for (const form of forms) {
        const id = 'sample_' + family + '_' + SPECIMENS[family].length;
        item(id, name + '・' + form, +(0.11+SPECIMENS[family].length%5*0.07).toFixed(2),
          '已編入自然觀察簿。可保留、分享，或整理成' + ITEMS[base].name + '。', ITEMS[base].icon,{base});
        SPECIMENS[family].push(id);
      }
    }
  }
  const LOADOUT_IDS = ['flask','map','coat','tool','salve','torch'];
  const loadouts = LOADOUT_IDS.map(id => ({id,name:ITEMS[id].name,desc:ITEMS[id].desc,icon:ITEMS[id].icon}));
  const WICON = {clear:'晴朗',rain:'陣雨',fog:'海霧',wind:'強風'};
  const LAND = {
    dock:'西南碼頭',camp:'林間營地',spring:'林中泉眼',lookout:'北嶺瞭望臺',ruins:'東岸遺跡',
    sand:'沙灘',grass:'草地',forest:'密林',rock:'山脊',trail:'林間步道',shallows:'潮間帶',sea:'海岸'
  };
  const CHAPTER = ['啟航','泉邊留痕','山脊測繪','失落的紀錄','帶回寶藏','歸航'];
  const OBJECTIVE = ['在西南碼頭找賣飲料的 W，向他打聽舊地圖。','從營地往東北走，到林中泉眼尋找潮紋。','沿泉眼北側步道登上北嶺，用素描地圖比對潮紋。','從北嶺往東南走，在東岸遺跡尋找紀錄盒。','回到西南碼頭，把寶藏交給 W。','你找到了獵人島的寶藏，也回到了碼頭。'];
  const GATHER = {
    wood:{item:'wood',name:'漂流木',verb:'拾取漂流木',extra:'paper'},
    tree:{item:'wood',name:'枯枝',verb:'收集枯枝',extra:'paper'},
    fiber:{item:'fiber',name:'長草',verb:'割取韌草',extra:'tinder'},
    stone:{item:'stone',name:'碎石',verb:'敲取石片'},
    berry:{item:'berry',name:'莓叢',verb:'摘取海島莓',extra:'fruit'},
    fruit:{item:'fruit',name:'果樹',verb:'摘取林果'},
    herb:{item:'herb',name:'香葉',verb:'拾取香葉'},
    shellfish:{item:'shellfish',name:'潮池',verb:'採集潮池貝'}
  };
  const SAMPLE_FAMILY = {wood:'wood',tree:'wood',fiber:'fiber',stone:'stone',berry:'berry',fruit:'berry'};
  const cachedWorlds = new Map();
  function world(s) {
    if (!cachedWorlds.has(s.seed)) {
      if (cachedWorlds.size > 5) cachedWorlds.delete(cachedWorlds.keys().next().value);
      cachedWorlds.set(s.seed, globalThis.World.create(s.seed));
    }
    return cachedWorlds.get(s.seed);
  }
  function terrain(s,p) { return globalThis.World.tileAt(world(s),p.x,p.y); }
  function hash(key) {
    let n = 2166136261;
    for (let i=0;i<key.length;i++) n=Math.imul(n ^ key.charCodeAt(i),16777619);
    return n >>> 0;
  }
  function random(s) {
    s.rng = (Math.imul(s.rng,1664525) + 1013904223) >>> 0;
    return s.rng / 4294967296;
  }
  const PROFILE = p => PROFILES[p.character] || PROFILES.tom;
  function period(s) { return Math.floor(s.time/1440)+1; }
  function night(s) { const hour=s.time%1440/60; return hour>=19 || hour<6; }
  function clock(s) {
    const minute = Math.floor(s.time)%1440;
    return String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0');
  }
  function log(s,p,text) {
    p.message = text;
    p.log.unshift('D'+period(s)+' '+clock(s)+'　'+text);
    if (p.log.length > 32) p.log.pop();
  }
  function broadcast(s,text,other) {
    for (const p of Object.values(s.players)) if (p!==other) log(s,p,text);
  }
  function add(p,id,count=1) {
    const qty=(p.inv[id]||0)+count;
    if (qty>0) p.inv[id]=qty;
    else delete p.inv[id];
  }
  function weight(p) {return Object.entries(p.inv).reduce((sum,[id,n])=>sum+(ITEMS[id]?.weight||0)*n,0);}
  function capacity(p) {return PROFILE(p).capacity + (p.inv.pouch ? 5 : 0);}
  function fits(p,newWeight) {return weight(p)+newWeight<=capacity(p)+1e-6;}
  function pack(p,id,qty=1) {if(!fits(p,ITEMS[id].weight*qty)) return false; add(p,id,qty);return true;}
  function discover(s,p,radius=undefined,force=false) {
    p.mapped = Boolean(p.inv.map || p.character==='wangcai');
    if (!p.mapped) return;
    const r = radius ?? (p.character==='wangcai'?5: (s.weather==='fog'||night(s))&&!p.inv.torch?2:4);
    const cx=Math.floor(p.x), cy=Math.floor(p.y);
    const stamp=cx+','+cy+','+r;
    if (!force && p.lastMap===stamp) return;
    p.lastMap=stamp;
    const w=world(s);
    for(let y=Math.max(0,cy-r);y<=Math.min(w.height-1,cy+r);y++){
      for(let x=Math.max(0,cx-r);x<=Math.min(w.width-1,cx+r);x++){
        if((x-cx)**2+(y-cy)**2<=r*r) p.seen[x+','+y]=1;
      }
    }
  }
  function addPlayer(s,id,character,kit=[]) {
    if (s.players[id]) return s.players[id];
    if (!Object.hasOwn(PROFILES,character)) character='tom';
    const spawn=world(s).spawn;
    const p={id,character,x:spawn.x,y:spawn.y,facing:'down',moving:false,connected:true,
      health:100,hunger:83,thirst:83,energy:93,temp:36.8,heart:72,wet:0,
      inv:{},log:[],message:'',seen:{},mapped:false,catalog:{},notes:{},lastMap:'',
      sleeps:0,harvests:0,walked:0,sleepLeft:0,down:false,ailment:0,track:[]};
    s.players[id]=p;
    add(p,'ration',2);add(p,'water',2);
    for(const opt of [...new Set(kit)].slice(0,2)) if(LOADOUT_IDS.includes(opt)) add(p,opt);
    if(character==='jerry') add(p,'paper',1);
    if(character==='cassia') add(p,'tool');
    log(s,p,character==='wangcai'?'汪！海風吹來同伴的氣味。你能憑足跡記路。':'海風吹起舊地圖的一角。W 正在碼頭等你。');
    discover(s,p);
    return p;
  }
  function newGame(opts={}) {
    const seed=Number.isFinite(opts.seed)?Math.abs(Math.trunc(opts.seed))>>>0:137;
    const s={version:1,seed,rng:seed||1,status:'playing',time:14*60,weather:'clear',
      players:{},depleted:{},objects:[],nextObject:1,story:0,nextWild:14*60+60,elapsed:0};
    addPlayer(s,'p1',opts.character==='jerry'?'jerry':'tom',Array.isArray(opts.loadout)?opts.loadout:[]);
    return s;
  }
  function nearEntities(s,p,range=2.3) {
    return world(s).entities.filter(e=>!s.depleted[e.id]&&distance(e,p)<=range).sort((a,b)=>distance(a,p)-distance(b,p));
  }
  function isNear(s,p,kinds,radius) {
    return world(s).entities.some(e=>kinds.includes(e.kind)&&distance(e,p)<=radius)
      || s.objects.some(e=>kinds.includes(e.kind)&&distance(e,p)<=radius);
  }
  function atFire(s,p){return isNear(s,p,['camp','fire'],3.2);}
  function underCover(s,p){return isNear(s,p,['camp','shelter'],3.2);}
  function active(s){return Object.values(s.players).filter(p=>p.connected!==false&&!p.offline);}
  function setWeather(s) {
    if(s.squallUntil>s.time){s.weather='rain';return;}
    const slot=Math.floor((s.time-840)/165);
    const index=hash(s.seed + ':weather:' + slot)%10;
    s.weather=slot<=0?'clear':index<4?'clear':index<6?'rain':index<8?'wind':'fog';
  }
  function tidyWorld(s) {
    setWeather(s);
    for(const [id,t] of Object.entries(s.depleted)) if(t<=s.time) delete s.depleted[id];
    s.objects=s.objects.filter(o=>!o.expires||o.expires>s.time);
  }
  function extraObject(s,kind,p,props={}) {
    const e={id:'placed_'+s.nextObject++,kind,x:p.x,y:p.y,...props};
    s.objects.push(e); return e;
  }
  function drop(s,p,id,qty=1) {
    if(!ITEMS[id]||!(p.inv[id]>=qty)) return false;
    add(p,id,-qty);
    const pile=s.objects.find(o=>o.kind==='drop'&&o.item===id&&distance(p,o)<0.75);
    if(pile) pile.qty+=qty; else extraObject(s,'drop',p,{item:id,qty});
    discover(s,p);
    return true;
  }
  function ensureTreasure(s,fallback=null) {
    if(s.story!==4)return;
    for(const player of Object.values(s.players)){
      if(player.inv.trophy && (player.connected===false||player.offline||player.down)) {
        drop(s,player,'trophy');log(s,player,'紀錄盒滑落在你停下的位置，同行者可以接手。');
      }
    }
    const carrier=Object.values(s.players).find(player=>player.inv.trophy);
    const ground=s.objects.find(o=>o.kind==='drop'&&o.item==='trophy');
    if(carrier||ground)return;
    const ruins=world(s).entities.find(e=>e.kind==='ruins');
    extraObject(s,'drop',fallback||ruins,{item:'trophy',qty:1});
  }
  function removePlayer(s,id) {
    const p=s.players[id];if(!p)return;
    if(p.inv.trophy)drop(s,p,'trophy');
    delete s.players[id];ensureTreasure(s,p);
  }
  function treasureHint(s,p){
    if(p.inv.trophy)return '你正攜帶紀錄盒。';
    const holder=Object.values(s.players).find(o=>o.inv.trophy);
    if(holder)return PROFILE(holder).name+' 正攜帶紀錄盒。';
    const ground=s.objects.find(o=>o.kind==='drop'&&o.item==='trophy');
    if(!ground)return '回東岸遺跡尋找紀錄盒。';
    const nearest=world(s).entities.filter(e=>['dock','camp','spring','ruins','lookout'].includes(e.kind)).sort((a,b)=>distance(a,ground)-distance(b,ground))[0];
    const dx=ground.x-nearest.x,dy=ground.y-nearest.y;
    const heading=(Math.abs(dy)<2?'':dy>0?'南':'北')+(Math.abs(dx)<2?'':dx>0?'東':'西');
    return '紀錄盒放在'+LAND[nearest.kind]+(heading?'的'+heading+'方':'旁')+'（'+Math.floor(ground.x)+', '+Math.floor(ground.y)+'）。';
  }
  function terminal(s) {
    if(s.status!=='playing') return;
    const present=active(s);
    if(present.length&&present.every(p=>p.down)) s.status='lost';
  }
  function checkVital(s,p) {
    for(const k of ['health','hunger','thirst','energy']) p[k]=clamp(p[k],0,100);
    if(p.health<=0&&!p.down){
      p.down=true;p.moving=false;p.sleepLeft=0;
      log(s,p,'你無力再前進了。');broadcast(s,PROFILE(p).name+' 倒下了，隊友可以走近照應。',p);
      terminal(s);
    }
  }
  function vitals(s,p,minutes,moving,sprint,sleeping=false) {
    const profile=PROFILE(p), tile=terrain(s,p), outside=!underCover(s,p);
    const cold=night(s), warmed=atFire(s,p), wetTile=['shallows','stream','pool'].includes(tile);
    const packLoad=weight(p)/capacity(p);
    const activity=sleeping?0.72:sprint?2.05:moving?1.36:1;
    p.hunger-=minutes*0.051*activity*(1+packLoad*(moving?0.55:0.1))*profile.hunger;
    p.thirst-=minutes*0.072*activity*(1+packLoad*0.25)*profile.water;
    const fatigue=sprint?0.45:(moving?0.10:0.055);
    if(!sleeping) {
      if(!moving&&p.energy<56&&p.hunger>15&&p.thirst>15) p.energy+=minutes*0.12;
      else p.energy-=minutes*fatigue*(1+packLoad*0.45);
    }
    const wet=(s.weather==='rain'&&outside)||wetTile;
    p.wet=clamp(p.wet+minutes*(wet?0.015:warmed?-0.045:-0.008),0,1);
    const baseline=36.8-(cold?1.25:0)-(s.weather==='wind'&&outside?0.65:0)
      -(cold&&outside?0.45:0)-p.wet*(cold?1.7:0.85)+(sprint?0.45:moving?0.18:0);
    const insulate=(p.inv.coat?.48:1)*profile.heat*(outside?1:.45);
    const target=warmed?36.85:36.8+(baseline-36.8)*insulate;
    p.temp+= (target-p.temp)*(1-Math.exp(-minutes/24));
    const heart=(sleeping?59:70)+(sprint?71:moving?29:0)+packLoad*(moving?20:3)
      +(p.thirst<18?16:0)+(p.energy<23?14:0)+(p.ailment>0?16:0);
    p.heart+= (heart-p.heart)*(1-Math.exp(-minutes/3));
    let harm=(p.thirst<=0?0.9:0)+(p.hunger<=0?0.52:0)+(p.temp<35?0.28*(35-p.temp):0);
    if(p.ailment>0){harm+=0.11;p.ailment=Math.max(0,p.ailment-minutes);}
    p.health-=minutes*harm;
    if(!harm&&!moving&&p.hunger>44&&p.thirst>44) p.health+=minutes*0.034;
    checkVital(s,p);
  }
  function canWalk(s,p,x,y) {return globalThis.World.walkable(world(s),x,y,p.character);}
  function walk(s,p,input,dt) {
    let x=Number(input?.x)||0, y=Number(input?.y)||0;
    if(!Number.isFinite(x)||!Number.isFinite(y)) x=y=0;
    const len=Math.hypot(x,y);
    p.moving=false;
    if(!len) return false;
    x/=len;y/=len;
    p.facing=Math.abs(x)>Math.abs(y)?(x>0?'right':'left'):(y>0?'down':'up');
    const load=weight(p)/capacity(p);
    const road=terrain(s,p);
    const inWater=['shallows','stream','pool'].includes(road);
    const sprint=Boolean(input?.sprint)&&p.energy>14&&p.health>12&&(!inWater||p.character!=='jerry');
    const fear=inWater&&p.character==='jerry';
    if(fear&&!p.notes.waterFear){p.notes.waterFear=true;log(s,p,'Jerry 在水中放慢腳步，附近的乾燥步道更適合他。');}
    const rate=3.45*PROFILE(p).speed*(sprint?1.67:1)*clamp(.97+.15*(p.energy/100)-.21*load,.65,1.12)
      *clamp(.65+.35*p.health/100,.65,1)*(fear?.42:inWater?.73:road==='forest'?.88:1);
    const d=rate*dt, old={x:p.x,y:p.y};
    if(canWalk(s,p,p.x+x*d,p.y)) p.x+=x*d;
    if(canWalk(s,p,p.x,p.y+y*d)) p.y+=y*d;
    const moved=distance(p,old);p.walked+=moved;p.moving=moved>1e-6;
    if(p.moving) {
      if(p.character==='wangcai'&&(!p.track.length||distance(p,p.track.at(-1))>=1.5)){
        p.track.push({x:p.x,y:p.y});if(p.track.length>300) p.track.shift();
      }
      discover(s,p);
    }
    return p.moving&&sprint;
  }
  function sleepInfo(s,p) {
    if(p.sleepLeft>0)return '正在休息';
    if(p.energy>80&&!night(s))return '精神仍好，白日暫時睡不著。';
    return '';
  }
  function nap(s,p,forced=false) {
    const covered=underCover(s,p), hydrated=p.thirst>=24&&p.thirst<96;
    let mins=forced?72:covered?240:120;
    if(!hydrated)mins=Math.min(mins,80);
    if(!covered&&(s.weather==='rain'||s.weather==='wind'||p.temp<35.8))mins=Math.min(mins,64);
    p.notes.sleepPlace=covered?'棚內':'露天';
    p.notes.sleepDrunk=hydrated?'':'口渴或飲水過多，睡眠斷斷續續。';
    p.sleeps++;p.moving=false;
    if(active(s).length>1) {
      p.sleepLeft=forced?10:14;p.napDuration=p.sleepLeft;
      p.napGain=(mins/240)*(covered?65:43)+(p.inv.blanket?12:0);
      log(s,p,(forced?'疲勞讓你不由自主地閉上眼睛。':'你開始休息。')+'隊友仍可行動。');
      return;
    }
    const steps=Math.ceil(mins/8),piece=mins/steps;
    for(let i=0;i<steps&&!p.down;i++){
      s.time+=piece;tidyWorld(s);vitals(s,p,piece,false,false,true);
    }
    if(p.down)return;
    p.energy=clamp(p.energy+mins/240*(covered?65:43)+(p.inv.blanket?12:0),0,100);
    log(s,p,(forced?'你筋疲力盡，在原地睡著。':'醒來了。')+(covered?'營棚擋住了風。':'露宿讓你不易熟睡。')
      +p.notes.sleepDrunk+'休息了 '+Math.round(mins)+' 分鐘。');
  }
  function wildlife(s,dt) {
    const awake=active(s).filter(p=>!p.down);
    if(night(s)&&s.time>=s.nextWild){
      s.nextWild=s.time+90;
      const prey=awake.find(p=>!p.inv.torch&&!atFire(s,p)&&terrain(s,p)==='forest');
      if(prey){
        const angle=random(s)*Math.PI*2;
        const pt={x:prey.x+4*Math.cos(angle),y:prey.y+4*Math.sin(angle)};
        if(globalThis.World.walkable(world(s),pt.x,pt.y)) {
          extraObject(s,'boar',pt,{expires:s.time+38,target:prey.id,contact:0});
          log(s,prey,'樹叢傳來動靜。靠近營火或離開這片林地。');
        }
      }
    }
    for(const b of s.objects.filter(o=>o.kind==='boar')){
      const p=s.players[b.target];
      if(!p||p.down||p.connected===false||!night(s)||p.inv.torch||atFire(s,p)){b.expires=s.time;continue;}
      const d=distance(b,p);
      if(d>13){b.expires=s.time;continue;}
      if(d>0.7){
        const speed=0.9*dt;
        const x=b.x+(p.x-b.x)/d*speed,y=b.y+(p.y-b.y)/d*speed;
        if(globalThis.World.walkable(world(s),x,y)) {b.x=x;b.y=y;}
      } else if(s.time>b.contact) {
        p.health-=10;p.energy=Math.max(0,p.energy-10);b.contact=s.time+12;b.expires=s.time+1;
        log(s,p,'一隻野豬擦身而過，你跌倒擦傷了。');checkVital(s,p);
      }
    }
  }
  function step(s,inputs={},dt=0) {
    if(s.status!=='playing'||!Number.isFinite(dt)||dt<=0)return;
    ensureTreasure(s);const present=active(s); if(!present.length) return;
    const duration=Math.min(2,dt), ticks=Math.ceil(duration/0.10),slice=duration/ticks;
    for(let i=0;i<ticks&&s.status==='playing';i++) {
      s.elapsed+=slice;s.time+=slice*2.15;
      if(Math.floor(s.time)!==Math.floor(s.time-slice*2.15)) tidyWorld(s);
      for(const p of present){
        if(p.down)continue;
        if(p.sleepLeft>0){
          const portion=Math.min(p.sleepLeft,slice);
          p.sleepLeft-=portion;p.energy=clamp(p.energy+(p.napGain||35)*portion/(p.napDuration||14),0,100);
          p.moving=false;vitals(s,p,slice*2.15,false,false,true);
          if(p.sleepLeft<=0.001){p.sleepLeft=0;log(s,p,'你從'+(p.notes.sleepPlace||'營地')+'醒來了。'+(p.notes.sleepDrunk||''));}
          continue;
        }
        const sprint=walk(s,p,inputs[p.id],slice);
        vitals(s,p,slice*2.15,p.moving,sprint);
        if(!p.down&&p.energy<=0)nap(s,p,true);
      }
      wildlife(s,slice);terminal(s);
    }
  }
  function option(label,type,id,desc='',reason='') {
    return {label,action:id==null?{type}:{type,id},desc,disabled:Boolean(reason),reason};
  }
  function sampleFor(s,e) {
    const family=SAMPLE_FAMILY[e.kind];
    if(!family) return null;
    const pool=SPECIMENS[family];
    return pool[hash(s.seed+':'+e.id+':'+period(s))%pool.length];
  }
  function shelteredSurvey(s) {
    const dayMin=s.time%1440;
    return dayMin>=15*60&&dayMin<18.5*60?Math.round(18.5*60-dayMin):100;
  }
  function passageFood(p){
    for(const [id,n] of [['ration',1],['trailmix',1],['fruit',1],['berry',2],['meal',1]]){
      if(p.inv[id]>=n&&!(id==='meal'&&p.character==='jerry'))return {id,n};
    }
    return null;
  }
  function tideWait(s){
    // Low water returns every six island hours; its window spans ninety minutes.
    const phase=((s.time-120)%360+360)%360;
    return phase<=90?0:Math.ceil(360-phase);
  }
  function expeditionWork(s,p,mins,points,{labor=false,protectedSite=false}={}) {
    const start=s.time, slices=Math.ceil(mins/8),delta=mins/slices;
    for(let i=0;i<slices&&!p.down;i++){
      s.time=start+(i+1)*delta;tidyWorld(s);vitals(s,p,delta,labor,false);
      if(protectedSite&&!p.down){p.wet=Math.max(0,p.wet-delta*.04);p.temp+=(36.7-p.temp)*(1-Math.exp(-delta/15));}
    }
    if(p.down)return false;
    effort(s,p,points);return !p.down;
  }
  function buildOptions(s,p) {
    if(s.status!=='playing'||p.down) return [];
    if(p.sleepLeft>0)return [option('提前醒來','wake',null,'結束這次休息。')];
    const story=[],local=[],resource=[],extra=[];
    const dog=p.character==='wangcai';
    const near=nearEntities(s,p);
    const pile=s.objects.filter(o=>distance(o,p)<=2.3);
    for(const e of near){
      const kind=e.kind;
      if(kind==='dock'){
        if(s.story===0||s.story===4)story.push(option(dog?'向 W 搖尾巴':s.story===4?'把紀錄盒交給 W':'向 W 打聽舊地圖','story',e.id,s.story===4?treasureHint(s,p):'',s.story===4&&!p.inv.trophy?treasureHint(s,p):''));
        else local.push(option(dog?'向 W 搖尾巴':'再聽 W 說說線索','talk',e.id));
      } else if(kind==='spring'){
        if(s.story===1)story.push(option('辨認泉邊的潮紋','story',e.id,'挪開碎石並臨摹刻痕，花費 75 島上分鐘，精力與水分會下降。'));
        else local.push(option('察看泉邊刻痕','talk',e.id));
        local.push(option('汲取一份溪水','fill',e.id,'可在營火旁處理溪水。',!p.inv.flask&&!p.inv.bowl?'需要水壺或樹皮杯。':''));
        local.push(option('直接飲用溪水','drinkSpring',e.id,'可暫時解渴，有機會引起不適。'));
      } else if(kind==='lookout'){
        if(s.story===2){
          const missing=!dog&&!p.inv.map?'需要素描地圖。營地可取炭筆，漂流木提供樹皮。':'';
          story.push(option(dog?'嗅聞嶺上氣味':'在背風處測繪','story',e.id,'雨雲將至。遮蔽處測繪約 '+shelteredSurvey(s)+' 島上分鐘，耗費飲水和少量精力。',missing));
          if(!dog)story.push(option('搶在陣雨前測繪','ridgeRush',e.id,'在外側山脊趕測 42 島上分鐘，額外消耗 19 精力及約 10 水分。',missing));
        }
        local.push(option(dog?'記住山嶺地形':'從高處測繪','survey',e.id,'擴大已記錄的地形。',!dog&&!p.inv.map?'需要素描地圖。':''));
      } else if(kind==='ruins'){
        if(s.story===3) {
          const wait=tideWait(s);
          story.push(option('用工具與草繩提起石匣','story',e.id,'耗時 25 島上分鐘，消耗一條草繩，石工具可保留。',dog?'需要人類同伴。':!p.inv.rope||!p.inv.tool?'需要草繩 ×1、石工具 ×1。':''));
          story.push(option('沿退潮小徑徒手取盒','tideCache',e.id,(wait?'等待退潮 '+wait+' 分鐘，再':'現在正逢低潮，')+'沿岸搬運 82 島上分鐘。沿途消耗 1 份飲用水、1 份食物及 14 精力。',dog?'需要人類同伴。':!p.inv.water||!passageFood(p)?'長時間搬運需要攜帶飲用水，以及乾糧、林果、果乾、可食熟貝或兩份莓果。':''));
        }
        else local.push(option('察看遺跡','talk',e.id));
      } else if(kind==='camp'){
        local.push(option(dog?'觀察 Lili 的手勢':'與 Lili 交談','talk',e.id));
        local.push(option('從舊火堆取炭筆','coal',e.id));
        if(!dog&&!p.notes.liliDone&&p.notes.liliStart) {
          local.push(option('交付自然觀察記錄','report',e.id,'以三種不同樣本完成 Lili 的野外作業。',Object.keys(p.catalog).length<3?'需要記錄 3 種樣本。':''));
        }
      } else if(GATHER[kind]) {
        const g=GATHER[kind];
        resource.push(option(g.verb,'gather',e.id,'採集會消耗體力，該處一段時間後可再採集。'));
        if(SAMPLE_FAMILY[kind]) {
          const sid=sampleFor(s,e);
          extra.push(option('記錄樣本 · '+ITEMS[sid].name,'sample',e.id,'收進觀察簿，也可整理成材料。'));
        }
      }
    }
    for(const e of pile){
      if(e.kind==='drop') local.unshift(option('拾起'+ITEMS[e.item].name+' ×'+e.qty,'pickup',e.id));
      if(e.kind==='fire')local.push(option('收集餘炭','coal',e.id));
    }
    for(const other of active(s)){
      if(other===p||distance(p,other)>2.3)continue;
      if(other.down) story.unshift(option('照應倒下的 '+PROFILE(other).name,'revive',other.id,'將自己的水或口糧分給隊友。',!p.inv.water&&!p.inv.ration?'需要飲用水或乾糧。':''));
      else {
        if(p.inv.water)local.push(option('分一份水給 '+PROFILE(other).name,'giveWater',other.id));
        if(p.inv.ration)local.push(option('分一份乾糧給 '+PROFILE(other).name,'giveFood',other.id));
        const contested=other.inv.ration?'ration':other.inv.water?'water':null;
        if(contested)local.push(option('向 '+PROFILE(other).name+' 爭取補給','contest',other.id,'雙方耗費精力角力，贏方有機會取得一份物資。',p.energy<25?'至少需要 25 點精力。':''));
      }
    }
    if(near.some(e=>e.kind==='camp')||pile.some(e=>e.kind==='fire'||e.kind==='shelter')){
      local.push(option('坐下休整','rest',null,'在此休息一刻鐘，補回少量精力。'));
      local.push(option('睡一會兒','sleep',null,'有遮蔽時睡眠品質較好。',sleepInfo(s,p)));
    }else{
      extra.push(option('原地小歇','rest',null,'在原地停留一刻鐘，稍稍恢復精力。'));
      extra.push(option('在此露宿','sleep',null,'野外睡眠受天氣、飲水和疲勞影響。',sleepInfo(s,p)));
    }
    // Closely clustered nodes may offer identical harvesting actions.
    const labels=new Set();
    const all=[...story,...local,...resource,...extra];
    const unique=all.filter(v=>!labels.has(v.label)&&labels.add(v.label));
    const first=unique.findIndex(v=>!v.disabled);
    if(first>0)unique.unshift(...unique.splice(first,1));
    return unique;
  }
  function recipeInfo(s,p,r) {
    const missing=Object.entries(r.cost).some(([id,n])=>(p.inv[id]||0)<n);
    let reason='';
    if(p.character==='wangcai')reason='旺財需要人類隊友幫忙製作。';
    else if(r.need==='fire'&&!atFire(s,p))reason='需要在營地或營火旁。';
    else if(missing)reason='材料不足。';
    else {
      const consumed=Object.entries(r.cost).reduce((n,[id,count])=>n+ITEMS[id].weight*count,0);
      if(!fits(p,ITEMS[r.id].weight*r.count-consumed))reason='背囊容量不足。';
    }
    const materials=Object.entries(r.cost).map(([id,n])=>ITEMS[id].name+' '+(p.inv[id]||0)+'/'+n).join('、');
    return {id:r.id,name:r.name,icon:ITEMS[r.id].icon,desc:r.description,materials,
      available:!reason,disabled:Boolean(reason),reason,action:{type:'craft',id:r.id}};
  }
  function bagActions(p,id) {
    const info=ITEMS[id],actions=[];
    if(info.food||info.water||info.heal)actions.push(option(info.heal?'使用護理包':info.water>9?'飲用':'食用','use',id,info.desc));
    if(id==='rawWater'||id==='shellfish')actions.push(option(id==='rawWater'?'直接飲用':'生食','use',id,'尚未在營火旁處理，有機會引起不適。'));
    if(id==='campfire'||id==='shelter')actions.push(option(id==='campfire'?'架設營火':'搭起遮棚','place',id));
    if(info.base)actions.push(option('整理成'+ITEMS[info.base].name,'salvage',id));
    actions.push(option('放下 1 件','drop',id,'隊友可以拾取。'));
    if(p.inv[id]>1)actions.push(option('放下整疊','dropAll',id));
    return actions;
  }
  function effort(s,p,points) {
    p.energy-=points;p.hunger-=points*0.32;p.thirst-=points*0.44;
    p.heart=Math.min(160,p.heart+points*1.6);checkVital(s,p);
  }
  const speech=(p,line,gesture)=>p.character==='wangcai'?'「✦ & %% …？」'+gesture:line;
  function advance(s,p,e,method='story'){
    const requirements=['dock','spring','lookout','ruins','dock'];
    if(e.kind!==requirements[s.story])return false;
    if(p.character==='wangcai') {
      log(s,p,speech(p,'','你在重要的位置嗅到了熟悉的氣味。叫人類同伴過來。'));
      return true;
    }
    if(s.story===2&&!p.inv.map){log(s,p,'須先取得素描地圖，才能把潮紋方向記下。');return true;}
    if(s.story===4&&!p.inv.trophy){log(s,p,treasureHint(s,p));return false;}
    if(s.story===1&&!expeditionWork(s,p,75,5,{labor:true}))return false;
    if(s.story===2) {
      const quick=method==='ridgeRush';
      if(!expeditionWork(s,p,quick?42:shelteredSurvey(s),quick?19:3,{labor:quick,protectedSite:!quick}))return false;
      s.squallUntil=s.time+150;setWeather(s);p.wet=quick?.7:.1;
    }
    if(s.story===3){
      if(method==='tideCache'){
        const wait=tideWait(s),food=passageFood(p);
        if(!p.inv.water||!food)return false;
        add(p,'water',-1);add(p,food.id,-food.n);
        if(wait&&!expeditionWork(s,p,wait,0,{protectedSite:true}))return false;
        if(!expeditionWork(s,p,82,14,{labor:true}))return false;
      } else {
        if(!p.inv.tool||!p.inv.rope)return false;
        add(p,'rope',-1);
        if(!expeditionWork(s,p,25,5,{labor:true}))return false;
      }
    }
    const responses=[
      'W 展開十月十日買來的舊圖：「泉邊的潮紋，指向海風來的方向。」他把一張薄樹皮塞進你手中。',
      '泉石上有三道潮紋，旁邊刻著一枚山脊符號。你把形狀記了下來。',
      (method==='ridgeRush'?'你趕在雨幕前完成速寫，衣服濕了，雙腿發酸。':'你在背風處完成測繪，翻過這頁時，山嶺已落下陣雨。')+'東南遺跡的石匣，可用草繩和工具拉起，也可趁退潮沿小徑接近。',
      (method==='tideCache'?'你用一份飲水和口糧支撐搬運，雙腿有些發軟。':'工具鬆開石匣，草繩拉起了一盒舊物。')+'盒裡是歷代旅人的航行紀錄。你也寫了今天的一頁。',
      'W 接過紀錄盒，翻到了你寫的那一頁。晚潮把小船輕輕推離棧橋。'
    ];
    if(s.story===0&&!pack(p,'paper')) extraObject(s,'drop',p,{item:'paper',qty:1});
    if(s.story===2)discover(s,p,13,true);
    let message=responses[s.story];
    if(s.story===3){
      if(pack(p,'trophy')) message+='紀錄盒已放入背囊，請親自帶回碼頭或交給同行者。';
      else {extraObject(s,'drop',p,{item:'trophy',qty:1});message+='背囊已滿，盒子留在你腳旁。清理空間後可拾起。';}
    }
    if(s.story===4)add(p,'trophy',-1);
    s.story++;
    log(s,p,message);
    const gesture=['','W 攤開一小張紙，朝林間揮了揮手。','有人用指尖描過水邊的痕跡，再指向山頂。','同伴在岩壁背風處比劃，指向東岸。','一只帶海草氣味的盒子被搬出石匣。','同伴登上小船，回頭朝你招手。'][s.story];
    for(const other of active(s))if(other!==p)log(s,other,'隊伍進展 · '+speech(other,message,gesture));
    if(s.story===5)s.status='won';
    return true;
  }
  function talk(s,p,e) {
    if(e.kind==='camp'){
      if(p.character==='wangcai'){log(s,p,speech(p,'','Lili 指向營棚，再指了指燃燒的火。'));return;}
      if(!p.notes.liliStart){p.notes.liliStart=true;log(s,p,'Lili 遞來一本觀察簿：「在沿路的草木與石堆記錄三種樣本，回來說說你看見了什麼。」');}
      else log(s,p,p.notes.liliDone?'Lili 看著你的繩結笑了：「旅程的事，回去慢慢說。」':'Lili 指著舊火堆。炭筆加樹皮可畫地圖。她也等著看你的三種樣本。');
    } else {
      const words={dock:'W 點點舊地圖。'+OBJECTIVE[s.story],spring:'泉石上有三道潮紋，朝向北嶺。',ruins:s.story>=4?'石匣已打開。你留下的記錄，會在這裡陪著下一位旅人。':'石匣上的潮紋缺了一段方向。或許高處看得更清楚。'};
      log(s,p,speech(p,words[e.kind]||'海風正輕輕吹過。','你聞到島上的氣味。'));
    }
  }
  function consume(s,p,id){
    const it=ITEMS[id];
    if(!p.inv[id]||!it)return;
    if(!(it.food||it.water||it.heal||id==='shellfish'||id==='rawWater'))return;
    add(p,id,-1);
    let note='';
    const allergy=p.character==='jerry'&&['shellfish','meal'].includes(id);
    const risk=id==='rawWater'||id==='shellfish';
    if(allergy){p.health-=20;p.ailment=85;note='Jerry 的海鮮過敏發作，健康下降。';}
    else if(risk&&random(s)<.52){p.ailment=80;note='肚子開始不舒服了。';}
    p.hunger+=it.food||(id==='shellfish'?12:0);
    p.thirst+=it.water||(id==='rawWater'?26:0);
    if(it.heal){p.health+=it.heal;p.ailment=0;}
    checkVital(s,p);
    log(s,p,(it.heal?'使用了':id==='rawWater'||id==='water'?'喝下了':'吃下了')+it.name+'。'+note);
  }
  function gather(s,p,e,isSample) {
    const g=GATHER[e.kind];
    if(!g||s.depleted[e.id])return;
    if(isSample) {
      const id=sampleFor(s,e);
      if(!id)return;
      if(!pack(p,id)){log(s,p,'背囊已滿，先放下一點東西。');return;}
      const fresh=!p.catalog[id];p.catalog[id]=true;
      log(s,p,(fresh?'新自然記錄 · ':'再次採樣 · ')+ITEMS[id].name+'。');
      s.depleted[e.id]=s.time+110;effort(s,p,1.7);
      return;
    }
    const amount=['wood','stone','fiber','berry'].includes(e.kind)?2:1;
    const count=Math.min(amount,Math.max(0,Math.floor((capacity(p)-weight(p)+1e-6)/ITEMS[g.item].weight)));
    if(!count){log(s,p,'背囊已滿，先放下一點東西。');return;}
    add(p,g.item,count);
    const bonus=g.extra&&pack(p,g.extra);
    s.depleted[e.id]=s.time+(e.kind==='berry'?260:170);
    p.harvests++;effort(s,p,p.inv.tool&&['wood','tree','stone'].includes(e.kind)?1.5:3.1);
    log(s,p,'取得'+ITEMS[g.item].name+' ×'+count+(bonus?'、'+ITEMS[g.extra].name+' ×1':'')+'。');
  }
  function act(s,id,action) {
    const p=s.players[id];
    if(!p||p.connected===false||p.down||s.status!=='playing'||!action||typeof action.type!=='string')return false;
    const type=action.type, key=typeof action.id==='string'?action.id:'';
    if(p.sleepLeft>0){
      if(type!=='wake')return false;
      p.sleepLeft=0;log(s,p,'你提早醒來，重新整理行囊。');return true;
    }
    if(type==='signal'){
      const gestures={follow:['跟我來','朝前指路','往前跑了兩步，再回頭汪一聲'],water:['我需要水','舉起水壺','舔舔嘴唇，再望向隊友的水壺'],wait:['等一等','舉起手掌','坐下來，豎起耳朵'],thanks:['謝謝','豎起拇指','開心地搖起尾巴']};
      if(!Object.hasOwn(gestures,key)||active(s).length<2)return false;
      const [words,humanGesture,dogGesture]=gestures[key], dog=p.character==='wangcai';
      for(const o of active(s)){
        const text=dog?'「汪！」'+dogGesture:o.character==='wangcai'?'「✦ & %% …？」'+humanGesture:'「'+words+'」'+humanGesture;
        log(s,o,'〔隊伍手勢〕'+PROFILE(p).name+' '+text+'。');
      }
      return true;
    }
    if(type==='emote'){
      const signs={wave:'揮手',help:'示意需要幫忙',here:'指了指腳下',thanks:'點頭致謝'};
      if(!Object.hasOwn(signs,key))return false;
      for(const o of active(s))if(distance(o,p)<12)log(s,o,PROFILE(p).name+' '+(p.character==='wangcai'?'搖著尾巴，':'')+signs[key]+'。');
      return true;
    }
    if(type==='craft'){
      const r=RECIPES.find(r=>r.id===key);
      if(!r)return false;
      const info=recipeInfo(s,p,r);
      if(!info.available){log(s,p,info.reason);return false;}
      for(const [itemId,n] of Object.entries(r.cost))add(p,itemId,-n);
      add(p,r.id,r.count);effort(s,p,1.5);discover(s,p);
      log(s,p,'製作完成 · '+r.name+(r.id==='map'?'。走過的地形會從現在起留下記錄。':'。'));
      return true;
    }
    if(['use','drop','dropAll','salvage','place'].includes(type)){
      if(!Object.hasOwn(ITEMS,key)||!p.inv[key])return false;
      if(type==='use'){consume(s,p,key);return true;}
      if(type==='drop'||type==='dropAll'){
        const n=type==='drop'?1:p.inv[key];
        if(key==='pouch'&&weight(p)-ITEMS[key].weight*n>PROFILE(p).capacity&&p.inv.pouch-n<=0){log(s,p,'先放下其他物品，才能卸下擴容背囊。');return false;}
        drop(s,p,key,n);log(s,p,'放下'+ITEMS[key].name+' ×'+n+'。任何人都能拾取。');return true;
      }
      if(type==='salvage'){
        const base=ITEMS[key].base;if(!base)return false;
        if(!fits(p,ITEMS[base].weight-ITEMS[key].weight)){log(s,p,'背囊容量不足。');return false;}
        add(p,key,-1);add(p,base);log(s,p,'將樣本整理成'+ITEMS[base].name+ (p.catalog[key]?'。觀察記錄已保留。':'。'));return true;
      }
      if(key!=='campfire'&&key!=='shelter')return false;
      const tile=terrain(s,p);
      if(['sea','shallows','stream','pool'].includes(tile)){log(s,p,'這裡太潮濕，請在乾地架設。');return false;}
      const kind=key==='campfire'?'fire':'shelter';
      if(isNear(s,p,[kind],1.5)){log(s,p,'這裡已經有同類設施。');return false;}
      add(p,key,-1);extraObject(s,kind,p,kind==='fire'?{expires:s.time+420}:{});
      log(s,p,kind==='fire'?'營火燃起。靠近可回暖，也能在製作欄處理食水。':'小棚搭好了。這裡可以避風過夜。');
      return true;
    }
    const valid=buildOptions(s,p).find(o=>o.action.type===type&&(o.action.id??'')===key);
    if(!valid)return false;
    if(valid.disabled){log(s,p,valid.reason);return false;}
    const e=world(s).entities.find(e=>e.id===key)||s.objects.find(o=>o.id===key);
    if(['story','ridgeRush','tideCache'].includes(type))return advance(s,p,e,type);
    if(type==='talk'){talk(s,p,e);return true;}
    if(type==='sleep'){nap(s,p);return true;}
    if(type==='rest'){
      const mins=15;
      if(active(s).length>1) {
        p.sleepLeft=4;p.napDuration=4;p.napGain=underCover(s,p)?10:6;p.notes.sleepPlace='休息處';p.notes.sleepDrunk='';
        log(s,p,'你坐下稍事休息。');return true;
      }
      s.time+=mins;tidyWorld(s);vitals(s,p,mins,false,false);
      p.energy=clamp(p.energy+(underCover(s,p)?10:6),0,100);
      if(!p.down)log(s,p,'你停留了十五分鐘，精力恢復了一些。');
      return true;
    }
    if(type==='coal'){
      if(!pack(p,'charcoal')){log(s,p,'背囊已滿，先放下一點東西。');return false;}
      effort(s,p,1);log(s,p,'拾到一截炭筆，可搭配平整樹皮製作地圖。');return true;
    }
    if(type==='report'){
      p.notes.liliDone=true;
      if(!pack(p,'charm'))extraObject(s,'drop',p,{item:'charm',qty:1});
      if(!pack(p,'salve'))extraObject(s,'drop',p,{item:'salve',qty:1});
      log(s,p,'Lili 細看觀察簿，把一個繩結和護理包交給你：「帶著它們走遠一點吧。」');return true;
    }
    if(type==='fill'){
      if(!pack(p,'rawWater')){log(s,p,'背囊已滿，先放下一點東西。');return false;}
      log(s,p,'裝好了一份溪水。到營火旁可把它處理成飲用水。');return true;
    }
    if(type==='drinkSpring'){
      p.thirst=clamp(p.thirst+26,0,100);
      if(random(s)<.42){p.ailment=70;log(s,p,'喝了溪水，口渴緩解，肚子卻開始不舒服。');}
      else log(s,p,'你在泉邊解了渴。');
      return true;
    }
    if(type==='survey'){
      discover(s,p,13,true);log(s,p,p.character==='wangcai'?'你記住了整段山脊的氣味。':'你把腳下的山嶺與海岸補進地圖。');return true;
    }
    if(type==='gather'||type==='sample'){gather(s,p,e,type==='sample');return true;}
    if(type==='pickup'){
      const qty=Math.min(e.qty,Math.max(0,Math.floor((capacity(p)-weight(p)+1e-6)/ITEMS[e.item].weight)));
      if(!qty){log(s,p,'背囊已滿，無法拾起。');return false;}
      add(p,e.item,qty);e.qty-=qty;if(!e.qty)s.objects=s.objects.filter(o=>o!==e);
      discover(s,p);log(s,p,'拾起'+ITEMS[e.item].name+' ×'+qty+'。');return true;
    }
    const mate=s.players[key];
    if(type==='revive'){
      const pay=p.inv.water?'water':'ration';add(p,pay,-1);
      mate.down=false;mate.health=35;mate.thirst=Math.max(30,mate.thirst);mate.hunger=Math.max(22,mate.hunger);mate.energy=30;mate.temp=36.5;
      log(s,mate,PROFILE(p).name+' 留下來照應你，你又能動身了。');log(s,p,'隊友慢慢站穩了。');return true;
    }
    if(type==='giveWater'||type==='giveFood'){
      const what=type==='giveWater'?'water':'ration';
      if(!pack(mate,what)){log(s,p,'隊友背囊已滿。');return false;}
      add(p,what,-1);log(s,p,'分給 '+PROFILE(mate).name+' 一份'+ITEMS[what].name+'。');
      log(s,mate,PROFILE(p).name+' 分給你'+ITEMS[what].name+'。');return true;
    }
    if(type==='contest'){
      const what=mate.inv.ration?'ration':'water';
      if(!fits(p,ITEMS[what].weight)){log(s,p,'背囊已滿。');return false;}
      const win=random(s)<clamp(.48+(p.energy-mate.energy)/150,.2,.8);
      effort(s,p,12);effort(s,mate,6);
      if(win){add(mate,what,-1);add(p,what);}
      log(s,p,win?'你取得了一份補給，角力讓兩人都累了。':'隊友護住了物資。你們都消耗了精力。');
      log(s,mate,win?'角力後，隊友帶走了一份你的補給。':'你護住了自己的補給。');return true;
    }
    return false;
  }
  function view(s,id='p1') {
    const p=s.players[id];if(!p)return null;
    const landmarks=world(s).entities.filter(e=>Object.hasOwn(LAND,e.kind));
    const closest=landmarks.reduce((best,next)=>!best||distance(next,p)<distance(best,p)?next:best,null);
    const location=closest&&distance(closest,p)<4.7?LAND[closest.kind]:(LAND[terrain(s,p)]||'島上野地');
    const samples=Object.keys(p.catalog).length;
    const notes=p.notes;
    const status=p.down?'倒下':p.sleepLeft>0?'休息中':p.ailment>0?'身體不適':p.temp<35.7?'失溫風險':p.thirst<22?'口渴':p.hunger<22?'飢餓':p.energy<20?'疲憊':p.wet>.45?'濕透':p.moving?'行進中':'平穩';
    const stats={health:Math.round(p.health),hunger:Math.round(p.hunger),thirst:Math.round(p.thirst),energy:Math.round(p.energy),temp:+p.temp.toFixed(1),heart:Math.round(p.heart)};
    const bag=Object.entries(p.inv).map(([id,qty])=>({id,qty,name:ITEMS[id].name,desc:ITEMS[id].desc,icon:ITEMS[id].icon,weight:ITEMS[id].weight,actions:bagActions(p,id)}));
    const discoveries=Object.keys(p.seen).length;
    const quests=CHAPTER.slice(0,5).map((name,i)=>({name,desc:OBJECTIVE[i],done:s.story>i,status:s.story>i?'completed':s.story===i?'current':'locked'}));
    quests.push({name:'Lili 的自然觀察課',desc:notes.liliDone?'已將記錄帶回營地。':notes.liliStart?'沿路記錄 3 種樣本，再回營地找 Lili。進度 '+Math.min(3,samples)+'/3。':'在林間營地找 Lili 聊聊。',done:Boolean(notes.liliDone),status:notes.liliDone?'completed':notes.liliStart?'current':'available'});
    quests.push({name:'獵人島自然觀察簿',desc:'已登錄 '+samples+' / 120 種自然樣本。'+(samples?' 最近記錄：'+Object.keys(p.catalog).slice(-3).map(k=>ITEMS[k].name).join('、')+'。':''),done:samples===120,status:samples===120?'completed':'optional'});
    const party=Object.values(s.players).map(o=>({id:o.id,name:PROFILE(o).name,character:o.character,connected:o.connected!==false,down:o.down}));
    return {name:PROFILE(p).name,character:p.character,stats,clock:clock(s),day:period(s),weather:WICON[s.weather],location,
      objective:OBJECTIVE[s.story]+(s.story===4?' '+treasureHint(s,p):''),chapter:CHAPTER[s.story],message:p.message,log:p.log.slice(),actions:buildOptions(s,p),
      bag,recipes:RECIPES.map(r=>recipeInfo(s,p,r)),quests,mapped:p.mapped,mapHint:p.character==='wangcai'?'旺財靠氣味記得來路。':p.mapped?'地圖會記下你走過的地方，在北嶺可測繪更廣的視野。':'取得樹皮與炭筆，在製作欄畫出第一張地圖。W 和營地可以幫上忙。',
      samples:Object.keys(p.catalog).map(k=>ITEMS[k].name),sampleTotal:120,weight:+weight(p).toFixed(2),capacity:capacity(p),condition:status,story:s.story,party,
      ending:s.status==='playing'?null:{title:s.status==='won'?'潮起，歸航':'探險在此停下',body:s.status==='won'?
        '你帶回前人藏起的航行紀錄，也為獵人島留下一頁。':'旅程停在'+location+'。'+(p.thirst<1?'這次最先耗盡的是飲水。':p.temp<35?'夜風與濕冷帶走了最後的體力。':p.hunger<1?'行囊裡的食物用盡了。':'留下的足跡會成為下次出發的經驗。'),
        days:period(s),discoveries, samples,distance:Math.floor(p.walked),story:s.story}};
  }
  globalThis.Sim=Object.freeze({newGame,addPlayer,removePlayer,step,act,view,loadouts,items:ITEMS,recipes:RECIPES});
})();
