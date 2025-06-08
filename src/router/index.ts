import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import Login from '@/views/Login.vue'
import Layout from '@/layout/index.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: { 
        requiresAuth: false,
        title: '用户登录'
      }
    },
    {
      path: '/',
      component: Layout,
      redirect: '/dashboard',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/Dashboard.vue'),
          meta: { 
            title: '首页',
            icon: 'House',
            roles: ['student', 'teacher', 'college_admin', 'college_leader', 'grad_admin', 'grad_leader', 'school_leader', 'system_admin', 'audit_admin']
          }
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('@/views/student/Profile.vue'),
          meta: { 
            title: '个人信息',
            icon: 'User',
            roles: ['student', 'teacher', 'college_admin', 'college_leader', 'grad_admin', 'grad_leader', 'school_leader']
          }
        },
        {
          path: 'students',
          name: 'Students',
          component: () => import('@/views/admin/StudentManagement.vue'),
          meta: { 
            title: '学生管理',
            icon: 'UserFilled',
            roles: ['college_admin', 'college_leader', 'grad_admin', 'grad_leader', 'school_leader']
          }
        },
        {
          path: 'teachers',
          name: 'Teachers',
          component: () => import('@/views/admin/TeacherManagement.vue'),
          meta: { 
            title: '导师管理',
            icon: 'Avatar',
            roles: ['grad_admin', 'grad_leader', 'school_leader']
          }
        },
        {
          path: 'my-students',
          name: 'MyStudents',
          component: () => import('@/views/teacher/MyStudents.vue'),
          meta: { 
            title: '我的学生',
            icon: 'Tickets',
            roles: ['teacher']
          }
        },
        {
          path: 'user-management',
          name: 'UserManagement',
          component: () => import('@/views/system/UserManagement.vue'),
          meta: { 
            title: '用户管理',
            icon: 'Setting',
            roles: ['system_admin']
          }
        },        {
          path: 'audit-logs',
          name: 'AuditLogs',
          component: () => import('@/views/audit/AuditLogs.vue'),
          meta: { 
            title: '审计日志',
            icon: 'Document',
            roles: ['audit_admin']
          }
        },
        {
          path: 'import-export',
          name: 'ImportExport',
          component: () => import('@/views/admin/ImportExport.vue'),
          meta: { 
            title: '数据导入导出',
            icon: 'Upload',
            roles: ['college_admin', 'grad_admin', 'system_admin']
          }
        },
        {
          path: 'change-password',
          name: 'ChangePassword',
          component: () => import('@/views/ChangePassword.vue'),
          meta: { 
            title: '修改密码',
            icon: 'Lock',
            keepAlive: false,
            roles: ['student', 'teacher', 'college_admin', 'college_leader', 'grad_admin', 'grad_leader', 'school_leader', 'system_admin', 'audit_admin']
          }
        }
      ]
    },
    // 404页面
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/404.vue'),
      meta: { title: '页面不存在' }
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 学籍信息管理系统`
  }
  
  // 如果访问登录页且已经登录，直接跳转到首页
  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
    return
  }
  
  // 如果需要认证但未登录，跳转到登录页
  if (to.meta?.requiresAuth !== false && !authStore.isAuthenticated) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }
  
  // 权限检查
  if (to.meta?.roles && Array.isArray(to.meta.roles)) {
    const userRole = authStore.userRole
    if (userRole && !to.meta.roles.includes(userRole)) {
      ElMessage.error('您没有访问此页面的权限')
      next('/dashboard')
      return
    }
  }
  
  // 检查密码是否需要修改
  if (authStore.needPasswordChange && to.path !== '/change-password' && to.path !== '/login') {
    ElMessage.warning('您的密码已过期，请先修改密码')
    next('/change-password')
    return
  }
  
  next()
})

// 路由后置守卫
router.afterEach((to) => {
  // 记录页面访问日志
  if (to.meta?.requiresAuth !== false) {
    const authStore = useAuthStore()
    if (authStore.isAuthenticated) {
      // 这里可以调用API记录访问日志
      console.log(`用户 ${authStore.userInfo?.username} 访问了页面: ${to.path}`)
    }
  }
})

export default router
