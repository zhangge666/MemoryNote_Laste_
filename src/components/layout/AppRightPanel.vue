<template>
  <div 
    class="bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden relative w-full h-full"
    :style="{ 
      transform: appStore.rightSidebarVisible ? 'translateX(0)' : `translateX(100%)`,
      transition: isResizing ? 'none' : 'all 0.3s ease-in-out'
    }"
  >
    <!-- 拖拽手柄 -->
    <div 
      v-if="appStore.rightSidebarVisible"
      class="absolute left-0 top-0 w-1 h-full bg-transparent hover:bg-blue-500 cursor-col-resize z-10"
      @mousedown="startResize"
    ></div>
    <!-- 面板头部 -->
    <div class="h-12 border-b border-gray-200 dark:border-gray-700 flex items-center px-4">
      <h3 class="text-sm font-medium text-gray-900 dark:text-white">
        {{ getPanelTitle() }}
      </h3>
    </div>
    
    <!-- 面板内容 -->
    <div class="flex-1 overflow-y-auto">
      <!-- 插件详情 -->
      <div v-if="appStore.rightPanelContent === 'plugin-details' && appStore.selectedPluginForDetails" class="p-4">
        <PluginDetails :plugin="appStore.selectedPluginForDetails" @close="appStore.clearPluginDetails()" />
      </div>
      
      <!-- 插件自定义内容 -->
      <div v-else-if="appStore.rightPanelContent === 'plugin-content' && appStore.selectedPluginForDetails" class="h-full">
        <div ref="pluginContentContainer" class="h-full"></div>
      </div>
      
      <!-- 文档信息 -->
      <div v-else-if="appStore.rightPanelContent === 'document-info' && tabGroupsStore.activeTab?.type === 'editor'" class="p-4">
        <div class="space-y-4">
          <div>
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">文档信息</h4>
            <div class="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <div class="flex justify-between">
                <span>字符数:</span>
                <span>{{ getCharacterCount() }}</span>
              </div>
              <div class="flex justify-between">
                <span>行数:</span>
                <span>{{ getLineCount() }}</span>
              </div>
              <div class="flex justify-between">
                <span>最后修改:</span>
                <span>{{ formatDate(tabGroupsStore.activeTab?.lastModified) }}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">标签</h4>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in getTags()"
                :key="tag"
                class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 其他面板内容 -->
      <div v-else class="p-4">
        <div class="text-center text-gray-500 dark:text-gray-400 py-8">
          右侧面板内容
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, nextTick } from 'vue';
import { useTabGroupsStore } from '../../stores/tabGroups';
import { useAppStore } from '../../stores/app';
import PluginDetails from '../common/PluginDetails.vue';

const tabGroupsStore = useTabGroupsStore();
const appStore = useAppStore();

const isResizing = ref(false);
const pluginContentContainer = ref<HTMLElement>();

const startResize = (e: MouseEvent) => {
  isResizing.value = true;
  appStore.setRightPanelResizing(true);
  e.preventDefault();
  
  const startX = e.clientX;
  const startWidth = appStore.rightPanelWidth;
  let currentWidth = startWidth;
  
  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = startX - e.clientX; // 右侧栏是反向的
    const newWidth = startWidth + deltaX;
    currentWidth = newWidth;
    
    // 限制最小和最大宽度
    if (newWidth >= 200 && newWidth <= 600) {
      appStore.updateRightPanelWidth(newWidth);
    }
  };
  
  const handleMouseUp = () => {
    // 检查最终宽度，如果小于150px则关闭侧边栏
    if (currentWidth < 150) {
      appStore.toggleRightSidebar();
    }
    
    isResizing.value = false;
    appStore.setRightPanelResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

onUnmounted(() => {
  // 清理事件监听器
  document.removeEventListener('mousemove', () => {});
  document.removeEventListener('mouseup', () => {});
});

// 监听插件内容变化，动态挂载组件
watch(() => appStore.selectedPluginForDetails, async (newContent) => {
  if (appStore.rightPanelContent === 'plugin-content' && newContent && newContent.component) {
    await nextTick()
    if (pluginContentContainer.value) {
      // 清空容器
      pluginContentContainer.value.innerHTML = ''
      
      // 确保component是有效的DOM元素
      const component = newContent.component
      
      // 检查是否是插件沙箱的代理元素
      if (component && typeof component === 'object' && component.__target__) {
        // 获取代理后面的真实DOM元素
        pluginContentContainer.value.appendChild(component.__target__)
      } else if (component instanceof HTMLElement) {
        // 直接的DOM元素
        pluginContentContainer.value.appendChild(component)
      } else if (typeof component === 'string') {
        // 如果是HTML字符串，直接设置innerHTML
        pluginContentContainer.value.innerHTML = component
      } else {
        console.error('[AppRightPanel] Invalid component type:', typeof component, component)
        pluginContentContainer.value.innerHTML = '<div class="p-4 text-red-500">插件组件类型错误</div>'
      }
    }
  }
}, { immediate: true })

const getPanelTitle = () => {
  if (appStore.rightPanelContent === 'plugin-details') {
    return '插件详情';
  }
  if (appStore.rightPanelContent === 'plugin-content' && appStore.selectedPluginForDetails) {
    return appStore.selectedPluginForDetails.title || '插件内容';
  }
  if (tabGroupsStore.activeTab?.type === 'editor') {
    return '文档信息';
  }
  return '信息面板';
};

const getCharacterCount = () => {
  return tabGroupsStore.activeTab?.content?.length || 0;
};

const getLineCount = () => {
  return tabGroupsStore.activeTab?.content?.split('\n').length || 0;
};

const formatDate = (date: Date | undefined) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
};

const getTags = () => {
  // 这里可以从标签页的元数据中获取标签
  return [];
};
</script>