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

  /* ---- REAL molecules & reactions (all are genuine chemistry) ---- */
  function M(token, f, name, hue, mods, trait, desc, rx) { return { token, f, name, hue, mods, trait, desc, rx, mol: true } }
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
    shielder: { hp: 40, spd: 85, r: 14, dmg: 14, coin: 3, xp: 3, hue: 180, shape: 'shield', desc: 'Front shield: hit from behind.' }
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
    { name: 'OMEGA DECAY', hue: 330, shape: 'hex', pat: 'omega', hpMul: 1.5 }];
  const BOSSES = BOSSDEFS.map(b => b.name);
  const RELICS = [
    { id: 'core', ic: '⬢', n: 'Isotope Core', d: '+20% damage this run' },
    { id: 'coolant', ic: '❄', n: 'Coolant Rod', d: 'Regen 2 HP/s this run' },
    { id: 'lens', ic: '◉', n: 'Focusing Lens', d: '+1 projectile this run' },
    { id: 'battery', ic: '▯', n: 'Reactor Battery', d: '-30% cooldowns this run' },
    { id: 'magnet', ic: '🧲', n: 'Ferro-Magnet', d: '+60% pickup range' }];

  /* ---- helpers ---- */
  function EL(id) { return id.startsWith('e') ? ELEMS[id] : { ...MOLDEF[id], id } }
  function isOwned(id) { return id.startsWith('e') ? SAVE.unlocked.includes(id) : SAVE.mols.includes(id) }
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

  Object.assign(DATA, { CATS, ELEMS, MOLDEF, RECIPES, MNODES, mxCost, ETYPES, BOSSES, RELICS, EL, isOwned, baseCombat, elemStatsDisplay });
})();