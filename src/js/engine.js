/* Prompt engine: turns builder state into Suno (Simple / Advanced / Sounds) and YuE2 outputs.
 * Rules implemented from:
 *  - YuE2 prompting guide (songcreator.pro): comma tags, genre first, 5 ingredients, language tag,
 *    "no X" negatives, strict [Section] lyrics, nothing unsingable, choruses written out, blank lines,
 *    ~4-6 lines per section, matched syllables on repeats, empty [Intro] for instrumental openings,
 *    planning mode Full, generate 2-4 candidates.
 *  - WildSongBench English prompts: layered tags (genre, instruments, mood, tempo, vocal, production).
 *  - Suno v6 Create: Simple description; Advanced Styles/Lyrics/Exclude/Vocal Gender/Weirdness/
 *    Style Influence/Variety/Max Mode/model; Sounds One-Shot or Loop with BPM and Key.
 */
(function () {
  const V = () => window.VOCAB;
  const G = (id) => window.GENRE_INDEX[id];

  const PARENT_TAG = {
    pop: 'pop', hiphop: 'hip-hop', rnb: 'R&B', edm: 'EDM', house: 'house', techno: 'techno', bass: 'drum and bass',
    rock: 'rock', metal: 'metal', punk: 'punk rock', country: 'country', folk: 'acoustic folk', jazz: 'jazz', blues: 'blues',
    latin: 'latin pop', caribbean: 'reggae', african: 'afrobeats', funk: 'funk', chill: 'lo-fi chill',
    cinematic: 'cinematic orchestral', gospel: 'gospel', kids: "children's music"
  };

  const uniq = (arr) => {
    const seen = new Set(); const out = [];
    arr.forEach((x) => {
      const v = String(x || '').trim(); if (!v) return;
      const k = v.toLowerCase(); if (seen.has(k)) return; seen.add(k); out.push(v);
    });
    return out;
  };
  const listText = (arr) => arr.length <= 1 ? (arr[0] || '') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  const cap = (s) => s ? s[0].toUpperCase() + s.slice(1) : s;
  const article = (w) => /^(eu|uni|use|one|ukulele)/i.test(w) ? 'A' : (/^[aeiou]/i.test(w) || /^(r&b|edm|8)/i.test(w) ? 'An' : 'A');

  function genreInfo(state) {
    const g = G(state.genre);
    const micro = g && state.micro ? g.micro.find((m) => m.id === state.micro) : null;
    let blend = null;
    if (state.blend && state.blend.genre) {
      const bg = G(state.blend.genre);
      const bm = bg && state.blend.micro ? bg.micro.find((m) => m.id === state.blend.micro) : null;
      if (bg) blend = { g: bg, m: bm, name: bm ? bm.name : bg.name, tag: bm ? bm.name : PARENT_TAG[bg.id] };
    }
    return { g, micro, blend, name: micro ? micro.name : (g ? g.name : 'Pop'), tag: micro ? micro.name : PARENT_TAG[state.genre] || 'pop' };
  }

  function vocalInfo(state) {
    const vt = V().vocalTypes.find((v) => v.id === state.vocal) || V().vocalTypes[0];
    const instrumental = vt.id === 'none';
    const tones = state.tones || [];
    let phrase = '';
    if (!instrumental) phrase = uniq([...tones]).join(', ') + (tones.length ? ' ' : '') + vt.tag;
    return { vt, instrumental, tones, phrase: phrase.trim(), gender: vt.gender };
  }

  function tempoWords(state) {
    const e = V().energy[state.energy ?? 2];
    return { label: e.label, word: e.words.split(',')[0].trim(), bpm: state.bpm };
  }

  // ---------- style tags ----------
  function styleTags(state, opts = {}) {
    const { g, micro, blend, tag } = genreInfo(state);
    const v = vocalInfo(state);
    const t = tempoWords(state);
    const palette = state.palette || [];
    const moods = state.moods || [];
    const prod = state.production || [];
    const extra = (state.extra || '').split(',').map((s) => s.trim()).filter(Boolean);
    const tags = [];
    tags.push(tag);
    if (micro && opts.withParent) tags.push(PARENT_TAG[g.id]);
    if (blend) tags.push(blend.tag);
    tags.push(...palette);
    tags.push(...moods);
    tags.push(t.word, `${t.bpm} BPM`);
    tags.push(v.instrumental ? 'instrumental' : v.phrase);
    tags.push(...prod);
    if (state.era) tags.push(`${state.era} production`);
    if (state.key && !/^Auto/.test(state.key)) tags.push(state.key.replace(/ \(.+\)/, ' key'));
    if (state.language && state.language !== 'English' && !v.instrumental) tags.push(`${state.language} lyrics`);
    tags.push(...extra);
    return uniq(tags);
  }

  // ---------- warnings shared ----------
  function blendWarning(state) {
    const { g, blend } = genreInfo(state);
    if (g && blend && Math.abs((g.energy || 3) - (blend.g.energy || 3)) >= 3) {
      return `"${genreInfo(state).name}" and "${blend.name}" pull in opposite directions. Lead with one and keep the other as a light influence, or pick an established hybrid.`;
    }
    return null;
  }

  // ---------- SUNO SIMPLE ----------
  function sunoSimple(state) {
    const { name, blend, micro, g } = genreInfo(state);
    const v = vocalInfo(state);
    const t = tempoWords(state);
    const moods = (state.moods || []).slice(0, 2);
    const palette = (state.palette || []).slice(0, 4);
    const s = [];
    const moodTxt = moods.length ? moods.join(' and ') + ' ' : '';
    const lead = moodTxt ? article(moodTxt) : article(name);
    s.push(`${lead} ${moodTxt}${name}${blend ? ` song with ${blend.name} influences` : (v.instrumental ? ' instrumental' : ' song')} at around ${t.bpm} BPM with a ${t.word} feel.`);
    if (palette.length) s.push(`Built on ${listText(palette)}.`);
    if (v.instrumental) s.push('No vocals, fully instrumental.');
    else s.push(`${cap(v.phrase)}s${state.language && state.language !== 'English' ? `, sung in ${state.language}` : ''}.`);
    if (state.theme) s.push(`About ${state.theme.replace(/\.$/, '')}.`);
    const prod = (state.production || []).slice(0, 3);
    if (prod.length || state.era) s.push(`Production: ${[...prod, state.era ? `${state.era} feel` : ''].filter(Boolean).join(', ')}.`);
    const ex = uniq(state.exclude || []).slice(0, 3);
    if (ex.length) s.push(`No ${listText(ex)}.`);
    const text = s.join(' ');
    const warnings = [];
    if (text.length > 450) warnings.push('Long descriptions can blur the result. Try trimming to the details that matter most.');
    if (!micro && g) warnings.push('Tip: pick a micro-genre for a more distinctive, targeted result.');
    const bw = blendWarning(state); if (bw) warnings.push(bw);
    return {
      fields: [
        { label: 'Song description', value: text, hint: 'Paste into the Simple mode description box.' }
      ],
      settings: [
        ['Mode', 'Simple'],
        ['Instrumental toggle', v.instrumental ? 'On' : 'Off'],
        ['Model', recommendModel(state).value]
      ],
      warnings
    };
  }

  // ---------- SUNO ADVANCED ----------
  function recommendModel(state) {
    const { blend } = genreInfo(state);
    if (state.suno && state.suno.stage === 'draft') return { value: 'v6-mini', why: 'Fast and light for trying ideas.' };
    if (blend || (state.suno && state.suno.experimental)) return { value: 'v6-wild', why: 'More varied; good for blends and surprises.' };
    return { value: 'v6', why: 'Flagship model; most precise when you know what you want.' };
  }

  function sunoAdvanced(state) {
    const { micro, blend } = genreInfo(state);
    const v = vocalInfo(state);
    let tags = styleTags(state, { withParent: true });
    let styles = tags.join(', ');
    const warnings = [];
    if (styles.length > 1000) {
      while (styles.length > 1000 && tags.length > 4) { tags = tags.slice(0, -1); styles = tags.join(', '); }
      warnings.push('Styles were trimmed to fit 1,000 characters. The most important tags were kept (they come first).');
    }
    const lyr = buildLyricsFor('suno', state);
    warnings.push(...lyr.warnings);
    const bw = blendWarning(state); if (bw) warnings.push(bw);

    const niche = !!micro && !blend;
    const weird = blend ? 55 : niche ? 35 : 45;
    const styleInf = niche ? 75 : blend ? 65 : 60;
    const release = state.suno && state.suno.stage === 'release';
    const model = recommendModel(state);
    const exclude = uniq([...(micro ? micro.exclude : []), ...(state.exclude || [])]);

    const fields = [
      { label: 'Title', value: state.title || '', hint: state.title ? '' : 'Optional. Add your song title in the builder.' },
      { label: 'Styles', value: styles, hint: 'Paste into the Styles box. Most important tags are first.', count: 1000 },
      { label: 'Lyrics', value: lyr.text, hint: lyr.hint, mono: true }
    ];
    if (lyr.brief) fields.push({ label: 'Lyrics brief', value: lyr.brief, hint: 'Paste into Suno\'s lyrics writer (or any writing assistant) to draft lyrics, then paste them back into the builder.' });
    fields.push({ label: 'Exclude styles', value: exclude.join(', '), hint: 'Paste into More Options → Exclude styles.' });

    const settings = [
      ['Mode', 'Advanced'],
      ['Model', `${model.value}`, model.why + (model.value !== 'v6-mini' ? ' Listed for Pro and Premier plans.' : '')],
      ['Vocal Gender', v.instrumental ? 'Leave unset' : (v.gender || 'Leave unset'), v.instrumental ? 'Instrumental is set by the empty/instrumental lyrics.' : ''],
      ['Instrumental', v.instrumental ? 'On' : 'Off'],
      ['Weirdness', `${weird}%`, niche ? 'Lower keeps a micro-genre on target.' : blend ? 'A little higher lets the blend find its own shape.' : 'Balanced.'],
      ['Style Influence', `${styleInf}%`, niche ? 'Higher so Suno sticks closely to your micro-genre tags.' : 'Moderate.'],
      ['Variety', niche ? 'Low' : 'Default', niche ? 'Lower gives tighter control over your style tags.' : ''],
      ['Max Mode', release ? 'On' : 'Off', release ? 'Worth the extra credits for a full-length release take.' : 'Save credits while drafting.'],
      ['Duration', state.instrumentalLong ? '3:30–4:30' : '2:45–3:30', 'A common streaming-friendly length. Set in More Options if available.']
    ];
    return { fields, settings, warnings };
  }

  // ---------- SUNO SOUNDS ----------
  function sunoSounds(state) {
    const { micro, g, name } = genreInfo(state);
    const s = state.sounds || {};
    const type = V().soundTypes.find((t) => t.id === s.type) || V().soundTypes[0];
    const loop = s.kind ? s.kind === 'Loop' : ['loop-drum', 'melodic', 'bass', 'ambience'].includes(type.id);
    const sig = (state.palette || []).slice(0, 2);
    const moods = (state.moods || []).slice(0, 1);
    const prod = (state.production || []).slice(0, 1);
    let desc = (s.desc || '').trim();
    if (!desc) {
      const genreWord = name.toLowerCase();
      const bass = sig.find((x) => /bass|808/i.test(x));
      const bits = {
        'drum': `punchy drum hit for a ${genreWord} track`,
        'loop-drum': `${genreWord} drum loop${sig.length ? `, ${sig[0]}` : ''}`,
        'bass': `${bass || 'bass line'} loop for a ${genreWord} track`,
        'melodic': `chord loop for a ${genreWord} track${sig.length ? `, ${sig.join(', ')}` : ''}`,
        'vocal': `short pitched vocal chop for a ${genreWord} track`,
        'fx': `riser building tension into a ${genreWord} drop`,
        'ambience': `${moods[0] || 'atmospheric'} ambience texture for a ${genreWord} intro`,
        'foley': 'vinyl needle drop and crackle'
      };
      desc = bits[type.id];
    }
    const full = uniq([desc, ...moods, ...prod]).join(', ');
    const needsKey = ['bass', 'melodic', 'vocal'].includes(type.id);
    const warnings = [];
    if (!s.desc) warnings.push('Auto-described from your builder settings. Write your own in the box above for exact results: describe physical qualities (length, attack, space, texture).');
    return {
      fields: [{ label: 'Sound description', value: full, hint: 'Paste into the Sounds tab description.' }],
      settings: [
        ['Mode', 'Sounds'],
        ['Type', loop ? 'Loop' : 'One-Shot'],
        ['BPM', loop ? String(s.bpm || state.bpm) : 'Not needed for one-shots'],
        ['Key', needsKey ? (s.key || suggestKey(state)) : 'Not needed for this sound type']
      ],
      warnings
    };
  }

  function suggestKey(state) {
    if (state.key && /(major|minor)$/i.test(state.key) && !/\(/.test(state.key)) return state.key;
    const dark = (state.moods || []).some((m) => /dark|melanch|sad|eerie|myster|aggress|heartbroken|anxious/.test(m));
    return dark || /minor/i.test(state.key || '') ? 'A minor' : 'C major';
  }

  // ---------- YuE2 ----------
  function yueTags(state) {
    const { micro, blend, tag, g } = genreInfo(state);
    const v = vocalInfo(state);
    const lang = state.language || 'English';
    const out = [];
    const genrePart = [tag];
    if (blend) genrePart.push(blend.tag);
    const instr = (state.palette || []).slice(0, 4);
    const moods = (state.moods || []).slice(0, 2);
    const vocalPart = [];
    if (!v.instrumental) {
      const gTag = v.vt.id === 'duet' ? 'male and female duet' : v.vt.id === 'choir' ? 'choir' : v.vt.tag;
      vocalPart.push(gTag);
      (v.tones || []).slice(0, 2).forEach((t) => vocalPart.push(`${t} vocal`));
    }
    const tempo = [`${state.bpm} BPM`];
    const lead = (state.yue && state.yue.lead) || 'genre';
    if (lang !== 'English' && !v.instrumental) out.push(lang);
    if (lead === 'vocal') out.push(...vocalPart, ...genrePart); else out.push(...genrePart);
    out.push(...instr, ...moods);
    if (lead !== 'vocal') out.push(...vocalPart);
    out.push(...tempo);
    const prod = (state.production || [])[0]; if (prod) out.push(prod);
    const negatives = uniq(state.exclude || []).slice(0, 2).map((x) => `no ${x.replace(/^no\s+/i, '')}`);
    out.push(...negatives);
    return uniq(out);
  }

  function yue2(state) {
    const v = vocalInfo(state);
    const tags = yueTags(state);
    const lyr = buildLyricsFor('yue', state);
    const warnings = [...lyr.warnings];
    const lang = state.language || 'English';
    if (!V().yueLanguages.includes(lang) && !v.instrumental) {
      warnings.push(`YuE2 sings English, Mandarin and Japanese. For ${lang}, use Suno instead.`);
    }
    const bw = blendWarning(state); if (bw) warnings.push(bw);
    const styleStr = tags.join(', ');
    const raw = `Generate music from the given user prompt. [Tags] ${styleStr} [start_of_user_prompt] ${lyr.text.replace(/\n+/g, ' ').trim()}`;
    return {
      fields: [
        { label: 'Style prompt', value: styleStr, hint: 'Short, concrete, comma-separated. Earlier tags carry more weight.' },
        { label: 'Lyrics', value: lyr.text, hint: lyr.hint, mono: true },
        ...(lyr.brief ? [{ label: 'Lyrics brief', value: lyr.brief, hint: 'YuE2 needs real lyrics to sing. Use this brief to write them, then paste them into the builder.' }] : []),
        { label: 'Benchmark-format prompt', value: raw, hint: 'The single-string format used by WildSongBench records. Most apps use the two fields above instead.', collapsed: true }
      ],
      settings: [
        ['Model', 'YuE2'],
        ['Planning mode', 'Full', 'Plans melody and chords first. Best for original songs.'],
        ['Batch size', String((state.yue && state.yue.batch) || 3), 'Generate several takes and keep the best. The biggest quality boost available.'],
        ['Language', v.instrumental ? 'n/a' : lang]
      ],
      warnings
    };
  }

  // ---------- LYRICS ----------
  const HEADER = /^(intro|verse|pre[- ]?chorus|prechorus|post[- ]?chorus|chorus|final chorus|hook|refrain|bridge|outro|interlude|instrumental(?: break| solo)?|break|breakdown|drop|build[- ]?up|buildup|build|guitar solo|sax solo|piano solo|solo|rap(?: verse)?|spoken(?: word)?|end|coda|climax|main theme)\b/i;

  function yueLabel(name, hasLines) {
    const n = name.toLowerCase();
    if (/^intro/.test(n)) return 'Intro';
    if (/^(pre[- ]?chorus|prechorus)/.test(n)) return 'Pre-Chorus';
    if (/^(post[- ]?chorus|chorus|final chorus|hook|refrain)/.test(n)) return 'Chorus';
    if (/^bridge/.test(n)) return 'Bridge';
    if (/^(outro|end|coda)/.test(n)) return 'Outro';
    if (/^(build)/.test(n)) return hasLines ? 'Pre-Chorus' : 'Interlude';
    if (/^(rap|spoken|verse)/.test(n)) return 'Verse';
    if (/^(climax|main theme)/.test(n)) return hasLines ? 'Chorus' : 'Interlude';
    return 'Interlude';
  }

  // Instrumentals: the YuE2 guide recommends normal labels ([Verse], [Chorus]...) left empty.
  function yueInstrLabel(name) {
    const n = name.toLowerCase();
    if (/main theme/.test(n)) return 'Verse';
    if (/climax|drop/.test(n)) return 'Chorus';
    if (/build/.test(n)) return 'Pre-Chorus';
    if (/breakdown/.test(n)) return 'Bridge';
    return yueLabel(name, true);
  }

  function titleCase(s) { return s.replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/-([a-z])/g, (m, c) => '-' + c.toUpperCase()); }

  function detectHeader(line) {
    let inner = null; let bracket = false;
    let m = line.match(/^\s*[\[【［]\s*(.+?)\s*[\]】］]\s*$/);
    if (m) { inner = m[1]; bracket = true; }
    if (!inner) { m = line.match(/^\s*[(（]\s*(.+?)\s*[)）]\s*:?\s*$/); if (m && HEADER.test(m[1].trim())) inner = m[1]; }
    if (!inner) {
      m = line.match(/^\s*([A-Za-z][A-Za-z -]*?)(\s*\d+)?\s*(?:[-–:]\s*(.*?))?\s*:?\s*$/);
      if (m && HEADER.test(m[1].trim()) && m[1].trim().split(/\s+/).length <= 3) {
        const test = (m[1] + (m[2] || '')).trim();
        // Must be the whole line (e.g. "Verse 1:", "Chorus"), not a lyric starting with a header word.
        if (line.trim().replace(/[:\s]+$/, '').length <= test.length + (m[3] ? m[3].length + 3 : 0) + 1) inner = line.trim().replace(/:$/, '');
      }
    }
    if (!inner) return null;
    const [namePart, ...rest] = inner.split(/[:：]| - | – /);
    let name = namePart.trim();
    let desc = rest.join(':').trim();
    let repeat = 1;
    const rx = name.match(/\s*[x×]\s*(\d)\s*$/i); if (rx) { repeat = +rx[1]; name = name.slice(0, rx.index).trim(); }
    const numM = name.match(/\s*(\d+)\s*$/); const num = numM ? +numM[1] : null;
    if (numM) name = name.slice(0, numM.index).trim();
    name = name.replace(/\s*[-–]\s*$/, '');
    if (HEADER.test(name)) return { kind: 'section', name: titleCase(name.toLowerCase()), num, desc, repeat };
    if (bracket) return { kind: 'cue', text: inner };
    return null;
  }

  const REPEAT_LINE = /^[(（\[]?\s*(repeat(?:\s+the)?\s+(chorus|hook|refrain)|repeat)\s*(?:[x×]\s*(\d))?\s*[)）\]]?$/i;
  const META_LINE = /^(title|song title|written by|lyrics by|words by|music by|composed by|artist|by)\s*[:：]/i;
  const PROD_WORDS = /(guitar|drum|bass|piano|synth|solo|beat|build|fade|pause|softly|whisper|instrumental|repeat|x\s*\d|sfx|sound of|riff|strings|choir|tempo|bpm|drop|breakdown|harmony|vocals?\b)/i;

  function parseLyrics(text) {
    const lines = String(text || '').replace(/\r/g, '').split('\n');
    const sections = []; const removed = []; let cur = null; let sawHeader = false; let anyLyric = false;
    lines.forEach((raw) => {
      const line = raw.trim();
      if (!line) { if (cur) cur.lines.push({ blank: true }); return; }
      if (!anyLyric && !sawHeader && (META_LINE.test(line) || /^[🎵🎶《"“].*[》"”🎵🎶]?$/.test(line) && line.length < 60 && !/[a-z]{3,}\s+[a-z]{3,}\s+[a-z]{3,}\s+[a-z]{3,}/i.test(line))) {
        removed.push(line); return;
      }
      if (META_LINE.test(line)) { removed.push(line); return; }
      if (REPEAT_LINE.test(line)) {
        const which = (line.match(/chorus|hook|refrain/i) || ['Chorus'])[0];
        const rep = +(line.match(/[x×]\s*(\d)/i) || [0, 1])[1];
        cur = { name: titleCase(which.toLowerCase()), num: null, desc: '', repeat: rep, lines: [], shorthand: true };
        sections.push(cur); sawHeader = true; return;
      }
      const h = detectHeader(line);
      if (h && h.kind === 'section') { cur = { ...h, lines: [] }; sections.push(cur); sawHeader = true; return; }
      if (h && h.kind === 'cue') {
        if (!cur) { cur = { name: null, implicit: true, lines: [] }; sections.push(cur); }
        cur.lines.push({ cue: h.text }); return;
      }
      if (!cur) { cur = { name: null, implicit: true, lines: [] }; sections.push(cur); }
      cur.lines.push({ text: line }); anyLyric = true;
    });

    // No headers at all: split into stanzas by blank lines and label them.
    let result = sections;
    if (!sawHeader && sections.length === 1 && sections[0].implicit) {
      const stanzas = []; let st = [];
      sections[0].lines.forEach((l) => { if (l.blank) { if (st.length) stanzas.push(st); st = []; } else st.push(l); });
      if (st.length) stanzas.push(st);
      const key = (s) => s.filter((l) => l.text).map((l) => l.text.toLowerCase()).join('|');
      const counts = {}; stanzas.forEach((s) => { counts[key(s)] = (counts[key(s)] || 0) + 1; });
      result = stanzas.map((s) => ({ name: counts[key(s)] > 1 ? 'Chorus' : 'Verse', num: null, desc: '', repeat: 1, lines: s, inferred: true }));
    } else {
      result.forEach((s) => { if (s.implicit) { s.name = 'Verse'; s.inferred = true; } });
    }

    // Trim blank lines, expand repeats and shorthand.
    const out = []; let expanded = 0;
    const lastWithLines = {};
    result.forEach((s) => {
      s.lines = s.lines.filter((l, i, arr) => !(l.blank && (i === 0 || i === arr.length - 1 || arr[i - 1].blank)));
      const key = yueLabel(s.name, true);
      const hasText = s.lines.some((l) => l.text);
      if (!hasText && ['Chorus', 'Pre-Chorus'].includes(key) && lastWithLines[key]) {
        s.lines = lastWithLines[key].map((l) => ({ ...l })); expanded++;
      }
      if (s.lines.some((l) => l.text)) lastWithLines[key] = s.lines;
      for (let r = 0; r < (s.repeat || 1); r++) {
        out.push({ ...s, lines: s.lines.map((l) => ({ ...l })), repeat: 1 });
        if (r > 0) expanded++;
      }
    });
    return { sections: out, removed, expanded };
  }

  function syllables(line) {
    const cjk = (line.match(/[\u3040-\u30ff\u3400-\u9fff]/g) || []).length;
    const words = line.replace(/[\u3040-\u30ff\u3400-\u9fff]/g, ' ').toLowerCase().match(/[a-z']+/g) || [];
    const count = words.reduce((n, w) => {
      w = w.replace(/'/g, '');
      if (!w) return n;
      if (w.length <= 3) return n + 1;
      w = w.replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, '').replace(/^y/, '');
      const m = w.match(/[aeiouy]{1,2}/g);
      return n + (m ? m.length : 1);
    }, 0);
    return count + cjk;
  }

  function cleanForYue(text, stripParens, removedOut) {
    let t = text;
    t = t.replace(/\[[^\]]*\]/g, (m) => { removedOut.push(m); return ' '; });
    if (stripParens) t = t.replace(/[(（][^)）]*[)）]/g, (m) => { removedOut.push(m); return ' '; });
    t = t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '');
    return t.replace(/\s{2,}/g, ' ').trim();
  }

  function formatYue(parsed, opts) {
    const removed = [...parsed.removed]; const lines = []; const warnings = [];
    const chorusSyl = {};
    let intro = false;
    parsed.sections.forEach((s, idx) => {
      const texts = [];
      s.lines.forEach((l) => {
        if (l.cue) { removed.push(`[${l.cue}]`); return; }
        if (l.blank) return;
        let text = l.text; let dup = 1;
        const xm = text.match(/\s*[x×]\s*(\d)\s*$/i); if (xm) { dup = +xm[1]; text = text.slice(0, xm.index); }
        const c = cleanForYue(text, opts.stripParens, removed);
        if (c) for (let i = 0; i < dup; i++) texts.push(c);
      });
      const label = yueLabel(s.name, texts.length > 0);
      if (label === 'Intro' && texts.length) intro = true;
      if (s.desc) removed.push(`${s.name}: ${s.desc}`);
      if (texts.length > 6) warnings.push(`[${label}] #${idx + 1} has ${texts.length} lines. YuE2 sections work best at 4–6 lines (roughly 30 seconds each).`);
      if (label === 'Chorus' && texts.length) {
        const syl = texts.map(syllables);
        if (chorusSyl.base) {
          const diff = syl.some((n, i) => chorusSyl.base[i] !== undefined && Math.abs(n - chorusSyl.base[i]) > 1);
          if (diff) warnings.push('A repeated chorus has different syllable counts than the first one. Keep repeats identical (or matched) so the melody fits.');
        } else chorusSyl.base = syl;
      }
      if (texts.some((x) => /\b\w{1,3}-\w{1,3}-\w{1,3}\b/.test(x))) warnings.push('Hyphenated syllable forcing (like "ne-ver-more") is unreliable in YuE2. Write words normally.');
      lines.push(`[${label}]`, ...texts, '');
    });
    if (intro) warnings.push('Your intro has lyrics. YuE2 does best starting with a verse or chorus; use an empty [Intro] for an instrumental opening.');
    if (parsed.expanded) warnings.push(`Wrote out ${parsed.expanded} repeated section${parsed.expanded > 1 ? 's' : ''} in full (YuE2 doesn't expand "repeat chorus" shorthand).`);
    const uniqRemoved = uniq(removed);
    if (uniqRemoved.length) warnings.push(`Removed ${uniqRemoved.length} non-sung item${uniqRemoved.length > 1 ? 's' : ''} (YuE2 would try to sing them): ${uniqRemoved.slice(0, 5).join('  ')}${uniqRemoved.length > 5 ? '  …' : ''}`);
    return { text: lines.join('\n').trim(), warnings };
  }

  function formatSuno(parsed) {
    const out = []; const counters = {}; const warnings = [];
    const total = parsed.sections.reduce((n, s) => { const k = s.name; n[k] = (n[k] || 0) + 1; return n; }, {});
    parsed.sections.forEach((s) => {
      counters[s.name] = (counters[s.name] || 0) + 1;
      const needNum = s.name === 'Verse' && total.Verse > 1;
      const num = s.num || (needNum ? counters[s.name] : null);
      out.push(`[${s.name}${num ? ' ' + num : ''}${s.desc ? ': ' + s.desc : ''}]`);
      s.lines.forEach((l) => {
        if (l.blank) return;
        if (l.cue) { out.push(`[${l.cue}]`); return; }
        // Parenthesized stage directions become [cues]; Suno treats (parentheses) as backing vocals.
        const t = l.text.replace(/[(（]([^)）]*)[)）]/g, (m, inner) => PROD_WORDS.test(inner) ? `[${inner.trim()}]` : `(${inner})`);
        out.push(t);
      });
      out.push('');
    });
    if (parsed.expanded) warnings.push(`Wrote out ${parsed.expanded} repeated section${parsed.expanded > 1 ? 's' : ''} in full for a reliable structure.`);
    return { text: out.join('\n').trim(), warnings };
  }

  function structureFor(state) {
    const { g } = genreInfo(state);
    const v = vocalInfo(state);
    let key = state.structure && state.structure !== 'auto' ? state.structure : (g ? g.structure : 'pop');
    if (v.instrumental && key === 'edm') key = 'edmInstrumental';
    else if (v.instrumental && (state.structure === 'auto' || !state.structure)) key = 'instrumental';
    if (!v.instrumental && key === 'instrumental' && (state.structure === 'auto' || !state.structure)) key = 'short';
    return V().structures[key] || V().structures.pop;
  }

  const LINES_PER = { 'Verse': 4, 'Pre-Chorus': 2, 'Build-Up': 2, 'Chorus': 4, 'Hook': 4, 'Final Chorus': 4, 'Bridge': 3, 'Outro': 0, 'Intro': 0 };

  function lyricBrief(state, target) {
    const { name } = genreInfo(state);
    const struct = structureFor(state);
    const moods = (state.moods || []).slice(0, 3);
    const plan = struct.map((s) => {
      const base = s.replace(/ \d+$/, '');
      const n = LINES_PER[base];
      if (n === undefined || n === 0) return `${s} (instrumental)`;
      return `${s} (${n} lines)`;
    }).join(' / ');
    const b = [];
    b.push(`Write original song lyrics${state.theme ? ` about: ${state.theme}` : ''}.`);
    b.push(`Style: ${name}${moods.length ? `, ${moods.join(', ')}` : ''}. Language: ${state.language || 'English'}.`);
    if (state.title) b.push(`Title: "${state.title}". Work the title into the chorus.`);
    b.push(`Structure: ${plan}.`);
    b.push('Keep lines short and singable, with strong end rhymes. Use concrete images instead of clichés. Make the chorus the emotional peak and repeat it word-for-word each time.');
    if (target === 'yue') b.push('Write every chorus out in full. Keep repeated lines at identical syllable counts. No stage directions, parentheses, titles or notes: only section labels in [brackets] and sung words.');
    else b.push('Label sections in [brackets] like [Verse 1] and [Chorus]. Use (parentheses) only for backing vocals.');
    return b.join('\n');
  }

  function buildLyricsFor(target, state) {
    const v = vocalInfo(state);
    const struct = structureFor(state);
    const warnings = [];
    if (v.instrumental) {
      const labels = struct.map((s) => target === 'yue' ? `[${yueInstrLabel(s)}]` : `[${s}]`);
      if (target === 'suno') return { text: labels.join('\n\n') + '\n\n[End]', hint: 'Section tags only, no words. Also switch Instrumental on.', warnings };
      return { text: labels.join('\n\n'), hint: 'Empty section labels give YuE2 a structure to plan with no vocals.', warnings };
    }
    const lyr = (state.lyrics || '').trim();
    if (!lyr) {
      const labels = struct.map((s) => target === 'yue' ? `[${yueLabel(s, (LINES_PER[s.replace(/ \d+$/, '')] || 0) > 0)}]` : `[${s}]`);
      warnings.push(target === 'yue'
        ? 'No lyrics yet. YuE2 sings exactly what you give it, so write lyrics (use the brief), then paste them into the builder.'
        : 'No lyrics yet. Either paste your own into the builder, or leave Suno\'s lyrics box empty and use the brief with its lyrics writer.');
      return { text: labels.join('\n\n'), hint: 'Structure template: write your lines under each tag.', warnings, brief: lyricBrief(state, target) };
    }
    const parsed = parseLyrics(lyr);
    if (parsed.sections.some((s) => s.inferred)) warnings.push('Some sections had no labels, so they were labeled automatically. Check they are right.');
    if (target === 'yue') {
      const f = formatYue(parsed, { stripParens: !(state.yue && state.yue.keepParens) });
      const lang = state.language || 'English';
      const hasCJK = /[\u3040-\u30ff\u3400-\u9fff]/.test(f.text);
      if (lang === 'English' && hasCJK) warnings.push('Lyrics contain Chinese/Japanese text but language is English. Match the language to the lyrics.');
      if ((lang === 'Mandarin' || lang === 'Japanese') && !hasCJK) warnings.push(`Language is ${lang} but lyrics look English. YuE2 works best when style and lyrics agree.`);
      return { text: f.text, hint: 'Only section labels and sung words. Every chorus written in full.', warnings: [...warnings, ...f.warnings] };
    }
    const f = formatSuno(parsed);
    return { text: f.text, hint: 'Section tags in [brackets]; (parentheses) are backing vocals.', warnings: [...warnings, ...f.warnings] };
  }

  // ---------- distribution helper ----------
  function distribution(state) {
    const { g, micro, name } = genreInfo(state);
    if (!g) return null;
    const moods = (state.moods || []).slice(0, 2);
    const sig = (state.palette || []).slice(0, 3);
    const distro = micro ? micro.distro : [g.distro];
    return {
      primary: distro[0] || g.distro,
      secondary: distro[1] || '',
      keywords: uniq([...(micro ? micro.playlists : []), name.toLowerCase(), ...moods]).slice(0, 8),
      pitch: `${article(moods[0] || name)} ${moods.length ? moods.join(', ') + ' ' : ''}${name.toLowerCase()} track built on ${listText(sig) || 'a signature groove'}.`
    };
  }

  function exportText(state, target) {
    const map = { simple: sunoSimple, advanced: sunoAdvanced, sounds: sunoSounds, yue: yue2 };
    const names = { simple: 'Suno · Simple', advanced: 'Suno · Advanced', sounds: 'Suno · Sounds', yue: 'YuE2' };
    const r = map[target](state);
    const parts = [`${names[target]}`, ''];
    r.fields.forEach((f) => { if (f.value) parts.push(`## ${f.label}`, f.value, ''); });
    parts.push('## Settings');
    r.settings.forEach(([k, v]) => parts.push(`${k}: ${v}`));
    return parts.join('\n');
  }

  window.Engine = { styleTags, sunoSimple, sunoAdvanced, sunoSounds, yue2, parseLyrics, formatYue, formatSuno,
    syllables, distribution, genreInfo, exportText, suggestKey, structureFor, PARENT_TAG };
})();
