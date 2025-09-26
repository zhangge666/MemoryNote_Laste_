// 插件安装器实现
import type { 
  PluginManifest, 
  Disposable 
} from '../../types/plugin'
import { PluginPermission } from '../../types/plugin'
import { hookSystem } from './hookSystem'
import { HookType } from '../../types/plugin'
import { pluginPersistence } from './pluginPersistence'

// 插件包接口
export interface PluginPackage {
  manifest: PluginManifest
  code: string
  assets: Map<string, ArrayBuffer>
  dependencies: string[]
  signature?: string
  checksum: string
}

// 插件源接口
export interface PluginSource {
  id: string
  name: string
  url: string
  enabled: boolean
  type: 'official' | 'community' | 'local'
}

// 插件市场信息
export interface PluginMarketInfo {
  id: string
  name: string
  version: string
  description: string
  author: string
  homepage?: string
  downloadUrl: string
  iconUrl?: string
  screenshots?: string[]
  downloads: number
  rating: number
  tags: string[]
  lastUpdated: string
  size: number
  verified: boolean
}

// 安装选项
export interface InstallOptions {
  source?: string
  force?: boolean
  skipDependencies?: boolean
  enableAfterInstall?: boolean
}

// 插件安装器
export class PluginInstaller {
  private installedPlugins = new Map<string, PluginPackage>()
  private pluginSources: PluginSource[] = [
    {
      id: 'official',
      name: '官方插件源',
      url: 'https://plugins.memorynote.com/api',
      enabled: true,
      type: 'official'
    }
  ]

  /**
   * 搜索插件
   */
  async searchPlugins(query: string, source?: string): Promise<PluginMarketInfo[]> {
    try {
      const sources = source 
        ? this.pluginSources.filter(s => s.id === source)
        : this.pluginSources.filter(s => s.enabled)

      const results: PluginMarketInfo[] = []
      
      for (const pluginSource of sources) {
        try {
          const response = await fetch(`${pluginSource.url}/search?q=${encodeURIComponent(query)}`)
          if (response.ok) {
            const plugins = await response.json()
            results.push(...plugins)
          }
        } catch (error) {
          console.error(`Failed to search in source ${pluginSource.name}:`, error)
        }
      }

      return results
    } catch (error) {
      console.error('Plugin search failed:', error)
      return []
    }
  }

  /**
   * 获取插件详情
   */
  async getPluginInfo(pluginId: string, source?: string): Promise<PluginMarketInfo | null> {
    try {
      const sources = source 
        ? this.pluginSources.filter(s => s.id === source)
        : this.pluginSources.filter(s => s.enabled)

      for (const pluginSource of sources) {
        try {
          const response = await fetch(`${pluginSource.url}/plugins/${pluginId}`)
          if (response.ok) {
            return await response.json()
          }
        } catch (error) {
          console.error(`Failed to get plugin info from ${pluginSource.name}:`, error)
        }
      }

      return null
    } catch (error) {
      console.error('Get plugin info failed:', error)
      return null
    }
  }

  /**
   * 下载插件包
   */
  async downloadPlugin(pluginId: string, version?: string): Promise<PluginPackage> {
    const info = await this.getPluginInfo(pluginId)
    if (!info) {
      throw new Error(`Plugin not found: ${pluginId}`)
    }

    try {
      // 触发下载开始钩子
      await hookSystem.emit(HookType.PLUGIN_DOWNLOAD_STARTED, { 
        pluginId, 
        version: version || info.version 
      }, 'plugin-installer')

      const downloadUrl = version 
        ? `${info.downloadUrl}?version=${version}`
        : info.downloadUrl

      const response = await fetch(downloadUrl)
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`)
      }

      const packageBuffer = await response.arrayBuffer()
      const packageData = await this.unpackagePlugin(packageBuffer)

      // 验证包
      await this.validatePackage(packageData)

      // 触发下载完成钩子
      await hookSystem.emit(HookType.PLUGIN_DOWNLOAD_COMPLETED, { 
        pluginId, 
        package: packageData 
      }, 'plugin-installer')

      return packageData
    } catch (error) {
      // 触发下载失败钩子
      await hookSystem.emit(HookType.PLUGIN_DOWNLOAD_FAILED, { 
        pluginId, 
        error: error instanceof Error ? error.message : String(error)
      }, 'plugin-installer')
      throw error
    }
  }

  /**
   * 安装插件
   */
  async installPlugin(
    source: string | PluginPackage | File, 
    options: InstallOptions = {}
  ): Promise<void> {
    let packageData: PluginPackage | undefined

    try {
      // 获取插件包
      if (typeof source === 'string') {
        if (source.startsWith('http')) {
          // 从URL下载
          const response = await fetch(source)
          const buffer = await response.arrayBuffer()
          packageData = await this.unpackagePlugin(buffer)
        } else {
          // 本地文件路径或插件ID
          if (source.includes('/') || source.includes('\\')) {
            // 本地路径
            packageData = await this.loadLocalPlugin(source)
          } else {
            // 插件ID
            packageData = await this.downloadPlugin(source)
          }
        }
      } else if (source instanceof File) {
        // 用户上传的文件
        const buffer = await source.arrayBuffer()
        packageData = await this.unpackagePlugin(buffer)
      } else {
        // 已解析的插件包
        packageData = source
      }

      const pluginId = packageData.manifest.id

      // 触发安装开始钩子
      await hookSystem.emit(HookType.PLUGIN_INSTALL_STARTED, { 
        pluginId, 
        manifest: packageData.manifest 
      }, 'plugin-installer')

      // 检查是否已安装
      if (this.isPluginInstalled(pluginId) && !options.force) {
        throw new Error(`Plugin ${pluginId} is already installed. Use force option to reinstall.`)
      }

      // 验证包
      await this.validatePackage(packageData)

      // 检查权限
      await this.checkPermissions(packageData.manifest.permissions || [])

      // 安装依赖
      if (!options.skipDependencies) {
        await this.installDependencies(packageData.dependencies)
      }

      // 创建插件目录
      const pluginDir = await this.createPluginDirectory(pluginId)

      // 提取文件
      await this.extractPluginFiles(packageData, pluginDir)

      // 注册插件
      this.installedPlugins.set(pluginId, packageData)

      // 保存安装信息
      await this.saveInstallInfo(pluginId, packageData)

      // 触发安装完成钩子
      await hookSystem.emit(HookType.PLUGIN_INSTALL_COMPLETED, { 
        pluginId, 
        manifest: packageData.manifest 
      }, 'plugin-installer')

      // 自动激活（如果需要）
      if (options.enableAfterInstall) {
        const { pluginService } = await import('./pluginService')
        await pluginService.loadPlugin(pluginDir)
        await pluginService.activatePlugin(pluginId)
      }

      console.log(`Plugin ${pluginId} installed successfully`)

    } catch (error) {
      // 触发安装失败钩子
      await hookSystem.emit(HookType.PLUGIN_INSTALL_FAILED, { 
        pluginId: packageData?.manifest?.id || 'unknown', 
        error: error instanceof Error ? error.message : String(error)
      }, 'plugin-installer')
      throw error
    }
  }

  /**
   * 卸载插件
   */
  async uninstallPlugin(pluginId: string, options: { keepData?: boolean } = {}): Promise<void> {
    try {
      // 检查是否已安装
      if (!this.isPluginInstalled(pluginId)) {
        throw new Error(`Plugin ${pluginId} is not installed`)
      }

      // 触发卸载开始钩子
      await hookSystem.emit(HookType.PLUGIN_UNINSTALL_STARTED, { pluginId }, 'plugin-installer')

      // 停用并卸载插件
      const { pluginService } = await import('./pluginService')
      
      if (pluginService.isPluginActive(pluginId)) {
        await pluginService.deactivatePlugin(pluginId)
      }
      await pluginService.unloadPlugin(pluginId)

      // 检查依赖关系
      const dependents = await this.findDependentPlugins(pluginId)
      if (dependents.length > 0) {
        throw new Error(`Cannot uninstall ${pluginId}: other plugins depend on it: ${dependents.join(', ')}`)
      }

      // 删除插件文件
      await this.removePluginFiles(pluginId)

      // 清理数据（如果需要）
      if (!options.keepData) {
        await this.cleanupPluginData(pluginId)
      }

      // 从注册表移除
      this.installedPlugins.delete(pluginId)

      // 删除安装信息
      await this.removeInstallInfo(pluginId)

      // 从持久化存储中移除
      await pluginPersistence.recordUninstallation(pluginId)

      // 触发卸载完成钩子
      await hookSystem.emit(HookType.PLUGIN_UNINSTALL_COMPLETED, { pluginId }, 'plugin-installer')

      console.log(`Plugin ${pluginId} uninstalled successfully`)

    } catch (error) {
      // 触发卸载失败钩子
      await hookSystem.emit(HookType.PLUGIN_UNINSTALL_FAILED, { 
        pluginId, 
        error: error instanceof Error ? error.message : String(error)
      }, 'plugin-installer')
      throw error
    }
  }

  /**
   * 更新插件
   */
  async updatePlugin(pluginId: string, version?: string): Promise<void> {
    try {
      const currentPackage = this.installedPlugins.get(pluginId)
      if (!currentPackage) {
        throw new Error(`Plugin ${pluginId} is not installed`)
      }

      // 触发更新开始钩子
      await hookSystem.emit(HookType.PLUGIN_UPDATE_STARTED, { 
        pluginId, 
        currentVersion: currentPackage.manifest.version,
        targetVersion: version 
      }, 'plugin-installer')

      // 下载新版本
      const newPackage = await this.downloadPlugin(pluginId, version)

      // 检查版本
      if (this.compareVersions(newPackage.manifest.version, currentPackage.manifest.version) <= 0) {
        throw new Error(`Target version ${newPackage.manifest.version} is not newer than current version ${currentPackage.manifest.version}`)
      }

      // 备份当前版本
      await this.backupPlugin(pluginId)

      try {
        // 卸载当前版本（保留数据）
        await this.uninstallPlugin(pluginId, { keepData: true })

        // 安装新版本
        await this.installPlugin(newPackage, { enableAfterInstall: true })

        // 调用插件更新钩子
        const { pluginService } = await import('./pluginService')
        const plugin = pluginService.getPlugin(pluginId)
        if (plugin?.instance.onUpdate) {
          await plugin.instance.onUpdate(
            currentPackage.manifest.version,
            newPackage.manifest.version
          )
        }

        // 触发更新完成钩子
        await hookSystem.emit(HookType.PLUGIN_UPDATE_COMPLETED, { 
          pluginId,
          oldVersion: currentPackage.manifest.version,
          newVersion: newPackage.manifest.version
        }, 'plugin-installer')

        console.log(`Plugin ${pluginId} updated from ${currentPackage.manifest.version} to ${newPackage.manifest.version}`)

      } catch (error) {
        // 恢复备份
        await this.restorePlugin(pluginId)
        throw error
      }

    } catch (error) {
      // 触发更新失败钩子
      await hookSystem.emit(HookType.PLUGIN_UPDATE_FAILED, { 
        pluginId, 
        error: error instanceof Error ? error.message : String(error)
      }, 'plugin-installer')
      throw error
    }
  }

  /**
   * 检查插件更新
   */
  async checkUpdates(): Promise<Array<{ pluginId: string; currentVersion: string; latestVersion: string; changelog?: string }>> {
    const updates = []
    
    for (const [pluginId, packageData] of this.installedPlugins) {
      try {
        const info = await this.getPluginInfo(pluginId)
        if (info && this.compareVersions(info.version, packageData.manifest.version) > 0) {
          updates.push({
            pluginId,
            currentVersion: packageData.manifest.version,
            latestVersion: info.version,
            changelog: `Updated to ${info.version}`
          })
        }
      } catch (error) {
        console.error(`Failed to check updates for ${pluginId}:`, error)
      }
    }

    return updates
  }

  /**
   * 获取已安装插件列表
   */
  getInstalledPlugins(): Array<{ pluginId: string; manifest: PluginManifest; installDate: Date }> {
    return Array.from(this.installedPlugins.entries()).map(([pluginId, packageData]) => ({
      pluginId,
      manifest: packageData.manifest,
      installDate: new Date() // TODO: 从存储中读取实际安装日期
    }))
  }

  /**
   * 检查插件是否已安装
   */
  isPluginInstalled(pluginId: string): boolean {
    // 使用持久化存储检查插件是否已安装
    return pluginPersistence.isPluginInstalled(pluginId)
  }

  // 私有方法
  private async unpackagePlugin(buffer: ArrayBuffer): Promise<PluginPackage> {
    // TODO: 实现插件包解压逻辑（ZIP格式）
    // 这里需要实现ZIP解压缩和包结构解析
    throw new Error('Plugin unpackaging not implemented yet')
  }

  private async loadLocalPlugin(path: string): Promise<PluginPackage> {
    // TODO: 从本地路径加载插件
    throw new Error('Local plugin loading not implemented yet')
  }

  private async validatePackage(packageData: PluginPackage): Promise<void> {
    // 验证清单
    if (!packageData.manifest || !packageData.manifest.id) {
      throw new Error('Invalid plugin package: missing manifest or ID')
    }

    // 验证签名（如果有）
    if (packageData.signature) {
      // TODO: 实现数字签名验证
    }

    // 验证校验和
    // TODO: 实现文件完整性检查
  }

  private async checkPermissions(permissions: PluginPermission[]): Promise<void> {
    // TODO: 实现权限检查和用户确认
    const dangerousPermissions = [
      PluginPermission.SYSTEM_COMMAND,
      PluginPermission.FILE_DELETE,
      PluginPermission.NETWORK_REQUEST
    ]

    const hasDangerous = permissions.some(p => dangerousPermissions.includes(p))
    if (hasDangerous) {
      console.warn('Plugin requests dangerous permissions:', permissions)
      // 这里应该显示用户确认对话框
    }
  }

  private async installDependencies(dependencies: string[]): Promise<void> {
    for (const depId of dependencies) {
      if (!this.isPluginInstalled(depId)) {
        console.log(`Installing dependency: ${depId}`)
        await this.installPlugin(depId)
      }
    }
  }

  private async createPluginDirectory(pluginId: string): Promise<string> {
    // TODO: 使用Electron IPC创建插件目录
    const pluginDir = `plugins/${pluginId}`
    await window.electronAPI?.createDirectory?.(pluginDir)
    return pluginDir
  }

  private async extractPluginFiles(packageData: PluginPackage, targetDir: string): Promise<void> {
    // TODO: 提取插件文件到目标目录
    console.log('Extracting plugin files to:', targetDir)
  }

  private async saveInstallInfo(pluginId: string, packageData: PluginPackage): Promise<void> {
    // TODO: 保存安装信息到本地存储
    console.log('Saving install info for:', pluginId)
  }

  private async removeInstallInfo(pluginId: string): Promise<void> {
    // TODO: 删除安装信息
    console.log('Removing install info for:', pluginId)
  }

  private async removePluginFiles(pluginId: string): Promise<void> {
    try {
      // 获取插件安装信息以获取正确的安装路径
      const installInfo = pluginPersistence.getPluginInstallInfo(pluginId)
      if (installInfo && installInfo.installPath) {
        console.log(`Removing plugin files from: ${installInfo.installPath}`)
        await window.electronAPI?.deleteFile?.(installInfo.installPath)
      } else {
        // 回退到默认路径
        const workspacePath = await window.electronAPI?.getWorkspacePath?.() || ''
        const pluginDir = `${workspacePath}/.memorynote/${pluginId}`
        console.log(`Removing plugin files from fallback path: ${pluginDir}`)
        await window.electronAPI?.deleteFile?.(pluginDir)
      }
    } catch (error) {
      console.error(`Failed to remove plugin files for ${pluginId}:`, error)
      // 不抛出错误，因为文件删除失败不应该阻止卸载过程
    }
  }

  private async cleanupPluginData(pluginId: string): Promise<void> {
    // TODO: 清理插件数据
    console.log('Cleaning up data for:', pluginId)
  }

  private async findDependentPlugins(pluginId: string): Promise<string[]> {
    // TODO: 查找依赖此插件的其他插件
    return []
  }

  private async backupPlugin(pluginId: string): Promise<void> {
    // TODO: 备份插件
    console.log('Backing up plugin:', pluginId)
  }

  private async restorePlugin(pluginId: string): Promise<void> {
    // TODO: 恢复插件
    console.log('Restoring plugin:', pluginId)
  }

  private compareVersions(a: string, b: string): number {
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
}

// 全局插件安装器实例
export const pluginInstaller = new PluginInstaller()
