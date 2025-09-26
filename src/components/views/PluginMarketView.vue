<template>
  <div class="plugin-market">
    <!-- 搜索栏 -->
    <div class="search-header">
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input
          v-model="searchQuery"
          @keyup.enter="searchPlugins"
          type="text"
          placeholder="搜索插件..."
          class="search-input"
        />
        <button 
          @click="searchPlugins"
          :disabled="isSearching"
          class="search-btn"
        >
          {{ isSearching ? '搜索中...' : '搜索' }}
        </button>
      </div>

      <div class="filter-tabs">
        <button
          v-for="tab in filterTabs"
          :key="tab.key"
          @click="activeFilter = tab.key"
          :class="['filter-tab', { active: activeFilter === tab.key }]"
        >
          {{ tab.label }}
          <span v-if="tab.count !== undefined" class="count">{{ tab.count }}</span>
        </button>
      </div>
    </div>

    <!-- 插件列表 -->
    <div class="plugin-content">
      <div v-if="isSearching" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在搜索插件...</p>
      </div>

      <div v-else-if="filteredPlugins.length === 0" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <h3>没有找到插件</h3>
        <p>尝试使用不同的关键词搜索</p>
      </div>

      <div v-else class="plugin-grid">
        <div
          v-for="plugin in filteredPlugins"
          :key="plugin.id"
          class="plugin-card"
          @click="selectPlugin(plugin)"
        >
          <div class="plugin-header">
            <img 
              v-if="plugin.iconUrl" 
              :src="plugin.iconUrl" 
              :alt="plugin.name"
              class="plugin-icon"
              @error="onIconError"
            />
            <div v-else class="plugin-icon-placeholder">
              {{ plugin.name.charAt(0).toUpperCase() }}
            </div>

            <div class="plugin-info">
              <h3 class="plugin-name">
                {{ plugin.name }}
                <svg v-if="plugin.verified" class="verified-icon" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </h3>
              <p class="plugin-author">by {{ plugin.author }}</p>
            </div>

            <div class="plugin-actions">
              <button
                v-if="!isPluginInstalled(plugin.id)"
                @click.stop="installPlugin(plugin)"
                :disabled="isInstalling(plugin.id)"
                class="btn btn-primary btn-small"
              >
                {{ isInstalling(plugin.id) ? '安装中...' : '安装' }}
              </button>
              
              <button
                v-else-if="hasUpdate(plugin.id, plugin.version)"
                @click.stop="updatePlugin(plugin.id, plugin.version)"
                :disabled="isUpdating(plugin.id)"
                class="btn btn-warning btn-small"
              >
                {{ isUpdating(plugin.id) ? '更新中...' : '更新' }}
              </button>
              
              <span v-else class="installed-badge">
                已安装
              </span>
            </div>
          </div>

          <div class="plugin-body">
            <p class="plugin-description">{{ plugin.description }}</p>
            
            <div class="plugin-tags">
              <span
                v-for="tag in plugin.tags.slice(0, 3)"
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
            </div>

            <div class="plugin-stats">
              <div class="stat-item">
                <svg class="stat-icon" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
                <span>{{ plugin.rating.toFixed(1) }}</span>
              </div>
              
              <div class="stat-item">
                <svg class="stat-icon" viewBox="0 0 24 24">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                <span>{{ formatDownloads(plugin.downloads) }}</span>
              </div>
              
              <div class="stat-item">
                <svg class="stat-icon" viewBox="0 0 24 24">
                  <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zM4 4v2h16V4H4zm0 16h16v2H4v-2z"/>
                </svg>
                <span>{{ formatFileSize(plugin.size) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 插件详情模态框 -->
    <div v-if="selectedPlugin" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <div class="plugin-detail-header">
            <img 
              v-if="selectedPlugin.iconUrl" 
              :src="selectedPlugin.iconUrl" 
              :alt="selectedPlugin.name"
              class="detail-icon"
            />
            <div v-else class="detail-icon-placeholder">
              {{ selectedPlugin.name.charAt(0).toUpperCase() }}
            </div>
            
            <div class="detail-info">
              <h2>{{ selectedPlugin.name }}</h2>
              <p class="detail-author">by {{ selectedPlugin.author }}</p>
              <p class="detail-version">版本 {{ selectedPlugin.version }}</p>
            </div>
          </div>
          
          <button @click="closeModal" class="close-btn">
            <svg viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="detail-description">
            <h3>描述</h3>
            <p>{{ selectedPlugin.description }}</p>
          </div>

          <div v-if="selectedPlugin.screenshots?.length" class="detail-screenshots">
            <h3>截图</h3>
            <div class="screenshot-grid">
              <img
                v-for="(screenshot, index) in selectedPlugin.screenshots"
                :key="index"
                :src="screenshot"
                :alt="`Screenshot ${index + 1}`"
                class="screenshot"
                @click="viewScreenshot(screenshot)"
              />
            </div>
          </div>

          <div class="detail-meta">
            <div class="meta-item">
              <strong>下载量:</strong>
              <span>{{ formatDownloads(selectedPlugin.downloads) }}</span>
            </div>
            <div class="meta-item">
              <strong>评分:</strong>
              <span>{{ selectedPlugin.rating.toFixed(1) }}/5.0</span>
            </div>
            <div class="meta-item">
              <strong>大小:</strong>
              <span>{{ formatFileSize(selectedPlugin.size) }}</span>
            </div>
            <div class="meta-item">
              <strong>更新时间:</strong>
              <span>{{ formatDate(selectedPlugin.lastUpdated) }}</span>
            </div>
          </div>

          <div v-if="selectedPlugin.tags.length" class="detail-tags">
            <h3>标签</h3>
            <div class="tag-list">
              <span
                v-for="tag in selectedPlugin.tags"
                :key="tag"
                class="tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="closeModal" class="btn btn-secondary">
            取消
          </button>
          
          <button
            v-if="!isPluginInstalled(selectedPlugin.id)"
            @click="installPlugin(selectedPlugin)"
            :disabled="isInstalling(selectedPlugin.id)"
            class="btn btn-primary"
          >
            {{ isInstalling(selectedPlugin.id) ? '安装中...' : '安装插件' }}
          </button>
          
          <button
            v-else-if="hasUpdate(selectedPlugin.id, selectedPlugin.version)"
            @click="updatePlugin(selectedPlugin.id, selectedPlugin.version)"
            :disabled="isUpdating(selectedPlugin.id)"
            class="btn btn-warning"
          >
            {{ isUpdating(selectedPlugin.id) ? '更新中...' : '更新到最新版本' }}
          </button>
          
          <span v-else class="installed-badge large">
            已安装最新版本
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePluginService } from '../../services/plugins/pluginService'
import type { PluginMarketInfo } from '../../services/plugins/pluginInstaller'
import { pluginInstaller } from '../../services/plugins/pluginInstaller'

// 状态
const searchQuery = ref('')
const isSearching = ref(false)
const activeFilter = ref('all')
const selectedPlugin = ref<PluginMarketInfo | null>(null)
const marketPlugins = ref<PluginMarketInfo[]>([])
const installingPlugins = ref(new Set<string>())
const updatingPlugins = ref(new Set<string>())

// 插件服务
const {
  plugins: installedPluginsList,
  isPluginActive,
  loadPlugin,
  activatePlugin
} = usePluginService()

// 过滤标签
const filterTabs = computed(() => [
  { key: 'all', label: '全部', count: marketPlugins.value.length },
  { key: 'installed', label: '已安装', count: installedPluginsList.value.length },
  { key: 'verified', label: '官方认证', count: marketPlugins.value.filter(p => p.verified).length },
  { key: 'popular', label: '热门', count: marketPlugins.value.filter(p => p.downloads > 1000).length }
])

// 过滤后的插件列表
const filteredPlugins = computed(() => {
  let plugins = marketPlugins.value

  switch (activeFilter.value) {
    case 'installed':
      plugins = plugins.filter(p => isPluginInstalled(p.id))
      break
    case 'verified':
      plugins = plugins.filter(p => p.verified)
      break
    case 'popular':
      plugins = plugins.filter(p => p.downloads > 1000)
      break
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    plugins = plugins.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.author.toLowerCase().includes(query) ||
      p.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  return plugins.sort((a, b) => {
    // 已安装的优先
    const aInstalled = isPluginInstalled(a.id)
    const bInstalled = isPluginInstalled(b.id)
    if (aInstalled !== bInstalled) {
      return bInstalled ? 1 : -1
    }
    
    // 认证的优先
    if (a.verified !== b.verified) {
      return b.verified ? 1 : -1
    }
    
    // 按下载量排序
    return b.downloads - a.downloads
  })
})

// 方法
const searchPlugins = async () => {
  if (!searchQuery.value.trim()) {
    await loadDefaultPlugins()
    return
  }

  isSearching.value = true
  try {
    const results = await pluginInstaller.searchPlugins(searchQuery.value)
    marketPlugins.value = results
  } catch (error) {
    console.error('Search failed:', error)
    // TODO: 显示错误通知
  } finally {
    isSearching.value = false
  }
}

const loadDefaultPlugins = async () => {
  isSearching.value = true
  try {
    // 加载热门插件
    const results = await pluginInstaller.searchPlugins('')
    marketPlugins.value = results
  } catch (error) {
    console.error('Failed to load plugins:', error)
  } finally {
    isSearching.value = false
  }
}

const selectPlugin = (plugin: PluginMarketInfo) => {
  selectedPlugin.value = plugin
}

const closeModal = () => {
  selectedPlugin.value = null
}

const installPlugin = async (plugin: PluginMarketInfo) => {
  installingPlugins.value.add(plugin.id)
  try {
    await pluginInstaller.installPlugin(plugin.id, { enableAfterInstall: true })
    // TODO: 显示成功通知
    console.log(`Plugin ${plugin.name} installed successfully`)
  } catch (error) {
    console.error('Installation failed:', error)
    // TODO: 显示错误通知
  } finally {
    installingPlugins.value.delete(plugin.id)
  }
}

const updatePlugin = async (pluginId: string, version: string) => {
  updatingPlugins.value.add(pluginId)
  try {
    await pluginInstaller.updatePlugin(pluginId, version)
    // TODO: 显示成功通知
    console.log(`Plugin ${pluginId} updated successfully`)
  } catch (error) {
    console.error('Update failed:', error)
    // TODO: 显示错误通知
  } finally {
    updatingPlugins.value.delete(pluginId)
  }
}

const isPluginInstalled = (pluginId: string): boolean => {
  return pluginInstaller.isPluginInstalled(pluginId)
}

const hasUpdate = (pluginId: string, latestVersion: string): boolean => {
  if (!isPluginInstalled(pluginId)) return false
  
  const installed = installedPluginsList.value.find(p => p.manifest.id === pluginId)
  if (!installed) return false
  
  return compareVersions(latestVersion, installed.manifest.version) > 0
}

const isInstalling = (pluginId: string): boolean => {
  return installingPlugins.value.has(pluginId)
}

const isUpdating = (pluginId: string): boolean => {
  return updatingPlugins.value.has(pluginId)
}

const compareVersions = (a: string, b: string): number => {
  const partsA = a.split('.').map(Number)
  const partsB = b.split('.').map(Number)
  
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const partA = partsA[i] || 0
    const partB = partsB[i] || 0
    
    if (partA > partB) return 1
    if (partA < partB) return -1
  }
  
  return 0
}

const formatDownloads = (downloads: number): string => {
  if (downloads >= 1000000) {
    return `${(downloads / 1000000).toFixed(1)}M`
  }
  if (downloads >= 1000) {
    return `${(downloads / 1000).toFixed(1)}K`
  }
  return downloads.toString()
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const onIconError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  // 显示占位符
}

const viewScreenshot = (url: string) => {
  // TODO: 实现截图查看器
  window.open(url, '_blank')
}

// 生命周期
onMounted(async () => {
  await loadDefaultPlugins()
})
</script>

<style scoped>
.plugin-market {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.search-header {
  margin-bottom: 24px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.search-icon {
  width: 20px;
  height: 20px;
  fill: var(--text-secondary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.search-btn {
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.search-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filter-tabs {
  display: flex;
  gap: 8px;
}

.filter-tab {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-tab:hover {
  background: var(--bg-hover);
}

.filter-tab.active {
  background: var(--color-primary) !important;
  color: white !important;
  border-color: var(--color-primary);
}

.count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.plugin-content {
  flex: 1;
  overflow-y: auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  text-align: center;
  color: var(--text-secondary);
}

.empty-icon {
  width: 48px;
  height: 48px;
  fill: var(--text-tertiary);
  margin-bottom: 16px;
}

.plugin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.plugin-card {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.plugin-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.plugin-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.plugin-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.plugin-icon-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  flex-shrink: 0;
}

.plugin-info {
  flex: 1;
  min-width: 0;
}

.plugin-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.verified-icon {
  width: 16px;
  height: 16px;
  fill: var(--color-success);
}

.plugin-author {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
}

.plugin-actions {
  flex-shrink: 0;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-small {
  padding: 4px 8px;
  font-size: 11px;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-warning {
  background: var(--color-warning);
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: var(--color-warning-dark);
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-hover);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.installed-badge {
  padding: 4px 8px;
  background: var(--color-success-light);
  color: var(--color-success-dark);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.installed-badge.large {
  padding: 8px 16px;
  font-size: 14px;
}

.plugin-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plugin-description {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.plugin-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 2px 6px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.plugin-stats {
  display: flex;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.stat-icon {
  width: 14px;
  height: 14px;
  fill: currentColor;
}

/* 模态框样式 */
.modal-overlay {
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

.modal {
  background: var(--bg-primary);
  border-radius: 8px;
  max-width: 600px;
  max-height: 90vh;
  width: 90vw;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.plugin-detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.detail-icon {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
}

.detail-icon-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
}

.detail-info h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
}

.detail-author,
.detail-version {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--bg-hover);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn svg {
  width: 20px;
  height: 20px;
  fill: var(--text-secondary);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.detail-description h3,
.detail-screenshots h3,
.detail-tags h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
}

.detail-description {
  margin-bottom: 24px;
}

.detail-description p {
  margin: 0;
  line-height: 1.6;
  color: var(--text-secondary);
}

.detail-screenshots {
  margin-bottom: 24px;
}

.screenshot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.screenshot {
  width: 100%;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.2s;
}

.screenshot:hover {
  transform: scale(1.05);
}

.detail-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.meta-item {
  font-size: 14px;
}

.meta-item strong {
  color: var(--text-primary);
}

.meta-item span {
  color: var(--text-secondary);
}

.detail-tags .tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--border-color);
}
</style>
