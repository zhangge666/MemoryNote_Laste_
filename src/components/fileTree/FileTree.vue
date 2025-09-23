<template>
  <div class="file-tree h-full flex flex-col">
    <!-- 文件树头部 -->
    <div class="file-tree-header border-b border-gray-200 dark:border-gray-700 p-3">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium text-gray-900 dark:text-white">文档列表</h3>
        <div class="flex items-center space-x-1">
          <!-- 刷新按钮 -->
          <button
            @click="handleRefresh"
            :disabled="state.loading"
            class="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="刷新"
          >
            <svg
              :class="{ 'animate-spin': state.loading }"
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          
          <!-- 新建文件夹按钮 -->
          <button
            @click="handleCreateFolderInline"
            class="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="新建文件夹"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
          
          <!-- 新建文件按钮 -->
          <button
            @click="handleCreateFileInline"
            class="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="新建文件"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 文件树内容 -->
    <div class="file-tree-content flex-1 overflow-y-auto">
      <div v-if="state.loading" class="p-4 text-center text-gray-500 dark:text-gray-400">
        <div class="animate-spin w-6 h-6 mx-auto mb-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        加载中...
      </div>

      <div v-else-if="state.error" class="p-4 text-center text-red-500">
        <div class="mb-2">
          <svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p class="text-sm">{{ state.error }}</p>
        <button
          @click="handleRefresh"
          class="mt-2 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
        >
          重试
        </button>
      </div>

      <div v-else-if="state.nodes.length === 0" class="p-4 text-center text-gray-500 dark:text-gray-400">
        <div class="mb-2">
          <svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p class="text-sm">暂无文件</p>
      </div>

      <div v-else class="p-2">
        <FileTreeNode
          v-for="node in state.nodes"
          :key="node.id"
          :node="node"
          :level="0"
          @select="handleSelectNode"
          @toggle="handleToggleNode"
          @create-file="handleCreateFileInNode"
          @create-folder="handleCreateFolderInNode"
          @delete="handleDeleteNode"
          @rename="handleRenameNode"
          @start-edit="handleStartEdit"
          @open="handleOpenFile"
          @drag-start="handleDragStart"
          @drag-over="handleDragOver"
          @drag-enter="handleDragEnter"
          @drop="handleDrop"
        />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { fileTreeService } from '../../services/fileTreeService';
import FileTreeNode from './FileTreeNode.vue';

// 定义事件
const emit = defineEmits<{
  'open-file': [filePath: string, fileName: string];
}>();

// 获取文件树状态
const state = fileTreeService.getState();


// 组件挂载时加载文件树
onMounted(async () => {
  await fileTreeService.loadFileTree();
});

// 刷新文件树
const handleRefresh = async () => {
  await fileTreeService.refresh();
};

// 内联创建文件 - 强制重新编译
const handleCreateFileInline = async () => {
  try {
    console.log('Creating file inline...');
    const nodeId = await fileTreeService.createFileInline();
    console.log('File created with ID:', nodeId);
    if (nodeId) {
      console.log('File created successfully');
    } else {
      console.log('File creation failed - no node ID returned');
    }
  } catch (error) {
    console.error('Error creating file inline:', error);
    alert('创建文件失败');
  }
};

// 内联创建文件夹
const handleCreateFolderInline = async () => {
  try {
    console.log('Creating folder inline...');
    const nodeId = await fileTreeService.createFolderInline();
    console.log('Folder created with ID:', nodeId);
    if (nodeId) {
      console.log('Folder created successfully');
    } else {
      console.log('Folder creation failed - no node ID returned');
    }
  } catch (error) {
    console.error('Error creating folder inline:', error);
    alert('创建文件夹失败');
  }
};


// 选择节点
const handleSelectNode = (nodeId: string) => {
  fileTreeService.selectNode(nodeId);
};

// 切换节点展开状态
const handleToggleNode = (nodeId: string) => {
  fileTreeService.toggleNode(nodeId);
};

// 在指定节点下创建文件
const handleCreateFileInNode = async (parentPath: string) => {
  await fileTreeService.createFileInline(parentPath);
};

// 在指定节点下创建文件夹
const handleCreateFolderInNode = async (parentPath: string) => {
  await fileTreeService.createFolderInline(parentPath);
};

// 删除节点
const handleDeleteNode = async (nodeId: string) => {
  const node = fileTreeService.findNode(nodeId);
  if (node && confirm(`确定要删除 "${node.name}" 吗？`)) {
    const success = await fileTreeService.deleteNode(nodeId);
    if (!success) {
      alert('删除失败');
    }
  }
};


// 处理重命名
const handleRenameNode = async (nodeId: string, newName: string) => {
  try {
    const success = await fileTreeService.renameNode(nodeId, newName);
    if (!success) {
      alert('重命名失败');
    }
  } catch (error) {
    console.error('Error renaming node:', error);
    alert('重命名失败');
  }
};

// 处理开始编辑
const handleStartEdit = (nodeId: string) => {
  const node = fileTreeService.findNode(nodeId);
  if (node) {
    node.isEditing = true;
  }
};

// 处理打开文件
const handleOpenFile = (nodeId: string) => {
  const node = fileTreeService.findNode(nodeId);
  if (node && node.type === 'file' && node.path) {
    // 发出打开文件事件，让父组件处理
    emit('open-file', node.path, node.name);
  }
};

// 拖拽事件处理
const handleDragStart = (nodeId: string, event: DragEvent) => {
  console.log('File tree drag start:', nodeId);
};

const handleDragOver = (nodeId: string, event: DragEvent) => {
  console.log('File tree drag over:', nodeId);
};

const handleDragEnter = (nodeId: string, event: DragEvent) => {
  console.log('File tree drag enter:', nodeId);
};

const handleDrop = async (nodeId: string, event: DragEvent) => {
  console.log('File tree drop:', nodeId);
  
  if (event.dataTransfer) {
    try {
      const data = JSON.parse(event.dataTransfer.getData('application/json'));
      
      // 处理文件树节点拖拽重排序
      if (data.type === 'file-tree-node' && data.nodeId !== nodeId) {
        const targetNode = fileTreeService.findNode(nodeId);
        const sourceNode = fileTreeService.findNode(data.nodeId);
        
        if (targetNode && sourceNode) {
          // 如果拖拽到文件夹上，移动到该文件夹内
          if (targetNode.type === 'folder') {
            const success = await fileTreeService.moveNode(data.nodeId, nodeId);
            if (success) {
              console.log('File moved successfully');
            } else {
              console.error('Failed to move file');
            }
          } else {
            // 如果拖拽到文件上，移动到同一父目录并重新排序
            let parentNodeId = targetNode.parent;
            
            // 如果目标节点没有父节点（即根目录），使用空字符串
            if (!parentNodeId) {
              parentNodeId = '';
            }
            
            const parentNode = parentNodeId ? fileTreeService.findNode(parentNodeId) : null;
            if (parentNode && parentNode.children) {
              const targetIndex = parentNode.children.findIndex(child => child.id === nodeId);
              if (targetIndex !== -1) {
                const success = await fileTreeService.moveNode(data.nodeId, parentNodeId, targetIndex);
                if (success) {
                  console.log('File reordered successfully');
                } else {
                  console.error('Failed to reorder file');
                }
              }
            } else if (!parentNodeId) {
              // 处理拖拽到根目录的情况
              const success = await fileTreeService.moveNode(data.nodeId, '', 0);
              if (success) {
                console.log('File moved to root successfully');
              } else {
                console.error('Failed to move file to root');
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse drag data:', error);
    }
  }
};
</script>
