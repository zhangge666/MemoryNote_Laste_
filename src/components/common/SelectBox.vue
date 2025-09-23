<template>
  <div class="relative">
    <label 
      v-if="label" 
      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
    >
      {{ label }}
    </label>
    
    <div class="relative" ref="dropdownRef">
      <!-- 下拉框触发器 -->
      <button
        type="button"
        @click="toggleDropdown"
        :disabled="disabled"
        :class="[
          'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-left flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          disabled 
            ? 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        ]"
      >
        <span>{{ selectedOption?.label || placeholder || '请选择' }}</span>
        
        <!-- 旋转箭头 -->
        <svg 
          :class="[
            'w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200',
            isOpen ? 'rotate-180' : 'rotate-0'
          ]"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      
      <!-- 下拉列表 -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div
          v-if="isOpen"
          class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          <div class="py-1">
            <button
              v-for="option in options"
              :key="option.value"
              @click="selectOption(option)"
              :disabled="option.disabled"
              :class="[
                'w-full px-3 py-2 text-left text-sm transition-colors',
                option.disabled
                  ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : option.value === modelValue
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
              ]"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
    
    <p 
      v-if="description" 
      class="text-xs text-gray-500 dark:text-gray-400 mt-1"
    >
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface Props {
  modelValue: string | number;
  label?: string;
  description?: string;
  disabled?: boolean;
  options: SelectOption[];
  placeholder?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string | number): void;
  (e: 'change', value: string | number): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
});

const emit = defineEmits<Emits>();

// 状态
const isOpen = ref(false);
const dropdownRef = ref<HTMLElement>();

// 计算属性
const selectedOption = computed(() => {
  return props.options.find(option => option.value === props.modelValue);
});

// 方法
const toggleDropdown = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
};

const selectOption = (option: SelectOption) => {
  if (option.disabled) return;
  
  emit('update:modelValue', option.value);
  emit('change', option.value);
  isOpen.value = false;
};

const closeDropdown = () => {
  isOpen.value = false;
};

// 点击外部关闭下拉列表
const handleClickOutside = (event: Event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown();
  }
};

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (!isOpen.value) return;
  
  switch (event.key) {
    case 'Escape':
      closeDropdown();
      break;
    case 'ArrowDown':
      event.preventDefault();
      // 这里可以添加键盘导航逻辑
      break;
    case 'ArrowUp':
      event.preventDefault();
      // 这里可以添加键盘导航逻辑
      break;
  }
};

// 生命周期
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
/* 自定义样式 */
.relative {
  position: relative;
}

/* 下拉列表滚动条样式 */
.overflow-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}

/* 深色模式滚动条 */
.dark .overflow-auto::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.5);
}

.dark .overflow-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(75, 85, 99, 0.7);
}
</style>
