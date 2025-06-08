import request from '@/utils/request'

// 获取用户列表
export const getUserList = (params?: any) => {
  return request({
    url: '/user/list',
    method: 'get',
    params
  })
}

// 创建用户
export const createUser = (data: any) => {
  return request({
    url: '/user/create',
    method: 'post',
    data
  })
}

// 更新用户
export const updateUser = (id: number, data: any) => {
  return request({
    url: `/user/${id}`,
    method: 'put',
    data
  })
}

// 删除用户
export const deleteUser = (id: number) => {
  return request({
    url: `/user/${id}`,
    method: 'delete'
  })
}

// 重置密码
export const resetPassword = (id: number) => {
  return request({
    url: `/user/${id}/reset-password`,
    method: 'post'
  })
}

// 启用/禁用用户
export const toggleUserStatus = (id: number, enabled: boolean) => {
  return request({
    url: `/user/${id}/toggle-status`,
    method: 'post',
    data: { enabled }
  })
}

// 修改密码
export const changePassword = (data: { oldPassword: string; newPassword: string }) => {
  return request({
    url: '/user/change-password',
    method: 'post',
    data
  })
}

// 检查历史密码
export const checkPasswordHistory = (data: { userId?: number; newPassword: string }) => {
  return request({
    url: '/user/check-password-history',
    method: 'post',
    data
  })
}

// 获取密码修改记录
export const getPasswordHistory = () => {
  return request({
    url: '/user/password-history',
    method: 'get'
  })
}

/**
 * 导出用户数据
 */
export function exportUsers(params?: any) {
  return request({
    url: '/api/users/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}
