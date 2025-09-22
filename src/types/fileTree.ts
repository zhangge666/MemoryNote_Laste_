export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
  isExpanded?: boolean;
  isSelected?: boolean;
  isEditing?: boolean;
  parent?: string;
  size?: number;
  modified?: string;
  extension?: string;
}

export interface FileTreeState {
  nodes: FileTreeNode[];
  selectedNodeId: string | null;
  expandedNodeIds: Set<string>;
  loading: boolean;
  error: string | null;
}

export interface FileAction {
  type: 'create' | 'delete' | 'rename' | 'move';
  nodeId: string;
  newName?: string;
  newPath?: string;
}
