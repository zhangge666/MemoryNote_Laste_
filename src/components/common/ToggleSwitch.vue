<template>
  <div class="flex items-center justify-between">
    <div class="flex-1">
      <label 
        v-if="label" 
        class="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
        @click="toggle"
      >
        {{ label }}
      </label>
      <p 
        v-if="description" 
        class="text-xs text-gray-500 dark:text-gray-400 mt-1"
      >
        {{ description }}
      </p>
    </div>
    
    <button
      type="button"
      :class="[
        sizeClasses,
        'relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
        modelValue 
          ? 'bg-blue-600 focus:ring-blue-500' 
          : 'bg-gray-200 dark:bg-gray-700 focus:ring-gray-500'
      ]"
      :disabled="disabled"
      @click="toggle"
    >
      <span
        :class="[
          thumbSizeClasses,
          'inline-block transform rounded-full bg-white transition-transform',
          thumbPositionClasses
        ]"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue: boolean;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'change', value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  size: 'md'
});

const emit = defineEmits<Emits>();

const toggle = () => {
  if (props.disabled) return;
  
  const newValue = !props.modelValue;
  emit('update:modelValue', newValue);
  emit('change', newValue);
};

// 计算样式类
const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-4 w-8';
    case 'lg':
      return 'h-8 w-14';
    default:
      return 'h-6 w-11';
  }
});

const thumbSizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-3 w-3';
    case 'lg':
      return 'h-6 w-6';
    default:
      return 'h-4 w-4';
  }
});

const thumbPositionClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return props.modelValue ? 'translate-x-4' : 'translate-x-0.5';
    case 'lg':
      return props.modelValue ? 'translate-x-8' : 'translate-x-1';
    default:
      return props.modelValue ? 'translate-x-6' : 'translate-x-1';
  }
});
</script>

<style scoped>
/* 自定义样式 */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button:not(:disabled):hover {
  opacity: 0.8;
}
</style>
