<template>
  <div class="plugin-manager">
    <!-- 标签切换 -->
    <div class="tab-header">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        :class="['tab-button', { active: activeTab === tab.key }]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 已安装插件管理 -->
    <div v-if="activeTab === 'installed'" class="installed-plugins">
      <!-- 头部工具栏 -->
      <div class="plugin-header">
        <div class="header-left">
          <h2 class="title">已安装插件</h2>
          <div class="stats">
            <span class="stat-item">
              <span class="stat-label">总计:</span>
              <span class="stat-value">{{ stats.total }}</span>
            </span>
            <span class="stat-item">
              <span class="stat-label">已激活:</span>
              <span class="stat-value active">{{ stats.active }}</span>
            </span>
            <span class="stat-item">
              <span class="stat-label">错误:</span>
              <span class="stat-value error">{{ stats.error }}</span>
            </span>
          </div>
        </div>
        <div class="header-right">
          <button 
            class="btn btn-primary"
            @click="showInstallDialog = true"
          >
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            安装插件
          </button>
          <button 
            class="btn btn-secondary"
            @click="refreshPlugins"
            :disabled="isLoading"
          >
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            刷新
          </button>
        </div>
      </div>

      <!-- 错误信息 -->
      <div v-if="errors.length > 0" class="errors-section">
        <div class="error-header">
          <h3>错误信息</h3>
          <button class="btn btn-text" @click="clearErrors">清除</button>
        </div>
        <div class="error-list">
          <div 
            v-for="error in errors.slice(-5)" 
            :key="`${error.pluginId}-${error.timestamp}`"
            class="error-item"
          >
            <div class="error-plugin">{{ error.pluginId }}</div>
            <div class="error-message">{{ error.error }}</div>
            <div class="error-time">{{ formatTime(error.timestamp) }}</div>
          </div>
        </div>
      </div>

      <!-- 插件列表 -->
      <div class="plugin-list">
        <div v-if="plugins.length === 0" class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24">
            <path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/>
          </svg>
          <p>还没有安装任何插件</p>
          <button class="btn btn-primary" @click="showInstallDialog = true">
            安装第一个插件
          </button>
        </div>

        <div v-else class="plugin-grid">
          <div 
            v-for="plugin in plugins" 
            :key="plugin.manifest.id"
            class="plugin-card"
            :class="`state-${plugin.state}`"
            @click="selectPlugin(plugin)"
          >
            <div class="plugin-card-header">
              <div class="plugin-info">
                <h3 class="plugin-name">{{ plugin.manifest.name }}</h3>
                <p class="plugin-description">{{ plugin.manifest.description }}</p>
              </div>
              <div class="plugin-status">
                <span 
                  class="status-badge" 
                  :class="`status-${plugin.state}`"
                  :title="getStatusText(plugin.state)"
                >
                  {{ getStatusText(plugin.state) }}
                </span>
              </div>
            </div>

            <div class="plugin-card-body">
              <div class="plugin-meta">
                <span class="meta-item">
                  <span class="meta-label">版本:</span>
                  <span class="meta-value">{{ plugin.manifest.version }}</span>
                </span>
                <span class="meta-item">
                  <span class="meta-label">作者:</span>
                  <span class="meta-value">{{ plugin.manifest.author }}</span>
                </span>
              </div>
              
              <div v-if="plugin.manifest.contributes" class="plugin-contributes">
                <div v-if="plugin.manifest.contributes.commands?.length" class="contribute-item">
                  <span class="contribute-label">命令:</span>
                  <span class="contribute-count">{{ plugin.manifest.contributes.commands.length }}</span>
                </div>
                <div v-if="plugin.manifest.contributes.sidebar?.length" class="contribute-item">
                  <span class="contribute-label">侧边栏:</span>
                  <span class="contribute-count">{{ plugin.manifest.contributes.sidebar.length }}</span>
                </div>
                <div v-if="plugin.manifest.contributes.algorithms?.length" class="contribute-item">
                  <span class="contribute-label">算法:</span>
                  <span class="contribute-count">{{ plugin.manifest.contributes.algorithms.length }}</span>
                </div>
              </div>
            </div>

            <div class="plugin-card-actions">
              <button 
                v-if="plugin.state === 'loaded' || plugin.state === 'inactive'"
                class="btn btn-small btn-primary"
                @click.stop="activatePlugin(plugin.manifest.id)"
                :disabled="isLoading"
              >
                激活
              </button>
              <button 
                v-if="plugin.state === 'active'"
                class="btn btn-small btn-secondary"
                @click.stop="deactivatePlugin(plugin.manifest.id)"
                :disabled="isLoading"
              >
                停用
              </button>
              <button 
                class="btn btn-small btn-text"
                @click.stop="reloadPlugin(plugin.manifest.id)"
                :disabled="isLoading"
              >
                重载
              </button>
              <button 
                class="btn btn-small btn-warning"
                @click.stop="unloadPlugin(plugin.manifest.id)"
                :disabled="isLoading"
              >
                移除
              </button>
              <button 
                class="btn btn-small btn-danger"
                @click.stop="uninstallPlugin(plugin.manifest.id)"
                :disabled="isLoading"
              >
                卸载
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 插件安装对话框 -->
    <div v-if="showInstallDialog" class="install-dialog-overlay" @click="showInstallDialog = false">
      <div class="install-dialog" @click.stop>
        <div class="dialog-header">
          <h3>安装插件</h3>
          <button class="btn btn-text" @click="showInstallDialog = false">
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        
        <div class="dialog-content">
          <div class="form-group">
            <label for="pluginPath">插件路径:</label>
            <div class="path-selector">
              <input
                id="pluginPath"
                v-model="pluginPath"
                type="text"
                placeholder="选择插件文件夹"
                readonly
                class="form-input"
              />
              <button 
                class="btn btn-secondary"
                @click="selectPluginFolder"
                :disabled="isLoading"
              >
                浏览
              </button>
            </div>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button class="btn btn-secondary" @click="showInstallDialog = false">取消</button>
          <button 
            class="btn btn-primary" 
            @click="installPlugin"
            :disabled="!pluginPath || isLoading"
          >
            {{ isLoading ? '安装中...' : '安装' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 插件市场 -->
    <div v-if="activeTab === 'market'" class="market-container">
      <PluginMarketView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePluginService } from '../../services/plugins/pluginService'
import { useAppStore } from '../../stores/app'
import type { LoadedPlugin, PluginLifecycle } from '../../types/plugin'
import PluginMarketView from './PluginMarketView.vue'

// 应用商店
const appStore = useAppStore()

// 插件服务
const {
  plugins,
  errors,
  isLoading,
  activatePlugin: serviceActivatePlugin,
  deactivatePlugin: serviceDeactivatePlugin,
  loadPlugin: serviceLoadPlugin,
  unloadPlugin: serviceUnloadPlugin,
  reloadPlugin: serviceReloadPlugin,
  clearErrors
} = usePluginService()

// 状态
const activeTab = ref('installed')
const showInstallDialog = ref(false)
const pluginPath = ref('')

// 标签配置
const tabs = [
  { key: 'installed', label: '已安装' },
  { key: 'market', label: '插件市场' }
]

// 计算属性
const stats = computed(() => ({
  total: plugins.value.length,
  active: plugins.value.filter(p => p.state === 'active').length,
  error: errors.value.length
}))

// 方法
const selectPlugin = (plugin: LoadedPlugin) => {
  // 在右侧栏显示插件详情
  appStore.setSelectedPluginForDetails(plugin)
}

const refreshPlugins = async () => {
  // TODO: 实现刷新逻辑
  console.log('Refreshing plugins...')
}

const selectPluginFolder = async () => {
  try {
    const selectedPath = await window.electronAPI.selectWorkspaceFolder()
    if (selectedPath) {
      pluginPath.value = selectedPath
    }
  } catch (error) {
    console.error('Error selecting plugin folder:', error)
  }
}

const installPlugin = async () => {
  if (!pluginPath.value) return
  
  try {
    await serviceLoadPlugin(pluginPath.value)
    showInstallDialog.value = false
    pluginPath.value = ''
  } catch (error) {
    console.error('Failed to install plugin:', error)
    alert('插件安装失败')
  }
}

const activatePlugin = async (pluginId: string) => {
  try {
    await serviceActivatePlugin(pluginId)
  } catch (error) {
    console.error('Failed to activate plugin:', error)
  }
}

const deactivatePlugin = async (pluginId: string) => {
  try {
    await serviceDeactivatePlugin(pluginId)
  } catch (error) {
    console.error('Failed to deactivate plugin:', error)
  }
}

const reloadPlugin = async (pluginId: string) => {
  try {
    await serviceReloadPlugin(pluginId)
  } catch (error) {
    console.error('Failed to reload plugin:', error)
  }
}

const unloadPlugin = async (pluginId: string) => {
  if (!confirm(`确定要从内存中移除插件 "${pluginId}" 吗？插件文件将保留。`)) {
    return
  }
  
  try {
    await serviceUnloadPlugin(pluginId)
  } catch (error) {
    console.error('Failed to unload plugin:', error)
    alert(`移除插件失败: ${error.message}`)
  }
}

const uninstallPlugin = async (pluginId: string) => {
  if (!confirm(`确定要完全卸载插件 "${pluginId}" 吗？这将删除插件文件，但会保留用户数据。`)) {
    return
  }
  
  try {
    // 使用插件安装器进行卸载
    const { pluginInstaller } = await import('../../services/plugins/pluginInstaller')
    await pluginInstaller.uninstallPlugin(pluginId, { keepData: true })
    
    alert(`插件 "${pluginId}" 已成功卸载`)
  } catch (error) {
    console.error('Failed to uninstall plugin:', error)
    alert(`卸载插件失败: ${error.message}`)
  }
}

const getStatusText = (state: PluginLifecycle) => {
  switch (state) {
    case 'active': return '已激活'
    case 'inactive': return '未激活'
    case 'loaded': return '已加载'
    case 'loading': return '加载中'
    case 'error': return '错误'
    default: return '未知'
  }
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString()
}
</script>

<style scoped>
/* 插件管理器样式 */
.plugin-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tab-header {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.tab-button {
  padding: 12px 24px;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s;
}

.tab-button:hover {
  color: #374151;
  background: #f3f4f6;
}

.tab-button.active {
  color: #3b82f6;
  background: white;
  border-bottom: 2px solid #3b82f6;
}

.installed-plugins {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.plugin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: white;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #111827;
}

.stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.stat-label {
  color: #6b7280;
}

.stat-value {
  font-weight: 600;
  color: #111827;
}

.stat-value.active {
  color: #10b981;
}

.stat-value.error {
  color: #ef4444;
}

.header-right {
  display: flex;
  gap: 8px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border-color: #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-text {
  background: transparent;
  color: #6b7280;
}

.btn-text:hover:not(:disabled) {
  background: #f3f4f6;
  color: #374151;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #d97706;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.plugin-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  text-align: center;
  color: #6b7280;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  fill: currentColor;
}

.plugin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
}

.plugin-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.plugin-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.plugin-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.plugin-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.plugin-info p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.4;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-active {
  background: #dcfce7;
  color: #166534;
}

.status-loaded {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-inactive {
  background: #f3f4f6;
  color: #374151;
}

.status-loading {
  background: #fef3c7;
  color: #92400e;
}

.status-error {
  background: #fee2e2;
  color: #991b1b;
}

.plugin-card-body {
  margin-bottom: 12px;
}

.plugin-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 12px;
}

.meta-item {
  display: flex;
  gap: 4px;
}

.meta-label {
  color: #6b7280;
}

.meta-value {
  color: #111827;
  font-weight: 500;
}

.plugin-contributes {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.contribute-item {
  display: flex;
  gap: 4px;
  align-items: center;
}

.contribute-label {
  color: #6b7280;
}

.contribute-count {
  background: #3b82f6;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
}

.plugin-card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.install-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.install-dialog {
  background: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90vw;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.dialog-content {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
}

.path-selector {
  display: flex;
  gap: 8px;
}

.form-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

.errors-section {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  margin: 16px 20px;
}

.error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #fecaca;
}

.error-header h3 {
  margin: 0;
  color: #991b1b;
  font-size: 14px;
  font-weight: 600;
}

.error-list {
  max-height: 200px;
  overflow-y: auto;
}

.error-item {
  display: grid;
  grid-template-columns: 120px 1fr auto;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid #fecaca;
  font-size: 12px;
}

.error-item:last-child {
  border-bottom: none;
}

.error-plugin {
  font-weight: 600;
  color: #991b1b;
}

.error-message {
  color: #7f1d1d;
}

.error-time {
  color: #991b1b;
  opacity: 0.7;
}

.icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.market-container {
  flex: 1;
  overflow: hidden;
}
</style>