import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow;
let db: any;

const createWindow = () => {
  // Create the browser window with custom title bar
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hidden',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

// Initialize database
const initDatabase = async () => {
  try {
    // 延迟加载 better-sqlite3 以避免构建时问题
    const Database = await import('better-sqlite3');
    const dbPath = path.join(app.getPath('userData'), 'memorynote.db');
    db = new Database.default(dbPath);

    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        category_id INTEGER,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        review_count INTEGER DEFAULT 0,
        last_reviewed DATETIME,
        next_review DATETIME
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS review_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        note_id INTEGER,
        review_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        difficulty INTEGER DEFAULT 3,
        interval_days INTEGER,
        FOREIGN KEY (note_id) REFERENCES notes (id)
      );

      CREATE TABLE IF NOT EXISTS ai_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider TEXT NOT NULL,
        api_key TEXT,
        base_url TEXT,
        model TEXT,
        is_active BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

// IPC handlers for window controls
ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// IPC handlers for database operations
ipcMain.handle('load-notes', () => {
  try {
    if (!db) {
      console.error('Database not initialized');
      return [];
    }
    const stmt = db.prepare('SELECT * FROM notes ORDER BY updated_at DESC');
    return stmt.all();
  } catch (error) {
    console.error('Error loading notes:', error);
    return [];
  }
});

ipcMain.handle('create-note', (_, noteData) => {
  try {
    if (!db) {
      console.error('Database not initialized');
      throw new Error('Database not initialized');
    }
    const stmt = db.prepare(`
      INSERT INTO notes (title, content, category_id, tags)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(noteData.title, noteData.content, noteData.categoryId, noteData.tags);
    return { id: result.lastInsertRowid, ...noteData };
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
});

ipcMain.handle('update-note', (_, noteData) => {
  try {
    if (!db) {
      console.error('Database not initialized');
      throw new Error('Database not initialized');
    }
    const stmt = db.prepare(`
      UPDATE notes 
      SET title = ?, content = ?, category_id = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(noteData.title, noteData.content, noteData.categoryId, noteData.tags, noteData.id);
    return noteData;
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
});

ipcMain.handle('delete-note', (_, noteId) => {
  try {
    if (!db) {
      console.error('Database not initialized');
      throw new Error('Database not initialized');
    }
    const stmt = db.prepare('DELETE FROM notes WHERE id = ?');
    stmt.run(noteId);
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
});

ipcMain.handle('search-notes', (_, query) => {
  try {
    if (!db) {
      console.error('Database not initialized');
      return [];
    }
    const stmt = db.prepare(`
      SELECT * FROM notes 
      WHERE title LIKE ? OR content LIKE ? OR tags LIKE ?
      ORDER BY updated_at DESC
    `);
    const searchTerm = `%${query}%`;
    return stmt.all(searchTerm, searchTerm, searchTerm);
  } catch (error) {
    console.error('Error searching notes:', error);
    return [];
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  initDatabase();
  createWindow();
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Clean up database connection on app quit
app.on('before-quit', () => {
  if (db) {
    db.close();
  }
});
