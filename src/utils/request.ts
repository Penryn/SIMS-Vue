import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/sims/api',
  timeout: 10000
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    
    // 重置自动登出定时器
    authStore.resetAutoLogoutTimer()
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data
    
    // 处理不同的API返回格式
    // 有些后端API可能返回 { code, data, message } 格式
    // 有些可能直接返回数据
    
    // 如果有返回码并且不是200，显示错误信息
    if (res.code !== undefined && res.code !== 200) {
      // 对于登录接口，不在这里显示错误消息，让登录页面处理
      if (!response.config?.url?.includes('/auth/login')) {
        ElMessage.error(res.message || '请求失败')
      }
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    
    return res
  },(error) => {
    const authStore = useAuthStore()
    
    if (error.response?.status === 401) {
      // 如果是登录接口返回401，不要自动登出，也不显示通用错误消息
      if (error.config?.url?.includes('/auth/login')) {
        // 登录失败，不做额外处理，让登录页面处理错误
        return Promise.reject(error)
      }
      
      // 其他401错误表示token过期或无效
      authStore.logoutUser()
      router.push('/login')
      ElMessage.error('登录已过期，请重新登录')
    } else if (error.response?.status === 403) {
      ElMessage.error('权限不足')
    } else {
      // 对于登录接口，不在这里显示网络错误消息
      if (!error.config?.url?.includes('/auth/login')) {
        ElMessage.error(error.message || '网络错误')
      }
    }
    
    return Promise.reject(error)
  }
)

export default service
