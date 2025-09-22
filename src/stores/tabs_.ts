import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface TabState {
  id: string;
  title: string;
  type: 'document' | 'diary' | 'review' | 'search' | 'settings' | 'editor';
  content?: string;
  isActive: boolean;
  isDirty: boolean;
  lastModified: Date;
  parentTabId?: string;
  metadata?: Record<string, any>;
  filePath?: string; // 添加文件路径支持
}

export const useTabsStore = defineStore('tabs', () => {
  // 状态
  const tabs = ref<TabState[]>([]);
  const activeTabId = ref<string>('');
  const tabHistory = ref<string[]>([]);

  // 计算属性
  const activeTab = computed(() => 
    tabs.value.find(tab => tab.id === activeTabId.value)
  );

  const dirtyTabs = computed(() => 
    tabs.value.filter(tab => tab.isDirty)
  );

  const hasUnsavedChanges = computed(() => 
    dirtyTabs.value.length > 0
  );

  // 动作
  const openTab = (tabData: Partial<TabState>): string => {
    const tabType = tabData.type || 'document';
    
    // 检查是否已经存在相同类型的标签页（除了编辑器类型）
    if (tabType !== 'editor') {
      const existingTab = tabs.value.find(tab => tab.type === tabType);
      if (existingTab) {
        console.log(`Found existing ${tabType} tab, switching to:`, existingTab.id);
        switchTab(existingTab.id);
        return existingTab.id;
      }
    }
    
    console.log(`Creating new ${tabType} tab`);
    
    const newTab: TabState = {
      id: tabData.id || `tab_${Date.now()}`,
      title: tabData.title || '新标签页',
      type: tabType,
      content: tabData.content || '',
      isActive: true,
      isDirty: false,
      lastModified: new Date(),
      parentTabId: tabData.parentTabId,
      metadata: tabData.metadata || {},
      filePath: tabData.filePath,
    };

    // 将其他标签页设为非活动状态
    tabs.value.forEach(tab => tab.isActive = false);
    
    // 添加新标签页
    tabs.value.push(newTab);
    activeTabId.value = newTab.id;
    
    // 添加到历史记录
    tabHistory.value.push(newTab.id);
    
    // 保存到本地存储
    saveTabState(newTab);
    
    return newTab.id;
  };

  const closeTab = (tabId: string) => {
    const tabIndex = tabs.value.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) return;

    const tab = tabs.value[tabIndex];
    
    // 如果有未保存的更改，提示用户
    if (tab.isDirty) {
      // 这里可以添加确认对话框
      console.log('Tab has unsaved changes:', tab.title);
    }

    // 保存标签页状态
    saveTabState(tab);
    
    // 移除标签页
    tabs.value.splice(tabIndex, 1);
    
    // 从历史记录中移除
    const historyIndex = tabHistory.value.indexOf(tabId);
    if (historyIndex > -1) {
      tabHistory.value.splice(historyIndex, 1);
    }
    
    // 如果关闭的是活动标签页，切换到其他标签页
    if (activeTabId.value === tabId) {
      if (tabs.value.length > 0) {
        const newActiveTab = tabs.value[tabs.value.length - 1];
        switchTab(newActiveTab.id);
      } else {
        activeTabId.value = '';
      }
    }
  };

  const switchTab = (tabId: string) => {
    const tab = tabs.value.find(t => t.id === tabId);
    if (!tab) return;

    // 将当前活动标签页设为非活动
    tabs.value.forEach(t => t.isActive = false);
    
    // 激活新标签页
    tab.isActive = true;
    activeTabId.value = tabId;
    
    // 更新历史记录
    const historyIndex = tabHistory.value.indexOf(tabId);
    if (historyIndex > -1) {
      tabHistory.value.splice(historyIndex, 1);
    }
    tabHistory.value.push(tabId);
    
    // 恢复标签页状态
    restoreTabState(tab);
  };

  const updateTabContent = (tabId: string, content: string) => {
    const tab = tabs.value.find(t => t.id === tabId);
    if (!tab) return;

    tab.content = content;
    tab.isDirty = true;
    tab.lastModified = new Date();
    
    // 保存到本地存储
    saveTabState(tab);
  };

  const markTabClean = (tabId: string) => {
    const tab = tabs.value.find(t => t.id === tabId);
    if (!tab) return;

    tab.isDirty = false;
    tab.lastModified = new Date();
    
    // 保存到本地存储
    saveTabState(tab);
  };

  const saveTabState = (tabOrId: TabState | string, data?: { content?: string; isDirty?: boolean }) => {
    try {
      let targetTab: TabState | undefined;
      
      if (typeof tabOrId === 'string') {
        // 如果传入的是字符串，查找对应的标签页
        targetTab = tabs.value.find(t => t.id === tabOrId);
        if (targetTab && data) {
          // 更新标签页数据
          if (data.content !== undefined) targetTab.content = data.content;
          if (data.isDirty !== undefined) targetTab.isDirty = data.isDirty;
          targetTab.lastModified = new Date();
        }
      } else {
        targetTab = tabOrId;
      }
      
      if (!targetTab) return;
      
      const state = {
        id: targetTab.id,
        title: targetTab.title,
        type: targetTab.type,
        content: targetTab.content,
        isDirty: targetTab.isDirty,
        lastModified: targetTab.lastModified?.toISOString() || new Date().toISOString(),
        parentTabId: targetTab.parentTabId,
        metadata: targetTab.metadata,
        filePath: targetTab.filePath,
      };
      localStorage.setItem(`tab_${targetTab.id}`, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save tab state:', error);
    }
  };

  const restoreTabState = (tab: TabState) => {
    try {
      const savedState = localStorage.getItem(`tab_${tab.id}`);
      if (savedState) {
        const state = JSON.parse(savedState);
        tab.content = state.content || tab.content;
        tab.isDirty = state.isDirty || false;
        tab.lastModified = new Date(state.lastModified || Date.now());
        tab.metadata = state.metadata || tab.metadata;
      }
    } catch (error) {
      console.error('Failed to restore tab state:', error);
    }
  };

  const clearAllTabs = () => {
    // 保存所有标签页状态
    tabs.value.forEach(tab => saveTabState(tab));
    
    // 清空标签页
    tabs.value = [];
    activeTabId.value = '';
    tabHistory.value = [];
  };

  // 打开编辑器标签页
  const openEditorTab = (filePath: string, title?: string) => {
    const fileName = title || filePath.split(/[\\\/]/).pop() || '未命名';
    
    // 标准化文件路径
    const normalizedPath = filePath.replace(/\//g, '\\');
    
    // 检查是否已经存在该文件的标签页
    const existingTab = tabs.value.find(tab => 
      tab.filePath === normalizedPath || 
      tab.filePath === filePath ||
      (tab.type === 'editor' && tab.metadata?.filePath === normalizedPath)
    );
    
    if (existingTab) {
      console.log('Found existing tab for file:', filePath, 'switching to:', existingTab.id);
      switchTab(existingTab.id);
      return existingTab.id;
    }
    
    console.log('Creating new tab for file:', filePath);
    
    const tabId = `editor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newTab: TabState = {
      id: tabId,
      title: fileName,
      type: 'editor',
      content: '',
      isActive: false,
      isDirty: false,
      lastModified: new Date(),
      filePath: normalizedPath,
      metadata: {
        filePath: normalizedPath,
        fileType: 'markdown'
      }
    };
    
    return openTab(newTab);
  };

  return {
    // 状态
    tabs,
    activeTabId,
    tabHistory,
    
    // 计算属性
    activeTab,
    dirtyTabs,
    hasUnsavedChanges,
    
    // 动作
    openTab,
    closeTab,
    switchTab,
    updateTabContent,
    markTabClean,
    saveTabState,
    restoreTabState,
    clearAllTabs,
    openEditorTab,
  };
});