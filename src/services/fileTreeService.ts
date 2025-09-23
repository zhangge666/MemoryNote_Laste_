import { ref, reactive } from 'vue';
import type { FileTreeNode, FileTreeState } from '../types/fileTree';
import { settingsService } from './settingsService';
import { useTabGroupsStore } from '../stores/tabGroups';

export class FileTreeService {
  private static instance: FileTreeService;
  private state = reactive<FileTreeState>({
    nodes: [],
    selectedNodeId: null,
    expandedNodeIds: new Set(),
    loading: false,
    error: null
  });

  public static getInstance(): FileTreeService {
    if (!FileTreeService.instance) {
      FileTreeService.instance = new FileTreeService();
    }
    return FileTreeService.instance;
  }

  // 获取文件树状态
  getState() {
    return this.state;
  }

  // 加载文件树
  async loadFileTree(): Promise<void> {
    this.state.loading = true;
    this.state.error = null;
    
    try {
      // 先加载设置
      await settingsService.loadSettings();
      const workspacePath = settingsService.getState().workspacePath;
      console.log('FileTreeService - Workspace path:', workspacePath);
      
      if (!workspacePath) {
        throw new Error('工作区路径未设置');
      }

      const nodes = await this.buildFileTree(workspacePath);
      this.state.nodes = nodes;
      console.log('FileTreeService - Nodes loaded:', nodes);
    } catch (error) {
      console.error('Error loading file tree:', error);
      this.state.error = error instanceof Error ? error.message : '加载文件树失败';
    } finally {
      this.state.loading = false;
    }
  }

  // 构建文件树
  private async buildFileTree(dirPath: string, parentId?: string): Promise<FileTreeNode[]> {
    try {
      const files = await window.electronAPI.listFiles(dirPath);
      const nodes: FileTreeNode[] = [];

      for (const file of files) {
        const nodeId = `${parentId || 'root'}-${file.name}`;
        const node: FileTreeNode = {
          id: nodeId,
          name: file.name,
          path: file.path,
          type: file.isDirectory ? 'folder' : 'file',
          parent: parentId,
          size: file.size,
          modified: file.modified,
          extension: file.isDirectory ? undefined : this.getFileExtension(file.name),
          children: file.isDirectory ? [] : undefined,
          isExpanded: false,
          isSelected: false
        };

        // 如果是文件夹，检查是否应该展开
        if (file.isDirectory && this.state.expandedNodeIds.has(nodeId)) {
          node.isExpanded = true;
        }

        // 如果是文件夹，递归加载子节点
        if (file.isDirectory) {
          node.children = await this.buildFileTree(file.path, nodeId);
        }

        nodes.push(node);
      }

      // 按文件夹在前，文件在后的顺序排序
      return nodes.sort((a, b) => {
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Error building file tree:', error);
      return [];
    }
  }

  // 获取文件扩展名
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : '';
  }

  // 展开/折叠节点
  toggleNode(nodeId: string): void {
    if (this.state.expandedNodeIds.has(nodeId)) {
      this.state.expandedNodeIds.delete(nodeId);
    } else {
      this.state.expandedNodeIds.add(nodeId);
    }
    
    // 同时更新节点状态
    this.updateNodeExpandedState(nodeId, this.state.expandedNodeIds.has(nodeId));
  }

  // 更新节点展开状态
  private updateNodeExpandedState(nodeId: string, isExpanded: boolean): void {
    const node = this.findNode(nodeId);
    if (node) {
      node.isExpanded = isExpanded;
    }
  }

  // 选择节点
  selectNode(nodeId: string): void {
    this.state.selectedNodeId = nodeId;
  }

  // 查找节点
  findNode(nodeId: string): FileTreeNode | null {
    return this.findNodeInTree(this.state.nodes, nodeId);
  }

  private findNodeInTree(nodes: FileTreeNode[], nodeId: string): FileTreeNode | null {
    for (const node of nodes) {
      if (node.id === nodeId) {
        return node;
      }
      if (node.children) {
        const found = this.findNodeInTree(node.children, nodeId);
        if (found) return found;
      }
    }
    return null;
  }

  // 创建新文件（内联编辑模式）
  async createFileInline(parentPath: string = ''): Promise<string> {
    try {
      const workspacePath = settingsService.getState().workspacePath;
      console.log('Workspace path:', workspacePath);
      
      if (!workspacePath) {
        console.error('Workspace path is not set');
        return '';
      }
      
      const basePath = parentPath || workspacePath;
      console.log('Base path:', basePath);
      
      // 确保工作区目录存在
      try {
        await window.electronAPI.createDirectory(basePath);
      } catch (error) {
        console.log('Directory already exists or creation failed:', error);
      }
      
      // 生成未命名文件名
      let fileName = '未命名.md';
      let counter = 1;
      let finalPath = `${basePath}\\${fileName}`;
      
      // 检查文件是否存在，如果存在则递增数字
      while (await this.fileExists(finalPath)) {
        fileName = `未命名${counter}.md`;
        finalPath = `${basePath}\\${fileName}`;
        counter++;
      }
      
      console.log('Creating file at:', finalPath);
      
      // 创建文件
      const success = await window.electronAPI.writeFile(finalPath, '');
      if (success) {
        console.log('File created successfully');
        // 重新加载文件树
        await this.loadFileTree();
        
        // 找到新创建的节点并设置为编辑状态
        const newNode = this.findNodeByPath(finalPath);
        if (newNode) {
          newNode.isEditing = true;
          newNode.isSelected = true;
          this.state.selectedNodeId = newNode.id;
          // 强制触发响应式更新
          this.state.nodes = [...this.state.nodes];
        }
        
        return newNode?.id || '';
      }
      return '';
    } catch (error) {
      console.error('Error creating file inline:', error);
      return '';
    }
  }

  // 创建新文件夹（内联编辑模式）
  async createFolderInline(parentPath: string = ''): Promise<string> {
    try {
      const workspacePath = settingsService.getState().workspacePath;
      console.log('Workspace path:', workspacePath);
      
      if (!workspacePath) {
        console.error('Workspace path is not set');
        return '';
      }
      
      const basePath = parentPath || workspacePath;
      console.log('Base path:', basePath);
      
      // 确保工作区目录存在
      try {
        await window.electronAPI.createDirectory(basePath);
      } catch (error) {
        console.log('Directory already exists or creation failed:', error);
      }
      
      // 生成未命名文件夹名
      let folderName = '未命名';
      let counter = 1;
      let finalPath = `${basePath}\\${folderName}`;
      
      // 检查文件夹是否存在，如果存在则递增数字
      while (await this.directoryExists(finalPath)) {
        folderName = `未命名${counter}`;
        finalPath = `${basePath}\\${folderName}`;
        counter++;
      }
      
      console.log('Creating folder at:', finalPath);
      
      // 创建文件夹
      const success = await window.electronAPI.createDirectory(finalPath);
      if (success) {
        console.log('Folder created successfully');
        // 重新加载文件树
        await this.loadFileTree();
        
        // 找到新创建的节点并设置为编辑状态
        const newNode = this.findNodeByPath(finalPath);
        if (newNode) {
          newNode.isEditing = true;
          newNode.isSelected = true;
          this.state.selectedNodeId = newNode.id;
          // 强制触发响应式更新
          this.state.nodes = [...this.state.nodes];
        }
        
        return newNode?.id || '';
      }
      return '';
    } catch (error) {
      console.error('Error creating folder inline:', error);
      return '';
    }
  }


  // 删除文件/文件夹
  async deleteNode(nodeId: string): Promise<boolean> {
    try {
      const node = this.findNode(nodeId);
      if (!node) return false;

      // 关闭相关的标签页
      const tabGroupsStore = useTabGroupsStore();
      tabGroupsStore.closeFileTabs(node.path);

      const success = await window.electronAPI.deleteFile(node.path);
      if (success) {
        await this.loadFileTree();
      }
      return success;
    } catch (error) {
      console.error('Error deleting node:', error);
      return false;
    }
  }

  // 重命名文件/文件夹
  async renameNode(nodeId: string, newName: string): Promise<boolean> {
    try {
      const node = this.findNode(nodeId);
      if (!node) {
        console.error('Node not found:', nodeId);
        return false;
      }

      // 如果名称没有变化，直接返回成功
      if (node.name === newName) {
        console.log('Name unchanged, skipping rename');
        node.isEditing = false;
        return true;
      }

      // 构建新路径
      const parentPath = node.path.substring(0, node.path.lastIndexOf('\\'));
      const newPath = `${parentPath}\\${newName}`;
      
      console.log('Parent path:', parentPath);
      console.log('New name:', newName);
      console.log('New path:', newPath);
      
      console.log('Renaming:', node.path, '->', newPath);
      
      // 检查新名称是否已存在
      if (node.type === 'file') {
        if (await this.fileExists(newPath)) {
          console.error('File already exists:', newPath);
          return false;
        }
      } else {
        if (await this.directoryExists(newPath)) {
          console.error('Directory already exists:', newPath);
          return false;
        }
      }
      
      // 使用 Node.js 的 fs.rename 方法，这是最安全的重命名方式
      const renameSuccess = await window.electronAPI.renameFile(node.path, newPath);
      if (!renameSuccess) {
        console.error('Failed to rename file/folder');
        return false;
      }
      
      // 更新标签页中的文件路径
      const tabGroupsStore = useTabGroupsStore();
      tabGroupsStore.updateFilePath(node.path, newPath);

      // 更新节点信息
      node.name = newName;
      node.path = newPath;
      node.isEditing = false;
      
      // 强制触发响应式更新
      this.state.nodes = [...this.state.nodes];
      
      console.log('Rename successful');
      return true;
    } catch (error) {
      console.error('Error renaming node:', error);
      return false;
    }
  }

  // 检查文件是否存在
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await window.electronAPI.readFile(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // 检查文件夹是否存在
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      // 使用新的 pathExists API 来检查路径是否存在
      return await window.electronAPI.pathExists(dirPath);
    } catch {
      return false;
    }
  }

  // 根据路径查找节点
  private findNodeByPath(path: string): FileTreeNode | null {
    return this.findNodeByPathInTree(this.state.nodes, path);
  }

  private findNodeByPathInTree(nodes: FileTreeNode[], path: string): FileTreeNode | null {
    for (const node of nodes) {
      if (node.path === path) {
        return node;
      }
      if (node.children) {
        const found = this.findNodeByPathInTree(node.children, path);
        if (found) return found;
      }
    }
    return null;
  }

  // 刷新文件树
  async refresh(): Promise<void> {
    await this.loadFileTree();
  }

  // 移动节点到新位置
  async moveNode(nodeId: string, targetParentId: string, targetIndex?: number): Promise<boolean> {
    try {
      const node = this.findNode(nodeId);
      if (!node) {
        console.error('Source node not found:', nodeId);
        return false;
      }

      // 找到目标父节点
      const targetParent = targetParentId ? this.findNode(targetParentId) : null;
      const targetParentPath = targetParent ? targetParent.path : settingsService.getState().workspacePath;
      
      if (!targetParentPath) {
        console.error('Target parent path not found');
        return false;
      }

      // 构建新的文件路径
      const newPath = `${targetParentPath}\\${node.name}`;
      
      // 检查目标路径是否已存在
      if (await this.fileExists(newPath) || await this.directoryExists(newPath)) {
        console.error('Target path already exists:', newPath);
        return false;
      }

      // 执行文件系统移动操作（使用renameFile，因为移动和重命名在文件系统中是相同的操作）
      const moveSuccess = await window.electronAPI.renameFile(node.path, newPath);
      if (!moveSuccess) {
        console.error('Failed to move file/folder');
        return false;
      }

      // 更新标签页中的文件路径
      const tabGroupsStore = useTabGroupsStore();
      tabGroupsStore.updateFilePath(node.path, newPath);

      // 更新节点路径
      node.path = newPath;
      node.parent = targetParentId;

      // 重新加载文件树以反映变化
      await this.loadFileTree();
      
      return true;
    } catch (error) {
      console.error('Error moving node:', error);
      return false;
    }
  }

  // 在文件树中重新排序节点
  reorderNodes(nodeId: string, targetIndex: number): boolean {
    try {
      const node = this.findNode(nodeId);
      if (!node || !node.parent) {
        console.error('Node or parent not found');
        return false;
      }

      const parentNode = this.findNode(node.parent);
      if (!parentNode || !parentNode.children) {
        console.error('Parent node or children not found');
        return false;
      }

      // 从原位置移除
      const currentIndex = parentNode.children.findIndex(child => child.id === nodeId);
      if (currentIndex === -1) {
        console.error('Node not found in parent children');
        return false;
      }

      const [movedNode] = parentNode.children.splice(currentIndex, 1);
      
      // 插入到新位置
      const insertIndex = Math.min(targetIndex, parentNode.children.length);
      parentNode.children.splice(insertIndex, 0, movedNode);

      // 强制触发响应式更新
      this.state.nodes = [...this.state.nodes];
      
      return true;
    } catch (error) {
      console.error('Error reordering nodes:', error);
      return false;
    }
  }
}

// 导出单例实例
export const fileTreeService = FileTreeService.getInstance();
