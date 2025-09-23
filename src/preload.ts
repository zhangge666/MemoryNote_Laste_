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

  // File system operations
  getWorkspacePath: () => ipcRenderer.invoke('get-workspace-path'),
  setWorkspacePath: (path: string) => ipcRenderer.invoke('set-workspace-path', path),
  selectWorkspaceFolder: () => ipcRenderer.invoke('select-workspace-folder'),
  openWorkspaceInExplorer: () => ipcRenderer.invoke('open-workspace-in-explorer'),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),
  createDirectory: (dirPath: string) => ipcRenderer.invoke('create-directory', dirPath),
  listFiles: (dirPath: string) => ipcRenderer.invoke('list-files', dirPath),
  deleteFile: (filePath: string) => ipcRenderer.invoke('delete-file', filePath),
  renameFile: (oldPath: string, newPath: string) => ipcRenderer.invoke('rename-file', oldPath, newPath),
  pathExists: (filePath: string) => ipcRenderer.invoke('path-exists', filePath),
  importMarkdownFile: (filePath: string) => ipcRenderer.invoke('import-markdown-file', filePath),
  exportMarkdownFile: (noteId: number, filePath: string) => ipcRenderer.invoke('export-markdown-file', noteId, filePath),

  // Settings operations
  getAllSettings: () => ipcRenderer.invoke('get-all-settings'),
  updateSetting: (key: string, value: any) => ipcRenderer.invoke('update-setting', key, value),
  getSetting: (key: string) => ipcRenderer.invoke('get-setting', key),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),

  // AI operations (placeholder for future implementation)
  aiSemanticSearch: (query: string) => ipcRenderer.invoke('ai-semantic-search', query),
  aiAskQuestion: (question: string) => ipcRenderer.invoke('ai-ask-question', question),

  // Review operations (placeholder for future implementation)
  getTodayReviewNotes: () => ipcRenderer.invoke('get-today-review-notes'),
  updateReviewRecord: (noteId: number, difficulty: number) => 
    ipcRenderer.invoke('update-review-record', noteId, difficulty),
});
