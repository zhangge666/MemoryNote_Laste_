import { ref, reactive } from 'vue';
import { AppSettings, defaultSettings } from '../types/settings';

// 设置状态
const settings = ref<AppSettings>(defaultSettings);
const isLoaded = ref(false);

// 设置服务
export const settingsService = {
  // 加载设置
  async loadSettings(): Promise<AppSettings> {
    try {
      const savedSettings = await window.electronAPI.loadSettings();
      if (savedSettings) {
        // 合并默认设置和保存的设置，确保所有字段都存在
        settings.value = { ...defaultSettings, ...savedSettings };
      } else {
        settings.value = defaultSettings;
      }
      isLoaded.value = true;
      return settings.value;
    } catch (error) {
      console.error('Failed to load settings:', error);
      settings.value = defaultSettings;
      isLoaded.value = true;
      return settings.value;
    }
  },

  // 保存设置
  async saveSettings(newSettings: Partial<AppSettings>): Promise<boolean> {
    try {
      // 合并当前设置和新设置
      const mergedSettings = { ...settings.value, ...newSettings };
      settings.value = mergedSettings;
      
      // 创建可序列化的设置对象（移除函数和不可序列化的内容）
      const serializableSettings = JSON.parse(JSON.stringify(mergedSettings));
      
      // 保存到本地存储
      const success = await window.electronAPI.saveSettings(serializableSettings);
      if (success) {
        // 应用设置
        await this.applySettings(mergedSettings);
        console.log('Settings saved and applied successfully');
      } else {
        console.error('Failed to save settings to storage');
      }
      return success;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  },

  // 自动保存设置（立即保存）
  autoSaveSettings: (() => {
    return async (newSettings: Partial<AppSettings>) => {
      try {
        // 创建可序列化的设置对象
        const serializableSettings = JSON.parse(JSON.stringify(newSettings));
        await settingsService.saveSettings(serializableSettings);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    };
  })(),

  // 应用设置
  async applySettings(newSettings: AppSettings): Promise<void> {
    try {
      // 应用主题设置
      if (newSettings.editor.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (newSettings.editor.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else if (newSettings.editor.theme === 'auto') {
        // 根据系统主题自动切换
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

      // 应用编辑器设置
      const editorSettings = newSettings.editor;
      const editorStyle = document.documentElement.style;
      editorStyle.setProperty('--editor-font-size', `${editorSettings.fontSize}px`);
      editorStyle.setProperty('--editor-font-family', editorSettings.fontFamily);
      editorStyle.setProperty('--editor-line-height', editorSettings.lineHeight.toString());

      // 应用主题颜色
      const themeSettings = newSettings.theme;
      editorStyle.setProperty('--primary-color', themeSettings.primaryColor);
      editorStyle.setProperty('--accent-color', themeSettings.accentColor);

      // 应用侧边栏宽度
      const appStore = await import('../stores/app');
      appStore.useAppStore().updateLeftPanelWidth(themeSettings.sidebarWidth);
      appStore.useAppStore().updateRightPanelWidth(themeSettings.rightSidebarWidth);

      // 应用动画速度
      const animationSpeed = themeSettings.animationSpeed;
      const speedMap = { slow: '0.5s', normal: '0.3s', fast: '0.1s' };
      editorStyle.setProperty('--animation-duration', speedMap[animationSpeed]);

      console.log('Settings applied successfully');
    } catch (error) {
      console.error('Failed to apply settings:', error);
    }
  },

  // 获取当前设置
  getSettings(): AppSettings {
    return settings.value;
  },

  // 重置设置
  async resetSettings(): Promise<boolean> {
    try {
      settings.value = defaultSettings;
      const success = await window.electronAPI.saveSettings(defaultSettings);
      if (success) {
        await this.applySettings(defaultSettings);
      }
      return success;
    } catch (error) {
      console.error('Failed to reset settings:', error);
      return false;
    }
  },

  // 检查设置是否已加载
  isSettingsLoaded(): boolean {
    return isLoaded.value;
  }
};

// 导出设置状态，供组件使用
export { settings };