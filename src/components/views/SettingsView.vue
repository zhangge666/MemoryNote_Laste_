<template>
  <div class="h-full flex bg-white dark:bg-gray-900">
    <!-- 设置侧边栏 -->
    <div class="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div class="p-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">设置</h2>
        <nav class="space-y-1">
          <button
            v-for="item in settingsItems"
            :key="item.id"
            @click="activeSection = item.id"
            :class="[
              'w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors',
              activeSection === item.id
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            ]"
          >
            <div class="flex items-center space-x-3">
              <component :is="item.icon" class="w-4 h-4" />
              <span>{{ item.name }}</span>
            </div>
          </button>
        </nav>
      </div>
    </div>

    <!-- 设置内容区域 -->
    <div class="flex-1 overflow-y-auto">
      <!-- 基础设置 -->
      <div v-if="activeSection === 'general'" class="p-6">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">基础设置</h3>
        
        <!-- 基础设置 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4">基础设置</h4>
          
          <div class="space-y-4">
            <!-- 语言设置 -->
            <SelectBox
              v-model="localSettings.general.language"
              label="界面语言"
              :options="languageOptions"
              @change="handleSettingChange"
            />

            <!-- 自动保存设置 -->
            <ToggleSwitch
              v-model="localSettings.general.autoSave"
              label="启用自动保存"
              description="自动保存编辑的文档"
              @change="handleSettingChange"
            />

            <!-- 自动保存间隔 -->
            <div v-if="localSettings.general.autoSave">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                自动保存间隔（秒）
              </label>
              <input
                type="number"
                v-model="localSettings.general.autoSaveInterval"
                @change="handleSettingChange"
                min="10"
                max="300"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>

            <!-- 启动行为 -->
            <SelectBox
              v-model="localSettings.general.startupBehavior"
              label="启动行为"
              :options="startupBehaviorOptions"
              @change="handleSettingChange"
            />

            <!-- 主题设置 -->
            <SelectBox
              v-model="localSettings.editor.theme"
              label="应用主题"
              :options="themeOptions"
              @change="handleSettingChange"
            />
          </div>
        </div>

        <!-- 工作区设置 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4">工作区设置</h4>
          
          <div class="space-y-4">
            <!-- 当前工作区路径 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                当前工作区路径
              </label>
              <div class="flex items-center space-x-2">
                <input
                  v-model="currentWorkspacePath"
                  type="text"
                  readonly
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
                <button
                  @click="openWorkspaceDialog"
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  选择文件夹
                </button>
              </div>
            </div>

            <!-- 工作区信息 -->
            <div class="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
              <h5 class="text-sm font-medium text-gray-900 dark:text-white mb-2">工作区信息</h5>
              <div class="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <span class="font-medium">笔记数量:</span>
                  <span class="ml-2">{{ workspaceStats.notesCount }}</span>
                </div>
                <div>
                  <span class="font-medium">文件数量:</span>
                  <span class="ml-2">{{ workspaceStats.filesCount }}</span>
                </div>
                <div>
                  <span class="font-medium">目录数量:</span>
                  <span class="ml-2">{{ workspaceStats.dirsCount }}</span>
                </div>
                <div>
                  <span class="font-medium">总大小:</span>
                  <span class="ml-2">{{ formatFileSize(workspaceStats.totalSize) }}</span>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex space-x-3">
              <button
                @click="refreshWorkspaceStats"
                :disabled="isLoading"
                class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm"
              >
                {{ isLoading ? '刷新中...' : '刷新统计' }}
              </button>
              <button
                @click="openWorkspaceInExplorer"
                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                在文件管理器中打开
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 编辑器设置 -->
      <div v-else-if="activeSection === 'editor'" class="p-6">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">编辑器设置</h3>
        
        <div class="space-y-6">

          <!-- 字体设置 -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4">字体设置</h4>
            
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    字体大小
                  </label>
                  <input
                    type="number"
                    v-model="localSettings.editor.fontSize"
                    @change="handleSettingChange"
                    min="10"
                    max="24"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    行高
                  </label>
                  <input
                    type="number"
                    v-model="localSettings.editor.lineHeight"
                    @change="handleSettingChange"
                    min="1"
                    max="3"
                    step="0.1"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>
              
              <SelectBox
                v-model="localSettings.editor.fontFamily"
                label="字体族"
                :options="fontFamilyOptions"
                @change="handleSettingChange"
              />
            </div>
          </div>

          <!-- 编辑器预览 -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4">编辑器预览</h4>
            
            <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div 
                class="editor-preview"
                :style="{
                  fontFamily: localSettings.editor.fontFamily,
                  fontSize: localSettings.editor.fontSize + 'px',
                  lineHeight: localSettings.editor.lineHeight
                }"
              >
                <div class="text-sm text-gray-600 dark:text-gray-400 mb-3">// Markdown 编辑器预览效果</div>
                
                <!-- Markdown 预览内容 -->
                <div class="space-y-2">
                  <!-- 标题 -->
                  <div class="text-lg font-bold text-gray-900 dark:text-white">
                    # 这是一个标题
                  </div>
                  
                  <!-- 段落 -->
                  <div class="text-sm text-gray-700 dark:text-gray-300">
                    这是一个普通的段落文本，用于展示字体效果。
                  </div>
                  
                  <!-- 列表 -->
                  <div class="text-sm text-gray-700 dark:text-gray-300">
                    <div>• 列表项 1</div>
                    <div>• 列表项 2</div>
                    <div>• 列表项 3</div>
                  </div>
                  
                  <!-- 代码块 -->
                  <div class="bg-gray-100 dark:bg-gray-800 rounded p-2 text-xs font-mono text-gray-800 dark:text-gray-200">
                    <div>```javascript</div>
                    <div>console.log('Hello, World!');</div>
                    <div>```</div>
                  </div>
                  
                  <!-- 引用 -->
                  <div class="border-l-4 border-blue-500 pl-3 text-sm text-gray-600 dark:text-gray-400 italic">
                    > 这是一个引用块
                  </div>
                  
                  <!-- 链接 -->
                  <div class="text-sm">
                    <span class="text-gray-700 dark:text-gray-300">这是一个</span>
                    <span class="text-blue-600 dark:text-blue-400 underline">链接</span>
                    <span class="text-gray-700 dark:text-gray-300">示例</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 编辑器行为 -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4">编辑器行为</h4>
            
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <ToggleSwitch
                  v-model="localSettings.editor.wordWrap"
                  label="自动换行"
                  description="长行自动换行显示"
                  @change="handleSettingChange"
                />
                
                <ToggleSwitch
                  v-model="localSettings.editor.showLineNumbers"
                  label="显示行号"
                  description="在编辑器左侧显示行号"
                  @change="handleSettingChange"
                />
                
                <ToggleSwitch
                  v-model="localSettings.editor.showMinimap"
                  label="显示小地图"
                  description="在编辑器右侧显示代码小地图"
                  @change="handleSettingChange"
                />
                
                <ToggleSwitch
                  v-model="localSettings.editor.autoCloseBrackets"
                  label="自动关闭括号"
                  description="输入时自动关闭括号"
                  @change="handleSettingChange"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tab 大小
                </label>
                <input
                  type="number"
                  v-model="localSettings.editor.tabSize"
                  @change="handleSettingChange"
                  min="2"
                  max="8"
                  class="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 主题设置 -->
      <div v-else-if="activeSection === 'theme'" class="p-6">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">主题设置</h3>
        
        <div class="space-y-6">
          <!-- 颜色设置 -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4">颜色设置</h4>
            
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    主色调
                  </label>
                  <input
                    type="color"
                    v-model="localSettings.theme.primaryColor"
                    @change="handleSettingChange"
                    class="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    强调色
                  </label>
                  <input
                    type="color"
                    v-model="localSettings.theme.accentColor"
                    @change="handleSettingChange"
                    class="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 布局设置 -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-4">布局设置</h4>
            
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    左侧栏宽度
                  </label>
                  <input
                    type="number"
                    v-model="localSettings.theme.sidebarWidth"
                    @change="handleSettingChange"
                    min="200"
                    max="400"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    右侧栏宽度
                  </label>
                  <input
                    type="number"
                    v-model="localSettings.theme.rightSidebarWidth"
                    @change="handleSettingChange"
                    min="200"
                    max="400"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>
              
              <SelectBox
                v-model="localSettings.theme.animationSpeed"
                label="动画速度"
                :options="animationSpeedOptions"
                @change="handleSettingChange"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 插件管理 -->
      <div v-else-if="activeSection === 'plugins'" class="p-6">
        <PluginManagerView />
      </div>

      <!-- 其他设置页面 -->
      <div v-else class="p-6">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {{ getCurrentSectionName() }}
        </h3>
        <div class="text-center text-gray-500 dark:text-gray-400 py-8">
          该设置页面正在开发中...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue';
import { useAppStore } from '../../stores/app';
import { settingsService, settings } from '../../services/settingsService';
import { fileTreeService } from '../../services/fileTreeService';
import { AppSettings, defaultSettings } from '../../types/settings';
import ToggleSwitch from '../common/ToggleSwitch.vue';
import SelectBox from '../common/SelectBox.vue';
import PluginManagerView from './PluginManagerView.vue';

const appStore = useAppStore();

// 设置项
const settingsItems = [
  {
    id: 'general',
    name: '基础设置',
    icon: 'SettingsIcon'
  },
  {
    id: 'editor',
    name: '编辑器设置',
    icon: 'EditIcon'
  },
  {
    id: 'ai',
    name: 'AI设置',
    icon: 'BrainIcon'
  },
  {
    id: 'review',
    name: '复习设置',
    icon: 'ClockIcon'
  },
  {
    id: 'theme',
    name: '主题设置',
    icon: 'PaletteIcon'
  },
  {
    id: 'plugins',
    name: '插件管理',
    icon: 'PuzzleIcon'
  }
];

// 状态
const activeSection = ref('general');
const currentWorkspacePath = ref('');
const isLoading = ref(false);
const workspaceStats = ref({
  notesCount: 0,
  filesCount: 0,
  dirsCount: 0,
  totalSize: 0
});

// 本地设置状态
const localSettings = reactive<AppSettings>({ ...defaultSettings });

// 选项数据
const languageOptions = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' }
];

const startupBehaviorOptions = [
  { value: 'restore', label: '恢复上次会话' },
  { value: 'new', label: '新建空白文档' },
  { value: 'last', label: '打开最后编辑的文档' }
];

const themeOptions = [
  { value: 'light', label: '浅色主题' },
  { value: 'dark', label: '深色主题' },
  { value: 'auto', label: '跟随系统' }
];

const fontFamilyOptions = [
  { value: 'JetBrains Mono, Consolas, monospace', label: 'JetBrains Mono' },
  { value: 'Fira Code, Consolas, monospace', label: 'Fira Code' },
  { value: 'Source Code Pro, Consolas, monospace', label: 'Source Code Pro' },
  { value: 'Consolas, monospace', label: 'Consolas' },
  { value: 'Monaco, Consolas, monospace', label: 'Monaco' }
];

const animationSpeedOptions = [
  { value: 'slow', label: '慢' },
  { value: 'normal', label: '正常' },
  { value: 'fast', label: '快' }
];

// 获取当前设置项名称
const getCurrentSectionName = () => {
  const item = settingsItems.find(item => item.id === activeSection.value);
  return item?.name || '设置';
};

// 保存设置
const saveSettings = async () => {
  try {
    const success = await settingsService.saveSettings(localSettings);
    if (success) {
      console.log('Settings saved successfully');
    } else {
      console.error('Failed to save settings');
      alert('保存设置失败，请重试');
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    alert('保存设置时发生错误');
  }
};

// 处理设置变化（自动保存）
const handleSettingChange = () => {
  // 使用防抖的自动保存
  settingsService.autoSaveSettings(localSettings);
};

// 打开工作区选择对话框
const openWorkspaceDialog = async () => {
  try {
    const selectedPath = await window.electronAPI.selectWorkspaceFolder();
    if (selectedPath && selectedPath !== currentWorkspacePath.value) {
      isLoading.value = true;
      try {
        const success = await appStore.setWorkspacePath(selectedPath);
        if (success) {
          currentWorkspacePath.value = selectedPath;
          // 同时更新设置服务中的工作区路径
          const currentSettings = settingsService.getSettings();
          await settingsService.updateSetting('general', {
            ...currentSettings.general,
            workspacePath: selectedPath
          });
          
          // 刷新文件树以显示新工作区的文件
          console.log('Refreshing file tree for new workspace...');
          await fileTreeService.refresh();
          console.log('File tree refreshed successfully');
          
          await refreshWorkspaceStats();
        } else {
          alert('设置工作区路径失败，请检查路径是否有效');
        }
      } finally {
        isLoading.value = false;
      }
    }
  } catch (error) {
    console.error('Error opening workspace dialog:', error);
    alert('打开工作区选择对话框失败');
    isLoading.value = false;
  }
};

// 刷新工作区统计信息
const refreshWorkspaceStats = async () => {
  // 注意：不在这里设置 isLoading，因为调用方可能已经设置了
  try {
    // 获取工作区文件列表
    const files = await window.electronAPI.listFiles('');
    
    let filesCount = 0;
    let dirsCount = 0;
    let totalSize = 0;
    
    // 递归统计文件信息
    const countFiles = async (dirPath: string) => {
      const items = await window.electronAPI.listFiles(dirPath);
      for (const item of items) {
        if (item.isDirectory) {
          dirsCount++;
          await countFiles(item.relativePath);
        } else {
          filesCount++;
          // 这里可以获取文件大小，暂时设为0
          totalSize += 0;
        }
      }
    };
    
    await countFiles('');
    
    workspaceStats.value = {
      notesCount: 0, // 从数据库获取
      filesCount,
      dirsCount,
      totalSize
    };
  } catch (error) {
    console.error('Error refreshing workspace stats:', error);
  }
};

// 在文件管理器中打开工作区
const openWorkspaceInExplorer = async () => {
  try {
    const success = await window.electronAPI.openWorkspaceInExplorer();
    if (!success) {
      alert('打开文件管理器失败');
    }
  } catch (error) {
    console.error('Error opening workspace in explorer:', error);
    alert('打开文件管理器失败');
  }
};

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 组件挂载时初始化
onMounted(async () => {
  try {
    // 加载设置
    const loadedSettings = await settingsService.loadSettings();
    
    // 更新本地设置状态（深度合并）
    if (loadedSettings) {
      Object.keys(loadedSettings).forEach(key => {
        if (localSettings[key as keyof AppSettings] && typeof localSettings[key as keyof AppSettings] === 'object') {
          Object.assign(localSettings[key as keyof AppSettings], loadedSettings[key as keyof AppSettings]);
        } else {
          (localSettings as any)[key] = loadedSettings[key as keyof AppSettings];
        }
      });
    }
    
    // 获取工作区路径
    currentWorkspacePath.value = await appStore.getWorkspacePath();
    
    // 刷新工作区统计
    await refreshWorkspaceStats();
  } catch (error) {
    console.error('Error initializing settings:', error);
  }
});
</script>
