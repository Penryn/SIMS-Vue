<template>
  <div class="layout-container">
    <el-container>
      <!-- 头部导航 -->
      <el-header class="layout-header">
        <div class="header-left">
          <div class="logo">
            <img src="/logo.png" alt="SIMS" class="logo-img" />
            <span class="logo-text">学籍信息管理系统</span>
          </div>
        </div>
        
        <div class="header-right">
          <!-- 全屏切换 -->
          <el-tooltip content="全屏" placement="bottom">
            <el-button text @click="toggleFullscreen" class="header-btn">
              <el-icon><FullScreen /></el-icon>
            </el-button>
          </el-tooltip>
          
          <!-- 消息通知 -->
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
            <el-tooltip content="消息通知" placement="bottom">
              <el-button text @click="showNotifications" class="header-btn">
                <el-icon><Bell /></el-icon>
              </el-button>
            </el-tooltip>
          </el-badge>
          
          <!-- 用户下拉菜单 -->
          <el-dropdown @command="handleUserMenuCommand" class="user-dropdown">
            <div class="user-info">
              <el-avatar :size="32" :src="authStore.userInfo?.avatar">
                {{ authStore.userInfo?.name?.substring(0, 1) }}
              </el-avatar>
              <span class="username">{{ authStore.userInfo?.name }}</span>
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人信息
                </el-dropdown-item>
                <el-dropdown-item command="changePassword">
                  <el-icon><Lock /></el-icon>
                  修改密码
                </el-dropdown-item>
                <el-dropdown-item command="settings" v-if="canAccessSettings">
                  <el-icon><Setting /></el-icon>
                  系统设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-container>
        <!-- 侧边栏 -->
        <el-aside :width="sidebarCollapsed ? '64px' : '200px'" class="layout-sidebar">
          <div class="sidebar-toggle">
            <el-button 
              text 
              @click="toggleSidebar" 
              class="toggle-btn"
              :icon="sidebarCollapsed ? Expand : Fold"
            />
          </div>
          
          <el-menu
            :default-active="$route.path"
            :collapse="sidebarCollapsed"
            :unique-opened="true"
            router
            class="sidebar-menu"
          >
            <template v-for="menu in menuList" :key="menu.path">
              <!-- 一级菜单（有子菜单） -->
              <el-sub-menu 
                v-if="menu.children && menu.children.length > 0" 
                :index="menu.path"
              >
                <template #title>
                  <el-icon>
                    <component :is="menu.icon" />
                  </el-icon>
                  <span>{{ menu.title }}</span>
                </template>
                <!-- 二级菜单 -->
                <el-menu-item 
                  v-for="child in menu.children" 
                  :key="child.path"
                  :index="child.path"
                >
                  <el-icon>
                    <component :is="child.icon" />
                  </el-icon>
                  <template #title>{{ child.title }}</template>
                </el-menu-item>
              </el-sub-menu>
              
              <!-- 一级菜单（无子菜单） -->
              <el-menu-item v-else :index="menu.path">
                <el-icon>
                  <component :is="menu.icon" />
                </el-icon>
                <template #title>{{ menu.title }}</template>
              </el-menu-item>
            </template>
          </el-menu>
        </el-aside>

        <!-- 主要内容区域 -->
        <el-main class="layout-main">
          <!-- 面包屑导航 -->
          <div class="breadcrumb-container" v-if="showBreadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item 
                v-for="item in breadcrumbList" 
                :key="item.path"
                :to="item.path ? { path: item.path } : undefined"
              >
                {{ item.title }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          
          <!-- 页面内容 -->
          <div class="page-content">
            <router-view v-slot="{ Component, route }">
              <transition name="fade-transform" mode="out-in">
                <keep-alive :include="cachedViews">
                  <component :is="Component" :key="route.path" />
                </keep-alive>
              </transition>
            </router-view>
          </div>
        </el-main>
      </el-container>
    </el-container>

    <!-- 通知消息抽屉 -->
    <el-drawer
      v-model="notificationVisible"
      title="消息通知"
      direction="rtl"
      size="400px"
    >
      <div class="notification-content">
        <el-empty v-if="notifications.length === 0" description="暂无消息" />
        <div v-else>
          <div 
            v-for="notification in notifications" 
            :key="notification.id"
            class="notification-item"
            :class="{ 'unread': !notification.read }"
            @click="markAsRead(notification)"
          >
            <div class="notification-header">
              <span class="notification-title">{{ notification.title }}</span>
              <span class="notification-time">{{ formatTime(notification.createTime) }}</span>
            </div>
            <div class="notification-content">{{ notification.content }}</div>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 修改密码对话框 -->
    <ChangePasswordDialog v-model="showPasswordDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ChangePasswordDialog from '@/components/ChangePasswordDialog.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  Lock,
  Setting,
  SwitchButton,
  ArrowDown,
  Bell,
  FullScreen,
  Expand,
  Fold,
  House,
  UserFilled,
  Users,
  Document,
  Monitor,
  Tools,
  DataAnalysis
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 状态管理
const sidebarCollapsed = ref(false)
const notificationVisible = ref(false)
const showPasswordDialog = ref(false)
const unreadCount = ref(0)
const notifications = ref([])
const cachedViews = ref<string[]>([])

// 计算属性
const showBreadcrumb = computed(() => {
  return route.path !== '/dashboard'
})

const canAccessSettings = computed(() => {
  return ['system_admin'].includes(authStore.userRole)
})

const menuList = computed(() => {
  const menus = []
  
  // 首页（所有用户都可见）
  menus.push({
    path: '/dashboard',
    title: '首页',
    icon: 'House'
  })

  // 学生功能
  if (authStore.userRole === 'student') {
    menus.push({
      path: '/student',
      title: '学生功能',
      icon: 'User',
      children: [
        { path: '/student/profile', title: '个人信息', icon: 'User' }
      ]
    })
  }

  // 导师功能
  if (authStore.userRole === 'teacher') {
    menus.push({
      path: '/teacher',
      title: '导师功能',
      icon: 'UserFilled',
      children: [
        { path: '/teacher/profile', title: '个人信息', icon: 'User' },
        { path: '/teacher/students', title: '我的学生', icon: 'Users' }
      ]
    })
  }

  // 管理员功能
  if (['college_admin', 'college_leader', 'grad_admin', 'grad_leader', 'school_leader'].includes(authStore.userRole)) {
    menus.push({
      path: '/admin',
      title: '管理功能',
      icon: 'Monitor',
      children: [
        { path: '/admin/students', title: '学生管理', icon: 'Users' },
        { path: '/admin/teachers', title: '导师管理', icon: 'UserFilled' }
      ]
    })
  }

  // 系统管理
  if (authStore.userRole === 'system_admin') {
    menus.push({
      path: '/system',
      title: '系统管理',
      icon: 'Tools',
      children: [
        { path: '/system/users', title: '用户管理', icon: 'Users' },
        { path: '/system/roles', title: '角色管理', icon: 'Lock' },
        { path: '/system/settings', title: '系统设置', icon: 'Setting' }
      ]
    })
  }

  // 审计功能
  if (authStore.userRole === 'audit_admin') {
    menus.push({
      path: '/audit',
      title: '审计管理',
      icon: 'DataAnalysis',
      children: [
        { path: '/audit/logs', title: '操作日志', icon: 'Document' },
        { path: '/audit/reports', title: '审计报告', icon: 'DataAnalysis' }
      ]
    })
  }

  return menus
})

const breadcrumbList = computed(() => {
  const matched = route.matched.filter(item => item.meta && item.meta.title)
  return matched.map(item => ({
    title: item.meta?.title as string,
    path: item.path
  }))
})

// 方法
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed.value))
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const showNotifications = () => {
  notificationVisible.value = true
  // 这里可以加载最新的通知消息
}

const handleUserMenuCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'changePassword':
      showPasswordDialog.value = true
      break
    case 'settings':
      router.push('/system/settings')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm(
          '确定要退出登录吗？',
          '确认退出',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        authStore.logout()
        ElMessage.success('已退出登录')
      } catch {
        // 用户取消
      }
      break
  }
}

const markAsRead = (notification: any) => {
  if (!notification.read) {
    notification.read = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
    // 这里可以调用API标记消息为已读
  }
}

const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return date.toLocaleDateString()
  }
}

// 生命周期
onMounted(() => {
  // 恢复侧边栏状态
  const savedCollapsed = localStorage.getItem('sidebarCollapsed')
  if (savedCollapsed !== null) {
    sidebarCollapsed.value = savedCollapsed === 'true'
  }
  
  // 模拟加载通知消息
  notifications.value = [
    {
      id: 1,
      title: '系统更新通知',
      content: '系统将于本周末进行更新维护',
      createTime: new Date().toISOString(),
      read: false
    }
  ]
  unreadCount.value = notifications.value.filter(n => !n.read).length
})

// 监听路由变化，更新缓存视图
watch(route, (to) => {
  if (to.meta?.keepAlive && to.name) {
    if (!cachedViews.value.includes(to.name as string)) {
      cachedViews.value.push(to.name as string)
    }
  }
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
  overflow: hidden;
}

.layout-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px !important;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-img {
  height: 32px;
  width: 32px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-btn {
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.header-btn:hover {
  background-color: #f5f7fa;
}

.notification-badge {
  line-height: 1;
}

.user-dropdown {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #303133;
}

.layout-sidebar {
  background: #001529;
  transition: width 0.3s;
  overflow: hidden;
}

.sidebar-toggle {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #1890ff;
}

.toggle-btn {
  color: #fff;
  font-size: 16px;
}

.sidebar-menu {
  border-right: none;
  background: transparent;
}

.sidebar-menu :deep(.el-menu-item),
.sidebar-menu :deep(.el-sub-menu__title) {
  color: rgba(255, 255, 255, 0.65);
}

.sidebar-menu :deep(.el-menu-item:hover),
.sidebar-menu :deep(.el-sub-menu__title:hover) {
  color: #fff;
  background-color: #1890ff;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  color: #fff;
  background-color: #1890ff;
}

.layout-main {
  background: #f0f2f5;
  padding: 0;
  overflow-y: auto;
}

.breadcrumb-container {
  background: #fff;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.page-content {
  padding: 20px;
  min-height: calc(100vh - 140px);
}

.notification-content {
  padding: 16px 0;
}

.notification-item {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  cursor: pointer;
  transition: background-color 0.3s;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.unread {
  background-color: #f0f9ff;
  border-left: 4px solid #1890ff;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notification-title {
  font-weight: 500;
  color: #303133;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.notification-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

/* 页面切换动画 */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .layout-header {
    padding: 0 16px;
  }
  
  .logo-text {
    display: none;
  }
  
  .username {
    display: none;
  }
  
  .breadcrumb-container {
    padding: 12px 16px;
  }
  
  .page-content {
    padding: 16px;
  }
}
</style>
