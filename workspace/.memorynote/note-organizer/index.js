// 笔记整理器插件
class NoteOrganizerPlugin {
  constructor(context) {
    this.name = '笔记整理器'
    this.version = '1.0.0'
    this.sidebarPanel = null
    this.disposables = []
    this.context = context
    this.api = context.api
  }

  async onLoad() {
    console.log(`${this.name} 插件已加载`)
  }

  async onInitialize() {
    console.log(`${this.name} 插件正在初始化...`)
  }

  async onActivate() {
    console.log(`${this.name} 插件已激活`)

    // 注册侧边栏面板
    this.registerSidebarPanel()
    
    // 注册命令
    this.registerCommands()

    // 注册事件监听器
    this.registerEventListeners()
  }

  /**
   * 注册侧边栏面板
   */
  registerSidebarPanel() {
    try {
      // 创建侧边栏面板
      const panel = {
        id: 'note-organizer-panel',
        title: '笔记整理',
        icon: this.createIcon(),
        component: this.createPanelComponent(),
        position: 3
      }

      // 注册面板
      const disposable = this.api.ui.sidebar.registerPanel(panel)
      this.disposables.push(disposable)
      
      console.log('笔记整理器侧边栏面板已注册')
    } catch (error) {
      console.error('注册侧边栏面板失败:', error)
    }
  }

  /**
   * 创建图标
   */
  createIcon() {
    return `
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="currentColor" d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
      </svg>
    `
  }

  /**
   * 创建面板组件
   */
  createPanelComponent() {
    const component = document.createElement('div')
    component.className = 'note-organizer-panel'
    
    component.innerHTML = `
      <div class="panel-header">
        <h3>笔记整理器</h3>
        <button class="refresh-btn" title="刷新">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
      </div>

      <div class="panel-content">
        <!-- 快速操作 -->
        <div class="quick-actions">
          <h4>快速操作</h4>
          <div class="action-buttons">
            <button class="action-btn organize-btn">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/>
              </svg>
              整理笔记
            </button>
            <button class="action-btn tag-btn">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z"/>
              </svg>
              添加标签
            </button>
          </div>
        </div>

        <!-- 标签管理 -->
        <div class="tag-management">
          <h4>标签管理</h4>
          <div class="tag-list">
            <div class="tag-item">
              <span class="tag-color" style="background: #3b82f6;"></span>
              <span class="tag-name">工作</span>
              <span class="tag-count">12</span>
            </div>
            <div class="tag-item">
              <span class="tag-color" style="background: #10b981;"></span>
              <span class="tag-name">学习</span>
              <span class="tag-count">8</span>
            </div>
            <div class="tag-item">
              <span class="tag-color" style="background: #f59e0b;"></span>
              <span class="tag-name">想法</span>
              <span class="tag-count">5</span>
            </div>
            <div class="tag-item">
              <span class="tag-color" style="background: #ef4444;"></span>
              <span class="tag-name">重要</span>
              <span class="tag-count">3</span>
            </div>
          </div>
          <button class="add-tag-btn">+ 添加新标签</button>
        </div>

        <!-- 笔记分组 -->
        <div class="note-groups">
          <h4>笔记分组</h4>
          <div class="group-list">
            <div class="group-item">
              <div class="group-header">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                </svg>
                <span>项目笔记</span>
                <span class="group-count">15</span>
              </div>
            </div>
            <div class="group-item">
              <div class="group-header">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                </svg>
                <span>会议记录</span>
                <span class="group-count">7</span>
              </div>
            </div>
            <div class="group-item">
              <div class="group-header">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                </svg>
                <span>临时笔记</span>
                <span class="group-count">4</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 最近整理 -->
        <div class="recent-organized">
          <h4>最近整理</h4>
          <div class="recent-list">
            <div class="recent-item">
              <div class="recent-info">
                <span class="recent-name">项目计划.md</span>
                <span class="recent-time">2分钟前</span>
              </div>
              <span class="recent-action">添加标签</span>
            </div>
            <div class="recent-item">
              <div class="recent-info">
                <span class="recent-name">会议纪要.md</span>
                <span class="recent-time">5分钟前</span>
              </div>
              <span class="recent-action">移动到分组</span>
            </div>
            <div class="recent-item">
              <div class="recent-info">
                <span class="recent-name">学习笔记.md</span>
                <span class="recent-time">10分钟前</span>
              </div>
              <span class="recent-action">重命名</span>
            </div>
          </div>
        </div>
      </div>
    `

    // 添加样式
    this.addPanelStyles()

    // 绑定事件
    this.bindPanelEvents(component)

    return component
  }

  /**
   * 添加面板样式
   */
  addPanelStyles() {
    if (document.getElementById('note-organizer-styles')) {
      return
    }

    const style = document.createElement('style')
    style.id = 'note-organizer-styles'
    style.textContent = `
      .note-organizer-panel {
        padding: 16px;
        height: 100%;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e2e8f0;
      }

      .panel-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
      }

      .refresh-btn {
        padding: 4px;
        border: none;
        background: transparent;
        border-radius: 4px;
        cursor: pointer;
        color: #64748b;
        transition: all 0.2s;
      }

      .refresh-btn:hover {
        background: #f1f5f9;
        color: #3b82f6;
      }

      .panel-content > div {
        margin-bottom: 24px;
      }

      .panel-content h4 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }

      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .action-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border: 1px solid #e2e8f0;
        background: #ffffff;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        color: #374151;
        transition: all 0.2s;
      }

      .action-btn:hover {
        background: #f8fafc;
        border-color: #3b82f6;
        color: #3b82f6;
      }

      .tag-list, .group-list, .recent-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .tag-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .tag-item:hover {
        background: #f8fafc;
      }

      .tag-color {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }

      .tag-name {
        flex: 1;
        font-size: 13px;
        color: #374151;
      }

      .tag-count {
        font-size: 11px;
        color: #9ca3af;
        background: #f3f4f6;
        padding: 2px 6px;
        border-radius: 10px;
        min-width: 16px;
        text-align: center;
      }

      .add-tag-btn {
        padding: 6px 8px;
        border: 1px dashed #cbd5e1;
        background: transparent;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        color: #64748b;
        transition: all 0.2s;
      }

      .add-tag-btn:hover {
        border-color: #3b82f6;
        color: #3b82f6;
      }

      .group-item {
        cursor: pointer;
        transition: background 0.2s;
      }

      .group-item:hover {
        background: #f8fafc;
      }

      .group-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        border-radius: 4px;
      }

      .group-header span:first-of-type {
        flex: 1;
        font-size: 13px;
        color: #374151;
      }

      .group-count {
        font-size: 11px;
        color: #9ca3af;
        background: #f3f4f6;
        padding: 2px 6px;
        border-radius: 10px;
        min-width: 16px;
        text-align: center;
      }

      .recent-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 8px;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .recent-item:hover {
        background: #f8fafc;
      }

      .recent-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .recent-name {
        font-size: 13px;
        color: #374151;
      }

      .recent-time {
        font-size: 11px;
        color: #9ca3af;
      }

      .recent-action {
        font-size: 11px;
        color: #3b82f6;
        background: #eff6ff;
        padding: 2px 6px;
        border-radius: 4px;
      }
    `

    document.head.appendChild(style)
  }

  /**
   * 绑定面板事件
   */
  bindPanelEvents(component) {
    // 刷新按钮
    const refreshBtn = component.querySelector('.refresh-btn')
    refreshBtn?.addEventListener('click', () => {
      this.refreshPanel()
    })

    // 整理按钮
    const organizeBtn = component.querySelector('.organize-btn')
    organizeBtn?.addEventListener('click', () => {
      this.organizeNotes()
    })

    // 添加标签按钮
    const tagBtn = component.querySelector('.tag-btn')
    tagBtn?.addEventListener('click', () => {
      this.addTag()
    })

    // 添加新标签按钮
    const addTagBtn = component.querySelector('.add-tag-btn')
    addTagBtn?.addEventListener('click', () => {
      this.showAddTagDialog()
    })

    // 标签点击事件
    const tagItems = component.querySelectorAll('.tag-item')
    tagItems.forEach(item => {
      item.addEventListener('click', () => {
        const tagName = item.querySelector('.tag-name').textContent
        this.filterByTag(tagName)
      })
    })

    // 分组点击事件
    const groupItems = component.querySelectorAll('.group-item')
    groupItems.forEach(item => {
      item.addEventListener('click', () => {
        const groupName = item.querySelector('.group-header span:first-of-type').textContent
        this.openGroup(groupName)
      })
    })
  }

  /**
   * 注册命令
   */
  registerCommands() {
    try {
      // 整理笔记命令
      const organizeDisposable = this.api.system.commands.register({
        id: 'note-organizer.organize',
        title: '整理笔记',
        handler: () => this.organizeNotes()
      })
      this.disposables.push(organizeDisposable)

      // 添加标签命令
      const addTagDisposable = this.api.system.commands.register({
        id: 'note-organizer.addTag',
        title: '添加标签',
        handler: () => this.addTag()
      })
      this.disposables.push(addTagDisposable)

      console.log('笔记整理器命令已注册')
    } catch (error) {
      console.error('注册命令失败:', error)
    }
  }

  /**
   * 注册事件监听器
   */
  registerEventListeners() {
    try {
      // 监听文件保存事件
      this.context.hooks.on('file.saved', async (context) => {
        console.log('文件已保存:', context.data?.filePath || 'unknown file')
        // 可以在这里自动分析文件内容并建议标签
      })

      console.log('事件监听器已注册')
    } catch (error) {
      console.error('注册事件监听器失败:', error)
    }
  }

  /**
   * 刷新面板
   */
  refreshPanel() {
    console.log('刷新笔记整理器面板')
    // TODO: 刷新面板数据
  }

  /**
   * 整理笔记
   */
  organizeNotes() {
    console.log('开始整理笔记...')
    // TODO: 实现笔记整理逻辑
    this.showNotification('笔记整理功能正在开发中...', 'info')
  }

  /**
   * 添加标签
   */
  addTag() {
    console.log('添加标签到当前笔记')
    // TODO: 实现添加标签逻辑
    this.showNotification('添加标签功能正在开发中...', 'info')
  }

  /**
   * 显示添加标签对话框
   */
  showAddTagDialog() {
    console.log('显示添加标签对话框')
    // TODO: 实现添加标签对话框
    const tagName = prompt('请输入标签名称:')
    if (tagName) {
      this.createNewTag(tagName)
    }
  }

  /**
   * 创建新标签
   */
  createNewTag(tagName) {
    console.log('创建新标签:', tagName)
    // TODO: 实现创建标签逻辑
    this.showNotification(`标签 "${tagName}" 创建成功！`, 'success')
  }

  /**
   * 按标签过滤
   */
  filterByTag(tagName) {
    console.log('按标签过滤:', tagName)
    // TODO: 实现标签过滤逻辑
    this.showNotification(`正在显示标签 "${tagName}" 的笔记`, 'info')
  }

  /**
   * 打开分组
   */
  openGroup(groupName) {
    console.log('打开分组:', groupName)
    // TODO: 实现打开分组逻辑
    this.showNotification(`正在打开分组 "${groupName}"`, 'info')
  }

  /**
   * 显示通知
   */
  showNotification(message, type = 'info') {
    try {
      // 使用插件API显示通知
      this.api.ui.showNotification({
        message,
        type,
        duration: 3000
      })
    } catch (error) {
      // 如果API不可用，使用console输出
      console.log(`[${type.toUpperCase()}] ${message}`)
    }
  }

  async onDeactivate() {
    console.log(`${this.name} 插件已停用`)
    
    // 清理所有注册的资源
    this.disposables.forEach(disposable => {
      try {
        disposable.dispose()
      } catch (error) {
        console.error('清理资源失败:', error)
      }
    })
    this.disposables = []

    // 移除样式
    const styleElement = document.getElementById('note-organizer-styles')
    if (styleElement) {
      styleElement.remove()
    }
  }

  async onUnload() {
    console.log(`${this.name} 插件已卸载`)
  }

  async onError(error) {
    console.error(`${this.name} 插件发生错误:`, error)
  }
}

// 导出插件类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NoteOrganizerPlugin
} else if (typeof exports !== 'undefined') {
  exports.default = NoteOrganizerPlugin
} else {
  // 全局导出
  this.Plugin = NoteOrganizerPlugin
}

