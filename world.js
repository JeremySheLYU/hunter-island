/* Hunter Island · world, cartography and original pixel art */
(function (root) {
'use strict';

const dark = '#173b38', ink = '#183736', warm = '#ffe3a4';
function hash(x, y, s = 0) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 144269);
  h = Math.imul(h ^ h >>> 13, 1274126177);
  return ((h ^ h >>> 16) >>> 0) / 4294967296;
}
function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), w, h);
}
function poly(c, p, color) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i+1]);
  c.closePath(); c.fill();
}
function sprite(c, rows, palette, x, y) {
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j];
    for (let i = 0; i < row.length; i++) {
      const key = row[i];
      if (!palette[key]) continue;
      let end = i + 1;
      while (row[end] === key) end++;
      rect(c, x+i, y+j, end-i, 1, palette[key]);
      i = end - 1;
    }
  }
}
function shadow(c, x, y, w) {
  rect(c, x-w/2+2, y-2, w-4, 4, '#12373233');
  rect(c, x-w/2, y-1, w, 2, '#12373240');
}
const treeStamp = [
'     ====     ',
'   ========   ',
'  ==========  ',
' ============ ',
'==============',
'==============',
' ============ ',
'   ========   '
];
function cloud(c, x, y, sx, sy, col) {
  c.fillStyle = col;
  for(let i=0;i<treeStamp.length;i++){
    const r=treeStamp[i], start=r.indexOf('='), end=r.lastIndexOf('=');
    c.fillRect(Math.round(x+start*sx),Math.round(y+i*sy),Math.ceil((1+end-start)*sx),Math.ceil(sy));
  }
}
function broadleaf(c,x,y,variant) {
  const p = variant%3===0 ? ['#234b40','#31634c','#417953','#55915e','#7ca766'] :
    variant%3===1 ? ['#224b41','#305d48','#3c7353','#518a60','#77a66c'] :
    ['#254b3c','#386747','#4b7d4c','#649458','#88a969'];
  shadow(c,x+2,y,25);
  rect(c,x-3,y-14,6,15,'#493f30'); rect(c,x-3,y-12,2,11,'#806247');
  rect(c,x-5,y-1,5,2,'#68533a'); rect(c,x+2,y,4,1,'#564632');
  cloud(c,x-15,y-29,2.15,2.2,p[0]); cloud(c,x-19,y-31,1.65,1.8,p[1]);
  cloud(c,x-6,y-36,1.65,2.0,p[0]); cloud(c,x-11,y-40,1.8,2.2,p[2]);
  cloud(c,x-17,y-32,1.1,1.2,p[3]); cloud(c,x+1,y-30,1.15,1.35,p[2]);
  cloud(c,x-8,y-39,1.1,.95,p[3]); cloud(c,x-5,y-38,.58,.45,p[4]);
  for(let j=0;j<12;j++){let n=hash(j,variant,7);let dx=Math.floor(n*24)-13,dy=Math.floor(hash(variant,j,54)*12)-34;
    rect(c,x+dx,y+dy,2+Math.floor(n*2),1,p[3]); }
}
function palm(c,x,y,variant){
  shadow(c,x,y,18);
  const t=variant%2===0?-1:1;
  c.save();c.translate(x,y);c.scale(t,1);
  const trunk='#815d3a';
  rect(c,-1,-6,4,7,'#564932'); rect(c,0,-14,4,9,trunk); rect(c,2,-21,4,10,trunk); rect(c,1,-25,4,6,trunk);
  for(let i=0;i<4;i++)rect(c,i<2?1:3,-3-i*5,2,1,'#ba915b');
  const leaves=[
    [3,-25,-3,-32,-10,-33,-14,-31,-7,-31,-1,-28],
    [3,-24,-5,-28,-13,-28,-19,-23,-20,-18,-14,-23,-8,-24],
    [2,-24,-5,-24,-11,-20,-13,-12,-10,-17,-4,-20],
    [2,-24,7,-33,14,-35,18,-33,12,-32,8,-28],
    [2,-24,10,-30,17,-29,23,-23,24,-19,18,-24,11,-25],
    [2,-24,11,-24,16,-19,17,-12,13,-17,8,-20]
  ];
  leaves.forEach((p,i)=>{poly(c,p,['#467d54','#3f8056','#36674a','#638e57','#4b8353','#35674a'][i]);});
  rect(c,-9,-32,6,1,'#9ab56c');rect(c,8,-29,6,1,'#a0af62');rect(c,-12,-27,5,1,'#85a762');
  rect(c,1,-23,3,3,'#946a40');rect(c,4,-24,3,3,'#b29055'); c.restore();
}
function pine(c,x,y,v){
  shadow(c,x,y,20); rect(c,x-2,y-6,4,7,'#70553b');
  for (let i=0;i<3;i++) {
    const top=y-38+i*7, h=12+i*2, w=6+i*3;
    poly(c,[x,top,x+3,top+4,x+w,top+h-2,x+w,top+h,x+2,top+h+2,x-w,top+h,x-w,top+h-2],'#2d5749');
    poly(c,[x,top,x+1,top+4,x-2,top+h-4,x-w+3,top+h-2,x-w,top+h-2],i%2?'#568563':'#5d8966');
  }
  rect(c,x-3,y-29,3,1,'#86a575');
}
function boulder(c,x,y,v,large=false){
  const k=large?(1.07+(v%9)*.1):1; c.save();c.translate(x,y);c.scale(v%3===1?-k:k,k*(.80+(v%5)*.08));shadow(c,1,0,17);
  poly(c,[-9,-2,-8,-7,-4,-11,2,-12,7,-10,10,-5,9,-1,5,1,-4,1],'#56675d');
  poly(c,[-8,-5,-6,-8,-3,-10,2,-11,5,-9,2,-6,-3,-5,-6,-3],'#a9b09a');
  poly(c,[2,-6,5,-9,8,-6,8,-3,4,-2,-1,-3],'#788a79');
  rect(c,-4,-9,4,1,'#c9c9ab');rect(c,2,-2,4,1,'#465d52'); c.restore();
}
function grass(c,x,y,v,berries=false) {
  const p = v%2===0 ? ['#3e7250','#72905b','#91ae6a'] : ['#51784b','#7e9b5d','#a2af6b'];
  shadow(c,x,y,12); poly(c,[x-7,y-2,x-7,y-5,x-4,y-4,x-5,y-9,x-2,y-7,x,y-4,x+1,y-10,x+3,y-7,x+3,y-4,x+6,y-7,x+6,y-4,x+4,y],p[0]);
  rect(c,x-4,y-7,2,3,p[1]);rect(c,x+1,y-8,1,4,p[2]); rect(c,x+4,y-5,2,2,p[1]);
  if(berries){rect(c,x-5,y-6,3,2,'#b6544e');rect(c,x+1,y-4,3,2,'#d47663');rect(c,x+4,y-7,2,2,'#e19977');}
}
function log(c,x,y) {
  shadow(c,x,y,16);poly(c,[x-8,y-2,x+4,y-7,x+7,y-7,x+9,y-4,x+8,y-2,x-5,y+2,x-8,y+1],'#66573e');
  poly(c,[x-7,y-2,x+4,y-6,x+7,y-6,x+7,y-5,x-5,y],'#b49b69');
  rect(c,x-8,y-1,3,3,'#c6ad80');rect(c,x-7,y,1,1,'#806543');rect(c,x+1,y-8,2,4,'#896f4c');
}
function shell(c,x,y) {
  shadow(c,x,y,11);sprite(c,['   oo   ','  pppp  ',' peppep ','peppepep',' peeeep ','  lllo  '],{o:'#967f71',p:'#e6baa0',e:'#b88a78',l:'#fff0c5'},x-4,y-5);
}
function avatar(c,x,y,id,time,moving,face) {
  let key=String(id||'tom').toLowerCase(), back=face==='up'||face==='n', left=face==='left'||face==='w';
  shadow(c,x,y,14);
  c.save();c.translate(Math.round(x),Math.round(y)); if(left)c.scale(-1,1);
  const step=moving?Math.sin(time*12):0, bob=moving&&Math.abs(step)>.63?-1:0;
  if (key==='dog'||key==='wangcai') {
    c.translate(0,bob);
    sprite(c,['          oo  oo','         obboobo','  oo     olbbbbo','  oto ooooblliko','   obbbbbblbbbou','   oblllbbboo   ','    obbbbooo    ','    oxo oxo     '],{o:'#574f3a',b:'#c48b4b',l:'#efbf70',t:'#ffe1a0',i:'#202f2e',k:'#efc585',u:'#b08252',x:'#bd8149'},-9,-10);
    if(moving){rect(c,-4,-2,2,step>0?3:1,'#6b583d');rect(c,1,-2,2,step<0?3:1,'#6b583d');}
    c.restore();return;
  }
  const j=key==='jerry', a=key==='cassia';
  const pal={o:'#253d3a',h:a?'#463d34':j?'#413c38':'#534230',H:a?'#6f543c':j?'#6f5345':'#825d3d',s:'#e5ac7b',l:'#f2c394',b:'#ad7858',e:'#2c3b39',j:a?'#bf8e46':j?'#75956d':'#bd643f',J:a?'#ddb767':j?'#99b591':'#e59059',v:a?'#98703e':j?'#506e57':'#924d3c',p:'#465a52',k:'#273b39',w:'#e3cf9c',g:'#494a38'};
  const frontHead=[
'    oooooo    ','  oohHHHHhoo  ',' ohHHhhhHHhho ',' ohhhsshhshho ',' ohsllllsshho ',' oslesllessso ','  oslllsllso  ','   ossssbso   ','    obbbbo    '];
  const backHead=[
'    oooooo    ','  oohHHHHhoo  ',' ohHHhhHHhhho ',' ohhhHHhhhHho ',' ohhhhhhHhhho ',' ohHhhhhhHhho ','  ohhhhhhhho  ','   ohhhhhho   ','    obbbbo    '];
  if(j&&!back){frontHead[5]=' osgegggegsso ';frontHead[6]='  oslllsllso  ';}
  if(a){rect(c,-7,-13+bob,3,5,'#483d32');}
  c.translate(0,bob);
  sprite(c,back?backHead:frontHead,pal,-7,-22);
  if(!j&&!a){rect(c,-5,-17,10,1,'#b54f3f');rect(c,-7,-16,3,1,'#db7354');}
  else if(a){rect(c,-6,-17,3,7,'#503d32');}
  sprite(c,back?['  ojjoojjoo ',' ojvgwwgJjo ',' ojgwwwwgjoo',' osgvvvvgjso','  ogvvvvgoo ','   ooooook  ']:['  ojJwwJjo  ',' ojJjwwJjjo ',' ojvjjvJjjo ',' osvoovvjso ','  ooJjvjoo  ','   oppppo   '],pal,-6,-13);
  rect(c,-3,-7,3,5+(step<-.2?1:0),pal.p);rect(c,1,-7,3,5+(step>.2?1:0),pal.p);
  rect(c,-4,-3+(step<-.2?1:0),4,2,pal.k);rect(c,1,-3+(step>.2?1:0),4,2,pal.k);
  c.restore();
}

const W = 72, H = 56, TILE = 20;
const anchors = {
  dock:[14,40,'西南碼頭'], camp:[23,37,'林間營地'], spring:[32,30,'林中泉眼'],
  lookout:[40,16,'北嶺瞭望臺'], ruins:[55,25,'東岸遺跡']
};
const routes = [
  [[14,40],[17,40],[19,38],[23,37],[27,36],[29,32],[32,30]],
  [[32,30],[33,27],[36,25],[35,21],[38,19],[40,16]],
  [[40,16],[44,16],[47,18],[47,21],[51,22],[55,25]],
  [[55,25],[54,29],[51,31],[47,31],[44,35],[40,37],[35,37],[30,35]],
  [[23,37],[22,32],[19,30],[19,27],[23,26],[26,23],[30,23],[35,21]]
].map(line=>line.map(([x,y])=>[x+.5,y+.5]));
const creek = [[32,28],[34,30],[36,31],[38,33],[41,33],[44,34],[45,37],[48,39],[50,42],[54,44],[58,43],[62,45]];
const biomeNames={sea:'外海',shallows:'潮間帶',sand:'白沙灘',grass:'向陽草甸',forest:'綠蔭密林',rock:'風蝕石脊',trail:'獵人小徑'};
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function lineDistance(x,y,line) {
  let best=1e5;
  for(let i=1;i<line.length;i++) {
    const a=line[i-1],b=line[i],dx=b[0]-a[0],dy=b[1]-a[1];
    const t=clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy),0,1);
    const ex=x-a[0]-dx*t,ey=y-a[1]-dy*t; best=Math.min(best,ex*ex+ey*ey);
  } return Math.sqrt(best);
}
function smooth(t){return t*t*(3-2*t);}
function noise(x,y,s) {
  const ix=Math.floor(x), iy=Math.floor(y), tx=smooth(x-ix),ty=smooth(y-iy);
  const a=hash(ix,iy,s),b=hash(ix+1,iy,s),c=hash(ix,iy+1,s),d=hash(ix+1,iy+1,s);
  return (a+(b-a)*tx)*(1-ty)+(c+(d-c)*tx)*ty;
}
function sample(x,y,seed){
  const dx=(x-36)/29.4,dy=(y-28)/22.3,angle=Math.atan2(dy,dx);
  const coast= (1-Math.sqrt(dx*dx+dy*dy))*23 + Math.sin(angle*3+1)*1.65+Math.sin(angle*7+.3)*1.15+Math.sin(angle*11)*.42
    +(noise(x*.17,y*.17,seed)-.5)*2.3;
  const distDock=Math.hypot(x-14.5,y-40.5);
  const coastDock=(x-13.7)*.68-(y-40.6)*.73;
  // The east inlet brings the tide to the stairs of the ruined shore gate.
  const cove=Math.hypot((x-65)/2.3,y-27)-3.45;
  const shore=Math.min(cove,coast+(coastDock-coast)*clamp((7-distDock)/4,0,1));
  const routeD=Math.min(...routes.map(line=>lineDistance(x,y,line)));
  const ridge=Math.hypot((x-40.5)/1.55,(y-15)/.89);
  const w=noise(x*.135+18,y*.135,seed+71);
  const grove = w*.64 + noise(x*.056+4,y*.076+65,seed)*.36;
  const river=lineDistance(x,y,creek), pool=Math.hypot((x-31.4)/1.35,(y-28.9)/.92);
  if(shore< -2.2)return 'sea';
  if(shore< -.12)return 'shallows';
  if(pool<1.38)return 'pool';
  if(river<.58&&routeD>.67&&shore>1.3)return 'stream';
  if(shore<2.7+1.3*w)return 'sand';
  if(routeD<.65+w*.18)return 'trail';
  if(ridge<5.4+.9*w||(x>51&&y<28&&grove<.36))return 'rock';
  if(grove>.47)return 'forest';
  return 'grass';
}
const cache=new Map();
function create(value=1) {
  const seed=Number(value)>>>0;
  if(cache.has(seed))return cache.get(seed);
  const tiles=[],entities=[],props=[], spawn={x:15.35,y:40.9};
  for(const [kind,[x,y,name]] of Object.entries(anchors)) entities.push({id:kind,kind,x:x+.5,y:y+.5,name});
  const namedResources={wood:'漂流木',stone:'碎石',berry:'野莓叢',fiber:'纖維草',shellfish:'潮池貝',herb:'島生草葉',fruit:'野果'};
  const add=(kind,x,y)=>entities.push({id:kind+'_'+Math.floor(x)+'_'+Math.floor(y),kind,x,y,name:namedResources[kind]});
  const starter=[
    ['wood',16.7,40.2],['fiber',17.5,39.2],['stone',19.1,40.5],['berry',20.8,37.6],
    ['wood',22.3,39.4],['fiber',24.4,35.2],['stone',25.2,37.9],['berry',31.2,31.5],
    ['stone',39,17.2],['wood',34.1,29.7],['fiber',32.8,32.1],['shellfish',14.7,42.1],
    ['wood',54.3,27.2],['berry',50,26.2],['fiber',52.4,24],['herb',24.5,38.8],['fruit',26.6,34.3]
  ];
  for(const [kind,x,y] of starter)add(kind,x,y);
  for(let y=0;y<H;y++) {
    const row=[];tiles.push(row);
    for(let x=0;x<W;x++) {
      const type=sample(x+.5,y+.5,seed);row.push(type);
      const u=hash(x,y,seed+3),v=hash(x,y,seed+17);
      const px=x+.22+u*.56,py=y+.24+v*.57;
      const near=entities.some(e=>Math.hypot(e.x-px,e.y-py)<(anchors[e.kind]?2.1:1.15));
      const path=Math.min(...routes.map(line=>lineDistance(px,py,line)));
      if(!near&&type!=='sea'&&type!=='stream'&&type!=='pool'&&u>.873&&v>.51){
        let kind=null;
        if(type==='shallows'){ if(u>.96)kind='shellfish'; }
        if(type==='sand')kind=v>.77?'shellfish':'wood';
        if(type==='grass'||type==='forest')kind=['wood','fiber','berry','berry','stone','herb','fruit'][Math.floor(hash(x,y,seed+52)*7)];
        if(type==='rock')kind=v>.65?'stone':'fiber';
        if(kind){add(kind,px,py);continue;}
      }
      if(near||path<1.3)continue;
      let decor='';
      if(type==='forest' && u>.61)decor=v>.78?'pine':v>.62?'palm':v>.37?'tree':'canopy';
      else if(type==='sand'&&u>.956&&v>.25) decor='palm';
      else if(type==='grass' && u>.954)decor=v>.62?'tree':'palm';
      else if(type==='rock'&&u>.79) decor='boulder';
      else if((type==='forest'||type==='grass')&&u<.18)decor='grass';
      else if(type==='shallows'&&u<.024) decor='reef';
      if(decor)props.push({x:px,y:py,kind:decor,v:Math.floor(v*10000)});
    }
  }
  // The wharf has a permanent grove, even when the surrounding vegetation changes.
  props.push({x:17.45,y:42.3,kind:'palm',v:43},{x:16.65,y:42.53,kind:'palm',v:41},
    {x:12.9,y:38.4,kind:'palm',v:24},{x:18.7,y:38.1,kind:'cairn',v:17},
    {x:29.45,y:32.4,kind:'cairn',v:12},{x:35.2,y:21.8,kind:'cairn',v:87},
    {x:51.6,y:22.8,kind:'cairn',v:2},{x:42.05,y:13.85,kind:'ledge',v:2},
    {x:39.55,y:13.15,kind:'ledge',v:2},{x:38.15,y:14.1,kind:'ledge',v:1},
    {x:41.65,y:13.1,kind:'ledge',v:1});
  // Natural scenery also supplies materials. The visible tree remains after collecting its loose branches.
  const natural={tree:'tree',canopy:'tree',pine:'tree',palm:'tree',boulder:'stone',reef:'stone',grass:'fiber'};
  const scenery=[];
  for(const [i,p] of props.entries()) {
    const kind=natural[p.kind];
    if(!kind){scenery.push(p);continue;}
    entities.push({...p,id:'grove_'+i,kind,art:p.kind,name:kind==='tree'?'林下枯枝':kind==='stone'?'風蝕石塊':'纖維草'});
  }
  const world={width:W,height:H,seed,tiles,entities,props:scenery,spawn};
  if(cache.size>4) cache.delete(cache.keys().next().value);
  cache.set(seed,world); return world;
}
function tileAt(w,x,y){
  return w.tiles[Math.floor(y)]?.[Math.floor(x)]||'sea';
}
function walkable(w,x,y,character) {
  if(!Number.isFinite(x)||!Number.isFinite(y)||x<.2||y<.2||x>=W-.2||y>=H-.2)return false;
  const t=tileAt(w,x,y);
  return t!=='sea' && (character!=='jerry'||t!=='shallows');
}

function wharf(c,x,y){
  c.save(); c.translate(x,y);
  poly(c,[-44,5,-32,3,3,3,4,13,-43,13],'#194d49');
  for(let i=-42;i<5;i+=4){rect(c,i,2,3,9,(i%3===0?'#8d6c45':'#ae8760'));rect(c,i,2,3,1,'#d4ae7c');}
  for(const i of [-40,-15,2]){rect(c,i,8,3,9,'#614f3b');rect(c,i,0,3,4,'#65523f');rect(c,i,0,3,1,'#e0bd85');}
  poly(c,[-48,13,-43,11,-26,11,-23,13,-28,18,-40,20,-48,17],'#594e3b');
  poly(c,[-46,14,-40,13,-28,13,-30,16,-40,18,-45,17],'#bb8b58');
  rect(c,-40,14,3,3,'#e5bd80');rect(c,-33,13,3,3,'#d4a56a');
  // Sea-striped canvas shop and the old wharf keeper.
  shadow(c,7,-2,32);rect(c,-5,-21,3,21,'#775a39');rect(c,17,-21,3,22,'#765a3b');
  rect(c,-6,-9,26,8,'#765a3c');rect(c,-6,-9,26,2,'#c9a26b');rect(c,-4,-6,2,4,'#a88453');
  poly(c,[-8,-22,-3,-29,15,-29,22,-23,22,-20,-8,-20],'#304e4a');
  for(let i=0;i<5;i++){rect(c,-6+i*5,-24,5,4,i%2?'#f5d9a0':'#dc8563');rect(c,-5+i*5,-20,4,2,i%2?'#d7b98a':'#b66750');}
  rect(c,-2,-27,17,2,'#e0bb8d');rect(c,0,-17,8,5,'#283f37');rect(c,2,-15,6,5,'#ca9a6c');rect(c,3,-12,5,2,'#d2cbb0');
  rect(c,11,-12,2,3,'#83aea3'); rect(c,14,-13,3,4,'#ddbb76');
  rect(c,-20,-29,2,30,'#735b42');poly(c,[-18,-29,-7,-26,-13,-24,-18,-23],'#dc7d55');
  // Net float, drink bottles, tied ropes and weathered supply crates.
  for(let j=0;j<3;j++){rect(c,-33+j*5,-1,1,4,'#ad9e78');rect(c,-33+j*5,2,2,2,'#dc956b');}
  rect(c,-16,7,5,1,'#baa077');rect(c,-12,8,4,1,'#8a7758');rect(c,-8,8,4,1,'#b9a77c');
  rect(c,-3,-3,4,1,'#d2ae7d');rect(c,5,-8,9,1,'#d0b07f');
  // Stranded rope coil and crates.
  rect(c,23,-6,8,6,'#796549');rect(c,24,-5,6,3,'#af8c59');rect(c,25,-4,4,1,'#d4b27b');
  c.restore();
}
function canopy(c,x,y,v) {
  c.save();c.translate(x,y);
  const z=.82+(v%11)*.035;c.scale(v%2?-z:z,z);
  shadow(c,1,0,27);rect(c,-4,-18,6,17,'#514332');rect(c,-3,-15,2,12,'#916d4a');
  poly(c,[-8,-13,-9,-19,-6,-18,-2,-12,-1,-5],'#65523d');
  const cols=['#244d40','#326549','#498652','#639457','#84a967'];
  [[-19,-30,1.95,2.0,0],[-16,-41,2,2.1,0],[-19,-31,1.7,1.6,1],[-15,-41,1.7,1.7,1],
  [-16,-41,1.24,1.15,2],[-19,-30,1.15,1,2],[-10,-47,1.34,1.45,2],[-10,-46,.9,.8,3],[0,-35,1.32,1.45,2],
  [0,-35,.86,.75,3],[-15,-38,.8,.5,3],[-8,-46,.48,.42,4]].forEach(([a,b,xx,yy,i])=>cloud(c,a,b,xx,yy,cols[i]));
  for(let j=0;j<15;j++){let a=Math.floor(hash(j,v,67)*22)-16,b=Math.floor(hash(j,v,38)*14)-38;
    rect(c,a,b,2,1,cols[j%4+1]);}
  c.restore();
}
function ledge(c,x,y,v){
  c.save();c.translate(x,y);if(v%2)c.scale(-1,1);
  poly(c,[-25,-6,-17,-13,-2,-17,15,-14,27,-6,26,1,19,5,2,7,-13,5,-22,2],'#586d63');
  poly(c,[-24,-7,-16,-13,-2,-16,13,-14,25,-8,14,-3,-4,-2,-18,-4],'#a4ac91');
  poly(c,[-16,-10,-6,-14,2,-14,-6,-10,-13,-8],'#c0c2a1');rect(c,-4,-2,7,1,'#c4c4a3');
  for(const [a,b] of [[-19,-3],[-8,0],[5,-1],[17,-4]]){rect(c,a,b,2,5,'#788b78');rect(c,a+2,b+2,1,3,'#50655b');}
  rect(c,12,1,5,1,'#85927a');c.restore();
}
function cairn(c,x,y) {
  shadow(c,x,y,13);
  sprite(c,['    oo    ','   hlho   ','   otto   ','  hlllho  ','  otthho  ',' hllllhho ','othhhhhtto','  oooooo  '],
    {o:'#637469',t:'#798373',h:'#9a9c83',l:'#c0bfa1'},x-5,y-7);
}
function tent(c,x,y) {
  c.save();c.translate(x,y);shadow(c,0,1,38);
  poly(c,[-25,2,-9,-24,5,-23,22,1,16,4,-21,4],'#705640');
  poly(c,[-22,1,-9,-22,3,-21,17,1],'#d9a669');poly(c,[-9,-22,4,-21,19,0,6,1],'#ae7851');
  poly(c,[-17,1,-9,-14,-3,1],'#384944');poly(c,[-11,-12,-9,-14,-5,-1,-9,-1],'#665d44');
  rect(c,-22,1,40,2,'#d1a874');rect(c,-8,-24,14,1,'#ead09a');
  for(const sx of [-22,20]){for(let i=0;i<4;i++)rect(c,sx+(sx<0?-i:i),i,2,1,'#bcab79');rect(c,sx+(sx<0?-4:4),3,2,3,'#58654b');}
  rect(c,8,-9,6,4,'#e4ba80');
  // Lili in a russet scarf, sat on a log.
  log(c,18,11);rect(c,11,2,7,7,'#546c58');rect(c,10,1,8,3,'#ba714d');rect(c,12,-6,6,7,'#c89769');rect(c,10,-7,8,4,'#584a3b');rect(c,11,-8,6,2,'#786047');
  c.restore();
}
function spring(c,x,y) {
  c.save();c.translate(x,y);
  boulder(c,-20,-8,1,true); boulder(c,-3,-13,1);boulder(c,9,-11,2);
  rect(c,-16,-14,3,4,'#8cbfb0');rect(c,-16,-10,4,4,'#b5d7bd');rect(c,-16,-6,6,1,'#d4e5c9');
  grass(c,9,-7,1);grass(c,-26,-6,2);
  rect(c,4,-2,2,6,'#7e6848');rect(c,1,-5,8,4,'#c7a678');rect(c,3,-4,4,1,'#8a7456');
  c.restore();
}
function lookout(c,x,y) {
  c.save();c.translate(x,y);shadow(c,1,2,33);
  for(const x0 of [-11,8]){rect(c,x0,-26,3,28,'#69543c');rect(c,x0,-22,1,23,'#baa177');}
  poly(c,[-10,-4,10,-22,10,-19,-9,-1],'#836a49'); poly(c,[-10,-22,11,-5,11,-2,-10,-18],'#987954');
  rect(c,-15,-27,30,5,'#735c44');rect(c,-14,-27,27,2,'#bf9d6d');
  for(let i=-14;i<=12;i+=12){rect(c,i,-34,2,8,'#977a53');}
  rect(c,-14,-34,28,2,'#cfaf77');rect(c,-14,-30,28,1,'#b99d70');
  rect(c,-7,-24,2,28,'#997e54');rect(c,0,-24,2,28,'#997e54');
  for(let i=-20;i<4;i+=5)rect(c,-6,i,7,2,'#d3ad70');
  rect(c,8,-53,2,26,'#8a7051');poly(c,[10,-52,27,-50,24,-48,27,-47,10,-46],'#ca6b51');rect(c,10,-51,9,1,'#f4aa71');
  rect(c,-12,-40,3,6,'#8c7450');rect(c,-15,-42,10,3,'#53655b');rect(c,-7,-43,3,5,'#a59e79');c.restore();
}
function ruins(c,x,y,opened=false) {
  c.save();c.translate(x,y);
  shadow(c,2,1,50);
  for(let i=0;i<3;i++){rect(c,-24+i*2,4-i*2,46-i*4,3,['#72806f','#8f9980','#aab099'][i]);}
  poly(c,[-19,0,-19,-28,-15,-32,14,-32,18,-28,18,0,9,0,9,-17,6,-21,-6,-21,-10,-17,-10,0],'#667d71');
  rect(c,-18,-26,7,23,'#91a38a');rect(c,10,-25,6,24,'#899b83');
  for(let j=0;j<3;j++){rect(c,-18,-4-j*8,7,1,'#61766b');rect(c,10,-4-j*8,7,1,'#61766b');}
  poly(c,[-22,-26,-22,-31,-17,-34,13,-34,20,-30,20,-26],'#a6ac8f');
  rect(c,-17,-33,29,2,'#c4c4a3');rect(c,-20,-27,38,1,'#64796b');
  rect(c,-4,-33,7,9,'#788d75');rect(c,-2,-32,3,2,'#c8b782');rect(c,-1,-30,1,3,'#d5c897');
  for(const z of [-17,-14,12]){rect(c,z,-32,2,11+(z%4),'#4d7956');rect(c,z-2,-31,4,2,'#689051');}
  boulder(c,-25,0,2);grass(c,22,2,3);
  rect(c,-6,-6,13,6,'#5c614d');rect(c,-5,-4,11,3,'#a39260');rect(c,0,-4,2,2,'#ebc882');
  if(opened){rect(c,-6,-11,13,4,'#84907b');rect(c,-5,-10,11,2,'#596b60');rect(c,-5,-6,11,2,'#3e5148');}
  else {rect(c,-7,-7,15,3,'#b9af7b');rect(c,-6,-7,13,1,'#d1c58b');}
  c.restore();
}

const ground={
  sea:['#256367','#28686a','#2b6a6c','#2c7070'],
  shallows:['#4e9390','#599b93','#64a398','#77ad9d'],
  stream:['#59948c','#619e93','#74aa96','#80b29d'],
  pool:['#3d817d','#4a9188','#5fa296','#7eb9a0'],
  sand:['#d5ba86','#ddc492','#e0c895','#e5cd9e'],
  grass:['#96ab70','#9daf72','#a2b576','#a7b87a'],
  forest:['#749763','#7a9c68','#82a36a','#89a86c'],
  rock:['#899682','#94a08a','#9da78f','#a5af95'],
  trail:['#bba67a','#c5b084','#cdb78a','#d1bd8e']
};
const chunks = new WeakMap(), ephemeral = new WeakMap();
function makeCanvas() {
  if(typeof document!=='undefined')return document.createElement('canvas');
  return new OffscreenCanvas(1,1);
}
function waterType(t){return t==='sea'||t==='shallows'||t==='stream'||t==='pool';}
function groundChunk(world,cx,cy) {
  let store=chunks.get(world); if(!store){store=new Map();chunks.set(world,store);}
  const key=cx+','+cy;if(store.has(key))return store.get(key);
  const n=8, canv=makeCanvas(); canv.width=canv.height=n*TILE;
  const g=canv.getContext('2d'),ox=cx*n,oy=cy*n,s=world.seed;
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){
    const x=ox+i,y=oy+j,px=i*TILE,py=j*TILE;
    if(x<0||y<0||x>=W||y>=H){rect(g,px,py,TILE,TILE,'#28676b');continue;}
    // Small overlapping bands follow the continuous shoreline and the old trails.
    for(let yy=0; yy<TILE; yy+=4) for(let xx=0;xx<TILE;xx+=4) {
      const fx=x+(xx+2)/TILE,fy=y+(yy+2)/TILE,b=sample(fx,fy,s);
      const broad=noise(fx*.32,fy*.32,s+121);
      const fine=noise(fx*1.65,fy*1.65,s+118);
      const v=Math.min(3,Math.floor((broad*.75+fine*.25)*4));
      rect(g,px+xx,py+yy,4,4,ground[b][v]);
      if(b==='shallows'&&xx%8===0 && sample(fx+.15,fy-.2,s)==='sand')
        rect(g,px+xx,py+yy,3,1,'#c3d5af');
    }
    for(let k=0;k<6;k++){
      const u=hash(x+k*137,y,s+55),v=hash(x,y+k*113,s+98),xx=px+Math.floor(u*TILE), yy=py+Math.floor(v*TILE);
      const t=sample(x+u,y+v,s);
      if(t==='grass'||t==='forest'){
        if(u>.62){rect(g,xx,yy,2,1,t==='grass'?'#aabd7b':'#8dab6e');rect(g,xx+2,yy-1,1,1,t==='grass'?'#8da36c':'#72935e');}
        if(v>.77&&u<.7){rect(g,xx,yy,3,1,'#789661');rect(g,xx+1,yy-1,1,2,'#819d65');}
        if(k===3&&u>.88){rect(g,xx,yy,1,2,'#658952');rect(g,xx,yy-1,2,1,'#ece0a1');}
      }else if(t==='sand'||t==='trail'){
        rect(g,xx,yy,u>.78?3:1,1,u>.6?(t==='trail'?'#d7c496':'#ebd5a1'):(t==='trail'?'#ae9e77':'#c8af82'));
      }else if(t==='rock'){
        if(u>.4){rect(g,xx,yy,3,1,'#85937f');rect(g,xx+2,yy-1,3,1,'#aeb59c');}
      }else if(waterType(t)&&k<2){
        const pale=t==='sea'?'#447e7c':'#92bba4', deep=t==='sea'?'#245e63':'#669e8f';
        rect(g,xx,yy,2+Math.floor(v*4),1,u>.45?pale:deep);
        if(u>.7){rect(g,xx+2,yy-1,4,1,pale);rect(g,xx+5,yy+1,3,1,deep);}
      }
    }
  }
  store.set(key,canv);return canv;
}
function boar(c,x,y,t) {
  shadow(c,x,y,21);
  sprite(c,[
    '     oooooo        ','   ooHHHHhHo   oo  ','  ohhhHHhHhho oho  ','  ohhhhhhhHHhhhho  ',
    ' ohHhhhhhHhhhehhhho','  ohhhhhhHHhhhhhppo','   ohoooohhoooooppo','   oko  oko   ww   '
  ],{o:'#403c32',h:'#725240',H:'#87664b',e:'#e9b77a',p:'#9f7c62',w:'#dfd0a3',k:'#514332'},x-10,y-11);
}
function objectArt(c,o,x,y,t,story=0){
  switch(o.art||o.kind){
    case 'dock':wharf(c,x,y);break;
    case 'camp':tent(c,x,y);break;
    case 'spring':spring(c,x,y);break;
    case 'lookout':lookout(c,x,y);break;
    case 'ruins':ruins(c,x,y,story>=4);break;
    case 'wood':log(c,x,y);break;
    case 'tree':broadleaf(c,x,y,o.v||0);break;
    case 'canopy':canopy(c,x,y,o.v||0);break;
    case 'ledge':ledge(c,x,y,o.v||0);break;
    case 'cairn':cairn(c,x,y);break;
    case 'pine':pine(c,x,y,o.v||0);break;
    case 'palm':palm(c,x,y,o.v||0);break;
    case 'reef':boulder(c,x,y,1);rect(c,x-11,y+1,18,1,'#8cb7a6');break;
    case 'stone':case 'boulder':boulder(c,x,y,o.v||0,(o.art||o.kind)==='boulder');break;
    case 'fiber':case 'grass':grass(c,x,y,o.v||0);break;
    case 'herb':grass(c,x,y,2);rect(c,x-3,y-8,3,2,'#e1c3b5');rect(c,x+1,y-9,3,2,'#ecdece');break;
    case 'berry':grass(c,x-2,y,2,true);grass(c,x+3,y-2,1,true);break;
    case 'fruit':grass(c,x-3,y,2);grass(c,x+2,y-2,1);rect(c,x-2,y-7,3,3,'#e2a956');rect(c,x+3,y-9,3,3,'#cf9b45');break;
    case 'shellfish':shell(c,x,y);break;
    case 'shelter':tentShelter(c,x,y);break;
    case 'fire':fire(c,x,y,t);break;
    case 'drop':if(o.item==='trophy'){
      shadow(c,x,y,14);rect(c,x-6,y-7,13,8,'#6d5840');rect(c,x-5,y-6,11,5,'#b28c54');rect(c,x-6,y-5,13,1,'#e0b965');rect(c,x-1,y-5,3,3,'#f3d474');
      break;
    }shadow(c,x,y,11);sprite(c,['    bb    ','   bllb   ','  bbllbb  ',' bhhhllhb ',' bHhhhhh b',' bHHhhhhb ','  bbbbbb  '],{b:'#6b5740',h:'#af8454',l:'#e6c788',H:'#ca9f66'},x-5,y-6);break;
    case 'boar':boar(c,x,y,t);break;
  }
}
function tentShelter(c,x,y){
  shadow(c,x,y,28);
  poly(c,[x-16,y+1,x-3,y-17,x+5,y-18,x+16,y,x+8,y+2],'#7e7950');
  poly(c,[x-13,y,x-3,y-15,x+2,y-15,x+9,y],'#a6a367');
  poly(c,[x-11,y,x-3,y-11,x+1,y],'#4d6250');
  rect(c,x-15,y,29,2,'#9a8357');rect(c,x-2,y-18,8,2,'#b5a675');
}
function fire(c,x,y,t){
  shadow(c,x,y,18);
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;rect(c,x+Math.round(Math.cos(a)*7)-1,y+Math.round(Math.sin(a)*2)-1,3,2,'#8b8c77');
  }
  const flick=Math.round(Math.sin(t*9)*2);
  poly(c,[x-5,y-1,x-4,y-8,x-1,y-5,x+1,y-15+flick,x+4,y-9,x+5,y-2,x+3,y],'#cf7952');
  poly(c,[x-3,y-1,x-1,y-6,x,y-4,x+2,y-9-flick,x+3,y-3,x+2,y],'#f7bd65');
  rect(c,x,y-3,2,3,'#ffe5a0');rect(c,x+2,y-17-(Math.floor(t*4)%5),1,1,'#dfad68');
}
function resize(canvas){
  const width=Math.max(1,Math.round(canvas.clientWidth||canvas.width||480));
  const height=Math.max(1,Math.round(canvas.clientHeight||canvas.height||320));
  // Render the art at its native grid; CSS scales the finished frame.
  const scale=width<580?1.55:width<950?1.8:2;
  const w=Math.round(width/scale),h=Math.round(height/scale);
  if(canvas.width!==w)canvas.width=w;
  if(canvas.height!==h)canvas.height=h;
  if(canvas.style)canvas.style.imageRendering='pixelated';
  return [w,h];
}
function clockSeconds(){return (typeof performance!=='undefined'?performance.now():Date.now())/1000;}
function compose(c,world,s,actor,me,frame,t){
  const {w,h,cx,cy}=frame;
  const minX=(cx-w/2)/TILE-3,minY=(cy-h/2)/TILE-3,maxX=(cx+w/2)/TILE+3,maxY=(cy+h/2)/TILE+3;
  const left=Math.floor(cx-w/2),top=Math.floor(cy-h/2);
  c.imageSmoothingEnabled=false;rect(c,0,0,w,h,'#28676b');
  for(let by=Math.floor(top/(8*TILE));by<=Math.floor((top+h)/(8*TILE));by++){
    for(let bx=Math.floor(left/(8*TILE));bx<=Math.floor((left+w)/(8*TILE));bx++){
      c.drawImage(groundChunk(world,bx,by),bx*8*TILE-left,by*8*TILE-top);
    }
  }
  c.save();c.translate(-left,-top);
  const visible=o=>o.x>=minX&&o.x<=maxX&&o.y>=minY&&o.y<=maxY;
  // Sandbars emerge in the same low-water window used by the ruins expedition.
  const tide=((s.time-120)%360+360)%360;
  const ebb=tide<=90?1:Math.max(0,1-Math.min(tide-90,360-tide)/75);
  if(ebb>0){
    c.globalAlpha=.58*ebb;
    for(let y=Math.max(0,Math.floor(minY));y<Math.min(H,maxY);y++){
      for(let x=Math.max(0,Math.floor(minX));x<Math.min(W,maxX);x++){
        const n=hash(x,y,4);
        if(tileAt(world,x,y)!=='shallows'||n<.49)continue;
        if(![[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>tileAt(world,x+dx,y+dy)==='sand'))continue;
        const xx=(x+.18+n*.41)*TILE,yy=(y+.35)*TILE,span=Math.round(6+7*n);
        rect(c,xx-span/2,yy,span,2,'#b6bb99');rect(c,xx-span/2+3,yy-1,span-5,1,'#ced0a7');
        rect(c,xx-span/2+2,yy+2,span-3,1,'#b2c6a7');
      }
    } c.globalAlpha=1;
  }
  // A tide line, shore birds and warm glints give the bay a moving surface.
  for(let y=Math.max(0,Math.floor(minY));y<Math.min(H,maxY);y+=2){
    for(let x=Math.max(0,Math.floor(minX));x<Math.min(W,maxX);x+=2){
      const u=hash(x,y,world.seed+6),a=t*.8+u*18;
      if(!waterType(tileAt(world,x,y))||Math.sin(a)<.46)continue;
      const xx=(x+u)*TILE+Math.sin(a)*2, yy=(y+hash(y,x,7))*TILE;
      rect(c,xx,yy,2+Math.round((Math.sin(a)-.4)*7),1,'#c9d8b366');
      if(Math.sin(a)>.88)rect(c,xx+2,yy-1,2,1,'#d7e5c4aa');
    }
  }
  const active=[], recovering=[];
  for(const e of world.entities){
    if(!visible(e))continue;
    if(!(s.depleted?.[e.id]>s.time))active.push(e);
    else if(e.kind==='tree'||e.art==='boulder'||e.art==='reef')recovering.push({...e,spent:true});
  }
  const objects=[...world.props.filter(visible),...active,...recovering,...(s.objects||[]).filter(visible)];
  for(const [id,p] of Object.entries(s.players||{}))if(visible(p)&&p.connected!==false)objects.push({...p,playerId:id});
  objects.sort((a,b)=>a.y-b.y);
  for (const o of objects){
    const x=Math.round(o.x*TILE),y=Math.round(o.y*TILE);
    if(o.playerId){
      if(o.down||o.sleepLeft>0) {
        c.save();c.translate(x,y-1);c.rotate(-Math.PI/2);avatar(c,0,6,o.character,t,false,'down');c.restore();
        c.font='bold 6px monospace';c.fillStyle='#f7e6aa';c.fillText(o.down?'!':'z',x+6,y-11);
      }else{
        avatar(c,x,y,o.character,t,!!o.moving,o.facing);
        if(waterType(tileAt(world,o.x,o.y))){rect(c,x-7,y-2,14,2,'#9bc3b19a');if(o.moving)rect(c,x-10,y,6,1,'#cfdfc6');}
      }
      if(o.playerId!==actor){rect(c,x-3,y-25,7,2,'#e7c176');}
    }else{
      const fades=(o.kind==='tree'||o.kind==='canopy'||o.kind==='pine'||o.kind==='palm'||o.kind==='ledge') && Math.abs(o.x-me.x)<1.1 && o.y>me.y && o.y-me.y<2.3;
      if(fades)c.globalAlpha=.52;
      if(o.spent&&o.kind==='stone'){c.save();c.translate(x,y);c.scale(.75,.75);objectArt(c,o,0,0,t,s.story);c.restore();}
      else objectArt(c,o,x,y,t,s.story);
      if(o.kind==='tree'&&!o.spent){
        rect(c,x-8,y+1,4,1,'#836e49');rect(c,x-6,y,6,1,'#ac9463');rect(c,x-4,y-1,2,1,'#705e42');
      }
      if(fades)c.globalAlpha=1;
    }
  }
  const hh=((s.time??480)%1440+1440)%1440/60;
  const night=hh<5?.56:hh<7?.56*(7-hh)/2:hh>=20?.56:hh>=17?.56*(hh-17)/3:0;
  // Low sunlight warms the island shortly before darkness settles.
  const sunwarm=Math.max(0,1-Math.abs(hh-17.65)/1.2,1-Math.abs(hh-6.6)/1.15);
  if(sunwarm>0)rect(c,left,top,w,h,'rgba(221,145,83,'+(sunwarm*.13)+')');
  if(night>0){
    rect(c,left,top,w,h,'rgba(21,39,67,'+night+')');
    for(const o of objects.filter(o=>o.kind==='fire'||o.kind==='camp'||o.kind==='dock'||(o.playerId&&o.inv?.torch))){
      const x=o.x*TILE,y=o.y*TILE,r=o.kind==='fire'?42:31;
      const light=c.createRadialGradient(x,y,3,x,y,r);
      light.addColorStop(0,'rgba(255,192,102,'+(night*.8)+')');light.addColorStop(1,'rgba(255,192,102,0)');
      c.fillStyle=light;c.fillRect(x-r,y-r,r*2,r*2);
    }
  }
  if(night<.12 && s.weather!=='rain'){
    // A pair of terns circles over the wharf, staying above the water.
    for(let i=0;i<2;i++){
      const a=t*.095+i*.55,x=(11.9+Math.cos(a)*2.2)*TILE,y=(41.8+Math.sin(a)*1.45)*TILE;
      const flap=Math.sin(t*4+i)>.1?-1:0;
      rect(c,x-4,y+flap,3,1,'#dae0c8');rect(c,x-1,y+1,3,1,'#ecedd3');rect(c,x+2,y+flap,3,1,'#d3dcc5');
      rect(c,x-5,y+flap,1,1,'#819c99');rect(c,x+5,y+flap,1,1,'#819c99');
    }
  }
  c.restore();
  if(s.weather==='rain'){
    rect(c,0,0,w,h,'#42646e32');
    for(let i=0;i<Math.min(100,w/4);i++){
      const lx=((hash(i,1)*w-t*(15+i%6))%w+w)%w,ly=(hash(i,7)*h+t*(70+i%21))%h;
      rect(c,lx,ly,1,3,'#d3dcca80');rect(c,lx-1,ly+3,1,2,'#d3dcca60');
    }
  }else if(s.weather==='fog'){
    rect(c,0,0,w,h,'#c6d8c739');
    for(let i=0;i<6;i++){
      const x=(hash(i,3)*w+t*(2+i%2))%(w+90)-45,y=hash(i,21)*h;
      const grad=c.createRadialGradient(x,y,3,x,y,36+i*4);
      grad.addColorStop(0,'#d5e0cf28');grad.addColorStop(1,'#d5e0cf00');c.fillStyle=grad;c.fillRect(x-60,y-60,120,120);
    }
  }else if(s.weather==='wind'){
    for(let i=0;i<14;i++){let x=(hash(i,3)*w+t*(24+i))%w,y=(hash(i,21)*h+Math.sin(t+i)*3)%h;rect(c,x,y,3,1,'#70905c99');}
  }
  // A small marker indicates the nearest interactive thing without masking scenery.
  const priority={dock:0,camp:1,spring:2,lookout:3,ruins:4};
  const target=active.find(o=>o.kind===['dock','spring','lookout','ruins','dock'][s.story??0]);
  if(target){
    const x=Math.round(target.x*TILE-left),dy=target.kind==='lookout'?58:target.kind==='spring'?26:40;
    const y=Math.round(target.y*TILE-top-dy+Math.sin(t*2));
    poly(c,[x,y-4,x+5,y,x,y+5,x-5,y],'#4d5947');
    poly(c,[x,y-3,x+3,y,x,y+3,x-3,y],'#f2bc62');rect(c,x,y-2,1,2,'#ffe1a0');
  }
  const close=[...active,...(s.objects||[]).filter(visible)].filter(o=>o.kind!=='boar')
    .map(o=>({o,d:Math.hypot(me.x-o.x,me.y-o.y)})).filter(e=>e.d<=2.3).sort((a,b)=>a.d-b.d);
  if(close.length && close[0].o!==target) {
    const o=close[0].o,x=Math.round(o.x*TILE-left),y=Math.round(o.y*TILE-top-(o.kind in priority?37:14)+Math.sin(t*3)*1.2);
    poly(c,[x-3,y-1,x+4,y-1,x,y+3],ink);poly(c,[x-2,y-1,x+3,y-1,x,y+2],'#ffe7ab');
  }
}
function render(canvas,s,id='p1'){
  if(!canvas||!s||!s.players?.[id])return;
  const me=s.players[id],world=create(s.seed),t=clockSeconds(),[w,h]=resize(canvas),c=canvas.getContext('2d');
  if(!c)return;
  let frame=ephemeral.get(canvas);
  if(!frame||frame.seed!==s.seed||frame.actor!==id){frame={cx:me.x*TILE,cy:me.y*TILE,seed:s.seed,actor:id,prev:t};ephemeral.set(canvas,frame);}
  const delta=clamp(t-frame.prev,0,.08),factor=frame.tick?1-Math.exp(-delta*12):1;
  frame.prev=t;frame.tick=true;frame.w=w;frame.h=h;
  const targetX=clamp(me.x*TILE,Math.min(w/2,W*TILE/2),Math.max(W*TILE-w/2,W*TILE/2));
  const targetY=clamp(me.y*TILE,Math.min(h/2,H*TILE/2),Math.max(H*TILE-h/2,H*TILE/2));
  frame.cx+=(targetX-frame.cx)*factor;frame.cy+=(targetY-frame.cy)*factor;
  compose(c,world,s,id,me,frame,t);
}

function drawMap(canvas,s,id='p1'){
  if(!canvas||!s?.players?.[id])return;
  const me=s.players[id],world=create(s.seed);
  const cw=Math.max(1,Math.round(canvas.clientWidth||canvas.width||360));
  const ch=Math.max(1,Math.round(canvas.clientHeight||canvas.height||245));
  const dpr=Math.min(2,typeof devicePixelRatio==='number'?devicePixelRatio:1);
  if(canvas.width!==Math.round(cw*dpr))canvas.width=Math.round(cw*dpr);
  if(canvas.height!==Math.round(ch*dpr))canvas.height=Math.round(ch*dpr);
  const c=canvas.getContext('2d'); if(!c)return;
  c.setTransform(dpr,0,0,dpr,0,0);c.imageSmoothingEnabled=false;
  const scale=Math.min((cw-14)/W,(ch-12)/H),lx=(cw-scale*W)/2,ly=(ch-scale*H)/2;
  rect(c,0,0,cw,ch,'#173d3b');
  const seen=me.seen||{},hasMap=me.mapped||String(me.character).toLowerCase()==='wangcai';
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    if(!hasMap||!seen[x+','+y])continue;
    const val=world.tiles[y][x];
    rect(c,lx+x*scale,ly+y*scale,Math.ceil(scale+.35),Math.ceil(scale+.35),ground[val]?.[1]||'#81996b');
  }
  c.lineWidth=1;c.strokeStyle='#92b7a117';
  for(let i=0;i<=W;i+=8){c.beginPath();c.moveTo(lx+i*scale,ly);c.lineTo(lx+i*scale,ly+scale*H);c.stroke();}
  for(let i=0;i<=H;i+=8){c.beginPath();c.moveTo(lx,ly+i*scale);c.lineTo(lx+scale*W,ly+i*scale);c.stroke();}
  if(hasMap)for(const [kind,[tx,ty,label]] of Object.entries(anchors)){
    const entity=world.entities.find(e=>e.kind===kind);
    if(!seen[tx+','+ty]||!entity)continue;
    const x=lx+entity.x*scale,y=ly+entity.y*scale;
    rect(c,x-2,y-5,1,6,'#233d37');
    poly(c,[x-1,y-5,x+5,y-5,x+3,y-3,x-1,y-3],'#e7a06c');
    c.font='bold '+Math.max(8,Math.min(12,Math.round(scale*1.5)))+'px sans-serif';
    c.lineWidth=2.5;c.textAlign='left';c.strokeStyle='#274b41';c.strokeText(label,x+6,y-2);
    c.fillStyle='#f2e2b5';c.fillText(label,x+6,y-2);
  }
  if(hasMap)for(const o of (s.objects||[])){
    if(!['fire','shelter'].includes(o.kind)||!seen[Math.floor(o.x)+','+Math.floor(o.y)])continue;
    const x=lx+o.x*scale,y=ly+o.y*scale;
    poly(c,[x-3,y+2,x,y-4,x+3,y+2],o.kind==='fire'?'#df8156':'#f0cb85');
  }
  for(const [pid,p] of Object.entries(s.players)){
    if(pid!==id&&(!hasMap||!seen[Math.floor(p.x)+','+Math.floor(p.y)]))continue;
    const x=lx+p.x*scale,y=ly+p.y*scale;
    c.fillStyle=pid===id?'#ffe2a0':'#e6a683';c.strokeStyle='#243b35';c.lineWidth=1.3;c.beginPath();c.arc(x,y,pid===id?3.1:2.4,0,Math.PI*2);c.fill();c.stroke();
  }
  c.textAlign='right';c.fillStyle='#b7ceba';c.font='bold 9px monospace';c.fillText('N',cw-7,13);
  poly(c,[cw-10,17,cw-12,22,cw-8,22],'#d7d8b6');
}
root.World={create,walkable,tileAt,render,drawMap,biomeNames};
})(typeof window!=='undefined'?window:globalThis);
