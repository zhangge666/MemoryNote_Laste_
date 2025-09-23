<template>
  <div 
    class="tab-group h-full flex flex-col"
    @click="handleGroupClick"
  >
    <!-- 标签页头部 -->
    <div 
      v-if="!group.children || group.children.length === 0"
      class="tab-header flex bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-10 min-h-10"
      @dragover.prevent="handleTabHeaderDragOver"
      @dragenter.prevent="handleTabHeaderDragEnter"
      @dragleave="handleTabHeaderDragLeave"
      @drop="handleTabHeaderDrop"
    >
      <!-- 标签页列表 -->
      <div 
        class="flex-1 flex overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
        @wheel="handleWheel"
      >
        <div
          v-for="tab in group.tabs"
          :key="tab.id"
          @click.stop="handleTabClick(tab.id)"
          @contextmenu.prevent="handleTabContextMenu(tab, $event)"
          class="flex items-center px-3 py-2 border-r border-gray-200 dark:border-gray-700 cursor-pointer transition-colors flex-shrink-0 min-w-0 max-w-48 group"
          :class="[
            tab.isActive
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white'
              : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          ]"
          draggable="true"
          @dragstart="handleDragStart(tab, $event)"
          @dragover.prevent="handleTabDragOver"
          @dragenter.prevent="handleTabDragEnter"
          @dragleave="handleTabDragLeave"
          @drop="handleTabDrop(tab, $event)"
        >
          <!-- 文件类型图标 -->
          <div class="w-4 h-4 mr-2 flex-shrink-0">
            <svg v-if="tab.type === 'editor'" class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <svg v-else-if="tab.type === 'settings'" class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <svg v-else class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          
          <!-- 标签页标题 -->
          <span class="truncate flex-1 text-sm">{{ tab.title }}</span>
          
          <!-- 关闭按钮 / 脏状态指示器 -->
          <button
            @click.stop="handleCloseTab(tab.id)"
            class="ml-2 w-4 h-4 rounded hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-opacity flex-shrink-0"
            :class="tab.isDirty ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
          >
            <!-- 脏状态时显示橙色圆点 -->
            <div v-if="tab.isDirty" class="w-2 h-2 bg-orange-500 rounded-full"></div>
            <!-- 正常状态显示关闭图标 -->
            <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- 组操作按钮 - 固定在右侧 -->
      <div class="flex items-center px-2 border-l border-gray-200 dark:border-gray-700 flex-shrink-0">
        <button
          @click="handleSplitHorizontal"
          class="w-6 h-6 rounded hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center"
          title="水平分割"
          :disabled="group.tabs.length === 0"
          :class="{ 'opacity-50 cursor-not-allowed': group.tabs.length === 0 }"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          @click="handleSplitVertical"
          class="w-6 h-6 rounded hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center ml-1"
          title="垂直分割"
          :disabled="group.tabs.length === 0"
          :class="{ 'opacity-50 cursor-not-allowed': group.tabs.length === 0 }"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- 标签页内容区域 -->
    <div 
      class="tab-content flex-1 overflow-hidden"
      @dragover.prevent="handleDragOver"
      @dragenter.prevent="handleDragEnter"
      @dragleave="handleDragLeave"
      @drop="handleDropToContent"
    >
      <!-- 如果有子组，递归渲染 -->
      <div 
        v-if="group.children && group.children.length > 0"
        class="h-full"
        :class="{
          'flex': group.direction === 'horizontal',
          'flex flex-col': group.direction === 'vertical'
        }"
      >
        <template v-for="(childGroup, index) in group.children" :key="childGroup.id">
          <TabGroup
            :group="childGroup"
            :style="{
              [group.direction === 'horizontal' ? 'width' : 'height']: `${(childGroup.size || 0.5) * 100}%`
            }"
            :class="{
              'border-r border-gray-200 dark:border-gray-700': group.direction === 'horizontal' && index < group.children.length - 1,
              'border-b border-gray-200 dark:border-gray-700': group.direction === 'vertical' && index < group.children.length - 1
            }"
          />
          
          <!-- 分割器 -->
          <div
            v-if="index < group.children.length - 1"
            :class="{
              'cursor-col-resize transition-colors': group.direction === 'horizontal',
              'cursor-row-resize transition-colors': group.direction === 'vertical'
            }"
            :style="{
              width: group.direction === 'horizontal' ? '6px' : '100%',
              height: group.direction === 'vertical' ? '6px' : '100%',
              minWidth: group.direction === 'horizontal' ? '6px' : 'auto',
              minHeight: group.direction === 'vertical' ? '6px' : 'auto',
              maxWidth: group.direction === 'horizontal' ? '6px' : 'none',
              maxHeight: group.direction === 'vertical' ? '6px' : 'none',
              flexShrink: '0',
              flexGrow: '0',
              backgroundColor: '#9ca3af',
              borderRadius: '1px',
              zIndex: '20',
              position: 'relative',
              boxShadow: '0 0 2px rgba(0,0,0,0.1)'
            }"
            @mousedown="startResize(index, $event)"
            @mouseenter="handleResizerHover(true, $event)"
            @mouseleave="handleResizerHover(false, $event)"
          />
        </template>
      </div>
      
      <!-- 如果没有子组，显示标签页内容 -->
      <div v-else-if="activeTabContent" class="h-full">
        <component 
          :is="getTabComponent(activeTabContent.type)"
          v-bind="getTabProps(activeTabContent)"
        />
      </div>
      
      <!-- 空状态 -->
      <div v-else class="h-full flex items-center justify-center">
        <div 
          class="text-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg"
          @dragover.prevent="handleDragOver"
          @dragenter.prevent="handleDragEnter"
          @drop="handleDropToEmpty"
        >
          <div class="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p class="text-gray-500 dark:text-gray-400 text-sm">拖拽标签页到此处</p>
        </div>
      </div>
    </div>
    
    <!-- 保存确认对话框 -->
    <SaveConfirmDialog
      :visible="showSaveDialog"
      :fileName="pendingCloseTab?.title || ''"
      @save="handleSaveAndClose"
      @dontSave="handleDontSaveAndClose"
      @cancel="handleCancelClose"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue';
import { useTabGroupsStore } from '@/stores/tabGroups';
import { useAppStore } from '@/stores/app';
import { TabGroup as TabGroupType } from '@/types/tabGroup';
import SaveConfirmDialog from '@/components/common/SaveConfirmDialog.vue';

// 递归组件声明
const TabGroup = defineAsyncComponent(() => import('./TabGroup.vue'));

// 异步加载组件
const SettingsView = defineAsyncComponent(() => import('@/components/views/SettingsView.vue'));
const MarkdownEditor = defineAsyncComponent(() => import('@/components/editor/MarkdownEditor.vue'));

const props = defineProps<{
  group: TabGroupType;
}>();

const tabGroupsStore = useTabGroupsStore();
const appStore = useAppStore();

// 保存确认对话框状态
const showSaveDialog = ref(false);
const pendingCloseTab = ref<any>(null);

// 计算属性
const isActive = computed(() => {
  return tabGroupsStore.layout.activeGroupId === props.group.id;
});

const activeTabContent = computed(() => {
  if (!props.group.activeTabId) return null;
  return props.group.tabs.find(tab => tab.id === props.group.activeTabId) || null;
});

// 获取标签页对应的组件
const getTabComponent = (type: string) => {
  switch (type) {
    case 'settings':
      return SettingsView;
    case 'editor':
      return MarkdownEditor;
    case 'documents':
      return 'div'; // 占位符组件
    case 'diary':
      return 'div';
    case 'review':
      return 'div';
    case 'search':
      return 'div';
    default:
      return 'div';
  }
};

// 获取标签页组件的 props
const getTabProps = (tab: any) => {
  switch (tab.type) {
    case 'editor':
      return {
        filePath: tab.filePath,
        tabId: tab.id,
      };
    default:
      return {};
  }
};

// 事件处理
const handleGroupClick = () => {
  tabGroupsStore.setActiveGroup(props.group.id);
};

const handleTabClick = (tabId: string) => {
  const tab = props.group.tabs.find(t => t.id === tabId);
  
  // 设置活动标签页
  tabGroupsStore.setActiveTab(tabId, props.group.id);
  
  // 如果点击的是编辑器标签页，自动切换到文档视图
  if (tab?.type === 'editor') {
    appStore.setCurrentView('documents');
  }
};

const handleCloseTab = (tabId: string) => {
  const tab = props.group.tabs.find(t => t.id === tabId);
  if (!tab) return;
  
  // 如果标签页有未保存的更改，显示确认对话框
  if (tab.isDirty && tab.type === 'editor') {
    pendingCloseTab.value = tab;
    showSaveDialog.value = true;
  } else {
    // 直接关闭
    tabGroupsStore.closeTab(tabId);
  }
};

const handleSplitHorizontal = () => {
  tabGroupsStore.splitGroup(props.group.id, { direction: 'horizontal' });
};

const handleSplitVertical = () => {
  tabGroupsStore.splitGroup(props.group.id, { direction: 'vertical' });
};

// 保存确认对话框处理
const handleSaveAndClose = async () => {
  if (!pendingCloseTab.value) return;
  
  try {
    // 触发保存操作
    if (pendingCloseTab.value.type === 'editor') {
      // 这里需要通知编辑器组件保存文件
      // 可以通过事件或者直接调用保存逻辑
      await saveTabContent(pendingCloseTab.value);
    }
    
    // 保存成功后关闭标签页
    tabGroupsStore.closeTab(pendingCloseTab.value.id);
  } catch (error) {
    console.error('Failed to save tab:', error);
    // 这里可以显示错误提示
  } finally {
    showSaveDialog.value = false;
    pendingCloseTab.value = null;
  }
};

const handleDontSaveAndClose = () => {
  if (!pendingCloseTab.value) return;
  
  // 直接关闭，不保存
  tabGroupsStore.closeTab(pendingCloseTab.value.id);
  showSaveDialog.value = false;
  pendingCloseTab.value = null;
};

const handleCancelClose = () => {
  // 取消关闭
  showSaveDialog.value = false;
  pendingCloseTab.value = null;
};

// 保存标签页内容的辅助方法
const saveTabContent = async (tab: any) => {
  if (tab.type === 'editor' && tab.filePath) {
    // 调用 Electron API 保存文件
    await window.electronAPI.writeFile(tab.filePath, tab.content || '');
    
    // 更新标签页状态
    tab.isDirty = false;
    tab.lastModified = new Date();
  }
};

// 滑轮横向滚动处理
const handleWheel = (event: WheelEvent) => {
  const container = event.currentTarget as HTMLElement;
  if (container) {
    event.preventDefault();
    container.scrollLeft += event.deltaY;
  }
};

// 拖拽处理
let dragTimeout: number | null = null;

const handleDragStart = (tab: any, event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify({
      tabId: tab.id,
      sourceGroupId: props.group.id,
    }));
    event.dataTransfer.effectAllowed = 'move';
  }
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  
  // 使用防抖来减少闪烁
  if (dragTimeout) {
    clearTimeout(dragTimeout);
  }
  
  dragTimeout = window.setTimeout(() => {
    // 为整个标签组添加拖拽效果
    const tabGroup = event.currentTarget?.closest('.tab-group') as HTMLElement;
    if (tabGroup && !tabGroup.classList.contains('drag-over')) {
      tabGroup.classList.add('drag-over');
    }
  }, 10);
};

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  
  // 为整个标签组添加拖拽进入效果
  const tabGroup = event.currentTarget?.closest('.tab-group') as HTMLElement;
  if (tabGroup && !tabGroup.classList.contains('drag-enter')) {
    tabGroup.classList.add('drag-enter');
  }
};

const handleDragLeave = (event: DragEvent) => {
  event.stopPropagation();
  
  // 清理超时
  if (dragTimeout) {
    clearTimeout(dragTimeout);
    dragTimeout = null;
  }
  
  // 清理整个标签组的拖拽效果
  const tabGroup = event.currentTarget?.closest('.tab-group') as HTMLElement;
  if (tabGroup) {
    tabGroup.classList.remove('drag-over', 'drag-enter');
  }
};

const handleDrop = (targetTab: any, event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  
  // 清理超时
  if (dragTimeout) {
    clearTimeout(dragTimeout);
    dragTimeout = null;
  }
  
  // 清理整个标签组的拖拽效果
  const tabGroup = event.currentTarget?.closest('.tab-group') as HTMLElement;
  if (tabGroup) {
    tabGroup.classList.remove('drag-over', 'drag-enter');
  }
  
  if (event.dataTransfer) {
    try {
      const data = JSON.parse(event.dataTransfer.getData('application/json'));
      
      // 处理文件树节点拖拽
      if (data.type === 'file-tree-node' && data.nodeType === 'file') {
        // 检查当前组是否已存在相同文件的标签页
        const existingTab = props.group.tabs.find(tab => tab.type === 'editor' && tab.filePath === data.nodePath);
        if (existingTab) {
          // 如果已存在，激活该标签页
          tabGroupsStore.setActiveTab(existingTab.id, props.group.id);
          return;
        }
        
        const targetIndex = props.group.tabs.findIndex(tab => tab.id === targetTab.id);
        
        // 创建新的编辑器标签页
        const newTab = {
          id: `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: data.nodeName,
          type: 'editor',
          filePath: data.nodePath,
          content: '',
          isActive: true,
          isDirty: false,
          lastModified: new Date(),
          metadata: {}
        };
        
        // 添加到当前组的指定位置
        tabGroupsStore.addTabToGroup(newTab, props.group.id);
        return;
      }
      
      // 处理标签页拖拽
      if (data.tabId) {
        const targetIndex = props.group.tabs.findIndex(tab => tab.id === targetTab.id);
        
        if (data.tabId !== targetTab.id) {
          tabGroupsStore.moveTabToGroup(data.tabId, props.group.id, targetIndex);
        }
      }
    } catch (error) {
      console.error('Failed to parse drag data:', error);
    }
  }
};

const handleDropToEmpty = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  
  // 清理超时
  if (dragTimeout) {
    clearTimeout(dragTimeout);
    dragTimeout = null;
  }
  
  // 清理整个标签组的拖拽效果
  const tabGroup = event.currentTarget?.closest('.tab-group') as HTMLElement;
  if (tabGroup) {
    tabGroup.classList.remove('drag-over', 'drag-enter');
  }
  
  if (event.dataTransfer) {
    try {
      const data = JSON.parse(event.dataTransfer.getData('application/json'));
      
      // 处理文件树节点拖拽
      if (data.type === 'file-tree-node' && data.nodeType === 'file') {
        // 检查当前组是否已存在相同文件的标签页
        const existingTab = props.group.tabs.find(tab => tab.type === 'editor' && tab.filePath === data.nodePath);
        if (existingTab) {
          // 如果已存在，激活该标签页
          tabGroupsStore.setActiveTab(existingTab.id, props.group.id);
          return;
        }
        
        // 创建新的编辑器标签页
        const newTab = {
          id: `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: data.nodeName,
          type: 'editor',
          filePath: data.nodePath,
          content: '',
          isActive: true,
          isDirty: false,
          lastModified: new Date(),
          metadata: {}
        };
        
        // 添加到当前组
        tabGroupsStore.addTabToGroup(newTab, props.group.id);
        return;
      }
      
      // 处理标签页拖拽
      if (data.tabId) {
        tabGroupsStore.moveTabToGroup(data.tabId, props.group.id);
      }
    } catch (error) {
      console.error('Failed to parse drag data:', error);
    }
  }
};

const handleDropToContent = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  
  // 清理超时
  if (dragTimeout) {
    clearTimeout(dragTimeout);
    dragTimeout = null;
  }
  
  // 清理标签组的拖拽效果
  const tabGroup = event.currentTarget?.closest('.tab-group') as HTMLElement;
  if (tabGroup) {
    tabGroup.classList.remove('drag-over', 'drag-enter');
  }
  
  if (event.dataTransfer) {
    try {
      const data = JSON.parse(event.dataTransfer.getData('application/json'));
      
      // 处理文件树节点拖拽
      if (data.type === 'file-tree-node' && data.nodeType === 'file') {
        // 检查当前组是否已存在相同文件的标签页
        const existingTab = props.group.tabs.find(tab => tab.type === 'editor' && tab.filePath === data.nodePath);
        if (existingTab) {
          // 如果已存在，激活该标签页
          tabGroupsStore.setActiveTab(existingTab.id, props.group.id);
          return;
        }
        
        // 创建新的编辑器标签页
        const newTab = {
          id: `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: data.nodeName,
          type: 'editor',
          filePath: data.nodePath,
          content: '',
          isActive: true,
          isDirty: false,
          lastModified: new Date(),
          metadata: {}
        };
        
        // 添加到当前组
        tabGroupsStore.addTabToGroup(newTab, props.group.id);
        return;
      }
      
      // 处理标签页拖拽
      if (data.tabId) {
        tabGroupsStore.moveTabToGroup(data.tabId, props.group.id);
      }
    } catch (error) {
      console.error('Failed to parse drag data:', error);
    }
  }
};

const handleTabContextMenu = (tab: any, event: MouseEvent) => {
  // TODO: 实现右键菜单
  console.log('Tab context menu:', tab, event);
};

// 标签条专用的拖拽处理函数
const handleTabDragOver = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  
  // 为整个标签组添加拖拽效果
  const tabGroup = event.currentTarget?.closest('.tab-group') as HTMLElement;
  if (tabGroup && !tabGroup.classList.contains('drag-over')) {
    tabGroup.classList.add('drag-over');
  }
};

const handleTabDragEnter = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  
  // 为整个标签组添加拖拽进入效果
  const tabGroup = event.currentTarget?.closest('.tab-group') as HTMLElement;
  if (tabGroup && !tabGroup.classList.contains('drag-enter')) {
    tabGroup.classList.add('drag-enter');
  }
};

const handleTabDragLeave = (event: DragEvent) => {
  event.stopPropagation();
  
  // 清理超时
  if (dragTimeout) {
    clearTimeout(dragTimeout);
    dragTimeout = null;
  }
  
  // 清理标签组的拖拽效果
  const tabGroup = event.currentTarget?.closest('.tab-group') as HTMLElement;
  if (tabGroup) {
    tabGroup.classList.remove('drag-over', 'drag-enter');
  }
};

const handleTabDrop = (targetTab: any, event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  
  // 清理超时
  if (dragTimeout) {
    clearTimeout(dragTimeout);
    dragTimeout = null;
  }
  
  // 清理标签组的拖拽效果
  const tabGroup = event.currentTarget?.closest('.tab-group') as HTMLElement;
  if (tabGroup) {
    tabGroup.classList.remove('drag-over', 'drag-enter');
  }
  
  if (event.dataTransfer) {
    try {
      const data = JSON.parse(event.dataTransfer.getData('application/json'));
      
      // 处理文件树节点拖拽
      if (data.type === 'file-tree-node' && data.nodeType === 'file') {
        // 检查当前组是否已存在相同文件的标签页
        const existingTab = props.group.tabs.find(tab => tab.type === 'editor' && tab.filePath === data.nodePath);
        if (existingTab) {
          // 如果已存在，激活该标签页
          tabGroupsStore.setActiveTab(existingTab.id, props.group.id);
          return;
        }
        
        const targetIndex = props.group.tabs.findIndex(tab => tab.id === targetTab.id);
        
        // 创建新的编辑器标签页
        const newTab = {
          id: `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: data.nodeName,
          type: 'editor',
          filePath: data.nodePath,
          content: '',
          isActive: true,
          isDirty: false,
          lastModified: new Date(),
          metadata: {}
        };
        
        // 添加到当前组的指定位置
        tabGroupsStore.addTabToGroup(newTab, props.group.id);
        return;
      }
      
      // 处理标签页拖拽
      if (data.tabId) {
        const targetIndex = props.group.tabs.findIndex(tab => tab.id === targetTab.id);
        
        if (data.tabId !== targetTab.id) {
          tabGroupsStore.moveTabToGroup(data.tabId, props.group.id, targetIndex);
        }
      }
    } catch (error) {
      console.error('Failed to parse drag data:', error);
    }
  }
};

// 标签头部的拖拽处理函数
const handleTabHeaderDragOver = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  
  // 为整个标签组添加拖拽效果
  const tabGroup = event.currentTarget?.closest('.tab-group') as HTMLElement;
  if (tabGroup && !tabGroup.classList.contains('drag-over')) {
    tabGroup.classList.add('drag-over');
  }
};

const handleTabHeaderDragEnter = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  
  // 为整个标签组添加拖拽进入效果
  const tabGroup = event.currentTarget?.closest('.tab-group') as HTMLElement;
  if (tabGroup && !tabGroup.classList.contains('drag-enter')) {
    tabGroup.classList.add('drag-enter');
  }
};

const handleTabHeaderDragLeave = (event: DragEvent) => {
  event.stopPropagation();
  
  // 清理超时
  if (dragTimeout) {
    clearTimeout(dragTimeout);
    dragTimeout = null;
  }
  
  // 清理标签组的拖拽效果
  const tabGroup = event.currentTarget?.closest('.tab-group') as HTMLElement;
  if (tabGroup) {
    tabGroup.classList.remove('drag-over', 'drag-enter');
  }
};

const handleTabHeaderDrop = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  
  // 清理超时
  if (dragTimeout) {
    clearTimeout(dragTimeout);
    dragTimeout = null;
  }
  
  // 清理标签组的拖拽效果
  const tabGroup = event.currentTarget?.closest('.tab-group') as HTMLElement;
  if (tabGroup) {
    tabGroup.classList.remove('drag-over', 'drag-enter');
  }
  
  if (event.dataTransfer) {
    try {
      const data = JSON.parse(event.dataTransfer.getData('application/json'));
      
      // 处理文件树节点拖拽
      if (data.type === 'file-tree-node' && data.nodeType === 'file') {
        // 检查当前组是否已存在相同文件的标签页
        const existingTab = props.group.tabs.find(tab => tab.type === 'editor' && tab.filePath === data.nodePath);
        if (existingTab) {
          // 如果已存在，激活该标签页
          tabGroupsStore.setActiveTab(existingTab.id, props.group.id);
          return;
        }
        
        // 创建新的编辑器标签页
        const newTab = {
          id: `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: data.nodeName,
          type: 'editor',
          filePath: data.nodePath,
          content: '',
          isActive: true,
          isDirty: false,
          lastModified: new Date(),
          metadata: {}
        };
        
        // 添加到当前组
        tabGroupsStore.addTabToGroup(newTab, props.group.id);
        return;
      }
      
      // 处理标签页拖拽
      if (data.tabId) {
        tabGroupsStore.moveTabToGroup(data.tabId, props.group.id);
      }
    } catch (error) {
      console.error('Failed to parse drag data:', error);
    }
  }
};

// 分区大小调整
let isResizing = false;
let resizeIndex = -1;
let startPos = 0;
let startSizes: number[] = [];
let containerElement: HTMLElement | null = null;

const startResize = (index: number, event: MouseEvent) => {
  if (!props.group.children || props.group.children.length <= 1) return;
  
  // 找到容器元素
  containerElement = (event.target as HTMLElement).closest('.tab-group')?.querySelector('.tab-content') as HTMLElement;
  if (!containerElement) return;
  
  isResizing = true;
  resizeIndex = index;
  startPos = props.group.direction === 'horizontal' ? event.clientX : event.clientY;
  startSizes = props.group.children.map(child => child.size || 0.5);
  
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = props.group.direction === 'horizontal' ? 'col-resize' : 'row-resize';
  document.body.style.userSelect = 'none';
  
  event.preventDefault();
  event.stopPropagation();
};

const handleResize = (event: MouseEvent) => {
  if (!isResizing || !props.group.children || resizeIndex < 0 || !containerElement) return;
  
  const currentPos = props.group.direction === 'horizontal' ? event.clientX : event.clientY;
  const delta = currentPos - startPos;
  
  // 获取容器尺寸
  const containerSize = props.group.direction === 'horizontal' 
    ? containerElement.clientWidth 
    : containerElement.clientHeight;
    
  if (containerSize === 0) return;
  
  // 计算相对变化 (使用更小的敏感度)
  const deltaRatio = delta / containerSize * 0.5; // 降低敏感度
  updateChildSizes(deltaRatio);
};

const updateChildSizes = (deltaRatio: number) => {
  if (!props.group.children || resizeIndex < 0) return;
  
  // 更新相邻两个分区的大小
  const leftChild = props.group.children[resizeIndex];
  const rightChild = props.group.children[resizeIndex + 1];
  
  if (leftChild && rightChild) {
    const newLeftSize = Math.max(0.1, Math.min(0.9, startSizes[resizeIndex] + deltaRatio));
    const newRightSize = Math.max(0.1, Math.min(0.9, startSizes[resizeIndex + 1] - deltaRatio));
    
    // 确保总和为原来的总和
    const totalOriginal = startSizes[resizeIndex] + startSizes[resizeIndex + 1];
    const totalNew = newLeftSize + newRightSize;
    
    if (totalNew > 0) {
      const ratio = totalOriginal / totalNew;
      leftChild.size = newLeftSize * ratio;
      rightChild.size = newRightSize * ratio;
    }
  }
};

const stopResize = () => {
  if (!isResizing) return;
  
  isResizing = false;
  resizeIndex = -1;
  startPos = 0;
  startSizes = [];
  containerElement = null;
  
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
};

// 处理拖拽条悬停效果
const handleResizerHover = (isHover: boolean, event?: MouseEvent) => {
  if (event) {
    const target = event.target as HTMLElement;
    if (isHover) {
      target.style.backgroundColor = '#3b82f6'; // blue-500
      target.style.boxShadow = '0 0 4px rgba(59, 130, 246, 0.5)';
    } else {
      target.style.backgroundColor = '#9ca3af'; // gray-400
      target.style.boxShadow = '0 0 2px rgba(0,0,0,0.1)';
    }
  }
};
</script>

<style scoped>
.tab-group {
  position: relative;
}

.tab-header {
  flex-shrink: 0;
}

.tab-content {
  flex: 1;
  overflow: hidden;
}

/* 自定义滚动条样式 */
.scrollbar-thin::-webkit-scrollbar {
  height: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 2px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.8);
}

.dark .scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: rgba(75, 85, 99, 0.5);
}

.dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: rgba(75, 85, 99, 0.8);
}

/* 确保拖拽条不会被压缩 */
.tab-group [style*="cursor-col-resize"],
.tab-group [style*="cursor-row-resize"] {
  flex-shrink: 0 !important;
  flex-grow: 0 !important;
  min-width: 6px !important;
  min-height: 6px !important;
}

/* 拖拽条样式增强 */
.tab-group [style*="backgroundColor"]:hover {
  transition: all 0.2s ease;
}

/* 拖拽效果样式 - 标签组整体效果 */
.tab-group.drag-over {
  background-color: rgba(59, 130, 246, 0.08) !important;
  border: 2px dashed #3b82f6 !important;
  position: relative;
  z-index: 10;
  transition: all 0.15s ease;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
}

.tab-group.drag-enter {
  background-color: rgba(59, 130, 246, 0.12) !important;
  border: 2px solid #3b82f6 !important;
  position: relative;
  z-index: 10;
  transition: all 0.15s ease;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
}

/* 标签条区域的拖拽效果 */
.tab-group .tab-header.drag-over,
.tab-group .tab-header.drag-enter {
  background-color: rgba(59, 130, 246, 0.15) !important;
  border-bottom: 2px solid #3b82f6 !important;
}

/* 标签页内容的拖拽效果 */
.tab-group .tab-content.drag-over,
.tab-group .tab-content.drag-enter {
  background-color: rgba(59, 130, 246, 0.05) !important;
  border: 1px dashed #3b82f6 !important;
}

/* 单个标签页的拖拽效果 */
.tab-group [draggable="true"].drag-over,
.tab-group [draggable="true"].drag-enter {
  background-color: rgba(59, 130, 246, 0.2) !important;
  border: 2px solid #3b82f6 !important;
  transform: scale(1.02);
}

/* 标签页拖拽时的样式 */
.tab-group [draggable="true"]:active {
  opacity: 0.7;
  /* 移除旋转效果 */
}
</style>
