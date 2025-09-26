// 插件持久化服务
import type { LoadedPlugin, PluginManifest } from '../../types/plugin'
import { PluginLifecycle } from '../../types/plugin'

// 插件安装信息
interface PluginInstallInfo {
  id: string
  version: string
  installPath: string
  installTime: number
  enabled: boolean
  autoLoad: boolean
  lastLoaded?: number
  dependencies: string[]
  manifest: PluginManifest
}

// 插件状态信息
interface PluginStateInfo {
  pluginStates: Record<string, {
    id: string
    enabled: boolean
    autoLoad: boolean
    lastLoaded?: number
    config?: Record<string, any>
  }>
  installedPlugins: Record<string, PluginInstallInfo>
  version: string
  lastUpdated: number
}

/**
 * 插件持久化管理器
 */
export class PluginPersistence {
  private static readonly CONFIG_DIR = '.memorynote'
  private static readonly PLUGINS_CONFIG_FILE = 'plugins.json'
  private static readonly DEFAULT_STATE: PluginStateInfo = {
    pluginStates: {},
    installedPlugins: {},
    version: '1.0.0',
    lastUpdated: Date.now()
  }

  private state: PluginStateInfo = { ...PluginPersistence.DEFAULT_STATE }
  private isLoaded = false

  /**
   * 初始化持久化服务
   */
  async initialize(): Promise<void> {
    try {
      await this.loadState()
      console.log('Plugin persistence initialized successfully')
    } catch (error) {
      console.error('Failed to initialize plugin persistence:', error)
      // 使用默认状态
      this.state = { ...PluginPersistence.DEFAULT_STATE }
    }
    this.isLoaded = true
  }

  /**
   * 加载插件状态
   */
  private async loadState(): Promise<void> {
    try {
      const configPath = await this.getConfigPath()
      const configContent = await window.electronAPI?.readFile?.(configPath)
      
      if (configContent) {
        const parsedState = JSON.parse(configContent) as PluginStateInfo
        this.state = {
          ...PluginPersistence.DEFAULT_STATE,
          ...parsedState,
          lastUpdated: parsedState.lastUpdated || Date.now()
        }
        console.log('Plugin state loaded successfully:', Object.keys(this.state.installedPlugins).length, 'plugins')
      } else {
        console.log('No existing plugin state found, using default state')
        this.state = { ...PluginPersistence.DEFAULT_STATE }
      }
    } catch (error) {
      console.warn('Failed to load plugin state, using default:', error)
      this.state = { ...PluginPersistence.DEFAULT_STATE }
    }
  }

  /**
   * 保存插件状态
   */
  private async saveState(): Promise<void> {
    if (!this.isLoaded) {
      console.warn('Plugin persistence not initialized, skipping save')
      return
    }

    try {
      // 确保配置目录存在
      const configDir = await this.getConfigDir()
      await window.electronAPI?.createDirectory?.(configDir)

      // 更新时间戳
      this.state.lastUpdated = Date.now()

      // 保存状态
      const configPath = await this.getConfigPath()
      const configContent = JSON.stringify(this.state, null, 2)
      await window.electronAPI?.writeFile?.(configPath, configContent)
      
      console.log('Plugin state saved successfully')
    } catch (error) {
      console.error('Failed to save plugin state:', error)
      throw error
    }
  }

  /**
   * 获取配置目录路径
   */
  private async getConfigDir(): Promise<string> {
    const workspacePath = await window.electronAPI?.getWorkspacePath?.() || ''
    return `${workspacePath}/${PluginPersistence.CONFIG_DIR}`
  }

  /**
   * 获取配置文件路径
   */
  private async getConfigPath(): Promise<string> {
    const configDir = await this.getConfigDir()
    return `${configDir}/${PluginPersistence.PLUGINS_CONFIG_FILE}`
  }

  /**
   * 记录插件安装
   */
  async recordInstallation(plugin: LoadedPlugin, installPath: string): Promise<void> {
    const installInfo: PluginInstallInfo = {
      id: plugin.manifest.id,
      version: plugin.manifest.version,
      installPath,
      installTime: Date.now(),
      enabled: false,  // 默认不启用，让用户手动激活
      autoLoad: true,
      dependencies: plugin.manifest.dependencies || [],
      manifest: plugin.manifest
    }

    this.state.installedPlugins[plugin.manifest.id] = installInfo
    this.state.pluginStates[plugin.manifest.id] = {
      id: plugin.manifest.id,
      enabled: false,  // 默认不启用，让用户手动激活
      autoLoad: true
    }

    await this.saveState()
    console.log('Plugin installation recorded:', plugin.manifest.id)
  }

  /**
   * 记录插件卸载
   */
  async recordUninstallation(pluginId: string): Promise<void> {
    delete this.state.installedPlugins[pluginId]
    delete this.state.pluginStates[pluginId]

    await this.saveState()
    console.log('Plugin uninstallation recorded:', pluginId)
  }

  /**
   * 更新插件状态
   */
  async updatePluginState(pluginId: string, updates: Partial<{
    enabled: boolean
    autoLoad: boolean
    lastLoaded: number
    config: Record<string, any>
  }>): Promise<void> {
    if (!this.state.pluginStates[pluginId]) {
      this.state.pluginStates[pluginId] = {
        id: pluginId,
        enabled: true,
        autoLoad: true
      }
    }

    this.state.pluginStates[pluginId] = {
      ...this.state.pluginStates[pluginId],
      ...updates
    }

    await this.saveState()
  }

  /**
   * 获取已安装的插件列表
   */
  getInstalledPlugins(): PluginInstallInfo[] {
    return Object.values(this.state.installedPlugins)
  }

  /**
   * 获取插件安装信息
   */
  getPluginInstallInfo(pluginId: string): PluginInstallInfo | undefined {
    return this.state.installedPlugins[pluginId]
  }

  /**
   * 获取插件状态
   */
  getPluginState(pluginId: string): {
    enabled: boolean
    autoLoad: boolean
    lastLoaded?: number
    config?: Record<string, any>
  } | undefined {
    return this.state.pluginStates[pluginId]
  }

  /**
   * 获取需要自动加载的插件列表
   */
  getAutoLoadPlugins(): PluginInstallInfo[] {
    return this.getInstalledPlugins().filter(plugin => {
      const state = this.getPluginState(plugin.id)
      return state?.enabled && state?.autoLoad
    })
  }

  /**
   * 检查插件是否已安装
   */
  isPluginInstalled(pluginId: string): boolean {
    return pluginId in this.state.installedPlugins
  }

  /**
   * 检查插件是否启用
   */
  isPluginEnabled(pluginId: string): boolean {
    const state = this.getPluginState(pluginId)
    return state?.enabled ?? false
  }

  /**
   * 获取插件依赖关系
   */
  getPluginDependencies(pluginId: string): string[] {
    const installInfo = this.getPluginInstallInfo(pluginId)
    return installInfo?.dependencies || []
  }

  /**
   * 清理状态（移除不存在的插件）
   */
  async cleanup(): Promise<void> {
    let hasChanges = false

    // 检查每个已安装的插件是否仍然存在
    for (const [pluginId, installInfo] of Object.entries(this.state.installedPlugins)) {
      try {
        const manifestPath = `${installInfo.installPath}/plugin.json`
        const exists = await window.electronAPI?.pathExists?.(manifestPath)
        if (!exists) {
          console.log('Plugin no longer exists, removing from state:', pluginId)
          delete this.state.installedPlugins[pluginId]
          delete this.state.pluginStates[pluginId]
          hasChanges = true
        }
      } catch (error) {
        console.warn('Failed to check plugin existence:', pluginId, error)
      }
    }

    if (hasChanges) {
      await this.saveState()
      console.log('Plugin state cleaned up')
    }
  }

  /**
   * 导出状态（用于备份）
   */
  exportState(): PluginStateInfo {
    return JSON.parse(JSON.stringify(this.state))
  }

  /**
   * 导入状态（用于恢复）
   */
  async importState(stateData: PluginStateInfo): Promise<void> {
    this.state = {
      ...PluginPersistence.DEFAULT_STATE,
      ...stateData,
      lastUpdated: Date.now()
    }

    await this.saveState()
    console.log('Plugin state imported successfully')
  }

  /**
   * 重置所有状态
   */
  async reset(): Promise<void> {
    this.state = { ...PluginPersistence.DEFAULT_STATE }
    await this.saveState()
    console.log('Plugin state reset to default')
  }
}

// 单例实例
export const pluginPersistence = new PluginPersistence()

