// 插件上下文实现
import { EventEmitter } from '../../utils/EventEmitter'
import type { 
  PluginContext,
  PluginAPI,
  PluginLogger,
  PluginStorage,
  PluginConfig,
  PluginEventEmitter,
  PluginHookRegistry,
  DisposableRegistry,
  PluginMessaging,
  Disposable,
  ConfigChange
} from '../../types/plugin'
import { PluginHookRegistry as HookRegistryImpl } from './hookSystem'
import { hookSystem } from './hookSystem'

// 插件日志器实现
class PluginLoggerImpl implements PluginLogger {
  constructor(private pluginId: string) {}

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString()
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ') : ''
    return `[${timestamp}] [${level.toUpperCase()}] [Plugin:${this.pluginId}] ${message}${formattedArgs}`
  }

  debug(message: string, ...args: any[]): void {
    console.debug(this.formatMessage('debug', message, ...args))
  }

  info(message: string, ...args: any[]): void {
    console.info(this.formatMessage('info', message, ...args))
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.formatMessage('warn', message, ...args))
  }

  error(message: string, ...args: any[]): void {
    console.error(this.formatMessage('error', message, ...args))
  }
}

// 插件存储实现
class PluginStorageImpl implements PluginStorage {
  private storageKey: string

  constructor(pluginId: string) {
    this.storageKey = `plugin_storage_${pluginId}`
  }

  private getStorage(): Record<string, any> {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('Failed to read plugin storage:', error)
      return {}
    }
  }

  private setStorage(data: Record<string, any>): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to write plugin storage:', error)
    }
  }

  async get<T>(key: string, defaultValue?: T): Promise<T> {
    const storage = this.getStorage()
    const value = storage[key]
    return value !== undefined ? value : defaultValue as T
  }

  async set(key: string, value: any): Promise<void> {
    const storage = this.getStorage()
    storage[key] = value
    this.setStorage(storage)
  }

  async delete(key: string): Promise<void> {
    const storage = this.getStorage()
    delete storage[key]
    this.setStorage(storage)
  }

  async clear(): Promise<void> {
    try {
      localStorage.removeItem(this.storageKey)
    } catch (error) {
      console.error('Failed to clear plugin storage:', error)
    }
  }

  async keys(): Promise<string[]> {
    const storage = this.getStorage()
    return Object.keys(storage)
  }
}

// 插件配置实现
class PluginConfigImpl implements PluginConfig {
  private configKey: string
  private eventEmitter = new EventEmitter()

  constructor(pluginId: string) {
    this.configKey = `plugin_config_${pluginId}`
  }

  private getConfig(): Record<string, any> {
    try {
      const data = localStorage.getItem(this.configKey)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('Failed to read plugin config:', error)
      return {}
    }
  }

  private setConfig(data: Record<string, any>): void {
    try {
      localStorage.setItem(this.configKey, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to write plugin config:', error)
    }
  }

  get<T>(key: string, defaultValue?: T): T {
    const config = this.getConfig()
    const value = config[key]
    return value !== undefined ? value : defaultValue as T
  }

  async set(key: string, value: any): Promise<void> {
    const config = this.getConfig()
    const oldValue = config[key]
    
    config[key] = value
    this.setConfig(config)

    // 触发变化事件
    this.eventEmitter.emit('change', {
      key,
      oldValue,
      newValue: value
    })
  }

  onDidChange(callback: (change: ConfigChange) => void): Disposable {
    this.eventEmitter.on('change', callback)
    
    return {
      dispose: () => {
        this.eventEmitter.removeListener('change', callback)
      }
    }
  }
}

// 插件事件发射器实现
class PluginEventEmitterImpl implements PluginEventEmitter {
  private eventEmitter = new EventEmitter()

  on(event: string, listener: (...args: any[]) => void): Disposable {
    this.eventEmitter.on(event, listener)
    
    return {
      dispose: () => {
        this.removeListener(event, listener)
      }
    }
  }

  once(event: string, listener: (...args: any[]) => void): Disposable {
    this.eventEmitter.once(event, listener)
    
    return {
      dispose: () => {
        this.removeListener(event, listener)
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    this.eventEmitter.emit(event, ...args)
  }

  removeListener(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.removeListener(event, listener)
  }
}

// 可释放资源注册表实现
class DisposableRegistryImpl implements DisposableRegistry {
  private disposables: Disposable[] = []

  add(disposable: Disposable): void {
    this.disposables.push(disposable)
  }

  dispose(): void {
    for (const disposable of this.disposables) {
      try {
        disposable.dispose()
      } catch (error) {
        console.error('Error disposing resource:', error)
      }
    }
    this.disposables = []
  }
}

// 插件消息传递实现
class PluginMessagingImpl implements PluginMessaging {
  private eventEmitter = new EventEmitter()

  constructor(private pluginId: string) {}

  async send(targetPluginId: string, message: any): Promise<void> {
    // 触发消息事件
    this.eventEmitter.emit('message', {
      from: this.pluginId,
      to: targetPluginId,
      message,
      timestamp: Date.now()
    })
  }

  async broadcast(message: any): Promise<void> {
    // 广播消息给所有插件
    this.eventEmitter.emit('broadcast', {
      from: this.pluginId,
      message,
      timestamp: Date.now()
    })
  }

  onMessage(callback: (message: any, sourcePluginId: string) => void): Disposable {
    const handler = (data: any) => {
      if (data.to === this.pluginId || !data.to) {
        callback(data.message, data.from)
      }
    }

    this.eventEmitter.on('message', handler)
    this.eventEmitter.on('broadcast', (data: any) => {
      if (data.from !== this.pluginId) {
        callback(data.message, data.from)
      }
    })

    return {
      dispose: () => {
        this.eventEmitter.removeListener('message', handler)
      }
    }
  }

  // 静态方法：连接所有插件的消息系统
  static connectAll(messagingInstances: PluginMessagingImpl[]): void {
    const globalEmitter = new EventEmitter()

    messagingInstances.forEach(messaging => {
      // 转发消息到全局事件发射器
      messaging.eventEmitter.on('message', (data: any) => {
        globalEmitter.emit('message', data)
      })

      messaging.eventEmitter.on('broadcast', (data: any) => {
        globalEmitter.emit('broadcast', data)
      })

      // 从全局事件发射器接收消息
      globalEmitter.on('message', (data: any) => {
        messaging.eventEmitter.emit('message', data)
      })

      globalEmitter.on('broadcast', (data: any) => {
        messaging.eventEmitter.emit('broadcast', data)
      })
    })
  }
}

// 插件上下文实现
export class PluginContextImpl implements PluginContext {
  public readonly logger: PluginLogger
  public readonly storage: PluginStorage
  public readonly config: PluginConfig
  public readonly events: PluginEventEmitter
  public readonly hooks: PluginHookRegistry
  public readonly disposables: DisposableRegistry
  public readonly messaging: PluginMessaging

  constructor(
    public readonly pluginId: string,
    public readonly pluginPath: string,
    public readonly isDev: boolean,
    public readonly api: PluginAPI
  ) {
    this.logger = new PluginLoggerImpl(pluginId)
    this.storage = new PluginStorageImpl(pluginId)
    this.config = new PluginConfigImpl(pluginId)
    this.events = new PluginEventEmitterImpl()
    this.hooks = new HookRegistryImpl(hookSystem, pluginId)
    this.disposables = new DisposableRegistryImpl()
    this.messaging = new PluginMessagingImpl(pluginId)

    // 自动添加钩子注册到可释放资源
    const originalHookOn = this.hooks.on.bind(this.hooks)
    this.hooks.on = (type, handler, options) => {
      const disposable = originalHookOn(type, handler, options)
      this.disposables.add(disposable)
      return disposable
    }

    const originalHookOnce = this.hooks.once.bind(this.hooks)
    this.hooks.once = (type, handler, options) => {
      const disposable = originalHookOnce(type, handler, options)
      this.disposables.add(disposable)
      return disposable
    }
  }

  /**
   * 清理插件上下文
   */
  dispose(): void {
    this.logger.info('Disposing plugin context...')
    
    try {
      // 清理所有可释放资源
      this.disposables.dispose()
      
      // 移除所有事件监听器
      this.events.removeListener = () => {}
      
      this.logger.info('Plugin context disposed successfully')
    } catch (error) {
      this.logger.error('Error disposing plugin context:', error)
    }
  }
}

// 插件上下文工厂
export class PluginContextFactory {
  private static messagingInstances: PluginMessagingImpl[] = []

  static create(
    pluginId: string,
    pluginPath: string,
    isDev: boolean,
    api: PluginAPI
  ): PluginContext {
    const context = new PluginContextImpl(pluginId, pluginPath, isDev, api)
    
    // 收集消息传递实例用于连接
    this.messagingInstances.push(context.messaging as PluginMessagingImpl)
    
    // 连接所有插件的消息系统
    PluginMessagingImpl.connectAll(this.messagingInstances)
    
    return context
  }

  static removeMessaging(pluginId: string): void {
    this.messagingInstances = this.messagingInstances.filter(
      messaging => messaging['pluginId'] !== pluginId
    )
  }
}
