/* Genre database.
 * Parent genres have a plain-language explanation for beginners, what to listen for,
 * a default groove sketch, and defaults for instruments / moods / vocals.
 * Each micro-genre: m(name, description, [bpmLow,bpmHigh], groove|null, signatureTags,
 *                    defaultVocal, excludeTags, playlistKeywords, distributorGenres)
 * Comma-separated strings are split into arrays.
 */
(function () {
  const split = (s) => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : []);
  const slug = (s) => s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const m = (name, desc, bpm, groove, tags, vocal, exclude, playlists, distro) => ({
    id: slug(name), name, desc, bpm, groove, tags: split(tags), vocal,
    exclude: split(exclude), playlists: split(playlists), distro: split(distro)
  });

  window.GENRES = [
    {
      id: 'pop', name: 'Pop', energy: 3, groove: 'ballad', bpm: [95, 125], structure: 'pop', distro: 'Pop',
      blurb: 'Short for "popular". Catchy, polished songs built around a big, memorable chorus. Usually 3 minutes long with verses that build up to a hook you can sing along to.',
      listen: ['A chorus that sticks in your head', 'Clean, bright, loud production', 'Vocals front and center'],
      instruments: split('synths, electric piano, punchy drums, bass guitar, acoustic guitar, layered vocal harmonies'),
      moods: split('uplifting, catchy, romantic, bittersweet, confident'),
      micro: [
        m('Dance-Pop', 'Pop made for the dance floor: four-on-the-floor kick, glossy synths, and an explosive chorus.', [115, 128], 'four', 'four-on-the-floor beat, glossy synth chords, sidechain pumping, big pop chorus, handclaps', 'bright female vocal', 'acoustic ballad', 'dance pop, pop party, workout pop', 'Pop, Dance'),
        m('80s Synth-Pop', 'Retro pop driven by analog synthesizers, gated drums, and chorus-drenched bass.', [110, 124], 'four', 'analog synths, gated reverb snare, arpeggiated synth bass, retro 80s production, shimmering pads', 'cool male vocal', 'trap hi-hats, modern 808', '80s synth pop, retro pop, new wave', 'Pop, Electronic'),
        m('Hyperpop', 'Maximalist internet-born pop: pitched-up vocals, distorted bass, glitchy chaos, bubblegum hooks.', [140, 170], 'trap', 'pitched-up vocals, distorted 808s, glitch effects, bubblegum synths, chaotic drops, heavy autotune', 'pitched female vocal', 'acoustic guitar, orchestral', 'hyperpop, glitchcore, digicore', 'Pop, Electronic'),
        m('Bedroom Pop', 'Intimate, lo-fi pop that sounds recorded at home: soft vocals, warm guitars, dreamy textures.', [80, 110], 'lofi', 'soft lo-fi drums, warm clean guitar, hazy synth pads, intimate close-mic vocal, tape warmth', 'soft breathy female vocal', 'stadium drums, heavy distortion', 'bedroom pop, soft pop, chill indie', 'Pop, Alternative'),
        m('Pop Ballad', 'A slow, emotional pop song, usually piano-led, that builds to a powerful vocal climax.', [65, 85], 'ballad', 'emotional piano, swelling strings, slow build, powerful final chorus, soft drums', 'powerful female vocal', 'EDM drops, rap', 'sad songs, pop ballads, heartbreak', 'Pop'),
        m('City Pop', 'Glossy late-70s/80s Japanese pop: jazzy chords, slap bass, bright brass, breezy nostalgia.', [100, 120], 'disco', 'jazzy seventh chords, slap bass, bright brass stabs, Rhodes piano, 80s polish, groovy', 'bright female vocal', 'trap hi-hats, distorted guitars', 'city pop, japanese city pop, 80s japan', 'Pop, J-Pop'),
        m('K-Pop Style', 'High-gloss idol pop that switches sections dramatically: rap verses, dance breaks, huge choruses.', [100, 130], 'four', 'genre-switching sections, sharp synth hooks, rap verse, dance break, layered group vocals, high-gloss production', 'group vocals', 'lo-fi, acoustic', 'k-pop, idol pop, dance pop', 'Pop, K-Pop'),
        m('Dark Pop', 'Moody, minor-key pop with deep bass, sparse beats, and breathy, dramatic vocals.', [85, 110], 'trap', 'minor key, deep sub bass, sparse percussion, breathy vocal, dark cinematic synths, whisper ad-libs', 'breathy female vocal', 'happy, ukulele', 'dark pop, alt pop, moody pop', 'Pop, Alternative')
      ]
    },
    {
      id: 'hiphop', name: 'Hip-Hop / Rap', energy: 4, groove: 'boombap', bpm: [80, 150], structure: 'hiphop', distro: 'Hip-Hop/Rap',
      blurb: 'Music where rhythmic speaking (rapping) rides on top of a beat. The beat is often built from drum machines and samples. Hooks can be rapped or sung.',
      listen: ['Heavy kick and snare driving everything', 'Rapped verses with rhyme patterns', 'A repeated hook between verses'],
      instruments: split('808 bass, drum machine, sampled loops, piano, synth pads, vinyl samples'),
      moods: split('confident, aggressive, gritty, reflective, hype'),
      micro: [
        m('Boom Bap', 'Classic 90s East Coast sound: dusty sampled loops, hard-hitting kick and snare, lyrical focus.', [85, 95], 'boombap', 'dusty vinyl samples, hard kick and snare, jazzy piano loop, scratching, lyrical rap flow', 'male rap vocal', 'autotune, EDM drops', 'boom bap, 90s hip hop, underground rap', 'Hip-Hop/Rap'),
        m('Trap', 'Rolling hi-hats, booming 808 bass, and sparse dark melodies. The dominant modern rap sound.', [130, 150], 'trap', 'rolling hi-hat triplets, booming 808 slides, dark bell melody, sparse snare, ad-libs', 'male rap vocal with autotune', 'live band, acoustic', 'trap, rap caviar style, trap bangers', 'Hip-Hop/Rap'),
        m('UK Drill', 'Menacing, sliding 808s and skippy, off-kilter hi-hats with dark piano or strings.', [138, 145], 'drill', 'sliding 808 glides, skippy triplet hi-hats, dark piano, eerie strings, menacing', 'deep male rap vocal', 'happy, acoustic guitar', 'uk drill, drill, grime', 'Hip-Hop/Rap'),
        m('Drift Phonk', 'Aggressive cowbell melodies, distorted 808s, and Memphis-style vocal chops. Popular in car edits.', [120, 140], 'phonk', 'cowbell melody, distorted 808, memphis vocal chops, aggressive, heavy bass', 'chopped male vocal samples', 'soft piano, acoustic', 'phonk, drift phonk, gym phonk', 'Hip-Hop/Rap, Electronic'),
        m('Cloud Rap', 'Hazy, dreamy rap with washed-out synths, reverb-soaked vocals and a floaty, detached feel.', [60, 80], 'trap', 'ethereal synth pads, reverb-drenched vocals, hazy atmosphere, slow 808, dreamy', 'airy male rap vocal', 'aggressive distortion', 'cloud rap, chill rap, dreamy rap', 'Hip-Hop/Rap'),
        m('Emo Rap', 'Rap that borrows the heartbreak of emo: sad guitar loops, trap drums, sung-rapped vocals.', [70, 90], 'trap', 'sad clean guitar loop, trap drums, melodic sung rap, heartbreak, lo-fi grit', 'melodic male vocal', 'party, brass', 'emo rap, sad rap', 'Hip-Hop/Rap'),
        m('West Coast G-Funk', 'Laid-back California rap with whiny synth leads, funky bass, and smooth groove.', [88, 98], 'funk', 'high whistling synth lead, funky bassline, talkbox, laid-back groove, sunny west coast', 'smooth male rap vocal', 'trap hi-hats, EDM', 'g-funk, west coast rap, 90s rap', 'Hip-Hop/Rap'),
        m('Jazz Rap', 'Rap over jazz samples: upright bass, muted horns, and relaxed, smart flows.', [85, 95], 'boombap', 'upright bass, muted trumpet samples, jazzy piano, relaxed flow, vinyl warmth', 'conversational male rap vocal', 'autotune, 808 distortion', 'jazz rap, conscious hip hop', 'Hip-Hop/Rap, Jazz')
      ]
    },
    {
      id: 'rnb', name: 'R&B / Soul', energy: 2, groove: 'ballad', bpm: [65, 105], structure: 'pop', distro: 'R&B/Soul',
      blurb: 'Rhythm and blues: smooth, soulful singing over grooves that lean back. Focus on vocal emotion, runs and harmonies, and warm chords.',
      listen: ['Smooth, expressive vocals with runs', 'Warm electric piano chords', 'Relaxed, head-nodding groove'],
      instruments: split('Rhodes piano, smooth bass, soft drums, warm pads, guitar licks, vocal harmonies'),
      moods: split('sensual, smooth, romantic, heartfelt, late-night'),
      micro: [
        m('Contemporary R&B', 'Modern, polished R&B with trap-influenced drums, lush vocal stacks, and sleek synths.', [65, 95], 'trap', 'trap-influenced drums, lush vocal stacks, sleek synths, 808 bass, smooth runs', 'smooth female vocal', 'rock guitars', 'r&b, new r&b', 'R&B/Soul'),
        m('Neo-Soul', 'Organic, jazzy soul with live instruments, loose drums, and rich extended chords.', [70, 95], 'boombap', 'Rhodes piano, jazzy extended chords, loose live drums, round bass, organic warmth', 'smoky female vocal', 'EDM, 808 distortion', 'neo soul, soulful, jazzy r&b', 'R&B/Soul'),
        m('Alternative R&B', 'Moody, experimental R&B with atmospheric production and falsetto vocals.', [60, 90], 'trap', 'atmospheric synths, reverb-heavy falsetto, moody minor chords, sparse beat, experimental textures', 'falsetto male vocal', 'bright pop', 'alternative r&b, moody r&b', 'R&B/Soul, Alternative'),
        m('90s New Jack Swing', 'Upbeat late-80s/90s R&B blending hip-hop swing beats with gospel-style vocals.', [100, 112], 'boombap', 'swingy drum machine, synth stabs, gospel harmonies, 90s production, funky bass', 'powerful male vocal', 'trap hi-hats', '90s r&b, new jack swing, throwback', 'R&B/Soul'),
        m('Quiet Storm', 'Slow, late-night romantic R&B: soft saxophone, silky vocals, and gentle grooves.', [60, 75], 'ballad', 'soft saxophone, silky electric piano, gentle groove, late-night mood, lush background vocals', 'silky male vocal', 'distortion, fast drums', 'quiet storm, slow jams, love songs', 'R&B/Soul'),
        m('Classic Motown Soul', '1960s soul: tambourine backbeat, horn section, bouncy bass, and joyful call-and-response.', [100, 125], 'rock', 'tambourine backbeat, horn section, bouncy melodic bass, call-and-response backing vocals, vintage 60s production', 'soulful female vocal', 'synths, 808', 'motown, classic soul, oldies', 'R&B/Soul')
      ]
    },
    {
      id: 'edm', name: 'Electronic / EDM', energy: 5, groove: 'four', bpm: [120, 150], structure: 'edm', distro: 'Electronic',
      blurb: 'EDM means Electronic Dance Music: music made mostly with synthesizers and drum machines, built for clubs and festivals. Songs build tension, then release it in a "drop".',
      listen: ['A build-up of rising tension', 'The "drop": the biggest, loudest part', 'Synths and electronic drums instead of a band'],
      instruments: split('supersaw synths, sidechained pads, electronic drums, sub bass, risers, vocal chops'),
      moods: split('euphoric, energetic, uplifting, festival, hypnotic'),
      micro: [
        m('Big Room', 'Festival-main-stage EDM: huge kicks, simple chant-like leads, and massive drops.', [126, 130], 'four', 'huge festival kick, simple lead synth hook, snare roll build-up, massive drop, crowd chant', 'chant vocals', 'acoustic, lo-fi', 'big room, festival edm, mainstage', 'Electronic, Dance'),
        m('Future Bass', 'Wide, pitch-wobbling supersaw chords, chopped vocals, and emotional half-time drops.', [140, 160], 'halftime', 'supersaw chords, pitched vocal chops, sidechain pumping, wobbly pitch-bent synths, emotional drop', 'airy female vocal', 'heavy guitars', 'future bass, melodic bass, feels', 'Electronic, Dance'),
        m('Uplifting Trance', 'Euphoric, driving electronic music with long builds, rolling basslines, and soaring melodies.', [136, 140], 'four', 'rolling offbeat bass, soaring supersaw lead, long breakdown, euphoric build, gated pads', 'ethereal female vocal', 'rap, distortion', 'trance, uplifting trance, euphoric', 'Electronic, Dance'),
        m('Synthwave', 'Retro-futuristic 80s-inspired electronic music: neon arpeggios, gated drums, night-drive nostalgia.', [80, 118], 'four', 'analog arpeggios, gated reverb drums, neon synth leads, retro 80s, night drive atmosphere', 'airy male vocal', 'trap, acoustic', 'synthwave, retrowave, outrun', 'Electronic'),
        m('Melodic Dubstep', 'Emotional dubstep with cinematic chords, soaring vocals, and heavy but musical drops.', [140, 150], 'halftime', 'cinematic chords, emotional build, heavy melodic bass drop, soaring vocal, reese bass', 'soaring female vocal', 'country, acoustic', 'melodic dubstep, melodic bass', 'Electronic, Dance'),
        m('Hardstyle', 'Very high-energy music with distorted, pitched kick drums and euphoric screeching leads.', [150, 160], 'four', 'distorted pitched kick, euphoric screech lead, reverse bass, anthemic breakdown', 'anthemic male vocal', 'soft, lo-fi', 'hardstyle, euphoric hardstyle', 'Electronic, Dance'),
        m('90s Eurodance', 'Cheesy, joyful 90s club music: female sung chorus, male rap verse, bouncy synths.', [128, 140], 'four', 'bouncy synth stabs, piano house chords, female sung chorus, male rap verse, 90s club', 'powerful female vocal', 'trap, lo-fi', 'eurodance, 90s dance', 'Electronic, Dance'),
        m('Electro Swing', 'Vintage swing and big band samples fused with modern house beats.', [120, 130], 'four', 'vintage swing horns, four-on-the-floor beat, jazzy upright bass, crackly samples, big band stabs', 'vintage female vocal', 'trap, metal', 'electro swing', 'Electronic, Jazz')
      ]
    },
    {
      id: 'house', name: 'House', energy: 4, groove: 'four', bpm: [118, 128], structure: 'edm', distro: 'Dance',
      blurb: 'Dance music born in 1980s Chicago. A steady kick on every beat ("four-on-the-floor") with offbeat hi-hats. Hypnotic and groovy rather than explosive.',
      listen: ['Kick drum on every beat', 'Open hi-hat on the offbeats', 'Grooves that loop and slowly evolve'],
      instruments: split('four-on-the-floor kick, offbeat hi-hats, groovy bassline, piano stabs, warm pads, vocal samples'),
      moods: split('groovy, hypnotic, feel-good, sultry, late-night'),
      micro: [
        m('Deep House', 'Warm, smooth, jazzy house with soft chords and rounded basslines.', [118, 124], 'four', 'warm jazzy chords, rounded deep bassline, soft pads, smooth groove, subtle vocal', 'soulful female vocal', 'distortion, aggressive', 'deep house, chill house', 'Dance, Electronic'),
        m('Tech House', 'Punchy, minimal, bass-heavy house with percussive grooves and short vocal hooks.', [124, 128], 'four', 'punchy rolling bassline, percussive groove, minimal synth stabs, chopped vocal hook, club energy', 'spoken male vocal hook', 'ballad, orchestral', 'tech house, club house', 'Dance, Electronic'),
        m('Afro House', 'House with African percussion, chants, and organic textures.', [118, 124], 'afro', 'african percussion, tribal toms, organic textures, chant vocals, hypnotic groove', 'chant vocals', 'distorted guitars', 'afro house, organic house', 'Dance, Electronic'),
        m('Progressive House', 'Melodic, slowly building house with lush chords and emotional breakdowns.', [122, 128], 'four', 'lush evolving chords, emotional breakdown, plucked synth arps, long build, euphoric', 'ethereal female vocal', 'rap, lo-fi', 'progressive house, melodic house', 'Dance, Electronic'),
        m('UK Garage', 'Skippy, shuffling 2-step beats, chopped vocals, and warm bass from late-90s London.', [128, 134], 'garage', 'shuffling 2-step drums, chopped pitched vocals, warm organ bass, swung hi-hats', 'soulful female vocal', 'rock, country', 'uk garage, 2-step', 'Dance, Electronic'),
        m('Tropical House', 'Relaxed, sunny house with marimba, steel drums, and pan-flute leads.', [100, 115], 'four', 'marimba, steel drums, pan flute lead, relaxed groove, sunny', 'soft male vocal', 'distortion, dark', 'tropical house, summer vibes', 'Dance, Electronic'),
        m('Nu-Disco', 'Modern take on disco: filtered disco loops, funky basslines, and glittery synths.', [115, 124], 'disco', 'filtered disco loops, funky octave bassline, glittery synths, string stabs, modern disco', 'falsetto male vocal', 'trap, metal', 'nu disco, disco house', 'Dance, Electronic')
      ]
    },
    {
      id: 'techno', name: 'Techno', energy: 4, groove: 'techno', bpm: [125, 145], structure: 'instrumental', distro: 'Electronic',
      blurb: 'Repetitive, machine-driven dance music from Detroit and Berlin. Less about songs and hooks, more about hypnotic rhythm and texture. Usually instrumental.',
      listen: ['Relentless driving kick', 'Minimal melody, lots of repetition', 'Sounds slowly change over time'],
      instruments: split('driving kick, rumbling bass, metallic percussion, acid synth, dark pads'),
      moods: split('hypnotic, dark, driving, industrial, futuristic'),
      micro: [
        m('Melodic Techno', 'Driving techno with emotional, cinematic synth melodies and big breakdowns.', [122, 128], 'techno', 'driving kick, emotional synth arpeggios, cinematic pads, big breakdown, hypnotic', 'ethereal vocal texture', 'rap, acoustic', 'melodic techno, afterhours', 'Electronic, Dance'),
        m('Hard Techno', 'Fast, pounding, distorted techno with relentless energy.', [145, 160], 'techno', 'distorted pounding kick, rave stabs, relentless energy, industrial textures', 'instrumental', 'soft, acoustic', 'hard techno, rave', 'Electronic, Dance'),
        m('Minimal Techno', 'Stripped-back techno built from tiny clicks, subtle changes, and deep groove.', [124, 130], 'techno', 'minimal clicks, subtle percussion changes, deep groove, sparse, hypnotic', 'instrumental', 'vocals, orchestral', 'minimal techno, minimal', 'Electronic, Dance'),
        m('Industrial Techno', 'Harsh, metallic, dystopian techno with noisy textures.', [130, 140], 'techno', 'metallic percussion, harsh noise textures, distorted kick, dystopian atmosphere', 'instrumental', 'happy, pop', 'industrial techno, dark techno', 'Electronic, Dance'),
        m('Acid Techno', 'Techno powered by the squelchy, resonant sound of the TB-303 bass synth.', [128, 140], 'techno', 'squelchy acid 303 bassline, resonant filter sweeps, driving kick, rave energy', 'instrumental', 'acoustic, ballad', 'acid techno, acid house', 'Electronic, Dance')
      ]
    },
    {
      id: 'bass', name: 'Drum & Bass / Bass Music', energy: 5, groove: 'dnb', bpm: [140, 176], structure: 'edm', distro: 'Electronic',
      blurb: 'Bass-focused electronic music. Drum & bass is very fast (about 174 BPM) with breakbeat drums. Dubstep is slower (140 BPM) with a heavy half-time feel and wobbling bass.',
      listen: ['Huge, loud bass that you feel', 'Fast breakbeat drums (DnB) or heavy half-time (dubstep)', 'Big drops'],
      instruments: split('breakbeat drums, reese bass, sub bass, wobble bass, atmospheric pads, risers'),
      moods: split('energetic, dark, aggressive, euphoric, intense'),
      micro: [
        m('Liquid Drum & Bass', 'Smooth, melodic drum & bass with soulful vocals and jazzy chords.', [170, 176], 'dnb', 'rolling breakbeats, smooth sub bass, jazzy chords, atmospheric pads, soulful', 'soulful female vocal', 'distortion, aggressive', 'liquid dnb, liquid drum and bass', 'Electronic, Dance'),
        m('Neurofunk', 'Dark, technical drum & bass with twisted, mechanical bass sounds.', [172, 176], 'dnb', 'twisted reese bass, mechanical sound design, tight breakbeats, dark sci-fi', 'instrumental', 'acoustic, soft', 'neurofunk, dark dnb', 'Electronic, Dance'),
        m('Jungle', 'The 90s predecessor to DnB: chopped Amen breaks, deep reggae bass, and sound-system vibes.', [160, 170], 'dnb', 'chopped amen breaks, deep reggae sub bass, ragga vocal samples, 90s rave', 'ragga male vocal', 'trap, orchestral', 'jungle, 90s jungle', 'Electronic, Dance'),
        m('Brostep', 'Aggressive, loud dubstep with screaming, growling mid-range bass.', [140, 150], 'halftime', 'aggressive growl bass, screaming synths, half-time drums, massive drop', 'instrumental', 'soft, acoustic', 'dubstep, heavy dubstep', 'Electronic, Dance'),
        m('Riddim', 'Minimal, repetitive, heavy dubstep built on one hypnotic bass pattern.', [140, 150], 'halftime', 'repetitive minimal bass pattern, half-time drums, heavy sub, hypnotic', 'instrumental', 'melodic, soft', 'riddim, dubstep', 'Electronic, Dance'),
        m('Breakbeat', 'Funky, chopped drum breaks with big basslines, less rigid than house.', [125, 140], 'dnb', 'chopped funk breaks, big bassline, rave stabs, energetic', 'instrumental', 'ballad', 'breakbeat, big beat', 'Electronic, Dance')
      ]
    },
    {
      id: 'rock', name: 'Rock', energy: 4, groove: 'rock', bpm: [90, 150], structure: 'rock', distro: 'Rock',
      blurb: 'Band music built on electric guitars, bass, and drums, with a strong backbeat (snare on beats 2 and 4). Ranges from catchy radio rock to raw and loud.',
      listen: ['Electric guitar riffs and power chords', 'Snare hitting on beats 2 and 4', 'Live band energy'],
      instruments: split('electric guitars, bass guitar, live drums, distorted rhythm guitar, guitar solo'),
      moods: split('energetic, rebellious, anthemic, raw, nostalgic'),
      micro: [
        m('Classic Rock', '60s/70s guitar-driven rock: bluesy riffs, big solos, and live-band warmth.', [100, 130], 'rock', 'bluesy guitar riffs, analog warmth, big guitar solo, hammond organ, live band', 'raspy male vocal', 'synths, 808', 'classic rock, 70s rock', 'Rock'),
        m('90s Alternative Rock', 'Quiet verses, loud distorted choruses, and angsty vocals.', [100, 130], 'rock', 'quiet verse loud chorus, fuzzy distorted guitars, angsty, 90s production', 'gritty male vocal', 'synths, EDM', '90s alternative, alt rock', 'Rock, Alternative'),
        m('Indie Rock', 'Jangly or fuzzy guitars, catchy but unpolished, with a DIY spirit.', [110, 140], 'rock', 'jangly clean guitars, driving drums, catchy riffs, slightly raw production', 'casual male vocal', 'autotune, EDM', 'indie rock, indie', 'Rock, Alternative'),
        m('Grunge', 'Heavy, sludgy Seattle rock with detuned guitars and brooding vocals.', [90, 120], 'rock', 'detuned sludgy guitars, heavy drums, brooding, raw production, loud-quiet dynamics', 'raw gravelly male vocal', 'synths, pop polish', 'grunge, 90s grunge', 'Rock, Alternative'),
        m('Shoegaze', 'Walls of swirling, reverb-drenched guitars with dreamy, buried vocals.', [90, 125], 'rock', 'wall of reverb guitars, swirling fuzz, dreamy buried vocals, washed-out', 'hazy female vocal', 'rap, trap', 'shoegaze, dreamgaze', 'Rock, Alternative'),
        m('Garage Rock', 'Raw, loud, simple rock that sounds recorded live in a garage.', [130, 160], 'punk', 'raw fuzzy guitars, simple driving drums, live room sound, energetic', 'shouty male vocal', 'polished, synths', 'garage rock', 'Rock'),
        m('Anime Opening Rock', 'High-energy J-rock: fast drums, bright guitars, dramatic key changes, soaring vocals.', [160, 190], 'punk', 'fast driving drums, bright distorted guitars, dramatic key change, soaring chorus, piano accents', 'high tenor male vocal', 'lo-fi, slow', 'anime, j-rock, anime openings', 'Rock, J-Pop'),
        m('Stoner Rock', 'Slow, heavy, fuzzed-out desert riffs with a hazy groove.', [80, 110], 'rock', 'fuzzed-out riffs, heavy groove, desert rock, hazy, thick bass', 'laid-back male vocal', 'synths, pop', 'stoner rock, desert rock', 'Rock')
      ]
    },
    {
      id: 'metal', name: 'Metal', energy: 5, groove: 'metal', bpm: [90, 200], structure: 'rock', distro: 'Metal',
      blurb: 'The heaviest branch of rock: highly distorted guitars, powerful drums (often double kick), and intense vocals that range from soaring to screamed.',
      listen: ['Very distorted, heavy guitar riffs', 'Fast double-kick drumming', 'Intense vocals, sometimes screamed'],
      instruments: split('high-gain guitars, double kick drums, bass guitar, guitar solos, breakdowns'),
      moods: split('aggressive, epic, dark, intense, powerful'),
      micro: [
        m('Heavy Metal', 'Classic 80s metal: galloping riffs, twin guitar harmonies, and soaring vocals.', [120, 170], 'metal', 'galloping riffs, twin guitar harmonies, soaring vocals, epic guitar solo', 'high soaring male vocal', 'synths, rap', 'heavy metal, classic metal', 'Metal'),
        m('Metalcore', 'Screamed verses, sung choruses, and crushing breakdowns.', [120, 180], 'metal', 'chugging breakdowns, screamed verses, melodic clean chorus, double kick, modern production', 'screamed and clean male vocals', 'acoustic, soft', 'metalcore', 'Metal'),
        m('Djent', 'Technical, low-tuned, rhythmically complex palm-muted riffs with atmospheric layers.', [110, 150], 'metal', 'low-tuned polyrhythmic riffs, palm-muted chugs, atmospheric clean sections, tight production', 'clean male vocal', 'lo-fi, country', 'djent, progressive metal', 'Metal'),
        m('Symphonic Metal', 'Metal with orchestra and choir: cinematic, operatic, and grand.', [100, 160], 'metal', 'orchestral strings, epic choir, operatic vocals, heavy guitars, cinematic', 'operatic female vocal', 'trap, lo-fi', 'symphonic metal', 'Metal'),
        m('Black Metal', 'Fast tremolo-picked guitars, blast beats, and shrieked vocals with a cold atmosphere.', [140, 200], 'metal', 'tremolo picking, blast beats, cold atmosphere, raw production, shrieked vocals', 'shrieked vocals', 'pop, happy', 'black metal', 'Metal'),
        m('Nu-Metal', 'Late-90s metal mixing downtuned riffs, hip-hop rhythms, and rapped vocals.', [90, 110], 'rock', 'downtuned riffs, hip-hop groove, DJ scratches, rapped and screamed vocals', 'rapped male vocal', 'orchestral, soft', 'nu metal, 2000s metal', 'Metal'),
        m('Doom Metal', 'Extremely slow, crushingly heavy, and mournful.', [50, 75], 'ballad', 'crushingly slow riffs, mournful, heavy fuzz, dark atmosphere', 'deep male vocal', 'fast, happy', 'doom metal', 'Metal')
      ]
    },
    {
      id: 'punk', name: 'Punk / Emo', energy: 5, groove: 'punk', bpm: [140, 200], structure: 'rock', distro: 'Alternative',
      blurb: 'Fast, short, loud, and simple rock with attitude. Emo branched off with more emotional, confessional lyrics.',
      listen: ['Fast, simple power chords', 'Short songs with shouty singalongs', 'Raw, rebellious attitude'],
      instruments: split('fast power chords, driving bass, fast drums, gang vocals'),
      moods: split('rebellious, energetic, angsty, nostalgic, raw'),
      micro: [
        m('Pop Punk', 'Catchy, fast, youthful punk with big singalong choruses.', [160, 190], 'punk', 'fast power chords, catchy singalong chorus, palm-muted verses, youthful energy', 'nasal male vocal', 'synths, trap', 'pop punk, 2000s pop punk', 'Alternative, Rock'),
        m('Midwest Emo', 'Twinkly, intricate clean guitars, odd time signatures, and heartfelt vocals.', [120, 160], 'rock', 'twinkly clean guitar tapping, math-rock rhythms, heartfelt, raw', 'earnest male vocal', 'EDM, polish', 'midwest emo, twinkle emo', 'Alternative, Rock'),
        m('Post-Punk', 'Dark, angular, bass-led punk with icy guitars and detached vocals.', [120, 150], 'punk', 'driving melodic bassline, angular guitars, icy synths, cold reverb, detached baritone', 'detached baritone vocal', 'happy, country', 'post punk, coldwave, darkwave', 'Alternative, Rock'),
        m('Hardcore Punk', 'Very fast, very aggressive, very short songs with shouted vocals.', [180, 220], 'punk', 'very fast drums, aggressive shouted vocals, short songs, raw', 'shouted male vocal', 'soft, orchestral', 'hardcore punk', 'Alternative, Rock'),
        m('Ska Punk', 'Punk energy with upstroke offbeat guitars and horn sections.', [150, 190], 'reggae', 'offbeat upstroke guitar, bright horn section, fast punk drums, bouncy bass', 'energetic male vocal', 'trap, ambient', 'ska punk, third wave ska', 'Alternative, Rock')
      ]
    },
    {
      id: 'country', name: 'Country', energy: 3, groove: 'train', bpm: [80, 130], structure: 'pop', distro: 'Country',
      blurb: 'American storytelling music rooted in the South: acoustic and steel guitars, fiddles, and clear vocals telling real-life stories.',
      listen: ['Story-driven lyrics', 'Twangy guitars, fiddle, or banjo', 'Clear vocals, sometimes with a southern accent'],
      instruments: split('acoustic guitar, pedal steel, fiddle, banjo, telecaster twang, upright bass'),
      moods: split('nostalgic, heartfelt, feel-good, rowdy, melancholic'),
      micro: [
        m('Modern Country Pop', 'Radio-ready country with pop production and big hooks.', [90, 120], 'rock', 'acoustic guitar, pop production, big singalong chorus, subtle banjo, polished', 'warm female vocal', 'trap hi-hats, EDM', 'country pop, hot country', 'Country, Pop'),
        m('Outlaw Country', 'Gritty, rebellious 70s-style country with twangy guitars and raw vocals.', [90, 120], 'train', 'twangy telecaster, walking bass, pedal steel, gritty, honky-tonk', 'gravelly baritone male vocal', 'synths, pop polish', 'outlaw country, classic country', 'Country'),
        m('Americana', 'Rootsy blend of country, folk, and rock with an earthy, lived-in sound.', [80, 115], 'train', 'earthy acoustic guitar, dobro, harmonica, rootsy, warm analog', 'weathered male vocal', 'synths, EDM', 'americana, roots', 'Country, Folk'),
        m('Bluegrass', 'Fast acoustic string-band music: banjo, mandolin, fiddle, and tight harmonies.', [110, 150], 'train', 'rolling banjo, mandolin chops, fiddle, upright bass, high lonesome harmonies, acoustic', 'high lonesome male vocal', 'drums, electric guitar', 'bluegrass', 'Country, Folk'),
        m('Country Rap', 'Country instruments over hip-hop beats with rapped and sung vocals.', [80, 100], 'trap', 'banjo loop, trap drums, 808, southern drawl rap, twangy guitar', 'southern male rap vocal', 'orchestral', 'country rap, hick hop', 'Country, Hip-Hop/Rap'),
        m('Honky-Tonk', 'Classic bar-room country with shuffling beats, piano, and fiddle.', [100, 130], 'train', 'shuffle beat, honky-tonk piano, fiddle, twangy guitar, dancehall country', 'twangy male vocal', 'synths, 808', 'honky tonk, classic country', 'Country')
      ]
    },
    {
      id: 'folk', name: 'Folk / Acoustic', energy: 2, groove: 'ballad', bpm: [70, 120], structure: 'pop', distro: 'Singer/Songwriter',
      blurb: 'Songs built around acoustic instruments and honest storytelling. Often just a voice and a guitar, sometimes a small band.',
      listen: ['Acoustic guitar or piano at the center', 'Natural, unpolished voice', 'Lyrics that tell a story'],
      instruments: split('acoustic guitar, piano, harmonica, mandolin, cello, light percussion'),
      moods: split('intimate, nostalgic, reflective, warm, melancholic'),
      micro: [
        m('Indie Folk', 'Warm, harmony-rich acoustic music with reverb and a woodsy feel.', [80, 115], 'ballad', 'fingerpicked acoustic guitar, warm harmonies, reverb, woodsy, gentle banjo', 'soft male vocal', 'EDM, distortion', 'indie folk, folk', 'Singer/Songwriter, Folk'),
        m('Singer-Songwriter', 'One voice, one instrument, deeply personal lyrics.', [70, 110], 'ballad', 'solo acoustic guitar, intimate close-mic vocal, sparse, confessional', 'intimate female vocal', 'drums, synths', 'singer songwriter, acoustic', 'Singer/Songwriter'),
        m('Stomp-Clap Folk Pop', 'Upbeat folk with stomps, claps, "hey!" shouts and group singalongs.', [100, 125], 'rock', 'foot stomps, handclaps, gang vocals, banjo, acoustic strumming, anthemic', 'raw male vocal', 'synths, trap', 'folk pop, stomp clap', 'Folk, Pop'),
        m('Celtic Folk', 'Irish/Scottish traditional sound: fiddle, tin whistle, bodhrán drum.', [100, 140], 'train', 'fiddle, tin whistle, bodhran, uilleann pipes, jig rhythm', 'clear female vocal', 'synths, 808', 'celtic, irish folk', 'Folk, World'),
        m('Chamber Folk', 'Folk with orchestral touches: strings, woodwinds, delicate arrangements.', [70, 100], 'ballad', 'string quartet, fingerpicked guitar, woodwinds, delicate arrangement', 'delicate female vocal', 'distortion, 808', 'chamber folk, baroque folk', 'Folk, Singer/Songwriter')
      ]
    },
    {
      id: 'jazz', name: 'Jazz', energy: 2, groove: 'swing', bpm: [70, 220], structure: 'jazz', distro: 'Jazz',
      blurb: 'Music with complex, colorful chords, improvisation (musicians making up solos on the spot), and often a "swing" rhythm that bounces in triplets.',
      listen: ['Swinging, bouncy rhythm', 'Improvised solos on sax, trumpet, or piano', 'Rich, complex chords'],
      instruments: split('upright bass, ride cymbal, piano, saxophone, trumpet, brushed drums'),
      moods: split('smooth, sophisticated, playful, smoky, relaxed'),
      micro: [
        m('Swing / Big Band', '1930s–40s dance jazz with a full horn section and a bouncing groove.', [140, 200], 'swing', 'big band horn section, walking bass, swinging ride cymbal, brass hits, vintage 1940s', 'crooner male vocal', 'synths, 808', 'swing, big band', 'Jazz'),
        m('Bebop', 'Fast, virtuosic small-group jazz with complex solos.', [200, 280], 'swing', 'fast bebop saxophone runs, walking upright bass, ride cymbal, virtuosic solos', 'instrumental', 'synths, EDM', 'bebop, classic jazz', 'Jazz'),
        m('Smooth Jazz', 'Polished, relaxing jazz with soprano sax and soft grooves.', [80, 100], 'funk', 'soprano saxophone, smooth electric piano, soft groove, polished', 'instrumental', 'distortion', 'smooth jazz', 'Jazz'),
        m('Jazz-Funk', 'Jazz chords played over tight, funky grooves.', [95, 115], 'funk', 'Rhodes piano, slap bass, tight funky drums, horn stabs, jazzy chords', 'warm male vocal', 'trap, metal', 'jazz funk, fusion', 'Jazz, R&B/Soul'),
        m('Bossa Nova', 'Relaxed Brazilian jazz with soft nylon guitar and gentle syncopated rhythm.', [120, 140], 'bossa', 'nylon string guitar, soft brushed drums, gentle syncopation, breezy, flute', 'soft breathy female vocal', 'distortion, 808', 'bossa nova, brazilian jazz', 'Jazz, Latin'),
        m('Vocal Jazz Lounge', 'Late-night club jazz: piano trio and a smoky, intimate singer.', [70, 110], 'swing', 'piano trio, brushed snare, upright bass, smoky club atmosphere', 'smoky female vocal', 'EDM, trap', 'vocal jazz, lounge', 'Jazz'),
        m('Nu Jazz', 'Jazz mixed with electronic beats and modern production.', [90, 120], 'boombap', 'jazz horns over electronic beats, broken beat drums, modern production', 'soulful female vocal', 'country', 'nu jazz, jazztronica', 'Jazz, Electronic')
      ]
    },
    {
      id: 'blues', name: 'Blues', energy: 2, groove: 'sixeight', bpm: [60, 120], structure: 'pop', distro: 'Blues',
      blurb: 'The root of rock and R&B. Expressive guitar that "talks" back to the singer, a shuffle rhythm, and lyrics about hard times.',
      listen: ['Expressive bending guitar licks', 'A shuffling, rolling rhythm', 'Call-and-response between voice and guitar'],
      instruments: split('electric guitar, harmonica, piano, shuffle drums, walking bass, hammond organ'),
      moods: split('soulful, gritty, melancholic, smoky, raw'),
      micro: [
        m('Delta Blues', 'Raw, early acoustic blues: slide guitar and a lone voice.', [60, 90], 'sixeight', 'slide guitar, solo acoustic, foot stomps, raw, dusty', 'gritty male vocal', 'synths, drums', 'delta blues, acoustic blues', 'Blues'),
        m('Chicago Electric Blues', 'Electric band blues with harmonica, piano, and shuffle groove.', [80, 120], 'sixeight', 'electric guitar licks, harmonica, shuffle groove, barrelhouse piano', 'powerful male vocal', 'synths, EDM', 'chicago blues, electric blues', 'Blues'),
        m('Slow Electric Blues', 'Slow-burning blues with singing lead guitar and wide bends.', [55, 75], 'sixeight', 'singing lead guitar with wide bends, lazy shuffle, warm walking bass, tremolo rhythm guitar', 'soulful male vocal', 'synths', 'slow blues', 'Blues'),
        m('Blues Rock', 'Loud, riff-heavy blues with rock drums and overdriven guitars.', [100, 130], 'rock', 'overdriven blues riffs, rock drums, fiery guitar solo', 'raspy male vocal', 'synths, 808', 'blues rock', 'Blues, Rock')
      ]
    },
    {
      id: 'latin', name: 'Latin', energy: 4, groove: 'dembow', bpm: [85, 180], structure: 'pop', distro: 'Latin',
      blurb: 'Music from Latin America and Spanish-speaking artists: from dance-floor reggaeton to romantic bachata and brass-heavy salsa. Rhythm is king.',
      listen: ['Distinct dance rhythms (dembow, clave)', 'Often sung in Spanish', 'Percussion-rich grooves'],
      instruments: split('dembow drums, congas, bongos, nylon guitar, brass section, 808 bass'),
      moods: split('sensual, festive, romantic, energetic, summery'),
      micro: [
        m('Reggaeton', 'The Latin dance-floor sound, built on the "dembow" drum rhythm.', [88, 98], 'dembow', 'dembow rhythm, 808 bass, synth plucks, perreo, club', 'smooth male vocal', 'rock, orchestral', 'reggaeton, perreo, latin party', 'Latin, Urbano'),
        m('Latin Trap', 'Trap beats with Spanish-language rap and melodic hooks.', [130, 150], 'trap', 'trap hi-hats, 808 bass, dark melody, spanish rap, autotune hooks', 'male rap vocal with autotune', 'acoustic, bright', 'latin trap, trap latino', 'Latin, Urbano'),
        m('Bachata', 'Romantic Dominican music with intricate guitar picking and bongos.', [120, 140], 'bossa', 'intricate requinto guitar, bongos, guira, romantic, heartbroken', 'romantic male vocal', 'distortion, 808', 'bachata', 'Latin'),
        m('Salsa', 'Brass-heavy Afro-Cuban dance music with piano montunos and clave rhythm.', [160, 200], 'bossa', 'brass section, piano montuno, congas, timbales, clave rhythm', 'powerful male vocal', 'synths, 808', 'salsa, salsa dura', 'Latin'),
        m('Cumbia', 'Colombian roots music with a shuffling, hypnotic dance groove and accordion.', [90, 110], 'reggae', 'accordion, guiro scrape, shuffling cumbia rhythm, festive', 'festive male vocal', 'distortion', 'cumbia', 'Latin'),
        m('Corridos Tumbados', 'Modern Mexican regional: acoustic guitars and tuba with urban swagger.', [120, 150], 'train', 'requinto guitar, tuba bass, acoustic strumming, urban swagger', 'raspy male vocal', 'synths, EDM', 'corridos tumbados, regional mexicano', 'Latin, Regional Mexican')
      ]
    },
    {
      id: 'caribbean', name: 'Reggae / Caribbean', energy: 2, groove: 'reggae', bpm: [65, 160], structure: 'pop', distro: 'Reggae',
      blurb: 'Jamaican and Caribbean music. Reggae has a relaxed groove where the guitar chops on the offbeat ("skank") and the drums often hit on beat 3 ("one drop").',
      listen: ['Guitar "chops" on the offbeat', 'Deep, melodic bass lines', 'Laid-back, swaying feel'],
      instruments: split('skank guitar, deep bass, one-drop drums, organ bubble, horns'),
      moods: split('laid-back, uplifting, sunny, conscious, groovy'),
      micro: [
        m('Roots Reggae', 'Classic 70s conscious reggae with one-drop drums and deep bass.', [65, 80], 'reggae', 'one drop drums, offbeat skank guitar, deep melodic bass, organ bubble, conscious', 'warm male vocal', 'distortion, EDM', 'roots reggae, reggae classics', 'Reggae'),
        m('Dancehall', 'Digital, energetic Jamaican club music with toasting vocals.', [90, 105], 'dancehall', 'digital riddim, heavy bass, island percussion, toasting vocal, club', 'toasting male vocal', 'acoustic, orchestral', 'dancehall', 'Reggae'),
        m('Dub', 'Instrumental reggae remixed with deep echo, reverb, and heavy bass.', [65, 80], 'reggae', 'heavy echo delays, spring reverb, deep bass, dropouts, instrumental dub', 'instrumental', 'pop polish', 'dub, dub reggae', 'Reggae'),
        m('Soca', 'High-energy Carnival party music from Trinidad.', [150, 165], 'dancehall', 'fast carnival rhythm, steel pan, brass, party chants', 'energetic male vocal', 'slow, sad', 'soca, carnival', 'Reggae, World'),
        m('Reggae Pop', 'Radio-friendly reggae with pop hooks and warm production.', [80, 100], 'reggae', 'smooth skank guitar, pop hooks, warm organic production, deep roots bassline', 'heartfelt female vocal', 'distortion', 'reggae pop, summer reggae', 'Reggae, Pop')
      ]
    },
    {
      id: 'african', name: 'African / Afro', energy: 4, groove: 'afro', bpm: [95, 125], structure: 'pop', distro: 'African',
      blurb: 'Modern African popular music. Afrobeats (Nigeria/Ghana) has bouncy, percussive grooves; Amapiano (South Africa) is known for its deep "log drum" bass.',
      listen: ['Layered, interlocking percussion', 'Bouncy, danceable swing', 'Chant-like, melodic vocals'],
      instruments: split('shakers, congas, talking drum, log drum, guitar licks, synth pads'),
      moods: split('joyful, groovy, summery, sensual, celebratory'),
      micro: [
        m('Afrobeats', 'Nigerian/Ghanaian pop with bouncy percussion, melodic vocals, and warm groove.', [100, 115], 'afro', 'bouncy afro percussion, shakers, melodic guitar licks, warm synths, pidgin english', 'melodic male vocal', 'distortion, metal', 'afrobeats, afro pop', 'African, Pop'),
        m('Amapiano', 'South African house with piano, jazzy chords, and the signature "log drum" bass.', [110, 115], 'amapiano', 'log drum bass, shakers, jazzy piano chords, deep house groove, airy pads', 'smooth male vocal', 'rock guitars', 'amapiano, piano', 'African, Dance'),
        m('Afrobeat (Classic)', 'Fela Kuti-style 70s funk-jazz jams with horns and hypnotic grooves.', [100, 120], 'funk', 'horn section, interlocking guitars, hypnotic groove, polyrhythmic percussion, long jam', 'call-and-response vocals', 'synths, 808', 'afrobeat, afro funk', 'African, Jazz'),
        m('Highlife', 'Ghanaian guitar-band music with sweet, bright guitar melodies.', [110, 130], 'afro', 'sweet highlife guitar, brass, bright percussion, joyful', 'bright male vocal', 'distortion', 'highlife', 'African'),
        m('Afroswing', 'UK blend of afrobeats, dancehall, and rap with melodic flows.', [95, 105], 'dancehall', 'afro percussion, dancehall bounce, melodic rap, smooth synths', 'melodic male rap vocal', 'rock', 'afroswing, uk afro', 'African, Hip-Hop/Rap'),
        m('Gqom', 'Dark, raw, bass-heavy South African club music with broken rhythms.', [120, 128], 'afro', 'dark broken kicks, raw tribal percussion, heavy bass, hypnotic', 'chant vocals', 'soft, acoustic', 'gqom', 'African, Dance')
      ]
    },
    {
      id: 'funk', name: 'Funk / Disco', energy: 4, groove: 'funk', bpm: [95, 125], structure: 'pop', distro: 'R&B/Soul',
      blurb: 'Funk is all about groove: tight rhythm guitar, popping bass, and drums that lock together. Disco smoothed it out with a steady dance beat and strings.',
      listen: ['Rubbery, popping bass lines', 'Choppy rhythm guitar', 'Grooves that make you move'],
      instruments: split('slap bass, rhythm guitar, clavinet, horn section, strings, tight drums'),
      moods: split('groovy, playful, sexy, joyful, confident'),
      micro: [
        m('70s Funk', 'Raw, tight funk with slap bass, wah guitar, and horn stabs.', [95, 115], 'funk', 'slap bass, wah wah guitar, clavinet, horn stabs, tight drums', 'gritty soul male vocal', 'synths, 808', 'funk, 70s funk', 'R&B/Soul'),
        m('Disco', '70s dance music: four-on-the-floor, open hi-hats, strings, and octave bass.', [115, 125], 'disco', 'four-on-the-floor beat, open hi-hats, octave bassline, sweeping strings, glittery', 'diva female vocal', 'trap, distortion', 'disco, 70s disco', 'Dance, R&B/Soul'),
        m('80s Boogie', 'Synth-driven post-disco funk with talkbox and slick grooves.', [105, 118], 'funk', 'synth bass, talkbox, slick drum machine, funky guitar, 80s', 'smooth male vocal', 'distortion', 'boogie, 80s funk', 'R&B/Soul, Dance'),
        m('Funk Rock', 'Funky grooves with rock guitars and attitude.', [100, 120], 'funk', 'slap bass, distorted funky riffs, tight drums, attitude', 'raspy male vocal', 'orchestral', 'funk rock', 'Rock, R&B/Soul')
      ]
    },
    {
      id: 'chill', name: 'Lo-fi / Chill / Ambient', energy: 1, groove: 'lofi', bpm: [60, 95], structure: 'instrumental', distro: 'Electronic',
      blurb: 'Relaxed, background-friendly music. Lo-fi means intentionally imperfect sound (vinyl crackle, soft drums). Ambient drops the beat entirely for floating textures.',
      listen: ['Soft, relaxed or no drums', 'Warm, fuzzy, imperfect textures', 'Few or no vocals'],
      instruments: split('dusty drums, Rhodes piano, jazzy guitar, vinyl crackle, soft pads, field recordings'),
      moods: split('relaxed, dreamy, melancholic, cozy, nostalgic'),
      micro: [
        m('Lo-fi Hip Hop', 'Study-beat classic: dusty drums, jazzy chords, vinyl crackle.', [70, 90], 'lofi', 'dusty boom bap drums, jazzy Rhodes chords, vinyl crackle, tape wobble, mellow', 'instrumental', 'distortion, rap vocals', 'lofi beats, study beats, chill beats', 'Electronic, Hip-Hop/Rap'),
        m('Chillhop', 'Brighter, jazzier lo-fi with live instruments and bouncy beats.', [80, 95], 'lofi', 'jazzy guitar, bouncy drums, warm bass, flute, sunny', 'instrumental', 'distortion', 'chillhop, jazzy beats', 'Electronic, Hip-Hop/Rap'),
        m('Ambient', 'Beatless, floating music of evolving textures and pads.', [50, 80], 'ambient', 'evolving pads, no drums, spacious reverb, drones, field recordings', 'instrumental', 'drums, rap', 'ambient, sleep, meditation', 'Electronic, New Age'),
        m('Downtempo / Trip-Hop', 'Slow, moody electronic music with breakbeats and cinematic samples.', [70, 95], 'boombap', 'slow breakbeat, moody bass, cinematic samples, smoky atmosphere', 'haunting female vocal', 'bright pop', 'trip hop, downtempo', 'Electronic'),
        m('Chillwave', 'Hazy, nostalgic synth pop washed in reverb and tape saturation.', [80, 110], 'four', 'hazy synths, tape saturation, reverb-washed vocals, nostalgic, summer haze', 'dreamy male vocal', 'aggressive', 'chillwave', 'Electronic, Alternative'),
        m('Vaporwave', 'Slowed, chopped 80s/90s mall music turned surreal and nostalgic.', [60, 90], 'lofi', 'slowed chopped samples, smooth 80s saxophone, dreamy, retro mall ambience', 'instrumental', 'aggressive', 'vaporwave', 'Electronic')
      ]
    },
    {
      id: 'cinematic', name: 'Cinematic / Orchestral', energy: 3, groove: 'cinematic', bpm: [60, 140], structure: 'instrumental', distro: 'Soundtrack',
      blurb: 'Music that sounds like a movie or game soundtrack. Orchestras, choirs, and huge drums create emotion and drama, usually without lyrics.',
      listen: ['Orchestra: strings, brass, woodwinds', 'Big dynamic swells from quiet to huge', 'Tells a story without words'],
      instruments: split('string section, brass, timpani, choir, piano, taiko drums'),
      moods: split('epic, dramatic, emotional, mysterious, heroic'),
      micro: [
        m('Epic Trailer', 'Movie-trailer music: pounding drums, huge brass, choirs, and braams.', [80, 140], 'cinematic', 'pounding taiko drums, huge brass, epic choir, braams, rising tension, massive climax', 'epic choir', 'lo-fi, country', 'epic music, trailer music', 'Soundtrack'),
        m('Film Score', 'Emotional orchestral storytelling in the style of a movie soundtrack.', [60, 110], 'cinematic', 'sweeping strings, french horns, delicate woodwinds, emotional swells, full orchestra', 'instrumental', 'trap, distortion', 'film score, soundtrack', 'Soundtrack, Classical'),
        m('Neo-Classical Piano', 'Minimal, emotional solo piano with soft strings.', [60, 90], 'ambient', 'solo felt piano, soft strings, minimal, emotional, intimate', 'instrumental', 'drums, synths', 'neoclassical, peaceful piano', 'Classical'),
        m('Dark Ambient Score', 'Tense, eerie soundscapes for thrillers and horror.', [50, 90], 'ambient', 'eerie drones, dissonant strings, low brass, tension, unsettling', 'instrumental', 'happy, pop', 'dark ambient, horror', 'Soundtrack'),
        m('Chiptune', 'Retro video-game music made with 8-bit console sounds.', [120, 160], 'chip', '8-bit square wave leads, chiptune arpeggios, retro game console, bleepy', 'instrumental', 'orchestral, acoustic', 'chiptune, video game music', 'Electronic, Soundtrack'),
        m('Fantasy RPG', 'Adventurous orchestral-folk fit for a fantasy video game.', [90, 130], 'cinematic', 'celtic flute, harp, strings, adventurous, fantasy', 'instrumental', 'trap, EDM', 'fantasy music, rpg music', 'Soundtrack')
      ]
    },
    {
      id: 'gospel', name: 'Gospel / Worship', energy: 3, groove: 'ballad', bpm: [65, 120], structure: 'pop', distro: 'Christian/Gospel',
      blurb: 'Faith-based music. Gospel features powerful choirs, organ, and soulful lead vocals. Modern worship sounds like anthemic pop-rock.',
      listen: ['Uplifting, spiritual lyrics', 'Choirs and call-and-response', 'Big emotional builds'],
      instruments: split('hammond organ, piano, choir, bass, drums, strings'),
      moods: split('uplifting, joyful, spiritual, hopeful, powerful'),
      micro: [
        m('Contemporary Worship', 'Anthemic pop-rock worship with building dynamics and ambient guitars.', [65, 80], 'ballad', 'ambient swell guitars, piano, building dynamics, anthemic chorus, pads', 'heartfelt male vocal', 'trap, distortion', 'worship, christian', 'Christian/Gospel'),
        m('Traditional Gospel', 'Powerful choir, hammond organ, and call-and-response energy.', [90, 120], 'sixeight', 'mass choir, hammond organ, call-and-response, handclaps, powerful', 'powerful female vocal with choir', 'EDM', 'gospel, gospel choir', 'Christian/Gospel'),
        m('Southern Gospel', 'Country-flavored gospel with tight quartet harmonies.', [90, 120], 'train', 'quartet harmonies, piano, acoustic guitar, country gospel', 'male quartet', 'synths', 'southern gospel', 'Christian/Gospel, Country')
      ]
    },
    {
      id: 'kids', name: 'Kids / Family', energy: 3, groove: 'ballad', bpm: [90, 130], structure: 'pop', distro: "Children's Music",
      blurb: 'Simple, cheerful songs for children. Short lines, lots of repetition, and clear vocals so kids can sing along.',
      listen: ['Simple, repetitive melodies', 'Bright, cheerful sounds', 'Clear, easy words'],
      instruments: split('ukulele, glockenspiel, handclaps, acoustic guitar, xylophone, piano'),
      moods: split('cheerful, playful, silly, gentle, educational'),
      micro: [
        m('Kids Pop', 'Upbeat, bouncy songs with singalong hooks.', [110, 130], 'rock', 'bouncy beat, handclaps, bright synths, singalong chorus, playful', "children's choir", 'dark, distortion', 'kids songs, family', "Children's Music"),
        m('Lullaby', 'Soft, slow, soothing songs for bedtime.', [55, 75], 'ambient', 'music box, soft piano, gentle strings, soothing, slow', 'gentle female vocal', 'drums, distortion', 'lullaby, sleep', "Children's Music"),
        m('Educational Song', 'Songs that teach (letters, numbers, shapes) with a clear, repetitive structure.', [100, 120], 'rock', 'clear simple melody, ukulele, xylophone, call-and-response, repetitive', 'friendly female vocal', 'dark, heavy', 'learning songs, preschool', "Children's Music")
      ]
    }
  ];

  window.GENRE_INDEX = {};
  window.GENRES.forEach((g) => {
    window.GENRE_INDEX[g.id] = g;
    g.micro.forEach((mm) => { mm.parent = g.id; if (!mm.groove) mm.groove = g.groove; });
  });

  // Beginner quick picks: a feeling -> a good starting point.
  window.VIBES = [
    { name: 'Late-night drive', genre: 'edm', micro: 'synthwave', moods: ['nostalgic', 'dreamy'] },
    { name: 'Gym hype', genre: 'hiphop', micro: 'drift-phonk', moods: ['aggressive', 'hype'] },
    { name: 'Study and focus', genre: 'chill', micro: 'lo-fi-hip-hop', moods: ['relaxed', 'cozy'] },
    { name: 'Summer party', genre: 'latin', micro: 'reggaeton', moods: ['festive', 'summery'] },
    { name: 'Heartbreak', genre: 'pop', micro: 'pop-ballad', moods: ['melancholic', 'bittersweet'] },
    { name: 'Coffee shop', genre: 'folk', micro: 'indie-folk', moods: ['warm', 'intimate'] },
    { name: 'Club night', genre: 'house', micro: 'tech-house', moods: ['groovy', 'hypnotic'] },
    { name: 'Epic moment', genre: 'cinematic', micro: 'epic-trailer', moods: ['epic', 'heroic'] },
    { name: 'Road trip', genre: 'country', micro: 'modern-country-pop', moods: ['feel-good', 'nostalgic'] },
    { name: 'Sunday morning', genre: 'rnb', micro: 'neo-soul', moods: ['smooth', 'warm'] },
    { name: 'Let it out', genre: 'metal', micro: 'metalcore', moods: ['aggressive', 'intense'] },
    { name: 'Roller rink', genre: 'funk', micro: 'disco', moods: ['joyful', 'groovy'] },
    { name: 'Beach sunset', genre: 'african', micro: 'amapiano', moods: ['summery', 'smooth'] },
    { name: 'Rainy window', genre: 'rnb', micro: 'alternative-r-and-b', moods: ['melancholic', 'late-night'] }
  ];
})();
