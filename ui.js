'use strict'; window.UI = {};
(function () {
  const { CATS, ELEMS, MOLDEF, RECIPES, MNODES, mxCost, RELICS, EL, elemStatsDisplay } = DATA;
  const SFX = AUDIO.SFX;
  function $(s) { return document.querySelector(s) }
  function $$(s) { return [...document.querySelectorAll(s)] }
  function toast(msg, cls = '') {
    const t = document.createElement('div'); t.className = 'toast ' + cls; t.textContent = msg;
    $('#toasts').appendChild(t); setTimeout(() => {
      t.style.opacity = '0'; t.style.transition = 'opacity .4s';
      setTimeout(() => t.remove(), 400)
    }, 2600)
  }
  function show(id) {
    $$('.screen').forEach(s => s.classList.add('hidden')); $('#' + id).classList.remove('hidden');
    if (id === 'scr-menu') { refreshShowcase(); AUDIO.setTrack('menu') }
    if (id === 'scr-vault') renderVault();
    if (id === 'scr-lab') renderLab();
    if (id === 'scr-aug') renderAug();
    if (id === 'scr-arch') renderArch();
    if (id === 'scr-mastery') renderMastery();
    SAVE.refreshCoins()
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) { SFX.click(); show(b.dataset.go) } });

  /* ---- menu showcase ---- */
  function refreshShowcase() {
    const el = EL(SAVE.sel), col = `hsl(${el.hue} 75% 60%)`;
    $('#bt-n').textContent = el.mol ? '⚗' : el.n; $('#bt-s').textContent = el.mol ? el.f.split('·')[0].slice(0, 4) : el.sym;
    $('#bt-nm').textContent = el.name.toUpperCase();
    const bt = $('#big-tile'); bt.style.borderColor = col; bt.style.color = col;
    $('#sel-cat').textContent = el.mol ? 'SYNTHESIZED COMPOUND' : CATS[el.cat].n.toUpperCase();
    $('#sel-blurb').textContent = el.mol ? el.desc : CATS[el.cat].blurb
  }

  /* ---- vault ---- */
  let vdTarget = null;
  function buildVault() {
    const pt = $('#ptable'); pt.innerHTML = '';
    const ph = (g, row, txt) => {
      const d = document.createElement('div'); d.className = 'pt ph';
      d.style.gridColumn = g; d.style.gridRow = row; d.textContent = txt; pt.appendChild(d)
    };
    ph(3, 6, '57–71'); ph(3, 7, '89–103');
    Object.values(ELEMS).forEach(e => {
      const d = document.createElement('div'); d.className = 'pt'; d.dataset.id = e.id;
      d.style.gridColumn = e.g; d.style.gridRow = e.row;
      const col = `hsl(${e.hue} 72% 62%)`; d.style.borderColor = col + '88'; d.style.color = col;
      d.innerHTML = `<span class="z">${e.n}</span><span class="sy">${e.sym}</span>`;
      d.onclick = () => { SFX.click(); selectVault(e.id) }; pt.appendChild(d)
    })
  }
  function renderVault() {
    SAVE.refreshCoins();
    $$('#ptable .pt').forEach(t => {
      if (!t.dataset.id) return; const id = t.dataset.id;
      t.classList.toggle('locked', !DATA.isOwned(id)); t.classList.toggle('sel', SAVE.sel === id)
    });
    const ms = $('#molstrip'); ms.innerHTML = '<span class="lbl">SYNTHESIZED ▸</span>';
    Object.keys(MOLDEF).forEach(k => {
      if (!MOLDEF[k].mol) return;
      const own = SAVE.raw.mols.includes(k), m = MOLDEF[k];
      const d = document.createElement('div'); d.className = 'mtile' + (own ? '' : ' locked') + (SAVE.sel === k ? ' sel' : '');
      const col = `hsl(${m.hue} 72% 62%)`; d.style.borderColor = own ? col : '#333'; d.style.color = own ? col : '#555';
      d.textContent = own ? m.f : '???'; if (own) d.onclick = () => { SFX.click(); selectVault(k) }; ms.appendChild(d)
    });
    if (!vdTarget) selectVault(SAVE.sel)
  }
  function selectVault(id) {
    vdTarget = id; const el = EL(id), own = DATA.isOwned(id);
    const col = `hsl(${el.hue} 72% 62%)`; const t = $('#vd-tile'); t.style.borderColor = col; t.style.color = col;
    t.innerHTML = `<span class="s">${el.mol ? el.f.slice(0, 4) : el.sym}</span>`;
    $('#vd-name').textContent = el.name.toUpperCase();
    $('#vd-cat').textContent = el.mol ? 'COMPOUND · ' + el.f : CATS[el.cat].n.toUpperCase();
    $('#vd-desc').textContent = el.mol ? el.desc : CATS[el.cat].blurb;
    $('#vd-stats').innerHTML = elemStatsDisplay(el).map(([k, v]) =>
      `<div class="statrow"><b>${k}</b><div class="bar"><i style="transform:scaleX(${Math.min(1, Math.max(.06, v))})"></i></div></div>`).join('');
    const act = el.mol ? null : CATS[el.cat].act;
    $('#vd-active').innerHTML = act ? `<b style="color:${col}">SIGNATURE [Q] — ${act.ic} ${el.name} ${act.name}</b><br>${act.desc}`
      : '<b style="color:' + col + '">COMPOUND</b> — inherits reaction traits.';
    const b = $('#vd-btn');
    if (SAVE.sel === id) { b.textContent = '✓ DEPLOYED'; b.disabled = true }
    else if (own) { b.textContent = 'SELECT'; b.disabled = false; b.onclick = () => { SAVE.sel = id; SAVE.save(); SFX.unlock(); renderVault(); toast(el.name + ' deployed', 'good') } }
    else {
      b.textContent = 'UNLOCK · ◈ ' + el.cost; b.disabled = false; b.onclick = () => {
        if (SAVE.spend(el.cost)) { SAVE.raw.unlocked.push(id); SAVE.save(); SFX.unlock(); toast(el.name + ' unlocked!', 'gold'); renderVault() }
        else { SFX.error(); toast('Not enough coins', 'bad') }
      }
    }
  }

  /* ---- mastery ---- */
  let mSel = null;
  function renderMastery() {
    mSel = mSel || SAVE.sel;
    $('#mxp-badge').textContent = '◆ ' + SAVE.mxp(mSel).xp;
    const box = $('#m-elems'); box.innerHTML = '';
    Object.values(ELEMS).filter(e => DATA.isOwned(e.id)).forEach(e => {
      const d = document.createElement('div'); d.className = 'mchip' + (mSel === e.id ? ' sel' : '');
      const col = `hsl(${e.hue} 72% 62%)`; d.style.borderColor = col; d.style.color = col;
      d.innerHTML = `<span style="font-weight:bold">${e.sym}</span><span style="font-size:9px">${SAVE.mxp(e.id).xp}</span>`;
      d.onclick = () => { SFX.click(); mSel = e.id; renderMastery() }; box.appendChild(d)
    });
    const el = EL(mSel), col = `hsl(${el.hue} 72% 62%)`, mx = SAVE.mxp(mSel);
    $('#m-head').innerHTML = `<div style="font-family:var(--disp);font-size:24px;color:${col}">${el.name.toUpperCase()}</div>
  <div class="sub">Mastery XP available: <b style="color:var(--gr)">◆ ${mx.xp}</b> · earn more by fighting as ${el.name}.</div>`;
    $('#m-tree').innerHTML = MNODES.map((t, i) => {
      const r = SAVE.nodeRank(mSel, t.key), max = r >= t.max, c = mxCost(i, r);
      return `<div class="node${max ? ' max' : ''}">
   <b>${t.ic} ${el.name} ${t.t}</b><small>+${t.per}/rank ${t.d}</small>
   <div class="row"><div class="pips">${Array.from({ length: t.max }, (_, p) => `<i class="${p < r ? 'on' : ''}"></i>`).join('')}</div>
   <button class="btn chamf" style="padding:6px 12px;font-size:11px" data-mn="${i}" ${max || mx.xp < c ? 'disabled' : ''}>${max ? 'MAX' : '◆ ' + c}</button></div></div>`
    }).join('');
    $$('#m-tree [data-mn]').forEach(b => b.onclick = () => {
      if (SAVE.buyNode(mSel, +b.dataset.mn)) { SFX.unlock(); toast('Node unlocked', 'good'); renderMastery() }
      else { SFX.error() }
    })
  }

  /* ---- lab ---- */
  let slots = [null, null, null, null, null];
  function renderLab() {
    SAVE.refreshCoins();
    const inv = $('#lab-inv'); inv.innerHTML = '';
    const add = (tok, label, hue, z) => {
      const d = document.createElement('div'); d.className = 'reag';
      const col = `hsl(${hue} 72% 62%)`; d.style.borderColor = col + '88'; d.style.color = col;
      d.innerHTML = `<span class="z">${z || ''}</span><span class="s">${label}</span>`;
      d.onclick = () => {
        const i = slots.indexOf(null); if (i < 0) { SFX.error(); return }
        slots[i] = { token: tok, label, hue }; SFX.click(); drawSlots()
      }; inv.appendChild(d)
    };
    SAVE.raw.unlocked.map(id => ELEMS[id]).sort((a, b) => a.n - b.n).forEach(e => add(e.sym, e.sym, e.hue, e.n));
    SAVE.raw.mols.forEach(k => { const m = MOLDEF[k]; if (m) add(m.token, m.f, m.hue, '⚗') });
    $('#slots').innerHTML = slots.map((_, i) => `<div class="slot" data-i="${i}"></div>`).join('');
    drawSlots(); renderBook();
    $('#lab-count').textContent = `${SAVE.raw.mols.length} / ${Object.keys(MOLDEF).length} DISCOVERED`
  }
  function drawSlots() {
    $$('.slot').forEach((s, i) => {
      const it = slots[i]; s.classList.toggle('filled', !!it);
      if (it) {
        const col = `hsl(${it.hue} 72% 62%)`; s.style.borderColor = col; s.style.color = col;
        s.innerHTML = `<span class="s">${it.label}</span>`
      } else { s.style.borderColor = ''; s.style.color = ''; s.innerHTML = '' }
      s.onclick = () => { if (slots[i]) { slots[i] = null; SFX.click(); drawSlots() } }
    })
  }
  function renderBook() {
    const bk = $('#lab-book'); bk.innerHTML = '';
    Object.keys(MOLDEF).sort((a, b) => a.split('+').length - b.split('+').length).forEach(k => {
      const known = SAVE.raw.mols.includes(k), m = MOLDEF[k];
      const d = document.createElement('div'); d.className = 'rec' + (known ? ' known' : '');
      d.innerHTML = known ? `<span class="f">${k.replace(/\+/g, ' + ')}<span class="rx">${m.rx}</span></span>
   <span class="nm">${m.f} ${m.name}</span>`
        : `<span class="f">${Array(k.split('+').length).fill('◻').join(' + ')}</span><span class="nm">???</span>`;
      bk.appendChild(d)
    })
  }
  $('#btn-synth').onclick = () => {
    const used = slots.filter(Boolean);
    if (used.length < 2) { SFX.error(); labMsg('<span style="color:var(--mg)">MINIMUM TWO REAGENTS</span>'); return }
    const key = used.map(s => s.token).sort().join('+');
    const molId = RECIPES[key];
    if (molId) {
      const m = MOLDEF[molId];
      if (!SAVE.raw.mols.includes(molId)) {
        SAVE.raw.mols.push(molId); SAVE.save(); SFX.synth();
        labMsg(`<span style="color:var(--gr)">STABLE BOND FORMED!<br><b style="font-size:18px">${m.f} — ${m.name.toUpperCase()}</b><br>
    <span class="dim">${m.rx}</span><br>${m.desc}</span>`);
        toast('SYNTHESIZED: ' + m.name, 'good'); renderLab()
      }
      else { SFX.click(); labMsg(`<span class="dim">${m.f} already catalogued — formula stored in codex.</span>`) }
    }
    else {
      const r = $('#reactor'); r.classList.remove('shake'); void r.offsetWidth; r.classList.add('shake'); SFX.error();
      const inert = used.some(s => { const e = Object.values(ELEMS).find(x => x.sym === s.token); return e && e.cat === 7 });
      labMsg(inert ? '<span style="color:var(--mg)">ø INERT — noble gases refuse to bond.</span>'
        : '<span style="color:var(--mg)">✕ UNSTABLE — not a real reaction.</span>')
    }
  };
  function labMsg(h) { $('#lab-result').innerHTML = h }

  /* ---- augmentations ---- */
  const META = [
    { id: 'dmg', n: 'Ion Lance', d: '+5% damage /lv', max: 10, base: 60 },
    { id: 'hp', n: 'Plated Hull', d: '+12 max HP /lv', max: 8, base: 50 },
    { id: 'spd', n: 'Thruster Tuning', d: '+3% speed /lv', max: 6, base: 50 },
    { id: 'mag', n: 'Magnet Core', d: '+18% pickup range /lv', max: 6, base: 40 },
    { id: 'luck', n: 'Alchemy Core', d: '+8% coins /lv', max: 8, base: 70 },
    { id: 'crit', n: 'Weakpoint Scanner', d: '+2.5% crit /lv', max: 8, base: 65 },
    { id: 'shield', n: 'Reactive Shield', d: '+15 shield /lv', max: 5, base: 90 },
    { id: 'head', n: 'Head Start', d: 'Start with 1 random ability /lv', max: 3, base: 150 },
    { id: 'revive', n: 'Emergency Cell', d: 'Revive once per run', max: 3, base: 250 }];
  function renderAug() {
    SAVE.refreshCoins(); const g = $('#aug-grid'); g.innerHTML = '';
    META.forEach((m, i) => {
      const lv = SAVE.metaLv(m.id), locked = i > 0 && !SAVE.metaLv(META[i - 1].id);
      const maxed = lv >= m.max, cost = SAVE.metaCost(m, lv);
      const d = document.createElement('div'); d.className = 'augcard panel' + (locked ? ' locked' : '');
      d.innerHTML = `<h4>${m.n} ${locked ? '🔒' : ''}</h4><p>${m.d}</p>
   <div class="pips2">${Array.from({ length: m.max }, (_, p) => `<i class="${p < lv ? 'on' : ''}"></i>`).join('')}</div>
   <div class="augfoot"><span class="cost">${maxed ? 'MAXED' : locked ? 'LOCKED' : '◈ ' + cost}</span>
   ${maxed || locked ? '' : `<button class="btn chamf" data-buy="${m.id}">BUY</button>`}</div>`;
      g.appendChild(d)
    });
    $$('#aug-grid [data-buy]').forEach(b => b.onclick = () => {
      const m = META.find(x => x.id === b.dataset.buy);
      const lv = SAVE.metaLv(m.id), cost = SAVE.metaCost(m, lv);
      if (SAVE.spend(cost)) { SAVE.raw.meta[m.id] = lv + 1; SAVE.save(); SFX.unlock(); renderAug(); toast(m.n + ' → LV ' + (lv + 1), 'good') }
      else { SFX.error(); toast('Not enough coins', 'bad') }
    })
  }

  /* ---- archive ---- */
  function renderArch() {
    const s = SAVE.stats;
    const tiles = [['RUNS', s.runs], ['BEST WAVE', s.bestWave], ['TOTAL KILLS', s.kills], ['COINS EARNED', s.earned],
    ['MASTERY XP', s.mxp], ['ELEMENTS', SAVE.raw.unlocked.length + '/118'],
    ['COMPOUNDS', SAVE.raw.mols.length + '/' + Object.keys(MOLDEF).length]];
    $('#arch-stats').innerHTML = tiles.map(([k, v]) => `<div class="stat-tile panel"><div class="v">${v}</div><div class="k">${k}</div></div>`).join('');
    $('#arch-abil').innerHTML = MNODES.map(t => `<div class="acard panel"><div class="ic">${t.ic}</div>
  <div><b>${t.t}</b><small>+${t.per}/rank ${t.d}</small></div></div>`).join('');
    $('#arch-enemy').innerHTML = Object.entries(DATA.ETYPES).map(([k, t]) =>
      `<div class="acard panel"><div class="ic" style="color:hsl(${t.hue} 75% 60%)">●</div>
   <div><b>${k.toUpperCase()}</b><small>${t.desc}</small></div></div>`).join('')
  }

  /* ---- settings ---- */
  function bindSettings() {
    $('#set-sfx').value = SAVE.set.sfx; $('#set-mus').value = SAVE.set.mus;
    $('#set-sfx').oninput = e => { SAVE.set.sfx = +e.target.value; AUDIO.applyVol(); SAVE.save() };
    $('#set-mus').oninput = e => { SAVE.set.mus = +e.target.value; AUDIO.applyVol(); SAVE.save() };
    const tgl = (id, key, cb) => {
      const t = $(id); t.classList.toggle('on', !!SAVE.set[key]);
      t.onclick = () => { SAVE.set[key] = SAVE.set[key] ? 0 : 1; t.classList.toggle('on', !!SAVE.set[key]); SAVE.save(); cb && cb(); SFX.click() }
    };
    tgl('#tgl-mus', 'music', AUDIO.applyVol); tgl('#tgl-shake', 'shake'); tgl('#tgl-dmg', 'dmg');
    $('#btn-wipe').onclick = () => { if (confirm('Erase ALL progress?')) { localStorage.clear(); location.reload() } }
  }


  /* ---- deploy / co-op ---- */
  let mode = 'solo';
  $('#btn-deploy').onclick = () => {
    SFX.click();
    show('scr-game');                                    // <-- reveal game screen so the overlay is visible
    $('#dep-elem').textContent = 'Selected: ' + EL(SAVE.sel).name;
    $('#coop-hints').classList.toggle('hidden', true);
    $('#m-deploy').classList.remove('hidden');
    $$('.modecard').forEach(c => c.classList.toggle('sel', c.dataset.mode === mode))
  };
  $$('.modecard').forEach(c => c.onclick = () => {
    SFX.click(); mode = c.dataset.mode;
    $$('.modecard').forEach(x => x.classList.toggle('sel', x === c));
    $('#coop-hints').classList.toggle('hidden', mode !== 'coop')
  });
  $('#dep-cancel').onclick = () => { SFX.click(); $('#m-deploy').classList.add('hidden'); show('scr-menu') };
  $('#dep-go').onclick = () => {
    SFX.click(); $('#m-deploy').classList.add('hidden');
    if (!SAVE.set.brief) {
      SAVE.set.brief = 1; SAVE.save();
      $('#brief-rows').innerHTML = `
   <div class="kv"><span>P1 MOVE</span><b>WASD</b></div>
   <div class="kv"><span>P1 FIRE / AIM</span><b>MOUSE</b></div>
   <div class="kv"><span>SIGNATURE</span><b>Q</b></div>
   <div class="kv"><span>DASH</span><b>SPACE</b></div>
   <div class="kv"><span>P2 (CO-OP)</span><b>ARROWS · ENTER dash · R-SHIFT sig</b></div>
   <div class="kv"><span>PAUSE</span><b>ESC</b></div>`;
      $('#m-brief').classList.remove('hidden')
    }
    else { $('#scr-game').classList.remove('hidden'); GAME.start(SAVE.sel, mode) }
  };
  $('#btn-briefok').onclick = () => { SFX.click(); $('#m-brief').classList.add('hidden'); GAME.start(SAVE.sel, mode) };
  $('#btn-resume').onclick = () => { SFX.click(); GAME.resume() };
  $('#btn-prestart').onclick = () => { SFX.click(); GAME.start(SAVE.sel, mode) };
  $('#btn-abandon').onclick = () => { SFX.click(); $('#m-pause').classList.add('hidden'); show('scr-menu') };
  $('#btn-retry').onclick = () => { SFX.click(); GAME.start(SAVE.sel, mode) };
  $('#btn-tomenu').onclick = () => { SFX.click(); $('#m-over').classList.add('hidden'); show('scr-menu') };
  /* boot */
  buildVault(); bindSettings(); refreshShowcase(); SAVE.refreshCoins(); show('scr-menu');
  addEventListener('beforeunload', SAVE.save);
  Object.assign(UI, { show, toast });
})();