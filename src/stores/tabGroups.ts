import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { TabState, TabGroup, TabLayout, SplitOptions, DragDropData } from '../types/tabGroup';

export const useTabGroupsStore = defineStore('tabGroups', () => {
  // 状态
  const layout = ref<TabLayout>({
    rootGroup: {
      id: 'root',
      tabs: [],
      activeTabId: null,
      direction: null,
      children: [],
      size: 1,
    },
    activeGroupId: 'root',
    groups: new Map(),
  });

  // 初始化根分组
  layout.value.groups.set('root', layout.value.rootGroup);

  // 计算属性
  const activeGroup = computed(() => {
    return layout.value.groups.get(layout.value.activeGroupId);
  });

  const activeTab = computed(() => {
    const group = activeGroup.value;
    if (!group || !group.activeTabId) return null;
    return group.tabs.find(tab => tab.id === group.activeTabId) || null;
  });

  const allTabs = computed(() => {
    const tabs: TabState[] = [];
    for (const group of layout.value.groups.values()) {
      tabs.push(...group.tabs);
    }
    return tabs;
  });

  // 生成唯一ID
  const generateId = (prefix: string = 'id') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // 创建新的标签页组
  const createTabGroup = (parentId?: string): TabGroup => {
    const group: TabGroup = {
      id: generateId('group'),
      tabs: [],
      activeTabId: null,
      direction: null,
      children: [],
      parent: parentId,
      size: 0.5, // 默认占用一半空间
    };

    layout.value.groups.set(group.id, group);
    return group;
  };

  // 查找合适的叶子组来添加标签页
  const findLeafGroupForTab = (startGroupId?: string): TabGroup | null => {
    const startGroup = startGroupId ? layout.value.groups.get(startGroupId) : null;
    let targetGroup = startGroup || layout.value.groups.get(layout.value.activeGroupId);
    
    if (!targetGroup) {
      targetGroup = layout.value.rootGroup;
    }

    // 如果目标组有子组，找到第一个叶子组
    while (targetGroup && targetGroup.children && targetGroup.children.length > 0) {
      // 优先选择有标签页的子组，如果没有则选择第一个子组
      const childWithTabs: TabGroup | undefined = targetGroup.children.find((child: TabGroup) => child.tabs.length > 0);
      targetGroup = childWithTabs || targetGroup.children[0];
    }

    return targetGroup || null;
  };

  // 添加标签页到指定组
  const addTabToGroup = (tab: Partial<TabState>, groupId?: string): string => {
    // 对于非编辑器类型的标签页，检查是否已存在
    if (tab.type !== 'editor') {
      let existingTab: TabState | null = null;
      let existingGroupId: string | null = null;

      for (const [gId, group] of layout.value.groups) {
        existingTab = group.tabs.find((t: TabState) => t.type === tab.type) || null;
        if (existingTab) {
          existingGroupId = gId;
          break;
        }
      }

      // 如果找到已存在的非编辑器标签页，切换到它
      if (existingTab && existingGroupId) {
        console.log(`Found existing ${tab.type} tab in group ${existingGroupId}, switching to:`, existingTab.id);
        setActiveTab(existingTab.id, existingGroupId);
        return existingTab.id;
      }
    }
    
    // 编辑器类型允许在不同分区组中打开同一文件，不做去重检查

    // 找到合适的叶子组来添加新标签页
    const targetGroup = findLeafGroupForTab(groupId);
    if (!targetGroup) {
      console.error('No suitable group found for adding tab');
      return '';
    }

    console.log(`Creating new ${tab.type} tab in group ${targetGroup.id}`);

    const newTab: TabState = {
      id: tab.id || generateId('tab'),
      title: tab.title || '新标签页',
      type: tab.type || 'document',
      content: tab.content || '',
      isActive: true,
      isDirty: false,
      lastModified: new Date(),
      parentTabId: tab.parentTabId,
      metadata: tab.metadata || {},
      filePath: tab.filePath,
    };

    // 将目标组内其他标签页设为非活动状态
    targetGroup.tabs.forEach((t: TabState) => t.isActive = false);

    // 添加新标签页
    targetGroup.tabs.push(newTab);
    targetGroup.activeTabId = newTab.id;
    layout.value.activeGroupId = targetGroup.id;

    return newTab.id;
  };

  // 设置活动标签页
  const setActiveTab = (tabId: string, groupId?: string) => {
    if (groupId) {
      const group = layout.value.groups.get(groupId);
      if (group) {
        group.tabs.forEach((tab: TabState) => tab.isActive = (tab.id === tabId));
        group.activeTabId = tabId;
        layout.value.activeGroupId = groupId;
      }
    } else {
      // 在所有组中查找标签页
      for (const [gId, group] of layout.value.groups) {
        const tab = group.tabs.find((t: TabState) => t.id === tabId);
        if (tab) {
          group.tabs.forEach((t: TabState) => t.isActive = (t.id === tabId));
          group.activeTabId = tabId;
          layout.value.activeGroupId = gId;
          break;
        }
      }
    }
  };

  // 关闭标签页
  const closeTab = (tabId: string) => {
    for (const [groupId, group] of layout.value.groups) {
      const tabIndex = group.tabs.findIndex((tab: TabState) => tab.id === tabId);
      if (tabIndex !== -1) {
        const tab = group.tabs[tabIndex];
        
        // 移除标签页
        group.tabs.splice(tabIndex, 1);

        // 如果关闭的是活动标签页，需要激活其他标签页
        if (group.activeTabId === tabId) {
          if (group.tabs.length > 0) {
            // 激活相邻的标签页
            const newActiveIndex = Math.min(tabIndex, group.tabs.length - 1);
            const newActiveTab = group.tabs[newActiveIndex];
            if (newActiveTab) {
              setActiveTab(newActiveTab.id, groupId);
            }
          } else {
            group.activeTabId = null;
            // 如果组为空且不是根组，立即清理
            if (groupId !== 'root') {
              cleanupEmptyGroups();
              // 如果当前活动组被删除，切换到根组
              if (!layout.value.groups.has(layout.value.activeGroupId)) {
                layout.value.activeGroupId = 'root';
              }
            }
          }
        }
        
        break;
      }
    }
  };

  // 分割组（水平或垂直）
  const splitGroup = (groupId: string, options: SplitOptions): string => {
    const group = layout.value.groups.get(groupId);
    if (!group) return '';

    // 如果组为空或没有标签页，禁止分割
    if (group.tabs.length === 0) {
      console.log('Cannot split empty group');
      return '';
    }

    // 创建新的子组
    const newGroup = createTabGroup(groupId);
    
    // 如果原组没有子组，转换为容器组
    if (!group.children || group.children.length === 0) {
      // 创建一个新组来容纳原有的标签页
      const originalTabsGroup = createTabGroup(groupId);
      
      if (group.tabs.length > 1 && group.activeTabId) {
        // 如果有多个标签，将当前激活的标签移动到新组
        const activeTabIndex = group.tabs.findIndex((tab: TabState) => tab.id === group.activeTabId);
        if (activeTabIndex !== -1) {
          const activeTab = group.tabs.splice(activeTabIndex, 1)[0];
          newGroup.tabs = [activeTab];
          newGroup.activeTabId = activeTab.id;
          activeTab.isActive = true;
          
          // 原组保留其他标签页
          originalTabsGroup.tabs = [...group.tabs];
          // 激活原组中的第一个标签
          if (originalTabsGroup.tabs.length > 0) {
            originalTabsGroup.activeTabId = originalTabsGroup.tabs[0].id;
            originalTabsGroup.tabs[0].isActive = true;
          }
        }
      } else if (group.tabs.length === 1) {
        // 如果只有一个标签，复制到两个组
        const originalTab = group.tabs[0];
        const duplicatedTab = {
          ...originalTab,
          id: generateId('tab'),
          isActive: true
        };
        
        originalTabsGroup.tabs = [originalTab];
        originalTabsGroup.activeTabId = originalTab.id;
        originalTab.isActive = true;
        
        newGroup.tabs = [duplicatedTab];
        newGroup.activeTabId = duplicatedTab.id;
      }

      originalTabsGroup.size = options.ratio || 0.5;
      newGroup.size = 1 - (options.ratio || 0.5);

      // 清空原组的标签页，设置为容器
      group.tabs = [];
      group.activeTabId = null;
      group.direction = options.direction;
      group.children = [originalTabsGroup, newGroup];

      // 设置新组为活动组
      layout.value.activeGroupId = newGroup.id;
    } else {
      // 如果已经有子组，添加到现有的子组列表
      group.children.push(newGroup);
      // 重新计算所有子组的大小
      const childCount = group.children.length;
      group.children.forEach((child: TabGroup) => {
        child.size = 1 / childCount;
      });
    }

    return newGroup.id;
  };

  // 移动标签页到另一个组
  const moveTabToGroup = (tabId: string, targetGroupId: string, position?: number) => {
    // 找到源组和标签页
    let sourceGroup: TabGroup | null = null;
    let tab: TabState | null = null;
    let sourceTabIndex = -1;

    for (const group of layout.value.groups.values()) {
      const index = group.tabs.findIndex((t: TabState) => t.id === tabId);
      if (index !== -1) {
        sourceGroup = group;
        tab = group.tabs[index];
        sourceTabIndex = index;
        break;
      }
    }

    if (!sourceGroup || !tab) return false;

    const targetGroup = layout.value.groups.get(targetGroupId);
    if (!targetGroup) return false;

    // 从源组移除
    sourceGroup.tabs.splice(sourceTabIndex, 1);

    // 添加到目标组
    const insertPosition = position !== undefined ? position : targetGroup.tabs.length;
    targetGroup.tabs.splice(insertPosition, 0, tab);

    // 更新活动状态
    if (sourceGroup.activeTabId === tabId) {
      sourceGroup.activeTabId = sourceGroup.tabs.length > 0 ? sourceGroup.tabs[0].id : null;
    }

    // 激活移动的标签页
    setActiveTab(tabId, targetGroupId);

    // 检查源组是否为空，如果为空则清理
    if (sourceGroup.tabs.length === 0 && sourceGroup.id !== 'root') {
      cleanupEmptyGroups();
    }

    return true;
  };

  // 设置活动组
  const setActiveGroup = (groupId: string) => {
    if (layout.value.groups.has(groupId)) {
      layout.value.activeGroupId = groupId;
    }
  };

  // 获取组的层次结构路径
  const getGroupPath = (groupId: string): string[] => {
    const path: string[] = [];
    let currentGroup = layout.value.groups.get(groupId);
    
    while (currentGroup) {
      path.unshift(currentGroup.id);
      if (currentGroup.parent) {
        currentGroup = layout.value.groups.get(currentGroup.parent);
      } else {
        break;
      }
    }
    
    return path;
  };

  // 清理空的组
  const cleanupEmptyGroups = () => {
    const groupsToRemove: string[] = [];
    
    for (const [groupId, group] of layout.value.groups) {
      if (groupId !== 'root' && group.tabs.length === 0 && (!group.children || group.children.length === 0)) {
        groupsToRemove.push(groupId);
      }
    }
    
    groupsToRemove.forEach(groupId => {
      const group = layout.value.groups.get(groupId);
      if (group && group.parent) {
        const parentGroup = layout.value.groups.get(group.parent);
        if (parentGroup && parentGroup.children) {
          // 从父组移除这个空组
          parentGroup.children = parentGroup.children.filter((child: TabGroup) => child.id !== groupId);
          
          // 如果父组只剩一个子组，将子组提升到父组级别
          if (parentGroup.children.length === 1) {
            const remainingChild = parentGroup.children[0];
            parentGroup.tabs = [...remainingChild.tabs];
            parentGroup.activeTabId = remainingChild.activeTabId;
            parentGroup.children = remainingChild.children || [];
            parentGroup.direction = remainingChild.direction;
            
            // 更新子组的父引用
            if (parentGroup.children) {
              parentGroup.children.forEach((child: TabGroup) => {
                child.parent = parentGroup.id;
              });
            }
            
            // 删除被提升的子组
            layout.value.groups.delete(remainingChild.id);
          }
        }
      }
      layout.value.groups.delete(groupId);
    });
  };

  // 初始化布局
  const initializeLayout = () => {
    // 确保根组是一个叶子组，可以直接添加标签页
    if (!layout.value.rootGroup.id) {
      layout.value.rootGroup = {
        id: 'root',
        tabs: [],
        activeTabId: null,
        direction: null,
        children: [],
        size: 1,
      };
      layout.value.activeGroupId = 'root';
      layout.value.groups.set('root', layout.value.rootGroup);
    }
    console.log('Tab layout initialized');
  };

  return {
    // 状态
    layout,
    
    // 计算属性
    activeGroup,
    activeTab,
    allTabs,
    
    // 方法
    createTabGroup,
    addTabToGroup,
    setActiveTab,
    closeTab,
    splitGroup,
    moveTabToGroup,
    setActiveGroup,
    getGroupPath,
    cleanupEmptyGroups,
    initializeLayout,
  };
});
