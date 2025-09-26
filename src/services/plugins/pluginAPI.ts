// 插件API实现
import { ref, reactive } from 'vue'
import type { 
  PluginAPI,
  PluginUIAPI,
  PluginDataAPI,
  PluginReviewAPI,
  PluginSystemAPI,
  SidebarPanel,
  NavigationButton,
  EditorAction,
  ContextMenuItem,
  Command,
  Keybinding,
  Theme,
  Disposable
} from '../../types/plugin'
import { hookSystem } from './hookSystem'
import { HookType } from '../../types/plugin'

// 可释放资源实现
class DisposableImpl implements Disposable {
  constructor(private disposeFunction: () => void) {}

  dispose(): void {
    this.disposeFunction()
  }
}

// UI API 实现
class PluginUIAPIImpl implements PluginUIAPI {
  private sidebarPanels = new Map<string, SidebarPanel>()
  private navigationButtons = new Map<string, NavigationButton>()
  private editorActions = new Map<string, EditorAction>()
  private contextMenuItems = new Map<string, ContextMenuItem>()

  // 侧边栏API
  sidebar = {
    registerPanel: (panel: SidebarPanel): Disposable => {
      this.sidebarPanels.set(panel.id, panel)
      
      // 触发钩子
      hookSystem.emit(HookType.SIDEBAR_PANEL_REGISTERED, { panel }, 'plugin-api')
      
      return new DisposableImpl(() => {
        this.sidebar.removePanel(panel.id)
      })
    },

    updatePanel: (id: string, updates: Partial<SidebarPanel>): void => {
      const panel = this.sidebarPanels.get(id)
      if (panel) {
        Object.assign(panel, updates)
        hookSystem.emit(HookType.SIDEBAR_PANEL_UPDATED, { id, panel, updates }, 'plugin-api')
      }
    },

    removePanel: (id: string): void => {
      const panel = this.sidebarPanels.get(id)
      if (panel) {
        this.sidebarPanels.delete(id)
        hookSystem.emit(HookType.SIDEBAR_PANEL_REMOVED, { id, panel }, 'plugin-api')
      }
    },

    getPanel: (id: string): SidebarPanel | undefined => {
      return this.sidebarPanels.get(id)
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

    registerDecorator: (decorator: any): Disposable => {
      // TODO: 实现装饰器注册逻辑
      console.log('Editor decorator registered:', decorator)
      return new DisposableImpl(() => {
        console.log('Editor decorator unregistered')
      })
    },

    registerCompletionProvider: (provider: any): Disposable => {
      // TODO: 实现自动完成提供者注册逻辑
      console.log('Completion provider registered:', provider)
      return new DisposableImpl(() => {
        console.log('Completion provider unregistered')
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

    registerMenuGroup: (group: any): Disposable => {
      // TODO: 实现菜单组注册逻辑
      console.log('Context menu group registered:', group)
      return new DisposableImpl(() => {
        console.log('Context menu group unregistered')
      })
    }
  }

  // 状态栏API
  statusBar = {
    addItem: (item: any): Disposable => {
      // TODO: 实现状态栏项添加逻辑
      console.log('Status bar item added:', item)
      return new DisposableImpl(() => {
        console.log('Status bar item removed')
      })
    },

    updateItem: (id: string, updates: any): void => {
      // TODO: 实现状态栏项更新逻辑
      console.log('Status bar item updated:', id, updates)
    },

    removeItem: (id: string): void => {
      // TODO: 实现状态栏项移除逻辑
      console.log('Status bar item removed:', id)
    }
  }

  // 对话框API
  dialog = {
    showInformation: async (message: string, ...items: string[]): Promise<string | undefined> => {
      // TODO: 集成到应用的对话框系统
      return new Promise((resolve) => {
        const result = confirm(`${message}\n\n选择: ${items.join(', ')}`)
        resolve(result ? items[0] : undefined)
      })
    },

    showWarning: async (message: string, ...items: string[]): Promise<string | undefined> => {
      // TODO: 集成到应用的警告对话框
      return this.dialog.showInformation(`⚠️ ${message}`, ...items)
    },

    showError: async (message: string, ...items: string[]): Promise<string | undefined> => {
      // TODO: 集成到应用的错误对话框
      return this.dialog.showInformation(`❌ ${message}`, ...items)
    },

    showInputBox: async (options: any): Promise<string | undefined> => {
      // TODO: 集成到应用的输入框
      return prompt(options.prompt || 'Enter value:') || undefined
    }
  }

  // 窗口API
  window = {
    createWindow: async (options: any): Promise<any> => {
      // TODO: 实现自定义窗口创建
      console.log('Creating window:', options)
      return {}
    },

    getActiveWindow: (): any => {
      // TODO: 获取当前活跃窗口
      return null
    },

    getAllWindows: (): any[] => {
      // TODO: 获取所有窗口
      return []
    }
  }

  // 获取注册的组件
  getSidebarPanels(): SidebarPanel[] {
    return Array.from(this.sidebarPanels.values())
  }

  getNavigationButtons(): NavigationButton[] {
    return Array.from(this.navigationButtons.values())
  }

  getEditorActions(): EditorAction[] {
    return Array.from(this.editorActions.values())
  }

  getContextMenuItems(): ContextMenuItem[] {
    return Array.from(this.contextMenuItems.values())
  }
}

// 数据API实现
class PluginDataAPIImpl implements PluginDataAPI {
  fs = {
    readFile: async (path: string): Promise<string> => {
      // TODO: 集成到文件系统服务
      console.log('Reading file:', path)
      return ''
    },

    writeFile: async (path: string, content: string): Promise<void> => {
      // TODO: 集成到文件系统服务
      console.log('Writing file:', path, content.length, 'characters')
    },

    exists: async (path: string): Promise<boolean> => {
      // TODO: 集成到文件系统服务
      console.log('Checking if file exists:', path)
      return false
    },

    stat: async (path: string): Promise<any> => {
      // TODO: 集成到文件系统服务
      console.log('Getting file stats:', path)
      return {}
    },

    readdir: async (path: string): Promise<string[]> => {
      // TODO: 集成到文件系统服务
      console.log('Reading directory:', path)
      return []
    },

    watch: (path: string, callback: any): Disposable => {
      // TODO: 集成到文件监听服务
      console.log('Watching file:', path)
      return new DisposableImpl(() => {
        console.log('Stopped watching file:', path)
      })
    }
  }

  database = {
    notes: {
      // TODO: 集成到笔记数据库
    },
    reviews: {
      // TODO: 集成到复习数据库
    },
    categories: {
      // TODO: 集成到分类数据库
    },
    settings: {
      // TODO: 集成到设置数据库
    },
    custom: {
      // TODO: 自定义数据库接口
    }
  }

  diff = {
    registerAlgorithm: (algorithm: any): Disposable => {
      // TODO: 注册差异算法
      console.log('Registering diff algorithm:', algorithm.id)
      return new DisposableImpl(() => {
        console.log('Unregistering diff algorithm:', algorithm.id)
      })
    },

    getDiffResult: (oldContent: string, newContent: string, algorithmId?: string): any => {
      // TODO: 实现差异计算
      console.log('Computing diff:', oldContent.length, newContent.length, algorithmId)
      return { changes: [] }
    },

    applyDiff: (content: string, diff: any): string => {
      // TODO: 应用差异
      console.log('Applying diff:', content.length, diff)
      return content
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
      // TODO: 集成到配置服务
      console.log('Getting configuration:', key, defaultValue)
      return defaultValue as T
    },

    set: async (key: string, value: any): Promise<void> => {
      // TODO: 集成到配置服务
      console.log('Setting configuration:', key, value)
    },

    onDidChange: (callback: any): Disposable => {
      // TODO: 监听配置变化
      console.log('Listening for configuration changes')
      return new DisposableImpl(() => {
        console.log('Stopped listening for configuration changes')
      })
    }
  }

  workspace = {
    getPath: (): string | undefined => {
      // TODO: 获取工作区路径
      return undefined
    },

    onDidChangeWorkspace: (callback: any): Disposable => {
      // TODO: 监听工作区变化
      return new DisposableImpl(() => {})
    },

    openFile: async (path: string): Promise<void> => {
      // TODO: 打开文件
      console.log('Opening file:', path)
    },

    createFile: async (path: string, content?: string): Promise<void> => {
      // TODO: 创建文件
      console.log('Creating file:', path, content)
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
      sidebarPanels: (this.ui as PluginUIAPIImpl).getSidebarPanels(),
      navigationButtons: (this.ui as PluginUIAPIImpl).getNavigationButtons(),
      editorActions: (this.ui as PluginUIAPIImpl).getEditorActions(),
      contextMenuItems: (this.ui as PluginUIAPIImpl).getContextMenuItems(),
      commands: (this.system as PluginSystemAPIImpl).getCommands(),
      keybindings: (this.system as PluginSystemAPIImpl).getKeybindings(),
      themes: (this.system as PluginSystemAPIImpl).getThemes(),
      reviewAlgorithms: (this.review as PluginReviewAPIImpl).algorithms.listAlgorithms()
    }
  }
}

// 全局插件API实例
export const pluginAPI = new PluginAPIImpl()
