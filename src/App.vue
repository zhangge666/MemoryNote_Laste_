<template>
  <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- 顶部栏 -->
    <AppHeader />
    
    <!-- 内容区域 -->
    <div class="flex-1 flex overflow-hidden">
      <!-- 侧边导航栏 -->
      <AppSidebar class="flex-shrink-0"/>
      
      <!-- 左侧栏容器 -->
      <div 
        class="overflow-hidden h-full flex-shrink-0"
        :class="{ 'transition-all duration-300 ease-in-out': !appStore.isLeftPanelResizing }"
        :style="{ width: appStore.leftSidebarVisible ? `${appStore.leftPanelWidth}px` : '0px' }"
      >
        <AppLeftPanel />
      </div>
      
      <!-- 主工作区域 -->
      <AppMain class="flex-1 min-w-0 overflow-hidden"/>
      
      <!-- 右侧栏容器 -->
      <div 
        class="overflow-hidden h-full flex-shrink-0"
        :class="{ 'transition-all duration-300 ease-in-out': !appStore.isRightPanelResizing }"
        :style="{ width: appStore.rightSidebarVisible ? `${appStore.rightPanelWidth}px` : '0px' }"
      >
        <AppRightPanel />
      </div>
    </div>
    
    <!-- 底部栏 -->
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAppStore } from './stores/app';
import AppHeader from './components/layout/AppHeader.vue';
import AppSidebar from './components/layout/AppSidebar.vue';
import AppLeftPanel from './components/layout/AppLeftPanel.vue';
import AppMain from './components/layout/AppMain.vue';
import AppRightPanel from './components/layout/AppRightPanel.vue';
import AppFooter from './components/layout/AppFooter.vue';

const appStore = useAppStore();

onMounted(() => {
  // 初始化应用
  appStore.initializeApp();
});
</script>