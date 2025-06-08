<template>
  <div class="import-export">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>数据导入导出</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" type="card">
        <!-- 学生数据导入导出 -->
        <el-tab-pane label="学生数据" name="student">
          <div class="tab-content">
            <el-card shadow="never">
              <template #header>
                <span>学生数据导入</span>
              </template>
              <div class="import-section">
                <el-alert
                  title="导入说明"
                  type="info"
                  :closable="false"
                  show-icon
                >
                  <p>1. 请先下载模板文件，按照模板格式填写学生信息</p>
                  <p>2. 支持的文件格式：.xlsx, .xls</p>
                  <p>3. 文件大小不超过 10MB</p>
                  <p>4. 重复学号的记录将被跳过</p>
                </el-alert>
                
                <div class="actions">
                  <el-button type="primary" @click="downloadStudentTemplate">
                    <el-icon><Download /></el-icon>
                    下载学生模板
                  </el-button>
                  
                  <el-upload
                    ref="studentUploadRef"
                    :auto-upload="false"
                    :on-change="handleStudentFileChange"
                    :file-list="[]"
                    accept=".xlsx,.xls"
                    :show-file-list="false"
                  >
                    <el-button type="success">
                      <el-icon><Upload /></el-icon>
                      选择文件
                    </el-button>
                  </el-upload>
                  
                  <el-button 
                    type="warning" 
                    @click="importStudentData" 
                    :loading="importing.student"
                    :disabled="!studentFile"
                  >
                    开始导入
                  </el-button>
                </div>

                <div v-if="studentFile" class="file-info">
                  <el-tag type="info">已选择: {{ studentFile.name }}</el-tag>
                </div>
              </div>
            </el-card>

            <el-card shadow="never" style="margin-top: 20px;">
              <template #header>
                <span>学生数据导出</span>
              </template>
              <div class="export-section">
                <el-form :model="exportForm.student" inline>
                  <el-form-item label="学院">
                    <el-select v-model="exportForm.student.collegeId" placeholder="选择学院" clearable>
                      <el-option
                        v-for="college in colleges"
                        :key="college.id"
                        :label="college.name"
                        :value="college.id"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="专业">
                    <el-select v-model="exportForm.student.majorId" placeholder="选择专业" clearable>
                      <el-option
                        v-for="major in majors"
                        :key="major.id"
                        :label="major.name"
                        :value="major.id"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="学位类型">
                    <el-select v-model="exportForm.student.degreeType" placeholder="选择学位类型" clearable>
                      <el-option label="硕士" value="master" />
                      <el-option label="博士" value="doctor" />
                    </el-select>
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" @click="exportStudentData" :loading="exporting.student">
                      <el-icon><Download /></el-icon>
                      导出学生数据
                    </el-button>
                  </el-form-item>
                </el-form>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 用户数据导入导出 -->
        <el-tab-pane label="用户数据" name="user">
          <div class="tab-content">
            <el-card shadow="never">
              <template #header>
                <span>用户数据导出</span>
              </template>
              <div class="export-section">
                <el-form :model="exportForm.user" inline>
                  <el-form-item label="角色">
                    <el-select v-model="exportForm.user.role" placeholder="选择角色" clearable>
                      <el-option label="学生" value="ROLE_STUDENT" />
                      <el-option label="导师" value="ROLE_TEACHER" />
                      <el-option label="学院管理员" value="ROLE_COLLEGE_ADMIN" />
                      <el-option label="系统管理员" value="ROLE_ADMIN" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="状态">
                    <el-select v-model="exportForm.user.enabled" placeholder="选择状态" clearable>
                      <el-option label="启用" :value="true" />
                      <el-option label="禁用" :value="false" />
                    </el-select>
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" @click="exportUserData" :loading="exporting.user">
                      <el-icon><Download /></el-icon>
                      导出用户数据
                    </el-button>
                  </el-form-item>
                </el-form>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 审计日志导出 -->
        <el-tab-pane label="审计日志" name="audit">
          <div class="tab-content">
            <el-card shadow="never">
              <template #header>
                <span>审计日志导出</span>
              </template>
              <div class="export-section">
                <el-form :model="exportForm.audit" inline>
                  <el-form-item label="时间范围">
                    <el-date-picker
                      v-model="auditDateRange"
                      type="datetimerange"
                      range-separator="至"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                      format="YYYY-MM-DD HH:mm:ss"
                      value-format="YYYY-MM-DD HH:mm:ss"
                      @change="handleAuditDateChange"
                    />
                  </el-form-item>
                  <el-form-item label="操作类型">
                    <el-select v-model="exportForm.audit.action" placeholder="选择操作类型" clearable>
                      <el-option label="登录" value="LOGIN" />
                      <el-option label="登出" value="LOGOUT" />
                      <el-option label="查看档案" value="VIEW_PROFILE" />
                      <el-option label="修改档案" value="UPDATE_PROFILE" />
                      <el-option label="修改密码" value="CHANGE_PASSWORD" />
                    </el-select>
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" @click="exportAuditData" :loading="exporting.audit">
                      <el-icon><Download /></el-icon>
                      导出审计日志
                    </el-button>
                  </el-form-item>
                </el-form>
              </div>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 导入结果对话框 -->
    <el-dialog v-model="showResultDialog" title="导入结果" width="600px">
      <div v-if="importResult" class="import-result">
        <el-result
          :icon="importResult.success ? 'success' : 'error'"
          :title="importResult.success ? '导入成功' : '导入失败'"
          :sub-title="importResult.message"
        >
          <template #extra>
            <div v-if="importResult.details" class="result-details">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="总记录数">{{ importResult.details.total }}</el-descriptions-item>
                <el-descriptions-item label="成功导入">{{ importResult.details.success }}</el-descriptions-item>
                <el-descriptions-item label="跳过记录">{{ importResult.details.skipped }}</el-descriptions-item>
                <el-descriptions-item label="失败记录">{{ importResult.details.failed }}</el-descriptions-item>
              </el-descriptions>
              
              <div v-if="importResult.details.errors && importResult.details.errors.length > 0" class="error-list">
                <el-divider content-position="left">错误详情</el-divider>
                <el-scrollbar height="200px">
                  <el-alert
                    v-for="(error, index) in importResult.details.errors"
                    :key="index"
                    :title="`第 ${error.row} 行：${error.message}`"
                    type="error"
                    :closable="false"
                    style="margin-bottom: 10px;"
                  />
                </el-scrollbar>
              </div>
            </div>
          </template>
        </el-result>
      </div>
      <template #footer>
        <el-button @click="showResultDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Upload } from '@element-plus/icons-vue'
import { importStudentsFromExcel, exportStudents } from '@/api/student'
import { exportUsers } from '@/api/user'
import { exportLogs } from '@/api/log'
import { getCollegeList, getMajorList } from '@/api/college'

// 响应式数据
const activeTab = ref('student')
const colleges = ref<any[]>([])
const majors = ref<any[]>([])
const studentFile = ref<File | null>(null)
const auditDateRange = ref<string[]>([])

// 导入状态
const importing = ref({
  student: false
})

// 导出状态
const exporting = ref({
  student: false,
  user: false,
  audit: false
})

// 导出表单
const exportForm = ref({
  student: {
    collegeId: '',
    majorId: '',
    degreeType: ''
  },
  user: {
    role: '',
    enabled: ''
  },
  audit: {
    startTime: '',
    endTime: '',
    action: ''
  }
})

// 导入结果
const showResultDialog = ref(false)
const importResult = ref<any>(null)

// 下载学生模板
const downloadStudentTemplate = () => {
  const link = document.createElement('a')
  link.href = `${import.meta.env.VITE_API_BASE_URL}/api/student-profiles/template`
  link.download = '学生信息导入模板.xlsx'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  ElMessage.success('模板下载已开始')
}

// 处理学生文件选择
const handleStudentFileChange = (file: any) => {
  const rawFile = file.raw
  if (!rawFile) return

  const isExcel = rawFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                  rawFile.type === 'application/vnd.ms-excel'
  const isLt10M = rawFile.size / 1024 / 1024 < 10

  if (!isExcel) {
    ElMessage.error('只能上传 Excel 文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB!')
    return false
  }
  
  studentFile.value = rawFile
  ElMessage.success('文件选择成功')
}

// 导入学生数据
const importStudentData = async () => {
  if (!studentFile.value) {
    ElMessage.error('请先选择要导入的文件')
    return
  }

  importing.value.student = true
  try {
    const response = await importStudentsFromExcel(studentFile.value)
    importResult.value = response.data
    showResultDialog.value = true
    studentFile.value = null
  } catch (error: any) {
    ElMessage.error(error.message || '导入失败，请检查文件格式')
  } finally {
    importing.value.student = false
  }
}

// 导出学生数据
const exportStudentData = async () => {
  exporting.value.student = true
  try {
    const params = { ...exportForm.value.student }
    const response = await exportStudents(params)
    
    // 创建下载链接
    const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `students_export_${new Date().getTime()}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('学生数据导出成功')
  } catch (error) {
    ElMessage.error('学生数据导出失败')
  } finally {
    exporting.value.student = false
  }
}

// 导出用户数据
const exportUserData = async () => {
  exporting.value.user = true
  try {
    const params = { ...exportForm.value.user }
    const response = await exportUsers(params)
    
    // 创建下载链接
    const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `users_export_${new Date().getTime()}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('用户数据导出成功')
  } catch (error) {
    ElMessage.error('用户数据导出失败')
  } finally {
    exporting.value.user = false
  }
}

// 处理审计日期范围变化
const handleAuditDateChange = (dates: string[]) => {
  if (dates && dates.length === 2) {
    exportForm.value.audit.startTime = dates[0]
    exportForm.value.audit.endTime = dates[1]
  } else {
    exportForm.value.audit.startTime = ''
    exportForm.value.audit.endTime = ''
  }
}

// 导出审计日志
const exportAuditData = async () => {
  exporting.value.audit = true
  try {
    const params = { ...exportForm.value.audit }
    const response = await exportLogs(params)
    
    // 创建下载链接
    const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit_logs_export_${new Date().getTime()}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('审计日志导出成功')
  } catch (error) {
    ElMessage.error('审计日志导出失败')
  } finally {
    exporting.value.audit = false
  }
}

// 获取学院列表
const fetchColleges = async () => {
  try {
    const response = await getCollegeList()
    colleges.value = response.data
  } catch (error) {
    ElMessage.error('获取学院列表失败')
  }
}

// 获取专业列表
const fetchMajors = async () => {
  try {
    const response = await getMajorList()
    majors.value = response.data
  } catch (error) {
    ElMessage.error('获取专业列表失败')
  }
}

onMounted(() => {
  fetchColleges()
  fetchMajors()
})
</script>

<style scoped>
.import-export {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tab-content {
  padding: 20px 0;
}

.import-section,
.export-section {
  padding: 20px;
}

.actions {
  display: flex;
  gap: 10px;
  margin: 20px 0;
  flex-wrap: wrap;
}

.file-info {
  margin-top: 10px;
}

.import-result {
  padding: 20px;
}

.result-details {
  margin-top: 20px;
}

.error-list {
  margin-top: 20px;
}

@media (max-width: 768px) {
  .actions {
    flex-direction: column;
  }
  
  .actions .el-button {
    width: 100%;
  }
}
</style>
