import { ref, reactive, watch } from 'vue';

// 文件内容状态接口
export interface FileContentState {
  filePath: string;
  content: string;
  isDirty: boolean;
  lastModified: Date;
  lastSaved: Date | null;
}

// 编辑器实例接口
export interface EditorInstance {
  id: string;
  updateContent: (content: string) => void;
  updateDirtyState: (isDirty: boolean) => void;
}

/**
 * 全局文件内容管理器
 * 负责协调多个编辑器实例之间的内容同步
 */
class FileContentManager {
  private static instance: FileContentManager;
  
  // 文件内容状态映射 filePath -> FileContentState
  private fileStates = reactive<Map<string, FileContentState>>(new Map());
  
  // 编辑器实例映射 filePath -> EditorInstance[]
  private editorInstances = reactive<Map<string, EditorInstance[]>>(new Map());

  public static getInstance(): FileContentManager {
    if (!FileContentManager.instance) {
      FileContentManager.instance = new FileContentManager();
    }
    return FileContentManager.instance;
  }

  /**
   * 注册编辑器实例
   */
  registerEditor(filePath: string, editorInstance: EditorInstance): void {
    console.log(`Registering editor ${editorInstance.id} for file: ${filePath}`);
    
    if (!this.editorInstances.has(filePath)) {
      this.editorInstances.set(filePath, []);
    }
    
    const editors = this.editorInstances.get(filePath)!;
    // 避免重复注册
    if (!editors.find(e => e.id === editorInstance.id)) {
      editors.push(editorInstance);
    }

    // 如果文件状态不存在，创建默认状态
    if (!this.fileStates.has(filePath)) {
      this.fileStates.set(filePath, {
        filePath,
        content: '',
        isDirty: false,
        lastModified: new Date(),
        lastSaved: null
      });
    }

    // 将当前文件内容同步到新注册的编辑器
    const fileState = this.fileStates.get(filePath)!;
    editorInstance.updateContent(fileState.content);
    editorInstance.updateDirtyState(fileState.isDirty);
  }

  /**
   * 注销编辑器实例
   */
  unregisterEditor(filePath: string, editorId: string): void {
    console.log(`Unregistering editor ${editorId} for file: ${filePath}`);
    
    const editors = this.editorInstances.get(filePath);
    if (editors) {
      const index = editors.findIndex(e => e.id === editorId);
      if (index >= 0) {
        editors.splice(index, 1);
      }
      
      // 如果没有编辑器实例了，清理文件状态
      if (editors.length === 0) {
        this.editorInstances.delete(filePath);
        // 注意：不删除 fileStates，以保留文件的脏状态等信息
      }
    }
  }

  /**
   * 更新文件内容
   */
  updateFileContent(filePath: string, content: string, fromEditorId?: string): void {
    const fileState = this.fileStates.get(filePath);
    if (!fileState) {
      console.warn(`File state not found for: ${filePath}`);
      return;
    }

    // 更新文件状态
    fileState.content = content;
    fileState.lastModified = new Date();
    
    // 检查是否为脏状态（与保存的内容不同）
    const wasDirty = fileState.isDirty;
    fileState.isDirty = true; // 内容变化时标记为脏状态

    console.log(`Updating content for file: ${filePath}, isDirty: ${fileState.isDirty}, fromEditor: ${fromEditorId}`);

    // 同步到所有其他编辑器实例
    const editors = this.editorInstances.get(filePath) || [];
    editors.forEach(editor => {
      // 不要同步回触发更新的编辑器
      if (editor.id !== fromEditorId) {
        editor.updateContent(content);
        editor.updateDirtyState(fileState.isDirty);
      }
    });
  }

  /**
   * 标记文件为已保存
   */
  markFileSaved(filePath: string): void {
    const fileState = this.fileStates.get(filePath);
    if (!fileState) {
      console.warn(`File state not found for: ${filePath}`);
      return;
    }

    fileState.isDirty = false;
    fileState.lastSaved = new Date();

    console.log(`Marking file as saved: ${filePath}`);

    // 同步脏状态到所有编辑器实例
    const editors = this.editorInstances.get(filePath) || [];
    editors.forEach(editor => {
      editor.updateDirtyState(false);
    });
  }

  /**
   * 加载文件内容
   */
  async loadFileContent(filePath: string): Promise<string> {
    try {
      const content = await window.electronAPI.readFile(filePath);
      
      // 更新文件状态
      let fileState = this.fileStates.get(filePath);
      if (!fileState) {
        fileState = {
          filePath,
          content,
          isDirty: false,
          lastModified: new Date(),
          lastSaved: new Date()
        };
        this.fileStates.set(filePath, fileState);
      } else {
        fileState.content = content;
        fileState.isDirty = false;
        fileState.lastSaved = new Date();
      }

      console.log(`Loaded file content: ${filePath}`);

      // 同步到所有编辑器实例
      const editors = this.editorInstances.get(filePath) || [];
      editors.forEach(editor => {
        editor.updateContent(content);
        editor.updateDirtyState(false);
      });

      return content;
    } catch (error) {
      console.error('Error loading file content:', error);
      throw error;
    }
  }

  /**
   * 保存文件内容
   */
  async saveFileContent(filePath: string): Promise<boolean> {
    const fileState = this.fileStates.get(filePath);
    if (!fileState) {
      console.warn(`File state not found for: ${filePath}`);
      return false;
    }

    try {
      const success = await window.electronAPI.writeFile(filePath, fileState.content);
      if (success) {
        this.markFileSaved(filePath);
        console.log(`Saved file: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving file:', error);
      return false;
    }
  }

  /**
   * 获取文件状态
   */
  getFileState(filePath: string): FileContentState | null {
    return this.fileStates.get(filePath) || null;
  }

  /**
   * 获取所有文件状态
   */
  getAllFileStates(): Map<string, FileContentState> {
    return this.fileStates;
  }

  /**
   * 清理指定文件的状态（当文件被删除时调用）
   */
  cleanupFile(filePath: string): void {
    this.fileStates.delete(filePath);
    this.editorInstances.delete(filePath);
    console.log(`Cleaned up file: ${filePath}`);
  }
}

// 导出单例实例
export const fileContentManager = FileContentManager.getInstance();
