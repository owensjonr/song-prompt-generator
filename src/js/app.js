/* Song Prompt Studio renderer. Plain DOM, no framework. */
(function () {
  const GENRES = window.GENRES, GI = window.GENRE_INDEX, V = window.VOCAB, E = window.Engine, groove = window.groove;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uniq = (a) => [...new Set(a.filter(Boolean))];
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  };
  const api = window.studio || {
    copy: (t) => navigator.clipboard.writeText(t),
    openExternal: (u) => window.open(u, '_blank', 'noopener'),
    saveText: async (n, t) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t])); a.download = n + '.txt'; a.click(); return { saved: true }; }
  };

  // ---------- state ----------
  const DEFAULT = {
    genre: 'pop', micro: null, blend: null, moods: [], energy: 2, bpm: 110, key: 'Auto',
    vocal: 'female', tones: [], palette: [], customPalette: [], production: ['polished modern mix'], era: '',
    title: '', theme: '', language: 'English', lyrics: '', structure: 'auto', exclude: [], extra: '',
    target: 'advanced', suno: { stage: 'draft' }, yue: { batch: 3, lead: 'genre', keepParens: false },
    sounds: { type: 'loop-drum', desc: '', kind: '', bpm: null, key: '' }
  };
  let state = Object.assign(structuredClone(DEFAULT), store.get('sps.state', {}));
  let view = 'build';
  let exploreGenre = state.genre;
  let playingGrid = null;
  let saveTimer = null;

  function setState(patch, opts = {}) {
    Object.assign(state, patch);
    clearTimeout(saveTimer); saveTimer = setTimeout(() => store.set('sps.state', state), 250);
    if (!opts.silent) { if (view === 'build' && !opts.outputOnly) renderBuild(); renderOutput(); }
  }

  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 1600);
  }
  async function copy(text, msg = 'Copied') { await api.copy(text); toast(msg); }

  const youtube = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' music')}`;
  const spotify = (q) => `https://open.spotify.com/search/${encodeURIComponent(q)}`;

  // ---------- genre application ----------
  function vocalFromString(str) {
    const s = (str || '').toLowerCase();
    let vocal = state.vocal;
    if (/instrumental/.test(s)) vocal = 'none';
    else if (/duet|male and female/.test(s)) vocal = 'duet';
    else if (/choir|group|quartet|chant|children/.test(s)) vocal = 'choir';
    else if (/rap/.test(s)) vocal = /female/.test(s) ? 'rap-f' : 'rap-m';
    else if (/female|diva/.test(s)) vocal = 'female';
    else if (/male/.test(s)) vocal = 'male';
    const tones = V.vocalTones.filter((t) => new RegExp(`\\b${t}\\b`).test(s));
    return { vocal, tones };
  }

  function applyGenre(gid, mid, extra = {}) {
    const g = GI[gid]; if (!g) return;
    const m = mid ? g.micro.find((x) => x.id === mid) : null;
    const range = m ? m.bpm : g.bpm;
    const patch = {
      genre: gid, micro: m ? m.id : null,
      bpm: Math.round((range[0] + range[1]) / 2 / 2) * 2,
      palette: m ? m.tags.slice(0, 4) : g.instruments.slice(0, 3),
      exclude: m ? [...m.exclude] : [],
      energy: energyFor(g, range)
    };
    if (m) Object.assign(patch, vocalFromString(m.vocal));
    if (state.blend && state.blend.genre === gid) patch.blend = null;
    groove.stop();
    setState(Object.assign(patch, extra));
  }

  // Blend the family's usual energy with how fast this style actually is.
  function energyFor(g, range) {
    const mid = (range[0] + range[1]) / 2;
    const byTempo = mid < 75 ? 0 : mid < 95 ? 1 : mid < 115 ? 2 : mid < 135 ? 3 : 4;
    return Math.max(0, Math.min(4, Math.round((byTempo + (g.energy - 1)) / 2)));
  }

  function currentRange() {
    const g = GI[state.genre]; const m = state.micro ? g.micro.find((x) => x.id === state.micro) : null;
    return m ? m.bpm : g.bpm;
  }

  // ---------- sequencer ----------
  function seqHTML(patternId, gridId, bpm) {
    const P = window.GroovePlayer.patterns()[patternId] || window.GroovePlayer.patterns().four;
    const labels = window.GroovePlayer.labels();
    const steps = P.steps || 16;
    const beat = steps === 12 ? 3 : 4;
    const rows = Object.keys(labels).filter((k) => typeof P[k] === 'string').map((k) => {
      const cells = [...P[k]].map((c, i) => `<i class="cell${c !== '.' ? ' on' : ''}${i % beat === 0 ? ' beat' : ''}" data-step="${i}"></i>`).join('');
      return `<div class="seq-row" style="--steps:${steps}"><span class="seq-label">${labels[k]}</span>${cells}</div>`;
    });
    if (!rows.length) rows.push(`<div class="seq-row" style="--steps:${steps}"><span class="seq-label">Pads</span>${Array.from({ length: steps }, (_, i) => `<i class="cell${i === 0 ? ' on' : ''}" data-step="${i}"></i>`).join('')}</div>`);
    const feel = P.swing ? 'swung' : steps === 12 ? 'triplet feel' : 'straight';
    return `<div class="seq" data-grid="${gridId}" aria-label="Rhythm pattern">${rows.join('')}
      <div class="seq-foot"><span>One bar, ${steps === 12 ? '12 triplet steps' : '16 steps'}, ${feel}</span><span>${bpm} BPM</span></div></div>`;
  }

  groove.onStep((step) => {
    $$('.cell.now').forEach((c) => c.classList.remove('now'));
    if (step < 0 || !playingGrid) return;
    $$(`.seq[data-grid="${playingGrid}"] .cell[data-step="${step}"]`).forEach((c) => c.classList.add('now'));
  });

  function togglePlay(btn, patternId, bpm, gridId) {
    const was = btn.classList.contains('is-playing');
    groove.stop();
    $$('.btn-play').forEach((b) => { b.classList.remove('is-playing'); b.textContent = b.dataset.label || 'Play groove'; });
    playingGrid = null;
    if (was) return;
    playingGrid = gridId;
    groove.play(patternId, bpm);
    btn.classList.add('is-playing'); btn.textContent = 'Stop';
  }

  // ---------- BUILD VIEW ----------
  function chip(label, on, attrs = '', suggested = false) {
    return `<button class="chip${on ? ' is-on' : ''}${suggested ? ' is-suggested' : ''}" ${attrs} aria-pressed="${on}">${esc(label)}</button>`;
  }

  function renderBuild() {
    const g = GI[state.genre];
    const m = state.micro ? g.micro.find((x) => x.id === state.micro) : null;
    const range = currentRange();
    const lo = 40, hi = 220;
    const bandL = ((range[0] - lo) / (hi - lo)) * 100, bandW = ((range[1] - range[0]) / (hi - lo)) * 100;
    const paletteOpts = uniq([...(m ? m.tags : []), ...g.instruments, ...state.customPalette, ...state.palette]);
    const moodOpts = uniq([...g.moods, ...state.moods, ...V.moods]);
    const instrumental = state.vocal === 'none';
    const scroll = $('#main').scrollTop;
    const focusId = document.activeElement && document.activeElement.id;
    const selStart = document.activeElement && document.activeElement.selectionStart;

    $('#view-build').innerHTML = `
      <header class="view-head">
        <h1>Build a song prompt</h1>
        <p>Pick a sound step by step. Your prompt updates on the right for Suno (Simple, Advanced or Sounds) or YuE2.</p>
      </header>

      <section class="step">
        <span class="step-num">1</span>
        <div>
          <h2>Start with a feeling <span class="opt">(optional)</span></h2>
          <p class="sub">Not sure what genre you want? Pick a moment and we'll set up a good starting point.</p>
          <div class="vibes">${window.VIBES.map((v, i) => {
            const gg = GI[v.genre]; const mm = gg.micro.find((x) => x.id === v.micro);
            return `<button class="vibe" data-vibe="${i}"><b>${esc(v.name)}</b>${esc(mm.name)}</button>`;
          }).join('')}</div>
        </div>
      </section>

      <section class="step is-done">
        <span class="step-num">2</span>
        <div>
          <h2>Choose a genre</h2>
          <p class="sub">The broad family of music. Tap one to read what it is and hear its rhythm.</p>
          <div class="genre-grid">${GENRES.map((x) => `<button class="genre-btn${x.id === state.genre ? ' is-on' : ''}" data-genre="${x.id}">${esc(x.name)}</button>`).join('')}</div>
          <div class="gcard">
            <h3>${esc(g.name)}</h3>
            <p>${esc(g.blurb)}</p>
            <ul class="listen">${g.listen.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
            <div class="row">
              <button class="btn btn-play" data-play="${m ? m.groove : g.groove}" data-bpm="${state.bpm}" data-grid="build" data-label="Play groove sketch">Play groove sketch</button>
              <button class="btn btn-ghost" data-open="${esc(youtube(m ? m.name : g.name))}">Hear real songs on YouTube</button>
              <button class="btn btn-ghost" data-open="${esc(spotify(m ? m.name : g.name))}">Search Spotify</button>
            </div>
            ${seqHTML(m ? m.groove : g.groove, 'build', state.bpm)}
            <p class="tip" style="margin:10px 0 0">The groove sketch is a simplified drum-machine demo of the rhythm at your chosen tempo. Lit steps are hits. For the real sound of a genre, use the listening links.</p>
          </div>
        </div>
      </section>

      <section class="step${m ? ' is-done' : ''}">
        <span class="step-num">3</span>
        <div>
          <h2>Narrow it to a micro-genre <span class="opt">(recommended)</span></h2>
          <p class="sub">A specific sub-style gives a more distinctive result and a clearer audience. Each one fills in its signature sounds for you.</p>
          <p class="tip">Micro-genres are how listeners search and how playlists are organized. "Drift Phonk" or "Liquid Drum and Bass" reaches a specific crowd; "Electronic" competes with everything.</p>
          <div class="micro-list">
            <button class="micro${!m ? ' is-on' : ''}" data-micro=""><b>Just ${esc(g.name)}</b><span class="bpm">${g.bpm[0]}–${g.bpm[1]} BPM</span><span class="d">Keep it broad.</span></button>
            ${g.micro.map((x) => `<button class="micro${m && m.id === x.id ? ' is-on' : ''}" data-micro="${x.id}"><b>${esc(x.name)}</b><span class="bpm">${x.bpm[0]}–${x.bpm[1]} BPM</span><span class="d">${esc(x.desc)}</span></button>`).join('')}
          </div>
          <div class="grid2" style="margin-top:14px">
            <label class="field"><span>Blend with another genre (optional)</span>
              <select class="select" id="blendGenre"><option value="">No blend</option>${GENRES.filter((x) => x.id !== state.genre).map((x) => `<option value="${x.id}"${state.blend && state.blend.genre === x.id ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
            </label>
            ${state.blend && state.blend.genre ? `<label class="field"><span>Blend style</span>
              <select class="select" id="blendMicro"><option value="">General ${esc(GI[state.blend.genre].name)}</option>${GI[state.blend.genre].micro.map((x) => `<option value="${x.id}"${state.blend.micro === x.id ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>` : '<span></span>'}
          </div>
          <p class="tip">Blends work best when the genres are neighbors (folk + rock, jazz + hip-hop). Distant pairs can sound confused.</p>
        </div>
      </section>

      <section class="step${state.moods.length ? ' is-done' : ''}">
        <span class="step-num">4</span>
        <div>
          <h2>Mood and energy</h2>
          <p class="sub">How should it feel? Pick one to three moods. Outlined ones suit ${esc(m ? m.name : g.name)}.</p>
          <div class="chips">${moodOpts.map((x) => chip(x, state.moods.includes(x), `data-mood="${esc(x)}"`, g.moods.includes(x))).join('')}</div>
          <div style="margin-top:14px" class="seg" role="group" aria-label="Energy">${V.energy.map((e, i) => `<button class="${state.energy === i ? 'is-on' : ''}" data-energy="${i}">${esc(e.label)}</button>`).join('')}</div>
        </div>
      </section>

      <section class="step is-done">
        <span class="step-num">5</span>
        <div>
          <h2>Tempo and key</h2>
          <p class="sub">Tempo is speed in beats per minute. The shaded band is the usual range for this style.</p>
          <div class="bpm-wrap">
            <div class="bpm-top"><span class="bpm-val">${state.bpm}</span><span class="meta">BPM · typical ${range[0]}–${range[1]}</span></div>
            <div class="bpm-track"><span class="bpm-band" style="left:${bandL}%;width:${bandW}%"></span></div>
            <input type="range" min="${lo}" max="${hi}" value="${state.bpm}" id="bpm" aria-label="Tempo in BPM" />
          </div>
          <div class="grid2" style="margin-top:14px">
            <label class="field"><span>Key</span>
              <select class="select" id="key">${V.keys.map((k) => `<option${state.key === k ? ' selected' : ''}>${esc(k)}</option>`).join('')}</select>
            </label>
          </div>
          <p class="tip">Leave key on Auto unless you need a specific key (for example to match a loop). Minor keys lean darker, major keys brighter.</p>
        </div>
      </section>

      <section class="step is-done">
        <span class="step-num">6</span>
        <div>
          <h2>Vocals</h2>
          <p class="sub">The voice is the most recognizable part of a song, so it's worth describing.</p>
          <div class="seg" role="group" aria-label="Vocal type">${V.vocalTypes.map((v) => `<button class="${state.vocal === v.id ? 'is-on' : ''}" data-vocal="${v.id}">${esc(v.label)}</button>`).join('')}</div>
          ${instrumental ? '' : `<p class="sub" style="margin:14px 0 8px">Voice character (pick up to three)</p>
          <div class="chips">${V.vocalTones.map((t) => chip(t, state.tones.includes(t), `data-tone="${t}"`)).join('')}</div>`}
        </div>
      </section>

      <section class="step is-done">
        <span class="step-num">7</span>
        <div>
          <h2>Sound palette</h2>
          <p class="sub">Instruments and signature sounds. ${m ? 'The first ones are what make ' + esc(m.name) + ' sound like itself.' : 'Pick a micro-genre above for signature sounds.'}</p>
          <div class="chips">${paletteOpts.map((x) => chip(x, state.palette.includes(x), `data-pal="${esc(x)}"`, m && m.tags.includes(x))).join('')}</div>
          <div class="add-row"><input class="input" id="palAdd" placeholder="Add your own (e.g. cello, harmonica)" /><button class="btn" id="palAddBtn">Add</button></div>
        </div>
      </section>

      <section class="step">
        <span class="step-num">8</span>
        <div>
          <h2>Production and era <span class="opt">(optional)</span></h2>
          <p class="sub">How the recording itself sounds: polished or raw, modern or vintage.</p>
          <div class="chips">${V.production.map((x) => chip(x, state.production.includes(x), `data-prod="${esc(x)}"`)).join('')}</div>
          <div class="grid2" style="margin-top:14px">
            <label class="field"><span>Era</span><select class="select" id="era">${V.eras.map((e) => `<option value="${e}"${state.era === e ? ' selected' : ''}>${e || 'Any'}</option>`).join('')}</select></label>
            <label class="field"><span>Extra tags (comma separated)</span><input class="input" id="extra" value="${esc(state.extra)}" placeholder="e.g. key change in final chorus" /></label>
          </div>
        </div>
      </section>

      <section class="step${state.theme || state.lyrics ? ' is-done' : ''}">
        <span class="step-num">9</span>
        <div>
          <h2>Song idea and lyrics</h2>
          <p class="sub">What the song is about goes here, not in the style. Paste your own lyrics, or leave them empty to get a lyrics brief.</p>
          <div class="grid2">
            <label class="field"><span>Title</span><input class="input" id="title" value="${esc(state.title)}" placeholder="e.g. Second Chance" /></label>
            <label class="field"><span>Language</span><select class="select" id="language">${V.languages.map((l) => `<option${state.language === l ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
          </div>
          <label class="field"><span>What is it about?</span><input class="input" id="theme" value="${esc(state.theme)}" placeholder="e.g. driving all night to get back to someone" /></label>
          ${instrumental ? '<p class="note">Instrumental selected: no lyrics needed. Section tags are generated for structure.</p>' : `
          <label class="field"><span>Lyrics</span><textarea class="textarea" id="lyrics" placeholder="[Verse 1]&#10;Your lines here...&#10;&#10;[Chorus]&#10;Your chorus...">${esc(state.lyrics)}</textarea></label>`}
          <div class="grid2">
            <label class="field"><span>Song structure</span><select class="select" id="structure">
              <option value="auto"${state.structure === 'auto' ? ' selected' : ''}>Auto (${esc(g.structure)})</option>
              ${Object.keys(V.structures).map((k) => `<option value="${k}"${state.structure === k ? ' selected' : ''}>${k}: ${V.structures[k].slice(0, 5).join(', ')}…</option>`).join('')}
            </select></label>
          </div>
          <p class="tip">Label sections in square brackets like [Verse 1] and [Chorus]. Write the chorus out in full each time it repeats. YuE2 needs this; Suno is more reliable with it.</p>
        </div>
      </section>

      <section class="step">
        <span class="step-num">10</span>
        <div>
          <h2>Things to avoid <span class="opt">(optional)</span></h2>
          <p class="sub">Sounds that keep sneaking in. These become Suno's Exclude styles and YuE2's "no ..." tags.</p>
          <div class="chips">${state.exclude.map((x) => `<button class="chip is-on" data-exc="${esc(x)}">${esc(x)}<span class="chip-x" aria-hidden="true">×</span></button>`).join('') || '<span class="meta">Nothing excluded.</span>'}</div>
          <div class="add-row"><input class="input" id="excAdd" placeholder="e.g. autotune, distorted guitars" /><button class="btn" id="excAddBtn">Add</button></div>
        </div>
      </section>

      <section class="step">
        <span class="step-num">11</span>
        <div>
          <h2>Draft or release?</h2>
          <p class="sub">Changes the recommended Suno model and Max Mode.</p>
          <div class="seg" role="group">
            <button class="${state.suno.stage === 'draft' ? 'is-on' : ''}" data-stage="draft">Drafting ideas</button>
            <button class="${state.suno.stage === 'standard' ? 'is-on' : ''}" data-stage="standard">Good take</button>
            <button class="${state.suno.stage === 'release' ? 'is-on' : ''}" data-stage="release">Final for release</button>
          </div>
        </div>
      </section>`;

    $('#main').scrollTop = scroll;
    if (focusId && document.getElementById(focusId)) {
      const el = document.getElementById(focusId); el.focus();
      if (selStart != null && el.setSelectionRange) try { el.setSelectionRange(selStart, selStart); } catch (_) {}
    }
    if (playingGrid === 'build') {
      const b = $('#view-build .btn-play'); if (b) { b.classList.add('is-playing'); b.textContent = 'Stop'; }
    }
  }

  function toggleIn(arr, v, max) {
    const has = arr.includes(v);
    if (has) return arr.filter((x) => x !== v);
    const next = [...arr, v];
    return max && next.length > max ? next.slice(next.length - max) : next;
  }

  function bindBuild() {
    const root = $('#view-build');
    root.addEventListener('click', (e) => {
      const t = e.target.closest('button'); if (!t) return;
      const d = t.dataset;
      if (d.vibe) { const v = window.VIBES[+d.vibe]; applyGenre(v.genre, v.micro, { moods: v.moods }); toast(`Set up ${GI[v.genre].micro.find((x) => x.id === v.micro).name}`); return; }
      if (d.genre) { applyGenre(d.genre, null); return; }
      if (d.micro !== undefined) { applyGenre(state.genre, d.micro || null, { moods: state.moods }); return; }
      if (d.mood) { setState({ moods: toggleIn(state.moods, d.mood, 3) }); return; }
      if (d.energy) { setState({ energy: +d.energy }); return; }
      if (d.vocal) { setState({ vocal: d.vocal }); return; }
      if (d.tone) { setState({ tones: toggleIn(state.tones, d.tone, 3) }); return; }
      if (d.pal) { setState({ palette: toggleIn(state.palette, d.pal) }); return; }
      if (d.prod) { setState({ production: toggleIn(state.production, d.prod, 3) }); return; }
      if (d.exc) { setState({ exclude: state.exclude.filter((x) => x !== d.exc) }); return; }
      if (d.stage) { setState({ suno: { ...state.suno, stage: d.stage } }); return; }
      if (d.play) { togglePlay(t, d.play, +d.bpm, d.grid); return; }
      if (d.open) { api.openExternal(d.open); return; }
      if (t.id === 'palAddBtn') addFrom('#palAdd', 'pal');
      if (t.id === 'excAddBtn') addFrom('#excAdd', 'exc');
    });
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.id === 'palAdd') addFrom('#palAdd', 'pal');
      if (e.key === 'Enter' && e.target.id === 'excAdd') addFrom('#excAdd', 'exc');
    });
    root.addEventListener('input', (e) => {
      const id = e.target.id; const val = e.target.value;
      if (id === 'bpm') {
        state.bpm = +val;
        $('.bpm-val', root).textContent = val;
        if (playingGrid === 'build') groove.bpm = +val;
        setState({}, { outputOnly: true });
        return;
      }
      if (['title', 'theme', 'lyrics', 'extra'].includes(id)) setState({ [id]: val }, { outputOnly: true });
    });
    root.addEventListener('change', (e) => {
      const id = e.target.id; const val = e.target.value;
      if (id === 'bpm') { setState({ bpm: +val }); return; }
      if (['key', 'era', 'language', 'structure'].includes(id)) setState({ [id]: val });
      if (id === 'blendGenre') setState({ blend: val ? { genre: val, micro: null } : null });
      if (id === 'blendMicro') setState({ blend: { ...state.blend, micro: val || null } });
    });
  }

  function addFrom(sel, kind) {
    const input = $(sel); const vals = input.value.split(',').map((s) => s.trim()).filter(Boolean);
    if (!vals.length) return;
    if (kind === 'pal') setState({ customPalette: uniq([...state.customPalette, ...vals]), palette: uniq([...state.palette, ...vals]) });
    else setState({ exclude: uniq([...state.exclude, ...vals]) });
    const again = $(sel); if (again) again.focus();
  }

  // ---------- OUTPUT PANEL ----------
  const TARGETS = [
    { id: 'simple', name: 'Suno', sub: 'Simple' },
    { id: 'advanced', name: 'Suno', sub: 'Advanced' },
    { id: 'sounds', name: 'Suno', sub: 'Sounds' },
    { id: 'yue', name: 'YuE2', sub: 'Local model' }
  ];

  function result(S) {
    return { simple: E.sunoSimple, advanced: E.sunoAdvanced, sounds: E.sunoSounds, yue: E.yue2 }[S.target](S);
  }

  function renderOutput() {
    const out = $('#output');
    const S = outputState();
    const r = result(S);
    const info = E.genreInfo(S);
    const dist = E.distribution(S);
    const summary = {
      simple: 'One plain-language description. Fastest way to a song.',
      advanced: 'Separate Styles, Lyrics and settings for full control.',
      sounds: 'Short loops and one-shots instead of full songs.',
      yue: 'Style tags plus strictly formatted lyrics for the YuE2 model.'
    }[S.target];

    const soundsForm = S.target === 'sounds' ? `
      <div class="sounds-form">
        <label class="field"><span>What kind of sound?</span>
          <select class="select" id="sType">${V.soundTypes.map((t) => `<option value="${t.id}"${S.sounds.type === t.id ? ' selected' : ''}>${t.label}</option>`).join('')}</select></label>
        <label class="field"><span>Describe it (optional)</span>
          <input class="input" id="sDesc" value="${esc(S.sounds.desc)}" placeholder="${esc((V.soundTypes.find((t) => t.id === S.sounds.type) || V.soundTypes[0]).hint)}" /></label>
        <div class="grid2">
          <label class="field"><span>Loop or one-shot</span><select class="select" id="sKind">
            <option value=""${!S.sounds.kind ? ' selected' : ''}>Auto</option><option${S.sounds.kind === 'Loop' ? ' selected' : ''}>Loop</option><option${S.sounds.kind === 'One-Shot' ? ' selected' : ''}>One-Shot</option></select></label>
          <label class="field"><span>Key</span><input class="input" id="sKey" value="${esc(S.sounds.key)}" placeholder="${esc(E.suggestKey(S))}" /></label>
        </div>
      </div>` : '';

    const fields = r.fields.map((f, i) => {
      const n = f.value ? f.value.length : 0;
      const counter = f.count ? `<span class="n${n > f.count ? ' over' : ''}">${n}/${f.count}</span>` : `<span class="n">${n} chars</span>`;
      const body = `<pre${f.mono ? '' : ''}>${esc(f.value || '—')}</pre>${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ''}`;
      if (f.collapsed) return `<details class="strip"><summary><b>${esc(f.label)}</b></summary>${body}<div class="row" style="padding:0 12px 10px"><button class="btn btn-small" data-copy="${i}">Copy</button></div></details>`;
      return `<div class="strip"><div class="strip-head"><b>${esc(f.label)}${counter}</b>${f.value ? `<button class="btn btn-small" data-copy="${i}">Copy</button>` : ''}</div>${body}</div>`;
    }).join('');

    const settings = `<h3 class="out-h">Settings</h3><table class="settings">${r.settings.map(([k, v, why]) => `<tr><th>${esc(k)}</th><td><b>${esc(v)}</b>${why ? `<small>${esc(why)}</small>` : ''}</td></tr>`).join('')}</table>`;

    const yueOpts = S.target === 'yue' ? `
      <h3 class="out-h">YuE2 options</h3>
      <div class="grid2">
        <label class="field"><span>Lead the style with</span><select class="select" id="yLead">
          <option value="genre"${S.yue.lead === 'genre' ? ' selected' : ''}>Genre (default)</option>
          <option value="vocal"${S.yue.lead === 'vocal' ? ' selected' : ''}>Vocal sound</option></select></label>
        <label class="field"><span>Takes to generate</span><select class="select" id="yBatch">${[2, 3, 4, 8].map((n) => `<option${S.yue.batch === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
      </div>
      <label class="switch"><input type="checkbox" id="yParens"${S.yue.keepParens ? ' checked' : ''} /> Keep (parenthesized) words as sung backing vocals</label>` : '';

    const warns = r.warnings.length ? `<h3 class="out-h">Check these</h3>${r.warnings.map((w) => `<p class="warn">${esc(w)}</p>`).join('')}` : '';

    const distro = dist && S.target !== 'sounds' ? `
      <details class="strip" style="margin-top:14px"><summary><b>Release and distribution notes</b></summary>
        <div style="padding:4px 12px 12px">
          <table class="settings">
            <tr><th>Primary genre</th><td><b>${esc(dist.primary)}</b></td></tr>
            ${dist.secondary ? `<tr><th>Secondary genre</th><td><b>${esc(dist.secondary)}</b></td></tr>` : ''}
            <tr><th>Search and playlist words</th><td>${dist.keywords.map((k) => `<span class="kw">${esc(k)}</span>`).join('')}</td></tr>
            <tr><th>One-line pitch</th><td>${esc(dist.pitch)}<br /><button class="btn btn-small" style="margin-top:6px" data-copytext="${esc(dist.pitch)}">Copy pitch</button></td></tr>
          </table>
          <p class="note">Suggestions only. Match the primary genre to your distributor's own list, and use the same micro-genre words in your release description and playlist pitches. Check your Suno plan's commercial-use terms before distributing.</p>
        </div>
      </details>` : '';

    out.innerHTML = `
      <div class="out-tabs" role="tablist">${TARGETS.map((t) => `<button class="out-tab${S.target === t.id ? ' is-on' : ''}" role="tab" aria-selected="${S.target === t.id}" data-target="${t.id}">${t.name}<small>${t.sub}</small></button>`).join('')}</div>
      <div class="out-body">
        <p class="out-summary">${esc(info.name)}${info.blend ? ' × ' + esc(info.blend.name) : ''}<span>${summary}</span></p>
        ${S !== state ? `<p class="note rs-preview-note">Showing the research prompt “${esc(rsUI.preview.title)}”. <button class="linkbtn" data-rsunpreview="1">Show my builder prompt</button></p>` : ''}
        ${soundsForm}${fields}${settings}${yueOpts}${warns}${distro}
      </div>
      <div class="out-actions">
        <button class="btn btn-primary" id="copyAll">Copy everything</button>
        <button class="btn" id="savePrompt">Save</button>
        <button class="btn" id="exportPrompt">Export</button>
      </div>`;
    out._fields = r.fields;
  }

  function bindOutput() {
    const out = $('#output');
    out.addEventListener('click', async (e) => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.target) {
        setState({ target: t.dataset.target }, { outputOnly: true });
        if (view === 'research' && rsUI.tab === 'work' && t.dataset.target !== 'sounds') {
          rsUI.vtab = t.dataset.target;
          $$('[data-vtab]').forEach((b) => { const on = b.dataset.vtab === rsUI.vtab; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
          renderRsPrompts();
        }
        return;
      }
      if (t.dataset.rsunpreview) { rsUI.preview = null; rsUI.pinPreview = true; renderOutput(); renderRsPrompts(); renderRsKeep(); return; }
      const S = outputState();
      if (t.dataset.copy !== undefined) { const f = out._fields[+t.dataset.copy]; copy(f.value, `${f.label} copied`); return; }
      if (t.dataset.copytext) { copy(t.dataset.copytext); return; }
      if (t.id === 'copyAll') { copy(E.exportText(S, S.target), 'Prompt copied'); return; }
      if (t.id === 'exportPrompt') {
        const name = (S.title || E.genreInfo(S).name) + ' - ' + S.target;
        const res = await api.saveText(name, E.exportText(S, S.target));
        if (res && res.saved) toast('Exported');
        return;
      }
      if (t.id === 'savePrompt') {
        const saved = store.get('sps.saved', []);
        const info = E.genreInfo(S);
        saved.unshift({ id: Date.now(), name: S.title || info.name, genre: info.name, target: S.target, date: new Date().toLocaleString(), text: E.exportText(S, S.target), state: structuredClone(S) });
        store.set('sps.saved', saved.slice(0, 200)); updateSavedCount(); toast('Saved');
      }
    });
    out.addEventListener('change', (e) => {
      const id = e.target.id, v = e.target.value;
      if (id === 'sType') setState({ sounds: { ...state.sounds, type: v } }, { outputOnly: true });
      if (id === 'sKind') setState({ sounds: { ...state.sounds, kind: v } }, { outputOnly: true });
      if (id === 'yLead') setState({ yue: { ...state.yue, lead: v } }, { outputOnly: true });
      if (id === 'yBatch') setState({ yue: { ...state.yue, batch: +v } }, { outputOnly: true });
      if (id === 'yParens') setState({ yue: { ...state.yue, keepParens: e.target.checked } }, { outputOnly: true });
      if (id === 'sDesc' || id === 'sKey') setState({ sounds: { ...state.sounds, [id === 'sDesc' ? 'desc' : 'key']: v } }, { outputOnly: true });
    });
  }

  // ---------- EXPLORE ----------
  function renderExplore() {
    const g = GI[exploreGenre] || GENRES[0];
    const mid = Math.round((g.bpm[0] + g.bpm[1]) / 2);
    $('#view-explore').innerHTML = `
      <header class="view-head"><h1>Explore genres</h1>
        <p>Read what each style is, hear its rhythm, and find the micro-genre that fits your song.</p></header>
      <div class="explore">
        <div class="explore-list">${GENRES.map((x) => `<button class="${x.id === g.id ? 'is-on' : ''}" data-eg="${x.id}">${esc(x.name)}</button>`).join('')}</div>
        <div>
          <div class="gcard" style="margin-top:0">
            <h3>${esc(g.name)}</h3>
            <p>${esc(g.blurb)}</p>
            <ul class="listen">${g.listen.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
            <p class="meta">Typical tempo ${g.bpm[0]}–${g.bpm[1]} BPM. Common sounds: ${esc(g.instruments.join(', '))}.</p>
            <div class="row" style="margin-top:10px">
              <button class="btn btn-play" data-play="${g.groove}" data-bpm="${mid}" data-grid="ex-main" data-label="Play groove sketch">Play groove sketch</button>
              <button class="btn btn-ghost" data-open="${esc(youtube(g.name))}">Hear real songs</button>
              <button class="btn btn-primary" data-use="${g.id}" data-usem="">Use in builder</button>
            </div>
            ${seqHTML(g.groove, 'ex-main', mid)}
          </div>
          <table class="mtable"><tbody>
            ${g.micro.map((m) => {
              const b = Math.round((m.bpm[0] + m.bpm[1]) / 2);
              return `<tr><td><b>${esc(m.name)}</b><span class="meta">${m.bpm[0]}–${m.bpm[1]} BPM</span></td>
                <td>${esc(m.desc)}<div class="tags">${esc(m.tags.join(' · '))}</div></td>
                <td class="acts"><button class="btn btn-small btn-play" data-play="${m.groove}" data-bpm="${b}" data-grid="ex-${m.id}" data-label="Play">Play</button>
                  <button class="btn btn-small btn-ghost" data-open="${esc(youtube(m.name))}">Listen</button>
                  <button class="btn btn-small" data-use="${g.id}" data-usem="${m.id}">Use</button></td></tr>
                <tr class="seq-holder" data-for="ex-${m.id}" hidden><td colspan="3">${seqHTML(m.groove, 'ex-' + m.id, b)}</td></tr>`;
            }).join('')}
          </tbody></table>
        </div>
      </div>`;
  }

  function bindExplore() {
    $('#view-explore').addEventListener('click', (e) => {
      const t = e.target.closest('button'); if (!t) return;
      const d = t.dataset;
      if (d.eg) { groove.stop(); playingGrid = null; exploreGenre = d.eg; renderExplore(); $('#main').scrollTop = 0; return; }
      if (d.play) {
        $$('.seq-holder').forEach((r) => { r.hidden = true; });
        const holder = $(`.seq-holder[data-for="${d.grid}"]`);
        togglePlay(t, d.play, +d.bpm, d.grid);
        if (holder && t.classList.contains('is-playing')) holder.hidden = false;
        return;
      }
      if (d.open) { api.openExternal(d.open); return; }
      if (d.use) { applyGenre(d.use, d.usem || null); showView('build'); toast('Loaded into the builder'); }
    });
  }

  // ---------- LYRICS LAB ----------
  let labText = store.get('sps.lab', '');
  function renderLyrics() {
    $('#view-lyrics').innerHTML = `
      <header class="view-head"><h1>Lyrics lab</h1>
        <p>Paste lyrics in any format. They're cleaned up for Suno and YuE2, and you'll see syllable counts so repeated lines fit the same melody.</p></header>
      <div class="lab">
        <label class="field"><span>Your lyrics</span><textarea class="textarea" id="labIn" style="min-height:240px" placeholder="Verse 1:&#10;...&#10;&#10;Chorus:&#10;...&#10;&#10;(repeat chorus)">${esc(labText)}</textarea></label>
        <div class="row"><button class="btn btn-primary" id="labSend">Use these lyrics in the builder</button><span class="meta">Messy formatting is fine: "Verse 1:", "(Chorus)", "[Hook]", or no labels at all.</span></div>
        <div id="labOut"></div>
      </div>`;
    renderLabOut();
  }

  function renderLabOut() {
    const box = $('#labOut'); if (!box) return;
    if (!labText.trim()) { box.innerHTML = '<p class="empty">Paste some lyrics above to see them formatted and syllable-counted.</p>'; return; }
    const parsed = E.parseLyrics(labText);
    const suno = E.formatSuno(parsed);
    const yue = E.formatYue(E.parseLyrics(labText), { stripParens: true });
    const baseByLabel = {};
    const rows = [];
    parsed.sections.forEach((s) => {
      rows.push(`<tr class="sec"><td colspan="2">${esc(s.name)}${s.inferred ? ' (auto-labeled)' : ''}</td></tr>`);
      const texts = s.lines.filter((l) => l.text).map((l) => l.text);
      const counts = texts.map(E.syllables);
      const base = baseByLabel[s.name];
      texts.forEach((t, i) => {
        const off = base && base[i] !== undefined && Math.abs(base[i] - counts[i]) > 1;
        rows.push(`<tr><td class="n${off ? ' off' : ''}" title="${off ? 'Differs from the first ' + esc(s.name) : ''}">${counts[i]}</td><td>${esc(t)}</td></tr>`);
      });
      if (!base && texts.length) baseByLabel[s.name] = counts;
    });
    box.innerHTML = `
      <div class="grid2">
        <div class="strip"><div class="strip-head"><b>For Suno</b><button class="btn btn-small" data-lab="suno">Copy</button></div><pre>${esc(suno.text)}</pre></div>
        <div class="strip"><div class="strip-head"><b>For YuE2</b><button class="btn btn-small" data-lab="yue">Copy</button></div><pre>${esc(yue.text)}</pre></div>
      </div>
      ${[...suno.warnings, ...yue.warnings].filter((w, i, a) => a.indexOf(w) === i).map((w) => `<p class="warn">${esc(w)}</p>`).join('')}
      <h3 class="out-h">Syllables per line</h3>
      <p class="meta">Red numbers differ from the same line in the first section of that name. Matching counts help the melody repeat cleanly (estimated for English; each Chinese or Japanese character counts as one).</p>
      <table class="syl-table">${rows.join('')}</table>`;
    box._suno = suno.text; box._yue = yue.text;
  }

  function bindLyrics() {
    const root = $('#view-lyrics');
    root.addEventListener('input', (e) => { if (e.target.id === 'labIn') { labText = e.target.value; store.set('sps.lab', labText); renderLabOut(); } });
    root.addEventListener('click', (e) => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.lab) { copy($('#labOut')['_' + t.dataset.lab], 'Lyrics copied'); return; }
      if (t.id === 'labSend') {
        if (!labText.trim()) { toast('Paste lyrics first'); return; }
        const p = E.formatSuno(E.parseLyrics(labText));
        setState({ lyrics: p.text, vocal: state.vocal === 'none' ? 'female' : state.vocal }, { silent: true });
        showView('build'); toast('Lyrics added to the builder');
      }
    });
  }

  // ---------- EXAMPLES ----------
  function renderExamples() {
    $('#view-examples').innerHTML = `
      <header class="view-head"><h1>Example prompts</h1>
        <p>Style prompts written in the layered format used by strong benchmark prompts: genre, then instruments, mood, tempo, vocal and production. Each notes what it teaches.</p></header>
      ${window.EXAMPLES.map((x, i) => `
        <article class="ex">
          <h3>${esc(x.title)}</h3>
          <code>${esc(x.tags)}</code>
          <p>${esc(x.lesson)}</p>
          <div class="row"><button class="btn btn-small" data-excopy="${i}">Copy tags</button><button class="btn btn-small" data-exload="${i}">Start from this in the builder</button></div>
        </article>`).join('')}`;
  }
  function bindExamples() {
    $('#view-examples').addEventListener('click', (e) => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.excopy) { copy(window.EXAMPLES[+t.dataset.excopy].tags); return; }
      if (t.dataset.exload) {
        const x = window.EXAMPLES[+t.dataset.exload];
        applyGenre(x.genre, x.micro, { vocal: x.vocal });
        showView('build'); toast(`Loaded ${x.title}`);
      }
    });
  }

  // ---------- GLOSSARY ----------
  function renderGlossary(filter = '') {
    const f = filter.toLowerCase();
    const items = V.glossary.filter(([a, b]) => !f || a.toLowerCase().includes(f) || b.toLowerCase().includes(f));
    const listHTML = items.map(([a, b]) => `<dl class="gloss"><dt>${esc(a)}</dt><dd>${esc(b)}</dd></dl>`).join('') || '<p class="empty">No terms match. Try a shorter word.</p>';
    if (!$('#glossList')) {
      $('#view-glossary').innerHTML = `
        <header class="view-head"><h1>Music terms</h1><p>Plain-language meanings for words you'll see in prompts and in Suno or YuE2.</p></header>
        <label class="field" style="max-width:360px"><span>Search terms</span><input class="input" id="glossQ" placeholder="e.g. drop, BPM, swing" /></label>
        <div id="glossList"></div>`;
      $('#glossQ').addEventListener('input', (e) => renderGlossary(e.target.value));
    }
    $('#glossList').innerHTML = listHTML;
  }

  // ---------- SAVED ----------
  function updateSavedCount() { const n = store.get('sps.saved', []).length; $('#savedCount').textContent = n || ''; }
  function renderSaved() {
    const saved = store.get('sps.saved', []);
    const names = { simple: 'Suno Simple', advanced: 'Suno Advanced', sounds: 'Suno Sounds', yue: 'YuE2' };
    $('#view-saved').innerHTML = `
      <header class="view-head"><h1>Saved prompts</h1><p>Prompts you've saved on this computer.</p></header>
      ${saved.length ? saved.map((s) => `
        <article class="ex">
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.genre)} · ${esc(names[s.target] || s.target)} · ${esc(s.date)}</p>
          <div class="row"><button class="btn btn-small btn-primary" data-sload="${s.id}">Open in builder</button><button class="btn btn-small" data-scopy="${s.id}">Copy</button><button class="btn btn-small" data-sexp="${s.id}">Export</button><button class="btn btn-small btn-ghost" data-sdel="${s.id}">Delete</button></div>
        </article>`).join('') : '<p class="empty">Nothing saved yet. Build a prompt and press Save in the prompt panel.</p>'}`;
  }
  function bindSaved() {
    $('#view-saved').addEventListener('click', async (e) => {
      const t = e.target.closest('button'); if (!t) return;
      const saved = store.get('sps.saved', []);
      const id = +(t.dataset.sload || t.dataset.scopy || t.dataset.sexp || t.dataset.sdel);
      const s = saved.find((x) => x.id === id); if (!s) return;
      if (t.dataset.sload) { state = Object.assign(structuredClone(DEFAULT), s.state); setState({}, { silent: true }); showView('build'); toast('Opened'); }
      if (t.dataset.scopy) copy(s.text);
      if (t.dataset.sexp) { const r = await api.saveText(s.name, s.text); if (r && r.saved) toast('Exported'); }
      if (t.dataset.sdel) { store.set('sps.saved', saved.filter((x) => x.id !== id)); updateSavedCount(); renderSaved(); toast('Deleted'); }
    });
  }

  // ---------- PROMPT RESEARCH ----------
  // Search songs / artists / albums, collect them on a scratch pad, compare the prompts
  // they suggest, and save the whole session to reopen later.
  const R = window.Research;
  const blankResearch = () => ({ id: null, name: '', items: [], notes: '', pinned: [], savedAt: null, dirty: false });
  let rs = Object.assign(blankResearch(), store.get('sps.researchDraft', {}));
  const rsUI = { tab: 'work', type: 'all', q: '', results: [], active: -1, open: false, loading: false, error: '', seq: 0,
    vtab: 'simple', preview: null, autoPreview: true, variants: [] };
  let rsTimer = null, rsAudio = null, rsPlayingKey = null;
  const rsEnriching = new Set();
  const KIND = { song: 'Song', artist: 'Artist', album: 'Album' };
  const canSearch = () => !!(window.studio && window.studio.searchMusic);

  function stateFor(patch) {
    const s = structuredClone(state);
    Object.assign(s, { micro: null, blend: null, tones: [], customPalette: [], production: ['polished modern mix'], era: '', extra: '', key: 'Auto' }, structuredClone(patch));
    delete s.measuredBpm;
    return s;
  }
  function outputState() {
    if (view !== 'research' || rsUI.tab !== 'work' || !rsUI.preview) return state;
    return stateFor(rsUI.preview.patch);
  }

  function rsSaveDraft() { store.set('sps.researchDraft', rs); }
  function rsTouch() {
    rs.dirty = true; rsSaveDraft(); updateRsStatus();
    renderRsItems(); renderRsPrompts(); renderRsKeep(); renderOutput();
  }
  function rsLib() { return store.get('sps.research', []); }
  function updateRsCount() { const n = rsLib().length; const c = $('#researchCount'); if (c) c.textContent = n || ''; }
  function updateRsStatus() {
    const el = $('#rsStatus'); if (!el) return;
    let txt = '';
    if (rs.savedAt && !rs.dirty) txt = 'Saved ' + new Date(rs.savedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    else if (rs.savedAt) txt = 'Unsaved changes';
    else if (rs.items.length) txt = 'Not saved yet';
    el.textContent = txt;
    el.classList.toggle('is-dirty', !!(rs.dirty && rs.items.length));
  }
  function autoName() {
    const t = rs.items.slice(0, 2).map((i) => i.title);
    return t.length ? 'Research: ' + t.join(' + ') + (rs.items.length > 2 ? ` +${rs.items.length - 2}` : '') : 'Untitled research';
  }

  const artTile = (it, size = '') => it.artwork
    ? `<img class="rs-art${size}" src="${esc(it.artwork)}" alt="" loading="lazy" />`
    : `<span class="rs-art${size} rs-art-blank" aria-hidden="true">${esc((it.title || '?').trim().slice(0, 1).toUpperCase())}</span>`;

  function subline(it) {
    if (it.kind === 'song') return `Song by ${it.artist}${it.album ? ', from ' + it.album : ''}${it.year ? ' (' + it.year + ')' : ''}`;
    if (it.kind === 'album') return `Album by ${it.artist}${it.year ? ' (' + it.year + ')' : ''}${it.tracks ? ', ' + it.tracks + ' tracks' : ''}`;
    return `Artist${it.genre ? ', ' + it.genre : ''}`;
  }

  function renderResearch() {
    if (['simple', 'advanced', 'yue'].includes(state.target)) rsUI.vtab = state.target;
    const libN = rsLib().length;
    $('#view-research').innerHTML = `
      <header class="view-head"><h1>Prompt research</h1>
        <p>Look up songs, artists or albums you love, collect them on a scratch pad, and compare the prompts their sound suggests. Save the session to pick it up later.</p></header>
      <div class="seg rs-tabs" role="tablist" aria-label="Research views">
        <button role="tab" data-rtab="work" class="${rsUI.tab === 'work' ? 'is-on' : ''}" aria-selected="${rsUI.tab === 'work'}">This research</button>
        <button role="tab" data-rtab="lib" class="${rsUI.tab === 'lib' ? 'is-on' : ''}" aria-selected="${rsUI.tab === 'lib'}">Saved research${libN ? ` (${libN})` : ''}</button>
      </div>
      <div class="rs-bar" ${rsUI.tab === 'work' ? '' : 'hidden'}>
        <label class="rs-name-wrap"><span class="sr">Research name</span>
          <input class="rs-name" id="rsName" value="${esc(rs.name)}" placeholder="${esc(autoName())}" maxlength="80" /></label>
        <span class="rs-status" id="rsStatus"></span>
        <button class="btn btn-primary" id="rsSave">Save research</button>
        <button class="btn" id="rsNew">Start new</button>
      </div>

      <div id="rsWork" ${rsUI.tab === 'work' ? '' : 'hidden'}>
        <section class="step">
          <span class="step-num">1</span>
          <div>
            <h2>Find references</h2>
            <p class="sub">Type a song, artist or album. Suggestions appear as you type; press Enter or click to add one to your scratch pad.</p>
            <div class="seg rs-types" aria-label="Search for">${[['all', 'Everything'], ['song', 'Songs'], ['artist', 'Artists'], ['album', 'Albums']].map(([id, l]) => `<button data-rtype="${id}" class="${rsUI.type === id ? 'is-on' : ''}" aria-pressed="${rsUI.type === id}">${l}</button>`).join('')}</div>
            <div class="rs-combo">
              <input id="rsQ" class="input rs-q" type="search" role="combobox" aria-expanded="false" aria-controls="rsList" aria-autocomplete="list"
                autocomplete="off" spellcheck="false" placeholder="${canSearch() ? 'e.g. Blinding Lights, Daft Punk, Rumours' : 'Search needs the desktop app and an internet connection'}" value="${esc(rsUI.q)}" />
              <span class="rs-spin" id="rsSpin" hidden aria-hidden="true"></span>
              <div id="rsList" class="rs-drop" role="listbox" aria-label="Suggestions" hidden></div>
            </div>
            <div id="rsRecent"></div>
            <p class="tip">References only guide the style. Prompts describe the sound (genre, tempo, era, instruments, vocal) and never name the artist or song: Suno rejects artist names, and describing the sound keeps your release original.</p>
          </div>
        </section>

        <section class="step">
          <span class="step-num">2</span>
          <div>
            <h2>Your scratch pad</h2>
            <p class="sub">Everything you've collected. Check the style each one was matched to and correct it if it's off. Mark your favorite as the main reference to give it double weight.</p>
            <div id="rsItems"></div>
            <label class="field" style="margin-top:14px"><span>Research notes</span>
              <textarea class="textarea rs-notes" id="rsNotes" placeholder="What are you going for? e.g. the night-drive feel of the first song, but with a bigger chorus">${esc(rs.notes)}</textarea></label>
          </div>
        </section>

        <section class="step">
          <span class="step-num">3</span>
          <div>
            <h2>Prompts from your references</h2>
            <p class="sub">Different directions your references point to. Select one to see the full prompt, settings and lyrics template in the panel on the right.</p>
            <div class="seg" aria-label="Show prompts for" id="rsVtabs">${[['simple', 'Suno Simple'], ['advanced', 'Suno Advanced'], ['yue', 'YuE2']].map(([id, l]) => `<button data-vtab="${id}" class="${rsUI.vtab === id ? 'is-on' : ''}" aria-pressed="${rsUI.vtab === id}">${l}</button>`).join('')}</div>
            <div id="rsPrompts"></div>
          </div>
        </section>

        <section class="step">
          <span class="step-num">4</span>
          <div>
            <h2>Keep what works</h2>
            <p class="sub">Pinned prompts are saved with this research exactly as they are now, even if you change the scratch pad later.</p>
            <div id="rsKeep"></div>
          </div>
        </section>
      </div>

      <div id="rsLibView" ${rsUI.tab === 'lib' ? '' : 'hidden'}></div>`;
    updateRsStatus();
    if (rsUI.tab === 'lib') renderRsLibrary();
    else { renderRsRecent(); renderRsItems(); renderRsPrompts(); renderRsKeep(); }
    rs.items.filter((i) => !i.enrich || i.enrich.status === 'pending').forEach(enrichItem);
  }

  // ----- search / autocomplete -----
  function renderRsRecent() {
    const box = $('#rsRecent'); if (!box) return;
    const rec = store.get('sps.rsRecent', []);
    box.innerHTML = rec.length ? `<div class="rs-recent"><span class="meta">Recent searches</span>${rec.map((q) => `<button class="chip" data-recent="${esc(q)}">${esc(q)}</button>`).join('')}</div>` : '';
  }
  function remember(q) {
    q = q.trim(); if (q.length < 2) return;
    const rec = store.get('sps.rsRecent', []).filter((x) => x.toLowerCase() !== q.toLowerCase());
    rec.unshift(q); store.set('sps.rsRecent', rec.slice(0, 8)); renderRsRecent();
  }

  function highlight(text, q) {
    const t = String(text || ''); const i = q ? t.toLowerCase().indexOf(q.toLowerCase()) : -1;
    if (i < 0) return esc(t);
    return esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length));
  }

  function renderSuggest() {
    const list = $('#rsList'), input = $('#rsQ'); if (!list) return;
    $('#rsSpin').hidden = !rsUI.loading;
    const show = rsUI.open && rsUI.q.trim().length >= 2 && (rsUI.results.length || rsUI.error || (!rsUI.loading));
    list.hidden = !show; input.setAttribute('aria-expanded', String(!!show));
    if (!show) { input.removeAttribute('aria-activedescendant'); return; }
    if (rsUI.error) { list.innerHTML = `<div class="rs-msg">${esc(rsUI.error)}</div>`; return; }
    if (!rsUI.results.length) { list.innerHTML = `<div class="rs-msg">No matches for “${esc(rsUI.q)}”. Check the spelling or try the artist's name.</div>`; return; }
    const have = new Set(rs.items.map((i) => i.key));
    let html = '', last = '';
    rsUI.results.forEach((r, i) => {
      if (rsUI.type === 'all' && r.kind !== last) { html += `<div class="rs-group" role="presentation">${KIND[r.kind]}s</div>`; last = r.kind; }
      const added = have.has(r.key);
      html += `<div class="rs-opt${i === rsUI.active ? ' is-active' : ''}" role="option" id="rs-opt-${i}" data-ri="${i}" aria-selected="${i === rsUI.active}">
        ${artTile(r, ' rs-art-s')}
        <span class="rs-opt-text"><b>${highlight(r.title, rsUI.q)}</b><small>${highlight(subline(r), rsUI.q)}</small></span>
        <span class="rs-opt-add${added ? ' is-added' : ''}">${added ? 'Added' : 'Add'}</span></div>`;
    });
    list.innerHTML = html;
    if (rsUI.active >= 0) { input.setAttribute('aria-activedescendant', 'rs-opt-' + rsUI.active); const a = $('#rs-opt-' + rsUI.active); if (a) a.scrollIntoView({ block: 'nearest' }); }
    else input.removeAttribute('aria-activedescendant');
  }

  function runSearch() {
    const q = rsUI.q.trim();
    clearTimeout(rsTimer);
    if (q.length < 2) { rsUI.results = []; rsUI.loading = false; rsUI.error = ''; renderSuggest(); return; }
    if (!canSearch()) { rsUI.error = 'Search runs in the desktop app and needs an internet connection.'; rsUI.open = true; renderSuggest(); return; }
    rsUI.loading = true; renderSuggest();
    rsTimer = setTimeout(async () => {
      const seq = ++rsUI.seq;
      let res;
      try { res = await window.studio.searchMusic(q, rsUI.type); } catch (err) { res = { ok: false, error: String(err) }; }
      if (seq !== rsUI.seq) return; // a newer search replaced this one
      rsUI.loading = false;
      rsUI.error = res.ok ? '' : "Couldn't reach the music catalog. Check your internet connection and try again.";
      const order = { song: 0, artist: 1, album: 2 };
      rsUI.results = res.ok ? res.results.slice().sort((a, b) => rsUI.type === 'all' ? order[a.kind] - order[b.kind] : 0) : [];
      rsUI.active = rsUI.results.length ? 0 : -1;
      renderSuggest();
    }, 260);
  }

  function addItem(r) {
    if (!r) return;
    if (rs.items.some((i) => i.key === r.key)) { toast('Already on your scratch pad'); return; }
    if (rs.items.length >= 30) { toast('Scratch pad is full (30). Remove one to add more.'); return; }
    const it = Object.assign({}, r, { main: rs.items.length === 0, note: '', override: null, added: Date.now(), enrich: { status: 'pending', tags: [] } });
    rs.items.push(it);
    remember(rsUI.q);
    toast(`Added ${r.title}`);
    rsTouch(); renderSuggest();
    enrichItem(it);
  }

  async function enrichItem(it) {
    if (!window.studio || !window.studio.enrichMusic) { it.enrich = { status: 'skipped', tags: [] }; return; }
    if (rsEnriching.has(it.key)) return; rsEnriching.add(it.key);
    try {
      const res = await window.studio.enrichMusic(it);
      it.enrich = Object.assign({ status: 'done' }, res);
    } catch (_) { it.enrich = { status: 'failed', tags: [] }; }
    rsEnriching.delete(it.key);
    if (!rs.items.includes(it)) return;
    rsSaveDraft();
    if (view === 'research' && rsUI.tab === 'work') { renderRsItems(); renderRsPrompts(); renderOutput(); }
  }

  // ----- scratch pad -----
  function styleOptions(it, m) {
    const cur = it.override ? `${it.override.genre}/${it.override.micro || ''}` : '';
    const autoLabel = m.genre ? `Auto: ${R.label(m.genre, m.micro)}` : 'Auto: no match yet';
    return `<option value="">${esc(autoLabel)}</option>` + GENRES.map((g) => `<optgroup label="${esc(g.name)}">
      <option value="${g.id}/"${cur === g.id + '/' ? ' selected' : ''}>General ${esc(g.name)}</option>
      ${g.micro.map((x) => `<option value="${g.id}/${x.id}"${cur === g.id + '/' + x.id ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</optgroup>`).join('');
  }

  function renderRsItems() {
    const box = $('#rsItems'); if (!box) return;
    if (!rs.items.length) {
      box.innerHTML = `<p class="empty">Nothing here yet. Search above and add two to five songs that feel like what you want to make. Mixing references from different styles gives you blended prompts to compare.</p>`;
      return;
    }
    box.innerHTML = `<ol class="rs-items">${rs.items.map((it, idx) => {
      const m = R.matchItem(it);
      const e = it.enrich || {};
      const g = m.genre ? GI[m.genre] : null;
      const status = e.status === 'pending' ? '<span class="rs-looking">Looking up style tags and tempo</span>'
        : e.status === 'failed' ? '<span class="meta">Tag lookup unavailable. Using the store genre only.</span>' : '';
      const facts = [
        it.genre ? `<span class="kw">Store genre: ${esc(it.genre)}</span>` : '',
        e.bpm ? `<span class="kw">${e.bpm} BPM</span>` : '',
        ...(e.tags || []).slice(0, 6).map((t) => `<span class="kw">${esc(t.name)}</span>`)
      ].join('');
      return `<li class="rs-item${it.main ? ' is-main' : ''}" data-key="${esc(it.key)}">
        ${artTile(it)}
        <div class="rs-item-body">
          <div class="rs-item-top">
            <div><b class="rs-title">${esc(it.title)}</b><span class="meta">${esc(subline(it))}</span></div>
            <div class="rs-item-acts">
              <button class="btn btn-small${it.main ? ' is-main-btn' : ''}" data-main="${idx}" aria-pressed="${!!it.main}">${it.main ? 'Main reference' : 'Make main'}</button>
              ${it.preview ? `<button class="btn btn-small btn-ghost${rsPlayingKey === it.key ? ' is-playing' : ''}" data-prev="${idx}">${rsPlayingKey === it.key ? 'Stop preview' : 'Play preview'}</button>` : ''}
              ${it.url ? `<button class="btn btn-small btn-ghost" data-open="${esc(it.url)}">Apple Music</button>` : ''}
              <button class="btn btn-small btn-ghost" data-rm="${idx}" aria-label="Remove ${esc(it.title)}">Remove</button>
            </div>
          </div>
          <div class="rs-match">
            <label><span>Sounds like</span>
              <select class="select rs-style" data-ov="${idx}">${styleOptions(it, m)}</select></label>
            ${g && !m.manual && m.reasons.length ? `<span class="meta">Based on: ${esc(m.reasons.slice(0, 3).join(', '))}</span>` : ''}${m.manual ? '<span class="meta">Set by you</span>' : ''}
          </div>
          <div class="rs-facts">${facts}${status}</div>
          <input class="input rs-note" data-note="${idx}" value="${esc(it.note)}" placeholder="What do you like about it? (just for you, never added to prompts)" />
        </div>
      </li>`;
    }).join('')}</ol>`;
  }

  function togglePreview(it) {
    groove.stop(); playingGrid = null;
    if (rsAudio) { rsAudio.pause(); }
    if (rsPlayingKey === it.key) { rsPlayingKey = null; renderRsItems(); return; }
    rsAudio = new Audio(it.preview);
    rsAudio.volume = 0.8;
    rsAudio.addEventListener('ended', () => { rsPlayingKey = null; renderRsItems(); });
    rsAudio.play().then(() => { rsPlayingKey = it.key; renderRsItems(); }).catch(() => toast("Preview couldn't play. Check your connection."));
  }
  function stopPreview() { if (rsAudio) rsAudio.pause(); rsPlayingKey = null; }

  // ----- prompt directions -----
  function promptText(s, tab) {
    const pick = (r, l) => (r.fields.find((f) => f.label === l) || {}).value || '';
    if (tab === 'simple') return pick(E.sunoSimple(s), 'Song description');
    if (tab === 'yue') return pick(E.yue2(s), 'Style prompt');
    const r = E.sunoAdvanced(s);
    const ex = pick(r, 'Exclude styles');
    return pick(r, 'Styles') + (ex ? `\n\nExclude styles: ${ex}` : '');
  }
  const TAB_NAME = { simple: 'Suno Simple', advanced: 'Suno Advanced', yue: 'YuE2' };

  function factsFor(p) {
    const vt = V.vocalTypes.find((v) => v.id === p.vocal);
    return [
      `${p.bpm} BPM${p.measuredBpm ? '' : ' (typical)'}`,
      vt ? vt.label : '',
      p.era || '',
      (p.moods || []).join(', ')
    ].filter(Boolean).map((x) => `<span class="kw">${esc(x)}</span>`).join('');
  }

  function renderRsPrompts() {
    const box = $('#rsPrompts'); if (!box) return;
    rsUI.variants = R.variants(rs.items);
    const vs = rsUI.variants;
    if (rsUI.preview && rsUI.preview.src === 'variant') {
      const same = vs.find((v) => v.id === rsUI.preview.id);
      rsUI.preview = same && !rsUI.preview.auto ? { src: 'variant', id: same.id, title: same.title, patch: same.patch } : null;
    }
    if (!rsUI.preview && rsUI.autoPreview && vs.length) rsUI.preview = { src: 'variant', id: vs[0].id, title: vs[0].title, patch: vs[0].patch, auto: true };
    if (!vs.length) { box.innerHTML = '<p class="empty">Add at least one reference to see prompt directions.</p>'; return; }
    const pinnedSigs = new Set(rs.pinned.map((p) => p.sig));
    box.innerHTML = `<div class="vlist">${vs.map((v) => {
      const s = stateFor(v.patch);
      const text = promptText(s, rsUI.vtab);
      const on = rsUI.preview && rsUI.preview.src === 'variant' && rsUI.preview.id === v.id;
      const pinned = pinnedSigs.has(v.sig + '|' + rsUI.vtab);
      return `<article class="vcard${on ? ' is-previewing' : ''}" data-vid="${esc(v.id)}">
        <div class="vcard-head">
          <div><h3>${esc(v.title)}</h3><p class="meta">${esc(v.why)}</p></div>
          <button class="btn btn-small${on ? ' is-on' : ''}" data-vshow="${esc(v.id)}" aria-pressed="${on}">${on ? 'In the panel' : 'Show full prompt'}</button>
        </div>
        <div class="rs-facts">${factsFor(v.patch)}</div>
        <pre class="vtext">${esc(text)}</pre>
        <div class="row">
          <button class="btn btn-small" data-vcopy="${esc(v.id)}">Copy ${TAB_NAME[rsUI.vtab]} prompt</button>
          <button class="btn btn-small" data-vuse="${esc(v.id)}">Open in builder</button>
          <button class="btn btn-small btn-ghost${pinned ? ' is-pinned' : ''}" data-vpin="${esc(v.id)}" aria-pressed="${pinned}">${pinned ? 'Pinned' : 'Pin to research'}</button>
        </div>
      </article>`;
    }).join('')}</div>`;
  }

  function sigOf(v) { return v.sig + '|' + rsUI.vtab; }
  function pinVariant(v) {
    const sig = sigOf(v);
    const i = rs.pinned.findIndex((p) => p.sig === sig);
    if (i >= 0) { rs.pinned.splice(i, 1); toast('Unpinned'); }
    else {
      const s = stateFor(v.patch);
      const target = rsUI.vtab;
      rs.pinned.push({ id: Date.now(), sig, title: v.title, target, patch: structuredClone(v.patch), text: promptText(s, target), full: E.exportText(s, target), at: Date.now() });
      toast('Pinned to this research');
    }
    rsTouch();
  }

  function openInBuilder(patch) {
    const keep = { title: state.title, theme: state.theme, lyrics: state.lyrics, language: state.language, structure: state.structure,
      target: state.target, suno: state.suno, yue: state.yue, sounds: state.sounds };
    const p = structuredClone(patch); delete p.measuredBpm;
    state = Object.assign(structuredClone(DEFAULT), keep, p);
    rsUI.preview = null;
    setState({}, { silent: true });
    showView('build'); toast('Loaded into the builder');
  }

  function renderRsKeep() {
    const box = $('#rsKeep'); if (!box) return;
    const pins = rs.pinned.length ? `<ul class="pins">${rs.pinned.map((p) => {
      const on = rsUI.preview && rsUI.preview.src === 'pin' && rsUI.preview.id === p.id;
      return `<li class="pin${on ? ' is-previewing' : ''}">
        <div class="pin-head"><b>${esc(p.title)}</b><span class="meta">${TAB_NAME[p.target] || p.target}, pinned ${esc(new Date(p.at).toLocaleDateString())}</span></div>
        <pre class="vtext">${esc(p.text)}</pre>
        <div class="row">
          <button class="btn btn-small" data-pcopy="${p.id}">Copy</button>
          <button class="btn btn-small" data-pshow="${p.id}">${on ? 'In the panel' : 'Show full prompt'}</button>
          <button class="btn btn-small" data-puse="${p.id}">Open in builder</button>
          <button class="btn btn-small btn-ghost" data-punpin="${p.id}">Unpin</button>
        </div></li>`;
    }).join('')}</ul>` : '<p class="meta" style="margin:0 0 14px">No pinned prompts yet. Use “Pin to research” on any direction above.</p>';
    box.innerHTML = `${pins}
      <div class="row">
        <button class="btn btn-primary" data-rsave="1">Save research</button>
        <button class="btn" data-rsaveas="1"${rs.id ? '' : ' hidden'}>Save as a copy</button>
        <button class="btn" data-rexport="1"${rs.items.length ? '' : ' disabled'}>Export as text</button>
      </div>`;
  }

  // ----- save / library -----
  function rsSave(asCopy) {
    if (!rs.items.length && !rs.notes.trim()) { toast('Add a reference or a note before saving'); return; }
    const lib = rsLib(); const now = Date.now();
    if (!rs.name.trim()) rs.name = autoName();
    let rec = !asCopy && rs.id ? lib.find((x) => x.id === rs.id) : null;
    if (asCopy && rs.id) rs.name = rs.name.replace(/( \(copy\))?$/, ' (copy)');
    if (!rec) { rs.id = now; rec = { id: now, created: now }; lib.unshift(rec); }
    Object.assign(rec, { name: rs.name, updated: now, items: structuredClone(rs.items), notes: rs.notes, pinned: structuredClone(rs.pinned) });
    store.set('sps.research', lib.slice(0, 200));
    rs.savedAt = now; rs.dirty = false; rsSaveDraft();
    const n = $('#rsName'); if (n) n.value = rs.name;
    updateRsStatus(); updateRsCount(); renderRsKeep();
    const seg = $('[data-rtab="lib"]'); if (seg) seg.textContent = `Saved research (${rsLib().length})`;
    toast(asCopy ? 'Saved as a copy' : 'Research saved');
  }

  function confirmDiscard() {
    return !(rs.dirty && rs.items.length) || window.confirm('This research has unsaved changes. Continue without saving them?');
  }

  function openResearch(rec) {
    stopPreview();
    rs = Object.assign(blankResearch(), structuredClone(rec), { savedAt: rec.updated, dirty: false });
    delete rs.created; delete rs.updated;
    rsUI.tab = 'work'; rsUI.preview = null; rsUI.autoPreview = true;
    rsSaveDraft(); renderResearch(); renderOutput(); $('#main').scrollTop = 0;
    toast(`Opened ${rs.name}`);
  }

  function researchText(r) {
    const lines = [`# ${r.name || 'Prompt research'}`, '', `Saved ${new Date(r.updated || Date.now()).toLocaleString()}`, '', '## References', ''];
    r.items.forEach((it) => {
      const m = R.matchItem(it); const e = it.enrich || {};
      lines.push(`- ${it.title} (${KIND[it.kind]}${it.main ? ', main reference' : ''}): ${subline(it)}`);
      lines.push(`  Style: ${m.genre ? R.label(m.genre, m.micro) : 'unmatched'}${m.manual ? ' (set by you)' : ''}. Store genre: ${it.genre || 'n/a'}.${e.bpm ? ` Tempo: ${e.bpm} BPM.` : ''}`);
      if (e.tags && e.tags.length) lines.push(`  Tags: ${e.tags.slice(0, 8).map((t) => t.name).join(', ')}`);
      if (it.note) lines.push(`  Note: ${it.note}`);
    });
    if (r.notes && r.notes.trim()) lines.push('', '## Notes', '', r.notes.trim());
    if (r.pinned.length) {
      lines.push('', '## Pinned prompts');
      r.pinned.forEach((p) => lines.push('', `### ${p.title} (${TAB_NAME[p.target] || p.target})`, '', p.full || p.text));
    }
    const vs = R.variants(r.items);
    if (vs.length) {
      lines.push('', '## All prompt directions (Suno Advanced styles)');
      vs.forEach((v) => lines.push('', `### ${v.title}`, v.why, '', promptText(stateFor(v.patch), 'advanced')));
    }
    return lines.join('\n');
  }

  function renderRsLibrary() {
    const box = $('#rsLibView'); if (!box) return;
    const lib = rsLib();
    box.innerHTML = lib.length ? `<ul class="lib">${lib.map((r) => {
      const arts = r.items.slice(0, 4).map((i) => artTile(i, ' rs-art-s')).join('');
      const styles = [...new Set(r.items.map((i) => { const m = R.matchItem(i); return m.genre ? R.label(m.genre, m.micro) : ''; }).filter(Boolean))].slice(0, 3);
      return `<li class="lib-row${r.id === rs.id ? ' is-current' : ''}">
        <div class="lib-arts">${arts || '<span class="rs-art rs-art-s rs-art-blank">?</span>'}</div>
        <div class="lib-body">
          <b>${esc(r.name)}</b>${r.id === rs.id ? ' <span class="kw">Open now</span>' : ''}
          <span class="meta">${r.items.length} reference${r.items.length === 1 ? '' : 's'}, ${r.pinned.length} pinned prompt${r.pinned.length === 1 ? '' : 's'}. Updated ${esc(new Date(r.updated).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }))}</span>
          ${styles.length ? `<span class="meta">Styles: ${esc(styles.join(', '))}</span>` : ''}
        </div>
        <div class="row lib-acts">
          <button class="btn btn-small btn-primary" data-lopen="${r.id}">Open</button>
          <button class="btn btn-small" data-ldup="${r.id}">Duplicate</button>
          <button class="btn btn-small" data-lexp="${r.id}">Export</button>
          <button class="btn btn-small btn-ghost" data-ldel="${r.id}">Delete</button>
        </div></li>`;
    }).join('')}</ul>` : '<p class="empty">No saved research yet. Collect a few references under “This research” and press Save research.</p>';
  }

  function bindResearch() {
    const root = $('#view-research');

    root.addEventListener('input', (e) => {
      const t = e.target;
      if (t.id === 'rsQ') { rsUI.q = t.value; rsUI.open = true; rsUI.active = -1; runSearch(); return; }
      if (t.id === 'rsName') { rs.name = t.value; rs.dirty = true; rsSaveDraft(); updateRsStatus(); return; }
      if (t.id === 'rsNotes') { rs.notes = t.value; rs.dirty = true; rsSaveDraft(); updateRsStatus(); return; }
      if (t.dataset.note !== undefined) { rs.items[+t.dataset.note].note = t.value; rs.dirty = true; rsSaveDraft(); updateRsStatus(); }
    });

    root.addEventListener('keydown', (e) => {
      if (e.target.id !== 'rsQ') return;
      const n = rsUI.results.length;
      if (e.key === 'ArrowDown') { e.preventDefault(); rsUI.open = true; if (n) rsUI.active = (rsUI.active + 1) % n; renderSuggest(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (n) rsUI.active = (rsUI.active - 1 + n) % n; renderSuggest(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (rsUI.open && rsUI.active >= 0) addItem(rsUI.results[rsUI.active]); }
      else if (e.key === 'Escape') { if (rsUI.open) { e.preventDefault(); rsUI.open = false; renderSuggest(); } }
    });
    root.addEventListener('focusin', (e) => { if (e.target.id === 'rsQ' && rsUI.q.trim().length >= 2) { rsUI.open = true; renderSuggest(); } });
    root.addEventListener('focusout', (e) => {
      if (e.target.id === 'rsQ') setTimeout(() => { if (!root.contains(document.activeElement) || document.activeElement.id !== 'rsQ') { rsUI.open = false; renderSuggest(); } }, 120);
    });
    // mousedown keeps focus in the search box so several results can be added in a row
    root.addEventListener('mousedown', (e) => {
      const o = e.target.closest('.rs-opt'); if (!o) return;
      e.preventDefault(); addItem(rsUI.results[+o.dataset.ri]); rsUI.active = +o.dataset.ri; renderSuggest();
    });
    root.addEventListener('mousemove', (e) => {
      const o = e.target.closest('.rs-opt'); if (!o || +o.dataset.ri === rsUI.active) return;
      rsUI.active = +o.dataset.ri;
      $$('.rs-opt', root).forEach((x) => { const on = x === o; x.classList.toggle('is-active', on); x.setAttribute('aria-selected', String(on)); });
      $('#rsQ').setAttribute('aria-activedescendant', o.id);
    });

    root.addEventListener('change', (e) => {
      const t = e.target;
      if (t.dataset.ov !== undefined) {
        const it = rs.items[+t.dataset.ov];
        const [gid, mid] = t.value.split('/');
        it.override = t.value ? { genre: gid, micro: mid || null } : null;
        rsTouch();
      }
    });

    root.addEventListener('click', async (e) => {
      const t = e.target.closest('button'); if (!t) return;
      const d = t.dataset;
      if (d.rtab) { rsUI.tab = d.rtab; stopPreview(); renderResearch(); renderOutput(); return; }
      if (d.rtype) { rsUI.type = d.rtype; $$('[data-rtype]', root).forEach((b) => { const on = b === t; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); }); rsUI.open = true; runSearch(); $('#rsQ').focus(); return; }
      if (d.recent) { rsUI.q = d.recent; $('#rsQ').value = d.recent; rsUI.open = true; runSearch(); $('#rsQ').focus(); return; }
      if (t.id === 'rsSave' || d.rsave) { rsSave(false); return; }
      if (d.rsaveas) { rsSave(true); return; }
      if (t.id === 'rsNew') {
        if (!confirmDiscard()) return;
        stopPreview(); rs = blankResearch(); rsUI.q = ''; rsUI.results = []; rsUI.preview = null; rsUI.autoPreview = true; rsUI.tab = 'work';
        rsSaveDraft(); renderResearch(); renderOutput(); toast('Started new research'); $('#rsQ').focus(); return;
      }
      if (d.rexport) { const r = Object.assign({}, rs, { name: rs.name || autoName(), updated: Date.now() }); const res = await api.saveText(r.name, researchText(r)); if (res && res.saved) toast('Exported'); return; }
      if (d.main !== undefined) { const i = +d.main; rs.items.forEach((x, k) => { x.main = k === i ? !x.main : false; }); rsTouch(); return; }
      if (d.prev !== undefined) { togglePreview(rs.items[+d.prev]); return; }
      if (d.rm !== undefined) { const it = rs.items[+d.rm]; if (rsPlayingKey === it.key) stopPreview(); rs.items.splice(+d.rm, 1); if (rs.items.length && !rs.items.some((x) => x.main)) rs.items[0].main = true; rsTouch(); toast(`Removed ${it.title}`); return; }
      if (d.open) { api.openExternal(d.open); return; }
      if (d.vtab) { rsUI.vtab = d.vtab; setState({ target: d.vtab }, { outputOnly: true }); $$('[data-vtab]', root).forEach((b) => { const on = b === t; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); }); renderRsPrompts(); return; }
      const v = rsUI.variants.find((x) => x.id === (d.vshow || d.vcopy || d.vuse || d.vpin));
      if (v && d.vshow) { rsUI.preview = { src: 'variant', id: v.id, title: v.title, patch: v.patch }; rsUI.autoPreview = true; renderRsPrompts(); renderRsKeep(); renderOutput(); return; }
      if (v && d.vcopy) { copy(promptText(stateFor(v.patch), rsUI.vtab), `${TAB_NAME[rsUI.vtab]} prompt copied`); return; }
      if (v && d.vuse) { openInBuilder(v.patch); return; }
      if (v && d.vpin) { pinVariant(v); return; }
      const p = rs.pinned.find((x) => x.id === +(d.pcopy || d.pshow || d.puse || d.punpin));
      if (p && d.pcopy) { copy(p.text, 'Prompt copied'); return; }
      if (p && d.pshow) { rsUI.preview = { src: 'pin', id: p.id, title: p.title, patch: p.patch }; renderRsPrompts(); renderRsKeep(); renderOutput(); return; }
      if (p && d.puse) { openInBuilder(p.patch); return; }
      if (p && d.punpin) { rs.pinned = rs.pinned.filter((x) => x !== p); if (rsUI.preview && rsUI.preview.src === 'pin' && rsUI.preview.id === p.id) rsUI.preview = null; rsTouch(); toast('Unpinned'); return; }
      const lib = rsLib();
      const rec = lib.find((x) => x.id === +(d.lopen || d.ldup || d.lexp || d.ldel));
      if (rec && d.lopen) { if (rec.id !== rs.id && !confirmDiscard()) return; openResearch(rec); return; }
      if (rec && d.ldup) {
        const now = Date.now();
        lib.unshift(Object.assign(structuredClone(rec), { id: now, created: now, updated: now, name: rec.name + ' (copy)' }));
        store.set('sps.research', lib); updateRsCount(); renderResearch(); toast('Duplicated'); return;
      }
      if (rec && d.lexp) { const res = await api.saveText(rec.name, researchText(rec)); if (res && res.saved) toast('Exported'); return; }
      if (rec && d.ldel) {
        if (!window.confirm(`Delete “${rec.name}”? This can't be undone.`)) return;
        store.set('sps.research', lib.filter((x) => x.id !== rec.id));
        if (rs.id === rec.id) { rs.id = null; rs.savedAt = null; rs.dirty = true; rsSaveDraft(); }
        updateRsCount(); renderResearch(); toast('Deleted');
      }
    });
  }

  // ---------- views ----------
  function showView(v) {
    view = v;
    groove.stop(); playingGrid = null;
    if (v !== 'research') stopPreview();
    if (v === 'explore') exploreGenre = state.genre;
    $$('.rail-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.view === v));
    $$('.view').forEach((s) => s.classList.toggle('is-active', s.id === 'view-' + v));
    $('#main').scrollTop = 0;
    ({ build: renderBuild, explore: renderExplore, research: renderResearch, lyrics: renderLyrics, examples: renderExamples, glossary: () => renderGlossary(), saved: renderSaved })[v]();
    renderOutput();
  }

  function init() {
    $$('.rail-btn').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));
    const tips = $('#tipsToggle');
    tips.checked = store.get('sps.tips', true);
    document.body.classList.toggle('no-tips', !tips.checked);
    tips.addEventListener('change', () => { document.body.classList.toggle('no-tips', !tips.checked); store.set('sps.tips', tips.checked); });
    if (!state.palette.length) { const g = GI[state.genre]; state.palette = g.instruments.slice(0, 3); }
    bindBuild(); bindOutput(); bindExplore(); bindLyrics(); bindExamples(); bindSaved(); bindResearch();
    updateSavedCount(); updateRsCount();
    showView('build');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
