<template>
  <div class="user-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            添加用户
          </el-button>
        </div>
      </template>

      <!-- 搜索条件 -->
      <div class="search-form">
        <el-form :model="searchForm" inline>
          <el-form-item label="搜索">
            <el-input
              v-model="searchForm.search"
              placeholder="用户名、姓名"
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="角色">
            <el-select v-model="searchForm.role" placeholder="选择角色" clearable>
              <el-option label="学生" value="student" />
              <el-option label="导师" value="teacher" />
              <el-option label="学院管理员" value="college_admin" />
              <el-option label="学院领导" value="college_leader" />
              <el-option label="研究生院管理员" value="grad_admin" />
              <el-option label="研究生院领导" value="grad_leader" />
              <el-option label="学校领导" value="school_leader" />
              <el-option label="系统管理员" value="system_admin" />
              <el-option label="审计管理员" value="audit_admin" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.enabled" placeholder="选择状态" clearable>
              <el-option label="启用" :value="true" />
              <el-option label="禁用" :value="false" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 用户列表 -->
      <el-table
        v-loading="loading"
        :data="users"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="phone" label="电话" width="150" />
        <el-table-column prop="roles" label="角色" width="200">
          <template #default="{ row }">
            <el-tag
              v-for="role in row.roles"
              :key="role.name"
              type="primary"
              size="small"
              style="margin-right: 5px;"
            >
              {{ getRoleText(role.name) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="enabled" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'danger'">
              {{ row.enabled ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="accountNonLocked" label="锁定状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.accountNonLocked ? 'success' : 'warning'">
              {{ row.accountNonLocked ? '正常' : '锁定' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginTime" label="最后登录" width="180">
          <template #default="{ row }">
            {{ row.lastLoginTime ? formatDateTime(row.lastLoginTime) : '从未登录' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button type="warning" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button 
              :type="row.enabled ? 'danger' : 'success'" 
              size="small" 
              @click="handleToggleStatus(row)"
            >
              {{ row.enabled ? '禁用' : '启用' }}
            </el-button>
            <el-button type="info" size="small" @click="handleResetPassword(row)">
              重置密码
            </el-button>
            <el-popconfirm
              title="确定要删除这个用户吗？"
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
          @current-change="fetchUsers"
          @size-change="fetchUsers"
        />
      </div>
    </el-card>

    <!-- 创建/编辑用户对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingUser ? '编辑用户' : '添加用户'"
      width="600px"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="120px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="createForm.username" placeholder="请输入用户名" :disabled="!!editingUser" />
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
        <el-form-item label="角色" prop="roles">
          <el-checkbox-group v-model="createForm.roles">
            <el-checkbox label="student">学生</el-checkbox>
            <el-checkbox label="teacher">导师</el-checkbox>
            <el-checkbox label="college_admin">学院管理员</el-checkbox>
            <el-checkbox label="college_leader">学院领导</el-checkbox>
            <el-checkbox label="grad_admin">研究生院管理员</el-checkbox>
            <el-checkbox label="grad_leader">研究生院领导</el-checkbox>
            <el-checkbox label="school_leader">学校领导</el-checkbox>
            <el-checkbox label="system_admin">系统管理员</el-checkbox>
            <el-checkbox label="audit_admin">审计管理员</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item v-if="!editingUser" label="初始密码" prop="password">
          <el-input 
            v-model="createForm.password" 
            type="password" 
            placeholder="请输入初始密码"
            show-password
          />
          <div class="password-hint">
            密码要求：8位以上，包含数字、大小写字母、特殊字符
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 用户详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="用户详情" width="700px">
      <div v-if="selectedUser" class="user-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户ID">{{ selectedUser.id }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ selectedUser.username }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ selectedUser.name }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ selectedUser.email }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ selectedUser.phone }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="selectedUser.enabled ? 'success' : 'danger'">
              {{ selectedUser.enabled ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="锁定状态">
            <el-tag :type="selectedUser.accountNonLocked ? 'success' : 'warning'">
              {{ selectedUser.accountNonLocked ? '正常' : '锁定' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="登录失败次数">{{ selectedUser.loginAttempts }}</el-descriptions-item>
          <el-descriptions-item label="首次登录">
            <el-tag :type="selectedUser.firstLogin ? 'warning' : 'success'">
              {{ selectedUser.firstLogin ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最后密码修改时间">
            {{ selectedUser.lastPasswordChangeTime ? formatDateTime(selectedUser.lastPasswordChangeTime) : '未修改' }}
          </el-descriptions-item>
          <el-descriptions-item label="最后登录时间">
            {{ selectedUser.lastLoginTime ? formatDateTime(selectedUser.lastLoginTime) : '从未登录' }}
          </el-descriptions-item>
          <el-descriptions-item label="锁定时间">
            {{ selectedUser.lockedTime ? formatDateTime(selectedUser.lockedTime) : '未锁定' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(selectedUser.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDateTime(selectedUser.updatedAt) }}</el-descriptions-item>
          <el-descriptions-item label="角色" :span="2">
            <el-tag
              v-for="role in selectedUser.roles"
              :key="role.name"
              type="primary"
              size="small"
              style="margin-right: 5px;"
            >
              {{ getRoleText(role.name) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { getUserList, createUser, updateUser, deleteUser, resetPassword, toggleUserStatus } from '@/api/user'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const users = ref<any[]>([])
const selectedUser = ref<any>(null)
const editingUser = ref<any>(null)

// 对话框状态
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)

// 搜索表单
const searchForm = ref({
  search: '',
  role: '',
  enabled: ''
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
  roles: [],
  password: ''
})

// 表单验证规则
const createRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  roles: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { 
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      message: '密码必须包含大小写字母、数字和特殊字符，长度至少8位',
      trigger: 'blur'
    }
  ]
}

// 格式化日期时间
const formatDateTime = (timestamp: string) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 获取角色文本
const getRoleText = (role: string) => {
  const roleMap: Record<string, string> = {
    student: '学生',
    teacher: '导师',
    college_admin: '学院管理员',
    college_leader: '学院领导',
    grad_admin: '研究生院管理员',
    grad_leader: '研究生院领导',
    school_leader: '学校领导',
    system_admin: '系统管理员',
    audit_admin: '审计管理员'
  }
  return roleMap[role] || role
}

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      size: pagination.value.size,
      ...searchForm.value
    }
    const response = await getUserList(params)
    users.value = response.data.content
    pagination.value.total = response.data.totalElements
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.value.page = 1
  fetchUsers()
}

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    search: '',
    role: '',
    enabled: ''
  }
  pagination.value.page = 1
  fetchUsers()
}

// 查看用户详情
const handleView = (user: any) => {
  selectedUser.value = user
  showDetailDialog.value = true
}

// 编辑用户
const handleEdit = (user: any) => {
  editingUser.value = user
  createForm.value = {
    username: user.username,
    name: user.name,
    email: user.email,
    phone: user.phone,
    roles: user.roles.map((role: any) => role.name),
    password: ''
  }
  showCreateDialog.value = true
}

// 删除用户
const handleDelete = async (user: any) => {
  try {
    await deleteUser(user.id)
    ElMessage.success('删除成功')
    fetchUsers()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

// 切换用户状态
const handleToggleStatus = async (user: any) => {
  try {
    await toggleUserStatus(user.id, !user.enabled)
    ElMessage.success(`${user.enabled ? '禁用' : '启用'}成功`)
    fetchUsers()
  } catch (error) {
    ElMessage.error(`${user.enabled ? '禁用' : '启用'}失败`)
  }
}

// 重置密码
const handleResetPassword = async (user: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要重置用户 ${user.name} 的密码吗？重置后密码将设置为身份证号后8位。`,
      '重置密码',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await resetPassword(user.id)
    ElMessage.success('密码重置成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('密码重置失败')
    }
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
    if (editingUser.value) {
      const { password, ...updateData } = createForm.value
      await updateUser(editingUser.value.id, updateData)
      ElMessage.success('更新成功')
    } else {
      await createUser(createForm.value)
      ElMessage.success('创建成功')
    }
    showCreateDialog.value = false
    resetCreateForm()
    fetchUsers()
  } catch (error) {
    ElMessage.error(editingUser.value ? '更新失败' : '创建失败')
  } finally {
    submitting.value = false
  }
}

// 重置创建表单
const resetCreateForm = () => {
  editingUser.value = null
  createForm.value = {
    username: '',
    name: '',
    email: '',
    phone: '',
    roles: [],
    password: ''
  }
  createFormRef.value?.resetFields()
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-management {
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

.user-detail {
  padding: 20px 0;
}

.password-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>
