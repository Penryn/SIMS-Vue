import { ElMessage, ElLoading } from 'element-plus'
import type { UploadFile, UploadRawFile } from 'element-plus'

// 文件上传配置
export interface UploadConfig {
  maxSize?: number // 最大文件大小(MB)
  allowedTypes?: string[] // 允许的文件类型
  url: string // 上传地址
  headers?: Record<string, string> // 请求头
}

// 默认配置
const defaultConfig: Partial<UploadConfig> = {
  maxSize: 10, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  headers: {}
}

// 验证文件
export const validateFile = (file: File, config: UploadConfig): boolean => {
  const finalConfig = { ...defaultConfig, ...config }
  
  // 检查文件大小
  if (finalConfig.maxSize && file.size > finalConfig.maxSize * 1024 * 1024) {
    ElMessage.error(`文件大小不能超过 ${finalConfig.maxSize}MB`)
    return false
  }
  
  // 检查文件类型
  if (finalConfig.allowedTypes && !finalConfig.allowedTypes.includes(file.type)) {
    ElMessage.error(`只支持 ${finalConfig.allowedTypes.join(', ')} 格式的文件`)
    return false
  }
  
  return true
}

// 上传文件
export const uploadFile = async (file: File, config: UploadConfig): Promise<any> => {
  const loading = ElLoading.service({
    lock: true,
    text: '文件上传中...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        ...config.headers
      },
      body: formData
    })
    
    if (!response.ok) {
      throw new Error(`上传失败: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (result.success) {
      ElMessage.success('文件上传成功')
      return result.data
    } else {
      throw new Error(result.message || '上传失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '文件上传失败')
    throw error
  } finally {
    loading.close()
  }
}

// 头像上传配置
export const avatarUploadConfig: UploadConfig = {
  maxSize: 2, // 2MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
  url: '/api/upload/avatar'
}

// Excel文件上传配置
export const excelUploadConfig: UploadConfig = {
  maxSize: 50, // 50MB
  allowedTypes: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  url: '/api/upload/excel'
}

// 图片预览
export const previewImage = (url: string): void => {
  const img = new Image()
  img.src = url
  img.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: 90vw;
    max-height: 90vh;
    z-index: 9999;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    cursor: pointer;
  `
  
  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    z-index: 9998;
    cursor: pointer;
  `
  
  const close = () => {
    document.body.removeChild(overlay)
    document.body.removeChild(img)
  }
  
  overlay.addEventListener('click', close)
  img.addEventListener('click', close)
  
  document.body.appendChild(overlay)
  document.body.appendChild(img)
}

// 下载文件
export const downloadFile = (url: string, filename?: string): void => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename || '下载文件'
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 处理Excel文件导入
export const handleExcelImport = async (
  file: UploadRawFile,
  config: UploadConfig,
  callback?: (data: any) => void
): Promise<void> => {
  if (!validateFile(file, config)) {
    return
  }
  
  try {
    const result = await uploadFile(file, config)
    if (callback) {
      callback(result)
    }
  } catch (error) {
    console.error('Excel导入失败:', error)
  }
}

// 批量文件上传
export const uploadMultipleFiles = async (
  files: File[],
  config: UploadConfig,
  onProgress?: (progress: number) => void
): Promise<any[]> => {
  const results: any[] = []
  
  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadFile(files[i], config)
      results.push(result)
      
      if (onProgress) {
        onProgress(Math.round(((i + 1) / files.length) * 100))
      }
    } catch (error) {
      console.error(`文件 ${files[i].name} 上传失败:`, error)
      results.push(null)
    }
  }
  
  return results
}

// 图片压缩
export const compressImage = (
  file: File,
  quality: number = 0.8,
  maxWidth: number = 800
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      const { width, height } = img
      const scale = Math.min(maxWidth / width, maxWidth / height)
      
      canvas.width = width * scale
      canvas.height = height * scale
      
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            reject(new Error('图片压缩失败'))
          }
        },
        file.type,
        quality
      )
    }
    
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = URL.createObjectURL(file)
  })
}
