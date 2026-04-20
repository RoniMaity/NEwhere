import { contextBridge } from 'electron'

// Electron 28+ contextIsolation preload
// We expose nothing custom here — the renderer uses the browser's native
// WebSocket and WebRTC APIs directly (they work fine in Electron renderer).
// If we need IPC later (e.g., for system tray, app version), add it here.

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
})
