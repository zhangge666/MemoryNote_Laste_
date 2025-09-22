<template>
  <div class="flex-1 flex flex-col bg-white dark:bg-gray-900">
    <!-- 嵌套标签页组系统 -->
    <TabGroup 
      :group="tabGroupsStore.layout.rootGroup"
      class="flex-1"
    />
  </div>
</template>

<script setup lang="ts">
import { useTabGroupsStore } from '@/stores/tabGroups';
import TabGroup from '@/components/tabs/TabGroup.vue';

const tabGroupsStore = useTabGroupsStore();
</script>