<template>
  <div 
    class="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden relative w-full h-full"
    :style="{ 
      transform: appStore.leftSidebarVisible ? 'translateX(0)' : `translateX(-100%)`,
      transition: isResizing ? 'none' : 'all 0.3s ease-in-out'
    }"
  >
    <!-- 拖拽手柄 -->
    <div 
      v-if="appStore.leftSidebarVisible"
      class="absolute right-0 top-0 w-1 h-full bg-transparent hover:bg-blue-500 cursor-col-resize z-10"
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
      <!-- 文档列表 -->
      <div v-if="appStore.currentView === 'documents'" class="h-full">
        <FileTree @open-file="handleOpenFile" />
      </div>
      
      <!-- 日记列表 -->
      <div v-else-if="appStore.currentView === 'diary'" class="p-4">
        <div class="space-y-2">
          <div class="text-center text-gray-500 dark:text-gray-400 py-8">
            日记功能开发中...
          </div>
        </div>
      </div>
      
      <!-- 复习列表 -->
      <div v-else-if="appStore.currentView === 'review'" class="p-4">
        <div class="space-y-2">
          <div class="text-center text-gray-500 dark:text-gray-400 py-8">
            复习功能开发中...
          </div>
        </div>
      </div>
      
      <!-- 搜索结果 -->
      <div v-else-if="appStore.currentView === 'search'" class="p-4">
        <div class="space-y-2">
          <div class="text-center text-gray-500 dark:text-gray-400 py-8">
            搜索功能开发中...
          </div>
        </div>
      </div>
      
      <!-- 插件面板内容 -->
      <div v-else-if="appStore.leftPanelContent === 'plugin-content' && appStore.selectedPluginForLeftPanel" class="h-full">
        <div ref="pluginPanelContainer" class="h-full"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useAppStore } from '../../stores/app';
import { useTabGroupsStore } from '@/stores/tabGroups';
import { usePluginService } from '../../services/plugins/pluginService';
import FileTree from '../fileTree/FileTree.vue';

const appStore = useAppStore();
const tabGroupsStore = useTabGroupsStore();
const pluginService = usePluginService();

const notes = ref([]);
const isResizing = ref(false);
const pluginPanelContainer = ref<HTMLElement>();

// 监听左侧栏插件内容变化
watch(() => appStore.selectedPluginForLeftPanel, async (newContent) => {
  if (appStore.leftPanelContent === 'plugin-content' && newContent && newContent.component) {
    await nextTick()
    if (pluginPanelContainer.value) {
      // 清空容器
      pluginPanelContainer.value.innerHTML = ''
      
      // 确保component是有效的DOM元素
      const component = newContent.component
      
      // 检查是否是插件沙箱的代理元素
      if (component && typeof component === 'object' && component.__target__) {
        // 获取代理后面的真实DOM元素
        pluginPanelContainer.value.appendChild(component.__target__)
      } else if (component instanceof HTMLElement) {
        // 直接的DOM元素
        pluginPanelContainer.value.appendChild(component)
      } else if (typeof component === 'string') {
        // 如果是HTML字符串，直接设置innerHTML
        pluginPanelContainer.value.innerHTML = component
      } else {
        console.error('[AppLeftPanel] Invalid component type:', typeof component, component)
        pluginPanelContainer.value.innerHTML = '<div class="p-4 text-red-500">插件组件类型错误</div>'
      }
    }
  }
}, { immediate: true });

const startResize = (e: MouseEvent) => {
  isResizing.value = true;
  appStore.setLeftPanelResizing(true);
  e.preventDefault();
  
  const startX = e.clientX;
  const startWidth = appStore.leftPanelWidth;
  let currentWidth = startWidth;
  
  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - startX;
    const newWidth = startWidth + deltaX;
    currentWidth = newWidth;
    
    // 限制最小和最大宽度
    if (newWidth >= 200 && newWidth <= 600) {
      appStore.updateLeftPanelWidth(newWidth);
    }
  };
  
  const handleMouseUp = () => {
    // 检查最终宽度，如果小于150px则关闭侧边栏
    if (currentWidth < 150) {
      appStore.toggleLeftSidebar();
    }
    
    isResizing.value = false;
    appStore.setLeftPanelResizing(false);
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

const getPanelTitle = () => {
  // 检查是否是插件面板
  if (appStore.leftPanelContent === 'plugin-content' && appStore.selectedPluginForLeftPanel) {
    return appStore.selectedPluginForLeftPanel.title;
  }
  
  const titles = {
    documents: '文档列表',
    diary: '日记列表',
    review: '复习列表',
    search: '搜索结果'
  };
  return titles[appStore.currentView] || '列表';
};

const openNote = (note: any) => {
  tabsStore.openTab({
    id: `note_${note.id}`,
    title: note.title,
    type: 'document',
    content: note.content,
    metadata: { noteId: note.id }
  });
};

// 处理打开文件
const handleOpenFile = (filePath: string, fileName: string) => {
  // 检查是否已经存在相同文件的标签页
  const existingTabs = tabGroupsStore.getFileTabs(filePath);
  
  if (existingTabs.length > 0) {
    // 如果已存在，激活第一个标签页
    const existingTab = existingTabs[0];
    const groupId = tabGroupsStore.layout.groups.get(tabGroupsStore.layout.activeGroupId)?.id || 'root';
    tabGroupsStore.setActiveTab(existingTab.id, groupId);
    console.log('File already open, switching to existing tab:', existingTab.id);
  } else {
    // 如果不存在，创建新的标签页
    tabGroupsStore.addTabToGroup({
      title: fileName,
      type: 'editor',
      filePath: filePath,
      content: '',
    });
    console.log('Created new tab for file:', filePath);
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};

const getTags = (tagsString: string) => {
  if (!tagsString) return [];
  return tagsString.split(',').filter(tag => tag.trim());
};

const loadNotes = async () => {
  try {
    if (window.electronAPI) {
      const notesData = await window.electronAPI.loadNotes();
      notes.value = notesData;
    }
  } catch (error) {
    console.error('Failed to load notes:', error);
  }
};

onMounted(() => {
  loadNotes();
});
</script>