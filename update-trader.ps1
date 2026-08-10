$ErrorActionPreference = 'Stop'
$dir = (Get-Location).Path
$gf = Join-Path $dir 'game.js'
if (-not (Test-Path $gf)) { throw "game.js not found in $dir" }
$bak = "$gf.bak_trader"
if (-not (Test-Path $bak)) { Copy-Item $gf $bak; Write-Host "Backup: $bak" }
$text = [System.IO.File]::ReadAllText($gf)
$m = 'ISO_TRADER_BOSSES_V1'
$i = $text.IndexOf($m)
if ($i -ge 0) {
    $c = $text.LastIndexOf('})();')
    if ($c -gt $i) { $text = $text.Substring(0, $i) + $text.Substring($c); Write-Host "Old block stripped." }
}
$core = @'
/* ISO_TRADER_BOSSES_V1 */
(function(){
if(window.__ISO_TBV1__)return; window.__ISO_TBV1__=true;
var css='#lvl-warn{position:fixed;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;z-index:60;pointer-events:none;background:radial-gradient(circle at 50% 50%,rgba(79,216,235,.12),rgba(0,0,0,.55));}'+
'#lvl-warn.on{display:flex;animation:lwIn .25s ease-out;}'+
'.lw-ring{width:150px;height:150px;border:3px solid #4fd8eb;border-radius:50%;box-shadow:0 0 40px #4fd8eb88,inset 0 0 30px #4fd8eb44;animation:lwPulse 1.4s ease-in-out infinite;}'+
'.lw-txt{font-family:var(--disp);font-size:34px;color:#4fd8eb;letter-spacing:6px;margin-top:18px;text-shadow:0 0 18px #4fd8eb;}'+
'.lw-sub{font-family:var(--mono);color:var(--tx2);letter-spacing:3px;margin-top:6px;}'+
'.lw-bar{width:260px;height:6px;background:#12222e;margin-top:14px;overflow:hidden;}'+
'.lw-bar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#4fd8eb,#ff5d8f);animation:lwBar 1.5s linear forwards;}'+
'@keyframes lwPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}'+
'@keyframes lwBar{from{width:100%}to{width:0}}'+
'@keyframes lwIn{from{opacity:0}to{opacity:1}}'+
'#shop-ui{position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:65;background:rgba(4,8,12,.72);}'+
'#shop-ui.on{display:flex;}'+
'.shop-panel{width:min(720px,92vw);background:linear-gradient(180deg,#0d1420,#0a0f16);border:1px solid #ffb45466;box-shadow:0 0 60px #ffb45422,inset 0 0 40px #00000088;padding:22px 22px 18px;clip-path:polygon(18px 0,100% 0,100% calc(100% - 18px),calc(100% - 18px) 100%,0 100%,0 18px);}'+
'.shop-head{font-family:var(--disp);font-size:24px;color:#ffb454;letter-spacing:4px;display:flex;align-items:center;gap:12px;}'+
'.shop-head em{font-size:10px;color:var(--tx2);letter-spacing:3px;font-style:normal;margin-left:auto;}'+
'.shop-penta{display:inline-block;font-size:30px;color:#ffb454;text-shadow:0 0 14px #ffb454;animation:pentaSpin 4s linear infinite;}'+
'@keyframes pentaSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}'+
'.shop-coins{font-family:var(--mono);color:#ffd43b;margin:6px 0 12px;}'+
'.shop-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}'+
'.shop-card{background:#0f1826;border:1px solid #33445a;padding:14px 10px;cursor:pointer;text-align:center;transition:transform .12s,border-color .12s;color:var(--tx);}'+
'.shop-card:hover{transform:translateY(-4px);border-color:#ffb454;}'+
'.shop-card.taken{opacity:.35;pointer-events:none;}'+
'.shop-card .si{font-size:26px;}'+
'.shop-card b{display:block;margin:6px 0 4px;color:#eaf4ff;}'+
'.shop-card .buff{color:#7ef0a6;font-size:11px;margin:0;}'+
'.shop-card .debb{color:#ff5d8f;font-size:11px;margin:2px 0 8px;}'+
'.shop-card .price{font-family:var(--mono);color:#ffd43b;font-size:12px;}'+
'.shop-leave{margin-top:14px;width:100%;background:none;border:1px solid #4fd8eb55;color:#4fd8eb;padding:10px;font-family:var(--mono);letter-spacing:2px;cursor:pointer;}'+
'.shop-leave:hover{background:#4fd8eb22;}'+
'.shop-wait{margin-top:10px;text-align:center;color:var(--tx2);font-family:var(--mono);}'+
'@media(max-width:640px){.shop-grid{grid-template-columns:1fr;}}';
var styleEl=document.createElement('style'); styleEl.textContent=css; document.head.appendChild(styleEl);
var warnDiv=document.createElement('div'); warnDiv.id='lvl-warn';
warnDiv.innerHTML='<div class="lw-ring"></div><div class="lw-txt">⚠ STABILIZATION SURGE</div><div class="lw-sub">MODULE SELECT INCOMING</div><div class="lw-bar"><i></i></div>';
document.body.appendChild(warnDiv);
var __oldOpenLevel=openLevel;
openLevel=function(){
 if(!RUN) return __oldOpenLevel();
 if(RUN.isOnline&&!NET.isHost) return;
 if(RUN.state==='levelwarn') return;
 RUN.state='levelwarn'; RUN._warnT=1.5;
 warnDiv.classList.add('on');
 if(RUN.isOnline&&NET.isHost&&RUN.fxQueue){RUN.fxQueue.push({k:'banner',text:'⚠ STABILIZATION SURGE'});RUN.fxQueue.push({k:'levelwarn',v:1});}
};
var shopDiv=document.createElement('div'); shopDiv.id='shop-ui'; document.body.appendChild(shopDiv);
var ITEMS=[
{id:'it1',ic:'⚡',n:'Overcharge Core',b:'dmg',d:'rate',v:.2},
{id:'it2',ic:'♻',n:'Flux Capacitor',b:'rate',d:'dmg',v:.2},
{id:'it3',ic:'➟',n:'Thruster Pack',b:'spd',d:'hp',v:.15},
{id:'it4',ic:'⬡',n:'Plated Hull',b:'hp',d:'spd',v:.15},
{id:'it5',ic:'✹',n:'Crit Matrix',b:'critD',d:'dmg',v:.25},
{id:'it6',ic:'☄',n:'Warhead Fins',b:'dmg',d:'spd',v:.15},
{id:'it7',ic:'◈',n:'Aegis Cell',b:'shieldMax',d:'rate',v:.2},
{id:'it8',ic:'▯',n:'Vented Shields',b:'rate',d:'shieldMax',v:.2},
{id:'it9',ic:'🧲',n:'Salvage Loop',b:'magnet',d:'dmg',v:.2},
{id:'it10',ic:'◉',n:'Greed Chip',b:'coinMult',d:'hp',v:.2},
{id:'it11',ic:'✚',n:'Bio Reserve',b:'hp',d:'coinMult',v:.2},
{id:'it12',ic:'≽',n:'Rail Coils',b:'ps',d:'dmg',v:.15},
{id:'it13',ic:'⚔',n:'Berserk Plating',b:'dmg',d:'hp',v:.2},
{id:'it14',ic:'↯',n:'Twitch Servos',b:'rate',d:'spd',v:.15},
{id:'it15',ic:'🛡',n:'Bulwark Core',b:'shieldMax',d:'hp',v:.2},
{id:'it16',ic:'❤',n:'Organic Frame',b:'hp',d:'shieldMax',v:.2},
{id:'it17',ic:'✧',n:'Weakpoint AI',b:'critD',d:'rate',v:.2},
{id:'it18',ic:'≋',n:'Accelerant',b:'ps',d:'rate',v:.15},
{id:'it19',ic:'◎',n:'Tractor Rig',b:'magnet',d:'spd',v:.2},
{id:'it20',ic:'♦',n:'Merchant Protocol',b:'coinMult',d:'dmg',v:.15}];
var ITEM_BY={}; ITEMS.forEach(function(it){ITEM_BY[it.id]=it;});
var STATN={dmg:'DAMAGE',rate:'FIRE RATE',hp:'MAX HP',spd:'SPEED',shieldMax:'SHIELD',magnet:'PICKUP RANGE',coinMult:'COINS',ps:'PROJ SPEED',critD:'CRIT DAMAGE'};
function itemDesc(it){var p=Math.round(it.v*100);return{bd:'+'+p+'% '+STATN[it.b],dd:'-'+p+'% '+STATN[it.d]};}
var __oldCS=computeStats;
computeStats=function(){
 __oldCS();
 if(!RUN||!RUN.items||!RUN.items.length)return;
 RUN.items.forEach(function(id){var it=ITEM_BY[id];if(!it)return;ST[it.b]*=1+it.v;ST[it.d]*=1-it.v;});
 if(ST.hp)ST.hp=Math.max(40,Math.round(ST.hp));
 if(ST.shieldMax!==undefined)ST.shieldMax=Math.max(0,Math.round(ST.shieldMax));
 RUN.players.forEach(function(p){p.hp=Math.min(p.hp,ST.hp);p.sh=Math.min(p.sh,ST.shieldMax);});
};
var __oldDrop=drop;
drop=function(x,y,t,v){ if(t==='relic'){ if(Math.random()<.6)__oldDrop(x,y,'coin',3); return; } return __oldDrop(x,y,t,v); };
var __oldStart=start;
start=function(){ var r=__oldStart.apply(this,arguments); if(RUN){RUN.items=RUN.items||[];RUN.shop=null;} return r; };
function shopPrice(){ return 60+(RUN.wave||1)*4; }
function pickStock(){
 var pool=ITEMS.filter(function(it){return (RUN.items||[]).indexOf(it.id)<0;});
 for(var i=pool.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=pool[i];pool[i]=pool[j];pool[j]=t;}
 return pool.slice(0,3).map(function(it){return it.id;});
}
function spawnShop(){
 var a=rnd(TAU),dist=rnd(120,240);
 RUN.shop={active:true,x:clamp(W/2+Math.cos(a)*dist,90,W-90),y:clamp(H/2+Math.sin(a)*dist,90,H-90),r:74,t:16,stock:pickStock(),taken:{},done:{}};
 RUN.interT=Math.max(RUN.interT,16);
 banner('⬠ A TRADER ENTERS THE ARENA — APPROACH TO BROWSE',2600);
}
function openShop(){
 var s=RUN.shop; if(!s||!s.active)return;
 s.active=false; s.done={};
 RUN.state='shop';
 banner('⬠ THE GEOMETRIST AWAITS YOUR CHOICE',1600);
 renderShopUI();
 broadcastGameState(true);
}
function closeShop(){
 RUN.shop=null; RUN.state='inter'; RUN.interT=1.6;
 shopDiv.classList.remove('on');
 broadcastGameState(true);
}
function chooseShop(pid,key){
 var s=RUN.shop; if(!RUN||RUN.state!=='shop'||!s||s.done[pid])return;
 if(key!=='cont'){
  var it=ITEM_BY[key];
  if(it&&!s.taken[key]&&(RUN.items||[]).indexOf(key)<0&&RUN.coins>=shopPrice()){
   RUN.coins-=shopPrice(); s.taken[key]=1; RUN.items=RUN.items||[]; RUN.items.push(key);
   computeStats(); buildChips();
   banner('RELIC BOUND: '+it.n.toUpperCase(),1600); SFX.unlock();
  } else return;
 } else SFX.click();
 s.done[pid]=key;
 renderShopUI();
 var all=pickerIds().every(function(id){return !!s.done[id];});
 if(all)closeShop(); else broadcastGameState(true);
}
function renderShopUI(){
 var s=RUN.shop;
 if(!s||RUN.state!=='shop'){shopDiv.classList.remove('on');return;}
 var myId=RUN.isOnline?RUN.localNetId:0;
 var done=!!s.done[myId];
 var p=shopPrice();
 var html='<div class="shop-panel"><div class="shop-head"><span class="shop-penta">⬠</span>THE GEOMETRIST<em>RELIC TRADER · WARES LAST THIS RUN ONLY</em></div>'+
 '<div class="shop-coins">BANK ◈ '+RUN.coins+' · PRICE ◈ '+p+'</div><div class="shop-grid">';
 s.stock.forEach(function(id){
  var it=ITEM_BY[id]; var dd=itemDesc(it); var taken=s.taken[id];
  html+='<button class="shop-card'+(taken?' taken':'')+'" data-buy="'+id+'"><div class="si">'+it.ic+'</div><b>'+it.n+'</b><p class="buff">'+dd.bd+'</p><p class="debb">'+dd.dd+'</p><span class="price">'+(taken?'SOLD OUT':'◈ '+p)+'</span></button>';
 });
 html+='</div><button class="shop-leave" data-leave="1">▸ CONTINUE THROUGH THE BREACH</button>';
 if(done)html+='<div class="shop-wait">CONTRACT SIGNED — AWAITING OTHER OPERATORS…</div>';
 html+='</div>';
 shopDiv.innerHTML=html; shopDiv.classList.add('on');
 function pickAction(key){
  if(RUN.isOnline&&!NET.isHost){ NET.sendClientAction('shoppick:'+key); s.done[myId]='wait'; renderShopUI(); }
  else chooseShop(myId,key);
 }
 Array.prototype.forEach.call(shopDiv.querySelectorAll('[data-buy]'),function(b){
  b.onclick=function(){ if(!done)pickAction(b.getAttribute('data-buy')); };
 });
 var lv=shopDiv.querySelector('[data-leave]'); if(lv)lv.onclick=function(){ if(!done)pickAction('cont'); };
}
var __oldUpdate=update;
update=function(dt){
 if(RUN){
  var prev=RUN.state;
  if(RUN.state==='levelwarn'){
   RUN._warnT=(RUN._warnT||1.5)-dt;
   RUN.parts.forEach(function(q){q.t-=dt;});
   RUN.parts=RUN.parts.filter(function(q){return q.t>0;});
   if(RUN.isOnline&&NET.isHost)broadcastGameState(false);
   hud();
   if(RUN._warnT<=0){warnDiv.classList.remove('on');__oldOpenLevel();}
   RUN._prevState=prev; return;
  }
  if(RUN.state==='shop'){
   if(RUN.isOnline&&NET.isHost)broadcastGameState(false);
   if(!RUN.isOnline||NET.isHost){ if(!shopDiv.classList.contains('on'))renderShopUI(); }
   hud(); RUN._prevState=prev; return;
  }
  var hostish=!RUN.isOnline||NET.isHost;
  if(hostish){
   if(RUN._prevState==='play'&&RUN.state==='inter'&&(RUN.mode==='solo'||RUN.mode==='coop'||RUN.mode==='net_coop')){
    if(!RUN.shop&&Math.random()<.3)spawnShop();
   }
   if(RUN.shop&&RUN.shop.active&&RUN.state==='inter'){
    RUN.shop.t-=dt;
    if(RUN.shop.t<=0){RUN.shop=null;RUN.interT=Math.min(RUN.interT,1.2);banner('⬠ THE TRADER DEPARTED',1200);}
    else{
     for(var i=0;i<RUN.players.length;i++){var p=RUN.players[i];
      if(p&&!p.downed&&d2(p.x,p.y,RUN.shop.x,RUN.shop.y)<(RUN.shop.r+14)*(RUN.shop.r+14)){openShop();break;}}
    }
   }
   if(RUN.state!=='shop')shopDiv.classList.remove('on');
  } else {
   if(RUN.shop&&RUN.shop.active&&RUN.state==='inter'&&!RUN._shopReq){
    var lp=RUN.players[RUN.localNetId];
    if(lp&&!lp.downed&&d2(lp.x,lp.y,RUN.shop.x,RUN.shop.y)<(RUN.shop.r+14)*(RUN.shop.r+14)){RUN._shopReq=true;NET.sendClientAction('shopenter');}
   }
   if(RUN.shop&&!RUN.shop.active)RUN._shopReq=false;
   if(RUN.state==='shop'&&!shopDiv.classList.contains('on'))renderShopUI();
   if(RUN.state!=='shop')shopDiv.classList.remove('on');
  }
  RUN._prevState=prev;
 }
 return __oldUpdate(dt);
};
if(window.NET){
 var __oca=NET.onClientAction;
 NET.onClientAction=function(pid,action){
  if(RUN&&NET.isHost){
   if(action==='shopenter'){ if(RUN.shop&&RUN.shop.active&&RUN.state==='inter')openShop(); return; }
   if(typeof action==='string'&&action.indexOf('shoppick:')===0){ chooseShop(pid,action.slice(9)); return; }
  }
  if(__oca)return __oca(pid,action);
 };
 var __bs=NET.broadcastSnapshot;
 NET.broadcastSnapshot=function(s){ if(s&&RUN)s.shop=RUN.shop||null; return __bs?__bs(s):s; };
 var __sn=NET.onStateSnapshot;
 NET.onStateSnapshot=function(s){
  if(s&&s.fx){for(var i=0;i<s.fx.length;i++){if(s.fx[i].k==='levelwarn'){warnDiv.classList.add('on');setTimeout(function(){warnDiv.classList.remove('on');},1500);}}}
  if(__sn)__sn(s);
  if(RUN&&s&&s.shop!==undefined){RUN.shop=s.shop;if(!s.shop)RUN._shopReq=false;}
 };
}
var BDEFS=[
{name:'THE CHROMATIC WARDEN',hue:336,shape:'hex',pat:'spiral',hpMul:1},
{name:'ISOTOPE PRIME',hue:200,shape:'hex',pat:'burst',hpMul:.9},
{name:'THE SLAG COLOSSUS',hue:20,shape:'square',pat:'rings',hpMul:1.3,spd:30,charge:true},
{name:'HALOGEN TYRANT',hue:120,shape:'tri',pat:'clouds',hpMul:1},
{name:'THE CRITICAL MASS',hue:55,shape:'hex',pat:'spiral',hpMul:.85,fast:true},
{name:'ENTROPY ENGINE',hue:260,shape:'square',pat:'cross',hpMul:1.15},
{name:'THE PHOSPHOR KING',hue:60,shape:'diamond',pat:'summon',hpMul:1},
{name:'NEUTRON LICH',hue:190,shape:'diamond',pat:'teleport',hpMul:.9},
{name:'MAGMA SOVEREIGN',hue:15,shape:'square',pat:'clouds',hpMul:1.2,charge:true},
{name:'THE VACUUM SAINT',hue:280,shape:'ring',pat:'pull',hpMul:1.1},
{name:'FERRIC WARBRINGER',hue:25,shape:'square',pat:'summon',hpMul:1.25,charge:true},
{name:'OMEGA DECAY',hue:330,shape:'hex',pat:'omega',hpMul:1.5},
{name:'THE CRYSTAL REGENT',hue:295,shape:'diamond',pat:'rings',hpMul:1.05},
{name:'KRYPTON MIRAGE',hue:188,shape:'ring',pat:'teleport',hpMul:.95,fast:true},
{name:'THE ACID EMPEROR',hue:95,shape:'tri',pat:'clouds',hpMul:1.15},
{name:'TUNGSTEN BEHEMOTH',hue:38,shape:'square',pat:'cross',hpMul:1.42,spd:25,charge:true},
{name:'ELECTRON MAELSTROM',hue:210,shape:'ring',pat:'pull',hpMul:1.05},
{name:'RADIANT ARCHON',hue:58,shape:'hex',pat:'burst',hpMul:.88,fast:true},
{name:'THE BORON CITADEL',hue:155,shape:'square',pat:'summon',hpMul:1.35},
{name:'MERCURY TEMPEST',hue:230,shape:'diamond',pat:'spiral',hpMul:1.02,fast:true},
{name:'SULFUR ORACLE',hue:66,shape:'tri',pat:'clouds',hpMul:1.08},
{name:'DARK MATTER PROXY',hue:278,shape:'ring',pat:'omega',hpMul:1.28},
{name:'THE CARBON MONOLITH',hue:205,shape:'square',pat:'rings',hpMul:1.38,charge:true},
{name:'ABSOLUTE ZERO',hue:196,shape:'diamond',pat:'teleport',hpMul:1.12}];
function bIdx(name){for(var i=0;i<BDEFS.length;i++){if(BDEFS[i].name===name)return i;}return -1;}
spawnBoss=function(){
 if(!RUN)return;
 var w=RUN.wave,idx=0;
 if(BDEFS.length>1){do{idx=irnd(BDEFS.length);}while(idx===RUN.lastBossIdx);}
 RUN.lastBossIdx=idx;
 var d=BDEFS[idx];
 var hp=850*(1+w*.32)*(d.hpMul||1)*playerScale();
 var e={type:'boss',boss:true,x:W/2,y:110,r:36+(idx%6)*5,pat:d.pat,fast:d.fast,canCharge:d.charge,
  hp:hp,maxhp:hp,spd:d.spd||40,dmg:22,coin:40+w*2,xp:30,hue:d.hue,shape:d.shape,
  seed:rnd(10),touch:0,slowT:0,stun:0,conf:0,flash:0,mark:0,t1:1,t2:2,t3:6,t4:4,spirA:0,tele:0,chT:0,cdx:0,cdy:0,name:d.name,
  bi:idx,sides:3+idx%6,bspd:150+(idx%4)*40,bdouble:idx%2===0,bmines:idx%3===0,bsum:idx%4===1,btele:idx%5===2,bpull:idx%6===3};
 e.eid=RUN.nextEid++;
 RUN.enemies.push(e); RUN.boss=e;
 document.getElementById('bossname').textContent='⚠ '+e.name;
 document.getElementById('bosswrap').classList.remove('hidden');
 banner('⚠ WARDEN: '+e.name,2600); SFX.boss(); RUN.shake=16; AUDIO.setTrack('boss');
};
var __oldBossAI=bossAI;
bossAI=function(b,dt,mx,my,d){
 __oldBossAI(b,dt,mx,my,d);
 if(b.dead||b.bi===undefined)return;
 b.xt1=(b.xt1||rnd(1,3))-dt;
 if(b.xt1<=0){
  b.xt1=2.6+(b.bi%3)*.7;
  var tp=nearestPlayer(b.x,b.y);
  if(b.bdouble){for(var k=0;k<10;k++){var a=k/10*TAU+b.spirA;ebul(b.x,b.y,a,b.bspd,12);}}
  if(b.bmines&&tp)RUN.eclouds.push({x:tp.x,y:tp.y,r:80,t:3});
  if(b.bsum)spawnEnemy(b.bi%2?'wisp':'mote',b.x+rnd(-70,70),b.y+rnd(-60,60));
  if(b.btele){b.x=clamp(tp.x+rnd(-160,160),40,W-40);b.y=clamp(tp.y+rnd(-160,160),40,H-40);ringFx(b.x,b.y,b.hue,120);}
  if(b.bpull){RUN.pullT=1.2;RUN.pullSrc={x:b.x,y:b.y};ringFx(b.x,b.y,b.hue,200);}
 }
};
var __oldRender=render;
render=function(){
 __oldRender();
 if(!RUN)return;
 cx.save();
 RUN.enemies.forEach(function(e){
  if(!e.boss||e.dead)return;
  var bi=(e.bi!==undefined)?e.bi:bIdx(e.name);
  var sides=3+((bi<0?0:bi)%6);
  cx.strokeStyle='hsla('+e.hue+',90%,60%,.5)';cx.lineWidth=2;
  cx.beginPath();
  for(var i=0;i<=sides;i++){var a=RUN.t*.8+i/sides*TAU;var rr=e.r+14+4*Math.sin(RUN.t*3+i);var px=e.x+Math.cos(a)*rr,py=e.y+Math.sin(a)*rr;if(i)cx.lineTo(px,py);else cx.moveTo(px,py);}
  cx.closePath();cx.stroke();
  cx.fillStyle='hsla('+e.hue+',90%,70%,.85)';cx.font='bold 12px "Share Tech Mono"';cx.textAlign='center';
  cx.fillText('WARDEN '+String((bi<0?0:bi)+1).padStart(2,'0'),e.x,e.y-e.r-16);
 });
 if(RUN.shop){
  var s=RUN.shop;
  cx.save();cx.translate(s.x,s.y);
  cx.rotate(Math.sin(RUN.t*1.4)*.2);
  cx.fillStyle='#0d1420';cx.strokeStyle='#ffb454';cx.lineWidth=3;
  cx.beginPath();for(var i=0;i<5;i++){var a=-Math.PI/2+i/5*TAU;cx.lineTo(Math.cos(a)*26,Math.sin(a)*26);}cx.closePath();cx.fill();cx.stroke();
  cx.strokeStyle='rgba(255,180,84,.35)';cx.lineWidth=2;
  cx.beginPath();for(var i2=0;i2<5;i2++){var a2=-Math.PI/2+i2/5*TAU+RUN.t*.6;cx.lineTo(Math.cos(a2)*38,Math.sin(a2)*38);}cx.closePath();cx.stroke();
  cx.fillStyle='#ffd43b';cx.font='bold 16px "Share Tech Mono"';cx.textAlign='center';cx.fillText('⬠',0,5);
  cx.fillStyle='#ffb454';cx.font='bold 10px "Share Tech Mono"';cx.fillText('TRADE',0,-44);
  cx.strokeStyle='rgba(255,180,84,.3)';cx.setLineDash([6,6]);cx.beginPath();cx.arc(0,0,s.r,0,TAU);cx.stroke();cx.setLineDash([]);
  cx.restore();
 }
 cx.restore();
};
console.log('ISO_TRADER_BOSSES_V1 active: level warning, Geometrist relic shop, 24 unique wardens.');
})();
'@
$c = $text.LastIndexOf('})();')
if ($c -lt 0) { throw "no closing in game.js" }
$text = $text.Substring(0, $c) + "`n" + $core + "`n" + $text.Substring($c)
[System.IO.File]::WriteAllText($gf, $text)
Write-Host "DONE. Hard-refresh (Ctrl+F5)." -ForegroundColor Green