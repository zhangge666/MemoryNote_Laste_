import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import * as fs from 'fs';
import * as os from 'os';
import started from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow: BrowserWindow;
let db: any;
let workspacePath: string = '';
let settingsPath: string = '';

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
  initWorkspace();
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

// Initialize workspace path
const initWorkspace = () => {
  // Load settings from file
  settingsPath = path.join(app.getPath('userData'), 'settings.json');
  loadSettings();
  
  // Create workspace directory if it doesn't exist
  if (!fs.existsSync(workspacePath)) {
    fs.mkdirSync(workspacePath, { recursive: true });
  }
  
  // Create subdirectories
  const notesDir = path.join(workspacePath, 'notes');
  const diaryDir = path.join(workspacePath, 'diary');
  const assetsDir = path.join(workspacePath, 'assets');
  
  [notesDir, diaryDir, assetsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Load settings from file
const loadSettings = () => {
  try {
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf-8');
      const settings = JSON.parse(settingsData);
      workspacePath = settings.workspacePath || path.join(__dirname, 'workspace');
    } else {
      // Default settings
      workspacePath = path.join(__dirname, 'workspace');
      saveSettings();
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    workspacePath = path.join(__dirname, 'workspace');
  }
};

// Save settings to file
const saveSettings = () => {
  try {
    const settings = {
      workspacePath: workspacePath,
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

// Get all settings
const getAllSettings = () => {
  try {
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf-8');
      return JSON.parse(settingsData);
    }
    return {};
  } catch (error) {
    console.error('Error getting settings:', error);
    return {};
  }
};

// Update specific setting
const updateSetting = (key: string, value: any) => {
  try {
    const settings = getAllSettings();
    settings[key] = value;
    settings.lastUpdated = new Date().toISOString();
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Error updating setting:', error);
    return false;
  }
};

// File system IPC handlers
ipcMain.handle('get-workspace-path', () => {
  return workspacePath;
});

ipcMain.handle('set-workspace-path', async (_, newPath: string) => {
  try {
    if (!fs.existsSync(newPath)) {
      fs.mkdirSync(newPath, { recursive: true });
    }
    workspacePath = newPath;
    
    // Save settings to file
    saveSettings();
    
    // Create subdirectories in new workspace
    const notesDir = path.join(workspacePath, 'notes');
    const diaryDir = path.join(workspacePath, 'diary');
    const assetsDir = path.join(workspacePath, 'assets');
    
    [notesDir, diaryDir, assetsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error setting workspace path:', error);
    return false;
  }
});

ipcMain.handle('select-workspace-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择工作区文件夹',
      properties: ['openDirectory', 'createDirectory'],
      defaultPath: workspacePath
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0];
      return selectedPath;
    }
    
    return null;
  } catch (error) {
    console.error('Error selecting workspace folder:', error);
    return null;
  }
});

ipcMain.handle('open-workspace-in-explorer', async () => {
  try {
    const { shell } = require('electron');
    shell.openPath(workspacePath);
    return true;
  } catch (error) {
    console.error('Error opening workspace in explorer:', error);
    return false;
  }
});

// Settings IPC handlers
ipcMain.handle('get-all-settings', () => {
  return getAllSettings();
});

ipcMain.handle('update-setting', (_, key: string, value: any) => {
  return updateSetting(key, value);
});

ipcMain.handle('get-setting', (_, key: string) => {
  const settings = getAllSettings();
  return settings[key];
});

// 新增：加载设置
ipcMain.handle('load-settings', () => {
  try {
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf-8');
      return JSON.parse(settingsData);
    }
    return {};
  } catch (error) {
    console.error('Error loading settings:', error);
    return {};
  }
});

// 新增：保存设置
ipcMain.handle('save-settings', (_, settings: any) => {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
});

ipcMain.handle('read-file', async (_, filePath: string) => {
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(workspacePath, filePath);
    return fs.readFileSync(fullPath, 'utf-8');
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
});

ipcMain.handle('write-file', async (_, filePath: string, content: string) => {
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(workspacePath, filePath);
    const dir = path.dirname(fullPath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing file:', error);
    return false;
  }
});

ipcMain.handle('create-directory', async (_, dirPath: string) => {
  try {
    const fullPath = path.isAbsolute(dirPath) ? dirPath : path.join(workspacePath, dirPath);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('Error creating directory:', error);
    return false;
  }
});

ipcMain.handle('path-exists', async (_, filePath: string) => {
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(workspacePath, filePath);
    return fs.existsSync(fullPath);
  } catch (error) {
    console.error('Error checking path existence:', error);
    return false;
  }
});

ipcMain.handle('list-files', async (_, dirPath: string) => {
  try {
    const fullPath = path.isAbsolute(dirPath) ? dirPath : path.join(workspacePath, dirPath);
    
    // 检查目录是否存在
    if (!fs.existsSync(fullPath)) {
      console.log('Directory does not exist:', fullPath);
      return [];
    }
    
    // 检查是否为目录
    const stats = fs.statSync(fullPath);
    if (!stats.isDirectory()) {
      console.log('Path is not a directory:', fullPath);
      return [];
    }
    
    const files = fs.readdirSync(fullPath, { withFileTypes: true });
    
    return files.map(file => ({
      name: file.name,
      isDirectory: file.isDirectory(),
      path: path.join(fullPath, file.name),
      relativePath: path.relative(workspacePath, path.join(fullPath, file.name))
    }));
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
});

ipcMain.handle('delete-file', async (_, filePath: string) => {
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(workspacePath, filePath);
    
    // 检查是文件还是文件夹
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      // 删除文件夹及其所有内容
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      // 删除文件
      fs.unlinkSync(fullPath);
    }
    return true;
  } catch (error) {
    console.error('Error deleting file/folder:', error);
    return false;
  }
});

ipcMain.handle('rename-file', async (_, oldPath: string, newPath: string) => {
  try {
    const fullOldPath = path.isAbsolute(oldPath) ? oldPath : path.join(workspacePath, oldPath);
    const fullNewPath = path.isAbsolute(newPath) ? newPath : path.join(workspacePath, newPath);
    
    console.log('Renaming:', fullOldPath, '->', fullNewPath);
    console.log('Old path exists:', fs.existsSync(fullOldPath));
    console.log('New path exists:', fs.existsSync(fullNewPath));
    
    // 检查原文件是否存在
    if (!fs.existsSync(fullOldPath)) {
      console.error('Source file does not exist:', fullOldPath);
      return false;
    }
    
    // 使用 fs.rename 进行重命名
    fs.renameSync(fullOldPath, fullNewPath);
    console.log('Rename operation completed successfully');
    return true;
  } catch (error) {
    console.error('Error renaming file/folder:', error);
    return false;
  }
});

ipcMain.handle('import-markdown-file', async (_, filePath: string) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.md');
    
    // Create note in database
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    const stmt = db.prepare(`
      INSERT INTO notes (title, content, category_id, tags)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(fileName, content, null, '');
    
    return {
      id: result.lastInsertRowid,
      title: fileName,
      content: content,
      categoryId: null,
      tags: ''
    };
  } catch (error) {
    console.error('Error importing markdown file:', error);
    throw error;
  }
});

ipcMain.handle('export-markdown-file', async (_, noteId: number, filePath: string) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    const stmt = db.prepare('SELECT * FROM notes WHERE id = ?');
    const note = stmt.get(noteId);
    
    if (!note) {
      throw new Error('Note not found');
    }
    
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(workspacePath, filePath);
    const dir = path.dirname(fullPath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, note.content, 'utf-8');
    return true;
  } catch (error) {
    console.error('Error exporting markdown file:', error);
    return false;
  }
});

// Clean up database connection on app quit
app.on('before-quit', () => {
  if (db) {
    db.close();
  }
});
