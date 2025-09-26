// 钩子系统实现
import { EventEmitter } from '../../utils/EventEmitter'
import type { 
  HookType, 
  HookHandler, 
  HookContext, 
  HookRegistrationOptions,
  Disposable 
} from '../../types/plugin'

// 钩子处理器信息
interface HookHandlerInfo<T = any> {
  handler: HookHandler<T>
  options: HookRegistrationOptions
  pluginId?: string
}

// 钩子上下文实现
class HookContextImpl<T = any> implements HookContext<T> {
  private _prevented = false
  private _stopped = false
  private _data: T

  constructor(
    public readonly type: HookType,
    data: T,
    public readonly source: string,
    public readonly timestamp: number = Date.now()
  ) {
    this._data = data
  }

  get data(): T {
    return this._data
  }

  preventDefault(): void {
    this._prevented = true
  }

  stopPropagation(): void {
    this._stopped = true
  }

  updateData(newData: Partial<T>): void {
    this._data = { ...this._data, ...newData }
  }

  get isPrevented(): boolean {
    return this._prevented
  }

  get isStopped(): boolean {
    return this._stopped
  }
}

// 钩子系统实现
export class HookSystem {
  private handlers = new Map<HookType, HookHandlerInfo[]>()

  /**
   * 注册钩子处理器
   */
  on<T>(
    type: HookType, 
    handler: HookHandler<T>, 
    options: HookRegistrationOptions = {},
    pluginId?: string
  ): Disposable {
    const handlerInfo: HookHandlerInfo<T> = {
      handler,
      options,
      pluginId
    }

    if (!this.handlers.has(type)) {
      this.handlers.set(type, [])
    }

    const handlers = this.handlers.get(type)!
    handlers.push(handlerInfo)

    // 按优先级排序（数字越小优先级越高）
    handlers.sort((a, b) => (a.options.priority || 100) - (b.options.priority || 100))

    return {
      dispose: () => {
        this.removeHandler(type, handler)
      }
    }
  }

  /**
   * 注册一次性钩子处理器
   */
  once<T>(
    type: HookType, 
    handler: HookHandler<T>, 
    options: HookRegistrationOptions = {},
    pluginId?: string
  ): Disposable {
    const onceOptions = { ...options, once: true }
    return this.on(type, handler, onceOptions, pluginId)
  }

  /**
   * 触发钩子
   */
  async emit<T>(type: HookType, data: T, source: string): Promise<HookContext<T>> {
    const handlers = this.handlers.get(type) || []
    const context = new HookContextImpl(type, data, source)

    for (const handlerInfo of handlers) {
      if (context.isStopped) {
        break
      }

      // 检查条件
      if (handlerInfo.options.condition && !handlerInfo.options.condition(context)) {
        continue
      }

      try {
        await handlerInfo.handler(context)

        // 如果是一次性处理器，执行后移除
        if (handlerInfo.options.once) {
          this.removeHandler(type, handlerInfo.handler)
        }
      } catch (error) {
        console.error(`Error in hook handler for ${type}:`, error)
        
        // 触发错误事件
        console.error('Hook handler error:', {
          type,
          handler: handlerInfo.handler,
          pluginId: handlerInfo.pluginId,
          error
        })
      }
    }

    return context
  }

  /**
   * 移除钩子处理器
   */
  removeHandler(type: HookType, handler: HookHandler): void {
    const handlers = this.handlers.get(type)
    if (!handlers) return

    const index = handlers.findIndex(h => h.handler === handler)
    if (index !== -1) {
      handlers.splice(index, 1)
    }

    if (handlers.length === 0) {
      this.handlers.delete(type)
    }
  }

  /**
   * 移除插件的所有钩子处理器
   */
  removePluginHandlers(pluginId: string): void {
    for (const [type, handlers] of this.handlers.entries()) {
      const filteredHandlers = handlers.filter(h => h.pluginId !== pluginId)
      
      if (filteredHandlers.length === 0) {
        this.handlers.delete(type)
      } else {
        this.handlers.set(type, filteredHandlers)
      }
    }
  }

  /**
   * 获取钩子类型的处理器数量
   */
  getHandlerCount(type: HookType): number {
    return this.handlers.get(type)?.length || 0
  }

  /**
   * 获取处理器（用于工具函数）
   */
  getHandlers() {
    return this.handlers
  }

  /**
   * 获取所有注册的钩子类型
   */
  getRegisteredHookTypes(): HookType[] {
    return Array.from(this.handlers.keys())
  }

  /**
   * 清空所有钩子处理器
   */
  clear(): void {
    this.handlers.clear()
  }

  /**
   * 获取插件的钩子处理器统计
   */
  getPluginStats(pluginId: string): { [key: string]: number } {
    const stats: { [key: string]: number } = {}
    
    for (const [type, handlers] of this.handlers.entries()) {
      const count = handlers.filter(h => h.pluginId === pluginId).length
      if (count > 0) {
        stats[type] = count
      }
    }
    
    return stats
  }
}

// 全局钩子系统单例
export const hookSystem = new HookSystem()

// 插件钩子注册表实现
export class PluginHookRegistry {
  constructor(
    private hookSystem: HookSystem,
    private pluginId: string
  ) {}

  on<T>(
    type: HookType, 
    handler: HookHandler<T>, 
    options?: HookRegistrationOptions
  ): Disposable {
    return this.hookSystem.on(type, handler, options, this.pluginId)
  }

  once<T>(
    type: HookType, 
    handler: HookHandler<T>, 
    options?: HookRegistrationOptions
  ): Disposable {
    return this.hookSystem.once(type, handler, options, this.pluginId)
  }

  async emit<T>(type: HookType, data: T, source: string): Promise<void> {
    await this.hookSystem.emit(type, data, source)
  }

  removeHandler(type: HookType, handler: HookHandler): void {
    this.hookSystem.removeHandler(type, handler)
  }
}

// 工具函数：创建同步钩子
export function createSyncHook<T>(type: HookType) {
  return (data: T, source: string = 'system'): T => {
    const context = new HookContextImpl(type, data, source)
    const handlers = hookSystem.getHandlers().get(type) || []

    for (const handlerInfo of handlers) {
      if (context.isStopped) break

      if (handlerInfo.options.condition && !handlerInfo.options.condition(context)) {
        continue
      }

      try {
        const result = handlerInfo.handler(context)
        // 如果返回Promise，则跳过（同步钩子不支持异步处理器）
        if (result instanceof Promise) {
          console.warn(`Async handler detected in sync hook ${type}, skipping`)
          continue
        }

        if (handlerInfo.options.once) {
          hookSystem.removeHandler(type, handlerInfo.handler)
        }
      } catch (error) {
        console.error(`Error in sync hook handler for ${type}:`, error)
      }
    }

    return context.data
  }
}

// 工具函数：创建异步钩子
export function createAsyncHook<T>(type: HookType) {
  return async (data: T, source: string = 'system'): Promise<T> => {
    const context = await hookSystem.emit(type, data, source)
    return context.data
  }
}
