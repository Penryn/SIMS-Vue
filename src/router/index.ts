import { createRouter, createWebHistory } from 'vue-router'
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
      meta: { requiresAuth: false }
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
        },
        {
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
          path: 'change-password',
          name: 'ChangePassword',
          component: () => import('@/views/ChangePassword.vue'),
          meta: { 
            title: '修改密码',
            icon: 'Lock',
            roles: ['student', 'teacher', 'college_admin', 'college_leader', 'grad_admin', 'grad_leader', 'school_leader', 'system_admin', 'audit_admin']
          }
        }
      ]
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
  } else if (to.meta.roles && !to.meta.roles.includes(authStore.userRole)) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
