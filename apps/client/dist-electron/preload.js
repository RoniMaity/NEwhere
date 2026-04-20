"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Electron 28+ contextIsolation preload
// We expose nothing custom here — the renderer uses the browser's native
// WebSocket and WebRTC APIs directly (they work fine in Electron renderer).
// If we need IPC later (e.g., for system tray, app version), add it here.
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
});
//# sourceMappingURL=preload.js.map