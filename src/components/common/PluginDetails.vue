<template>
  <div class="plugin-details-panel">
    <!-- 关闭按钮 -->
    <div class="flex justify-between items-center mb-4">
      <h4 class="text-lg font-semibold text-gray-900 dark:text-white">{{ plugin.manifest.name }}</h4>
      <button 
        @click="$emit('close')"
        class="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <!-- 基本信息 -->
    <div class="space-y-4">
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h5 class="text-sm font-medium text-gray-900 dark:text-white mb-3">基本信息</h5>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-gray-600 dark:text-gray-300">ID:</dt>
            <dd class="text-gray-900 dark:text-white font-mono">{{ plugin.manifest.id }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-600 dark:text-gray-300">版本:</dt>
            <dd class="text-gray-900 dark:text-white">{{ plugin.manifest.version }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-600 dark:text-gray-300">作者:</dt>
            <dd class="text-gray-900 dark:text-white">{{ plugin.manifest.author || '未知' }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-gray-600 dark:text-gray-300">状态:</dt>
            <dd>
              <span 
                :class="getStatusClass(plugin.state)"
                class="px-2 py-1 text-xs rounded-full"
              >
                {{ getStatusText(plugin.state) }}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      <!-- 描述 -->
      <div v-if="plugin.manifest.description" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h5 class="text-sm font-medium text-gray-900 dark:text-white mb-2">描述</h5>
        <p class="text-sm text-gray-600 dark:text-gray-300">{{ plugin.manifest.description }}</p>
      </div>

      <!-- 权限 -->
      <div v-if="plugin.manifest.permissions?.length" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h5 class="text-sm font-medium text-gray-900 dark:text-white mb-2">权限</h5>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="permission in plugin.manifest.permissions"
            :key="permission"
            class="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
          >
            {{ permission }}
          </span>
        </div>
      </div>

      <!-- 贡献功能 -->
      <div v-if="plugin.manifest.contributes" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h5 class="text-sm font-medium text-gray-900 dark:text-white mb-3">贡献功能</h5>
        <div class="space-y-2">
          <div v-if="plugin.manifest.contributes.commands?.length" class="flex justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-300">命令:</span>
            <span class="text-gray-900 dark:text-white">{{ plugin.manifest.contributes.commands.length }}</span>
          </div>
          <div v-if="plugin.manifest.contributes.sidebar?.length" class="flex justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-300">侧边栏:</span>
            <span class="text-gray-900 dark:text-white">{{ plugin.manifest.contributes.sidebar.length }}</span>
          </div>
          <div v-if="plugin.manifest.contributes.algorithms?.length" class="flex justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-300">算法:</span>
            <span class="text-gray-900 dark:text-white">{{ plugin.manifest.contributes.algorithms.length }}</span>
          </div>
        </div>
      </div>

      <!-- 关键词 -->
      <div v-if="plugin.manifest.keywords?.length" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h5 class="text-sm font-medium text-gray-900 dark:text-white mb-2">关键词</h5>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="keyword in plugin.manifest.keywords"
            :key="keyword"
            class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded"
          >
            {{ keyword }}
          </span>
        </div>
      </div>

      <!-- 依赖 -->
      <div v-if="plugin.manifest.dependencies?.length" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h5 class="text-sm font-medium text-gray-900 dark:text-white mb-2">依赖</h5>
        <ul class="space-y-1 text-sm text-gray-600 dark:text-gray-300">
          <li v-for="dep in plugin.manifest.dependencies" :key="dep" class="font-mono">
            {{ dep }}
          </li>
        </ul>
      </div>

      <!-- 操作按钮 -->
      <div class="flex flex-col gap-2 pt-4 border-t border-gray-200 dark:border-gray-600">
        <button 
          v-if="plugin.state === 'loaded' || plugin.state === 'inactive'"
          class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          @click="$emit('activate', plugin.manifest.id)"
        >
          激活插件
        </button>
        <button 
          v-if="plugin.state === 'active'"
          class="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg transition-colors"
          @click="$emit('deactivate', plugin.manifest.id)"
        >
          停用插件
        </button>
        <button 
          class="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
          @click="$emit('reload', plugin.manifest.id)"
        >
          重载插件
        </button>
        <button 
          class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
          @click="$emit('uninstall', plugin.manifest.id)"
        >
          卸载插件
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LoadedPlugin } from '../../types/plugin';

interface Props {
  plugin: LoadedPlugin;
}

defineProps<Props>();

defineEmits<{
  close: [];
  activate: [pluginId: string];
  deactivate: [pluginId: string];
  reload: [pluginId: string];
  uninstall: [pluginId: string];
}>();

const getStatusText = (state: string) => {
  switch (state) {
    case 'active': return '已激活';
    case 'loaded': return '已加载';
    case 'inactive': return '未激活';
    case 'loading': return '加载中';
    case 'error': return '错误';
    default: return '未知';
  }
};

const getStatusClass = (state: string) => {
  switch (state) {
    case 'active': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    case 'loaded': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
    case 'inactive': return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    case 'loading': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
    case 'error': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
    default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  }
};
</script>
