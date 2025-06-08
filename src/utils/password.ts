import { SM3Hash, cryptoUtils } from './crypto'

// 密码复杂度配置
export interface PasswordConfig {
  minLength: number
  maxLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumber: boolean
  requireSpecial: boolean
  forbiddenWords: string[]
  maxRepeatedChars: number
}

// 默认密码配置
export const defaultPasswordConfig: PasswordConfig = {
  minLength: 8,
  maxLength: 32,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  forbiddenWords: ['password', '123456', 'admin', 'user', 'root', 'guest'],
  maxRepeatedChars: 3
}

// 密码强度等级
export enum PasswordStrength {
  WEAK = 1,
  FAIR = 2,
  GOOD = 3,
  STRONG = 4,
  VERY_STRONG = 5
}

// 密码验证结果
export interface PasswordValidationResult {
  valid: boolean
  strength: PasswordStrength
  score: number
  messages: string[]
  suggestions: string[]
}

/**
 * 密码复杂度验证
 */
export const validatePassword = (
  password: string, 
  config: PasswordConfig = defaultPasswordConfig
): PasswordValidationResult => {
  const messages: string[] = []
  const suggestions: string[] = []
  let score = 0

  // 长度检查
  if (password.length < config.minLength) {
    messages.push(`密码长度至少${config.minLength}位`)
    suggestions.push(`增加密码长度到${config.minLength}位以上`)
  } else {
    score += Math.min(password.length * 2, 20)
  }

  if (password.length > config.maxLength) {
    messages.push(`密码长度不能超过${config.maxLength}位`)
  }

  // 字符类型检查
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

  if (config.requireUppercase && !hasUppercase) {
    messages.push('密码必须包含大写字母')
    suggestions.push('添加大写字母A-Z')
  } else if (hasUppercase) {
    score += 10
  }

  if (config.requireLowercase && !hasLowercase) {
    messages.push('密码必须包含小写字母')
    suggestions.push('添加小写字母a-z')
  } else if (hasLowercase) {
    score += 10
  }

  if (config.requireNumber && !hasNumber) {
    messages.push('密码必须包含数字')
    suggestions.push('添加数字0-9')
  } else if (hasNumber) {
    score += 10
  }

  if (config.requireSpecial && !hasSpecial) {
    messages.push('密码必须包含特殊字符')
    suggestions.push('添加特殊字符如!@#$%^&*')
  } else if (hasSpecial) {
    score += 15
  }

  // 重复字符检查
  const repeatedChars = findRepeatedChars(password)
  if (repeatedChars > config.maxRepeatedChars) {
    messages.push(`密码中相同字符连续出现不能超过${config.maxRepeatedChars}次`)
    suggestions.push('减少重复字符的使用')
    score -= 10
  }

  // 常见密码检查
  const lowerPassword = password.toLowerCase()
  const foundForbiddenWord = config.forbiddenWords.find(word => 
    lowerPassword.includes(word.toLowerCase())
  )
  if (foundForbiddenWord) {
    messages.push(`密码不能包含常见词汇: ${foundForbiddenWord}`)
    suggestions.push('避免使用常见词汇和简单模式')
    score -= 20
  }

  // 字符多样性加分
  const uniqueChars = new Set(password).size
  score += Math.min(uniqueChars * 2, 20)

  // 模式检查（连续数字、字母等）
  if (hasSequentialPattern(password)) {
    messages.push('密码不能包含连续的数字或字母序列')
    suggestions.push('避免使用123456或abcdef等连续序列')
    score -= 15
  }

  // 计算最终强度
  const strength = calculatePasswordStrength(score)
  
  return {
    valid: messages.length === 0,
    strength,
    score: Math.max(0, Math.min(100, score)),
    messages,
    suggestions
  }
}

/**
 * 查找重复字符
 */
const findRepeatedChars = (password: string): number => {
  let maxRepeated = 0
  let currentRepeated = 1

  for (let i = 1; i < password.length; i++) {
    if (password[i] === password[i - 1]) {
      currentRepeated++
    } else {
      maxRepeated = Math.max(maxRepeated, currentRepeated)
      currentRepeated = 1
    }
  }
  
  return Math.max(maxRepeated, currentRepeated)
}

/**
 * 检查连续模式
 */
const hasSequentialPattern = (password: string): boolean => {
  // 检查连续数字
  for (let i = 0; i <= password.length - 3; i++) {
    const slice = password.slice(i, i + 3)
    if (/^\d{3}$/.test(slice)) {
      const num1 = parseInt(slice[0])
      const num2 = parseInt(slice[1])
      const num3 = parseInt(slice[2])
      if (num2 === num1 + 1 && num3 === num2 + 1) {
        return true
      }
    }
  }

  // 检查连续字母
  for (let i = 0; i <= password.length - 3; i++) {
    const slice = password.slice(i, i + 3).toLowerCase()
    if (/^[a-z]{3}$/.test(slice)) {
      const char1 = slice.charCodeAt(0)
      const char2 = slice.charCodeAt(1)
      const char3 = slice.charCodeAt(2)
      if (char2 === char1 + 1 && char3 === char2 + 1) {
        return true
      }
    }
  }

  return false
}

/**
 * 计算密码强度
 */
const calculatePasswordStrength = (score: number): PasswordStrength => {
  if (score < 30) return PasswordStrength.WEAK
  if (score < 50) return PasswordStrength.FAIR
  if (score < 70) return PasswordStrength.GOOD
  if (score < 90) return PasswordStrength.STRONG
  return PasswordStrength.VERY_STRONG
}

/**
 * 获取密码强度文本
 */
export const getPasswordStrengthText = (strength: PasswordStrength): string => {
  const texts = {
    [PasswordStrength.WEAK]: '弱',
    [PasswordStrength.FAIR]: '一般',
    [PasswordStrength.GOOD]: '良好',
    [PasswordStrength.STRONG]: '强',
    [PasswordStrength.VERY_STRONG]: '非常强'
  }
  return texts[strength]
}

/**
 * 获取密码强度颜色
 */
export const getPasswordStrengthColor = (strength: PasswordStrength): string => {
  const colors = {
    [PasswordStrength.WEAK]: '#f56c6c',
    [PasswordStrength.FAIR]: '#e6a23c',
    [PasswordStrength.GOOD]: '#409eff',
    [PasswordStrength.STRONG]: '#67c23a',
    [PasswordStrength.VERY_STRONG]: '#67c23a'
  }
  return colors[strength]
}

// 使用SM3加密密码
export const encryptPassword = (password: string, salt?: string): string => {
  const actualSalt = salt || cryptoUtils.generateSalt()
  return cryptoUtils.hashWithSalt(password, actualSalt)
}

// 验证密码
export const verifyPassword = (password: string, hash: string, salt: string): boolean => {
  return cryptoUtils.hashWithSalt(password, salt) === hash
}

// 生成随机密码
export const generateRandomPassword = (
  length: number = 12, 
  config: Partial<PasswordConfig> = {}
): string => {
  const finalConfig = { ...defaultPasswordConfig, ...config }
  
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  let chars = ''
  let password = ''
  
  // 根据配置添加字符集
  if (finalConfig.requireLowercase) {
    chars += lowercase
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
  }
  
  if (finalConfig.requireUppercase) {
    chars += uppercase
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
  }
  
  if (finalConfig.requireNumber) {
    chars += numbers
    password += numbers[Math.floor(Math.random() * numbers.length)]
  }
  
  if (finalConfig.requireSpecial) {
    chars += special
    password += special[Math.floor(Math.random() * special.length)]
  }
  
  // 填充剩余长度
  for (let i = password.length; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  
  // 打乱密码顺序
  return password.split('').sort(() => 0.5 - Math.random()).join('')
}

/**
 * 检查密码是否即将过期
 */
export const checkPasswordExpiry = (
  lastChangeDate: Date, 
  expireDays: number
): { isExpiring: boolean; daysLeft: number; isExpired: boolean } => {
  const now = new Date()
  const daysSinceChange = Math.floor((now.getTime() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24))
  const daysLeft = expireDays - daysSinceChange
  
  return {
    isExpiring: daysLeft <= 7 && daysLeft > 0,
    daysLeft: Math.max(0, daysLeft),
    isExpired: daysLeft <= 0
  }
}

/**
 * 生成密码重置令牌
 */
export const generatePasswordResetToken = (): { token: string; expires: Date } => {
  const token = cryptoUtils.generateToken()
  const expires = new Date()
  expires.setHours(expires.getHours() + 24) // 24小时过期
  
  return { token, expires }
}

/**
 * 验证密码重置令牌
 */
export const validatePasswordResetToken = (token: string, expires: Date): boolean => {
  return new Date() < expires && token.length === 128 // 64字节十六进制字符串
}
