const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('studio', {
  copy: (text) => ipcRenderer.invoke('copy-text', text),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  saveText: (defaultName, text) => ipcRenderer.invoke('save-text', { defaultName, text }),
  searchMusic: (q, type) => ipcRenderer.invoke('music-search', { q, type }),
  enrichMusic: (item) => ipcRenderer.invoke('music-enrich', { kind: item.kind, title: item.title, artist: item.artist })
});
