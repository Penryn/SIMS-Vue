<template>
  <el-container class="layout-container">
    <!-- 桌面端侧边栏 -->
    <el-aside :width="collapsed ? '64px' : '250px'" class="sidebar" v-show="!isMobile">
      <div class="logo">
        <img src="@/assets/logo.svg" alt="SIMS" v-if="!collapsed" />
        <span v-if="!collapsed" class="logo-text">学籍管理系统</span>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :unique-opened="true"
        router
        class="sidebar-menu"
      >
        <template v-for="item in menuItems" :key="item.path">
          <el-menu-item
            v-if="hasPermission(item.roles)"
            :index="item.path"
            :route="item.path"
          >
            <el-icon>
              <component :is="item.icon" />
            </el-icon>
            <template #title>{{ item.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <!-- 移动端抽屉侧边栏 -->
    <el-drawer
      v-model="showMobileSidebar"
      direction="ltr"
      :with-header="false"
      size="250px"
      v-if="isMobile"
    >
      <div class="mobile-sidebar">
        <div class="logo">
          <img src="@/assets/logo.svg" alt="SIMS" />
          <span class="logo-text">学籍管理系统</span>
        </div>
        
        <el-menu
          :default-active="activeMenu"
          :unique-opened="true"
          router
          class="sidebar-menu"
          @select="showMobileSidebar = false"
        >
          <template v-for="item in menuItems" :key="item.path">
            <el-menu-item
              v-if="hasPermission(item.roles)"
              :index="item.path"
              :route="item.path"
            >
              <el-icon>
                <component :is="item.icon" />
              </el-icon>
              <template #title>{{ item.title }}</template>
            </el-menu-item>
          </template>
        </el-menu>
      </div>
    </el-drawer>

    <el-container>
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <el-button
            type="text"
            @click="isMobile ? (showMobileSidebar = true) : toggleCollapse()"
            class="collapse-btn"
          >
            <el-icon>
              <Menu v-if="isMobile" />
              <Fold v-else-if="!collapsed" />
              <Expand v-else />
            </el-icon>
          </el-button>
          
          <el-breadcrumb separator="/" v-show="!isMobile">
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <!-- 密码过期提醒 -->
          <el-badge
            v-if="authStore.needPasswordChange"
            is-dot
            type="warning"
            class="password-warning"
          >
            <el-button
              type="text"
              @click="showPasswordDialog = true"
              class="warning-btn"
            >
              <el-icon><Warning /></el-icon>
              <span v-show="!isMobile">密码即将过期</span>
            </el-button>
          </el-badge>

          <!-- 用户信息 -->
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :src="authStore.userInfo?.avatar" class="avatar">
                {{ authStore.userInfo?.name?.substring(0, 1) }}
              </el-avatar>
              <span class="username" v-show="!isMobile">{{ authStore.userInfo?.name }}</span>
              <span class="role-tag" v-show="!isMobile">{{ getRoleText(authStore.userRole) }}</span>
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
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>

    <!-- 修改密码对话框 -->
    <ChangePasswordDialog
      v-model="showPasswordDialog"
      :force-change="authStore.forcePasswordChange"
    />
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import ChangePasswordDialog from '@/components/ChangePasswordDialog.vue'
import type { UserRole } from '@/types/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const collapsed = ref(false)
const showPasswordDialog = ref(false)
const isMobile = ref(false)
const showMobileSidebar = ref(false)

// 检查是否为移动设备
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
  if (isMobile.value) {
    collapsed.value = true
  }
}

// 监听窗口大小变化
const handleResize = () => {
  checkMobile()
}

// 菜单项配置
const menuItems = [
  {
    path: '/dashboard',
    title: '首页',
    icon: 'House',
    roles: ['student', 'teacher', 'college_admin', 'college_leader', 'grad_admin', 'grad_leader', 'school_leader', 'system_admin', 'audit_admin']
  },
  {
    path: '/profile',
    title: '个人信息',
    icon: 'User',
    roles: ['student', 'teacher', 'college_admin', 'college_leader', 'grad_admin', 'grad_leader', 'school_leader']
  },
  {
    path: '/my-students',
    title: '我的学生',
    icon: 'Tickets',
    roles: ['teacher']
  },
  {
    path: '/students',
    title: '学生管理',
    icon: 'UserFilled',
    roles: ['college_admin', 'college_leader', 'grad_admin', 'grad_leader', 'school_leader']
  },
  {
    path: '/teachers',
    title: '导师管理',
    icon: 'Avatar',
    roles: ['grad_admin', 'grad_leader', 'school_leader']
  },
  {
    path: '/user-management',
    title: '用户管理',
    icon: 'Setting',
    roles: ['system_admin']
  },  {
    path: '/audit-logs',
    title: '审计日志',
    icon: 'Document',
    roles: ['audit_admin']
  },
  {
    path: '/import-export',
    title: '数据导入导出',
    icon: 'Upload',
    roles: ['college_admin', 'grad_admin', 'system_admin']
  }
]

// 当前激活的菜单
const activeMenu = computed(() => route.path)

// 当前页面标题
const currentPageTitle = computed(() => {
  const currentItem = menuItems.find(item => item.path === route.path)
  return currentItem?.title || '首页'
})

// 切换侧边栏折叠状态
const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

// 检查权限
const hasPermission = (roles: string[]) => {
  return roles.includes(authStore.userRole)
}

// 获取角色文本
const getRoleText = (role: UserRole) => {
  const roleMap: Record<UserRole, string> = {
    student: '研究生',
    teacher: '导师',
    college_admin: '学院秘书',
    college_leader: '学院领导',
    grad_admin: '研究生院管理员',
    grad_leader: '研究生院领导',
    school_leader: '学校领导',
    system_admin: '系统管理员',
    audit_admin: '审计管理员'
  }
  return roleMap[role] || role
}

// 处理下拉菜单命令
const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'changePassword':
      showPasswordDialog.value = true
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 处理登出
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButton: '确定',
      cancelButton: '取消',
      type: 'warning'
    })
    
    await authStore.logoutUser()
    ElMessage.success('退出登录成功')
    router.push('/login')
  } catch (error) {
    // 用户取消
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', handleResize)
  // 检查是否需要强制修改密码
  if (authStore.forcePasswordChange) {
    showPasswordDialog.value = true
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #001529;
  transition: width 0.3s;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #1f2937;
}

.logo img {
  width: 32px;
  height: 32px;
  margin-right: 8px;
}

.sidebar-menu {
  border-right: none;
  background-color: #001529;
}

.sidebar-menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.7);
}

.sidebar-menu :deep(.el-menu-item:hover),
.sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: #1890ff;
  color: white;
}

.header {
  background-color: white;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}

.header-left {
  display: flex;
  align-items: center;
}

.collapse-btn {
  margin-right: 16px;
  font-size: 18px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f5f5;
}

.avatar {
  margin-right: 8px;
}

.username {
  margin-right: 8px;
  font-weight: 500;
}

.role-tag {
  background-color: #e6f7ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.password-warning .warning-btn {
  color: #faad14;
}

.main-content {
  background-color: #f5f5f5;
  padding: 24px;
}

.mobile-sidebar {
  background-color: #001529;
  height: 100%;
}

.mobile-sidebar .logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #1f2937;
}

.mobile-sidebar .logo img {
  width: 32px;
  height: 32px;
  margin-right: 8px;
}

.mobile-sidebar .sidebar-menu {
  border-right: none;
  background-color: #001529;
}

.mobile-sidebar .sidebar-menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.7);
}

.mobile-sidebar .sidebar-menu :deep(.el-menu-item:hover),
.mobile-sidebar .sidebar-menu :deep(.el-menu-item.is-active) {
  background-color: #1890ff;
  color: white;
}

/* 响应式布局 */
@media (max-width: 1024px) {
  .header {
    padding: 0 16px;
  }
  
  .main-content {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .header {
    padding: 0 12px;
  }
  
  .main-content {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 0 8px;
  }
  
  .main-content {
    padding: 8px;
  }
  
  .collapse-btn {
    margin-right: 8px;
  }
}
</style>
