<template>
  <div class="student-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>学生管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="showCreateDialog = true">
              <el-icon><Plus /></el-icon>
              添加学生
            </el-button>
            <el-button type="success" @click="showImportDialog = true">
              <el-icon><Upload /></el-icon>
              批量导入
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索条件 -->
      <div class="search-form">
        <el-form :model="searchForm" inline>
          <el-form-item label="搜索">
            <el-input
              v-model="searchForm.search"
              placeholder="学号、姓名、身份证号"
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="学院">
            <el-select v-model="searchForm.collegeId" placeholder="选择学院" clearable>
              <el-option
                v-for="college in colleges"
                :key="college.id"
                :label="college.name"
                :value="college.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="专业">
            <el-select v-model="searchForm.majorId" placeholder="选择专业" clearable>
              <el-option
                v-for="major in majors"
                :key="major.id"
                :label="major.name"
                :value="major.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="学位类型">
            <el-select v-model="searchForm.degreeType" placeholder="选择学位类型" clearable>
              <el-option label="硕士" value="master" />
              <el-option label="博士" value="doctor" />
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
        <el-table-column prop="studentId" label="学号" width="120" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="60">
          <template #default="{ row }">
            {{ row.gender === 'male' ? '男' : '女' }}
          </template>
        </el-table-column>
        <el-table-column prop="idNumber" label="身份证号" width="180">
          <template #default="{ row }">
            {{ maskIdNumber(row.idNumber) }}
          </template>
        </el-table-column>
        <el-table-column prop="college.name" label="学院" width="120" />
        <el-table-column prop="major.name" label="专业" width="120" />
        <el-table-column prop="degreeType" label="学位类型" width="80">
          <template #default="{ row }">
            {{ row.degreeType === 'master' ? '硕士' : '博士' }}
          </template>
        </el-table-column>
        <el-table-column prop="supervisor.name" label="导师" width="100" />
        <el-table-column prop="enrollmentDate" label="入学日期" width="120" />
        <el-table-column prop="currentStatus" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.currentStatus)">
              {{ getStatusText(row.currentStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button type="warning" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-popconfirm
              title="确定要删除这个学生吗？"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
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

    <!-- 创建/编辑学生对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingStudent ? '编辑学生' : '添加学生'"
      width="600px"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="120px"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="createForm.gender">
            <el-radio label="male">男</el-radio>
            <el-radio label="female">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="身份证号" prop="idNumber">
          <el-input v-model="createForm.idNumber" placeholder="请输入身份证号" />
        </el-form-item>
        <el-form-item label="学院" prop="collegeId">
          <el-select v-model="createForm.collegeId" placeholder="选择学院" style="width: 100%">
            <el-option
              v-for="college in colleges"
              :key="college.id"
              :label="college.name"
              :value="college.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="专业" prop="majorId">
          <el-select v-model="createForm.majorId" placeholder="选择专业" style="width: 100%">
            <el-option
              v-for="major in filteredMajors"
              :key="major.id"
              :label="major.name"
              :value="major.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="学位类型" prop="degreeType">
          <el-select v-model="createForm.degreeType" placeholder="选择学位类型" style="width: 100%">
            <el-option label="硕士" value="master" />
            <el-option label="博士" value="doctor" />
          </el-select>
        </el-form-item>
        <el-form-item label="导师" prop="supervisorId">
          <el-select v-model="createForm.supervisorId" placeholder="选择导师" style="width: 100%">
            <el-option
              v-for="supervisor in supervisors"
              :key="supervisor.id"
              :label="supervisor.name"
              :value="supervisor.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="入学日期" prop="enrollmentDate">
          <el-date-picker
            v-model="createForm.enrollmentDate"
            type="date"
            placeholder="选择入学日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="预计毕业日期">
          <el-date-picker
            v-model="createForm.expectedGraduationDate"
            type="date"
            placeholder="选择预计毕业日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="showImportDialog" title="批量导入学生" width="500px">
      <div class="import-content">
        <el-alert
          title="导入说明"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <template #default>
            <p>1. 请下载模板文件，按照模板格式填写学生信息</p>
            <p>2. 支持 Excel (.xlsx) 格式</p>
            <p>3. 单次最多导入 500 条记录</p>
          </template>
        </el-alert>
        
        <div class="import-actions">
          <el-button type="primary" @click="downloadTemplate">
            <el-icon><Download /></el-icon>
            下载模板
          </el-button>
        </div>        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :on-change="handleFileChange"
          :file-list="[]"
          accept=".xlsx,.xls"
          drag
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              只能上传 Excel 文件，且不超过 10MB
            </div>
          </template>
        </el-upload>

        <div class="import-actions" style="margin-top: 20px; text-align: center;">
          <el-button type="primary" @click="handleImport" :loading="importing">
            开始导入
          </el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="showImportDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 学生详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="学生详情" width="800px">
      <div v-if="selectedStudent" class="student-detail">
        <!-- 详情内容 -->
        <el-descriptions :column="2" border>
          <el-descriptions-item label="学号">{{ selectedStudent.studentId }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ selectedStudent.name }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ selectedStudent.gender === 'male' ? '男' : '女' }}</el-descriptions-item>
          <el-descriptions-item label="身份证号">{{ maskIdNumber(selectedStudent.idNumber) }}</el-descriptions-item>
          <el-descriptions-item label="学院">{{ selectedStudent.college?.name }}</el-descriptions-item>
          <el-descriptions-item label="专业">{{ selectedStudent.major?.name }}</el-descriptions-item>
          <el-descriptions-item label="学位类型">{{ selectedStudent.degreeType === 'master' ? '硕士' : '博士' }}</el-descriptions-item>
          <el-descriptions-item label="导师">{{ selectedStudent.supervisor?.name }}</el-descriptions-item>
          <el-descriptions-item label="入学日期">{{ selectedStudent.enrollmentDate }}</el-descriptions-item>
          <el-descriptions-item label="预计毕业日期">{{ selectedStudent.expectedGraduationDate || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusType(selectedStudent.currentStatus)">
              {{ getStatusText(selectedStudent.currentStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="联系邮箱">{{ selectedStudent.user?.email || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ selectedStudent.user?.phone || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="家庭住址" :span="2">{{ selectedStudent.address || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="紧急联系人">{{ selectedStudent.emergencyContact || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="紧急联系电话">{{ selectedStudent.emergencyPhone || '未设置' }}</el-descriptions-item>
          <el-descriptions-item label="研究方向" :span="2">{{ selectedStudent.researchDirection || '未设置' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Download, UploadFilled } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import { getStudentList, createStudent, updateStudent, deleteStudent, importStudentsFromExcel } from '@/api/student'
import { getCollegeList, getMajorList } from '@/api/college'
import { getSupervisorList } from '@/api/supervisor'
import type { StudentProfile } from '@/types/student'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const importing = ref(false)
const students = ref<StudentProfile[]>([])
const colleges = ref<any[]>([])
const majors = ref<any[]>([])
const supervisors = ref<any[]>([])
const uploadFile = ref<File | null>(null)

// 对话框状态
const showCreateDialog = ref(false)
const showImportDialog = ref(false)
const showDetailDialog = ref(false)

// 编辑状态
const editingStudent = ref<StudentProfile | null>(null)
const selectedStudent = ref<StudentProfile | null>(null)

// 搜索表单
const searchForm = ref({
  search: '',
  collegeId: '',
  majorId: '',
  degreeType: ''
})

// 分页
const pagination = ref({
  page: 1,
  size: 20,
  total: 0
})

// 创建表单
const createForm = ref({
  name: '',
  gender: '',
  idNumber: '',
  collegeId: '',
  majorId: '',
  degreeType: '',
  supervisorId: '',
  enrollmentDate: '',
  expectedGraduationDate: ''
})

// 表单验证规则
const createRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  idNumber: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, message: '请输入正确的身份证号', trigger: 'blur' }
  ],
  collegeId: [{ required: true, message: '请选择学院', trigger: 'change' }],
  majorId: [{ required: true, message: '请选择专业', trigger: 'change' }],
  degreeType: [{ required: true, message: '请选择学位类型', trigger: 'change' }],
  supervisorId: [{ required: true, message: '请选择导师', trigger: 'change' }],
  enrollmentDate: [{ required: true, message: '请选择入学日期', trigger: 'change' }]
}

// 计算属性
const filteredMajors = computed(() => {
  if (!createForm.value.collegeId) return []
  return majors.value.filter(major => major.collegeId === createForm.value.collegeId)
})

// 监听学院变化，重置专业选择
watch(() => createForm.value.collegeId, () => {
  createForm.value.majorId = ''
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

// 获取学生列表
const fetchStudents = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      size: pagination.value.size,
      keyword: searchForm.value.search,
      collegeId: searchForm.value.collegeId || undefined,
      majorId: searchForm.value.majorId || undefined,
      degreeType: searchForm.value.degreeType || undefined
    }
    const response = await getStudentList(params)
    students.value = response.data.content
    pagination.value.total = response.data.totalElements
  } catch (error) {
    ElMessage.error('获取学生列表失败')
  } finally {
    loading.value = false
  }
}

// 获取基础数据
const fetchBaseData = async () => {
  try {
    const [collegeRes, supervisorRes] = await Promise.all([
      getCollegeList(),
      getSupervisorList()
    ])
    colleges.value = collegeRes.data
    supervisors.value = supervisorRes.data

    // 获取所有专业
    const majorRes = await getMajorList()
    majors.value = majorRes.data
  } catch (error) {
    ElMessage.error('获取基础数据失败')
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
    collegeId: '',
    majorId: '',
    degreeType: ''
  }
  pagination.value.page = 1
  fetchStudents()
}

// 查看学生详情
const handleView = (student: StudentProfile) => {
  selectedStudent.value = student
  showDetailDialog.value = true
}

// 编辑学生
const handleEdit = (student: StudentProfile) => {
  editingStudent.value = student
  createForm.value = {
    name: student.name,
    gender: student.gender,
    idNumber: student.idNumber,
    collegeId: student.college.id,
    majorId: student.major.id,
    degreeType: student.degreeType,
    supervisorId: student.supervisor.id,
    enrollmentDate: student.enrollmentDate,
    expectedGraduationDate: student.expectedGraduationDate || ''
  }
  showCreateDialog.value = true
}

// 删除学生
const handleDelete = async (student: StudentProfile) => {
  try {
    await deleteStudent(student.id)
    ElMessage.success('删除成功')
    fetchStudents()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

// 提交表单
const createFormRef = ref<FormInstance>()
const handleSubmit = async () => {
  if (!createFormRef.value) return
  
  const valid = await createFormRef.value.validate()
  if (!valid) return

  submitting.value = true
  try {
    if (editingStudent.value) {
      // 编辑学生信息
      await updateStudent(editingStudent.value.id, createForm.value)
      ElMessage.success('更新成功')
    } else {
      await createStudent(createForm.value)
      ElMessage.success('创建成功')
    }
    showCreateDialog.value = false
    resetCreateForm()
    fetchStudents()
  } catch (error) {
    ElMessage.error(editingStudent.value ? '更新失败' : '创建失败')
  } finally {
    submitting.value = false
  }
}

// 重置创建表单
const resetCreateForm = () => {
  editingStudent.value = null
  createForm.value = {
    name: '',
    gender: '',
    idNumber: '',
    collegeId: '',
    majorId: '',
    degreeType: '',
    supervisorId: '',
    enrollmentDate: '',
    expectedGraduationDate: ''
  }
  createFormRef.value?.resetFields()
}

// 下载模板
const downloadTemplate = () => {
  // 创建一个临时链接下载模板文件
  const link = document.createElement('a')
  link.href = `${import.meta.env.VITE_API_BASE_URL}/api/student-profiles/template`
  link.download = '学生信息导入模板.xlsx'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 文件变化处理
const handleFileChange = (file: any) => {
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
  
  uploadFile.value = rawFile
}

// 执行导入
const handleImport = async () => {
  if (!uploadFile.value) {
    ElMessage.error('请先选择要导入的文件')
    return
  }

  importing.value = true
  try {
    const response = await importStudentsFromExcel(uploadFile.value)
    if (response.data.success) {
      ElMessage.success(`导入成功！共导入 ${response.data.successCount} 条记录`)
      showImportDialog.value = false
      uploadFile.value = null
      fetchStudents()
    } else {
      ElMessage.error(response.data.message || '导入失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '导入失败，请检查文件格式')
  } finally {
    importing.value = false
  }
}

onMounted(() => {
  fetchBaseData()
  fetchStudents()
})
</script>

<style scoped>
.student-management {
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

.import-content {
  padding: 20px 0;
}

.import-actions {
  margin-bottom: 20px;
  text-align: center;
}

.student-detail {
  padding: 20px 0;
}
</style>
