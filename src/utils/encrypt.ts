import { sm2, sm4 } from 'sm-crypto'

// 生成SM2密钥对
export const generateSM2KeyPair = () => {
  return sm2.generateKeyPairHex()
}

// SM2加密
export const encryptWithSM2 = (data: string, publicKey: string): string => {
  return sm2.doEncrypt(data, publicKey)
}

// SM2解密
export const decryptWithSM2 = (encryptedData: string, privateKey: string): string => {
  return sm2.doDecrypt(encryptedData, privateKey)
}

// SM4加密
export const encryptWithSM4 = (data: string, key: string): string => {
  return sm4.encrypt(data, key)
}

// SM4解密
export const decryptWithSM4 = (encryptedData: string, key: string): string => {
  return sm4.decrypt(encryptedData, key)
}

// 数据脱敏显示
export const maskSensitiveData = (data: string, type: 'idCard' | 'phone' | 'email' | 'address'): string => {
  if (!data) return ''
  
  switch (type) {
    case 'idCard':
      // 身份证号脱敏：显示前6位和后4位，中间用*代替
      if (data.length >= 10) {
        return data.substring(0, 6) + '*'.repeat(data.length - 10) + data.substring(data.length - 4)
      }
      return data
      
    case 'phone':
      // 手机号脱敏：显示前3位和后4位，中间用*代替
      if (data.length >= 7) {
        return data.substring(0, 3) + '*'.repeat(data.length - 7) + data.substring(data.length - 4)
      }
      return data
      
    case 'email':
      // 邮箱脱敏：显示用户名前2位和@后的域名，中间用*代替
      const atIndex = data.indexOf('@')
      if (atIndex > 2) {
        const username = data.substring(0, atIndex)
        const domain = data.substring(atIndex)
        return username.substring(0, 2) + '*'.repeat(username.length - 2) + domain
      }
      return data
      
    case 'address':
      // 地址脱敏：显示前6个字符，后面用*代替
      if (data.length > 6) {
        return data.substring(0, 6) + '*'.repeat(Math.min(data.length - 6, 10))
      }
      return data
      
    default:
      return data
  }
}

// 检查是否需要脱敏显示
export const shouldMaskData = (userRole: string, dataOwner: string, currentUser: string): boolean => {
  // 系统管理员和审计管理员可以看到完整数据
  if (userRole === 'system_admin' || userRole === 'audit_admin') {
    return false
  }
  
  // 用户查看自己的数据不脱敏
  if (dataOwner === currentUser) {
    return false
  }
  
  // 其他情况需要脱敏
  return true
}
