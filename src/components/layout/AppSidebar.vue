<template>
  <div class="w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
    <!-- 导航按钮区域 -->
    <div class="flex flex-col items-center py-4 space-y-2">
      <!-- 系统导航按钮 -->
      <button
        v-for="item in navigationItems"
        :key="item.id"
        @click="handleNavigation(item.id)"
        class="w-10 h-10 flex items-center justify-center rounded-lg transition-colors"
        :class="[
          (item.id === 'documents' ? isDocumentActive : appStore.currentView === item.id)
            ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        ]"
        :title="item.title"
      >
        <!-- 系统图标 -->
        <component :is="getSystemIcon(item.id)" class="w-5 h-5" />
      </button>

      <!-- 分隔线 -->
      <div v-if="pluginPanels.length > 0 || pluginNavigationButtons.length > 0" class="w-8 border-t border-gray-200 dark:border-gray-700"></div>

      <!-- 插件侧边栏面板按钮 -->
      <button
        v-for="panel in pluginPanels"
        :key="panel.id"
        @click="handlePluginNavigation(panel.id)"
        class="w-10 h-10 flex items-center justify-center rounded-lg transition-colors"
        :class="[
          appStore.currentView === panel.id
            ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        ]"
        :title="panel.title"
      >
        <!-- 插件图标 -->
        <div v-html="panel.icon" class="w-5 h-5"></div>
      </button>

      <!-- 插件导航按钮 -->
      <button
        v-for="button in pluginNavigationButtons"
        :key="button.id"
        @click="handlePluginButtonClick(button)"
        class="w-10 h-10 flex items-center justify-center rounded-lg transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        :title="button.title"
      >
        <!-- 插件图标 -->
        <div v-html="button.icon" class="w-5 h-5"></div>
      </button>
    </div>
    
    <!-- 底部按钮区域 - 固定在底部 -->
    <div class="mt-auto pb-4 flex flex-col items-center space-y-2">
      <!-- 分隔线 -->
      <div class="w-8 h-px bg-gray-200 dark:bg-gray-700 mb-2"></div>
      
      <!-- 用户头像 -->
      <button 
        @click="handleNavigation('profile')"
        class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        title="用户资料"
      >
        <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </button>
      
      <!-- 收件箱按钮 -->
      <button
        @click="handleNavigation('inbox')"
        class="w-10 h-10 flex items-center justify-center rounded-lg transition-colors"
        :class="[
          appStore.currentView === 'inbox'
            ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        ]"
        title="收件箱"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </button>
      
      <!-- 设置按钮 -->
      <button
        @click="openSettings"
        class="w-10 h-10 flex items-center justify-center rounded-lg transition-colors"
        :class="[
          appStore.currentView === 'settings'
            ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        ]"
        title="设置"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue';
import { useAppStore } from '../../stores/app';
import { useTabGroupsStore } from '@/stores/tabGroups';
import { usePluginService } from '../../services/plugins/pluginService';

const appStore = useAppStore();
const tabGroupsStore = useTabGroupsStore();
const pluginService = usePluginService();

// 获取插件面板
const pluginPanels = computed(() => {
  try {
    // 获取计算属性的值
    const panels = pluginService.sidebarPanels?.value || pluginService.sidebarPanels || []
    // 确保是数组并过滤掉无效的面板
    const validPanels = Array.isArray(panels) ? panels : []
    return validPanels.filter(panel => panel && panel.id && panel.title)
  } catch (error) {
    console.warn('Error accessing plugin panels:', error)
    return []
  }
});

// 获取插件导航按钮
const pluginNavigationButtons = computed(() => {
  try {
    const buttons = pluginService.navigationButtons?.value || pluginService.navigationButtons || []
    const validButtons = Array.isArray(buttons) ? buttons : []
    return validButtons.filter(button => button && button.id && button.title)
  } catch (error) {
    console.warn('Error accessing plugin navigation buttons:', error)
    return []
  }
});

// 计算属性：判断是否应该高亮文档图标
const isDocumentActive = computed(() => {
  // 如果当前视图是文档，则高亮
  if (appStore.currentView === 'documents') {
    return true;
  }
  
  // 如果当前有编辑器标签页，并且当前视图不是其他特定视图，则高亮文档图标
  if (tabGroupsStore.activeTab?.type === 'editor' && 
      !['diary', 'review', 'search'].includes(appStore.currentView)) {
    return true;
  }
  
  return false;
});

const navigationItems = [
  {
    id: 'documents',
    title: '文档'
  },
  {
    id: 'diary',
    title: '日记'
  },
  {
    id: 'review',
    title: '复习'
  },
  {
    id: 'search',
    title: '搜索'
  }
];

// 获取系统图标组件
const getSystemIcon = (itemId: string) => {
  const icons = {
    documents: () => h('svg', {
      class: 'w-5 h-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
      })
    ]),
    diary: () => h('svg', {
      class: 'w-5 h-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
      })
    ]),
    review: () => h('svg', {
      class: 'w-5 h-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
      })
    ]),
    search: () => h('svg', {
      class: 'w-5 h-5',
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24'
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
      })
    ])
  }
  return icons[itemId as keyof typeof icons] || null
}

const handleNavigation = (viewId: string) => {
  appStore.setCurrentView(viewId);
  
  // 打开对应的标签页
  tabGroupsStore.addTabToGroup({
    title: navigationItems.find(item => item.id === viewId)?.title || '新页面',
    type: viewId as any,
    content: '',
  });
};

const handlePluginNavigation = (panelId: string) => {
  appStore.setCurrentView(panelId);
  
  // 确保左侧边栏可见并设置为插件面板
  if (!appStore.leftSidebarVisible) {
    appStore.toggleLeftSidebar();
  }
};

const handlePluginButtonClick = (button: any) => {
  if (typeof button.onClick === 'function') {
    button.onClick();
  }
};

const openSettings = () => {
  // 打开设置标签页
  tabGroupsStore.addTabToGroup({
    title: '设置',
    type: 'settings',
    content: '',
  });
};
</script>