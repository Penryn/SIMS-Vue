<template>
  <div class="my-students">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的学生</span>
          <div class="header-stats">
            <el-statistic title="指导学生总数" :value="pagination.total" />
          </div>
        </div>
      </template>

      <!-- 搜索条件 -->
      <div class="search-form">
        <el-form :model="searchForm" inline>
          <el-form-item label="搜索">
            <el-input
              v-model="searchForm.search"
              placeholder="学号、姓名"
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="学位类型">
            <el-select v-model="searchForm.degreeType" placeholder="选择学位类型" clearable>
              <el-option label="硕士" value="master" />
              <el-option label="博士" value="doctor" />
            </el-select>
          </el-form-item>
          <el-form-item label="学籍状态">
            <el-select v-model="searchForm.status" placeholder="选择状态" clearable>
              <el-option label="在读" value="active" />
              <el-option label="已毕业" value="graduated" />
              <el-option label="休学" value="suspended" />
              <el-option label="退学" value="expelled" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 学生列表 -->
      <el-table
        v-loading="loading"
        :data="students"
        stripe
        style="width: 100%"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="student-expand">
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="联系邮箱">{{ row.user?.email || '未设置' }}</el-descriptions-item>
                <el-descriptions-item label="联系电话">{{ row.user?.phone || '未设置' }}</el-descriptions-item>
                <el-descriptions-item label="家庭住址" :span="2">{{ row.address || '未设置' }}</el-descriptions-item>
                <el-descriptions-item label="紧急联系人">{{ row.emergencyContact || '未设置' }}</el-descriptions-item>
                <el-descriptions-item label="紧急联系电话">{{ row.emergencyPhone || '未设置' }}</el-descriptions-item>
                <el-descriptions-item label="研究方向" :span="2">{{ row.researchDirection || '未设置' }}</el-descriptions-item>
                <el-descriptions-item label="本科教育背景" :span="2">{{ row.previousEducation || '未设置' }}</el-descriptions-item>
                <el-descriptions-item label="工作经历" :span="2">{{ row.workExperience || '未设置' }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="studentId" label="学号" width="120" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="60">
          <template #default="{ row }">
            {{ row.gender === 'male' ? '男' : '女' }}
          </template>
        </el-table-column>
        <el-table-column prop="major.name" label="专业" width="150" />
        <el-table-column prop="degreeType" label="学位类型" width="100">
          <template #default="{ row }">
            {{ row.degreeType === 'master' ? '硕士' : '博士' }}
          </template>
        </el-table-column>
        <el-table-column prop="enrollmentDate" label="入学日期" width="120" />
        <el-table-column prop="expectedGraduationDate" label="预计毕业日期" width="140">
          <template #default="{ row }">
            {{ row.expectedGraduationDate || '未设置' }}
          </template>
        </el-table-column>
        <el-table-column prop="currentStatus" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.currentStatus)">
              {{ getStatusText(row.currentStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="在读时长" width="100">
          <template #default="{ row }">
            {{ getStudyDuration(row.enrollmentDate) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">
              详情
            </el-button>
            <el-button type="success" size="small" @click="handleContact(row)">
              联系
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
          @current-change="fetchStudents"
          @size-change="fetchStudents"
        />
      </div>
    </el-card>

    <!-- 学生详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="学生详情" width="900px">
      <div v-if="selectedStudent" class="student-detail">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="学号">{{ selectedStudent.studentId }}</el-descriptions-item>
              <el-descriptions-item label="姓名">{{ selectedStudent.name }}</el-descriptions-item>
              <el-descriptions-item label="性别">{{ selectedStudent.gender === 'male' ? '男' : '女' }}</el-descriptions-item>
              <el-descriptions-item label="身份证号">{{ maskIdNumber(selectedStudent.idNumber) }}</el-descriptions-item>
              <el-descriptions-item label="学院">{{ selectedStudent.college?.name }}</el-descriptions-item>
              <el-descriptions-item label="专业">{{ selectedStudent.major?.name }}</el-descriptions-item>
              <el-descriptions-item label="学位类型">{{ selectedStudent.degreeType === 'master' ? '硕士' : '博士' }}</el-descriptions-item>
              <el-descriptions-item label="入学日期">{{ selectedStudent.enrollmentDate }}</el-descriptions-item>
              <el-descriptions-item label="预计毕业日期">{{ selectedStudent.expectedGraduationDate || '未设置' }}</el-descriptions-item>
              <el-descriptions-item label="当前状态">
                <el-tag :type="getStatusType(selectedStudent.currentStatus)">
                  {{ getStatusText(selectedStudent.currentStatus) }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          
          <el-tab-pane label="联系信息" name="contact">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="联系邮箱">{{ selectedStudent.user?.email || '未设置' }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ selectedStudent.user?.phone || '未设置' }}</el-descriptions-item>
              <el-descriptions-item label="家庭住址" :span="2">{{ selectedStudent.address || '未设置' }}</el-descriptions-item>
              <el-descriptions-item label="紧急联系人">{{ selectedStudent.emergencyContact || '未设置' }}</el-descriptions-item>
              <el-descriptions-item label="紧急联系电话">{{ selectedStudent.emergencyPhone || '未设置' }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          
          <el-tab-pane label="学术信息" name="academic">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="研究方向">{{ selectedStudent.researchDirection || '未设置' }}</el-descriptions-item>
              <el-descriptions-item label="本科教育背景">{{ selectedStudent.previousEducation || '未设置' }}</el-descriptions-item>
              <el-descriptions-item label="工作经历">{{ selectedStudent.workExperience || '未设置' }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 联系学生对话框 -->
    <el-dialog v-model="showContactDialog" title="联系学生" width="500px">
      <div v-if="selectedStudent" class="contact-info">
        <h4>{{ selectedStudent.name }} 的联系方式</h4>
        <el-divider />
        <div class="contact-item">
          <el-icon><Message /></el-icon>
          <span class="label">邮箱：</span>
          <span class="value">{{ selectedStudent.user?.email || '未设置' }}</span>
          <el-button 
            v-if="selectedStudent.user?.email" 
            type="text" 
            @click="copyToClipboard(selectedStudent.user.email)"
          >
            复制
          </el-button>
        </div>
        <div class="contact-item">
          <el-icon><Phone /></el-icon>
          <span class="label">电话：</span>
          <span class="value">{{ selectedStudent.user?.phone || '未设置' }}</span>
          <el-button 
            v-if="selectedStudent.user?.phone" 
            type="text" 
            @click="copyToClipboard(selectedStudent.user.phone)"
          >
            复制
          </el-button>
        </div>
        <div class="contact-item">
          <el-icon><User /></el-icon>
          <span class="label">紧急联系人：</span>
          <span class="value">{{ selectedStudent.emergencyContact || '未设置' }}</span>
        </div>
        <div class="contact-item">
          <el-icon><Phone /></el-icon>
          <span class="label">紧急联系电话：</span>
          <span class="value">{{ selectedStudent.emergencyPhone || '未设置' }}</span>
          <el-button 
            v-if="selectedStudent.emergencyPhone" 
            type="text" 
            @click="copyToClipboard(selectedStudent.emergencyPhone)"
          >
            复制
          </el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="showContactDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMyStudents } from '@/api/supervisor'
import type { StudentProfile } from '@/types/student'

// 响应式数据
const loading = ref(false)
const students = ref<StudentProfile[]>([])
const selectedStudent = ref<StudentProfile | null>(null)

// 对话框状态
const showDetailDialog = ref(false)
const showContactDialog = ref(false)
const activeTab = ref('basic')

// 搜索表单
const searchForm = ref({
  search: '',
  degreeType: '',
  status: ''
})

// 分页
const pagination = ref({
  page: 1,
  size: 20,
  total: 0
})

// 脱敏身份证号
const maskIdNumber = (idNumber: string) => {
  if (!idNumber) return ''
  return idNumber.substring(0, 6) + '********' + idNumber.substring(14)
}

// 获取状态类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    active: 'success',
    graduated: 'info',
    suspended: 'warning',
    expelled: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    active: '在读',
    graduated: '已毕业',
    suspended: '休学',
    expelled: '退学'
  }
  return statusMap[status] || '未知'
}

// 计算在读时长
const getStudyDuration = (enrollmentDate: string) => {
  if (!enrollmentDate) return '-'
  
  const enrollment = new Date(enrollmentDate)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - enrollment.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  const years = Math.floor(diffDays / 365)
  const months = Math.floor((diffDays % 365) / 30)
  
  if (years > 0) {
    return `${years}年${months}个月`
  } else {
    return `${months}个月`
  }
}

// 获取我的学生列表
const fetchStudents = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      size: pagination.value.size,
      ...searchForm.value
    }
    const response = await getMyStudents(params)
    students.value = response.data.content
    pagination.value.total = response.data.totalElements
  } catch (error) {
    ElMessage.error('获取学生列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.value.page = 1
  fetchStudents()
}

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    search: '',
    degreeType: '',
    status: ''
  }
  pagination.value.page = 1
  fetchStudents()
}

// 查看学生详情
const handleView = (student: StudentProfile) => {
  selectedStudent.value = student
  activeTab.value = 'basic'
  showDetailDialog.value = true
}

// 联系学生
const handleContact = (student: StudentProfile) => {
  selectedStudent.value = student
  showContactDialog.value = true
}

// 复制到剪贴板
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

onMounted(() => {
  fetchStudents()
})
</script>

<style scoped>
.my-students {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-stats {
  display: flex;
  gap: 20px;
}

.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.student-expand {
  padding: 20px;
  background-color: #fafafa;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}

.student-detail {
  padding: 20px 0;
}

.contact-info {
  padding: 20px;
}

.contact-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.contact-item .el-icon {
  margin-right: 10px;
  color: #409eff;
}

.contact-item .label {
  min-width: 100px;
  font-weight: bold;
  color: #606266;
}

.contact-item .value {
  flex: 1;
  color: #303133;
}
</style>
