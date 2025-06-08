import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LoginForm, UserInfo } from '@/types/auth'
import { login, getUserInfo, logout } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)
  const loginFailCount = ref<number>(parseInt(localStorage.getItem('loginFailCount') || '0'))
  const lockoutTime = ref<number>(parseInt(localStorage.getItem('lockoutTime') || '0'))
  const lastPasswordChangeTime = ref<number>(parseInt(localStorage.getItem('lastPasswordChangeTime') || '0'))
  const forcePasswordChange = ref<boolean>(false)

  const isAuthenticated = computed(() => !!token.value && !!userInfo.value)
  const userRole = computed(() => userInfo.value?.role || '')
  const isLocked = computed(() => {
    const now = Date.now()
    return lockoutTime.value > now
  })
  const needPasswordChange = computed(() => {
    const now = Date.now()
    const daysSinceLastChange = (now - lastPasswordChangeTime.value) / (1000 * 60 * 60 * 24)
    return daysSinceLastChange >= 90 || forcePasswordChange.value
  })

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const setUserInfo = (info: UserInfo) => {
    userInfo.value = info
  }

  const handleLoginFail = () => {
    loginFailCount.value += 1
    localStorage.setItem('loginFailCount', loginFailCount.value.toString())
    
    if (loginFailCount.value >= 5) {
      const lockTime = Date.now() + 30 * 60 * 1000 // 30分钟
      lockoutTime.value = lockTime
      localStorage.setItem('lockoutTime', lockTime.toString())
    }
  }

  const resetLoginFail = () => {
    loginFailCount.value = 0
    lockoutTime.value = 0
    localStorage.removeItem('loginFailCount')
    localStorage.removeItem('lockoutTime')
  }

  const setPasswordChanged = () => {
    lastPasswordChangeTime.value = Date.now()
    forcePasswordChange.value = false
    localStorage.setItem('lastPasswordChangeTime', lastPasswordChangeTime.value.toString())
  }

  const loginUser = async (loginForm: LoginForm) => {
    try {
      const response = await login(loginForm)
      setToken(response.data.token)
      setUserInfo(response.data.userInfo)
      resetLoginFail()
      
      // 检查是否是首次登录
      if (response.data.userInfo.isFirstLogin) {
        forcePasswordChange.value = true
      }
      
      return response
    } catch (error) {
      handleLoginFail()
      throw error
    }
  }

  const fetchUserInfo = async () => {
    try {
      const response = await getUserInfo()
      setUserInfo(response.data)
    } catch (error) {
      await logoutUser()
      throw error
    }
  }

  const logoutUser = async () => {
    try {
      await logout()
    } finally {
      token.value = ''
      userInfo.value = null
      localStorage.removeItem('token')
    }
  }

  // 自动登出定时器
  let autoLogoutTimer: NodeJS.Timeout | null = null

  const resetAutoLogoutTimer = () => {
    if (autoLogoutTimer) {
      clearTimeout(autoLogoutTimer)
    }
    
    if (isAuthenticated.value) {
      autoLogoutTimer = setTimeout(() => {
        logoutUser()
      }, 30 * 60 * 1000) // 30分钟
    }
  }

  return {
    token,
    userInfo,
    loginFailCount,
    lockoutTime,
    isAuthenticated,
    userRole,
    isLocked,
    needPasswordChange,
    forcePasswordChange,
    loginUser,
    fetchUserInfo,
    logoutUser,
    handleLoginFail,
    resetLoginFail,
    setPasswordChanged,
    resetAutoLogoutTimer
  }
})
