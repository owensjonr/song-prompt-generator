/* Prompt research: turns reference songs, artists and albums into style profiles.
 * Pure functions, no DOM. Prompts built from these profiles describe the SOUND
 * (genre, micro-genre, tempo, era, vocal) and never contain artist or song names:
 * Suno rejects artist names in styles, and describing the sound keeps releases original.
 */
(function () {
  const GI = window.GENRE_INDEX, V = window.VOCAB;
  const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();

  // Ordered: specific and cross-genre rules first. [pattern, genre, micro?]
  const RULES = [
    [/emo rap|sad rap/, 'hiphop', 'emo-rap'], [/latin trap/, 'latin', 'latin-trap'], [/jazz rap|jazz hop/, 'hiphop', 'jazz-rap'],
    [/cloud rap/, 'hiphop', 'cloud-rap'], [/country rap|hick hop/, 'country', 'country-rap'], [/g funk|west coast/, 'hiphop', 'west-coast-g-funk'],
    [/funk rock/, 'funk', 'funk-rock'], [/blues rock/, 'blues', 'blues-rock'], [/pop punk/, 'punk', 'pop-punk'],
    [/ska punk|\bska\b/, 'punk', 'ska-punk'], [/nu metal/, 'metal', 'nu-metal'], [/afro house/, 'house', 'afro-house'],
    [/stomp|folk pop/, 'folk', 'stomp-clap-folk-pop'], [/electro swing/, 'edm', 'electro-swing'], [/lo fi|lofi/, 'chill', 'lo-fi-hip-hop'],
    [/chillhop/, 'chill', 'chillhop'], [/trip hop|downtempo/, 'chill', 'downtempo-trip-hop'], [/chillwave/, 'chill', 'chillwave'], [/vaporwave/, 'chill', 'vaporwave'],
    [/k pop/, 'pop', 'k-pop-style'], [/j pop|city pop|kayokyoku/, 'pop', 'city-pop'], [/hyperpop|glitchcore|digicore/, 'pop', 'hyperpop'],
    [/synth pop|synthpop|new wave/, 'pop', '80s-synth-pop'], [/bedroom pop/, 'pop', 'bedroom-pop'], [/dark pop/, 'pop', 'dark-pop'], [/dance pop|electropop/, 'pop', 'dance-pop'],
    [/dream pop|shoegaze/, 'rock', 'shoegaze'],
    [/drill/, 'hiphop', 'uk-drill'], [/phonk/, 'hiphop', 'drift-phonk'], [/\btrap\b/, 'hiphop', 'trap'], [/boom bap|east coast/, 'hiphop', 'boom-bap'],
    [/hip hop|\brap\b|hiphop/, 'hiphop'],
    [/neo soul/, 'rnb', 'neo-soul'], [/new jack/, 'rnb', '90s-new-jack-swing'], [/motown|northern soul/, 'rnb', 'classic-motown-soul'],
    [/quiet storm/, 'rnb', 'quiet-storm'], [/alternative r and b|alt r and b|pbr and b/, 'rnb', 'alternative-r-and-b'],
    [/r and b|rnb|rhythm and blues|contemporary r|\bsoul\b/, 'rnb'],
    [/liquid funk|liquid drum/, 'bass', 'liquid-drum-and-bass'], [/neurofunk/, 'bass', 'neurofunk'], [/jungle/, 'bass', 'jungle'],
    [/riddim/, 'bass', 'riddim'], [/brostep|dubstep/, 'bass', 'brostep'], [/breakbeat|big beat/, 'bass', 'breakbeat'],
    [/drum and bass|drum n bass|dnb/, 'bass'],
    [/tech house/, 'house', 'tech-house'], [/deep house/, 'house', 'deep-house'], [/progressive house/, 'house', 'progressive-house'],
    [/uk garage|2 step|speed garage/, 'house', 'uk-garage'], [/tropical house/, 'house', 'tropical-house'], [/nu disco|french house/, 'house', 'nu-disco'],
    [/\bhouse\b/, 'house'],
    [/melodic techno/, 'techno', 'melodic-techno'], [/hard techno/, 'techno', 'hard-techno'], [/minimal/, 'techno', 'minimal-techno'],
    [/industrial techno|\bebm\b/, 'techno', 'industrial-techno'], [/acid/, 'techno', 'acid-techno'], [/techno/, 'techno'],
    [/synthwave|retrowave|outrun|darksynth/, 'edm', 'synthwave'], [/future bass/, 'edm', 'future-bass'], [/trance/, 'edm', 'uplifting-trance'],
    [/hardstyle|hardcore techno/, 'edm', 'hardstyle'], [/eurodance/, 'edm', '90s-eurodance'], [/melodic dubstep/, 'edm', 'melodic-dubstep'], [/big room/, 'edm', 'big-room'],
    [/\bedm\b|electronic|electronica|\bdance\b|electro/, 'edm'],
    [/metalcore/, 'metal', 'metalcore'], [/djent|progressive metal/, 'metal', 'djent'], [/symphonic metal/, 'metal', 'symphonic-metal'],
    [/black metal/, 'metal', 'black-metal'], [/doom|sludge/, 'metal', 'doom-metal'], [/heavy metal|thrash/, 'metal', 'heavy-metal'], [/metal/, 'metal'],
    [/midwest emo|\bemo\b/, 'punk', 'midwest-emo'], [/post punk/, 'punk', 'post-punk'], [/hardcore/, 'punk', 'hardcore-punk'], [/punk/, 'punk'],
    [/grunge/, 'rock', 'grunge'], [/garage rock/, 'rock', 'garage-rock'], [/stoner/, 'rock', 'stoner-rock'], [/indie rock/, 'rock', 'indie-rock'],
    [/alternative rock|alt rock|britpop|post grunge/, 'rock', '90s-alternative-rock'], [/classic rock|hard rock|arena rock/, 'rock', 'classic-rock'],
    [/anime|j rock/, 'rock', 'anime-opening-rock'],
    [/bluegrass/, 'country', 'bluegrass'], [/americana|alt country/, 'country', 'americana'], [/outlaw/, 'country', 'outlaw-country'],
    [/honky tonk/, 'country', 'honky-tonk'], [/country pop|contemporary country/, 'country', 'modern-country-pop'], [/country/, 'country'],
    [/indie folk/, 'folk', 'indie-folk'], [/celtic|irish folk/, 'folk', 'celtic-folk'], [/chamber folk|chamber pop/, 'folk', 'chamber-folk'],
    [/singer songwriter/, 'folk', 'singer-songwriter'], [/folk|acoustic/, 'folk'],
    [/bebop|hard bop/, 'jazz', 'bebop'], [/smooth jazz/, 'jazz', 'smooth-jazz'], [/bossa|mpb/, 'jazz', 'bossa-nova'], [/big band|\bswing\b/, 'jazz', 'swing-big-band'],
    [/jazz funk|jazz fusion|fusion/, 'jazz', 'jazz-funk'], [/nu jazz/, 'jazz', 'nu-jazz'], [/vocal jazz|lounge|crooner/, 'jazz', 'vocal-jazz-lounge'], [/jazz/, 'jazz'],
    [/delta blues/, 'blues', 'delta-blues'], [/chicago blues|electric blues/, 'blues', 'chicago-electric-blues'], [/blues/, 'blues'],
    [/reggaeton|urbano|latin urban/, 'latin', 'reggaeton'], [/bachata/, 'latin', 'bachata'], [/salsa/, 'latin', 'salsa'], [/cumbia/, 'latin', 'cumbia'],
    [/corrido|regional mexican|musica mexicana|norte/, 'latin', 'corridos-tumbados'], [/latin/, 'latin'],
    [/dancehall/, 'caribbean', 'dancehall'], [/\bdub\b/, 'caribbean', 'dub'], [/soca/, 'caribbean', 'soca'], [/roots reggae/, 'caribbean', 'roots-reggae'],
    [/reggae/, 'caribbean'],
    [/amapiano/, 'african', 'amapiano'], [/afroswing/, 'african', 'afroswing'], [/afrobeats|afro pop|afropop|naija/, 'african', 'afrobeats'],
    [/afrobeat/, 'african', 'afrobeat-classic'], [/highlife/, 'african', 'highlife'], [/gqom/, 'african', 'gqom'], [/african|\bafro\b/, 'african'],
    [/disco/, 'funk', 'disco'], [/boogie/, 'funk', '80s-boogie'], [/funk/, 'funk'],
    [/ambient|new age|\bchill\b|easy listening/, 'chill'],
    [/trailer|epic music/, 'cinematic', 'epic-trailer'], [/chiptune|8 bit|video game/, 'cinematic', 'chiptune'],
    [/neo classical|neoclassical|modern classical|contemporary classical/, 'cinematic', 'neo-classical-piano'],
    [/soundtrack|film score|\bscore\b|classical|orchestral/, 'cinematic'],
    [/worship|christian|\bccm\b/, 'gospel', 'contemporary-worship'], [/gospel/, 'gospel'],
    [/children|kids|lullab/, 'kids'],
    [/\brock\b/, 'rock'],
    [/indie pop|\bpop\b/, 'pop'],
    [/\balternative\b|\bindie\b/, 'rock']
  ];

  const MOOD_SYN = { sad: 'melancholic', melancholy: 'melancholic', happy: 'joyful', chill: 'relaxed', mellow: 'relaxed', energetic: 'hype',
    party: 'hype', angry: 'aggressive', love: 'romantic', sexy: 'sensual', atmospheric: 'dreamy', ethereal: 'dreamy', psychedelic: 'hypnotic',
    haunting: 'eerie', gloomy: 'dark', emotional: 'bittersweet', anthemic: 'triumphant' };

  const microOf = (gid, mid) => (GI[gid] && mid ? GI[gid].micro.find((m) => m.id === mid) : null);
  // Every micro-genre name is also matched literally, so the whole database is reachable from tags.
  const MICRO_NAMES = [];
  Object.values(GI).forEach((g) => g.micro.forEach((m) => MICRO_NAMES.push([norm(m.name), g.id, m.id])));

  function classify(text) {
    const t = norm(text); if (!t) return null;
    for (const [n, gid, mid] of MICRO_NAMES) if (n.length > 3 && (t === n || t.includes(n))) return { genre: gid, micro: mid };
    for (const [re, gid, mid] of RULES) if (re.test(t)) return { genre: gid, micro: mid || null };
    return null;
  }

  // Style scores for one reference.
  function scoreItem(item) {
    const genre = {}, micro = {};
    const reasons = [];
    const sources = [{ text: item.genre, w: 3, from: 'store genre' }];
    ((item.enrich && item.enrich.tags) || []).forEach((t) => sources.push({ text: t.name, w: 1 + Math.log2(1 + (t.count || 1)), from: 'tag' }));
    sources.forEach((s) => {
      const c = classify(s.text); if (!c) return;
      genre[c.genre] = (genre[c.genre] || 0) + s.w;
      if (c.micro) micro[c.genre + '/' + c.micro] = (micro[c.genre + '/' + c.micro] || 0) + s.w;
      if (reasons.length < 4 && !reasons.includes(s.text)) reasons.push(s.text);
    });
    return { genre, micro, reasons };
  }

  function best(obj, filter = () => true) {
    let k = null, v = -1;
    Object.entries(obj).forEach(([kk, vv]) => { if (filter(kk) && vv > v) { k = kk; v = vv; } });
    return k ? [k, v] : [null, 0];
  }

  // What style one reference points to (respects the user's manual choice).
  function matchItem(item) {
    if (item.override && GI[item.override.genre]) return { genre: item.override.genre, micro: item.override.micro || null, manual: true, reasons: [] };
    const s = scoreItem(item);
    const [gid] = best(s.genre);
    if (!gid) return { genre: null, micro: null, reasons: [] };
    const [mk] = best(s.micro, (k) => k.startsWith(gid + '/'));
    return { genre: gid, micro: mk ? mk.split('/')[1] : null, reasons: s.reasons };
  }

  function eraFromYears(years) {
    const ys = years.filter(Boolean).sort((a, b) => a - b);
    if (!ys.length) return '';
    const y = ys[Math.floor(ys.length / 2)];
    if (y >= 2010) return '';
    if (y < 1960) return '1950s';
    return Math.floor(y / 10) * 10 + 's';
  }

  function fitBpm(bpm, range) {
    if (!bpm) return null;
    const mid = (range[0] + range[1]) / 2;
    const opts = [bpm, bpm * 2, bpm / 2].map(Math.round);
    const b = opts.sort((a, c) => Math.abs(a - mid) - Math.abs(c - mid))[0];
    return Math.max(range[0] - 8, Math.min(range[1] + 8, b));
  }

  function median(a) {
    const s = a.filter(Boolean).sort((x, y) => x - y); if (!s.length) return null;
    const h = Math.floor(s.length / 2);
    return s.length % 2 ? s[h] : Math.round((s[h - 1] + s[h]) / 2);
  }

  function vocalFromMicro(m) {
    const s = (m && m.vocal || '').toLowerCase();
    if (/instrumental/.test(s)) return 'none';
    if (/duet|male and female/.test(s)) return 'duet';
    if (/choir|group|quartet|chant|children/.test(s)) return 'choir';
    if (/rap/.test(s)) return /female/.test(s) ? 'rap-f' : 'rap-m';
    if (/female|diva/.test(s)) return 'female';
    if (/male/.test(s)) return 'male';
    return m && /hip|rap/.test(m.id) ? 'rap-m' : 'female';
  }
  function tonesFromMicro(m) { const s = (m && m.vocal || '').toLowerCase(); return V.vocalTones.filter((t) => new RegExp(`\\b${t}\\b`).test(s)); }

  function energyFor(g, bpm) {
    const byTempo = bpm < 75 ? 0 : bpm < 95 ? 1 : bpm < 115 ? 2 : bpm < 135 ? 3 : 4;
    return Math.max(0, Math.min(4, Math.round((byTempo + (g.energy - 1)) / 2)));
  }

  // Build a builder-state patch from a set of references.
  function profile(items, opts = {}) {
    const genre = {}, micro = {};
    items.forEach((it) => {
      const w = it.main ? 2 : 1;
      if (it.override && GI[it.override.genre]) {
        genre[it.override.genre] = (genre[it.override.genre] || 0) + 6 * w;
        if (it.override.micro) micro[it.override.genre + '/' + it.override.micro] = (micro[it.override.genre + '/' + it.override.micro] || 0) + 6 * w;
        return;
      }
      const s = scoreItem(it);
      Object.entries(s.genre).forEach(([k, v]) => { genre[k] = (genre[k] || 0) + v * w; });
      Object.entries(s.micro).forEach(([k, v]) => { micro[k] = (micro[k] || 0) + v * w; });
    });
    let gid = opts.genre || best(genre)[0] || 'pop';
    let mid = opts.micro !== undefined ? opts.micro : ((best(micro, (k) => k.startsWith(gid + '/'))[0] || '').split('/')[1] || null);
    const g = GI[gid];
    const m = microOf(gid, mid);
    const range = m ? m.bpm : g.bpm;

    let blend = null;
    if (opts.blend !== false && items.length > 1) {
      const top = genre[gid] || 0;
      const [bg, bv] = best(genre, (k) => k !== gid);
      if (bg && bv >= top * 0.35) {
        const bm = (best(micro, (k) => k.startsWith(bg + '/'))[0] || '').split('/')[1] || null;
        blend = { genre: bg, micro: bm };
      }
    }

    const measured = median(items.map((i) => i.enrich && i.enrich.bpm));
    const bpm = fitBpm(measured, range) || Math.round((range[0] + range[1]) / 2 / 2) * 2;

    const era = opts.era !== undefined ? opts.era : eraFromYears(items.map((i) => i.year));

    // Vocal: majority artist gender when known, else the micro-genre's default.
    let vocal = m ? vocalFromMicro(m) : (gid === 'hiphop' ? 'rap-m' : 'female');
    let f = 0, ml = 0;
    items.forEach((i) => {
      const e = i.enrich || {}; if (e.artistType !== 'person') return;
      if (e.gender === 'female') f += i.main ? 2 : 1; else if (e.gender === 'male') ml += i.main ? 2 : 1;
    });
    const genders = f + ml;
    const allTags = items.flatMap((i) => (i.enrich && i.enrich.tags || []).map((t) => t.name));
    if (allTags.some((t) => /^instrumental/.test(t)) && !genders) vocal = 'none';
    else if (genders && vocal !== 'choir') {
      const gender = f > ml ? 'female' : ml > f ? 'male' : null;
      if (gender) vocal = gid === 'hiphop' || /^rap/.test(vocal) ? (gender === 'female' ? 'rap-f' : 'rap-m') : gender;
    }

    const moodSet = [];
    allTags.forEach((t) => { const x = MOOD_SYN[t] || t; if (V.moods.includes(x) && !moodSet.includes(x)) moodSet.push(x); });
    const moods = moodSet.length ? moodSet.slice(0, 3) : g.moods.slice(0, 2);

    return {
      genre: gid, micro: m ? m.id : null, blend, bpm, era, vocal, tones: tonesFromMicro(m), moods,
      energy: energyFor(g, bpm),
      palette: m ? m.tags.slice(0, 4) : g.instruments.slice(0, 3),
      exclude: m ? [...m.exclude] : [],
      measuredBpm: measured || null
    };
  }

  const label = (gid, mid) => { const m = microOf(gid, mid); return m ? m.name : (GI[gid] ? GI[gid].name : ''); };

  // A handful of prompt directions to compare.
  function variants(items) {
    if (!items.length) return [];
    const out = [];
    const seen = new Set();
    const add = (id, title, why, patch) => {
      const sig = [patch.genre, patch.micro, patch.blend && patch.blend.genre, patch.blend && patch.blend.micro, patch.era, patch.vocal].join('|');
      if (seen.has(sig)) return; seen.add(sig);
      out.push({ id, title, why, patch, sig });
    };
    const core = profile(items);
    if (core.blend) add('blend', `${label(core.genre, core.micro)} × ${label(core.blend.genre, core.blend.micro)}`, 'Blends the two strongest styles across your references.', core);
    const straight = profile(items, { blend: false });
    add('core', label(straight.genre, straight.micro), items.length > 1 ? 'The single style most of your references share.' : 'The closest micro-genre to this reference.', straight);

    // Runner-up micro-genres
    const tally = {};
    items.forEach((it) => { const s = scoreItem(it); Object.entries(s.micro).forEach(([k, v]) => { tally[k] = (tally[k] || 0) + v * (it.main ? 2 : 1); }); });
    Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k]) => k.split('/'))
      .filter(([gid, mid]) => !(gid === straight.genre && mid === straight.micro)).slice(0, 2)
      .forEach(([gid, mid]) => add('alt-' + mid, label(gid, mid), 'Another style your references lean toward.', profile(items, { genre: gid, micro: mid, blend: false })));

    if (straight.era) add('modern', `${label(straight.genre, straight.micro)}, modern update`, `Keeps the style but swaps the ${straight.era} production for a current, polished mix.`, Object.assign(profile(items, { blend: false, era: '' }), { production: ['polished modern mix'] }));

    if (items.length > 1) items.forEach((it) => {
      const p = profile([it], { blend: false });
      add('item-' + it.key, `From “${it.title}”`, `Built from this ${it.kind} alone. The prompt describes its sound and never names it.`, p);
    });
    return out.slice(0, 8);
  }

  window.Research = { classify, matchItem, profile, variants, label, RULES };
})();
