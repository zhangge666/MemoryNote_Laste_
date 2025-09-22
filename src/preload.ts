import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),

  // Database operations
  loadNotes: () => ipcRenderer.invoke('load-notes'),
  createNote: (noteData: any) => ipcRenderer.invoke('create-note', noteData),
  updateNote: (noteData: any) => ipcRenderer.invoke('update-note', noteData),
  deleteNote: (noteId: number) => ipcRenderer.invoke('delete-note', noteId),
  searchNotes: (query: string) => ipcRenderer.invoke('search-notes', query),

  // AI operations (placeholder for future implementation)
  aiSemanticSearch: (query: string) => ipcRenderer.invoke('ai-semantic-search', query),
  aiAskQuestion: (question: string) => ipcRenderer.invoke('ai-ask-question', question),

  // Review operations (placeholder for future implementation)
  getTodayReviewNotes: () => ipcRenderer.invoke('get-today-review-notes'),
  updateReviewRecord: (noteId: number, difficulty: number) => 
    ipcRenderer.invoke('update-review-record', noteId, difficulty),
});
