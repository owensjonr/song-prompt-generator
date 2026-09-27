/* Shared vocabulary: options for the builder plus a plain-language glossary. */
(function () {
  window.VOCAB = {
    moods: ['uplifting', 'euphoric', 'joyful', 'playful', 'confident', 'romantic', 'sensual', 'dreamy', 'nostalgic',
      'bittersweet', 'melancholic', 'heartbroken', 'reflective', 'intimate', 'hopeful', 'epic', 'dramatic', 'dark',
      'mysterious', 'eerie', 'aggressive', 'rebellious', 'hypnotic', 'relaxed', 'cozy', 'groovy', 'hype', 'triumphant', 'anxious', 'defiant'],

    energy: [
      { label: 'Very calm', words: 'slow, gentle, minimal' },
      { label: 'Laid-back', words: 'relaxed, unhurried' },
      { label: 'Steady', words: 'mid-tempo, steady groove' },
      { label: 'Driving', words: 'driving, energetic' },
      { label: 'Explosive', words: 'high-energy, explosive, intense' }
    ],

    vocalTypes: [
      { id: 'female', label: 'Female', tag: 'female vocal', gender: 'Female' },
      { id: 'male', label: 'Male', tag: 'male vocal', gender: 'Male' },
      { id: 'duet', label: 'Duet', tag: 'male and female duet', gender: '' },
      { id: 'rap-m', label: 'Rap (male)', tag: 'male rap vocal', gender: 'Male' },
      { id: 'rap-f', label: 'Rap (female)', tag: 'female rap vocal', gender: 'Female' },
      { id: 'choir', label: 'Choir / group', tag: 'choir vocals', gender: '' },
      { id: 'none', label: 'Instrumental', tag: '', gender: '' }
    ],

    vocalTones: ['airy', 'breathy', 'warm', 'smoky', 'raspy', 'gritty', 'bright', 'powerful', 'soft', 'deep',
      'falsetto', 'belting', 'soulful', 'husky', 'nasal', 'whispered', 'operatic', 'autotuned', 'harmonized', 'spoken-word'],

    production: ['polished modern mix', 'warm analog', 'lo-fi texture', 'vinyl crackle', 'tape saturation', 'wide stereo',
      'punchy mastering', 'live room sound', 'dry and intimate', 'reverb-drenched', 'crisp and clean', 'radio-ready',
      'raw and unpolished', 'cinematic', 'sidechain pumping', 'heavy compression'],

    eras: ['', '1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', 'modern', 'futuristic'],

    keys: ['Auto', 'Major (happy/bright)', 'Minor (sad/dark)', 'C major', 'G major', 'D major', 'A major', 'E major', 'F major',
      'Bb major', 'A minor', 'E minor', 'D minor', 'B minor', 'F# minor', 'C minor', 'G minor'],

    // YuE2 sings English, Mandarin and Japanese. Suno handles many more.
    languages: ['English', 'Spanish', 'Portuguese', 'French', 'German', 'Italian', 'Japanese', 'Mandarin', 'Korean', 'Hindi'],
    yueLanguages: ['English', 'Mandarin', 'Japanese'],

    structures: {
      pop: ['Intro', 'Verse 1', 'Pre-Chorus', 'Chorus', 'Verse 2', 'Pre-Chorus', 'Chorus', 'Bridge', 'Chorus', 'Outro'],
      edm: ['Intro', 'Verse 1', 'Build-Up', 'Chorus', 'Drop', 'Verse 2', 'Build-Up', 'Chorus', 'Drop', 'Outro'],
      edmInstrumental: ['Intro', 'Build-Up', 'Drop', 'Breakdown', 'Build-Up', 'Drop', 'Outro'],
      hiphop: ['Intro', 'Hook', 'Verse 1', 'Hook', 'Verse 2', 'Hook', 'Bridge', 'Hook', 'Outro'],
      rock: ['Intro', 'Verse 1', 'Chorus', 'Verse 2', 'Chorus', 'Guitar Solo', 'Bridge', 'Chorus', 'Outro'],
      jazz: ['Intro', 'Verse 1', 'Chorus', 'Instrumental Solo', 'Verse 2', 'Chorus', 'Outro'],
      ballad: ['Intro', 'Verse 1', 'Chorus', 'Verse 2', 'Chorus', 'Bridge', 'Final Chorus', 'Outro'],
      instrumental: ['Intro', 'Main Theme', 'Build-Up', 'Climax', 'Breakdown', 'Main Theme', 'Outro'],
      short: ['Intro', 'Verse', 'Chorus', 'Verse', 'Chorus', 'Outro']
    },

    soundTypes: [
      { id: 'drum', label: 'Drum hit', hint: 'e.g. punchy acoustic snare with short room reverb' },
      { id: 'loop-drum', label: 'Drum loop', hint: 'e.g. dusty boom bap drum loop with swung hi-hats' },
      { id: 'bass', label: 'Bass', hint: 'e.g. deep 808 with slow glide' },
      { id: 'melodic', label: 'Melody / chords', hint: 'e.g. warm Rhodes chord progression' },
      { id: 'vocal', label: 'Vocal chop / chant', hint: 'e.g. pitched female "oh" vocal chop' },
      { id: 'fx', label: 'Riser / impact / FX', hint: 'e.g. white-noise riser building for 8 bars' },
      { id: 'ambience', label: 'Ambience', hint: 'e.g. rainy city street at night with distant traffic' },
      { id: 'foley', label: 'Foley / real-world', hint: 'e.g. vinyl record needle drop and crackle' }
    ],

    // Plain-language explanations for beginners.
    glossary: [
      ['BPM', 'Beats per minute: how fast the song is. 70 feels slow and relaxed, 120 is a steady dance pace, 170 is very fast.'],
      ['Tempo', 'The speed of the music, usually measured in BPM.'],
      ['Key', 'The "home" set of notes a song uses. Major keys usually sound bright or happy; minor keys sound darker or sadder.'],
      ['Verse', 'The part of the song that tells the story. The music repeats each time but the words change.'],
      ['Chorus', 'The main, most memorable part that repeats with the same words. Usually the biggest-sounding section.'],
      ['Hook', 'The catchiest bit of a song, the part that gets stuck in your head. In hip-hop, the chorus is often called the hook.'],
      ['Pre-Chorus', 'A short section between the verse and chorus that builds anticipation.'],
      ['Bridge', 'A section near the end that sounds different from everything else, giving contrast before the final chorus.'],
      ['Intro / Outro', 'The opening and closing sections. Often instrumental.'],
      ['Drop', 'In electronic music, the moment after a build-up where the full beat and bass come crashing in.'],
      ['Build-up', 'A section that rises in tension (faster drums, rising synths) leading to a drop or chorus.'],
      ['Breakdown', 'A section where most instruments drop out, creating space before things build again.'],
      ['Four-on-the-floor', 'A kick drum on every beat (1, 2, 3, 4). The heartbeat of house, disco, and most dance music.'],
      ['Backbeat', 'Snare drum on beats 2 and 4. The foundation of rock, pop, and R&B.'],
      ['Half-time', 'The drums feel half as fast as the tempo. Dubstep at 140 BPM feels like 70.'],
      ['Swing', 'A bouncy rhythm where notes are played long-short instead of evenly. Essential in jazz and boom bap.'],
      ['Syncopation', 'Accents on unexpected, off-beat places. Makes rhythms feel funky or danceable.'],
      ['Groove', 'The overall rhythmic feel that makes you want to move.'],
      ['808', 'A deep, booming bass drum sound from the Roland TR-808 drum machine. The core of trap and modern hip-hop.'],
      ['Sub bass', 'Very low bass you feel more than hear.'],
      ['Synth', 'Synthesizer: an electronic instrument that creates sounds from scratch.'],
      ['Pad', 'A soft, sustained background synth sound that fills space, like a musical cushion.'],
      ['Arpeggio', 'Playing the notes of a chord one at a time in a pattern, instead of all at once.'],
      ['Riff', 'A short, repeated musical phrase, often on guitar, that defines a song.'],
      ['Sidechain', 'A production trick that makes sounds "duck" each time the kick hits, creating a pumping effect common in EDM.'],
      ['Reverb', 'The echo-like sense of space, from a small room to a huge cathedral.'],
      ['Distortion', 'Deliberately overloading a sound to make it gritty, fuzzy, or aggressive.'],
      ['Lo-fi', 'Low fidelity: intentionally imperfect, warm, fuzzy sound (tape hiss, vinyl crackle).'],
      ['Analog', 'Sound made with physical hardware (tape, vintage synths). Often described as warm.'],
      ['Falsetto', 'A light, high singing voice above a singer\'s normal range.'],
      ['Belting', 'Singing loudly and powerfully in the upper chest voice. Big-chorus energy.'],
      ['Ad-libs', 'Short vocal extras between lines ("yeah!", "uh") common in hip-hop and R&B.'],
      ['Harmony', 'Two or more notes sung or played together that sound good.'],
      ['Instrumental', 'A song or section with no vocals.'],
      ['Micro-genre', 'A very specific sub-style (e.g. "Drift Phonk" rather than "Hip-Hop"). Easier to target a specific audience and playlist.'],
      ['Fusion', 'Blending two genres. Works best with established hybrids like folk rock or electro swing.'],
      ['Stems', 'Separate audio files for each part of a song (vocals, drums, bass) used for mixing or remixing.'],
      ['Mixing', 'Balancing all the parts of a song so they sound good together.'],
      ['Mastering', 'The final polish that makes a track loud, consistent, and ready for streaming services.'],
      ['One-shot', 'A single sound hit (one drum hit, one impact). Used in Suno Sounds.'],
      ['Loop', 'A short section designed to repeat seamlessly. Used in Suno Sounds.'],
      ['Style prompt', 'The text describing how a song should sound (genre, instruments, mood, vocals). Not what it\'s about.'],
      ['Style Influence (Suno)', 'How strictly Suno follows your Styles text. Higher = closer to your tags.'],
      ['Weirdness (Suno)', 'How safe or experimental Suno gets, from Safe to Chaos. Around 50% is balanced.'],
      ['Exclude styles (Suno)', 'Things you tell Suno to avoid, like "distorted guitars" for a soft song.'],
      ['Max Mode (Suno)', 'Costs more credits; meant for longer songs and consistency. Not needed for quick drafts.'],
      ['Planning mode (YuE2)', 'YuE2 composes melody and chords before rendering audio. Keep it on Full for original songs.'],
      ['Best-of-N', 'Generate several takes of the same prompt and keep the best. The single biggest quality boost for YuE2.'],
      ['Distributor', 'A service that puts your music on Spotify, Apple Music, etc. (DistroKid, TuneCore, CD Baby...). It asks for a primary genre.'],
      ['ISRC', 'A unique code identifying one recording. Your distributor usually assigns it.']
    ]
  };
})();
