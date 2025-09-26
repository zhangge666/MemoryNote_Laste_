// Hello World 示例插件
class HelloWorldPlugin {
  constructor(context) {
    this.context = context;
    this.logger = context.logger;
    this.api = context.api;
    this.config = context.config;
    this.storage = context.storage;
  }

  async onLoad() {
    this.logger.info('Hello World Plugin is loading...');
  }

  async onActivate() {
    this.logger.info('Hello World Plugin is activating...');
    
    // 注册命令
    this.registerCommands();
    
    // 注册侧边栏面板
    this.registerSidebarPanel();
    
    // 注册主题
    this.registerTheme();
    
    // 监听配置变化
    this.setupConfigListener();
    
    // 监听钩子
    this.setupHooks();
    
    this.logger.info('Hello World Plugin activated successfully!');
  }

  registerCommands() {
    // 注册问候命令
    this.context.disposables.add(
      this.api.system.commands.register({
        id: 'hello-world.greet',
        title: '打招呼',
        description: '显示一个友好的问候消息',
        handler: async () => {
          const message = this.config.get('greetingMessage', 'Hello, World!');
          const showTimestamp = this.config.get('showTimestamp', true);
          
          let fullMessage = message;
          if (showTimestamp) {
            fullMessage += ` (${new Date().toLocaleString()})`;
          }
          
          await this.api.ui.dialog.showInformation(fullMessage, '确定');
          this.logger.info('Greeting command executed');
        }
      })
    );

    // 注册显示时间命令
    this.context.disposables.add(
      this.api.system.commands.register({
        id: 'hello-world.show-time',
        title: '显示时间',
        description: '显示当前时间',
        handler: async () => {
          const now = new Date();
          const timeString = now.toLocaleString();
          
          await this.api.ui.dialog.showInformation(
            `当前时间: ${timeString}`,
            '确定'
          );
          
          // 保存到存储
          await this.storage.set('lastTimeShown', now.toISOString());
          this.logger.info('Show time command executed');
        }
      })
    );
  }

  registerSidebarPanel() {
    // 创建侧边栏组件
    const HelloWorldSidebar = {
      name: 'HelloWorldSidebar',
      template: `
        <div class="hello-world-sidebar">
          <div class="header">
            <h3>Hello World Plugin</h3>
            <span class="version">v1.0.0</span>
          </div>
          
          <div class="content">
            <div class="section">
              <h4>快速操作</h4>
              <button @click="greet" class="btn primary">
                👋 打招呼
              </button>
              <button @click="showTime" class="btn secondary">
                🕐 显示时间
              </button>
            </div>
            
            <div class="section">
              <h4>统计信息</h4>
              <div class="stats">
                <div class="stat-item">
                  <span class="label">问候次数:</span>
                  <span class="value">{{ greetCount }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">最后访问:</span>
                  <span class="value">{{ lastAccess }}</span>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h4>设置</h4>
              <div class="setting-item">
                <label>
                  <input 
                    type="checkbox" 
                    v-model="showTimestamp"
                    @change="updateConfig"
                  />
                  显示时间戳
                </label>
              </div>
              <div class="setting-item">
                <label>问候消息:</label>
                <input 
                  type="text" 
                  v-model="greetingMessage"
                  @blur="updateConfig"
                  class="form-input"
                />
              </div>
            </div>
          </div>
          
          <div class="footer">
            <small>Hello World Plugin &copy; 2024</small>
          </div>
        </div>
      `,
      data() {
        return {
          greetCount: 0,
          lastAccess: '从未',
          showTimestamp: true,
          greetingMessage: 'Hello, World!'
        };
      },
      async mounted() {
        // 加载数据
        this.greetCount = await pluginStorage.get('greetCount', 0);
        this.showTimestamp = await pluginConfig.get('showTimestamp', true);
        this.greetingMessage = await pluginConfig.get('greetingMessage', 'Hello, World!');
        
        const lastAccess = await pluginStorage.get('lastAccess');
        if (lastAccess) {
          this.lastAccess = new Date(lastAccess).toLocaleString();
        }
        
        // 更新最后访问时间
        await pluginStorage.set('lastAccess', new Date().toISOString());
      },
      methods: {
        async greet() {
          await pluginAPI.system.commands.execute('hello-world.greet');
          this.greetCount += 1;
          await pluginStorage.set('greetCount', this.greetCount);
        },
        async showTime() {
          await pluginAPI.system.commands.execute('hello-world.show-time');
        },
        async updateConfig() {
          await pluginConfig.set('showTimestamp', this.showTimestamp);
          await pluginConfig.set('greetingMessage', this.greetingMessage);
        }
      }
    };

    // 注册侧边栏面板
    this.context.disposables.add(
      this.api.ui.sidebar.registerPanel({
        id: 'hello-world.sidebar',
        title: 'Hello World',
        icon: '👋',
        component: HelloWorldSidebar,
        position: 100
      })
    );
  }

  registerTheme() {
    const oceanTheme = {
      id: 'hello-world.ocean-theme',
      name: 'Ocean Theme',
      type: 'light',
      colors: {
        '--color-primary': '#007acc',
        '--color-primary-light': '#4da6d9',
        '--color-primary-dark': '#005a9e',
        '--bg-primary': '#f0f8ff',
        '--bg-secondary': '#e6f3ff',
        '--bg-tertiary': '#cce7ff',
        '--text-primary': '#1a1a1a',
        '--text-secondary': '#4a4a4a',
        '--text-tertiary': '#6a6a6a',
        '--border-color': '#b3d9ff'
      },
      styles: {
        '.hello-world-sidebar': {
          'background': 'linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)',
          'border-radius': '8px',
          'padding': '16px'
        }
      }
    };

    this.context.disposables.add(
      this.api.system.themes.register(oceanTheme)
    );
  }

  setupConfigListener() {
    // 监听配置变化
    this.context.disposables.add(
      this.config.onDidChange((change) => {
        this.logger.info(`Configuration changed: ${change.key} = ${change.newValue}`);
        
        if (change.key === 'greetingMessage') {
          this.logger.info(`Greeting message updated to: ${change.newValue}`);
        }
      })
    );
  }

  setupHooks() {
    // 监听文件保存事件
    this.context.disposables.add(
      this.context.hooks.on('file.saved', async (context) => {
        const { filePath } = context.data;
        
        if (filePath.endsWith('.md')) {
          this.logger.info(`Markdown file saved: ${filePath}`);
          
          // 可以在这里添加自动备份或处理逻辑
          const backupCount = await this.storage.get('markdownBackups', 0);
          await this.storage.set('markdownBackups', backupCount + 1);
        }
      })
    );

    // 监听应用启动事件
    this.context.disposables.add(
      this.context.hooks.on('app.ready', async () => {
        this.logger.info('Application is ready, Hello World plugin is standing by!');
        
        // 显示欢迎消息（仅在首次激活时）
        const hasShownWelcome = await this.storage.get('hasShownWelcome', false);
        if (!hasShownWelcome) {
          setTimeout(async () => {
            await this.api.ui.dialog.showInformation(
              '欢迎使用 Hello World 插件！\n\n这是一个示例插件，展示了插件系统的基本功能。',
              '确定'
            );
            await this.storage.set('hasShownWelcome', true);
          }, 2000);
        }
      })
    );
  }

  async onDeactivate() {
    this.logger.info('Hello World Plugin is deactivating...');
    
    // 保存状态
    await this.storage.set('deactivatedAt', new Date().toISOString());
    
    this.logger.info('Hello World Plugin deactivated');
  }

  async onUnload() {
    this.logger.info('Hello World Plugin is unloading...');
  }

  onError(error) {
    this.logger.error('Plugin error:', error);
    
    // 可以在这里添加错误恢复逻辑
    this.api.ui.dialog.showError(
      `Hello World Plugin 遇到错误: ${error.message}`,
      '确定'
    );
  }

  async onUpdate(oldVersion, newVersion) {
    this.logger.info(`Plugin updated from ${oldVersion} to ${newVersion}`);
    
    // 可以在这里添加数据迁移逻辑
    if (oldVersion === '0.9.0' && newVersion === '1.0.0') {
      // 执行数据迁移
      this.logger.info('Performing data migration...');
    }
  }

  registerExtensions() {
    this.logger.info('Registering additional extensions...');
    
    // 这里可以注册额外的扩展点
    // 比如自定义的编辑器操作、右键菜单等
  }
}

// 导出插件类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HelloWorldPlugin;
} else {
  // 浏览器环境
  window.HelloWorldPlugin = HelloWorldPlugin;
}

