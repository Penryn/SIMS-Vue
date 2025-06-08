<template>
  <div class="password-strength">
    <div class="strength-meter">
      <div class="strength-bar">
        <div 
          class="strength-fill" 
          :style="{ 
            width: `${result.score}%`, 
            backgroundColor: strengthColor 
          }"
        ></div>
      </div>
      <div class="strength-text" :style="{ color: strengthColor }">
        密码强度: {{ strengthText }} ({{ result.score }}/100)
      </div>
    </div>

    <div v-if="result.messages.length > 0" class="validation-messages">
      <div class="message error" v-for="message in result.messages" :key="message">
        <el-icon><WarningFilled /></el-icon>
        {{ message }}
      </div>
    </div>

    <div v-if="result.suggestions.length > 0 && showSuggestions" class="validation-suggestions">
      <div class="suggestion-title">改进建议:</div>
      <div class="suggestion" v-for="suggestion in result.suggestions" :key="suggestion">
        <el-icon><InfoFilled /></el-icon>
        {{ suggestion }}
      </div>
    </div>

    <div v-if="showRequirements" class="password-requirements">
      <div class="requirement-title">密码要求:</div>
      <div class="requirements-list">
        <div 
          class="requirement" 
          :class="{ valid: checkRequirement('length') }"
        >
          <el-icon>
            <CircleCheckFilled v-if="checkRequirement('length')" />
            <CircleCloseFilled v-else />
          </el-icon>
          长度 {{ config.minLength }}-{{ config.maxLength }} 位
        </div>
        
        <div 
          v-if="config.requireUppercase"
          class="requirement" 
          :class="{ valid: checkRequirement('uppercase') }"
        >
          <el-icon>
            <CircleCheckFilled v-if="checkRequirement('uppercase')" />
            <CircleCloseFilled v-else />
          </el-icon>
          包含大写字母 (A-Z)
        </div>
        
        <div 
          v-if="config.requireLowercase"
          class="requirement" 
          :class="{ valid: checkRequirement('lowercase') }"
        >
          <el-icon>
            <CircleCheckFilled v-if="checkRequirement('lowercase')" />
            <CircleCloseFilled v-else />
          </el-icon>
          包含小写字母 (a-z)
        </div>
        
        <div 
          v-if="config.requireNumber"
          class="requirement" 
          :class="{ valid: checkRequirement('number') }"
        >
          <el-icon>
            <CircleCheckFilled v-if="checkRequirement('number')" />
            <CircleCloseFilled v-else />
          </el-icon>
          包含数字 (0-9)
        </div>
        
        <div 
          v-if="config.requireSpecial"
          class="requirement" 
          :class="{ valid: checkRequirement('special') }"
        >
          <el-icon>
            <CircleCheckFilled v-if="checkRequirement('special')" />
            <CircleCloseFilled v-else />
          </el-icon>
          包含特殊字符 (!@#$%^&*)
        </div>
      </div>
    </div>

    <div v-if="showGenerator" class="password-generator">
      <el-button 
        type="primary" 
        size="small" 
        @click="generatePassword"
      >
        <el-icon><Refresh /></el-icon>
        生成强密码
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { 
  validatePassword, 
  generateRandomPassword,
  getPasswordStrengthText,
  getPasswordStrengthColor,
  defaultPasswordConfig,
  type PasswordConfig,
  type PasswordValidationResult
} from '@/utils/password'
import { 
  WarningFilled, 
  InfoFilled, 
  CircleCheckFilled, 
  CircleCloseFilled,
  Refresh
} from '@element-plus/icons-vue'

interface Props {
  password: string
  config?: Partial<PasswordConfig>
  showSuggestions?: boolean
  showRequirements?: boolean
  showGenerator?: boolean
}

interface Emits {
  (e: 'password-generated', password: string): void
  (e: 'validation-change', result: PasswordValidationResult): void
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
  showSuggestions: true,
  showRequirements: true,
  showGenerator: false
})

const emit = defineEmits<Emits>()

// 合并配置
const config = computed(() => ({
  ...defaultPasswordConfig,
  ...props.config
}))

// 验证结果
const result = computed(() => {
  return validatePassword(props.password, config.value)
})

// 强度文本和颜色
const strengthText = computed(() => getPasswordStrengthText(result.value.strength))
const strengthColor = computed(() => getPasswordStrengthColor(result.value.strength))

// 检查单个要求
const checkRequirement = (type: string): boolean => {
  const password = props.password
  
  switch (type) {
    case 'length':
      return password.length >= config.value.minLength && password.length <= config.value.maxLength
    case 'uppercase':
      return /[A-Z]/.test(password)
    case 'lowercase':
      return /[a-z]/.test(password)
    case 'number':
      return /\d/.test(password)
    case 'special':
      return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    default:
      return false
  }
}

// 生成密码
const generatePassword = () => {
  const newPassword = generateRandomPassword(config.value.minLength + 4, config.value)
  emit('password-generated', newPassword)
}

// 监听验证结果变化
watch(result, (newResult) => {
  emit('validation-change', newResult)
}, { immediate: true })
</script>

<style scoped>
.password-strength {
  margin-top: 8px;
}

.strength-meter {
  margin-bottom: 12px;
}

.strength-bar {
  width: 100%;
  height: 6px;
  background-color: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.strength-fill {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
  border-radius: 3px;
}

.strength-text {
  font-size: 12px;
  font-weight: 500;
  transition: color 0.3s ease;
}

.validation-messages {
  margin-bottom: 12px;
}

.message {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  margin-bottom: 4px;
}

.message.error {
  color: #f56c6c;
}

.validation-suggestions {
  margin-bottom: 12px;
}

.suggestion-title {
  font-size: 12px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 4px;
}

.suggestion {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

.password-requirements {
  margin-bottom: 12px;
}

.requirement-title {
  font-size: 12px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 6px;
}

.requirements-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.requirement {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #909399;
  transition: color 0.3s ease;
}

.requirement.valid {
  color: #67c23a;
}

.requirement .el-icon {
  font-size: 14px;
}

.password-generator {
  text-align: center;
}

.password-generator .el-button {
  font-size: 12px;
}
</style>
