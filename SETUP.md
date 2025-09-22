# MemoryNote 设置指南

## 项目概述

MemoryNote 是一个基于 Electron + Vue 3 + TypeScript 的个人学习知识库系统，具有以下特性：

- 🎯 **智能知识管理**: 基于艾宾浩斯遗忘曲线的复习提醒
- 🔍 **语义搜索**: 结合 NLP 和 LLM 的智能检索
- 📝 **多格式支持**: Markdown、Word 等格式
- 🏷️ **标签页系统**: 支持嵌套分区和状态缓存
- 🎨 **现代 UI**: 自定义标题栏，三栏布局设计

## 技术栈

- **桌面框架**: Electron Forge
- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **状态管理**: Pinia
- **样式框架**: Tailwind CSS
- **数据库**: SQLite (better-sqlite3)
- **编辑器**: CodeMirror 6

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm start
```

### 3. 构建应用

```bash
npm run build
```

## 项目结构

```
MemoryNote/
├── src/
│   ├── components/layout/     # 布局组件
│   │   ├── AppHeader.vue      # 顶部栏
│   │   ├── AppSidebar.vue     # 侧边导航栏
│   │   ├── AppLeftPanel.vue   # 左侧面板
│   │   ├── AppMain.vue        # 主工作区域
│   │   ├── AppRightPanel.vue  # 右侧面板
│   │   └── AppFooter.vue      # 底部栏
│   ├── stores/                # Pinia 状态管理
│   │   ├── app.ts            # 应用状态
│   │   └── tabs.ts           # 标签页状态
│   ├── types/                # TypeScript 类型定义
│   │   └── electron.d.ts     # Electron API 类型
│   ├── main.ts               # Electron 主进程
│   ├── preload.ts            # 预加载脚本
│   └── renderer.ts           # 渲染进程入口
├── docs/                     # 开发文档
├── forge.config.ts          # Electron Forge 配置
└── package.json
```

## 核心功能

### 1. 自定义标题栏
- 隐藏系统标题栏
- 自定义最小化、最大化、关闭按钮
- 支持窗口拖拽

### 2. 三栏布局
- **左侧栏**: 文档列表、日记列表、复习列表、搜索结果
- **主工作区**: 标签页系统，支持多标签编辑
- **右侧栏**: 文档信息、标签管理

### 3. 标签页系统
- 支持多种类型：文档、日记、复习、搜索、设置
- 状态缓存和恢复
- 嵌套分区支持
- 未保存状态提示

### 4. 数据库集成
- SQLite 数据库存储
- 笔记、分类、复习记录、AI 配置表
- IPC 通信进行数据操作

## 开发说明

### 添加新功能

1. **创建新的标签页类型**:
   - 在 `stores/tabs.ts` 中定义新的 `TabState` 类型
   - 在 `AppMain.vue` 中添加对应的渲染逻辑

2. **添加新的 IPC 通信**:
   - 在 `src/main.ts` 中添加 IPC 处理器
   - 在 `src/preload.ts` 中暴露 API
   - 在 `src/types/electron.d.ts` 中添加类型定义

3. **添加新的状态管理**:
   - 在 `stores/` 目录下创建新的 store 文件
   - 使用 Pinia 的 `defineStore` 定义状态和动作

### 样式定制

项目使用 Tailwind CSS，可以通过以下方式定制：

1. 修改 `tailwind.config.js` 中的主题配置
2. 在组件中使用 Tailwind 类名
3. 添加自定义 CSS 到 `src/index.css`

## 故障排除

### 常见问题

1. **依赖安装失败**:
   ```bash
   npm install --legacy-peer-deps
   ```

2. **TypeScript 编译错误**:
   - 检查 `tsconfig.json` 配置
   - 确保所有类型定义文件正确导入

3. **Electron 启动失败**:
   - 检查 `forge.config.ts` 配置
   - 确保主进程和预加载脚本路径正确

### 调试技巧

1. **开发工具**: 应用启动后会自动打开开发者工具
2. **日志输出**: 在主进程中使用 `console.log` 查看日志
3. **状态调试**: 使用 Vue DevTools 查看组件状态

## 下一步开发

1. **Markdown 编辑器**: 集成 CodeMirror 6 实现实时预览
2. **AI 集成**: 实现语义搜索和问答功能
3. **复习系统**: 基于艾宾浩斯遗忘曲线的复习提醒
4. **插件系统**: 支持第三方插件扩展

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

## 许可证

MIT License