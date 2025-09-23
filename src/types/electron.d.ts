export interface ElectronAPI {
  // 窗口控制
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  
  // 数据库操作
  loadNotes: () => Promise<any[]>;
  createNote: (noteData: any) => Promise<any>;
  updateNote: (noteData: any) => Promise<any>;
  deleteNote: (noteId: number) => Promise<boolean>;
  searchNotes: (query: string) => Promise<any[]>;
  
  // 文件系统操作
  getWorkspacePath: () => Promise<string>;
  setWorkspacePath: (path: string) => Promise<boolean>;
  selectWorkspaceFolder: () => Promise<string | null>;
  openWorkspaceInExplorer: () => Promise<boolean>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<boolean>;
  createDirectory: (dirPath: string) => Promise<boolean>;
  listFiles: (dirPath: string) => Promise<any[]>;
  deleteFile: (filePath: string) => Promise<boolean>;
  renameFile: (oldPath: string, newPath: string) => Promise<boolean>;
  pathExists: (filePath: string) => Promise<boolean>;
  importMarkdownFile: (filePath: string) => Promise<any>;
  exportMarkdownFile: (noteId: number, filePath: string) => Promise<boolean>;
  
  // 设置操作
  getAllSettings: () => Promise<any>;
  updateSetting: (key: string, value: any) => Promise<boolean>;
  getSetting: (key: string) => Promise<any>;
  loadSettings: () => Promise<any>;
  saveSettings: (settings: any) => Promise<boolean>;
  
  // AI操作
  aiSemanticSearch: (query: string) => Promise<any>;
  aiAskQuestion: (question: string) => Promise<any>;
  
  // 复习操作
  getTodayReviewNotes: () => Promise<any[]>;
  updateReviewRecord: (noteId: number, difficulty: number) => Promise<any>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
