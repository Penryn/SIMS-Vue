<template>
  <div class="change-password">
    <el-card class="password-card">
      <template #header>
        <div class="card-header">
          <h2>修改密码</h2>
          <p>为了保障账户安全，建议定期更换密码</p>
        </div>
      </template>

      <!-- 密码强度提示 -->
      <el-alert
        title="密码安全要求"
        type="info"
        :closable="false"
        class="security-tips"
      >
        <ul>
          <li>密码长度至少8位，最多20位</li>
          <li>必须包含大写字母、小写字母、数字和特殊字符</li>
          <li>不能包含用户名、姓名等个人信息</li>
          <li>不能与近6次历史密码相同</li>
          <li>建议每90天更换一次密码</li>
        </ul>
      </el-alert>

      <el-form
        :model="passwordForm"
        :rules="passwordRules"
        ref="passwordFormRef"
        label-width="120px"
        class="password-form"
      >
        <el-form-item label="当前密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入当前密码"
            show-password
            :prefix-icon="Lock"
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
            :prefix-icon="Lock"
            @input="checkPasswordStrength"
          />
          <!-- 密码强度指示器 -->
          <div class="password-strength" v-if="passwordForm.newPassword">
            <div class="strength-bar">
              <div 
                class="strength-fill"
                :class="strengthClass"
                :style="{ width: strengthPercentage + '%' }"
              ></div>
            </div>
            <span class="strength-text" :class="strengthClass">
              {{ strengthText }}
            </span>
          </div>
        </el-form-item>

        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
            :prefix-icon="Lock"
          />
        </el-form-item>

        <!-- 密码历史检查结果 -->
        <el-form-item v-if="historyCheckResult">
          <el-alert
            :title="historyCheckResult.message"
            :type="historyCheckResult.type"
            :closable="false"
          />
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleSubmit"
            :loading="loading"
            size="large"
          >
            修改密码
          </el-button>
          <el-button @click="handleReset" size="large">
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 密码修改记录 -->
      <div class="password-history" v-if="showHistory">
        <h3>密码修改记录</h3>
        <el-table :data="passwordHistory" stripe>
          <el-table-column prop="changeTime" label="修改时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.changeTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="ipAddress" label="IP地址" width="150" />
          <el-table-column prop="userAgent" label="设备信息" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'SUCCESS' ? 'success' : 'danger'">
                {{ row.status === 'SUCCESS' ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { changePassword, getPasswordHistory, checkPasswordHistory } from '@/api/user'
import type { FormInstance, FormRules } from 'element-plus'

const authStore = useAuthStore()
const passwordFormRef = ref<FormInstance>()
const loading = ref(false)

// 密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码强度
const passwordStrength = ref(0)
const strengthText = ref('')
const strengthClass = ref('')
const strengthPercentage = ref(0)

// 历史密码检查结果
const historyCheckResult = ref<{
  message: string
  type: 'success' | 'warning' | 'error'
} | null>(null)

// 密码修改记录
const passwordHistory = ref([])
const showHistory = computed(() => {
  return ['system_admin', 'audit_admin'].includes(authStore.userRole)
})

// 表单验证规则
const passwordRules: FormRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 20, message: '密码长度为8-20位', trigger: 'blur' },
    { validator: validatePasswordComplexity, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validatePasswordConfirm, trigger: 'blur' }
  ]
}

// 密码复杂度验证
function validatePasswordComplexity(rule: any, value: string, callback: any) {
  if (!value) {
    callback()
    return
  }

  const hasUpperCase = /[A-Z]/.test(value)
  const hasLowerCase = /[a-z]/.test(value)
  const hasNumber = /\d/.test(value)
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)

  if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
    callback(new Error('密码必须包含大写字母、小写字母、数字和特殊字符'))
    return
  }

  // 检查是否包含用户信息
  const userInfo = authStore.userInfo
  if (userInfo) {
    const username = userInfo.username?.toLowerCase()
    const name = userInfo.name?.toLowerCase()
    const valueLower = value.toLowerCase()
    
    if ((username && valueLower.includes(username)) || 
        (name && valueLower.includes(name))) {
      callback(new Error('密码不能包含用户名或姓名'))
      return
    }
  }

  callback()
}

// 确认密码验证
function validatePasswordConfirm(rule: any, value: string, callback: any) {
  if (!value) {
    callback()
    return
  }

  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
    return
  }

  callback()
}

// 检查密码强度
const checkPasswordStrength = () => {
  const password = passwordForm.newPassword
  if (!password) {
    passwordStrength.value = 0
    strengthText.value = ''
    strengthClass.value = ''
    strengthPercentage.value = 0
    return
  }

  let score = 0
  
  // 长度评分
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  
  // 字符类型评分
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1
  
  // 复杂度评分
  if (password.length >= 16) score += 1
  if (/(.)\1{2,}/.test(password)) score -= 1 // 重复字符扣分
  
  passwordStrength.value = Math.max(0, Math.min(6, score))
  
  if (score <= 2) {
    strengthText.value = '弱'
    strengthClass.value = 'weak'
    strengthPercentage.value = 25
  } else if (score <= 4) {
    strengthText.value = '中等'
    strengthClass.value = 'medium'
    strengthPercentage.value = 60
  } else {
    strengthText.value = '强'
    strengthClass.value = 'strong'
    strengthPercentage.value = 100
  }

  // 检查历史密码
  checkPasswordHistoryAsync()
}

// 异步检查历史密码
const checkPasswordHistoryAsync = async () => {
  try {
    const response = await checkPasswordHistory({
      userId: authStore.userInfo?.id,
      newPassword: passwordForm.newPassword
    })
    
    if (response.data.success) {
      if (response.data.data.isRepeated) {
        historyCheckResult.value = {
          message: '新密码不能与近6次历史密码相同',
          type: 'error'
        }
      } else {
        historyCheckResult.value = {
          message: '密码可以使用',
          type: 'success'
        }
      }
    }
  } catch (error) {
    console.error('检查历史密码失败:', error)
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!passwordFormRef.value) return

  try {
    await passwordFormRef.value.validate()
    
    if (historyCheckResult.value?.type === 'error') {
      ElMessage.error('请修改密码，不能与历史密码相同')
      return
    }

    loading.value = true

    const response = await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })

    if (response.data.success) {
      ElMessage.success('密码修改成功，请重新登录')
      
      // 显示确认对话框
      await ElMessageBox.confirm(
        '密码修改成功，系统将自动退出登录，请使用新密码重新登录。',
        '修改成功',
        {
          confirmButtonText: '确定',
          type: 'success',
          showCancelButton: false
        }
      )
      
      // 退出登录
      authStore.logout()
    } else {
      ElMessage.error(response.data.message || '密码修改失败')
    }
  } catch (error: any) {
    console.error('修改密码失败:', error)
    ElMessage.error(error.response?.data?.message || '修改密码失败')
  } finally {
    loading.value = false
  }
}

// 重置表单
const handleReset = () => {
  passwordFormRef.value?.resetFields()
  passwordStrength.value = 0
  strengthText.value = ''
  strengthClass.value = ''
  strengthPercentage.value = 0
  historyCheckResult.value = null
}

// 格式化日期时间
const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 加载密码修改记录
const loadPasswordHistory = async () => {
  if (!showHistory.value) return
  
  try {
    const response = await getPasswordHistory()
    if (response.data.success) {
      passwordHistory.value = response.data.data
    }
  } catch (error) {
    console.error('加载密码修改记录失败:', error)
  }
}

// 组件挂载时加载历史记录
import { onMounted } from 'vue'
onMounted(() => {
  loadPasswordHistory()
})
</script>

<style scoped>
.change-password {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.password-card {
  border-radius: 8px;
}

.card-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.card-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.security-tips {
  margin-bottom: 24px;
}

.security-tips ul {
  margin: 0;
  padding-left: 20px;
}

.security-tips li {
  margin: 4px 0;
  font-size: 14px;
}

.password-form {
  margin-top: 24px;
}

.password-strength {
  margin-top: 8px;
}

.strength-bar {
  width: 100%;
  height: 4px;
  background-color: #f5f5f5;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 2px;
}

.strength-fill.weak {
  background-color: #f56c6c;
}

.strength-fill.medium {
  background-color: #e6a23c;
}

.strength-fill.strong {
  background-color: #67c23a;
}

.strength-text {
  font-size: 12px;
  font-weight: 500;
}

.strength-text.weak {
  color: #f56c6c;
}

.strength-text.medium {
  color: #e6a23c;
}

.strength-text.strong {
  color: #67c23a;
}

.password-history {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
}

.password-history h3 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
}

.password-form :deep(.el-form-item__label) {
  font-weight: 500;
}

.password-form :deep(.el-input__wrapper) {
  border-radius: 6px;
}
</style>
