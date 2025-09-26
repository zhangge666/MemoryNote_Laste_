# API测试插件

这是一个综合性的测试插件，用于测试MemoryNote插件系统的所有API功能。

## 功能特性

### 🎨 UI API测试
- **左侧栏/右侧栏** - 测试面板内容设置和管理
- **对话框** - 测试信息、警告、错误对话框和输入框
- **状态栏** - 测试状态栏项的添加、更新和移除
- **窗口管理** - 测试窗口创建和管理
- **导航按钮** - 测试左侧导航栏按钮注册
- **编辑器扩展** - 测试装饰器和自动完成提供者
- **右键菜单** - 测试上下文菜单项和菜单组

### 💾 数据API测试
- **文件系统** - 测试文件读写、存在检查、统计信息等
- **数据库操作** - 测试笔记、复习、分类和设置的CRUD操作
- **差异算法** - 测试自定义差异算法注册和使用

### ⚙️ 系统API测试
- **配置管理** - 测试应用配置的获取、设置和监听
- **工作区操作** - 测试工作区路径获取和文件操作
- **命令系统** - 测试命令注册和执行
- **快捷键** - 测试快捷键绑定
- **主题系统** - 测试自定义主题注册

### 🔄 复习API测试
- **复习卡片** - 测试卡片的创建、更新、查询
- **复习会话** - 测试复习会话的启动和管理
- **复习算法** - 测试自定义复习算法注册

## 使用方法

### 安装插件
1. 将插件文件夹复制到 `plugins/` 目录
2. 重启MemoryNote应用
3. 插件会自动加载并激活

### 运行测试
1. **通过导航按钮**: 点击左侧导航栏的 "🧪 API测试" 按钮
2. **通过快捷键**: 按 `Ctrl+Shift+T` 打开测试面板
3. **通过命令**: 执行相关测试命令

### 测试面板
测试面板包含以下部分：
- **分类测试按钮** - 按功能分组的测试按钮
- **综合测试** - 运行所有测试的按钮
- **测试结果** - 实时显示测试结果和日志

## 测试项目

### UI API测试项目
- ✅ 左侧栏内容设置和自动关闭
- ✅ 对话框显示（信息、警告、错误、输入）
- ✅ 状态栏项添加和更新
- ✅ 窗口创建和管理

### 数据API测试项目
- ✅ 文件读写操作
- ✅ 文件存在检查和统计
- ✅ 数据库CRUD操作
- ✅ 差异算法计算和应用

### 系统API测试项目
- ✅ 配置管理和变化监听
- ✅ 工作区路径获取
- ✅ 命令注册和执行
- ✅ 快捷键绑定

### 复习API测试项目
- ✅ 复习卡片管理
- ✅ 复习会话控制
- ✅ 复习算法注册

## 测试结果

测试结果会以不同颜色显示：
- 🟢 **绿色** - 测试成功
- 🔴 **红色** - 测试失败
- 🔵 **蓝色** - 测试信息

每个测试结果都包含时间戳和详细信息。

## 开发说明

### 插件结构
```
api-test-plugin/
├── plugin.json     # 插件配置文件
├── index.js        # 主插件代码
└── README.md       # 文档文件
```

### 关键特性
- **全面覆盖** - 测试所有可用的插件API
- **实时反馈** - 即时显示测试结果
- **错误处理** - 优雅处理API调用失败
- **资源清理** - 自动清理测试资源
- **降级机制** - 在API不可用时提供降级行为

### 扩展测试
要添加新的测试项目：

1. 在 `createTestPanelComponent()` 中添加测试按钮
2. 在 `runTest()` 中添加测试案例
3. 实现具体的测试方法
4. 更新测试结果显示

## API使用示例

### UI API示例
```javascript
// 设置右侧栏内容
this.api.ui.rightPanel.setContent({
  id: 'test-panel',
  title: '测试面板',
  component: domElement,
  onClose: () => console.log('面板关闭')
})

// 显示对话框
await this.api.ui.dialog.showInformation('消息', '详细信息')

// 添加状态栏项
this.api.ui.statusBar.addItem({
  id: 'test-status',
  text: '测试状态',
  position: 'right'
})
```

### 数据API示例
```javascript
// 文件操作
await this.api.data.fs.writeFile('test.txt', 'content')
const content = await this.api.data.fs.readFile('test.txt')

// 数据库操作
const note = await this.api.data.database.notes.create({
  title: '测试笔记',
  content: '内容'
})
```

### 系统API示例
```javascript
// 配置管理
await this.api.system.configuration.set('key', 'value')
const value = this.api.system.configuration.get('key')

// 命令注册
this.api.system.commands.register({
  id: 'test.command',
  title: '测试命令',
  handler: () => console.log('命令执行')
})
```

## 故障排除

### 常见问题
1. **插件未加载** - 检查plugin.json格式和文件路径
2. **API调用失败** - 查看控制台错误信息
3. **测试结果异常** - 检查API实现和权限设置

### 调试模式
插件会在控制台输出详细的调试信息，包括：
- 插件生命周期事件
- API调用结果
- 错误信息和堆栈跟踪

## 版本信息

- **版本**: 1.0.0
- **兼容性**: MemoryNote 1.0.0+
- **更新日期**: 2024年9月

## 许可证

MIT License - 可自由使用和修改。
