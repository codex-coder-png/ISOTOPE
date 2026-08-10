const fs = require('fs');
const path = require('path');

const gameFile = path.join(__dirname, 'game.js');
let src = fs.readFileSync(gameFile, 'utf8');

// Backup
if (!fs.existsSync(gameFile + '.bak_trader')) {
    fs.copyFileSync(gameFile, gameFile + '.bak_trader');
    console.log('Backup created.');
}

// Strip old patch if exists
const marker = '/* ISO_TRADER_SHOP_V1 */';
const idx = src.indexOf(marker);
if (idx !== -1) {
    const end = src.indexOf('/* END_ISO_TRADER_SHOP_V1 */', idx);
    if (end !== -1) {
        src = src.slice(0, idx) + src.slice(end + '/* END_ISO_TRADER_SHOP_V1 */'.length);
    }
}

const patch = `
/* ISO_TRADER_SHOP_V1 */
(function(){
if(window.__ISO_TRADER_V1__) return;
window.__ISO_TRADER_V1__ = true;

// 1. LEVEL UP WARNING
var warnDiv = document.createElement('div');
warnDiv.id = 'lvl-warn';
warnDiv.style.cssText = 'position:fixed;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;z-index:60;pointer-events:none;background:radial-gradient(circle,rgba(79,216,235,.15),rgba(0,0,0,.6));';
warnDiv.innerHTML = '<div style="width:150px;height:150px;border:3px solid #4fd8eb;border-radius:50%;box-shadow:0 0 40px #4fd8eb88;animation:lwPulse 1.4s infinite"></div>' +
  '<div style="font-family:var(--disp);font-size:34px;color:#4fd8eb;letter-spacing:6px;margin-top:18px;text-shadow:0 0 18px #4fd8eb;">STABILIZATION SURGE</div>' +
  '<div style="font-family:var(--mono);color:var(--tx2);letter-spacing:3px;margin-top:6px;">MODULE SELECT INCOMING</div>' +
  '<div style="width:260px;height:6px;background:#12222e;margin-top:14px;overflow:hidden;"><div style="height:100%;width:100%;background:linear-gradient(90deg,#4fd8eb,#ff5d8f);animation:lwBar 1.5s linear forwards"></div></div>';
document.body.appendChild(warnDiv);

var style = document.createElement('style');
style.textContent = '@keyframes lwPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}@keyframes lwBar{from{width:100%}to{width:0}}@keyframes pentaSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}';
document.head.appendChild(style);

var __oldOpenLevel = openLevel;
openLevel = function() {
    if(!RUN) return __oldOpenLevel();
    if(RUN.isOnline && !NET.isHost) return;
    if(RUN.state === 'levelwarn') return;
    RUN.state = 'levelwarn';
    RUN._warnT = 1.5;
    warnDiv.style.display = 'flex';
    if(RUN.isOnline && NET.isHost && RUN.fxQueue) {
        RUN.fxQueue.push({k:'banner', text:'STABILIZATION SURGE'});
    }
};

// 2. THE GEOMETRIST (SHOP)
var shopDiv = document.createElement('div');
shopDiv.id = 'shop-ui';
shopDiv.style.cssText = 'position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:65;background:rgba(4,8,12,.75);';
document.body.appendChild(shopDiv);

var ITEMS = [
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
    {id:'it20',ic:'♦',n:'Merchant Protocol',b:'coinMult',d:'dmg',v:.15}
];
var ITEM_BY = {}; ITEMS.forEach(function(it){ ITEM_BY[it.id] = it; });
var STATN = {dmg:'DAMAGE',rate:'FIRE RATE',hp:'MAX HP',spd:'SPEED',shieldMax:'SHIELD',magnet:'PICKUP RANGE',coinMult:'COINS',ps:'PROJ SPEED',critD:'CRIT DAMAGE'};

function itemDesc(it) {
    var p = Math.round(it.v * 100);
    return {bd:'+'+p+'% '+STATN[it.b], dd:'-'+p+'% '+STATN[it.d]};
}

var __oldCS = computeStats;
computeStats = function() {
    __oldCS();
    if(!RUN || !RUN.items || !RUN.items.length) return;
    RUN.items.forEach(function(id) {
        var it = ITEM_BY[id];
        if(!it) return;
        if(ST[it.b]) ST[it.b] *= (1 + it.v);
        if(ST[it.d]) ST[it.d] *= (1 - it.v);
    });
    if(ST.hp) ST.hp = Math.max(40, Math.round(ST.hp));
    if(ST.shieldMax !== undefined) ST.shieldMax = Math.max(0, Math.round(ST.shieldMax));
    RUN.players.forEach(function(p){ p.hp = Math.min(p.hp, ST.hp); p.sh = Math.min(p.sh, ST.shieldMax); });
};

var __oldStart = start;
start = function() {
    var r = __oldStart.apply(this, arguments);
    if(RUN) { RUN.items = RUN.items || []; RUN.shop = null; }
    return r;
};

function shopPrice() { return 60 + (RUN.wave || 1) * 4; }

function pickStock() {
    var pool = ITEMS.filter(function(it){ return (RUN.items || []).indexOf(it.id) < 0; });
    for(var i = pool.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    return pool.slice(0, 3).map(function(it){ return it.id; });
}

function spawnShop() {
    var a = Math.random() * Math.PI * 2, dist = 120 + Math.random() * 120;
    RUN.shop = {
        active: true,
        x: Math.max(90, Math.min(W - 90, W / 2 + Math.cos(a) * dist)),
        y: Math.max(90, Math.min(H - 90, H / 2 + Math.sin(a) * dist)),
        r: 74, t: 16, stock: pickStock(), taken: {}, done: {}
    };
    RUN.interT = Math.max(RUN.interT, 16);
    banner('⬠ A TRADER ENTERS THE ARENA — APPROACH TO BROWSE', 2600);
}

function openShop() {
    var s = RUN.shop; if(!s || !s.active) return;
    s.active = false; s.done = {};
    RUN.state = 'shop';
    banner('⬠ THE GEOMETRIST AWAITS YOUR CHOICE', 1600);
    renderShopUI();
    if(RUN.isOnline && NET.isHost) broadcastGameState(true);
}

function closeShop() {
    RUN.shop = null; RUN.state = 'inter'; RUN.interT = 1.6;
    shopDiv.style.display = 'none';
    if(RUN.isOnline && NET.isHost) broadcastGameState(true);
}

function chooseShop(pid, key) {
    var s = RUN.shop; if(!RUN || RUN.state !== 'shop' || !s || s.done[pid]) return;
    if(key !== 'cont') {
        var it = ITEM_BY[key];
        if(it && !s.taken[key] && (RUN.items || []).indexOf(key) < 0 && RUN.coins >= shopPrice()) {
            RUN.coins -= shopPrice(); s.taken[key] = 1;
            RUN.items = RUN.items || []; RUN.items.push(key);
            computeStats(); buildChips();
            banner('RELIC BOUND: ' + it.n.toUpperCase(), 1600); SFX.unlock();
        } else return;
    } else SFX.click();
    s.done[pid] = key;
    renderShopUI();
    var pIds = RUN.isOnline ? RUN.players.map(function(p){return p.id;}) : [0];
    var all = pIds.every(function(id){ return !!s.done[id]; });
    if(all) closeShop();
    else if(RUN.isOnline && NET.isHost) broadcastGameState(true);
}

function renderShopUI() {
    var s = RUN.shop;
    if(!s || RUN.state !== 'shop') { shopDiv.style.display = 'none'; return; }
    var myId = RUN.isOnline ? RUN.localNetId : 0;
    var done = !!s.done[myId];
    var p = shopPrice();
    var html = '<div style="width:min(720px,92vw);background:linear-gradient(180deg,#0d1420,#0a0f16);border:1px solid #ffb45466;box-shadow:0 0 60px #ffb45422;padding:22px;clip-path:polygon(18px 0,100% 0,100% calc(100% - 18px),calc(100% - 18px) 100%,0 100%,0 18px);">';
    html += '<div style="font-family:var(--disp);font-size:24px;color:#ffb454;letter-spacing:4px;display:flex;align-items:center;gap:12px;"><span style="font-size:30px;color:#ffb454;text-shadow:0 0 14px #ffb454;animation:pentaSpin 4s linear infinite;display:inline-block;">⬠</span>THE GEOMETRIST<em style="font-size:10px;color:var(--tx2);letter-spacing:3px;font-style:normal;margin-left:auto;">RELIC TRADER · WARES LAST THIS RUN ONLY</em></div>';
    html += '<div style="font-family:var(--mono);color:#ffd43b;margin:6px 0 12px;">BANK ◈ ' + RUN.coins + ' · PRICE ◈ ' + p + '</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">';
    s.stock.forEach(function(id) {
        var it = ITEM_BY[id]; var dd = itemDesc(it); var taken = s.taken[id];
        html += '<button data-buy="' + id + '" style="background:#0f1826;border:1px solid ' + (taken ? '#33445a' : '#ffb454') + ';padding:14px 10px;cursor:pointer;text-align:center;color:var(--tx);opacity:' + (taken ? '.35' : '1') + ';">';
        html += '<div style="font-size:26px;">' + it.ic + '</div><b style="display:block;margin:6px 0 4px;color:#eaf4ff;">' + it.n + '</b>';
        html += '<p style="color:#7ef0a6;font-size:11px;margin:0;">' + dd.bd + '</p>';
        html += '<p style="color:#ff5d8f;font-size:11px;margin:2px 0 8px;">' + dd.dd + '</p>';
        html += '<span style="font-family:var(--mono);color:#ffd43b;font-size:12px;">' + (taken ? 'SOLD OUT' : '◈ ' + p) + '</span></button>';
    });
    html += '</div><button data-leave="1" style="margin-top:14px;width:100%;background:none;border:1px solid #4fd8eb55;color:#4fd8eb;padding:10px;font-family:var(--mono);letter-spacing:2px;cursor:pointer;">▸ CONTINUE THROUGH THE BREACH</button>';
    if(done) html += '<div style="margin-top:10px;text-align:center;color:var(--tx2);font-family:var(--mono);">CONTRACT SIGNED — AWAITING OTHER OPERATORS…</div>';
    html += '</div>';
    shopDiv.innerHTML = html;
    shopDiv.style.display = 'flex';

    var btns = shopDiv.querySelectorAll('[data-buy]');
    for(var i=0; i<btns.length; i++) {
        btns[i].onclick = function() {
            if(!done) {
                var key = this.getAttribute('data-buy');
                if(RUN.isOnline && !NET.isHost) {
                    NET.sendClientAction('shoppick:' + key);
                    s.done[myId] = 'wait';
                    renderShopUI();
                } else {
                    chooseShop(myId, key);
                }
            }
        };
    }
    var lv = shopDiv.querySelector('[data-leave]');
    if(lv) lv.onclick = function() {
        if(!done) {
            if(RUN.isOnline && !NET.isHost) {
                NET.sendClientAction('shoppick:cont');
                s.done[myId] = 'wait';
                renderShopUI();
            } else {
                chooseShop(myId, 'cont');
            }
        }
    };
}

var __oldUpdate = update;
update = function(dt) {
    if(RUN) {
        if(RUN.state === 'levelwarn') {
            RUN._warnT = (RUN._warnT || 1.5) - dt;
            if(RUN.isOnline && NET.isHost) broadcastGameState(false);
            hud();
            if(RUN._warnT <= 0) {
                warnDiv.style.display = 'none';
                __oldOpenLevel();
            }
            return;
        }
        if(RUN.state === 'shop') {
            if(RUN.isOnline && NET.isHost) broadcastGameState(false);
            if(!RUN.isOnline || NET.isHost) {
                if(shopDiv.style.display === 'none') renderShopUI();
            }
            hud();
            return;
        }
        var hostish = !RUN.isOnline || NET.isHost;
        if(hostish) {
            if(RUN._prevState === 'play' && RUN.state === 'inter' && (RUN.mode === 'solo' || RUN.mode === 'coop' || RUN.mode === 'net_coop')) {
                if(!RUN.shop && Math.random() < .3) spawnShop();
            }
            if(RUN.shop && RUN.shop.active && RUN.state === 'inter') {
                RUN.shop.t -= dt;
                if(RUN.shop.t <= 0) {
                    RUN.shop = null; RUN.interT = Math.min(RUN.interT, 1.2);
                    banner('⬠ THE TRADER DEPARTED', 1200);
                } else {
                    for(var i=0; i<RUN.players.length; i++) {
                        var p = RUN.players[i];
                        if(p && !p.downed && d2(p.x, p.y, RUN.shop.x, RUN.shop.y) < (RUN.shop.r + 14) * (RUN.shop.r + 14)) {
                            openShop(); break;
                        }
                    }
                }
            }
            if(RUN.state !== 'shop') shopDiv.style.display = 'none';
        } else {
            if(RUN.shop && RUN.shop.active && RUN.state === 'inter' && !RUN._shopReq) {
                var lp = RUN.players[RUN.localNetId];
                if(lp && !lp.downed && d2(lp.x, lp.y, RUN.shop.x, RUN.shop.y) < (RUN.shop.r + 14) * (RUN.shop.r + 14)) {
                    RUN._shopReq = true; NET.sendClientAction('shopenter');
                }
            }
            if(RUN.shop && !RUN.shop.active) RUN._shopReq = false;
            if(RUN.state === 'shop' && shopDiv.style.display === 'none') renderShopUI();
            if(RUN.state !== 'shop') shopDiv.style.display = 'none';
        }
        RUN._prevState = RUN.state;
    }
    return __oldUpdate(dt);
};

if(window.NET) {
    var __oca = NET.onClientAction;
    NET.onClientAction = function(pid, action) {
        if(RUN && NET.isHost) {
            if(action === 'shopenter') { if(RUN.shop && RUN.shop.active && RUN.state === 'inter') openShop(); return; }
            if(typeof action === 'string' && action.indexOf('shoppick:') === 0) { chooseShop(pid, action.slice(9)); return; }
        }
        if(__oca) return __oca(pid, action);
    };
    var __bs = NET.broadcastSnapshot;
    NET.broadcastSnapshot = function(s) { if(s && RUN) s.shop = RUN.shop || null; return __bs ? __bs(s) : s; };
    var __sn = NET.onStateSnapshot;
    NET.onStateSnapshot = function(s) {
        if(s && s.fx) {
            for(var i=0; i<s.fx.length; i++) {
                if(s.fx[i].k === 'levelwarn') {
                    warnDiv.style.display = 'flex';
                    setTimeout(function(){ warnDiv.style.display = 'none'; }, 1500);
                }
            }
        }
        if(__sn) __sn(s);
        if(RUN && s && s.shop !== undefined) {
            RUN.shop = s.shop;
            if(!s.shop) RUN._shopReq = false;
        }
    };
}

// Render Geometrist on canvas
var __oldRender = render;
render = function() {
    __oldRender();
    if(!RUN) return;
    if(RUN.shop && RUN.shop.active && RUN.state === 'inter') {
        var s = RUN.shop;
        cx.save();
        cx.translate(s.x, s.y);
        cx.rotate(Math.sin(RUN.t * 1.4) * .2);
        cx.fillStyle = '#0d1420'; cx.strokeStyle = '#ffb454'; cx.lineWidth = 3;
        cx.beginPath();
        for(var i=0; i<5; i++) {
            var a = -Math.PI / 2 + i / 5 * Math.PI * 2;
            cx.lineTo(Math.cos(a) * 26, Math.sin(a) * 26);
        }
        cx.closePath(); cx.fill(); cx.stroke();
        cx.strokeStyle = 'rgba(255,180,84,.35)'; cx.lineWidth = 2;
        cx.beginPath();
        for(var i2=0; i2<5; i2++) {
            var a2 = -Math.PI / 2 + i2 / 5 * Math.PI * 2 + RUN.t * .6;
            cx.lineTo(Math.cos(a2) * 38, Math.sin(a2) * 38);
        }
        cx.closePath(); cx.stroke();
        cx.fillStyle = '#ffd43b'; cx.font = 'bold 16px "Share Tech Mono"'; cx.textAlign = 'center';
        cx.fillText('⬠', 0, 5);
        cx.fillStyle = '#ffb454'; cx.font = 'bold 10px "Share Tech Mono"';
        cx.fillText('TRADE', 0, -44);
        cx.strokeStyle = 'rgba(255,180,84,.3)'; cx.setLineDash([6, 6]);
        cx.beginPath(); cx.arc(0, 0, s.r, 0, Math.PI * 2); cx.stroke();
        cx.setLineDash([]);
        cx.restore();
    }
};
})();
/* END_ISO_TRADER_SHOP_V1 */
`;

const lastIIFE = src.lastIndexOf('})();');
if (lastIIFE === -1) {
    console.error('Could not find closing IIFE in game.js');
    process.exit(1);
}

src = src.slice(0, lastIIFE) + '\n' + patch + '\n' + src.slice(lastIIFE);
fs.writeFileSync(gameFile, src);
console.log('SUCCESS: game.js patched with Level Warning and Geometrist Shop.');
console.log('Hard-refresh your browser (Ctrl+F5).');