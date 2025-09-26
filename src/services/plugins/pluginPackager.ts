// 插件打包工具
import type { PluginManifest, PluginPackage } from './pluginInstaller'

/**
 * 插件打包器
 */
export class PluginPackager {
  /**
   * 打包插件目录为插件包
   */
  async packagePlugin(pluginPath: string): Promise<ArrayBuffer> {
    try {
      // 读取插件清单
      const manifest = await this.readManifest(pluginPath)
      
      // 验证清单
      this.validateManifest(manifest)
      
      // 收集所有文件
      const files = await this.collectFiles(pluginPath)
      
      // 创建包
      const packageData: PluginPackage = {
        manifest,
        code: files.get('index.js') || '',
        assets: files,
        dependencies: manifest.dependencies || [],
        checksum: this.calculateChecksum(files)
      }
      
      // 生成ZIP包
      return await this.createZipPackage(packageData)
      
    } catch (error) {
      throw new Error(`Failed to package plugin: ${error.message}`)
    }
  }

  /**
   * 解包插件包
   */
  async unpackagePlugin(packageBuffer: ArrayBuffer): Promise<PluginPackage> {
    try {
      // 解压ZIP包
      const files = await this.extractZipPackage(packageBuffer)
      
      // 读取清单
      const manifestData = files.get('plugin.json')
      if (!manifestData) {
        throw new Error('Missing plugin.json in package')
      }
      
      const manifest: PluginManifest = JSON.parse(new TextDecoder().decode(manifestData))
      
      // 验证清单
      this.validateManifest(manifest)
      
      // 读取代码
      const codeData = files.get('index.js')
      if (!codeData) {
        throw new Error('Missing index.js in package')
      }
      
      const code = new TextDecoder().decode(codeData)
      
      // 移除清单和代码文件，剩余的作为资源
      files.delete('plugin.json')
      files.delete('index.js')
      
      const packageData: PluginPackage = {
        manifest,
        code,
        assets: files,
        dependencies: manifest.dependencies || [],
        checksum: this.calculateChecksum(files)
      }
      
      return packageData
      
    } catch (error) {
      throw new Error(`Failed to unpackage plugin: ${error.message}`)
    }
  }

  /**
   * 验证插件包
   */
  validatePackage(packageData: PluginPackage): void {
    // 验证清单
    this.validateManifest(packageData.manifest)
    
    // 验证代码
    if (!packageData.code || packageData.code.trim().length === 0) {
      throw new Error('Plugin code is empty')
    }
    
    // 验证校验和
    const calculatedChecksum = this.calculateChecksum(packageData.assets)
    if (packageData.checksum !== calculatedChecksum) {
      throw new Error('Package checksum mismatch')
    }
  }

  /**
   * 创建开发模板
   */
  async createTemplate(pluginId: string, pluginName: string, author: string): Promise<Map<string, string>> {
    const template = new Map<string, string>()
    
    // 创建 plugin.json
    const manifest: PluginManifest = {
      id: pluginId,
      name: pluginName,
      version: '1.0.0',
      description: `${pluginName} plugin`,
      author,
      main: 'index.js',
      engines: {
        memorynote: '^1.0.0'
      },
      permissions: [],
      dependencies: [],
      activationEvents: ['onStartup'],
      contributes: {}
    }
    
    template.set('plugin.json', JSON.stringify(manifest, null, 2))
    
    // 创建 index.js
    const indexJs = `// ${pluginName} Plugin
class ${this.toPascalCase(pluginId)}Plugin {
  constructor() {
    this.name = '${pluginName}'
    this.version = '1.0.0'
  }

  async onLoad() {
    console.log(\`\${this.name} plugin loaded\`)
  }

  async onInitialize() {
    console.log(\`\${this.name} plugin initialized\`)
  }

  async onActivate() {
    console.log(\`\${this.name} plugin activated\`)
    
    // 在这里添加你的插件逻辑
    // 例如：注册命令、UI组件等
  }

  async onDeactivate() {
    console.log(\`\${this.name} plugin deactivated\`)
    
    // 清理资源
  }

  async onUnload() {
    console.log(\`\${this.name} plugin unloaded\`)
  }
}

// 导出插件类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ${this.toPascalCase(pluginId)}Plugin
} else {
  window.${this.toPascalCase(pluginId)}Plugin = ${this.toPascalCase(pluginId)}Plugin
}
`
    
    template.set('index.js', indexJs)
    
    // 创建 README.md
    const readme = `# ${pluginName}

${pluginName} plugin for MemoryNote.

## Description

TODO: Add description here

## Installation

1. Download the plugin package
2. Go to Settings > Plugin Management > Plugin Market
3. Click "Install from file" and select the plugin package

## Usage

TODO: Add usage instructions here

## Development

To modify this plugin:

1. Edit the \`index.js\` file
2. Update the \`plugin.json\` if needed
3. Test your changes
4. Package the plugin using the plugin packager

## License

TODO: Add license information
`
    
    template.set('README.md', readme)
    
    // 创建 package.json (for npm dependencies if needed)
    const packageJson = {
      name: pluginId,
      version: '1.0.0',
      description: `${pluginName} plugin`,
      main: 'index.js',
      author,
      scripts: {
        build: 'echo "Build script not configured"',
        test: 'echo "Test script not configured"'
      },
      devDependencies: {},
      dependencies: {}
    }
    
    template.set('package.json', JSON.stringify(packageJson, null, 2))
    
    return template
  }

  // 私有方法
  private async readManifest(pluginPath: string): Promise<PluginManifest> {
    try {
      const manifestPath = `${pluginPath}/plugin.json`
      const manifestContent = await window.electronAPI?.readFile?.(manifestPath)
      if (!manifestContent) {
        throw new Error('Cannot read plugin.json')
      }
      return JSON.parse(manifestContent)
    } catch (error) {
      throw new Error(`Failed to read manifest: ${error.message}`)
    }
  }

  private validateManifest(manifest: PluginManifest): void {
    const required = ['id', 'name', 'version', 'main']
    for (const field of required) {
      if (!manifest[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
    
    // 验证版本格式
    if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
      throw new Error('Invalid version format. Use semantic versioning (x.y.z)')
    }
    
    // 验证ID格式
    if (!/^[a-z0-9-]+$/.test(manifest.id)) {
      throw new Error('Plugin ID must contain only lowercase letters, numbers, and hyphens')
    }
  }

  private async collectFiles(pluginPath: string): Promise<Map<string, ArrayBuffer>> {
    const files = new Map<string, ArrayBuffer>()
    
    try {
      // 这里需要实现递归读取目录的逻辑
      // 由于是浏览器环境，需要通过Electron IPC
      const fileList = await window.electronAPI?.listFiles?.(pluginPath)
      if (!fileList) {
        throw new Error('Cannot list plugin files')
      }
      
      for (const fileName of fileList) {
        const filePath = `${pluginPath}/${fileName}`
        const fileContent = await window.electronAPI?.readFile?.(filePath, 'buffer')
        if (fileContent) {
          files.set(fileName, fileContent)
        }
      }
      
      return files
      
    } catch (error) {
      throw new Error(`Failed to collect files: ${error.message}`)
    }
  }

  private calculateChecksum(files: Map<string, ArrayBuffer>): string {
    // 简单的校验和计算
    let checksum = 0
    for (const [name, content] of files) {
      checksum += name.length
      const view = new Uint8Array(content)
      for (let i = 0; i < view.length; i++) {
        checksum += view[i]
      }
    }
    return checksum.toString(16)
  }

  private async createZipPackage(packageData: PluginPackage): Promise<ArrayBuffer> {
    // TODO: 实现ZIP压缩
    // 这需要一个ZIP库，比如JSZip
    throw new Error('ZIP packaging not implemented yet')
  }

  private async extractZipPackage(buffer: ArrayBuffer): Promise<Map<string, ArrayBuffer>> {
    // TODO: 实现ZIP解压
    // 这需要一个ZIP库，比如JSZip
    throw new Error('ZIP extraction not implemented yet')
  }

  private toPascalCase(str: string): string {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
  }
}

// 全局插件打包器实例
export const pluginPackager = new PluginPackager()

