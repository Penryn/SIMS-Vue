<template>
  <div class="audit-logs">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>审计日志</span>
          <div class="header-actions">
            <el-button type="success" @click="handleExport" :loading="exporting">
              <el-icon><Download /></el-icon>
              导出日志
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索条件 -->
      <div class="search-form">
        <el-form :model="searchForm" inline>
          <el-form-item label="操作类型">
            <el-select v-model="searchForm.action" placeholder="选择操作类型" clearable>
              <el-option label="登录" value="LOGIN" />
              <el-option label="登出" value="LOGOUT" />
              <el-option label="查看学籍信息" value="VIEW_PROFILE" />
              <el-option label="修改学籍信息" value="UPDATE_PROFILE" />
              <el-option label="修改密码" value="CHANGE_PASSWORD" />
              <el-option label="创建用户" value="CREATE_USER" />
              <el-option label="删除用户" value="DELETE_USER" />
              <el-option label="重置密码" value="RESET_PASSWORD" />
            </el-select>
          </el-form-item>
          <el-form-item label="资源类型">
            <el-select v-model="searchForm.resourceType" placeholder="选择资源类型" clearable>
              <el-option label="用户" value="USER" />
              <el-option label="学生档案" value="STUDENT_PROFILE" />
              <el-option label="导师" value="SUPERVISOR" />
              <el-option label="学院" value="COLLEGE" />
              <el-option label="系统" value="SYSTEM" />
            </el-select>
          </el-form-item>
          <el-form-item label="用户名">
            <el-input
              v-model="searchForm.username"
              placeholder="输入用户名"
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="操作结果">
            <el-select v-model="searchForm.success" placeholder="选择操作结果" clearable>
              <el-option label="成功" :value="true" />
              <el-option label="失败" :value="false" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              @change="handleDateRangeChange"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 日志列表 -->
      <el-table
        v-loading="loading"
        :data="logs"
        stripe
        style="width: 100%"
        row-key="id"
      >
        <el-table-column prop="timestamp" label="时间" width="180" sortable>
          <template #default="{ row }">
            {{ formatDateTime(row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getActionType(row.action)">
              {{ getActionText(row.action) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="resourceType" label="资源类型" width="100">
          <template #default="{ row }">
            {{ getResourceTypeText(row.resourceType) }}
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="userRealName" label="用户姓名" width="100" />
        <el-table-column prop="ipAddress" label="IP地址" width="140" />
        <el-table-column prop="userAgent" label="用户代理" min-width="200" show-overflow-tooltip />
        <el-table-column prop="success" label="结果" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'">
              {{ row.success ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="fetchLogs"
          @size-change="fetchLogs"
        />
      </div>
    </el-card>

    <!-- 日志详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="日志详情" width="800px">
      <div v-if="selectedLog" class="log-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="日志ID">{{ selectedLog.id }}</el-descriptions-item>
          <el-descriptions-item label="时间">{{ formatDateTime(selectedLog.timestamp) }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">
            <el-tag :type="getActionType(selectedLog.action)">
              {{ getActionText(selectedLog.action) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="资源类型">{{ getResourceTypeText(selectedLog.resourceType) }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ selectedLog.username }}</el-descriptions-item>
          <el-descriptions-item label="用户姓名">{{ selectedLog.userRealName }}</el-descriptions-item>
          <el-descriptions-item label="操作结果">
            <el-tag :type="selectedLog.success ? 'success' : 'danger'">
              {{ selectedLog.success ? '成功' : '失败' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="资源ID">{{ selectedLog.resourceId || '无' }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ selectedLog.ipAddress }}</el-descriptions-item>
          <el-descriptions-item label="会话ID">{{ selectedLog.sessionId || '无' }}</el-descriptions-item>
          <el-descriptions-item label="用户代理" :span="2">{{ selectedLog.userAgent }}</el-descriptions-item>
          <el-descriptions-item label="操作描述" :span="2">{{ selectedLog.description }}</el-descriptions-item>
          <el-descriptions-item v-if="selectedLog.errorMessage" label="错误信息" :span="2">
            <el-text type="danger">{{ selectedLog.errorMessage }}</el-text>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 操作详细数据 -->
        <div v-if="selectedLog.operationData" class="operation-data">
          <el-divider content-position="left">操作数据</el-divider>
          <el-input
            v-model="selectedLog.operationData"
            type="textarea"
            :rows="10"
            readonly
            placeholder="无操作数据"
          />
        </div>

        <!-- HMAC验证信息 -->
        <div v-if="selectedLog.hmacValue" class="hmac-info">
          <el-divider content-position="left">完整性验证</el-divider>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="HMAC值">{{ selectedLog.hmacValue }}</el-descriptions-item>
            <el-descriptions-item label="验证状态">
              <el-tag :type="selectedLog.hmacVerified ? 'success' : 'danger'">
                {{ selectedLog.hmacVerified ? '验证通过' : '验证失败' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { getSystemLogs, exportLogs } from '@/api/log'

// 响应式数据
const loading = ref(false)
const exporting = ref(false)
const logs = ref<any[]>([])
const selectedLog = ref<any>(null)
const showDetailDialog = ref(false)
const dateRange = ref<string[]>([])

// 搜索表单
const searchForm = ref({
  action: '',
  resourceType: '',
  username: '',
  success: '',
  startTime: '',
  endTime: ''
})

// 分页
const pagination = ref({
  page: 1,
  size: 20,
  total: 0
})

// 格式化日期时间
const formatDateTime = (timestamp: string) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 获取操作类型颜色
const getActionType = (action: string) => {
  const actionMap: Record<string, string> = {
    LOGIN: 'success',
    LOGOUT: 'info',
    VIEW_PROFILE: 'primary',
    UPDATE_PROFILE: 'warning',
    CHANGE_PASSWORD: 'warning',
    CREATE_USER: 'success',
    DELETE_USER: 'danger',
    RESET_PASSWORD: 'warning'
  }
  return actionMap[action] || 'info'
}

// 获取操作类型文本
const getActionText = (action: string) => {
  const actionMap: Record<string, string> = {
    LOGIN: '登录',
    LOGOUT: '登出',
    VIEW_PROFILE: '查看档案',
    UPDATE_PROFILE: '修改档案',
    CHANGE_PASSWORD: '修改密码',
    CREATE_USER: '创建用户',
    DELETE_USER: '删除用户',
    RESET_PASSWORD: '重置密码'
  }
  return actionMap[action] || action
}

// 获取资源类型文本
const getResourceTypeText = (resourceType: string) => {
  const typeMap: Record<string, string> = {
    USER: '用户',
    STUDENT_PROFILE: '学生档案',
    SUPERVISOR: '导师',
    COLLEGE: '学院',
    SYSTEM: '系统'
  }
  return typeMap[resourceType] || resourceType
}

// 处理日期范围变化
const handleDateRangeChange = (dates: string[]) => {
  if (dates && dates.length === 2) {
    searchForm.value.startTime = dates[0]
    searchForm.value.endTime = dates[1]
  } else {
    searchForm.value.startTime = ''
    searchForm.value.endTime = ''
  }
}

// 获取日志列表
const fetchLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      size: pagination.value.size,
      ...searchForm.value
    }
    const response = await getSystemLogs(params)
    logs.value = response.data.content
    pagination.value.total = response.data.totalElements
  } catch (error) {
    ElMessage.error('获取日志列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.value.page = 1
  fetchLogs()
}

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    action: '',
    resourceType: '',
    username: '',
    success: '',
    startTime: '',
    endTime: ''
  }
  dateRange.value = []
  pagination.value.page = 1
  fetchLogs()
}

// 查看日志详情
const handleView = (log: any) => {
  selectedLog.value = log
  showDetailDialog.value = true
}

// 导出日志
const handleExport = async () => {
  exporting.value = true
  try {
    const params = { ...searchForm.value }
    const response = await exportLogs(params)
    
    // 创建下载链接
    const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit_logs_${new Date().getTime()}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('日志导出成功')
  } catch (error) {
    ElMessage.error('日志导出失败')
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.audit-logs {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}

.log-detail {
  padding: 20px 0;
}

.operation-data {
  margin-top: 20px;
}

.hmac-info {
  margin-top: 20px;
}
</style>
