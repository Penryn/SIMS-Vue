<template>
  <div class="system-monitor">
    <el-row :gutter="20">
      <!-- 系统状态概览 -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="status-card">
          <el-statistic
            title="在线用户数"
            :value="systemStats.onlineUsers"
            suffix="人"
          >
            <template #prefix>
              <el-icon style="color: #67c23a;"><UserFilled /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="status-card">
          <el-statistic
            title="今日登录次数"
            :value="systemStats.todayLogins"
            suffix="次"
          >
            <template #prefix>
              <el-icon style="color: #409eff;"><Lock /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="status-card">
          <el-statistic
            title="系统响应时间"
            :value="systemStats.responseTime"
            suffix="ms"
          >
            <template #prefix>
              <el-icon style="color: #e6a23c;"><Timer /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="status-card">
          <el-statistic
            title="数据库连接数"
            :value="systemStats.dbConnections"
            suffix="个"
          >
            <template #prefix>
              <el-icon style="color: #f56c6c;"><Connection /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 系统性能图表 -->
      <el-col :xs="24" :lg="12">
        <el-card>
          <template #header>
            <span>系统性能监控</span>
            <el-button type="text" @click="refreshPerformanceData" :loading="loading.performance">
              刷新
            </el-button>
          </template>
          <div ref="performanceChart" style="width: 100%; height: 300px;"></div>
        </el-card>
      </el-col>
      
      <!-- 用户活动统计 -->
      <el-col :xs="24" :lg="12">
        <el-card>
          <template #header>
            <span>用户活动统计</span>
            <el-button type="text" @click="refreshUserActivity" :loading="loading.userActivity">
              刷新
            </el-button>
          </template>
          <div ref="userActivityChart" style="width: 100%; height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 最近系统日志 -->
      <el-col :xs="24" :lg="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近系统日志</span>
              <el-button type="text" @click="refreshSystemLogs" :loading="loading.systemLogs">
                刷新
              </el-button>
            </div>
          </template>
          <el-scrollbar height="300px">
            <div v-for="log in recentLogs" :key="log.id" class="log-item">
              <div class="log-header">
                <el-tag :type="getLogLevelType(log.level)" size="small">
                  {{ log.level }}
                </el-tag>
                <span class="log-time">{{ formatTime(log.timestamp) }}</span>
              </div>
              <div class="log-message">{{ log.message }}</div>
            </div>
          </el-scrollbar>
        </el-card>
      </el-col>
      
      <!-- 系统资源使用情况 -->
      <el-col :xs="24" :lg="12">
        <el-card>
          <template #header>
            <span>系统资源使用情况</span>
          </template>
          <div class="resource-item">
            <div class="resource-label">CPU 使用率</div>
            <el-progress :percentage="systemStats.cpuUsage" :color="getProgressColor(systemStats.cpuUsage)" />
          </div>
          <div class="resource-item">
            <div class="resource-label">内存使用率</div>
            <el-progress :percentage="systemStats.memoryUsage" :color="getProgressColor(systemStats.memoryUsage)" />
          </div>
          <div class="resource-item">
            <div class="resource-label">磁盘使用率</div>
            <el-progress :percentage="systemStats.diskUsage" :color="getProgressColor(systemStats.diskUsage)" />
          </div>
          <div class="resource-item">
            <div class="resource-label">网络带宽使用</div>
            <el-progress :percentage="systemStats.networkUsage" :color="getProgressColor(systemStats.networkUsage)" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 系统告警 -->
    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>系统告警</span>
              <el-badge :value="alerts.length" :max="99" type="danger">
                <el-button type="text" @click="refreshAlerts" :loading="loading.alerts">
                  刷新
                </el-button>
              </el-badge>
            </div>
          </template>
          <el-empty v-if="alerts.length === 0" description="暂无系统告警" />
          <div v-else class="alerts-container">
            <el-alert
              v-for="alert in alerts"
              :key="alert.id"
              :title="alert.title"
              :description="alert.description"
              :type="alert.type"
              :closable="false"
              show-icon
              style="margin-bottom: 10px;"
            >
              <template #default>
                <div class="alert-content">
                  <span class="alert-time">{{ formatTime(alert.timestamp) }}</span>
                </div>
              </template>
            </el-alert>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, Lock, Timer, Connection } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 响应式数据
const loading = ref({
  performance: false,
  userActivity: false,
  systemLogs: false,
  alerts: false
})

const systemStats = ref({
  onlineUsers: 0,
  todayLogins: 0,
  responseTime: 0,
  dbConnections: 0,
  cpuUsage: 0,
  memoryUsage: 0,
  diskUsage: 0,
  networkUsage: 0
})

const recentLogs = ref<any[]>([])
const alerts = ref<any[]>([])

// 图表实例
const performanceChart = ref<HTMLDivElement>()
const userActivityChart = ref<HTMLDivElement>()
let performanceChartInstance: echarts.ECharts | null = null
let userActivityChartInstance: echarts.ECharts | null = null

// 定时器
let statsTimer: NodeJS.Timeout | null = null

// 获取系统统计信息
const fetchSystemStats = async () => {
  try {
    // 模拟API调用
    const mockStats = {
      onlineUsers: Math.floor(Math.random() * 100) + 20,
      todayLogins: Math.floor(Math.random() * 500) + 100,
      responseTime: Math.floor(Math.random() * 100) + 50,
      dbConnections: Math.floor(Math.random() * 20) + 5,
      cpuUsage: Math.floor(Math.random() * 30) + 10,
      memoryUsage: Math.floor(Math.random() * 40) + 20,
      diskUsage: Math.floor(Math.random() * 50) + 30,
      networkUsage: Math.floor(Math.random() * 60) + 10
    }
    systemStats.value = mockStats
  } catch (error) {
    ElMessage.error('获取系统统计信息失败')
  }
}

// 获取最近日志
const refreshSystemLogs = async () => {
  loading.value.systemLogs = true
  try {
    // 模拟API调用
    const mockLogs = [
      { id: 1, level: 'INFO', message: '用户 admin 登录系统', timestamp: new Date().toISOString() },
      { id: 2, level: 'WARN', message: '系统内存使用率较高', timestamp: new Date(Date.now() - 300000).toISOString() },
      { id: 3, level: 'ERROR', message: '数据库连接超时', timestamp: new Date(Date.now() - 600000).toISOString() },
      { id: 4, level: 'INFO', message: '定时任务执行完成', timestamp: new Date(Date.now() - 900000).toISOString() },
      { id: 5, level: 'DEBUG', message: '缓存刷新成功', timestamp: new Date(Date.now() - 1200000).toISOString() }
    ]
    recentLogs.value = mockLogs
  } catch (error) {
    ElMessage.error('获取系统日志失败')
  } finally {
    loading.value.systemLogs = false
  }
}

// 获取系统告警
const refreshAlerts = async () => {
  loading.value.alerts = true
  try {
    // 模拟API调用
    const mockAlerts = [
      {
        id: 1,
        title: '内存使用率告警',
        description: '系统内存使用率超过 80%，请及时处理',
        type: 'warning',
        timestamp: new Date(Date.now() - 180000).toISOString()
      },
      {
        id: 2,
        title: '磁盘空间不足',
        description: '系统磁盘使用率超过 90%，请清理磁盘空间',
        type: 'error',
        timestamp: new Date(Date.now() - 360000).toISOString()
      }
    ]
    alerts.value = mockAlerts
  } catch (error) {
    ElMessage.error('获取系统告警失败')
  } finally {
    loading.value.alerts = false
  }
}

// 刷新性能数据
const refreshPerformanceData = async () => {
  loading.value.performance = true
  try {
    // 模拟性能数据
    const performanceData = {
      times: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      cpu: Array.from({ length: 24 }, () => Math.floor(Math.random() * 50) + 10),
      memory: Array.from({ length: 24 }, () => Math.floor(Math.random() * 60) + 20),
      disk: Array.from({ length: 24 }, () => Math.floor(Math.random() * 40) + 30)
    }
    
    if (performanceChartInstance) {
      performanceChartInstance.setOption({
        title: { text: '系统性能监控' },
        tooltip: { trigger: 'axis' },
        legend: { data: ['CPU', '内存', '磁盘'] },
        xAxis: { type: 'category', data: performanceData.times },
        yAxis: { type: 'value', max: 100 },
        series: [
          { name: 'CPU', type: 'line', data: performanceData.cpu },
          { name: '内存', type: 'line', data: performanceData.memory },
          { name: '磁盘', type: 'line', data: performanceData.disk }
        ]
      })
    }
  } catch (error) {
    ElMessage.error('刷新性能数据失败')
  } finally {
    loading.value.performance = false
  }
}

// 刷新用户活动
const refreshUserActivity = async () => {
  loading.value.userActivity = true
  try {
    // 模拟用户活动数据
    const userActivityData = [
      { name: '学生', value: Math.floor(Math.random() * 500) + 100 },
      { name: '导师', value: Math.floor(Math.random() * 100) + 20 },
      { name: '管理员', value: Math.floor(Math.random() * 50) + 10 },
      { name: '系统管理员', value: Math.floor(Math.random() * 20) + 5 }
    ]
    
    if (userActivityChartInstance) {
      userActivityChartInstance.setOption({
        title: { text: '用户活动统计' },
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', left: 'left' },
        series: [{
          name: '用户类型',
          type: 'pie',
          radius: '50%',
          data: userActivityData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      })
    }
  } catch (error) {
    ElMessage.error('刷新用户活动数据失败')
  } finally {
    loading.value.userActivity = false
  }
}

// 初始化图表
const initCharts = () => {
  if (performanceChart.value) {
    performanceChartInstance = echarts.init(performanceChart.value)
    refreshPerformanceData()
  }
  
  if (userActivityChart.value) {
    userActivityChartInstance = echarts.init(userActivityChart.value)
    refreshUserActivity()
  }
}

// 获取日志级别类型
const getLogLevelType = (level: string) => {
  const typeMap: Record<string, string> = {
    ERROR: 'danger',
    WARN: 'warning',
    INFO: 'info',
    DEBUG: 'success'
  }
  return typeMap[level] || 'info'
}

// 获取进度条颜色
const getProgressColor = (percentage: number) => {
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

// 格式化时间
const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 启动定时器
const startTimer = () => {
  statsTimer = setInterval(() => {
    fetchSystemStats()
  }, 30000) // 每30秒刷新一次
}

// 停止定时器
const stopTimer = () => {
  if (statsTimer) {
    clearInterval(statsTimer)
    statsTimer = null
  }
}

onMounted(() => {
  fetchSystemStats()
  refreshSystemLogs()
  refreshAlerts()
  setTimeout(initCharts, 100) // 延迟初始化图表
  startTimer()
})

onUnmounted(() => {
  stopTimer()
  if (performanceChartInstance) {
    performanceChartInstance.dispose()
  }
  if (userActivityChartInstance) {
    userActivityChartInstance.dispose()
  }
})
</script>

<style scoped>
.system-monitor {
  padding: 20px;
}

.status-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.log-item {
  padding: 10px;
  border-bottom: 1px solid #ebeef5;
}

.log-item:last-child {
  border-bottom: none;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.log-time {
  font-size: 12px;
  color: #909399;
}

.log-message {
  font-size: 14px;
  color: #606266;
}

.resource-item {
  margin-bottom: 20px;
}

.resource-label {
  margin-bottom: 8px;
  font-weight: bold;
  color: #606266;
}

.alerts-container {
  max-height: 400px;
  overflow-y: auto;
}

.alert-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-time {
  font-size: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .system-monitor {
    padding: 10px;
  }
  
  .status-card {
    margin-bottom: 16px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .resource-item {
    margin-bottom: 16px;
  }
  
  .resource-label {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .system-monitor {
    padding: 8px;
  }
  
  .status-card :deep(.el-card__body) {
    padding: 16px;
  }
  
  .alerts-container {
    max-height: 300px;
  }
}
</style>
