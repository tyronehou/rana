import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  saveFileDialog: (defaultPath: string) => ipcRenderer.invoke('dialog:saveFile', defaultPath),
})

// Declare types for TypeScript
declare global {
  interface Window {
    electronAPI: {
      openFileDialog: () => Promise<string | null>
      saveFileDialog: (defaultPath: string) => Promise<string | null>
    }
  }
}
