<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="visible"
        ref="menuRef"
        class="context-menu fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-48"
        :style="{ left: position.x + 'px', top: position.y + 'px' }"
        @click.stop
      >
        <template v-for="(item, index) in items" :key="index">
          <!-- 分隔符 -->
          <div
            v-if="item.separator"
            class="border-t border-gray-200 dark:border-gray-600 my-1"
          ></div>
          <!-- 菜单项 -->
          <div
            v-else
            class="context-menu-item"
            :class="[
              'px-3 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors',
              item.disabled
                ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : item.danger
                  ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            ]"
            @click="handleItemClick(item)"
          >
            <span v-if="item.icon" class="text-base">{{ item.icon }}</span>
            <span class="flex-1">{{ item.label }}</span>
            <span v-if="item.shortcut" class="text-xs text-gray-400 dark:text-gray-500">{{ item.shortcut }}</span>
          </div>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

export interface ContextMenuItem {
  label: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
  action: () => void;
}

interface Props {
  visible: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const menuRef = ref<HTMLElement>();

// 处理菜单项点击
const handleItemClick = (item: ContextMenuItem) => {
  if (item.disabled) return;
  
  item.action();
  emit('close');
};

// 点击外部关闭菜单
const handleClickOutside = (event: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    emit('close');
  }
};

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close');
  }
};

// 调整菜单位置，确保不超出屏幕
const adjustPosition = () => {
  if (!menuRef.value) return;
  
  const rect = menuRef.value.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let newX = props.position.x;
  let newY = props.position.y;
  
  // 水平调整
  if (newX + rect.width > viewportWidth) {
    newX = viewportWidth - rect.width - 10;
  }
  
  // 垂直调整
  if (newY + rect.height > viewportHeight) {
    newY = viewportHeight - rect.height - 10;
  }
  
  // 确保不超出屏幕边界
  newX = Math.max(10, newX);
  newY = Math.max(10, newY);
  
  if (menuRef.value) {
    menuRef.value.style.left = newX + 'px';
    menuRef.value.style.top = newY + 'px';
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeydown);
  
  nextTick(() => {
    adjustPosition();
  });
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.context-menu {
  user-select: none;
}

.context-menu-item {
  white-space: nowrap;
}

/* 滚动条样式 */
.context-menu::-webkit-scrollbar {
  width: 4px;
}

.context-menu::-webkit-scrollbar-track {
  background: transparent;
}

.context-menu::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 2px;
}

.context-menu::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}
</style>
