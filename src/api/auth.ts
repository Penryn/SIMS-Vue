import request from '@/utils/request'
import type { LoginForm, UserInfo, ChangePasswordForm } from '@/types/auth'

// 登录
export const login = (data: LoginForm) => {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

// 获取用户信息
export const getUserInfo = () => {
  return request({
    url: '/users/current',
    method: 'get'
  })
}

// 登出
export const logout = () => {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

// 修改密码
export const changePassword = (data: ChangePasswordForm) => {
  return request({
    url: '/auth/change-password',
    method: 'post',
    data
  })
}
