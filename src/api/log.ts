import request from '@/utils/request'

/**
 * 获取系统日志列表
 */
export function getSystemLogs(params: {
  page?: number
  size?: number
  action?: string
  resourceType?: string
  username?: string
  success?: boolean
  startTime?: string
  endTime?: string
}) {
  return request({
    url: '/api/audit-logs',
    method: 'get',
    params
  })
}

/**
 * 导出系统日志
 */
export function exportLogs(params?: any) {
  return request({
    url: '/api/audit-logs/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 获取系统统计信息
export const getSystemStats = () => {
  return request({
    url: '/log/stats',
    method: 'get'
  })
}

// 获取最近登录记录
export const getRecentLogs = (params?: { limit?: number }) => {
  return request({
    url: '/log/recent',
    method: 'get',
    params
  })
}
