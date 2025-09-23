<template>
  <div class="markdown-editor h-full flex flex-col">
    <!-- 工具栏 -->
    <div class="editor-toolbar bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-2">
      <button
        @click="saveFile"
        :disabled="!editorService.state.isDirty"
        class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        保存 (Ctrl+S)
      </button>
      
      <div class="flex-1"></div>
      
      <div class="text-sm text-gray-600 dark:text-gray-400">
        <span v-if="editorService.state.lastSaved">
          最后保存: {{ formatTime(editorService.state.lastSaved) }}
        </span>
        <span v-else class="text-red-500">未保存</span>
      </div>
    </div>

    <!-- 编辑器容器 -->
    <div class="editor-container flex-1 relative">
      <div
        ref="editorContainer"
        class="h-full w-full"
        :class="{ 'opacity-50': isLoading }"
      ></div>
      
      <!-- 加载状态 -->
      <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 bg-opacity-75">
        <div class="text-gray-600 dark:text-gray-400">加载中...</div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { createEditorService } from '@/services/editorService';
import { useTabGroupsStore } from '@/stores/tabGroups';

const props = defineProps<{
  filePath?: string;
  tabId?: string;
}>();

const emit = defineEmits<{
  save: [filePath: string, content: string];
  close: [];
}>();

const editorContainer = ref<HTMLElement>();
const isLoading = ref(false);

const tabGroupsStore = useTabGroupsStore();

// 为每个编辑器创建独立的服务实例
const editorService = createEditorService();

// 计算属性
const formatTime = (date: Date) => {
  return date.toLocaleTimeString();
};

// 初始化编辑器
const initEditor = async () => {
  if (!editorContainer.value) return;
  
  try {
    isLoading.value = true;
    
    // 初始化编辑器
    editorService.initEditor(editorContainer.value);
    
    // 如果提供了文件路径，加载文件
    if (props.filePath) {
      console.log('Loading file in editor:', props.filePath);
      await loadFile(props.filePath);
    } else {
      // 如果没有文件路径，设置默认内容
      console.log('Setting default content for new editor');
      editorService.setContent('# 新文档\n\n开始编写您的内容...', '');
    }
    
    // 监听编辑器变化
    const editorView = editorService.getEditorView();
    if (editorView) {
      editorView.dispatch({
        selection: { anchor: 0, head: 0 }
      });
    }
    
  } catch (error) {
    console.error('Error initializing editor:', error);
  } finally {
    isLoading.value = false;
  }
};

// 加载文件
const loadFile = async (filePath: string) => {
  try {
    isLoading.value = true;
    const success = await editorService.loadFile(filePath);
    if (success) {
      // 更新标签页状态，使用editorService的脏状态
      if (props.tabId) {
        updateTabState(editorService.getContent(), editorService.state.isDirty);
      }
    }
  } catch (error) {
    console.error('Error loading file:', error);
  } finally {
    isLoading.value = false;
  }
};

// 保存文件
const saveFile = async () => {
  try {
    const success = await editorService.saveFile();
    if (success) {
      // 更新标签页状态
      if (props.tabId) {
        updateTabState(editorService.getContent(), false);
      }
      
      emit('save', editorService.state.filePath, editorService.getContent());
    }
  } catch (error) {
    console.error('Error saving file:', error);
  }
};

// 键盘快捷键
const handleKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault();
    saveFile();
  }
};

// 监听内容变化
watch(() => editorService.state.content, (newContent) => {
  // 直接更新标签页状态
  if (props.tabId) {
    updateTabState(newContent, editorService.state.isDirty);
  }
});

// 监听脏状态变化
watch(() => editorService.state.isDirty, (isDirty) => {
  if (props.tabId) {
    updateTabState(editorService.state.content, isDirty);
  }
});

// 更新标签页状态的辅助函数
const updateTabState = (content: string, isDirty: boolean) => {
  // 遍历所有组查找当前标签页
  for (const [groupId, group] of tabGroupsStore.layout.groups) {
    const tab = group.tabs.find(t => t.id === props.tabId);
    if (tab) {
      // 直接更新标签页对象的属性
      tab.content = content;
      tab.isDirty = isDirty;
      tab.lastModified = new Date();
      console.log(`Updated tab ${props.tabId} - isDirty: ${isDirty}`);
      break;
    }
  }
};

// 监听文件路径变化
watch(() => props.filePath, (newFilePath) => {
  if (newFilePath && newFilePath !== editorService.state.filePath) {
    console.log('File path changed, loading file:', newFilePath);
    loadFile(newFilePath);
  }
}, { immediate: true });

onMounted(() => {
  initEditor();
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  editorService.destroy();
});
</script>

<style scoped>
.markdown-editor {
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
}

.editor-container {
  overflow: hidden;
}

/* CodeMirror 样式覆盖 */
:deep(.cm-editor) {
  height: 100%;
  font-size: 14px;
}

:deep(.cm-focused) {
  outline: none;
}

:deep(.cm-scroller) {
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
}
</style>
