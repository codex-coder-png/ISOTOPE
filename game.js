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
  function mkPlayer(i, name, elemId, signatureSlot) {
    const elId = DATA.canonicalId(elemId || (RUN && RUN.el ? RUN.el.id : SAVE.sel));
    const el = EL(elId) || EL('e1');
    return {
      id: i, name: name || ('Operator P' + (i + 1)), elementId: elId, elem: el,
      x: W / 2 + (i === 0 ? -120 : i === 1 ? 120 : i === 2 ? -60 : 60),
      y: H / 2 + (i >= 2 ? 100 : -50),
      hp: 0, sh: 0, downed: false, revive: 0,
      dashCd: 0, dashT: 0, dvx: 0, dvy: 0, iframes: 0, fireT: 0, angle: 0, nox: 0, orbitA: 0,
      novaT: 5, flashT: 6, gravT: 8, auraT: 0, activeCd: 0,
      turretT: 4, adrenT: 0, bulwarkCd: 0, holdT: 0, staticT: 0,
      kills: 0, deaths: 0, respawnTimer: 0, signatureSlot:Number.isFinite(+signatureSlot)?Math.max(0,Math.min(2,+signatureSlot)):0, puDamage:1, puSpeed:1, puRate:1, puTimer:0, puVamp:0, puArmor:0, puProj:1, puCrit:0, puDash:0
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
    const relic = id => RUN.relics.includes(id), X = advancedBonus(); const s = {};
    s.dmg = c.dmg * (1 + .05 * (ml.dmg || 0)) * (1 + .22 * L('pow')) * (1 + mb.dmg / 100 + X.dmg) * (relic('core') ? 1.2 : 1);
    s.rate = c.rate * (1 + .15 * L('rate') + X.rate) * (1 + mb.rate / 100);
    s.ps = c.ps * (1 + .05 * L('windshear') + X.ps); s.kb = c.kb; s.pierce = c.pierce + L('pierce') + mb.pierce + Math.floor(X.pierce);
    s.crit = c.crit + 2.5 * (ml.crit || 0) + 8 * L('crit') + mb.crit + X.crit;
    s.critD = 1.8 + .4 * L('crit') + mb.critD / 100 + .25 * L('overdmg');
    s.spd = c.spd * (1 + .03 * (ml.spd || 0) + X.spd) * (1 + .08 * L('swift'));
    s.hp = Math.round((c.hp + 12 * (ml.hp || 0)) * (1 + .06 * L('juggernaut') + X.hp));
    s.magnet = 95 * (1 + .18 * (ml.mag || 0) + X.magnet) * (1 + .45 * L('magnet')) * (relic('magnet') ? 1.6 : 1);
    s.coinMult = 1 + .08 * (ml.luck || 0) + (tr === 'lucky' ? .4 : 0) + .15 * L('scavenger');
    s.shieldMax = 15 * (ml.shield || 0) + 8 * L('plating') + X.shield;
    s.armor = clamp(c.armor + (tr === 'armor' ? .25 : 0) + .03 * L('juggernaut') + X.armor, 0, .85);
    s.projs = 1 + L('multi') + mb.proj + Math.floor(X.projs) + (relic('lens') ? 1 : 0);
    s.homing = .055 * L('homing') + (RUN.style === 'magnet' ? .03 : 0) + mb.homing;
    s.leech = L('leech');
    s.chainLv = L('chain') + mb.chain + Math.floor(X.chain) + (tr === 'chain' ? 2 : 0) + (tr === 'conduct' ? 2 : 0);
    s.poisonLv = mb.poison + Math.floor(X.poison) + (RUN.style === 'corrode' ? 1 : 0) + (tr === 'toxic' || tr === 'miasma' ? 1 : 0);
    s.burnLv = mb.burn + Math.floor(X.burn) + (tr === 'burn' ? 1 : 0);
    s.slowLv = mb.slow + Math.floor(X.slow) + (tr === 'chill' || tr === 'hydrate' || tr === 'conduct' ? 1 : 0);
    s.aoeLv = mb.aoe + Math.floor(X.aoe) + (RUN.style === 'boom' ? 1 : 0) + (tr === 'boom' ? 1 : 0) + (tr === 'blast' ? 2 : 0);
    s.fission = L('fission');
    s.dashCd = 2.4 * Math.pow(.88, L('swift')) * (relic('battery') ? .7 : 1);
    s.activeCd = ((RUN.el.act && RUN.el.act.cd) || (CATS[RUN.el.cat] && CATS[RUN.el.cat].act.cd) || 7) * (relic('battery') ? .7 : 1);
    s.regen = (tr === 'hydrate' ? 1.5 : 0) + (relic('coolant') ? 2 : 0);
    s.thorns = L('thorns'); s.vamp = L('vamp'); s.ricochet = L('ricochet'); s.mines = L('mines');
    s.freeze = L('freeze'); s.execute = L('execute'); s.berserk = L('berserk'); s.voltaic = L('voltaic');
    s.bloodlust = L('bloodlust'); s.bulwark = L('bulwark'); s.static = L('static'); s.lifeline = L('lifeline');
    s.hoarder = L('hoarder'); s.windup = L('windup'); s.splitshot = L('splitshot'); s.necroblast = L('necroblast');
    ALL_CARDS.forEach(a=>{const lv=L(a.id);if(!lv||!a.extraStat)return;const v=a.extraValue*lv;
      if(a.extraStat==='dmg')s.dmg*=1+v;else if(a.extraStat==='rate')s.rate*=1+v;else if(a.extraStat==='hp')s.hp+=v;
      else if(a.extraStat==='spd')s.spd*=1+v;else if(a.extraStat==='crit')s.crit+=v*100;else if(a.extraStat==='shield')s.shieldMax+=v;
      else if(a.extraStat==='magnet')s.magnet*=1+v;else if(a.extraStat==='projs')s.projs+=Math.floor(v);
      else if(a.extraStat==='pierce')s.pierce+=Math.floor(v);else if(a.extraStat==='aoe')s.aoeLv+=Math.floor(v);
      else if(a.extraStat==='homing')s.homing+=v;else if(a.extraStat==='coin')s.coinMult*=1+v;});
    const Lp = ELAB[RUN.el.id];
    if (Lp && Lp.ps) {
      const q = Lp.ps;
      if (q.dmg) s.dmg *= 1 + q.dmg; if (q.rate) s.rate *= Math.max(.4, 1 + q.rate); if (q.spd) s.spd *= 1 + q.spd;
      if (q.hp) s.hp = Math.round(s.hp * (1 + q.hp)); if (q.crit) s.crit += q.crit * 100; if (q.critD) s.critD += q.critD;
      if (q.armor) s.armor = clamp(s.armor + q.armor, 0, .85); if (q.shield) s.shieldMax += q.shield; if (q.magnet) s.magnet *= 1 + q.magnet;
    }
    if (Lp && Lp.on && Lp.on.includes('windup')) s.windup += 1;
    s.trait = tr; ST = s; RUN.players.forEach(p => { p.hp = Math.min(p.hp, ST.hp) });
    if (L('lastwill') && !RUN.lastwillGranted) { RUN.revives++; RUN.lastwillGranted = true }
  }

  const CARD_RARITY = {
    common:{label:'COMMON',color:'#9aa0aa',weight:70}, uncommon:{label:'UNCOMMON',color:'#48c774',weight:40},
    rare:{label:'RARE',color:'#4d9cff',weight:20}, epic:{label:'EPIC',color:'#b66cff',weight:10},
    legendary:{label:'LEGENDARY',color:'#ffd43b',weight:2}, mythic:{label:'MYTHIC',color:'#ff4b55',weight:.5}
  };
  const EXTRA_CARD_PREFIX=['Flux','Quantum','Catalyst','Ion','Molecular','Atomic','Lattice','Reactive','Phase','Vector','Neutron','Photon'];
  const EXTRA_CARD_SUFFIX=['Reservoir','Matrix','Conduit','Array','Mantle','Drive','Engine','Prism','Relay','Core'];
  const EXTRA_CARD_EFFECTS=[['dmg',.028,'increase projectile damage'],['rate',.022,'increase fire rate'],['hp',4,'increase maximum health'],['spd',.018,'increase movement speed'],['crit',.012,'increase critical chance'],['shield',2,'increase maximum shield'],['magnet',.035,'increase pickup radius'],['projs',.08,'increase projectile output'],['pierce',.12,'increase piercing'],['aoe',.15,'increase reaction area'],['homing',.012,'increase homing strength'],['coin',.02,'increase coin gain']];
  const EXTRA_CARDS=[];
  for(let i=0;i<121;i++){
    const rarity=i<60?'common':i<92?'uncommon':i<112?'rare':i<119?'epic':i===119?'legendary':'mythic';
    const fx=EXTRA_CARD_EFFECTS[i%EXTRA_CARD_EFFECTS.length];
    EXTRA_CARDS.push({id:'xcard_'+String(i+1).padStart(3,'0'),ic:'✦',n:EXTRA_CARD_PREFIX[i%12]+' '+EXTRA_CARD_SUFFIX[Math.floor(i/12)]+' '+String(i+1).padStart(3,'0'),d:'Stack +'+fx[1]+' to '+fx[2]+' while equipped.',max:5,rarity,extraStat:fx[0],extraValue:fx[1],unique:true});
  }
  const ALL_CARDS=[];
  const ABIL_pool = [{ id: 'pow' }, { id: 'rate' }, { id: 'multi' }, { id: 'pierce' }, { id: 'orbit' }, { id: 'nova' }, { id: 'homing' },
  { id: 'leech' }, { id: 'crit' }, { id: 'chain' }, { id: 'swift' }, { id: 'magnet' }, { id: 'fission' }, { id: 'grav' },
  { id: 'thorns' }, { id: 'vamp' }, { id: 'plating' }, { id: 'ricochet' }, { id: 'mines' }, { id: 'turret' }, { id: 'freeze' },
  { id: 'execute' }, { id: 'berserk' }, { id: 'adrenaline' }, { id: 'phaseout' }, { id: 'voltaic' }, { id: 'scavenger' },
  { id: 'bloodlust' }, { id: 'bulwark' }, { id: 'static' }, { id: 'lifeline' }, { id: 'hoarder' }, { id: 'windup' },
  { id: 'splitshot' }, { id: 'necroblast' }, { id: 'juggernaut' }, { id: 'windshear' }, { id: 'overdmg' }, { id: 'lastwill' }];
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
    { id: 'grav', ic: '▣', n: 'Graviton Well', d: 'Collapse wells crush foes', max: 3 },
    { id: 'thorns', ic: '⟁', n: 'Reflex Plating', d: 'Blast nearby foes when hit', max: 3 },
    { id: 'vamp', ic: '❤', n: 'Crimson Cycle', d: 'Critical hits heal you', max: 3 },
    { id: 'plating', ic: '▨', n: 'Ablative Plating', d: '+8 max shield', max: 3 },
    { id: 'ricochet', ic: '↺', n: 'Ricochet Rounds', d: 'Shots bounce to new targets', max: 3 },
    { id: 'mines', ic: '✱', n: 'Proximity Mines', d: 'Dashing drops explosive mines', max: 3 },
    { id: 'turret', ic: '⌬', n: 'Auto-Turret', d: 'Periodic auto-barrage', max: 2 },
    { id: 'freeze', ic: '❆', n: 'Cryo Discharge', d: 'Critical hits freeze enemies', max: 3 },
    { id: 'execute', ic: '☓', n: 'Overkill Protocol', d: 'Finishes off low-HP enemies', max: 2 },
    { id: 'berserk', ic: '⚔', n: 'Berserker Core', d: '+dmg while below 30% HP', max: 3 },
    { id: 'adrenaline', ic: '⇶', n: 'Adrenal Surge', d: 'Kills grant a speed rush', max: 3 },
    { id: 'phaseout', ic: '⧫', n: 'Phase Dash', d: 'Longer dash invulnerability', max: 2 },
    { id: 'voltaic', ic: '⎋', n: 'Voltaic Death', d: 'Kills may chain lightning', max: 3 },
    { id: 'scavenger', ic: '◈', n: 'Scavenger Protocol', d: '+15% coin gain', max: 3 },
    { id: 'bloodlust', ic: '☗', n: 'Bloodlust', d: 'Fire rate builds with kills', max: 4 },
    { id: 'bulwark', ic: '🛡', n: 'Emergency Bulwark', d: 'Periodically block a hit', max: 2 },
    { id: 'static', ic: '☈', n: 'Static Field', d: 'Passive damage aura', max: 3 },
    { id: 'lifeline', ic: '✤', n: 'Emergency Nanites', d: 'Heal a sliver on pickup', max: 2 },
    { id: 'hoarder', ic: '♦', n: 'Isotope Hoarder', d: '+20% XP gain', max: 3 },
    { id: 'windup', ic: '⏫', n: 'Overdrive Coils', d: 'Fire rate ramps while firing', max: 3 },
    { id: 'splitshot', ic: '⋉', n: 'Splitting Rounds', d: 'Pierce hits spawn shards', max: 2 },
    { id: 'necroblast', ic: '💢', n: 'Necrotic Feedback', d: 'Kills may detonate', max: 3 },
    { id: 'juggernaut', ic: '⛨', n: 'Juggernaut Frame', d: '+HP and armor', max: 3 },
    { id: 'windshear', ic: '≽', n: 'Slipstream', d: '+projectile speed', max: 3 },
    { id: 'overdmg', ic: '✹', n: 'Overcharged Rounds', d: '+crit damage', max: 3 },
    { id: 'lastwill', ic: '☥', n: 'Last Rites', d: 'Grants one emergency revive', max: 1 }];
  // 120 one-rank research cards. Each family affects a real simulation stat;
  // the eight entries in a family are distinct research discoveries, not repeats.
  const ADVANCED_FAMILIES = [
    ['dmg', .06, '✦', 'Damage', ['Proton Cascade', 'Muon Hammer', 'Quark Focus', 'Ion Anvil', 'Plasma Edge', 'Hadron Bloom', 'Neutron Bite', 'Photon Shear']],
    ['rate', .07, '↯', 'Fire rate', ['Catalyst Mesh', 'Reaction Clock', 'Chain Primer', 'Vapor Valve', 'Kinetic Relay', 'Pulse Governor', 'Flux Rotor', 'Spark Lattice']],
    ['hp', .07, '⬡', 'Maximum HP', ['Ceramic Heart', 'Carbon Frame', 'Titanium Rib', 'Boron Skin', 'Tungsten Core', 'Graphene Weave', 'Basalt Shell', 'Cobalt Spine']],
    ['spd', .06, '➟', 'Movement speed', ['Ion Skates', 'Helium Lift', 'Lithium Sprint', 'Argon Drift', 'Mercury Glide', 'Neon Slipstream', 'Xenon Wake', 'Radon Step']],
    ['crit', 3, '✧', 'Critical chance', ['Laser Aperture', 'Diamond Facet', 'Gold Standard', 'Silver Mirror', 'Copper Lens', 'Sapphire Gate', 'Prism Array', 'Spectrum Cut']],
    ['pierce', .34, '➤', 'Pierce fragments', ['Needle Beam', 'Drill Charge', 'Rail Core', 'Ablation Tip', 'Chisel Ray', 'Breach Lattice', 'Boring Field', 'Tunneling Pulse']],
    ['projs', .26, '✣', 'Projectile count', ['Split Nucleus', 'Twin Emission', 'Triad Source', 'Scatter Chamber', 'Fission Fork', 'Orbital Bloom', 'Particle Choir', 'Shard Chorus']],
    ['armor', .018, '▣', 'Damage resistance', ['Oxide Coat', 'Chrome Plate', 'Nickel Seal', 'Ceramic Ward', 'Iron Lattice', 'Diamond Film', 'Lead Liner', 'Carbide Guard']],
    ['shield', 4, '◈', 'Shield capacity', ['Dielectric Cell', 'Capacitor Bank', 'Faraday Mesh', 'Static Reservoir', 'Plasma Buffer', 'Insulator Veil', 'Charge Vault', 'Field Battery']],
    ['chain', .34, 'ϟ', 'Chain discharge', ['Copper Filament', 'Silver Thread', 'Brine Conduit', 'Arc Relay', 'Storm Coil', 'Tesla Fork', 'Voltaic Net', 'Lightning Rail']],
    ['poison', .34, '☠', 'Corrosion potency', ['Chlorine Etch', 'Arsenic Mist', 'Iodine Bite', 'Cyanide Thread', 'Acid Seed', 'Venom Reactor', 'Toxin Bloom', 'Miasma Cell']],
    ['burn', .34, '♨', 'Burn potency', ['Thermite Grain', 'Sulfur Torch', 'Magnesium Flare', 'Phosphor Ember', 'Napalm Gel', 'Cinder Core', 'Solar Crucible', 'Furnace Coil']],
    ['slow', .34, '❄', 'Chill potency', ['Cryo Salt', 'Nitrogen Fog', 'Ice Lattice', 'Zero Point', 'Frost Needle', 'Glacier Cell', 'Winter Field', 'Cold Sink']],
    ['aoe', .34, '◎', 'Blast radius', ['Shock Ring', 'Sonic Halo', 'Nova Chamber', 'Blast Diffuser', 'Quake Disk', 'Impact Bloom', 'Pressure Wave', 'Resonance Drum']],
    ['magnet', .09, '🧲', 'Pickup range', ['Ferro Loop', 'Cobalt Pull', 'Rare Earth Core', 'Magnetic Lens', 'Flux Compass', 'Attraction Grid', 'Orbit Harvester', 'Salvage Vortex']]
  ];
  const ADVANCED_ABIL = ADVANCED_FAMILIES.flatMap(([stat, value, ic, label, names]) => names.map((n, i) => ({
    id: 'research_' + stat + '_' + i, ic, n, d: '+' + (stat === 'crit' ? value : Math.round(value * 100)) + (stat === 'shield' ? ' shield capacity' : stat === 'pierce' || stat === 'projs' || ['chain', 'poison', 'burn', 'slow', 'aoe'].includes(stat) ? '% progress toward ' + label.toLowerCase() : '% ' + label.toLowerCase()), max: 1, research: { stat, value }
  })));
  ABIL.push(...ADVANCED_ABIL);
  ALL_CARDS.push(...ABIL.map((a,i)=>({...a,rarity:i===38?'mythic':i===37?'legendary':i>=33?'epic':i>=25?'rare':i>=15?'uncommon':'common'})),...EXTRA_CARDS);
  function advancedBonus() {
    const out = { dmg: 0, rate: 0, hp: 0, spd: 0, crit: 0, pierce: 0, projs: 0, armor: 0, shield: 0, chain: 0, poison: 0, burn: 0, slow: 0, aoe: 0, magnet: 0, ps: 0 };
    ADVANCED_ABIL.forEach(a => { if (RUN && RUN.ab[a.id]) out[a.research.stat] += a.research.value * RUN.ab[a.id]; });
    return out;
  }
  function start(elemId, mode, netPlayers, isOnlineMatch, localNetId) {
    const el = EL(DATA.canonicalId(elemId || SAVE.sel)) || EL('e1'), c = baseCombat(el);
    RUN = {
      el, mode: mode || 'solo', style: c.style, hue: el.hue, t: 0, wave: 0, state: 'inter', interT: 3, spawnLeft: 0, spawnT: 0,
      players: [], ab: {}, relics: [], level: 1, xp: 0, coins: 0, kills: 0, pending: 0, signatureSlot: SAVE.getSignature?SAVE.getSignature(el.id):0, powerupNext:7, pvpPowerups:[],
      bullets: [], ebullets: [], enemies: [], pickups: [], parts: [], texts: [], clouds: [], wells: [], eclouds: [], fxQueue: [],
      shake: 0, boss: null, hitstop: 0, slowmo: 0, pullT: 0, pullSrc: null,
      revives: SAVE.metaLv('revive') > 0 ? 1 : 0, lastBossIdx: -1, bloodlustStacks: 0, lastwillGranted: false,
      isOnline: !!isOnlineMatch, localNetId: localNetId || 0,
      lastSnapshotAt: -Infinity,
      netSnapOnce: false,
      hostW: 0,
      hostH: 0,
      nextEid: 1,
      enemyMap: new Map(),
      overInfo: null,
      pvpTargetKills: (window.NET && NET.lobbyConfig && NET.lobbyConfig.pvpTargetKills) || 10,
      friendlyFire: !!(window.NET && NET.lobbyConfig && NET.lobbyConfig.friendlyFire)
    };

    // Ensure Boss HP bar & hitflash are explicitly hidden on start/respawn!
    RUN.boss = null;
    document.getElementById('bosswrap').classList.add('hidden');
    document.getElementById('hitflash').style.opacity = 0;
    ['m-over', 'm-pause', 'm-level', 'm-deploy', 'm-brief'].forEach(id => document.getElementById(id).classList.add('hidden'));

    const retryBtn = document.getElementById('btn-retry');
    if (retryBtn) {
      retryBtn.disabled = false;
      retryBtn.textContent = 'RE-DEPLOY';
    }

    if (netPlayers && netPlayers.length) {
      netPlayers.forEach((np, idx) => {
        RUN.players.push(mkPlayer(idx, np.name, np.elementId, np.signatureSlot));
      });
    } else {
      const mySig = SAVE.getSignature ? SAVE.getSignature(el.id) : 0;
      RUN.players.push(mkPlayer(0, 'P1 Operator', elemId, mySig));
      if (mode === 'coop') RUN.players.push(mkPlayer(1, 'P2 Operator', elemId, mySig));
    }

    for (let i = 0; i < SAVE.metaLv('head'); i++) { const a = ABIL_pool[irnd(ABIL_pool.length)]; RUN.ab[a.id] = (RUN.ab[a.id] || 0) + 1 }
    computeStats(); RUN.players.forEach(p => { p.hp = ST.hp; p.sh = ST.shieldMax });
    buildChips();

    const pvpHud = document.getElementById('hud-pvp');
    if (mode === 'pvp' || mode === 'net_pvp') {
      if (pvpHud) pvpHud.classList.remove('hidden');
      banner('⚔ PVP ARENA — ELIMINATE ALL RIVALS', 2600); AUDIO.setTrack('boss');
    } else if (mode === 'boss' || mode === 'net_boss') {
      if (pvpHud) pvpHud.classList.add('hidden');
      banner('⚠ BOSS RAID — DEFEAT THE WARDEN', 2600); AUDIO.setTrack('boss');
      spawnBoss();
    } else {
      if (pvpHud) pvpHud.classList.add('hidden');
      banner((RUN.friendlyFire && (mode === 'coop' || mode === 'net_coop') ? '⚠ FRIENDLY FIRE ON — ' : '') + 'REACTOR BREACH — SURVIVE', 2400); AUDIO.setTrack('combat');
    }

    if (RUN.isOnline && window.NET && NET.isHost) {
      broadcastGameState(true);
    }
  }
  /* input */
  addEventListener('keydown', e => {
    keys[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (!RUN || document.getElementById('scr-game').classList.contains('hidden')) return;
    if (e.code === 'KeyF') { autofire = !autofire; document.getElementById('autofire').innerHTML = `<span>F · AUTOFIRE ${autofire ? 'ON' : 'OFF'}</span>` }
    if (RUN.isOnline) {
      if (e.code === 'Escape') togglePause();
      if (e.code === 'Space') requestPlayerAction('dash');
      if (e.code === 'KeyQ') requestPlayerAction('active');
    } else {
      if (e.code === 'Escape') togglePause();
      if (e.code === 'Space') tryDash(RUN.players[0]);
      if (e.code === 'Enter' && RUN.players[1]) tryDash(RUN.players[1]);
      if (e.code === 'KeyQ') useActive(RUN.players[0]);
      if (e.code === 'ShiftRight' && RUN.players[1]) useActive(RUN.players[1]);
    }
  });
  addEventListener('keyup', e => keys[e.code] = false);
  cv.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY });
  cv.addEventListener('mousedown', e => { if (e.button === 0) mouse.down = true });
  addEventListener('mouseup', () => mouse.down = false);
  cv.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('blur', () => { if (RUN && (RUN.state === 'play' || RUN.state === 'inter')) togglePause() });
  function isLocalPlayer(p) {
    return !!p && (!RUN.isOnline ? p.id === 0 : p.id === RUN.localNetId);
  }
  function movementInput(p) {
    if (RUN.isOnline && !isLocalPlayer(p)) {
      return { dx: (p.netInput && p.netInput.dx) || 0, dy: (p.netInput && p.netInput.dy) || 0 };
    }
    if (isLocalPlayer(p)) {
      return {
        dx: (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0),
        dy: (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0)
      };
    }
    return {
      dx: (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0),
      dy: (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0)
    };
  }
  function requestPlayerAction(action) {
    if (RUN.isOnline && !NET.isHost) { NET.sendClientAction(action); return; }
    const p = RUN.players[RUN.localNetId] || RUN.players[0];
    if (action === 'dash') tryDash(p);
    else if (action === 'active') useActive(p);
  }
  function tryDash(p) {
    if (!p || (p.dashCd > 0 && !(p.puDash>0)) || p.downed) return; let dx, dy;
    ({ dx, dy } = movementInput(p));
    if (!dx && !dy) { dx = Math.cos(p.angle); dy = Math.sin(p.angle) }
    const l = Math.hypot(dx, dy) || 1; p.dvx = dx / l * 760; p.dvy = dy / l * 760;
    p.dashT=.17; if(p.puDash>0)p.puDash--; p.dashCd=ST.dashCd; p.iframes = Math.max(p.iframes, .32 + .25 * (RUN.ab.phaseout || 0)); SFX.dash();
    for (let i = 0; i < 12; i++)burst(p.x, p.y, RUN.hue);
    const LD = LAB();
    if (LD && LD.on) {
      if (LD.on.includes('dashExpl')) setTimeout(() => { if (RUN) aoe(p.x, p.y, 90, ST.dmg * 1.1, 30) }, 140);
      if (LD.on.includes('splitDash')) for (let k = 0; k < 3; k++) { const a2 = p.angle + (k - 1) * .4; RUN.bullets.push({ x: p.x, y: p.y, vx: Math.cos(a2) * ST.ps, vy: Math.sin(a2) * ST.ps, dmg: ST.dmg * .8, r: 4, pierce: 0, hit: [], life: 1, owner: p.id, hom: true }); }
      if (LD.on.includes('speedDmg')) p.adrenT = Math.max(p.adrenT || 0, .8);
    }
    if (ST.mines) {
      const mx0 = p.x, my0 = p.y;
      for (let i = 0; i < ST.mines; i++) {
        const mx = mx0 + rnd(-24, 24), my = my0 + rnd(-24, 24);
        ringFx(mx, my, 30, 20);
        setTimeout(() => { if (RUN) aoe(mx, my, 110, ST.dmg * 1.8, 30) }, 550 + i * 140)
      }
    }
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
    const pEl=p.elem||EL(p.elementId)||RUN.el; const sigs=pEl.signatures||[]; const pSlot=Number.isFinite(+p.signatureSlot)?Math.max(0,Math.min(2,+p.signatureSlot)):0; const signature=sigs[pSlot]||pEl.act||RUN.el.act||(CATS[pEl.cat]&&CATS[pEl.cat].act)||{name:'Surge',key:st};
    const L = LAB(); const key = L && L.a ? L.a : signature.key;
    banner(signature.name.toUpperCase(),1200); ringFx(x,y,RUN.hue,160); if(RUN.isOnline&&NET.isHost&&RUN.fxQueue){RUN.fxQueue.push({k:'shake',v:10});RUN.fxQueue.push({k:'banner',text:signature.name.toUpperCase()});}

    const sxp=signature.power||1;
    if(signature.key==='rift'){const ox=p.x,oy=p.y;p.x=clamp(p.x+Math.cos(p.angle)*180,30,W-30);p.y=clamp(p.y+Math.sin(p.angle)*180,30,H-30);p.iframes=.7;ringFx(ox,oy,RUN.hue,80);ringFx(p.x,p.y,RUN.hue,120);return}
    if(signature.key==='prism'){for(let i=-2;i<=2;i++){const a=p.angle+i*.16;RUN.bullets.push({x,y,vx:Math.cos(a)*ST.ps*1.4,vy:Math.sin(a)*ST.ps*1.4,dmg:ST.dmg*.9*sxp,r:5,pierce:2,hit:[],life:1.1,owner:p.id})}return}
    if(signature.key==='surge'){p.puDamage=1.35*sxp;p.puTimer=4;ringFx(x,y,RUN.hue,180);return}
    if(signature.key==='grav'){RUN.wells.push({x,y,r:130,t:3.5});ringFx(x,y,RUN.hue,170);return}
    if(signature.key==='bloom'){RUN.clouds.push({x,y,r:120,t:4});ringFx(x,y,RUN.hue,150);return}
    if(signature.key==='aegis'){p.sh=Math.min(ST.shieldMax+30,p.sh+ST.shieldMax*.8);p.iframes=1.2;ringFx(x,y,180,130);return}
    if(signature.key==='drift'){p.x=clamp(p.x+Math.cos(p.angle)*140,25,W-25);p.y=clamp(p.y+Math.sin(p.angle)*140,25,H-25);p.iframes=1.1;return}
    if(signature.key==='nova'){setTimeout(()=>{if(RUN){aoe(x,y,170,ST.dmg*2.1*sxp,25);ringFx(x,y,RUN.hue,220)}},650);return}
    if(signature.key==='lattice'){aoe(x,y,95,ST.dmg*.75*sxp,12);ringFx(x,y,RUN.hue,110);return}
    if(signature.key==='pulse'){aoe(x,y,150,ST.dmg*1.1*sxp,20);RUN.enemies.forEach(e=>{if(d2(e.x,e.y,x,y)<180*180)e.stun=Math.max(e.stun||0,1.2)});return}
    if(signature.key==='shard'){for(let i=0;i<12;i++){const a=i/12*TAU;RUN.bullets.push({x,y,vx:Math.cos(a)*ST.ps,vy:Math.sin(a)*ST.ps,dmg:ST.dmg*.7*sxp,r:4,pierce:1,hit:[],life:.9,owner:p.id})}return}
    if(signature.key==='vortex'){RUN.wells.push({x,y,r:95,t:4});RUN.shake=Math.max(RUN.shake,12);return}
    if(signature.key==='flash'){p.x=clamp(p.x+Math.cos(p.angle)*200,25,W-25);p.y=clamp(p.y+Math.sin(p.angle)*200,25,H-25);aoe(p.x,p.y,115,ST.dmg*sxp,10);return}
    if(signature.key==='anchor'){p.iframes=1.5;aoe(x,y,110,ST.dmg*1.5*sxp,15);return}
    if(signature.key==='comet'){setTimeout(()=>{if(RUN)aoe(clamp(mouse.x,20,W-20),clamp(mouse.y,20,H-20),105,ST.dmg*2*sxp,25)},400);return}
    if(signature.key==='echo'){setTimeout(()=>{if(RUN){RUN.bullets.push({x,y,vx:Math.cos(p.angle)*ST.ps*1.7,vy:Math.sin(p.angle)*ST.ps*1.7,dmg:ST.dmg*1.2*sxp,r:8,pierce:8,hit:[],life:1.2,owner:p.id});ringFx(x,y,RUN.hue,100)}},350);return}
    if(signature.key==='torrent'){RUN.clouds.push({x:x+Math.cos(p.angle)*120,y:y+Math.sin(p.angle)*120,r:90,t:4});aoe(x,y,100,ST.dmg*sxp,12);return}
    if(signature.key==='crown'){for(let i=0;i<6;i++){const a=RUN.t+i*TAU/6;RUN.bullets.push({x:x+Math.cos(a)*35,y:y+Math.sin(a)*35,vx:Math.cos(a)*ST.ps,vy:Math.sin(a)*ST.ps,dmg:ST.dmg*.8*sxp,r:5,pierce:3,hit:[],life:1.2,owner:p.id})}return}
    if(signature.key==='spike'){aoe(clamp(mouse.x,20,W-20),clamp(mouse.y,20,H-20),65,ST.dmg*1.8*sxp,20);return}
    if(signature.key==='mirror'){p.iframes=2;p.sh=Math.min(ST.shieldMax,p.sh+ST.shieldMax*.35);return}
    if(signature.key==='bloomfire'){RUN.clouds.push({x,y,r:145,t:5});aoe(x,y,145,ST.dmg*.6*sxp,20);return}
    if(signature.key==='coil'){p.store=(p.store||0)+1;aoe(x,y,80,ST.dmg*sxp*(p.store+1),10);return}
    if(signature.key==='tether'){const e=nearestEnemy(x,y);if(e){e.tether=3;e.x+=(x-e.x)*.18;e.y+=(y-e.y)*.18}return}
    if(signature.key==='ruin'){const e=nearestEnemy(x,y);if(e){e.marked=4;ringFx(e.x,e.y,RUN.hue,90)}return}
    if(signature.key==='halo'){aoe(x,y,100,ST.dmg*.8*sxp,10);p.sh=Math.min(ST.shieldMax,p.sh+12);return}
    if(signature.key==='drill'){RUN.bullets.push({x,y,vx:Math.cos(p.angle)*ST.ps*2,vy:Math.sin(p.angle)*ST.ps*2,dmg:ST.dmg*2*sxp,r:10,pierce:20,hit:[],life:1,owner:p.id});return}
    if(signature.key==='mist'){RUN.eclouds.push({x,y,r:150,t:4,friendly:true});return}
    if(signature.key==='crescent'){for(let i=-4;i<=4;i++){const a=p.angle+i*.11;RUN.bullets.push({x,y,vx:Math.cos(a)*ST.ps*1.3,vy:Math.sin(a)*ST.ps*1.3,dmg:ST.dmg*1.15*sxp,r:6,pierce:5,hit:[],life:.8,owner:p.id})}return}
    if(signature.key==='beacon'){RUN.wells.push({x,y,r:80,t:6,friendly:true});return}
    if(signature.key==='crash'){const ox=p.x,oy=p.y;p.x=clamp(p.x+Math.cos(p.angle)*160,25,W-25);p.y=clamp(p.y+Math.sin(p.angle)*160,25,H-25);aoe(ox,oy,75,ST.dmg*sxp,12);aoe(p.x,p.y,75,ST.dmg*sxp,12);return}
    if(signature.key==='spiral'){for(let i=0;i<10;i++){const a=p.angle+(i-5)*.12;RUN.bullets.push({x,y,vx:Math.cos(a)*ST.ps*(.8+i*.08),vy:Math.sin(a)*ST.ps*(.8+i*.08),dmg:ST.dmg*sxp,r:5,pierce:3,hit:[],life:1.3,owner:p.id})}return}
    if(signature.key==='cleave'){aoe(x+Math.cos(p.angle)*65,y+Math.sin(p.angle)*65,100,ST.dmg*1.6*sxp,18);return}

    // Element/fusion signatures. The data-driven key makes each selectable
    // isotope use its own named chemistry-themed active instead of category copy.
    if (key === 'beam') { const n = p.store || 0; p.store = 0; RUN.bullets.push({ x, y, vx: Math.cos(p.angle) * ST.ps * 2.6, vy: Math.sin(p.angle) * ST.ps * 2.6, dmg: ST.dmg * (2 + n * .15), r: 10, pierce: 20, hit: [], life: 1.1, owner: p.id, burn: true }); return }
    if (key === 'wall') { for (let i = -4; i <= 4; i++) { const a = p.angle + Math.PI / 2 + i * .12; RUN.bullets.push({ x, y, vx: Math.cos(a) * ST.ps * .9, vy: Math.sin(a) * ST.ps * .9, dmg: ST.dmg * 1.2, r: 5, pierce: 2, hit: [], life: 1.2, owner: p.id }); } return }
    if (key === 'rain') { for (let i = 0; i < 10; i++) { RUN.bullets.push({ x: rnd(W * .15, W * .85), y: -20, vx: 0, vy: ST.ps * 1.2, dmg: ST.dmg * 1.4, r: 5, pierce: 1, hit: [], life: 2, owner: p.id, expl: true }); } return }
    if (key === 'drone') { for (let k = 0; k < 6; k++) { const t = nearestEnemy(x, y); const a = t ? Math.atan2(t.y - y, t.x - x) : rnd(TAU); RUN.bullets.push({ x, y, vx: Math.cos(a) * ST.ps, vy: Math.sin(a) * ST.ps, dmg: ST.dmg * .9, r: 4, pierce: 0, hit: [], life: 1.2, owner: p.id, hom: true }); } return }
    if (key === 'singularity') { const sx2 = clamp(x + Math.cos(p.angle) * 220, 30, W - 30), sy2 = clamp(y + Math.sin(p.angle) * 220, 30, H - 30); RUN.wells.push({ x: sx2, y: sy2, t: 1.6, lv: 3 }); setTimeout(() => { if (RUN) aoe(sx2, sy2, 200, ST.dmg * 2.6, 280) }, 1500); return }
    if (key === 'pulse') { aoe(x, y, 185, ST.dmg * 2.6, RUN.hue); return }
    if (key === 'lance') { RUN.bullets.push({ x, y, vx: Math.cos(p.angle) * ST.ps * 2.4, vy: Math.sin(p.angle) * ST.ps * 2.4, dmg: ST.dmg * 4, r: 9, pierce: 14, hit: [], life: 1.25, owner: p.id }); return }
    if (key === 'orbit') { for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; RUN.bullets.push({ x, y, vx: Math.cos(a) * ST.ps * .9, vy: Math.sin(a) * ST.ps * .9, dmg: ST.dmg * 1.1, r: 4, pierce: 2, hit: [], life: 1.1, owner: p.id }) } return }
    if (key === 'veil') { p.x = clamp(x + Math.cos(p.angle) * 220, 20, W - 20); p.y = clamp(y + Math.sin(p.angle) * 220, 20, H - 20); p.iframes = Math.max(p.iframes, 2); aoe(p.x, p.y, 110, ST.dmg * 1.5, RUN.hue); return }
    if (key === 'storm') { const targets = RUN.enemies.filter(e => !e.dead).sort((a, b) => d2(a.x, a.y, x, y) - d2(b.x, b.y, x, y)).slice(0, 8); targets.forEach((e, i) => { dmgEnemy(e, ST.dmg * (2.2 - i * .12)); RUN.parts.push({ x, y, x2: e.x, y2: e.y, t: .18, life: .18, hue: RUN.hue, arc: true }) }); return }
    if (key === 'bloom') { RUN.clouds.push({ x, y, r: 165, t: 6 }); return }
    if (key === 'anchor') { RUN.pullT = 2.2; RUN.pullSrc = { x, y }; aoe(x, y, 115, ST.dmg * 1.8, RUN.hue); return }
    if (key === 'ward') { RUN.players.forEach(q => { q.iframes = Math.max(q.iframes, 2.6); q.sh = Math.min(ST.shieldMax, q.sh + 18) }); return }
    if (key === 'flare') { RUN.enemies.forEach(e => { if (!e.dead && d2(e.x, e.y, x, y) < 300 * 300) e.stun = Math.max(e.stun, 1.4) }); aoe(x, y, 250, ST.dmg * 1.2, RUN.hue); return }
    if (key === 'drill') { for (let i = -3; i <= 3; i++) { const a = p.angle + i * .12; RUN.bullets.push({ x, y, vx: Math.cos(a) * ST.ps * 1.5, vy: Math.sin(a) * ST.ps * 1.5, dmg: ST.dmg * 1.7, r: 5, pierce: 8, hit: [], life: 1.4, owner: p.id }) } return }
    if (key === 'tide') { RUN.eclouds.push({ x, y, r: 210, t: 2.5, friendly: true }); RUN.enemies.forEach(e => { if (!e.dead && d2(e.x, e.y, x, y) < 240 * 240) { e.slowT = Math.max(e.slowT, 3); dmgEnemy(e, ST.dmg * .8) } }); return }
    if (key === 'nova') { for (let i = 0; i < 3; i++) setTimeout(() => { if (RUN) aoe(p.x, p.y, 185, ST.dmg * 1.5, RUN.hue) }, i * 260); return }
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
  function playerScale() {
    return 1 + Math.max(0, RUN.players.length - 1) * .6;
  }
  function startWave() {
    RUN.wave++; SFX.wave(); RUN.bloodlustStacks = 0;
    const spawnScale = 1 + Math.max(0, RUN.players.length - 1) * .7;
    if (RUN.wave % 5 === 0) { spawnBoss(); RUN.spawnLeft = Math.round(Math.min(6, 1 + Math.floor(RUN.wave / 10)) * spawnScale) }
    else RUN.spawnLeft = Math.round((6 + RUN.wave * 2.6 + RUN.wave * RUN.wave * .12) * spawnScale);
    RUN.spawnT = .3; RUN.state = 'play'
  }
  function pickType() {
    const w = RUN.wave;
    const pool = [['mote', 10], ['wisp', w >= 2 ? 7 : 0], ['swarm', w >= 2 ? 6 : 0], ['spitter', w >= 3 ? 6 : 0],
    ['splitter', w >= 4 ? 5 : 0], ['brute', w >= 3 ? 4 : 0], ['bomber', w >= 4 ? 5 : 0], ['healer', w >= 5 ? 4 : 0],
    ['tank', w >= 6 ? 3 : 0], ['orbiter', w >= 5 ? 4 : 0], ['sniper', w >= 7 ? 3 : 0], ['shielder', w >= 6 ? 3 : 0],
    ['ghost', w >= 3 ? 4 : 0], ['charger', w >= 4 ? 4 : 0], ['vampire', w >= 5 ? 4 : 0], ['mirror', w >= 6 ? 3 : 0],
    ['juggler', w >= 4 ? 4 : 0], ['crusher', w >= 7 ? 2 : 0], ['seeder', w >= 5 ? 3 : 0], ['phantomblade', w >= 6 ? 3 : 0],
    ['anchor', w >= 6 ? 3 : 0], ['stalker', w >= 3 ? 4 : 0], ['spark', w >= 2 ? 7 : 0], ['glider', w >= 2 ? 4 : 0],
    ['shardling', w >= 3 ? 5 : 0], ['flareling', w >= 3 ? 4 : 0], ['drifter', w >= 3 ? 4 : 0], ['coil', w >= 4 ? 3 : 0],
    ['prism', w >= 4 ? 3 : 0], ['crawler', w >= 4 ? 3 : 0], ['drone', w >= 5 ? 3 : 0], ['ripple', w >= 5 ? 3 : 0],
    ['cinder', w >= 5 ? 3 : 0], ['mole', w >= 6 ? 2 : 0], ['quanta', w >= 6 ? 3 : 0], ['pylon', w >= 6 ? 2 : 0],
    ['sentinel', w >= 7 ? 2 : 0], ['boulder', w >= 7 ? 2 : 0], ['reactor', w >= 8 ? 2 : 0], ['basalt', w >= 8 ? 1 : 0],
    ['phaseweaver', w >= 5 ? 1 : 0], ['voltconductor', w >= 6 ? 1 : 0], ['biomass', w >= 7 ? 1 : 0], ['gravitywell', w >= 8 ? 1 : 0], ['mimicore', w >= 9 ? 1 : 0]];
    let tot = pool.reduce((a, p) => a + p[1], 0), r = rnd(tot);
    for (const [t, w2] of pool) { if ((r -= w2) < 0) return t } return 'mote'
  }
  function edgePos() {
    const s = irnd(4);
    if (s === 0) return [rnd(W), -30]; if (s === 1) return [rnd(W), H + 30]; if (s === 2) return [-30, rnd(H)]; return [W + 30, rnd(H)]
  }
  function spawnEnemy(type, x, y, elite) {
    const w = RUN.wave, b = ETYPES[type] || ETYPES.mote, hpMul = (1 + (w - 1) * .22 + Math.pow(w, 1.5) * .02) * playerScale();
    if (!ETYPES[type]) type = 'mote';
    if (x === undefined) [x, y] = edgePos();
    const e = {
      type, x, y, r: b.r, hp: b.hp * hpMul, maxhp: b.hp * hpMul, spd: b.spd * rnd(.88, 1.12),
      dmg: b.dmg + w * .6, coin: b.coin, xp: b.xp, hue: b.hue, shape: b.shape, seed: rnd(10),
      touch: 0, slowT: 0, stun: 0, conf: 0, flash: 0, mark: 0, orb: rnd(TAU), shootT: rnd(1, 2.5), charge: 0, healT: 0,
      phaseT: rnd(1, 2.5), invuln: false, chgT: rnd(2, 3.5), charging: 0, seedT: rnd(3, 5)
    };
    e.eid = RUN.nextEid++;
    if (type === 'shielder') e.face = 0;
    if (elite) { e.elite = true; e.hp *= 2.4; e.maxhp *= 2.4; e.r *= 1.35; e.dmg *= 1.4; e.coin *= 4; e.xp *= 3 }
    else if (w >= 4 && Math.random() < .06) return spawnEnemy(type, x, y, true);
    RUN.enemies.push(e)
  }
  function pickBossIdx() {
    if (BD.length <= 1) return 0;
    let idx; do { idx = irnd(BD.length) } while (idx === RUN.lastBossIdx);
    RUN.lastBossIdx = idx; return idx
  }
  function spawnBoss() {
    const w = RUN.wave, def = BD[pickBossIdx()];
    const hp = 850 * (1 + w * .32) * def.hpMul * playerScale();
    const e = {
      type: 'boss', boss: true, x: W / 2, y: 110, r: 44, pat: def.pat, fast: def.fast, canCharge: def.charge,
      hp, maxhp: hp, spd: def.spd || 40, dmg: 22, coin: 40 + w * 2, xp: 30, hue: def.hue, shape: def.shape,
      seed: rnd(10), touch: 0, slowT: 0, stun: 0, conf: 0, flash: 0, mark: 0, t1: 1, t2: 2, t3: 6, t4: 4, spirA: 0, tele: 0, chT: 0, cdx: 0, cdy: 0, name: def.name
    };
    e.eid = RUN.nextEid++;
    RUN.enemies.push(e); RUN.boss = e;
    document.getElementById('bossname').textContent = '⚠ ' + e.name;
    document.getElementById('bosswrap').classList.remove('hidden');
    banner('⚠ WARDEN: ' + e.name, 2600); SFX.boss(); RUN.shake = 16; AUDIO.setTrack('boss')
  }

  const PVP_POWERUPS=[
    ['pu_overclock','Overclock Cell','⚡','Fire rate surge for 8s'],['pu_kinetic','Kinetic Shell','◈','Gain a heavy temporary shield'],['pu_repair','Repair Capsule','✚','Restore 35% health'],['pu_phase','Phase Shard','◇','Become untouchable for 2.5s'],['pu_haste','Haste Prism','≫','Movement surge for 8s'],['pu_damage','Damage Core','✹','Damage surge for 8s'],['pu_reset','Cooldown Key','⟳','Reset dash and signature cooldowns'],['pu_blink','Blink Battery','↯','Blink toward your aim'],['pu_vamp','Siphon Shard','♥','Your next kill restores health'],['pu_magnet','Ferro Beacon','◎','Massively increase pickup attraction'],['pu_nova','Nova Capsule','☢','Detonate a burst around yourself'],['pu_freeze','Cryo Capsule','❄','Freeze nearby enemies'],['pu_shock','Shock Battery','ϟ','Stun nearby enemies'],['pu_armor','Armor Plate','▣','Gain temporary damage reduction'],['pu_double','Duplicate Matrix','⋔','Double projectile output briefly'],['pu_critical','Critical Lens','✧','Empower critical hits briefly'],['pu_pull','Gravity Seed','⬣','Pull nearby enemies inward'],['pu_dash','Dash Reactor','➤','Gain three instant dash charges'],['pu_coin','Arena Cache','◈','Award 75 arena coins'],['pu_cleanse','Cleanse Node','✦','Clear negative effects and restore shield']
  ].map((x,i)=>({id:x[0],n:x[1],ic:x[2],d:x[3],hue:30+i*17}));
  function spawnPvpPowerup(){if(!RUN||!['pvp','net_pvp'].includes(RUN.mode)||RUN.pvpPowerups.length>=4)return;const u=PVP_POWERUPS[irnd(PVP_POWERUPS.length)];RUN.pvpPowerups.push(u.id);RUN.pickups.push({t:'powerup',powerupId:u.id,v:0,x:rnd(60,W-60),y:rnd(60,H-60),vx:rnd(-15,15),vy:rnd(-15,15)})}
  function applyPvpPowerup(p,id){
    if(id==='pu_overclock')p.puRate=1.8,p.puTimer=8;
    else if(id==='pu_kinetic')p.sh=Math.min(ST.shieldMax+50,p.sh+ST.shieldMax+50);
    else if(id==='pu_repair')p.hp=Math.min(ST.hp,p.hp+ST.hp*.35);
    else if(id==='pu_phase')p.iframes=2.5;
    else if(id==='pu_haste')p.puSpeed=1.65,p.puTimer=8;
    else if(id==='pu_damage')p.puDamage=1.75,p.puTimer=8;
    else if(id==='pu_reset')p.dashCd=0,p.activeCd=0;
    else if(id==='pu_blink'){p.x=clamp(p.x+Math.cos(p.angle)*220,25,W-25);p.y=clamp(p.y+Math.sin(p.angle)*220,25,H-25);}
    else if(id==='pu_vamp')p.puVamp=1;
    else if(id==='pu_magnet')p.puMagnet=3,p.puTimer=8;
    else if(id==='pu_nova')aoe(p.x,p.y,170,ST.dmg*2.5,25);
    else if(id==='pu_freeze')RUN.enemies.forEach(e=>{if(d2(e.x,e.y,p.x,p.y)<190*190)e.freeze=Math.max(e.freeze||0,3)});
    else if(id==='pu_shock')RUN.enemies.forEach(e=>{if(d2(e.x,e.y,p.x,p.y)<190*190)e.stun=2});
    else if(id==='pu_armor')p.puArmor=.45,p.puTimer=8;
    else if(id==='pu_double')p.puProj=2,p.puTimer=6;
    else if(id==='pu_critical')p.puCrit=1,p.puTimer=6;
    else if(id==='pu_pull')RUN.wells.push({x:p.x,y:p.y,r:180,t:4});
    else if(id==='pu_dash')p.dashCd=0,p.puDash=3;
    else if(id==='pu_coin'){RUN.coins+=75;SAVE.addCoins(75)}
    else if(id==='pu_cleanse')p.nox=0,p.sh=ST.shieldMax;
    const u=PVP_POWERUPS.find(x=>x.id===id);if(u){p.puName=u.n;banner('POWERUP: '+u.n,1100);ringFx(p.x,p.y,180,120);SFX.unlock()}
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
    const berserkMul = (ST.berserk && p.hp < ST.hp * .3) ? 1 + .15 * ST.berserk : 1;
    for (let i = 0; i < n; i++) {
      const a = p.angle + (i - (n - 1) / 2) * spread + rnd(-.02, .02);
      let dmg = (ST.dmg*(p.puDamage||1)) * berserkMul, sc = false;
      if (RUN.style === 'chaos' && Math.random() < .18) { dmg *= 2.5; sc = true }
      const crit = (p.puCrit||0) > 0 ? true : Math.random() * 100 < ST.crit;
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
  function ringFx(x, y, hue, grow = 80, r0 = 8) {
    RUN.parts.push({ ring: true, x, y, r0, grow, t: .45, life: .45, hue });
    if (RUN.isOnline && NET.isHost && RUN.fxQueue && RUN.fxQueue.length < 600) RUN.fxQueue.push({ k: 'ring', x, y, hue, grow, r0 });
  }
  function arcChain(src, dmg, lv, hue = 190) {
    let cur = src;
    for (let i = 0; i < lv; i++) {
      let best = null, bd = 160 * 160;
      RUN.enemies.forEach(e => { if (e !== cur && !e.dead) { const dd = d2(cur.x, cur.y, e.x, e.y); if (dd < bd) { bd = dd; best = e } } });
      if (!best) break;
      RUN.parts.push({ x: cur.x, y: cur.y, x2: best.x, y2: best.y, t: .14, life: .14, hue, arc: true });
      if (RUN.isOnline && NET.isHost && RUN.fxQueue && RUN.fxQueue.length < 600) RUN.fxQueue.push({ k: 'arc', x: cur.x, y: cur.y, x2: best.x, y2: best.y, hue });
      dmgEnemy(best, dmg); cur = best; dmg *= .7
    }
  }
  function addPoison(e, dps, dur, hue) {
    if (e.boss) dps *= .4;
    if (!e.poison || e.poison.dps < dps) e.poison = { dps, t: dur, hue: hue || 120 }; else e.poison.t = Math.max(e.poison.t, dur)
  }
  function addBurn(e, dps, dur, stacks) {
    if (e.boss) dps *= .4;
    e.burn = e.burn || { dps: 0, t: 0, s: 0 };
    e.burn.dps = Math.max(e.burn.dps, dps);
    e.burn.t = Math.max(e.burn.t, dur);
    e.burn.s = Math.min(5, e.burn.s + (stacks || 1));
  }
  function addFreeze(e, t) { if (e.boss) t *= .25; e.freeze = Math.max(e.freeze || 0, t); }
  function addCorrode(e, t, amp) { e.corrode = Math.max(e.corrode || 0, t); e.corrodeAmp = amp || .35; }
  const ELAB = {};
  [['1', { sh: ['accel'], a: 'pulse' }], ['2', { ps: { spd: .08 }, a: 'anchor' }], ['3', { on: ['dashExpl'], a: 'veil' }], ['4', { sh: ['fast', 'pierce1'], ps: { spd: .1 } }], ['5', { sh: ['split'], a: 'wall' }], ['6', { ps: { armor: .05 }, a: 'veil' }], ['7', { on: ['slowHit', 'freezeCrit'], a: 'tide' }], ['8', { on: ['burnAmp'], a: 'flare' }], ['9', { on: ['corrodeHit'] }], ['10', { a: 'wall' }], ['11', { sh: ['expl'], a: 'tide' }], ['12', { on: ['blindHit'], a: 'flare' }], ['13', { ps: { rate: .25 }, sh: ['fast'] }], ['14', { on: ['chainHit'], a: 'anchor' }], ['15', { sh: ['burn', 'lag'] }], ['16', { sh: ['poison'], a: 'bloom' }], ['17', { on: ['poisonHit'], a: 'bloom' }], ['18', { a: 'ward' }], ['19', { on: ['unstable'] }], ['20', { ps: { shield: 10 }, a: 'wall' }], ['21', { ps: { hp: .1 }, a: 'ward' }], ['22', { ps: { hp: .2, armor: .08 }, a: 'ward' }], ['23', { on: ['store'], a: 'beam' }], ['24', { on: ['reflect'], ps: { armor: .05 } }], ['25', { on: ['catalyst'] }], ['26', { ps: { magnet: .5 }, a: 'anchor' }], ['27', { a: 'beam' }], ['28', { ps: { shield: 8 }, a: 'ward' }], ['29', { on: ['chainHit'] }], ['30', { ps: { shield: 10 }, on: ['shieldHeal'] }], ['31', { on: ['windup'] }], ['32', { a: 'veil' }], ['33', { sh: ['poison'], on: ['poisonHit'] }], ['34', { ps: { crit: .06 }, a: 'flare' }], ['35', { sh: ['corrode', 'lag'] }], ['36', { on: ['reveal'], a: 'beam' }], ['37', { on: ['instab'] }], ['38', { on: ['markHit'], a: 'flare' }], ['39', { a: 'drone' }], ['40', { ps: { armor: .08 }, on: ['heatShield'] }], ['41', { ps: { rate: .15 }, sh: ['fast'] }], ['42', { on: ['windup'] }], ['43', { on: ['unstable'] }], ['44', { on: ['markHit'] }], ['45', { on: ['reflect'] }], ['46', { a: 'pulse' }], ['47', { sh: ['fast'], ps: { crit: .08 } }], ['48', { on: ['toxicBattery'] }], ['49', { sh: ['hom', 'lag'] }], ['50', { a: 'drone' }], ['51', { sh: ['split', 'expl'] }], ['52', { on: ['infect'] }], ['53', { on: ['markHit'] }], ['54', { on: ['freezeCrit'], a: 'flare' }], ['55', { on: ['instab'] }], ['56', { sh: ['pullHit'] }], ['57', { a: 'veil' }], ['58', { on: ['sparkTrail'] }], ['59', { sh: ['hom'] }], ['60', { a: 'anchor' }], ['61', { on: ['auraRad'] }], ['62', { sh: ['expl'] }], ['63', { on: ['markHit'] }], ['64', { ps: { armor: .1 } }], ['65', { on: ['stunHit'], a: 'nova' }], ['66', { a: 'anchor' }], ['67', { sh: ['pierce1'], a: 'lance' }], ['68', { sh: ['fast'], a: 'beam' }], ['69', { ps: { rate: -.25, dmg: .4 }, sh: ['heavy'] }], ['70', { on: ['stillCharge'] }], ['71', { ps: { crit: .12, critD: .3 } }], ['72', { on: ['reserve'] }], ['73', { ps: { armor: .15, spd: -.12 } }], ['74', { sh: ['heavy'] }], ['75', { on: ['windup'] }], ['76', { ps: { armor: .1 }, on: ['shockHit'] }], ['77', { a: 'rain' }], ['78', { on: ['catalyst'] }], ['79', { on: ['goldKill'] }], ['80', { ps: { spd: .1 }, on: ['splitDash'] }], ['81', { on: ['delayPoison'] }], ['82', { ps: { armor: .08 }, a: 'wall' }], ['83', { a: 'wall' }], ['84', { on: ['infect'] }], ['85', { sh: ['corrode'], on: ['corrodeHit'] }], ['86', { on: ['poisonHit'], a: 'bloom' }], ['87', { on: ['unstable'] }], ['88', { on: ['auraRad'] }], ['89', { a: 'beam' }], ['90', { sh: ['heavy', 'poison'] }], ['91', { on: ['chainHit', 'poisonHit'] }], ['92', { sh: ['split'] }], ['93', { sh: ['pierce1', 'poison'] }], ['94', { on: ['critMass'] }], ['95', { on: ['reveal'], a: 'flare' }], ['96', { on: ['heatRay'] }], ['97', { sh: ['expl', 'lag'] }], ['98', { sh: ['pierce1', 'fast'] }], ['99', { on: ['confHit'] }], ['100', { sh: ['collapse'] }], ['101', { on: ['rageKill'] }], ['102', { on: ['corrodeHit'] }], ['103', { a: 'lance' }], ['104', { sh: ['heavy'] }], ['105', { sh: ['split'] }], ['106', { on: ['auraRad'] }], ['107', { on: ['speedDmg'] }], ['108', { sh: ['heavy', 'pullHit'] }], ['109', { on: ['unstable'] }], ['110', { ps: { rate: -.3, dmg: .6 }, sh: ['heavy'] }], ['111', { on: ['reveal'], ps: { crit: .08 } }], ['112', { ps: { spd: .08 }, a: 'veil' }], ['113', { on: ['markHit', 'explMark'] }], ['114', { ps: { armor: .1 }, sh: ['heavy'] }], ['115', { ps: { dmg: .35, hp: -.25 } }], ['116', { sh: ['lag', 'poison'] }], ['117', { on: ['poisonHit', 'explPoison'] }], ['118', { a: 'singularity' }]
  ].forEach(([k, v]) => ELAB[k] = v);
  function LAB() { return RUN && ELAB[RUN.el.id]; }
  function applyElemHit(b, e) {
    if (LAB() && LAB().on && LAB().on.includes('store')) { const op = RUN.players.find(q => q.id === b.owner); if (op) op.store = Math.min(20, (op.store || 0) + 1); }
    const L = LAB(); if (!L || !L.on) return;
    const cat = L.on.includes('catalyst') ? 1.5 : 1;
    if (b.crit && L.on.includes('freezeCrit')) addFreeze(e, .9 * cat);
    if (L.on.includes('poisonHit')) addPoison(e, ST.dmg * .4, 3 * cat);
    if (L.on.includes('corrodeHit')) addCorrode(e, 4 * cat, .35);
    if (L.on.includes('markHit')) e.mark = Math.max(e.mark, 4);
    if (L.on.includes('confHit') || L.on.includes('blindHit')) e.conf = Math.max(e.conf, 1);
    if (L.on.includes('stunHit')) e.stun = Math.max(e.stun, .5);
    if (L.on.includes('slowHit')) e.slowT = Math.max(e.slowT, 1);
    if (L.on.includes('chainHit') && !b.chained2) { b.chained2 = true; arcChain(e, ST.dmg * .4, 2); }
    if (L.on.includes('burnAmp') && e.burn) dmgEnemy(e, ST.dmg * .5, { quiet: true });
    if (L.on.includes('reveal') && e.type === 'ghost') { e.invuln = false; e.phaseT = 2.5; }
    if (L.on.includes('heatRay')) { e.heat = (e.heat || 0) + 1; if (e.heat >= 3) { e.heat = 0; dmgEnemy(e, ST.dmg * .8, { quiet: true }); } }
    if (L.on.includes('delayPoison')) addPoison(e, ST.dmg * .25, 5);
    if (L.on.includes('explMark') && e.mark > 0 && Math.random() < .3) { e.mark = 0; aoe(e.x, e.y, 80, ST.dmg * .9, 320); }
    if (L.on.includes('explPoison') && e.poison && Math.random() < .3) aoe(e.x, e.y, 70, ST.dmg * .7, 120);
    if (L.on.includes('shockHit')) aoe(b.x, b.y, 55, ST.dmg * .25, 220);
    if (L.on.includes('instab')) { const op = RUN.players.find(q => q.id === b.owner); if (op) { op.instab = (op.instab || 0) + 1; if (op.instab >= 6) { op.instab = 0; aoe(e.x, e.y, 90, ST.dmg * 1.4, 280); } } }
  }
  function bulletEnd(b) {
    if (b.fsplit && !b.frag) for (let k = -1; k <= 1; k += 2) { const a = Math.atan2(b.vy, b.vx) + k * .6; RUN.bullets.push({ x: b.x, y: b.y, vx: Math.cos(a) * ST.ps * .6, vy: Math.sin(a) * ST.ps * .6, dmg: ST.dmg * .35, r: 3, pierce: 0, hit: [], life: .5, frag: true, owner: b.owner }); }
    if (b.expl) aoe(b.x, b.y, 70, ST.dmg * .8, RUN.hue);
    if (b.lag) RUN.clouds.push({ x: b.x, y: b.y, r: 50, t: 1.6 });
  }
  function dmgEnemy(e, d, o = {}) {
    if (e.dead || e.invuln) return;
    if (e.type === 'tank') d *= .5;
    if (e.type === 'shielder') {
      const a = Math.atan2(RUN.players[0].y - e.y, RUN.players[0].x - e.x);
      let da = a - e.face; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
      if (Math.abs(da) < 1.2 && !o.pierce) d *= .2
    }
    if (e.mark > 0) d *= 1.35;
    if (e.corrode > 0) d *= 1 + (e.corrodeAmp || .35);
    if (e.freeze > 0) { d *= 1.5; e.freeze = 0; for (let i = 0; i < 4; i++) burst(e.x, e.y, 195); }
    e.hp -= d; e.flash = .09;
    if (ST.execute && !e.boss && e.hp > 0 && e.hp <= e.maxhp * .06 * ST.execute) e.hp = 0;
    if (o.big) {
      for (let i = 0; i < 5; i++)RUN.parts.push({ x: e.x, y: e.y, vx: rnd(-220, 220), vy: rnd(-220, 220), t: .3, life: .3, hue: 50, r: 2 });
      ringFx(e.x, e.y, 50, 40, 4)
    }
    if (!o.quiet && SAVE.set.dmg) RUN.texts.push({ x: e.x + rnd(-8, 8), y: e.y - e.r, t: .6, life: .6, s: Math.round(d) + '', big: o.big, col: o.col });
    if (RUN.isOnline && NET.isHost && RUN.fxQueue && RUN.fxQueue.length < 600) RUN.fxQueue.push({ k: 'txt', x: e.x, y: e.y - e.r, s: Math.round(d) + '', big: o.big, col: o.col });
    if (e.hp <= 0) killEnemy(e); else if (!o.quiet) SFX.hit()
  }
  function killEnemy(e) {
    if (e.dead) return; e.dead = true; SFX.kill();
    RUN.kills++; SAVE.stats.kills++; SAVE.addMxp(RUN.el.id, e.boss ? 10 : e.elite ? 3 : 1);
    if (ST.bloodlust) RUN.bloodlustStacks = Math.min(20, (RUN.bloodlustStacks || 0) + 1);
    const tr = ST.trait;
    if (ST.leech) RUN.players.forEach(p => { if (!p.downed) p.hp = Math.min(ST.hp, p.hp + ST.leech) });
    if (tr === 'vital') RUN.players.forEach(p => { if (!p.downed) p.hp = Math.min(ST.hp, p.hp + 2) });
    if (ST.voltaic && Math.random() < .22 * ST.voltaic) arcChain(e, ST.dmg * .6, 2, 190);
    if (e.burn) RUN.enemies.forEach(o => { if (!o.dead && o !== e && d2(o.x, o.y, e.x, e.y) < 90 * 90) addBurn(o, e.burn.dps, 2, 1); });
    const LK = LAB();
    if (LK && LK.on) {
      if (LK.on.includes('goldKill')) { RUN.coins += 2; SAVE.addCoins(2); }
      if (LK.on.includes('rageKill')) RUN.bloodlustStacks = Math.min(20, (RUN.bloodlustStacks || 0) + 1);
      if (LK.on.includes('infect')) RUN.enemies.forEach(o => { if (!o.dead && d2(o.x, o.y, e.x, e.y) < 110 * 110) addPoison(o, ST.dmg * .5, 3); });
      if (LK.on.includes('critMass')) { RUN.cm = (RUN.cm || 0) + 1; if (RUN.cm >= 6) { RUN.cm = 0; aoe(e.x, e.y, 160, ST.dmg * 2.5, 280); } }
    }
    if (ST.necroblast && Math.random() < .18 * ST.necroblast) aoe(e.x, e.y, 90, ST.dmg * 1.15, 20);
    if (RUN.ab.adrenaline) RUN.players.forEach(p => { if (!p.downed) p.adrenT = Math.max(p.adrenT || 0, .7 + .4 * RUN.ab.adrenaline) });
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
      RUN.players.forEach(p => {
        if (p.downed) {
          p.downed = false; p.hp = ST.hp * .5; p.revive = 0; p.iframes = 2;
          ringFx(p.x, p.y, 140, 100); banner(p.name + ' REVIVED', 1400); SFX.revive();
        }
      });
      for (let i = 0; i < 4; i++)ringFx(e.x, e.y, e.hue, 200 + i * 40, 10 + i * 14);
      for (let i = 0; i < 10; i++)drop(e.x + rnd(-40, 40), e.y + rnd(-40, 40), 'coin', 5);
      for (let i = 0; i < 8; i++)drop(e.x + rnd(-50, 50), e.y + rnd(-50, 50), 'xp', 5)
    }
  }
  function drop(x, y, t, v) { RUN.pickups.push({ t, x: x + rnd(-8, 8), y: y + rnd(-8, 8), v, vx: rnd(-40, 40), vy: rnd(-40, 40) }) }
  function burst(x, y, hue) {
    RUN.parts.push({ x, y, vx: rnd(-160, 160), vy: rnd(-160, 160), t: rnd(.2, .5), life: .5, hue, r: rnd(1.5, 3.5) });
    if (RUN.isOnline && NET.isHost && RUN.fxQueue && RUN.fxQueue.length < 600) RUN.fxQueue.push({ k: 'burst', x, y, hue });
  }
  function hurtPlayer(p, d) {
    if (p.iframes > 0 || p.dashT > 0 || p.downed) return;
    if (ST.trait === 'smoke' && Math.random() < .25) { RUN.texts.push({ x: p.x, y: p.y - 20, t: .6, life: .6, s: 'PHASED', col: '#aeb' }); return }
    if (ST.bulwark && (p.bulwarkCd || 0) <= 0 && d > 0) {
      p.bulwarkCd = 13 - 2 * ST.bulwark; p.iframes = .5;
      RUN.texts.push({ x: p.x, y: p.y - 24, t: .8, life: .8, s: 'BULWARK!', col: '#9ff', big: true });
      ringFx(p.x, p.y, 190, 90); SFX.active(); return
    }
    d *= (1 - ST.armor);
    if (p.sh > 0) { const a = Math.min(p.sh, d); p.sh -= a; d -= a }
    if (d > 0) {
      p.hp -= d;
      const LH = LAB();
      if (LH && LH.on) {
        if (LH.on.includes('reflect') && Math.random() < .3) aoe(p.x, p.y, 120, d * .9, 200);
        if (LH.on.includes('shieldHeal') && p.sh <= 0) p.hp = Math.min(ST.hp, p.hp + 12);
        if (LH.on.includes('toxicBattery')) { const t = nearestEnemy(p.x, p.y); if (t) addPoison(t, ST.dmg * .6, 3); }
        if (LH.on.includes('heatShield')) p.sh = Math.min(ST.shieldMax, p.sh + 5);
        if (LH.on.includes('reserve') && p.hp < ST.hp * .35 && (p.resCd || 0) <= 0) { p.resCd = 10; p.hp = Math.min(ST.hp, p.hp + ST.hp * .3); ringFx(p.x, p.y, 190, 90); }
      }
      // Combat is host-authoritative, but hit feedback is per screen: only
      // flash/shake the display owned by the player who was actually hit.
      if (!RUN.isOnline || isLocalPlayer(p)) {
        document.getElementById('hitflash').style.opacity = 1;
        setTimeout(() => document.getElementById('hitflash').style.opacity = 0, 120);
      }
      if (ST.thorns) aoe(p.x, p.y, 90, d * .5 * ST.thorns, 10)
    }
    p.iframes = .85; p.nox = 4;
    if (!RUN.isOnline || isLocalPlayer(p)) { RUN.shake = Math.max(RUN.shake, 7); SFX.hurt(); }
    if (p.hp <= 0) {
      if (RUN.revives > 0 && !RUN.coopUsed) {
        RUN.revives--; RUN.coopUsed = true; p.hp = ST.hp * .4; p.iframes = 2;
        aoe(p.x, p.y, 260, ST.dmg * 3, RUN.hue); banner('EMERGENCY CELL ACTIVATED', 1800); SFX.revive(); return
      }
      if (RUN.mode === 'coop' || RUN.mode === 'net_coop') { p.downed = true; p.hp = 0; banner(p.name + ' DOWN — REVIVE THEM!', 1600); return }
      endRun(true)
    }
  }
  function hurtPlayerPVP(p, d, attackerId) {
    if (p.iframes > 0 || p.dashT > 0 || p.downed) return;
    d *= (1 - ST.armor);
    if (p.sh > 0) { const a = Math.min(p.sh, d); p.sh -= a; d -= a }
    if (d > 0) p.hp -= d;
    p.iframes = 0.3; SFX.hurt();
    if (p.hp <= 0) {
      p.downed = true; p.hp = 0; p.deaths++;
      p.respawnTimer = 3.0;
      const atk = RUN.players.find(x => x.id === attackerId);
      if (atk) atk.kills++;
      banner((atk ? atk.name : 'RIVAL') + ' VAPORIZED ' + p.name, 1800);
      SFX.kill();
      if (atk && atk.kills >= RUN.pvpTargetKills) {
        banner('🏆 ' + atk.name.toUpperCase() + ' VICTORY!', 4000);
        endRun(false);
      }
    }
  }
  function endRun(died) {
    RUN.state = 'over'; SAVE.stats.runs++;
    RUN.boss = null;
    document.getElementById('bosswrap').classList.add('hidden');
    document.getElementById('hitflash').style.opacity = 0;
    const nb = RUN.wave > SAVE.stats.bestWave; SAVE.stats.bestWave = Math.max(SAVE.stats.bestWave, RUN.wave); SAVE.save();

    RUN.overInfo = {
      died,
      wave: RUN.wave,
      kills: RUN.kills,
      level: RUN.level,
      coins: RUN.coins,
      mxp: SAVE.mxp(RUN.el.id).xp,
      bestWave: SAVE.stats.bestWave,
      nb
    };

    broadcastGameState(true);
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
    RUN.xp += v * (1 + .2 * (ST.hoarder || 0));
    while (RUN.xp >= xpNeed(RUN.level)) {
      RUN.xp -= xpNeed(RUN.level); RUN.level++; RUN.pending++; SFX.level();
      RUN.players.forEach(p => { ringFx(p.x, p.y, 50, 140); for (let i = 0; i < 14; i++)burst(p.x, p.y, 50) })
    }
    if (RUN.pending > 0 && RUN.state !== 'level') openLevel()
  }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = irnd(i + 1);[a[i], a[j]] = [a[j], a[i]] } return a }

  const WAIT_HTML = '<div class="panel" style="padding:20px;font-family:var(--mono);color:var(--tx2)">MODULE LOCKED IN — WAITING FOR TEAM…</div>';
  function pickerIds() { return RUN.isOnline ? RUN.players.map(p => p.id) : [0]; }
  function rollRarity(){
    const w=[['mythic',.5],['legendary',2],['epic',10],['rare',20],['uncommon',40],['common',70]];
    let n=Math.random()*w.reduce((a,x)=>a+x[1],0);for(const [k,v] of w){n-=v;if(n<=0)return k}return'common';
  }
  function makePool(){
    const pool=[],used=new Set();
    while(pool.length<5){
      const wanted=rollRarity(), avail=ALL_CARDS.filter(a=>!used.has(a.id)&&(RUN.ab[a.id]||0)<(a.max||5));
      if(!avail.length)break;
      const same=avail.filter(a=>a.rarity===wanted),a=(same.length?same:avail)[irnd((same.length?same:avail).length)];
      used.add(a.id);const r=CARD_RARITY[a.rarity||'common'];
      pool.push({key:a.id,ic:a.ic,pre:RUN.el.name.toUpperCase()+' MODULE',n:a.n,d:a.d,lv:RUN.ab[a.id]||0,max:a.max,rarity:a.rarity,rarityLabel:r.label,color:r.color});
    }
    while(pool.length<5){const f=pool.length%2?'coin':'hp';pool.push({key:'filler:'+f,ic:f==='hp'?'✚':'◈',pre:'FIELD SUPPLY',n:f==='hp'?'MEND PLATING':'SALVAGE CACHE',d:f==='hp'?'Restore 30 HP':'Bank +40 coins',rarity:'common',rarityLabel:'COMMON',color:CARD_RARITY.common.color});}
    return pool;
  }
  function renderPool(pool, mode) {
    const box = document.getElementById('cards'); box.innerHTML = '';
    pool.forEach(c => {
      const d = document.createElement('div'); d.className = 'card panel';
      d.dataset.rarity=c.rarity||'common';d.style.setProperty('--rarity-color',c.color||CARD_RARITY.common.color);
      d.innerHTML=`<div class="rarity-badge">${c.rarityLabel||'COMMON'}</div><div class="ic">${c.ic}</div><div class="pre">${c.pre}</div><b>${c.n}</b>${c.lv!==undefined?`<div class="lv mono">STACK ${c.lv} → ${c.lv+1} / ${c.max}</div>`:''}<p>${c.d}</p>`;
      if (mode === 'host') d.onclick = () => chooseCard(RUN.localNetId, c.key);
      else if (mode === 'client') d.onclick = () => {
        NET.sendClientAction('pick:' + c.key);
        RUN.levelDone = RUN.levelDone || {};
        RUN.levelDone[RUN.localNetId] = true;
        RUN._lvlUI = null;
      };
      box.appendChild(d);
    });
  }
  function openLevel() {
    RUN.state = 'level';
    RUN.levelDone = {};
    RUN.pools = {};
    pickerIds().forEach(id => { RUN.pools[id] = makePool(); });
    const myId = pickerIds().includes(RUN.localNetId) ? RUN.localNetId : pickerIds()[0];
    renderPool(RUN.pools[myId], 'host');
    document.getElementById('m-level').classList.remove('hidden');
    if (RUN.isOnline && NET.isHost) broadcastGameState(true);
  }
  function chooseCard(pid, key) {
    if (!RUN || RUN.state !== 'level' || !RUN.pools || !RUN.pools[pid] || RUN.levelDone[pid]) return;
    const card = RUN.pools[pid].find(c => c.key === key);
    if (!card) return;
    if (key.startsWith('filler:')) {
      if (key === 'filler:hp') RUN.players.forEach(p => { p.hp = Math.min(ST.hp, p.hp + 30); });
      else { SAVE.addCoins(40); RUN.coins += 40; }
      SFX.coin();
    } else { RUN.ab[key] = (RUN.ab[key] || 0) + 1; SFX.unlock(); }
    RUN.levelDone[pid] = true;
    computeStats(); buildChips();
    if (pickerIds().every(id => RUN.levelDone[id])) {
      RUN.pending--;
      RUN.levelDone = {};
      if (RUN.pending > 0) { openLevel(); return; }
      RUN.pools = null;
      document.getElementById('m-level').classList.add('hidden');
      RUN.state = RUN.enemies.length || RUN.spawnLeft > 0 ? 'play' : 'inter';
    } else if (pid === RUN.localNetId) {
      document.getElementById('cards').innerHTML = WAIT_HTML;
    }
    if (RUN.isOnline && NET.isHost) broadcastGameState(true);
  }

  function buildChips() {
    document.getElementById('hud-bl').innerHTML = ABIL.filter(a => RUN.ab[a.id]).map(a =>
      `<div class="achip" title="${a.n}" style="border-color:${CARD_RARITY[a.rarity||'common'].color}">${a.ic}<b>LV${RUN.ab[a.id]}</b></div>`).join('')
  }
  /* updates */
  function updPlayer(p, dt) {
    if (p.downed) {
      if (RUN.mode === 'pvp' || RUN.mode === 'net_pvp') {
        p.respawnTimer -= dt;
        if (p.respawnTimer <= 0) {
          p.downed = false; p.hp = ST.hp; p.sh = ST.shieldMax;
          p.iframes = 1.5; p.x = rnd(80, W - 80); p.y = rnd(80, H - 80);
          ringFx(p.x, p.y, 180, 100); banner(p.name + ' RESPAWNED', 1200);
        }
      } else {
        p.revive = 0;
      }
      return;
    }
    const { dx, dy } = movementInput(p);
    if (RUN.isOnline && !isLocalPlayer(p) && p.netInput) {
      if (Number.isFinite(p.netInput.aimNX) && Number.isFinite(p.netInput.aimNY)) {
        p.angle = Math.atan2(p.netInput.aimNY * H - p.y, p.netInput.aimNX * W - p.x);
      } else if (Number.isFinite(p.netInput.angle)) {
        p.angle = p.netInput.angle;
      }
    }
    const l = Math.hypot(dx, dy) || 1;
    let spdMul = 1;
    if (p.adrenT > 0) spdMul *= 1.28;
    RUN.enemies.forEach(e => { if (!e.dead && e.type === 'anchor' && d2(e.x, e.y, p.x, p.y) < 190 * 190) spdMul = Math.min(spdMul, .55) });
    if (p.dashT > 0) {
      p.dashT -= dt; p.x += p.dvx * dt; p.y += p.dvy * dt;
      RUN.parts.push({ x: p.x, y: p.y, vx: 0, vy: 0, t: .25, life: .25, hue: RUN.hue, r: 4 })
    }
    else { p.x += dx / l * ST.spd * spdMul * dt; p.y += dy / l * ST.spd * spdMul * dt }
    if (RUN.pullT > 0 && RUN.pullSrc) {
      const a = Math.atan2(RUN.pullSrc.y - p.y, RUN.pullSrc.x - p.x);
      p.x += Math.cos(a) * 150 * dt; p.y += Math.sin(a) * 150 * dt
    }
    p.x = clamp(p.x, 16, W - 16); p.y = clamp(p.y, 16, H - 16);
    if (isLocalPlayer(p)) {
      const ne = nearestEnemy(p.x, p.y);
      p.angle = Math.atan2(mouse.y - p.y, mouse.x - p.x);
    } else if (!RUN.isOnline) {
      const ne = nearestEnemy(p.x, p.y);
      p.angle = ne ? Math.atan2(ne.y - p.y, ne.x - p.x) : p.angle;
    }
    p.dashCd = Math.max(0, p.dashCd - dt); p.activeCd = Math.max(0, p.activeCd - dt);
    p.iframes = Math.max(0, p.iframes - dt); p.nox = Math.max(0, p.nox - dt);
    p.adrenT = Math.max(0, (p.adrenT || 0) - dt); p.puTimer=Math.max(0,(p.puTimer||0)-dt); if(p.puTimer<=0){p.puDamage=1;p.puSpeed=1;p.puRate=1;p.puArmor=0;p.puProj=1;p.puCrit=0;} p.bulwarkCd = Math.max(0, (p.bulwarkCd || 0) - dt);
    p.resCd = Math.max(0, (p.resCd || 0) - dt);
    if (ST.regen) p.hp = Math.min(ST.hp, p.hp + ST.regen * dt);
    if (p.sh < ST.shieldMax && p.nox <= 0) p.sh = Math.min(ST.shieldMax, p.sh + 7 * dt);
    p.fireT -= dt;
    const wantFire = RUN.isOnline ? (isLocalPlayer(p) ? (mouse.down || autofire) : !!(p.netInput && p.netInput.fire)) : (p.id === 0 ? (mouse.down || autofire) : true);
    if (ST.windup) p.holdT = wantFire ? Math.min(3, (p.holdT || 0) + dt) : 0;
    const bloodlustMul = ST.bloodlust ? 1 + Math.min(.6, .025 * ST.bloodlust * (RUN.bloodlustStacks || 0)) : 1;
    const windupMul = ST.windup ? 1 + Math.min(.4, .13 * ST.windup) * Math.min(2, (p.holdT || 0) / 2) : 1;
    if (wantFire && p.fireT <= 0) { p.fireT = 1 / (ST.rate * bloodlustMul * windupMul * (p.puRate||1)); fire(p) }
    if (RUN.ab.turret) {
      p.turretT -= dt; if (p.turretT <= 0) {
        p.turretT = 4.6 - .5 * RUN.ab.turret;
        const targets = RUN.enemies.filter(e => !e.dead).sort((a, b) => d2(p.x, p.y, a.x, a.y) - d2(p.x, p.y, b.x, b.y)).slice(0, 2 + RUN.ab.turret);
        targets.forEach(t => {
          const a = Math.atan2(t.y - p.y, t.x - p.x);
          const nb = {
            x: p.x + Math.cos(a) * 16, y: p.y + Math.sin(a) * 16, vx: Math.cos(a) * ST.ps, vy: Math.sin(a) * ST.ps,
            dmg: dmg * (crit || sc ? ST.critD : 1), crit: crit || sc, r: 5, pierce: ST.pierce, hit: [], life: 1.5, main: true, owner: p.id
          };
          const LT = LAB();
          if (LT && LT.sh) {
            const t = LT.sh;
            if (t.includes('accel')) nb.acc = 520;
            if (t.includes('fast')) { nb.vx *= 1.5; nb.vy *= 1.5; nb.r = 4; }
            if (t.includes('heavy')) { nb.vx *= .6; nb.vy *= .6; nb.dmg *= 2; nb.kb = 3; nb.r = 7; }
            if (t.includes('pierce1')) nb.pierce += 1;
            if (t.includes('split')) nb.fsplit = true;
            if (t.includes('burn')) nb.burn = true;
            if (t.includes('poison')) nb.poison = true;
            if (t.includes('corrode')) nb.corrode = true;
            if (t.includes('mark')) nb.mark = true;
            if (t.includes('hom')) nb.hom = true;
            if (t.includes('expl') || t.includes('mine')) nb.expl = true;
            if (t.includes('lag')) nb.lag = true;
            if (t.includes('pullHit')) nb.pull = true;
            if (t.includes('collapse')) nb.collapse = true;
          }
          RUN.bullets.push(nb);
        });
        if (targets.length) SFX.shoot(2)
      }
    }
    if (ST.static) {
      const LU = LAB();
      if (LU && LU.on) {
        if (LU.on.includes('auraRad')) { p.radT = (p.radT || 0) - dt; if (p.radT <= 0) { p.radT = .5; RUN.enemies.forEach(e => { if (!e.dead && d2(e.x, e.y, p.x, p.y) < 95 * 95) dmgEnemy(e, ST.dmg * .2, { quiet: true }); }); } }
        if (LU.on.includes('stillCharge') && !dx && !dy) p.hp = Math.min(ST.hp, p.hp + 2.5 * dt);
        if (LU.on.includes('sparkTrail') && (dx || dy)) { p.sparkT = (p.sparkT || 0) - dt; if (p.sparkT <= 0) { p.sparkT = .4; burst(p.x, p.y, 55); const t = nearestEnemy(p.x, p.y); if (t && d2(t.x, t.y, p.x, p.y) < 70 * 70) dmgEnemy(t, ST.dmg * .5, { quiet: true }); } }
      }
      p.staticT -= dt; if (p.staticT <= 0) {
        p.staticT = .5;
        RUN.enemies.forEach(e => { if (!e.dead && d2(e.x, e.y, p.x, p.y) < 100 * 100) dmgEnemy(e, ST.dmg * .17 * ST.static, { quiet: true }) })
      }
    }
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
    if (RUN.mode === 'coop' || RUN.mode === 'net_coop') {
      const other = RUN.players.find(q => q.id !== p.id);
      if (other && other.downed && d2(p.x, p.y, other.x, other.y) < 70 * 70) {
        other.revive += dt;
        if (other.revive >= 2) {
          other.downed = false; other.hp = ST.hp * .5; other.revive = 0; SFX.revive();
          ringFx(other.x, other.y, 140, 100); banner(other.name + ' REVIVED', 1400)
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
      if (ST.homing || b.hom) {
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
      if (b.acc) { const sp = Math.hypot(b.vx, b.vy) || 1; const ns = sp + b.acc * dt; b.vx *= ns / sp; b.vy *= ns / sp; }
      if (b.collapse && !b.done && b.life < .8) { b.done = true; b.expl = true; b.life = 0; }
      for (const e of RUN.enemies) {
        if (e.dead || b.hit.includes(e)) continue;
        if (d2(b.x, b.y, e.x, e.y) < (b.r + e.r) * (b.r + e.r)) {
          dmgEnemy(e, b.dmg, { big: b.crit, col: b.crit ? '#ffd166' : undefined, pierce: b.pierce > 0 });
          for (let i = 0; i < 3; i++)RUN.parts.push({ x: b.x, y: b.y, vx: rnd(-120, 120), vy: rnd(-120, 120), t: .2, life: .2, hue: RUN.hue, r: 1.5 });
          if (!e.dead && !e.boss) { const ka = Math.atan2(b.vy, b.vx); e.x += Math.cos(ka) * ST.kb * .06; e.y += Math.sin(ka) * ST.kb * .06 }
          applyTraitHit(b, e);
          if (b.burn) addBurn(e, ST.dmg * .35, 3);
          if (b.poison) addPoison(e, ST.dmg * .45, 3.5);
          if (b.corrode) addCorrode(e, 4, .3);
          if (b.mark) e.mark = Math.max(e.mark, 4);
          if (b.pull) RUN.enemies.forEach(o => { if (!o.dead && d2(o.x, o.y, b.x, b.y) < 140 * 140) { const aa = Math.atan2(b.y - o.y, b.x - o.x); o.x += Math.cos(aa) * 46; o.y += Math.sin(aa) * 46; } });
          if (b.kb && !e.dead && !e.boss) { const ka = Math.atan2(b.vy, b.vx); e.x += Math.cos(ka) * 20; e.y += Math.sin(ka) * 20; }
          applyElemHit(b, e);
          if (b.crit) {
            if (ST.vamp) { const owner = RUN.players.find(pp => pp.id === b.owner); if (owner && !owner.downed) owner.hp = Math.min(ST.hp, owner.hp + ST.vamp) }
            if (ST.freeze && !e.boss) e.stun = Math.max(e.stun, .28 * ST.freeze)
          }
          if (!e.dead && e.type === 'mirror' && Math.random() < .25) ebul(e.x, e.y, Math.atan2(b.vy, b.vx), 260, e.dmg || 10);
          if (b.pierce > 0) {
            b.pierce--; b.hit.push(e);
            if (ST.splitshot && Math.random() < .5) {
              const a = Math.atan2(b.vy, b.vx);
              for (let k = -1; k <= 1; k += 2)RUN.bullets.push({
                x: b.x, y: b.y, vx: Math.cos(a + k * .5) * ST.ps * .6, vy: Math.sin(a + k * .5) * ST.ps * .6,
                dmg: ST.dmg * .3 * ST.splitshot, r: 3, pierce: 0, hit: [], life: .5, owner: b.owner
              })
            }
          }
          else {
            let bounced = false;
            if (ST.ricochet > 0) {
              if (b.ric === undefined) b.ric = ST.ricochet;
              if (b.ric > 0) {
                let best = null, bd = 260000;
                RUN.enemies.forEach(o => { if (o !== e && !o.dead && !b.hit.includes(o)) { const dd = d2(b.x, b.y, o.x, o.y); if (dd < bd) { bd = dd; best = o } } });
                if (best) {
                  const a = Math.atan2(best.y - b.y, best.x - b.x), spB = Math.hypot(b.vx, b.vy);
                  b.vx = Math.cos(a) * spB; b.vy = Math.sin(a) * spB; b.ric--; b.hit.push(e); bounced = true
                }
              }
            }
            if (!bounced) {
              b.life = 0; if (ST.fission && b.main && !b.frag) {
                for (let k = -1; k <= 1; k += 2) {
                  const a = Math.atan2(b.vy, b.vx) + k * .7;
                  RUN.bullets.push({
                    x: b.x, y: b.y, vx: Math.cos(a) * ST.ps * .7, vy: Math.sin(a) * ST.ps * .7, dmg: ST.dmg * .45,
                    r: 3, pierce: 0, hit: [], life: .7, frag: true, owner: b.owner
                  })
                }
              }
            }
            break
          }
        }
      }
    });
    RUN.bullets.forEach(b => { if (b.life <= 0 && !b._ended) { b._ended = true; bulletEnd(b); } });
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
        if (e.burn) {
          e.burn.t -= dt; e.bT = (e.bT || 0) - dt;
          if (e.bT <= 0) { e.bT = .5; dmgEnemy(e, e.burn.dps * (e.burn.s || 1) * .5, { quiet: true }); burst(e.x, e.y, 25); }
          if (e.burn.t <= 0) e.burn = null;
          if (e.dead) return
        }
        if (e.corrode > 0) e.corrode -= dt;
        if (e.freeze > 0) e.freeze -= dt;
        e.poison.t -= dt; e.pT = (e.pT || 0) - dt;
        if (e.pT <= 0) { e.pT = .5; dmgEnemy(e, e.poison.dps * .5, { quiet: true }); burst(e.x, e.y, e.poison.hue) }
        if (e.poison.t <= 0) e.poison = null; if (e.dead) return
      }
      if (e.burn) { cx.strokeStyle = 'hsla(20,90%,55%,.7)'; cx.lineWidth = 2; cx.beginPath(); cx.arc(0, 0, e.r + 3, 0, TAU); cx.stroke(); }
      if (e.corrode > 0) { cx.strokeStyle = 'hsla(90,80%,50%,.6)'; cx.lineWidth = 2; cx.setLineDash([4, 3]); cx.beginPath(); cx.arc(0, 0, e.r + 5, 0, TAU); cx.stroke(); cx.setLineDash([]); }
      if (e.freeze > 0) { cx.strokeStyle = 'rgba(170,240,255,.9)'; cx.lineWidth = 2; cx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; cx.lineTo(Math.cos(a) * (e.r + 4), Math.sin(a) * (e.r + 4)); } cx.closePath(); cx.stroke(); }
      const tp = nearestPlayer(e.x, e.y);
      let dx = tp.x - e.x, dy = tp.y - e.y, d = Math.hypot(dx, dy) || 1, mx = dx / d, my = dy / d;
      if (e.type === 'shielder') e.face = Math.atan2(dy, dx);
      if (e.stun > 0) { e.stun -= dt }
      else if (e.boss) { bossAI(e, dt, mx, my, d) }
      else {
        let sp = e.spd * (e.slowT > 0 ? .55 : 1);
        // Five special archetypes have their own clearly telegraphed powers.
        if (e.special === 'blink') {
          e.specialT = (e.specialT || 2.4) - dt;
          if (e.specialT <= 0) { e.specialT = 3.6; e.x = clamp(tp.x + rnd(-180, 180), 24, W - 24); e.y = clamp(tp.y + rnd(-180, 180), 24, H - 24); ringFx(e.x, e.y, e.hue, 90) }
        }
        if (e.special === 'arc') {
          e.specialT = (e.specialT || 2.8) - dt;
          if (e.specialT <= 0) { e.specialT = 3.2; const a = Math.atan2(dy, dx); for (let i = -2; i <= 2; i++) ebul(e.x, e.y, a + i * .18, 250, e.dmg) }
        }
        if (e.special === 'split' && e.hp < e.maxhp * .5 && !e.specialUsed) {
          e.specialUsed = true; for (let i = 0; i < 4; i++) spawnEnemy('swarm', e.x + rnd(-24, 24), e.y + rnd(-24, 24)); ringFx(e.x, e.y, e.hue, 75)
        }
        if (e.special === 'pull') {
          e.specialT = (e.specialT || 4.5) - dt;
          if (e.specialT <= 0) { e.specialT = 5.5; RUN.pullT = 1.1; RUN.pullSrc = { x: e.x, y: e.y }; ringFx(e.x, e.y, e.hue, 150) }
        }
        if (e.special === 'mirror') {
          e.specialT = (e.specialT || 3) - dt;
          if (e.specialT <= 0) { e.specialT = 3.8; const a = Math.atan2(dy, dx); for (let i = -1; i <= 1; i++) ebul(e.x, e.y, a + i * .2, 275, e.dmg) }
        }
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
        if (e.type === 'ghost') {
          e.phaseT -= dt; if (e.phaseT <= 0) { e.invuln = !e.invuln; e.phaseT = e.invuln ? 1.1 : 2.3 }
        }
        if (e.type === 'charger') {
          e.chgT -= dt;
          if (e.chgT <= 0) { e.charging = .55; e.chgT = rnd(2.8, 4.4) }
          if (e.charging > 0) { e.charging -= dt; sp *= 4 }
        }
        if (e.type === 'juggler') {
          if (d < 280) { mx = -mx; my = -my }
          e.shootT -= dt; if (e.shootT <= 0 && d < 520) {
            e.shootT = 2.6; const a0 = Math.atan2(dy, dx);
            for (let k = -1; k <= 1; k++)ebul(e.x, e.y, a0 + k * .28, 210, 9)
          }
        }
        if (e.type === 'seeder') {
          e.seedT -= dt; if (e.seedT <= 0 && RUN.enemies.length < 130) { e.seedT = rnd(3.5, 5.5); spawnEnemy('swarm', e.x + rnd(-20, 20), e.y + rnd(-20, 20)) }
        }
        if (!(e.freeze > 0)) { e.x += mx * sp * dt; e.y += my * sp * dt }
      }
      if (e.slowT > 0) e.slowT -= dt;
      e.touch -= dt;
      RUN.players.forEach(p => {
        if (!p.downed && e.touch <= 0 && d2(e.x, e.y, p.x, p.y) < (e.r + 13) * (e.r + 13)) {
          hurtPlayer(p, e.dmg); e.touch = .7;
          if (e.type === 'vampire') e.hp = Math.min(e.maxhp, e.hp + e.dmg * .6);
          if (e.type === 'crusher') { const ka = Math.atan2(p.y - e.y, p.x - e.x); p.x += Math.cos(ka) * 46; p.y += Math.sin(ka) * 46 }
        }
      })
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
          else if(k.t==='powerup'){RUN.pvpPowerups=RUN.pvpPowerups.filter(id=>id!==k.powerupId);applyPvpPowerup(p,k.powerupId)}
          else if(k.t==='powerup'){cx.beginPath();cx.arc(0,0,10,0,TAU);cx.fill();cx.fillStyle='#fff';cx.font='bold 9px sans-serif';cx.textAlign='center';cx.fillText(pu?pu.ic:'?',0,3)}
      else if (k.t === 'relic') {
            if (!RUN.relics.includes(k.v)) {
              RUN.relics.push(k.v); computeStats();
              const r = RELICS.find(r => r.id === k.v); banner('RELIC: ' + r.n, 1600); SFX.unlock(); ringFx(p.x, p.y, 260, 120)
            }
          }
          if (ST.lifeline) p.hp = Math.min(ST.hp, p.hp + ST.hp * .02 * ST.lifeline)
        }
      })
    });
    RUN.pickups = RUN.pickups.filter(k => !k.got)
  }
  function broadcastGameState(force) {
    if (!RUN || !RUN.isOnline || !NET.isHost) return;

    if (!force && RUN.t - RUN.lastSnapshotAt < 1 / 30) return;
    RUN.lastSnapshotAt = RUN.t;

    NET.broadcastSnapshot({
      t: RUN.t,
      wave: RUN.wave,
      state: RUN.state,
      interT: RUN.interT,
      spawnLeft: RUN.spawnLeft,
      level: RUN.level,
      xp: RUN.xp,
      coins: RUN.coins,
      kills: RUN.kills,

      vw: W,
      vh: H,

      players: RUN.players.map(p => ({
        id:p.id,signatureSlot:p.signatureSlot||0,
        x: p.x,
        y: p.y,
        hp: p.hp,
        sh: p.sh,
        downed: p.downed,
        angle: p.angle,
        kills: p.kills,
        deaths: p.deaths,
        respawnTimer: p.respawnTimer,
        dashCd: p.dashCd,
        activeCd:p.activeCd,puDamage:p.puDamage||1,puSpeed:p.puSpeed||1,puRate:p.puRate||1,puName:p.puName||'',
        iframes: p.iframes
      })),

      enemies: RUN.enemies.filter(e => !e.dead).map(e => ({
        burn: e.burn ? (e.burn.s || 1) : 0, freeze: e.freeze || 0, corrode: e.corrode || 0,
        id: e.eid,
        type: e.type,
        x: e.x,
        y: e.y,
        hp: e.hp,
        maxhp: e.maxhp,
        hue: e.hue,
        r: e.r,
        shape: e.shape,
        seed: e.seed,
        boss: e.boss,
        elite: e.elite,
        name: e.name,
        face: e.face,
        burn: e.burn ? (e.burn.s || 1) : 0,
        freeze: e.freeze || 0,
        corrode: e.corrode || 0
      })),

      bullets: RUN.bullets.map(b => ({
        x: b.x,
        y: b.y,
        vx: b.vx,
        vy: b.vy,
        r: b.r,
        crit: b.crit,
        owner: b.owner
      })),

      ebullets: RUN.ebullets.map(b => ({
        x: b.x,
        y: b.y,
        r: b.r
      })),

      pickups: RUN.pickups.map(k => ({
        t:k.t,powerupId:k.powerupId,
        x: k.x,
        y: k.y,
        v: k.v
      })),

      clouds: RUN.clouds.map(c => ({
        x: c.x,
        y: c.y,
        r: c.r
      })),

      eclouds: RUN.eclouds.map(c => ({
        x: c.x,
        y: c.y,
        r: c.r,
        friendly: c.friendly
      })),

      wells: RUN.wells.map(w => ({
        x: w.x,
        y: w.y
      })),

      boss: RUN.boss ? {
        hp: RUN.boss.hp,
        maxhp: RUN.boss.maxhp,
        name: RUN.boss.name
      } : null,

      over: RUN.state === 'over' ? RUN.overInfo : null,
      fx: RUN.fxQueue && RUN.fxQueue.length ? RUN.fxQueue.splice(0, 240) : [],
      levelPools: (RUN.state === 'level' && RUN.pools) ? RUN.pools : null,
      levelDone:(RUN.state === 'level')?RUN.levelDone:null,pvpPowerups:RUN.pvpPowerups||[],
    });
  }
  function mergeShots(oldArr, incoming, rad) {
    const used = new Set(), rad2 = rad * rad;
    return incoming.map(nb => {
      let bi = -1, bd = rad2;
      for (let i = 0; i < oldArr.length; i++) {
        if (used.has(i)) continue;
        const dd = d2(oldArr[i].x, oldArr[i].y, nb.x, nb.y);
        if (dd < bd) { bd = dd; bi = i; }
      }
      if (bi >= 0) {
        used.add(bi);
        const o = oldArr[bi];
        o.x += (nb.x - o.x) * .3; o.y += (nb.y - o.y) * .3;
        o.vx = nb.vx; o.vy = nb.vy; o.r = nb.r; o.crit = nb.crit;
        return o;
      }
      return nb;
    });
  }

  function smoothClientWorld(dt) {
    const k = 1 - Math.exp(-16 * dt);
    RUN.players.forEach(p => {
      if (p._tx !== undefined) { p.x += (p._tx - p.x) * k; p.y += (p._ty - p.y) * k; }
      p.dashCd = Math.max(0, p.dashCd - dt); p.activeCd = Math.max(0, p.activeCd - dt);
    });
    RUN.enemies.forEach(e => {
      if (e._tx !== undefined) { e.x += (e._tx - e.x) * k; e.y += (e._ty - e.y) * k; }
      e.flash = Math.max(0, (e.flash || 0) - dt);
    });
    RUN.bullets.forEach(b => { b.x += (b.vx || 0) * dt; b.y += (b.vy || 0) * dt; });
    RUN.ebullets.forEach(b => { b.x += (b.vx || 0) * dt; b.y += (b.vy || 0) * dt; });
    RUN.pickups.forEach(pk => { if (pk._tx !== undefined) { pk.x += (pk._tx - pk.x) * k; pk.y += (pk._ty - pk.y) * k; } });
    RUN.parts.forEach(q => { q.t -= dt; if (!q.arc && !q.ring) { q.x += (q.vx || 0) * dt; q.y += (q.vy || 0) * dt; } });
    RUN.parts = RUN.parts.filter(q => q.t > 0);
    if (RUN.parts.length > 700) RUN.parts.splice(0, RUN.parts.length - 700);
    RUN.texts.forEach(t => { t.t -= dt; t.y -= 30 * dt; });
    RUN.texts = RUN.texts.filter(t => t.t > 0);
    if (RUN.shake > 0) RUN.shake = Math.max(0, RUN.shake - dt * 30);
  }

  function update(dt) {
    if (!RUN) return;

    // Clients do not simulate the world. They send their controls to the host
    // and render the authoritative state received in NET.onStateSnapshot.

    if (RUN.isOnline && !NET.isHost) {
      smoothClientWorld(dt);
      if (RUN.state === 'play' || RUN.state === 'inter') {
        const localP = RUN.players[RUN.localNetId];

        if (localP) {
          const { dx, dy } = movementInput(localP);
          const angle = Math.atan2(mouse.y - localP.y, mouse.x - localP.x);

          NET.sendClientInput({
            dx,
            dy,
            angle,
            aimNX: clamp(mouse.x / W, 0, 1),
            aimNY: clamp(mouse.y / H, 0, 1),
            fire: mouse.down || autofire
          });
        }
      }

      hud();
      return;
    }

    if (RUN.state === 'level' || RUN.state === 'pause' || RUN.state === 'over') return;
    RUN.t += dt; RUN.shake = Math.max(0, RUN.shake - dt * 30);
    let wdt = dt;
    if (RUN.hitstop > 0) { RUN.hitstop -= dt; wdt = 0 }
    else if (RUN.slowmo > 0) { RUN.slowmo -= dt; wdt = dt * .35 }
    if (RUN.pullT > 0) RUN.pullT -= dt;

    RUN.players.forEach(p => updPlayer(p, wdt));

    if (RUN.mode === 'pvp' || RUN.mode === 'net_pvp') {
      // PvP player bullet collisions
      RUN.bullets.forEach(b => {
        RUN.players.forEach(p => {
          if (p.id !== b.owner && !p.downed && p.iframes <= 0) {
            if (d2(b.x, b.y, p.x, p.y) < (b.r + 14) * (b.r + 14)) {
              hurtPlayerPVP(p, b.dmg, b.owner);
              b.life = 0;
            }
          }
        });
      });
    } else if ((RUN.mode === 'coop' || RUN.mode === 'net_coop') && RUN.friendlyFire && RUN.players.length > 1) {
      // Friendly fire: co-op player bullets can hurt teammates
      RUN.bullets.forEach(b => {
        RUN.players.forEach(p => {
          if (p.id !== b.owner && !p.downed) {
            if (d2(b.x, b.y, p.x, p.y) < (b.r + 14) * (b.r + 14)) {
              hurtPlayer(p, b.dmg * .6);
              b.life = 0;
            }
          }
        });
      });
    }

    if (RUN.state === 'inter') { RUN.interT -= wdt; if (RUN.interT <= 0) startWave() }
    else if (RUN.mode !== 'pvp' && RUN.mode !== 'net_pvp') {
      spawnLoop(wdt);
      if (RUN.spawnLeft <= 0 && RUN.enemies.length === 0 && RUN.state === 'play') {
        const bonus = 5 + RUN.wave; RUN.coins += bonus; SAVE.addCoins(bonus); SAVE.addMxp(RUN.el.id, 5);
        banner('WAVE ' + RUN.wave + ' CLEARED  +◈' + bonus, 1600);
        RUN.state = 'inter'; RUN.interT = 4
      }
    }

    if((RUN.mode==='pvp'||RUN.mode==='net_pvp')&&RUN.state==='play'){RUN.powerupNext-=wdt;if(RUN.powerupNext<=0){RUN.powerupNext=rnd(6,12);spawnPvpPowerup()}}
    updEnemies(wdt); updBullets(wdt); updPickups(wdt);
    RUN.eclouds.forEach(c => {
      c.t -= wdt;
      RUN.players.forEach(p => { if (!c.friendly && !p.downed && d2(p.x, p.y, c.x, c.y) < c.r * c.r) hurtPlayer(p, 10 * wdt * 3) })
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
    if ((RUN.mode === 'coop' || RUN.mode === 'net_coop') && RUN.players.every(p => p.downed)) endRun(true);

    broadcastGameState(false);

    hud();
  }
  let banT = null;
  function banner(txt, ms) {
    const b = document.getElementById('banner'); b.textContent = txt; b.classList.remove('hidden');
    clearTimeout(banT); banT = setTimeout(() => b.classList.add('hidden'), ms)
  }
  function pause() {
    if (!RUN) return;
    if (RUN.isOnline && !NET.isHost) { NET.sendClientAction('togglePause'); return; }
    RUN.state = 'pause';
    document.getElementById('pause-info').textContent = `WAVE ${RUN.wave} · LV ${RUN.level} · ◈ ${RUN.coins}`;
    document.getElementById('m-pause').classList.remove('hidden');
    broadcastGameState(true);
  }
  function resume() {
    if (!RUN) return;
    if (RUN.isOnline && !NET.isHost) { NET.sendClientAction('togglePause'); return; }
    RUN.state = RUN.enemies.length || RUN.spawnLeft > 0 ? 'play' : 'inter';
    document.getElementById('m-pause').classList.add('hidden');
    broadcastGameState(true);
  }
  function togglePause() {
    if (!RUN) return;
    if (RUN.state === 'pause') resume(); else if (RUN.state === 'play' || RUN.state === 'inter') pause();
  }
  function hud() {
    const p0 = RUN.players[RUN.localNetId] || RUN.players[0] || { dashCd: 0, activeCd: 0 }, el = RUN.el, col = `hsl(${el.hue} 75% 60%)`;
    const pColors = ['var(--cy)', '#ff5d8f', '#5dff9e', '#ffb454'];
    document.getElementById('hp-bars').innerHTML = RUN.players.map((p, i) => `
  <div><div class="plabel" style="color:${pColors[i % 4]}">${p.name}${p.downed ? ' · DOWNED' : ''}</div>
  <div class="bar"><i style="transform:scaleX(${clamp(p.hp / ST.hp, 0, 1)})"></i>
   <span>${Math.ceil(Math.max(0, p.hp))}/${ST.hp}</span></div>
  ${ST.shieldMax ? `<div class="bar sh"><i style="transform:scaleX(${clamp(p.sh / ST.shieldMax, 0, 1)})"></i></div>` : ''}</div>`).join('');

    document.getElementById('h-wave').textContent = 'WAVE ' + String(Math.max(1, RUN.wave)).padStart(2, '0');
    document.getElementById('h-foes').textContent = RUN.mode === 'pvp' || RUN.mode === 'net_pvp' ? 'PVP ARENA' : (RUN.state === 'inter' ? 'NEXT WAVE IN ' + Math.ceil(RUN.interT) : 'HOSTILES: ' + (RUN.enemies.length + RUN.spawnLeft));
    document.getElementById('h-coins').textContent = '◈ ' + RUN.coins;
    document.getElementById('h-kills').textContent = 'KILLS ' + RUN.kills;
    document.getElementById('h-lv').textContent = 'LV ' + RUN.level;
    document.getElementById('h-mode').textContent = (RUN.mode || '').toUpperCase();
    document.getElementById('xpfill').style.transform = `scaleX(${clamp(RUN.xp / xpNeed(RUN.level), 0, 1)})`;
    document.getElementById('xptxt').textContent = 'LV ' + RUN.level + ' · ' + Math.floor(RUN.xp) + ' / ' + xpNeed(RUN.level) + ' XP';
    document.getElementById('dashfill').style.width = (100 * (1 - p0.dashCd / ST.dashCd)) + '%';
    document.getElementById('qfill').style.width = (100 * (1 - p0.activeCd / ST.activeCd)) + '%';
    if (RUN.boss) document.getElementById('bossfill').style.transform = `scaleX(${clamp(RUN.boss.hp / RUN.boss.maxhp, 0, 1)})`;
    document.getElementById('h-elem').style.borderColor = col;
    document.getElementById('h-elem').style.color = col;
    document.getElementById('h-num').textContent = el.mol ? '⚗' : el.n;
    document.getElementById('h-sym').textContent = el.mol ? el.f.slice(0, 3) : el.sym;

    // PvP Scoreboard update
    if (RUN.mode === 'pvp' || RUN.mode === 'net_pvp') {
      const list = [...RUN.players].sort((a, b) => b.kills - a.kills);
      document.getElementById('pvp-scores-list').innerHTML = list.map(p =>
        `<div style="display:flex;justify-content:space-between;gap:12px;margin-top:2px;color:${pColors[p.id % 4]}">
          <span>${p.name} (${p.elem ? p.elem.sym : 'H'})</span><b>${p.kills} / ${RUN.pvpTargetKills}</b>
        </div>`).join('');
    }
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
      const pu=PVP_POWERUPS.find(u=>u.id===k.powerupId); const col=k.t==='coin'?'#ffb454':k.t==='xp'?'#4fd8eb':k.t==='hp'?'#7ef0a6':k.t==='powerup'?`hsl(${pu?pu.hue:0} 85% 62%)`:'#a78bff';
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
    const pPalette = [`hsl(${RUN.hue} 80% 62%)`, '#ff5d8f', '#5dff9e', '#ffb454'];
    RUN.players.forEach((p, idx) => {
      const pc = pPalette[idx % 4];
      if (p.downed) cx.globalAlpha = .4;
      if (p.iframes > 0 && Math.floor(RUN.t * 20) % 2 === 0) cx.globalAlpha *= .4;
      cx.save(); cx.translate(p.x, p.y);
      cx.strokeStyle = pc + '55'; cx.lineWidth = 2; cx.beginPath(); cx.arc(0, 0, 17, 0, TAU); cx.stroke();
      cx.fillStyle = '#0d1420'; cx.beginPath(); cx.arc(0, 0, 13, 0, TAU); cx.fill();
      cx.strokeStyle = pc; cx.lineWidth = 2.5; cx.stroke();
      cx.fillStyle = pc; cx.font = 'bold 12px "Chakra Petch"'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.fillText(p.elem ? (p.elem.mol ? '⚗' : p.elem.sym) : (RUN.el.mol ? '⚗' : RUN.el.sym), 0, 1);
      cx.rotate(p.angle); cx.strokeStyle = pc; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(14, 0); cx.lineTo(22, 0); cx.stroke();
      cx.restore();

      // Render overhead name
      cx.font = 'bold 10px "Share Tech Mono"'; cx.textAlign = 'center'; cx.fillStyle = pc;
      cx.fillText(p.name, p.x, p.y - 24);

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
    try {
      if (document.getElementById('scr-game').classList.contains('hidden')) renderBG(dt);
      else { update(dt); render() }
    } catch (err) {
      console.error('ISOTOPE loop error — recovering to menu:', err);
      RUN = null;
      try {
        document.getElementById('bosswrap').classList.add('hidden');
        document.getElementById('hitflash').style.opacity = 0;
        const pvpHud = document.getElementById('hud-pvp'); if (pvpHud) pvpHud.classList.add('hidden');
        ['m-over', 'm-pause', 'm-level', 'm-deploy', 'm-brief'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('hidden') });
        if (window.UI) { UI.show('scr-menu'); UI.toast('A run error occurred — returned to menu.', 'bad') }
        else { document.getElementById('scr-game').classList.add('hidden'); document.getElementById('scr-menu').classList.remove('hidden') }
      } catch (e2) { console.error('ISOTOPE recovery error:', e2) }
    }
    requestAnimationFrame(loop)
  }

  // Network Callbacks Setup
  if (window.NET) {
    NET.onGameStart = (config, netPlayers, localId) => {
      if (window.UI) UI.show('scr-game');
      else { document.getElementById('scr-lobby').classList.add('hidden'); document.getElementById('scr-game').classList.remove('hidden') }
      start(netPlayers[localId].elementId, config.mode === 'pvp' ? 'net_pvp' : config.mode === 'boss' ? 'net_boss' : 'net_coop', netPlayers, true, localId);
    };

    NET.onClientInput = (playerId, input) => {
      if (!RUN || !RUN.players[playerId]) return;
      RUN.players[playerId].netInput = input;
    };

    NET.onClientAction = (playerId, action) => {
      if (!RUN || !NET.isHost) return;
      const p = RUN.players[playerId];
      if (!p) return;
      if (action === 'dash') tryDash(p);
      else if (action === 'active') useActive(p);
      else if (action === 'togglePause') togglePause();
      else if (typeof action === 'string' && action.indexOf('pick:') === 0) chooseCard(playerId, action.slice(5));
    };

    NET.onStateSnapshot = (snapshot) => {
      if (!RUN || NET.isHost) return;
      RUN.hostW = snapshot.vw || RUN.hostW || W;
      RUN.hostH = snapshot.vh || RUN.hostH || H;

      const sx = W / RUN.hostW;
      const sy = H / RUN.hostH;
      const s = Math.min(sx, sy);

      if (snapshot.fx) {
        snapshot.fx.forEach(ev => {
          if(ev.k==='shake') RUN.shake=Math.max(RUN.shake,ev.v||8); else if(ev.k==='banner') banner(ev.text||'SIGNATURE',900); else if (ev.k === 'ring') ringFx(ev.x * sx, ev.y * sy, ev.hue, ev.grow * s, ev.r0 * s);
          else if (ev.k === 'burst') burst(ev.x * sx, ev.y * sy, ev.hue);
          else if (ev.k === 'arc') RUN.parts.push({ x: ev.x * sx, y: ev.y * sy, x2: ev.x2 * sx, y2: ev.y2 * sy, t: .14, life: .14, hue: ev.hue, arc: true });
          else if (ev.k === 'txt') RUN.texts.push({ x: ev.x * sx, y: ev.y * sy, t: .6, life: .6, s: ev.s, big: ev.big, col: ev.col });
        });
      }

      const first = !RUN.netSnapOnce;
      RUN.netSnapOnce = true;

      RUN.t = snapshot.t;
      RUN.wave = snapshot.wave;
      RUN.state = snapshot.state;
      RUN.interT = snapshot.interT || 0;
      RUN.spawnLeft = snapshot.spawnLeft || 0;
      RUN.level = snapshot.level || RUN.level;
      RUN.xp = snapshot.xp || 0;
      RUN.coins = snapshot.coins || 0;
      RUN.kills = snapshot.kills || 0;

      const el = id => document.getElementById(id);
      const show = id => {
        const n = el(id);
        if (n) n.classList.remove('hidden');
      };
      const hide = id => {
        const n = el(id);
        if (n) n.classList.add('hidden');
      };

      if (RUN.state === 'pause') {
        if (el('pause-info')) {
          el('pause-info').textContent = `WAVE ${RUN.wave} · LV ${RUN.level} · ◈ ${RUN.coins}`;
        }
        show('m-pause');
      } else {
        hide('m-pause');
      }

      if (RUN.state === 'level') {
        show('m-level');
        const done = !!(snapshot.levelDone && snapshot.levelDone[RUN.localNetId]);
        const myPool = snapshot.levelPools ? snapshot.levelPools[RUN.localNetId] : null;
        const uiKey = (done ? 'd' : 'p') + (myPool ? 'm' : 'n');
        if (RUN._lvlUI !== uiKey) {
          RUN._lvlUI = uiKey;
          if (!done && myPool) renderPool(myPool, 'client');
          else if (el('cards')) el('cards').innerHTML = WAIT_HTML;
        }
      } else {
        hide('m-level');
        RUN._lvlUI = null;
      }

      if (RUN.state === 'over') {
        if (snapshot.over) {
          const o = snapshot.over;

          const rows = [
            ['WAVE REACHED', 'WAVE ' + o.wave],
            ['ENEMIES DESTROYED', o.kills],
            ['ISOTOPE LEVEL', 'LV ' + o.level],
            ['COINS BANKED', '◈ ' + o.coins],
            ['MASTERY XP', '◆ ' + o.mxp],
            ['BEST WAVE', 'WAVE ' + o.bestWave + (o.nb ? ' ★' : '')]
          ];

          if (el('ov-rows')) {
            el('ov-rows').innerHTML = rows.map(r =>
              `<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`
            ).join('');
          }

          if (el('over-flavor')) {
            el('over-flavor').textContent = o.died
              ? 'Your isotope has decayed into the lattice.'
              : 'Run abandoned.';
          }

          const retry = el('btn-retry');
          if (retry) {
            retry.disabled = true;
            retry.textContent = 'WAIT FOR HOST';
          }
        }

        show('m-over');
      } else {
        hide('m-over');
      }

      if (RUN.state === 'play' || RUN.state === 'inter') {
        hide('m-deploy');
        hide('m-brief');
      }

      if (snapshot.players) {
        snapshot.players.forEach(sp => {
          const p = RUN.players[sp.id];
          if (!p) return;
          const tx = sp.x * sx, ty = sp.y * sy;
          if (first || p._tx === undefined || d2(p.x, p.y, tx, ty) > 260 * 260) { p.x = tx; p.y = ty; }
          p._tx = tx; p._ty = ty;
          if (sp.id === RUN.localNetId && sp.hp < p.hp - .5) {
            document.getElementById('hitflash').style.opacity = 1;
            setTimeout(() => document.getElementById('hitflash').style.opacity = 0, 120);
            RUN.shake = Math.max(RUN.shake, 6); SFX.hurt();
          }
          p.hp = sp.hp; p.sh = sp.sh; p.downed = sp.downed; p.angle = sp.angle;
          p.signatureSlot=sp.signatureSlot||0; p.kills=sp.kills; p.deaths=sp.deaths; p.respawnTimer = sp.respawnTimer;
          p.dashCd=sp.dashCd||0;p.activeCd=sp.activeCd||0;p.iframes=sp.iframes||0;p.puDamage=sp.puDamage||1;p.puSpeed=sp.puSpeed||1;p.puRate=sp.puRate||1;p.puName=sp.puName||'';
        });
      }

      if (!RUN.enemyMap) RUN.enemyMap = new Map();

      if (snapshot.enemies) {
        const prev = {};
        RUN.enemies.forEach(e => { prev[e.id] = e; });
        RUN.enemies = snapshot.enemies.map((se, i) => {
          const id = se.id !== undefined ? se.id : i;
          const tx = se.x * sx, ty = se.y * sy;
          const old = prev[id];

          return {
            id, type: se.type,
            x: old ? old.x : tx, y: old ? old.y : ty,
            _tx: tx, _ty: ty,
            hp: se.hp, maxhp: se.maxhp, hue: se.hue,
            r: Math.max(2, se.r * s), shape: se.shape, seed: se.seed || 0,
            boss: se.boss, elite: se.elite, name: se.name, face: se.face || 0,
            burn: se.burn || 0,
            freeze: se.freeze || 0,
            corrode: se.corrode || 0
          };
        });
      }

      if (snapshot.bullets) {
        const inc = snapshot.bullets.map(b => ({ x: b.x * sx, y: b.y * sy, vx: (b.vx || 0) * sx, vy: (b.vy || 0) * sy, r: Math.max(2, b.r * s), crit: b.crit, owner: b.owner }));
        RUN.bullets = mergeShots(RUN.bullets, inc, 90);
      }
      if (snapshot.ebullets) {
        const inc = snapshot.ebullets.map(b => ({ x: b.x * sx, y: b.y * sy, vx: (b.vx || 0) * sx, vy: (b.vy || 0) * sy, r: Math.max(2, b.r * s), dmg: b.dmg || 10, life: 6 }));
        RUN.ebullets = mergeShots(RUN.ebullets, inc, 90);
      }
      if (snapshot.pickups) {
        RUN.pickups = snapshot.pickups.map(k => ({ t:k.t,powerupId:k.powerupId,v:k.v, x: k.x * sx, y: k.y * sy, _tx: k.x * sx, _ty: k.y * sy, vx: 0, vy: 0 }));
      }

      if (snapshot.clouds) {
        RUN.clouds = snapshot.clouds.map(c => ({
          x: c.x * sx,
          y: c.y * sy,
          r: c.r * s,
          t: 1
        }));
      }

      if (snapshot.eclouds) {
        RUN.eclouds = snapshot.eclouds.map(c => ({
          x: c.x * sx,
          y: c.y * sy,
          r: c.r * s,
          t: 1,
          friendly: c.friendly
        }));
      }

      if (snapshot.wells) {
        RUN.wells = snapshot.wells.map(w => ({
          x: w.x * sx,
          y: w.y * sy,
          t: 1,
          lv: 1
        }));
      }

      if (snapshot.boss) {
        if (!RUN.boss) {
          show('bosswrap');
          if (el('bossname')) el('bossname').textContent = '⚠ ' + snapshot.boss.name;
        }

        RUN.boss = snapshot.boss;
      } else {
        if (RUN.boss) {
          hide('bosswrap');
          RUN.boss = null;
        }
      }
    };
  }

  Object.assign(GAME, { CARD_RARITY, ALL_CARDS, PVP_POWERUPS, start, pause, resume, endRun });
  requestAnimationFrame(loop);


/* 

/* 
/* ISO_ABILITY_MASTER_GAME */
(function(){
if(window.__ISO_MASTER__) return; window.__ISO_MASTER__=true;
var oldUse=useActive, __oldFire=fire, __oldHit=applyElemHit, __oldDash=tryDash, __oldUpd=updPlayer;
function num(p){ var el=(p&&p.elem)||RUN.el; return (el&&!el.mol)?+el.n:0; }
function fxRing(x,y,hue,grow,r0,life){ if(!RUN)return; RUN.parts.push({ring:true,x:x,y:y,r0:r0||6,grow:grow||90,t:life||.5,life:life||.5,hue:hue}); }
function fxBurst(x,y,hue,n){ if(!RUN)return; n=n||10; for(var i=0;i<n;i++) RUN.parts.push({x:x,y:y,vx:rnd(-180,180),vy:rnd(-180,180),t:rnd(.18,.44),life:.5,hue:hue,r:rnd(1.5,3.8)}); }
function fxTele(x,y,r,dt,hue){ if(!RUN)return; RUN.parts.push({ring:true,x:x,y:y,r0:r*.22,grow:r*.55,t:dt,life:dt,hue:hue}); RUN.parts.push({ring:true,x:x,y:y,r0:r*.68,grow:r*.22,t:dt,life:dt,hue:hue}); }
function fxBeam(x,y,a,len,hue){ if(!RUN)return; var s=Math.max(4,Math.floor(len/18)); for(var i=0;i<=s;i++){ var t=i/s; RUN.parts.push({x:x+Math.cos(a)*len*t,y:y+Math.sin(a)*len*t,vx:rnd(-25,25),vy:rnd(-25,25),t:.22,life:.22,hue:hue,r:rnd(1.4,3.2)}); } }
function delayFx(fn,ms){ setTimeout(function(){ if(RUN) fn(); },ms); }
function near(x,y,r){ if(!RUN)return[]; return RUN.enemies.filter(function(e){ return !e.dead&&d2(e.x,e.y,x,y)<r*r; }); }
function applyStatus(e,st,d){ if(!e||e.dead||!st)return;
 if(st==='burn')addBurn(e,d*.35,4); else if(st==='poison')addPoison(e,d*.4,4); else if(st==='corrode')addCorrode(e,4,.35);
 else if(st==='slow')e.slowT=Math.max(e.slowT,2); else if(st==='freeze')addFreeze(e,.8); else if(st==='mark')e.mark=Math.max(e.mark,5);
 else if(st==='stun')e.stun=Math.max(e.stun,.9); else if(st==='conf')e.conf=Math.max(e.conf,1.5); }
function hitCircle(x,y,r,d,h,st){ if(!RUN)return; aoe(x,y,r,d,h); near(x,y,r).forEach(function(e){applyStatus(e,st,d);}); fxRing(x,y,h,r*.9,10,.42); fxBurst(x,y,h,12); }
function hitLine(x,y,a,len,w,d,h,st){ if(!RUN)return; var ca=Math.cos(a),sa=Math.sin(a);
 RUN.enemies.forEach(function(e){ if(e.dead)return; var px=e.x-x,py=e.y-y,t=clamp(px*ca+py*sa,0,len),cx2=x+ca*t,cy2=y+sa*t;
  if(d2(e.x,e.y,cx2,cy2)<(w+e.r)*(w+e.r)){ dmgEnemy(e,d); applyStatus(e,st,d); if(!e.boss){e.x+=ca*18;e.y+=sa*18;} } });
 fxBeam(x,y,a,len,h); fxRing(x+ca*len*.5,y+sa*len*.5,h,w*1.8,6,.28); RUN.shake=Math.max(RUN.shake,5); }
function hitCone(p,range,w,d,h,st){ if(!RUN||!p)return; var a0=p.angle;
 RUN.enemies.forEach(function(e){ if(e.dead)return; var dx=e.x-p.x,dy=e.y-p.y,dist=Math.hypot(dx,dy); if(dist>range+e.r)return;
  var da=Math.atan2(dy,dx)-a0; while(da>Math.PI)da-=TAU; while(da<-Math.PI)da+=TAU;
  if(Math.abs(da)<w){ dmgEnemy(e,d); applyStatus(e,st,d); if(!e.boss){e.x+=Math.cos(a0)*24;e.y+=Math.sin(a0)*24;} } });
 for(var i=0;i<14;i++){ var aa=a0+rnd(-w,w),rr=rnd(range*.25,range); RUN.parts.push({x:p.x+Math.cos(aa)*rr,y:p.y+Math.sin(aa)*rr,vx:Math.cos(aa)*rnd(60,220),vy:Math.sin(aa)*rnd(60,220),t:.28,life:.32,hue:h,r:rnd(1.5,3.4)}); }
 fxRing(p.x+Math.cos(a0)*range*.4,p.y+Math.sin(a0)*range*.4,h,range*.35,8,.3); }
function hitRing(x,y,rad,th,d,h,st){ if(!RUN)return;
 RUN.enemies.forEach(function(e){ if(e.dead)return; var dist=Math.hypot(e.x-x,e.y-y); if(Math.abs(dist-rad)<th+e.r){ dmgEnemy(e,d); applyStatus(e,st,d); if(!e.boss){ var a=Math.atan2(e.y-y,e.x-x); e.x+=Math.cos(a)*22; e.y+=Math.sin(a)*22; } } });
 fxRing(x,y,h,rad*.55,rad*.72,.45); }
function hitRect(x,y,w,hh,d,h,st){ if(!RUN)return;
 RUN.enemies.forEach(function(e){ if(e.dead)return; if(Math.abs(e.x-x)<w*.5+e.r&&Math.abs(e.y-y)<hh*.5+e.r){ dmgEnemy(e,d); applyStatus(e,st,d); } });
 for(var i=0;i<16;i++) RUN.parts.push({x:x+rnd(-w*.5,w*.5),y:y+rnd(-hh*.5,hh*.5),vx:rnd(-70,70),vy:rnd(-70,70),t:.25,life:.3,hue:h,r:rnd(1.2,3)});
 fxRing(x,y,h,Math.max(w,hh)*.35,10,.35); }
function hitBeam(x,y,a,len,w,d,h,st){ hitLine(x,y,a,len,w,d,h,st); fxRing(x+Math.cos(a)*len,y+Math.sin(a)*len,h,w*3,10,.35); }
function hitStar(x,y,r,pts,d,h,st){ if(!RUN)return;
 RUN.enemies.forEach(function(e){ if(e.dead)return; if(d2(e.x,e.y,x,y)<(r+e.r)*(r+e.r)){ dmgEnemy(e,d); applyStatus(e,st,d); } });
 for(var i=0;i<pts*2;i++){ var a=i/pts*Math.PI,rr=(i%2)?r:r*.4; RUN.parts.push({x:x+Math.cos(a)*rr,y:y+Math.sin(a)*rr,vx:Math.cos(a)*120,vy:Math.sin(a)*120,t:.4,life:.4,hue:h,r:3}); } }
function hitHex(x,y,r,d,h,st){ if(!RUN)return;
 RUN.enemies.forEach(function(e){ if(e.dead)return; if(d2(e.x,e.y,x,y)<(r+e.r)*(r+e.r)){ dmgEnemy(e,d); applyStatus(e,st,d); } });
 for(var i=0;i<6;i++){ var a=i/6*TAU; RUN.parts.push({x:x+Math.cos(a)*r,y:y+Math.sin(a)*r,vx:Math.cos(a)*80,vy:Math.sin(a)*80,t:.5,life:.5,hue:h,r:4}); } }
function hitCross(x,y,s,d,h,st){ if(!RUN)return;
 RUN.enemies.forEach(function(e){ if(e.dead)return; if(Math.abs(e.x-x)<s+e.r&&Math.abs(e.y-y)<s+e.r){ dmgEnemy(e,d); applyStatus(e,st,d); } });
 for(var i=0;i<4;i++) fxBeam(x,y,i/4*TAU,s,h); }
function hitSpiral(x,y,r,turns,d,h,st){ if(!RUN)return;
 RUN.enemies.forEach(function(e){ if(e.dead)return; if(d2(e.x,e.y,x,y)<(r+e.r)*(r+e.r)){ dmgEnemy(e,d); applyStatus(e,st,d); } });
 for(var i=0;i<turns*60;i++){ var a=i/10,t=i/60*r; RUN.parts.push({x:x+Math.cos(a)*t,y:y+Math.sin(a)*t,vx:0,vy:0,t:.6,life:.6,hue:h,r:2}); } }
function hitWave(x,y,a,len,amp,d,h,st){ if(!RUN)return; var ca=Math.cos(a),sa=Math.sin(a);
 RUN.enemies.forEach(function(e){ if(e.dead)return; var px=e.x-x,py=e.y-y,t=clamp(px*ca+py*sa,0,len),cx2=x+ca*t,cy2=y+sa*t,wv=Math.sin(t/30)*amp;
  if(d2(e.x,e.y,cx2+sa*wv,cy2-ca*wv)<(20+e.r)*(20+e.r)){ dmgEnemy(e,d); applyStatus(e,st,d); } });
 for(var i=0;i<=len;i+=14){ var wv2=Math.sin(i/30)*amp; RUN.parts.push({x:x+ca*i+sa*wv2,y:y+sa*i-ca*wv2,vx:0,vy:0,t:.4,life:.4,hue:h,r:2}); } }
function hitTriangle(x,y,a,s,d,h,st){ if(!RUN)return;
 RUN.enemies.forEach(function(e){ if(e.dead)return; var dx=e.x-x,dy=e.y-y,da=Math.atan2(dy,dx)-a; while(da>Math.PI)da-=TAU; while(da<-Math.PI)da+=TAU;
  if(Math.abs(da)<.6&&Math.hypot(dx,dy)<s+e.r){ dmgEnemy(e,d); applyStatus(e,st,d); } });
 for(var i=0;i<3;i++){ var ang=a+i/3*TAU-Math.PI/6; RUN.parts.push({x:x+Math.cos(ang)*s,y:y+Math.sin(ang)*s,vx:Math.cos(ang)*100,vy:Math.sin(ang)*100,t:.4,life:.4,hue:h,r:4}); } }
function hitGrid(x,y,w,hh,c,d,h,st){ if(!RUN)return;
 RUN.enemies.forEach(function(e){ if(e.dead)return; if(Math.abs(e.x-x)<w/2+e.r&&Math.abs(e.y-y)<hh/2+e.r){ dmgEnemy(e,d); applyStatus(e,st,d); } });
 for(var i=0;i<c;i++) RUN.parts.push({x:x+rnd(-w/2,w/2),y:y+rnd(-hh/2,hh/2),vx:0,vy:0,t:.5,life:.5,hue:h,r:3}); }
function bullet(p,o){ o=o||{}; var a=(typeof o.a==='number')?o.a:p.angle, sp=(typeof o.sp==='number')?o.sp:ST.ps;
 var b={x:p.x,y:p.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,dmg:(typeof o.d==='number')?o.d:ST.dmg,r:(typeof o.r==='number')?o.r:5,pierce:o.pierce||0,hit:[],life:(typeof o.life==='number')?o.life:1.25,owner:p.id};
 if(o.hom)b.hom=true; if(o.expl)b.expl=true; if(o.burn)b.burn=true; if(o.poison)b.poison=true; if(o.corrode)b.corrode=true; if(o.mark)b.mark=true; if(o.pull)b.pull=true; if(o.acc)b.acc=o.acc; if(o.kb)b.kb=o.kb; if(o.fsplit)b.fsplit=true; if(o.collapse)b.collapse=true; if(o.crit)b.crit=true; if(o.chainOnHit)b.chainOnHit=true; if(o.lag)b.lag=true;
 RUN.bullets.push(b); return b; }
function fan(p,n,spread,o){ n=Math.max(1,n|0); for(var i=0;i<n;i++){ var off=n>1?(i/(n-1)-.5)*spread:0; bullet(p,Object.assign({},o,{a:p.angle+off})); } }
function ringShot(p,n,o){ n=Math.max(1,n|0); for(var i=0;i<n;i++) bullet(p,Object.assign({},o,{a:i/n*TAU})); }
function zone(x,y,r,t){ if(RUN) RUN.clouds.push({x:x,y:y,r:r,t:t}); }
function well(x,y,t,lv){ if(RUN) RUN.wells.push({x:x,y:y,t:t,lv:lv||1}); }
function shieldGain(p,a,ifr){ if(!RUN||!p)return; p.sh=Math.min(ST.shieldMax+a,p.sh+a); if(ifr)p.iframes=Math.max(p.iframes,ifr); fxRing(p.x,p.y,190,95,14,.5); }
function healGain(p,a){ if(!RUN||!p)return; p.hp=Math.min(ST.hp,p.hp+a); }
function dashMove(p,dist,ifr){ if(!RUN||!p)return; var ox=p.x,oy=p.y; p.x=clamp(p.x+Math.cos(p.angle)*dist,20,W-20); p.y=clamp(p.y+Math.sin(p.angle)*dist,20,H-20); p.iframes=Math.max(p.iframes,ifr||.5); fxRing(ox,oy,RUN.hue,80,8,.35); fxRing(p.x,p.y,RUN.hue,110,10,.42); }
function convertShots(p,r){ if(!RUN||!p||!RUN.ebullets)return; var keep=[]; for(var i=0;i<RUN.ebullets.length;i++){ var b=RUN.ebullets[i]; if(d2(b.x,b.y,p.x,p.y)<r*r){ bullet(p,{a:Math.atan2(b.vy,b.vx),sp:Math.hypot(b.vx,b.vy)||320,d:ST.dmg*1.1,r:5,pierce:2,life:1.4,burn:true}); } else keep.push(b); } RUN.ebullets=keep; }
var A={};
A[1]=function(p){ bullet(p,{d:ST.dmg*2.5,sp:ST.ps*1.25,acc:980,r:9,pierce:6,expl:true,life:1.8}); fan(p,3,.25,{d:ST.dmg*.72,acc:560,r:3,pierce:1,life:1.2}); hitLine(p.x,p.y,p.angle,240,18,ST.dmg*.5,190,'burn'); };
A[2]=function(p){ hitCross(p.x,p.y,220,ST.dmg,200,'slow'); near(p.x,p.y,340).forEach(function(e){ if(!e.boss){ e.y=Math.max(20,e.y-125); e.slowT=Math.max(e.slowT,2.2);} }); well(p.x,p.y-120,2.4,2); shieldGain(p,12,.6); };
A[3]=function(p){ dashMove(p,225,.72); for(var i=1;i<=5;i++){ var x=p.x-Math.cos(p.angle)*i*38,y=p.y-Math.sin(p.angle)*i*38; (function(x,y){ delayFx(function(){ hitStar(x,y,88,5,ST.dmg*.95,25,'burn'); },i*80); })(x,y); } };
A[4]=function(p){ bullet(p,{d:ST.dmg*1.9,sp:ST.ps*2.1,r:3,pierce:9,life:1.5}); fan(p,6,.35,{d:ST.dmg*.52,sp:ST.ps*1.75,r:2,pierce:3}); p.adrenT=Math.max(p.adrenT,2.2); hitCone(p,240,.45,ST.dmg*.5,210,'corrode'); };
A[5]=function(p){ hitRect(p.x+Math.cos(p.angle)*120,p.y+Math.sin(p.angle)*120,180,40,ST.dmg,310,'mark'); for(var i=0;i<7;i++){ var a=p.angle+(i-3)*.17; bullet(p,{a:a,sp:ST.ps*.52,d:ST.dmg*.92,r:7,pierce:0,life:2.4,fsplit:true}); } delayFx(function(){ ringShot(p,14,{d:ST.dmg*.52,r:4,pierce:2,sp:ST.ps*.95}); },450); };
A[6]=function(p){ p._form=((p._form||0)+1)%3; if(p._form===0){ shieldGain(p,30,1.25); hitRing(p.x,p.y,130,28,ST.dmg*.6,220,'mark'); } else if(p._form===1){ ringShot(p,10,{d:ST.dmg*.85,pierce:3,hom:true,chainOnHit:true}); } else { p.iframes=Math.max(p.iframes,1.45); hitCone(p,200,.8,ST.dmg,260,'conf'); } };
A[7]=function(p){ zone(p.x,p.y,175,5); hitSpiral(p.x,p.y,180,3,ST.dmg,205,'freeze'); near(p.x,p.y,260).forEach(function(e){ e.slowT=Math.max(e.slowT,3); if(Math.random()<.35) addFreeze(e,.8); }); };
A[8]=function(p){ zone(p.x,p.y,155,4); hitHex(p.x,p.y,160,ST.dmg,30,'burn'); near(p.x,p.y,320).forEach(function(e){ e.mark=Math.max(e.mark,6); addBurn(e,ST.dmg*.55,5); }); };
A[9]=function(p){ hitCone(p,260,.5,ST.dmg*.6,95,'corrode'); fan(p,8,.5,{d:ST.dmg*.88,pierce:4,corrode:true}); near(p.x,p.y,240).forEach(function(e){ addCorrode(e,6,.45); }); };
A[10]=function(p){ hitLine(p.x,p.y,p.angle+Math.PI/2,300,12,ST.dmg,320,'mark'); hitLine(p.x,p.y,p.angle-Math.PI/2,300,12,ST.dmg,320,'mark'); delayFx(function(){ ringShot(p,16,{sp:ST.ps*1.35,d:ST.dmg*.72,pierce:4,life:.9}); },350); };
A[11]=function(p){ zone(p.x,p.y,150,4); hitCircle(p.x+Math.cos(p.angle)*110,p.y+Math.sin(p.angle)*110,110,ST.dmg*.8,205,'slow'); fan(p,6,.7,{d:ST.dmg*.92,expl:true,r:6}); };
A[12]=function(p){ hitCircle(p.x,p.y,280,ST.dmg*1.15,55,'mark'); near(p.x,p.y,360).forEach(function(e){ e.stun=Math.max(e.stun,1.3); e.flash=.3; if(e.type==='ghost'){ e.invuln=false; e.phaseT=2.5; } }); };
A[13]=function(p){ fan(p,22,.9,{d:ST.dmg*.48,sp:ST.ps*1.35,r:3,pierce:1}); hitCone(p,250,.75,ST.dmg*.45,215,'corrode'); p.puRate=Math.max(p.puRate||1,1.65); p.puTimer=Math.max(p.puTimer||0,3); };
A[14]=function(p){ well(p.x,p.y,4,1); for(var i=0;i<4;i++){ var a=i/4*TAU,x=p.x+Math.cos(a)*130,y=p.y+Math.sin(a)*130; zone(x,y,70,4); (function(x,y){ delayFx(function(){ var t=nearestEnemy(x,y); if(t) arcChain(t,ST.dmg*1.35,4,200); hitStar(x,y,70,4,ST.dmg,200,'stun'); },i*180); })(x,y); } };
A[15]=function(p){ fan(p,10,.8,{d:ST.dmg*.72,burn:true,life:2}); for(var i=1;i<=5;i++){ var x=p.x+Math.cos(p.angle)*i*45,y=p.y+Math.sin(p.angle)*i*45; (function(x,y){ delayFx(function(){ zone(x,y,65,3); hitWave(x,y,p.angle,100,30,ST.dmg,30,'burn'); },i*90); })(x,y); } };
A[16]=function(p){ RUN.eclouds.push({x:p.x,y:p.y,r:180,t:5,friendly:true}); hitHex(p.x,p.y,170,ST.dmg,65,'poison'); near(p.x,p.y,225).forEach(function(e){ addPoison(e,ST.dmg*.62,5); }); };
A[17]=function(p){ hitRing(p.x,p.y,220,40,ST.dmg,90,'poison'); for(var i=0;i<6;i++){ var a=i/6*TAU,x=p.x+Math.cos(a)*125,y=p.y+Math.sin(a)*125; (function(x,y){ delayFx(function(){ zone(x,y,95,4); },i*70); })(x,y); } };
A[18]=function(p){ hitCircle(p.x,p.y,230,ST.dmg,260,'slow'); zone(p.x,p.y,190,4); near(p.x,p.y,230).forEach(function(e){ e.stun=Math.max(e.stun,1); e.slowT=Math.max(e.slowT,2.5); e.burn=null; e.poison=null; }); if(RUN.ebullets) RUN.ebullets=RUN.ebullets.filter(function(b){ return d2(b.x,b.y,p.x,p.y)>230*230; }); };
A[19]=function(p){ for(var i=0;i<12;i++){ (function(i){ delayFx(function(){ bullet(p,{a:p.angle+rnd(-.5,.5),d:ST.dmg*.62,sp:ST.ps*1.25}); if(Math.random()<.4) hitStar(p.x,p.y,90,6,ST.dmg,20,'burn'); },i*70); })(i); } };
A[20]=function(p){ shieldGain(p,32,1); hitRect(p.x+Math.cos(p.angle)*110,p.y+Math.sin(p.angle)*110,210,80,ST.dmg,40,'stun'); delayFx(function(){ fan(p,20,TAU,{d:ST.dmg*.3,pierce:2}); },400); };
A[21]=function(p){ hitRing(p.x,p.y,160,30,ST.dmg,210,'mark'); RUN.bullets.forEach(function(b){ b.dmg*=1.15; b.pierce=(b.pierce||0)+1; }); shieldGain(p,20,.8); p.puDamage=1.38; p.puTimer=6; };
A[22]=function(p){ p.iframes=Math.max(p.iframes,2); p.adrenT=Math.max(p.adrenT,2.5); dashMove(p,260,1.5); hitCross(p.x,p.y,200,ST.dmg*1.5,220,'stun'); };
A[23]=function(p){ var s=Math.min(24,p.store||0); p.store=0; hitBeam(p.x,p.y,p.angle,300+s*10,20,ST.dmg*(2+s*.22),55,'burn'); };
A[24]=function(p){ convertShots(p,285); shieldGain(p,18,.9); hitRing(p.x,p.y,165,30,ST.dmg,225,'mark'); ringShot(p,10,{d:ST.dmg*.55,pierce:3,sp:ST.ps*1.2}); };
A[25]=function(p){ hitCircle(p.x,p.y,200,ST.dmg,280,'mark'); near(p.x,p.y,340).forEach(function(e){ e.mark=Math.max(e.mark,6); addPoison(e,ST.dmg*.35,4); addBurn(e,ST.dmg*.35,4); }); };
A[26]=function(p){ well(p.x,p.y,2.8,3); hitSpiral(p.x,p.y,200,4,ST.dmg,260,'slow'); near(p.x,p.y,400).forEach(function(e){ if(!e.boss){ var a=Math.atan2(p.y-e.y,p.x-e.x); e.x+=Math.cos(a)*185; e.y+=Math.sin(a)*185; } }); };
A[27]=function(p){ var s=Math.min(20,p.store||0); p.store=0; hitBeam(p.x,p.y,p.angle,500,12,ST.dmg*(3.6+s*.22),55,'burn'); };
A[28]=function(p){ shieldGain(p,28,1.2); convertShots(p,260); hitHex(p.x,p.y,160,ST.dmg,240,'slow'); };
A[29]=function(p){ fan(p,7,.4,{d:ST.dmg*.72,hom:true,pierce:2,chainOnHit:true}); delayFx(function(){ var t=nearestEnemy(p.x,p.y); if(t){ arcChain(t,ST.dmg*1.65,6,200); hitStar(t.x,t.y,100,5,ST.dmg,200,'stun'); } },200); };
A[30]=function(p){ shieldGain(p,42,1.4); delayFx(function(){ healGain(p,26); hitCircle(p.x,p.y,165,ST.dmg*1.25,145,'poison'); },1200); };
A[31]=function(p){ fan(p,14,.9,{sp:ST.ps*.72,d:ST.dmg*.62,burn:true,life:1.8}); hitWave(p.x,p.y,p.angle,240,50,ST.dmg,30,'burn'); p.holdT=Math.min(3,(p.holdT||0)+1); };
A[32]=function(p){ p._semi=(p._semi||0)?0:1; if(p._semi){ shieldGain(p,24,1); hitRing(p.x,p.y,145,30,ST.dmg,210,'slow'); } else { ringShot(p,12,{d:ST.dmg*.62,pierce:3,chainOnHit:true}); var t=nearestEnemy(p.x,p.y); if(t) arcChain(t,ST.dmg*1.45,5,200); } };
A[33]=function(p){ fan(p,12,.4,{d:ST.dmg*.48,poison:true,pierce:2}); hitCone(p,260,.5,ST.dmg*.5,120,'poison'); near(p.x,p.y,260).forEach(function(e){ addPoison(e,ST.dmg*.58,6); }); };
A[34]=function(p){ p.puCrit=1; p.puTimer=5; p.puDamage=1.25; hitBeam(p.x,p.y,p.angle,380,14,ST.dmg*2.25,55,'mark'); near(p.x,p.y,320).forEach(function(e){ e.flash=.5; if(e.type==='ghost'){ e.invuln=false; e.phaseT=2.5; } }); };
A[35]=function(p){ for(var i=0;i<6;i++){ var a=p.angle+(i-2.5)*.2; bullet(p,{a:a,sp:ST.ps*.82,d:ST.dmg*.72,corrode:true,r:7,life:1.8,expl:true,lag:true}); } hitGrid(p.x+Math.cos(p.angle)*120,p.y+Math.sin(p.angle)*120,140,140,12,ST.dmg,90,'corrode'); };
A[36]=function(p){ hitBeam(p.x,p.y,p.angle,450,10,ST.dmg*2.9,55,'mark'); near(p.x,p.y,360).forEach(function(e){ e.flash=.4; e.mark=Math.max(e.mark,3); if(e.type==='ghost'){ e.invuln=false; e.phaseT=2.5; } }); };
A[37]=function(p){ p.instab=(p.instab||0)+6; if(p.instab>=6){ p.instab=0; hitStar(p.x,p.y,260,8,ST.dmg*2.8,280,'burn'); } else fan(p,8,.6,{d:ST.dmg*.62,expl:true}); };
A[38]=function(p){ hitCircle(p.x,p.y,300,ST.dmg*.95,0,'mark'); near(p.x,p.y,420).forEach(function(e){ e.mark=Math.max(e.mark,7); e.flash=.25; }); };
A[39]=function(p){ for(var i=0;i<8;i++){ var t=nearestEnemy(p.x,p.y); var a=t?Math.atan2(t.y-p.y,t.x-p.x):i/8*TAU; bullet(p,{a:a,d:ST.dmg*.58,hom:true,life:2,pierce:1}); } hitHex(p.x,p.y,150,ST.dmg,120,'mark'); };
A[40]=function(p){ shieldGain(p,26,1); RUN.enemies.forEach(function(e){ if(!e.dead&&e.burn) e.burn.dps*=1.5; }); hitCircle(p.x,p.y,160,ST.dmg*.75,30,'burn'); };
A[41]=function(p){ p.puRate=1.9; p.puTimer=6; p.puDamage=1.18; hitRing(p.x,p.y,150,28,ST.dmg,220,'slow'); ringShot(p,10,{d:ST.dmg*.55,pierce:4,hom:true}); };
A[42]=function(p){ p.holdT=3; p.puDamage=1.32; p.puTimer=5; hitBeam(p.x,p.y,p.angle,350,25,ST.dmg*2.1,30,'burn'); };
A[43]=function(p){ for(var i=0;i<9;i++){ var o={a:p.angle+rnd(-.6,.6),d:ST.dmg*.62,sp:ST.ps*rnd(.7,1.5),life:rnd(.7,1.6),pierce:2}; var r=Math.random(); if(r<.3)o.expl=true; else if(r<.6)o.poison=true; else if(r<.8)o.burn=true; else o.fsplit=true; bullet(p,o); } hitGrid(p.x,p.y,160,160,15,ST.dmg,280,'conf'); };
A[44]=function(p){ var t=nearestEnemy(p.x,p.y); if(!t)return; t.mark=Math.max(t.mark,8); addPoison(t,ST.dmg*.72,5); addBurn(t,ST.dmg*.72,5); arcChain(t,ST.dmg*.85,4,200); hitStar(t.x,t.y,120,6,ST.dmg,300,'mark'); };
A[45]=function(p){ p.iframes=Math.max(p.iframes,1.6); convertShots(p,300); hitRing(p.x,p.y,175,35,ST.dmg,190,'mark'); near(p.x,p.y,260).forEach(function(e){ dmgEnemy(e,ST.dmg*.95); }); };
A[46]=function(p){ var s=Math.min(30,p.store||0); p.store=0; hitCircle(p.x,p.y,205+s*6,ST.dmg*(2+s*.25),200,'burn'); fan(p,6,.5,{d:ST.dmg*.72,acc:620,expl:true}); };
A[47]=function(p){ for(var i=0;i<16;i++) bullet(p,{a:rnd(TAU),sp:ST.ps*1.65,d:ST.dmg*.58,r:3,pierce:2,life:1.5}); delayFx(function(){ hitGrid(p.x,p.y,320,240,25,ST.dmg,220,'mark'); },300); };
A[48]=function(p){ shieldGain(p,18,.8); hitCone(p,240,.6,ST.dmg*.65,120,'poison'); near(p.x,p.y,300).forEach(function(e){ addPoison(e,ST.dmg*.78,6); }); };
A[49]=function(p){ fan(p,10,.7,{d:ST.dmg*.78,hom:true,sp:ST.ps*.9,life:2,pierce:3,corrode:true}); hitWave(p.x,p.y,p.angle,260,60,ST.dmg,220,'corrode'); };
A[50]=function(p){ for(var i=0;i<6;i++) bullet(p,{a:i/6*TAU,d:ST.dmg*.62,hom:true,life:2.4,pierce:2}); delayFx(function(){ ringShot(p,6,{d:ST.dmg*.52,hom:true,life:2}); hitRing(p.x,p.y,140,30,ST.dmg,40,'slow'); },700); };
A[51]=function(p){ for(var i=0;i<5;i++){ var a=p.angle+(i-2)*.35,x=p.x+Math.cos(a)*95,y=p.y+Math.sin(a)*95; (function(x,y){ delayFx(function(){ hitStar(x,y,110,7,ST.dmg*1.25,310,'slow'); fan(p,12,TAU,{d:ST.dmg*.42,pierce:2}); },i*140); })(x,y); } };
A[52]=function(p){ hitSpiral(p.x,p.y,180,3,ST.dmg,120,'poison'); near(p.x,p.y,380).forEach(function(e){ addPoison(e,ST.dmg*.62,6); }); };
A[53]=function(p){ RUN.eclouds.push({x:p.x,y:p.y,r:200,t:5,friendly:true}); hitCircle(p.x,p.y,170,ST.dmg,280,'mark'); near(p.x,p.y,420).forEach(function(e){ e.mark=Math.max(e.mark,6); e.flash=.2; if(e.type==='ghost'){ e.invuln=false; e.phaseT=2.5; } }); };
A[54]=function(p){ hitCircle(p.x,p.y,320,ST.dmg*1.15,220,'freeze'); near(p.x,p.y,400).forEach(function(e){ e.stun=Math.max(e.stun,1.5); if(!e.boss&&e.hp<e.maxhp*.35) addFreeze(e,1.2); }); };
A[55]=function(p){ p._timeStacks=(p._timeStacks||0)+1; p.puRate=1.5+Math.min(1.5,p._timeStacks*.22); p.puTimer=6; hitSpiral(p.x,p.y,220,4,ST.dmg*(1+p._timeStacks*.3),280,'burn'); };
A[56]=function(p){ fan(p,5,.4,{d:ST.dmg*1.35,sp:ST.ps*.72,r:8,pull:true,pierce:3}); well(p.x+Math.cos(p.angle)*160,p.y+Math.sin(p.angle)*160,2.2,2); hitTriangle(p.x,p.y,p.angle,240,ST.dmg,270,'slow'); };
A[57]=function(p){ var r=Math.floor(rnd(6)); if(r===0)fan(p,8,.5,{d:ST.dmg*.82,burn:true}); else if(r===1)hitRing(p.x,p.y,180,30,ST.dmg,120,'poison'); else if(r===2)well(p.x,p.y,2,2); else if(r===3)hitStar(p.x,p.y,200,6,ST.dmg*1.65,RUN.hue,'burn'); else if(r===4){ var t=nearestEnemy(p.x,p.y); if(t)arcChain(t,ST.dmg*1.55,5,200); } else shieldGain(p,22,1); };
A[58]=function(p){ dashMove(p,165,.55); for(var i=1;i<=6;i++){ var x=p.x-Math.cos(p.angle)*i*35,y=p.y-Math.sin(p.angle)*i*35; (function(x,y){ delayFx(function(){ hitStar(x,y,70,5,ST.dmg,55,'burn'); near(x,y,80).forEach(function(e){ dmgEnemy(e,ST.dmg*.6); }); },i*70); })(x,y); } };
A[59]=function(p){ fan(p,12,.9,{d:ST.dmg*.58,hom:true,sp:ST.ps*.82,life:2,pierce:2,pull:true}); hitWave(p.x,p.y,p.angle,280,70,ST.dmg,260,'slow'); };
A[60]=function(p){ well(p.x,p.y,3.2,4); hitSpiral(p.x,p.y,260,5,ST.dmg,270,'slow'); near(p.x,p.y,520).forEach(function(e){ if(!e.boss){ var a=Math.atan2(p.y-e.y,p.x-e.x); e.x+=Math.cos(a)*265; e.y+=Math.sin(a)*265; } }); convertShots(p,400); };
A[61]=function(p){ zone(p.x,p.y,125,7); well(p.x,p.y,3,1); hitHex(p.x,p.y,150,ST.dmg,120,'poison'); };
A[62]=function(p){ for(var i=0;i<4;i++){ var x=p.x+rnd(-125,125),y=p.y+rnd(-125,125); well(x,y,1.8,1); fxTele(x,y,95,.9,280); (function(x,y){ delayFx(function(){ hitStar(x,y,140,6,ST.dmg*1.65,260,'slow'); },900+i*120); })(x,y); } };
A[63]=function(p){ hitCircle(p.x,p.y,230,ST.dmg,0,'mark'); ringShot(p,12,{d:ST.dmg*.55,poison:true}); near(p.x,p.y,460).forEach(function(e){ e.mark=Math.max(e.mark,8); e.flash=.3; }); };
A[64]=function(p){ shieldGain(p,32,1.2); convertShots(p,245); hitRing(p.x,p.y,160,34,ST.dmg,250,'slow'); p.puArmor=.4; p.puTimer=6; };
A[65]=function(p){ hitCircle(p.x,p.y,300,ST.dmg*.85,120,'stun'); near(p.x,p.y,360).forEach(function(e){ e.stun=Math.max(e.stun,1.6); e.slowT=Math.max(e.slowT,3); }); };
A[66]=function(p){ var x=p.x+Math.cos(p.angle)*145,y=p.y+Math.sin(p.angle)*145; well(x,y,2.4,4); fxTele(x,y,110,.7,280); hitTriangle(p.x,p.y,p.angle,200,ST.dmg*1.2,270,'slow'); near(p.x,p.y,285).forEach(function(e){ if(!e.boss){ var a=Math.atan2(y-e.y,x-e.x); e.x+=Math.cos(a)*205; e.y+=Math.sin(a)*205; } }); };
A[67]=function(p){ hitBeam(p.x,p.y,p.angle,380,18,ST.dmg*3.45,260,'corrode'); var x=p.x+Math.cos(p.angle)*220,y=p.y+Math.sin(p.angle)*220; delayFx(function(){ hitCircle(x,y,125,ST.dmg*1.45,230,'stun'); },220); };
A[68]=function(p){ hitBeam(p.x,p.y,p.angle,480,6,ST.dmg*2.55,190,'mark'); fan(p,3,.12,{d:ST.dmg*.72,sp:ST.ps*2.6,r:2,pierce:12}); };
A[69]=function(p){ bullet(p,{d:ST.dmg*6.2,sp:ST.ps*.8,r:12,pierce:20,life:1.8,kb:3}); hitCross(p.x,p.y,180,ST.dmg*1.1,40,'stun'); };
A[70]=function(p){ var c=Math.min(12,p._charge||0); p._charge=0; hitCircle(p.x,p.y,165+c*22,ST.dmg*(1.5+c*.32),50,'stun'); };
A[71]=function(p){ p.puCrit=1; p.puTimer=6; p.puDamage=1.32; hitBeam(p.x,p.y,p.angle,420,8,ST.dmg*2.45,55,'mark'); };
A[72]=function(p){ if(p.hp<ST.hp*.4){ healGain(p,ST.hp*.35); shieldGain(p,22,1); } else hitRing(p.x,p.y,180,35,ST.dmg,190,'slow'); };
A[73]=function(p){ p.iframes=Math.max(p.iframes,2.8); p.puSpeed=.55; p.puTimer=3; hitCircle(p.x,p.y,165,ST.dmg*1.25,220,'slow'); };
A[74]=function(p){ bullet(p,{d:ST.dmg*3.25,sp:ST.ps*.55,r:13,pierce:12,life:2,kb:4,expl:true}); hitCone(p,210,.65,ST.dmg*.95,35,'stun'); };
A[75]=function(p){ p.puRate=1.75; p.puDamage=1.32; p.puTimer=6; hitCone(p,260,.6,ST.dmg*.8,25,'burn'); near(p.x,p.y,285).forEach(function(e){ addBurn(e,ST.dmg*.62,5); }); };
A[76]=function(p){ p.iframes=Math.max(p.iframes,1.5); hitCircle(p.x,p.y,245,ST.dmg*1.85,40,'stun'); near(p.x,p.y,260).forEach(function(e){ if(!e.boss){ e.x+=(e.x-p.x)*.2; e.y+=(e.y-p.y)*.2; e.stun=Math.max(e.stun,.6); } }); };
A[77]=function(p){ for(var i=0;i<6;i++){ var x=clamp(p.x+rnd(-225,225),30,W-30),y=clamp(p.y+rnd(-225,225),30,H-30); fxTele(x,y,90,.55+i*.12,25); (function(x,y){ delayFx(function(){ hitStar(x,y,120,6,ST.dmg*1.85,25,'burn'); },i*150); })(x,y); } };
A[78]=function(p){ hitCircle(p.x,p.y,220,ST.dmg*.75,300,'mark'); near(p.x,p.y,400).forEach(function(e){ e.mark=Math.max(e.mark,7); addPoison(e,ST.dmg*.42,5); addBurn(e,ST.dmg*.42,5); e.slowT=Math.max(e.slowT,2); }); };
A[79]=function(p){ hitCircle(p.x,p.y,190,ST.dmg*.8,48,'mark'); near(p.x,p.y,420).forEach(function(e){ e.mark=Math.max(e.mark,6); e.coin=(e.coin||1)+3; }); RUN.coins+=25; SAVE.addCoins(25); };
A[80]=function(p){ dashMove(p,205,1.1); hitWave(p.x,p.y,p.angle,240,50,ST.dmg,210,'poison'); ringShot(p,10,{d:ST.dmg*.55,sp:ST.ps*.82,life:1.6,poison:true}); };
A[81]=function(p){ near(p.x,p.y,380).forEach(function(e){ addPoison(e,ST.dmg*.75,7); }); delayFx(function(){ hitCircle(p.x,p.y,220,ST.dmg*.8,120,'poison'); near(p.x,p.y,420).forEach(function(e){ if(e.poison) dmgEnemy(e,ST.dmg*1.65,{quiet:true}); }); },1300); };
A[82]=function(p){ shieldGain(p,36,1.4); hitRect(p.x+Math.cos(p.angle)*110,p.y+Math.sin(p.angle)*110,230,85,ST.dmg,230,'slow'); };
A[83]=function(p){ for(var w=0;w<3;w++){ (function(w){ delayFx(function(){ hitRing(p.x,p.y,105+w*45,26,ST.dmg,300,'slow'); hitStar(p.x,p.y,105+w*45,6,ST.dmg,300,'slow'); },w*220); })(w); } };
A[84]=function(p){ hitCircle(p.x,p.y,135,ST.dmg*.75,120,'poison'); zone(p.x,p.y,125,5); near(p.x,p.y,360).forEach(function(e){ addPoison(e,ST.dmg*.68,6); e.mark=Math.max(e.mark,4); }); };
A[85]=function(p){ hitCone(p,260,.6,ST.dmg*1.2,120,'corrode'); near(p.x,p.y,380).forEach(function(e){ addPoison(e,ST.dmg*1.15,3); addCorrode(e,4,.45); }); };
A[86]=function(p){ zone(p.x,p.y,195,6); hitHex(p.x,p.y,190,ST.dmg,120,'poison'); near(p.x,p.y,225).forEach(function(e){ addPoison(e,ST.dmg*.55,6); }); };
A[87]=function(p){ p._critStacks=(p._critStacks||0)+3; fan(p,10,.7,{d:ST.dmg*.72,expl:true,crit:true}); if(p._critStacks>=9){ p._critStacks=0; hitStar(p.x,p.y,320,10,ST.dmg*3.1,320,'burn'); } else hitCircle(p.x,p.y,145,ST.dmg*.7,320,'mark'); };
A[88]=function(p){ zone(p.x,p.y,165,6); hitSpiral(p.x,p.y,170,3,ST.dmg,120,'poison'); delayFx(function(){ hitCircle(p.x,p.y,225,ST.dmg*1.45,60,'poison'); },700); };
A[89]=function(p){ var s=Math.min(20,p.store||0); p.store=0; hitBeam(p.x,p.y,p.angle,420,18,ST.dmg*(2.25+s*.22),120,'poison'); };
A[90]=function(p){ bullet(p,{d:ST.dmg*3.1,sp:ST.ps*.72,r:12,pierce:10,life:2,poison:true,expl:true}); var x=p.x+Math.cos(p.angle)*180,y=p.y+Math.sin(p.angle)*180; delayFx(function(){ zone(x,y,115,5); hitHex(x,y,120,ST.dmg,120,'poison'); },400); };
A[91]=function(p){ var t=nearestEnemy(p.x,p.y); if(!t)return; arcChain(t,ST.dmg*1.85,7,120); hitSpiral(t.x,t.y,140,3,ST.dmg,120,'poison'); };
A[92]=function(p){ fan(p,7,.5,{d:ST.dmg*.95,fsplit:true,pierce:3,life:1.6}); delayFx(function(){ hitRing(p.x,p.y,150,30,ST.dmg,55,'burn'); ringShot(p,10,{d:ST.dmg*.45,fsplit:true}); },350); };
A[93]=function(p){ bullet(p,{d:ST.dmg*2.7,sp:ST.ps*2.2,pierce:30,r:6,poison:true,life:1.6}); hitBeam(p.x,p.y,p.angle,400,12,ST.dmg,120,'poison'); };
A[94]=function(p){ var s=Math.min(20,RUN.cm||0); RUN.cm=0; hitCircle(p.x,p.y,185+s*10,ST.dmg*(2+s*.25),300,'burn'); ringShot(p,12,{d:ST.dmg*.65,expl:true}); };
A[95]=function(p){ zone(p.x,p.y,185,4); hitGrid(p.x,p.y,240,240,20,ST.dmg,200,'mark'); near(p.x,p.y,520).forEach(function(e){ e.mark=Math.max(e.mark,8); e.flash=.25; e.invuln=false; }); };
A[96]=function(p){ var t=nearestEnemy(p.x,p.y); if(t){ t.heat=(t.heat||0)+3; arcChain(t,ST.dmg*1.25,3,30); addBurn(t,ST.dmg*.85,6); } hitBeam(p.x,p.y,p.angle,440,10,ST.dmg*1.85,30,'burn'); };
A[97]=function(p){ var x=clamp(p.x+Math.cos(p.angle)*180,30,W-30),y=clamp(p.y+Math.sin(p.angle)*180,30,H-30); zone(x,y,95,3); fxTele(x,y,95,.9,120); delayFx(function(){ hitStar(x,y,190,7,ST.dmg*2.65,120,'poison'); zone(x,y,135,5); },900); };
A[98]=function(p){ fan(p,8,.35,{d:ST.dmg*1.75,sp:ST.ps*1.8,pierce:20,r:7,life:1.4}); hitBeam(p.x,p.y,p.angle,450,14,ST.dmg,200,'slow'); };
A[99]=function(p){ hitCircle(p.x,p.y,230,ST.dmg*.85,300,'conf'); near(p.x,p.y,420).forEach(function(e){ e.conf=Math.max(e.conf,2.5); e.slowT=Math.max(e.slowT,2.5); }); };
A[100]=function(p){ fan(p,9,.6,{d:ST.dmg*.95,collapse:true,life:1.1,pierce:2}); var x=p.x+Math.cos(p.angle)*180,y=p.y+Math.sin(p.angle)*180; delayFx(function(){ hitStar(x,y,160,8,ST.dmg*1.85,280,'burn'); },700); };
A[101]=function(p){ RUN.bloodlustStacks=Math.min(20,(RUN.bloodlustStacks||0)+8); p.puDamage=1.42; p.puTimer=6; hitRing(p.x,p.y,180,35,ST.dmg,0,'mark'); };
A[102]=function(p){ zone(p.x,p.y,215,5); hitHex(p.x,p.y,210,ST.dmg,260,'slow'); near(p.x,p.y,245).forEach(function(e){ e.slowT=Math.max(e.slowT,3); e.corrode=0; e.mark=0; dmgEnemy(e,ST.dmg*.95); }); };
A[103]=function(p){ hitBeam(p.x,p.y,p.angle,520,4,ST.dmg*3.25,190,'mark'); };
A[104]=function(p){ bullet(p,{d:ST.dmg*2.25,sp:ST.ps*.62,r:11,pierce:8,kb:4,life:1.8}); hitCone(p,210,.6,ST.dmg*.95,40,'stun'); };
A[105]=function(p){ fan(p,9,.7,{d:ST.dmg*.75,fsplit:true,pierce:2,life:1.4}); delayFx(function(){ hitSpiral(p.x,p.y,150,3,ST.dmg,120,'poison'); },300); };
A[106]=function(p){ well(p.x,p.y,5,2); zone(p.x,p.y,145,6); delayFx(function(){ hitStar(p.x,p.y,200,8,ST.dmg*1.65,320,'poison'); },1200); };
A[107]=function(p){ var spd=Math.hypot(p.dvx||0,p.dvy||0)+ST.spd; dashMove(p,185,.72); hitCircle(p.x,p.y,145+spd*.08,ST.dmg*(1.2+spd/800),20,'stun'); };
A[108]=function(p){ fan(p,6,.4,{d:ST.dmg*1.45,sp:ST.ps*.75,r:9,pull:true,pierce:4}); well(p.x+Math.cos(p.angle)*150,p.y+Math.sin(p.angle)*150,2.4,2); hitTriangle(p.x,p.y,p.angle,260,ST.dmg,270,'slow'); };
A[109]=function(p){ var r=Math.floor(rnd(6)); if(r===0)fan(p,10,.7,{d:ST.dmg*.75,expl:true}); else if(r===1)hitRing(p.x,p.y,190,35,ST.dmg,120,'poison'); else if(r===2)well(p.x,p.y,2.2,2); else if(r===3)hitStar(p.x,p.y,220,7,ST.dmg*1.75,RUN.hue,'burn'); else if(r===4){ var t=nearestEnemy(p.x,p.y); if(t)arcChain(t,ST.dmg*1.65,6,200); } else shieldGain(p,24,1); };
A[110]=function(p){ bullet(p,{d:ST.dmg*7.2,sp:ST.ps*.52,r:6,pierce:25,life:2,kb:2}); hitCross(p.x,p.y,160,ST.dmg*1.4,300,'stun'); };
A[111]=function(p){ hitCircle(p.x,p.y,260,ST.dmg*.8,200,'mark'); near(p.x,p.y,700).forEach(function(e){ e.mark=Math.max(e.mark,8); e.flash=.2; e.invuln=false; }); p.puCrit=1; p.puTimer=5; };
A[112]=function(p){ dashMove(p,245,2.2); hitWave(p.x,p.y,p.angle,280,60,ST.dmg,220,'slow'); };
A[113]=function(p){ var t=nearestEnemy(p.x,p.y); if(!t)return; t.mark=Math.max(t.mark,8); delayFx(function(){ if(!t.dead){ hitStar(t.x,t.y,150,7,ST.dmg*1.85,320,'poison'); near(t.x,t.y,165).forEach(function(o){ addPoison(o,ST.dmg*.55,4); }); } },800); };
A[114]=function(p){ bullet(p,{d:ST.dmg*4.25,sp:ST.ps*.72,r:12,pierce:18,kb:3,life:2}); shieldGain(p,16,.8); hitHex(p.x,p.y,160,ST.dmg,300,'stun'); };
A[115]=function(p){ var cost=Math.min(ST.hp*.25,Math.max(0,p.hp-1)); if(cost>0){ p.hp-=cost; hitStar(p.x,p.y,240,8,ST.dmg*(2+cost/20),340,'burn'); } else hitCircle(p.x,p.y,125,ST.dmg,340,'burn'); };
A[116]=function(p){ fan(p,10,.8,{d:ST.dmg*.65,poison:true,corrode:true,r:8,life:2}); hitSpiral(p.x,p.y,160,3,ST.dmg,120,'poison'); };
A[117]=function(p){ near(p.x,p.y,380).forEach(function(e){ addPoison(e,ST.dmg*.85,6); }); delayFx(function(){ hitCircle(p.x,p.y,240,ST.dmg,120,'poison'); near(p.x,p.y,420).forEach(function(e){ if(e.poison) hitStar(e.x,e.y,90,5,ST.dmg*1.25,120,'poison'); }); },900); };
A[118]=function(p){ var x=clamp(p.x+Math.cos(p.angle)*225,30,W-30),y=clamp(p.y+Math.sin(p.angle)*225,30,H-30); well(x,y,1.8,4); zone(x,y,125,2); fxTele(x,y,135,1.4,280); delayFx(function(){ hitStar(x,y,280,10,ST.dmg*3.45,280,'slow'); well(x,y,1,2); },1500); };
function shotMods(p,shots){ if(!RUN||!shots||!shots.length)return; var n=num(p);
 shots.forEach(function(b,i){ b.dmg*=1+((n*7+i)%7)*0.01; });
 switch(n){
  case 1: shots.forEach(function(b){ b.acc=(b.acc||0)+520; b.r=Math.max(2,b.r-1); }); break;
  case 2: p.x-=Math.cos(p.angle)*6; p.y-=Math.sin(p.angle)*6; break;
  case 4: shots.forEach(function(b){ b.r=3; b.vx*=1.25; b.vy*=1.25; b.pierce=(b.pierce||0)+1; }); break;
  case 15: shots.forEach(function(b){ b.burn=true; b.lag=true; }); break;
  case 23: p.store=Math.min(24,(p.store||0)+1); break;
  case 27: p.store=Math.min(20,(p.store||0)+1); break;
  case 29: shots.forEach(function(b){ b.chainOnHit=true; }); break;
  case 33: shots.forEach(function(b){ b.poison=true; }); break;
  case 46: p.store=Math.min(30,(p.store||0)+1); break;
  case 52: shots.forEach(function(b){ b.poison=true; }); break;
  case 84: shots.forEach(function(b){ b.poison=true; }); break;
  case 88: shots.forEach(function(b){ b.poison=true; }); break;
  case 89: p.store=Math.min(20,(p.store||0)+1); break;
  case 92: shots.forEach(function(b){ b.fsplit=true; }); break;
  case 94: RUN.cm=(RUN.cm||0)+.1; break;
 } }
tryDash=function(p){ if(__oldDash)__oldDash(p); if(!RUN||!p)return; var n=num(p);
 if(n===3){ for(var i=1;i<=4;i++){ var x=p.x-Math.cos(p.angle)*i*42,y=p.y-Math.sin(p.angle)*i*42; (function(x,y){ delayFx(function(){ hitStar(x,y,82,5,ST.dmg*.85,30,'burn'); },i*80); })(x,y); } }
 if(n===58){ for(var i=1;i<=3;i++){ var x=p.x-Math.cos(p.angle)*i*32,y=p.y-Math.sin(p.angle)*i*32; (function(x,y){ delayFx(function(){ burst(x,y,55); near(x,y,72).forEach(function(e){ dmgEnemy(e,ST.dmg*.48); }); },i*70); })(x,y); } }
 if(n===80) ringShot(p,8,{d:ST.dmg*.45,poison:true,life:1.2});
 if(n===107) hitCircle(p.x,p.y,125,ST.dmg*(1+Math.hypot(p.dvx||0,p.dvy||0)/800),20,'stun'); };
updPlayer=function(p,dt){ if(__oldUpd)__oldUpd(p,dt); if(!RUN||!p||p.downed)return; var n=num(p);
 if(n===2) p.iframes=Math.max(p.iframes,.02);
 if(n===61||n===84||n===88||n===106){ p._auraT=(p._auraT||0)-dt; if(p._auraT<=0){ p._auraT=.5; near(p.x,p.y,108).forEach(function(e){ dmgEnemy(e,ST.dmg*.18,{quiet:true}); }); } }
 if(n===70){ var mi=movementInput(p); if(!(mi.dx||mi.dy)) p._charge=Math.min(14,(p._charge||0)+dt*2.2); else p._charge=Math.max(0,(p._charge||0)-dt*5); } };
useActive=function(p){
 if(!p||p.downed||p.activeCd>0)return;
 var el=p.elem||RUN.el, n=(el&&!el.mol)?+el.n:0;
 var slot=Math.max(0,Math.min(2,Number(p.signatureSlot)||0));
 if(slot===0&&n&&A[n]){
  p.activeCd=ST.activeCd; SFX.active(); RUN.shake=Math.max(RUN.shake,9);
  var nm=(el.act&&el.act.name)?el.act.name:'ABILITY';
  banner(String(nm).toUpperCase(),1200); fxRing(p.x,p.y,RUN.hue,175,10,.55);
  try{ A[n](p); }catch(err){ console.error('ability',n,err); }
  return;
 }
 return oldUse(p);
};
})();

/* 
/* ISO_CARD_REBALANCE_GAME */
(function(){
if (window.__ISO_CARD_REBAL__) return; window.__ISO_CARD_REBAL__ = true;
if (typeof ALL_CARDS === 'undefined') return;
var RMUL = { common: 1, uncommon: 1.5, rare: 2.25, epic: 3.5, legendary: 5, mythic: 8 };
var BASE = [
 ['dmg', .05, 'increase projectile damage'],
 ['rate', .04, 'increase fire rate'],
 ['hp', 6, 'increase maximum health'],
 ['spd', .03, 'increase movement speed'],
 ['crit', .02, 'increase critical chance'],
 ['shield', 3, 'increase maximum shield'],
 ['magnet', .06, 'increase pickup radius'],
 ['projs', .2, 'increase projectile output'],
 ['pierce', .25, 'increase piercing'],
 ['aoe', .25, 'increase reaction area'],
 ['homing', .04, 'increase homing strength'],
 ['coin', .04, 'increase coin gain']
];
var PRE = ['Flux','Quantum','Catalyst','Ion','Molecular','Atomic','Lattice','Reactive','Phase','Vector','Neutron','Photon'];
var SUF = ['Reservoir','Matrix','Conduit','Array','Mantle','Drive','Engine','Prism','Relay','Core'];
for (var k = ALL_CARDS.length - 1; k >= 0; k--) {
  if (ALL_CARDS[k] && ALL_CARDS[k].id && ALL_CARDS[k].id.indexOf('xcard_') === 0) ALL_CARDS.splice(k, 1);
}
if (typeof EXTRA_CARDS !== 'undefined') EXTRA_CARDS.length = 0;
for (var i = 0; i < 121; i++) {
  var rarity = i < 60 ? 'common' : i < 92 ? 'uncommon' : i < 112 ? 'rare' : i < 119 ? 'epic' : i === 119 ? 'legendary' : 'mythic';
  var fx = BASE[i % BASE.length];
  var val = fx[1] * RMUL[rarity];
  var desc;
  if (fx[0] === 'hp' || fx[0] === 'shield') {
    desc = 'Stack +' + Math.max(1, Math.round(val)) + ' to ' + fx[2] + ' while equipped.';
  } else if (fx[0] === 'projs' || fx[0] === 'pierce' || fx[0] === 'aoe') {
    var word = fx[0] === 'projs' ? 'projectile' : fx[0] === 'pierce' ? 'pierce' : 'blast rank';
    desc = 'Stack +' + Math.max(1, Math.round(val * 100)) + '% progress toward +1 ' + word + ' while equipped.';
  } else {
    desc = 'Stack +' + Math.max(1, Math.round(val * 100)) + '% to ' + fx[2] + ' while equipped.';
  }
  var card = {
    id: 'xcard_' + String(i + 1).padStart(3, '0'),
    ic: '✦',
    n: PRE[i % 12] + ' ' + SUF[Math.floor(i / 12) % 10] + ' ' + String(i + 1).padStart(3, '0'),
    d: desc, max: 5, rarity: rarity, extraStat: fx[0], extraValue: val, unique: true
  };
  EXTRA_CARDS.push(card);
  ALL_CARDS.push(card);
}
console.log('Card rebalance active: rarity now scales values (mythic x8), minimum 1%.');
})();

/* ISO_TRADER_SHOP_V1 */
(function(){
if(window.__ISO_TRADER_V1__)return; window.__ISO_TRADER_V1__=true;
var css='#lvl-warn{position:fixed;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;z-index:60;pointer-events:none;background:radial-gradient(circle,rgba(79,216,235,.14),rgba(0,0,0,.6));}#lvl-warn.on{display:flex;}.lw-ring{width:150px;height:150px;border:3px solid #4fd8eb;border-radius:50%;box-shadow:0 0 40px #4fd8eb88,inset 0 0 30px #4fd8eb44;animation:lwP 1.4s infinite;}.lw-txt{font-family:var(--disp);font-size:34px;color:#4fd8eb;letter-spacing:6px;margin-top:18px;text-shadow:0 0 18px #4fd8eb;}.lw-sub{font-family:var(--mono);color:var(--tx2);letter-spacing:3px;margin-top:6px;}.lw-bar{width:260px;height:6px;background:#12222e;margin-top:14px;}.lw-bar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#4fd8eb,#ff5d8f);animation:lwB 1.5s linear forwards;}@keyframes lwP{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}@keyframes lwB{from{width:100%}to{width:0}}#shop-ui{position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:65;background:rgba(4,8,12,.78);}#shop-ui.on{display:flex;}';
var stEl=document.createElement('style'); stEl.textContent=css; document.head.appendChild(stEl);
var warnDiv=document.createElement('div'); warnDiv.id='lvl-warn';
warnDiv.innerHTML='<div class="lw-ring"></div><div class="lw-txt">STABILIZATION SURGE</div><div class="lw-sub">MODULE SELECT INCOMING</div><div class="lw-bar"><i></i></div>';
document.body.appendChild(warnDiv);
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
var __openLevel=openLevel;
openLevel=function(){
 if(!RUN)return __openLevel();
 if(RUN.isOnline&&!NET.isHost)return;
 if(RUN.state==='levelwarn')return;
 RUN.state='levelwarn'; RUN._warnT=1.5; warnDiv.classList.add('on');
 if(RUN.fxQueue){RUN.fxQueue.push({k:'banner',text:'STABILIZATION SURGE'});RUN.fxQueue.push({k:'levelwarn',v:1});}
 broadcastGameState(true);
};
var __drop=drop;
drop=function(x,y,t,v){ if(t==='relic'){__drop(x,y,'coin',6);return;} return __drop(x,y,t,v); };
var __start=start;
start=function(){ var r=__start.apply(this,arguments); if(RUN){RUN.items=RUN.items||[];RUN.shop=null;} return r; };
if(window.GAME){ GAME.start=function(){ var r=__start.apply(this,arguments); if(RUN){RUN.items=RUN.items||[];RUN.shop=null;} return r; }; }
function applyItems(){
 if(!RUN||!ST||!RUN.items||!RUN.items.length)return;
 RUN.items.forEach(function(id){ var it=ITEM_BY[id]; if(!it)return;
  if(ST[it.b]!==undefined)ST[it.b]*=1+it.v;
  if(ST[it.d]!==undefined)ST[it.d]*=1-it.v;
 });
 ST.hp=Math.max(40,Math.round(ST.hp));
 if(ST.shieldMax!==undefined)ST.shieldMax=Math.max(0,Math.round(ST.shieldMax));
 RUN.players.forEach(function(p){p.hp=Math.min(p.hp,ST.hp);p.sh=Math.min(p.sh,ST.shieldMax);});
}
var __cs=computeStats;
computeStats=function(){ __cs(); applyItems(); };
function shopPrice(){ return 60+(RUN.wave||1)*4; }
function pickStock(){
 var pool=ITEMS.filter(function(it){return (RUN.items||[]).indexOf(it.id)<0;});
 for(var i=pool.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=pool[i];pool[i]=pool[j];pool[j]=t;}
 return pool.slice(0,3).map(function(it){return it.id;});
}
function spawnShop(){
 var a=Math.random()*Math.PI*2, dist=120+Math.random()*120;
 RUN.shop={active:true,x:Math.max(90,Math.min(W-90,W/2+Math.cos(a)*dist)),y:Math.max(90,Math.min(H-90,H/2+Math.sin(a)*dist)),r:74,t:16,stock:pickStock(),taken:{},done:{}};
 RUN.interT=Math.max(RUN.interT,16);
 banner('A TRADER ENTERS THE ARENA - APPROACH TO BROWSE',2600);
}
function openShop(){
 var s=RUN.shop; if(!s||!s.active)return;
 s.active=false; s.done={};
 RUN.state='shop';
 banner('THE GEOMETRIST AWAITS YOUR CHOICE',1600);
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
 var ids=RUN.isOnline?RUN.players.map(function(p){return p.id;}):[0];
 var all=ids.every(function(id){return !!s.done[id];});
 if(all)closeShop(); else broadcastGameState(true);
}
function renderShopUI(){
 var s=RUN.shop;
 if(!s||RUN.state!=='shop'){shopDiv.classList.remove('on');return;}
 var myId=RUN.isOnline?RUN.localNetId:0;
 var done=!!s.done[myId];
 var p=shopPrice();
 var html='<div style="width:min(720px,92vw);background:linear-gradient(180deg,#0d1420,#0a0f16);border:1px solid #ffb45466;box-shadow:0 0 60px #ffb45422;padding:22px;clip-path:polygon(18px 0,100% 0,100% calc(100% - 18px),calc(100% - 18px) 100%,0 100%,0 18px);">';
 html+='<div style="font-family:var(--disp);font-size:24px;color:#ffb454;letter-spacing:4px;display:flex;align-items:center;gap:12px;"><span style="font-size:30px;color:#ffb454;text-shadow:0 0 14px #ffb454;display:inline-block;">⬠</span>THE GEOMETRIST<em style="font-size:10px;color:var(--tx2);letter-spacing:3px;font-style:normal;margin-left:auto;">RELIC TRADER - WARES LAST THIS RUN ONLY</em></div>';
 html+='<div style="font-family:var(--mono);color:#ffd43b;margin:6px 0 12px;">BANK ◈ '+RUN.coins+' · PRICE ◈ '+p+'</div>';
 html+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">';
 s.stock.forEach(function(id){
  var it=ITEM_BY[id]; var dd=itemDesc(it); var taken=s.taken[id];
  html+='<button data-buy="'+id+'" style="background:#0f1826;border:1px solid '+(taken?'#33445a':'#ffb454')+';padding:14px 10px;cursor:pointer;text-align:center;color:var(--tx);opacity:'+(taken?'.35':'1')+';">';
  html+='<div style="font-size:26px;">'+it.ic+'</div><b style="display:block;margin:6px 0 4px;color:#eaf4ff;">'+it.n+'</b>';
  html+='<p style="color:#7ef0a6;font-size:11px;margin:0;">'+dd.bd+'</p>';
  html+='<p style="color:#ff5d8f;font-size:11px;margin:2px 0 8px;">'+dd.dd+'</p>';
  html+='<span style="font-family:var(--mono);color:#ffd43b;font-size:12px;">'+(taken?'SOLD OUT':'◈ '+p)+'</span></button>';
 });
 html+='</div><button data-leave="1" style="margin-top:14px;width:100%;background:none;border:1px solid #4fd8eb55;color:#4fd8eb;padding:10px;font-family:var(--mono);letter-spacing:2px;cursor:pointer;">▸ CONTINUE THROUGH THE BREACH</button>';
 if(done)html+='<div style="margin-top:10px;text-align:center;color:var(--tx2);font-family:var(--mono);">CONTRACT SIGNED - AWAITING OTHER OPERATORS…</div>';
 html+='</div>';
 shopDiv.innerHTML=html; shopDiv.classList.add('on');
 function pickAction(key){
  if(RUN.isOnline&&!NET.isHost){ NET.sendClientAction('shoppick:'+key); s.done[myId]='wait'; renderShopUI(); }
  else chooseShop(myId,key);
 }
 var btns=shopDiv.querySelectorAll('[data-buy]');
 for(var i=0;i<btns.length;i++){ btns[i].onclick=function(){ if(!done)pickAction(this.getAttribute('data-buy')); }; }
 var lv=shopDiv.querySelector('[data-leave]');
 if(lv)lv.onclick=function(){ if(!done)pickAction('cont'); };
}
var __update=update;
update=function(dt){
 if(!RUN){__update(dt);return;}
 if(RUN.state==='levelwarn'){
  if(RUN.isOnline&&!NET.isHost){warnDiv.classList.add('on');hud();return;}
  RUN._warnT=(RUN._warnT||1.5)-dt;
  RUN.parts.forEach(function(q){q.t-=dt;});
  RUN.parts=RUN.parts.filter(function(q){return q.t>0;});
  hud();
  if(RUN._warnT<=0){warnDiv.classList.remove('on');__openLevel();}
  return;
 }
 if(RUN.state==='shop'){
  if(RUN.isOnline&&NET.isHost)broadcastGameState(false);
  if(!RUN.isOnline||NET.isHost){ if(!shopDiv.classList.contains('on'))renderShopUI(); }
  hud(); return;
 }
 var prev=RUN.state;
 __update(dt);
 var hostish=!RUN.isOnline||NET.isHost;
 if(hostish){
  if(prev==='play'&&RUN.state==='inter'&&(RUN.mode==='solo'||RUN.mode==='coop'||RUN.mode==='net_coop')){
   if(!RUN.shop&&Math.random()<.3)spawnShop();
  }
  if(RUN.shop&&RUN.shop.active&&RUN.state==='inter'){
   RUN.shop.t-=dt;
   if(RUN.shop.t<=0){RUN.shop=null;RUN.interT=Math.min(RUN.interT,1.2);banner('THE TRADER DEPARTED',1200);}
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
  if(RUN){
   if(RUN.state==='level')warnDiv.classList.remove('on');
   if(s&&s.shop!==undefined){RUN.shop=s.shop;if(!s.shop)RUN._shopReq=false;}
  }
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
function bIdxByName(nm){for(var i=0;i<BDEFS.length;i++){if(BDEFS[i].name===nm)return i;}return -1;}
spawnBoss=function(){
 if(!RUN)return;
 var w=RUN.wave, idx=0;
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
var __bossAI=bossAI;
bossAI=function(b,dt,mx,my,d){
 __bossAI(b,dt,mx,my,d);
 if(b.dead||b.bi===undefined)return;
 b.xt1=(b.xt1||rnd(1,3))-dt;
 if(b.xt1<=0){
  b.xt1=2.6+(b.bi%3)*.7;
  var tp=nearestPlayer(b.x,b.y);
  if(b.bdouble){for(var k=0;k<10;k++){var a=k/10*TAU+b.spirA;ebul(b.x,b.y,a,b.bspd,12);}}
  if(b.bmines&&tp)RUN.eclouds.push({x:tp.x,y:tp.y,r:80,t:3});
  if(b.sum)spawnEnemy(b.bi%2?'wisp':'mote',b.x+rnd(-70,70),b.y+rnd(-60,60));
  if(b.btele){b.x=clamp(tp.x+rnd(-160,160),40,W-40);b.y=clamp(tp.y+rnd(-160,160),40,H-40);ringFx(b.x,b.y,b.hue,120);}
  if(b.bpull){RUN.pullT=1.2;RUN.pullSrc={x:b.x,y:b.y};ringFx(b.x,b.y,b.hue,200);}
 }
};
var __render=render;
render=function(){
 __render();
 if(!RUN)return;
 cx.save();
 RUN.enemies.forEach(function(e){
  if(!e.boss||e.dead)return;
  var bi=(e.bi!==undefined)?e.bi:bIdxByName(e.name);
  if(bi<0)return;
  var sides=3+(bi%6);
  cx.strokeStyle='hsla('+e.hue+',90%,60%,.5)';cx.lineWidth=2;
  cx.beginPath();
  for(var i=0;i<=sides;i++){var a=RUN.t*.8+i/sides*TAU;var rr=e.r+14+4*Math.sin(RUN.t*3+i);var px=e.x+Math.cos(a)*rr,py=e.y+Math.sin(a)*rr;if(i)cx.lineTo(px,py);else cx.moveTo(px,py);}
  cx.closePath();cx.stroke();
  cx.fillStyle='hsla('+e.hue+',90%,70%,.85)';cx.font='bold 12px "Share Tech Mono"';cx.textAlign='center';
  cx.fillText('WARDEN '+String(bi+1).padStart(2,'0'),e.x,e.y-e.r-16);
 });
 if(RUN.shop&&RUN.shop.active&&RUN.state==='inter'){
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
console.log('ISO_TRADER_SHOP_V1 active: level warning, Geometrist relic shop, 24 unique wardens.');
})();
})();
