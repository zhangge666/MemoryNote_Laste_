// 插件管理器实现
// 注意：在浏览器环境中，文件操作需要通过Electron的IPC进行
import { EventEmitter } from '../../utils/EventEmitter'
import type { 
  PluginManifest,
  Plugin,
  LoadedPlugin,
  PluginAPI
} from '../../types/plugin'
import { 
  PluginLifecycle,
  PluginPermission,
  HookType
} from '../../types/plugin'
import { PluginSandboxFactory } from './pluginSandbox'
import { PluginContextFactory } from './pluginContext'
import { hookSystem } from './hookSystem'
import { pluginPersistence } from './pluginPersistence'

// 依赖图节点
interface DependencyNode {
  id: string
  dependencies: string[]
  dependents: string[]
}

// 依赖图管理
class DependencyGraph {
  private nodes = new Map<string, DependencyNode>()

  addNode(pluginId: string, dependencies: string[] = []): void {
    if (!this.nodes.has(pluginId)) {
      this.nodes.set(pluginId, {
        id: pluginId,
        dependencies: [],
        dependents: []
      })
    }

    const node = this.nodes.get(pluginId)!
    node.dependencies = [...dependencies]

    // 更新依赖插件的dependents
    dependencies.forEach(depId => {
      if (!this.nodes.has(depId)) {
        this.addNode(depId)
      }
      const depNode = this.nodes.get(depId)!
      if (!depNode.dependents.includes(pluginId)) {
        depNode.dependents.push(pluginId)
      }
    })
  }

  removeNode(pluginId: string): void {
    const node = this.nodes.get(pluginId)
    if (!node) return

    // 从依赖的插件中移除此插件
    node.dependencies.forEach(depId => {
      const depNode = this.nodes.get(depId)
      if (depNode) {
        depNode.dependents = depNode.dependents.filter(id => id !== pluginId)
      }
    })

    // 从依赖此插件的插件中移除依赖
    node.dependents.forEach(depId => {
      const depNode = this.nodes.get(depId)
      if (depNode) {
        depNode.dependencies = depNode.dependencies.filter(id => id !== pluginId)
      }
    })

    this.nodes.delete(pluginId)
  }

  getDependents(pluginId: string): string[] {
    return this.nodes.get(pluginId)?.dependents || []
  }

  getDependencies(pluginId: string): string[] {
    return this.nodes.get(pluginId)?.dependencies || []
  }

  getLoadOrder(): string[] {
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const result: string[] = []

    const visit = (id: string) => {
      if (visited.has(id)) return
      if (visiting.has(id)) {
        throw new Error(`Circular dependency detected involving plugin: ${id}`)
      }

      visiting.add(id)
      const node = this.nodes.get(id)
      if (node) {
        node.dependencies.forEach(depId => visit(depId))
      }
      visiting.delete(id)
      visited.add(id)
      result.push(id)
    }

    Array.from(this.nodes.keys()).forEach(id => visit(id))
    return result
  }

  checkCircularDependency(): string[] {
    try {
      this.getLoadOrder()
      return []
    } catch (error) {
      return [error instanceof Error ? error.message : String(error)]
    }
  }
}

// 插件管理器
export class PluginManager extends EventEmitter {
  private plugins = new Map<string, LoadedPlugin>()
  private dependencyGraph = new DependencyGraph()
  private manifestCache = new Map<string, PluginManifest>()

  constructor(private api: PluginAPI) {
    super()
    this.setupErrorHandling()
  }

  /**
   * 初始化插件管理器
   */
  async initialize(): Promise<void> {
    try {
      // 初始化持久化服务
      await pluginPersistence.initialize()
      
      // 清理状态（移除不存在的插件）
      await pluginPersistence.cleanup()
      
      console.log('Plugin manager initialized successfully')
    } catch (error) {
      console.error('Failed to initialize plugin manager:', error)
      throw error
    }
  }

  /**
   * 自动加载已安装的插件
   */
  async autoLoadPlugins(): Promise<void> {
    try {
      // 获取所有已安装的插件，而不仅仅是启用的插件
      const installedPlugins = pluginPersistence.getInstalledPlugins()
      console.log('Loading installed plugins:', installedPlugins.map(p => p.id))

      // 按依赖顺序加载插件
      const loadOrder = this.calculateLoadOrder(installedPlugins.map(p => p.id))
      
      for (const pluginId of loadOrder) {
        const pluginInfo = pluginPersistence.getPluginInstallInfo(pluginId)
        if (pluginInfo) {
          try {
            // 检查插件是否已经加载
            if (this.plugins.has(pluginId)) {
              console.log('Plugin already loaded, skipping:', pluginId)
              
              // 如果插件之前是激活状态，且当前未激活，则激活它
              const plugin = this.plugins.get(pluginId)!
              const state = pluginPersistence.getPluginState(pluginId)
              if (state?.enabled && plugin.state !== PluginLifecycle.ACTIVE) {
                await this.activatePlugin(pluginId)
              }
              continue
            }
            
            console.log('Loading plugin:', pluginId)
            await this.loadPlugin(pluginInfo.installPath)
            
            // 根据持久化状态决定是否激活插件
            const state = pluginPersistence.getPluginState(pluginId)
            if (state?.enabled) {
              console.log('Activating enabled plugin:', pluginId)
              await this.activatePlugin(pluginId)
            } else {
              console.log('Plugin loaded but not activated (disabled):', pluginId)
            }
          } catch (error) {
            console.error('Failed to auto-load plugin:', pluginId, error)
            // 记录错误但继续加载其他插件
            this.handlePluginError(pluginId, error as Error)
          }
        }
      }

      console.log('Plugin loading completed')
    } catch (error) {
      console.error('Failed to auto-load plugins:', error)
    }
  }

  /**
   * 计算插件加载顺序（考虑依赖关系）
   */
  private calculateLoadOrder(pluginIds: string[]): string[] {
    // 简单的依赖排序算法
    const visited = new Set<string>()
    const result: string[] = []

    const visit = (pluginId: string) => {
      if (visited.has(pluginId)) return
      
      const dependencies = pluginPersistence.getPluginDependencies(pluginId)
      dependencies.forEach(depId => {
        if (pluginIds.includes(depId)) {
          visit(depId)
        }
      })
      
      visited.add(pluginId)
      result.push(pluginId)
    }

    pluginIds.forEach(pluginId => visit(pluginId))
    return result
  }

  /**
   * 设置错误处理
   */
  private setupErrorHandling(): void {
    // 监听钩子系统错误
    hookSystem.on(HookType.HOOK_ERROR, (context) => {
      const errorData = context.data as any
      this.handlePluginError(errorData.pluginId || 'unknown', errorData.error)
    })
  }

  /**
   * 获取插件安装路径
   */
  private async getPluginInstallPath(pluginId: string): Promise<string> {
    const workspacePath = await window.electronAPI?.getWorkspacePath?.() || ''
    return `${workspacePath}/.memorynote/${pluginId}`
  }

  /**
   * 复制插件文件到安装目录
   */
  private async copyPluginFiles(sourcePath: string, targetPath: string): Promise<void> {
    try {
      // 确保目标目录存在
      await window.electronAPI?.createDirectory?.(targetPath)
      
      // 复制所有文件
      await window.electronAPI?.copyDirectory?.(sourcePath, targetPath)
      
      console.log(`Plugin files copied from ${sourcePath} to ${targetPath}`)
    } catch (error) {
      console.error('Failed to copy plugin files:', error)
      throw new Error(`Failed to copy plugin files: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 读取插件清单文件
   */
  private async readPluginManifest(pluginPath: string): Promise<PluginManifest> {
    const manifestPath = pluginPath + '/plugin.json'
    
    try {
      // 在浏览器环境中，需要通过Electron IPC读取文件
      const manifestContent = await window.electronAPI?.readFile?.(manifestPath)
      if (!manifestContent) {
        throw new Error(`Plugin manifest not found: ${manifestPath}`)
      }

      const manifest: PluginManifest = JSON.parse(manifestContent)
      
      // 验证必需字段
      this.validateManifest(manifest)
      
      return manifest
    } catch (error) {
      throw new Error(`Failed to read plugin manifest: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 验证插件清单
   */
  private validateManifest(manifest: PluginManifest): void {
    const requiredFields = ['id', 'name', 'version', 'description', 'author']
    
    for (const field of requiredFields) {
      if (!manifest[field as keyof PluginManifest]) {
        throw new Error(`Missing required field in manifest: ${field}`)
      }
    }

    // 验证版本格式
    if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
      throw new Error(`Invalid version format: ${manifest.version}`)
    }

    // 验证权限
    if (manifest.permissions) {
      for (const permission of manifest.permissions) {
        if (!Object.values(PluginPermission).includes(permission)) {
          throw new Error(`Invalid permission: ${permission}`)
        }
      }
    }
  }

  /**
   * 验证插件
   */
  private validatePlugin(manifest: PluginManifest): void {
    // 检查是否已经存在同ID的插件
    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin with ID ${manifest.id} is already loaded`)
    }

    // 检查引擎兼容性
    if (manifest.engines?.memorynote) {
      // TODO: 实现版本兼容性检查
      console.log(`Plugin requires MemoryNote version: ${manifest.engines.memorynote}`)
    }
  }

  /**
   * 解析依赖
   */
  private async resolveDependencies(manifest: PluginManifest): Promise<void> {
    const dependencies = Object.keys(manifest.dependencies || {})
    
    // 检查依赖是否已加载
    for (const depId of dependencies) {
      if (!this.plugins.has(depId)) {
        throw new Error(`Dependency not found: ${depId}`)
      }
    }

    // 添加到依赖图
    this.dependencyGraph.addNode(manifest.id, dependencies)

    // 检查循环依赖
    const circularErrors = this.dependencyGraph.checkCircularDependency()
    if (circularErrors.length > 0) {
      throw new Error(`Circular dependency detected: ${circularErrors.join(', ')}`)
    }
  }

  /**
   * 加载插件代码
   */
  private async loadPluginCode(pluginPath: string): Promise<string> {
    const entryPath = pluginPath + '/index.js'
    
    try {
      // 在浏览器环境中，需要通过Electron IPC读取文件
      const pluginCode = await window.electronAPI?.readFile?.(entryPath)
      if (!pluginCode) {
        throw new Error(`Plugin entry point not found: ${entryPath}`)
      }
      return pluginCode
    } catch (error) {
      throw new Error(`Failed to read plugin code: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * 加载插件
   */
  async loadPlugin(pluginPath: string): Promise<void> {
    try {
      console.log(`Loading plugin from: ${pluginPath}`)

      // 读取插件清单
      const manifest = await this.readPluginManifest(pluginPath)
      
      // 检查插件是否已经安装在 .memorynote 目录中
      const targetPath = await this.getPluginInstallPath(manifest.id)
      let actualPluginPath = pluginPath
      
      // 如果插件不在 .memorynote 目录中，则复制过去
      if (pluginPath !== targetPath) {
        console.log(`Copying plugin to: ${targetPath}`)
        await this.copyPluginFiles(pluginPath, targetPath)
        actualPluginPath = targetPath
      }
      
      // 验证插件
      this.validatePlugin(manifest)
      
      // 解析依赖
      await this.resolveDependencies(manifest)
      
      // 创建沙箱环境
      const sandbox = PluginSandboxFactory.create(
        manifest.id,
        manifest.permissions || [],
        this.api
      )
      
      // 加载插件代码
      const pluginCode = await this.loadPluginCode(actualPluginPath)
      
      // 创建插件上下文
      const context = PluginContextFactory.create(
        manifest.id,
        actualPluginPath,
        process.env.NODE_ENV === 'development',
        this.api
      )
      
      // 在沙箱中执行插件代码
      const PluginClass = await sandbox.execute(`
        ${pluginCode}
        // 导出插件类（假设使用默认导出）
        if (typeof module !== 'undefined' && module.exports) {
          return module.exports.default || module.exports;
        }
        // 如果没有模块系统，假设插件类在全局作用域
        return typeof Plugin !== 'undefined' ? Plugin : null;
      `, { 
        manifest, 
        context,
        module: { exports: {} },
        exports: {}
      })

      if (!PluginClass) {
        throw new Error('Plugin class not found in plugin code')
      }

      // 实例化插件
      const pluginInstance = new PluginClass(context)
      
      // 验证插件实例
      if (!pluginInstance || typeof pluginInstance !== 'object') {
        throw new Error('Invalid plugin instance')
      }

      // 创建加载的插件对象
      const loadedPlugin: LoadedPlugin = {
        manifest,
        instance: pluginInstance,
        context,
        sandbox,
        state: PluginLifecycle.LOADING
      }

      // 注册插件
      this.plugins.set(manifest.id, loadedPlugin)
      
      // 调用加载生命周期方法
      if (typeof pluginInstance.onLoad === 'function') {
        await pluginInstance.onLoad()
      }

      // 更新状态
      loadedPlugin.state = PluginLifecycle.LOADED

      // 记录插件安装信息到持久化存储
      await pluginPersistence.recordInstallation(loadedPlugin, actualPluginPath)
      
      // 触发事件
      this.emit('plugin-loaded', { pluginId: manifest.id, manifest })
      
      // 触发钩子
      hookSystem.emit(HookType.PLUGIN_LOADED, { pluginId: manifest.id, manifest }, 'plugin-manager')

      console.log(`Plugin loaded successfully: ${manifest.id}`)
      
    } catch (error) {
      console.error(`Failed to load plugin from ${pluginPath}:`, error)
      throw error
    }
  }

  /**
   * 激活插件
   */
  async activatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`)
    }

    if (plugin.state === PluginLifecycle.ACTIVE) {
      console.log(`Plugin ${pluginId} is already active`)
      return
    }

    if (plugin.state !== PluginLifecycle.LOADED && plugin.state !== PluginLifecycle.INACTIVE) {
      throw new Error(`Cannot activate plugin ${pluginId} in state: ${plugin.state}`)
    }

    try {
      plugin.state = PluginLifecycle.INITIALIZING

      // 激活依赖的插件
      await this.activateDependencies(plugin.manifest)
      
      // 调用初始化方法
      if (typeof plugin.instance.onInitialize === 'function') {
        await plugin.instance.onInitialize()
      }

      // 调用激活方法
      if (typeof plugin.instance.onActivate === 'function') {
        await plugin.instance.onActivate()
      }

      // 注册扩展点
      if (typeof plugin.instance.registerExtensions === 'function') {
        plugin.instance.registerExtensions()
      }

      // 更新状态
      plugin.state = PluginLifecycle.ACTIVE

      // 更新持久化状态
      await pluginPersistence.updatePluginState(pluginId, {
        enabled: true,
        lastLoaded: Date.now()
      })

      // 触发事件
      this.emit('plugin-activated', { pluginId, manifest: plugin.manifest })
      
      // 触发钩子
      hookSystem.emit(HookType.PLUGIN_ACTIVATED, { pluginId, manifest: plugin.manifest }, 'plugin-manager')

      console.log(`Plugin activated successfully: ${pluginId}`)
      
    } catch (error) {
      plugin.state = PluginLifecycle.ERROR
      this.handlePluginError(pluginId, error)
      throw error
    }
  }

  /**
   * 激活依赖的插件
   */
  private async activateDependencies(manifest: PluginManifest): Promise<void> {
    const dependencies = Object.keys(manifest.dependencies || {})
    
    for (const depId of dependencies) {
      const depPlugin = this.plugins.get(depId)
      if (depPlugin && depPlugin.state !== PluginLifecycle.ACTIVE) {
        await this.activatePlugin(depId)
      }
    }
  }

  /**
   * 停用插件
   */
  async deactivatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin || plugin.state !== PluginLifecycle.ACTIVE) {
      return
    }

    try {
      // 检查是否有其他插件依赖此插件
      const dependents = this.findDependentPlugins(pluginId)
      const activeDependents = dependents.filter(depId => {
        const depPlugin = this.plugins.get(depId)
        return depPlugin && depPlugin.state === PluginLifecycle.ACTIVE
      })

      if (activeDependents.length > 0) {
        throw new Error(`Cannot deactivate plugin ${pluginId}: active plugins depend on it: ${activeDependents.join(', ')}`)
      }

      plugin.state = PluginLifecycle.UNLOADING

      // 调用停用方法
      if (typeof plugin.instance.onDeactivate === 'function') {
        await plugin.instance.onDeactivate()
      }

      // 清理资源
      plugin.context.dispose()

      // 更新状态
      plugin.state = PluginLifecycle.INACTIVE

      // 更新持久化状态
      await pluginPersistence.updatePluginState(pluginId, {
        enabled: false
      })

      // 触发事件
      this.emit('plugin-deactivated', { pluginId, manifest: plugin.manifest })
      
      // 触发钩子
      hookSystem.emit(HookType.PLUGIN_DEACTIVATED, { pluginId, manifest: plugin.manifest }, 'plugin-manager')

      console.log(`Plugin deactivated successfully: ${pluginId}`)
      
    } catch (error) {
      this.handlePluginError(pluginId, error)
      throw error
    }
  }

  /**
   * 卸载插件
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      return
    }

    try {
      // 先停用插件
      if (plugin.state === PluginLifecycle.ACTIVE) {
        await this.deactivatePlugin(pluginId)
      }

      plugin.state = PluginLifecycle.UNLOADING

      // 调用卸载方法
      if (typeof plugin.instance.onUnload === 'function') {
        await plugin.instance.onUnload()
      }

      // 销毁沙箱
      plugin.sandbox.destroy()

      // 清理上下文
      plugin.context.dispose()

      // 从依赖图中移除
      this.dependencyGraph.removeNode(pluginId)

      // 清理钩子
      hookSystem.removePluginHandlers(pluginId)

      // 清理消息传递
      PluginContextFactory.removeMessaging(pluginId)

      // 从插件注册表中移除
      this.plugins.delete(pluginId)

      // 触发事件
      this.emit('plugin-unloaded', { pluginId, manifest: plugin.manifest })
      
      // 触发钩子
      hookSystem.emit(HookType.PLUGIN_UNLOADED, { pluginId, manifest: plugin.manifest }, 'plugin-manager')

      console.log(`Plugin unloaded successfully: ${pluginId}`)
      
    } catch (error) {
      this.handlePluginError(pluginId, error)
      throw error
    }
  }

  /**
   * 查找依赖某个插件的插件
   */
  private findDependentPlugins(pluginId: string): string[] {
    return this.dependencyGraph.getDependents(pluginId)
  }

  /**
   * 处理插件错误
   */
  private handlePluginError(pluginId: string, error: unknown): void {
    console.error(`Plugin error [${pluginId}]:`, error)
    
    const plugin = this.plugins.get(pluginId)
    if (plugin) {
      plugin.state = PluginLifecycle.ERROR
      
      // 调用插件的错误处理方法
      if (typeof plugin.instance.onError === 'function') {
        try {
          plugin.instance.onError(error instanceof Error ? error : new Error(String(error)))
        } catch (handlerError) {
          console.error(`Error in plugin error handler [${pluginId}]:`, handlerError)
        }
      }
    }

    // 触发错误事件
    this.emit('plugin-error', { pluginId, error })
    
    // 触发钩子
    hookSystem.emit(HookType.PLUGIN_ERROR, { pluginId, error }, 'plugin-manager')
  }

  /**
   * 获取插件
   */
  getPlugin(pluginId: string): LoadedPlugin | undefined {
    return this.plugins.get(pluginId)
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): LoadedPlugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 获取插件状态
   */
  getPluginState(pluginId: string): PluginLifecycle | undefined {
    return this.plugins.get(pluginId)?.state
  }

  /**
   * 获取活跃插件
   */
  getActivePlugins(): LoadedPlugin[] {
    return this.getAllPlugins().filter(plugin => plugin.state === PluginLifecycle.ACTIVE)
  }

  /**
   * 检查插件是否已加载
   */
  isPluginLoaded(pluginId: string): boolean {
    return this.plugins.has(pluginId)
  }

  /**
   * 检查插件是否已激活
   */
  isPluginActive(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId)
    return plugin ? plugin.state === PluginLifecycle.ACTIVE : false
  }

  /**
   * 获取插件依赖关系
   */
  getPluginDependencies(pluginId: string): string[] {
    return this.dependencyGraph.getDependencies(pluginId)
  }

  /**
   * 获取依赖某插件的插件
   */
  getPluginDependents(pluginId: string): string[] {
    return this.dependencyGraph.getDependents(pluginId)
  }

  /**
   * 获取推荐的加载顺序
   */
  getLoadOrder(): string[] {
    return this.dependencyGraph.getLoadOrder()
  }

  /**
   * 批量激活插件
   */
  async activatePlugins(pluginIds: string[]): Promise<void> {
    // 按依赖顺序排序
    const sortedIds = this.getLoadOrder().filter(id => pluginIds.includes(id))
    
    for (const pluginId of sortedIds) {
      try {
        await this.activatePlugin(pluginId)
      } catch (error) {
        console.error(`Failed to activate plugin ${pluginId}:`, error)
        // 继续激活其他插件
      }
    }
  }

  /**
   * 批量停用插件
   */
  async deactivatePlugins(pluginIds: string[]): Promise<void> {
    // 按依赖顺序的逆序停用
    const sortedIds = this.getLoadOrder().filter(id => pluginIds.includes(id)).reverse()
    
    for (const pluginId of sortedIds) {
      try {
        await this.deactivatePlugin(pluginId)
      } catch (error) {
        console.error(`Failed to deactivate plugin ${pluginId}:`, error)
        // 继续停用其他插件
      }
    }
  }

  /**
   * 清理所有插件
   */
  async dispose(): Promise<void> {
    const activePlugins = this.getActivePlugins().map(p => p.manifest.id)
    await this.deactivatePlugins(activePlugins)
    
    for (const pluginId of Array.from(this.plugins.keys())) {
      await this.unloadPlugin(pluginId)
    }

    this.removeAllListeners()
  }
}
