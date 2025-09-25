const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Placeholder for future IPC communication if needed
  sendNotification: (title, body) => {
    new Notification(title, { body });
  }
});