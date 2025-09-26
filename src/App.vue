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

<style>
:root {
  --primary-color: #3b82f6;
  --accent-color: #10b981;
  --animation-duration: 0.3s;
  --editor-font-size: 14px;
  --editor-font-family: 'JetBrains Mono', 'Consolas', monospace;
  --editor-line-height: 1.5;
}

/* 应用主题颜色 */
.bg-primary {
  background-color: var(--primary-color);
}

.text-primary {
  color: var(--primary-color);
}

.border-primary {
  border-color: var(--primary-color);
}

.bg-accent {
  background-color: var(--accent-color);
}

.text-accent {
  color: var(--accent-color);
}

.border-accent {
  border-color: var(--accent-color);
}

/* 应用动画速度 */
.transition-all {
  transition-duration: var(--animation-duration);
}

/* 应用编辑器字体 */
.editor {
  font-family: var(--editor-font-family);
  font-size: var(--editor-font-size);
  line-height: var(--editor-line-height);
}

/* 应用侧边栏宽度 */
.left-sidebar {
  width: var(--left-sidebar-width, 240px);
}

.right-sidebar {
  width: var(--right-sidebar-width, 240px);
}

/* 应用主题颜色到 Tailwind 类 */
.bg-primary-50 {
  background-color: color-mix(in srgb, var(--primary-color) 5%, white);
}

.bg-primary-100 {
  background-color: color-mix(in srgb, var(--primary-color) 10%, white);
}

.bg-primary-500 {
  background-color: var(--primary-color);
}

.bg-primary-600 {
  background-color: color-mix(in srgb, var(--primary-color) 80%, black);
}

.bg-primary-700 {
  background-color: color-mix(in srgb, var(--primary-color) 70%, black);
}

.text-primary-600 {
  color: var(--primary-color);
}

.text-primary-700 {
  color: color-mix(in srgb, var(--primary-color) 80%, black);
}

.border-primary-200 {
  border-color: color-mix(in srgb, var(--primary-color) 20%, white);
}

.border-primary-300 {
  border-color: color-mix(in srgb, var(--primary-color) 30%, white);
}

/* 应用主题颜色到 Tailwind 类 */
.bg-accent-50 {
  background-color: color-mix(in srgb, var(--accent-color) 5%, white);
}

.bg-accent-100 {
  background-color: color-mix(in srgb, var(--accent-color) 10%, white);
}

.bg-accent-500 {
  background-color: var(--accent-color);
}

.bg-accent-600 {
  background-color: color-mix(in srgb, var(--accent-color) 80%, black);
}

.bg-accent-700 {
  background-color: color-mix(in srgb, var(--accent-color) 70%, black);
}

.text-accent-600 {
  color: var(--accent-color);
}

.text-accent-700 {
  color: color-mix(in srgb, var(--accent-color) 80%, black);
}

.border-accent-200 {
  border-color: color-mix(in srgb, var(--accent-color) 20%, white);
}

.border-accent-300 {
  border-color: color-mix(in srgb, var(--accent-color) 30%, white);
}

/* 应用主题颜色到 Tailwind 类 */
.bg-accent-50 {
  background-color: color-mix(in srgb, var(--accent-color) 5%, white);
}

.bg-accent-100 {
  background-color: color-mix(in srgb, var(--accent-color) 10%, white);
}

.bg-accent-500 {
  background-color: var(--accent-color);
}

.bg-accent-600 {
  background-color: color-mix(in srgb, var(--accent-color) 80%, black);
}

.bg-accent-700 {
  background-color: color-mix(in srgb, var(--accent-color) 70%, black);
}

.text-accent-600 {
  color: var(--accent-color);
}

.text-accent-700 {
  color: color-mix(in srgb, var(--accent-color) 80%, black);
}

.border-accent-200 {
  border-color: color-mix(in srgb, var(--accent-color) 20%, white);
}

.border-accent-300 {
  border-color: color-mix(in srgb, var(--accent-color) 30%, white);
}
</style>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAppStore } from './stores/app';
import { settingsService } from './services/settingsService';
import { usePluginService } from './services/plugins/pluginService';
import AppHeader from './components/layout/AppHeader.vue';
import AppSidebar from './components/layout/AppSidebar.vue';
import AppLeftPanel from './components/layout/AppLeftPanel.vue';
import AppMain from './components/layout/AppMain.vue';
import AppRightPanel from './components/layout/AppRightPanel.vue';
import AppFooter from './components/layout/AppFooter.vue';

const appStore = useAppStore();
const pluginService = usePluginService();

onMounted(async () => {
  // 初始化应用
  await appStore.initializeApp();
  
  // 加载设置
  await settingsService.loadSettings();
  
  // 初始化插件系统
  await pluginService.initialize();
});
</script>