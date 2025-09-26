// 插件系统统一入口文件

// 核心服务导出
export { pluginService, usePluginService } from './pluginService'
export { PluginManager } from './pluginManager'
export { hookSystem, PluginHookRegistry } from './hookSystem'
export { pluginAPI } from './pluginAPI'
export { PluginSandboxFactory } from './pluginSandbox'
export { PluginContextFactory } from './pluginContext'
export { pluginInstaller, PluginInstaller } from './pluginInstaller'
export { pluginPersistence, PluginPersistence } from './pluginPersistence'

// 工具函数导出
export { createSyncHook, createAsyncHook } from './hookSystem'

// 类型导出 (从types/plugin.ts重新导出，方便使用)
export type {
  // 核心接口
  Plugin,
  PluginManifest,
  PluginContext,
  PluginAPI,
  LoadedPlugin,
  
  // 生命周期和状态
  PluginLifecycle,
  PluginPermission,
  
  // 钩子系统
  HookType,
  HookHandler,
  HookContext,
  HookRegistrationOptions,
  
  // UI扩展
  SidebarPanel,
  NavigationButton,
  EditorAction,
  ContextMenuItem,
  
  // 系统扩展
  Command,
  Keybinding,
  Theme,
  
  // 工具类型
  Disposable
} from '../../types/plugin'

// 插件安装器相关类型导出
export type {
  PluginPackage,
  PluginSource,
  PluginMarketInfo,
  InstallOptions
} from './pluginInstaller'
