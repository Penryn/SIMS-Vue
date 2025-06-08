<template>
  <div class="dashboard">
    <div class="welcome-section">
      <el-card class="welcome-card">
        <div class="welcome-content">
          <div class="welcome-text">
            <h2>欢迎，{{ authStore.userInfo?.name }}</h2>
            <p>{{ getRoleText(authStore.userRole) }}</p>
            <p class="last-login">上次登录：{{ formatDateTime(new Date()) }}</p>
          </div>
          <div class="welcome-avatar">
            <el-avatar :size="80" :src="authStore.userInfo?.avatar">
              {{ authStore.userInfo?.name?.substring(0, 1) }}
            </el-avatar>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 密码过期警告 -->
    <el-alert
      v-if="authStore.needPasswordChange"
      title="密码即将过期"
      type="warning"
      description="您的密码已超过90天未更换，为了账户安全，请及时修改密码。"
      show-icon
      class="password-alert"
    >
      <template #default>
        <el-button type="primary" size="small" @click="showPasswordDialog = true">
          立即修改
        </el-button>
      </template>
    </el-alert>    <!-- 统计卡片 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="12" :md="6" :lg="6" v-for="stat in statistics" :key="stat.title">
          <el-card class="stat-card">
            <div class="stat-content"
              :class="{ 'stat-content-mobile': isMobile }"
            >
              <div class="stat-icon" :style="{ backgroundColor: stat.color }">
                <el-icon :size="24">
                  <component :is="stat.icon" />
                </el-icon>
              </div>
              <div class="stat-info">
                <h3>{{ stat.value }}</h3>
                <p>{{ stat.title }}</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <el-card>
        <template #header>
          <h3>快捷操作</h3>
        </template>        <el-row :gutter="20">
          <el-col :xs="12" :sm="8" :md="6" :lg="6" v-for="action in quickActions" :key="action.title">
            <div 
              class="action-item" 
              @click="handleQuickAction(action.path)"
              v-if="hasPermission(action.roles)"
            >
              <el-icon :size="32" :color="action.color">
                <component :is="action.icon" />
              </el-icon>
              <h4>{{ action.title }}</h4>
              <p>{{ action.description }}</p>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 最近活动 -->
    <div class="recent-activities" v-if="showRecentActivities">
      <el-card>
        <template #header>
          <h3>最近活动</h3>
        </template>
        <el-timeline>
          <el-timeline-item
            v-for="activity in recentActivities"
            :key="activity.id"
            :timestamp="formatDateTime(activity.timestamp)"
            :color="getActivityColor(activity.type)"
          >
            <div class="activity-content">
              <h4>{{ activity.title }}</h4>
              <p>{{ activity.description }}</p>
            </div>
          </el-timeline-item>
        </el-timeline>
        
        <div class="view-more" v-if="authStore.userRole === 'audit_admin'">
          <el-button type="text" @click="$router.push('/audit-logs')">
            查看更多日志 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 修改密码对话框 -->
    <ChangePasswordDialog v-model="showPasswordDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ChangePasswordDialog from '@/components/ChangePasswordDialog.vue'
import type { UserRole } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()
const showPasswordDialog = ref(false)
const isMobile = ref(false)

// 检查是否为移动设备
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 监听窗口大小变化
const handleResize = () => {
  checkMobile()
}

// 统计数据
const statistics = ref([
  {
    title: '我的信息',
    value: '1',
    icon: 'User',
    color: '#409EFF'
  },
  {
    title: '待审核',
    value: '0',
    icon: 'Bell',
    color: '#E6A23C'
  },
  {
    title: '今日登录',
    value: '1',
    icon: 'Calendar',
    color: '#67C23A'
  },
  {
    title: '系统消息',
    value: '0',
    icon: 'Message',
    color: '#F56C6C'
  }
])

// 快捷操作
const quickActions = ref([
  {
    title: '个人信息',
    description: '查看和编辑个人信息',
    icon: 'User',
    color: '#409EFF',
    path: '/profile',
    roles: ['student', 'teacher', 'college_admin', 'college_leader', 'grad_admin', 'grad_leader', 'school_leader']
  },
  {
    title: '学生管理',
    description: '管理学生学籍信息',
    icon: 'UserFilled',
    color: '#67C23A',
    path: '/students',
    roles: ['college_admin', 'college_leader', 'grad_admin', 'grad_leader', 'school_leader']
  },
  {
    title: '我的学生',
    description: '查看指导的学生信息',
    icon: 'Tickets',
    color: '#E6A23C',
    path: '/my-students',
    roles: ['teacher']
  },
  {
    title: '系统管理',
    description: '用户和权限管理',
    icon: 'Setting',
    color: '#F56C6C',
    path: '/user-management',
    roles: ['system_admin']
  },
  {
    title: '审计日志',
    description: '查看系统操作日志',
    icon: 'Document',
    color: '#909399',
    path: '/audit-logs',
    roles: ['audit_admin']
  },
  {
    title: '修改密码',
    description: '修改登录密码',
    icon: 'Lock',
    color: '#606266',
    path: '/change-password',
    roles: ['student', 'teacher', 'college_admin', 'college_leader', 'grad_admin', 'grad_leader', 'school_leader', 'system_admin', 'audit_admin']
  }
])

// 最近活动
const recentActivities = ref([
  {
    id: 1,
    title: '用户登录',
    description: `${authStore.userInfo?.name} 登录系统`,
    timestamp: new Date(),
    type: 'login'
  },
  {
    id: 2,
    title: '信息查看',
    description: '查看个人学籍信息',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    type: 'view'
  }
])

// 是否显示最近活动
const showRecentActivities = computed(() => {
  return ['audit_admin', 'system_admin', 'grad_admin'].includes(authStore.userRole)
})

// 获取角色文本
const getRoleText = (role: UserRole) => {
  const roleMap: Record<UserRole, string> = {
    student: '研究生',
    teacher: '导师',
    college_admin: '学院研究生秘书',
    college_leader: '学院领导',
    grad_admin: '研究生院管理员',
    grad_leader: '研究生院领导',
    school_leader: '学校领导',
    system_admin: '系统管理员',
    audit_admin: '审计管理员'
  }
  return roleMap[role] || role
}

// 格式化日期时间
const formatDateTime = (date: Date) => {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 检查权限
const hasPermission = (roles: string[]) => {
  return roles.includes(authStore.userRole)
}

// 获取活动颜色
const getActivityColor = (type: string) => {
  const colorMap: Record<string, string> = {
    login: '#67C23A',
    view: '#409EFF',
    edit: '#E6A23C',
    delete: '#F56C6C'
  }
  return colorMap[type] || '#909399'
}

// 处理快捷操作
const handleQuickAction = (path: string) => {
  if (path === '/change-password') {
    showPasswordDialog.value = true
  } else {
    router.push(path)
  }
}

// 加载统计数据
const loadStatistics = async () => {
  // 这里可以调用API获取真实的统计数据
  // 暂时使用模拟数据
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', handleResize)
  loadStatistics()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-section {
  margin-bottom: 24px;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.welcome-card :deep(.el-card__body) {
  padding: 32px;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.welcome-text h2 {
  font-size: 28px;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.welcome-text p {
  font-size: 16px;
  margin: 4px 0;
  opacity: 0.9;
}

.last-login {
  font-size: 14px !important;
  opacity: 0.7 !important;
}

.welcome-avatar :deep(.el-avatar) {
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.password-alert {
  margin-bottom: 24px;
}

.stats-section {
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-content-mobile {
  flex-direction: column;
  text-align: center;
  gap: 8px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-content-mobile .stat-icon {
  width: 48px;
  height: 48px;
}

.stat-info h3 {
  font-size: 32px;
  margin: 0 0 4px 0;
  font-weight: 600;
  color: #1f2937;
}

.stat-content-mobile .stat-info h3 {
  font-size: 24px;
}

.stat-info p {
  font-size: 14px;
  margin: 0;
  color: #6b7280;
}

.stat-content-mobile .stat-info p {
  font-size: 12px;
}

.quick-actions {
  margin-bottom: 24px;
}

.action-item {
  text-align: center;
  padding: 24px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #f0f0f0;
}

.action-item:hover {
  background-color: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-item h4 {
  font-size: 16px;
  margin: 12px 0 8px 0;
  color: #1f2937;
}

.action-item p {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.recent-activities {
  margin-bottom: 24px;
}

.activity-content h4 {
  font-size: 14px;
  margin: 0 0 4px 0;
  color: #1f2937;
}

.activity-content p {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.view-more {
  text-align: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 0 8px;
  }
  
  .welcome-content {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .welcome-text h2 {
    font-size: 24px;
  }
  
  .welcome-text p {
    font-size: 14px;
  }
  
  .stats-section :deep(.el-col) {
    margin-bottom: 16px;
  }
  
  .quick-actions :deep(.el-col) {
    margin-bottom: 16px;
  }
  
  .action-item {
    padding: 16px 12px;
  }
  
  .action-item h4 {
    font-size: 14px;
  }
  
  .action-item p {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .dashboard {
    padding: 0 4px;
  }
  
  .welcome-card :deep(.el-card__body) {
    padding: 16px;
  }
  
  .welcome-text h2 {
    font-size: 20px;
  }
  
  .action-item {
    padding: 12px 8px;
  }
  
  .stats-section :deep(.el-row) {
    margin: 0 -8px;
  }
  
  .stats-section :deep(.el-col) {
    padding: 0 8px;
    margin-bottom: 16px;
  }
}
</style>
