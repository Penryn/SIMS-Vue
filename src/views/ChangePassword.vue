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
              <div class="strength-labels">
                <span :class="{ active: passwordStrength >= 1 }">弱</span>
                <span :class="{ active: passwordStrength >= 3 }">中</span>
                <span :class="{ active: passwordStrength >= 5 }">强</span>
              </div>
            </div>
            <span class="strength-text" :class="strengthClass">
              {{ strengthText }}
            </span>
            <ul class="strength-tips">
              <li :class="{ pass: /[A-Z]/.test(passwordForm.newPassword) }">包含大写字母</li>
              <li :class="{ pass: /[a-z]/.test(passwordForm.newPassword) }">包含小写字母</li>
              <li :class="{ pass: /\d/.test(passwordForm.newPassword) }">包含数字</li>
              <li :class="{ pass: hasSpecialChar }">包含特殊字符</li>
              <li :class="{ pass: passwordForm.newPassword.length >= 8 }">长度不少于8位</li>
            </ul>
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
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { changePassword } from '@/api/user'
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
    { validator: validatePasswordConfirm, trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (!value) {
          callback(new Error('请确认新密码'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
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
}

// 提交表单
const handleSubmit = async () => {
  if (!passwordFormRef.value) return
  try {
    await passwordFormRef.value.validate()
    loading.value = true
    const response = await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword
    })
    if ((response.data && response.data.success) || response.success) {
      ElMessage.success((response.data && response.data.message) || response.message || '密码修改成功，请重新登录')
      await ElMessageBox.confirm(
        '密码修改成功，系统将自动退出登录，请使用新密码重新登录。',
        '修改成功',
        {
          confirmButtonText: '确定',
          type: 'success',
          showCancelButton: false
        }
      )
      await authStore.logout()
    } else {
      ElMessage.error((response.data && response.data.message) || response.message || '密码修改失败')
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
}

// 格式化日期时间
const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 计算属性：是否包含特殊字符
const hasSpecialChar = computed(() =>
  /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordForm.newPassword)
)
</script>

<style scoped>
.change-password {
  padding: 20px;
}

.password-card {
  max-width: 600px;
  margin: 0 auto;
}

.card-header {
  text-align: center;
}

.security-tips {
  margin-bottom: 20px;
}

.password-form {
  margin-top: 20px;
}

.password-strength {
  margin-top: 10px;
}
.strength-bar {
  width: 100%;
  height: 10px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}
.strength-fill {
  height: 100%;
  transition: width 0.3s;
}
.strength-fill.weak {
  background: linear-gradient(90deg, #f56c6c 0%, #fbc2c2 100%);
}
.strength-fill.medium {
  background: linear-gradient(90deg, #e6a23c 0%, #ffe0b2 100%);
}
.strength-fill.strong {
  background: linear-gradient(90deg, #67c23a 0%, #b2f2bb 100%);
}
.strength-labels {
  position: absolute;
  top: 12px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #bdbdbd;
  padding: 0 2px;
}
.strength-labels span.active {
  color: #303133;
  font-weight: bold;
}
.strength-text {
  margin-top: 5px;
  font-weight: bold;
  display: inline-block;
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
.strength-tips {
  margin: 8px 0 0 0;
  padding: 0 0 0 18px;
  font-size: 12px;
  color: #909399;
  list-style: disc;
}
.strength-tips li {
  margin-bottom: 2px;
  transition: color 0.2s;
}
.strength-tips li.pass {
  color: #67c23a;
  font-weight: bold;
}

.password-history {
  margin-top: 30px;
}

.password-history h3 {
  margin-bottom: 10px;
}
</style>
