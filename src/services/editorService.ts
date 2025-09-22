import { ref, reactive } from 'vue';
import { EditorView, basicSetup } from 'codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorState as CMEditorState } from '@codemirror/state';
import { fileContentManager, type EditorInstance } from './fileContentManager';

export interface EditorState {
  content: string;
  isDirty: boolean;
  filePath: string;
  lastSaved: Date | null;
}

class EditorService implements EditorInstance {
  private editorView: EditorView | null = null;
  private container: HTMLElement | null = null;
  private isUpdatingFromManager = false; // 防止循环更新
  
  public readonly id: string;
  
  public state = reactive<EditorState>({
    content: '',
    isDirty: false,
    filePath: '',
    lastSaved: null
  });

  constructor() {
    // 生成唯一ID
    this.id = `editor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`Created editor service with ID: ${this.id}`);
  }

  // 初始化编辑器
  public initEditor(container: HTMLElement): void {
    this.container = container;
    
    // 创建编辑器状态
    const startState = CMEditorState.create({
      doc: this.state.content || '',
      extensions: [
        basicSetup,
        markdown(),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !this.isUpdatingFromManager) {
            const newContent = update.state.doc.toString();
            this.state.content = newContent;
            this.state.isDirty = true;
            
            // 通知文件内容管理器内容变化
            if (this.state.filePath) {
              fileContentManager.updateFileContent(this.state.filePath, newContent, this.id);
            }
          }
        })
      ]
    });

    // 创建编辑器视图
    this.editorView = new EditorView({
      state: startState,
      parent: container
    });
  }

  // 设置内容
  public setContent(content: string, filePath: string = ''): void {
    this.state.content = content;
    this.state.filePath = filePath;
    this.state.isDirty = false;
    this.state.lastSaved = null;

    // 注册到文件内容管理器
    if (filePath) {
      fileContentManager.registerEditor(filePath, this);
    }

    if (this.editorView) {
      // 防止触发更新监听器
      this.isUpdatingFromManager = true;
      
      // 完全替换编辑器内容
      this.editorView.dispatch({
        changes: {
          from: 0,
          to: this.editorView.state.doc.length,
          insert: content
        },
        selection: { anchor: 0, head: 0 }
      });
      
      this.isUpdatingFromManager = false;
    }
  }

  // 实现 EditorInstance 接口
  public updateContent(content: string): void {
    if (this.state.content === content) return; // 避免不必要的更新
    
    this.isUpdatingFromManager = true;
    this.state.content = content;
    
    if (this.editorView) {
      this.editorView.dispatch({
        changes: {
          from: 0,
          to: this.editorView.state.doc.length,
          insert: content
        }
      });
    }
    
    this.isUpdatingFromManager = false;
  }

  // 实现 EditorInstance 接口
  public updateDirtyState(isDirty: boolean): void {
    this.state.isDirty = isDirty;
    if (!isDirty) {
      this.state.lastSaved = new Date();
    }
  }

  // 获取内容
  public getContent(): string {
    return this.state.content;
  }

  // 保存文件
  public async saveFile(): Promise<boolean> {
    if (!this.state.filePath) {
      console.error('No file path specified');
      return false;
    }

    try {
      // 使用文件内容管理器保存文件
      const success = await fileContentManager.saveFileContent(this.state.filePath);
      if (success) {
        console.log(`File saved successfully: ${this.state.filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving file:', error);
      return false;
    }
  }

  // 加载文件
  public async loadFile(filePath: string): Promise<boolean> {
    try {
      // 使用文件内容管理器加载文件
      const content = await fileContentManager.loadFileContent(filePath);
      this.setContent(content, filePath);
      return true;
    } catch (error) {
      console.error('Error loading file:', error);
      return false;
    }
  }

  // 销毁编辑器
  public destroy(): void {
    // 从文件内容管理器注销
    if (this.state.filePath) {
      fileContentManager.unregisterEditor(this.state.filePath, this.id);
    }
    
    if (this.editorView) {
      this.editorView.destroy();
      this.editorView = null;
    }
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
    
    console.log(`Destroyed editor service with ID: ${this.id}`);
  }

  // 检查是否有未保存的更改
  public hasUnsavedChanges(): boolean {
    return this.state.isDirty;
  }

  // 获取编辑器视图
  public getEditorView(): EditorView | null {
    return this.editorView;
  }
}

// 创建编辑器服务工厂函数
export const createEditorService = () => new EditorService();
