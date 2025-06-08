<template>
  <el-dialog
    v-model="dialogVisible"
    :title="forceChange ? '首次登录需要修改密码' : '修改密码'"
    :close-on-click-modal="!forceChange"
    :close-on-press-escape="!forceChange"
    :show-close="!forceChange"
    width="450px"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="原密码" prop="oldPassword" v-if="!forceChange">
        <el-input
          v-model="form.oldPassword"
          type="password"
          show-password
          placeholder="请输入原密码"
          autocomplete="current-password"
        />
      </el-form-item>
      
      <el-form-item label="新密码" prop="newPassword">
        <el-input
          v-model="form.newPassword"
          type="password"
          show-password
          placeholder="请输入新密码"
          autocomplete="new-password"
        />
        <div class="password-tips">
          <p>密码要求：</p>
          <ul>
            <li :class="{ valid: hasMinLength }">至少8位字符</li>
            <li :class="{ valid: hasNumber }">包含数字</li>
            <li :class="{ valid: hasLowercase }">包含小写字母</li>
            <li :class="{ valid: hasUppercase }">包含大写字母</li>
            <li :class="{ valid: hasSpecialChar }">包含特殊字符</li>
          </ul>
        </div>
      </el-form-item>
      
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
          v-model="form.confirmPassword"
          type="password"
          show-password
          placeholder="请再次输入新密码"
          autocomplete="new-password"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel" v-if="!forceChange">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { changePassword } from '@/api/auth'
import { validatePassword } from '@/utils/password'
import type { ChangePasswordForm } from '@/types/auth'

interface Props {
  modelValue: boolean
  forceChange?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  forceChange: false
})

const emit = defineEmits<Emits>()

const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = ref<ChangePasswordForm>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 密码强度检查
const hasMinLength = computed(() => form.value.newPassword.length >= 8)
const hasNumber = computed(() => /\d/.test(form.value.newPassword))
const hasLowercase = computed(() => /[a-z]/.test(form.value.newPassword))
const hasUppercase = computed(() => /[A-Z]/.test(form.value.newPassword))
const hasSpecialChar = computed(() => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.value.newPassword))

// 表单验证规则
const rules = {
  oldPassword: [
    { required: !props.forceChange, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: Function) => {
        const validation = validatePassword(value)
        if (!validation.valid) {
          callback(new Error(validation.message))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: Function) => {
        if (value !== form.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    await changePassword(form.value)
    
    ElMessage.success('密码修改成功')
    authStore.setPasswordChanged()
    
    // 重置表单
    resetForm()
    dialogVisible.value = false
    
    // 如果是强制修改密码，修改成功后刷新页面
    if (props.forceChange) {
      location.reload()
    }
  } catch (error) {
    console.error('修改密码失败:', error)
  } finally {
    loading.value = false
  }
}

// 取消操作
const handleCancel = () => {
  if (props.forceChange) {
    ElMessage.warning('首次登录必须修改密码')
    return
  }
  
  resetForm()
  dialogVisible.value = false
}

// 重置表单
const resetForm = () => {
  form.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  formRef.value?.clearValidate()
}

// 监听对话框显示状态
watch(dialogVisible, (visible) => {
  if (visible) {
    resetForm()
  }
})
</script>

<style scoped>
.password-tips {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.password-tips p {
  margin: 0 0 4px 0;
  font-weight: 500;
}

.password-tips ul {
  margin: 0;
  padding-left: 16px;
}

.password-tips li {
  margin: 2px 0;
  color: #999;
}

.password-tips li.valid {
  color: #52c41a;
}

.dialog-footer {
  text-align: right;
}
</style>
