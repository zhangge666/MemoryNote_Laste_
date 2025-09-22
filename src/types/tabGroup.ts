export interface TabState {
  id: string;
  title: string;
  type: 'document' | 'diary' | 'review' | 'search' | 'settings' | 'editor';
  content?: string;
  isActive: boolean;
  isDirty: boolean;
  lastModified: Date;
  parentTabId?: string;
  metadata?: Record<string, any>;
  filePath?: string;
}

export interface TabGroup {
  id: string;
  tabs: TabState[];
  activeTabId: string | null;
  direction: 'horizontal' | 'vertical' | null; // null 表示单个组
  children?: TabGroup[]; // 子分区
  parent?: string; // 父分区ID
  size?: number; // 分区大小比例 (0-1)
  minSize?: number; // 最小尺寸 (px)
  maxSize?: number; // 最大尺寸 (px)
}

export interface TabLayout {
  rootGroup: TabGroup;
  activeGroupId: string;
  groups: Map<string, TabGroup>; // 所有分组的映射
}

export interface SplitOptions {
  direction: 'horizontal' | 'vertical';
  ratio?: number; // 分割比例，默认 0.5
}

export interface DragDropData {
  tabId: string;
  sourceGroupId: string;
  targetGroupId?: string;
  position?: 'before' | 'after' | 'center';
}


