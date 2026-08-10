/* ============ ISOTOPE · data.js — elements, real molecules, mastery, enemies ============ */
'use strict';
window.DATA = {};
(function () {
  const CATS = [
    {
      n: 'Alkali Metal', h: 12, dmg: 13, rate: 1.5, ps: 330, kb: 140, cost: 1.15, style: 'boom', tox: 1, react: 5,
      blurb: 'Volatile shots detonate on impact.', act: { name: 'Blast', ic: '💥', cd: 6, desc: 'Massive detonation around you.' }
    },
    {
      n: 'Alkaline Earth', h: 36, dmg: 22, rate: .85, ps: 300, kb: 280, cost: 1.1, style: 'heavy', tox: 0, react: 3,
      blurb: 'Dense slugs with crushing knockback.', act: { name: 'Seismic Slam', ic: '⛰', cd: 7, desc: 'AoE shockwave that hurls enemies back.' }
    },
    {
      n: 'Transition Metal', h: 212, dmg: 10, rate: 2.2, ps: 380, kb: 90, cost: 1.0, style: 'metal', tox: 0, react: 2,
      blurb: 'Rapid-fire metallic shards.', act: { name: 'Blade Storm', ic: '🗡', cd: 5, desc: 'Radial fan of piercing shards.' }
    },
    {
      n: 'Post-Transition', h: 168, dmg: 18, rate: 1.1, ps: 285, kb: 230, cost: 1.1, style: 'dense', tox: 1, react: 2,
      blurb: 'Heavy rounds that shove enemies back.', act: { name: 'Heavy Crush', ic: '⬇', cd: 7, desc: 'Fires a colossal piercing slug.' }
    },
    {
      n: 'Metalloid', h: 90, dmg: 12, rate: 1.6, ps: 340, kb: 100, cost: 1.2, style: 'phase', tox: 1, react: 3,
      blurb: 'Warping bolts · +1 pierce.', act: { name: 'Phase Shift', ic: '➤', cd: 5, desc: 'Teleport through foes, damaging them.' }
    },
    {
      n: 'Reactive Nonmetal', h: 196, dmg: 11, rate: 1.9, ps: 420, kb: 80, cost: 1.0, style: 'pure', tox: 0, react: 4,
      blurb: 'Clean fast bolts · +8% crit.', act: { name: 'Pure Beam', ic: '☄', cd: 6, desc: 'Sweeping piercing beam burst.' }
    },
    {
      n: 'Halogen', h: 120, dmg: 11, rate: 1.7, ps: 360, kb: 80, cost: 1.25, style: 'corrode', tox: 5, react: 5,
      blurb: 'Corrosive poison on hit.', act: { name: 'Toxic Bloom', ic: '☠', cd: 7, desc: 'Erupts a large poison field.' }
    },
    {
      n: 'Noble Gas', h: 306, dmg: 9, rate: 2.4, ps: 460, kb: 30, cost: 1.3, style: 'inert', tox: 0, react: 0,
      blurb: 'Untouched beams · +2 pierce.', act: { name: 'Inert Field', ic: '◈', cd: 9, desc: 'Brief invulnerability pulse.' }
    },
    {
      n: 'Lanthanide', h: 268, dmg: 12, rate: 1.6, ps: 350, kb: 90, cost: 1.35, style: 'magnet', tox: 0, react: 2,
      blurb: 'Shots subtly seek targets.', act: { name: 'Magnetic Pull', ic: '🧲', cd: 7, desc: 'Drags all enemies inward and crushes.' }
    },
    {
      n: 'Actinide', h: 72, dmg: 15, rate: 1.4, ps: 340, kb: 100, cost: 1.5, style: 'rad', tox: 4, react: 4,
      blurb: 'Radioactive aura scorches nearby foes.', act: { name: 'Meltdown', ic: '☢', cd: 8, desc: 'Sustained radiation nova burst.' }
    },
    {
      n: 'Superheavy · Unstable', h: 336, dmg: 16, rate: 1.5, ps: 360, kb: 110, cost: 1.7, style: 'chaos', tox: 3, react: 5,
      blurb: 'Unpredictable critical surges.', act: { name: 'Collapse', ic: '⬤', cd: 9, desc: 'Forms a collapsing gravity singularity.' }
    }];

  const EDATA = `1|H|Hydrogen|5|1|1
2|He|Helium|7|18|1
3|Li|Lithium|0|1|2
4|Be|Beryllium|1|2|2
5|B|Boron|4|13|2
6|C|Carbon|5|14|2
7|N|Nitrogen|5|15|2
8|O|Oxygen|5|16|2
9|F|Fluorine|6|17|2
10|Ne|Neon|7|18|2
11|Na|Sodium|0|1|3
12|Mg|Magnesium|1|2|3
13|Al|Aluminium|3|13|3
14|Si|Silicon|4|14|3
15|P|Phosphorus|5|15|3
16|S|Sulfur|5|16|3
17|Cl|Chlorine|6|17|3
18|Ar|Argon|7|18|3
19|K|Potassium|0|1|4
20|Ca|Calcium|1|2|4
21|Sc|Scandium|2|3|4
22|Ti|Titanium|2|4|4
23|V|Vanadium|2|5|4
24|Cr|Chromium|2|6|4
25|Mn|Manganese|2|7|4
26|Fe|Iron|2|8|4
27|Co|Cobalt|2|9|4
28|Ni|Nickel|2|10|4
29|Cu|Copper|2|11|4
30|Zn|Zinc|2|12|4
31|Ga|Gallium|3|13|4
32|Ge|Germanium|4|14|4
33|As|Arsenic|4|15|4
34|Se|Selenium|5|16|4
35|Br|Bromine|6|17|4
36|Kr|Krypton|7|18|4
37|Rb|Rubidium|0|1|5
38|Sr|Strontium|1|2|5
39|Y|Yttrium|2|3|5
40|Zr|Zirconium|2|4|5
41|Nb|Niobium|2|5|5
42|Mo|Molybdenum|2|6|5
43|Tc|Technetium|2|7|5
44|Ru|Ruthenium|2|8|5
45|Rh|Rhodium|2|9|5
46|Pd|Palladium|2|10|5
47|Ag|Silver|2|11|5
48|Cd|Cadmium|2|12|5
49|In|Indium|3|13|5
50|Sn|Tin|3|14|5
51|Sb|Antimony|4|15|5
52|Te|Tellurium|4|16|5
53|I|Iodine|6|17|5
54|Xe|Xenon|7|18|5
55|Cs|Caesium|0|1|6
56|Ba|Barium|1|2|6
57|La|Lanthanum|8|3|8
58|Ce|Cerium|8|4|8
59|Pr|Praseodymium|8|5|8
60|Nd|Neodymium|8|6|8
61|Pm|Promethium|8|7|8
62|Sm|Samarium|8|8|8
63|Eu|Europium|8|9|8
64|Gd|Gadolinium|8|10|8
65|Tb|Terbium|8|11|8
66|Dy|Dysprosium|8|12|8
67|Ho|Holmium|8|13|8
68|Er|Erbium|8|14|8
69|Tm|Thulium|8|15|8
70|Yb|Ytterbium|8|16|8
71|Lu|Lutetium|8|17|8
72|Hf|Hafnium|2|4|6
73|Ta|Tantalum|2|5|6
74|W|Tungsten|2|6|6
75|Re|Rhenium|2|7|6
76|Os|Osmium|2|8|6
77|Ir|Iridium|2|9|6
78|Pt|Platinum|2|10|6
79|Au|Gold|2|11|6
80|Hg|Mercury|2|12|6
81|Tl|Thallium|3|13|6
82|Pb|Lead|3|14|6
83|Bi|Bismuth|3|15|6
84|Po|Polonium|3|16|6
85|At|Astatine|6|17|6
86|Rn|Radon|7|18|6
87|Fr|Francium|0|1|7
88|Ra|Radium|1|2|7
89|Ac|Actinium|9|3|9
90|Th|Thorium|9|4|9
91|Pa|Protactinium|9|5|9
92|U|Uranium|9|6|9
93|Np|Neptunium|9|7|9
94|Pu|Plutonium|9|8|9
95|Am|Americium|9|9|9
96|Cm|Curium|9|10|9
97|Bk|Berkelium|9|11|9
98|Cf|Californium|9|12|9
99|Es|Einsteinium|9|13|9
100|Fm|Fermium|9|14|9
101|Md|Mendelevium|9|15|9
102|No|Nobelium|9|16|9
103|Lr|Lawrencium|9|17|9
104|Rf|Rutherfordium|2|4|7
105|Db|Dubnium|2|5|7
106|Sg|Seaborgium|2|6|7
107|Bh|Bohrium|2|7|7
108|Hs|Hassium|2|8|7
109|Mt|Meitnerium|10|9|7
110|Ds|Darmstadtium|10|10|7
111|Rg|Roentgenium|10|11|7
112|Cn|Copernicium|2|12|7
113|Nh|Nihonium|10|13|7
114|Fl|Flerovium|10|14|7
115|Mc|Moscovium|10|15|7
116|Lv|Livermorium|10|16|7
117|Ts|Tennessine|10|17|7
118|Og|Oganesson|10|18|7`;
  const ELEMS = {};
  EDATA.split('\n').forEach(l => {
    const [n, sym, name, cat, g, row] = l.split('|');
    const e = { id: 'e' + n, n: +n, sym, name, cat: +cat, g: +g, row: +row };
    e.hue = CATS[e.cat].h + ((e.n * 13) % 18 - 9);
    e.cost = e.n === 1 || e.n === 6 || e.n === 8 ? 0 : Math.max(25, Math.round((30 + e.n * 2.3) * CATS[e.cat].cost / 5) * 5);
    ELEMS[e.id] = e
  });

  // Every selectable isotope gets a personal signature, rather than inheriting
  // one generic category skill. Fusions use the same system with their formula
  // as the seed, so they receive their own named active as well.
  const SIGNATURES = [
    ['pulse', 'Ion Pulse', '✦', 'Detonates a focused ion shockwave.'],
    ['lance', 'Spectral Lance', '➤', 'Fires a long piercing elemental lance.'],
    ['orbit', 'Electron Crown', '◉', 'Launches a rotating ring of charged particles.'],
    ['veil', 'Phase Veil', '◇', 'Blink forward and become briefly untouchable.'],
    ['storm', 'Arc Storm', 'ϟ', 'Chains electricity through the nearest hostiles.'],
    ['bloom', 'Catalyst Bloom', '✹', 'Creates a lingering reactive field.'],
    ['anchor', 'Mass Anchor', '⬣', 'Pins nearby enemies and crushes them inward.'],
    ['ward', 'Noble Ward', '◈', 'Shields allies and clears incoming pressure.'],
    ['flare', 'Photon Flare', '☀', 'Emits a blinding burst that stuns hostiles.'],
    ['drill', 'Crystal Drill', '◆', 'Releases a spread of armor-piercing shards.'],
    ['tide', 'Molecular Tide', '≈', 'Expands a rolling wave that slows foes.'],
    ['nova', 'Decay Nova', '☢', 'Releases three delayed radioactive detonations.']
  ];
  function sigHash(s) { return [...String(s)].reduce((v, c) => (v * 31 + c.charCodeAt(0)) >>> 0, 7) }
  function signatureFor(el) {
    const seed = el.mol ? sigHash(el.token || el.f || el.name) : el.n;
    const base = SIGNATURES[seed % SIGNATURES.length];
    const label = el.mol ? (el.f || el.name) : el.sym;
    return { key: base[0], name: label + ' ' + base[1], ic: base[2], cd: Math.max(4.5, 8 - (seed % 4) * .55), desc: base[3] };
  }
  const CUSTOM_ABILITIES = {"1":{"name":"Hydrogen Burst","desc":"Fires extremely light projectiles that accelerate over distance. Hold fire to compress hydrogen and release a massive explosive shot."},"2":{"name":"Float","desc":"Your character becomes extremely light, allowing them to float over hazards and recoil dramatically from shots. Secondary ability launches helium balloons that pull enemies upward."},"3":{"name":"Reactive Dash","desc":"Dashing leaves behind lithium particles. Enemies touching them trigger a violent reaction and explosion."},"4":{"name":"Lightweight Armor","desc":"Extremely high movement speed and armor penetration. Your bullets become tiny, fast projectiles that pierce enemies."},"5":{"name":"Crystal Field","desc":"Creates crystalline structures that block bullets. Shooting your own crystals causes them to fracture into razor-sharp shards."},"6":{"name":"Allotropy","desc":"Switch between Diamond (armor/tank), Graphite (electric conduction), and Carbon Dust (stealth)."},"7":{"name":"Cryogenic Fog","desc":"Releases nitrogen vapor that rapidly cools an area, slowing enemies and eventually freezing them."},"8":{"name":"Combustion","desc":"Doesn't directly do huge damage; instead, massively amplifies nearby fire/explosions. Creates oxygen zones that make other attacks stronger."},"9":{"name":"Corrosion","desc":"Extremely aggressive projectiles that eat through enemy armor. Damage increases against already-damaged targets."},"10":{"name":"Neon Sign","desc":"Creates glowing laser barriers. Enemies crossing them take repeated damage. Different colors can correspond to different effects."},"11":{"name":"Water Reaction","desc":"Throw sodium pellets that explode when they contact water. Your ability can create temporary water pools specifically to combo with them."},"12":{"name":"Flashburn","desc":"Fires extremely bright magnesium flares that blind enemies and illuminate the entire map."},"13":{"name":"Metal Storm","desc":"Rapid-fire lightweight metal shards. Huge magazine, extremely fast reload."},"14":{"name":"Circuit","desc":"Place conductive nodes that create electrical pathways between each other. Build your own traps around the map."},"15":{"name":"White Flame","desc":"Shots leave persistent burning trails. Enemies killed by fire leave additional flames behind."},"16":{"name":"Sulfur Cloud","desc":"Creates a yellow toxic cloud that damages enemies over time and obscures vision."},"17":{"name":"Gas Burst","desc":"Releases poisonous gas that spreads outward and lingers. Wind/environmental mechanics can move the cloud."},"18":{"name":"Inert Zone","desc":"Creates an area where elemental reactions are disabled. Fire can't spread, electricity can't chain, etc."},"19":{"name":"Overreaction","desc":"Extremely unstable rapid-fire weapon. Every few shots randomly causes a small explosive reaction."},"20":{"name":"Bone Wall","desc":"Summons calcium structures resembling giant skeletal walls. They absorb damage and can be shattered into projectiles."},"21":{"name":"Reinforcement","desc":"Temporarily strengthens every object you interact with: cover, traps, projectiles, etc."},"22":{"name":"Titan Frame","desc":"Massive damage resistance while maintaining decent speed. Ultimate gives temporary near-unstoppable movement."},"23":{"name":"Battery Shot","desc":"Attacks store energy instead of immediately releasing it. Shoot again to discharge all stored energy."},"24":{"name":"Chromium Coat","desc":"Reflective armor has a chance to bounce enemy projectiles back toward attackers."},"25":{"name":"Catalyst","desc":"Makes nearby elemental effects happen faster and increases reaction speed."},"26":{"name":"Magnetism","desc":"Pulls metal projectiles, enemies with metal armor, and dropped objects toward you. Can create a giant magnetic vortex."},"27":{"name":"Radiant Core","desc":"Generates an energy core that slowly charges. When full, it releases a powerful beam."},"28":{"name":"Magnetic Shield","desc":"Creates a magnetic barrier that deflects certain projectiles."},"29":{"name":"Conductor","desc":"Your bullets can jump between enemies. The more connected enemies there are, the stronger the chain becomes."},"30":{"name":"Sacrificial Plating","desc":"Damage first consumes a protective zinc layer. When destroyed, it releases a healing burst."},"31":{"name":"Meltdown","desc":"Your weapon literally melts into liquid when overheated, temporarily changing its attack pattern."},"32":{"name":"Semiconductor","desc":"Toggle between Conductive and Insulating states to control whether your attacks interact with electricity."},"33":{"name":"Poison Bullet","desc":"Weak direct damage but devastating poison stacking."},"34":{"name":"Photoreaction","desc":"Gets stronger while standing in bright areas. Dark areas make it weaker but increase stealth."},"35":{"name":"Liquid Hazard","desc":"Throws bouncing pools of corrosive liquid that remain on the ground."},"36":{"name":"Flash Lance","desc":"Fires concentrated beams of light that briefly reveal invisible enemies."},"37":{"name":"Hyperreactive","desc":"Every hit builds instability. At maximum instability, your next shot causes a massive chain reaction."},"38":{"name":"Red Flare","desc":"Creates brilliant red flares that mark enemies. Marked enemies take increasing damage from all attacks."},"39":{"name":"Phosphor Drone","desc":"Summons glowing drones that illuminate enemies and fire tiny energy shots."},"40":{"name":"Heat Shield","desc":"Becomes stronger as your surroundings become hotter. Fire attacks actually charge your defenses."},"41":{"name":"Superconductor","desc":"Temporarily removes energy loss from your weapons, giving absurdly efficient attacks."},"42":{"name":"Heatproof","desc":"Your weapon becomes stronger the longer it fires continuously."},"43":{"name":"Unstable Shot","desc":"Every projectile has a chance to decay into another random projectile type."},"44":{"name":"Catalytic Mark","desc":"Mark an enemy so all elemental reactions happen dramatically faster on it."},"45":{"name":"Mirror Armor","desc":"Reflects a percentage of incoming damage back toward attackers."},"46":{"name":"Hydrogen Storage","desc":"Absorbs hydrogen attacks and stores them. Release the stored energy as a giant blast."},"47":{"name":"Silver Rain","desc":"Extremely fast projectiles with high precision. Ultimate creates a storm of silver bullets."},"48":{"name":"Toxic Battery","desc":"Stores energy from damage taken and converts it into poisonous projectiles."},"49":{"name":"Liquid Metal","desc":"Creates flowing metal that snakes around obstacles toward enemies."},"50":{"name":"Tin Soldier","desc":"Summons tiny autonomous soldiers that fight alongside you."},"51":{"name":"Brittle Burst","desc":"Creates fragile crystal bombs that explode into dozens of shards."},"52":{"name":"Contamination","desc":"Infects enemies; killing an infected enemy spreads the effect."},"53":{"name":"Vapor Mark","desc":"Creates purple vapor that marks enemies and reveals their health through walls."},"54":{"name":"Xenon Flash","desc":"Enormous flash that blinds enemies and briefly freezes weaker enemies."},"55":{"name":"Time Reaction","desc":"Extremely unstable. Your shots become faster and stronger every second until they trigger a massive reaction."},"56":{"name":"Gravity Shell","desc":"Creates heavy projectiles that bend enemy movement toward their impact points."},"57":{"name":"Element Shift","desc":"Temporarily copies the basic property of a nearby elemental attack."},"58":{"name":"Spark Stone","desc":"Creates friction sparks when moving, leaving damaging trails behind you."},"59":{"name":"Magnetic Swarm","desc":"Fires several small magnetic projectiles that curve toward enemies."},"60":{"name":"Ultimate Magnet","desc":"Creates an enormous magnetic field that pulls enemies, weapons, and projectiles toward a central point."},"61":{"name":"Decay Beacon","desc":"Place a radioactive beacon that continuously damages everything around it."},"62":{"name":"Magnetic Mine","desc":"Mines attract nearby enemies before detonating."},"63":{"name":"Red Phosphor","desc":"Marks enemies with glowing red symbols, making them visible through walls."},"64":{"name":"Magnetic Armor","desc":"Magnetic fields reduce incoming projectile damage."},"65":{"name":"Green Pulse","desc":"Emits periodic pulses that disable enemy abilities."},"66":{"name":"Extreme Magnet","desc":"Creates an extremely powerful but tiny magnetic field that violently drags enemies together."},"67":{"name":"Magnetic Lance","desc":"Charges a straight-line attack that ignores most enemy armor."},"68":{"name":"Fiber Beam","desc":"Fires extremely thin, precise laser threads."},"69":{"name":"Rare Shot","desc":"Extremely slow-firing weapon with enormous single-target damage."},"70":{"name":"Atomic Pulse","desc":"Charge your weapon by standing still; movement cancels the charge but allows rapid repositioning."},"71":{"name":"Precision Core","desc":"Crit chance and weak-point damage increase dramatically."},"72":{"name":"Energy Reserve","desc":"Stores incoming energy and releases it when your health becomes low."},"73":{"name":"Unbreakable","desc":"Creates temporary armor that cannot be destroyed, but greatly slows movement."},"74":{"name":"Heavy Shell","desc":"Fires incredibly slow, gigantic projectiles with massive impact force."},"75":{"name":"Overheat Mastery","desc":"Your weapon gets stronger at extreme heat instead of overheating normally."},"76":{"name":"Density","desc":"Become extremely heavy. You can't be knocked back and your attacks create shockwaves."},"77":{"name":"Meteorite","desc":"Calls down extremely dense impact strikes from above."},"78":{"name":"Catalyst","desc":"Greatly amplifies status effects without directly increasing base damage."},"79":{"name":"Midas","desc":"Enemies you kill drop gold. Gold can temporarily increase damage, speed, or health."},"80":{"name":"Liquid Body","desc":"Become a flowing liquid that can slip through small gaps and split into multiple droplets."},"81":{"name":"Delayed Poison","desc":"Damage doesn't happen immediately; instead, enemies accumulate lethal poison that triggers simultaneously."},"82":{"name":"Lead Barrier","desc":"Extremely effective radiation shielding. Creates a heavy wall that blocks radiation and projectiles."},"83":{"name":"Crystal Growth","desc":"Creates beautiful stepped crystals that continuously grow outward and damage enemies."},"84":{"name":"Radiation Touch","desc":"Enemies you hit become radioactive and damage other enemies nearby."},"85":{"name":"Decay Curse","desc":"Extremely powerful radioactive curse with a short duration."},"86":{"name":"Invisible Gas","desc":"Creates an invisible toxic zone. Enemies don't know they're inside until damage begins."},"87":{"name":"Critical Reaction","desc":"One of the most unstable elements: every attack has an escalating chance to cause a gigantic reaction."},"88":{"name":"Radiant Aura","desc":"Constantly emits radiation around you. The longer enemies stay nearby, the more damage they take."},"89":{"name":"Radiation Core","desc":"Slowly generates radioactive energy, allowing you to fire increasingly powerful radiation blasts."},"90":{"name":"Decay Cannon","desc":"Slow but extremely powerful shots that leave radiation zones behind."},"91":{"name":"Decay Chain","desc":"Every hit cycles through multiple radioactive effects before reaching its final form."},"92":{"name":"Fission","desc":"Shots split into smaller projectiles when hitting enemies. Those split again on subsequent hits."},"93":{"name":"Deep Radiation","desc":"Projectiles pass through walls but lose damage with distance."},"94":{"name":"Critical Mass","desc":"Collect energy from kills. Reach critical mass to trigger a gigantic explosion."},"95":{"name":"Smoke Detector","desc":"Creates invisible detection zones that reveal enemies through walls."},"96":{"name":"Heat Ray","desc":"Emits constant radiation that becomes stronger while aimed at the same enemy."},"97":{"name":"Decay Bomb","desc":"Throw a bomb that slowly decays before violently detonating."},"98":{"name":"Neutron Burst","desc":"Fires extremely powerful neutron-like blasts that pass through multiple enemies."},"99":{"name":"Brainwave","desc":"Temporarily slows enemy AI and causes enemies to behave erratically."},"100":{"name":"Atomic Collapse","desc":"Fires unstable particles that collapse into explosions after traveling a certain distance."},"101":{"name":"Chain Reaction","desc":"Every kill increases your damage until you stop killing enemies."},"102":{"name":"Noble Decay","desc":"Creates an area where enemies slowly lose their buffs and abilities."},"103":{"name":"Particle Lance","desc":"Fires an extremely narrow beam with almost no spread."},"104":{"name":"Heavy Particle","desc":"Slow projectiles that massively knock enemies backward."},"105":{"name":"Split Decay","desc":"Projectiles randomly split into different trajectories after hitting something."},"106":{"name":"Decay Reactor","desc":"Place a reactor that continuously produces increasingly powerful radiation pulses."},"107":{"name":"Impact Frame","desc":"Your attacks become stronger based on how fast you're moving."},"108":{"name":"Dense Core","desc":"Creates extremely dense gravitational projectiles."},"109":{"name":"Unknown Reaction","desc":"Every shot has a randomly selected effect from a controlled pool."},"110":{"name":"Ultra-Dense Shot","desc":"Fires tiny projectiles that deal enormous damage but have extremely slow fire rates."},"111":{"name":"X-Ray Vision","desc":"See enemies, items, traps, and weak points through walls."},"112":{"name":"Phase Shift","desc":"Briefly become intangible and pass through enemies/projectiles."},"113":{"name":"Decay Mark","desc":"Mark enemies; after enough hits, their mark detonates and spreads to nearby targets."},"114":{"name":"Superheavy Shot","desc":"Extremely heavy bullets barely get affected by knockback, explosions, or enemy abilities."},"115":{"name":"Unstable Core","desc":"Your health slowly converts into ammunition/energy, making it a high-risk glass-cannon element."},"116":{"name":"Radioactive Sludge","desc":"Fires sticky projectiles that remain attached to enemies and continuously damage them."},"117":{"name":"Reactive Poison","desc":"Combines poison with highly reactive explosions when poisoned enemies are hit again."},"118":{"name":"Atomic Singularity","desc":"Ultimate creates a temporary miniature gravitational field that pulls enemies and projectiles inward before collapsing in a massive explosion."}};
  Object.values(ELEMS).forEach(e => {
    const sig = signatureFor(e), custom = CUSTOM_ABILITIES[String(e.n)];
    e.act = custom ? { ...sig, name: custom.name, desc: custom.desc } : sig;
  });

  /* ---- REAL molecules & reactions (all are genuine chemistry) ---- */
  function M(token, f, name, hue, mods, trait, desc, rx) {
    const m = { token, f, name, hue, mods, trait, desc, rx, mol: true };
    m.act = signatureFor(m); return m
  }
  const MOLDEF = {
    'H+H+O': M('H2O', 'H₂O', 'Water', 203, { rate: 1.1, hp: 1.2 }, 'hydrate', 'Regen 1.5 HP/s · hits chill.', '2H + O → H₂O'),
    'H+O': M('OH', '•OH', 'Hydroxyl Radical', 185, { dmg: 1.35, hp: .85 }, 'none', 'Savage oxidizer, fragile vessel.', 'H + O → •OH'),
    'O+O': M('O3', 'O₃', 'Ozone', 265, { rate: 1.15, ps: 1.1 }, 'chain', 'Hits arc lightning.', 'O + O → O₃'),
    'C+O': M('CO', 'CO', 'Carbon Monoxide', 222, { dmg: 1.1 }, 'toxic', 'Lingering poison.', 'C + O → CO'),
    'C+O+O': M('CO2', 'CO₂', 'Carbon Dioxide', 210, { dmg: 1.1, kb: 1.3, rate: .95 }, 'chill', 'Blasts freeze enemies.', 'C + O₂ → CO₂'),
    'C+N': M('CN', 'CN', 'Cyanide Radical', 130, { dmg: 1.25, rate: 1.05, hp: .9 }, 'toxic', 'Lethal biotoxin.', 'C + N → CN•'),
    'Cl+Na': M('NaCl', 'NaCl', 'Halite', 195, { dmg: 1.1, kb: 1.25, crit: 18 }, 'none', '+18% crit, heavy knockback.', 'Na + Cl → NaCl'),
    'Cl+H': M('HCl', 'HCl', 'Hydrochloric Acid', 95, { dmg: 1.1 }, 'acid', 'Marks foes: +35% dmg taken.', 'H + Cl → HCl'),
    'H+H+H+N': M('NH3', 'NH₃', 'Ammonia', 175, { rate: 1.1 }, 'vital', 'Heal 2 HP per kill.', 'N + 3H → NH₃'),
    'Fe+O': M('FeO', 'FeO', 'Wüstite', 18, { hp: 1.3, kb: 1.5, rate: .9 }, 'armor', '25% damage reduction.', 'Fe + O → FeO'),
    'O+O+S': M('SO2', 'SO₂', 'Sulfur Dioxide', 65, { dmg: 1.05 }, 'cloud', 'Leaves acid clouds.', 'S + O₂ → SO₂'),
    'N+O': M('NO', 'NO', 'Nitric Oxide', 230, { spd: 1.2, rate: 1.15 }, 'none', 'Move & fire faster.', 'N + O → NO'),
    'N+N+O': M('N2O', 'N₂O', 'Nitrous Oxide', 295, { rate: 1.1, crit: 15 }, 'giggle', '+15% crit; foes stagger.', '2N + O → N₂O'),
    'H+H+S': M('H2S', 'H₂S', 'Hydrogen Sulfide', 75, { dmg: 1.15 }, 'miasma', 'Poison and slow.', '2H + S → H₂S'),
    'C+C+H+H': M('C2H2', 'C₂H₂', 'Acetylene', 32, { dmg: 1.25 }, 'boom', 'Shots detonate.', '2C + 2H → C₂H₂'),
    'C+Fe': M('Steel', 'Fe·C', 'STEEL', 215, { hp: 1.35, dmg: 1.1, kb: 1.3, rate: .95 }, 'armor', 'Tough forged alloy.', 'Fe + C → steel'),
    'Cu+Sn': M('Bronze', 'Cu·Sn', 'BRONZE', 38, { rate: 1.25, dmg: 1.05 }, 'none', 'Relentless fire rate.', 'Cu + Sn → bronze'),
    'Cu+Zn': M('Brass', 'Cu·Zn', 'BRASS', 48, { rate: 1.1, pierce: 1 }, 'none', 'Rounds pierce +1.', 'Cu + Zn → brass'),
    'O+O+Si': M('SiO2', 'SiO₂', 'Quartz', 315, { ps: 1.2, pierce: 2, crit: 10 }, 'none', '+2 pierce, +10% crit.', 'Si + O₂ → SiO₂'),
    'Mg+O': M('MgO', 'MgO', 'Magnesia', 55, { hp: 1.1 }, 'flash', 'Flash stuns foes.', 'Mg + O → MgO'),
    'Cl+K': M('KCl', 'KCl', 'Sylvite', 280, { dmg: 1.2 }, 'none', 'Violet flame force.', 'K + Cl → KCl'),
    'H+Na+O': M('NaOH', 'NaOH', 'Caustic Soda', 120, { dmg: 1.2 }, 'acid', 'Severe acid marking.', 'Na+O+H → NaOH'),
    'Ca+O': M('CaO', 'CaO', 'Quicklime', 25, { dmg: 1.1 }, 'burn', 'Ignites enemies.', 'Ca + O → CaO'),
    'H+H+O+O': M('H2O2', 'H₂O₂', 'Hydrogen Peroxide', 190, { dmg: 1.15, rate: 1.05 }, 'boom', 'Volatile detonations.', '2H+2O → H₂O₂'),
    'Ag+Au': M('Electrum', 'Au·Ag', 'ELECTRUM', 48, { dmg: 1.1, crit: 5 }, 'lucky', '+40% coin drops.', 'Au + Ag → electrum'),
    'C+H+H+H+H': M('CH4', 'CH₄', 'Methane', 210, { dmg: 1.1, rate: 1.05 }, 'boom', 'Flammable: explodes.', 'C + 4H → CH₄'),
    'C+H+N': M('HCN', 'HCN', 'Hydrogen Cyanide', 130, { dmg: 1.3, hp: .9 }, 'toxic', 'Deadly toxin.', 'H+C+N → HCN'),
    'C+H+H+O': M('CH2O', 'CH₂O', 'Formaldehyde', 180, { rate: 1.1 }, 'toxic', 'Preservative poison.', 'C+2H+O → CH₂O'),
    'N+O+O': M('NO2', 'NO₂', 'Nitrogen Dioxide', 30, { dmg: 1.15 }, 'miasma', 'Toxic brown gas.', 'N + O₂ → NO₂'),
    'O+O+O+S': M('SO3', 'SO₃', 'Sulfur Trioxide', 60, { dmg: 1.15 }, 'acid', 'Acid anhydride.', 'S + 3O → SO₃'),
    'Cu+O': M('CuO', 'CuO', 'Tenorite', 20, { dmg: 1.1, kb: 1.2 }, 'burn', 'Hot copper oxide.', 'Cu + O → CuO'),
    'O+Zn': M('ZnO', 'ZnO', 'Zinc Oxide', 200, { hp: 1.15 }, 'armor', 'Protective oxide.', 'Zn + O → ZnO'),
    'Ag+Ag+S': M('Ag2S', 'Ag₂S', 'Acanthite', 240, { dmg: 1.1 }, 'toxic', 'Silver tarnish.', '2Ag + S → Ag₂S'),
    'O+Pb': M('PbO', 'PbO', 'Massicot', 45, { dmg: 1.2, kb: 1.3, rate: .9 }, 'armor', 'Heavy lead oxide.', 'Pb + O → PbO'),
    'Na+Na+O': M('Na2O', 'Na₂O', 'Sodium Oxide', 58, { dmg: 1.1 }, 'acid', 'Reactive base oxide.', '2Na + O → Na₂O'),
    'K+K+O': M('K2O', 'K₂O', 'Potash', 40, { dmg: 1.1, rate: 1.05 }, 'burn', 'Caustic potash.', '2K + O → K₂O'),
    'Ca+Cl+Cl': M('CaCl2', 'CaCl₂', 'Calcium Chloride', 190, { rate: 1.1 }, 'chill', 'De-icing chill.', 'Ca + 2Cl → CaCl₂'),
    'Cl+Cl+Mg': M('MgCl2', 'MgCl₂', 'Magnesium Chloride', 185, { rate: 1.05 }, 'chill', 'Bittern salts.', 'Mg + 2Cl → MgCl₂'),
    'F+Na': M('NaF', 'NaF', 'Sodium Fluoride', 160, { dmg: 1.1, crit: 8 }, 'none', 'Enamel-hard edge.', 'Na + F → NaF'),
    'F+K': M('KF', 'KF', 'Potassium Fluoride', 155, { dmg: 1.1 }, 'toxic', 'Corrosive fluoride.', 'K + F → KF'),
    'F+Li': M('LiF', 'LiF', 'Lithium Fluoride', 150, { ps: 1.15 }, 'none', 'Optical crystal.', 'Li + F → LiF'),
    'Ag+Cl': M('AgCl', 'AgCl', 'Chlorargyrite', 230, { dmg: 1.1, crit: 6 }, 'flash', 'Photographic flash.', 'Ag + Cl → AgCl'),
    'Ag+N+O+O+O': M('AgNO3', 'AgNO₃', 'Silver Nitrate', 225, { dmg: 1.2, crit: 8 }, 'acid', 'Caustic lunar salt.', 'Ag+N+3O → AgNO₃'),
    'K+N+O+O+O': M('KNO3', 'KNO₃', 'Saltpeter', 35, { dmg: 1.15, rate: 1.1 }, 'burn', 'Oxidizer of gunpowder.', 'K+N+3O → KNO₃'),
    'As+Ga': M('GaAs', 'GaAs', 'Gallium Arsenide', 300, { rate: 1.2, ps: 1.1 }, 'battery', 'Semiconductor speed.', 'Ga + As → GaAs'),
    'In+P': M('InP', 'InP', 'Indium Phosphide', 290, { rate: 1.15, ps: 1.15 }, 'battery', 'Photonic crystal.', 'In + P → InP'),
    'Cd+Te': M('CdTe', 'CdTe', 'Cadmium Telluride', 310, { dmg: 1.1, rate: 1.1 }, 'battery', 'Solar-cell lattice.', 'Cd + Te → CdTe'),
    'Al+Al+O+O+O': M('Al2O3', 'Al₂O₃', 'Sapphire', 220, { hp: 1.25, armor: 1 }, 'armor', 'Corundum: 25% DR.', '2Al+3O → Al₂O₃'),
    'Fe+Fe+O+O+O': M('Fe2O3', 'Fe₂O₃', 'Hematite', 10, { dmg: 1.1, kb: 1.3 }, 'burn', 'Red iron oxide.', '2Fe+3O → Fe₂O₃'),
    'C+Si': M('SiC', 'SiC', 'Carborundum', 140, { dmg: 1.2, kb: 1.2, pierce: 1 }, 'none', 'Abrasive-hard edges.', 'Si + C → SiC'),
    'Ni+Ti': M('NiTi', 'NiTi', 'Nitinol', 205, { rate: 1.1, hp: 1.15 }, 'vital', 'Shape-memory: self-repair.', 'Ni + Ti → NiTi'),
    'Cu+Ni': M('CuNi', 'Cu·Ni', 'Cupronickel', 198, { rate: 1.15, dmg: 1.05 }, 'none', 'Coin-metal alloy.', 'Cu + Ni → cupronickel'),
    'Ag+Cu': M('Sterling', 'Ag·Cu', 'STERLING', 210, { rate: 1.2, crit: 10 }, 'none', '925 silver: fast & keen.', 'Ag + Cu → sterling'),
    'Cu+Au': M('RoseGold', 'Au·Cu', 'ROSE GOLD', 15, { crit: 12, dmg: 1.1 }, 'lucky', 'Ornate & precise.', 'Au + Cu → rose gold'),
    'Ni+Au': M('WhiteGold', 'Au·Ni', 'WHITE GOLD', 50, { crit: 10, dmg: 1.15 }, 'lucky', 'Pale gold alloy.', 'Au + Ni → white gold'),
    'Pb+Sn': M('Solder', 'Sn·Pb', 'SOLDER', 225, { rate: 1.15, kb: .8 }, 'none', 'Low-melt binder.', 'Sn + Pb → solder'),
    'Cu+Sb+Sn': M('Pewter', 'Sn·Cu·Sb', 'PEWTER', 218, { hp: 1.15, kb: 1.2 }, 'none', 'Soft heavy alloy.', 'Sn+Cu+Sb → pewter'),
    'Ca+C+O+O+O': M('CaCO3', 'CaCO₃', 'Calcite', 195, { hp: 1.2 }, 'armor', 'Limestone armor.', 'Ca+C+3O → CaCO₃'),
    'H+N+O+O+O': M('HNO3', 'HNO₃', 'Nitric Acid', 30, { dmg: 1.25 }, 'corrosive', 'Aqua fortis: melts armor.', 'H+N+3O → HNO₃'),
    'O+O+Ti': M('TiO2', 'TiO₂', 'Titanium White', 15, { dmg: 1.1, crit: 6 }, 'none', 'Brilliant white pigment.', 'Ti + O₂ → TiO₂')
  };
  /* second-order real reactions (compound + compound/element) */
  const T2 = {
    'H2O+O': 'H+H+O+O',                       /* H2O + O → H2O2 */
    'CO2+H2O': 'H2CO3',
    'HCl+NH3': 'NH4Cl',
    'H2O+NaCl': 'Brine',
    'H2O+SO2': 'H2SO3',
    'H2O+SO3': 'H2SO4',
    'CaO+H2O': 'CaOH2',
    'CO2+CaO': 'CaCO3',
    'CO2+NaOH': 'NaHCO3',
    'CO2+Na2O': 'Na2CO3',
    'CuO+SO3': 'CuSO4',
    'MgO+SO3': 'MgSO4',
    'CaO+SO3': 'CaSO4',
    'Al+Al+Fe2O3': 'Thermite',
    'Cr+Steel': 'Stainless',
    'HNO3+NH3': 'NH4NO3',
    'C+KNO3+S': 'BlackPowder'
  };
  Object.assign(MOLDEF, {
    'CO2+H2O': M('H2CO3', 'H₂CO₃', 'Carbonic Acid', 205, { rate: 1.1 }, 'fizz', 'Bubbles trap foes.', 'CO₂+H₂O → H₂CO₃'),
    'HCl+NH3': M('NH4Cl', 'NH₄Cl', 'Sal Ammoniac', 220, { hp: 1.1 }, 'smoke', '25% phase through damage.', 'HCl+NH₃ → NH₄Cl'),
    'H2O+NaCl': M('Brine', 'H₂O·NaCl', 'BRINE', 200, { rate: 1.05 }, 'conduct', 'Chains lightning & chills.', 'NaCl in H₂O'),
    'H2O+SO2': M('H2SO3', 'H₂SO₃', 'Sulfurous Acid', 62, { dmg: 1.15 }, 'corrosive', 'Acid rain.', 'SO₂+H₂O → H₂SO₃'),
    'H2O+SO3': M('H2SO4', 'H₂SO₄', 'SULFURIC ACID', 55, { dmg: 1.35 }, 'corrosive', 'The king of acids.', 'SO₃+H₂O → H₂SO₄'),
    'CaO+H2O': M('CaOH2', 'Ca(OH)₂', 'Slaked Lime', 40, { hp: 1.2 }, 'vital', 'Healing alkaline.', 'CaO+H₂O → Ca(OH)₂'),
    'CO2+NaOH': M('NaHCO3', 'NaHCO₃', 'Baking Soda', 180, { hp: 1.15 }, 'fizz', 'Neutralizing fizz.', 'NaOH+CO₂ → NaHCO₃'),
    'CO2+Na2O': M('Na2CO3', 'Na₂CO₃', 'Washing Soda', 175, { rate: 1.1 }, 'none', 'Cleaning alkali.', 'Na₂O+CO₂ → Na₂CO₃'),
    'CuO+SO3': M('CuSO4', 'CuSO₄', 'Copper Sulfate', 215, { dmg: 1.2 }, 'toxic', 'Blue vitriol.', 'CuO+SO₃ → CuSO₄'),
    'MgO+SO3': M('MgSO4', 'MgSO₄', 'Epsom Salt', 190, { hp: 1.2 }, 'vital', 'Soothing soak.', 'MgO+SO₃ → MgSO₄'),
    'CaO+SO3': M('CaSO4', 'CaSO₄', 'Gypsum', 185, { hp: 1.15, armor: .5 }, 'armor', 'Plaster shield.', 'CaO+SO₃ → CaSO₄'),
    'Al+Al+Fe2O3': M('Thermite', 'Fe₂O₃·Al', 'THERMITE', 18, { dmg: 1.5 }, 'blast', 'Exothermic fury: huge blasts.', 'Fe₂O₃+2Al → thermite'),
    'Cr+Steel': M('Stainless', 'Fe·Cr·C', 'STAINLESS', 212, { hp: 1.3, armor: 1 }, 'armor', 'Corrosion-proof.', 'steel+Cr → stainless'),
    'HNO3+NH3': M('NH4NO3', 'NH₄NO₃', 'Ammonium Nitrate', 32, { dmg: 1.3 }, 'blast', 'Fertilizer… and explosive.', 'NH₃+HNO₃ → NH₄NO₃'),
    'C+KNO3+S': M('BlackPowder', 'KNO₃·C·S', 'BLACK POWDER', 30, { dmg: 1.4 }, 'blast', 'Gunpowder: boom.', 'KNO₃+C+S → powder')
  });
  /* ---- TWO UNIQUE SIGNATURE CHOICES PER ELEMENT / COMPOUND ----
     These are separate from the element's main `act` ability.  The names,
     ids, and descriptions are generated from the exact isotope/compound so
     every selectable signature is unique. */
  const SIG_CHOICE_STYLES = [
    ['Rift', 'Rift Drive', 'Blink in a violent line and leave a reactive afterimage behind you.'],
    ['Prism', 'Prism Volley', 'Split a focused burst into a fan of element-tinted lances.'],
    ['Surge', 'Reaction Surge', 'Overcharge your next attacks and release a secondary shockwave on impact.'],
    ['Grav', 'Gravity Snare', 'Create a short-lived gravity knot that drags nearby targets toward its center.'],
    ['Bloom', 'Catalyst Bloom', 'Plant a reactive field that pulses outward several times.'],
    ['Aegis', 'Aegis Shell', 'Raise a temporary barrier and convert part of absorbed damage into energy.'],
    ['Drift', 'Phase Drift', 'Slide through danger while briefly ignoring collision and incoming damage.'],
    ['Nova', 'Nova Trigger', 'Prime the area around you, then detonate it after a short delay.'],
    ['Lattice', 'Lattice Cage', 'Build a geometric cage around the nearest target that restricts movement.'],
    ['Pulse', 'Resonance Pulse', 'Send a circular resonance wave that interrupts nearby enemies.'],
    ['Shard', 'Shard Cascade', 'Launch a dense cluster of shards that fans outward before returning inward.'],
    ['Vortex', 'Reaction Vortex', 'Spin up a localized vortex that bends hostile projectiles toward its center.'],
    ['Flash', 'Flash Vector', 'Dash toward your aim direction and burst with a blinding elemental flash.'],
    ['Anchor', 'Mass Anchor', 'Anchor yourself in place, gaining knockback resistance and a powerful counterburst.'],
    ['Comet', 'Comet Drop', 'Call a compact impact strike onto the location under your aim.'],
    ['Echo', 'Reactive Echo', 'Repeat a reduced copy of your most recent attack from a delayed position.'],
    ['Torrent', 'Molecular Torrent', 'Send a rolling stream forward that pushes enemies and leaves a temporary hazard.'],
    ['Crown', 'Atomic Crown', 'Surround yourself with rotating charges that strike the nearest hostile.'],
    ['Spike', 'Elemental Spike', 'Raise a sudden piercing spike at the targeted location.'],
    ['Mirror', 'Reaction Mirror', 'Create a reflective pane that returns the next hostile projectile it catches.'],
    ['Bloomfire', 'Catalytic Wildfire', 'Ignite a spreading reaction around the target, rewarding clustered enemies.'],
    ['Coil', 'Charged Coil', 'Store a charge while active and release it as a focused electric-style discharge.'],
    ['Tether', 'Molecular Tether', 'Connect to the nearest target, slowing it and pulling you toward each other.'],
    ['Ruin', 'Ruin Mark', 'Mark the nearest target; your next hit consumes the mark for bonus damage.'],
    ['Halo', 'Reactive Halo', 'Emit a defensive ring that damages nearby enemies and restores a small shield.'],
    ['Drill', 'Phase Drill', 'Fire a narrow drill-like wave that ignores part of enemy defenses.'],
    ['Mist', 'Reactive Mist', 'Release a dense mist that obscures the arena and weakens enemies inside it.'],
    ['Crescent', 'Atomic Crescent', 'Sweep a wide crescent through the area in front of you.'],
    ['Beacon', 'Catalyst Beacon', 'Place a beacon that buffs nearby allies and periodically pulses at enemies.'],
    ['Crash', 'Reaction Crash', 'Teleport a short distance and detonate at both the origin and destination.'],
    ['Spiral', 'Molecular Spiral', 'Launch a spiraling projectile whose orbit expands before collapsing.'],
    ['Cleave', 'Elemental Cleave', 'Deliver a heavy close-range arc that knocks targets away.']
  ];
  function choiceHash(s) { return [...String(s)].reduce((v,c)=>(v*33+c.charCodeAt(0))>>>0,2166136261)>>>0; }
  function makeSignatureChoices(el) {
    const seed = choiceHash(el.id || el.f || el.name);
    const label = el.mol ? (el.f || el.name) : el.name;
    const sym = el.mol ? (el.token || el.f) : el.sym;
    const out = [];
    for (let slot=0; slot<2; slot++) {
      const a = SIG_CHOICE_STYLES[(seed + slot * 17) % SIG_CHOICE_STYLES.length];
      const id = 'sig_' + String(el.id || el.f || el.name).replace(/[^a-z0-9]+/gi,'_') + '_' + slot;
      out.push({
        id, key: a[0].toLowerCase(), slot, ic: a[0][0],
        name: sym + ' ' + a[1] + ' ' + (slot === 0 ? 'I' : 'II'),
        desc: label + ' focuses this signature on ' + a[2].replace(/\.$/,'') + '.',
        unique: true,
        power: 1 + ((seed + slot) % 5) * .08
      });
    }
    return out;
  }

  Object.values(MOLDEF).forEach(m => { m.signatures = makeSignatureChoices(m); });

  const RECIPES = {}; Object.keys(MOLDEF).forEach(k => { if (!T2[k]) RECIPES[k] = k });
  Object.keys(T2).forEach(k => RECIPES[k] = T2[k]);

  /* ---- Mastery tree node templates (12 per element, flavored) ---- */
  const MNODES = [
    { key: 'power', t: 'Core Power', d: 'damage', per: 12, max: 3, ic: '⚡' },
    { key: 'rate', t: 'Rapid Decay', d: 'fire rate', per: 9, max: 3, ic: '♻' },
    { key: 'emission', t: 'Particle Emission', d: '+1 projectile', per: 1, max: 2, ic: '⋔' },
    { key: 'pen', t: 'Deep Penetration', d: '+1 pierce', per: 1, max: 2, ic: '➤' },
    { key: 'crit', t: 'Critical Mass', d: 'crit chance', per: 6, max: 3, ic: '✧' },
    { key: 'over', t: 'Overload', d: 'crit damage', per: 35, max: 3, ic: '✹' },
    { key: 'guide', t: 'Guided Isotopes', d: 'homing', per: .05, max: 2, ic: '⌖' },
    { key: 'arc', t: 'Arc Discharge', d: 'chain lightning', per: 1, max: 2, ic: '≋' },
    { key: 'toxin', t: 'Contamination', d: 'poison on hit', per: 1, max: 2, ic: '☠' },
    { key: 'exotherm', t: 'Exothermic Reaction', d: 'burn on hit', per: 1, max: 2, ic: '♨' },
    { key: 'zero', t: 'Absolute Zero', d: 'slow on hit', per: 1, max: 2, ic: '❄' },
    { key: 'detonate', t: 'Volatile Detonation', d: 'AoE on hit', per: 1, max: 2, ic: '💥' }];
  const mxCost = (idx, rank) => Math.round((80 + idx * 20) * Math.pow(2.1, rank));

  /* ---- Enemies ---- */
  const ETYPES = {
    mote: { hp: 14, spd: 125, r: 11, dmg: 10, coin: 1, xp: 1, hue: 350, shape: 'dot', desc: 'Basic chaser.' },
    wisp: { hp: 10, spd: 195, r: 9, dmg: 8, coin: 1, xp: 1, hue: 30, shape: 'diamond', desc: 'Erratic fast flanker.' },
    brute: { hp: 62, spd: 58, r: 20, dmg: 18, coin: 3, xp: 3, hue: 0, shape: 'square', desc: 'Slow tank.' },
    spitter: { hp: 24, spd: 82, r: 12, dmg: 12, coin: 2, xp: 2, hue: 280, shape: 'tri', desc: 'Ranged spitter.' },
    splitter: { hp: 34, spd: 95, r: 15, dmg: 12, coin: 2, xp: 2, hue: 130, shape: 'dot', desc: 'Splits on death.' },
    bomber: { hp: 20, spd: 150, r: 13, dmg: 20, coin: 2, xp: 2, hue: 20, shape: 'bomb', desc: 'Detonates on death.' },
    healer: { hp: 30, spd: 70, r: 13, dmg: 8, coin: 3, xp: 3, hue: 140, shape: 'cross', desc: 'Heals nearby foes.' },
    tank: { hp: 120, spd: 40, r: 24, dmg: 22, coin: 5, xp: 5, hue: 260, shape: 'square', desc: 'Armored: 50% DR.' },
    swarm: { hp: 5, spd: 230, r: 6, dmg: 5, coin: 1, xp: 1, hue: 45, shape: 'dot', desc: 'Tiny fast swarm.' },
    orbiter: { hp: 26, spd: 110, r: 12, dmg: 12, coin: 2, xp: 2, hue: 300, shape: 'ring', desc: 'Circles you, fires inward.' },
    sniper: { hp: 22, spd: 60, r: 12, dmg: 24, coin: 3, xp: 3, hue: 200, shape: 'tri', desc: 'Charged high-damage bolt.' },
    shielder: { hp: 40, spd: 85, r: 14, dmg: 14, coin: 3, xp: 3, hue: 180, shape: 'shield', desc: 'Front shield: hit from behind.' },
    ghost: { hp: 18, spd: 140, r: 11, dmg: 10, coin: 2, xp: 2, hue: 255, shape: 'diamond', desc: 'Phases in and out — briefly immune.' },
    charger: { hp: 46, spd: 68, r: 16, dmg: 18, coin: 3, xp: 3, hue: 10, shape: 'tri', desc: 'Winds up, then charges at you.' },
    vampire: { hp: 34, spd: 100, r: 13, dmg: 12, coin: 2, xp: 3, hue: 340, shape: 'cross', desc: 'Heals itself when it hits you.' },
    mirror: { hp: 28, spd: 90, r: 13, dmg: 10, coin: 2, xp: 2, hue: 190, shape: 'ring', desc: 'Occasionally reflects your shots.' },
    juggler: { hp: 30, spd: 78, r: 14, dmg: 10, coin: 2, xp: 2, hue: 70, shape: 'tri', desc: 'Flings a 3-shot spread.' },
    crusher: { hp: 160, spd: 34, r: 27, dmg: 26, coin: 6, xp: 6, hue: 15, shape: 'square', desc: 'Massive: shoves you on contact.' },
    seeder: { hp: 26, spd: 74, r: 13, dmg: 8, coin: 2, xp: 2, hue: 100, shape: 'diamond', desc: 'Periodically spawns swarmlings.' },
    phantomblade: { hp: 16, spd: 235, r: 9, dmg: 20, coin: 2, xp: 2, hue: 0, shape: 'tri', desc: 'Glass-cannon speed striker.' },
    anchor: { hp: 72, spd: 46, r: 18, dmg: 12, coin: 3, xp: 3, hue: 230, shape: 'square', desc: 'Radiates a slowing field.' },
    stalker: { hp: 20, spd: 165, r: 10, dmg: 14, coin: 2, xp: 2, hue: 280, shape: 'dot', desc: 'Nearly invisible until close.' },
    spark: { hp: 8, spd: 285, r: 5, dmg: 6, coin: 1, xp: 1, hue: 52, shape: 'dot', desc: 'Tiny electric skirmisher.' },
    basalt: { hp: 220, spd: 26, r: 29, dmg: 30, coin: 7, xp: 7, hue: 18, shape: 'square', desc: 'Volcanic walking fortress.' },
    glider: { hp: 18, spd: 185, r: 10, dmg: 11, coin: 2, xp: 2, hue: 195, shape: 'diamond', desc: 'Drifts in wide sine arcs.' },
    pylon: { hp: 58, spd: 52, r: 17, dmg: 15, coin: 4, xp: 4, hue: 275, shape: 'cross', desc: 'Stationary-looking reactor pylon.' },
    shardling: { hp: 12, spd: 170, r: 8, dmg: 9, coin: 1, xp: 1, hue: 168, shape: 'diamond', desc: 'Crystal fragment hunter.' },
    boulder: { hp: 95, spd: 72, r: 21, dmg: 20, coin: 5, xp: 5, hue: 40, shape: 'dot', desc: 'Dense rolling mineral mass.' },
    flareling: { hp: 16, spd: 205, r: 9, dmg: 15, coin: 2, xp: 2, hue: 10, shape: 'bomb', desc: 'Incandescent suicide runner.' },
    drifter: { hp: 38, spd: 105, r: 14, dmg: 13, coin: 3, xp: 3, hue: 220, shape: 'ring', desc: 'Buoyant inert-gas floater.' },
    coil: { hp: 44, spd: 92, r: 15, dmg: 16, coin: 3, xp: 3, hue: 115, shape: 'ring', desc: 'Tight spiraling constrictor.' },
    prism: { hp: 36, spd: 125, r: 14, dmg: 14, coin: 3, xp: 3, hue: 305, shape: 'diamond', desc: 'Refractive diamond duelist.' },
    crawler: { hp: 52, spd: 88, r: 16, dmg: 17, coin: 3, xp: 3, hue: 88, shape: 'cross', desc: 'Low-profile chemical crawler.' },
    drone: { hp: 28, spd: 148, r: 12, dmg: 13, coin: 3, xp: 3, hue: 205, shape: 'tri', desc: 'Synthetic hunter drone.' },
    sentinel: { hp: 80, spd: 62, r: 19, dmg: 19, coin: 5, xp: 5, hue: 235, shape: 'shield', desc: 'Slow lattice sentry.' },
    ripple: { hp: 22, spd: 152, r: 11, dmg: 12, coin: 2, xp: 2, hue: 190, shape: 'ring', desc: 'Liquid-wave pursuer.' },
    cinder: { hp: 25, spd: 175, r: 11, dmg: 16, coin: 2, xp: 2, hue: 28, shape: 'dot', desc: 'Burning ash cloud.' },
    mole: { hp: 68, spd: 64, r: 18, dmg: 21, coin: 4, xp: 4, hue: 50, shape: 'tri', desc: 'Tunneling geometric miner.' },
    quanta: { hp: 14, spd: 250, r: 7, dmg: 10, coin: 2, xp: 2, hue: 330, shape: 'dot', desc: 'Unstable probability mote.' },
    reactor: { hp: 110, spd: 42, r: 24, dmg: 24, coin: 6, xp: 6, hue: 340, shape: 'hex', desc: 'Overheated core guardian.' },
    // The only five special enemy archetypes: each has a bespoke combat power.
    phaseweaver: { hp: 48, spd: 110, r: 15, dmg: 17, coin: 5, xp: 5, hue: 265, shape: 'diamond', special: 'blink', desc: 'SPECIAL: periodically warps behind a player.' },
    voltconductor: { hp: 54, spd: 76, r: 16, dmg: 16, coin: 5, xp: 5, hue: 55, shape: 'cross', special: 'arc', desc: 'SPECIAL: fires a branching lightning fan.' },
    biomass: { hp: 88, spd: 58, r: 21, dmg: 15, coin: 6, xp: 6, hue: 120, shape: 'dot', special: 'split', desc: 'SPECIAL: divides into swarm cells at low health.' },
    gravitywell: { hp: 130, spd: 35, r: 25, dmg: 20, coin: 7, xp: 7, hue: 280, shape: 'ring', special: 'pull', desc: 'SPECIAL: pulls nearby operators inward.' },
    mimicore: { hp: 66, spd: 96, r: 18, dmg: 19, coin: 6, xp: 6, hue: 180, shape: 'hex', special: 'mirror', desc: 'SPECIAL: copies and returns projectile patterns.' }
  };
  const BOSSDEFS = [
    { name: 'THE CHROMATIC WARDEN', hue: 336, shape: 'hex', pat: 'spiral', hpMul: 1 },
    { name: 'ISOTOPE PRIME', hue: 200, shape: 'hex', pat: 'burst', hpMul: .9 },
    { name: 'THE SLAG COLOSSUS', hue: 20, shape: 'square', pat: 'rings', hpMul: 1.3, spd: 30, charge: true },
    { name: 'HALOGEN TYRANT', hue: 120, shape: 'tri', pat: 'clouds', hpMul: 1 },
    { name: 'THE CRITICAL MASS', hue: 55, shape: 'hex', pat: 'spiral', hpMul: .85, fast: true },
    { name: 'ENTROPY ENGINE', hue: 260, shape: 'square', pat: 'cross', hpMul: 1.15 },
    { name: 'THE PHOSPHOR KING', hue: 60, shape: 'diamond', pat: 'summon', hpMul: 1 },
    { name: 'NEUTRON LICH', hue: 190, shape: 'diamond', pat: 'teleport', hpMul: .9 },
    { name: 'MAGMA SOVEREIGN', hue: 15, shape: 'square', pat: 'clouds', hpMul: 1.2, charge: true },
    { name: 'THE VACUUM SAINT', hue: 280, shape: 'ring', pat: 'pull', hpMul: 1.1 },
    { name: 'FERRIC WARBRINGER', hue: 25, shape: 'square', pat: 'summon', hpMul: 1.25, charge: true },
    { name: 'OMEGA DECAY', hue: 330, shape: 'hex', pat: 'omega', hpMul: 1.5 },
    { name: 'THE CRYSTAL REGENT', hue: 295, shape: 'diamond', pat: 'rings', hpMul: 1.05 },
    { name: 'KRYPTON MIRAGE', hue: 188, shape: 'ring', pat: 'teleport', hpMul: .95, fast: true },
    { name: 'THE ACID EMPEROR', hue: 95, shape: 'tri', pat: 'clouds', hpMul: 1.15 },
    { name: 'TUNGSTEN BEHEMOTH', hue: 38, shape: 'square', pat: 'cross', hpMul: 1.42, spd: 25, charge: true },
    { name: 'ELECTRON MAELSTROM', hue: 210, shape: 'ring', pat: 'pull', hpMul: 1.05 },
    { name: 'RADIANT ARCHON', hue: 58, shape: 'hex', pat: 'burst', hpMul: .88, fast: true },
    { name: 'THE BORON CITADEL', hue: 155, shape: 'square', pat: 'summon', hpMul: 1.35 },
    { name: 'MERCURY TEMPEST', hue: 230, shape: 'diamond', pat: 'spiral', hpMul: 1.02, fast: true },
    { name: 'SULFUR ORACLE', hue: 66, shape: 'tri', pat: 'clouds', hpMul: 1.08 },
    { name: 'DARK MATTER PROXY', hue: 278, shape: 'ring', pat: 'omega', hpMul: 1.28 },
    { name: 'THE CARBON MONOLITH', hue: 205, shape: 'square', pat: 'rings', hpMul: 1.38, charge: true },
    { name: 'ABSOLUTE ZERO', hue: 196, shape: 'diamond', pat: 'teleport', hpMul: 1.12 }];
  const BOSSES = BOSSDEFS.map(b => b.name);
  const RELICS = [
    { id: 'core', ic: '⬢', n: 'Isotope Core', d: '+20% damage this run' },
    { id: 'coolant', ic: '❄', n: 'Coolant Rod', d: 'Regen 2 HP/s this run' },
    { id: 'lens', ic: '◉', n: 'Focusing Lens', d: '+1 projectile this run' },
    { id: 'battery', ic: '▯', n: 'Reactor Battery', d: '-30% cooldowns this run' },
    { id: 'magnet', ic: '🧲', n: 'Ferro-Magnet', d: '+60% pickup range' }];

  /* ---- helpers ---- */
  const MOLALIASES = {};
  Object.keys(MOLDEF).forEach(k => {
    const m = MOLDEF[k];
    MOLALIASES[k] = k;
    if (m.token) MOLALIASES[m.token] = k;
    if (m.f) MOLALIASES[m.f] = k;
    if (m.name) MOLALIASES[m.name] = k;
  });
  function canonicalId(id) {
    if (id == null) return 'e1';
    id = String(id);
    if (ELEMS[id]) return id;
    if (MOLDEF[id]) return id;
    return MOLALIASES[id] || 'e1';
  }
  function EL(id) {
    const key = canonicalId(id);
    if (key.startsWith('e')) return ELEMS[key];
    return { ...MOLDEF[key], id: key };
  }
  function isOwned(id) {
    const key = canonicalId(id);
    return key.startsWith('e') ? SAVE.unlocked.includes(key) : SAVE.mols.includes(key);
  }
  function baseCombat(el) {
    if (el.mol) {
      const m = el.mods || {};
      return {
        dmg: 14 * (m.dmg || 1), rate: 1.7 * (m.rate || 1), ps: 380 * (m.ps || 1), kb: 120 * (m.kb || 1),
        hp: 115 * (m.hp || 1), spd: 255 * (m.spd || 1), crit: 8 + (m.crit || 0), pierce: m.pierce || 0,
        armor: (m.armor || 0) * .25, style: 'mol'
      };
    }
    const c = CATS[el.cat], k = 1 + el.n * .004;
    const s = {
      dmg: c.dmg * k, rate: c.rate * (1 + el.n * .0008), ps: c.ps, kb: c.kb, hp: 100 + Math.min(60, el.n * .5),
      spd: 250, crit: 6, pierce: 0, armor: 0, style: c.style
    };
    if (c.style === 'pure') s.crit += 8; if (c.style === 'inert') s.pierce += 2; if (c.style === 'phase') s.pierce += 1;
    return s
  }
  function elemStatsDisplay(el) {
    const c = baseCombat(el), cat = el.mol ? null : CATS[el.cat];
    return [['DMG', c.dmg / 46], ['RATE', c.rate / 3], ['VEL', c.ps / 560], ['TOUGH', c.hp / 180],
    ['CRIT', c.crit / 60], ['PIERCE', (c.pierce + 1) / 5],
    ['TOXIC', (cat ? cat.tox : 2) / 5], ['REACT', (cat ? cat.react : 3) / 5]]
  }


  Object.values(ELEMS).forEach(e => { e.signatures = makeSignatureChoices(e); });

  Object.assign(DATA, { CATS, SIG_CHOICE_STYLES, makeSignatureChoices, ELEMS, MOLDEF, RECIPES, MNODES, mxCost, ETYPES, BOSSES, RELICS, EL, canonicalId, isOwned, baseCombat, elemStatsDisplay });


/* ISO_ABILITY_3CHOICE_DATA */
(function(){
  function cleanCustom(){
    var out={};
    Object.keys(CUSTOM_ABILITIES).forEach(function(k){
      var nk=String(k).trim(), src=CUSTOM_ABILITIES[k]||{}, o={};
      Object.keys(src).forEach(function(f){ o[String(f).trim()]=String(src[f]).trim(); });
      out[nk]=o;
    });
    return out;
  }
  var CLEAN = (typeof CUSTOM_ABILITIES!=='undefined') ? cleanCustom() : {};
  function buildChoices(el){
    var sigs = el.signatures || (typeof makeSignatureChoices==='function' ? makeSignatureChoices(el) : []);
    var base = el.act || (typeof signatureFor==='function' ? signatureFor(el) : {name:'Reaction',desc:'Elemental reaction.',ic:'✦',cd:6,key:'pulse'});
    var c = CLEAN[String(el.n)];
    var main = { id:'main_'+(el.id||el.token||el.name), key:'main_'+(el.n||el.token||el.name), slot:0, ic:'⚛',
      name:(c&&c.name)||base.name||(el.sym+' Core'), desc:(c&&c.desc)||base.desc||'Core elemental reaction.', power:1.06, main:true };
    var s1 = Object.assign({}, sigs[0]||{}, {slot:1, main:false});
    var s2 = Object.assign({}, sigs[1]||{}, {slot:2, main:false});
    el.act = main; el.choices=[main,s1,s2]; el.signatures=el.choices;
  }
  if(typeof ELEMS!=='undefined') Object.values(ELEMS).forEach(buildChoices);
  if(typeof MOLDEF!=='undefined') Object.values(MOLDEF).forEach(function(m){ if(m.mol) buildChoices(m); });
})();
})();
