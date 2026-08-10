$ErrorActionPreference='Stop'
$dir=(Get-Location).Path
$gf=Join-Path $dir 'game.js'
if(-not(Test-Path $gf)){throw 'game.js not found in '+$dir}
$bak="$gf.bak_mega2"
if(-not(Test-Path $bak)){Copy-Item $gf $bak;Write-Host "Backup: $bak"}
$text=[System.IO.File]::ReadAllText($gf)
foreach($m in @('ISO_MEGA2_GAME','ISO_QOL2_GAME')){
 $i=$text.IndexOf($m)
 if($i -ge 0){$c=$text.LastIndexOf('})();');if($c -gt $i){$text=$text.Substring(0,$i)+$text.Substring($c);Write-Host "Stripped old block: $m"}}
}
$core=@'
/* ISO_MEGA2_GAME */
(function(){
if(window.__ISO_MEGA2__)return;window.__ISO_MEGA2__=true;
var NEWSTATS=['echo','momentum','tempo','flux','aegis','grit','shatter','combust','scavenge','void'];
/* ---------- new cards (new stats + core-mechanic mythics) ---------- */
var NC=[
{id:'echo',ic:'∿',n:'Echo Chamber',d:'Every 5th shot echoes at 50% dmg',max:3,rarity:'rare'},
{id:'momentum',ic:'➠',n:'Momentum Coils',d:'+12% dmg while moving /rank',max:3,rarity:'uncommon'},
{id:'tempo',ic:'♩',n:'Battle Tempo',d:'After ability: +25% fire rate 4s /rank',max:3,rarity:'rare'},
{id:'flux',ic:'☯',n:'Flux Rounds',d:'Shots apply a random elemental status',max:2,rarity:'epic'},
{id:'aegis',ic:'⛊',n:'Aegis Matrix',d:'+8% dmg & -8% dmg taken while shielded /rank',max:3,rarity:'rare'},
{id:'grit',ic:'🩸',n:'Last Grit',d:'Below 35% HP: +30% dmg, -10% dmg taken /rank',max:2,rarity:'uncommon'},
{id:'shatter',ic:'❖',n:'Shatter Core',d:'Frozen/stunned kills explode /rank',max:3,rarity:'rare'},
{id:'combust',ic:'♨',n:'Combustion',d:'Burning kills explode & spread fire /rank',max:3,rarity:'uncommon'},
{id:'scavenge',ic:'⚙',n:'Scavenge Plating',d:'Coins also grant shield /rank',max:2,rarity:'common'},
{id:'void',ic:'🕳',n:'Void Touch',d:'Low-HP foes may be erased /rank',max:2,rarity:'epic'},
{id:'singularity',ic:'⬤',n:'SINGULARITY CORE',d:'CORE: every 10th shot collapses into a black hole',max:1,rarity:'mythic'},
{id:'phoenix',ic:'🔥',n:'PHOENIX PROTOCOL',d:'CORE: once per run, death becomes a nova + revive',max:1,rarity:'mythic'},
{id:'overclock',ic:'⚡',n:'OVERCLOCK HEART',d:'CORE: +40% fire rate, but -0.4 HP per shot',max:1,rarity:'mythic'},
{id:'dilations',ic:'⏳',n:'TIME DILATION',d:'CORE: every 8s slow all enemies for 2s',max:1,rarity:'legendary'},
{id:'dronecmd',ic:'⌬',n:'DRONE COMMAND',d:'CORE: periodic 4-target auto-volley',max:1,rarity:'legendary'},
{id:'critwave',ic:'✧',n:'CRIT WAVE',d:'CORE: crits fire a 3-shot wave',max:1,rarity:'legendary'}
];
NC.forEach(function(a){ABIL.push(a);ALL_CARDS.push(a);});
/* ---------- computeStats: new stats + element baselines + stack bonuses ---------- */
var __cs=computeStats;
computeStats=function(){
__cs();
if(!RUN||!ST)return;
var ab=RUN.ab||{};
NEWSTATS.forEach(function(k){ST[k]=(ST[k]||0)+(ab[k]||0);});
var n=RUN.el&&RUN.el.mol?(String(RUN.el.f||'').length*3):(+RUN.el.n||0);
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
Object.keys(ab).forEach(function(id){
if(id.indexOf('xcard_')===0){var lv=ab[id];if(lv>=3)ST.crit+=1;if(lv>=5)ST.dmg*=1.03;}
});
if(ab.overclock)ST.rate*=1.4;
};
/* ---------- fire wrap: echo/momentum/tempo/flux/aegis/grit/singularity/overclock/critwave ---------- */
var __fire=fire;
fire=function(p){
var before=RUN?RUN.bullets.length:0;
var mult=1;
if(ST){
var mi=movementInput(p);
if(ST.momentum&&(mi.dx||mi.dy))mult*=1+.12*ST.momentum;
if(ST.tempo&&(p.tempoT||0)>0)mult*=1+.25*ST.tempo;
if(ST.aegis&&p.sh>=ST.shieldMax*.9)mult*=1+.2*ST.aegis;
if(ST.grit&&p.hp<ST.hp*.35)mult*=1+.3*ST.grit;
}
__fire(p);
if(!RUN)return;
for(var i=before;i<RUN.bullets.length;i++){
var b=RUN.bullets[i];b.dmg*=mult;
if(ST&&ST.flux){var r=Math.random();if(r<.34)b.burn=true;else if(r<.67)b.poison=true;else b.corrode=true;}
if(ST&&ST.critwave&&b.crit&&!b.cw){b.cw=1;for(var k=-1;k<=1;k++)RUN.bullets.push({x:b.x,y:b.y,vx:b.vx*.8+k*60,vy:b.vy*.8+k*60,dmg:b.dmg*.4,r:3,pierce:0,hit:[],life:.6,owner:p.id});}
}
if(ST&&ST.echo){p.echoN=(p.echoN||0)+1;if(p.echoN%5===0){var src=RUN.bullets[RUN.bullets.length-1];if(src)RUN.bullets.push({x:p.x,y:p.y,vx:src.vx*.9,vy:src.vy*.9,dmg:src.dmg*.5,r:src.r,pierce:src.pierce+1,hit:[],life:1.2,owner:p.id});}}
if(RUN.ab&&RUN.ab.singularity){p.singN=(p.singN||0)+(RUN.bullets.length-before);if(p.singN>=10){p.singN=0;var lb=RUN.bullets[RUN.bullets.length-1];var sx=lb?lb.x:p.x,sy=lb?lb.y:p.y;RUN.wells.push({x:sx,y:sy,t:1.2,lv:3});setTimeout(function(){if(RUN)aoe(sx,sy,180,ST.dmg*2.5,280);},1200);}}
if(RUN.ab&&RUN.ab.overclock&&RUN.bullets.length>before)p.hp=Math.max(1,p.hp-.4);
};
/* ---------- useActive -> tempo ---------- */
var __ua=useActive;
useActive=function(p){var ready=!p.downed&&(p.activeCd||0)<=0;__ua(p);if(ready&&ST&&ST.tempo)p.tempoT=3+ST.tempo;};
/* ---------- hurtPlayer: aegis/grit/phoenix ---------- */
var __hp=hurtPlayer;
hurtPlayer=function(p,d){
if(ST&&RUN){
if(ST.phoenix&&!RUN.phoenixUsed&&(p.hp-d*1.15)<=0){RUN.phoenixUsed=true;p.hp=ST.hp*.5;p.iframes=2;aoe(p.x,p.y,260,ST.dmg*3,RUN.hue);banner('PHOENIX PROTOCOL',1800);ringFx(p.x,p.y,25,200);return;}
if(ST.aegis&&p.sh>0)d*=1-.08*ST.aegis;
if(ST.grit&&p.hp<ST.hp*.35)d*=1-.1*ST.grit;
}
__hp(p,d);
};
/* ---------- dmgEnemy: void erase ---------- */
var __de=dmgEnemy;
dmgEnemy=function(e,d,o){
if(ST&&ST.void&&e&&!e.boss&&!e.dead&&e.hp>0&&e.hp<e.maxhp*.1&&Math.random()<.12*ST.void){d=e.hp+999;o=o||{};o.col='#b66cff';o.big=true;ringFx(e.x,e.y,280,70);}
__de(e,d,o);
};
/* ---------- killEnemy: shatter + combust ---------- */
var __ke=killEnemy;
killEnemy=function(e){
var fr=e.freeze>0||e.stun>0,bu=!!e.burn,x=e.x,y=e.y;
__ke(e);
if(fr&&ST&&ST.shatter)aoe(x,y,70+20*ST.shatter,ST.dmg*.8*ST.shatter,205);
if(bu&&ST&&ST.combust){aoe(x,y,60+20*ST.combust,ST.dmg*.6*ST.combust,25);RUN.enemies.forEach(function(o){if(!o.dead&&d2(o.x,o.y,x,y)<90*90)addBurn(o,ST.dmg*.4,3);});}
};
/* ---------- updPickups: scavenge ---------- */
var __pk=updPickups;
updPickups=function(dt){
var c0=RUN?RUN.coins:0;
__pk(dt);
if(RUN&&ST&&ST.scavenge&&RUN.coins>c0)RUN.players.forEach(function(q){q.sh=Math.min(ST.shieldMax,q.sh+(RUN.coins-c0)*.15*ST.scavenge);});
};
/* ---------- updPlayer: tempo decay, dilation, dronecmd ---------- */
var __up=updPlayer;
updPlayer=function(p,dt){
__up(p,dt);
if(!RUN)return;
if(p.tempoT>0)p.tempoT-=dt;
if(RUN.ab&&RUN.ab.dilations){p.dilT=(p.dilT||8)-dt;if(p.dilT<=0){p.dilT=8;RUN.enemies.forEach(function(e){if(!e.boss)e.slowT=Math.max(e.slowT,2);});ringFx(p.x,p.y,200,160);}}
if(RUN.ab&&RUN.ab.dronecmd){p.drT=(p.drT||2)-dt;if(p.drT<=0){p.drT=2;RUN.enemies.filter(function(e){return !e.dead;}).slice(0,4).forEach(function(t){var a=Math.atan2(t.y-p.y,t.x-p.x);RUN.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*ST.ps,vy:Math.sin(a)*ST.ps,dmg:ST.dmg*.6,r:4,pierce:1,hit:[],life:1.2,owner:p.id});});}}
};
/* ---------- chooseCard: rarity bonuses ---------- */
var __cc=chooseCard;
chooseCard=function(pid,key){
var card=null;
if(RUN&&RUN.pools&&RUN.pools[pid])card=RUN.pools[pid].find(function(c){return c.key===key;});
__cc(pid,key);
if(card&&RUN&&card.rarity){
if(card.rarity==='rare')ST.dmg*=1.02;
else if(card.rarity==='epic')RUN.players.forEach(function(p){p.hp=Math.min(ST.hp,p.hp+10);});
else if(card.rarity==='legendary'){RUN.coins+=15;SAVE.addCoins(15);}
else if(card.rarity==='mythic')ST.crit+=3;
}
};
/* ---------- settings UI + keybinds ---------- */
function buildKeysUI(krow){
krow.innerHTML='';
var K=['dash','active','autofire'];
K.forEach(function(k){
var b=document.createElement('button');b.className='btn chamf';b.style.cssText='padding:6px 10px;font-size:10px';
b.textContent=k.toUpperCase()+': '+String(SAVE.set.binds[k]).replace('Key','');
b.onclick=function(){window.__reb=k;b.textContent=k.toUpperCase()+': PRESS KEY…';};
krow.appendChild(b);
});
}
function addSettings(){
var scr=document.getElementById('scr-settings');
if(!scr||document.getElementById('mega-set'))return;
SAVE.set.binds=SAVE.set.binds||{dash:'Space',active:'KeyQ',autofire:'KeyF'};
var box=document.createElement('div');box.id='mega-set';box.style.cssText='margin-top:14px;display:grid;gap:10px;max-width:640px';
box.innerHTML='<div class="panel" style="padding:14px"><b>EXTRA OPTIONS</b><div id="mx-opts" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"></div></div><div class="panel" style="padding:14px"><b>KEYBINDS</b><div id="mx-keys" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"></div><small style="color:var(--tx2)">Click a bind then press a key · Esc cancels.</small></div>';
scr.appendChild(box);
var orow=document.getElementById('mx-opts');
[['minimap','MINIMAP'],['fps','FPS'],['trails','TRAILS'],['glow','GLOW'],['tele','TELEGRAPHS'],['hitstop','HITSTOP'],['redflash','SOFT FLASH']].forEach(function(o){
if(SAVE.set[o[0]]===undefined)SAVE.set[o[0]]=1;
var b=document.createElement('button');b.className='btn chamf';b.style.cssText='padding:6px 10px;font-size:10px';
function paint(){b.textContent=o[1]+(SAVE.set[o[0]]?' ✓':' ✗');b.style.borderColor=SAVE.set[o[0]]?'#48c774':'#555';}
paint();
b.onclick=function(){SAVE.set[o[0]]=SAVE.set[o[0]]?0:1;SAVE.save();paint();};
orow.appendChild(b);
});
buildKeysUI(document.getElementById('mx-keys'));
}
addSettings();
addEventListener('keydown',function(e){
if(window.__reb){e.preventDefault();e.stopPropagation();if(e.code!=='Escape'){SAVE.set.binds[window.__reb]=e.code;SAVE.save();}window.__reb=null;var kr=document.getElementById('mx-keys');if(kr)buildKeysUI(kr);return;}
if(!RUN||document.getElementById('scr-game').classList.contains('hidden'))return;
var B=SAVE.set.binds||{};
function act(a){if(RUN.isOnline)requestPlayerAction(a);else{if(a==='dash')tryDash(RUN.players[0]);else useActive(RUN.players[0]);}}
if(e.code===B.dash&&B.dash!=='Space'){e.stopPropagation();act('dash');}
else if(e.code===B.active&&B.active!=='KeyQ'){e.stopPropagation();act('active');}
else if(e.code===B.autofire&&B.autofire!=='KeyF'){e.stopPropagation();autofire=!autofire;var el=document.getElementById('autofire');if(el)el.innerHTML='<span>AUTOFIRE '+(autofire?'ON':'OFF')+'</span>';}
else if(e.code==='Space'&&B.dash!=='Space')e.stopPropagation();
else if(e.code==='KeyQ'&&B.active!=='KeyQ')e.stopPropagation();
else if(e.code==='KeyF'&&B.autofire!=='KeyF')e.stopPropagation();
},true);
/* ---------- render wrap: trails, telegraphs, minimap in money panel, fps ---------- */
var fpsE=0,fpsT=0,fpsV=60;
var __ren=render;
render=function(){
__ren();
if(!RUN)return;
var S=SAVE.set;
fpsT+=1/60;fpsE++;if(fpsT>=.5){fpsV=Math.round(fpsE/fpsT);fpsE=0;fpsT=0;}
if(S.trails){cx.globalCompositeOperation='lighter';RUN.bullets.forEach(function(b){cx.strokeStyle='hsla('+RUN.hue+',90%,65%,.35)';cx.lineWidth=Math.max(1,b.r*.8);cx.beginPath();cx.moveTo(b.x-b.vx*.05,b.y-b.vy*.05);cx.lineTo(b.x,b.y);cx.stroke();});cx.globalCompositeOperation='source-over';}
if(S.tele){RUN.enemies.forEach(function(e){if(e.dead)return;
if(e.type==='sniper'&&e.charge>0){var tp=nearestPlayer(e.x,e.y);cx.strokeStyle='rgba(255,60,60,.5)';cx.lineWidth=1;cx.beginPath();cx.moveTo(e.x,e.y);cx.lineTo(tp.x,tp.y);cx.stroke();}
if(e.type==='charger'&&e.charging>0){cx.strokeStyle='hsla(10,90%,60%,.7)';cx.lineWidth=2;cx.beginPath();cx.arc(e.x,e.y,e.r+6,0,TAU);cx.stroke();}
if(e.type==='bomber'&&e.hp<e.maxhp*.35){cx.fillStyle='rgba(255,120,40,'+(Math.abs(Math.sin(RUN.t*18))*.8)+')';cx.beginPath();cx.arc(e.x,e.y-e.r-6,3,0,TAU);cx.fill();}
});}
if(S.minimap){
var hc=document.getElementById('h-coins');
var pr=hc&&hc.parentElement?hc.parentElement.getBoundingClientRect():null;
var size=110;
var rx=pr?pr.right-size-4:W-size-12,ry=pr?pr.bottom+4:12;
cx.fillStyle='rgba(10,15,22,.85)';cx.fillRect(rx,ry,size,size);
cx.strokeStyle='hsla('+RUN.hue+',70%,55%,.6)';cx.lineWidth=1;cx.strokeRect(rx,ry,size,size);
function dot(x,y,c,s2){cx.fillStyle=c;cx.fillRect(rx+x/W*size-(s2||1),ry+y/H*size-(s2||1),(s2||2)+1,(s2||2)+1);}
RUN.pickups.forEach(function(k){dot(k.x,k.y,'#ffd43b',1);});
RUN.enemies.forEach(function(e){if(!e.dead)dot(e.x,e.y,e.boss?'#ff4bd9':'#ff5d8f',e.boss?2:1);});
RUN.players.forEach(function(p){dot(p.x,p.y,'#4fd8eb',2);});
}
if(S.fps){cx.fillStyle='#7ef0a6';cx.font='11px monospace';cx.textAlign='left';cx.fillText('FPS '+fpsV,12,H-12);}
};
console.log('ISO_MEGA2_GAME active: 10 new stats, 16 new cards, rarity bonuses, expanded settings + keybinds.');
})();
'@
$c=$text.LastIndexOf('})();')
if($c -lt 0){throw 'no closing found in game.js'}
$text=$text.Substring(0,$c)+"`n"+$core+"`n"+$text.Substring($c)
[System.IO.File]::WriteAllText($gf,$text)
Write-Host 'DONE. Hard-refresh (Ctrl+F5).' -ForegroundColor Green