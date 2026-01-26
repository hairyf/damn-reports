#!/usr/bin/env node
/**
 * 将 Tauri 图标文件转换为 RGBA 格式
 * Tauri 构建要求图标必须是 RGBA 格式（带 alpha 通道的 PNG）
 */

import { readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const iconsDir = join(__dirname, '../tauri/static')
const iconFiles = ['32x32.png', '128x128.png', '128x128@2x.png']

async function convertToRGBA() {
  try {
    // 动态导入 sharp（如果可用）
    let sharp
    try {
      sharp = (await import('sharp')).default
    } catch (error) {
      console.warn('sharp 未安装，尝试使用系统工具...')
      // 如果 sharp 不可用，在 macOS 上使用 sips
      if (process.platform === 'darwin') {
        const { execSync } = await import('node:child_process')
        for (const icon of iconFiles) {
          const iconPath = join(iconsDir, icon)
          try {
            await import('node:fs').then(fs => fs.promises.access(iconPath))
            console.log(`使用 sips 转换 ${icon}...`)
            execSync(`sips -s format png -s formatOptions rgba "${iconPath}" --out "${iconPath}.tmp"`, { stdio: 'inherit' })
            execSync(`mv "${iconPath}.tmp" "${iconPath}"`, { stdio: 'inherit' })
            console.log(`✓ ${icon} 已转换为 RGBA 格式`)
          } catch (err) {
            if (err.code !== 'ENOENT') {
              console.warn(`警告: 无法转换 ${icon}:`, err.message)
            }
          }
        }
        return
      } else {
        throw new Error('需要安装 sharp 包来处理图标转换')
      }
    }

    // 使用 sharp 转换
    for (const icon of iconFiles) {
      const iconPath = join(iconsDir, icon)
      try {
        await readFile(iconPath)
        console.log(`转换 ${icon} 为 RGBA 格式...`)
        
        const image = sharp(iconPath)
        const metadata = await image.metadata()
        
        // 确保是 RGBA 格式
        await image
          .ensureAlpha() // 确保有 alpha 通道
          .png({ 
            quality: 100,
            compressionLevel: 9,
            colors: metadata.hasAlpha ? undefined : 256 // 如果有 alpha，保持原样
          })
          .toFile(iconPath)
        
        console.log(`✓ ${icon} 已转换为 RGBA 格式`)
      } catch (err) {
        if (err.code === 'ENOENT') {
          console.warn(`跳过: ${icon} 不存在`)
        } else {
          console.error(`错误: 无法转换 ${icon}:`, err.message)
        }
      }
    }
  } catch (error) {
    console.error('转换图标时出错:', error.message)
    process.exit(1)
  }
}

convertToRGBA()
