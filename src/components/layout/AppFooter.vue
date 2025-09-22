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
      <div v-if="!tabGroupsStore.activeTab" class="flex items-center space-x-4">
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
      <div v-else-if="tabGroupsStore.activeTab.type === 'editor'" class="flex items-center space-x-4">
        <div class="flex items-center space-x-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{{ getFileName() }}</span>
        </div>
        <div class="flex items-center space-x-1">
          <span>行 {{ getCurrentLine() }}, 列 {{ getCurrentColumn() }}</span>
        </div>
        <div class="flex items-center space-x-1">
          <span>{{ getCharacterCount() }} 字符</span>
        </div>
        <div v-if="tabGroupsStore.activeTab.isDirty" class="flex items-center space-x-1">
          <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
          <span>未保存</span>
        </div>
      </div>
      
      <!-- 其他类型标签页信息 -->
      <div v-else class="flex items-center space-x-4">
        <div class="flex items-center space-x-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span>{{ tabGroupsStore.activeTab.title }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAppStore } from '../../stores/app';
import { useTabGroupsStore } from '../../stores/tabGroups';

const appStore = useAppStore();
const tabGroupsStore = useTabGroupsStore();

const notesCount = ref(0);
const reviewCount = ref(0);

const getFileName = () => {
  const activeTab = tabGroupsStore.activeTab;
  if (!activeTab?.filePath) return '未命名文件';
  return activeTab.filePath.split(/[\\\/]/).pop() || '未命名文件';
};

const getCurrentLine = () => {
  const activeTab = tabGroupsStore.activeTab;
  if (!activeTab?.content) return 1;
  return activeTab.content.split('\n').length;
};

const getCurrentColumn = () => {
  const activeTab = tabGroupsStore.activeTab;
  if (!activeTab?.content) return 1;
  const lines = activeTab.content.split('\n');
  const lastLine = lines[lines.length - 1];
  return lastLine.length + 1;
};

const getCharacterCount = () => {
  const activeTab = tabGroupsStore.activeTab;
  return activeTab?.content?.length || 0;
};
</script>