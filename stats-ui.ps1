$ErrorActionPreference='Stop'
$dir=(Get-Location).Path
function Backup($f){$b="$f.bak";if(-not(Test-Path $b)){Copy-Item $f $b;Write-Host "Backup: $b"}}
function Strip($text,$m){$i=$text.IndexOf($m);if($i -lt 0){return $text};$c=$text.LastIndexOf('})();');if($c -lt 0 -or $c -lt $i){return $text};return $text.Substring(0,$i)+$text.Substring($c)}
function Inject($file,$core,$m){Backup $file;$t=[System.IO.File]::ReadAllText($file);$t=Strip $t $m;$c=$t.LastIndexOf('})();');if($c -lt 0){throw "no closing in $file"};$t=$t.Substring(0,$c)+"`n"+$core+"`n"+$t.Substring($c);[System.IO.File]::WriteAllText($file,$t);Write-Host "Patched: $file"}

$gameCore=@'
/* ISO_NEWSTATS_V2 */
(function(){
if(window.__ISO_NS2__)return;window.__ISO_NS2__=true;
var NS=['echo','momentum','tempo','flux','aegis','grit','shatter','combust','scavenge','void'];
function elnum(){var el=RUN&&RUN.el;return el&&!el.mol?+el.n:0;}
var __cs=computeStats;
computeStats=function(){
__cs();
if(!RUN||!ST)return;
var ab=RUN.ab||{},n=elnum();
NS.forEach(function(k){ST[k]=(ST[k]||0)+(ab[k]||0);});
ST.echo+=Math.floor(n/30);
ST.flux+=Math.floor(n/26);
if(n%5===0)ST.momentum+=.5;
if(n%7===0)ST.aegis+=.5;
if(n%6===0)ST.grit+=.5;
if(n%8===0)ST.tempo+=.5;
if(n%9===0)ST.shatter+=.5;
if(n%4===0)ST.combust+=.5;
if(n%3===0)ST.scavenge+=.5;
if(n%11===0)ST.void+=.5;
window.__ISO_ST=ST;window.__ISO_RUN={ab:RUN.ab,elId:RUN.el.id};
};
var NC=[
{id:'echo',ic:'∿',n:'Echo Chamber',d:'Every 5th shot echoes at 50% dmg',max:3,rarity:'rare'},
{id:'momentum',ic:'➠',n:'Momentum Coils',d:'+12% dmg while moving /rank',max:3,rarity:'uncommon'},
{id:'tempo',ic:'♩',n:'Battle Tempo',d:'After ability: +25% fire rate 4s /rank',max:3,rarity:'rare'},
{id:'flux',ic:'☯',n:'Flux Rounds',d:'Shots apply random elemental status',max:2,rarity:'epic'},
{id:'aegis',ic:'⛊',n:'Aegis Matrix',d:'+8% dmg & -8% dmg taken while shielded /rank',max:3,rarity:'rare'},
{id:'grit',ic:'🩸',n:'Last Grit',d:'Below 35% HP: +30% dmg, -10% dmg taken /rank',max:2,rarity:'uncommon'},
{id:'shatter',ic:'❖',n:'Shatter Core',d:'Frozen/stunned kills explode /rank',max:3,rarity:'rare'},
{id:'combust',ic:'♨',n:'Combustion',d:'Burning kills explode & spread fire /rank',max:3,rarity:'uncommon'},
{id:'scavenge',ic:'⚙',n:'Scavenge Plating',d:'Coins also grant shield /rank',max:2,rarity:'common'},
{id:'void',ic:'🕳',n:'Void Touch',d:'Low-HP foes may be erased /rank',max:2,rarity:'epic'}];
NC.forEach(function(a){ABIL.push(a);ALL_CARDS.push(a);});
var __fire=fire;
fire=function(p){
var before=RUN?RUN.bullets.length:0;
__fire(p);
if(!RUN||!ST)return;
var mi=movementInput(p),moving=(mi.dx||mi.dy),mult=1;
if(ST.momentum&&moving)mult*=1+.12*ST.momentum;
if(ST.tempo&&(p.tempoT||0)>0)mult*=1+.25*ST.tempo;
if(ST.aegis&&p.sh>=ST.shieldMax*.9)mult*=1+.2*ST.aegis;
if(ST.grit&&p.hp<ST.hp*.35)mult*=1+.3*ST.grit;
for(var i=before;i<RUN.bullets.length;i++){var b=RUN.bullets[i];b.dmg*=mult;
if(ST.flux){var r=Math.random();if(r<.34)b.burn=true;else if(r<.67)b.poison=true;else b.corrode=true;}}
if(ST.echo){p.echoN=(p.echoN||0)+1;if(p.echoN%5===0){var s=RUN.bullets[RUN.bullets.length-1];if(s)RUN.bullets.push({x:p.x,y:p.y,vx:s.vx*.9,vy:s.vy*.9,dmg:s.dmg*.5,r:s.r,pierce:s.pierce+1,hit:[],life:1.2,owner:p.id});}}
};
var __ke=killEnemy;
killEnemy=function(e){
var fr=e.freeze>0||e.stun>0,bu=!!e.burn,x=e.x,y=e.y;
__ke(e);
if(fr&&ST.shatter)aoe(x,y,70+20*ST.shatter,ST.dmg*.8*ST.shatter,205);
if(bu&&ST.combust){aoe(x,y,60+20*ST.combust,ST.dmg*.6*ST.combust,25);RUN.enemies.forEach(function(o){if(!o.dead&&d2(o.x,o.y,x,y)<90*90)addBurn(o,ST.dmg*.4,3);});}
};
var __hp=hurtPlayer;
hurtPlayer=function(p,d){
if(ST){if(ST.aegis&&p.sh>0)d*=1-.08*ST.aegis;if(ST.grit&&p.hp<ST.hp*.35)d*=1-.1*ST.grit;}
__hp(p,d);
};
var __pk=updPickups;
updPickups=function(dt){var c0=RUN?RUN.coins:0;__pk(dt);if(RUN&&ST&&ST.scavenge&&RUN.coins>c0){RUN.players.forEach(function(q){q.sh=Math.min(ST.shieldMax,q.sh+(RUN.coins-c0)*.15*ST.scavenge);});}};
var __de=dmgEnemy;
dmgEnemy=function(e,d,o){if(ST&&ST.void&&e&&!e.boss&&!e.dead&&e.hp>0&&e.hp<e.maxhp*.1&&Math.random()<.12*ST.void){d=e.hp+999;o=o||{};o.col='#b66cff';o.big=true;ringFx(e.x,e.y,280,60);}__de(e,d,o);};
var __ua=useActive;
useActive=function(p){var had=!p.downed&&(p.activeCd||0)<=0;__ua(p);if(had&&ST&&ST.tempo)p.tempoT=3+ST.tempo;};
SAVE.set.binds=SAVE.set.binds||{dash:'Space',active:'KeyQ',autofire:'KeyF'};
addEventListener('keydown',function(e){
if(window.__rebinding)return;
if(!RUN||document.getElementById('scr-game').classList.contains('hidden'))return;
var B=SAVE.set.binds;
function act(a){if(RUN.isOnline){requestPlayerAction(a);}else{if(a==='dash')tryDash(RUN.players[0]);else useActive(RUN.players[0]);}}
if(e.code===B.dash&&B.dash!=='Space'){e.preventDefault();e.stopPropagation();act('dash');}
else if(e.code===B.active&&B.active!=='KeyQ'){e.preventDefault();e.stopPropagation();act('active');}
else if(e.code===B.autofire&&B.autofire!=='KeyF'){e.preventDefault();e.stopPropagation();autofire=!autofire;var el2=document.getElementById('autofire');if(el2)el2.innerHTML='<span>'+B.autofire.replace('Key','')+' · AUTOFIRE '+(autofire?'ON':'OFF')+'</span>';}
else if(e.code==='Space'&&B.dash!=='Space')e.stopPropagation();
else if(e.code==='KeyQ'&&B.active!=='KeyQ')e.stopPropagation();
else if(e.code==='KeyF'&&B.autofire!=='KeyF')e.stopPropagation();
},true);
var __ren=render;
var __isoPrev=performance.now(),__isoFps=60;
render=function(){
var now=performance.now();var dt=now-__isoPrev;__isoPrev=now;
if(dt>0)__isoFps=__isoFps*.9+(1000/dt)*.1;
__ren();
if(!RUN)return;
var S=SAVE.set;
if(S.fps){cx.fillStyle='#7ef0a6';cx.font='11px monospace';cx.textAlign='left';cx.fillText('FPS '+Math.round(__isoFps),12,H-12);}
if(S.trails||S.glow){cx.globalCompositeOperation='lighter';
RUN.bullets.forEach(function(b){
if(S.trails){cx.strokeStyle='hsla('+RUN.hue+',90%,65%,.35)';cx.lineWidth=Math.max(1,b.r*.8);cx.beginPath();cx.moveTo(b.x-b.vx*.05,b.y-b.vy*.05);cx.lineTo(b.x,b.y);cx.stroke();}
if(S.glow){var g=cx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r*3);g.addColorStop(0,'hsla('+RUN.hue+',90%,70%,.3)');g.addColorStop(1,'transparent');cx.fillStyle=g;cx.beginPath();cx.arc(b.x,b.y,b.r*3,0,TAU);cx.fill();}
});
cx.globalCompositeOperation='source-over';}
if(S.tele){RUN.enemies.forEach(function(e){if(e.dead)return;
if(e.type==='sniper'&&e.charge>0){var tp=RUN.players[0];cx.strokeStyle='rgba(255,60,60,.5)';cx.lineWidth=1;cx.beginPath();cx.moveTo(e.x,e.y);cx.lineTo(tp.x,tp.y);cx.stroke();}
if(e.type==='charger'&&e.charging>0){cx.strokeStyle='hsla(10,90%,60%,.7)';cx.lineWidth=2;cx.beginPath();cx.arc(e.x,e.y,e.r+6,0,TAU);cx.stroke();}
if(e.type==='bomber'&&e.hp<e.maxhp*.35){cx.fillStyle='rgba(255,120,40,'+(Math.abs(Math.sin(RUN.t*18))*.8)+')';cx.beginPath();cx.arc(e.x,e.y-e.r-6,3,0,TAU);cx.fill();}
});}
if(S.minimap){var hc=document.getElementById('h-coins');var pr=hc&&hc.parentElement?hc.parentElement.getBoundingClientRect():null;var size=110;
var rx=pr?pr.right-size-4:W-size-12,ry=pr?pr.bottom+4:12;
cx.fillStyle='rgba(10,15,22,.85)';cx.fillRect(rx,ry,size,size);
cx.strokeStyle='hsla('+RUN.hue+',70%,55%,.6)';cx.lineWidth=1;cx.strokeRect(rx,ry,size,size);
RUN.pickups.forEach(function(k){cx.fillStyle='#ffd43b';cx.fillRect(rx+k.x/W*size-1,ry+k.y/H*size-1,2,2);});
RUN.enemies.forEach(function(e){if(!e.dead){cx.fillStyle=e.boss?'#ff4bd9':'#ff5d8f';var s2=e.boss?3:2;cx.fillRect(rx+e.x/W*size-1,ry+e.y/H*size-1,s2,s2);}});
RUN.players.forEach(function(p){cx.fillStyle='#4fd8eb';cx.fillRect(rx+p.x/W*size-2,ry+p.y/H*size-2,3,3);});}
if(S.redflash){var hf=document.getElementById('hitflash');if(hf&&parseFloat(hf.style.opacity)>0.4)hf.style.opacity=0.4;}
};
console.log('ISO_NEWSTATS_V2 active: 10 new stats, 10 new cards, settings hooks, minimap/trails/telegraphs.');
})();
'@
Inject (Join-Path $dir 'game.js') $gameCore 'ISO_NEWSTATS_V2'

$uiCore=@'
/* ISO_UI_STATS_V2 */
(function(){
if(window.__ISO_UI2__)return;window.__ISO_UI2__=true;
var NS=[['echo','ECHO','every 5th shot echoes'],['momentum','MOMENTUM','dmg bonus while moving'],['tempo','TEMPO','fire rate after ability'],['flux','FLUX','random status on shots'],['aegis','AEGIS','bonus while shielded'],['grit','GRIT','bonus below 35% HP'],['shatter','SHATTER','frozen/stunned kills explode'],['combust','COMBUST','burning kills explode'],['scavenge','SCAVENGE','coins grant shield'],['void','VOID','chance to erase low-HP foes']];
function baseNS(el){var n=el.mol?0:(+el.n||0);return{echo:Math.floor(n/30),flux:Math.floor(n/26),momentum:(n%5===0)?.5:0,aegis:(n%7===0)?.5:0,grit:(n%6===0)?.5:0,tempo:(n%8===0)?.5:0,shatter:(n%9===0)?.5:0,combust:(n%4===0)?.5:0,scavenge:(n%3===0)?.5:0,void:(n%11===0)?.5:0};}
function statRows(el){
var c=DATA.baseCombat(el);
var cat=el.mol?null:DATA.CATS[el.cat];
var base=[['DMG',c.dmg.toFixed(1)],['FIRE RATE',c.rate.toFixed(2)+'/s'],['PROJ SPEED',Math.round(c.ps)],['MAX HP',Math.round(c.hp)],['CRIT',c.crit+'%'],['PIERCE',c.pierce],['KNOCKBACK',Math.round(c.kb)],['ARMOR',Math.round(c.armor*100)+'%'],['TOXIC',cat?cat.tox:2],['REACT',cat?cat.react:3]];
var ns=baseNS(el);
var live=(window.__ISO_RUN&&window.__ISO_RUN.elId===el.id)?window.__ISO_ST:null;
var html=base.map(function(r){return '<div style="display:flex;justify-content:space-between;gap:8px"><span>'+r[0]+'</span><b style="color:var(--cy)">'+r[1]+'</b></div>';}).join('');
NS.forEach(function(s2){
var v=(ns[s2[0]]||0)+((live&&live[s2[0]])?live[s2[0]]-(ns[s2[0]]||0):0);
var bonus=live&&v>(ns[s2[0]]||0)?' <i style="color:var(--gr)">+'+(v-(ns[s2[0]]||0)).toFixed(1)+'</i>':'';
html+='<div style="display:flex;justify-content:space-between;gap:8px" title="'+s2[2]+'"><span>'+s2[1]+bonus+'</span><b style="color:var(--mg)">'+(v||0)+'</b></div>';
});
return html;
}
var oldSV=selectVault;
selectVault=function(id){
oldSV(id);
try{
var el=EL(DATA.canonicalId(id));
var statsBox=document.getElementById('vd-stats');
if(!statsBox||document.getElementById('vd-more'))return;
var wrap=document.createElement('div');
wrap.style.cssText='margin-top:8px';
wrap.innerHTML='<button id="vd-more" class="btn chamf" style="width:100%;padding:6px 10px;font-size:10px;letter-spacing:2px">FULL STATS ▾</button><div id="vd-extra" style="display:none;margin-top:8px;max-height:230px;overflow:auto;border:1px solid #22303f;padding:8px;font-family:var(--mono);font-size:10px;color:var(--tx2)"></div>';
statsBox.parentElement.appendChild(wrap);
var btn=wrap.querySelector('#vd-more'),ex=wrap.querySelector('#vd-extra');
btn.onclick=function(){
var open=ex.style.display!=='none';
ex.style.display=open?'none':'block';
btn.textContent=open?'FULL STATS ▾':'FULL STATS ▴';
if(!open)ex.innerHTML=statRows(el);
SFX.click();
};
}catch(err){}
};
function addSettingsExtra(){
var scr=document.getElementById('scr-settings');
if(!scr||document.getElementById('qol2-box'))return;
var box=document.createElement('div');box.id='qol2-box';box.style.cssText='margin-top:14px;display:grid;gap:10px;max-width:560px';
box.innerHTML='<div class="panel" style="padding:14px"><b style="letter-spacing:2px">EXTRA OPTIONS</b><div id="qx-opts" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"></div></div><div class="panel" style="padding:14px"><b style="letter-spacing:2px">KEYBINDS</b><div id="qx-keys" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"></div><small style="color:var(--tx2)">Click a bind, then press a key · Esc cancels.</small></div>';
scr.appendChild(box);
var orow=box.querySelector('#qx-opts');
[['minimap','MINIMAP',1],['fps','FPS COUNTER',0],['trails','BULLET TRAILS',1],['glow','GLOW FX',1],['tele','TELEGRAPHS',1],['hitstop','HITSTOP/SLOW-MO',1],['redflash','SOFT FLASH',0]].forEach(function(o){
if(SAVE.set[o[0]]===undefined)SAVE.set[o[0]]=o[2];
var b=document.createElement('button');b.className='btn chamf';b.style.cssText='padding:6px 10px;font-size:10px';
function paint(){b.textContent=o[1]+(SAVE.set[o[0]]?' ✓':' ✗');b.style.borderColor=SAVE.set[o[0]]?'#48c774':'#555';}
paint();
b.onclick=function(){SAVE.set[o[0]]=SAVE.set[o[0]]?0:1;SAVE.save();paint();SFX.click();};
orow.appendChild(b);
});
var krow=box.querySelector('#qx-keys');
SAVE.set.binds=SAVE.set.binds||{dash:'Space',active:'KeyQ',autofire:'KeyF'};
function buildKeys(){
krow.innerHTML='';
['dash','active','autofire'].forEach(function(k){
var b=document.createElement('button');b.className='btn chamf';b.style.cssText='padding:6px 10px;font-size:10px';
b.textContent=k.toUpperCase()+': '+String(SAVE.set.binds[k]).replace('Key','');
b.onclick=function(){window.__rebinding=k;b.textContent=k.toUpperCase()+': PRESS KEY…';SFX.click();};
krow.appendChild(b);
});
}
buildKeys();
addEventListener('keydown',function(e){
if(!window.__rebinding)return;
e.preventDefault();e.stopPropagation();
if(e.code!=='Escape'){SAVE.set.binds[window.__rebinding]=e.code;SAVE.save();}
window.__rebinding=null;buildKeys();
},true);
}
addSettingsExtra();
console.log('ISO_UI_STATS_V2 active: vault FULL STATS dropdown + expanded settings.');
})();
'@
Inject (Join-Path $dir 'ui.js') $uiCore 'ISO_UI_STATS_V2'
Write-Host 'DONE. Hard-refresh (Ctrl+F5).' -ForegroundColor Green