<template>
  <div class="markdown-editor h-full flex flex-col">
    <!-- 工具栏 -->
    <div class="editor-toolbar bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <!-- 主要工具栏 -->
      <div class="px-4 py-2 flex items-center gap-2">
        <button
          @click="saveFile"
          :disabled="!editorService.state.isDirty"
          class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          保存 (Ctrl+S)
        </button>
        
        <div class="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
        
        <!-- Markdown 语法工具栏 -->
        <div class="flex items-center gap-1">
          <!-- 标题 -->
          <div class="relative group">
            <button
              @click="insertHeading(1)"
              class="p-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="一级标题 (Ctrl+1)"
            >
              H1
            </button>
            <button
              @click="insertHeading(2)"
              class="p-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="二级标题 (Ctrl+2)"
            >
              H2
            </button>
            <button
              @click="insertHeading(3)"
              class="p-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="三级标题 (Ctrl+3)"
            >
              H3
            </button>
          </div>
          
          <div class="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
          
          <!-- 文本格式 -->
          <button
            @click="toggleBold"
            class="p-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="加粗 (Ctrl+B)"
          >
            B
          </button>
          <button
            @click="toggleItalic"
            class="p-2 text-sm italic text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="斜体 (Ctrl+I)"
          >
            I
          </button>
          <button
            @click="toggleStrikethrough"
            class="p-2 text-sm line-through text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="删除线"
          >
            S
          </button>
          <button
            @click="toggleCode"
            class="p-2 text-sm font-mono text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="行内代码 (Ctrl+`)"
          >
            &lt;/&gt;
          </button>
          
          <div class="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
          
          <!-- 列表 -->
          <button
            @click="insertUnorderedList"
            class="p-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="无序列表"
          >
            •
          </button>
          <button
            @click="insertOrderedList"
            class="p-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="有序列表"
          >
            1.
          </button>
          <button
            @click="insertCheckbox"
            class="p-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="任务列表"
          >
            ☐
          </button>
          
          <div class="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
          
          <!-- 链接和图片 -->
          <button
            @click="insertLink"
            class="p-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="插入链接"
          >
            🔗
          </button>
          <button
            @click="insertImage"
            class="p-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="插入图片"
          >
            🖼️
          </button>
          
          <div class="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
          
          <!-- 代码块和引用 -->
          <button
            @click="insertCodeBlock"
            class="p-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="代码块"
          >
            ```
          </button>
          <button
            @click="insertQuote"
            class="p-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="引用"
          >
            "
          </button>
          <button
            @click="insertHorizontalRule"
            class="p-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="分割线"
          >
            —
          </button>
        </div>
        
        <div class="flex-1"></div>
        
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <span v-if="editorService.state.lastSaved">
            最后保存: {{ formatTime(editorService.state.lastSaved) }}
          </span>
          <span v-else class="text-red-500">未保存</span>
        </div>
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
  
  // Markdown 快捷键
  if (event.ctrlKey) {
    switch (event.key) {
      case 'b':
        event.preventDefault();
        toggleBold();
        break;
      case 'i':
        event.preventDefault();
        toggleItalic();
        break;
      case '`':
        event.preventDefault();
        toggleCode();
        break;
      case '1':
        event.preventDefault();
        insertHeading(1);
        break;
      case '2':
        event.preventDefault();
        insertHeading(2);
        break;
      case '3':
        event.preventDefault();
        insertHeading(3);
        break;
    }
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

// Markdown 工具栏方法
const insertText = (text: string, selectText: string = '') => {
  const editor = editorService.getEditorView();
  if (!editor) return;
  
  const selection = editor.state.selection;
  const from = selection.main.from;
  const to = selection.main.to;
  
  // 如果有选中文本，替换选中文本
  if (from !== to) {
    editor.dispatch({
      changes: {
        from,
        to,
        insert: text.replace('SELECTED_TEXT', editor.state.doc.sliceString(from, to))
      }
    });
  } else {
    // 如果没有选中文本，插入文本并选中占位符
    const insertText = selectText ? text.replace('SELECTED_TEXT', selectText) : text;
    editor.dispatch({
      changes: {
        from,
        insert: insertText
      },
      selection: {
        anchor: from + text.indexOf('SELECTED_TEXT'),
        head: from + text.indexOf('SELECTED_TEXT') + (selectText ? selectText.length : 0)
      }
    });
  }
};

// 标题
const insertHeading = (level: number) => {
  const hashes = '#'.repeat(level);
  insertText(`${hashes} SELECTED_TEXT\n\n`, '标题文本');
};

// 文本格式
const toggleBold = () => {
  insertText('**SELECTED_TEXT**', '粗体文本');
};

const toggleItalic = () => {
  insertText('*SELECTED_TEXT*', '斜体文本');
};

const toggleStrikethrough = () => {
  insertText('~~SELECTED_TEXT~~', '删除线文本');
};

const toggleCode = () => {
  insertText('`SELECTED_TEXT`', '代码');
};

// 列表
const insertUnorderedList = () => {
  insertText('- SELECTED_TEXT\n', '列表项');
};

const insertOrderedList = () => {
  insertText('1. SELECTED_TEXT\n', '列表项');
};

const insertCheckbox = () => {
  insertText('- [ ] SELECTED_TEXT\n', '任务项');
};

// 链接和图片
const insertLink = () => {
  insertText('[SELECTED_TEXT](URL)', '链接文本');
};

const insertImage = () => {
  insertText('![SELECTED_TEXT](IMAGE_URL)', '图片描述');
};

// 代码块和引用
const insertCodeBlock = () => {
  insertText('```\nSELECTED_TEXT\n```\n', '代码内容');
};

const insertQuote = () => {
  insertText('> SELECTED_TEXT\n', '引用内容');
};

const insertHorizontalRule = () => {
  insertText('\n---\n\n');
};

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
