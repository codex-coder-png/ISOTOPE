$ErrorActionPreference='Stop'
$dir=(Get-Location).Path
function Backup($f){$b="$f.bak";if(-not(Test-Path $b)){Copy-Item $f $b;Write-Host "Backup: $b"}}
function Strip($text,$m){$i=$text.IndexOf($m);if($i -lt 0){return $text};$c=$text.LastIndexOf('})();');if($c -lt 0 -or $c -lt $i){return $text};return $text.Substring(0,$i)+$text.Substring($c)}
function Inject($file,$core,$m){Backup $file;$t=[System.IO.File]::ReadAllText($file);$t=Strip $t $m;$c=$t.LastIndexOf('})();');if($c -lt 0){throw "no closing in $file"};$t=$t.Substring(0,$c)+"`n"+$core+"`n"+$t.Substring($c);[System.IO.File]::WriteAllText($file,$t);Write-Host "Patched: $file"}

$gameCore=@'
/* ISO_STATFIX_V3 */
(function(){
if(window.__ISO_SF3__)return;window.__ISO_SF3__=true;
function h32(s){s=String(s||'');var h=2166136261>>>0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function nsFor(el){
var n=(el&&el.mol)?(h32(el.token||el.f||el.name)%118):(el?(+el.n||0):0);
var cat=(el&&!el.mol)?(el.cat||0):((el&&el.mol)?(h32(el.name)%11):0);
var o={
echo:Math.floor(((n*7)%13)/6),
momentum:Math.floor(((n*3)%11)/5),
tempo:Math.floor(((n*5)%9)/4),
flux:Math.floor(((n*11)%17)/8),
aegis:Math.floor(((n*13)%15)/7),
grit:Math.floor(((n*17)%13)/6),
shatter:Math.floor(((n*19)%11)/5),
combust:Math.floor(((n*23)%17)/8),
scavenge:Math.floor(((n*29)%13)/6),
void:Math.floor(((n*31)%19)/9)
};
var cb={0:'combust',1:'grit',2:'momentum',3:'shatter',4:'echo',5:'tempo',6:'flux',7:'aegis',8:'scavenge',9:'void',10:'echo'}[cat];
if(cb)o[cb]+=1;
return o;
}
window.ISO_NS=nsFor;
var NSKEYS=['echo','momentum','tempo','flux','aegis','grit','shatter','combust','scavenge','void'];
var __cs=computeStats;
computeStats=function(){
__cs();
if(!RUN||!ST)return;
var b=nsFor(RUN.el),ab=RUN.ab||{};
NSKEYS.forEach(function(k){ST[k]=(b[k]||0)+(ab[k]||0);});
};
SAVE.set=SAVE.set||{};
SAVE.set.binds=SAVE.set.binds||{dash:'Space',active:'KeyQ',autofire:'KeyF'};
function bindLbl(){var el=document.getElementById('autofire');if(el)el.innerHTML='<span>'+(SAVE.set.binds.autofire||'KeyF').replace('Key','')+' AUTOFIRE '+(autofire?'ON':'OFF')+'</span>';}
window.ISO_BINDLBL=bindLbl;
function doDash(){if(RUN.isOnline){NET.sendClientAction('dash');}else{tryDash(RUN.players[0]);if(RUN.players[1])tryDash(RUN.players[1]);}}
function doActive(){if(RUN.isOnline){NET.sendClientAction('active');}else{useActive(RUN.players[0]);if(RUN.players[1])useActive(RUN.players[1]);}}
addEventListener('keydown',function(e){
if(window.__rebinding)return;
if(!RUN||document.getElementById('scr-game').classList.contains('hidden'))return;
var B=SAVE.set.binds,code=e.code;
if(code==='Space'&&B.dash!=='Space'){e.preventDefault();e.stopPropagation();}
else if(code==='KeyQ'&&B.active!=='KeyQ'){e.stopPropagation();}
else if(code==='KeyF'&&B.autofire!=='KeyF'){e.stopPropagation();}
else if(code===B.dash&&B.dash!=='Space'){e.preventDefault();doDash();}
else if(code===B.active&&B.active!=='KeyQ'){doActive();}
else if(code===B.autofire&&B.autofire!=='KeyF'){autofire=!autofire;bindLbl();}
},true);
console.log('ISO_STATFIX_V3 active: unique per-element new stats + rebindable keys.');
})();
'@
Inject (Join-Path $dir 'game.js') $gameCore 'ISO_STATFIX_V3'

$uiCore=@'
/* ISO_UIFIX_V3 */
(function(){
if(window.__ISO_UF3__)return;window.__ISO_UF3__=true;
var NSL={echo:'ECHO',momentum:'MOMENTUM',tempo:'TEMPO',flux:'FLUX',aegis:'AEGIS',grit:'GRIT',shatter:'SHATTER',combust:'COMBUST',scavenge:'SCAVENGE',void:'VOID'};
function rows(el){
var ns=window.ISO_NS?window.ISO_NS(el):{};
var c=DATA.baseCombat(el);
var base=[['DMG',c.dmg.toFixed(1)],['FIRE RATE',c.rate.toFixed(2)+'/s'],['PROJ SPEED',Math.round(c.ps)],['MAX HP',Math.round(c.hp)],['CRIT',Math.round(c.crit)+'%'],['PIERCE',c.pierce],['KNOCKBACK',Math.round(c.kb)],['ARMOR',Math.round((c.armor||0)*100)+'%']];
var cat=el.mol?null:DATA.CATS[el.cat];
if(cat){base.push(['TOXIC',cat.tox]);base.push(['REACT',cat.react]);}
var html=base.map(function(r){return '<div style="display:flex;justify-content:space-between;gap:8px"><span>'+r[0]+'</span><b style="color:var(--cy)">'+r[1]+'</b></div>';}).join('');
Object.keys(NSL).forEach(function(k){
html+='<div style="display:flex;justify-content:space-between;gap:8px"><span>'+NSL[k]+'</span><b style="color:'+((ns[k]||0)>0?'#7ef0a6':'#ff5d8f')+'">'+(ns[k]||0)+'</b></div>';
});
return html;
}
var oldSV=selectVault;
selectVault=function(id){
oldSV(id);
try{
var el=DATA.EL(DATA.canonicalId(id));
var wrap=document.getElementById('vd-stats');
if(!wrap)return;
var parent=wrap.parentElement;
var btn=document.getElementById('vd-more3'),box=document.getElementById('vd-extra3');
if(!btn){
btn=document.createElement('button');btn.id='vd-more3';btn.className='btn chamf';
btn.style.cssText='width:100%;padding:6px 10px;font-size:10px;letter-spacing:2px;margin-top:8px';
box=document.createElement('div');box.id='vd-extra3';
box.style.cssText='display:none;margin-top:8px;max-height:230px;overflow:auto;border:1px solid #22303f;padding:8px;font-family:var(--mono);font-size:10px;color:var(--tx2)';
parent.appendChild(btn);parent.appendChild(box);
btn.onclick=function(){var open=box.style.display!=='none';box.style.display=open?'none':'block';btn.textContent=open?'FULL STATS +':'FULL STATS -';SFX.click();};
}
box.innerHTML=rows(el);
btn.textContent=box.style.display!=='none'?'FULL STATS -':'FULL STATS +';
var ob=document.getElementById('vd-more');if(ob)ob.style.display='none';
var ox=document.getElementById('vd-extra');if(ox)ox.style.display='none';
}catch(err){}
};
function buildExtra(){
var scr=document.getElementById('scr-settings');
if(!scr)return false;
if(document.getElementById('qol3-box'))return true;
var box=document.createElement('div');box.id='qol3-box';box.style.cssText='margin-top:14px;display:grid;gap:10px;max-width:560px';
box.innerHTML='<div class="panel" style="padding:14px"><b style="letter-spacing:2px">EXTRA OPTIONS</b><div id="q3o" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"></div></div><div class="panel" style="padding:14px"><b style="letter-spacing:2px">KEYBINDS</b><div id="q3k" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"></div><small style="color:var(--tx2)">Click a bind then press a key. Esc cancels.</small></div>';
scr.appendChild(box);
var orow=box.querySelector('#q3o');
[['minimap','MINIMAP',1],['fps','FPS COUNTER',0],['trails','BULLET TRAILS',1],['glow','GLOW FX',1],['tele','TELEGRAPHS',1],['redflash','SOFT FLASH',0]].forEach(function(o){
if(SAVE.set[o[0]]===undefined)SAVE.set[o[0]]=o[2];
var b=document.createElement('button');b.className='btn chamf';b.style.cssText='padding:6px 10px;font-size:10px';
function paint(){b.textContent=o[1]+(SAVE.set[o[0]]?' ON':' OFF');b.style.borderColor=SAVE.set[o[0]]?'#48c774':'#555';}
paint();
b.onclick=function(){SAVE.set[o[0]]=SAVE.set[o[0]]?0:1;SAVE.save();paint();SFX.click();};
orow.appendChild(b);
});
var krow=box.querySelector('#q3k');
function buildKeys(){
krow.innerHTML='';
['dash','active','autofire'].forEach(function(k){
var b=document.createElement('button');b.className='btn chamf';b.style.cssText='padding:6px 10px;font-size:10px';
b.textContent=k.toUpperCase()+': '+(SAVE.set.binds[k]||'').replace('Key','');
b.onclick=function(){window.__rebinding=k;b.textContent=k.toUpperCase()+': PRESS KEY';};
krow.appendChild(b);
});
}
buildKeys();
addEventListener('keydown',function(e){
if(!window.__rebinding)return;
e.preventDefault();e.stopPropagation();
if(e.code!=='Escape'){SAVE.set.binds[window.__rebinding]=e.code;SAVE.save();}
window.__rebinding=null;buildKeys();if(window.ISO_BINDLBL)window.ISO_BINDLBL();
},true);
return true;
}
var tries=0;var iv=setInterval(function(){tries++;if(buildExtra()||tries>40)clearInterval(iv);},250);
var oldShow=UI.show;
UI.show=function(id){var r=oldShow.apply(this,arguments);buildExtra();return r;};
console.log('ISO_UIFIX_V3 active: per-element stat sheet + working settings panel.');
})();
'@
Inject (Join-Path $dir 'ui.js') $uiCore 'ISO_UIFIX_V3'
Write-Host 'DONE. Hard-refresh (Ctrl+F5).' -ForegroundColor Green