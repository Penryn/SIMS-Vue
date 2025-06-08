<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-box">
        <div class="login-header">
          <img src="@/assets/logo.svg" alt="SIMS" class="logo" />
          <h1 class="title">学籍信息管理系统</h1>
          <p class="subtitle">Student Information Management System</p>
        </div>

        <!-- 账户锁定提示 -->
        <el-alert
          v-if="authStore.isLocked"
          title="账户已锁定"
          type="error"
          :description="`登录失败次数过多，账户已锁定，请在 ${lockTimeLeft} 后重试`"
          show-icon
          :closable="false"
          class="lock-alert"
        />

        <el-form
          ref="formRef"
          :model="loginForm"
          :rules="rules"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入学号"
              size="large"
              :disabled="authStore.isLocked"
              autocomplete="username"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              show-password
              :disabled="authStore.isLocked"
              autocomplete="current-password"
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- 验证码 -->
          <el-form-item prop="captcha" v-if="showCaptcha">
            <div class="captcha-wrapper">
              <el-input
                v-model="loginForm.captcha"
                placeholder="请输入验证码"
                size="large"
                :disabled="authStore.isLocked"
                autocomplete="off"
              >
                <template #prefix>
                  <el-icon><Picture /></el-icon>
                </template>
              </el-input>
              <div class="captcha-image" @click="refreshCaptcha">
                <img :src="captchaUrl" alt="验证码" />
                <div class="refresh-tip">点击刷新</div>
              </div>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              :disabled="authStore.isLocked"
              @click="handleLogin"
              class="login-btn"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-footer">
          <div class="tips">
            <el-icon><Warning /></el-icon>
            <span>首次登录密码为身份证号后8位，登录后请及时修改密码</span>
          </div>
          <div class="fail-count" v-if="authStore.loginFailCount > 0">
            <span>登录失败 {{ authStore.loginFailCount }} 次，还有 {{ 5 - authStore.loginFailCount }} 次机会</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="bg-circle circle-1"></div>
      <div class="bg-circle circle-2"></div>
      <div class="bg-circle circle-3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { getCaptcha } from '@/api/auth'
import type { LoginForm } from '@/types/auth'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const showCaptcha = ref(false)
const captchaUrl = ref('')
let lockTimer: NodeJS.Timeout | null = null

const loginForm = ref<LoginForm>({
  username: '',
  password: '',
  captcha: ''
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入学号', trigger: 'blur' },
    { min: 8, max: 20, message: '学号长度在8到20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  captcha: [
    { required: showCaptcha.value, message: '请输入验证码', trigger: 'blur' }
  ]
}

// 锁定时间倒计时
const lockTimeLeft = computed(() => {
  if (!authStore.isLocked) return ''
  
  const timeLeft = Math.ceil((authStore.lockoutTime - Date.now()) / 1000 / 60)
  return `${timeLeft}分钟`
})

// 处理登录
const handleLogin = async () => {
  if (!formRef.value || authStore.isLocked) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    await authStore.loginUser(loginForm.value)
    
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error: any) {
    ElMessage.error(error.message || '登录失败')
    
    // 登录失败后显示验证码
    showCaptcha.value = true
    await refreshCaptcha()
    
    // 清空密码和验证码
    loginForm.value.password = ''
    loginForm.value.captcha = ''
  } finally {
    loading.value = false
  }
}

// 刷新验证码
const refreshCaptcha = async () => {
  try {
    const response = await getCaptcha()
    captchaUrl.value = response.data.captchaUrl
  } catch (error) {
    console.error('获取验证码失败:', error)
  }
}

// 启动锁定倒计时
const startLockTimer = () => {
  if (lockTimer) {
    clearInterval(lockTimer)
  }
  
  if (authStore.isLocked) {
    lockTimer = setInterval(() => {
      if (!authStore.isLocked) {
        clearInterval(lockTimer!)
        lockTimer = null
      }
    }, 1000)
  }
}

onMounted(() => {
  // 如果已经登录，直接跳转到首页
  if (authStore.isAuthenticated) {
    router.push('/')
    return
  }
  
  // 启动锁定倒计时
  startLockTimer()
  
  // 如果有登录失败记录，显示验证码
  if (authStore.loginFailCount > 0) {
    showCaptcha.value = true
    refreshCaptcha()
  }
})

onUnmounted(() => {
  if (lockTimer) {
    clearInterval(lockTimer)
  }
})
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-wrapper {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  z-index: 2;
}

.login-box {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.lock-alert {
  margin-bottom: 20px;
}

.login-form {
  margin-bottom: 20px;
}

.login-form .el-form-item {
  margin-bottom: 24px;
}

.captcha-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.captcha-wrapper .el-input {
  flex: 1;
}

.captcha-image {
  width: 100px;
  height: 40px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.captcha-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.refresh-tip {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 10px;
  text-align: center;
  padding: 2px;
  transform: translateY(100%);
  transition: transform 0.3s;
}

.captcha-image:hover .refresh-tip {
  transform: translateY(0);
}

.login-btn {
  width: 100%;
}

.login-footer {
  text-align: center;
}

.tips {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  color: #f59e0b;
  margin-bottom: 8px;
}

.fail-count {
  font-size: 12px;
  color: #ef4444;
}

.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.circle-2 {
  width: 150px;
  height: 150px;
  top: 70%;
  right: 10%;
  animation-delay: 2s;
}

.circle-3 {
  width: 100px;
  height: 100px;
  top: 30%;
  right: 30%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

@media (max-width: 768px) {
  .login-wrapper {
    padding: 20px;
  }
  
  .login-box {
    padding: 30px 20px;
  }
}
</style>
