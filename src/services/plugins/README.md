# 插件系统架构

这个目录包含了MemoryNote插件系统的所有核心组件。

## 文件结构

```
src/services/plugins/
├── index.ts              # 统一入口文件，导出所有公共API
├── README.md             # 本文档
├── hookSystem.ts         # 事件钩子系统 - 事件驱动的扩展机制
├── pluginManager.ts      # 插件管理器 - 生命周期管理
├── pluginSandbox.ts      # 插件沙箱 - 安全执行环境
├── pluginAPI.ts          # 插件API - 功能接口实现
├── pluginContext.ts      # 插件上下文 - 运行时环境
├── pluginService.ts      # 插件服务 - 统一管理入口
├── pluginInstaller.ts    # 插件安装器 - 安装/卸载/更新
└── pluginPackager.ts     # 插件打包器 - 打包/解包工具
```

## 组件职责

### 1. 钩子系统 (hookSystem.ts)
**核心作用：** 事件驱动的插件扩展机制

- **HookSystem**: 管理所有事件监听器和触发器
- **HookContext**: 事件上下文，携带数据并提供控制方法
- **PluginHookRegistry**: 为每个插件提供独立的钩子注册接口

**关键特性：**
- 优先级控制
- 错误隔离
- 条件执行
- 同步/异步支持

### 2. 插件管理器 (pluginManager.ts)
**核心作用：** 管理插件的完整生命周期

- **PluginManager**: 主管理器类
- **DependencyGraph**: 依赖关系管理
- 生命周期状态控制
- 依赖解析和循环检测

**生命周期：**
```
未加载 → 加载中 → 已加载 → 初始化中 → 已激活
    ↓                              ↑
   错误 ← 卸载中 ← 未激活 ← 停用中 ←
```

### 3. 插件沙箱 (pluginSandbox.ts)
**核心作用：** 提供安全隔离的插件执行环境

- **PluginSandboxImpl**: 沙箱主体
- **ResourceMonitorImpl**: 资源使用监控
- **PluginGlobalImpl**: 受限的全局对象
- 权限检查和API代理

**安全特性：**
- 权限控制
- 资源监控
- 错误隔离
- API访问代理

### 4. 插件API (pluginAPI.ts)
**核心作用：** 为插件提供丰富的功能接口

**四大API模块：**
- **UI API**: 界面扩展（侧边栏、导航、编辑器等）
- **数据API**: 数据访问（文件系统、数据库等）
- **复习API**: 复习系统（算法、卡片、会话等）
- **系统API**: 系统功能（命令、快捷键、主题等）

### 5. 插件上下文 (pluginContext.ts)
**核心作用：** 为每个插件提供独立的运行环境

**提供的服务：**
- **PluginLoggerImpl**: 日志记录（按插件ID隔离）
- **PluginStorageImpl**: 持久化存储
- **PluginConfigImpl**: 配置管理
- **PluginEventEmitterImpl**: 事件系统
- **PluginMessagingImpl**: 插件间通信

### 6. 插件服务 (pluginService.ts)
**核心作用：** 统一的插件系统入口和状态管理

- **PluginService**: 主服务类
- Vue响应式状态管理
- 事件监听和UI同步
- 统计信息收集

### 8. 插件安装器 (pluginInstaller.ts)
**核心作用：** 插件的安装、卸载、更新管理

**主要功能：**

1. **插件搜索和发现**
   ```typescript
   // 搜索插件
   const plugins = await pluginInstaller.searchPlugins('markdown')
   
   // 获取插件详情
   const info = await pluginInstaller.getPluginInfo('plugin-id')
   ```

2. **插件安装**
   ```typescript
   // 从插件市场安装
   await pluginInstaller.installPlugin('plugin-id', { 
     enableAfterInstall: true 
   })
   
   // 从本地文件安装
   await pluginInstaller.installPlugin(file, { force: true })
   
   // 从URL安装
   await pluginInstaller.installPlugin('https://example.com/plugin.zip')
   ```

3. **插件卸载**
   ```typescript
   // 卸载插件（保留数据）
   await pluginInstaller.uninstallPlugin('plugin-id', { keepData: true })
   ```

4. **插件更新**
   ```typescript
   // 更新到最新版本
   await pluginInstaller.updatePlugin('plugin-id')
   
   // 更新到指定版本
   await pluginInstaller.updatePlugin('plugin-id', '2.0.0')
   
   // 检查所有插件更新
   const updates = await pluginInstaller.checkUpdates()
   ```

**安装流程：**
```
下载/获取包 → 验证签名 → 检查权限 → 安装依赖 → 提取文件 → 注册插件 → 激活（可选）
```

**事件钩子：**
- 下载：`PLUGIN_DOWNLOAD_STARTED/COMPLETED/FAILED`
- 安装：`PLUGIN_INSTALL_STARTED/COMPLETED/FAILED`
- 卸载：`PLUGIN_UNINSTALL_STARTED/COMPLETED/FAILED`
- 更新：`PLUGIN_UPDATE_STARTED/COMPLETED/FAILED`

### 9. 插件打包器 (pluginPackager.ts)
**核心作用：** 插件的打包和解包工具

**主要功能：**

1. **创建插件模板**
   ```typescript
   // 创建新插件模板
   const template = await pluginPackager.createTemplate(
     'my-plugin',
     'My Awesome Plugin',
     'Your Name'
   )
   ```

2. **打包插件**
   ```typescript
   // 打包插件目录
   const packageBuffer = await pluginPackager.packagePlugin('/path/to/plugin')
   ```

3. **解包插件**
   ```typescript
   // 解包插件文件
   const packageData = await pluginPackager.unpackagePlugin(buffer)
   ```

**包结构：**
```
plugin.zip
├── plugin.json      # 插件清单
├── index.js         # 主代码文件
├── README.md        # 说明文档
├── package.json     # 依赖配置
└── assets/          # 资源文件
    ├── icons/
    └── styles/
```

## 使用方式

### 基本导入
```typescript
// 导入整个插件系统
import { pluginService, usePluginService } from '@/services/plugins'

// 导入特定组件
import { hookSystem, PluginManager } from '@/services/plugins'

// 导入类型
import type { Plugin, PluginManifest } from '@/services/plugins'
```

### 在Vue组件中使用
```typescript
<script setup lang="ts">
import { usePluginService } from '@/services/plugins'

const {
  plugins,           // 所有插件列表
  activePlugins,     // 活跃插件
  stats,            // 统计信息
  loadPlugin,       // 加载插件
  activatePlugin    // 激活插件
} = usePluginService()
</script>
```

### 监听插件事件
```typescript
import { hookSystem } from '@/services/plugins'

// 监听文件保存事件
hookSystem.on('file.saved', async (context) => {
  console.log('File saved:', context.data.filePath)
})
```

### 注册插件API扩展
```typescript
import { pluginAPI } from '@/services/plugins'

// 注册侧边栏面板
pluginAPI.ui.sidebar.registerPanel({
  id: 'my-panel',
  title: 'My Panel',
  icon: '🔧',
  component: MyPanelComponent
})
```

## 开发指南

1. **插件开发**: 参考 `examples/hello-world-plugin/` 示例
2. **API扩展**: 在相应的API实现类中添加新方法
3. **钩子添加**: 在 `HookType` 枚举中添加新事件类型
4. **权限添加**: 在 `PluginPermission` 枚举中添加新权限

## 安全注意事项

1. 所有插件代码在沙箱中执行
2. API访问需要相应权限
3. 资源使用受到监控和限制
4. 错误被隔离，不影响主应用
