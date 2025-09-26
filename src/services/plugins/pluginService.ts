// 插件服务集成
import { reactive, computed, ref } from 'vue'
import type { 
  LoadedPlugin, 
  SidebarPanel, 
  NavigationButton,
  Command,
  Theme,
  HookContext
} from '../../types/plugin'
import { PluginLifecycle, HookType } from '../../types/plugin'
import { PluginManager } from './pluginManager'
import { pluginAPI } from './pluginAPI'
import { hookSystem } from './hookSystem'

// 插件服务状态
interface PluginServiceState {
  plugins: LoadedPlugin[]
  activePlugins: string[]
  sidebarPanels: SidebarPanel[]
  navigationButtons: NavigationButton[]
  commands: Command[]
  themes: Theme[]
  isInitialized: boolean
  errors: Array<{ pluginId: string; error: string; timestamp: number }>
}

// 插件统计信息
interface PluginStats {
  total: number
  active: number
  inactive: number
  error: number
  loading: number
}

/**
 * 插件服务 - 统一管理插件系统
 */
export class PluginService {
  private manager: PluginManager
  public readonly state = reactive<PluginServiceState>({
    plugins: [],
    activePlugins: [],
    sidebarPanels: [],
    navigationButtons: [],
    commands: [],
    themes: [],
    isInitialized: false,
    errors: []
  })

  // 计算属性
  public readonly stats = computed<PluginStats>(() => {
    const plugins = this.state.plugins
    return {
      total: plugins.length,
      active: plugins.filter(p => p.state === PluginLifecycle.ACTIVE).length,
      inactive: plugins.filter(p => p.state === PluginLifecycle.INACTIVE).length,
      error: plugins.filter(p => p.state === PluginLifecycle.ERROR).length,
      loading: plugins.filter(p => p.state === PluginLifecycle.LOADING).length
    }
  })

  // 响应式状态访问器
  public readonly plugins = computed(() => this.state.plugins)
  public readonly activePlugins = computed(() => this.state.activePlugins)
  public readonly sidebarPanels = computed(() => this.state.sidebarPanels)
  public readonly navigationButtons = computed(() => this.state.navigationButtons)
  public readonly commands = computed(() => this.state.commands)
  public readonly themes = computed(() => this.state.themes)
  public readonly errors = computed(() => this.state.errors)
  public readonly isInitialized = computed(() => this.state.isInitialized)

  constructor() {
    this.manager = new PluginManager(pluginAPI)
    this.setupEventHandlers()
    this.setupHooks()
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    // 监听插件管理器事件
    this.manager.on('plugin-loaded', this.onPluginLoaded.bind(this))
    this.manager.on('plugin-activated', this.onPluginActivated.bind(this))
    this.manager.on('plugin-deactivated', this.onPluginDeactivated.bind(this))
    this.manager.on('plugin-unloaded', this.onPluginUnloaded.bind(this))
    this.manager.on('plugin-error', this.onPluginError.bind(this))

    // 监听UI变化事件
    hookSystem.on(HookType.SIDEBAR_PANEL_REGISTERED, this.onSidebarPanelRegistered.bind(this))
    hookSystem.on(HookType.SIDEBAR_PANEL_REMOVED, this.onSidebarPanelRemoved.bind(this))
    hookSystem.on(HookType.NAVIGATION_BUTTON_ADDED, this.onNavigationButtonAdded.bind(this))
    hookSystem.on(HookType.NAVIGATION_BUTTON_REMOVED, this.onNavigationButtonRemoved.bind(this))
    hookSystem.on(HookType.SYSTEM_COMMAND_REGISTERED, this.onCommandRegistered.bind(this))
    hookSystem.on(HookType.SYSTEM_COMMAND_UNREGISTERED, this.onCommandUnregistered.bind(this))
    hookSystem.on(HookType.SYSTEM_THEME_REGISTERED, this.onThemeRegistered.bind(this))
    hookSystem.on(HookType.SYSTEM_THEME_UNREGISTERED, this.onThemeUnregistered.bind(this))
  }

  /**
   * 设置钩子
   */
  private setupHooks(): void {
    // 应用启动钩子
    hookSystem.on(HookType.APP_READY, async () => {
      await this.autoLoadPlugins()
    })

    // 应用关闭钩子
    hookSystem.on(HookType.APP_CLOSING, async () => {
      await this.dispose()
    })
  }

  /**
   * 初始化插件服务
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing Plugin Service...')
      
      // 触发应用启动钩子
      await hookSystem.emit(HookType.APP_STARTING, {}, 'plugin-service')
      
      // 初始化插件管理器
      await this.manager.initialize()
      
      // 更新状态
      this.updatePluginState()
      this.state.isInitialized = true
      
      // 触发应用就绪钩子
      await hookSystem.emit(HookType.APP_READY, {}, 'plugin-service')
      
      console.log('Plugin Service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Plugin Service:', error)
      throw error
    }
  }

  /**
   * 自动加载插件
   */
  private async autoLoadPlugins(): Promise<void> {
    console.log('Auto-loading plugins...')
    
    try {
      // 使用插件管理器的自动加载功能
      await this.manager.autoLoadPlugins()
      
      // 更新状态
      this.updatePluginState()
      
      console.log('Auto-loading completed successfully')
    } catch (error) {
      console.error('Failed to auto-load plugins:', error)
    }
  }

  /**
   * 加载插件
   */
  async loadPlugin(pluginPath: string): Promise<void> {
    await this.manager.loadPlugin(pluginPath)
  }

  /**
   * 激活插件
   */
  async activatePlugin(pluginId: string): Promise<void> {
    await this.manager.activatePlugin(pluginId)
    this.updatePluginState()
  }

  /**
   * 停用插件
   */
  async deactivatePlugin(pluginId: string): Promise<void> {
    await this.manager.deactivatePlugin(pluginId)
    this.updatePluginState()
  }

  /**
   * 卸载插件
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    await this.manager.unloadPlugin(pluginId)
    this.updatePluginState()
  }

  /**
   * 重新加载插件
   */
  async reloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.manager.getPlugin(pluginId)
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`)
    }

    const pluginPath = plugin.context.pluginPath
    const wasActive = plugin.state === PluginLifecycle.ACTIVE

    // 卸载插件
    await this.unloadPlugin(pluginId)

    // 重新加载
    await this.loadPlugin(pluginPath)

    // 如果之前是激活状态，则重新激活
    if (wasActive) {
      await this.activatePlugin(pluginId)
    }
  }

  /**
   * 获取插件信息
   */
  getPlugin(pluginId: string): LoadedPlugin | undefined {
    return this.manager.getPlugin(pluginId)
  }

  /**
   * 检查插件状态
   */
  isPluginActive(pluginId: string): boolean {
    return this.manager.isPluginActive(pluginId)
  }

  /**
   * 执行命令
   */
  async executeCommand(commandId: string, ...args: any[]): Promise<any> {
    return await pluginAPI.system.commands.execute(commandId, ...args)
  }

  /**
   * 应用主题
   */
  async applyTheme(themeId: string): Promise<void> {
    return await pluginAPI.system.themes.apply(themeId)
  }

  /**
   * 触发钩子
   */
  async triggerHook<T>(type: HookType, data: T): Promise<void> {
    await hookSystem.emit(type, data, 'plugin-service')
  }

  /**
   * 获取插件注册的所有扩展
   */
  getAllExtensions() {
    return pluginAPI.getAllRegistrations()
  }

  /**
   * 清理错误记录
   */
  clearErrors(): void {
    this.state.errors.splice(0)
  }

  /**
   * 清理旧错误（保留最近50条）
   */
  private cleanupErrors(): void {
    if (this.state.errors.length > 50) {
      this.state.errors.splice(0, this.state.errors.length - 50)
    }
  }

  // 事件处理器
  private onPluginLoaded(): void {
    this.updatePluginState()
  }

  private onPluginActivated(data: { pluginId: string }): void {
    this.updatePluginState()
    if (!this.state.activePlugins.includes(data.pluginId)) {
      this.state.activePlugins.push(data.pluginId)
    }
  }

  private onPluginDeactivated(data: { pluginId: string }): void {
    this.updatePluginState()
    const index = this.state.activePlugins.indexOf(data.pluginId)
    if (index !== -1) {
      this.state.activePlugins.splice(index, 1)
    }
  }

  private onPluginUnloaded(): void {
    this.updatePluginState()
  }

  private onPluginError(data: { pluginId: string; error: Error }): void {
    this.updatePluginState()
    this.state.errors.push({
      pluginId: data.pluginId,
      error: data.error.message,
      timestamp: Date.now()
    })
    this.cleanupErrors()
  }

  private onSidebarPanelRegistered(context: HookContext<{ panel: SidebarPanel }>): void {
    this.state.sidebarPanels.push(context.data.panel)
  }

  private onSidebarPanelRemoved(context: HookContext<{ id: string }>): void {
    const index = this.state.sidebarPanels.findIndex(p => p.id === context.data.id)
    if (index !== -1) {
      this.state.sidebarPanels.splice(index, 1)
    }
  }

  private onNavigationButtonAdded(context: HookContext<{ button: NavigationButton }>): void {
    this.state.navigationButtons.push(context.data.button)
    // 按位置排序
    this.state.navigationButtons.sort((a, b) => (a.position || 0) - (b.position || 0))
  }

  private onNavigationButtonRemoved(context: HookContext<{ id: string }>): void {
    const index = this.state.navigationButtons.findIndex(b => b.id === context.data.id)
    if (index !== -1) {
      this.state.navigationButtons.splice(index, 1)
    }
  }

  private onCommandRegistered(context: HookContext<{ command: Command }>): void {
    this.state.commands.push(context.data.command)
  }

  private onCommandUnregistered(context: HookContext<{ commandId: string }>): void {
    const index = this.state.commands.findIndex(c => c.id === context.data.commandId)
    if (index !== -1) {
      this.state.commands.splice(index, 1)
    }
  }

  private onThemeRegistered(context: HookContext<{ theme: Theme }>): void {
    this.state.themes.push(context.data.theme)
  }

  private onThemeUnregistered(context: HookContext<{ themeId: string }>): void {
    const index = this.state.themes.findIndex(t => t.id === context.data.themeId)
    if (index !== -1) {
      this.state.themes.splice(index, 1)
    }
  }

  /**
   * 更新插件状态
   */
  private updatePluginState(): void {
    this.state.plugins = this.manager.getAllPlugins()
  }

  /**
   * 清理服务
   */
  async dispose(): Promise<void> {
    console.log('Disposing Plugin Service...')
    
    try {
      // 触发应用关闭钩子
      await hookSystem.emit(HookType.APP_CLOSING, {}, 'plugin-service')
      
      // 清理插件管理器
      await this.manager.dispose()
      
      // 清理状态
      this.state.plugins.splice(0)
      this.state.activePlugins.splice(0)
      this.state.sidebarPanels.splice(0)
      this.state.navigationButtons.splice(0)
      this.state.commands.splice(0)
      this.state.themes.splice(0)
      this.state.errors.splice(0)
      this.state.isInitialized = false
      
      console.log('Plugin Service disposed successfully')
    } catch (error) {
      console.error('Error disposing Plugin Service:', error)
    }
  }
}

// 全局插件服务实例
export const pluginService = new PluginService()

// 导出便利方法
export const usePluginService = () => ({
  // 状态
  state: pluginService.state,
  plugins: pluginService.plugins,
  activePlugins: pluginService.activePlugins,
  stats: pluginService.stats,
  sidebarPanels: pluginService.sidebarPanels,
  navigationButtons: pluginService.navigationButtons,
  commands: pluginService.commands,
  themes: pluginService.themes,
  errors: pluginService.errors,
  isInitialized: pluginService.isInitialized,

  // 方法
  initialize: pluginService.initialize.bind(pluginService),
  loadPlugin: pluginService.loadPlugin.bind(pluginService),
  activatePlugin: pluginService.activatePlugin.bind(pluginService),
  deactivatePlugin: pluginService.deactivatePlugin.bind(pluginService),
  unloadPlugin: pluginService.unloadPlugin.bind(pluginService),
  reloadPlugin: pluginService.reloadPlugin.bind(pluginService),
  getPlugin: pluginService.getPlugin.bind(pluginService),
  isPluginActive: pluginService.isPluginActive.bind(pluginService),
  executeCommand: pluginService.executeCommand.bind(pluginService),
  applyTheme: pluginService.applyTheme.bind(pluginService),
  triggerHook: pluginService.triggerHook.bind(pluginService),
  getAllExtensions: pluginService.getAllExtensions.bind(pluginService),
  clearErrors: pluginService.clearErrors.bind(pluginService)
})
