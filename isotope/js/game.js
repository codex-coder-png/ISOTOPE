'use strict'; window.GAME = {};
(function () {
  const { CATS, ELEMS, MOLDEF, RECIPES, MNODES, ETYPES, RELICS, EL, baseCombat } = DATA;
  const BD = (DATA.BOSSDEFS && DATA.BOSSDEFS.length) ? DATA.BOSSDEFS : [{ name: 'THE CHROMATIC WARDEN', hue: 336, shape: 'hex', pat: 'spiral', hpMul: 1 }];
  const cv = document.getElementById('game'), cx = cv.getContext('2d');
  let W = innerWidth, H = innerHeight; function resize() {
    W = innerWidth; H = innerHeight; cv.width = W; cv.height = H;
    const bg = document.getElementById('bg'); bg.width = W; bg.height = H
  }
  addEventListener('resize', resize); resize();
  const TAU = Math.PI * 2, rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
  const irnd = n => Math.floor(Math.random() * n), clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const d2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy };
  const keys = {}, mouse = { x: 0, y: 0, down: false }; let autofire = false;
  let RUN = null, ST = null; const SFX = AUDIO.SFX;
  function mkPlayer(i) {
    return {
      id: i, x: W / 2 + (i ? 90 : -90), y: H / 2, hp: 0, sh: 0, downed: false, revive: 0,
      dashCd: 0, dashT: 0, dvx: 0, dvy: 0, iframes: 0, fireT: 0, angle: 0, nox: 0, orbitA: 0,
      novaT: 5, flashT: 6, gravT: 8, auraT: 0, activeCd: 0
    }
  }
  function masteryBonus() {
    const id = RUN.el.id, b = {
      dmg: 0, rate: 0, proj: 0, pierce: 0, crit: 0, critD: 0,
      homing: 0, chain: 0, poison: 0, burn: 0, slow: 0, aoe: 0
    };
    MNODES.forEach(t => {
      const r = SAVE.nodeRank(id, t.key); if (!r) return;
      if (t.key === 'power') b.dmg += t.per * r; if (t.key === 'rate') b.rate += t.per * r;
      if (t.key === 'emission') b.proj += r; if (t.key === 'pen') b.pierce += r;
      if (t.key === 'crit') b.crit += t.per * r; if (t.key === 'over') b.critD += t.per * r;
      if (t.key === 'guide') b.homing += t.per * r; if (t.key === 'arc') b.chain += r;
      if (t.key === 'toxin') b.poison += r; if (t.key === 'exotherm') b.burn += r;
      if (t.key === 'zero') b.slow += r; if (t.key === 'detonate') b.aoe += r
    }); return b
  }
  function computeStats() {
    const c = baseCombat(RUN.el), ml = SAVE.raw.meta, ab = RUN.ab,
    L = id => ab[id] || 0, tr = RUN.el.trait || '', mb = masteryBonus();
    const relic = id => RUN.relics.includes(id); const s = {};
    s.dmg = c.dmg * (1 + .05 * (ml.dmg || 0)) * (1 + .22 * L('pow')) * (1 + mb.dmg / 100) * (relic('core') ? 1.2 : 1);
    s.rate = c.rate * (1 + .15 * L('rate')) * (1 + mb.rate / 100);
    s.ps = c.ps; s.kb = c.kb; s.pierce = c.pierce + L('pierce') + mb.pierce;
    s.crit = c.crit + 2.5 * (ml.crit || 0) + 8 * L('crit') + mb.crit;
    s.critD = 1.8 + .4 * L('crit') + mb.critD / 100;
    s.spd = c.spd * (1 + .03 * (ml.spd || 0)) * (1 + .08 * L('swift'));
    s.hp = Math.round(c.hp + 12 * (ml.hp || 0));
    s.magnet = 95 * (1 + .18 * (ml.mag || 0)) * (1 + .45 * L('magnet')) * (relic('magnet') ? 1.6 : 1);
    s.coinMult = 1 + .08 * (ml.luck || 0) + (tr === 'lucky' ? .4 : 0);
    s.shieldMax = 15 * (ml.shield || 0);
    s.armor = clamp(c.armor + (tr === 'armor' ? .25 : 0), 0, .7);
    s.projs = 1 + L('multi') + mb.proj + (relic('lens') ? 1 : 0);
    s.homing = .055 * L('homing') + (RUN.style === 'magnet' ? .03 : 0) + mb.homing;
    s.leech = L('leech');
    s.chainLv = L('chain') + mb.chain + (tr === 'chain' ? 2 : 0) + (tr === 'conduct' ? 2 : 0);
    s.poisonLv = mb.poison + (RUN.style === 'corrode' ? 1 : 0) + (tr === 'toxic' || tr === 'miasma' ? 1 : 0);
    s.burnLv = mb.burn + (tr === 'burn' ? 1 : 0);
    s.slowLv = mb.slow + (tr === 'chill' || tr === 'hydrate' || tr === 'conduct' ? 1 : 0);
    s.aoeLv = mb.aoe + (RUN.style === 'boom' ? 1 : 0) + (tr === 'boom' ? 1 : 0) + (tr === 'blast' ? 2 : 0);
    s.fission = L('fission');
    s.dashCd = 2.4 * Math.pow(.88, L('swift')) * (relic('battery') ? .7 : 1);
    s.activeCd = (CATS[RUN.el.cat] ? CATS[RUN.el.cat].act.cd : 7) * (relic('battery') ? .7 : 1);
    s.regen = (tr === 'hydrate' ? 1.5 : 0) + (relic('coolant') ? 2 : 0);
    s.trait = tr; ST = s; RUN.players.forEach(p => { p.hp = Math.min(p.hp, ST.hp) })
  }
  const ABIL_pool = [{ id: 'pow' }, { id: 'rate' }, { id: 'multi' }, { id: 'pierce' }, { id: 'orbit' }, { id: 'nova' }, { id: 'homing' },
  { id: 'leech' }, { id: 'crit' }, { id: 'chain' }, { id: 'swift' }, { id: 'magnet' }, { id: 'fission' }, { id: 'grav' }];
  const ABIL = [
    { id: 'pow', ic: '⚡', n: 'Core Amplifier', d: '+22% projectile damage', max: 5 },
    { id: 'rate', ic: '♻', n: 'Reaction Catalyst', d: '+15% fire rate', max: 5 },
    { id: 'multi', ic: '⋔', n: 'Split Emitter', d: '+1 projectile', max: 3 },
    { id: 'pierce', ic: '➤', n: 'Phase Rounds', d: '+1 pierce', max: 3 },
    { id: 'orbit', ic: '◉', n: 'Electron Shell', d: '+2 orbiting electrons', max: 4 },
    { id: 'nova', ic: '✹', n: 'Decay Nova', d: 'Radial blast every 5s', max: 5 },
    { id: 'homing', ic: '⌖', n: 'Seeker Isotopes', d: 'Shots home in', max: 3 },
    { id: 'leech', ic: '✚', n: 'Isotope Siphon', d: 'Heal 1 HP per kill', max: 4 },
    { id: 'crit', ic: '✧', n: 'Critical Matrix', d: '+8% crit · +40% crit dmg', max: 4 },
    { id: 'chain', ic: '≋', n: 'Arc Discharge', d: 'Hits chain lightning', max: 4 },
    { id: 'swift', ic: '≫', n: 'Ion Thrusters', d: '+8% speed · -12% dash CD', max: 4 },
    { id: 'magnet', ic: '◎', n: 'Ferrofield', d: '+45% pickup radius', max: 3 },
    { id: 'fission', ic: '✺', n: 'Fission Rounds', d: 'Shots split on expiry', max: 3 },
    { id: 'grav', ic: '▣', n: 'Graviton Well', d: 'Collapse wells crush foes', max: 3 }];
  function start(elemId, mode) {
    const el = EL(elemId), c = baseCombat(el);
    RUN = {
      el, mode, style: c.style, hue: el.hue, t: 0, wave: 0, state: 'inter', interT: 3, spawnLeft: 0, spawnT: 0,
      players: [mkPlayer(0)], ab: {}, relics: [], level: 1, xp: 0, coins: 0, kills: 0, pending: 0,
      bullets: [], ebullets: [], enemies: [], pickups: [], parts: [], texts: [], clouds: [], wells: [], eclouds: [],
      shake: 0, boss: null, hitstop: 0, slowmo: 0, pullT: 0, pullSrc: null,
      revives: SAVE.metaLv('revive') > 0 ? 1 : 0
    };
    if (mode === 'coop') RUN.players.push(mkPlayer(1));
    for (let i = 0; i < SAVE.metaLv('head'); i++) { const a = ABIL_pool[irnd(ABIL_pool.length)]; RUN.ab[a.id] = (RUN.ab[a.id] || 0) + 1 }
    computeStats(); RUN.players.forEach(p => { p.hp = ST.hp; p.sh = ST.shieldMax });
    buildChips(); banner('REACTOR BREACH — SURVIVE', 2200); AUDIO.setTrack('combat');
    ['m-over', 'm-pause', 'm-level', 'm-deploy'].forEach(id => document.getElementById(id).classList.add('hidden'))
  }
  /* input */
  addEventListener('keydown', e => {
    keys[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (!RUN || document.getElementById('scr-game').classList.contains('hidden')) return;
    if (e.code === 'KeyF') { autofire = !autofire; document.getElementById('autofire').innerHTML = `<span>F · AUTOFIRE ${autofire ? 'ON' : 'OFF'}</span>` }
    if (e.code === 'Escape') { if (RUN.state === 'play' || RUN.state === 'inter') pause(); else if (RUN.state === 'pause') resume() }
    if (e.code === 'Space') tryDash(RUN.players[0]);
    if (e.code === 'Enter' && RUN.players[1]) tryDash(RUN.players[1]);
    if (e.code === 'KeyQ') useActive(RUN.players[0]);
    if (e.code === 'ShiftRight' && RUN.players[1]) useActive(RUN.players[1])
  });
  addEventListener('keyup', e => keys[e.code] = false);
  cv.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY });
  cv.addEventListener('mousedown', e => { if (e.button === 0) mouse.down = true });
  addEventListener('mouseup', () => mouse.down = false);
  cv.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('blur', () => { if (RUN && (RUN.state === 'play' || RUN.state === 'inter')) pause() });
  function tryDash(p) {
    if (!p || p.dashCd > 0 || p.downed) return; let dx, dy;
    if (p.id === 0) {
      dx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
      dy = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0)
    }
    else { dx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0); dy = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0) }
    if (!dx && !dy) { dx = Math.cos(p.angle); dy = Math.sin(p.angle) }
    const l = Math.hypot(dx, dy) || 1; p.dvx = dx / l * 760; p.dvy = dy / l * 760;
    p.dashT = .17; p.dashCd = ST.dashCd; p.iframes = Math.max(p.iframes, .32); SFX.dash();
    for (let i = 0; i < 12; i++)burst(p.x, p.y, RUN.hue)
  }
  function nearestEnemy(x, y) {
    let b = null, bd = 1e9; RUN.enemies.forEach(e => {
      if (e.dead) return;
      const dd = d2(x, y, e.x, e.y); if (dd < bd) { bd = dd; b = e }
    }); return b
  }
  function useActive(p) {
    if (!p || p.downed || p.activeCd > 0) return;
    p.activeCd = ST.activeCd; SFX.active(); RUN.shake = Math.max(RUN.shake, 8);
    const st = RUN.style, tr = ST.trait, x = p.x, y = p.y;
    banner((RUN.el.name + ' ' + (CATS[RUN.el.cat] ? CATS[RUN.el.cat].act.name : 'Surge')).toUpperCase(), 1200);
    ringFx(x, y, RUN.hue, 160);
    if (st === 'boom' || tr === 'blast') { aoe(x, y, 220, ST.dmg * 3, RUN.hue); SFX.explosion() }
    else if (st === 'heavy') {
      aoe(x, y, 200, ST.dmg * 2, RUN.hue); RUN.enemies.forEach(e => {
        if (!e.dead && !e.boss) {
          const a = Math.atan2(e.y - y, e.x - x); e.x += Math.cos(a) * 160; e.y += Math.sin(a) * 160
        }
      })
    }
    else if (st === 'metal' || st === 'dense') {
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * TAU;
        RUN.bullets.push({ x, y, vx: Math.cos(a) * ST.ps * 1.2, vy: Math.sin(a) * ST.ps * 1.2, dmg: ST.dmg * 1.5, r: 5, pierce: 3, hit: [], life: 1.2, owner: p.id })
      }
    }
    else if (st === 'phase') { const t = nearestEnemy(x, y); if (t) { p.x = t.x; p.y = t.y; aoe(p.x, p.y, 160, ST.dmg * 2, RUN.hue) } }
    else if (st === 'pure') {
      for (let i = 0; i < 10; i++) {
        const a = p.angle + (i - 4.5) * .06;
        RUN.bullets.push({ x, y, vx: Math.cos(a) * ST.ps * 1.6, vy: Math.sin(a) * ST.ps * 1.6, dmg: ST.dmg * 1.4, r: 5, pierce: 6, hit: [], life: 1.4, owner: p.id })
      }
    }
    else if (st === 'corrode' || tr === 'toxic' || tr === 'miasma') {
      RUN.clouds.push({ x, y, r: 180, t: 5 });
      RUN.enemies.forEach(e => { if (!e.dead && d2(e.x, e.y, x, y) < 180 * 180) addPoison(e, ST.dmg * .8, 5) })
    }
    else if (st === 'inert') { RUN.players.forEach(q => { q.iframes = Math.max(q.iframes, 2.5) }) }
    else if (st === 'magnet') {
      RUN.enemies.forEach(e => {
        if (e.dead || e.boss) return;
        const a = Math.atan2(y - e.y, x - e.x); e.x += Math.cos(a) * 200; e.y += Math.sin(a) * 200
      }); aoe(x, y, 260, ST.dmg * 2, RUN.hue)
    }
    else if (st === 'rad') { for (let i = 0; i < 3; i++)setTimeout(() => { if (RUN) aoe(p.x, p.y, 200, ST.dmg * 1.5, RUN.hue) }, i * 250) }
    else if (st === 'chaos') { RUN.wells.push({ x, y, t: 2.2, lv: 3 }) }
    else aoe(x, y, 200, ST.dmg * 2, RUN.hue)
  }
  /* waves & enemies */
  function startWave() {
    RUN.wave++; SFX.wave();
    if (RUN.wave % 5 === 0) { spawnBoss(); RUN.spawnLeft = Math.min(6, 1 + Math.floor(RUN.wave / 10)) }
    else RUN.spawnLeft = Math.round(6 + RUN.wave * 2.6 + RUN.wave * RUN.wave * .12);
    RUN.spawnT = .3; RUN.state = 'play'
  }
  function pickType() {
    const w = RUN.wave;
    const pool = [['mote', 10], ['wisp', w >= 2 ? 7 : 0], ['swarm', w >= 2 ? 6 : 0], ['spitter', w >= 3 ? 6 : 0],
    ['splitter', w >= 4 ? 5 : 0], ['brute', w >= 3 ? 4 : 0], ['bomber', w >= 4 ? 5 : 0], ['healer', w >= 5 ? 4 : 0],
    ['tank', w >= 6 ? 3 : 0], ['orbiter', w >= 5 ? 4 : 0], ['sniper', w >= 7 ? 3 : 0], ['shielder', w >= 6 ? 3 : 0]];
    let tot = pool.reduce((a, p) => a + p[1], 0), r = rnd(tot);
    for (const [t, w2] of pool) { if ((r -= w2) < 0) return t } return 'mote'
  }
  function edgePos() {
    const s = irnd(4);
    if (s === 0) return [rnd(W), -30]; if (s === 1) return [rnd(W), H + 30]; if (s === 2) return [-30, rnd(H)]; return [W + 30, rnd(H)]
  }
  function spawnEnemy(type, x, y, elite) {
    const w = RUN.wave, b = ETYPES[type], hpMul = 1 + (w - 1) * .22 + Math.pow(w, 1.5) * .02;
    if (x === undefined) [x, y] = edgePos();
    const e = {
      type, x, y, r: b.r, hp: b.hp * hpMul, maxhp: b.hp * hpMul, spd: b.spd * rnd(.88, 1.12),
      dmg: b.dmg + w * .6, coin: b.coin, xp: b.xp, hue: b.hue, shape: b.shape, seed: rnd(10),
      touch: 0, slowT: 0, stun: 0, conf: 0, flash: 0, mark: 0, orb: rnd(TAU), shootT: rnd(1, 2.5), charge: 0, healT: 0
    };
    if (type === 'shielder') e.face = 0;
    if (elite) { e.elite = true; e.hp *= 2.4; e.maxhp *= 2.4; e.r *= 1.35; e.dmg *= 1.4; e.coin *= 4; e.xp *= 3 }
    else if (w >= 4 && Math.random() < .06) return spawnEnemy(type, x, y, true);
    RUN.enemies.push(e)
  }
  function spawnBoss() {
    const w = RUN.wave, def = BD[Math.floor(w / 5 - 1) % BD.length];
    const hp = 850 * (1 + w * .32) * def.hpMul;
    const e = {
      type: 'boss', boss: true, x: W / 2, y: 110, r: 44, pat: def.pat, fast: def.fast, canCharge: def.charge,
      hp, maxhp: hp, spd: def.spd || 40, dmg: 22, coin: 40 + w * 2, xp: 30, hue: def.hue, shape: def.shape,
      seed: rnd(10), touch: 0, slowT: 0, stun: 0, conf: 0, flash: 0, mark: 0, t1: 1, t2: 2, t3: 6, t4: 4, spirA: 0, tele: 0, chT: 0, cdx: 0, cdy: 0, name: def.name
    };
    RUN.enemies.push(e); RUN.boss = e;
    document.getElementById('bossname').textContent = '⚠ ' + e.name;
    document.getElementById('bosswrap').classList.remove('hidden');
    banner('⚠ WARDEN: ' + e.name, 2600); SFX.boss(); RUN.shake = 16; AUDIO.setTrack('boss')
  }
  function spawnLoop(dt) {
    if (RUN.spawnLeft <= 0) return;
    RUN.spawnT -= dt; if (RUN.spawnT <= 0 && RUN.enemies.length < 130) {
      RUN.spawnT = Math.max(.12, .75 - RUN.wave * .028); RUN.spawnLeft--;
      const t = pickType();
      if (t === 'swarm') { for (let i = 0; i < 4; i++)spawnEnemy('swarm'); RUN.spawnLeft-- }
      else spawnEnemy(t)
    }
  }
  /* combat */
  function fire(p) {
    const n = ST.projs, spread = n > 1 ? .17 : 0;
    for (let i = 0; i < n; i++) {
      const a = p.angle + (i - (n - 1) / 2) * spread + rnd(-.02, .02);
      let dmg = ST.dmg, sc = false;
      if (RUN.style === 'chaos' && Math.random() < .18) { dmg *= 2.5; sc = true }
      const crit = Math.random() * 100 < ST.crit;
      RUN.bullets.push({
        x: p.x + Math.cos(a) * 16, y: p.y + Math.sin(a) * 16, vx: Math.cos(a) * ST.ps, vy: Math.sin(a) * ST.ps,
        dmg: dmg * (crit || sc ? ST.critD : 1), crit: crit || sc, r: 5, pierce: ST.pierce, hit: [], life: 1.5, main: true, owner: p.id
      });
      for (let k = 0; k < 2; k++)RUN.parts.push({
        x: p.x + Math.cos(a) * 18, y: p.y + Math.sin(a) * 18,
        vx: Math.cos(a) * 80 + rnd(-40, 40), vy: Math.sin(a) * 80 + rnd(-40, 40), t: .15, life: .15, hue: RUN.hue, r: 2
      })
    }
    SFX.shoot(RUN.el.mol ? 4 : RUN.el.n % 8)
  }
  function aoe(x, y, rad, dmg, hue) {
    RUN.enemies.forEach(e => { if (!e.dead && d2(e.x, e.y, x, y) < (rad + e.r) * (rad + e.r)) dmgEnemy(e, dmg) });
    ringFx(x, y, hue, rad);
    for (let i = 0; i < 20; i++) { const a = rnd(TAU); RUN.parts.push({ x, y, vx: Math.cos(a) * rnd(60, 280), vy: Math.sin(a) * rnd(60, 280), t: .4, life: .4, hue, r: 3 }) }
    RUN.shake = Math.max(RUN.shake, 5)
  }
  function ringFx(x, y, hue, grow = 80, r0 = 8) { RUN.parts.push({ ring: true, x, y, r0, grow, t: .45, life: .45, hue }) }
  function arcChain(src, dmg, lv, hue = 190) {
    let cur = src;
    for (let i = 0; i < lv; i++) {
      let best = null, bd = 160 * 160;
      RUN.enemies.forEach(e => { if (e !== cur && !e.dead) { const dd = d2(cur.x, cur.y, e.x, e.y); if (dd < bd) { bd = dd; best = e } } });
      if (!best) break;
      RUN.parts.push({ x: cur.x, y: cur.y, x2: best.x, y2: best.y, t: .14, life: .14, hue, arc: true });
      dmgEnemy(best, dmg); cur = best; dmg *= .7
    }
  }
  function addPoison(e, dps, dur, hue) {
    if (e.boss) dps *= .4;
    if (!e.poison || e.poison.dps < dps) e.poison = { dps, t: dur, hue: hue || 120 }; else e.poison.t = Math.max(e.poison.t, dur)
  }
  function dmgEnemy(e, d, o = {}) {
    if (e.dead) return;
    if (e.type === 'tank') d *= .5;
    if (e.type === 'shielder') {
      const a = Math.atan2(RUN.players[0].y - e.y, RUN.players[0].x - e.x);
      let da = a - e.face; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
      if (Math.abs(da) < 1.2 && !o.pierce) d *= .2
    }
    if (e.mark > 0) d *= 1.35;
    e.hp -= d; e.flash = .09;
    if (o.big) {
      for (let i = 0; i < 5; i++)RUN.parts.push({ x: e.x, y: e.y, vx: rnd(-220, 220), vy: rnd(-220, 220), t: .3, life: .3, hue: 50, r: 2 });
      ringFx(e.x, e.y, 50, 40, 4)
    }
    if (!o.quiet && SAVE.set.dmg) RUN.texts.push({ x: e.x + rnd(-8, 8), y: e.y - e.r, t: .6, life: .6, s: Math.round(d) + '', big: o.big, col: o.col });
    if (e.hp <= 0) killEnemy(e); else if (!o.quiet) SFX.hit()
  }
  function killEnemy(e) {
    if (e.dead) return; e.dead = true; SFX.kill();
    RUN.kills++; SAVE.stats.kills++; SAVE.addMxp(RUN.el.id, e.boss ? 10 : e.elite ? 3 : 1);
    const tr = ST.trait;
    if (ST.leech) RUN.players.forEach(p => { if (!p.downed) p.hp = Math.min(ST.hp, p.hp + ST.leech) });
    if (tr === 'vital') RUN.players.forEach(p => { if (!p.downed) p.hp = Math.min(ST.hp, p.hp + 2) });
    ringFx(e.x, e.y, e.hue, e.elite ? 110 : 60);
    for (let i = 0; i < (e.elite ? 14 : 7); i++)burst(e.x, e.y, e.hue);
    if (e.elite) RUN.hitstop = Math.max(RUN.hitstop, .05);
    if (e.type === 'bomber') {
      aoe(e.x, e.y, 90, e.dmg, 20);
      RUN.players.forEach(p => { if (!p.downed && d2(p.x, p.y, e.x, e.y) < 95 * 95) hurtPlayer(p, e.dmg) })
    }
    const cv2 = Math.max(1, Math.round(e.coin * ST.coinMult));
    drop(e.x, e.y, 'coin', cv2); drop(e.x + rnd(-14, 14), e.y + rnd(-14, 14), 'xp', e.xp);
    if (Math.random() < .04) drop(e.x, e.y, 'hp', 20);
    if ((e.elite || e.boss) && Math.random() < (e.boss ? 1 : .3)) { const r = RELICS[irnd(RELICS.length)]; drop(e.x, e.y, 'relic', r.id) }
    if (e.type === 'splitter') for (let i = 0; i < 2; i++)spawnEnemy('mote', e.x + rnd(-16, 16), e.y + rnd(-16, 16));
    if (e.boss) {
      RUN.boss = null; document.getElementById('bosswrap').classList.add('hidden');
      banner('WARDEN DESTROYED', 2000); RUN.shake = 24; RUN.slowmo = .9; SFX.explosion(); AUDIO.setTrack('combat');
      for (let i = 0; i < 4; i++)ringFx(e.x, e.y, e.hue, 200 + i * 40, 10 + i * 14);
      for (let i = 0; i < 10; i++)drop(e.x + rnd(-40, 40), e.y + rnd(-40, 40), 'coin', 5);
      for (let i = 0; i < 8; i++)drop(e.x + rnd(-50, 50), e.y + rnd(-50, 50), 'xp', 5)
    }
  }
  function drop(x, y, t, v) { RUN.pickups.push({ t, x: x + rnd(-8, 8), y: y + rnd(-8, 8), v, vx: rnd(-40, 40), vy: rnd(-40, 40) }) }
  function burst(x, y, hue) { RUN.parts.push({ x, y, vx: rnd(-160, 160), vy: rnd(-160, 160), t: rnd(.2, .5), life: .5, hue, r: rnd(1.5, 3.5) }) }
  function hurtPlayer(p, d) {
    if (p.iframes > 0 || p.dashT > 0 || p.downed) return;
    if (ST.trait === 'smoke' && Math.random() < .25) { RUN.texts.push({ x: p.x, y: p.y - 20, t: .6, life: .6, s: 'PHASED', col: '#aeb' }); return }
    d *= (1 - ST.armor);
    if (p.sh > 0) { const a = Math.min(p.sh, d); p.sh -= a; d -= a }
    if (d > 0) {
      p.hp -= d; document.getElementById('hitflash').style.opacity = 1;
      setTimeout(() => document.getElementById('hitflash').style.opacity = 0, 120)
    }
    p.iframes = .85; p.nox = 4; RUN.shake = Math.max(RUN.shake, 7); SFX.hurt();
    if (p.hp <= 0) {
      if (RUN.revives > 0 && !RUN.coopUsed) {
        RUN.revives--; RUN.coopUsed = true; p.hp = ST.hp * .4; p.iframes = 2;
        aoe(p.x, p.y, 260, ST.dmg * 3, RUN.hue); banner('EMERGENCY CELL ACTIVATED', 1800); SFX.revive(); return
      }
      if (RUN.mode === 'coop') { p.downed = true; p.hp = 0; banner('P' + (p.id + 1) + ' DOWN — REVIVE THEM!', 1600); return }
      endRun(true)
    }
  }
  function endRun(died) {
    RUN.state = 'over'; SAVE.stats.runs++;
    const nb = RUN.wave > SAVE.stats.bestWave; SAVE.stats.bestWave = Math.max(SAVE.stats.bestWave, RUN.wave); SAVE.save();
    AUDIO.setTrack('menu');
    const rows = [['WAVE REACHED', 'WAVE ' + RUN.wave], ['ENEMIES DESTROYED', RUN.kills],
    ['ISOTOPE LEVEL', 'LV ' + RUN.level], ['COINS BANKED', '◈ ' + RUN.coins],
    ['MASTERY XP', '◆ ' + SAVE.mxp(RUN.el.id).xp], ['BEST WAVE', 'WAVE ' + SAVE.stats.bestWave + (nb ? ' ★' : '')]];
    document.getElementById('ov-rows').innerHTML = rows.map(r => `<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');
    document.getElementById('over-flavor').textContent = died ? 'Your isotope has decayed into the lattice.' : 'Run abandoned.';
    document.getElementById('m-over').classList.remove('hidden')
  }
  /* level up */
  const xpNeed = l => Math.round(5 + l * 4 + l * l * .5);
  function gainXP(v) {
    RUN.xp += v;
    while (RUN.xp >= xpNeed(RUN.level)) {
      RUN.xp -= xpNeed(RUN.level); RUN.level++; RUN.pending++; SFX.level();
      RUN.players.forEach(p => { ringFx(p.x, p.y, 50, 140); for (let i = 0; i < 14; i++)burst(p.x, p.y, 50) })
    }
    if (RUN.pending > 0 && RUN.state !== 'level') openLevel()
  }
  function openLevel() { RUN.state = 'level'; fillCards(); document.getElementById('m-level').classList.remove('hidden') }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = irnd(i + 1);[a[i], a[j]] = [a[j], a[i]] } return a }
  function fillCards() {
    const pool = shuffle(ABIL.filter(a => (RUN.ab[a.id] || 0) < a.max)).slice(0, 3);
    while (pool.length < 3) pool.push(pool.length === 0 ? { filler: 'hp' } : { filler: 'coin' });
    const box = document.getElementById('cards'); box.innerHTML = '';
    pool.forEach(a => {
      const d = document.createElement('div'); d.className = 'card panel';
      if (a.filler) {
        d.innerHTML = `<div class="ic">${a.filler === 'hp' ? '✚' : '◈'}</div><div class="pre">FIELD SUPPLY</div>
   <b>${a.filler === 'hp' ? 'MEND PLATING' : 'SALVAGE CACHE'}</b><p>${a.filler === 'hp' ? 'Restore 30 HP' : 'Bank +40 coins'}</p>`;
        d.onclick = () => {
          if (a.filler === 'hp') RUN.players.forEach(p => p.hp = Math.min(ST.hp, p.hp + 30));
          else { SAVE.addCoins(40); RUN.coins += 40 } SFX.coin(); afterCard()
        }
      }
      else {
        const lv = RUN.ab[a.id] || 0;
        d.innerHTML = `<div class="ic">${a.ic}</div><div class="pre">${RUN.el.name.toUpperCase()} MODULE</div>
    <b>${a.n}</b><div class="lv mono">LV ${lv} → ${lv + 1} / ${a.max}</div><p>${a.d}</p>`;
        d.onclick = () => { RUN.ab[a.id] = lv + 1; computeStats(); buildChips(); SFX.unlock(); afterCard() }
      }
      box.appendChild(d)
    })
  }
  function afterCard() {
    RUN.pending--;
    if (RUN.pending > 0) fillCards();
    else {
      document.getElementById('m-level').classList.add('hidden');
      RUN.state = RUN.enemies.length || RUN.spawnLeft > 0 ? 'play' : 'inter'
    }
  }
  function buildChips() {
    document.getElementById('hud-bl').innerHTML = ABIL.filter(a => RUN.ab[a.id]).map(a =>
      `<div class="achip" title="${a.n}">${a.ic}<b>LV${RUN.ab[a.id]}</b></div>`).join('')
  }
  /* updates */
  function updPlayer(p, dt) {
    if (p.downed) { p.revive = 0; return }
    let dx = 0, dy = 0;
    if (p.id === 0) {
      dx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
      dy = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0)
    }
    else { dx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0); dy = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0) }
    const l = Math.hypot(dx, dy) || 1;
    if (p.dashT > 0) {
      p.dashT -= dt; p.x += p.dvx * dt; p.y += p.dvy * dt;
      RUN.parts.push({ x: p.x, y: p.y, vx: 0, vy: 0, t: .25, life: .25, hue: RUN.hue, r: 4 })
    }
    else { p.x += dx / l * ST.spd * dt; p.y += dy / l * ST.spd * dt }
    if (RUN.pullT > 0 && RUN.pullSrc) {
      const a = Math.atan2(RUN.pullSrc.y - p.y, RUN.pullSrc.x - p.x);
      p.x += Math.cos(a) * 150 * dt; p.y += Math.sin(a) * 150 * dt
    }
    p.x = clamp(p.x, 16, W - 16); p.y = clamp(p.y, 16, H - 16);
    const ne = nearestEnemy(p.x, p.y);
    p.angle = p.id === 0 ? Math.atan2(mouse.y - p.y, mouse.x - p.x) : (ne ? Math.atan2(ne.y - p.y, ne.x - p.x) : p.angle);
    p.dashCd = Math.max(0, p.dashCd - dt); p.activeCd = Math.max(0, p.activeCd - dt);
    p.iframes = Math.max(0, p.iframes - dt); p.nox = Math.max(0, p.nox - dt);
    if (ST.regen) p.hp = Math.min(ST.hp, p.hp + ST.regen * dt);
    if (p.sh < ST.shieldMax && p.nox <= 0) p.sh = Math.min(ST.shieldMax, p.sh + 7 * dt);
    p.fireT -= dt;
    const wantFire = p.id === 0 ? (mouse.down || autofire) : true;
    if (wantFire && p.fireT <= 0) { p.fireT = 1 / ST.rate; fire(p) }
    const oc = (RUN.ab.orbit || 0) * 2;
    if (oc > 0) {
      p.orbitA += dt * 2.6;
      RUN.enemies.forEach(e => {
        if (e.dead) return;
        for (let i = 0; i < oc; i++) {
          const a = p.orbitA + i * TAU / oc, ox = p.x + Math.cos(a) * 54, oy = p.y + Math.sin(a) * 54;
          if (d2(ox, oy, e.x, e.y) < (8 + e.r) * (8 + e.r)) {
            e.orbCd = e.orbCd || 0;
            if (e.orbCd <= 0) { e.orbCd = .35; dmgEnemy(e, ST.dmg * .55); burst(e.x, e.y, RUN.hue) }
          }
        }
      })
    }
    if (RUN.ab.nova) {
      p.novaT -= dt; if (p.novaT <= 0) {
        p.novaT = 5; const lv = RUN.ab.nova;
        aoe(p.x, p.y, 140 + 32 * lv, ST.dmg * (1.1 + .45 * lv), RUN.hue)
      }
    }
    if (RUN.ab.grav) {
      p.gravT -= dt; if (p.gravT <= 0) {
        p.gravT = 7; const alive = RUN.enemies.filter(e => !e.dead);
        if (alive.length) { const t = alive[irnd(alive.length)]; RUN.wells.push({ x: t.x, y: t.y, t: 1.7, lv: RUN.ab.grav }) }
      }
    }
    if (ST.trait === 'flash') {
      p.flashT -= dt; if (p.flashT <= 0) {
        p.flashT = 6;
        RUN.enemies.forEach(e => { if (!e.dead && d2(e.x, e.y, p.x, p.y) < 280 * 280) e.stun = Math.max(e.stun, 1.2) });
        aoe(p.x, p.y, 280, ST.dmg * .4, 55)
      }
    }
    if (RUN.style === 'rad') {
      p.auraT -= dt; if (p.auraT <= 0) {
        p.auraT = .5;
        RUN.enemies.forEach(e => { if (!e.dead && d2(e.x, e.y, p.x, p.y) < 95 * 95) dmgEnemy(e, ST.dmg * .25, { quiet: true }) })
      }
    }
    if (RUN.mode === 'coop') {
      const other = RUN.players[1 - p.id];
      if (other && other.downed && d2(p.x, p.y, other.x, other.y) < 70 * 70) {
        other.revive += dt;
        if (other.revive >= 2) {
          other.downed = false; other.hp = ST.hp * .5; other.revive = 0; SFX.revive();
          ringFx(other.x, other.y, 140, 100); banner('P' + (other.id + 1) + ' REVIVED', 1400)
        }
      }
    }
  }
  function applyTraitHit(b, e) {
    const tr = ST.trait;
    if (ST.aoeLv > 0) aoe(b.x, b.y, 40 + 14 * ST.aoeLv, ST.dmg * (.4 + .2 * ST.aoeLv), RUN.hue);
    if (ST.poisonLv > 0) addPoison(e, ST.dmg * .45 * ST.poisonLv, 3.5, 120);
    if (ST.burnLv > 0) addPoison(e, ST.dmg * .5 * ST.burnLv, 3, 25);
    if (ST.slowLv > 0) e.slowT = Math.max(e.slowT, .6 + .3 * ST.slowLv);
    if (tr === 'acid' || tr === 'corrosive') e.mark = tr === 'corrosive' ? 6 : 4;
    if (tr === 'cloud' || tr === 'miasma') RUN.clouds.push({ x: b.x, y: b.y, r: 58, t: 2.4 });
    if (tr === 'giggle' && Math.random() < .3) e.conf = 1.2;
    if (tr === 'fizz' && Math.random() < .2) e.stun = Math.max(e.stun, .9);
    if (ST.chainLv && !b.chained) { b.chained = true; arcChain(e, ST.dmg * .5, ST.chainLv, tr === 'conduct' ? 200 : 190) }
  }
  function updBullets(dt) {
    RUN.bullets.forEach(b => {
      if (ST.homing) {
        let best = null, bd = 90000;
        RUN.enemies.forEach(e => { if (e.dead || b.hit.includes(e)) return; const dd = d2(b.x, b.y, e.x, e.y); if (dd < bd) { bd = dd; best = e } });
        if (best) {
          const ta = Math.atan2(best.y - b.y, best.x - b.x), ca = Math.atan2(b.vy, b.vx);
          let da = ta - ca; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
          const na = ca + clamp(da, -ST.homing * 60 * dt, ST.homing * 60 * dt), sp = Math.hypot(b.vx, b.vy);
          b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp
        }
      }
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      for (const e of RUN.enemies) {
        if (e.dead || b.hit.includes(e)) continue;
        if (d2(b.x, b.y, e.x, e.y) < (b.r + e.r) * (b.r + e.r)) {
          dmgEnemy(e, b.dmg, { big: b.crit, col: b.crit ? '#ffd166' : undefined, pierce: b.pierce > 0 });
          for (let i = 0; i < 3; i++)RUN.parts.push({ x: b.x, y: b.y, vx: rnd(-120, 120), vy: rnd(-120, 120), t: .2, life: .2, hue: RUN.hue, r: 1.5 });
          if (!e.dead && !e.boss) { const ka = Math.atan2(b.vy, b.vx); e.x += Math.cos(ka) * ST.kb * .06; e.y += Math.sin(ka) * ST.kb * .06 }
          applyTraitHit(b, e);
          if (b.pierce > 0) { b.pierce--; b.hit.push(e) }
          else {
            b.life = 0; if (ST.fission && b.main && !b.frag) {
              for (let k = -1; k <= 1; k += 2) {
                const a = Math.atan2(b.vy, b.vx) + k * .7;
                RUN.bullets.push({
                  x: b.x, y: b.y, vx: Math.cos(a) * ST.ps * .7, vy: Math.sin(a) * ST.ps * .7, dmg: ST.dmg * .45,
                  r: 3, pierce: 0, hit: [], life: .7, frag: true, owner: b.owner
                })
              }
            } break
          }
        }
      }
    });
    RUN.bullets = RUN.bullets.filter(b => b.life > 0 && b.x > -30 && b.x < W + 30 && b.y > -30 && b.y < H + 30);
    RUN.ebullets.forEach(b => {
      b.x += b.vx * dt; b.y += b.vy * dt;
      RUN.players.forEach(p => { if (!p.downed && d2(b.x, b.y, p.x, p.y) < (b.r + 11) * (b.r + 11)) { hurtPlayer(p, b.dmg); b.life = 0 } });
      b.life -= dt
    });
    RUN.ebullets = RUN.ebullets.filter(b => b.life > 0 && b.x > -40 && b.x < W + 40 && b.y > -40 && b.y < H + 40)
  }
  function ebul(x, y, a, spd, dmg) { RUN.ebullets.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, r: 6, dmg, life: 6 }) }
  function nearestPlayer(x, y) {
    let b = null, bd = 1e9; RUN.players.forEach(p => {
      if (p.downed) return;
      const dd = d2(x, y, p.x, p.y); if (dd < bd) { bd = dd; b = p }
    }); return b || RUN.players[0]
  }
  function bossRing(b, n, spd, dmg) { for (let i = 0; i < n; i++)ebul(b.x, b.y, i / n * TAU + b.spirA, spd, dmg) }
  function bossAI(b, dt, mx, my, d) {
    const enr = b.hp < b.maxhp * .5;
    b.t1 -= dt; b.t2 -= dt; b.t3 -= dt; b.t4 -= dt;
    if (b.tele > 0) { b.tele -= dt; if (b.tele <= 0) { b.cdx = mx * 780; b.cdy = my * 780; b.chT = .65 } return }
    if (b.chT > 0) { b.chT -= dt; b.x += b.cdx * dt; b.y += b.cdy * dt; b.x = clamp(b.x, 40, W - 40); b.y = clamp(b.y, 40, H - 40); return }
    b.x += mx * (b.spd || 42) * dt; b.y += my * (b.spd || 42) * dt;
    const sp = b.fast ? (enr ? .07 : .1) : (enr ? .09 : .15);
    if (b.t1 <= 0) {
      if (b.pat === 'omega') { const opts = ['spiral', 'cross', 'rings', 'burst']; b.pat = opts[irnd(4)]; b.t1 = sp * 8; return }
      if (b.pat === 'spiral') {
        b.t1 = sp; b.spirA += b.fast ? .62 : .47;
        ebul(b.x, b.y, b.spirA, 175, 12); ebul(b.x, b.y, b.spirA + Math.PI, 175, 12)
      }
      else if (b.pat === 'cross') { b.t1 = sp; b.spirA += .4; for (let k = 0; k < 4; k++)ebul(b.x, b.y, b.spirA + k * Math.PI / 2, 165, 12) }
      else if (b.pat === 'rings') { b.t1 = enr ? 1.4 : 2; b.spirA += .3; bossRing(b, enr ? 22 : 16, 150, 12) }
      else if (b.pat === 'burst') {
        b.t1 = enr ? .8 : 1.2; const tp = nearestPlayer(b.x, b.y);
        const a0 = Math.atan2(tp.y - b.y, tp.x - b.x); for (let k = -3; k <= 3; k++)ebul(b.x, b.y, a0 + k * .12, 260, 13)
      }
      else if (b.pat === 'clouds') {
        b.t1 = 2; const tp = nearestPlayer(b.x, b.y);
        RUN.eclouds.push({ x: tp.x, y: tp.y, r: 90, t: 3.5 }); ringFx(tp.x, tp.y, b.hue, 90)
      }
      else if (b.pat === 'summon') { b.t1 = 3; for (let i = 0; i < (enr ? 4 : 2); i++)spawnEnemy(irnd(2) ? 'mote' : 'wisp', b.x + rnd(-80, 80), b.y + rnd(-60, 60)) }
      else if (b.pat === 'pull') { b.t1 = 4; RUN.pullT = 1.4; RUN.pullSrc = { x: b.x, y: b.y }; ringFx(b.x, b.y, b.hue, 220) }
      else if (b.pat === 'teleport') {
        b.t1 = 3; const tp = nearestPlayer(b.x, b.y);
        b.x = clamp(tp.x + rnd(-170, 170), 40, W - 40); b.y = clamp(tp.y + rnd(-170, 170), 40, H - 40);
        ringFx(b.x, b.y, b.hue, 140); bossRing(b, 14, 170, 12); SFX.active()
      }
      else { b.t1 = sp; b.spirA += .5; ebul(b.x, b.y, b.spirA, 175, 12) }
    }
    if (b.t2 <= 0) {
      b.t2 = 3.1; const tp = nearestPlayer(b.x, b.y);
      const a0 = Math.atan2(tp.y - b.y, tp.x - b.x); for (let k = -2; k <= 2; k++)ebul(b.x, b.y, a0 + k * .16, 240, 13)
    }
    if (b.t3 <= 0 && (b.pat === 'summon' || b.pat === 'omega')) { b.t3 = 8; for (let i = 0; i < 3; i++)spawnEnemy('mote', b.x + rnd(-70, 70), b.y + rnd(-50, 50)) }
    if (b.canCharge && b.t4 <= 0 && d < 460) { b.t4 = 6; b.tele = .65 }
  }
  function updEnemies(dt) {
    RUN.enemies.forEach(e => {
      if (e.dead) return;
      e.flash = Math.max(0, e.flash - dt); if (e.orbCd) e.orbCd -= dt;
      if (e.mark > 0) e.mark -= dt;
      if (e.poison) {
        e.poison.t -= dt; e.pT = (e.pT || 0) - dt;
        if (e.pT <= 0) { e.pT = .5; dmgEnemy(e, e.poison.dps * .5, { quiet: true }); burst(e.x, e.y, e.poison.hue) }
        if (e.poison.t <= 0) e.poison = null; if (e.dead) return
      }
      const tp = nearestPlayer(e.x, e.y);
      let dx = tp.x - e.x, dy = tp.y - e.y, d = Math.hypot(dx, dy) || 1, mx = dx / d, my = dy / d;
      if (e.type === 'shielder') e.face = Math.atan2(dy, dx);
      if (e.stun > 0) { e.stun -= dt }
      else if (e.boss) { bossAI(e, dt, mx, my, d) }
      else {
        let sp = e.spd * (e.slowT > 0 ? .55 : 1);
        if (e.conf > 0) { e.conf -= dt; e.wa = (e.wa || rnd(TAU)) + rnd(-3, 3) * dt; mx = Math.cos(e.wa); my = Math.sin(e.wa) }
        if (e.type === 'spitter') {
          if (d < 250) { mx = -mx; my = -my }
          e.shootT -= dt; if (e.shootT <= 0 && d < 560) { e.shootT = 2.2; ebul(e.x, e.y, Math.atan2(dy, dx), 230, 10) }
        }
        if (e.type === 'sniper') {
          if (d < 380) { mx = -mx; my = -my }
          e.charge = e.charge || 0; e.shootT -= dt;
          if (e.shootT <= 0 && d < 650) { e.shootT = 3; e.charge = .6 }
          if (e.charge > 0) { e.charge -= dt; if (e.charge <= 0) ebul(e.x, e.y, Math.atan2(dy, dx), 420, e.dmg) }
        }
        if (e.type === 'healer') {
          if (d < 300) { mx = -mx; my = -my }
          e.healT -= dt; if (e.healT <= 0) {
            e.healT = 1;
            RUN.enemies.forEach(o => { if (!o.dead && o !== e && d2(o.x, o.y, e.x, e.y) < 150 * 150) { o.hp = Math.min(o.maxhp, o.hp + o.maxhp * .06) } })
          }
        }
        if (e.type === 'orbiter') {
          e.orb += dt * 1.6;
          const tx = tp.x + Math.cos(e.orb) * 220, ty = tp.y + Math.sin(e.orb) * 220;
          const L = Math.hypot(tx - e.x, ty - e.y) || 1; mx = (tx - e.x) / L; my = (ty - e.y) / L;
          e.shootT -= dt; if (e.shootT <= 0) { e.shootT = 2; ebul(e.x, e.y, Math.atan2(tp.y - e.y, tp.x - e.x), 200, 10) }
        }
        if (e.type === 'wisp') {
          const px = -dy / d, py = dx / d, s = Math.sin(RUN.t * 4 + e.seed) * .95;
          mx += px * s; my += py * s; const L = Math.hypot(mx, my) || 1; mx /= L; my /= L
        }
        e.x += mx * sp * dt; e.y += my * sp * dt
      }
      if (e.slowT > 0) e.slowT -= dt;
      e.touch -= dt;
      RUN.players.forEach(p => { if (!p.downed && e.touch <= 0 && d2(e.x, e.y, p.x, p.y) < (e.r + 13) * (e.r + 13)) { hurtPlayer(p, e.dmg); e.touch = .7 } })
    });
    const es = RUN.enemies;
    for (let i = 0; i < es.length; i++) {
      const a = es[i]; if (a.dead) continue;
      for (let j = i + 1; j < es.length; j++) {
        const b = es[j]; if (b.dead || a.boss || b.boss) continue;
        const dd = d2(a.x, a.y, b.x, b.y), rr = a.r + b.r;
        if (dd < rr * rr && dd > 0) {
          const dl = Math.sqrt(dd), ox = (a.x - b.x) / dl, oy = (a.y - b.y) / dl, push = (rr - dl) / 2;
          a.x += ox * push; a.y += oy * push; b.x -= ox * push; b.y -= oy * push
        }
      }
    }
    RUN.enemies = RUN.enemies.filter(e => !e.dead)
  }
  function updPickups(dt) {
    RUN.pickups.forEach(k => {
      k.x += k.vx * dt; k.y += k.vy * dt; k.vx *= .9; k.vy *= .9;
      RUN.players.forEach(p => {
        if (p.downed) return; const dd = d2(k.x, k.y, p.x, p.y);
        if (dd < ST.magnet * ST.magnet) { const dl = Math.sqrt(dd) || 1; k.vx += (p.x - k.x) / dl * 900 * dt; k.vy += (p.y - k.y) / dl * 900 * dt }
        if (dd < 20 * 20 && !k.got) {
          k.got = true;
          if (k.t === 'coin') { RUN.coins += k.v; SAVE.addCoins(k.v); SFX.coin() }
          else if (k.t === 'xp') { gainXP(k.v); SFX.xp() }
          else if (k.t === 'hp') { p.hp = Math.min(ST.hp, p.hp + k.v); SFX.coin() }
          else if (k.t === 'relic') {
            if (!RUN.relics.includes(k.v)) {
              RUN.relics.push(k.v); computeStats();
              const r = RELICS.find(r => r.id === k.v); banner('RELIC: ' + r.n, 1600); SFX.unlock(); ringFx(p.x, p.y, 260, 120)
            }
          }
        }
      })
    });
    RUN.pickups = RUN.pickups.filter(k => !k.got)
  }
  function update(dt) {
    if (!RUN) return;
    if (RUN.state === 'level' || RUN.state === 'pause' || RUN.state === 'over') return;
    RUN.t += dt; RUN.shake = Math.max(0, RUN.shake - dt * 30);
    let wdt = dt;
    if (RUN.hitstop > 0) { RUN.hitstop -= dt; wdt = 0 }
    else if (RUN.slowmo > 0) { RUN.slowmo -= dt; wdt = dt * .35 }
    if (RUN.pullT > 0) RUN.pullT -= dt;
    RUN.players.forEach(p => updPlayer(p, wdt));
    if (RUN.state === 'inter') { RUN.interT -= wdt; if (RUN.interT <= 0) startWave() }
    else {
      spawnLoop(wdt);
      if (RUN.spawnLeft <= 0 && RUN.enemies.length === 0 && RUN.state === 'play') {
        const bonus = 5 + RUN.wave; RUN.coins += bonus; SAVE.addCoins(bonus); SAVE.addMxp(RUN.el.id, 5);
        banner('WAVE ' + RUN.wave + ' CLEARED  +◈' + bonus, 1600);
        RUN.state = 'inter'; RUN.interT = 4
      }
    }
    updEnemies(wdt); updBullets(wdt); updPickups(wdt);
    RUN.eclouds.forEach(c => {
      c.t -= wdt;
      RUN.players.forEach(p => { if (!p.downed && d2(p.x, p.y, c.x, c.y) < c.r * c.r) hurtPlayer(p, 10 * wdt * 3) })
    });
    RUN.eclouds = RUN.eclouds.filter(c => c.t > 0);
    RUN.parts.forEach(q => { q.t -= dt; if (!q.arc && !q.ring) { q.x += q.vx * dt; q.y += q.vy * dt } });
    RUN.parts = RUN.parts.filter(q => q.t > 0); if (RUN.parts.length > 700) RUN.parts.splice(0, RUN.parts.length - 700);
    RUN.texts.forEach(t => { t.t -= dt; t.y -= 30 * dt }); RUN.texts = RUN.texts.filter(t => t.t > 0);
    RUN.clouds.forEach(c => {
      c.t -= wdt;
      RUN.enemies.forEach(e => { if (!e.dead && d2(e.x, e.y, c.x, c.y) < c.r * c.r) dmgEnemy(e, ST.dmg * .9 * wdt, { quiet: true }) })
    });
    RUN.clouds = RUN.clouds.filter(c => c.t > 0);
    RUN.wells.forEach(wl => {
      wl.t -= wdt;
      RUN.enemies.forEach(e => {
        if (e.dead || e.boss) return; const dd = d2(e.x, e.y, wl.x, wl.y);
        if (dd < 340 * 340) { const dd2 = Math.sqrt(dd) || 1; e.x += (wl.x - e.x) / dd2 * 300 * wdt; e.y += (wl.y - e.y) / dd2 * 300 * wdt }
      });
      if (wl.t <= 0) aoe(wl.x, wl.y, 130, ST.dmg * (1.4 + .4 * wl.lv), 260)
    });
    RUN.wells = RUN.wells.filter(w => w.t > 0);
    if (RUN.mode === 'coop' && RUN.players.every(p => p.downed)) endRun(true);
    hud()
  }
  let banT = null;
  function banner(txt, ms) {
    const b = document.getElementById('banner'); b.textContent = txt; b.classList.remove('hidden');
    clearTimeout(banT); banT = setTimeout(() => b.classList.add('hidden'), ms)
  }
  function pause() {
    RUN.state = 'pause';
    document.getElementById('pause-info').textContent = `WAVE ${RUN.wave} · LV ${RUN.level} · ◈ ${RUN.coins}`;
    document.getElementById('m-pause').classList.remove('hidden')
  }
  function resume() {
    RUN.state = RUN.enemies.length || RUN.spawnLeft > 0 ? 'play' : 'inter';
    document.getElementById('m-pause').classList.add('hidden')
  }
  function hud() {
    const p0 = RUN.players[0], el = RUN.el, col = `hsl(${el.hue} 75% 60%)`;
    document.getElementById('hp-bars').innerHTML = RUN.players.map((p, i) => `
  <div><div class="plabel" style="color:${i ? 'var(--mg)' : 'var(--cy)'}">P${i + 1}${p.downed ? ' · DOWNED' : ''}</div>
  <div class="bar"><i style="transform:scaleX(${clamp(p.hp / ST.hp, 0, 1)})"></i>
   <span>${Math.ceil(Math.max(0, p.hp))}/${ST.hp}</span></div>
  ${ST.shieldMax ? `<div class="bar sh"><i style="transform:scaleX(${clamp(p.sh / ST.shieldMax, 0, 1)})"></i></div>` : ''}</div>`).join('');
    document.getElementById('h-wave').textContent = 'WAVE ' + String(Math.max(1, RUN.wave)).padStart(2, '0');
    document.getElementById('h-foes').textContent = RUN.state === 'inter' ? 'NEXT WAVE IN ' + Math.ceil(RUN.interT) : 'HOSTILES: ' + (RUN.enemies.length + RUN.spawnLeft);
    document.getElementById('h-coins').textContent = '◈ ' + RUN.coins;
    document.getElementById('h-kills').textContent = 'KILLS ' + RUN.kills;
    document.getElementById('h-lv').textContent = 'LV ' + RUN.level;
    document.getElementById('h-mode').textContent = RUN.mode === 'coop' ? 'CO-OP' : 'SOLO';
    document.getElementById('xpfill').style.transform = `scaleX(${clamp(RUN.xp / xpNeed(RUN.level), 0, 1)})`;
    document.getElementById('xptxt').textContent = 'LV ' + RUN.level + ' · ' + Math.floor(RUN.xp) + ' / ' + xpNeed(RUN.level) + ' XP';
    document.getElementById('dashfill').style.width = (100 * (1 - p0.dashCd / ST.dashCd)) + '%';
    document.getElementById('qfill').style.width = (100 * (1 - p0.activeCd / ST.activeCd)) + '%';
    if (RUN.boss) document.getElementById('bossfill').style.transform = `scaleX(${clamp(RUN.boss.hp / RUN.boss.maxhp, 0, 1)})`;
    document.getElementById('h-elem').style.borderColor = col;
    document.getElementById('h-elem').style.color = col;
    document.getElementById('h-num').textContent = el.mol ? '⚗' : el.n;
    document.getElementById('h-sym').textContent = el.mol ? el.f.slice(0, 3) : el.sym
  }
  function render() {
    if (!RUN) return; cx.save();
    if (RUN.shake > 0 && SAVE.set.shake) cx.translate(rnd(-RUN.shake, RUN.shake), rnd(-RUN.shake, RUN.shake));
    cx.fillStyle = '#0a0f16'; cx.fillRect(-20, -20, W + 40, H + 40);
    /* nebula */
    const n1 = cx.createRadialGradient(W * .3 + Math.sin(RUN.t * .2) * 80, H * .3, 50, W * .3, H * .3, W * .5);
    n1.addColorStop(0, `hsla(${RUN.hue},60%,40%,.06)`); n1.addColorStop(1, 'transparent'); cx.fillStyle = n1; cx.fillRect(0, 0, W, H);
    const n2 = cx.createRadialGradient(W * .7 + Math.cos(RUN.t * .15) * 90, H * .7, 50, W * .7, H * .7, W * .5);
    n2.addColorStop(0, `hsla(${(RUN.hue + 120) % 360},60%,40%,.05)`); n2.addColorStop(1, 'transparent'); cx.fillStyle = n2; cx.fillRect(0, 0, W, H);
    cx.strokeStyle = 'rgba(90,140,200,.06)'; cx.lineWidth = 1; cx.beginPath();
    for (let x = 0; x < W; x += 48) { cx.moveTo(x, 0); cx.lineTo(x, H) } for (let y = 0; y < H; y += 48) { cx.moveTo(0, y); cx.lineTo(W, y) } cx.stroke();
    /* pulsing border */
    cx.strokeStyle = `hsla(${RUN.hue},70%,55%,${.12 + .08 * Math.sin(RUN.t * 2)})`; cx.lineWidth = 3; cx.strokeRect(4, 4, W - 8, H - 8);
    RUN.clouds.forEach(c => {
      cx.fillStyle = `hsla(80,80%,55%,${.08 + .04 * Math.sin(RUN.t * 6)})`;
      cx.beginPath(); cx.arc(c.x, c.y, c.r, 0, TAU); cx.fill()
    });
    RUN.eclouds.forEach(c => {
      cx.fillStyle = `hsla(${330},80%,50%,${.12 + .06 * Math.sin(RUN.t * 8)})`;
      cx.beginPath(); cx.arc(c.x, c.y, c.r, 0, TAU); cx.fill();
      cx.strokeStyle = `hsla(330,90%,60%,.5)`; cx.stroke()
    });
    RUN.wells.forEach(w => {
      cx.strokeStyle = 'rgba(167,139,255,.6)'; cx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { cx.beginPath(); cx.arc(w.x, w.y, 30 + i * 36 + 10 * Math.sin(RUN.t * 5 + i), 0, TAU); cx.stroke() }
    });
    RUN.pickups.forEach(k => {
      const col = k.t === 'coin' ? '#ffb454' : k.t === 'xp' ? '#4fd8eb' : k.t === 'hp' ? '#7ef0a6' : '#a78bff';
      cx.fillStyle = col; cx.save(); cx.translate(k.x, k.y); cx.rotate(RUN.t * 3);
      if (k.t === 'relic') { cx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; cx.lineTo(Math.cos(a) * 7, Math.sin(a) * 7) } cx.closePath(); cx.fill() }
      else if (k.t === 'coin') cx.fillRect(-4, -4, 8, 8);
      else { cx.beginPath(); cx.moveTo(0, -6); cx.lineTo(5, 4); cx.lineTo(-5, 4); cx.closePath(); cx.fill() }
      cx.restore()
    });
    RUN.enemies.forEach(e => {
      if (e.dead) return;
      const col = `hsl(${e.hue} ${e.elite ? 90 : 75}% ${e.flash > 0 ? 85 : 58}%)`;
      cx.save(); cx.translate(e.x, e.y);
      if (e.elite) { cx.strokeStyle = 'rgba(255,255,255,.7)'; cx.lineWidth = 1.5; cx.beginPath(); cx.arc(0, 0, e.r + 5, 0, TAU); cx.stroke() }
      if (e.poison) { cx.strokeStyle = `hsla(${e.poison.hue},80%,60%,.6)`; cx.lineWidth = 2; cx.beginPath(); cx.arc(0, 0, e.r + 3, 0, TAU); cx.stroke() }
      cx.fillStyle = col; cx.strokeStyle = '#0008'; cx.lineWidth = 2; cx.beginPath();
      const r = e.r;
      if (e.boss) {
        cx.rotate(RUN.t * .7);
        if (e.shape === 'square') cx.rect(-r, -r, r * 2, r * 2);
        else if (e.shape === 'diamond') { cx.moveTo(0, -r); cx.lineTo(r, 0); cx.lineTo(0, r); cx.lineTo(-r, 0); cx.closePath() }
        else if (e.shape === 'ring') cx.arc(0, 0, r, 0, TAU);
        else for (let i = 0; i < 6; i++) { const a = i * TAU / 6; cx.lineTo(Math.cos(a) * r, Math.sin(a) * r) }
        cx.closePath(); cx.fill(); cx.stroke();
        cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(0, 0, r * .35, 0, TAU); cx.fill()
      }
      else if (e.shape === 'square') cx.rect(-r, -r, r * 2, r * 2), cx.fill(), cx.stroke();
      else if (e.shape === 'tri') { cx.moveTo(0, -r); cx.lineTo(r, r); cx.lineTo(-r, r); cx.closePath(); cx.fill(); cx.stroke() }
      else if (e.shape === 'diamond') { cx.rotate(RUN.t * 4 + e.seed); cx.moveTo(0, -r); cx.lineTo(r, 0); cx.lineTo(0, r); cx.lineTo(-r, 0); cx.closePath(); cx.fill(); cx.stroke() }
      else if (e.shape === 'cross') { cx.rect(-r * .3, -r, r * .6, r * 2); cx.rect(-r, -r * .3, r * 2, r * .6); cx.fill(); cx.stroke() }
      else if (e.shape === 'ring') { cx.arc(0, 0, r, 0, TAU); cx.fill(); cx.stroke(); cx.fillStyle = '#0a0f16'; cx.beginPath(); cx.arc(0, 0, r * .45, 0, TAU); cx.fill() }
      else if (e.shape === 'bomb') {
        cx.arc(0, 0, r, 0, TAU); cx.fill(); cx.stroke();
        cx.strokeStyle = col; cx.beginPath(); cx.moveTo(0, -r); cx.lineTo(0, -r - 6); cx.stroke()
      }
      else if (e.shape === 'shield') {
        cx.arc(0, 0, r, 0, TAU); cx.fill(); cx.stroke();
        cx.strokeStyle = '#9ff'; cx.lineWidth = 4; cx.beginPath(); cx.arc(0, 0, r + 3, e.face - 1.1, e.face + 1.1); cx.stroke()
      }
      else { cx.arc(0, 0, r, 0, TAU); cx.fill(); cx.stroke() }
      cx.restore();
      if (e.hp < e.maxhp && !e.boss) {
        cx.fillStyle = '#0009'; cx.fillRect(e.x - e.r, e.y - e.r - 7, e.r * 2, 3);
        cx.fillStyle = col; cx.fillRect(e.x - e.r, e.y - e.r - 7, e.r * 2 * clamp(e.hp / e.maxhp, 0, 1), 3)
      }
    });
    RUN.players.forEach(p => {
      const pc = p.id === 0 ? `hsl(${RUN.hue} 80% 62%)` : '#ff5d8f';
      if (p.downed) cx.globalAlpha = .4;
      if (p.iframes > 0 && Math.floor(RUN.t * 20) % 2 === 0) cx.globalAlpha *= .4;
      cx.save(); cx.translate(p.x, p.y);
      cx.strokeStyle = pc + '55'; cx.lineWidth = 2; cx.beginPath(); cx.arc(0, 0, 17, 0, TAU); cx.stroke();
      cx.fillStyle = '#0d1420'; cx.beginPath(); cx.arc(0, 0, 13, 0, TAU); cx.fill();
      cx.strokeStyle = pc; cx.lineWidth = 2.5; cx.stroke();
      cx.fillStyle = pc; cx.font = 'bold 12px "Chakra Petch"'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.fillText(RUN.el.mol ? '⚗' : RUN.el.sym, 0, 1);
      cx.rotate(p.angle); cx.strokeStyle = pc; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(14, 0); cx.lineTo(22, 0); cx.stroke();
      cx.restore();
      if (p.downed) {
        cx.globalAlpha = 1; cx.strokeStyle = '#7ef0a6'; cx.lineWidth = 3;
        cx.beginPath(); cx.arc(p.x, p.y, 26, -Math.PI / 2, -Math.PI / 2 + (p.revive / 2) * TAU); cx.stroke()
      }
      cx.globalAlpha = 1;
      const oc = (RUN.ab.orbit || 0) * 2;
      for (let i = 0; i < oc; i++) {
        const a = p.orbitA + i * TAU / oc;
        cx.fillStyle = pc; cx.beginPath(); cx.arc(p.x + Math.cos(a) * 54, p.y + Math.sin(a) * 54, 5, 0, TAU); cx.fill()
      }
    });
    cx.globalCompositeOperation = 'lighter';
    RUN.bullets.forEach(b => {
      cx.fillStyle = `hsl(${RUN.hue} 90% ${b.crit ? 75 : 60}%)`;
      cx.beginPath(); cx.arc(b.x, b.y, b.r + (b.crit ? 2 : 0), 0, TAU); cx.fill()
    });
    RUN.ebullets.forEach(b => { cx.fillStyle = '#ff8c4f'; cx.beginPath(); cx.arc(b.x, b.y, b.r, 0, TAU); cx.fill() });
    RUN.parts.forEach(q => {
      const a = clamp(q.t / q.life, 0, 1);
      if (q.arc) {
        cx.strokeStyle = `hsla(${q.hue},90%,70%,${a})`; cx.lineWidth = 2;
        cx.beginPath(); cx.moveTo(q.x, q.y);
        cx.quadraticCurveTo((q.x + q.x2) / 2 + rnd(-14, 14), (q.y + q.y2) / 2 + rnd(-14, 14), q.x2, q.y2); cx.stroke()
      }
      else if (q.ring) {
        cx.strokeStyle = `hsla(${q.hue},90%,65%,${a})`; cx.lineWidth = 3;
        cx.beginPath(); cx.arc(q.x, q.y, q.r0 + (1 - a) * q.grow, 0, TAU); cx.stroke()
      }
      else { cx.fillStyle = `hsla(${q.hue},90%,62%,${a})`; cx.beginPath(); cx.arc(q.x, q.y, q.r, 0, TAU); cx.fill() }
    });
    cx.globalCompositeOperation = 'source-over';
    RUN.texts.forEach(t => {
      cx.font = (t.big ? 'bold 16px' : '12px') + ' "Share Tech Mono"'; cx.textAlign = 'center';
      cx.fillStyle = t.col || '#eaf4ff'; cx.globalAlpha = clamp(t.t / t.life, 0, 1); cx.fillText(t.s, t.x, t.y); cx.globalAlpha = 1
    });
    cx.strokeStyle = 'rgba(255,255,255,.6)'; cx.lineWidth = 1;
    cx.beginPath(); cx.arc(mouse.x, mouse.y, 8, 0, TAU); cx.stroke();
    cx.restore()
  }
  /* ambient bg */
  const bgc = document.getElementById('bg').getContext('2d');
  const glyphs = Array.from({ length: 46 }, () => {
    const e = Object.values(ELEMS)[irnd(118)];
    return { sym: e.sym, x: rnd(innerWidth), y: rnd(innerHeight), vx: rnd(-9, 9), vy: rnd(-7, 7), s: rnd(11, 30), a: rnd(.03, .12), h: e.hue }
  });
  function renderBG(dt) {
    bgc.clearRect(0, 0, W, H); bgc.fillStyle = '#070a10'; bgc.fillRect(0, 0, W, H);
    const g1 = bgc.createRadialGradient(W * .15, H * .1, 50, W * .15, H * .1, W * .6);
    g1.addColorStop(0, 'rgba(79,216,235,.07)'); g1.addColorStop(1, 'transparent'); bgc.fillStyle = g1; bgc.fillRect(0, 0, W, H);
    const g2 = bgc.createRadialGradient(W * .9, H * .9, 50, W * .9, H * .9, W * .55);
    g2.addColorStop(0, 'rgba(255,93,143,.06)'); g2.addColorStop(1, 'transparent'); bgc.fillStyle = g2; bgc.fillRect(0, 0, W, H);
    glyphs.forEach(g => {
      g.x += g.vx * dt; g.y += g.vy * dt;
      if (g.x < -40) g.x = W + 40; if (g.x > W + 40) g.x = -40; if (g.y < -40) g.y = H + 40; if (g.y > H + 40) g.y = -40;
      bgc.font = g.s + 'px "Share Tech Mono"'; bgc.fillStyle = `hsla(${g.h},70%,65%,${g.a})`; bgc.fillText(g.sym, g.x, g.y)
    })
  }
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (document.getElementById('scr-game').classList.contains('hidden')) renderBG(dt);
    else { update(dt); render() }
    requestAnimationFrame(loop)
  }
  Object.assign(GAME, { start, pause, resume });
  requestAnimationFrame(loop);
})();