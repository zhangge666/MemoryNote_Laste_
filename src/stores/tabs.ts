import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface TabState {
  id: string;
  title: string;
  type: 'document' | 'diary' | 'review' | 'search' | 'settings';
  content?: string;
  isActive: boolean;
  isDirty: boolean;
  lastModified: Date;
  parentTabId?: string;
  metadata?: Record<string, any>;
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
  const openTab = (tabData: Partial<TabState>) => {
    const newTab: TabState = {
      id: tabData.id || `tab_${Date.now()}`,
      title: tabData.title || '新标签页',
      type: tabData.type || 'document',
      content: tabData.content || '',
      isActive: true,
      isDirty: false,
      lastModified: new Date(),
      parentTabId: tabData.parentTabId,
      metadata: tabData.metadata || {},
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

  const saveTabState = (tab: TabState) => {
    try {
      const state = {
        id: tab.id,
        title: tab.title,
        type: tab.type,
        content: tab.content,
        isDirty: tab.isDirty,
        lastModified: tab.lastModified.toISOString(),
        parentTabId: tab.parentTabId,
        metadata: tab.metadata,
      };
      localStorage.setItem(`tab_${tab.id}`, JSON.stringify(state));
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
    tabs.value.forEach(saveTabState);
    
    // 清空标签页
    tabs.value = [];
    activeTabId.value = '';
    tabHistory.value = [];
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
  };
});