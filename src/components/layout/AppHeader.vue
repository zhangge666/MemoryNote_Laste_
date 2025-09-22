<template>
  <div class="h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4" style="-webkit-app-region: drag;">
    <!-- 左侧区域 -->
    <div class="flex items-center space-x-3">
      <!-- 软件图标 -->
      <div class="flex items-center space-x-2">
        <div class="w-6 h-6 bg-primary-500 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-xs">MN</span>
        </div>
        <span class="text-lg font-semibold text-gray-900 dark:text-white">MemoryNote</span>
      </div>
      
      <!-- 左侧栏切换按钮 -->
      <button
        @click="appStore.toggleLeftSidebar"
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        :class="{ 'bg-gray-100 dark:bg-gray-700': appStore.leftSidebarActive }"
        style="-webkit-app-region: no-drag;"
      >
        <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      <!-- 搜索按钮 -->
      <button class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" style="-webkit-app-region: no-drag;">
        <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </div>
    
    <!-- 右侧区域 -->
    <div class="flex items-center space-x-2">
      <!-- 右侧栏切换按钮 -->
      <button
        @click="appStore.toggleRightSidebar"
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        :class="{ 'bg-gray-100 dark:bg-gray-700': appStore.rightSidebarActive }"
        style="-webkit-app-region: no-drag;"
      >
        <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>
      
      <!-- 窗口控制按钮 -->
      <div class="flex items-center space-x-1 ml-4" style="-webkit-app-region: no-drag;">
        <button
          @click="minimizeWindow"
          class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
          </svg>
        </button>
        
        <button
          @click="maximizeWindow"
          class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        
        <button
          @click="closeWindow"
          class="w-8 h-8 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
        >
          <svg class="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../../stores/app';

const appStore = useAppStore();

// 窗口控制函数
const minimizeWindow = async () => {
  if (window.electronAPI) {
    await window.electronAPI.minimizeWindow();
  }
};

const maximizeWindow = async () => {
  if (window.electronAPI) {
    await window.electronAPI.maximizeWindow();
  }
};

const closeWindow = async () => {
  if (window.electronAPI) {
    await window.electronAPI.closeWindow();
  }
};
</script>