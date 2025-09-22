# MemoryNote 详细开发指导文档

## 项目概述

MemoryNote是一个基于Electron + Vue3 + TypeScript + Tailwind CSS的桌面端个人学习知识库系统。本文档提供详细的开发指导，包括各阶段的开发重点、接口预留、技术实现细节等。

---

## 开发阶段规划

### 第一阶段：基础框架搭建（4周）

#### 1.1 项目初始化（第1周）
**目标**：建立项目基础架构

**任务清单**：
- [ ] 创建项目目录结构
- [ ] 配置Vite + Vue3 + TypeScript
- [ ] 集成Tailwind CSS
- [ ] 配置Electron基础环境
- [ ] 设置开发工具链（ESLint、Prettier等）

**关键配置**：
```bash
# 项目结构
MemoryNote/
├── src/                    # 前端源码
├── electron/              # Electron主进程
├── docs/                  # 文档
├── build/                 # 构建资源
└── dist/                  # 构建输出
```

**接口预留**：
- 数据库连接接口（为第二阶段预留）
- 文件系统操作接口（为第二阶段预留）
- 主题切换接口（为第四阶段预留）

#### 1.2 基础UI框架（第2周）
**目标**：实现基础布局和组件

**任务清单**：
- [ ] 实现AppHeader组件（顶部栏）
- [ ] 实现AppSidebar组件（侧边导航栏）
- [ ] 实现AppFooter组件（底部栏）
- [ ] 实现基础布局容器
- [ ] 配置Tailwind CSS主题系统
- [ ] 实现标签页系统基础框架

**技术要点**：
- 使用Tailwind CSS实现响应式布局
- 实现无边框窗口的自定义标题栏
- 预留侧边栏收缩/展开功能接口
- 设计标签页系统架构

**接口预留**：
- 窗口控制接口（最小化、最大化、关闭）
- 侧边栏状态管理接口
- 主题切换接口
- 标签页管理接口（为第二阶段预留）

#### 1.3 状态管理（第3周）
**目标**：建立Pinia状态管理

**任务清单**：
- [ ] 创建app store（应用状态）
- [ ] 创建基础的数据模型类型
- [ ] 实现状态持久化
- [ ] 配置状态管理中间件

**关键接口**：
```typescript
// stores/app.ts 预留接口
interface AppState {
  // 当前页面状态
  currentPage: 'documents' | 'diary' | 'review' | 'search' | 'settings'
  
  // 侧边栏状态
  leftSidebarVisible: boolean
  rightSidebarVisible: boolean
  
  // 主题状态
  theme: 'light' | 'dark' | 'auto'
  
  // 为后续阶段预留的接口
  workspacePath: string
  isConnected: boolean
}
```

#### 1.4 Electron集成（第4周）
**目标**：完成Electron基础集成

**任务清单**：
- [ ] 配置Electron主进程
- [ ] 实现IPC通信基础
- [ ] 配置预加载脚本
- [ ] 实现窗口管理功能

**关键接口预留**：
```typescript
// electron/preload.ts 预留接口
contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  
  // 为后续阶段预留的接口
  // 数据库操作接口
  // 文件系统操作接口
  // AI服务接口
  // 复习功能接口
})
```

---

### 第二阶段：核心功能开发（6周）

#### 2.1 数据库集成（第5周）
**目标**：实现SQLite数据库操作

**任务清单**：
- [ ] 集成better-sqlite3
- [ ] 创建数据库表结构
- [ ] 实现基础CRUD操作
- [ ] 配置数据库迁移

**数据库表设计**：
```sql
-- 核心表结构
CREATE TABLE notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    file_path TEXT,
    format TEXT DEFAULT 'markdown',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    tags TEXT, -- JSON数组
    category_id INTEGER,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- 为复习功能预留的表
CREATE TABLE review_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id INTEGER NOT NULL,
    review_date DATETIME NOT NULL,
    next_review_date DATETIME NOT NULL,
    review_count INTEGER DEFAULT 0,
    difficulty_level INTEGER DEFAULT 3,
    review_result TEXT,
    FOREIGN KEY (note_id) REFERENCES notes(id)
);
```

**接口预留**：
- 复习记录操作接口（为第三阶段预留）
- AI配置存储接口（为第三阶段预留）

#### 2.2 笔记管理功能（第6-7周）
**目标**：实现笔记的增删改查

**任务清单**：
- [ ] 实现NoteList组件
- [ ] 实现NoteItem组件
- [ ] 实现笔记创建/编辑功能
- [ ] 实现笔记搜索功能
- [ ] 实现分类管理

**关键组件**：
```vue
<!-- NoteList.vue 预留接口 -->
<template>
  <div class="note-list">
    <!-- 笔记列表 -->
    <div v-for="note in notes" :key="note.id">
      <NoteItem 
        :note="note" 
        @edit="handleEdit"
        @delete="handleDelete"
        @review="handleReview" <!-- 为复习功能预留 -->
      />
    </div>
  </div>
</template>
```

**接口预留**：
- 复习功能接口（handleReview）
- AI分析接口（为第三阶段预留）

#### 2.3 Markdown编辑器（第8周）
**目标**：实现实时渲染的Markdown编辑器

**任务清单**：
- [ ] 选择适合的编辑器方案（CodeMirror 6 或自定义方案）
- [ ] 实现Markdown预览
- [ ] 实现实时渲染
- [ ] 添加编辑器工具栏

**技术要点**：
- **推荐方案1**：CodeMirror 6 + 自定义渲染（性能好，可定制性强）
- **推荐方案2**：自定义编辑器 + marked.js（简单易用）
- **推荐方案3**：Toast UI Editor（功能完整，开箱即用）
- 实现编辑器和预览的同步
- 预留AI辅助编辑接口

**编辑器选择对比**：
| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| CodeMirror 6 | 性能好、可定制性强 | 学习成本高 | 需要高度定制 |
| 自定义方案 | 完全控制、轻量 | 开发工作量大 | 简单需求 |
| Toast UI Editor | 功能完整、易用 | 定制性有限 | 快速开发 |

**接口预留**：
```typescript
// 编辑器组件预留接口
interface EditorProps {
  content: string
  onContentChange: (content: string) => void
  onAIAssist?: (prompt: string) => Promise<string> // 为AI功能预留
}
```

#### 2.4 标签页系统（第9周）
**目标**：实现完整的标签页管理系统

**任务清单**：
- [ ] 实现TabBar组件（标签页栏）
- [ ] 实现TabItem组件（单个标签页）
- [ ] 实现TabContent组件（标签页内容）
- [ ] 实现TabManager（标签页管理器）
- [ ] 实现标签页状态缓存
- [ ] 实现嵌套分区功能

**技术要点**：
```typescript
// 标签页状态管理
interface TabState {
  id: string
  title: string
  type: 'note' | 'diary' | 'settings' | 'search' | 'review'
  content: any
  isActive: boolean
  isDirty: boolean
  lastModified: Date
  parentTabId?: string // 嵌套分区支持
}

// 标签页管理器接口
interface TabManager {
  openTab(tab: TabState): void
  closeTab(tabId: string): void
  switchTab(tabId: string): void
  saveTabState(tabId: string): void
  restoreTabState(tabId: string): void
  createNestedTab(parentId: string, tab: TabState): void
}
```

**关键功能**：
- **状态缓存**：切换标签页时自动保存状态，切换回来时恢复
- **嵌套分区**：支持标签页的层级结构
- **脏数据检测**：检测内容是否已修改，提示保存
- **快捷键支持**：Ctrl+Tab切换、Ctrl+W关闭等

#### 2.5 文件系统集成（第10周）
**目标**：实现文件导入导出

**任务清单**：
- [ ] 实现文件导入功能
- [ ] 实现文件导出功能
- [ ] 实现工作区管理
- [ ] 实现文件同步

**接口预留**：
- 云同步接口（为第四阶段预留）
- 备份恢复接口（为第四阶段预留）

---

### 第三阶段：AI功能集成（4周）

#### 3.1 AI服务基础（第11周）
**目标**：建立AI服务框架

**任务清单**：
- [ ] 设计AI服务接口
- [ ] 实现多厂商API适配
- [ ] 配置API密钥管理
- [ ] 实现错误处理和重试机制

**AI服务接口设计**：
```typescript
// services/aiService.ts
export interface AIService {
  // 语义搜索
  semanticSearch(query: string, notes: Note[]): Promise<Note[]>
  
  // 智能问答
  askQuestion(question: string, context: Note[]): Promise<string>
  
  // 知识对比
  checkKnowledgeAccuracy(content: string, existingNotes: Note[]): Promise<AnalysisResult>
  
  // 文本生成
  generateContent(prompt: string): Promise<string>
}
```

**接口预留**：
- 插件系统接口（为第四阶段预留）
- 缓存机制接口（为性能优化预留）

#### 3.2 语义搜索（第12周）
**目标**：实现基于AI的语义搜索

**任务清单**：
- [ ] 实现文本向量化
- [ ] 实现相似度计算
- [ ] 集成到搜索功能
- [ ] 优化搜索性能

**技术要点**：
- 使用embedding技术进行文本向量化
- 实现余弦相似度计算
- 预留缓存机制提升性能

#### 3.3 智能问答（第13周）
**目标**：实现AI问答功能

**任务清单**：
- [ ] 实现AIChat组件
- [ ] 集成问答API
- [ ] 实现上下文管理
- [ ] 添加对话历史

**组件设计**：
```vue
<!-- AIChat.vue -->
<template>
  <div class="ai-chat">
    <div class="chat-messages">
      <div v-for="message in messages" :key="message.id">
        <ChatMessage :message="message" />
      </div>
    </div>
    <div class="chat-input">
      <input 
        v-model="inputMessage"
        @keyup.enter="sendMessage"
        placeholder="输入问题..."
      />
      <button @click="sendMessage">发送</button>
    </div>
  </div>
</template>
```

#### 3.4 知识对比（第14周）
**目标**：实现AI辅助的知识对比

**任务清单**：
- [ ] 实现AIAnalysis组件
- [ ] 集成知识对比API
- [ ] 实现错误检测
- [ ] 实现改进建议

**接口预留**：
- 插件扩展接口（为第四阶段预留）

---

### 第四阶段：高级功能（4周）

#### 4.1 艾宾浩斯遗忘曲线（第15周）
**目标**：实现智能复习算法

**任务清单**：
- [ ] 实现ReviewService
- [ ] 实现复习间隔计算
- [ ] 实现复习提醒
- [ ] 集成到笔记系统

**算法实现**：
```typescript
// services/reviewService.ts
export class ReviewService {
  // 遗忘曲线间隔（天）
  private intervals = [1, 2, 4, 7, 15, 30, 60, 120, 240]
  
  calculateNextReview(
    currentInterval: number,
    difficulty: number,
    reviewResult: 'good' | 'easy' | 'hard'
  ): Date {
    // 根据艾宾浩斯遗忘曲线计算下次复习时间
  }
}
```

#### 4.2 插件系统（第16周）
**目标**：实现插件化扩展

**任务清单**：
- [ ] 设计插件接口
- [ ] 实现PluginManager
- [ ] 实现插件加载机制
- [ ] 实现钩子系统

**插件接口设计**：
```typescript
// plugins/pluginInterface.ts
export interface Plugin {
  name: string
  version: string
  description: string
  author: string
  
  onLoad(): Promise<void>
  onUnload(): Promise<void>
  
  hooks?: {
    [key: string]: (...args: any[]) => Promise<any>
  }
}
```

#### 4.3 主题和个性化（第17周）
**目标**：实现主题系统和个性化设置

**任务清单**：
- [ ] 实现主题切换
- [ ] 实现自定义主题
- [ ] 实现个性化设置
- [ ] 实现设置持久化

**主题系统**：
```typescript
// stores/theme.ts
export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<'light' | 'dark' | 'auto'>('auto')
  
  const applyTheme = (theme: string) => {
    // 应用主题
  }
  
  return {
    currentTheme,
    applyTheme
  }
})
```

#### 4.4 性能优化（第18周）
**目标**：优化应用性能

**任务清单**：
- [ ] 实现虚拟滚动
- [ ] 优化大文件处理
- [ ] 实现缓存机制
- [ ] 优化内存使用

---

### 第五阶段：测试和发布（2周）

#### 5.1 测试（第19周）
**目标**：完成应用测试

**任务清单**：
- [ ] 单元测试
- [ ] 集成测试
- [ ] 用户界面测试
- [ ] 性能测试

#### 5.2 发布准备（第20周）
**目标**：准备应用发布

**任务清单**：
- [ ] 应用打包
- [ ] 安装程序制作
- [ ] 文档完善
- [ ] 发布准备

---

## 技术实现细节

### 1. Tailwind CSS配置

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
```

### 2. 数据库设计原则

- **数据完整性**：使用外键约束保证数据一致性
- **性能优化**：为常用查询字段添加索引
- **扩展性**：预留字段支持未来功能扩展
- **备份恢复**：实现数据备份和恢复机制

### 3. AI服务集成策略

- **多厂商支持**：支持阿里云、百度、OpenAI等
- **降级策略**：AI服务不可用时的降级方案
- **缓存机制**：缓存AI响应提升性能
- **成本控制**：实现API调用限制和监控

### 4. 插件系统设计

- **安全隔离**：插件运行在沙箱环境中
- **生命周期管理**：插件的加载、卸载、更新
- **钩子系统**：插件与主系统的交互机制
- **配置管理**：插件的配置存储和管理

### 5. 标签页系统设计

#### 5.1 标签页状态管理
```typescript
// stores/tabs.ts
export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<TabState[]>([])
  const activeTabId = ref<string | null>(null)
  const tabHistory = ref<string[]>([]) // 标签页切换历史
  
  // 标签页操作
  const openTab = (tab: TabState) => {
    // 检查是否已存在相同标签页
    const existingTab = tabs.value.find(t => t.id === tab.id)
    if (existingTab) {
      switchTab(tab.id)
      return
    }
    
    // 添加新标签页
    tabs.value.push(tab)
    switchTab(tab.id)
  }
  
  const closeTab = (tabId: string) => {
    const index = tabs.value.findIndex(t => t.id === tabId)
    if (index === -1) return
    
    // 检查是否有未保存的更改
    const tab = tabs.value[index]
    if (tab.isDirty) {
      // 提示用户保存
      const shouldSave = confirm('标签页有未保存的更改，是否保存？')
      if (shouldSave) {
        saveTabState(tabId)
      }
    }
    
    // 移除标签页
    tabs.value.splice(index, 1)
    
    // 如果关闭的是当前活动标签页，切换到其他标签页
    if (activeTabId.value === tabId) {
      const newActiveTab = tabs.value[index] || tabs.value[index - 1]
      if (newActiveTab) {
        switchTab(newActiveTab.id)
      }
    }
  }
  
  const switchTab = (tabId: string) => {
    // 保存当前标签页状态
    if (activeTabId.value) {
      saveTabState(activeTabId.value)
    }
    
    // 切换到新标签页
    activeTabId.value = tabId
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      tab.isActive = true
      // 恢复标签页状态
      restoreTabState(tabId)
    }
    
    // 更新切换历史
    updateTabHistory(tabId)
  }
  
  const saveTabState = (tabId: string) => {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      // 保存到IndexedDB
      localStorage.setItem(`tab_${tabId}`, JSON.stringify(tab.content))
      tab.isDirty = false
      tab.lastModified = new Date()
    }
  }
  
  const restoreTabState = (tabId: string) => {
    const tab = tabs.value.find(t => t.id === tabId)
    if (tab) {
      // 从IndexedDB恢复状态
      const savedState = localStorage.getItem(`tab_${tabId}`)
      if (savedState) {
        tab.content = JSON.parse(savedState)
      }
    }
  }
  
  return {
    tabs,
    activeTabId,
    tabHistory,
    openTab,
    closeTab,
    switchTab,
    saveTabState,
    restoreTabState
  }
})
```

#### 5.2 嵌套分区实现
```typescript
// 支持标签页的层级结构
interface NestedTab extends TabState {
  parentTabId?: string
  children: string[] // 子标签页ID列表
  level: number // 嵌套层级
}

// 嵌套分区管理
const createNestedTab = (parentId: string, tab: TabState) => {
  const parentTab = tabs.value.find(t => t.id === parentId)
  if (parentTab) {
    const nestedTab: NestedTab = {
      ...tab,
      parentTabId: parentId,
      children: [],
      level: (parentTab as NestedTab).level + 1
    }
    
    tabs.value.push(nestedTab)
    ;(parentTab as NestedTab).children.push(tab.id)
  }
}
```

#### 5.3 状态缓存策略
- **内存缓存**：当前活动标签页的状态保存在内存中
- **本地存储**：非活动标签页状态保存到IndexedDB
- **自动保存**：定时自动保存所有标签页状态
- **恢复机制**：应用重启后自动恢复标签页状态

#### 5.4 性能优化
- **懒加载**：标签页内容按需加载
- **虚拟化**：大量标签页时使用虚拟滚动
- **内存管理**：及时清理不用的标签页状态
- **防抖处理**：避免频繁的状态保存操作

---

## 开发注意事项

### 1. 接口预留原则

- **向前兼容**：新版本不能破坏旧版本的数据
- **扩展性**：预留接口支持未来功能扩展
- **性能考虑**：预留性能优化接口
- **安全性**：预留安全相关接口

### 2. 代码组织原则

- **模块化**：按功能模块组织代码
- **可测试性**：代码结构便于单元测试
- **可维护性**：代码清晰易懂，注释完整
- **可扩展性**：支持功能扩展和定制

### 3. 性能优化策略

- **懒加载**：按需加载组件和资源
- **虚拟滚动**：处理大量数据时的性能优化
- **缓存机制**：合理使用缓存提升性能
- **内存管理**：及时释放不需要的资源

### 4. 用户体验考虑

- **响应式设计**：适配不同屏幕尺寸
- **无障碍访问**：支持键盘导航和屏幕阅读器
- **错误处理**：友好的错误提示和恢复机制
- **加载状态**：提供清晰的加载状态反馈

### 5. 标签页系统注意事项

#### 5.1 状态管理
- **状态隔离**：每个标签页的状态相互独立
- **状态持久化**：确保标签页状态在应用重启后能够恢复
- **内存管理**：及时清理不用的标签页状态，避免内存泄漏
- **状态同步**：确保标签页状态与数据模型保持同步

#### 5.2 性能优化
- **懒加载**：标签页内容按需加载，避免一次性加载所有内容
- **虚拟化**：当标签页数量过多时，使用虚拟滚动优化性能
- **防抖处理**：避免频繁的状态保存操作
- **缓存策略**：合理使用缓存，平衡性能和内存使用

#### 5.3 用户体验
- **快捷键支持**：提供常用的标签页操作快捷键
- **拖拽排序**：支持标签页的拖拽排序
- **右键菜单**：提供标签页的右键菜单操作
- **状态提示**：清晰显示标签页的修改状态

#### 5.4 数据安全
- **自动保存**：定时自动保存标签页状态
- **冲突处理**：处理多标签页同时编辑同一内容的冲突
- **数据恢复**：提供数据恢复机制
- **备份策略**：定期备份标签页状态数据

---

## 总结

本开发指导文档提供了MemoryNote项目的详细开发计划，包括各阶段的任务、技术要点、接口预留等。开发过程中应严格按照阶段规划进行，确保每个阶段的功能完整性和接口预留的合理性。

通过分阶段的开发方式，可以确保项目的稳定性和可维护性，同时为未来的功能扩展留下充足的空间。
