export interface ElectronAPI {
  // Window controls
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;

  // Database operations
  loadNotes: () => Promise<any[]>;
  createNote: (noteData: any) => Promise<any>;
  updateNote: (noteData: any) => Promise<any>;
  deleteNote: (noteId: number) => Promise<boolean>;
  searchNotes: (query: string) => Promise<any[]>;

  // AI operations
  aiSemanticSearch: (query: string) => Promise<any>;
  aiAskQuestion: (question: string) => Promise<any>;

  // Review operations
  getTodayReviewNotes: () => Promise<any[]>;
  updateReviewRecord: (noteId: number, difficulty: number) => Promise<any>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
