/**
 * 数据脱敏工具函数
 * 用于在前端显示敏感数据时进行脱敏处理
 */

// 手机号脱敏
export const maskPhone = (phone: string): string => {
  if (!phone) return ''
  if (phone.length !== 11) return phone
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// 身份证号脱敏
export const maskIdCard = (idCard: string): string => {
  if (!idCard) return ''
  if (idCard.length === 18) {
    return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
  } else if (idCard.length === 15) {
    return idCard.replace(/(\d{6})\d{6}(\d{3})/, '$1******$2')
  }
  return idCard
}

// 邮箱脱敏
export const maskEmail = (email: string): string => {
  if (!email) return ''
  const [username, domain] = email.split('@')
  if (!username || !domain) return email
  
  if (username.length <= 2) {
    return `${username}****@${domain}`
  } else {
    const firstChar = username.charAt(0)
    const lastChar = username.charAt(username.length - 1)
    return `${firstChar}****${lastChar}@${domain}`
  }
}

// 姓名脱敏
export const maskName = (name: string): string => {
  if (!name) return ''
  if (name.length === 1) {
    return name
  } else if (name.length === 2) {
    return name.charAt(0) + '*'
  } else {
    return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1)
  }
}

// 银行卡号脱敏
export const maskBankCard = (cardNumber: string): string => {
  if (!cardNumber) return ''
  if (cardNumber.length < 8) return cardNumber
  
  const first4 = cardNumber.substring(0, 4)
  const last4 = cardNumber.substring(cardNumber.length - 4)
  return `${first4}${'*'.repeat(cardNumber.length - 8)}${last4}`
}

// 地址脱敏
export const maskAddress = (address: string): string => {
  if (!address) return ''
  if (address.length <= 6) return address
  
  const visible = Math.ceil(address.length * 0.3)
  const masked = address.length - visible
  return address.substring(0, visible) + '*'.repeat(Math.min(masked, 4)) + '...'
}

// 通用脱敏函数
export const maskData = (data: string, type: 'phone' | 'idCard' | 'email' | 'name' | 'bankCard' | 'address'): string => {
  switch (type) {
    case 'phone':
      return maskPhone(data)
    case 'idCard':
      return maskIdCard(data)
    case 'email':
      return maskEmail(data)
    case 'name':
      return maskName(data)
    case 'bankCard':
      return maskBankCard(data)
    case 'address':
      return maskAddress(data)
    default:
      return data
  }
}

// 根据用户角色判断是否需要脱敏
export const shouldMaskData = (userRole: string, dataField: string): boolean => {
  // 系统管理员和审计管理员可以查看原始数据
  if (['system_admin', 'audit_admin'].includes(userRole)) {
    return false
  }
  
  // 敏感字段列表
  const sensitiveFields = ['phone', 'idCard', 'email', 'bankCard', 'address']
  
  return sensitiveFields.includes(dataField)
}

// 格式化显示数据（带脱敏）
export const formatDisplayData = (
  data: string, 
  type: 'phone' | 'idCard' | 'email' | 'name' | 'bankCard' | 'address',
  userRole: string
): string => {
  if (shouldMaskData(userRole, type)) {
    return maskData(data, type)
  }
  return data
}
