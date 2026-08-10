'use strict';

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'data.js');
const NET_FILE = path.join(process.cwd(), 'net.js');
const GAME_FILE = path.join(process.cwd(), 'game.js');
const UI_FILE = path.join(process.cwd(), 'ui.js');

function backup(file) {
  const bak = file + '.bak';
  if (!fs.existsSync(bak)) {
    fs.copyFileSync(file, bak);
    console.log('Backup created:', bak);
  }
}

function stripFromMarker(src, marker) {
  const idx = src.indexOf(marker);
  if (idx === -1) return src;

  const close = src.lastIndexOf('})();');
  if (close === -1 || close < idx) return src;

  return src.slice(0, idx) + src.slice(close);
}

function insertBeforeClosing(file, core, marker, oldMarkers) {
  backup(file);

  let src = fs.readFileSync(file, 'utf8');
  const markers = (oldMarkers || []).concat(marker);

  markers.forEach(function (m) {
    src = stripFromMarker(src, m);
  });

  const idx = src.lastIndexOf('})();');
  if (idx === -1) {
    throw new Error('Could not find closing IIFE in ' + file);
  }

  src = src.slice(0, idx) + '\n' + core + '\n' + src.slice(idx);
  fs.writeFileSync(file, src);
  console.log('Patched:', file);
}

function patchNet(file) {
  backup(file);

  let src = fs.readFileSync(file, 'utf8');
  const before = src;

  src = src.replace(/Math\.\s*min\(\s*1\s*,/g, 'Math.min(2,');
  src = src.replace(/Math\.\s*min\(\s*1\s*\)/g, 'Math.min(2)');

  if (src !== before) {
    fs.writeFileSync(file, src);
    console.log('Patched:', file);
  } else {
    console.log('No net signature clamp changes needed:', file);
  }
}

function patchGame(file, core, marker, oldMarkers) {
  backup(file);

  let src = fs.readFileSync(file, 'utf8');

  src = src.replace(/Math\.\s*min\(\s*1\s*,/g, 'Math.min(2,');
  src = src.replace(/Math\.\s*min\(\s*1\s*\)/g, 'Math.min(2)');

  const markers = (oldMarkers || []).concat(marker);

  markers.forEach(function (m) {
    src = stripFromMarker(src, m);
  });

  const idx = src.lastIndexOf('})();');
  if (idx === -1) {
    throw new Error('Could not find closing IIFE in ' + file);
  }

  src = src.slice(0, idx) + '\n' + core + '\n' + src.slice(idx);
  fs.writeFileSync(file, src);
  console.log('Patched:', file);
}

const DATA_PATCH = `
/* __ISO_ABILITY_3CHOICE_DATA__ */
(function () {
  if (window.__ISO_ABILITY_3CHOICE_DATA__) return;
  window.__ISO_ABILITY_3CHOICE_DATA__ = true;

  const CLEAN = {};

  Object.keys(CUSTOM_ABILITIES).forEach(function (k) {
    const kk = String(k).trim();
    const src = CUSTOM_ABILITIES[k] || {};
    const out = {};

    Object.keys(src).forEach(function (f) {
      out[String(f).trim()] = String(src[f]).trim();
    });

    CLEAN[kk] = out;
  });

  function fallbackSig(el, slot) {
    return {
      id: 'fallback_' + (el.id || el.token || el.f || el.name || 'x') + '_' + slot,
      key: slot === 1 ? 'pulse' : 'nova',
      slot: slot,
      ic: slot === 1 ? '✦' : '✧',
      name: (el.sym || el.token || 'Core') + ' Signature ' + (slot + 1),
      desc: 'A unique reactive signature technique.',
      power: 1
    };
  }

  Object.values(ELEMS).forEach(function (e) {
    const c = CLEAN[String(e.n)];
    const sigs = e.signatures && e.signatures.length ? e.signatures : makeSignatureChoices(e);

    const main = {
      id: 'main_' + e.n,
      key: 'main_' + e.n,
      slot: 0,
      ic: '⚛',
      name: c ? c.name : (e.sym + ' Core Reaction'),
      desc: c ? c.desc : 'Elemental core reaction.',
      power: 1.06,
      main: true
    };

    const s1 = Object.assign({}, sigs[0] || fallbackSig(e, 1), { slot: 1, main: false });
    const s2 = Object.assign({}, sigs[1] || fallbackSig(e, 2), { slot: 2, main: false });

    e.act = main;
    e.choices = [main, s1, s2];
    e.signatures = e.choices;
  });

  Object.values(MOLDEF).forEach(function (m) {
    if (!m.mol) return;

    const sigs = m.signatures && m.signatures.length ? m.signatures : makeSignatureChoices(m);
    const base = m.act || signatureFor(m);

    const main = Object.assign({}, base, {
      id: 'main_' + (m.token || m.f || m.name),
      slot: 0,
      main: true,
      power: 1.06
    });

    const s1 = Object.assign({}, sigs[0] || fallbackSig(m, 1), { slot: 1, main: false });
    const s2 = Object.assign({}, sigs[1] || fallbackSig(m, 2), { slot: 2, main: false });

    m.act = main;
    m.choices = [main, s1, s2];
    m.signatures = m.choices;
  });

  if (window.DATA) {
    DATA.CUSTOM_ABILITIES_CLEAN = CLEAN;
  }
})();
`;

const UI_PATCH = `
/* __ISO_ABILITY_3CHOICE_UI__ */
(function () {
  if (window.__ISO_ABILITY_3CHOICE_UI__) return;
  window.__ISO_ABILITY_3CHOICE_UI__ = true;

  var SIG_STORE_KEY = '__iso_signature_slot_3choice__';

  function loadSigStore() {
    try {
      return JSON.parse(localStorage.getItem(SIG_STORE_KEY) || '{}');
    } catch (err) {
      return {};
    }
  }

  function saveSigStore(obj) {
    try {
      localStorage.setItem(SIG_STORE_KEY, JSON.stringify(obj));
    } catch (err) {}
  }

  if (window.SAVE) {
    var origSet = SAVE.setSignature;

    SAVE.getSignature = function (id) {
      try {
        id = DATA.canonicalId(id);
      } catch (err) {}

      var store = loadSigStore();
      if (store[id] != null) {
        return Math.max(0, Math.min(2, Number(store[id]) || 0));
      }

      return 0;
    };

    SAVE.setSignature = function (id, slot) {
      try {
        id = DATA.canonicalId(id);
      } catch (err) {}

      slot = Math.max(0, Math.min(2, Number(slot) || 0));

      var store = loadSigStore();
      store[id] = slot;
      saveSigStore(store);

      if (origSet) {
        try { origSet.call(SAVE, id, slot); } catch (err) {}
        try { origSet.call(SAVE, id, Math.min(1, slot)); } catch (err) {}
      }

      if (SAVE.save) SAVE.save();
    };
  }

  function patchAbilityPanel(id) {
    try {
      id = DATA.canonicalId(id);
    } catch (err) {}

    var el = EL(id);
    var own = DATA.isOwned(id);
    var box = $('#vd-active');
    if (!box) return;

    var col = 'hsl(' + el.hue + ' 72% 62%)';

    if (!own) {
      box.innerHTML = '<b style="color:' + col + '">ABILITY OPTIONS — ???</b><br>Three selectable abilities are hidden until this ' + (el.mol ? 'compound' : 'element') + ' is unlocked.';
      return;
    }

    var choices = (el.choices && el.choices.length ? el.choices : (el.signatures || [])).slice(0, 3);
    var sel = SAVE.getSignature ? SAVE.getSignature(id) : 0;

    var html = '';
    html += '<div class="sig-choice-title" style="color:' + col + '">SELECTABLE ABILITIES — CHOOSE 1 OF 3</div>';
    html += '<div class="sig-choice-grid">';

    choices.forEach(function (c, i) {
      html += '<button class="sig-choice ' + (i === sel ? 'selected' : '') + '" data-sig="' + i + '">';
      html += '<strong>' + (c.ic || '✦') + ' ' + (c.name || ('Ability ' + (i + 1))) + '</strong>';
      html += '<span>' + (c.desc || 'Unique ability.') + '</span>';
      if (i === sel) html += '<em>SELECTED</em>';
      html += '</button>';
    });

    html += '</div>';
    box.innerHTML = html;

    box.querySelectorAll('.sig-choice').forEach(function (btn) {
      btn.onclick = function () {
        var slot = Number(btn.dataset.sig);

        if (SAVE.setSignature) SAVE.setSignature(id, slot);
        if (window.NET && NET.setMySignature) NET.setMySignature(slot);

        SFX.unlock();
        selectVault(id);
        toast('ABILITY ' + (slot + 1) + ' EQUIPPED', 'good');
      };
    });
  }

  var oldSelectVault = selectVault;
  selectVault = function (id) {
    oldSelectVault(id);
    patchAbilityPanel(id);
  };

  try {
    if (typeof renderVault === 'function') renderVault();
  } catch (err) {}

  try {
    if (vdTarget) selectVault(vdTarget);
    else if (SAVE.sel) selectVault(SAVE.sel);
  } catch (err) {}
})();
`;

const GAME_PATCH = `
/* __ISO_ABILITY_3CHOICE_GAME__ */
(function () {
  if (window.__ISO_ABILITY_3CHOICE_GAME__) return;
  window.__ISO_ABILITY_3CHOICE_GAME__ = true;

  const oldUseActive = useActive;
  const oldTryDash = tryDash;
  const oldUpdPlayer = updPlayer;

  function clampNum(v, a, b) {
    return Math.max(a, Math.min(b, Number(v) || 0));
  }

  function getElem(p) {
    return (p && p.elem) || RUN.el;
  }

  function getSlot(p) {
    return clampNum(p ? p.signatureSlot : 0, 0, 2);
  }

  function elemNum(p) {
    const el = getElem(p);
    return el && !el.mol ? +el.n : 0;
  }

  function getChoice(p) {
    const el = getElem(p);
    const slot = getSlot(p);
    return (el.choices && el.choices[slot]) || (el.signatures && el.signatures[slot]) || el.act || { name: 'ABILITY', key: 'pulse' };
  }

  function hashStr(s) {
    s = String(s || '');
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
  }

  function fxRing(x, y, hue, grow, r0, life) {
    if (!RUN) return;
    RUN.parts.push({ ring: true, x: x, y: y, r0: r0 || 6, grow: grow || 90, t: life || .5, life: life || .5, hue: hue });
  }

  function fxBurst(x, y, hue, n) {
    if (!RUN) return;
    n = n || 10;
    for (let i = 0; i < n; i++) {
      RUN.parts.push({
        x: x,
        y: y,
        vx: rnd(-180, 180),
        vy: rnd(-180, 180),
        t: rnd(.18, .44),
        life: .5,
        hue: hue,
        r: rnd(1.5, 3.8)
      });
    }
  }

  function fxTele(x, y, r, delayT, hue) {
    if (!RUN) return;
    RUN.parts.push({ ring: true, x: x, y: y, r0: r * .22, grow: r * .55, t: delayT, life: delayT, hue: hue });
    RUN.parts.push({ ring: true, x: x, y: y, r0: r * .68, grow: r * .22, t: delayT, life: delayT, hue: hue });
  }

  function fxBeam(x, y, a, len, hue) {
    if (!RUN) return;
    const steps = Math.max(4, Math.floor(len / 18));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      RUN.parts.push({
        x: x + Math.cos(a) * len * t,
        y: y + Math.sin(a) * len * t,
        vx: rnd(-25, 25),
        vy: rnd(-25, 25),
        t: .22,
        life: .22,
        hue: hue,
        r: rnd(1.4, 3.2)
      });
    }
  }

  function delayFx(fn, ms) {
    setTimeout(function () {
      if (RUN) fn();
    }, ms);
  }

  function enemiesNear(x, y, r) {
    if (!RUN) return [];
    return RUN.enemies.filter(function (e) {
      return !e.dead && d2(e.x, e.y, x, y) < r * r;
    });
  }

  function applyStatus(e, st, d) {
    if (!e || e.dead || !st) return;

    if (st === 'burn') addBurn(e, d * .35, 4);
    else if (st === 'poison') addPoison(e, d * .4, 4);
    else if (st === 'corrode') addCorrode(e, 4, .35);
    else if (st === 'slow') e.slowT = Math.max(e.slowT, 2);
    else if (st === 'freeze') addFreeze(e, .8);
    else if (st === 'mark') e.mark = Math.max(e.mark, 5);
    else if (st === 'stun') e.stun = Math.max(e.stun, .9);
    else if (st === 'conf') e.conf = Math.max(e.conf, 1.5);
  }

  function hitCircle(x, y, r, dmg, hue, st) {
    if (!RUN) return;
    aoe(x, y, r, dmg, hue);
    enemiesNear(x, y, r).forEach(function (e) {
      applyStatus(e, st, dmg);
    });
    fxRing(x, y, hue, r * .9, 10, .42);
    fxBurst(x, y, hue, 12);
  }

  function hitLine(x, y, a, len, width, dmg, hue, st) {
    if (!RUN) return;

    const ca = Math.cos(a), sa = Math.sin(a);

    RUN.enemies.forEach(function (e) {
      if (e.dead) return;

      const px = e.x - x, py = e.y - y;
      const t = clamp(px * ca + py * sa, 0, len);
      const cx = x + ca * t, cy = y + sa * t;

      if (d2(e.x, e.y, cx, cy) < (width + e.r) * (width + e.r)) {
        dmgEnemy(e, dmg);
        applyStatus(e, st, dmg);
        if (!e.boss) {
          e.x += ca * 18;
          e.y += sa * 18;
        }
      }
    });

    fxBeam(x, y, a, len, hue);
    fxRing(x + ca * len * .5, y + sa * len * .5, hue, width * 1.8, 6, .28);
    RUN.shake = Math.max(RUN.shake, 5);
  }

  function hitCone(p, range, width, dmg, hue, st) {
    if (!RUN || !p) return;

    const a0 = p.angle;

    RUN.enemies.forEach(function (e) {
      if (e.dead) return;

      const dx = e.x - p.x, dy = e.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > range + e.r) return;

      let da = Math.atan2(dy, dx) - a0;
      while (da > Math.PI) da -= TAU;
      while (da < -Math.PI) da += TAU;

      if (Math.abs(da) < width) {
        dmgEnemy(e, dmg);
        applyStatus(e, st, dmg);
        if (!e.boss) {
          e.x += Math.cos(a0) * 24;
          e.y += Math.sin(a0) * 24;
        }
      }
    });

    for (let i = 0; i < 14; i++) {
      const aa = a0 + rnd(-width, width);
      const rr = rnd(range * .25, range);
      RUN.parts.push({
        x: p.x + Math.cos(aa) * rr,
        y: p.y + Math.sin(aa) * rr,
        vx: Math.cos(aa) * rnd(60, 220),
        vy: Math.sin(aa) * rnd(60, 220),
        t: .28,
        life: .32,
        hue: hue,
        r: rnd(1.5, 3.4)
      });
    }

    fxRing(p.x + Math.cos(a0) * range * .4, p.y + Math.sin(a0) * range * .4, hue, range * .35, 8, .3);
  }

  function hitRing(x, y, radius, thickness, dmg, hue, st) {
    if (!RUN) return;

    RUN.enemies.forEach(function (e) {
      if (e.dead) return;
      const dist = Math.hypot(e.x - x, e.y - y);
      if (Math.abs(dist - radius) < thickness + e.r) {
        dmgEnemy(e, dmg);
        applyStatus(e, st, dmg);
        if (!e.boss) {
          const a = Math.atan2(e.y - y, e.x - x);
          e.x += Math.cos(a) * 22;
          e.y += Math.sin(a) * 22;
        }
      }
    });

    fxRing(x, y, hue, radius * .55, radius * .72, .45);
    fxRing(x, y, hue, thickness * 2.2, radius * .35, .35);
  }

  function hitRect(x, y, w, h, dmg, hue, st) {
    if (!RUN) return;

    RUN.enemies.forEach(function (e) {
      if (e.dead) return;
      if (Math.abs(e.x - x) < w * .5 + e.r && Math.abs(e.y - y) < h * .5 + e.r) {
        dmgEnemy(e, dmg);
        applyStatus(e, st, dmg);
      }
    });

    for (let i = 0; i < 16; i++) {
      RUN.parts.push({
        x: x + rnd(-w * .5, w * .5),
        y: y + rnd(-h * .5, h * .5),
        vx: rnd(-70, 70),
        vy: rnd(-70, 70),
        t: .25,
        life: .3,
        hue: hue,
        r: rnd(1.2, 3)
      });
    }

    fxRing(x, y, hue, Math.max(w, h) * .35, 10, .35);
  }

  function bullet(p, o) {
    if (!RUN || !p) return null;
    o = o || {};

    const a = typeof o.a === 'number' ? o.a : p.angle;
    const sp = typeof o.sp === 'number' ? o.sp : ST.ps;

    const b = {
      x: p.x,
      y: p.y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      dmg: typeof o.d === 'number' ? o.d : ST.dmg,
      r: typeof o.r === 'number' ? o.r : 5,
      pierce: o.pierce || 0,
      hit: [],
      life: typeof o.life === 'number' ? o.life : 1.25,
      owner: p.id
    };

    if (o.hom) b.hom = true;
    if (o.expl) b.expl = true;
    if (o.burn) b.burn = true;
    if (o.poison) b.poison = true;
    if (o.corrode) b.corrode = true;
    if (o.mark) b.mark = true;
    if (o.pull) b.pull = true;
    if (o.acc) b.acc = o.acc;
    if (o.kb) b.kb = o.kb;
    if (o.fsplit) b.fsplit = true;
    if (o.collapse) b.collapse = true;
    if (o.ric) b.ric = o.ric;
    if (o.crit) b.crit = true;
    if (o.chainOnHit) b.chainOnHit = true;
    if (o.lag) b.lag = true;

    RUN.bullets.push(b);
    return b;
  }

  function fan(p, n, spread, o) {
    if (!RUN || !p) return;
    o = o || {};
    n = Math.max(1, n | 0);

    for (let i = 0; i < n; i++) {
      const off = n > 1 ? (i / (n - 1) - .5) * spread : 0;
      bullet(p, Object.assign({}, o, { a: p.angle + off }));
    }
  }

  function ringShot(p, n, o) {
    if (!RUN || !p) return;
    o = o || {};
    n = Math.max(1, n | 0);

    for (let i = 0; i < n; i++) {
      bullet(p, Object.assign({}, o, { a: (i / n) * TAU }));
    }
  }

  function zone(x, y, r, t) {
    if (!RUN) return;
    RUN.clouds.push({ x: x, y: y, r: r, t: t });
  }

  function well(x, y, t, lv) {
    if (!RUN) return;
    RUN.wells.push({ x: x, y: y, t: t, lv: lv || 1 });
  }

  function blast(x, y, r, d, h) {
    if (!RUN) return;
    aoe(x, y, r, d, h == null ? RUN.hue : h);
  }

  function shieldGain(p, amt, ifr) {
    if (!RUN || !p) return;
    p.sh = Math.min(ST.shieldMax + amt, p.sh + amt);
    if (ifr) p.iframes = Math.max(p.iframes, ifr);
    fxRing(p.x, p.y, 190, 95, 14, .5);
  }

  function healGain(p, amt) {
    if (!RUN || !p) return;
    p.hp = Math.min(ST.hp, p.hp + amt);
  }

  function dashMove(p, dist, ifr) {
    if (!RUN || !p) return;
    const ox = p.x, oy = p.y;
    p.x = clamp(p.x + Math.cos(p.angle) * dist, 20, W - 20);
    p.y = clamp(p.y + Math.sin(p.angle) * dist, 20, H - 20);
    p.iframes = Math.max(p.iframes, ifr || .5);
    fxRing(ox, oy, RUN.hue, 80, 8, .35);
    fxRing(p.x, p.y, RUN.hue, 110, 10, .42);
  }

  function convertShots(p, r) {
    if (!RUN || !p || !RUN.ebullets) return;
    const keep = [];

    for (let i = 0; i < RUN.ebullets.length; i++) {
      const b = RUN.ebullets[i];
      if (d2(b.x, b.y, p.x, p.y) < r * r) {
        bullet(p, {
          a: Math.atan2(b.vy, b.vx),
          sp: Math.hypot(b.vx, b.vy) || 320,
          d: ST.dmg * 1.1,
          r: 5,
          pierce: 2,
          life: 1.4,
          burn: true
        });
      } else {
        keep.push(b);
      }
    }

    RUN.ebullets = keep;
  }

  function variant(c, p) {
    const seed = hashStr((c && (c.id || c.name || c.key)) || 'ability');
    const n = elemNum(p) || (seed % 118) + 1;
    const hue = ((RUN ? RUN.hue : 180) + (seed % 90) - 45 + 720) % 360;
    const dmg = ST.dmg * ((c && c.power) || 1) * (1 + (seed % 7) * .045);
    const count = 6 + (seed % 9) + (n % 5);
    const radius = 95 + (seed % 130) + (n % 30);
    const dur = 2.2 + (seed % 28) / 10;
    const statuses = ['burn', 'poison', 'corrode', 'slow', 'freeze', 'mark', 'stun', 'conf'];
    const status = statuses[seed % statuses.length];
    const shapes = ['circle', 'line', 'cone', 'ring', 'rect'];
    const shape = shapes[seed % shapes.length];

    return { seed: seed, hue: hue, dmg: dmg, count: count, radius: radius, dur: dur, status: status, shape: shape };
  }

  function shapeHit(p, v) {
    if (!RUN || !p) return;

    if (v.shape === 'circle') hitCircle(p.x, p.y, v.radius * .85, v.dmg * .7, v.hue, v.status);
    else if (v.shape === 'line') hitLine(p.x, p.y, p.angle, v.radius * 1.65, 22, v.dmg * .8, v.hue, v.status);
    else if (v.shape === 'cone') hitCone(p, v.radius * 1.25, 1.05, v.dmg * .72, v.hue, v.status);
    else if (v.shape === 'ring') hitRing(p.x, p.y, v.radius, 32, v.dmg * .75, v.hue, v.status);
    else hitRect(p.x, p.y, v.radius * 1.55, v.radius * .85, v.dmg * .72, v.hue, v.status);
  }

  const MAIN_ACTIVE = {};

  MAIN_ACTIVE[1] = function (p) {
    bullet(p, { d: ST.dmg * 2.5, sp: ST.ps * 1.25, acc: 980, r: 9, pierce: 6, expl: true, life: 1.8 });
    fan(p, 3, .25, { d: ST.dmg * .72, acc: 560, r: 3, pierce: 1, life: 1.2 });
    hitLine(p.x, p.y, p.angle, 240, 18, ST.dmg * .5, 190, 'burn');
  };

  MAIN_ACTIVE[2] = function (p) {
    enemiesNear(p.x, p.y, 340).forEach(function (e) {
      if (!e.boss) {
        e.y = Math.max(20, e.y - 125);
        e.slowT = Math.max(e.slowT, 2.2);
      }
    });
    well(p.x, p.y - 120, 2.4, 2);
    shieldGain(p, 12, .6);
    hitRing(p.x, p.y, 180, 35, ST.dmg * .7, 200, 'slow');
  };

  MAIN_ACTIVE[3] = function (p) {
    dashMove(p, 225, .72);
    for (let i = 1; i <= 5; i++) {
      const x = p.x - Math.cos(p.angle) * i * 38;
      const y = p.y - Math.sin(p.angle) * i * 38;
      delayFx(function () { hitCircle(x, y, 88, ST.dmg * .95, 25, 'burn'); }, i * 80);
    }
  };

  MAIN_ACTIVE[4] = function (p) {
    bullet(p, { d: ST.dmg * 1.9, sp: ST.ps * 2.1, r: 3, pierce: 9, life: 1.5 });
    fan(p, 6, .35, { d: ST.dmg * .52, sp: ST.ps * 1.75, r: 2, pierce: 3 });
    p.adrenT = Math.max(p.adrenT, 2.2);
    hitCone(p, 240, .45, ST.dmg * .5, 210, 'corrode');
  };

  MAIN_ACTIVE[5] = function (p) {
    for (let i = 0; i < 7; i++) {
      const a = p.angle + (i - 3) * .17;
      bullet(p, { a: a, sp: ST.ps * .52, d: ST.dmg * .92, r: 7, pierce: 0, life: 2.4, fsplit: true });
    }
    delayFx(function () {
      ringShot(p, 14, { d: ST.dmg * .52, r: 4, pierce: 2, sp: ST.ps * .95 });
      hitRing(p.x, p.y, 140, 28, ST.dmg * .55, 300, 'slow');
    }, 450);
  };

  MAIN_ACTIVE[6] = function (p) {
    p._form = ((p._form || 0) + 1) % 3;

    if (p._form === 0) {
      shieldGain(p, 30, 1.25);
      hitRing(p.x, p.y, 130, 28, ST.dmg * .6, 220, 'mark');
    } else if (p._form === 1) {
      ringShot(p, 10, { d: ST.dmg * .85, pierce: 3, hom: true, chainOnHit: true });
    } else {
      p.iframes = Math.max(p.iframes, 1.45);
      enemiesNear(p.x, p.y, 225).forEach(function (e) {
        e.slowT = Math.max(e.slowT, 2);
        e.conf = Math.max(e.conf, 1.2);
      });
    }
  };

  MAIN_ACTIVE[7] = function (p) {
    zone(p.x, p.y, 175, 5);
    hitCircle(p.x, p.y, 220, ST.dmg * .75, 205, 'slow');
    enemiesNear(p.x, p.y, 260).forEach(function (e) {
      e.slowT = Math.max(e.slowT, 3);
      if (Math.random() < .35) addFreeze(e, .8);
    });
  };

  MAIN_ACTIVE[8] = function (p) {
    enemiesNear(p.x, p.y, 320).forEach(function (e) {
      e.mark = Math.max(e.mark, 6);
      addBurn(e, ST.dmg * .55, 5);
    });
    zone(p.x, p.y, 155, 4);
    hitCircle(p.x, p.y, 160, ST.dmg * .7, 25, 'burn');
  };

  MAIN_ACTIVE[9] = function (p) {
    fan(p, 8, .5, { d: ST.dmg * .88, pierce: 4, corrode: true });
    enemiesNear(p.x, p.y, 240).forEach(function (e) {
      addCorrode(e, 6, .45);
    });
    hitCone(p, 220, .65, ST.dmg * .6, 95, 'corrode');
  };

  MAIN_ACTIVE[10] = function (p) {
    ringShot(p, 16, { sp: ST.ps * .42, d: ST.dmg * .62, pierce: 6, life: 2.2, r: 4 });
    hitRing(p.x, p.y, 160, 26, ST.dmg * .6, 315, 'mark');
    delayFx(function () {
      ringShot(p, 16, { sp: ST.ps * 1.35, d: ST.dmg * .72, pierce: 4, life: .9 });
    }, 350);
  };

  MAIN_ACTIVE[11] = function (p) {
    fan(p, 6, .7, { d: ST.dmg * .92, expl: true, r: 6 });
    zone(p.x, p.y, 150, 4);
    enemiesNear(p.x, p.y, 230).forEach(function (e) {
      e.slowT = Math.max(e.slowT, 2);
    });
    hitCircle(p.x + Math.cos(p.angle) * 110, p.y + Math.sin(p.angle) * 110, 110, ST.dmg * .8, 205, 'slow');
  };

  MAIN_ACTIVE[12] = function (p) {
    enemiesNear(p.x, p.y, 360).forEach(function (e) {
      e.stun = Math.max(e.stun, 1.3);
      e.flash = .3;
      if (e.type === 'ghost') {
        e.invuln = false;
        e.phaseT = 2.5;
      }
    });
    hitCircle(p.x, p.y, 280, ST.dmg * 1.15, 55, 'mark');
  };

  MAIN_ACTIVE[13] = function (p) {
    fan(p, 22, .9, { d: ST.dmg * .48, sp: ST.ps * 1.35, r: 3, pierce: 1 });
    p.puRate = Math.max(p.puRate || 1, 1.65);
    p.puTimer = Math.max(p.puTimer || 0, 3);
    hitCone(p, 250, .75, ST.dmg * .45, 215, 'corrode');
  };

  MAIN_ACTIVE[14] = function (p) {
    well(p.x, p.y, 4, 1);

    for (let i = 0; i < 4; i++) {
      const a = i / 4 * TAU;
      const x = p.x + Math.cos(a) * 130;
      const y = p.y + Math.sin(a) * 130;

      zone(x, y, 70, 4);
      delayFx(function () {
        const t = nearestEnemy(x, y);
        if (t) arcChain(t, ST.dmg * 1.35, 4, 200);
        hitCircle(x, y, 70, ST.dmg * .5, 200, 'stun');
      }, i * 180);
    }
  };

  MAIN_ACTIVE[15] = function (p) {
    fan(p, 10, .8, { d: ST.dmg * .72, burn: true, life: 2 });

    for (let i = 1; i <= 5; i++) {
      const x = p.x + Math.cos(p.angle) * i * 45;
      const y = p.y + Math.sin(p.angle) * i * 45;
      delayFx(function () {
        zone(x, y, 65, 3);
        hitCircle(x, y, 68, ST.dmg * .45, 30, 'burn');
      }, i * 90);
    }
  };

  MAIN_ACTIVE[16] = function (p) {
    zone(p.x, p.y, 205, 6);
    enemiesNear(p.x, p.y, 225).forEach(function (e) {
      addPoison(e, ST.dmg * .62, 5);
    });
    hitCircle(p.x, p.y, 170, ST.dmg * .7, 65, 'poison');
  };

  MAIN_ACTIVE[17] = function (p) {
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU;
      const x = p.x + Math.cos(a) * 125;
      const y = p.y + Math.sin(a) * 125;
      delayFx(function () {
        zone(x, y, 95, 4);
        hitCircle(x, y, 90, ST.dmg * .55, 90, 'poison');
      }, i * 70);
    }

    enemiesNear(p.x, p.y, 240).forEach(function (e) {
      addPoison(e, ST.dmg * .42, 5);
    });
  };

  MAIN_ACTIVE[18] = function (p) {
    zone(p.x, p.y, 190, 4);

    enemiesNear(p.x, p.y, 230).forEach(function (e) {
      e.stun = Math.max(e.stun, 1);
      e.slowT = Math.max(e.slowT, 2.5);
    });

    if (RUN.ebullets) {
      RUN.ebullets = RUN.ebullets.filter(function (b) {
        return d2(b.x, b.y, p.x, p.y) > 230 * 230;
      });
    }

    hitRing(p.x, p.y, 210, 42, ST.dmg * .6, 260, 'slow');
  };

  MAIN_ACTIVE[19] = function (p) {
    for (let i = 0; i < 12; i++) {
      delayFx(function () {
        bullet(p, { a: p.angle + rnd(-.5, .5), d: ST.dmg * .62, sp: ST.ps * 1.25 });
        if (Math.random() < .4) hitCircle(p.x, p.y, 72, ST.dmg * .55, 20, 'burn');
      }, i * 70);
    }
  };

  MAIN_ACTIVE[20] = function (p) {
    shieldGain(p, 32, 1);
    fan(p, 9, 1.2, { sp: ST.ps * .52, d: ST.dmg * .85, r: 7, pierce: 0, life: 2.2, fsplit: true });
    hitRect(p.x + Math.cos(p.angle) * 110, p.y + Math.sin(p.angle) * 110, 210, 80, ST.dmg * .7, 40, 'stun');
  };

  MAIN_ACTIVE[21] = function (p) {
    p.puDamage = 1.38;
    p.puTimer = 6;
    shieldGain(p, 20, .8);
    RUN.bullets.forEach(function (b) { b.dmg *= 1.08; });
    hitCircle(p.x, p.y, 140, ST.dmg * .7, 210, 'mark');
  };

  MAIN_ACTIVE[22] = function (p) {
    p.iframes = Math.max(p.iframes, 2);
    p.adrenT = Math.max(p.adrenT, 2.5);
    dashMove(p, 240, 1.2);
    hitCircle(p.x, p.y, 185, ST.dmg * 1.75, 220, 'stun');
  };

  MAIN_ACTIVE[23] = function (p) {
    const s = Math.min(24, p.store || 0);
    p.store = 0;
    bullet(p, { d: ST.dmg * (2 + s * .22), sp: ST.ps * 2.4, r: 10 + s * .3, pierce: 16, life: 1.4, burn: true });
    hitLine(p.x, p.y, p.angle, 300, 22, ST.dmg * (1 + s * .08), 55, 'burn');
  };

  MAIN_ACTIVE[24] = function (p) {
    convertShots(p, 285);
    shieldGain(p, 18, .9);
    ringShot(p, 10, { d: ST.dmg * .55, pierce: 3, sp: ST.ps * 1.2 });
    hitRing(p.x, p.y, 165, 30, ST.dmg * .6, 225, 'mark');
  };

  MAIN_ACTIVE[25] = function (p) {
    enemiesNear(p.x, p.y, 340).forEach(function (e) {
      e.mark = Math.max(e.mark, 6);
      addPoison(e, ST.dmg * .35, 4);
      addBurn(e, ST.dmg * .35, 4);
    });
    hitCircle(p.x, p.y, 200, ST.dmg * .7, 280, 'mark');
  };

  MAIN_ACTIVE[26] = function (p) {
    well(p.x, p.y, 2.8, 3);

    enemiesNear(p.x, p.y, 400).forEach(function (e) {
      if (!e.boss) {
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        e.x += Math.cos(a) * 185;
        e.y += Math.sin(a) * 185;
      }
    });

    hitRing(p.x, p.y, 190, 50, ST.dmg * .8, 260, 'slow');
  };

  MAIN_ACTIVE[27] = function (p) {
    const s = Math.min(20, p.store || 0);
    p.store = 0;
    bullet(p, { d: ST.dmg * (3.6 + s * .22), sp: ST.ps * 2.8, r: 11, pierce: 25, life: 1.3, burn: true });
    hitLine(p.x, p.y, p.angle, 380, 20, ST.dmg * (1.4 + s * .1), 55, 'burn');
  };

  MAIN_ACTIVE[28] = function (p) {
    shieldGain(p, 28, 1.2);
    convertShots(p, 260);
    well(p.x, p.y, 2, 1);
    hitRing(p.x, p.y, 155, 32, ST.dmg * .7, 240, 'slow');
  };

  MAIN_ACTIVE[29] = function (p) {
    fan(p, 7, .4, { d: ST.dmg * .72, hom: true, pierce: 2, chainOnHit: true });

    delayFx(function () {
      const t = nearestEnemy(p.x, p.y);
      if (t) arcChain(t, ST.dmg * 1.65, 6, 200);
    }, 200);
  };

  MAIN_ACTIVE[30] = function (p) {
    shieldGain(p, 42, 1.4);

    delayFx(function () {
      healGain(p, 26);
      hitCircle(p.x, p.y, 165, ST.dmg * 1.25, 145, 'poison');
    }, 1200);
  };

  MAIN_ACTIVE[31] = function (p) {
    fan(p, 14, .9, { sp: ST.ps * .72, d: ST.dmg * .62, burn: true, life: 1.8 });
    zone(p.x, p.y, 135, 4);
    p.holdT = Math.min(3, (p.holdT || 0) + 1);
    hitCone(p, 220, .85, ST.dmg * .6, 30, 'burn');
  };

  MAIN_ACTIVE[32] = function (p) {
    p._semi = (p._semi || 0) ? 0 : 1;

    if (p._semi) {
      shieldGain(p, 24, 1);
      hitRing(p.x, p.y, 145, 30, ST.dmg * .6, 210, 'slow');
    } else {
      ringShot(p, 12, { d: ST.dmg * .62, pierce: 3 });
      const t = nearestEnemy(p.x, p.y);
      if (t) arcChain(t, ST.dmg * 1.45, 5, 200);
    }
  };

  MAIN_ACTIVE[33] = function (p) {
    fan(p, 12, .4, { d: ST.dmg * .48, poison: true, pierce: 2 });
    enemiesNear(p.x, p.y, 260).forEach(function (e) {
      addPoison(e, ST.dmg * .58, 6);
    });
    hitCircle(p.x, p.y, 150, ST.dmg * .5, 120, 'poison');
  };

  MAIN_ACTIVE[34] = function (p) {
    p.puCrit = 1;
    p.puTimer = 5;
    p.puDamage = 1.25;
    bullet(p, { d: ST.dmg * 2.25, sp: ST.ps * 2.2, pierce: 10, life: 1.2 });

    enemiesNear(p.x, p.y, 320).forEach(function (e) {
      e.flash = .3;
      if (e.type === 'ghost') {
        e.invuln = false;
        e.phaseT = 2.5;
      }
    });

    hitLine(p.x, p.y, p.angle, 360, 18, ST.dmg * .9, 55, 'mark');
  };

  MAIN_ACTIVE[35] = function (p) {
    for (let i = 0; i < 6; i++) {
      const a = p.angle + (i - 2.5) * .2;
      bullet(p, { a: a, sp: ST.ps * .82, d: ST.dmg * .72, corrode: true, r: 7, life: 1.8, expl: true, lag: true });
    }

    const x = p.x + Math.cos(p.angle) * 120;
    const y = p.y + Math.sin(p.angle) * 120;
    zone(x, y, 105, 4);
    hitCircle(x, y, 105, ST.dmg * .7, 90, 'corrode');
  };

  MAIN_ACTIVE[36] = function (p) {
    bullet(p, { d: ST.dmg * 2.9, sp: ST.ps * 2.7, r: 7, pierce: 22, life: 1.2 });
    hitLine(p.x, p.y, p.angle, 420, 16, ST.dmg * 1.1, 55, 'mark');

    enemiesNear(p.x, p.y, 360).forEach(function (e) {
      e.flash = .3;
      e.mark = Math.max(e.mark, 3);
      if (e.type === 'ghost') {
        e.invuln = false;
        e.phaseT = 2.5;
      }
    });
  };

  MAIN_ACTIVE[37] = function (p) {
    p.instab = (p.instab || 0) + 6;

    if (p.instab >= 6) {
      p.instab = 0;
      hitCircle(p.x, p.y, 245, ST.dmg * 2.65, 280, 'burn');
    } else {
      fan(p, 8, .6, { d: ST.dmg * .62, expl: true });
    }
  };

  MAIN_ACTIVE[38] = function (p) {
    enemiesNear(p.x, p.y, 420).forEach(function (e) {
      e.mark = Math.max(e.mark, 7);
      e.flash = .25;
    });

    hitCircle(p.x, p.y, 300, ST.dmg * .95, 0, 'mark');
  };

  MAIN_ACTIVE[39] = function (p) {
    for (let i = 0; i < 8; i++) {
      const t = nearestEnemy(p.x, p.y);
      const a = t ? Math.atan2(t.y - p.y, t.x - p.x) : i / 8 * TAU;
      bullet(p, { a: a, d: ST.dmg * .58, hom: true, life: 2, pierce: 1 });
    }

    hitRing(p.x, p.y, 135, 30, ST.dmg * .5, 120, 'mark');
  };

  MAIN_ACTIVE[40] = function (p) {
    shieldGain(p, 26, 1);

    RUN.enemies.forEach(function (e) {
      if (!e.dead && e.burn) e.burn.dps *= 1.5;
    });

    enemiesNear(p.x, p.y, 240).forEach(function (e) {
      addBurn(e, ST.dmg * .55, 5);
    });

    hitCircle(p.x, p.y, 160, ST.dmg * .75, 30, 'burn');
  };

  MAIN_ACTIVE[41] = function (p) {
    p.puRate = 1.9;
    p.puTimer = 6;
    p.puDamage = 1.18;
    ringShot(p, 10, { d: ST.dmg * .55, pierce: 4, hom: true });
    hitRing(p.x, p.y, 150, 28, ST.dmg * .6, 220, 'slow');
  };

  MAIN_ACTIVE[42] = function (p) {
    p.holdT = 3;
    p.puDamage = 1.32;
    p.puTimer = 5;
    bullet(p, { d: ST.dmg * 2.1, sp: ST.ps * 1.4, burn: true, pierce: 5 });
    hitCone(p, 220, .55, ST.dmg * .7, 30, 'burn');
  };

  MAIN_ACTIVE[43] = function (p) {
    for (let i = 0; i < 9; i++) {
      const o = {
        a: p.angle + rnd(-.6, .6),
        d: ST.dmg * .62,
        sp: ST.ps * rnd(.7, 1.5),
        life: rnd(.7, 1.6),
        pierce: 2
      };

      const r = Math.random();
      if (r < .3) o.expl = true;
      if (r >= .3 && r < .6) o.poison = true;
      if (r >= .6 && r < .8) o.burn = true;
      if (r >= .8) o.fsplit = true;

      bullet(p, o);
    }

    hitCircle(p.x, p.y, 130, ST.dmg * .6, 280, 'conf');
  };

  MAIN_ACTIVE[44] = function (p) {
    const t = nearestEnemy(p.x, p.y);
    if (!t) return;

    t.mark = Math.max(t.mark, 8);
    addPoison(t, ST.dmg * .72, 5);
    addBurn(t, ST.dmg * .72, 5);
    arcChain(t, ST.dmg * .85, 4, 200);
    hitCircle(t.x, t.y, 100, ST.dmg * .8, 300, 'mark');
  };

  MAIN_ACTIVE[45] = function (p) {
    p.iframes = Math.max(p.iframes, 1.6);
    convertShots(p, 300);
    enemiesNear(p.x, p.y, 260).forEach(function (e) {
      dmgEnemy(e, ST.dmg * .95);
    });
    hitRing(p.x, p.y, 175, 35, ST.dmg * .8, 190, 'mark');
  };

  MAIN_ACTIVE[46] = function (p) {
    const s = Math.min(30, p.store || 0);
    p.store = 0;

    hitCircle(p.x, p.y, 205 + s * 6, ST.dmg * (2 + s * .25), 200, 'burn');
    fan(p, 6, .5, { d: ST.dmg * .72, acc: 620, expl: true });
  };

  MAIN_ACTIVE[47] = function (p) {
    for (let i = 0; i < 16; i++) {
      bullet(p, { a: rnd(TAU), sp: ST.ps * 1.65, d: ST.dmg * .58, r: 3, pierce: 2, life: 1.5 });
    }

    delayFx(function () {
      for (let i = 0; i < 12; i++) {
        bullet(p, { a: Math.PI / 2 + rnd(-.2, .2), sp: ST.ps * 1.85, d: ST.dmg * .72, pierce: 3 });
      }
      hitRect(p.x, p.y, 320, 240, ST.dmg * .5, 220, 'mark');
    }, 300);
  };

  MAIN_ACTIVE[48] = function (p) {
    shieldGain(p, 18, .8);

    enemiesNear(p.x, p.y, 300).forEach(function (e) {
      addPoison(e, ST.dmg * .78, 6);
    });

    fan(p, 8, .5, { d: ST.dmg * .55, poison: true });
    hitCircle(p.x, p.y, 150, ST.dmg * .65, 120, 'poison');
  };

  MAIN_ACTIVE[49] = function (p) {
    fan(p, 10, .7, { d: ST.dmg * .78, hom: true, sp: ST.ps * .9, life: 2, pierce: 3, corrode: true });
    hitCone(p, 230, .8, ST.dmg * .6, 220, 'corrode');
  };

  MAIN_ACTIVE[50] = function (p) {
    for (let i = 0; i < 6; i++) {
      bullet(p, { a: i / 6 * TAU, d: ST.dmg * .62, hom: true, life: 2.4, pierce: 2 });
    }

    delayFx(function () {
      for (let i = 0; i < 6; i++) {
        bullet(p, { a: i / 6 * TAU, d: ST.dmg * .52, hom: true, life: 2 });
      }
      hitRing(p.x, p.y, 140, 30, ST.dmg * .55, 40, 'slow');
    }, 700);
  };

  MAIN_ACTIVE[51] = function (p) {
    for (let i = 0; i < 5; i++) {
      const a = p.angle + (i - 2) * .35;
      const x = p.x + Math.cos(a) * 95;
      const y = p.y + Math.sin(a) * 95;

      delayFx(function () {
        hitCircle(x, y, 105, ST.dmg * 1.25, 310, 'slow');

        for (let k = 0; k < 8; k++) {
          const aa = k / 8 * TAU;
          RUN.bullets.push({
            x: x,
            y: y,
            vx: Math.cos(aa) * ST.ps * .9,
            vy: Math.sin(aa) * ST.ps * .9,
            dmg: ST.dmg * .42,
            r: 3,
            pierce: 2,
            hit: [],
            life: .8,
            owner: p.id
          });
        }
      }, i * 140);
    }
  };

  MAIN_ACTIVE[52] = function (p) {
    enemiesNear(p.x, p.y, 380).forEach(function (e) {
      addPoison(e, ST.dmg * .62, 6);
    });

    zone(p.x, p.y, 135, 4);
    hitCircle(p.x, p.y, 145, ST.dmg * .7, 120, 'poison');
  };

  MAIN_ACTIVE[53] = function (p) {
    zone(p.x, p.y, 185, 5);

    enemiesNear(p.x, p.y, 420).forEach(function (e) {
      e.mark = Math.max(e.mark, 6);
      e.flash = .2;
      if (e.type === 'ghost') {
        e.invuln = false;
        e.phaseT = 2.5;
      }
    });

    hitCircle(p.x, p.y, 170, ST.dmg * .65, 280, 'mark');
  };

  MAIN_ACTIVE[54] = function (p) {
    enemiesNear(p.x, p.y, 400).forEach(function (e) {
      e.stun = Math.max(e.stun, 1.5);
      if (!e.boss && e.hp < e.maxhp * .35) addFreeze(e, 1.2);
    });

    hitCircle(p.x, p.y, 320, ST.dmg * 1.15, 220, 'freeze');
  };

  MAIN_ACTIVE[55] = function (p) {
    p._timeStacks = (p._timeStacks || 0) + 1;
    p.puRate = 1.5 + Math.min(1.5, p._timeStacks * .22);
    p.puTimer = 6;

    delayFx(function () {
      hitCircle(p.x, p.y, 205, ST.dmg * (1 + p._timeStacks * .32), 280, 'burn');
    }, 900);
  };

  MAIN_ACTIVE[56] = function (p) {
    fan(p, 5, .4, { d: ST.dmg * 1.35, sp: ST.ps * .72, r: 8, pull: true, pierce: 3 });
    well(p.x + Math.cos(p.angle) * 160, p.y + Math.sin(p.angle) * 160, 2.2, 2);
    hitLine(p.x, p.y, p.angle, 300, 24, ST.dmg * .7, 270, 'slow');
  };

  MAIN_ACTIVE[57] = function (p) {
    const r = Math.floor(rnd(6));

    if (r === 0) fan(p, 8, .5, { d: ST.dmg * .82, burn: true });
    else if (r === 1) ringShot(p, 10, { d: ST.dmg * .72, poison: true });
    else if (r === 2) well(p.x, p.y, 2, 2);
    else if (r === 3) hitCircle(p.x, p.y, 185, ST.dmg * 1.65, RUN.hue, 'burn');
    else if (r === 4) {
      const t = nearestEnemy(p.x, p.y);
      if (t) arcChain(t, ST.dmg * 1.55, 5, 200);
    } else {
      shieldGain(p, 22, 1);
    }

    shapeHit(p, variant({ id: 'main_57_' + Math.floor(rnd(99999)) }, p));
  };

  MAIN_ACTIVE[58] = function (p) {
    dashMove(p, 165, .55);

    for (let i = 1; i <= 6; i++) {
      const x = p.x - Math.cos(p.angle) * i * 35;
      const y = p.y - Math.sin(p.angle) * i * 35;

      delayFx(function () {
        burst(x, y, 55);
        enemiesNear(x, y, 82).forEach(function (e) {
          dmgEnemy(e, ST.dmg * .62);
        });
        hitCircle(x, y, 75, ST.dmg * .4, 55, 'burn');
      }, i * 70);
    }
  };

  MAIN_ACTIVE[59] = function (p) {
    fan(p, 12, .9, { d: ST.dmg * .58, hom: true, sp: ST.ps * .82, life: 2, pierce: 2, pull: true });
    hitCone(p, 240, .85, ST.dmg * .55, 260, 'slow');
  };

  MAIN_ACTIVE[60] = function (p) {
    well(p.x, p.y, 3.2, 4);

    enemiesNear(p.x, p.y, 520).forEach(function (e) {
      if (!e.boss) {
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        e.x += Math.cos(a) * 265;
        e.y += Math.sin(a) * 265;
      }
    });

    convertShots(p, 400);
    hitRing(p.x, p.y, 230, 60, ST.dmg * .9, 270, 'slow');
  };

  MAIN_ACTIVE[61] = function (p) {
    zone(p.x, p.y, 125, 7);
    well(p.x, p.y, 3, 1);

    enemiesNear(p.x, p.y, 185).forEach(function (e) {
      addPoison(e, ST.dmg * .55, 6);
    });

    hitCircle(p.x, p.y, 135, ST.dmg * .75, 120, 'poison');
  };

  MAIN_ACTIVE[62] = function (p) {
    for (let i = 0; i < 4; i++) {
      const x = p.x + rnd(-125, 125);
      const y = p.y + rnd(-125, 125);

      well(x, y, 1.8, 1);
      fxTele(x, y, 95, .9, 280);

      delayFx(function () {
        hitCircle(x, y, 135, ST.dmg * 1.65, 260, 'slow');
      }, 900 + i * 120);
    }
  };

  MAIN_ACTIVE[63] = function (p) {
    enemiesNear(p.x, p.y, 460).forEach(function (e) {
      e.mark = Math.max(e.mark, 8);
      e.flash = .3;
    });

    ringShot(p, 12, { d: ST.dmg * .55, poison: true });
    hitRing(p.x, p.y, 210, 40, ST.dmg * .6, 0, 'mark');
  };

  MAIN_ACTIVE[64] = function (p) {
    shieldGain(p, 32, 1.2);
    convertShots(p, 245);
    p.puArmor = .4;
    p.puTimer = 6;
    hitRing(p.x, p.y, 160, 34, ST.dmg * .7, 250, 'slow');
  };

  MAIN_ACTIVE[65] = function (p) {
    enemiesNear(p.x, p.y, 360).forEach(function (e) {
      e.stun = Math.max(e.stun, 1.6);
      e.slowT = Math.max(e.slowT, 3);
    });

    hitCircle(p.x, p.y, 300, ST.dmg * .85, 120, 'stun');
  };

  MAIN_ACTIVE[66] = function (p) {
    const x = p.x + Math.cos(p.angle) * 145;
    const y = p.y + Math.sin(p.angle) * 145;

    well(x, y, 2.4, 4);
    fxTele(x, y, 110, .7, 280);

    enemiesNear(p.x, p.y, 285).forEach(function (e) {
      if (!e.boss) {
        const a = Math.atan2(y - e.y, x - e.x);
        e.x += Math.cos(a) * 205;
        e.y += Math.sin(a) * 205;
      }
    });

    hitCircle(x, y, 120, ST.dmg * 1.2, 270, 'slow');
  };

  MAIN_ACTIVE[67] = function (p) {
    bullet(p, { d: ST.dmg * 3.45, sp: ST.ps * 3, r: 9, pierce: 30, life: 1.1 });

    const x = p.x + Math.cos(p.angle) * 220;
    const y = p.y + Math.sin(p.angle) * 220;

    hitLine(p.x, p.y, p.angle, 380, 18, ST.dmg * 1.15, 260, 'corrode');
    delayFx(function () { hitCircle(x, y, 125, ST.dmg * 1.45, 230, 'stun'); }, 220);
  };

  MAIN_ACTIVE[68] = function (p) {
    bullet(p, { d: ST.dmg * 2.55, sp: ST.ps * 3.25, r: 3, pierce: 30, life: 1 });
    fan(p, 3, .12, { d: ST.dmg * .72, sp: ST.ps * 2.6, r: 2, pierce: 12 });
    hitLine(p.x, p.y, p.angle, 440, 10, ST.dmg * .9, 190, 'mark');
  };

  MAIN_ACTIVE[69] = function (p) {
    bullet(p, { d: ST.dmg * 6.2, sp: ST.ps * .8, r: 12, pierce: 20, life: 1.8, kb: 3 });
    hitLine(p.x, p.y, p.angle, 260, 26, ST.dmg * 1.1, 40, 'stun');
  };

  MAIN_ACTIVE[70] = function (p) {
    const charge = Math.min(12, p._charge || 0);
    p._charge = 0;
    hitCircle(p.x, p.y, 165 + charge * 22, ST.dmg * (1.5 + charge * .32), 50, 'stun');
  };

  MAIN_ACTIVE[71] = function (p) {
    p.puCrit = 1;
    p.puTimer = 6;
    p.puDamage = 1.32;
    bullet(p, { d: ST.dmg * 2.45, pierce: 18, r: 4, sp: ST.ps * 2.2 });
    hitLine(p.x, p.y, p.angle, 360, 14, ST.dmg * .9, 55, 'mark');
  };

  MAIN_ACTIVE[72] = function (p) {
    if (p.hp < ST.hp * .4) {
      healGain(p, ST.hp * .35);
      shieldGain(p, 22, 1);
    } else {
      ringShot(p, 14, { d: ST.dmg * .85, pierce: 4 });
    }

    hitCircle(p.x, p.y, 155, ST.dmg * .8, 190, 'slow');
  };

  MAIN_ACTIVE[73] = function (p) {
    p.iframes = Math.max(p.iframes, 2.8);
    p.puSpeed = .55;
    p.puTimer = 3;
    hitCircle(p.x, p.y, 165, ST.dmg * 1.25, 220, 'slow');
  };

  MAIN_ACTIVE[74] = function (p) {
    bullet(p, { d: ST.dmg * 3.25, sp: ST.ps * .55, r: 13, pierce: 12, life: 2, kb: 4, expl: true });
    hitCone(p, 210, .65, ST.dmg * .95, 35, 'stun');
  };

  MAIN_ACTIVE[75] = function (p) {
    p.puRate = 1.75;
    p.puDamage = 1.32;
    p.puTimer = 6;

    enemiesNear(p.x, p.y, 285).forEach(function (e) {
      addBurn(e, ST.dmg * .62, 5);
    });

    hitCircle(p.x, p.y, 175, ST.dmg * .8, 25, 'burn');
  };

  MAIN_ACTIVE[76] = function (p) {
    p.iframes = Math.max(p.iframes, 1.5);
    hitCircle(p.x, p.y, 245, ST.dmg * 1.85, 40, 'stun');

    enemiesNear(p.x, p.y, 260).forEach(function (e) {
      if (!e.boss) {
        e.x += (e.x - p.x) * .2;
        e.y += (e.y - p.y) * .2;
        e.stun = Math.max(e.stun, .6);
      }
    });
  };

  MAIN_ACTIVE[77] = function (p) {
    for (let i = 0; i < 6; i++) {
      const x = clamp(p.x + rnd(-225, 225), 30, W - 30);
      const y = clamp(p.y + rnd(-225, 225), 30, H - 30);

      fxTele(x, y, 90, .55 + i * .12, 25);

      delayFx(function () {
        hitCircle(x, y, 115, ST.dmg * 1.85, 25, 'burn');
      }, i * 150);
    }
  };

  MAIN_ACTIVE[78] = function (p) {
    enemiesNear(p.x, p.y, 400).forEach(function (e) {
      e.mark = Math.max(e.mark, 7);
      addPoison(e, ST.dmg * .42, 5);
      addBurn(e, ST.dmg * .42, 5);
      e.slowT = Math.max(e.slowT, 2);
    });

    hitCircle(p.x, p.y, 220, ST.dmg * .75, 300, 'mark');
  };

  MAIN_ACTIVE[79] = function (p) {
    enemiesNear(p.x, p.y, 420).forEach(function (e) {
      e.mark = Math.max(e.mark, 6);
      e.coin = (e.coin || 1) + 3;
    });

    RUN.coins += 25;
    SAVE.addCoins(25);
    hitCircle(p.x, p.y, 190, ST.dmg * .8, 48, 'mark');
  };

  MAIN_ACTIVE[80] = function (p) {
    dashMove(p, 205, 1.1);
    ringShot(p, 10, { d: ST.dmg * .55, sp: ST.ps * .82, life: 1.6, poison: true });
    hitLine(p.x - Math.cos(p.angle) * 200, p.y - Math.sin(p.angle) * 200, p.angle, 220, 26, ST.dmg * .7, 210, 'slow');
  };

  MAIN_ACTIVE[81] = function (p) {
    enemiesNear(p.x, p.y, 380).forEach(function (e) {
      addPoison(e, ST.dmg * .75, 7);
    });

    delayFx(function () {
      enemiesNear(p.x, p.y, 420).forEach(function (e) {
        if (e.poison) dmgEnemy(e, ST.dmg * 1.65, { quiet: true });
      });
      hitCircle(p.x, p.y, 220, ST.dmg * .8, 120, 'poison');
    }, 1300);
  };

  MAIN_ACTIVE[82] = function (p) {
    shieldGain(p, 36, 1.4);
    fan(p, 9, 1.1, { sp: ST.ps * .35, d: ST.dmg * .85, r: 8, pierce: 0, life: 2.4 });
    zone(p.x, p.y, 115, 3);
    hitRect(p.x + Math.cos(p.angle) * 110, p.y + Math.sin(p.angle) * 110, 230, 85, ST.dmg * .75, 230, 'slow');
  };

  MAIN_ACTIVE[83] = function (p) {
    for (let w = 0; w < 3; w++) {
      delayFx(function () {
        ringShot(p, 8 + w * 4, { d: ST.dmg * .48, r: 4, pierce: 2, sp: ST.ps * (.7 + w * .25) });
        hitRing(p.x, p.y, 105 + w * 45, 26, ST.dmg * .5, 300, 'slow');
      }, w * 220);
    }
  };

  MAIN_ACTIVE[84] = function (p) {
    enemiesNear(p.x, p.y, 360).forEach(function (e) {
      addPoison(e, ST.dmg * .68, 6);
      e.mark = Math.max(e.mark, 4);
    });

    zone(p.x, p.y, 125, 5);
    hitCircle(p.x, p.y, 135, ST.dmg * .75, 120, 'poison');
  };

  MAIN_ACTIVE[85] = function (p) {
    enemiesNear(p.x, p.y, 380).forEach(function (e) {
      addPoison(e, ST.dmg * 1.15, 3);
      addCorrode(e, 4, .45);
    });

    hitCircle(p.x, p.y, 210, ST.dmg * 1.2, 120, 'corrode');
  };

  MAIN_ACTIVE[86] = function (p) {
    zone(p.x, p.y, 195, 6);

    enemiesNear(p.x, p.y, 225).forEach(function (e) {
      addPoison(e, ST.dmg * .55, 6);
    });

    hitCircle(p.x, p.y, 160, ST.dmg * .6, 120, 'poison');
  };

  MAIN_ACTIVE[87] = function (p) {
    p._critStacks = (p._critStacks || 0) + 3;
    fan(p, 10, .7, { d: ST.dmg * .72, expl: true, crit: true });

    if (p._critStacks >= 9) {
      p._critStacks = 0;
      hitCircle(p.x, p.y, 305, ST.dmg * 3.1, 320, 'burn');
    } else {
      hitCircle(p.x, p.y, 145, ST.dmg * .7, 320, 'mark');
    }
  };

  MAIN_ACTIVE[88] = function (p) {
    zone(p.x, p.y, 165, 6);

    enemiesNear(p.x, p.y, 225).forEach(function (e) {
      addPoison(e, ST.dmg * .42, 6);
    });

    delayFx(function () {
      hitCircle(p.x, p.y, 225, ST.dmg * 1.45, 60, 'poison');
    }, 700);
  };

  MAIN_ACTIVE[89] = function (p) {
    const s = Math.min(20, p.store || 0);
    p.store = 0;

    bullet(p, { d: ST.dmg * (2.25 + s * .22), sp: ST.ps * 2.5, r: 10, pierce: 20, burn: true, poison: true });
    hitLine(p.x, p.y, p.angle, 360, 22, ST.dmg * (1.1 + s * .1), 120, 'poison');
  };

  MAIN_ACTIVE[90] = function (p) {
    bullet(p, { d: ST.dmg * 3.1, sp: ST.ps * .72, r: 12, pierce: 10, life: 2, poison: true, expl: true });

    const x = p.x + Math.cos(p.angle) * 180;
    const y = p.y + Math.sin(p.angle) * 180;

    delayFx(function () {
      zone(x, y, 115, 5);
      hitCircle(x, y, 115, ST.dmg * .95, 120, 'poison');
    }, 400);
  };

  MAIN_ACTIVE[91] = function (p) {
    const t = nearestEnemy(p.x, p.y);
    if (!t) return;

    arcChain(t, ST.dmg * 1.85, 7, 120);
    addPoison(t, ST.dmg * .72, 5);
    addBurn(t, ST.dmg * .55, 5);
    hitCircle(t.x, t.y, 110, ST.dmg * .9, 120, 'poison');
  };

  MAIN_ACTIVE[92] = function (p) {
    fan(p, 7, .5, { d: ST.dmg * .95, fsplit: true, pierce: 3, life: 1.6 });

    delayFx(function () {
      ringShot(p, 10, { d: ST.dmg * .45, fsplit: true });
      hitRing(p.x, p.y, 150, 30, ST.dmg * .6, 55, 'burn');
    }, 350);
  };

  MAIN_ACTIVE[93] = function (p) {
    bullet(p, { d: ST.dmg * 2.7, sp: ST.ps * 2.2, pierce: 30, r: 6, poison: true, life: 1.6 });
    fan(p, 3, .2, { d: ST.dmg * .85, pierce: 12, poison: true });
    hitLine(p.x, p.y, p.angle, 400, 18, ST.dmg * .9, 120, 'poison');
  };

  MAIN_ACTIVE[94] = function (p) {
    const s = Math.min(20, RUN.cm || 0);
    RUN.cm = 0;

    hitCircle(p.x, p.y, 185 + s * 10, ST.dmg * (2 + s * .25), 300, 'burn');
    ringShot(p, 12, { d: ST.dmg * .65, expl: true });
  };

  MAIN_ACTIVE[95] = function (p) {
    enemiesNear(p.x, p.y, 520).forEach(function (e) {
      e.mark = Math.max(e.mark, 8);
      e.flash = .25;
      e.invuln = false;
    });

    zone(p.x, p.y, 185, 4);
    hitCircle(p.x, p.y, 200, ST.dmg * .75, 200, 'mark');
  };

  MAIN_ACTIVE[96] = function (p) {
    const t = nearestEnemy(p.x, p.y);

    if (t) {
      t.heat = (t.heat || 0) + 3;
      arcChain(t, ST.dmg * 1.25, 3, 30);
      addBurn(t, ST.dmg * .85, 6);
    }

    bullet(p, { d: ST.dmg * 1.85, pierce: 20, sp: ST.ps * 2.6, burn: true });
    hitLine(p.x, p.y, p.angle, 420, 14, ST.dmg * .95, 30, 'burn');
  };

  MAIN_ACTIVE[97] = function (p) {
    const x = clamp(p.x + Math.cos(p.angle) * 180, 30, W - 30);
    const y = clamp(p.y + Math.sin(p.angle) * 180, 30, H - 30);

    zone(x, y, 95, 3);
    fxTele(x, y, 95, .9, 120);

    delayFx(function () {
      hitCircle(x, y, 185, ST.dmg * 2.65, 120, 'poison');
      zone(x, y, 135, 5);
    }, 900);
  };

  MAIN_ACTIVE[98] = function (p) {
    fan(p, 8, .35, { d: ST.dmg * 1.75, sp: ST.ps * 1.8, pierce: 20, r: 7, life: 1.4 });
    hitLine(p.x, p.y, p.angle, 430, 22, ST.dmg * 1.05, 200, 'slow');
  };

  MAIN_ACTIVE[99] = function (p) {
    enemiesNear(p.x, p.y, 420).forEach(function (e) {
      e.conf = Math.max(e.conf, 2.5);
      e.slowT = Math.max(e.slowT, 2.5);
    });

    hitCircle(p.x, p.y, 230, ST.dmg * .85, 300, 'conf');
  };

  MAIN_ACTIVE[100] = function (p) {
    fan(p, 9, .6, { d: ST.dmg * .95, collapse: true, life: 1.1, pierce: 2 });

    const x = p.x + Math.cos(p.angle) * 180;
    const y = p.y + Math.sin(p.angle) * 180;

    delayFx(function () {
      hitCircle(x, y, 155, ST.dmg * 1.85, 280, 'burn');
    }, 700);
  };

  MAIN_ACTIVE[101] = function (p) {
    RUN.bloodlustStacks = Math.min(20, (RUN.bloodlustStacks || 0) + 8);
    p.puDamage = 1.42;
    p.puTimer = 6;
    ringShot(p, 12, { d: ST.dmg * .75, pierce: 3 });
    hitCircle(p.x, p.y, 160, ST.dmg * .8, 0, 'mark');
  };

  MAIN_ACTIVE[102] = function (p) {
    zone(p.x, p.y, 215, 5);

    enemiesNear(p.x, p.y, 245).forEach(function (e) {
      e.slowT = Math.max(e.slowT, 3);
      e.corrode = 0;
      e.mark = 0;
      dmgEnemy(e, ST.dmg * .95);
    });

    hitCircle(p.x, p.y, 180, ST.dmg * .8, 260, 'slow');
  };

  MAIN_ACTIVE[103] = function (p) {
    bullet(p, { d: ST.dmg * 3.25, sp: ST.ps * 3.4, r: 2, pierce: 40, life: .9 });
    hitLine(p.x, p.y, p.angle, 480, 8, ST.dmg * 1.2, 190, 'mark');
  };

  MAIN_ACTIVE[104] = function (p) {
    bullet(p, { d: ST.dmg * 2.25, sp: ST.ps * .62, r: 11, pierce: 8, kb: 4, life: 1.8 });
    hitCone(p, 210, .6, ST.dmg * .95, 40, 'stun');
  };

  MAIN_ACTIVE[105] = function (p) {
    fan(p, 9, .7, { d: ST.dmg * .75, fsplit: true, pierce: 2, life: 1.4 });

    delayFx(function () {
      ringShot(p, 8, { d: ST.dmg * .45, fsplit: true });
      hitRing(p.x, p.y, 135, 28, ST.dmg * .6, 120, 'poison');
    }, 300);
  };

  MAIN_ACTIVE[106] = function (p) {
    well(p.x, p.y, 5, 2);
    zone(p.x, p.y, 145, 6);

    delayFx(function () {
      hitCircle(p.x, p.y, 185, ST.dmg * 1.65, 320, 'poison');
    }, 1200);
  };

  MAIN_ACTIVE[107] = function (p) {
    const spd = Math.hypot(p.dvx || 0, p.dvy || 0) + ST.spd;
    dashMove(p, 185, .72);
    hitCircle(p.x, p.y, 145 + spd * .08, ST.dmg * (1.2 + spd / 900), 20, 'stun');
  };

  MAIN_ACTIVE[108] = function (p) {
    fan(p, 6, .4, { d: ST.dmg * 1.45, sp: ST.ps * .75, r: 9, pull: true, pierce: 4 });
    well(p.x + Math.cos(p.angle) * 150, p.y + Math.sin(p.angle) * 150, 2.4, 2);
    hitLine(p.x, p.y, p.angle, 300, 26, ST.dmg * .85, 270, 'slow');
  };

  MAIN_ACTIVE[109] = function (p) {
    const r = Math.floor(rnd(6));

    if (r === 0) fan(p, 10, .7, { d: ST.dmg * .75, expl: true });
    else if (r === 1) ringShot(p, 12, { d: ST.dmg * .65, poison: true });
    else if (r === 2) well(p.x, p.y, 2.2, 2);
    else if (r === 3) hitCircle(p.x, p.y, 205, ST.dmg * 1.75, RUN.hue, 'burn');
    else if (r === 4) {
      const t = nearestEnemy(p.x, p.y);
      if (t) arcChain(t, ST.dmg * 1.65, 6, 200);
    } else {
      shieldGain(p, 24, 1);
    }

    shapeHit(p, variant({ id: 'main_109_' + Math.floor(rnd(99999)) }, p));
  };

  MAIN_ACTIVE[110] = function (p) {
    bullet(p, { d: ST.dmg * 7.2, sp: ST.ps * .52, r: 6, pierce: 25, life: 2, kb: 2 });
    hitLine(p.x, p.y, p.angle, 240, 18, ST.dmg * 1.4, 300, 'stun');
  };

  MAIN_ACTIVE[111] = function (p) {
    enemiesNear(p.x, p.y, 700).forEach(function (e) {
      e.mark = Math.max(e.mark, 8);
      e.flash = .2;
      e.invuln = false;
    });

    p.puCrit = 1;
    p.puTimer = 5;
    hitCircle(p.x, p.y, 260, ST.dmg * .8, 200, 'mark');
  };

  MAIN_ACTIVE[112] = function (p) {
    dashMove(p, 245, 2.2);
    ringShot(p, 10, { d: ST.dmg * .55, pierce: 5, life: .9 });
    hitRing(p.x, p.y, 135, 32, ST.dmg * .7, 220, 'slow');
  };

  MAIN_ACTIVE[113] = function (p) {
    const t = nearestEnemy(p.x, p.y);
    if (!t) return;

    t.mark = Math.max(t.mark, 8);

    delayFx(function () {
      if (!t.dead) {
        hitCircle(t.x, t.y, 135, ST.dmg * 1.85, 320, 'poison');
        enemiesNear(t.x, t.y, 165).forEach(function (o) {
          addPoison(o, ST.dmg * .55, 4);
        });
      }
    }, 800);
  };

  MAIN_ACTIVE[114] = function (p) {
    bullet(p, { d: ST.dmg * 4.25, sp: ST.ps * .72, r: 12, pierce: 18, kb: 3, life: 2 });
    shieldGain(p, 16, .8);
    hitCone(p, 210, .7, ST.dmg * 1.05, 300, 'stun');
  };

  MAIN_ACTIVE[115] = function (p) {
    const cost = Math.min(ST.hp * .25, Math.max(0, p.hp - 1));

    if (cost > 0) {
      p.hp -= cost;
      hitCircle(p.x, p.y, 225, ST.dmg * (2 + cost / 20), 340, 'burn');
      ringShot(p, 14, { d: ST.dmg * .85, expl: true });
    } else {
      hitCircle(p.x, p.y, 125, ST.dmg, 340, 'burn');
    }
  };

  MAIN_ACTIVE[116] = function (p) {
    fan(p, 10, .8, { d: ST.dmg * .65, poison: true, corrode: true, r: 8, life: 2 });
    zone(p.x, p.y, 125, 5);
    hitCone(p, 230, .85, ST.dmg * .75, 120, 'poison');
  };

  MAIN_ACTIVE[117] = function (p) {
    enemiesNear(p.x, p.y, 380).forEach(function (e) {
      addPoison(e, ST.dmg * .85, 6);
    });

    delayFx(function () {
      enemiesNear(p.x, p.y, 420).forEach(function (e) {
        if (e.poison) hitCircle(e.x, e.y, 85, ST.dmg * 1.25, 120, 'poison');
      });
    }, 900);
  };

  MAIN_ACTIVE[118] = function (p) {
    const x = clamp(p.x + Math.cos(p.angle) * 225, 30, W - 30);
    const y = clamp(p.y + Math.sin(p.angle) * 225, 30, H - 30);

    well(x, y, 1.8, 4);
    zone(x, y, 125, 2);
    fxTele(x, y, 135, 1.4, 280);

    delayFx(function () {
      hitCircle(x, y, 265, ST.dmg * 3.45, 280, 'slow');
      well(x, y, 1, 2);
    }, 1500);
  };

  function runSignature(p, c) {
    if (!RUN || !p) return;

    const v = variant(c, p);
    const x = p.x, y = p.y;
    const key = String((c && c.key) || 'pulse').toLowerCase();

    fxRing(x, y, v.hue, 180, 10, .5);
    RUN.shake = Math.max(RUN.shake, 8);

    if (key === 'rift') {
      const ox = x, oy = y;
      dashMove(p, 215, .88);
      hitLine(ox, oy, p.angle, 215, 26, v.dmg * .88, v.hue, v.status);
    } else if (key === 'prism') {
      fan(p, v.count, .72, { d: v.dmg * .62, pierce: 3, sp: ST.ps * 1.25, life: 1.2 });
      hitCone(p, 245, .8, v.dmg * .42, v.hue, v.status);
    } else if (key === 'surge') {
      p.puDamage = Math.max(p.puDamage || 1, 1.38);
      p.puRate = Math.max(p.puRate || 1, 1.28);
      p.puTimer = 5;
      hitCircle(x, y, 135, v.dmg * .72, v.hue, v.status);
    } else if (key === 'grav') {
      well(x, y, 2.6, 2);
      hitRing(x, y, 155, 42, v.dmg * .78, v.hue, 'slow');
    } else if (key === 'bloom') {
      zone(x, y, 145, 5);
      hitCircle(x, y, 155, v.dmg * .58, v.hue, v.status);
    } else if (key === 'aegis') {
      shieldGain(p, 30, 1.2);
      convertShots(p, 225);
      hitRing(x, y, 140, 30, v.dmg * .55, v.hue, 'slow');
    } else if (key === 'drift') {
      dashMove(p, 175, 1.28);
      hitRing(p.x, p.y, 125, 32, v.dmg * .62, v.hue, 'slow');
    } else if (key === 'nova') {
      for (let i = 0; i < 3; i++) {
        delayFx(function () {
          hitCircle(p.x, p.y, 155 + i * 28, v.dmg * (.82 + i * .18), v.hue, v.status);
        }, i * 220);
      }
    } else if (key === 'lattice') {
      const t = nearestEnemy(x, y);
      const tx = t ? t.x : x + Math.cos(p.angle) * 145;
      const ty = t ? t.y : y + Math.sin(p.angle) * 145;

      fxTele(tx, ty, 115, .5, v.hue);
      hitRect(tx, ty, 195, 125, v.dmg * .95, v.hue, 'stun');
    } else if (key === 'pulse') {
      hitRing(x, y, 175, 48, v.dmg * .88, v.hue, 'stun');

      RUN.enemies.forEach(function (e) {
        if (!e.dead && d2(e.x, e.y, x, y) < 215 * 215) e.stun = Math.max(e.stun, 1.1);
      });
    } else if (key === 'shard') {
      ringShot(p, 14, { d: v.dmg * .52, pierce: 2, sp: ST.ps * 1.05 });
      hitCone(p, 225, .9, v.dmg * .42, v.hue, v.status);
    } else if (key === 'vortex') {
      well(x, y, 3.2, 3);
      hitCircle(x, y, 175, v.dmg * .72, v.hue, 'slow');
    } else if (key === 'flash') {
      dashMove(p, 195, .72);

      RUN.enemies.forEach(function (e) {
        if (!e.dead && d2(e.x, e.y, p.x, p.y) < 285 * 285) {
          e.stun = Math.max(e.stun, 1.2);
          e.flash = .3;
        }
      });

      hitCircle(p.x, p.y, 155, v.dmg * .78, v.hue, 'mark');
    } else if (key === 'anchor') {
      p.iframes = Math.max(p.iframes, 1.65);
      hitCircle(x, y, 155, v.dmg * 1.25, v.hue, 'stun');
    } else if (key === 'comet') {
      const tx = clamp(mouse.x, 20, W - 20);
      const ty = clamp(mouse.y, 20, H - 20);

      fxTele(tx, ty, 105, .45, v.hue);

      delayFx(function () {
        hitCircle(tx, ty, 125, v.dmg * 1.55, v.hue, v.status);
      }, 420);
    } else if (key === 'echo') {
      bullet(p, { d: v.dmg * .82, pierce: 6, sp: ST.ps * 1.6, life: 1.2 });

      delayFx(function () {
        bullet(p, { d: v.dmg * .58, pierce: 8, sp: ST.ps * 1.4, life: 1.1 });
        hitLine(p.x, p.y, p.angle, 240, 18, v.dmg * .45, v.hue, v.status);
      }, 320);
    } else if (key === 'torrent') {
      const tx = x + Math.cos(p.angle) * 135;
      const ty = y + Math.sin(p.angle) * 135;

      zone(tx, ty, 105, 4);
      hitCone(p, 245, .88, v.dmg * .72, v.hue, 'slow');
    } else if (key === 'crown') {
      for (let i = 0; i < 8; i++) {
        const a = RUN.t * 2 + i * TAU / 8;
        bullet(p, { a: a, d: v.dmg * .58, pierce: 3, sp: ST.ps * .92, life: 1.4 });
      }

      hitRing(x, y, 105, 32, v.dmg * .55, v.hue, v.status);
    } else if (key === 'spike') {
      const tx = clamp(mouse.x, 20, W - 20);
      const ty = clamp(mouse.y, 20, H - 20);
      const a = Math.atan2(ty - y, tx - x);

      hitLine(x, y, a, Math.hypot(tx - x, ty - y) + 45, 24, v.dmg * 1.25, v.hue, v.status);
      fxBurst(tx, ty, v.hue, 14);
    } else if (key === 'mirror') {
      p.iframes = Math.max(p.iframes, 1.85);
      convertShots(p, 265);
      shieldGain(p, 18, .8);
    } else if (key === 'bloomfire') {
      zone(x, y, 155, 5);
      hitCircle(x, y, 155, v.dmg * .72, v.hue, 'burn');
    } else if (key === 'coil') {
      p.puDamage = Math.max(p.puDamage || 1, 1.32);
      p.puTimer = 6;

      const t = nearestEnemy(x, y);
      if (t) arcChain(t, v.dmg * 1.25, 4, v.hue);
    } else if (key === 'tether') {
      const t = nearestEnemy(x, y);

      if (t) {
        t.slowT = Math.max(t.slowT, 3);

        if (!t.boss) {
          const a = Math.atan2(p.y - t.y, p.x - t.x);
          t.x += Math.cos(a) * 125;
          t.y += Math.sin(a) * 125;
        }

        hitCircle(t.x, t.y, 95, v.dmg * .75, v.hue, 'slow');
      }
    } else if (key === 'ruin') {
      const t = nearestEnemy(x, y);

      if (t) {
        t.mark = Math.max(t.mark, 8);

        delayFx(function () {
          if (!t.dead) hitCircle(t.x, t.y, 125, v.dmg * 1.45, v.hue, v.status);
        }, 700);
      }
    } else if (key === 'halo') {
      hitRing(x, y, 125, 36, v.dmg * .78, v.hue, v.status);
      shieldGain(p, 16, .7);
    } else if (key === 'drill') {
      bullet(p, { d: v.dmg * 1.85, pierce: 24, sp: ST.ps * 2.25, r: 8, life: 1.1 });
      hitLine(x, y, p.angle, 290, 18, v.dmg * .62, v.hue, v.status);
    } else if (key === 'mist') {
      RUN.eclouds.push({ x: x, y: y, r: 175, t: 4, friendly: true });

      enemiesNear(x, y, 185).forEach(function (e) {
        e.slowT = Math.max(e.slowT, 2.5);
        applyStatus(e, v.status, v.dmg);
      });
    } else if (key === 'crescent') {
      fan(p, 12, 1.15, { d: v.dmg * .68, pierce: 4, sp: ST.ps * 1.2 });
      hitCone(p, 235, 1.1, v.dmg * .52, v.hue, v.status);
    } else if (key === 'beacon') {
      well(x, y, 5, 1);
      zone(x, y, 95, 5);
      hitCircle(x, y, 110, v.dmg * .55, v.hue, v.status);
    } else if (key === 'crash') {
      const ox = x, oy = y;
      dashMove(p, 185, .78);
      hitCircle(ox, oy, 95, v.dmg * .85, v.hue, v.status);
      hitCircle(p.x, p.y, 95, v.dmg * .85, v.hue, v.status);
    } else if (key === 'spiral') {
      for (let i = 0; i < 12; i++) {
        const a = p.angle + (i - 6) * .14;
        bullet(p, { a: a, d: v.dmg * .62, pierce: 3, sp: ST.ps * (.78 + i * .06), life: 1.4 });
      }

      hitRing(x, y, 145, 30, v.dmg * .55, v.hue, v.status);
    } else if (key === 'cleave') {
      hitCone(p, 185, 1.35, v.dmg * 1.38, v.hue, 'stun');
      RUN.shake = Math.max(RUN.shake, 10);
    } else {
      hitCircle(x, y, 165, v.dmg, v.hue, v.status);
    }

    delayFx(function () {
      shapeHit(p, v);
    }, 220 + (v.seed % 420));
  }

  useActive = function (p) {
    if (!p || p.downed || p.activeCd > 0) return;

    const c = getChoice(p);

    p.activeCd = ST.activeCd;
    SFX.active();
    RUN.shake = Math.max(RUN.shake, 9);

    const name = String((c && c.name) || 'ABILITY').toUpperCase();
    banner(name, 1200);
    fxRing(p.x, p.y, RUN.hue, 175, 10, .55);

    if (RUN.isOnline && NET.isHost && RUN.fxQueue) {
      RUN.fxQueue.push({ k: 'shake', v: 10 });
      RUN.fxQueue.push({ k: 'banner', text: name });
    }

    try {
      const n = elemNum(p);
      const slot = getSlot(p);

      if (slot === 0 && n && MAIN_ACTIVE[n]) {
        MAIN_ACTIVE[n](p);
      } else {
        runSignature(p, c);
      }
    } catch (err) {
      console.error('Ability error', err);
    }
  };

  tryDash = function (p) {
    if (oldTryDash) oldTryDash(p);
    if (!RUN || !p) return;

    const n = elemNum(p);

    if (n === 3) {
      for (let i = 1; i <= 4; i++) {
        const x = p.x - Math.cos(p.angle) * i * 42;
        const y = p.y - Math.sin(p.angle) * i * 42;
        delayFx(function () { hitCircle(x, y, 82, ST.dmg * .85, 30, 'burn'); }, i * 80);
      }
    }

    if (n === 58) {
      for (let i = 1; i <= 3; i++) {
        const x = p.x - Math.cos(p.angle) * i * 32;
        const y = p.y - Math.sin(p.angle) * i * 32;

        delayFx(function () {
          burst(x, y, 55);
          enemiesNear(x, y, 72).forEach(function (e) {
            dmgEnemy(e, ST.dmg * .48);
          });
        }, i * 70);
      }
    }

    if (n === 80) {
      ringShot(p, 8, { d: ST.dmg * .45, poison: true, life: 1.2 });
    }

    if (n === 107) {
      hitCircle(p.x, p.y, 125, ST.dmg * (1 + Math.hypot(p.dvx || 0, p.dvy || 0) / 800), 20, 'stun');
    }
  };

  updPlayer = function (p, dt) {
    if (oldUpdPlayer) oldUpdPlayer(p, dt);
    if (!RUN || !p || p.downed) return;

    const n = elemNum(p);

    if (n === 70) {
      const mi = movementInput(p);
      if (!(mi.dx || mi.dy)) p._charge = Math.min(14, (p._charge || 0) + dt * 2.2);
      else p._charge = Math.max(0, (p._charge || 0) - dt * 5);
    }

    if (n === 61 || n === 84 || n === 88 || n === 106) {
      p._auraT = (p._auraT || 0) - dt;

      if (p._auraT <= 0) {
        p._auraT = .5;

        enemiesNear(p.x, p.y, 108).forEach(function (e) {
          dmgEnemy(e, ST.dmg * .18, { quiet: true });
        });
      }
    }
  };
})();
`;

try {
  insertBeforeClosing(
    DATA_FILE,
    DATA_PATCH,
    '__ISO_ABILITY_3CHOICE_DATA__',
    ['__ISO_ABILITY_FIX_DATA__', '__ISO_ABILITY_3CHOICE_DATA__']
  );

  patchNet(NET_FILE);

  patchGame(
    GAME_FILE,
    GAME_PATCH,
    '__ISO_ABILITY_3CHOICE_GAME__',
    ['__ISO_ABILITY_FIX_GAME__', '__ISO_ABILITY_3CHOICE_GAME__']
  );

  insertBeforeClosing(
    UI_FILE,
    UI_PATCH,
    '__ISO_ABILITY_3CHOICE_UI__',
    ['__ISO_ABILITY_3CHOICE_UI__']
  );

  console.log('Done.');
  console.log('Each element/compound now has 3 selectable abilities.');
  console.log('Slot 1 is the supposed main ability. Slots 2 and 3 are signature choices.');
} catch (err) {
  console.error('Patch failed:', err.message);
  process.exit(1);
}