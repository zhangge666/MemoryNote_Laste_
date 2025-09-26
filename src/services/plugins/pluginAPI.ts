// 插件API实现
import { ref, reactive } from 'vue'
import type { 
  PluginAPI,
  PluginUIAPI,
  PluginDataAPI,
  PluginReviewAPI,
  PluginSystemAPI,
  NavigationButton,
  EditorAction,
  EditorDecorator,
  CompletionProvider,
  ContextMenuItem,
  MenuGroup,
  StatusBarItem,
  Command,
  Keybinding,
  Theme,
  DiffAlgorithm,
  DiffResult,
  DiffChange,
  FileStats,
  DialogOptions,
  InputBoxOptions,
  WindowOptions,
  Disposable
} from '../../types/plugin'
import { hookSystem } from './hookSystem'
import { HookType } from '../../types/plugin'
import { settingsService } from '../settingsService'
import { fileTreeService } from '../fileTreeService'

// 可释放资源实现
class DisposableImpl implements Disposable {
  constructor(private disposeFunction: () => void) {}

  dispose(): void {
    this.disposeFunction()
  }
}

// UI API 实现
class PluginUIAPIImpl implements PluginUIAPI {
  private navigationButtons = new Map<string, NavigationButton>()
  private editorActions = new Map<string, EditorAction>()
  private editorDecorators = new Map<string, EditorDecorator>()
  private completionProviders = new Map<string, CompletionProvider>()
  private contextMenuItems = new Map<string, ContextMenuItem>()
  private menuGroups = new Map<string, MenuGroup>()
  private statusBarItems = new Map<string, StatusBarItem>()

  // 左侧栏API
  leftPanel = {
    setContent: (content: { 
      id: string
      title: string
      component: HTMLElement
      onClose?: () => void 
    }): Disposable => {
      // 通过钩子系统触发左侧栏内容设置
      hookSystem.emit(HookType.PLUGIN_LEFT_PANEL_SET, { content }, 'plugin-api')
      
      return new DisposableImpl(() => {
        // 清理时恢复到默认内容
        hookSystem.emit(HookType.PLUGIN_LEFT_PANEL_CLEAR, { contentId: content.id }, 'plugin-api')
        if (content.onClose) {
          content.onClose()
        }
      })
    },

    hide: (): void => {
      hookSystem.emit(HookType.PLUGIN_LEFT_PANEL_HIDE, {}, 'plugin-api')
    },

    show: (): void => {
      hookSystem.emit(HookType.PLUGIN_LEFT_PANEL_SHOW, {}, 'plugin-api')
    }
  }

  // 右侧栏API
  rightPanel = {
    setContent: (content: { 
      id: string
      title: string
      component: HTMLElement
      onClose?: () => void 
    }): Disposable => {
      // 通过钩子系统触发右侧栏内容设置
      hookSystem.emit(HookType.PLUGIN_RIGHT_PANEL_SET, { content }, 'plugin-api')
      
      return new DisposableImpl(() => {
        // 清理时恢复到文档信息
        hookSystem.emit(HookType.PLUGIN_RIGHT_PANEL_CLEAR, { contentId: content.id }, 'plugin-api')
        if (content.onClose) {
          content.onClose()
        }
      })
    },

    hide: (): void => {
      hookSystem.emit(HookType.PLUGIN_RIGHT_PANEL_HIDE, {}, 'plugin-api')
    },

    show: (): void => {
      hookSystem.emit(HookType.PLUGIN_RIGHT_PANEL_SHOW, {}, 'plugin-api')
    }
  }

  // 导航栏API
  navigation = {
    addButton: (button: NavigationButton): Disposable => {
      this.navigationButtons.set(button.id, button)
      
      // 触发钩子
      hookSystem.emit(HookType.NAVIGATION_BUTTON_ADDED, { button }, 'plugin-api')
      
      return new DisposableImpl(() => {
        this.navigation.removeButton(button.id)
      })
    },

    removeButton: (id: string): void => {
      const button = this.navigationButtons.get(id)
      if (button) {
        this.navigationButtons.delete(id)
        hookSystem.emit(HookType.NAVIGATION_BUTTON_REMOVED, { id, button }, 'plugin-api')
      }
    },

    updateButton: (id: string, updates: Partial<NavigationButton>): void => {
      const button = this.navigationButtons.get(id)
      if (button) {
        Object.assign(button, updates)
        hookSystem.emit(HookType.NAVIGATION_BUTTON_UPDATED, { id, button, updates }, 'plugin-api')
      }
    }
  }

  // 编辑器API
  editor = {
    registerAction: (action: EditorAction): Disposable => {
      this.editorActions.set(action.id, action)
      
      // 触发钩子
      hookSystem.emit(HookType.EDITOR_ACTION_REGISTERED, { action }, 'plugin-api')
      
      return new DisposableImpl(() => {
        this.editorActions.delete(action.id)
        hookSystem.emit(HookType.EDITOR_ACTION_UNREGISTERED, { actionId: action.id }, 'plugin-api')
      })
    },

    registerDecorator: (decorator: EditorDecorator): Disposable => {
      this.editorDecorators.set(decorator.id, decorator)
      
      // 触发钩子通知编辑器应用装饰器
      hookSystem.emit(HookType.EDITOR_DECORATOR_REGISTERED, { decorator }, 'plugin-api')
      
      return new DisposableImpl(() => {
        this.editorDecorators.delete(decorator.id)
        hookSystem.emit(HookType.EDITOR_DECORATOR_UNREGISTERED, { decoratorId: decorator.id }, 'plugin-api')
      })
    },

    registerCompletionProvider: (provider: CompletionProvider): Disposable => {
      this.completionProviders.set(provider.id, provider)
      
      // 触发钩子通知编辑器注册自动完成提供者
      hookSystem.emit(HookType.EDITOR_COMPLETION_PROVIDER_REGISTERED, { provider }, 'plugin-api')
      
      return new DisposableImpl(() => {
        this.completionProviders.delete(provider.id)
        hookSystem.emit(HookType.EDITOR_COMPLETION_PROVIDER_UNREGISTERED, { providerId: provider.id }, 'plugin-api')
      })
    }
  }

  // 右键菜单API
  contextMenu = {
    registerMenuItem: (item: ContextMenuItem): Disposable => {
      this.contextMenuItems.set(item.id, item)
      
      // 触发钩子
      hookSystem.emit(HookType.CONTEXT_MENU_ITEM_REGISTERED, { item }, 'plugin-api')
      
      return new DisposableImpl(() => {
        this.contextMenuItems.delete(item.id)
        hookSystem.emit(HookType.CONTEXT_MENU_ITEM_UNREGISTERED, { itemId: item.id }, 'plugin-api')
      })
    },

    registerMenuGroup: (group: MenuGroup): Disposable => {
      this.menuGroups.set(group.id, group)
      
      // 触发钩子
      hookSystem.emit(HookType.CONTEXT_MENU_GROUP_REGISTERED, { group }, 'plugin-api')
      
      return new DisposableImpl(() => {
        this.menuGroups.delete(group.id)
        hookSystem.emit(HookType.CONTEXT_MENU_GROUP_UNREGISTERED, { groupId: group.id }, 'plugin-api')
      })
    }
  }

  // 状态栏API
  statusBar = {
    addItem: (item: StatusBarItem): Disposable => {
      this.statusBarItems.set(item.id, item)
      
      // 触发钩子通知UI更新状态栏
      hookSystem.emit(HookType.STATUS_BAR_ITEM_ADDED, { item }, 'plugin-api')
      
      return new DisposableImpl(() => {
        this.statusBarItems.delete(item.id)
        hookSystem.emit(HookType.STATUS_BAR_ITEM_REMOVED, { itemId: item.id }, 'plugin-api')
      })
    },

    updateItem: (id: string, updates: Partial<StatusBarItem>): void => {
      const item = this.statusBarItems.get(id)
      if (item) {
        Object.assign(item, updates)
        hookSystem.emit(HookType.STATUS_BAR_ITEM_UPDATED, { id, item, updates }, 'plugin-api')
      }
    },

    removeItem: (id: string): void => {
      const item = this.statusBarItems.get(id)
      if (item) {
        this.statusBarItems.delete(id)
        hookSystem.emit(HookType.STATUS_BAR_ITEM_REMOVED, { itemId: id }, 'plugin-api')
      }
    }
  }

  // 对话框API
  dialog = {
    show: async (options: DialogOptions): Promise<number> => {
      // 通过钩子系统请求显示对话框
      return new Promise((resolve) => {
        hookSystem.emit(HookType.DIALOG_SHOW_REQUEST, { 
          options, 
          callback: resolve 
        }, 'plugin-api')
        
        // 降级到浏览器原生对话框
        setTimeout(() => {
          const result = confirm(options.message)
          resolve(result ? 0 : 1)
        }, 100)
      })
    },

    showInformation: async (message: string, detail?: string): Promise<void> => {
      await this.dialog.show({
        type: 'info',
        message,
        detail,
        buttons: ['确定']
      })
    },

    showWarning: async (message: string, detail?: string): Promise<void> => {
      await this.dialog.show({
        type: 'warning',
        message,
        detail,
        buttons: ['确定']
      })
    },

    showError: async (message: string, detail?: string): Promise<void> => {
      await this.dialog.show({
        type: 'error',
        message,
        detail,
        buttons: ['确定']
      })
    },

    showInputBox: async (options: InputBoxOptions): Promise<string | undefined> => {
      // 使用自定义输入框组件（通过钩子触发）
      return new Promise((resolve) => {
        hookSystem.emit(HookType.DIALOG_INPUT_BOX_SHOW, { 
          options, 
          callback: resolve 
        }, 'plugin-api')
        
        // 降级到浏览器原生输入框（如果支持的话）
        setTimeout(() => {
          try {
            if (typeof prompt === 'function') {
              const result = prompt(options.prompt || '请输入:', options.value || '')
              resolve(result || undefined)
            } else {
              console.warn('[PluginAPI] prompt() not supported, returning default value')
              resolve(options.value || undefined)
            }
          } catch (error) {
            console.warn('[PluginAPI] prompt() failed, returning default value:', error.message)
            resolve(options.value || undefined)
          }
        }, 100)
      })
    }
  }

  // 窗口API
  window = {
    createWindow: async (options: WindowOptions): Promise<any> => {
      // 通过钩子系统请求创建新窗口
      return new Promise((resolve, reject) => {
        hookSystem.emit(HookType.WINDOW_CREATE_REQUEST, { 
          options, 
          callback: resolve,
          errorCallback: reject
        }, 'plugin-api')
        
        // 降级：返回当前窗口引用
        setTimeout(() => {
          resolve({
            id: Date.now().toString(),
            title: options.title || '插件窗口',
            ...options
          })
        }, 100)
      })
    },

    getActiveWindow: (): any => {
      // 返回当前窗口信息
      return {
        id: 'main',
        title: document.title,
        width: window.innerWidth,
        height: window.innerHeight,
        x: window.screenX,
        y: window.screenY
      }
    },

    getAllWindows: (): any[] => {
      // 目前只支持主窗口
      return [this.window.getActiveWindow()]
    }
  }

  // 获取注册的组件
  getNavigationButtons(): NavigationButton[] {
    return Array.from(this.navigationButtons.values())
  }

  getEditorActions(): EditorAction[] {
    return Array.from(this.editorActions.values())
  }

  getEditorDecorators(): EditorDecorator[] {
    return Array.from(this.editorDecorators.values())
  }

  getCompletionProviders(): CompletionProvider[] {
    return Array.from(this.completionProviders.values())
  }

  getContextMenuItems(): ContextMenuItem[] {
    return Array.from(this.contextMenuItems.values())
  }

  getMenuGroups(): MenuGroup[] {
    return Array.from(this.menuGroups.values())
  }

  getStatusBarItems(): StatusBarItem[] {
    return Array.from(this.statusBarItems.values())
  }
}

// 数据API实现
class PluginDataAPIImpl implements PluginDataAPI {
  private watchers = new Map<string, any>()
  private diffAlgorithms = new Map<string, DiffAlgorithm>()

  fs = {
    readFile: async (path: string): Promise<string> => {
      if (window.electronAPI && window.electronAPI.readFile) {
        return await window.electronAPI.readFile(path)
      }
      throw new Error('File system API not available')
    },

    writeFile: async (path: string, content: string): Promise<void> => {
      if (window.electronAPI && window.electronAPI.writeFile) {
        await window.electronAPI.writeFile(path, content)
        return
      }
      throw new Error('File system API not available')
    },

    exists: async (path: string): Promise<boolean> => {
      if (window.electronAPI && window.electronAPI.pathExists) {
        return await window.electronAPI.pathExists(path)
      }
      throw new Error('File system API not available')
    },

    stat: async (path: string): Promise<FileStats> => {
      // 通过钩子系统请求文件统计信息
      return new Promise((resolve, reject) => {
        hookSystem.emit(HookType.FILE_STAT_REQUEST, { 
          path, 
          callback: resolve,
          errorCallback: reject
        }, 'plugin-api')
        
        // 降级：返回模拟的统计信息
        setTimeout(() => {
          resolve({
            size: 0,
            mtime: new Date(),
            ctime: new Date(),
            isFile: true,
            isDirectory: false
          })
        }, 100)
      })
    },

    readdir: async (path: string): Promise<string[]> => {
      if (window.electronAPI && window.electronAPI.listFiles) {
        return await window.electronAPI.listFiles(path)
      }
      throw new Error('File system API not available')
    },

    mkdir: async (path: string, recursive = false): Promise<void> => {
      if (window.electronAPI && window.electronAPI.createDirectory) {
        await window.electronAPI.createDirectory(path)
        return
      }
      throw new Error('File system API not available')
    },

    rmdir: async (path: string, recursive = false): Promise<void> => {
      // 通过钩子系统请求删除目录
      return new Promise((resolve, reject) => {
        hookSystem.emit(HookType.DIRECTORY_DELETE_REQUEST, { 
          path, 
          recursive,
          callback: resolve,
          errorCallback: reject
        }, 'plugin-api')
        
        // 降级：抛出错误
        setTimeout(() => {
          reject(new Error('Directory deletion not supported'))
        }, 100)
      })
    },

    unlink: async (path: string): Promise<void> => {
      if (window.electronAPI && window.electronAPI.deleteFile) {
        await window.electronAPI.deleteFile(path)
        return
      }
      throw new Error('File system API not available')
    },

    copy: async (source: string, destination: string): Promise<void> => {
      if (window.electronAPI && window.electronAPI.copyDirectory) {
        await window.electronAPI.copyDirectory(source, destination)
        return
      }
      throw new Error('File system API not available')
    },

    move: async (source: string, destination: string): Promise<void> => {
      if (window.electronAPI && window.electronAPI.renameFile) {
        await window.electronAPI.renameFile(source, destination)
        return
      }
      throw new Error('File system API not available')
    },

    watch: (path: string, callback: (event: string, filename: string) => void): Disposable => {
      const watcherId = `${path}_${Date.now()}`
      
      // 通过钩子系统请求文件监听
      hookSystem.emit(HookType.FILE_WATCH_REQUEST, { 
        path, 
        callback,
        watcherId
      }, 'plugin-api')
      
      // 降级：模拟文件监听
      console.warn('File watching not available, using polling fallback')
      let lastModified: number | null = null
      const interval = setInterval(async () => {
        try {
          const stats = await this.fs.stat(path)
          const currentModified = stats.mtime.getTime()
          if (lastModified !== null && currentModified !== lastModified) {
            callback('change', path)
          }
          lastModified = currentModified
        } catch (error) {
          // File might have been deleted
          callback('unlink', path)
        }
      }, 1000)
      
      this.watchers.set(watcherId, interval)
      
      return new DisposableImpl(() => {
        const interval = this.watchers.get(watcherId)
        if (interval) {
          clearInterval(interval)
          this.watchers.delete(watcherId)
        }
        hookSystem.emit(HookType.FILE_WATCH_STOP, { watcherId }, 'plugin-api')
      })
    }
  }

  database = {
    notes: {
      create: async (note: any): Promise<any> => {
        const id = Date.now().toString()
        const newNote = { id, ...note, createdAt: new Date(), updatedAt: new Date() }
        
        // 通过钩子触发数据库操作
        hookSystem.emit(HookType.DATABASE_NOTE_CREATE, { note: newNote }, 'plugin-api')
        return newNote
      },

      update: async (id: string, updates: any): Promise<void> => {
        const updatedNote = { ...updates, updatedAt: new Date() }
        hookSystem.emit(HookType.DATABASE_NOTE_UPDATE, { id, updates: updatedNote }, 'plugin-api')
      },

      delete: async (id: string): Promise<void> => {
        hookSystem.emit(HookType.DATABASE_NOTE_DELETE, { id }, 'plugin-api')
      },

      get: async (id: string): Promise<any> => {
        return new Promise((resolve) => {
          hookSystem.emit(HookType.DATABASE_NOTE_GET, { id, callback: resolve }, 'plugin-api')
          // 降级：返回空对象
          setTimeout(() => resolve(null), 100)
        })
      },

      list: async (filters?: any): Promise<any[]> => {
        return new Promise((resolve) => {
          hookSystem.emit(HookType.DATABASE_NOTE_LIST, { filters, callback: resolve }, 'plugin-api')
          // 降级：返回空数组
          setTimeout(() => resolve([]), 100)
        })
      },

      search: async (query: string): Promise<any[]> => {
        return new Promise((resolve) => {
          hookSystem.emit(HookType.DATABASE_NOTE_SEARCH, { query, callback: resolve }, 'plugin-api')
          // 降级：返回空数组
          setTimeout(() => resolve([]), 100)
        })
      }
    },

    reviews: {
      create: async (review: any): Promise<any> => {
        const id = Date.now().toString()
        const newReview = { id, ...review, createdAt: new Date() }
        hookSystem.emit(HookType.DATABASE_REVIEW_CREATE, { review: newReview }, 'plugin-api')
        return newReview
      },

      update: async (id: string, updates: any): Promise<void> => {
        hookSystem.emit(HookType.DATABASE_REVIEW_UPDATE, { id, updates }, 'plugin-api')
      },

      delete: async (id: string): Promise<void> => {
        hookSystem.emit(HookType.DATABASE_REVIEW_DELETE, { id }, 'plugin-api')
      },

      get: async (id: string): Promise<any> => {
        return new Promise((resolve) => {
          hookSystem.emit(HookType.DATABASE_REVIEW_GET, { id, callback: resolve }, 'plugin-api')
          setTimeout(() => resolve(null), 100)
        })
      },

      list: async (filters?: any): Promise<any[]> => {
        return new Promise((resolve) => {
          hookSystem.emit(HookType.DATABASE_REVIEW_LIST, { filters, callback: resolve }, 'plugin-api')
          setTimeout(() => resolve([]), 100)
        })
      }
    },

    categories: {
      create: async (category: any): Promise<any> => {
        const id = Date.now().toString()
        const newCategory = { id, ...category, createdAt: new Date() }
        hookSystem.emit(HookType.DATABASE_CATEGORY_CREATE, { category: newCategory }, 'plugin-api')
        return newCategory
      },

      update: async (id: string, updates: any): Promise<void> => {
        hookSystem.emit(HookType.DATABASE_CATEGORY_UPDATE, { id, updates }, 'plugin-api')
      },

      delete: async (id: string): Promise<void> => {
        hookSystem.emit(HookType.DATABASE_CATEGORY_DELETE, { id }, 'plugin-api')
      },

      get: async (id: string): Promise<any> => {
        return new Promise((resolve) => {
          hookSystem.emit(HookType.DATABASE_CATEGORY_GET, { id, callback: resolve }, 'plugin-api')
          setTimeout(() => resolve(null), 100)
        })
      },

      list: async (): Promise<any[]> => {
        return new Promise((resolve) => {
          hookSystem.emit(HookType.DATABASE_CATEGORY_LIST, { callback: resolve }, 'plugin-api')
          setTimeout(() => resolve([]), 100)
        })
      }
    },

    settings: {
      get: async (key: string): Promise<any> => {
        try {
          const settings = await settingsService.getSettings()
          return (settings as any)[key]
        } catch (error) {
          return undefined
        }
      },

      set: async (key: string, value: any): Promise<void> => {
        try {
          await settingsService.saveSettings({ [key]: value })
        } catch (error) {
          console.error('Failed to save plugin setting:', error)
        }
      },

      delete: async (key: string): Promise<void> => {
        // 删除设置项（设置为undefined）
        try {
          await settingsService.saveSettings({ [key]: undefined })
        } catch (error) {
          console.error('Failed to delete plugin setting:', error)
        }
      },

      list: async (): Promise<Record<string, any>> => {
        try {
          return await settingsService.getSettings()
        } catch (error) {
          return {}
        }
      }
    },

    custom: {
      createTable: async (name: string, schema: any): Promise<void> => {
        hookSystem.emit(HookType.DATABASE_CUSTOM_TABLE_CREATE, { name, schema }, 'plugin-api')
      },

      insert: async (table: string, data: any): Promise<any> => {
        const id = Date.now().toString()
        const record = { id, ...data, createdAt: new Date() }
        hookSystem.emit(HookType.DATABASE_CUSTOM_INSERT, { table, record }, 'plugin-api')
        return record
      },

      update: async (table: string, id: string, updates: any): Promise<void> => {
        hookSystem.emit(HookType.DATABASE_CUSTOM_UPDATE, { table, id, updates }, 'plugin-api')
      },

      delete: async (table: string, id: string): Promise<void> => {
        hookSystem.emit(HookType.DATABASE_CUSTOM_DELETE, { table, id }, 'plugin-api')
      },

      query: async (table: string, filters?: any): Promise<any[]> => {
        return new Promise((resolve) => {
          hookSystem.emit(HookType.DATABASE_CUSTOM_QUERY, { table, filters, callback: resolve }, 'plugin-api')
          setTimeout(() => resolve([]), 100)
        })
      }
    }
  }

  diff = {
    registerAlgorithm: (algorithm: DiffAlgorithm): Disposable => {
      this.diffAlgorithms.set(algorithm.id, algorithm)
      
      // 触发钩子
      hookSystem.emit(HookType.DIFF_ALGORITHM_REGISTERED, { algorithm }, 'plugin-api')
      
      return new DisposableImpl(() => {
        this.diffAlgorithms.delete(algorithm.id)
        hookSystem.emit(HookType.DIFF_ALGORITHM_UNREGISTERED, { algorithmId: algorithm.id }, 'plugin-api')
      })
    },

    getDiffResult: (oldContent: string, newContent: string, algorithmId?: string): DiffResult => {
      // 触发开始计算钩子
      hookSystem.emit(HookType.DIFF_COMPUTING, { oldContent, newContent, algorithmId }, 'plugin-api')
      
      let result: DiffResult
      
      if (algorithmId && this.diffAlgorithms.has(algorithmId)) {
        // 使用指定的算法
        const algorithm = this.diffAlgorithms.get(algorithmId)!
        result = algorithm.compute(oldContent, newContent)
      } else {
        // 使用默认的简单差异算法
        result = this.diff.defaultDiffAlgorithm(oldContent, newContent)
      }
      
      // 触发完成计算钩子
      hookSystem.emit(HookType.DIFF_COMPUTED, { oldContent, newContent, algorithmId, result }, 'plugin-api')
      
      return result
    },

    applyDiff: (content: string, diff: DiffResult): string => {
      // 触发开始应用钩子
      hookSystem.emit(HookType.DIFF_APPLYING, { content, diff }, 'plugin-api')
      
      let result = content
      
      // 按位置倒序应用变更，避免位置偏移
      const sortedChanges = diff.changes.sort((a, b) => {
        const aStart = a.oldRange?.start || a.newRange?.start || 0
        const bStart = b.oldRange?.start || b.newRange?.start || 0
        return bStart - aStart
      })
      
      for (const change of sortedChanges) {
        if (change.type === 'insert' && change.newRange && change.content) {
          const start = change.newRange.start
          result = result.slice(0, start) + change.content + result.slice(start)
        } else if (change.type === 'delete' && change.oldRange) {
          const start = change.oldRange.start
          const end = change.oldRange.end
          result = result.slice(0, start) + result.slice(end)
        } else if (change.type === 'modify' && change.oldRange && change.content) {
          const start = change.oldRange.start
          const end = change.oldRange.end
          result = result.slice(0, start) + change.content + result.slice(end)
        }
      }
      
      // 触发完成应用钩子
      hookSystem.emit(HookType.DIFF_APPLIED, { content, diff, result }, 'plugin-api')
      
      return result
    },

    unregisterAlgorithm: (algorithmId: string): void => {
      if (this.diffAlgorithms.has(algorithmId)) {
        this.diffAlgorithms.delete(algorithmId)
        hookSystem.emit(HookType.DIFF_ALGORITHM_UNREGISTERED, { algorithmId }, 'plugin-api')
      }
    },

    listAlgorithms: (): DiffAlgorithm[] => {
      return Array.from(this.diffAlgorithms.values())
    },

    // 默认的简单差异算法
    defaultDiffAlgorithm: (oldContent: string, newContent: string): DiffResult => {
      if (oldContent === newContent) {
        return { changes: [], similarity: 1.0 }
      }
      
      // 简单的行级差异检测
      const oldLines = oldContent.split('\n')
      const newLines = newContent.split('\n')
      const changes: DiffChange[] = []
      
      // 粗糙的差异检测（实际项目中应该使用更高级的算法）
      if (oldLines.length !== newLines.length) {
        changes.push({
          type: 'modify',
          oldRange: { start: 0, end: oldContent.length },
          newRange: { start: 0, end: newContent.length },
          content: newContent
        })
      } else {
        // 逐行比较
        let startPos = 0
        for (let i = 0; i < oldLines.length; i++) {
          if (oldLines[i] !== newLines[i]) {
            const oldStart = startPos
            const oldEnd = startPos + oldLines[i].length
            const newStart = startPos
            const newEnd = startPos + newLines[i].length
            
            changes.push({
              type: 'modify',
              oldRange: { start: oldStart, end: oldEnd },
              newRange: { start: newStart, end: newEnd },
              content: newLines[i]
            })
          }
          startPos += oldLines[i].length + 1 // +1 for newline
        }
      }
      
      // 计算相似度
      const similarity = changes.length === 0 ? 1.0 : 
        Math.max(0, 1 - (changes.length / Math.max(oldLines.length, newLines.length)))
      
      return { changes, similarity }
    }
  }
}

// 复习API实现
class PluginReviewAPIImpl implements PluginReviewAPI {
  private algorithmMap = new Map<string, any>()

  algorithms = {
    register: (algorithm: any): Disposable => {
      this.algorithmMap.set(algorithm.id, algorithm)
      
      // 触发钩子
      hookSystem.emit(HookType.REVIEW_ALGORITHM_REGISTERED, { algorithm }, 'plugin-api')
      
      return new DisposableImpl(() => {
        this.algorithms.unregister(algorithm.id)
      })
    },

    unregister: (algorithmId: string): void => {
      const algorithm = this.algorithmMap.get(algorithmId)
      if (algorithm) {
        this.algorithmMap.delete(algorithmId)
        hookSystem.emit(HookType.REVIEW_ALGORITHM_UNREGISTERED, { algorithmId, algorithm }, 'plugin-api')
      }
    },

    getAlgorithm: (algorithmId: string): any => {
      return this.algorithmMap.get(algorithmId)
    },

    listAlgorithms: (): any[] => {
      return Array.from(this.algorithmMap.values())
    }
  }

  cards = {
    create: async (card: any): Promise<any> => {
      // TODO: 集成到复习卡片服务
      console.log('Creating review card:', card)
      return { id: Date.now().toString(), ...card }
    },

    update: async (cardId: string, updates: any): Promise<void> => {
      // TODO: 更新复习卡片
      console.log('Updating review card:', cardId, updates)
    },

    delete: async (cardId: string): Promise<void> => {
      // TODO: 删除复习卡片
      console.log('Deleting review card:', cardId)
    },

    get: async (cardId: string): Promise<any> => {
      // TODO: 获取复习卡片
      console.log('Getting review card:', cardId)
      return null
    },

    list: async (filters?: any): Promise<any[]> => {
      // TODO: 列出复习卡片
      console.log('Listing review cards:', filters)
      return []
    }
  }

  sessions = {
    start: async (options: any): Promise<any> => {
      // TODO: 开始复习会话
      console.log('Starting review session:', options)
      return { id: Date.now().toString(), ...options }
    },

    end: async (sessionId: string): Promise<void> => {
      // TODO: 结束复习会话
      console.log('Ending review session:', sessionId)
    },

    getCurrentSession: (): any => {
      // TODO: 获取当前复习会话
      return null
    }
  }
}

// 系统API实现
class PluginSystemAPIImpl implements PluginSystemAPI {
  private commandMap = new Map<string, Command>()
  private keybindingMap = new Map<string, Keybinding>()
  private themeMap = new Map<string, Theme>()
  private currentTheme: Theme | undefined

  commands = {
    register: (command: Command): Disposable => {
      this.commandMap.set(command.id, command)
      
      // 触发钩子
      hookSystem.emit(HookType.SYSTEM_COMMAND_REGISTERED, { command }, 'plugin-api')
      
      return new DisposableImpl(() => {
        this.commandMap.delete(command.id)
        hookSystem.emit(HookType.SYSTEM_COMMAND_UNREGISTERED, { commandId: command.id }, 'plugin-api')
      })
    },

    execute: async (commandId: string, ...args: any[]): Promise<any> => {
      const command = this.commandMap.get(commandId)
      if (!command) {
        throw new Error(`Command not found: ${commandId}`)
      }

      // 触发钩子
      const context = await hookSystem.emit(HookType.COMMAND_EXECUTING, { commandId, args }, 'plugin-api')
      if (context.isPrevented) {
        return
      }

      try {
        const result = await command.handler(...args)
        
        // 触发完成钩子
        hookSystem.emit(HookType.COMMAND_EXECUTED, { commandId, args, result }, 'plugin-api')
        
        return result
      } catch (error) {
        hookSystem.emit(HookType.SYSTEM_COMMAND_ERROR, { commandId, args, error }, 'plugin-api')
        throw error
      }
    },

    getCommand: (commandId: string): Command | undefined => {
      return this.commandMap.get(commandId)
    }
  }

  keybindings = {
    register: (keybinding: Keybinding): Disposable => {
      this.keybindingMap.set(keybinding.id, keybinding)
      
      // 触发钩子
      hookSystem.emit(HookType.SYSTEM_KEYBINDING_REGISTERED, { keybinding }, 'plugin-api')
      
      return new DisposableImpl(() => {
        this.keybindings.unregister(keybinding.id)
      })
    },

    unregister: (keybindingId: string): void => {
      const keybinding = this.keybindingMap.get(keybindingId)
      if (keybinding) {
        this.keybindingMap.delete(keybindingId)
        hookSystem.emit(HookType.SYSTEM_KEYBINDING_UNREGISTERED, { keybindingId, keybinding }, 'plugin-api')
      }
    },

    updateKeybinding: (keybindingId: string, newKey: string): void => {
      const keybinding = this.keybindingMap.get(keybindingId)
      if (keybinding) {
        keybinding.key = newKey
        hookSystem.emit(HookType.SYSTEM_KEYBINDING_UPDATED, { keybindingId, keybinding, newKey }, 'plugin-api')
      }
    }
  }

  themes = {
    register: (theme: Theme): Disposable => {
      this.themeMap.set(theme.id, theme)
      
      // 触发钩子
      hookSystem.emit(HookType.SYSTEM_THEME_REGISTERED, { theme }, 'plugin-api')
      
      return new DisposableImpl(() => {
        this.themeMap.delete(theme.id)
        hookSystem.emit(HookType.SYSTEM_THEME_UNREGISTERED, { themeId: theme.id }, 'plugin-api')
      })
    },

    apply: async (themeId: string): Promise<void> => {
      const theme = this.themeMap.get(themeId)
      if (!theme) {
        throw new Error(`Theme not found: ${themeId}`)
      }

      this.currentTheme = theme
      
      // 触发钩子
      hookSystem.emit(HookType.SYSTEM_THEME_APPLIED, { theme }, 'plugin-api')
    },

    getCurrentTheme: (): Theme | undefined => {
      return this.currentTheme
    }
  }

  configuration = {
    get: <T>(key: string, defaultValue?: T): T => {
      try {
        const settings = settingsService.getSettings()
        const value = (settings as any)[key] as T
        return value !== undefined ? value : (defaultValue as T)
      } catch (error) {
        console.error('Failed to get configuration:', error)
        return defaultValue as T
      }
    },

    set: async (key: string, value: any): Promise<void> => {
      try {
        await settingsService.saveSettings({ [key]: value })
        // 触发配置变化钩子
        hookSystem.emit(HookType.CONFIGURATION_CHANGED, { key, value }, 'plugin-api')
      } catch (error) {
        console.error('Failed to set configuration:', error)
        throw error
      }
    },

    onDidChange: (callback: (change: { key: string; oldValue: any; newValue: any }) => void): Disposable => {
      const handler = (context: any) => {
        if (context.data) {
          callback({
            key: context.data.key,
            oldValue: context.data.oldValue,
            newValue: context.data.newValue
          })
        }
      }
      
      hookSystem.on(HookType.CONFIGURATION_CHANGED, handler)
      
      return new DisposableImpl(() => {
        hookSystem.removeHandler(HookType.CONFIGURATION_CHANGED, handler)
      })
    }
  }

  workspace = {
    getPath: (): string | undefined => {
      try {
        const settings = settingsService.getSettings()
        return settings.general?.workspacePath
      } catch (error) {
        console.error('Failed to get workspace path:', error)
        return undefined
      }
    },

    onDidChangeWorkspace: (callback: (newPath: string) => void): Disposable => {
      const handler = (context: any) => {
        if (context.data && context.data.key === 'general.workspacePath') {
          callback(context.data.newValue)
        }
      }
      
      hookSystem.on(HookType.CONFIGURATION_CHANGED, handler)
      
      return new DisposableImpl(() => {
        hookSystem.removeHandler(HookType.CONFIGURATION_CHANGED, handler)
      })
    },

    openFile: async (path: string): Promise<void> => {
      // 通过钩子触发文件打开
      hookSystem.emit(HookType.WORKSPACE_FILE_OPEN_REQUEST, { path }, 'plugin-api')
      
      // 降级：记录日志
      console.log('Plugin requested to open file:', path)
    },

    createFile: async (path: string, content = ''): Promise<void> => {
      try {
        // 使用文件系统API创建文件
        if (window.electronAPI && window.electronAPI.writeFile) {
          await window.electronAPI.writeFile(path, content)
          
          // 通知文件树刷新
          hookSystem.emit(HookType.WORKSPACE_FILE_CREATED, { path, content }, 'plugin-api')
          
          // 刷新文件树
          if (fileTreeService && fileTreeService.refresh) {
            fileTreeService.refresh()
          }
        } else {
          throw new Error('File system API not available')
        }
      } catch (error) {
        console.error('Failed to create file:', error)
        throw error
      }
    }
  }

  // 获取注册的项目
  getCommands(): Command[] {
    return Array.from(this.commandMap.values())
  }

  getKeybindings(): Keybinding[] {
    return Array.from(this.keybindingMap.values())
  }

  getThemes(): Theme[] {
    return Array.from(this.themeMap.values())
  }
}

// 主插件API实现
export class PluginAPIImpl implements PluginAPI {
  public readonly ui: PluginUIAPI
  public readonly data: PluginDataAPI
  public readonly review: PluginReviewAPI
  public readonly system: PluginSystemAPI

  constructor() {
    this.ui = new PluginUIAPIImpl()
    this.data = new PluginDataAPIImpl()
    this.review = new PluginReviewAPIImpl()
    this.system = new PluginSystemAPIImpl()
  }

  // 获取所有注册的组件（用于UI集成）
  getAllRegistrations() {
    return {
      navigationButtons: (this.ui as PluginUIAPIImpl).getNavigationButtons(),
      editorActions: (this.ui as PluginUIAPIImpl).getEditorActions(),
      editorDecorators: (this.ui as PluginUIAPIImpl).getEditorDecorators(),
      completionProviders: (this.ui as PluginUIAPIImpl).getCompletionProviders(),
      contextMenuItems: (this.ui as PluginUIAPIImpl).getContextMenuItems(),
      menuGroups: (this.ui as PluginUIAPIImpl).getMenuGroups(),
      statusBarItems: (this.ui as PluginUIAPIImpl).getStatusBarItems(),
      commands: (this.system as PluginSystemAPIImpl).getCommands(),
      keybindings: (this.system as PluginSystemAPIImpl).getKeybindings(),
      themes: (this.system as PluginSystemAPIImpl).getThemes(),
      reviewAlgorithms: (this.review as PluginReviewAPIImpl).algorithms.listAlgorithms(),
      diffAlgorithms: (this.data as PluginDataAPIImpl).diff.listAlgorithms()
    }
  }
}

// 全局插件API实例
export const pluginAPI = new PluginAPIImpl()
