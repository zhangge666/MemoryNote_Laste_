<template>
  <div class="flex-1 flex flex-col bg-white dark:bg-gray-900">
    <!-- 标签页栏 -->
    <div v-if="tabsStore.tabs.length > 0" class="h-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center overflow-x-auto">
      <div
        v-for="tab in tabsStore.tabs"
        :key="tab.id"
        @click="tabsStore.switchTab(tab.id)"
        class="flex items-center px-4 py-2 border-r border-gray-200 dark:border-gray-700 cursor-pointer transition-colors min-w-0"
        :class="[
          tab.isActive
            ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white'
            : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        ]"
      >
        <span class="text-sm font-medium truncate mr-2">{{ tab.title }}</span>
        <div class="flex items-center space-x-1">
          <span v-if="tab.isDirty" class="w-2 h-2 bg-orange-500 rounded-full"></span>
          <button
            @click.stop="tabsStore.closeTab(tab.id)"
            class="w-4 h-4 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 主内容区域 -->
    <div class="flex-1 overflow-hidden">
      <!-- 文档编辑器 -->
      <div v-if="tabsStore.activeTab?.type === 'document'" class="h-full flex flex-col">
        <div class="flex-1 p-4">
          <textarea
            v-model="currentContent"
            @input="handleContentChange"
            class="w-full h-full resize-none border-none outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            :placeholder="'开始编写您的笔记...'"
          ></textarea>
        </div>
      </div>
      
      <!-- 日记编辑器 -->
      <div v-else-if="tabsStore.activeTab?.type === 'diary'" class="h-full flex flex-col">
        <div class="flex-1 p-4">
          <div class="text-center text-gray-500 dark:text-gray-400 py-8">
            日记功能开发中...
          </div>
        </div>
      </div>
      
      <!-- 复习界面 -->
      <div v-else-if="tabsStore.activeTab?.type === 'review'" class="h-full flex flex-col">
        <div class="flex-1 p-4">
          <div class="text-center text-gray-500 dark:text-gray-400 py-8">
            复习功能开发中...
          </div>
        </div>
      </div>
      
      <!-- 搜索界面 -->
      <div v-else-if="tabsStore.activeTab?.type === 'search'" class="h-full flex flex-col">
        <div class="flex-1 p-4">
          <div class="text-center text-gray-500 dark:text-gray-400 py-8">
            搜索功能开发中...
          </div>
        </div>
      </div>
      
      <!-- 设置界面 -->
      <div v-else-if="tabsStore.activeTab?.type === 'settings'" class="h-full flex flex-col">
        <div class="flex-1 p-4">
          <div class="text-center text-gray-500 dark:text-gray-400 py-8">
            设置功能开发中...
          </div>
        </div>
      </div>
      
      <!-- 默认界面 -->
      <div v-else class="h-full flex items-center justify-center">
        <div class="text-center">
          <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">欢迎使用 MemoryNote</h3>
          <p class="text-gray-500 dark:text-gray-400">选择左侧功能开始使用</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useTabsStore } from '../../stores/tabs';

const tabsStore = useTabsStore();

const currentContent = ref('');

const handleContentChange = () => {
  if (tabsStore.activeTab) {
    tabsStore.updateTabContent(tabsStore.activeTab.id, currentContent.value);
  }
};

// 监听活动标签页变化
watch(() => tabsStore.activeTab, (newTab) => {
  if (newTab) {
    currentContent.value = newTab.content || '';
  } else {
    currentContent.value = '';
  }
}, { immediate: true });
</script>