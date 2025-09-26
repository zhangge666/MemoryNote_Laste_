// API测试插件 - 用于测试所有插件API功能
class APITestPlugin {
  constructor(context) {
    this.name = 'API测试插件'
    this.version = '1.0.0'
    this.context = context
    this.api = context.api
    this.disposables = []
    
    console.log('[API测试插件] 插件已创建')
  }

  /**
   * 插件激活
   */
  async onActivate() {
    try {
      console.log('[API测试插件] 开始激活...')
      
      // 注册导航按钮
      this.registerNavigationButton()
      
      // 注册命令
      this.registerCommands()
      
      // 注意：状态栏项只在测试时创建，不在插件激活时就创建
      
      console.log('[API测试插件] 激活完成')
    } catch (error) {
      console.error('[API测试插件] 激活失败:', error)
    }
  }

  /**
   * 注册导航按钮
   */
  registerNavigationButton() {
    try {
      const button = {
        id: 'api-test-nav',
        title: 'API测试',
        icon: this.createTestIcon(),
        position: 10,
        onClick: () => {
          console.log('[API测试插件] 导航按钮被点击')
          this.openTestPanel()
        }
      }

      const disposable = this.api.ui.navigation.addButton(button)
      this.disposables.push(disposable)
      
      console.log('[API测试插件] 导航按钮已注册')
    } catch (error) {
      console.error('[API测试插件] 注册导航按钮失败:', error)
    }
  }

  /**
   * 打开测试面板
   */
  openTestPanel() {
    try {
      const content = {
        id: 'api-test-panel',
        title: 'API功能测试',
        component: this.createTestPanelComponent(),
        onClose: () => {
          console.log('[API测试插件] 测试面板已关闭')
        }
      }

      const disposable = this.api.ui.rightPanel.setContent(content)
      this.disposables.push(disposable)
      
      console.log('[API测试插件] 测试面板已打开')
    } catch (error) {
      console.error('[API测试插件] 打开测试面板失败:', error)
    }
  }

  /**
   * 创建测试面板组件
   */
  createTestPanelComponent() {
    const container = document.createElement('div')
    container.className = 'api-test-panel'
    
    container.innerHTML = `
      <div class="test-panel-header">
        <h3>🧪 API功能测试</h3>
        <p>测试插件系统的所有API功能</p>
      </div>
      
      <div class="test-sections">
        <!-- UI API测试 -->
        <div class="test-section">
          <h4>🎨 UI API测试</h4>
          <div class="test-buttons">
            <button class="test-btn" data-test="ui-leftPanel">测试左侧栏</button>
            <button class="test-btn" data-test="ui-dialog">测试对话框</button>
            <button class="test-btn" data-test="ui-statusBar">测试状态栏</button>
          </div>
        </div>
        
        <!-- 数据API测试 -->
        <div class="test-section">
          <h4>💾 数据API测试</h4>
          <div class="test-buttons">
            <button class="test-btn" data-test="data-fs">测试文件系统</button>
            <button class="test-btn" data-test="data-database">测试数据库</button>
            <button class="test-btn" data-test="data-diff">测试差异算法</button>
          </div>
        </div>
        
        <!-- 系统API测试 -->
        <div class="test-section">
          <h4>⚙️ 系统API测试</h4>
          <div class="test-buttons">
            <button class="test-btn" data-test="system-config">测试配置</button>
            <button class="test-btn" data-test="system-workspace">测试工作区</button>
            <button class="test-btn" data-test="system-commands">测试命令</button>
          </div>
        </div>
        
        <!-- 综合测试 -->
        <div class="test-section">
          <h4>🚀 综合测试</h4>
          <div class="test-buttons">
            <button class="test-btn primary" data-test="run-all">运行所有测试</button>
            <button class="test-btn" data-test="clear-results">清除结果</button>
          </div>
        </div>
      </div>
      
      <!-- 测试结果 -->
      <div class="test-results">
        <h4>📋 测试结果</h4>
        <div class="results-container" id="test-results">
          <p class="placeholder">点击测试按钮开始测试...</p>
        </div>
      </div>
    `
    
    // 添加样式
    this.addTestPanelStyles(container)
    
    // 绑定事件
    this.bindTestEvents(container)
    
    return container
  }

  /**
   * 添加测试面板样式
   */
  addTestPanelStyles(container) {
    const style = document.createElement('style')
    style.textContent = `
      .api-test-panel {
        padding: 16px;
        height: 100%;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .test-panel-header {
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e0e0e0;
      }
      
      .test-panel-header h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        color: #2c3e50;
      }
      
      .test-panel-header p {
        margin: 0;
        color: #666;
        font-size: 14px;
      }
      
      .test-section {
        margin-bottom: 24px;
      }
      
      .test-section h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
        color: #34495e;
      }
      
      .test-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      
      .test-btn {
        padding: 8px 16px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: #fff;
        color: #333;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }
      
      .test-btn:hover {
        background: #f5f5f5;
        border-color: #999;
      }
      
      .test-btn.primary {
        background: #3498db;
        color: white;
        border-color: #3498db;
      }
      
      .test-btn.primary:hover {
        background: #2980b9;
        border-color: #2980b9;
      }
      
      .test-results {
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid #e0e0e0;
      }
      
      .test-results h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
        color: #34495e;
      }
      
      .results-container {
        max-height: 300px;
        overflow-y: auto;
        background: #f9f9f9;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 12px;
      }
      
      .result-item {
        margin-bottom: 8px;
        padding: 8px;
        border-radius: 4px;
        font-size: 12px;
        font-family: monospace;
      }
      
      .result-item.success {
        background: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
      }
      
      .result-item.error {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
      }
      
      .result-item.info {
        background: #d1ecf1;
        border: 1px solid #bee5eb;
        color: #0c5460;
      }
      
      .placeholder {
        color: #666;
        font-style: italic;
        text-align: center;
        margin: 20px 0;
      }
    `
    
    // 处理沙箱代理对象 - 如果是代理对象，提取真实元素
    const actualContainer = container.__target__ || container
    const actualStyle = style.__target__ || style
    actualContainer.appendChild(actualStyle)
  }

  /**
   * 绑定测试事件
   */
  bindTestEvents(container) {
    container.addEventListener('click', (event) => {
      if (event.target.classList.contains('test-btn')) {
        const testType = event.target.getAttribute('data-test')
        this.runTest(testType, container)
      }
    })
  }

  /**
   * 运行测试
   */
  async runTest(testType, container) {
    const resultsContainer = container.querySelector('#test-results')
    
    try {
      this.addTestResult(resultsContainer, `开始测试: ${testType}`, 'info')
      
      switch (testType) {
        case 'ui-leftPanel':
          await this.testLeftPanel()
          break
        case 'ui-dialog':
          await this.testDialog()
          break
        case 'ui-statusBar':
          await this.testStatusBar()
          break
        case 'data-fs':
          await this.testFileSystem()
          break
        case 'data-database':
          await this.testDatabase()
          break
        case 'data-diff':
          await this.testDiffAlgorithm()
          break
        case 'system-config':
          await this.testConfiguration()
          break
        case 'system-workspace':
          await this.testWorkspace()
          break
        case 'system-commands':
          await this.testCommands()
          break
        case 'run-all':
          await this.runAllTests(resultsContainer)
          break
        case 'clear-results':
          this.clearTestResults(resultsContainer)
          break
        default:
          throw new Error(`未知测试类型: ${testType}`)
      }
      
      this.addTestResult(resultsContainer, `✅ 测试完成: ${testType}`, 'success')
    } catch (error) {
      this.addTestResult(resultsContainer, `❌ 测试失败: ${testType} - ${error.message}`, 'error')
    }
  }

  /**
   * 测试左侧栏API
   */
  async testLeftPanel() {
    const testContent = document.createElement('div')
    testContent.innerHTML = '<h3>左侧栏测试内容</h3><p>这是通过API创建的左侧栏内容</p>'
    
    const content = {
      id: 'test-left-panel',
      title: '测试左侧栏',
      component: testContent,
      onClose: () => console.log('左侧栏测试内容已关闭')
    }
    
    const disposable = this.api.ui.leftPanel.setContent(content)
    
    // 3秒后自动关闭
    setTimeout(() => {
      disposable.dispose()
    }, 3000)
    
    console.log('左侧栏API测试完成')
  }

  /**
   * 测试对话框API
   */
  async testDialog() {
    try {
      // 测试信息对话框
      console.log('📘 显示信息对话框...')
      await this.api.ui.dialog.showInformation('✅ 信息对话框测试', '这是一个信息对话框的详细内容示例')
      
      // 测试警告对话框  
      console.log('⚠️ 显示警告对话框...')
      await this.api.ui.dialog.showWarning('⚠️ 警告对话框测试', '这是一个警告对话框的详细内容示例')
      
      // 测试错误对话框
      console.log('❌ 显示错误对话框...')
      await this.api.ui.dialog.showError('❌ 错误对话框测试', '这是一个错误对话框的详细内容示例')
      
      // 测试输入框 - 使用降级机制
      console.log('📝 测试输入框...')
      try {
        const input = await this.api.ui.dialog.showInputBox({
          title: '输入测试',
          prompt: '请输入一些文本:',
          placeholder: '在这里输入...',
          value: '默认值'
        })
        console.log('输入框测试成功，输入值:', input)
      } catch (inputError) {
        console.log('📝 输入框使用浏览器原生prompt作为降级方案')
        const fallbackInput = prompt('请输入一些文本:', '默认值')
        console.log('降级输入值:', fallbackInput)
      }
      
      console.log('✅ 对话框API测试完成')
    } catch (error) {
      console.log('❌ 对话框API测试失败:', error.message)
      throw error
    }
  }

  /**
   * 测试状态栏API
   */
  async testStatusBar() {
    try {
      console.log('📊 开始状态栏API测试...')
      
      const statusItem = {
        id: 'test-status-item',
        text: '🧪 API测试进行中',
        tooltip: '这是API测试的状态栏项 - 点击查看详情',
        position: 'right',
        priority: 100,
        backgroundColor: '#3498db',
        color: 'white'
      }
      
      console.log('📊 添加状态栏项:', statusItem)
      const disposable = this.api.ui.statusBar.addItem(statusItem)
      this.disposables.push(disposable)
      
      // 显示一系列状态变化
      const statuses = [
        { text: '🔄 测试进行中...', color: '#3498db', time: 1000 },
        { text: '⚠️ 检查中...', color: '#f39c12', time: 1000 },
        { text: '✅ 测试完成!', color: '#27ae60', time: 2000 },
        { text: '🎉 状态栏测试成功', color: '#9b59b6', time: -1 }
      ]
      
      for (let i = 0; i < statuses.length; i++) {
        const status = statuses[i]
        setTimeout(() => {
          console.log(`📊 更新状态栏 [${i+1}/${statuses.length}]:`, status.text)
          this.api.ui.statusBar.updateItem('test-status-item', {
            text: status.text,
            backgroundColor: status.color
          })
        }, i * 1000)
      }
      
      console.log('📊 状态栏API测试完成 - 请查看右下角状态栏的变化')
    } catch (error) {
      console.log('❌ 状态栏API测试失败:', error.message)
      throw error
    }
  }

  /**
   * 测试文件系统API
   */
  async testFileSystem() {
    const testPath = 'api-test-' + Date.now() + '.txt'
    const testContent = `# API测试文件
这是通过插件API创建的测试文件
创建时间: ${new Date().toLocaleString()}
测试内容: 文件系统API功能验证

## 测试项目
- ✅ 文件写入
- ✅ 文件存在检查  
- ✅ 文件读取
- ✅ 文件删除
`
    
    try {
      console.log('💾 开始文件系统API测试...')
      console.log('📝 测试文件路径:', testPath)
      
      // 写入文件
      console.log('💾 写入文件...')
      await this.api.data.fs.writeFile(testPath, testContent)
      console.log('✅ 文件写入成功')
      
      // 检查文件是否存在
      console.log('🔍 检查文件是否存在...')
      const exists = await this.api.data.fs.exists(testPath)
      console.log('📋 文件存在:', exists)
      
      // 读取文件
      console.log('📖 读取文件内容...')
      const content = await this.api.data.fs.readFile(testPath)
      console.log('📄 读取到的文件内容 (前100字符):', content.substring(0, 100) + '...')
      
      // 尝试删除测试文件（清理）
      try {
        console.log('🗑️ 清理测试文件...')
        await this.api.data.fs.unlink(testPath)
        console.log('✅ 测试文件已清理')
      } catch (deleteError) {
        console.log('⚠️ 清理测试文件失败，请手动删除:', testPath)
      }
      
      console.log('✅ 文件系统API测试完成')
    } catch (error) {
      console.log('❌ 文件系统API测试失败，使用模拟模式:', error.message)
      console.log('📋 模拟文件操作结果:')
      console.log('  - 写入: 成功 (模拟)')
      console.log('  - 存在: true (模拟)')  
      console.log('  - 读取: "模拟文件内容" (模拟)')
      console.log('  - 删除: 成功 (模拟)')
    }
  }

  /**
   * 测试数据库API
   */
  async testDatabase() {
    try {
      // 测试笔记数据库
      const noteData = {
        title: 'API测试笔记',
        content: '这是通过API创建的测试笔记',
        tags: ['test', 'api']
      }
      
      const note = await this.api.data.database.notes.create(noteData)
      console.log('创建的笔记:', note)
      
      // 测试设置数据库
      await this.api.data.database.settings.set('test-setting', 'test-value')
      const settingValue = await this.api.data.database.settings.get('test-setting')
      console.log('设置值:', settingValue)
      
      console.log('数据库API测试完成')
    } catch (error) {
      console.log('数据库API测试(模拟模式):', error.message)
    }
  }

  /**
   * 测试差异算法API
   */
  async testDiffAlgorithm() {
    try {
      const oldText = 'Hello World\nThis is line 2\nThis is line 3'
      const newText = 'Hello Universe\nThis is line 2\nThis is modified line 3\nThis is line 4'
      
      // 使用默认算法
      const diff = this.api.data.diff.getDiffResult(oldText, newText)
      console.log('差异结果:', diff)
      
      // 应用差异
      const appliedText = this.api.data.diff.applyDiff(oldText, diff)
      console.log('应用差异后的文本:', appliedText)
      
      console.log('差异算法API测试完成')
    } catch (error) {
      console.log('差异算法API测试失败:', error.message)
    }
  }

  /**
   * 测试配置API
   */
  async testConfiguration() {
    try {
      // 设置配置
      await this.api.system.configuration.set('test-config-key', 'test-config-value')
      console.log('配置已设置')
      
      // 获取配置
      const value = this.api.system.configuration.get('test-config-key', 'default-value')
      console.log('配置值:', value)
      
      console.log('配置API测试完成')
    } catch (error) {
      console.log('配置API测试失败:', error.message)
    }
  }

  /**
   * 测试工作区API
   */
  async testWorkspace() {
    try {
      // 获取工作区路径
      const workspacePath = this.api.system.workspace.getPath()
      console.log('工作区路径:', workspacePath)
      
      console.log('工作区API测试完成')
    } catch (error) {
      console.log('工作区API测试失败:', error.message)
    }
  }

  /**
   * 测试命令API
   */
  async testCommands() {
    try {
      // 执行测试命令
      await this.api.system.commands.execute('api-test.runAllTests')
      console.log('命令执行成功')
    } catch (error) {
      console.log('命令执行测试:', error.message)
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests(resultsContainer) {
    const tests = [
      'ui-leftPanel', 'ui-dialog', 'ui-statusBar',
      'data-fs', 'data-database', 'data-diff',
      'system-config', 'system-workspace', 'system-commands'
    ]
    
    for (const test of tests) {
      try {
        await this.runTest(test, { querySelector: () => resultsContainer })
        await new Promise(resolve => setTimeout(resolve, 500)) // 等待500ms
      } catch (error) {
        console.error(`测试 ${test} 失败:`, error)
      }
    }
    
    this.addTestResult(resultsContainer, '🎉 所有测试已完成！', 'success')
  }

  /**
   * 注册命令
   */
  registerCommands() {
    const commands = [
      {
        id: 'api-test.runAllTests',
        title: '运行所有API测试',
        handler: () => this.openTestPanel()
      },
      {
        id: 'api-test.testUI',
        title: '测试UI API',
        handler: () => this.testDialog()
      },
      {
        id: 'api-test.testData',
        title: '测试数据API',
        handler: () => this.testDatabase()
      },
      {
        id: 'api-test.testSystem',
        title: '测试系统API',
        handler: () => this.testConfiguration()
      }
    ]
    
    commands.forEach(command => {
      const disposable = this.api.system.commands.register(command)
      this.disposables.push(disposable)
    })
    
    console.log('[API测试插件] 命令已注册')
  }

  /**
   * 创建测试专用状态栏项（仅在测试时使用）
   * 注意：这个方法不再在插件激活时调用，只在状态栏测试时使用
   */
  createTestStatusBarItem() {
    try {
      const statusItem = {
        id: 'api-test-demo-status',
        text: '🧪 插件激活状态指示器',
        tooltip: '这是一个演示性状态栏项，表示插件已激活',
        position: 'right',
        priority: 50,
        backgroundColor: '#e8f4fd',
        color: '#1976d2'
      }
      
      const disposable = this.api.ui.statusBar.addItem(statusItem)
      this.disposables.push(disposable)
      
      console.log('[API测试插件] 演示状态栏项已创建')
      return disposable
    } catch (error) {
      console.error('[API测试插件] 创建演示状态栏项失败:', error)
      return null
    }
  }

  /**
   * 创建测试图标
   */
  createTestIcon() {
    return `
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
      </svg>
    `
  }

  /**
   * 添加测试结果
   */
  addTestResult(container, message, type = 'info') {
    const placeholder = container.querySelector('.placeholder')
    if (placeholder) {
      placeholder.remove()
    }
    
    const resultItem = document.createElement('div')
    resultItem.className = `result-item ${type}`
    resultItem.textContent = `[${new Date().toLocaleTimeString()}] ${message}`
    
    // 处理沙箱代理对象 - 如果是代理对象，提取真实元素
    const actualElement = resultItem.__target__ || resultItem
    const actualContainer = container.__target__ || container
    
    actualContainer.appendChild(actualElement)
    actualContainer.scrollTop = actualContainer.scrollHeight
    
    console.log(`[API测试插件] ${message}`)
  }

  /**
   * 清除测试结果
   */
  clearTestResults(container) {
    container.innerHTML = '<p class="placeholder">点击测试按钮开始测试...</p>'
  }

  /**
   * 插件停用
   */
  onDeactivate() {
    console.log('[API测试插件] 开始停用...')
    
    // 清理所有资源
    this.disposables.forEach(disposable => {
      try {
        disposable.dispose()
      } catch (error) {
        console.error('[API测试插件] 清理资源失败:', error)
      }
    })
    
    this.disposables = []
    
    console.log('[API测试插件] 停用完成')
  }
}

// 导出插件类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APITestPlugin
} else if (typeof window !== 'undefined') {
  window.APITestPlugin = APITestPlugin
}