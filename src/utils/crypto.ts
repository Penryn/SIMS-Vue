/**
 * 国密算法集成工具
 * 支持SM2、SM3、SM4加密算法
 */

import { sm2, sm3, sm4 } from 'sm-crypto'

// SM2密钥对接口
export interface SM2KeyPair {
  publicKey: string
  privateKey: string
}

// SM4加密配置
export interface SM4Config {
  key: string
  mode?: 'ecb' | 'cbc'
  iv?: string
}

/**
 * SM2非对称加密
 */
export class SM2Crypto {
  private keyPair: SM2KeyPair

  constructor(keyPair?: SM2KeyPair) {
    this.keyPair = keyPair || this.generateKeyPair()
  }

  /**
   * 生成SM2密钥对
   */
  generateKeyPair(): SM2KeyPair {
    const keyPair = sm2.generateKeyPairHex()
    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey
    }
  }

  /**
   * 获取公钥
   */
  getPublicKey(): string {
    return this.keyPair.publicKey
  }

  /**
   * 加密数据
   */
  encrypt(data: string, publicKey?: string): string {
    const key = publicKey || this.keyPair.publicKey
    return sm2.doEncrypt(data, key, 1) // cipherMode = 1 (C1C3C2)
  }

  /**
   * 解密数据
   */
  decrypt(encryptedData: string, privateKey?: string): string {
    const key = privateKey || this.keyPair.privateKey
    return sm2.doDecrypt(encryptedData, key, 1)
  }

  /**
   * 数字签名
   */
  sign(data: string, privateKey?: string): string {
    const key = privateKey || this.keyPair.privateKey
    return sm2.doSignature(data, key)
  }

  /**
   * 验证签名
   */
  verify(data: string, signature: string, publicKey?: string): boolean {
    const key = publicKey || this.keyPair.publicKey
    return sm2.doVerifySignature(data, signature, key)
  }
}

/**
 * SM3哈希算法
 */
export class SM3Hash {
  /**
   * 计算SM3哈希值
   */
  static hash(data: string): string {
    return sm3(data)
  }

  /**
   * 计算文件SM3哈希值
   */
  static async hashFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer
          const uint8Array = new Uint8Array(arrayBuffer)
          const binaryString = Array.from(uint8Array)
            .map(byte => String.fromCharCode(byte))
            .join('')
          resolve(sm3(binaryString))
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * HMAC-SM3
   */
  static hmac(data: string, key: string): string {
    // 简化的HMAC实现，实际项目中建议使用专门的HMAC库
    const keyHash = sm3(key)
    return sm3(keyHash + data)
  }
}

/**
 * SM4对称加密
 */
export class SM4Crypto {
  private config: SM4Config

  constructor(config: SM4Config) {
    this.config = {
      mode: 'ecb',
      ...config
    }
  }

  /**
   * 生成随机SM4密钥
   */
  static generateKey(): string {
    const chars = '0123456789abcdef'
    let key = ''
    for (let i = 0; i < 32; i++) {
      key += chars[Math.floor(Math.random() * chars.length)]
    }
    return key
  }

  /**
   * 生成随机IV
   */
  static generateIV(): string {
    return SM4Crypto.generateKey()
  }

  /**
   * 加密数据
   */
  encrypt(data: string): string {
    if (this.config.mode === 'cbc' && this.config.iv) {
      return sm4.encrypt(data, this.config.key, { mode: 'cbc', iv: this.config.iv })
    }
    return sm4.encrypt(data, this.config.key, { mode: 'ecb' })
  }

  /**
   * 解密数据
   */
  decrypt(encryptedData: string): string {
    if (this.config.mode === 'cbc' && this.config.iv) {
      return sm4.decrypt(encryptedData, this.config.key, { mode: 'cbc', iv: this.config.iv })
    }
    return sm4.decrypt(encryptedData, this.config.key, { mode: 'ecb' })
  }
}

/**
 * 安全随机数生成器
 */
export class SecureRandom {
  /**
   * 生成安全随机字符串
   */
  static generateString(length: number = 32): string {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * 生成安全随机数
   */
  static generateNumber(min: number = 0, max: number = 100): number {
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    return min + (array[0] % (max - min + 1))
  }
}

/**
 * 数据完整性验证
 */
export class DataIntegrity {
  /**
   * 生成数据指纹
   */
  static generateFingerprint(data: any): string {
    const dataString = JSON.stringify(data, Object.keys(data).sort())
    return SM3Hash.hash(dataString)
  }

  /**
   * 验证数据完整性
   */
  static verify(data: any, fingerprint: string): boolean {
    return this.generateFingerprint(data) === fingerprint
  }
}

/**
 * 敏感数据加密存储
 */
export class SensitiveDataCrypto {
  private sm4: SM4Crypto
  private static instance: SensitiveDataCrypto

  private constructor() {
    // 从环境变量或配置中获取密钥
    const key = import.meta.env.VITE_DATA_ENCRYPT_KEY || SM4Crypto.generateKey()
    this.sm4 = new SM4Crypto({ key })
  }

  static getInstance(): SensitiveDataCrypto {
    if (!this.instance) {
      this.instance = new SensitiveDataCrypto()
    }
    return this.instance
  }

  /**
   * 加密敏感数据
   */
  encrypt(data: string): string {
    try {
      return this.sm4.encrypt(data)
    } catch (error) {
      console.error('数据加密失败:', error)
      throw new Error('数据加密失败')
    }
  }

  /**
   * 解密敏感数据
   */
  decrypt(encryptedData: string): string {
    try {
      return this.sm4.decrypt(encryptedData)
    } catch (error) {
      console.error('数据解密失败:', error)
      throw new Error('数据解密失败')
    }
  }

  /**
   * 加密对象中的敏感字段
   */
  encryptSensitiveFields(obj: any, fields: string[]): any {
    const result = { ...obj }
    fields.forEach(field => {
      if (result[field]) {
        result[field] = this.encrypt(String(result[field]))
      }
    })
    return result
  }

  /**
   * 解密对象中的敏感字段
   */
  decryptSensitiveFields(obj: any, fields: string[]): any {
    const result = { ...obj }
    fields.forEach(field => {
      if (result[field]) {
        try {
          result[field] = this.decrypt(result[field])
        } catch (error) {
          console.warn(`解密字段 ${field} 失败:`, error)
        }
      }
    })
    return result
  }
}

// 导出单例实例
export const sensitiveDataCrypto = SensitiveDataCrypto.getInstance()

// 导出默认配置的加密实例
export const defaultSM2 = new SM2Crypto()
export const defaultSM4 = new SM4Crypto({ key: SM4Crypto.generateKey() })

// 工具函数
export const cryptoUtils = {
  // 密码加密
  hashPassword: (password: string): string => SM3Hash.hash(password),
  
  // 生成盐值
  generateSalt: (): string => SecureRandom.generateString(16),
  
  // 加盐哈希
  hashWithSalt: (data: string, salt: string): string => SM3Hash.hash(data + salt),
  
  // 生成会话令牌
  generateToken: (): string => SecureRandom.generateString(64),
  
  // 生成UUID
  generateUUID: (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
}
