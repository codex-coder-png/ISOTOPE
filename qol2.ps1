$ErrorActionPreference='Stop'
$dir=(Get-Location).Path
$gf=Join-Path $dir 'game.js'
if(-not(Test-Path $gf)){throw 'game.js not found in '+$dir}
$bak="$gf.bak_qol2"
if(-not(Test-Path $bak)){Copy-Item $gf $bak;Write-Host "Backup: $bak"}
$text=[System.IO.File]::ReadAllText($gf)
$m='ISO_QOL2'
$i=$text.IndexOf($m)
if($i -ge 0){$c=$text.LastIndexOf('})();');if($c -gt $i){$text=$text.Substring(0,$i)+$text.Substring($c);Write-Host 'Old QOL2 stripped.'}}
$core=@'
/* ISO_QOL2 */
(function(){
if(window.__ISO_QOL2__)return;window.__ISO_QOL2__=true;
var DEF={minimap:1,mmsize:1,parts:1,ehp:0,tele:1,fps:0,hitstop:1,redflash:0,trails:1,glow:1,auras:1,binds:{dash:'Space',active:'KeyQ',autofire:'KeyF'}};
SAVE.set=SAVE.set||{};
Object.keys(DEF).forEach(function(k){if(SAVE.set[k]===undefined)SAVE.set[k]=DEF[k];});
if(!SAVE.set.binds)SAVE.set.binds={};
['dash','active','autofire'].forEach(function(k){if(!SAVE.set.binds[k])SAVE.set.binds[k]=DEF.binds[k];});
if(SAVE.save)SAVE.save();
function SET(){return SAVE.set;}
function keyName(c){return String(c).replace('Key','').replace('Digit','');}
/* ---- keybinds + actions ---- */
var rebinding=null;
function dashAct(){if(RUN.isOnline)NET.sendClientAction('dash');else tryDash(RUN.players[0]);}
function actAct(){if(RUN.isOnline)NET.sendClientAction('active');else useActive(RUN.players[0]);}
function updAF(){var el=document.getElementById('autofire');if(el)el.innerHTML='<span>'+keyName(SAVE.set.binds.autofire)+' · AUTOFIRE '+(autofire?'ON':'OFF')+'</span>';}
addEventListener('keydown',function(e){
if(rebinding){e.preventDefault();e.stopPropagation();if(e.code!=='Escape'){SAVE.set.binds[rebinding]=e.code;SAVE.save();}rebinding=null;refreshBinds();return;}
if(!RUN||document.getElementById('scr-game').classList.contains('hidden'))return;
var B=SAVE.set.binds;
if(e.code===B.dash&&B.dash!=='Space'){e.preventDefault();e.stopPropagation();dashAct();}
else if(e.code===B.active&&B.active!=='KeyQ'){e.preventDefault();e.stopPropagation();actAct();}
else if(e.code===B.autofire&&B.autofire!=='KeyF'){e.preventDefault();e.stopPropagation();autofire=!autofire;updAF();}
else if(e.code==='Space'&&B.dash!=='Space'){e.stopPropagation();}
else if(e.code==='KeyQ'&&B.active!=='KeyQ'){e.stopPropagation();}
else if(e.code==='KeyF'&&B.autofire!=='KeyF'){e.stopPropagation();}
},true);
/* ---- settings UI ---- */
var OPTS=[['minimap','MINIMAP'],['ehp','ALWAYS HP BARS'],['tele','TELEGRAPHS'],['fps','FPS COUNTER'],['trails','BULLET TRAILS'],['glow','GLOW FX'],['auras','ENEMY AURAS'],['hitstop','HITSTOP/SLOW-MO'],['redflash','REDUCED FLASH']];
function refreshBinds(){
var row=document.getElementById('kb-row');if(!row)return;row.innerHTML='';
['dash','active','autofire'].forEach(function(k){
var b=document.createElement('button');b.className='btn chamf';b.style.cssText='padding:6px 12px;font-size:11px';
b.textContent=k.toUpperCase()+': '+keyName(SAVE.set.binds[k]);
b.onclick=function(){rebinding=k;b.textContent=k.toUpperCase()+': PRESS KEY…';};
row.appendChild(b);});
}
function refreshOpts(){
var row=document.getElementById('opt-row');if(!row)return;row.innerHTML='';
OPTS.forEach(function(o){
var b=document.createElement('button');b.className='btn chamf';b.style.cssText='padding:6px 10px;font-size:10px';
b.textContent=o[1]+(SAVE.set[o[0]]?' ✓':' ✗');b.style.borderColor=SAVE.set[o[0]]?'#48c774':'#555';
b.onclick=function(){SAVE.set[o[0]]=SAVE.set[o[0]]?0:1;SAVE.save();refreshOpts();};
row.appendChild(b);});
[['mmsize',['S','M','L'],'MAP SIZE'],['parts',['LOW','MED','HIGH'],'PARTICLES']].forEach(function(c){
var b=document.createElement('button');b.className='btn chamf';b.style.cssText='padding:6px 10px;font-size:10px';
b.textContent=c[2]+': '+c[1][SAVE.set[c[0]]||0];
b.onclick=function(){SAVE.set[c[0]]=((SAVE.set[c[0]]||0)+1)%c[1].length;SAVE.save();refreshOpts();};
row.appendChild(b);});
}
function buildSettingsExtra(){
var scr=document.getElementById('scr-settings');if(!scr||document.getElementById('qol2-box'))return;
var box=document.createElement('div');box.id='qol2-box';box.style.cssText='margin-top:16px;display:grid;gap:10px;max-width:560px';
box.innerHTML='<div class="panel" style="padding:14px"><b style="letter-spacing:2px">KEYBINDS</b><div id="kb-row" style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"></div><small style="color:var(--tx2)">Click a bind then press a new key · Esc cancels.</small></div><div class="panel" style="padding:14px"><b style="letter-spacing:2px">EXTRA OPTIONS</b><div id="opt-row" style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"></div></div>';
scr.appendChild(box);refreshBinds();refreshOpts();
}
buildSettingsExtra();
/* ---- hitstop / flash settings ---- */
var __upd=update;
update=function(dt){if(RUN){if(!SET().hitstop){RUN.hitstop=0;if(!RUN.boss)RUN.slowmo=0;}}return __upd(dt);};
/* ---- particle density ---- */
var __burst=burst;
burst=function(x,y,hue){var p=SET().parts;if(p===0){if(Math.random()<.5)return;}__burst(x,y,hue);if(p===2)__burst(x,y,hue);};
/* ---- enhanced enemy AI (bespoke behaviors) ---- */
var __ue=updEnemies;
updEnemies=function(dt){
__ue(dt);
if(!RUN)return;
RUN.enemies.forEach(function(e){
if(e.dead)return;
var tp=nearestPlayer(e.x,e.y);
switch(e.type){
case 'orbiter':e._oT=(e._oT||2.4)-dt;if(e._oT<=0){e._oT=2.4;var a=Math.atan2(tp.y-e.y,tp.x-e.x);ebul(e.x,e.y,a+.35,200,8);ebul(e.x,e.y,a-.35,200,8);}break;
case 'seeder':e._sT=(e._sT||6)-dt;if(e._sT<=0&&RUN.enemies.length<120){e._sT=6;spawnEnemy(Math.random()<.5?'shardling':'swarm',e.x+rnd(-20,20),e.y+rnd(-20,20));ringFx(e.x,e.y,e.hue,60);}break;
case 'crusher':if(e.touch>.5){e._cT=(e._cT||0)-dt;if(e._cT<=0){e._cT=.9;RUN.players.forEach(function(p){if(!p.downed&&d2(p.x,p.y,e.x,e.y)<80*80)hurtPlayer(p,e.dmg*.5);});RUN.shake=Math.max(RUN.shake,5);ringFx(e.x,e.y,15,90);}}break;
case 'spark':e.x+=Math.sin(RUN.t*14+e.seed)*46*dt;e.y+=Math.cos(RUN.t*12+e.seed)*46*dt;break;
case 'basalt':e._bT=(e._bT||.7)-dt;if(e._bT<=0){e._bT=.7;RUN.clouds.push({x:e.x,y:e.y,r:42,t:2});}break;
case 'reactor':e._rT=(e._rT||4)-dt;if(e._rT<=0){e._rT=4;RUN.players.forEach(function(p){if(!p.downed&&d2(p.x,p.y,e.x,e.y)<110*110)hurtPlayer(p,10);});ringFx(e.x,e.y,340,140);}break;
case 'pylon':e._pT=(e._pT||3.4)-dt;if(e._pT<=0){e._pT=3.4;for(var k=0;k<6;k++)ebul(e.x,e.y,k/6*TAU+RUN.t,220,9);}break;
case 'vampire':if(e.hp<e.maxhp*.5)e.spd=ETYPES.vampire.spd*1.3;break;
case 'gravitywell':e._gT=(e._gT||5)-dt;if(e._gT<=0){e._gT=5;RUN.pullT=1.4;RUN.pullSrc={x:e.x,y:e.y};ringFx(e.x,e.y,e.hue,160);}break;
case 'phaseweaver':if(e.specialT>3.4&&!e._pw){e._pw=1;var ox=e.x,oy=e.y;setTimeout(function(){if(RUN&&!e.dead){aoe(ox,oy,60,e.dmg*.6,265);ringFx(ox,oy,265,80);}},400);}if(e.specialT<2)e._pw=0;break;
case 'voltconductor':e._vT=(e._vT||4)-dt;if(e._vT<=0){e._vT=4;arcChain(e,ST.dmg*.5,3,55);}break;
case 'biomass':if(!e.su2&&e.hp<e.maxhp*.75){e.su2=true;spawnEnemy('swarm',e.x,e.y);spawnEnemy('swarm',e.x,e.y);ringFx(e.x,e.y,120,70);}break;
case 'juggler':e._jT=(e._jT||5)-dt;if(e._jT<=0){e._jT=5;var a0=Math.atan2(tp.y-e.y,tp.x-e.x);for(var j=-2;j<=2;j++)ebul(e.x,e.y,a0+j*.22,210,8);}break;
case 'mimicore':e._mT=(e._mT||4.5)-dt;if(e._mT<=0){e._mT=4.5;var a1=Math.atan2(tp.y-e.y,tp.x-e.x);for(var mm=-1;mm<=1;mm++)ebul(e.x,e.y,a1+mm*.25,275,e.dmg);}break;
}
});
};
/* ---- render: better map, effects, telegraphs, radar in HUD ---- */
var fpsE=0,fpsT=0,fpsV=0;
var __ren=render;
render=function(){
__ren();
if(!RUN)return;
var S=SET();
/* erase old overlapping radar */
cx.fillStyle='#0a0f16';cx.fillRect(W-130,8,124,124);
/* map decor: hex grid + vignette + corners + tier tint */
var tier=Math.floor(Math.max(1,RUN.wave)/5)%6;
cx.strokeStyle='hsla('+RUN.hue+',60%,60%,.05)';cx.lineWidth=1;cx.beginPath();
for(var hx=0;hx<W+48;hx+=48){for(var hy=0;hy<H+48;hy+=56){var off=(Math.floor(hy/56)%2)*24;cx.moveTo(hx+off+12,hy);cx.lineTo(hx+off+24,hy+14);cx.lineTo(hx+off+24,hy+42);cx.lineTo(hx+off+12,hy+56);cx.lineTo(hx+off,hy+42);cx.lineTo(hx+off,hy+14);cx.closePath();}}
cx.stroke();
var vg=cx.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);
vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.4)');cx.fillStyle=vg;cx.fillRect(0,0,W,H);
cx.strokeStyle='hsla('+RUN.hue+',80%,60%,.5)';cx.lineWidth=2;
[[8,8,1,1],[W-8,8,-1,1],[8,H-8,1,-1],[W-8,H-8,-1,-1]].forEach(function(c){cx.beginPath();cx.moveTo(c[0]+c[2]*18,c[1]);cx.lineTo(c[0],c[1]);cx.lineTo(c[0],c[1]+c[3]*18);cx.stroke();});
cx.fillStyle='hsla('+ (RUN.hue+tier*40)%360 +',70%,50%,.03)';cx.fillRect(0,0,W,H);
/* bullet trails + glow */
if(S.trails||S.glow){
cx.globalCompositeOperation='lighter';
RUN.bullets.forEach(function(b){
if(S.trails){cx.strokeStyle='hsla('+RUN.hue+',90%,65%,.35)';cx.lineWidth=b.r*.8;cx.beginPath();cx.moveTo(b.x-b.vx*.045,b.y-b.vy*.045);cx.lineTo(b.x,b.y);cx.stroke();}
if(S.glow){var g=cx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r*3);g.addColorStop(0,'hsla('+RUN.hue+',90%,70%,.3)');g.addColorStop(1,'transparent');cx.fillStyle=g;cx.beginPath();cx.arc(b.x,b.y,b.r*3,0,TAU);cx.fill();}
});
RUN.ebullets.forEach(function(b){if(S.glow){var g=cx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r*3);g.addColorStop(0,'rgba(255,140,80,.3)');g.addColorStop(1,'transparent');cx.fillStyle=g;cx.beginPath();cx.arc(b.x,b.y,b.r*3,0,TAU);cx.fill();}});
cx.globalCompositeOperation='source-over';
}
/* player dash ghosts */
RUN.players.forEach(function(p){
p._trail=p._trail||[];
p._trail.push({x:p.x,y:p.y,t:.3});
if(p._trail.length>14)p._trail.shift();
p._trail.forEach(function(q){q.t-=1/60;});
cx.globalCompositeOperation='lighter';
p._trail.forEach(function(q,i){if(q.t>0&&p.dashT>0){cx.fillStyle='hsla('+RUN.hue+',80%,60%,'+(q.t*.5)+')';cx.beginPath();cx.arc(q.x,q.y,10*q.t/.3,0,TAU);cx.fill();}});
cx.globalCompositeOperation='source-over';
});
/* enemy telegraphs + auras + hp bars */
RUN.enemies.forEach(function(e){
if(e.dead)return;
if(S.ehp&&!e.boss){cx.fillStyle='#0009';cx.fillRect(e.x-e.r,e.y-e.r-7,e.r*2,3);cx.fillStyle='hsl('+e.hue+' 80% 60%)';cx.fillRect(e.x-e.r,e.y-e.r-7,e.r*2*clamp(e.hp/e.maxhp,0,1),3);}
if(!S.auras&&!S.tele)return;
var tp=nearestPlayer(e.x,e.y);
cx.lineWidth=2;
switch(e.type){
case 'sniper':if(S.tele&&e.charge>0){cx.strokeStyle='rgba(255,60,60,'+(.3+.4*Math.abs(Math.sin(RUN.t*20)))+')';cx.beginPath();cx.moveTo(e.x,e.y);cx.lineTo(tp.x,tp.y);cx.stroke();}break;
case 'spitter':if(S.tele&&e.shootT<.5){cx.strokeStyle='hsla(280,90%,60%,.7)';cx.beginPath();cx.arc(e.x,e.y,e.r+5+Math.sin(RUN.t*25)*2,0,TAU);cx.stroke();}break;
case 'healer':if(S.auras){cx.strokeStyle='hsla(140,90%,60%,'+(.3+.2*Math.sin(RUN.t*6))+')';cx.beginPath();cx.arc(e.x,e.y,150,0,TAU);cx.stroke();}break;
case 'shielder':if(S.auras){cx.strokeStyle='rgba(150,255,255,.8)';cx.lineWidth=3;cx.beginPath();cx.arc(e.x,e.y,e.r+6,e.face-1.1,e.face+1.1);cx.stroke();}break;
case 'ghost':if(S.auras&&e.invuln){cx.fillStyle='rgba(10,15,22,.5)';cx.beginPath();cx.arc(e.x,e.y,e.r+2,0,TAU);cx.fill();}break;
case 'stalker':if(S.auras){var dd=Math.hypot(tp.x-e.x,tp.y-e.y);if(dd>120){cx.fillStyle='rgba(10,15,22,.45)';cx.beginPath();cx.arc(e.x,e.y,e.r+2,0,TAU);cx.fill();}}break;
case 'charger':if(S.tele&&e.charging>0){cx.strokeStyle='hsla(10,90%,60%,.8)';cx.beginPath();cx.arc(e.x,e.y,e.r+6+Math.sin(RUN.t*30)*3,0,TAU);cx.stroke();}break;
case 'bomber':if(S.tele&&e.hp<e.maxhp*.35){cx.fillStyle='rgba(255,120,40,'+(Math.abs(Math.sin(RUN.t*18))*.8)+')';cx.beginPath();cx.arc(e.x,e.y-e.r-6,3,0,TAU);cx.fill();}break;
case 'mirror':if(S.auras){cx.strokeStyle='hsla(190,90%,70%,'+(.4+.3*Math.sin(RUN.t*8))+')';cx.beginPath();cx.arc(e.x,e.y,e.r+5,0,TAU);cx.stroke();}break;
case 'vampire':if(S.auras){cx.fillStyle='hsla(340,90%,60%,.8)';cx.font='bold 9px monospace';cx.textAlign='center';cx.fillText('♥',e.x,e.y-e.r-8);}break;
case 'anchor':if(S.auras){cx.strokeStyle='hsla(230,80%,60%,.25)';cx.beginPath();cx.arc(e.x,e.y,190,0,TAU);cx.stroke();}break;
case 'reactor':if(S.auras){cx.strokeStyle='hsla(340,90%,60%,'+(.3+.3*Math.sin(RUN.t*10))+')';cx.beginPath();cx.arc(e.x,e.y,e.r+8,0,TAU);cx.stroke();}break;
case 'basalt':if(S.auras){cx.fillStyle='hsla(20,90%,55%,.5)';cx.beginPath();cx.arc(e.x,e.y+e.r*.5,e.r*.7,0,TAU);cx.fill();}break;
case 'phaseweaver':case 'voltconductor':case 'biomass':case 'gravitywell':case 'mimicore':
if(S.auras){cx.strokeStyle='hsla('+e.hue+',95%,70%,'+(.5+.3*Math.sin(RUN.t*7))+')';cx.lineWidth=2.5;cx.beginPath();for(var i2=0;i2<6;i2++){var a2=i2/6*TAU+RUN.t;cx.lineTo(e.x+Math.cos(a2)*(e.r+7),e.y+Math.sin(a2)*(e.r+7));}cx.closePath();cx.stroke();}break;
}
});
/* reduced flash */
if(S.redflash){var hf=document.getElementById('hitflash');if(hf&&parseFloat(hf.style.opacity)>0.4)hf.style.opacity=0.4;}
/* fps */
fpsT+=1/60;fpsE++;if(fpsT>=.5){fpsV=Math.round(fpsE/fpsT);fpsE=0;fpsT=0;}
if(S.fps){cx.fillStyle='#7ef0a6';cx.font='11px monospace';cx.textAlign='left';cx.fillText('FPS '+fpsV,12,H-12);}
/* radar attached inside the money panel */
if(S.minimap){
var hc=document.getElementById('h-coins');
var pr=hc&&hc.parentElement?hc.parentElement.getBoundingClientRect():null;
var size=[90,110,140][S.mmsize||1];
var rx=pr?(pr.right-size-4):(W-size-14);
var ry=pr?(pr.bottom+4):14;
cx.fillStyle='rgba(10,15,22,.85)';cx.fillRect(rx,ry,size,size);
cx.strokeStyle='hsla('+RUN.hue+',70%,55%,.6)';cx.lineWidth=1.5;cx.strokeRect(rx,ry,size,size);
if(pr){cx.strokeStyle='hsla('+RUN.hue+',70%,55%,.6)';cx.beginPath();cx.moveTo(rx+size*.5,ry);cx.lineTo(rx+size*.5,ry-4);cx.stroke();}
function dot(x,y,col,s2){cx.fillStyle=col;cx.fillRect(rx+(x/W)*size-(s2||1),ry+(y/H)*size-(s2||1),(s2||2)+1,(s2||2)+1);}
RUN.pickups.forEach(function(k){dot(k.x,k.y,'#ffd43b',1);});
RUN.enemies.forEach(function(e){if(!e.dead)dot(e.x,e.y,e.boss?'#ff4bd9':'#ff5d8f',e.boss?2:1);});
RUN.players.forEach(function(p){dot(p.x,p.y,'#4fd8eb',2);});
}
};
console.log('ISO_QOL2 active: keybinds, extra settings, juicier FX, better map, enemy flair, HUD radar.');
})();
'@
$c=$text.LastIndexOf('})();')
if($c -lt 0){throw 'no closing found in game.js'}
$text=$text.Substring(0,$c)+"`n"+$core+"`n"+$text.Substring($c)
[System.IO.File]::WriteAllText($gf,$text)
Write-Host 'DONE. Hard-refresh (Ctrl+F5).' -ForegroundColor Green