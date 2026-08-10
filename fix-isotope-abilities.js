'use strict';

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'data.js');
const GAME_FILE = path.join(process.cwd(), 'game.js');

function backup(file) {
    const bak = file + '.bak';
    if (!fs.existsSync(bak)) {
        fs.copyFileSync(file, bak);
        console.log('Backup created:', bak);
    }
}

function insertBeforeClosing(file, core, marker) {
    let src = fs.readFileSync(file, 'utf8');

    if (src.includes(marker)) {
        console.log('Already patched, skipping:', file);
        return;
    }

    backup(file);

    const idx = src.lastIndexOf('})();');
    if (idx === -1) {
        throw new Error('Could not find closing IIFE in ' + file);
    }

    src = src.slice(0, idx) + '\n' + core + '\n' + src.slice(idx);
    fs.writeFileSync(file, src);
    console.log('Patched:', file);
}

const DATA_FIX = `
/* __ISO_ABILITY_FIX_DATA__ */
(function () {
  if (window.__ISO_ABILITY_FIX_DATA__) return;
  window.__ISO_ABILITY_FIX_DATA__ = true;

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

  Object.values(ELEMS).forEach(function (e) {
    const c = CLEAN[String(e.n)];
    if (!c) return;

    const sig = signatureFor(e);
    e.act = Object.assign({}, sig, {
      name: c.name,
      desc: c.desc,
      key: 'custom_' + e.n
    });
  });

  if (window.DATA) DATA.CUSTOM_ABILITIES_CLEAN = CLEAN;
})();
`;

const GAME_FIX = `
/* __ISO_ABILITY_FIX_GAME__ */
(function () {
  if (window.__ISO_ABILITY_FIX_GAME__) return;
  window.__ISO_ABILITY_FIX_GAME__ = true;

  const oldUseActive = useActive;
  const oldFire = fire;
  const oldApplyElemHit = applyElemHit;
  const oldTryDash = tryDash;
  const oldUpdPlayer = updPlayer;

  function num(p) {
    const el = (p && p.elem) || (window.RUN && RUN.el);
    return el && !el.mol ? +el.n : 0;
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

  function ring(p, n, o) {
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

  function delay(fn, ms) {
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

  function shield(p, amt, ifr) {
    if (!RUN || !p) return;
    p.sh = Math.min(ST.shieldMax + amt, p.sh + amt);
    if (ifr) p.iframes = Math.max(p.iframes, ifr);
    ringFx(p.x, p.y, 190, 90);
  }

  function heal(p, amt) {
    if (!RUN || !p) return;
    p.hp = Math.min(ST.hp, p.hp + amt);
  }

  function dash(p, dist, ifr) {
    if (!RUN || !p) return;
    const ox = p.x, oy = p.y;
    p.x = clamp(p.x + Math.cos(p.angle) * dist, 20, W - 20);
    p.y = clamp(p.y + Math.sin(p.angle) * dist, 20, H - 20);
    p.iframes = Math.max(p.iframes, ifr || .5);
    ringFx(ox, oy, RUN.hue, 80);
    ringFx(p.x, p.y, RUN.hue, 110);
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

  const ACTIVE = {};

  ACTIVE[1] = function (p) {
    bullet(p, { d: ST.dmg * 2.4, sp: ST.ps * 1.2, acc: 900, r: 9, pierce: 6, expl: true, life: 1.8 });
    fan(p, 3, .25, { d: ST.dmg * .7, acc: 520, r: 3, pierce: 1, life: 1.2 });
  };

  ACTIVE[2] = function (p) {
    enemiesNear(p.x, p.y, 340).forEach(function (e) {
      if (!e.boss) {
        e.y = Math.max(20, e.y - 120);
        e.slowT = Math.max(e.slowT, 2.2);
      }
    });
    well(p.x, p.y - 120, 2.4, 2);
    shield(p, 12, .6);
  };

  ACTIVE[3] = function (p) {
    dash(p, 220, .7);
    for (let i = 1; i <= 5; i++) {
      const x = p.x - Math.cos(p.angle) * i * 38;
      const y = p.y - Math.sin(p.angle) * i * 38;
      delay(function () { blast(x, y, 85, ST.dmg * .9, 30); }, i * 80);
    }
  };

  ACTIVE[4] = function (p) {
    bullet(p, { d: ST.dmg * 1.8, sp: ST.ps * 2, r: 3, pierce: 8, life: 1.5 });
    fan(p, 6, .35, { d: ST.dmg * .5, sp: ST.ps * 1.7, r: 2, pierce: 3 });
    p.adrenT = Math.max(p.adrenT, 2.2);
  };

  ACTIVE[5] = function (p) {
    for (let i = 0; i < 7; i++) {
      const a = p.angle + (i - 3) * .17;
      bullet(p, { a: a, sp: ST.ps * .5, d: ST.dmg * .9, r: 7, pierce: 0, life: 2.4, fsplit: true });
    }
    delay(function () {
      ring(p, 14, { d: ST.dmg * .5, r: 4, pierce: 2, sp: ST.ps * .9 });
    }, 450);
  };

  ACTIVE[6] = function (p) {
    p._form = ((p._form || 0) + 1) % 3;
    if (p._form === 0) {
      shield(p, 28, 1.2);
    } else if (p._form === 1) {
      ring(p, 10, { d: ST.dmg * .8, pierce: 3, hom: true });
    } else {
      p.iframes = Math.max(p.iframes, 1.4);
      enemiesNear(p.x, p.y, 220).forEach(function (e) {
        e.slowT = Math.max(e.slowT, 2);
      });
    }
  };

  ACTIVE[7] = function (p) {
    zone(p.x, p.y, 170, 5);
    enemiesNear(p.x, p.y, 260).forEach(function (e) {
      e.slowT = Math.max(e.slowT, 3);
      if (Math.random() < .35) addFreeze(e, .8);
    });
  };

  ACTIVE[8] = function (p) {
    enemiesNear(p.x, p.y, 320).forEach(function (e) {
      e.mark = Math.max(e.mark, 6);
      addBurn(e, ST.dmg * .5, 5);
    });
    zone(p.x, p.y, 150, 4);
  };

  ACTIVE[9] = function (p) {
    fan(p, 8, .5, { d: ST.dmg * .85, pierce: 4, corrode: true });
    enemiesNear(p.x, p.y, 240).forEach(function (e) {
      addCorrode(e, 6, .45);
    });
  };

  ACTIVE[10] = function (p) {
    ring(p, 16, { sp: ST.ps * .4, d: ST.dmg * .6, pierce: 6, life: 2.2, r: 4 });
    delay(function () {
      ring(p, 16, { sp: ST.ps * 1.3, d: ST.dmg * .7, pierce: 4, life: .9 });
    }, 350);
  };

  ACTIVE[11] = function (p) {
    fan(p, 6, .7, { d: ST.dmg * .9, expl: true, r: 6 });
    zone(p.x, p.y, 150, 4);
    enemiesNear(p.x, p.y, 230).forEach(function (e) {
      e.slowT = Math.max(e.slowT, 2);
    });
  };

  ACTIVE[12] = function (p) {
    enemiesNear(p.x, p.y, 360).forEach(function (e) {
      e.stun = Math.max(e.stun, 1.3);
      e.flash = .3;
      if (e.type === 'ghost') {
        e.invuln = false;
        e.phaseT = 2.5;
      }
    });
    blast(p.x, p.y, 280, ST.dmg * 1.1, 55);
  };

  ACTIVE[13] = function (p) {
    fan(p, 22, .9, { d: ST.dmg * .45, sp: ST.ps * 1.3, r: 3, pierce: 1 });
    p.puRate = Math.max(p.puRate || 1, 1.6);
    p.puTimer = Math.max(p.puTimer || 0, 3);
  };

  ACTIVE[14] = function (p) {
    well(p.x, p.y, 4, 1);
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * TAU;
      const x = p.x + Math.cos(a) * 130;
      const y = p.y + Math.sin(a) * 130;
      zone(x, y, 70, 4);
      delay(function () {
        const t = nearestEnemy(x, y);
        if (t) arcChain(t, ST.dmg * 1.3, 4, 200);
      }, i * 180);
    }
  };

  ACTIVE[15] = function (p) {
    fan(p, 10, .8, { d: ST.dmg * .7, burn: true, life: 2 });
    for (let i = 1; i <= 5; i++) {
      const x = p.x + Math.cos(p.angle) * i * 45;
      const y = p.y + Math.sin(p.angle) * i * 45;
      delay(function () { zone(x, y, 65, 3); }, i * 90);
    }
  };

  ACTIVE[16] = function (p) {
    zone(p.x, p.y, 200, 6);
    enemiesNear(p.x, p.y, 220).forEach(function (e) {
      addPoison(e, ST.dmg * .6, 5);
    });
  };

  ACTIVE[17] = function (p) {
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU;
      const x = p.x + Math.cos(a) * 120;
      const y = p.y + Math.sin(a) * 120;
      delay(function () { zone(x, y, 95, 4); }, i * 70);
    }
    enemiesNear(p.x, p.y, 240).forEach(function (e) {
      addPoison(e, ST.dmg * .4, 5);
    });
  };

  ACTIVE[18] = function (p) {
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
  };

  ACTIVE[19] = function (p) {
    for (let i = 0; i < 12; i++) {
      delay(function () {
        bullet(p, { a: p.angle + rnd(-.5, .5), d: ST.dmg * .6, sp: ST.ps * 1.2 });
        if (Math.random() < .4) blast(p.x, p.y, 70, ST.dmg * .5, 20);
      }, i * 70);
    }
  };

  ACTIVE[20] = function (p) {
    shield(p, 30, 1);
    fan(p, 9, 1.2, { sp: ST.ps * .5, d: ST.dmg * .8, r: 7, pierce: 0, life: 2.2, fsplit: true });
  };

  ACTIVE[21] = function (p) {
    p.puDamage = 1.35;
    p.puTimer = 6;
    shield(p, 20, .8);
    RUN.bullets.forEach(function (b) { b.dmg *= 1.08; });
  };

  ACTIVE[22] = function (p) {
    p.iframes = Math.max(p.iframes, 2);
    p.adrenT = Math.max(p.adrenT, 2.5);
    dash(p, 240, 1.2);
    blast(p.x, p.y, 180, ST.dmg * 1.7, 20);
  };

  ACTIVE[23] = function (p) {
    const s = Math.min(24, p.store || 0);
    p.store = 0;
    bullet(p, { d: ST.dmg * (2 + s * .2), sp: ST.ps * 2.4, r: 10 + s * .3, pierce: 16, life: 1.4, burn: true });
  };

  ACTIVE[24] = function (p) {
    convertShots(p, 280);
    shield(p, 18, .9);
    ring(p, 10, { d: ST.dmg * .5, pierce: 3, sp: ST.ps * 1.2 });
  };

  ACTIVE[25] = function (p) {
    enemiesNear(p.x, p.y, 340).forEach(function (e) {
      e.mark = Math.max(e.mark, 6);
      addPoison(e, ST.dmg * .35, 4);
      addBurn(e, ST.dmg * .35, 4);
    });
  };

  ACTIVE[26] = function (p) {
    well(p.x, p.y, 2.8, 3);
    enemiesNear(p.x, p.y, 400).forEach(function (e) {
      if (!e.boss) {
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        e.x += Math.cos(a) * 180;
        e.y += Math.sin(a) * 180;
      }
    });
  };

  ACTIVE[27] = function (p) {
    const s = Math.min(20, p.store || 0);
    p.store = 0;
    bullet(p, { d: ST.dmg * (3.6 + s * .2), sp: ST.ps * 2.8, r: 11, pierce: 25, life: 1.3, burn: true });
  };

  ACTIVE[28] = function (p) {
    shield(p, 26, 1.2);
    convertShots(p, 260);
    well(p.x, p.y, 2, 1);
  };

  ACTIVE[29] = function (p) {
    fan(p, 7, .4, { d: ST.dmg * .7, hom: true, pierce: 2, chainOnHit: true });
    delay(function () {
      const t = nearestEnemy(p.x, p.y);
      if (t) arcChain(t, ST.dmg * 1.6, 6, 200);
    }, 200);
  };

  ACTIVE[30] = function (p) {
    shield(p, 40, 1.4);
    delay(function () {
      heal(p, 26);
      blast(p.x, p.y, 160, ST.dmg * 1.2, 140);
    }, 1200);
  };

  ACTIVE[31] = function (p) {
    fan(p, 14, .9, { sp: ST.ps * .7, d: ST.dmg * .6, burn: true, life: 1.8 });
    zone(p.x, p.y, 130, 4);
    p.holdT = Math.min(3, (p.holdT || 0) + 1);
  };

  ACTIVE[32] = function (p) {
    p._semi = (p._semi || 0) ? 0 : 1;
    if (p._semi) {
      shield(p, 22, 1);
    } else {
      ring(p, 12, { d: ST.dmg * .6, pierce: 3 });
      const t = nearestEnemy(p.x, p.y);
      if (t) arcChain(t, ST.dmg * 1.4, 5, 200);
    }
  };

  ACTIVE[33] = function (p) {
    fan(p, 12, .4, { d: ST.dmg * .45, poison: true, pierce: 2 });
    enemiesNear(p.x, p.y, 260).forEach(function (e) {
      addPoison(e, ST.dmg * .55, 6);
    });
  };

  ACTIVE[34] = function (p) {
    p.puCrit = 1;
    p.puTimer = 5;
    p.puDamage = 1.25;
    bullet(p, { d: ST.dmg * 2.2, sp: ST.ps * 2.2, pierce: 10, life: 1.2 });
    enemiesNear(p.x, p.y, 320).forEach(function (e) {
      e.flash = .3;
      if (e.type === 'ghost') {
        e.invuln = false;
        e.phaseT = 2.5;
      }
    });
  };

  ACTIVE[35] = function (p) {
    for (let i = 0; i < 6; i++) {
      const a = p.angle + (i - 2.5) * .2;
      bullet(p, { a: a, sp: ST.ps * .8, d: ST.dmg * .7, corrode: true, r: 7, life: 1.8, expl: true, lag: true });
    }
    zone(p.x + Math.cos(p.angle) * 120, p.y + Math.sin(p.angle) * 120, 100, 4);
  };

  ACTIVE[36] = function (p) {
    bullet(p, { d: ST.dmg * 2.8, sp: ST.ps * 2.7, r: 7, pierce: 22, life: 1.2 });
    enemiesNear(p.x, p.y, 360).forEach(function (e) {
      e.flash = .3;
      e.mark = Math.max(e.mark, 3);
      if (e.type === 'ghost') {
        e.invuln = false;
        e.phaseT = 2.5;
      }
    });
  };

  ACTIVE[37] = function (p) {
    p.instab = (p.instab || 0) + 6;
    if (p.instab >= 6) {
      p.instab = 0;
      blast(p.x, p.y, 240, ST.dmg * 2.6, 280);
    } else {
      fan(p, 8, .6, { d: ST.dmg * .6, expl: true });
    }
  };

  ACTIVE[38] = function (p) {
    enemiesNear(p.x, p.y, 420).forEach(function (e) {
      e.mark = Math.max(e.mark, 7);
      e.flash = .25;
    });
    blast(p.x, p.y, 300, ST.dmg * .9, 0);
  };

  ACTIVE[39] = function (p) {
    for (let i = 0; i < 8; i++) {
      const t = nearestEnemy(p.x, p.y);
      const a = t ? Math.atan2(t.y - p.y, t.x - p.x) : i / 8 * TAU;
      bullet(p, { a: a, d: ST.dmg * .55, hom: true, life: 2, pierce: 1 });
    }
  };

  ACTIVE[40] = function (p) {
    shield(p, 24, 1);
    RUN.enemies.forEach(function (e) {
      if (!e.dead && e.burn) e.burn.dps *= 1.5;
    });
    enemiesNear(p.x, p.y, 240).forEach(function (e) {
      addBurn(e, ST.dmg * .5, 5);
    });
  };

  ACTIVE[41] = function (p) {
    p.puRate = 1.9;
    p.puTimer = 6;
    p.puDamage = 1.15;
    ring(p, 10, { d: ST.dmg * .5, pierce: 4, hom: true });
  };

  ACTIVE[42] = function (p) {
    p.holdT = 3;
    p.puDamage = 1.3;
    p.puTimer = 5;
    bullet(p, { d: ST.dmg * 2, sp: ST.ps * 1.4, burn: true, pierce: 5 });
  };

  ACTIVE[43] = function (p) {
    for (let i = 0; i < 9; i++) {
      const o = {
        a: p.angle + rnd(-.6, .6),
        d: ST.dmg * .6,
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
  };

  ACTIVE[44] = function (p) {
    const t = nearestEnemy(p.x, p.y);
    if (!t) return;
    t.mark = Math.max(t.mark, 8);
    addPoison(t, ST.dmg * .7, 5);
    addBurn(t, ST.dmg * .7, 5);
    arcChain(t, ST.dmg * .8, 4, 200);
  };

  ACTIVE[45] = function (p) {
    p.iframes = Math.max(p.iframes, 1.6);
    convertShots(p, 300);
    enemiesNear(p.x, p.y, 260).forEach(function (e) {
      dmgEnemy(e, ST.dmg * .9);
    });
  };

  ACTIVE[46] = function (p) {
    const s = Math.min(30, p.store || 0);
    p.store = 0;
    blast(p.x, p.y, 200 + s * 6, ST.dmg * (2 + s * .25), 200);
    fan(p, 6, .5, { d: ST.dmg * .7, acc: 600, expl: true });
  };

  ACTIVE[47] = function (p) {
    for (let i = 0; i < 16; i++) {
      bullet(p, { a: rnd(TAU), sp: ST.ps * 1.6, d: ST.dmg * .55, r: 3, pierce: 2, life: 1.5 });
    }
    delay(function () {
      for (let i = 0; i < 12; i++) {
        bullet(p, { a: Math.PI / 2 + rnd(-.2, .2), sp: ST.ps * 1.8, d: ST.dmg * .7, pierce: 3 });
      }
    }, 300);
  };

  ACTIVE[48] = function (p) {
    shield(p, 18, .8);
    enemiesNear(p.x, p.y, 300).forEach(function (e) {
      addPoison(e, ST.dmg * .75, 6);
    });
    fan(p, 8, .5, { d: ST.dmg * .5, poison: true });
  };

  ACTIVE[49] = function (p) {
    fan(p, 10, .7, { d: ST.dmg * .75, hom: true, sp: ST.ps * .9, life: 2, pierce: 3, corrode: true });
  };

  ACTIVE[50] = function (p) {
    for (let i = 0; i < 6; i++) {
      bullet(p, { a: i / 6 * TAU, d: ST.dmg * .6, hom: true, life: 2.4, pierce: 2 });
    }
    delay(function () {
      for (let i = 0; i < 6; i++) {
        bullet(p, { a: i / 6 * TAU, d: ST.dmg * .5, hom: true, life: 2 });
      }
    }, 700);
  };

  ACTIVE[51] = function (p) {
    for (let i = 0; i < 5; i++) {
      const a = p.angle + (i - 2) * .35;
      const x = p.x + Math.cos(a) * 95;
      const y = p.y + Math.sin(a) * 95;

      delay(function () {
        blast(x, y, 100, ST.dmg * 1.2, 310);
        for (let k = 0; k < 8; k++) {
          const aa = k / 8 * TAU;
          RUN.bullets.push({
            x: x,
            y: y,
            vx: Math.cos(aa) * ST.ps * .9,
            vy: Math.sin(aa) * ST.ps * .9,
            dmg: ST.dmg * .4,
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

  ACTIVE[52] = function (p) {
    enemiesNear(p.x, p.y, 380).forEach(function (e) {
      addPoison(e, ST.dmg * .6, 6);
    });
    zone(p.x, p.y, 130, 4);
  };

  ACTIVE[53] = function (p) {
    zone(p.x, p.y, 180, 5);
    enemiesNear(p.x, p.y, 420).forEach(function (e) {
      e.mark = Math.max(e.mark, 6);
      e.flash = .2;
      if (e.type === 'ghost') {
        e.invuln = false;
        e.phaseT = 2.5;
      }
    });
  };

  ACTIVE[54] = function (p) {
    enemiesNear(p.x, p.y, 400).forEach(function (e) {
      e.stun = Math.max(e.stun, 1.5);
      if (!e.boss && e.hp < e.maxhp * .35) addFreeze(e, 1.2);
    });
    blast(p.x, p.y, 320, ST.dmg * 1.1, 220);
  };

  ACTIVE[55] = function (p) {
    p._timeStacks = (p._timeStacks || 0) + 1;
    p.puRate = 1.5 + Math.min(1.5, p._timeStacks * .2);
    p.puTimer = 6;
    delay(function () {
      blast(p.x, p.y, 200, ST.dmg * (1 + p._timeStacks * .3), 280);
    }, 900);
  };

  ACTIVE[56] = function (p) {
    fan(p, 5, .4, { d: ST.dmg * 1.3, sp: ST.ps * .7, r: 8, pull: true, pierce: 3 });
    well(p.x + Math.cos(p.angle) * 160, p.y + Math.sin(p.angle) * 160, 2.2, 2);
  };

  ACTIVE[57] = function (p) {
    const r = Math.floor(rnd(6));
    if (r === 0) fan(p, 8, .5, { d: ST.dmg * .8, burn: true });
    else if (r === 1) ring(p, 10, { d: ST.dmg * .7, poison: true });
    else if (r === 2) well(p.x, p.y, 2, 2);
    else if (r === 3) blast(p.x, p.y, 180, ST.dmg * 1.6, RUN.hue);
    else if (r === 4) {
      const t = nearestEnemy(p.x, p.y);
      if (t) arcChain(t, ST.dmg * 1.5, 5, 200);
    } else {
      shield(p, 20, 1);
    }
  };

  ACTIVE[58] = function (p) {
    dash(p, 160, .5);
    for (let i = 1; i <= 6; i++) {
      const x = p.x - Math.cos(p.angle) * i * 35;
      const y = p.y - Math.sin(p.angle) * i * 35;
      delay(function () {
        burst(x, y, 55);
        enemiesNear(x, y, 80).forEach(function (e) {
          dmgEnemy(e, ST.dmg * .6);
        });
      }, i * 70);
    }
  };

  ACTIVE[59] = function (p) {
    fan(p, 12, .9, { d: ST.dmg * .55, hom: true, sp: ST.ps * .8, life: 2, pierce: 2, pull: true });
  };

  ACTIVE[60] = function (p) {
    well(p.x, p.y, 3.2, 4);
    enemiesNear(p.x, p.y, 520).forEach(function (e) {
      if (!e.boss) {
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        e.x += Math.cos(a) * 260;
        e.y += Math.sin(a) * 260;
      }
    });
    convertShots(p, 400);
  };

  ACTIVE[61] = function (p) {
    zone(p.x, p.y, 120, 7);
    well(p.x, p.y, 3, 1);
    enemiesNear(p.x, p.y, 180).forEach(function (e) {
      addPoison(e, ST.dmg * .5, 6);
    });
  };

  ACTIVE[62] = function (p) {
    for (let i = 0; i < 4; i++) {
      const x = p.x + rnd(-120, 120);
      const y = p.y + rnd(-120, 120);
      well(x, y, 1.8, 1);
      delay(function () {
        blast(x, y, 130, ST.dmg * 1.6, 260);
      }, 900 + i * 120);
    }
  };

  ACTIVE[63] = function (p) {
    enemiesNear(p.x, p.y, 460).forEach(function (e) {
      e.mark = Math.max(e.mark, 8);
      e.flash = .3;
    });
    ring(p, 12, { d: ST.dmg * .5, poison: true });
  };

  ACTIVE[64] = function (p) {
    shield(p, 30, 1.2);
    convertShots(p, 240);
    p.puArmor = .4;
    p.puTimer = 6;
  };

  ACTIVE[65] = function (p) {
    enemiesNear(p.x, p.y, 360).forEach(function (e) {
      e.stun = Math.max(e.stun, 1.6);
      e.slowT = Math.max(e.slowT, 3);
    });
    blast(p.x, p.y, 300, ST.dmg * .8, 120);
  };

  ACTIVE[66] = function (p) {
    well(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 2.4, 4);
    enemiesNear(p.x, p.y, 280).forEach(function (e) {
      if (!e.boss) {
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        e.x += Math.cos(a) * 200;
        e.y += Math.sin(a) * 200;
      }
    });
  };

  ACTIVE[67] = function (p) {
    bullet(p, { d: ST.dmg * 3.4, sp: ST.ps * 3, r: 9, pierce: 30, life: 1.1 });
    const x = p.x + Math.cos(p.angle) * 220;
    const y = p.y + Math.sin(p.angle) * 220;
    delay(function () { blast(x, y, 120, ST.dmg * 1.4, 230); }, 220);
  };

  ACTIVE[68] = function (p) {
    bullet(p, { d: ST.dmg * 2.5, sp: ST.ps * 3.2, r: 3, pierce: 30, life: 1 });
    fan(p, 3, .12, { d: ST.dmg * .7, sp: ST.ps * 2.6, r: 2, pierce: 12 });
  };

  ACTIVE[69] = function (p) {
    bullet(p, { d: ST.dmg * 6, sp: ST.ps * .8, r: 12, pierce: 20, life: 1.8, kb: 3 });
  };

  ACTIVE[70] = function (p) {
    const charge = Math.min(12, p._charge || 0);
    p._charge = 0;
    blast(p.x, p.y, 160 + charge * 20, ST.dmg * (1.5 + charge * .3), 50);
  };

  ACTIVE[71] = function (p) {
    p.puCrit = 1;
    p.puTimer = 6;
    p.puDamage = 1.3;
    bullet(p, { d: ST.dmg * 2.4, pierce: 18, r: 4, sp: ST.ps * 2.2 });
  };

  ACTIVE[72] = function (p) {
    if (p.hp < ST.hp * .4) {
      heal(p, ST.hp * .35);
      shield(p, 20, 1);
    } else {
      ring(p, 14, { d: ST.dmg * .8, pierce: 4 });
    }
  };

  ACTIVE[73] = function (p) {
    p.iframes = Math.max(p.iframes, 2.8);
    p.puSpeed = .55;
    p.puTimer = 3;
    blast(p.x, p.y, 160, ST.dmg * 1.2, 220);
  };

  ACTIVE[74] = function (p) {
    bullet(p, { d: ST.dmg * 3.2, sp: ST.ps * .55, r: 13, pierce: 12, life: 2, kb: 4, expl: true });
  };

  ACTIVE[75] = function (p) {
    p.puRate = 1.7;
    p.puDamage = 1.3;
    p.puTimer = 6;
    enemiesNear(p.x, p.y, 280).forEach(function (e) {
      addBurn(e, ST.dmg * .6, 5);
    });
  };

  ACTIVE[76] = function (p) {
    p.iframes = Math.max(p.iframes, 1.5);
    blast(p.x, p.y, 240, ST.dmg * 1.8, 40);
    enemiesNear(p.x, p.y, 260).forEach(function (e) {
      if (!e.boss) {
        e.x += (e.x - p.x) * .2;
        e.y += (e.y - p.y) * .2;
        e.stun = Math.max(e.stun, .6);
      }
    });
  };

  ACTIVE[77] = function (p) {
    for (let i = 0; i < 6; i++) {
      const x = clamp(p.x + rnd(-220, 220), 30, W - 30);
      const y = clamp(p.y + rnd(-220, 220), 30, H - 30);
      delay(function () {
        blast(x, y, 110, ST.dmg * 1.8, 25);
        ringFx(x, y, 25, 120);
      }, i * 150);
    }
  };

  ACTIVE[78] = function (p) {
    enemiesNear(p.x, p.y, 400).forEach(function (e) {
      e.mark = Math.max(e.mark, 7);
      addPoison(e, ST.dmg * .4, 5);
      addBurn(e, ST.dmg * .4, 5);
      e.slowT = Math.max(e.slowT, 2);
    });
  };

  ACTIVE[79] = function (p) {
    enemiesNear(p.x, p.y, 420).forEach(function (e) {
      e.mark = Math.max(e.mark, 6);
      e.coin = (e.coin || 1) + 3;
    });
    RUN.coins += 25;
    SAVE.addCoins(25);
  };

  ACTIVE[80] = function (p) {
    dash(p, 200, 1.1);
    ring(p, 10, { d: ST.dmg * .5, sp: ST.ps * .8, life: 1.6, poison: true });
  };

  ACTIVE[81] = function (p) {
    enemiesNear(p.x, p.y, 380).forEach(function (e) {
      addPoison(e, ST.dmg * .7, 7);
    });
    delay(function () {
      enemiesNear(p.x, p.y, 420).forEach(function (e) {
        if (e.poison) dmgEnemy(e, ST.dmg * 1.6, { quiet: true });
      });
    }, 1300);
  };

  ACTIVE[82] = function (p) {
    shield(p, 35, 1.4);
    fan(p, 9, 1.1, { sp: ST.ps * .35, d: ST.dmg * .8, r: 8, pierce: 0, life: 2.4 });
    zone(p.x, p.y, 110, 3);
  };

  ACTIVE[83] = function (p) {
    for (let w = 0; w < 3; w++) {
      delay(function () {
        ring(p, 8 + w * 4, { d: ST.dmg * .45, r: 4, pierce: 2, sp: ST.ps * (.7 + w * .25) });
      }, w * 220);
    }
  };

  ACTIVE[84] = function (p) {
    enemiesNear(p.x, p.y, 360).forEach(function (e) {
      addPoison(e, ST.dmg * .65, 6);
      e.mark = Math.max(e.mark, 4);
    });
    zone(p.x, p.y, 120, 5);
  };

  ACTIVE[85] = function (p) {
    enemiesNear(p.x, p.y, 380).forEach(function (e) {
      addPoison(e, ST.dmg * 1.1, 3);
      addCorrode(e, 4, .45);
    });
  };

  ACTIVE[86] = function (p) {
    zone(p.x, p.y, 190, 6);
    enemiesNear(p.x, p.y, 220).forEach(function (e) {
      addPoison(e, ST.dmg * .5, 6);
    });
  };

  ACTIVE[87] = function (p) {
    p._critStacks = (p._critStacks || 0) + 3;
    fan(p, 10, .7, { d: ST.dmg * .7, expl: true, crit: true });
    if (p._critStacks >= 9) {
      p._critStacks = 0;
      blast(p.x, p.y, 300, ST.dmg * 3, 320);
    }
  };

  ACTIVE[88] = function (p) {
    zone(p.x, p.y, 160, 6);
    enemiesNear(p.x, p.y, 220).forEach(function (e) {
      addPoison(e, ST.dmg * .4, 6);
    });
    delay(function () {
      blast(p.x, p.y, 220, ST.dmg * 1.4, 60);
    }, 700);
  };

  ACTIVE[89] = function (p) {
    const s = Math.min(20, p.store || 0);
    p.store = 0;
    bullet(p, { d: ST.dmg * (2.2 + s * .2), sp: ST.ps * 2.5, r: 10, pierce: 20, burn: true, poison: true });
  };

  ACTIVE[90] = function (p) {
    bullet(p, { d: ST.dmg * 3, sp: ST.ps * .7, r: 12, pierce: 10, life: 2, poison: true, expl: true });
    const x = p.x + Math.cos(p.angle) * 180;
    const y = p.y + Math.sin(p.angle) * 180;
    delay(function () { zone(x, y, 110, 5); }, 400);
  };

  ACTIVE[91] = function (p) {
    const t = nearestEnemy(p.x, p.y);
    if (!t) return;
    arcChain(t, ST.dmg * 1.8, 7, 120);
    addPoison(t, ST.dmg * .7, 5);
    addBurn(t, ST.dmg * .5, 5);
  };

  ACTIVE[92] = function (p) {
    fan(p, 7, .5, { d: ST.dmg * .9, fsplit: true, pierce: 3, life: 1.6 });
    delay(function () {
      ring(p, 10, { d: ST.dmg * .4, fsplit: true });
    }, 350);
  };

  ACTIVE[93] = function (p) {
    bullet(p, { d: ST.dmg * 2.6, sp: ST.ps * 2.2, pierce: 30, r: 6, poison: true, life: 1.6 });
    fan(p, 3, .2, { d: ST.dmg * .8, pierce: 12, poison: true });
  };

  ACTIVE[94] = function (p) {
    const s = Math.min(20, RUN.cm || 0);
    RUN.cm = 0;
    blast(p.x, p.y, 180 + s * 10, ST.dmg * (2 + s * .25), 300);
    ring(p, 12, { d: ST.dmg * .6, expl: true });
  };

  ACTIVE[95] = function (p) {
    enemiesNear(p.x, p.y, 520).forEach(function (e) {
      e.mark = Math.max(e.mark, 8);
      e.flash = .25;
      e.invuln = false;
    });
    zone(p.x, p.y, 180, 4);
  };

  ACTIVE[96] = function (p) {
    const t = nearestEnemy(p.x, p.y);
    if (t) {
      t.heat = (t.heat || 0) + 3;
      arcChain(t, ST.dmg * 1.2, 3, 30);
      addBurn(t, ST.dmg * .8, 6);
    }
    bullet(p, { d: ST.dmg * 1.8, pierce: 20, sp: ST.ps * 2.6, burn: true });
  };

  ACTIVE[97] = function (p) {
    const x = clamp(p.x + Math.cos(p.angle) * 180, 30, W - 30);
    const y = clamp(p.y + Math.sin(p.angle) * 180, 30, H - 30);
    zone(x, y, 90, 3);
    delay(function () {
      blast(x, y, 180, ST.dmg * 2.6, 120);
      zone(x, y, 130, 5);
    }, 900);
  };

  ACTIVE[98] = function (p) {
    fan(p, 8, .35, { d: ST.dmg * 1.7, sp: ST.ps * 1.8, pierce: 20, r: 7, life: 1.4 });
  };

  ACTIVE[99] = function (p) {
    enemiesNear(p.x, p.y, 420).forEach(function (e) {
      e.conf = Math.max(e.conf, 2.5);
      e.slowT = Math.max(e.slowT, 2.5);
    });
  };

  ACTIVE[100] = function (p) {
    fan(p, 9, .6, { d: ST.dmg * .9, collapse: true, life: 1.1, pierce: 2 });
    const x = p.x + Math.cos(p.angle) * 180;
    const y = p.y + Math.sin(p.angle) * 180;
    delay(function () { blast(x, y, 150, ST.dmg * 1.8, 280); }, 700);
  };

  ACTIVE[101] = function (p) {
    RUN.bloodlustStacks = Math.min(20, (RUN.bloodlustStacks || 0) + 8);
    p.puDamage = 1.4;
    p.puTimer = 6;
    ring(p, 12, { d: ST.dmg * .7, pierce: 3 });
  };

  ACTIVE[102] = function (p) {
    zone(p.x, p.y, 210, 5);
    enemiesNear(p.x, p.y, 240).forEach(function (e) {
      e.slowT = Math.max(e.slowT, 3);
      e.corrode = 0;
      e.mark = 0;
      dmgEnemy(e, ST.dmg * .9);
    });
  };

  ACTIVE[103] = function (p) {
    bullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 3.4, r: 2, pierce: 40, life: .9 });
  };

  ACTIVE[104] = function (p) {
    bullet(p, { d: ST.dmg * 2.2, sp: ST.ps * .6, r: 11, pierce: 8, kb: 4, life: 1.8 });
  };

  ACTIVE[105] = function (p) {
    fan(p, 9, .7, { d: ST.dmg * .7, fsplit: true, pierce: 2, life: 1.4 });
    delay(function () {
      ring(p, 8, { d: ST.dmg * .4, fsplit: true });
    }, 300);
  };

  ACTIVE[106] = function (p) {
    well(p.x, p.y, 5, 2);
    zone(p.x, p.y, 140, 6);
    delay(function () {
      blast(p.x, p.y, 180, ST.dmg * 1.6, 320);
    }, 1200);
  };

  ACTIVE[107] = function (p) {
    const spd = Math.hypot(p.dvx || 0, p.dvy || 0) + ST.spd;
    dash(p, 180, .7);
    blast(p.x, p.y, 140 + spd * .08, ST.dmg * (1.2 + spd / 900), 20);
  };

  ACTIVE[108] = function (p) {
    fan(p, 6, .4, { d: ST.dmg * 1.4, sp: ST.ps * .75, r: 9, pull: true, pierce: 4 });
    well(p.x + Math.cos(p.angle) * 150, p.y + Math.sin(p.angle) * 150, 2.4, 2);
  };

  ACTIVE[109] = function (p) {
    const r = Math.floor(rnd(6));
    if (r === 0) fan(p, 10, .7, { d: ST.dmg * .7, expl: true });
    else if (r === 1) ring(p, 12, { d: ST.dmg * .6, poison: true });
    else if (r === 2) well(p.x, p.y, 2.2, 2);
    else if (r === 3) blast(p.x, p.y, 200, ST.dmg * 1.7, RUN.hue);
    else if (r === 4) {
      const t = nearestEnemy(p.x, p.y);
      if (t) arcChain(t, ST.dmg * 1.6, 6, 200);
    } else {
      shield(p, 22, 1);
    }
  };

  ACTIVE[110] = function (p) {
    bullet(p, { d: ST.dmg * 7, sp: ST.ps * .5, r: 6, pierce: 25, life: 2, kb: 2 });
  };

  ACTIVE[111] = function (p) {
    enemiesNear(p.x, p.y, 700).forEach(function (e) {
      e.mark = Math.max(e.mark, 8);
      e.flash = .2;
      e.invuln = false;
    });
    p.puCrit = 1;
    p.puTimer = 5;
  };

  ACTIVE[112] = function (p) {
    dash(p, 240, 2.2);
    ring(p, 10, { d: ST.dmg * .5, pierce: 5, life: .9 });
  };

  ACTIVE[113] = function (p) {
    const t = nearestEnemy(p.x, p.y);
    if (!t) return;
    t.mark = Math.max(t.mark, 8);
    delay(function () {
      if (!t.dead) {
        blast(t.x, t.y, 130, ST.dmg * 1.8, 320);
        enemiesNear(t.x, t.y, 160).forEach(function (o) {
          addPoison(o, ST.dmg * .5, 4);
        });
      }
    }, 800);
  };

  ACTIVE[114] = function (p) {
    bullet(p, { d: ST.dmg * 4.2, sp: ST.ps * .7, r: 12, pierce: 18, kb: 3, life: 2 });
    shield(p, 14, .8);
  };

  ACTIVE[115] = function (p) {
    const cost = Math.min(ST.hp * .25, Math.max(0, p.hp - 1));
    if (cost > 0) {
      p.hp -= cost;
      blast(p.x, p.y, 220, ST.dmg * (2 + cost / 20), 340);
      ring(p, 14, { d: ST.dmg * .8, expl: true });
    } else {
      blast(p.x, p.y, 120, ST.dmg, 340);
    }
  };

  ACTIVE[116] = function (p) {
    fan(p, 10, .8, { d: ST.dmg * .6, poison: true, corrode: true, r: 8, life: 2 });
    zone(p.x, p.y, 120, 5);
  };

  ACTIVE[117] = function (p) {
    enemiesNear(p.x, p.y, 380).forEach(function (e) {
      addPoison(e, ST.dmg * .8, 6);
    });
    delay(function () {
      enemiesNear(p.x, p.y, 420).forEach(function (e) {
        if (e.poison) blast(e.x, e.y, 80, ST.dmg * 1.2, 120);
      });
    }, 900);
  };

  ACTIVE[118] = function (p) {
    const x = clamp(p.x + Math.cos(p.angle) * 220, 30, W - 30);
    const y = clamp(p.y + Math.sin(p.angle) * 220, 30, H - 30);
    well(x, y, 1.8, 4);
    zone(x, y, 120, 2);
    delay(function () {
      blast(x, y, 260, ST.dmg * 3.4, 280);
      well(x, y, 1, 2);
    }, 1500);
  };

  function tags(p) {
    if (p._abTags) return p._abTags;

    const el = p.elem || RUN.el;
    const txt = String((el && el.act && el.act.desc) || '').toLowerCase();
    const t = {};

    t.accel = txt.includes('accel');
    t.float = txt.includes('float') || txt.includes('light');
    t.pierce = txt.includes('pierce') || txt.includes('piercing');
    t.poison = txt.includes('poison') || txt.includes('toxic') || txt.includes('contam') || txt.includes('gas') || txt.includes('sludge');
    t.burn = txt.includes('burn') || txt.includes('fire') || txt.includes('flame') || txt.includes('combust') || txt.includes('heat');
    t.corrode = txt.includes('corros') || txt.includes('acid') || txt.includes('melt');
    t.mark = txt.includes('mark') || txt.includes('reveal') || txt.includes('detect') || txt.includes('flare') || txt.includes('vision');
    t.magnet = txt.includes('magnet') || txt.includes('pull') || txt.includes('gravity');
    t.split = txt.includes('split') || txt.includes('fission') || txt.includes('decay');
    t.chain = txt.includes('chain') || txt.includes('conduct') || txt.includes('electric');
    t.explode = txt.includes('explode') || txt.includes('explosion') || txt.includes('blast') || txt.includes('detonat') || txt.includes('reaction');
    t.slow = txt.includes('slow') || txt.includes('freeze') || txt.includes('cryo') || txt.includes('cold');
    t.crit = txt.includes('critical') || txt.includes('crit');
    t.heavy = txt.includes('heavy') || txt.includes('dense') || txt.includes('colossal') || txt.includes('gigantic');
    t.fast = txt.includes('fast') || txt.includes('rapid') || txt.includes('swift');
    t.hom = txt.includes('homing') || txt.includes('seek') || txt.includes('drone') || txt.includes('swarm');
    t.beam = txt.includes('beam') || txt.includes('lance') || txt.includes('laser');
    t.wall = txt.includes('wall') || txt.includes('barrier') || txt.includes('shield');
    t.store = txt.includes('store') || txt.includes('battery') || txt.includes('reserve') || txt.includes('charge');
    t.dash = txt.includes('dash');
    t.still = txt.includes('still');
    t.infect = txt.includes('infect');
    t.gold = txt.includes('gold') || txt.includes('coin');
    t.reflect = txt.includes('reflect') || txt.includes('mirror');
    t.phase = txt.includes('intangible') || txt.includes('phase');
    t.rad = txt.includes('radioactive') || txt.includes('radiation');

    p._abTags = t;
    return t;
  }

  function shotMods(p, shots) {
    if (!RUN || !shots || !shots.length) return;

    const n = num(p);
    const T = tags(p);

    shots.forEach(function (b, i) {
      b.dmg *= 1 + ((n * 7 + i) % 7) * 0.01;
    });

    if (T.accel) shots.forEach(function (b) { b.acc = (b.acc || 0) + 420; });
    if (T.float) {
      p.x -= Math.cos(p.angle) * 4;
      p.y -= Math.sin(p.angle) * 4;
      shots.forEach(function (b) { b.r = Math.max(2, b.r - 1); });
    }
    if (T.pierce) shots.forEach(function (b) { b.pierce = (b.pierce || 0) + 1; });
    if (T.poison) shots.forEach(function (b) { b.poison = true; });
    if (T.burn) shots.forEach(function (b) { b.burn = true; });
    if (T.corrode) shots.forEach(function (b) { b.corrode = true; });
    if (T.mark) shots.forEach(function (b) { b.mark = true; });
    if (T.magnet) shots.forEach(function (b) { b.pull = true; });
    if (T.split) shots.forEach(function (b) { b.fsplit = true; });
    if (T.chain) shots.forEach(function (b) { b.chainOnHit = true; });
    if (T.explode) shots.forEach(function (b) { if (Math.random() < .18) b.expl = true; });
    if (T.slow) shots.forEach(function (b) { b.chill = true; });
    if (T.crit) shots.forEach(function (b) {
      if (Math.random() < .12) {
        b.crit = true;
        b.dmg *= ST.critD;
      }
    });
    if (T.heavy) shots.forEach(function (b) {
      b.r += 2;
      b.kb = (b.kb || 0) + 2;
      b.dmg *= 1.1;
    });
    if (T.fast) shots.forEach(function (b) {
      b.vx *= 1.12;
      b.vy *= 1.12;
    });
    if (T.hom) shots.forEach(function (b) { b.hom = true; });
    if (T.beam) shots.forEach(function (b) {
      b.pierce = (b.pierce || 0) + 4;
      b.r = Math.max(2, b.r - 1);
    });
    if (T.wall) shots.forEach(function (b) {
      b.life = Math.max(b.life, 1.8);
      b.pierce = (b.pierce || 0) + 1;
    });

    switch (n) {
      case 1:
        shots.forEach(function (b) {
          b.acc = (b.acc || 0) + 520;
          b.r = Math.max(2, b.r - 1);
        });
        break;
      case 2:
        p.x -= Math.cos(p.angle) * 6;
        p.y -= Math.sin(p.angle) * 6;
        break;
      case 4:
        shots.forEach(function (b) {
          b.r = 3;
          b.vx *= 1.25;
          b.vy *= 1.25;
          b.pierce = (b.pierce || 0) + 1;
        });
        break;
      case 13:
        shots.forEach(function (b) { b.r = 3; });
        break;
      case 15:
        shots.forEach(function (b) {
          b.burn = true;
          b.lag = true;
        });
        break;
      case 19:
        if (Math.random() < .22) blast(p.x, p.y, 60, ST.dmg * .5, 20);
        break;
      case 23:
        p.store = Math.min(24, (p.store || 0) + 1);
        break;
      case 27:
        p.store = Math.min(20, (p.store || 0) + 1);
        break;
      case 29:
        shots.forEach(function (b) { b.chainOnHit = true; });
        break;
      case 33:
        shots.forEach(function (b) { b.poison = true; });
        break;
      case 37:
        p.instab = (p.instab || 0) + 1;
        if (p.instab >= 6) {
          p.instab = 0;
          shots.forEach(function (b) { b.expl = true; });
        }
        break;
      case 42:
        p.holdT = Math.min(3, (p.holdT || 0) + .15);
        break;
      case 43:
        shots.forEach(function (b) {
          if (Math.random() < .3) b.fsplit = true;
        });
        break;
      case 46:
        p.store = Math.min(30, (p.store || 0) + 1);
        break;
      case 52:
        shots.forEach(function (b) { b.poison = true; });
        break;
      case 55:
        p._timeStacks = (p._timeStacks || 0) + .02;
        shots.forEach(function (b) {
          const mul = 1 + p._timeStacks * .05;
          b.vx *= mul;
          b.vy *= mul;
        });
        break;
      case 61:
        shots.forEach(function (b) { b.poison = true; });
        break;
      case 75:
        p.holdT = Math.min(3, (p.holdT || 0) + .1);
        shots.forEach(function (b) { b.burn = true; });
        break;
      case 84:
        shots.forEach(function (b) { b.poison = true; });
        break;
      case 88:
        shots.forEach(function (b) { b.poison = true; });
        break;
      case 89:
        p.store = Math.min(20, (p.store || 0) + 1);
        break;
      case 92:
        shots.forEach(function (b) { b.fsplit = true; });
        break;
      case 94:
        RUN.cm = (RUN.cm || 0) + .1;
        break;
      case 101:
        RUN.bloodlustStacks = Math.min(20, (RUN.bloodlustStacks || 0) + .02);
        break;
      case 109:
        shots.forEach(function (b) {
          const r = Math.random();
          if (r < .25) b.expl = true;
          else if (r < .5) b.poison = true;
          else if (r < .75) b.burn = true;
          else b.fsplit = true;
        });
        break;
      case 115:
        if (p.hp > ST.hp * .35) {
          p.hp -= ST.hp * .001;
          shots.forEach(function (b) { b.dmg *= 1.25; });
        }
        break;
    }
  }

  function hitMods(b, e) {
    if (!RUN || !b || !e || e.dead) return;

    const owner = RUN.players.find(function (q) { return q.id === b.owner; }) || RUN.players[0];
    if (!owner) return;

    const n = num(owner);

    if (b.chainOnHit && !b._abChain) {
      b._abChain = 1;
      arcChain(e, ST.dmg * .5, 3, 200);
    }

    if (b.chill) {
      e.slowT = Math.max(e.slowT, 1.3);
      if (Math.random() < .1) addFreeze(e, .7);
    }

    switch (n) {
      case 8:
        if (e.burn) dmgEnemy(e, ST.dmg * .35, { quiet: true });
        break;
      case 9:
        addCorrode(e, 5, .45);
        if (e.hp < e.maxhp * .7) dmgEnemy(e, ST.dmg * .25, { quiet: true });
        break;
      case 25:
        e.mark = Math.max(e.mark, 4);
        break;
      case 33:
        addPoison(e, ST.dmg * .35, 4);
        break;
      case 37:
        owner.instab = (owner.instab || 0) + 1;
        if (owner.instab >= 6) {
          owner.instab = 0;
          blast(e.x, e.y, 90, ST.dmg * 1.4, 280);
        }
        break;
      case 44:
        e.mark = Math.max(e.mark, 6);
        break;
      case 52:
        addPoison(e, ST.dmg * .4, 4);
        break;
      case 79:
        e.coin = (e.coin || 1) + 1;
        break;
      case 84:
        addPoison(e, ST.dmg * .35, 5);
        break;
      case 96:
        e.heat = (e.heat || 0) + 1;
        if (e.heat >= 3) {
          e.heat = 0;
          dmgEnemy(e, ST.dmg * .8, { quiet: true });
        }
        break;
      case 113:
        e.mark = Math.max(e.mark, 5);
        break;
      case 117:
        if (e.poison && Math.random() < .35) blast(e.x, e.y, 70, ST.dmg * .9, 120);
        break;
    }
  }

  function dashMods(p) {
    if (!RUN || !p) return;
    const n = num(p);

    if (n === 3) {
      for (let i = 1; i <= 4; i++) {
        const x = p.x - Math.cos(p.angle) * i * 42;
        const y = p.y - Math.sin(p.angle) * i * 42;
        delay(function () { blast(x, y, 80, ST.dmg * .8, 30); }, i * 80);
      }
    }

    if (n === 58) {
      for (let i = 1; i <= 3; i++) {
        const x = p.x - Math.cos(p.angle) * i * 32;
        const y = p.y - Math.sin(p.angle) * i * 32;
        delay(function () {
          burst(x, y, 55);
          enemiesNear(x, y, 70).forEach(function (e) {
            dmgEnemy(e, ST.dmg * .45);
          });
        }, i * 70);
      }
    }

    if (n === 80) {
      ring(p, 8, { d: ST.dmg * .4, poison: true, life: 1.2 });
    }

    if (n === 107) {
      blast(p.x, p.y, 120, ST.dmg * (1 + Math.hypot(p.dvx || 0, p.dvy || 0) / 800), 20);
    }
  }

  function updateMods(p, dt) {
    if (!RUN || !p || p.downed) return;
    const n = num(p);

    if (n === 2) {
      p.iframes = Math.max(p.iframes, .02);
    }

    if (n === 61 || n === 84 || n === 88 || n === 106) {
      p._auraT = (p._auraT || 0) - dt;
      if (p._auraT <= 0) {
        p._auraT = .5;
        enemiesNear(p.x, p.y, 105).forEach(function (e) {
          dmgEnemy(e, ST.dmg * .18, { quiet: true });
        });
      }
    }

    if (n === 70) {
      const mi = movementInput(p);
      if (!(mi.dx || mi.dy)) {
        p._charge = Math.min(12, (p._charge || 0) + dt * 2);
      } else {
        p._charge = Math.max(0, (p._charge || 0) - dt * 4);
      }
    }

    if (n === 58) {
      const mi = movementInput(p);
      if (mi.dx || mi.dy) {
        p._sparkT = (p._sparkT || 0) - dt;
        if (p._sparkT <= 0) {
          p._sparkT = .4;
          burst(p.x, p.y, 55);
          const t = nearestEnemy(p.x, p.y);
          if (t && d2(t.x, t.y, p.x, p.y) < 70 * 70) {
            dmgEnemy(t, ST.dmg * .5, { quiet: true });
          }
        }
      }
    }
  }

  useActive = function (p) {
    if (!p || p.downed || p.activeCd > 0) return;

    const n = num(p);
    if (!n || !ACTIVE[n]) {
      if (oldUseActive) return oldUseActive(p);
      return;
    }

    p.activeCd = ST.activeCd;
    SFX.active();
    RUN.shake = Math.max(RUN.shake, 9);

    const el = p.elem || RUN.el;
    const nm = (el && el.act && el.act.name) ? el.act.name : 'ABILITY';
    banner(String(nm).toUpperCase(), 1200);
    ringFx(p.x, p.y, RUN.hue, 150);

    try {
      ACTIVE[n](p);
    } catch (err) {
      console.error('Ability error', n, err);
      if (oldUseActive) oldUseActive(p);
    }
  };

  fire = function (p) {
    const before = RUN ? RUN.bullets.length : 0;
    if (oldFire) oldFire(p);
    if (!RUN) return;

    const shots = RUN.bullets.slice(before);
    try {
      shotMods(p, shots);
    } catch (err) {
      console.error('Shot mod error', err);
    }
  };

  applyElemHit = function (b, e) {
    if (oldApplyElemHit) oldApplyElemHit(b, e);
    try {
      hitMods(b, e);
    } catch (err) {
      console.error('Hit mod error', err);
    }
  };

  tryDash = function (p) {
    if (oldTryDash) oldTryDash(p);
    try {
      dashMods(p);
    } catch (err) {
      console.error('Dash mod error', err);
    }
  };

  updPlayer = function (p, dt) {
    if (oldUpdPlayer) oldUpdPlayer(p, dt);
    try {
      updateMods(p, dt);
    } catch (err) {
      console.error('Update mod error', err);
    }
  };
})();
`;

try {
    insertBeforeClosing(DATA_FILE, DATA_FIX, '__ISO_ABILITY_FIX_DATA__');
    insertBeforeClosing(GAME_FILE, GAME_FIX, '__ISO_ABILITY_FIX_GAME__');
    console.log('Done. Every element ability is now wired to its own unique runtime handler.');
} catch (err) {
    console.error('Patch failed:', err.message);
    process.exit(1);
}