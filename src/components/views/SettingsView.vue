<template>
  <div class="h-full flex bg-white dark:bg-gray-900">
    <!-- 设置侧边栏 -->
    <div class="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div class="p-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">设置</h2>
        <nav class="space-y-1">
          <button
            v-for="item in settingsItems"
            :key="item.id"
            @click="activeSection = item.id"
            :class="[
              'w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors',
              activeSection === item.id
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            ]"
          >
            <div class="flex items-center space-x-3">
              <component :is="item.icon" class="w-4 h-4" />
              <span>{{ item.name }}</span>
            </div>
          </button>
        </nav>
      </div>
    </div>

    <!-- 设置内容区域 -->
    <div class="flex-1 overflow-y-auto">
      <!-- 基础设置 -->
      <div v-if="activeSection === 'general'" class="p-6">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">基础设置</h3>
        
        <!-- 工作区设置 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4">工作区设置</h4>
          
          <div class="space-y-4">
            <!-- 当前工作区路径 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                当前工作区路径
              </label>
              <div class="flex items-center space-x-2">
                <input
                  v-model="currentWorkspacePath"
                  type="text"
                  readonly
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
                <button
                  @click="openWorkspaceDialog"
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  选择文件夹
                </button>
              </div>
            </div>

            <!-- 工作区信息 -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
              <h5 class="text-sm font-medium text-gray-900 dark:text-white mb-2">工作区信息</h5>
              <div class="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <span class="font-medium">笔记数量:</span>
                  <span class="ml-2">{{ workspaceStats.notesCount }}</span>
                </div>
                <div>
                  <span class="font-medium">文件数量:</span>
                  <span class="ml-2">{{ workspaceStats.filesCount }}</span>
                </div>
                <div>
                  <span class="font-medium">目录数量:</span>
                  <span class="ml-2">{{ workspaceStats.dirsCount }}</span>
                </div>
                <div>
                  <span class="font-medium">总大小:</span>
                  <span class="ml-2">{{ formatFileSize(workspaceStats.totalSize) }}</span>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex space-x-3">
              <button
                @click="refreshWorkspaceStats"
                :disabled="isLoading"
                class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm"
              >
                {{ isLoading ? '刷新中...' : '刷新统计' }}
              </button>
              <button
                @click="openWorkspaceInExplorer"
                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                在文件管理器中打开
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 其他设置页面 -->
      <div v-else class="p-6">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {{ getCurrentSectionName() }}
        </h3>
        <div class="text-center text-gray-500 dark:text-gray-400 py-8">
          该设置页面正在开发中...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAppStore } from '../../stores/app';
import { settingsService, settings } from '../../services/settingsService';

const appStore = useAppStore();

// 设置项
const settingsItems = [
  {
    id: 'general',
    name: '基础设置',
    icon: 'SettingsIcon'
  },
  {
    id: 'editor',
    name: '编辑器设置',
    icon: 'EditIcon'
  },
  {
    id: 'ai',
    name: 'AI设置',
    icon: 'BrainIcon'
  },
  {
    id: 'review',
    name: '复习设置',
    icon: 'ClockIcon'
  },
  {
    id: 'theme',
    name: '主题设置',
    icon: 'PaletteIcon'
  },
  {
    id: 'plugins',
    name: '插件管理',
    icon: 'PuzzleIcon'
  }
];

// 状态
const activeSection = ref('general');
const currentWorkspacePath = ref('');
const isLoading = ref(false);
const workspaceStats = ref({
  notesCount: 0,
  filesCount: 0,
  dirsCount: 0,
  totalSize: 0
});

// 获取当前设置项名称
const getCurrentSectionName = () => {
  const item = settingsItems.find(item => item.id === activeSection.value);
  return item?.name || '设置';
};

// 打开工作区选择对话框
const openWorkspaceDialog = async () => {
  try {
    const selectedPath = await window.electronAPI.selectWorkspaceFolder();
    if (selectedPath && selectedPath !== currentWorkspacePath.value) {
      const success = await appStore.setWorkspacePath(selectedPath);
      if (success) {
        currentWorkspacePath.value = selectedPath;
        // 同时更新设置服务中的工作区路径
        await settingsService.updateSetting('workspacePath', selectedPath);
        await refreshWorkspaceStats();
      } else {
        alert('设置工作区路径失败，请检查路径是否有效');
      }
    }
  } catch (error) {
    console.error('Error opening workspace dialog:', error);
    alert('打开工作区选择对话框失败');
  }
};

// 刷新工作区统计信息
const refreshWorkspaceStats = async () => {
  isLoading.value = true;
  try {
    // 获取工作区文件列表
    const files = await window.electronAPI.listFiles('');
    
    let filesCount = 0;
    let dirsCount = 0;
    let totalSize = 0;
    
    // 递归统计文件信息
    const countFiles = async (dirPath: string) => {
      const items = await window.electronAPI.listFiles(dirPath);
      for (const item of items) {
        if (item.isDirectory) {
          dirsCount++;
          await countFiles(item.relativePath);
        } else {
          filesCount++;
          // 这里可以获取文件大小，暂时设为0
          totalSize += 0;
        }
      }
    };
    
    await countFiles('');
    
    workspaceStats.value = {
      notesCount: 0, // 从数据库获取
      filesCount,
      dirsCount,
      totalSize
    };
  } catch (error) {
    console.error('Error refreshing workspace stats:', error);
  } finally {
    isLoading.value = false;
  }
};

// 在文件管理器中打开工作区
const openWorkspaceInExplorer = async () => {
  try {
    const success = await window.electronAPI.openWorkspaceInExplorer();
    if (!success) {
      alert('打开文件管理器失败');
    }
  } catch (error) {
    console.error('Error opening workspace in explorer:', error);
    alert('打开文件管理器失败');
  }
};

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 组件挂载时初始化
onMounted(async () => {
  try {
    // 加载设置
    await settingsService.loadSettings();
    currentWorkspacePath.value = settings.workspacePath || await appStore.getWorkspacePath();
    await refreshWorkspaceStats();
  } catch (error) {
    console.error('Error initializing settings:', error);
  }
});
</script>
