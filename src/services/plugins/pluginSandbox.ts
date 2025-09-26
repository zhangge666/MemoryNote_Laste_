// 插件沙箱环境实现
import type { 
  PluginSandbox, 
  PluginGlobal, 
  PluginAPI, 
  ResourceMonitor,
  ResourceLimits 
} from '../../types/plugin'
import { PluginPermission } from '../../types/plugin'

// 资源监控实现
class ResourceMonitorImpl implements ResourceMonitor {
  private cpuUsage = 0
  private memoryUsage = 0
  private networkRequests = 0
  private fileOperations = 0
  private limits: ResourceLimits = {}
  
  private startTime = Date.now()
  private lastCpuCheck = Date.now()

  getCpuUsage(): number {
    return this.cpuUsage
  }

  getMemoryUsage(): number {
    return this.memoryUsage
  }

  getNetworkRequests(): number {
    return this.networkRequests
  }

  getFileOperations(): number {
    return this.fileOperations
  }

  setLimits(limits: ResourceLimits): void {
    this.limits = { ...this.limits, ...limits }
  }

  // 内部方法：更新资源使用情况
  updateCpuUsage(usage: number): void {
    this.cpuUsage = usage
    this.checkLimits()
  }

  updateMemoryUsage(usage: number): void {
    this.memoryUsage = usage
    this.checkLimits()
  }

  incrementNetworkRequests(): void {
    this.networkRequests++
    this.checkLimits()
  }

  incrementFileOperations(): void {
    this.fileOperations++
    this.checkLimits()
  }

  private checkLimits(): void {
    if (this.limits.maxMemoryMB && this.memoryUsage > this.limits.maxMemoryMB) {
      throw new Error(`Plugin exceeded memory limit: ${this.memoryUsage}MB > ${this.limits.maxMemoryMB}MB`)
    }

    if (this.limits.maxCpuPercent && this.cpuUsage > this.limits.maxCpuPercent) {
      throw new Error(`Plugin exceeded CPU limit: ${this.cpuUsage}% > ${this.limits.maxCpuPercent}%`)
    }

    // 检查每分钟限制，但只在运行超过30秒后才开始严格检查
    const now = Date.now()
    const minutesElapsed = (now - this.startTime) / (1000 * 60)
    const secondsElapsed = (now - this.startTime) / 1000

    // 给插件初始化一些时间，避免在启动时就触发限制
    if (secondsElapsed > 30 && this.limits.maxFileOperationsPerMinute && minutesElapsed > 0) {
      const fileOpsPerMinute = this.fileOperations / minutesElapsed
      if (fileOpsPerMinute > this.limits.maxFileOperationsPerMinute) {
        throw new Error(`Plugin exceeded file operations limit: ${fileOpsPerMinute}/min > ${this.limits.maxFileOperationsPerMinute}/min`)
      }
    }

    if (secondsElapsed > 30 && this.limits.maxNetworkRequestsPerMinute && minutesElapsed > 0) {
      const netReqPerMinute = this.networkRequests / minutesElapsed
      if (netReqPerMinute > this.limits.maxNetworkRequestsPerMinute) {
        throw new Error(`Plugin exceeded network requests limit: ${netReqPerMinute}/min > ${this.limits.maxNetworkRequestsPerMinute}/min`)
      }
    }
  }

  reset(): void {
    this.cpuUsage = 0
    this.memoryUsage = 0
    this.networkRequests = 0
    this.fileOperations = 0
    this.startTime = Date.now()
  }
}

// 受限的全局对象实现
class PluginGlobalImpl implements PluginGlobal {
  readonly Object = Object
  readonly Array = Array
  readonly Promise = Promise
  readonly JSON = JSON
  
  readonly console = {
    log: (...args: any[]) => console.log(`[Plugin ${this.pluginId}]`, ...args),
    error: (...args: any[]) => console.error(`[Plugin ${this.pluginId}]`, ...args),
    warn: (...args: any[]) => console.warn(`[Plugin ${this.pluginId}]`, ...args),
    info: (...args: any[]) => console.info(`[Plugin ${this.pluginId}]`, ...args)
  }

  constructor(private pluginId: string) {}
}

// 插件沙箱实现
export class PluginSandboxImpl implements PluginSandbox {
  public readonly permissions: Set<PluginPermission>
  public readonly global: PluginGlobal
  public readonly monitor: ResourceMonitor
  
  private isDestroyed = false

  constructor(
    public readonly pluginId: string,
    permissions: PluginPermission[],
    public readonly api: PluginAPI
  ) {
    this.permissions = new Set(permissions)
    this.global = new PluginGlobalImpl(pluginId)
    this.monitor = new ResourceMonitorImpl()
    
    // 设置默认资源限制
    this.monitor.setLimits({
      maxMemoryMB: 500,
      maxCpuPercent: 90,
      maxFileOperationsPerMinute: 10000,
      maxNetworkRequestsPerMinute: 500
    })
  }

  /**
   * 检查权限
   */
  hasPermission(permission: PluginPermission): boolean {
    return this.permissions.has(permission)
  }

  /**
   * 检查权限并抛出错误
   */
  requirePermission(permission: PluginPermission): void {
    if (!this.hasPermission(permission)) {
      throw new Error(`Plugin ${this.pluginId} does not have permission: ${permission}`)
    }
  }

  /**
   * 在沙箱中执行代码
   */
  async execute(code: string, context: any = {}): Promise<any> {
    if (this.isDestroyed) {
      throw new Error('Sandbox has been destroyed')
    }

    try {
      // 创建安全的执行环境
      const sandbox = this.createExecutionContext(context)
      
      // 使用 Function 构造函数创建沙箱函数
      // 不使用严格模式，因为插件代码可能使用 arguments 等关键字
      const func = new Function(
        ...Object.keys(sandbox),
        code
      )

      // 记录执行开始时间用于CPU监控
      const startTime = performance.now()
      
      try {
        const result = await func.apply(null, Object.values(sandbox))
        
        // 更新CPU使用情况
        const endTime = performance.now()
        const executionTime = endTime - startTime // 毫秒
        this.updateCpuUsage(executionTime)
        
        return result
      } catch (error) {
        throw error
      }
    } catch (error) {
      console.error(`Error executing code in plugin ${this.pluginId}:`, error)
      throw error
    }
  }

  /**
   * 创建执行上下文
   */
  private createExecutionContext(additionalContext: any = {}): any {
    const proxyApi = this.createAPIProxy()
    
    return {
      // 受限的全局对象
      console: this.global.console,
      Object: this.global.Object,
      Array: this.global.Array,
      Promise: this.global.Promise,
      JSON: this.global.JSON,
      
      // 插件API
      api: proxyApi,
      
      // 安全的DOM API
      document: this.createSafeDocumentAPI(),
      
      // 工具函数
      setTimeout: this.createTimerProxy(setTimeout),
      setInterval: this.createTimerProxy(setInterval),
      clearTimeout,
      clearInterval,
      
      // 额外上下文
      ...additionalContext,
      
      // 禁止访问的对象
      process: undefined,
      require: undefined,
      global: undefined,
      window: undefined,
      eval: undefined,
      Function: undefined
    }
  }

  /**
   * 创建安全的Document API
   */
  private createSafeDocumentAPI(): any {
    return {
      createElement: (tagName: string) => {
        // 使用实际的document.createElement但返回代理
        const element = document.createElement(tagName)
        return this.createElementProxy(element)
      },
      createTextNode: (text: string) => {
        return document.createTextNode(text)
      },
      getElementById: (id: string) => {
        const element = document.getElementById(id)
        return element ? this.createElementProxy(element) : null
      },
      querySelector: (selector: string) => {
        const element = document.querySelector(selector)
        return element ? this.createElementProxy(element) : null
      },
      querySelectorAll: (selector: string) => {
        const elements = document.querySelectorAll(selector)
        return Array.from(elements).map(el => this.createElementProxy(el))
      },
      head: this.createHeadProxy(),
      body: this.createElementProxy(document.body)
    }
  }

  /**
   * 创建Head元素的特殊代理
   */
  private createHeadProxy(): any {
    return new Proxy(document.head, {
      get: (target, prop) => {
        if (prop === 'appendChild') {
          return (child: any) => {
            // 如果是代理元素，获取原始元素
            const realChild = child.__target__ || child
            (this.monitor as any).incrementFileOperations?.()
            return target.appendChild(realChild)
          }
        }
        if (typeof target[prop as keyof Element] === 'function') {
          return (...args: any[]) => {
            (this.monitor as any).incrementFileOperations?.()
            return (target[prop as keyof Element] as any).apply(target, args)
          }
        }
        return target[prop as keyof Element]
      },
      set: (target, prop, value) => {
        ;(target as any)[prop] = value
        return true
      }
    })
  }

  /**
   * 创建元素代理
   */
  private createElementProxy(element: Element): any {
    const proxy = new Proxy(element, {
      get: (target, prop) => {
        // 特殊属性：返回原始元素的引用
        if (prop === '__target__') {
          return target
        }
        // 允许大部分DOM操作但限制危险操作
        if (prop === 'innerHTML' || prop === 'outerHTML') {
          return target[prop as keyof Element]
        }
        if (typeof target[prop as keyof Element] === 'function') {
          return (...args: any[]) => {
            // 记录DOM操作
            (this.monitor as any).incrementFileOperations?.()
            return (target[prop as keyof Element] as any).apply(target, args)
          }
        }
        return target[prop as keyof Element]
      },
      set: (target, prop, value) => {
        // 允许设置大部分属性
        ;(target as any)[prop] = value
        return true
      }
    })
    return proxy
  }

  /**
   * 创建API代理
   */
  private createAPIProxy(): PluginAPI {
    const createProxy = (obj: any, path: string = ''): any => {
      return new Proxy(obj, {
        get: (target, prop) => {
          const fullPath = path ? `${path}.${String(prop)}` : String(prop)
          
          if (typeof target[prop] === 'function') {
            return (...args: any[]) => {
              // 检查权限
              this.checkAPIPermission(fullPath)
              
              // 记录资源使用
              if (fullPath.includes('fs.')) {
                (this.monitor as ResourceMonitorImpl).incrementFileOperations()
              }
              if (fullPath.includes('network.') || fullPath.includes('http')) {
                (this.monitor as ResourceMonitorImpl).incrementNetworkRequests()
              }
              
              return target[prop].apply(target, args)
            }
          } else if (typeof target[prop] === 'object' && target[prop] !== null) {
            return createProxy(target[prop], fullPath)
          }
          
          return target[prop]
        }
      })
    }

    return createProxy(this.api)
  }

  /**
   * 检查API权限
   */
  private checkAPIPermission(apiPath: string): void {
    const permissionMap: { [key: string]: PluginPermission } = {
      'data.fs.read': PluginPermission.FILE_READ,
      'data.fs.write': PluginPermission.FILE_WRITE,
      'data.fs.delete': PluginPermission.FILE_DELETE,
      'data.fs.watch': PluginPermission.FILE_WATCH,
      'data.database': PluginPermission.DB_READ,
      'ui.dialog': PluginPermission.UI_DIALOG,
      'ui.notification': PluginPermission.UI_NOTIFICATION,
      'system.command': PluginPermission.SYSTEM_COMMAND,
      'system.clipboard': PluginPermission.SYSTEM_CLIPBOARD,
    }

    for (const [pattern, permission] of Object.entries(permissionMap)) {
      if (apiPath.includes(pattern)) {
        this.requirePermission(permission)
        break
      }
    }
  }

  /**
   * 创建定时器代理
   */
  private createTimerProxy(originalTimer: Function) {
    return (callback: Function, delay: number, ...args: any[]) => {
      const wrappedCallback = (...callbackArgs: any[]) => {
        if (!this.isDestroyed) {
          callback.apply(null, callbackArgs)
        }
      }
      return originalTimer(wrappedCallback, delay, ...args)
    }
  }

  /**
   * 更新CPU使用情况
   */
  private updateCpuUsage(executionTime: number): void {
    // 简单的CPU使用率计算
    const cpuUsage = Math.min(100, (executionTime / 100) * 100)
    ;(this.monitor as ResourceMonitorImpl).updateCpuUsage(cpuUsage)
  }

  /**
   * 销毁沙箱
   */
  destroy(): void {
    if (this.isDestroyed) return
    
    this.isDestroyed = true
    
    // 清理资源监控
    ;(this.monitor as ResourceMonitorImpl).reset()
    
    console.log(`Plugin sandbox ${this.pluginId} destroyed`)
  }
}

// 沙箱工厂
export class PluginSandboxFactory {
  static create(
    pluginId: string,
    permissions: PluginPermission[],
    api: PluginAPI
  ): PluginSandbox {
    return new PluginSandboxImpl(pluginId, permissions, api)
  }
}
