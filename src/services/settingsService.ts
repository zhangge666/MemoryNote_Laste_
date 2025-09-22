import { ref, reactive } from 'vue';

export interface AppSettings {
  workspacePath: string;
  theme: 'light' | 'dark' | 'auto';
  editor: {
    fontSize: number;
    fontFamily: string;
    tabSize: number;
    wordWrap: boolean;
    lineNumbers: boolean;
  };
  ai: {
    provider: string;
    apiKey: string;
    apiSecret: string;
    model: string;
    baseUrl: string;
  };
  review: {
    intervals: number[];
    reminderTime: string;
    autoReview: boolean;
  };
  lastUpdated: string;
}

const defaultSettings: AppSettings = {
  workspacePath: '',
  theme: 'auto',
  editor: {
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    tabSize: 2,
    wordWrap: true,
    lineNumbers: true
  },
  ai: {
    provider: 'alibaba',
    apiKey: '',
    apiSecret: '',
    model: 'qwen-turbo',
    baseUrl: ''
  },
  review: {
    intervals: [1, 3, 7, 15, 30],
    reminderTime: '09:00',
    autoReview: true
  },
  lastUpdated: new Date().toISOString()
};

// 全局设置状态
export const settings = reactive<AppSettings>({ ...defaultSettings });

// 设置服务类
export class SettingsService {
  private static instance: SettingsService;
  
  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  // 加载所有设置
  async loadSettings(): Promise<void> {
    try {
      const allSettings = await window.electronAPI.getAllSettings();
      Object.assign(settings, { ...defaultSettings, ...allSettings });
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  // 保存所有设置
  async saveSettings(): Promise<boolean> {
    try {
      settings.lastUpdated = new Date().toISOString();
      const success = await window.electronAPI.updateSetting('all', settings);
      return success;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  // 更新单个设置
  async updateSetting<K extends keyof AppSettings>(
    key: K, 
    value: AppSettings[K]
  ): Promise<boolean> {
    try {
      settings[key] = value;
      settings.lastUpdated = new Date().toISOString();
      const success = await window.electronAPI.updateSetting(key, value);
      return success;
    } catch (error) {
      console.error('Error updating setting:', error);
      return false;
    }
  }

  // 获取单个设置
  async getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
    try {
      const value = await window.electronAPI.getSetting(key);
      return value !== undefined ? value : defaultSettings[key];
    } catch (error) {
      console.error('Error getting setting:', error);
      return defaultSettings[key];
    }
  }

  // 重置设置
  async resetSettings(): Promise<boolean> {
    try {
      Object.assign(settings, defaultSettings);
      return await this.saveSettings();
    } catch (error) {
      console.error('Error resetting settings:', error);
      return false;
    }
  }

  // 导出设置
  exportSettings(): string {
    return JSON.stringify(settings, null, 2);
  }

  // 导入设置
  async importSettings(settingsJson: string): Promise<boolean> {
    try {
      const importedSettings = JSON.parse(settingsJson);
      Object.assign(settings, importedSettings);
      return await this.saveSettings();
    } catch (error) {
      console.error('Error importing settings:', error);
      return false;
    }
  }

  // 获取设置状态
  getState() {
    return settings;
  }
}

// 导出单例实例
export const settingsService = SettingsService.getInstance();
