# Song Prompt Studio

A beginner-friendly Electron desktop app that builds ready-to-paste prompts for **Suno** (Simple, Advanced and Sounds modes) and the **YuE2** music model.

## Run it

```bash
npm install
npm start
```

Build an installer:

```bash
npm run dist        # current platform
npm run dist:win    # Windows (NSIS)
npm run dist:mac    # macOS (dmg)
npm run dist:linux  # Linux (AppImage)
```

Requires Node.js 18+.

## What's inside

**Build a prompt** walks through 11 steps: pick a feeling (quick "vibe" presets for total beginners), a genre, an optional micro-genre, mood and energy, tempo and key, vocals, instruments, production and era, title/theme/lyrics, things to exclude, and how polished you want the result.

**Output panel** (right side) has one tab per target:

- **Suno Simple** — a single natural-language description plus the Instrumental toggle and model to pick.
- **Suno Advanced** — Title, Styles, Lyrics (formatted with Suno section tags), Exclude styles, and a settings table (model, vocal gender, Weirdness, Style Influence, Max Mode, duration).
- **Suno Sounds** — a sound description with One-Shot/Loop, BPM and key.
- **YuE2** — short comma-separated style tags (most important first, `no X` negatives), strictly formatted lyrics, recommended run settings, and a WildSongBench-style combined string.

Each field has its own Copy button; "Copy everything", Save and Export (.txt/.md) are at the bottom. Distribution notes suggest primary/secondary genres and playlist keywords for your distributor.

**Prompt research** lets you search songs, artists and albums with autocomplete (arrow keys + Enter, or click; filter by Everything, Songs, Artists or Albums). Add results to a scratch pad, where each reference is matched to a genre and micro-genre you can correct, can be marked as your main reference (double weight), previewed (30-second clip), and annotated. The app then shows several prompt directions, such as a blend of your two strongest styles, the single shared style, runner-up styles, a modern update of older references, and one per reference. Select a direction to see the full prompt in the right panel, copy it, open it in the builder, or pin it. Save the session under a name, then reopen, duplicate, export (.txt/.md) or delete it from Saved research. Your current session is also kept automatically between launches.

Prompts from research describe the sound (genre, tempo, era, instruments, vocal) and never include artist or song names. Suno rejects artist names in styles, and describing the sound keeps your release original.

Search data: song, artist and album lookup uses the free iTunes Search API. When you add a reference, the app also asks MusicBrainz for style tags and artist gender and Deezer for tempo; these are optional and the app works without them. Search needs an internet connection.

**Explore genres** — 22 parent genres and 129 micro-genres, each with a plain-English explanation, "listen for" tips, typical BPM, a playable groove sketch, and links to hear real examples on YouTube/Spotify.

**Lyrics lab** — paste messy lyrics; the app labels sections, expands "repeat chorus" / "x2" shorthand, strips production notes for YuE2 (converts them to [cues] for Suno), and flags syllable mismatches between repeated choruses.

**Example prompts** — 24 original examples in the WildSongBench tag style, each with a short lesson.

**Music terms** — searchable glossary of ~50 terms in plain language.

**Saved** — keep, reopen and export prompts. Everything is stored locally.

## Notes

- Reference matching is automatic and can be wrong, especially for artists with few tags. Check the "Sounds like" choice on each reference.
- Groove sketches are simplified synth demos to convey rhythm and feel; use the Listen links to hear real recordings.
- YuE2 sings in English, Mandarin and Japanese only; the app warns when another language is chosen.
- For YuE2, generate 2–4 candidates and keep the best — it measurably improves results.
- Before distributing, check your Suno plan's commercial-use terms (paid plans are required for commercial rights).
- Suno features and model names change often; the settings reflect Suno v6 as of September 2026.

## Sources used for the prompting rules

- YuE2 prompting guide — songcreator.pro/blog/yue2-prompting-guide
- WildSongBench dataset card — huggingface.co/datasets/m-a-p/WildSongBench
- Suno v6 documentation and guides
