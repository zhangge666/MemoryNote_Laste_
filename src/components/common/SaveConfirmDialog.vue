<template>
  <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
      <!-- 标题 -->
      <div class="flex items-center mb-4">
        <svg class="w-6 h-6 text-orange-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">保存更改</h3>
      </div>
      
      <!-- 内容 -->
      <p class="text-gray-600 dark:text-gray-300 mb-6">
        文档 "{{ fileName }}" 有未保存的更改。是否要保存这些更改？
      </p>
      
      <!-- 按钮 -->
      <div class="flex justify-end space-x-3">
        <button
          @click="handleDontSave"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          不保存
        </button>
        <button
          @click="handleCancel"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          取消
        </button>
        <button
          @click="handleSave"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean;
  fileName: string;
}

interface Emits {
  (e: 'save'): void;
  (e: 'dontSave'): void;
  (e: 'cancel'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const handleSave = () => {
  emit('save');
};

const handleDontSave = () => {
  emit('dontSave');
};

const handleCancel = () => {
  emit('cancel');
};
</script>


