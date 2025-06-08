<template>
  <div class="teacher-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>导师管理</span>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            添加导师
          </el-button>
        </div>
      </template>

      <!-- 搜索条件 -->
      <div class="search-form">
        <el-form :model="searchForm" inline>
          <el-form-item label="搜索">
            <el-input
              v-model="searchForm.search"
              placeholder="工号、姓名"
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
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 导师列表 -->
      <el-table
        v-loading="loading"
        :data="teachers"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="username" label="工号" width="120" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="phone" label="电话" width="150" />
        <el-table-column prop="college.name" label="所属学院" width="150" />
        <el-table-column prop="title" label="职称" width="100" />
        <el-table-column prop="researchDirection" label="研究方向" min-width="200" show-overflow-tooltip />
        <el-table-column prop="studentCount" label="指导学生数" width="120" align="center" />
        <el-table-column prop="enabled" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'danger'">
              {{ row.enabled ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button type="warning" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-popconfirm
              title="确定要删除这个导师吗？"
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
          @current-change="fetchTeachers"
          @size-change="fetchTeachers"
        />
      </div>
    </el-card>

    <!-- 创建/编辑导师对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingTeacher ? '编辑导师' : '添加导师'"
      width="600px"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="120px"
      >
        <el-form-item label="工号" prop="username">
          <el-input v-model="createForm.username" placeholder="请输入工号" :disabled="!!editingTeacher" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="createForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="createForm.phone" placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="所属学院" prop="collegeId">
          <el-select v-model="createForm.collegeId" placeholder="选择学院" style="width: 100%">
            <el-option
              v-for="college in colleges"
              :key="college.id"
              :label="college.name"
              :value="college.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="职称" prop="title">
          <el-select v-model="createForm.title" placeholder="选择职称" style="width: 100%">
            <el-option label="教授" value="教授" />
            <el-option label="副教授" value="副教授" />
            <el-option label="讲师" value="讲师" />
            <el-option label="助教" value="助教" />
          </el-select>
        </el-form-item>
        <el-form-item label="研究方向" prop="researchDirection">
          <el-input
            v-model="createForm.researchDirection"
            type="textarea"
            :rows="3"
            placeholder="请输入研究方向"
          />
        </el-form-item>
        <el-form-item label="个人简介">
          <el-input
            v-model="createForm.biography"
            type="textarea"
            :rows="4"
            placeholder="请输入个人简介"
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

    <!-- 导师详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="导师详情" width="800px">
      <div v-if="selectedTeacher" class="teacher-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工号">{{ selectedTeacher.username }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ selectedTeacher.name }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ selectedTeacher.email }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ selectedTeacher.phone }}</el-descriptions-item>
          <el-descriptions-item label="所属学院">{{ selectedTeacher.college?.name }}</el-descriptions-item>
          <el-descriptions-item label="职称">{{ selectedTeacher.title }}</el-descriptions-item>
          <el-descriptions-item label="指导学生数">{{ selectedTeacher.studentCount }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="selectedTeacher.enabled ? 'success' : 'danger'">
              {{ selectedTeacher.enabled ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="研究方向" :span="2">
            {{ selectedTeacher.researchDirection || '未设置' }}
          </el-descriptions-item>
          <el-descriptions-item label="个人简介" :span="2">
            {{ selectedTeacher.biography || '未设置' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ selectedTeacher.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="最后登录">{{ selectedTeacher.lastLoginTime || '从未登录' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 指导的学生列表 -->
        <el-divider content-position="left">指导的学生</el-divider>
        <el-table :data="selectedTeacher.students" style="width: 100%">
          <el-table-column prop="studentId" label="学号" width="120" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="major.name" label="专业" width="120" />
          <el-table-column prop="degreeType" label="学位类型" width="100">
            <template #default="{ row }">
              {{ row.degreeType === 'master' ? '硕士' : '博士' }}
            </template>
          </el-table-column>
          <el-table-column prop="enrollmentDate" label="入学日期" width="120" />
          <el-table-column prop="currentStatus" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.currentStatus)">
                {{ getStatusText(row.currentStatus) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
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
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import { getSupervisorList, createSupervisor, updateSupervisor, deleteSupervisor } from '@/api/supervisor'
import { getCollegeList } from '@/api/college'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const teachers = ref<any[]>([])
const colleges = ref<any[]>([])

// 对话框状态
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)

// 编辑状态
const editingTeacher = ref<any>(null)
const selectedTeacher = ref<any>(null)

// 搜索表单
const searchForm = ref({
  search: '',
  collegeId: ''
})

// 分页
const pagination = ref({
  page: 1,
  size: 20,
  total: 0
})

// 创建表单
const createForm = ref({
  username: '',
  name: '',
  email: '',
  phone: '',
  collegeId: '',
  title: '',
  researchDirection: '',
  biography: ''
})

// 表单验证规则
const createRules = {
  username: [{ required: true, message: '请输入工号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  collegeId: [{ required: true, message: '请选择学院', trigger: 'change' }],
  title: [{ required: true, message: '请选择职称', trigger: 'change' }]
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

// 获取导师列表
const fetchTeachers = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      size: pagination.value.size,
      ...searchForm.value
    }
    const response = await getSupervisorList(params)
    teachers.value = response.data.content
    pagination.value.total = response.data.totalElements
  } catch (error) {
    ElMessage.error('获取导师列表失败')
  } finally {
    loading.value = false
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

// 搜索
const handleSearch = () => {
  pagination.value.page = 1
  fetchTeachers()
}

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    search: '',
    collegeId: ''
  }
  pagination.value.page = 1
  fetchTeachers()
}

// 查看导师详情
const handleView = (teacher: any) => {
  selectedTeacher.value = teacher
  showDetailDialog.value = true
}

// 编辑导师
const handleEdit = (teacher: any) => {
  editingTeacher.value = teacher
  createForm.value = {
    username: teacher.username,
    name: teacher.name,
    email: teacher.email,
    phone: teacher.phone,
    collegeId: teacher.college?.id || '',
    title: teacher.title || '',
    researchDirection: teacher.researchDirection || '',
    biography: teacher.biography || ''
  }
  showCreateDialog.value = true
}

// 删除导师
const handleDelete = async (teacher: any) => {
  try {
    await deleteSupervisor(teacher.id)
    ElMessage.success('删除成功')
    fetchTeachers()
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
    if (editingTeacher.value) {
      await updateSupervisor(editingTeacher.value.id, createForm.value)
      ElMessage.success('更新成功')
    } else {
      await createSupervisor(createForm.value)
      ElMessage.success('创建成功')
    }
    showCreateDialog.value = false
    resetCreateForm()
    fetchTeachers()
  } catch (error) {
    ElMessage.error(editingTeacher.value ? '更新失败' : '创建失败')
  } finally {
    submitting.value = false
  }
}

// 重置创建表单
const resetCreateForm = () => {
  editingTeacher.value = null
  createForm.value = {
    username: '',
    name: '',
    email: '',
    phone: '',
    collegeId: '',
    title: '',
    researchDirection: '',
    biography: ''
  }
  createFormRef.value?.resetFields()
}

onMounted(() => {
  fetchColleges()
  fetchTeachers()
})
</script>

<style scoped>
.teacher-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.teacher-detail {
  padding: 20px 0;
}
</style>
