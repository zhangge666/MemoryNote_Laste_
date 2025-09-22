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
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import type { FileTreeNode } from '../../types/fileTree';

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
</script>
