const { app, BrowserWindow, ipcMain, clipboard, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Only these hosts can be opened from inside the app (listening links, docs).
const ALLOWED_HOSTS = [
  'www.youtube.com', 'youtube.com', 'music.youtube.com',
  'open.spotify.com', 'suno.com', 'help.suno.com',
  'songcreator.pro', 'huggingface.co',
  'music.apple.com', 'musicbrainz.org', 'www.deezer.com'
];

// ---------- reference search (Prompt research view) ----------
// Autocomplete uses the free iTunes Search API. Optional enrichment adds
// style tags + artist gender from MusicBrainz and BPM from Deezer.
// All requests run here in the main process so the page keeps a strict CSP.
const UA = 'SongPromptStudio/1.1 ( https://github.com/ )';
const cache = new Map();
async function getJSON(url, headers = {}) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json', ...headers }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (cache.size > 400) cache.delete(cache.keys().next().value);
  cache.set(url, data);
  return data;
}

const art = (u) => (u ? u.replace(/\/\d+x\d+bb\./, '/120x120bb.') : '');
const yearOf = (d) => (d ? +String(d).slice(0, 4) || null : null);
function normItunes(r) {
  if (r.wrapperType === 'track') return {
    kind: 'song', key: 'song:' + r.trackId, title: r.trackName, artist: r.artistName, album: r.collectionName,
    year: yearOf(r.releaseDate), genre: r.primaryGenreName || '', artwork: art(r.artworkUrl100),
    preview: r.previewUrl || '', url: r.trackViewUrl || '', explicit: r.trackExplicitness === 'explicit', durationMs: r.trackTimeMillis || 0
  };
  if (r.wrapperType === 'collection') return {
    kind: 'album', key: 'album:' + r.collectionId, title: r.collectionName, artist: r.artistName, album: r.collectionName,
    year: yearOf(r.releaseDate), genre: r.primaryGenreName || '', artwork: art(r.artworkUrl100), url: r.collectionViewUrl || '', tracks: r.trackCount || 0
  };
  if (r.wrapperType === 'artist') return {
    kind: 'artist', key: 'artist:' + r.artistId, title: r.artistName, artist: r.artistName, album: '',
    year: null, genre: r.primaryGenreName || '', artwork: '', url: r.artistLinkUrl || ''
  };
  return null;
}

async function itunes(term, entity, limit) {
  const url = `https://itunes.apple.com/search?media=music&entity=${entity}&limit=${limit}&term=${encodeURIComponent(term)}`;
  const data = await getJSON(url);
  return (data.results || []).map(normItunes).filter(Boolean);
}

ipcMain.handle('music-search', async (_e, { q, type }) => {
  const term = String(q || '').trim().slice(0, 100);
  if (term.length < 2) return { ok: true, results: [] };
  try {
    const want = { song: [['song', 10]], artist: [['musicArtist', 8]], album: [['album', 8]] }[type]
      || [['song', 6], ['musicArtist', 3], ['album', 4]];
    const parts = await Promise.all(want.map(([ent, n]) => itunes(term, ent, n).catch(() => [])));
    const seen = new Set();
    const results = parts.flat().filter((r) => !seen.has(r.key) && seen.add(r.key));
    return { ok: true, results };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
});

// MusicBrainz asks for at most one request per second.
let mbChain = Promise.resolve();
function mb(url) {
  const run = mbChain.then(() => getJSON(url));
  mbChain = run.catch(() => {}).then(() => new Promise((r) => setTimeout(r, 1100)));
  return run;
}
const q = (s) => '"' + String(s || '').replace(/["\\]/g, ' ') + '"';
const tagList = (arr) => (arr || []).map((t) => ({ name: String(t.name).toLowerCase(), count: t.count || 1 }));

ipcMain.handle('music-enrich', async (_e, { kind, title, artist }) => {
  const out = { tags: [], gender: '', artistType: '', bpm: 0, sources: [] };
  try {
    const a = await mb(`https://musicbrainz.org/ws/2/artist/?fmt=json&limit=1&query=${encodeURIComponent('artist:' + q(artist))}`);
    const hit = (a.artists || [])[0];
    if (hit && hit.score >= 85) {
      out.gender = (hit.gender || '').toLowerCase();
      out.artistType = (hit.type || '').toLowerCase();
      out.tags.push(...tagList(hit.tags));
      out.sources.push('MusicBrainz');
    }
    if (kind === 'song') {
      const r = await mb(`https://musicbrainz.org/ws/2/recording/?fmt=json&limit=3&query=${encodeURIComponent('recording:' + q(title) + ' AND artist:' + q(artist))}`);
      (r.recordings || []).filter((x) => x.score >= 85).forEach((x) => out.tags.push(...tagList(x.tags)));
    } else if (kind === 'album') {
      const r = await mb(`https://musicbrainz.org/ws/2/release-group/?fmt=json&limit=2&query=${encodeURIComponent('releasegroup:' + q(title) + ' AND artist:' + q(artist))}`);
      (r['release-groups'] || []).filter((x) => x.score >= 85).forEach((x) => out.tags.push(...tagList(x.tags)));
    }
  } catch (_) { /* optional */ }
  if (kind === 'song') {
    try {
      const s = await getJSON(`https://api.deezer.com/search?limit=1&q=${encodeURIComponent(`artist:${q(artist)} track:${q(title)}`)}`);
      const id = s.data && s.data[0] && s.data[0].id;
      if (id) {
        const t = await getJSON(`https://api.deezer.com/track/${id}`);
        if (t.bpm > 40) { out.bpm = Math.round(t.bpm); out.sources.push('Deezer'); }
      }
    } catch (_) { /* optional */ }
  }
  // merge duplicate tags
  const merged = {};
  out.tags.forEach((t) => { merged[t.name] = (merged[t.name] || 0) + t.count; });
  out.tags = Object.entries(merged).map(([name, count]) => ({ name, count })).sort((x, y) => y.count - x.count).slice(0, 25);
  return out;
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1040,
    minHeight: 680,
    backgroundColor: '#1a1e2c',
    title: 'Song Prompt Studio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Never open new Electron windows; send approved links to the system browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    openSafe(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://')) { e.preventDefault(); openSafe(url); }
  });
}

function openSafe(url) {
  try {
    const u = new URL(url);
    if (u.protocol === 'https:' && ALLOWED_HOSTS.includes(u.hostname)) {
      shell.openExternal(u.toString());
      return true;
    }
  } catch (_) { /* ignore malformed */ }
  return false;
}

ipcMain.handle('copy-text', (_e, text) => {
  clipboard.writeText(String(text ?? ''));
  return true;
});

ipcMain.handle('open-external', (_e, url) => openSafe(url));

ipcMain.handle('save-text', async (e, { defaultName, text }) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const safeName = String(defaultName || 'prompt').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80);
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Export prompt',
    defaultPath: `${safeName}.txt`,
    filters: [{ name: 'Text', extensions: ['txt'] }, { name: 'Markdown', extensions: ['md'] }]
  });
  if (canceled || !filePath) return { saved: false };
  fs.writeFileSync(filePath, String(text ?? ''), 'utf8');
  return { saved: true, filePath };
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
