import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAppStore = defineStore('app', () => {
  // 状态
  const leftSidebarVisible = ref(true);
  const rightSidebarVisible = ref(false);
  const leftPanelWidth = ref(240);
  const rightPanelWidth = ref(240);
  const isLeftPanelResizing = ref(false);
  const isRightPanelResizing = ref(false);
  const currentView = ref('documents');
  const rightPanelContent = ref<'document-info' | 'plugin-details' | 'plugin-content' | null>('document-info');
  const selectedPluginForDetails = ref<any>(null);
  const leftPanelContent = ref<'file-tree' | 'plugin-content' | null>('file-tree');
  const selectedPluginForLeftPanel = ref<any>(null);
  const isDarkMode = ref(false);
  const workspacePath = ref('');

  // 计算属性
  const leftSidebarActive = computed(() => leftSidebarVisible.value);
  const rightSidebarActive = computed(() => rightSidebarVisible.value);

  // 动作
  const toggleLeftSidebar = () => {
    leftSidebarVisible.value = !leftSidebarVisible.value;
  };

  const toggleRightSidebar = () => {
    rightSidebarVisible.value = !rightSidebarVisible.value;
  };

  const setCurrentView = (view: string) => {
    currentView.value = view;
  };

  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value;
    // 更新 HTML 类名
    if (isDarkMode.value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const setWorkspacePath = async (path: string) => {
    const success = await window.electronAPI.setWorkspacePath(path);
    if (success) {
      workspacePath.value = path;
    }
    return success;
  };

  const getWorkspacePath = async () => {
    const path = await window.electronAPI.getWorkspacePath();
    workspacePath.value = path;
    return path;
  };

  const updateLeftPanelWidth = (width: number) => {
    leftPanelWidth.value = width;
  };

  const updateRightPanelWidth = (width: number) => {
    rightPanelWidth.value = width;
  };

  const setLeftPanelResizing = (resizing: boolean) => {
    isLeftPanelResizing.value = resizing;
  };

  const setRightPanelResizing = (resizing: boolean) => {
    isRightPanelResizing.value = resizing;
  };

  const setRightPanelContent = (content: 'document-info' | 'plugin-details' | 'plugin-content' | null) => {
    rightPanelContent.value = content;
  };

  const setSelectedPluginForDetails = (plugin: any) => {
    selectedPluginForDetails.value = plugin;
    rightPanelContent.value = 'plugin-details';
    rightSidebarVisible.value = true;
  };

  const clearPluginDetails = () => {
    selectedPluginForDetails.value = null;
    rightPanelContent.value = 'document-info';
  };

  const setLeftPanelContent = (content: 'file-tree' | 'plugin-content' | null) => {
    leftPanelContent.value = content;
  };

  const setSelectedPluginForLeftPanel = (plugin: any) => {
    selectedPluginForLeftPanel.value = plugin;
    leftPanelContent.value = 'plugin-content';
    leftSidebarVisible.value = true;
  };

  const clearLeftPanelPlugin = () => {
    selectedPluginForLeftPanel.value = null;
    leftPanelContent.value = 'file-tree';
  };

  const initializeApp = async () => {
    // 初始化应用
    console.log('Initializing MemoryNote app...');
    
    // 获取工作区路径
    await getWorkspacePath();
    
    // 检查系统主题偏好
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    isDarkMode.value = prefersDark;
    
    if (isDarkMode.value) {
      document.documentElement.classList.add('dark');
    }
  };

  return {
    // 状态
    leftSidebarVisible,
    rightSidebarVisible,
    leftPanelWidth,
    rightPanelWidth,
    isLeftPanelResizing,
    isRightPanelResizing,
    currentView,
    rightPanelContent,
    selectedPluginForDetails,
    leftPanelContent,
    selectedPluginForLeftPanel,
    isDarkMode,
    workspacePath,
    
    // 计算属性
    leftSidebarActive,
    rightSidebarActive,
    
    // 动作
    toggleLeftSidebar,
    toggleRightSidebar,
    setCurrentView,
    toggleDarkMode,
    setWorkspacePath,
    getWorkspacePath,
    updateLeftPanelWidth,
    updateRightPanelWidth,
    setLeftPanelResizing,
    setRightPanelResizing,
    setRightPanelContent,
    setSelectedPluginForDetails,
    clearPluginDetails,
    setLeftPanelContent,
    setSelectedPluginForLeftPanel,
    clearLeftPanelPlugin,
    initializeApp,
  };
});