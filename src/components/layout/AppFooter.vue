<template>
  <div class="h-8 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
    <!-- 左侧信息 -->
    <div class="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
      <!-- 连接状态 -->
      <div class="flex items-center space-x-1">
        <div class="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>已连接</span>
      </div>
      
      <!-- 工作区路径 -->
      <div v-if="appStore.workspacePath" class="flex items-center space-x-1">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
        <span>{{ appStore.workspacePath }}</span>
      </div>
    </div>
    
    <!-- 右侧信息 -->
    <div class="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
      <!-- 概览信息 -->
      <div v-if="!tabsStore.activeTab" class="flex items-center space-x-4">
        <div class="flex items-center space-x-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>笔记: {{ notesCount }}</span>
        </div>
        <div class="flex items-center space-x-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span>复习: {{ reviewCount }}</span>
        </div>
      </div>
      
      <!-- 文档信息 -->
      <div v-else class="flex items-center space-x-4">
        <div class="flex items-center space-x-1">
          <span>行 {{ getCurrentLine() }}, 列 {{ getCurrentColumn() }}</span>
        </div>
        <div class="flex items-center space-x-1">
          <span>{{ getCharacterCount() }} 字符</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '../../stores/app';
import { useTabsStore } from '../../stores/tabs';

const appStore = useAppStore();
const tabsStore = useTabsStore();

const notesCount = ref(0);
const reviewCount = ref(0);

const getCurrentLine = () => {
  if (!tabsStore.activeTab?.content) return 1;
  return tabsStore.activeTab.content.split('\n').length;
};

const getCurrentColumn = () => {
  if (!tabsStore.activeTab?.content) return 1;
  const lines = tabsStore.activeTab.content.split('\n');
  const lastLine = lines[lines.length - 1];
  return lastLine.length + 1;
};

const getCharacterCount = () => {
  return tabsStore.activeTab?.content?.length || 0;
};
</script>