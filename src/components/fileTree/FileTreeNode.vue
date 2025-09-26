<template>
  <div class="file-tree-node">
    <!-- 节点内容 -->
    <div
      :class="[
        'file-tree-node-content flex items-center py-1 px-2 rounded cursor-pointer transition-colors',
        {
          'bg-blue-100 dark:bg-blue-900': node.isSelected,
          'hover:bg-gray-100 dark:hover:bg-gray-700': !node.isSelected
        }
      ]"
      :style="{ paddingLeft: `${level * 16 + 8}px` }"
      @click="handleNodeClick"
      draggable="true"
      @dragstart="handleDragStart"
      @dragover.prevent="handleDragOver"
      @dragenter.prevent="handleDragEnter"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @dragend="handleDragEnd"
      @contextmenu="handleContextMenu"
    >
      <!-- 展开/折叠图标 -->
      <div class="flex items-center mr-1">
        <button
          v-if="node.type === 'folder'"
          @click.stop="handleToggle"
          class="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
        >
          <svg
            :class="{ 'rotate-90': isExpanded }"
            class="w-3 h-3 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
        <div v-else class="w-4 h-4"></div>
      </div>

      <!-- 文件/文件夹图标 -->
      <div class="flex items-center mr-2">
        <svg
          v-if="node.type === 'folder'"
          class="w-4 h-4 text-yellow-500"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
        </svg>
        <svg
          v-else-if="getFileIcon(node.extension)"
          class="w-4 h-4"
          :class="getFileIconColor(node.extension)"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path :d="getFileIcon(node.extension)"/>
        </svg>
        <svg
          v-else
          class="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>

      <!-- 文件名 -->
      <div class="flex-1">
        <!-- 编辑模式 -->
        <input
          v-if="isEditing"
          ref="editInputRef"
          v-model="editValue"
          @blur="handleEditConfirm"
          @keydown.enter.prevent="handleEditConfirm"
          @keydown.escape="handleEditCancel"
          class="w-full text-sm bg-transparent border border-blue-500 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          :class="{
            'text-gray-900 dark:text-white': node.isSelected,
            'text-gray-700 dark:text-gray-300': !node.isSelected
          }"
        />
        <!-- 显示模式 -->
        <span
          v-else
          :class="[
            'text-sm truncate block',
            {
              'text-gray-900 dark:text-white': node.isSelected,
              'text-gray-700 dark:text-gray-300': !node.isSelected
            }
          ]"
        >
          {{ node.name }}
        </span>
      </div>

      <!-- 文件大小（仅文件显示） -->
      <span
        v-if="node.type === 'file' && node.size"
        class="text-xs text-gray-500 dark:text-gray-400 ml-2"
      >
        {{ formatFileSize(node.size) }}
      </span>
    </div>

    <!-- 子节点 -->
    <div v-if="node.type === 'folder' && isExpanded && node.children" class="file-tree-children">
      <FileTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        @select="$emit('select', $event)"
        @toggle="$emit('toggle', $event)"
        @delete="$emit('delete', $event)"
        @rename="$emit('rename', $event, $event)"
        @start-edit="$emit('start-edit', $event)"
        @open="$emit('open', $event)"
        @drag-start="$emit('drag-start', $event, $event)"
        @drag-over="$emit('drag-over', $event, $event)"
        @drag-enter="$emit('drag-enter', $event, $event)"
        @drop="$emit('drop', $event, $event)"
      />
    </div>

    <!-- 右键菜单 -->
    <ContextMenu
      :visible="contextMenuVisible"
      :position="contextMenuPosition"
      :items="contextMenuItems"
      @close="contextMenuVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import type { FileTreeNode } from '../../types/fileTree';
import ContextMenu from '../common/ContextMenu.vue';
import type { ContextMenuItem } from '../common/ContextMenu.vue';

interface Props {
  node: FileTreeNode;
  level: number;
}

interface Emits {
  (e: 'select', nodeId: string): void;
  (e: 'toggle', nodeId: string): void;
  (e: 'delete', nodeId: string): void;
  (e: 'rename', nodeId: string, newName: string): void;
  (e: 'start-edit', nodeId: string): void;
  (e: 'open', nodeId: string): void;
  (e: 'drag-start', nodeId: string, event: DragEvent): void;
  (e: 'drag-over', nodeId: string, event: DragEvent): void;
  (e: 'drag-enter', nodeId: string, event: DragEvent): void;
  (e: 'drop', nodeId: string, event: DragEvent): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 编辑状态
const isEditing = ref(false);
const editValue = ref('');
const editInputRef = ref<HTMLInputElement>();

// 计算是否展开
const isExpanded = computed(() => {
  // 直接使用节点的展开状态
  return props.node.isExpanded || false;
});

// 监听编辑状态变化
watch(() => props.node.isEditing, (newValue) => {
  if (newValue) {
    isEditing.value = true;
    editValue.value = props.node.name;
    nextTick(() => {
      editInputRef.value?.focus();
      editInputRef.value?.select();
    });
  } else {
    isEditing.value = false;
  }
}, { immediate: true });

// 监听节点名称变化
watch(() => props.node.name, (newName) => {
  if (!isEditing.value) {
    editValue.value = newName;
  }
});

// 处理节点点击
const handleNodeClick = () => {
  // 如果是文件夹，点击整行都展开/折叠
  if (props.node.type === 'folder') {
    emit('toggle', props.node.id);
  } else if (props.node.type === 'file') {
    // 如果是文件，发出打开事件
    emit('open', props.node.id);
  }
  emit('select', props.node.id);
};

// 处理展开/折叠
const handleToggle = () => {
  emit('toggle', props.node.id);
};

// 处理编辑确认
const handleEditConfirm = () => {
  if (isEditing.value && editValue.value.trim() && editValue.value.trim() !== props.node.name) {
    console.log('Confirming rename:', props.node.name, '->', editValue.value.trim());
    emit('rename', props.node.id, editValue.value.trim());
    // 立即设置为非编辑状态，防止重复触发
    isEditing.value = false;
    if (props.node.isEditing) {
      props.node.isEditing = false;
    }
  } else {
    isEditing.value = false;
    if (props.node.isEditing) {
      props.node.isEditing = false;
    }
  }
};

// 处理编辑取消
const handleEditCancel = () => {
  editValue.value = props.node.name;
  isEditing.value = false;
  // 更新节点的编辑状态
  if (props.node.isEditing) {
    props.node.isEditing = false;
  }
};

// 获取文件图标
const getFileIcon = (extension: string | undefined): string => {
  if (!extension) return '';
  
  const iconMap: Record<string, string> = {
    md: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    txt: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    js: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    ts: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    vue: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    json: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  };
  
  return iconMap[extension] || '';
};

// 获取文件图标颜色
const getFileIconColor = (extension: string | undefined): string => {
  if (!extension) return 'text-gray-400';
  
  const colorMap: Record<string, string> = {
    md: 'text-blue-500',
    txt: 'text-gray-500',
    js: 'text-yellow-500',
    ts: 'text-blue-600',
    vue: 'text-green-500',
    json: 'text-orange-500'
  };
  
  return colorMap[extension] || 'text-gray-400';
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// 拖拽事件处理
const handleDragStart = (event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: 'file-tree-node',
      nodeId: props.node.id,
      nodeType: props.node.type,
      nodeName: props.node.name,
      nodePath: props.node.path
    }));
    event.dataTransfer.effectAllowed = 'move';
  }
  
  // 添加拖拽开始时的视觉反馈
  const target = event.currentTarget as HTMLElement;
  if (target) {
    target.classList.add('dragging');
  }
  
  emit('drag-start', props.node.id, event);
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
  
  // 添加拖拽悬停效果
  const target = event.currentTarget as HTMLElement;
  if (target && !target.classList.contains('drag-over')) {
    target.classList.add('drag-over');
  }
  
  emit('drag-over', props.node.id, event);
};

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault();
  
  // 添加拖拽进入效果
  const target = event.currentTarget as HTMLElement;
  if (target && !target.classList.contains('drag-enter')) {
    target.classList.add('drag-enter');
  }
  
  emit('drag-enter', props.node.id, event);
};

const handleDragLeave = (event: DragEvent) => {
  // 清理拖拽效果
  const target = event.currentTarget as HTMLElement;
  if (target) {
    target.classList.remove('drag-over', 'drag-enter');
  }
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  
  // 清理拖拽效果
  const target = event.currentTarget as HTMLElement;
  if (target) {
    target.classList.remove('drag-over', 'drag-enter');
  }
  
  emit('drop', props.node.id, event);
};

// 拖拽结束时的清理
const handleDragEnd = (event: DragEvent) => {
  const target = event.currentTarget as HTMLElement;
  if (target) {
    target.classList.remove('dragging', 'drag-over', 'drag-enter');
  }
};

// 右键菜单相关
const contextMenuVisible = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });

// 右键菜单处理
const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  
  contextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY
  };
  contextMenuVisible.value = true;
};

// 右键菜单项
const contextMenuItems = computed((): ContextMenuItem[] => {
  const items: ContextMenuItem[] = [];
  
  if (props.node.type === 'folder') {
    // 文件夹菜单
    items.push(
      {
        label: '新建文件',
        icon: '📄',
        action: () => createNewFile()
      },
      {
        label: '新建文件夹',
        icon: '📁',
        action: () => createNewFolder()
      },
      { separator: true },
      {
        label: '重命名',
        icon: '✏️',
        shortcut: 'F2',
        action: () => startEdit()
      },
      {
        label: '删除',
        icon: '🗑️',
        danger: true,
        action: () => deleteNode()
      },
      { separator: true },
      {
        label: '复制路径',
        icon: '📋',
        action: () => copyPath()
      },
      {
        label: '在文件管理器中显示',
        icon: '📂',
        action: () => showInExplorer()
      }
    );
  } else {
    // 文件菜单
    items.push(
      {
        label: '打开',
        icon: '👁️',
        shortcut: 'Enter',
        action: () => openFile()
      },
      { separator: true },
      {
        label: '重命名',
        icon: '✏️',
        shortcut: 'F2',
        action: () => startEdit()
      },
      {
        label: '删除',
        icon: '🗑️',
        danger: true,
        action: () => deleteNode()
      },
      { separator: true },
      {
        label: '复制路径',
        icon: '📋',
        action: () => copyPath()
      },
      {
        label: '在文件管理器中显示',
        icon: '📂',
        action: () => showInExplorer()
      }
    );
  }
  
  return items;
});

// 菜单项动作
const createNewFile = () => {
  // 这里需要实现新建文件逻辑
  console.log('创建新文件');
};

const createNewFolder = () => {
  // 这里需要实现新建文件夹逻辑
  console.log('创建新文件夹');
};

const openFile = () => {
  emit('open', props.node.id);
};

const startEdit = () => {
  emit('start-edit', props.node.id);
};

const deleteNode = () => {
  if (confirm(`确定要删除 "${props.node.name}" 吗？`)) {
    emit('delete', props.node.id);
  }
};

const copyPath = async () => {
  try {
    await navigator.clipboard.writeText(props.node.path);
    console.log('路径已复制到剪贴板');
  } catch (error) {
    console.error('复制路径失败:', error);
  }
};

const showInExplorer = async () => {
  try {
    const success = await window.electronAPI.showFileInExplorer(props.node.path);
    if (success) {
      console.log('文件已在文件管理器中显示:', props.node.path);
    } else {
      console.error('无法在文件管理器中显示文件');
    }
  } catch (error) {
    console.error('显示文件失败:', error);
  }
};
</script>

<style scoped>
/* 文件树拖拽效果样式 */
.file-tree-node-content.dragging {
  opacity: 0.6;
  transform: scale(0.98);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  background-color: rgba(59, 130, 246, 0.1);
  border: 2px dashed #3b82f6;
  transition: all 0.2s ease;
}

.file-tree-node-content.drag-over {
  background-color: rgba(59, 130, 246, 0.15);
  border: 2px dashed #3b82f6;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
  transition: all 0.15s ease;
}

.file-tree-node-content.drag-enter {
  background-color: rgba(59, 130, 246, 0.2);
  border: 2px solid #3b82f6;
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
  transition: all 0.15s ease;
}
</style>
