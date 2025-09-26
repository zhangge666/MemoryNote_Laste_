// 插件系统核心类型定义

// 插件生命周期枚举
export enum PluginLifecycle {
  UNLOADED = 'unloaded',
  LOADING = 'loading',
  LOADED = 'loaded',
  INITIALIZING = 'initializing',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  UNLOADING = 'unloading',
  ERROR = 'error'
}

// 插件权限枚举
export enum PluginPermission {
  FILE_READ = 'fs.read',
  FILE_WRITE = 'fs.write',
  FILE_DELETE = 'fs.delete',
  FILE_WATCH = 'fs.watch',
  DB_READ = 'db.read',
  DB_WRITE = 'db.write',
  DB_SCHEMA = 'db.schema',
  NETWORK_REQUEST = 'network.request',
  UI_MODIFY = 'ui.modify',
  UI_DIALOG = 'ui.dialog',
  UI_NOTIFICATION = 'ui.notification',
  SYSTEM_COMMAND = 'system.command',
  SYSTEM_CLIPBOARD = 'system.clipboard',
  IPC_SEND = 'ipc.send',
  IPC_RECEIVE = 'ipc.receive'
}

// 钩子类型枚举
export enum HookType {
  // 应用生命周期
  APP_STARTING = 'app.starting',
  APP_READY = 'app.ready',
  APP_CLOSING = 'app.closing',
  
  // 面板钩子
  PLUGIN_LEFT_PANEL_SET = 'plugin.leftPanel.set',
  PLUGIN_LEFT_PANEL_CLEAR = 'plugin.leftPanel.clear',
  PLUGIN_LEFT_PANEL_HIDE = 'plugin.leftPanel.hide',
  PLUGIN_LEFT_PANEL_SHOW = 'plugin.leftPanel.show',
  
  PLUGIN_RIGHT_PANEL_SET = 'plugin.rightPanel.set',
  PLUGIN_RIGHT_PANEL_CLEAR = 'plugin.rightPanel.clear',
  PLUGIN_RIGHT_PANEL_HIDE = 'plugin.rightPanel.hide',
  PLUGIN_RIGHT_PANEL_SHOW = 'plugin.rightPanel.show',
  
  // 文件操作
  FILE_OPENING = 'file.opening',
  FILE_OPENED = 'file.opened',
  FILE_SAVING = 'file.saving',
  FILE_SAVED = 'file.saved',
  FILE_CLOSING = 'file.closing',
  FILE_CLOSED = 'file.closed',
  
  // 编辑器
  EDITOR_CREATING = 'editor.creating',
  EDITOR_CREATED = 'editor.created',
  EDITOR_CONTENT_CHANGED = 'editor.contentChanged',
  EDITOR_SELECTION_CHANGED = 'editor.selectionChanged',
  EDITOR_DISPOSED = 'editor.disposed',
  
  // 复习系统
  REVIEW_CARD_CREATING = 'review.cardCreating',
  REVIEW_CARD_CREATED = 'review.cardCreated',
  REVIEW_SESSION_STARTING = 'review.sessionStarting',
  REVIEW_SESSION_ENDING = 'review.sessionEnding',
  REVIEW_CARD_REVIEWING = 'review.cardReviewing',
  REVIEW_CARD_REVIEWED = 'review.cardReviewed',
  
  // 差异检测
  DIFF_COMPUTING = 'diff.computing',
  DIFF_COMPUTED = 'diff.computed',
  DIFF_APPLYING = 'diff.applying',
  DIFF_APPLIED = 'diff.applied',
  DIFF_ALGORITHM_REGISTERED = 'diff.algorithmRegistered',
  DIFF_ALGORITHM_UNREGISTERED = 'diff.algorithmUnregistered',
  
  // 数据库事件
  DATABASE_NOTE_CREATE = 'database.note.create',
  DATABASE_NOTE_UPDATE = 'database.note.update',
  DATABASE_NOTE_DELETE = 'database.note.delete',
  DATABASE_NOTE_GET = 'database.note.get',
  DATABASE_NOTE_LIST = 'database.note.list',
  DATABASE_NOTE_SEARCH = 'database.note.search',
  
  DATABASE_REVIEW_CREATE = 'database.review.create',
  DATABASE_REVIEW_UPDATE = 'database.review.update',
  DATABASE_REVIEW_DELETE = 'database.review.delete',
  DATABASE_REVIEW_GET = 'database.review.get',
  DATABASE_REVIEW_LIST = 'database.review.list',
  
  DATABASE_CATEGORY_CREATE = 'database.category.create',
  DATABASE_CATEGORY_UPDATE = 'database.category.update',
  DATABASE_CATEGORY_DELETE = 'database.category.delete',
  DATABASE_CATEGORY_GET = 'database.category.get',
  DATABASE_CATEGORY_LIST = 'database.category.list',
  
  DATABASE_CUSTOM_TABLE_CREATE = 'database.custom.table.create',
  DATABASE_CUSTOM_INSERT = 'database.custom.insert',
  DATABASE_CUSTOM_UPDATE = 'database.custom.update',
  DATABASE_CUSTOM_DELETE = 'database.custom.delete',
  DATABASE_CUSTOM_QUERY = 'database.custom.query',
  
  // UI 事件
  SIDEBAR_PANEL_OPENING = 'ui.sidebarPanelOpening',
  SIDEBAR_PANEL_OPENED = 'ui.sidebarPanelOpened',
  SIDEBAR_PANEL_REGISTERED = 'ui.sidebarPanelRegistered',
  SIDEBAR_PANEL_UPDATED = 'ui.sidebarPanelUpdated',
  SIDEBAR_PANEL_REMOVED = 'ui.sidebarPanelRemoved',
  
  NAVIGATION_BUTTON_ADDED = 'ui.navigationButtonAdded',
  NAVIGATION_BUTTON_REMOVED = 'ui.navigationButtonRemoved',
  NAVIGATION_BUTTON_UPDATED = 'ui.navigationButtonUpdated',
  
  EDITOR_ACTION_REGISTERED = 'ui.editorActionRegistered',
  EDITOR_ACTION_UNREGISTERED = 'ui.editorActionUnregistered',
  
  EDITOR_DECORATOR_REGISTERED = 'ui.editorDecoratorRegistered',
  EDITOR_DECORATOR_UNREGISTERED = 'ui.editorDecoratorUnregistered',
  
  EDITOR_COMPLETION_PROVIDER_REGISTERED = 'ui.editorCompletionProviderRegistered',
  EDITOR_COMPLETION_PROVIDER_UNREGISTERED = 'ui.editorCompletionProviderUnregistered',
  
  CONTEXT_MENU_ITEM_REGISTERED = 'ui.contextMenuItemRegistered',
  CONTEXT_MENU_ITEM_UNREGISTERED = 'ui.contextMenuItemUnregistered',
  
  CONTEXT_MENU_GROUP_REGISTERED = 'ui.contextMenuGroupRegistered',
  CONTEXT_MENU_GROUP_UNREGISTERED = 'ui.contextMenuGroupUnregistered',
  
  STATUS_BAR_ITEM_ADDED = 'ui.statusBarItemAdded',
  STATUS_BAR_ITEM_UPDATED = 'ui.statusBarItemUpdated',
  STATUS_BAR_ITEM_REMOVED = 'ui.statusBarItemRemoved',
  
  DIALOG_INPUT_BOX_SHOW = 'ui.dialogInputBoxShow',
  DIALOG_SHOW_REQUEST = 'ui.dialogShowRequest',
  WINDOW_CREATE_REQUEST = 'ui.windowCreateRequest',
  
  FILE_STAT_REQUEST = 'fs.statRequest',
  DIRECTORY_DELETE_REQUEST = 'fs.directoryDeleteRequest',
  FILE_WATCH_REQUEST = 'fs.fileWatchRequest',
  FILE_WATCH_STOP = 'fs.fileWatchStop',
  
  COMMAND_EXECUTING = 'ui.commandExecuting',
  COMMAND_EXECUTED = 'ui.commandExecuted',
  
  // 复习系统事件
  REVIEW_ALGORITHM_REGISTERED = 'review.algorithmRegistered',
  REVIEW_ALGORITHM_UNREGISTERED = 'review.algorithmUnregistered',
  
  // 系统事件
  SYSTEM_COMMAND_REGISTERED = 'system.commandRegistered',
  SYSTEM_COMMAND_UNREGISTERED = 'system.commandUnregistered',
  SYSTEM_COMMAND_ERROR = 'system.commandError',
  
  SYSTEM_KEYBINDING_REGISTERED = 'system.keybindingRegistered',
  SYSTEM_KEYBINDING_UNREGISTERED = 'system.keybindingUnregistered',
  SYSTEM_KEYBINDING_UPDATED = 'system.keybindingUpdated',
  
  SYSTEM_THEME_REGISTERED = 'system.themeRegistered',
  SYSTEM_THEME_UNREGISTERED = 'system.themeUnregistered',
  SYSTEM_THEME_APPLIED = 'system.themeApplied',
  
  CONFIGURATION_CHANGED = 'system.configurationChanged',
  
  WORKSPACE_FILE_OPEN_REQUEST = 'workspace.fileOpenRequest',
  WORKSPACE_FILE_CREATED = 'workspace.fileCreated',
  
  // 插件安装事件
  PLUGIN_DOWNLOAD_STARTED = 'plugin.downloadStarted',
  PLUGIN_DOWNLOAD_COMPLETED = 'plugin.downloadCompleted',
  PLUGIN_DOWNLOAD_FAILED = 'plugin.downloadFailed',
  
  PLUGIN_INSTALL_STARTED = 'plugin.installStarted',
  PLUGIN_INSTALL_COMPLETED = 'plugin.installCompleted',
  PLUGIN_INSTALL_FAILED = 'plugin.installFailed',
  
  PLUGIN_UNINSTALL_STARTED = 'plugin.uninstallStarted',
  PLUGIN_UNINSTALL_COMPLETED = 'plugin.uninstallCompleted',
  PLUGIN_UNINSTALL_FAILED = 'plugin.uninstallFailed',
  
  PLUGIN_UPDATE_STARTED = 'plugin.updateStarted',
  PLUGIN_UPDATE_COMPLETED = 'plugin.updateCompleted',
  PLUGIN_UPDATE_FAILED = 'plugin.updateFailed',
  
  // 插件生命周期事件
  PLUGIN_LOADED = 'plugin.loaded',
  PLUGIN_ACTIVATED = 'plugin.activated',
  PLUGIN_DEACTIVATED = 'plugin.deactivated',
  PLUGIN_UNLOADED = 'plugin.unloaded',
  PLUGIN_ERROR = 'plugin.error',
  
  // 钩子系统错误
  HOOK_ERROR = 'hook-error'
}

// 插件清单接口
export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  license: string
  homepage?: string
  repository?: string
  
  engines: {
    memorynote: string
  }
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  
  contributes: {
    commands?: CommandContribution[]
    keybindings?: KeybindingContribution[]
    sidebar?: SidebarContribution[]
    algorithms?: AlgorithmContribution[]
    themes?: ThemeContribution[]
    languages?: LanguageContribution[]
  }
  
  permissions: PluginPermission[]
  configurationSchema?: JSONSchema
}

// 贡献点定义
export interface CommandContribution {
  id: string
  title: string
  description?: string
  category?: string
}

export interface KeybindingContribution {
  id: string
  key: string
  command: string
  when?: string
  args?: any[]
}

export interface SidebarContribution {
  id: string
  title: string
  icon: string
  component: string
  position?: number
  when?: string
}

export interface AlgorithmContribution {
  type: 'diff' | 'review'
  id: string
  name: string
  description: string
}

export interface ThemeContribution {
  id: string
  name: string
  type: 'dark' | 'light'
  colors: Record<string, string>
}

export interface LanguageContribution {
  id: string
  name: string
  extensions: string[]
}

// JSON Schema 定义
export interface JSONSchema {
  type: string
  properties?: Record<string, any>
  required?: string[]
  default?: any
  description?: string
}

// 钩子处理器接口
export interface HookHandler<T = any> {
  (context: HookContext<T>): Promise<void> | void
}

// 钩子上下文
export interface HookContext<T = any> {
  readonly type: HookType
  readonly data: T
  readonly source: string
  readonly timestamp: number
  readonly isPrevented: boolean
  readonly isStopped: boolean
  
  preventDefault(): void
  stopPropagation(): void
  updateData(newData: Partial<T>): void
}

// 钩子注册选项
export interface HookRegistrationOptions {
  priority?: number
  once?: boolean
  condition?: (context: HookContext) => boolean
}

// 侧边栏面板定义
export interface SidebarPanel {
  id: string
  title: string
  icon: string | any
  component: any
  position: number
  when?: string
  contextMenu?: ContextMenuItem[]
  toolbar?: ToolbarItem[]
}

// 导航按钮定义
export interface NavigationButton {
  id: string
  label: string
  icon: string | any
  tooltip?: string
  position: number
  command?: string
  when?: string
  badge?: {
    text: string
    color: string
  }
}

// 编辑器操作定义
export interface EditorAction {
  id: string
  label: string
  description?: string
  keybinding?: string
  when?: string
  handler: EditorActionHandler
}

export interface EditorActionHandler {
  (editor: any, selection: any): Promise<void> | void
}

// 上下文菜单项
export interface ContextMenuItem {
  id: string
  label: string
  icon?: string
  command?: string
  submenu?: ContextMenuItem[]
  separator?: boolean
  when?: string
}

// 工具栏项
export interface ToolbarItem {
  id: string
  icon: string
  tooltip?: string
  command?: string
  when?: string
}

// 命令定义
export interface Command {
  id: string
  title: string
  description?: string
  category?: string
  handler: CommandHandler
}

export interface CommandHandler {
  (...args: any[]): Promise<any> | any
}

// 快捷键定义
export interface Keybinding {
  id: string
  key: string
  command: string
  when?: string
  args?: any[]
  priority?: number
}

// 主题定义
export interface Theme {
  id: string
  name: string
  type: 'dark' | 'light'
  colors: Record<string, string>
  styles?: Record<string, any>
}

// 状态栏项定义
export interface StatusBarItem {
  id: string
  text: string
  tooltip?: string
  position: 'left' | 'right'
  priority?: number
  command?: string
  backgroundColor?: string
  color?: string
}

// 对话框选项定义
export interface DialogOptions {
  title?: string
  message: string
  detail?: string
  buttons?: string[]
  defaultId?: number
  cancelId?: number
  type?: 'info' | 'warning' | 'error' | 'question'
}

// 输入框选项定义
export interface InputBoxOptions {
  title?: string
  prompt?: string
  placeholder?: string
  value?: string
  password?: boolean
  validateInput?: (value: string) => string | null
}

// 窗口选项定义
export interface WindowOptions {
  title?: string
  width?: number
  height?: number
  x?: number
  y?: number
  modal?: boolean
  resizable?: boolean
  alwaysOnTop?: boolean
}

// 装饰器定义
export interface EditorDecorator {
  id: string
  className: string
  range: { from: number; to: number }
  hoverMessage?: string
}

// 自动完成提供者定义
export interface CompletionProvider {
  id: string
  triggerCharacters?: string[]
  provide: (context: CompletionContext) => Promise<CompletionItem[]>
}

export interface CompletionContext {
  position: number
  line: string
  lineNumber: number
  character: number
}

export interface CompletionItem {
  label: string
  detail?: string
  documentation?: string
  insertText?: string
  kind?: 'text' | 'function' | 'variable' | 'keyword' | 'snippet'
}

// 菜单组定义
export interface MenuGroup {
  id: string
  label: string
  position?: number
  items: ContextMenuItem[]
}

// 差异算法定义
export interface DiffAlgorithm {
  id: string
  name: string
  description?: string
  compute: (oldContent: string, newContent: string) => DiffResult
}

export interface DiffResult {
  changes: DiffChange[]
  similarity: number
}

export interface DiffChange {
  type: 'insert' | 'delete' | 'modify'
  oldRange?: { start: number; end: number }
  newRange?: { start: number; end: number }
  content?: string
}

// 文件统计信息
export interface FileStats {
  size: number
  mtime: Date
  ctime: Date
  isFile: boolean
  isDirectory: boolean
}

// 插件上下文接口
export interface PluginContext {
  readonly pluginId: string
  readonly pluginPath: string
  readonly isDev: boolean
  
  readonly api: PluginAPI
  readonly logger: PluginLogger
  readonly storage: PluginStorage
  readonly config: PluginConfig
  
  readonly events: PluginEventEmitter
  readonly hooks: PluginHookRegistry
  
  readonly disposables: DisposableRegistry
  readonly messaging: PluginMessaging
  
  dispose(): void
}

// 插件API接口
export interface PluginAPI {
  ui: PluginUIAPI
  data: PluginDataAPI
  review: PluginReviewAPI
  system: PluginSystemAPI
}

// UI API
export interface PluginUIAPI {
  leftPanel: {
    setContent(content: {
      id: string
      title: string
      component: HTMLElement
      onClose?: () => void
    }): Disposable
    hide(): void
    show(): void
  }
  
  rightPanel: {
    setContent(content: {
      id: string
      title: string
      component: HTMLElement
      onClose?: () => void
    }): Disposable
    hide(): void
    show(): void
  }
  
  navigation: {
    addButton(button: NavigationButton): Disposable
    removeButton(id: string): void
    updateButton(id: string, updates: Partial<NavigationButton>): void
  }
  
  editor: {
    registerAction(action: EditorAction): Disposable
    registerDecorator(decorator: EditorDecorator): Disposable
    registerCompletionProvider(provider: CompletionProvider): Disposable
  }
  
  contextMenu: {
    registerMenuItem(item: ContextMenuItem): Disposable
    registerMenuGroup(group: MenuGroup): Disposable
  }
  
  statusBar: {
    addItem(item: StatusBarItem): Disposable
    updateItem(id: string, updates: Partial<StatusBarItem>): void
    removeItem(id: string): void
  }
  
  dialog: {
    show(options: DialogOptions): Promise<number>
    showInformation(message: string, detail?: string): Promise<void>
    showWarning(message: string, detail?: string): Promise<void>
    showError(message: string, detail?: string): Promise<void>
    showInputBox(options: InputBoxOptions): Promise<string | undefined>
  }
  
  window: {
    createWindow(options: WindowOptions): Promise<any>
    getActiveWindow(): any
    getAllWindows(): any[]
  }
}

// 数据 API
export interface PluginDataAPI {
  fs: {
    readFile(path: string): Promise<string>
    writeFile(path: string, content: string): Promise<void>
    exists(path: string): Promise<boolean>
    stat(path: string): Promise<FileStats>
    readdir(path: string): Promise<string[]>
    watch(path: string, callback: (event: string, filename: string) => void): Disposable
    mkdir(path: string, recursive?: boolean): Promise<void>
    rmdir(path: string, recursive?: boolean): Promise<void>
    unlink(path: string): Promise<void>
    copy(source: string, destination: string): Promise<void>
    move(source: string, destination: string): Promise<void>
  }
  
  database: {
    notes: {
      create(note: any): Promise<any>
      update(id: string, updates: any): Promise<void>
      delete(id: string): Promise<void>
      get(id: string): Promise<any>
      list(filters?: any): Promise<any[]>
      search(query: string): Promise<any[]>
    }
    reviews: {
      create(review: any): Promise<any>
      update(id: string, updates: any): Promise<void>
      delete(id: string): Promise<void>
      get(id: string): Promise<any>
      list(filters?: any): Promise<any[]>
    }
    categories: {
      create(category: any): Promise<any>
      update(id: string, updates: any): Promise<void>
      delete(id: string): Promise<void>
      get(id: string): Promise<any>
      list(): Promise<any[]>
    }
    settings: {
      get(key: string): Promise<any>
      set(key: string, value: any): Promise<void>
      delete(key: string): Promise<void>
      list(): Promise<Record<string, any>>
    }
    custom: {
      createTable(name: string, schema: any): Promise<void>
      insert(table: string, data: any): Promise<any>
      update(table: string, id: string, updates: any): Promise<void>
      delete(table: string, id: string): Promise<void>
      query(table: string, filters?: any): Promise<any[]>
    }
  }
  
  diff: {
    registerAlgorithm(algorithm: DiffAlgorithm): Disposable
    getDiffResult(oldContent: string, newContent: string, algorithmId?: string): DiffResult
    applyDiff(content: string, diff: DiffResult): string
    unregisterAlgorithm(algorithmId: string): void
    listAlgorithms(): DiffAlgorithm[]
  }
}

// 复习 API
export interface PluginReviewAPI {
  algorithms: {
    register(algorithm: any): Disposable
    unregister(algorithmId: string): void
    getAlgorithm(algorithmId: string): any
    listAlgorithms(): any[]
  }
  
  cards: {
    create(card: any): Promise<any>
    update(cardId: string, updates: any): Promise<void>
    delete(cardId: string): Promise<void>
    get(cardId: string): Promise<any>
    list(filters?: any): Promise<any[]>
  }
  
  sessions: {
    start(options: any): Promise<any>
    end(sessionId: string): Promise<void>
    getCurrentSession(): any
  }
}

// 系统 API
export interface PluginSystemAPI {
  commands: {
    register(command: Command): Disposable
    execute(commandId: string, ...args: any[]): Promise<any>
    getCommand(commandId: string): Command | undefined
  }
  
  keybindings: {
    register(keybinding: Keybinding): Disposable
    unregister(keybindingId: string): void
    updateKeybinding(keybindingId: string, newKey: string): void
  }
  
  themes: {
    register(theme: Theme): Disposable
    apply(themeId: string): Promise<void>
    getCurrentTheme(): Theme | undefined
  }
  
  configuration: {
    get<T>(key: string, defaultValue?: T): T
    set(key: string, value: any): Promise<void>
    onDidChange(callback: any): Disposable
  }
  
  workspace: {
    getPath(): string | undefined
    onDidChangeWorkspace(callback: any): Disposable
    openFile(path: string): Promise<void>
    createFile(path: string, content?: string): Promise<void>
  }
}

// 插件日志器
export interface PluginLogger {
  debug(message: string, ...args: any[]): void
  info(message: string, ...args: any[]): void
  warn(message: string, ...args: any[]): void
  error(message: string, ...args: any[]): void
}

// 插件存储
export interface PluginStorage {
  get<T>(key: string, defaultValue?: T): Promise<T>
  set(key: string, value: any): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  keys(): Promise<string[]>
}

// 插件配置
export interface PluginConfig {
  get<T>(key: string, defaultValue?: T): T
  set(key: string, value: any): Promise<void>
  onDidChange(callback: (change: ConfigChange) => void): Disposable
}

export interface ConfigChange {
  key: string
  oldValue: any
  newValue: any
}

// 插件事件发射器
export interface PluginEventEmitter {
  on(event: string, listener: (...args: any[]) => void): Disposable
  once(event: string, listener: (...args: any[]) => void): Disposable
  emit(event: string, ...args: any[]): void
  removeListener(event: string, listener: (...args: any[]) => void): void
}

// 插件钩子注册表
export interface PluginHookRegistry {
  on<T>(type: HookType, handler: HookHandler<T>, options?: HookRegistrationOptions): Disposable
  once<T>(type: HookType, handler: HookHandler<T>, options?: HookRegistrationOptions): Disposable
  emit<T>(type: HookType, data: T, source: string): Promise<void>
  removeHandler(type: HookType, handler: HookHandler): void
}

// 可释放资源注册表
export interface DisposableRegistry {
  add(disposable: Disposable): void
  dispose(): void
}

// 插件消息传递
export interface PluginMessaging {
  send(targetPluginId: string, message: any): Promise<void>
  broadcast(message: any): Promise<void>
  onMessage(callback: (message: any, sourcePluginId: string) => void): Disposable
}

// 可释放接口
export interface Disposable {
  dispose(): void
}

// 插件主类接口
export interface Plugin {
  readonly manifest: PluginManifest
  readonly context: PluginContext
  
  onLoad?(): Promise<void>
  onInitialize?(): Promise<void>
  onActivate?(): Promise<void>
  onDeactivate?(): Promise<void>
  onUnload?(): Promise<void>
  onError?(error: Error): void
  onUpdate?(oldVersion: string, newVersion: string): Promise<void>
  
  registerExtensions?(): void
}

// 已加载的插件
export interface LoadedPlugin {
  manifest: PluginManifest
  instance: Plugin
  context: PluginContext
  sandbox: PluginSandbox
  state: PluginLifecycle
}

// 插件沙箱接口
export interface PluginSandbox {
  readonly pluginId: string
  readonly permissions: Set<PluginPermission>
  
  readonly global: PluginGlobal
  readonly api: PluginAPI
  readonly monitor: ResourceMonitor
  
  execute(code: string, context?: any): Promise<any>
  destroy(): void
}

// 受限的全局对象
export interface PluginGlobal {
  Object: typeof Object
  Array: typeof Array
  Promise: typeof Promise
  JSON: typeof JSON
  console: {
    log: (...args: any[]) => void
    error: (...args: any[]) => void
    warn: (...args: any[]) => void
    info: (...args: any[]) => void
  }
}

// 资源监控
export interface ResourceMonitor {
  getCpuUsage(): number
  getMemoryUsage(): number
  getNetworkRequests(): number
  getFileOperations(): number
  setLimits(limits: ResourceLimits): void
}

export interface ResourceLimits {
  maxMemoryMB?: number
  maxCpuPercent?: number
  maxFileOperationsPerMinute?: number
  maxNetworkRequestsPerMinute?: number
}
