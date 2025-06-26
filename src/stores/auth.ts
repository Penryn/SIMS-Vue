import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {LoginForm, UserInfo, UserRole} from '@/types/auth'
import { login, getUserInfo, logout } from '@/api/auth'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)
  const lastPasswordChangeTime = ref<number>(parseInt(localStorage.getItem('lastPasswordChangeTime') || '0'))
  const forcePasswordChange = ref<boolean>(false)
  const router = useRouter()

  const isAuthenticated = computed(() => !!token.value && !!userInfo.value)
  const userRole = computed(() => userInfo.value?.role || '')
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
  const setPasswordChanged = () => {
    lastPasswordChangeTime.value = Date.now()
    forcePasswordChange.value = false
    localStorage.setItem('lastPasswordChangeTime', lastPasswordChangeTime.value.toString())
  };  // 添加分号
  
  const loginUser = async (loginForm: LoginForm) => {
    try {
      const response = await login(loginForm)
      
      // 根据后端返回的数据结构进行调整
      // 假设后端返回的结构是 { token, id, username, name, firstLogin }
      setToken(response.data.token)
      
      // 构造 UserInfo 对象
      const userInfo: UserInfo = {
        id: response.data.id,
        username: response.data.username,
        name: response.data.name,
        role: mapRoleFromBackend(response.data.roles),
        isFirstLogin: response.data.firstLogin
      }
      
      setUserInfo(userInfo)
      
      // 检查是否是首次登录
      if (response.data.firstLogin) {
        forcePasswordChange.value = true
      }
      
      return response
    } catch (error) {
      // 登录失败时清理本地状态，防止异常访问
      token.value = ''
      userInfo.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('lastPasswordChangeTime')
      localStorage.removeItem('forcePasswordChange')
      lastPasswordChangeTime.value = 0
      forcePasswordChange.value = false
      throw error
    }
  }
  
  // 将后端角色映射到前端角色
  const mapRoleFromBackend = (roles: string[]): UserRole => {
    if (!roles || !roles.length) return 'student'
    
    // 将 ROLE_XXX 格式的角色转换为前端使用的格式
    const roleMap: Record<string, UserRole> = {
      'ROLE_STUDENT': 'student',
      'ROLE_TEACHER': 'teacher',
      'ROLE_COLLEGE_SECRETARY': 'college_admin',
      'ROLE_COLLEGE_ADMIN': 'college_admin',
      'ROLE_COLLEGE_LEADER': 'college_leader',
      'ROLE_GRADUATE_ADMIN': 'grad_admin',
      'ROLE_GRADUATE_LEADER': 'grad_leader',
      'ROLE_SCHOOL_LEADER': 'school_leader',
      'ROLE_SYSTEM_ADMIN': 'system_admin',
      'ROLE_AUDIT_ADMIN': 'audit_admin'
    }
    
    // 找到最高权限的角色
    for (const role of roles) {
      if (role in roleMap) {
        return roleMap[role]
      }
    }
    
    return 'student'
  }
  const fetchUserInfo = async () => {
    try {
      const response = await getUserInfo()
      
      // 检查响应格式
      let userData = response.data;
      
      // 如果返回的是 { code, data, message } 格式
      if (response.code !== undefined && response.data !== undefined) {
        userData = response.data;
      }
      
      // 构造 UserInfo 对象
      const userInfo: UserInfo = {
        id: userData.id,
        username: userData.username,
        name: userData.name,
        role: mapRoleFromBackend(userData.roles || []),
        isFirstLogin: userData.firstLogin
      };
      
      // 如果有学院信息，添加进去
      if (userData.collegeId) {
        userInfo.collegeId = userData.collegeId;
        userInfo.collegeName = userData.collegeName;
      }
      
      setUserInfo(userInfo);
    } catch (error) {
      await logoutUser()
      throw error
    }
  }
  const logoutUser = async () => {
    try {
      // 只有在已登录状态下才调用登出接口
      if (token.value) {
        const response = await logout()
        if (!response.success) {
          ElMessage.warning(response.message || '登出失败')
          console.warn('登出失败：', response.message || '未知错误')
        }
      }
    } catch (error) {
      ElMessage.error('登出请求异常')
      console.warn('Logout request failed:', error)
    } finally {
      // 无论如何都要清理本地状态
      token.value = ''
      userInfo.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('lastPasswordChangeTime')
      localStorage.removeItem('forcePasswordChange')
      lastPasswordChangeTime.value = 0
      forcePasswordChange.value = false
      // 跳转到登录页
      router.push({ name: 'Login' })
    }
  }
  // 自动登出定时器
  let autoLogoutTimer: number | null = null
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

  // 权限验证方法
  const hasPermission = (permission: string | string[]): boolean => {
    if (!userInfo.value || !userRole.value) {
      return false
    }

    const permissions = Array.isArray(permission) ? permission : [permission]
    const rolePermissions = getRolePermissions(userRole.value)
    
    return permissions.some(p => rolePermissions.includes(p))
  }

  const hasRole = (role: string | string[]): boolean => {
    if (!userRole.value) {
      return false
    }

    const roles = Array.isArray(role) ? role : [role]
    return roles.includes(userRole.value)
  }

  // 获取角色权限
  const getRolePermissions = (role: string): string[] => {
    const rolePermissionMap: Record<string, string[]> = {
      student: [
        'STUDENT_VIEW_OWN',
        'STUDENT_EDIT_OWN',
        'PASSWORD_CHANGE'
      ],
      teacher: [
        'STUDENT_VIEW_SUPERVISED',
        'STUDENT_EDIT_SUPERVISED', 
        'TEACHER_VIEW_OWN',
        'TEACHER_EDIT_OWN',
        'PASSWORD_CHANGE'
      ],
      college_admin: [
        'STUDENT_VIEW',
        'STUDENT_CREATE',
        'STUDENT_EDIT',
        'STUDENT_DELETE',
        'STUDENT_IMPORT',
        'STUDENT_EXPORT',
        'TEACHER_VIEW',
        'PASSWORD_CHANGE'
      ],
      college_leader: [
        'STUDENT_VIEW',
        'STUDENT_EDIT',
        'STUDENT_APPROVE',
        'TEACHER_VIEW',
        'TEACHER_APPROVE',
        'PASSWORD_CHANGE'
      ],
      grad_admin: [
        'STUDENT_VIEW',
        'STUDENT_CREATE',
        'STUDENT_EDIT',
        'STUDENT_DELETE',
        'STUDENT_IMPORT',
        'STUDENT_EXPORT',
        'STUDENT_APPROVE',
        'TEACHER_VIEW',
        'TEACHER_CREATE',
        'TEACHER_EDIT',
        'TEACHER_DELETE',
        'PASSWORD_CHANGE'
      ],
      grad_leader: [
        'STUDENT_VIEW',
        'STUDENT_APPROVE',
        'TEACHER_VIEW',
        'TEACHER_APPROVE',
        'PASSWORD_CHANGE'
      ],
      school_leader: [
        'STUDENT_VIEW',
        'TEACHER_VIEW',
        'REPORT_VIEW',
        'PASSWORD_CHANGE'
      ],
      system_admin: [
        'USER_CREATE',
        'USER_EDIT',
        'USER_DELETE',
        'USER_VIEW',
        'ROLE_MANAGE',
        'SYSTEM_CONFIG',
        'SYSTEM_BACKUP',
        'PASSWORD_RESET',
        'PASSWORD_CHANGE'
      ],
      audit_admin: [
        'LOG_VIEW',
        'LOG_EXPORT',
        'AUDIT_REPORT',
        'PASSWORD_CHANGE'
      ]
    }

    return rolePermissionMap[role] || []
  }
  return {
    token,
    userInfo,
    isAuthenticated,
    userRole,
    needPasswordChange,
    forcePasswordChange,
    loginUser,
    fetchUserInfo,
    logout: logoutUser,
    setPasswordChanged,
    resetAutoLogoutTimer,
    hasPermission,
    hasRole,
    getRolePermissions
  }
})
