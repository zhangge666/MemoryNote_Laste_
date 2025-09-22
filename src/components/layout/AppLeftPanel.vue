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
      <div v-if="appStore.currentView === 'documents'" class="p-4">
        <div class="space-y-2">
          <div
            v-for="note in notes"
            :key="note.id"
            @click="openNote(note)"
            class="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <h4 class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ note.title }}
            </h4>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
              {{ note.content?.substring(0, 100) }}...
            </p>
            <div class="flex items-center justify-between mt-2">
              <span class="text-xs text-gray-400">
                {{ formatDate(note.updated_at) }}
              </span>
              <div class="flex space-x-1">
                <span
                  v-for="tag in getTags(note.tags)"
                  :key="tag"
                  class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useAppStore } from '../../stores/app';
import { useTabsStore } from '../../stores/tabs';

const appStore = useAppStore();
const tabsStore = useTabsStore();

const notes = ref([]);
const isResizing = ref(false);

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