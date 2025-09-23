// 设置项的类型定义
export interface AppSettings {
  // 基础设置
  general: {
    language: string;
    autoSave: boolean;
    autoSaveInterval: number; // 秒
    startupBehavior: 'restore' | 'new' | 'last';
    workspacePath: string;
  };
  
  // 编辑器设置
  editor: {
    theme: 'light' | 'dark' | 'auto';
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    tabSize: number;
    wordWrap: boolean;
    showLineNumbers: boolean;
    showMinimap: boolean;
    autoCloseBrackets: boolean;
    autoIndent: boolean;
  };
  
  // AI设置
  ai: {
    enabled: boolean;
    provider: 'openai' | 'claude' | 'gemini';
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
  };
  
  // 复习设置
  review: {
    enabled: boolean;
    algorithm: 'ebbinghaus' | 'sm2' | 'custom';
    newCardInterval: number; // 天
    reviewInterval: number; // 天
    maxReviewsPerDay: number;
    reminderTime: string; // HH:MM
  };
  
  // 主题设置
  theme: {
    primaryColor: string;
    accentColor: string;
    sidebarWidth: number;
    rightSidebarWidth: number;
    animationSpeed: 'slow' | 'normal' | 'fast';
  };
  
  // 插件设置
  plugins: {
    enabled: string[]; // 已启用的插件ID列表
    settings: Record<string, any>; // 各插件的具体设置
  };
}

// 默认设置
export const defaultSettings: AppSettings = {
  general: {
    language: 'zh-CN',
    autoSave: true,
    autoSaveInterval: 30,
    startupBehavior: 'restore',
    workspacePath: ''
  },
  editor: {
    theme: 'auto',
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Consolas, monospace',
    lineHeight: 1.5,
    tabSize: 2,
    wordWrap: true,
    showLineNumbers: true,
    showMinimap: true,
    autoCloseBrackets: true,
    autoIndent: true
  },
  ai: {
    enabled: false,
    provider: 'openai',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7
  },
  review: {
    enabled: false,
    algorithm: 'ebbinghaus',
    newCardInterval: 1,
    reviewInterval: 1,
    maxReviewsPerDay: 20,
    reminderTime: '09:00'
  },
  theme: {
    primaryColor: '#3b82f6',
    accentColor: '#10b981',
    sidebarWidth: 240,
    rightSidebarWidth: 240,
    animationSpeed: 'normal'
  },
  plugins: {
    enabled: [],
    settings: {}
  }
};
