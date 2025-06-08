<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <div class="error-icon">
        <el-icon :size="80" color="#f56c6c">
          <CircleCloseFilled />
        </el-icon>
      </div>
      
      <h2 class="error-title">出现了一些问题</h2>
      <p class="error-description">
        {{ errorMessage || '应用程序遇到了意外错误，请刷新页面重试。' }}
      </p>
      
      <div class="error-actions">
        <el-button type="primary" @click="refresh">
          <el-icon><Refresh /></el-icon>
          刷新页面
        </el-button>
        <el-button @click="goHome">
          <el-icon><House /></el-icon>
          返回首页
        </el-button>
        <el-button 
          v-if="showDetails" 
          type="info" 
          @click="toggleDetails"
        >
          {{ showErrorDetails ? '隐藏' : '显示' }}错误详情
        </el-button>
      </div>
      
      <el-collapse v-if="showDetails && showErrorDetails" class="error-details">
        <el-collapse-item title="错误详情" name="details">
          <pre class="error-stack">{{ errorStack }}</pre>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'
import { CircleCloseFilled, Refresh, House } from '@element-plus/icons-vue'

const router = useRouter()

const hasError = ref(false)
const errorMessage = ref('')
const errorStack = ref('')
const showDetails = ref(false)
const showErrorDetails = ref(false)

// 捕获子组件错误
onErrorCaptured((error: Error) => {
  hasError.value = true
  errorMessage.value = error.message
  errorStack.value = error.stack || ''
  showDetails.value = process.env.NODE_ENV === 'development'
  
  // 发送错误报告到服务器
  reportError(error)
  
  return false // 阻止错误向上传播
})

// 刷新页面
const refresh = () => {
  window.location.reload()
}

// 返回首页
const goHome = () => {
  hasError.value = false
  router.push('/dashboard')
}

// 切换错误详情显示
const toggleDetails = () => {
  showErrorDetails.value = !showErrorDetails.value
}

// 错误报告
const reportError = async (error: Error) => {
  try {
    // 这里可以调用API发送错误报告
    console.error('Error captured:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  } catch (reportError) {
    console.error('Failed to report error:', reportError)
  }
}

// 重置错误状态
const resetError = () => {
  hasError.value = false
  errorMessage.value = ''
  errorStack.value = ''
  showErrorDetails.value = false
}

defineExpose({
  resetError
})
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px 20px;
}

.error-content {
  text-align: center;
  max-width: 600px;
}

.error-icon {
  margin-bottom: 24px;
}

.error-title {
  font-size: 28px;
  color: #303133;
  margin: 0 0 16px 0;
  font-weight: 600;
}

.error-description {
  font-size: 16px;
  color: #606266;
  margin: 0 0 32px 0;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.error-details {
  text-align: left;
  margin-top: 24px;
}

.error-stack {
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 16px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  color: #606266;
  white-space: pre-wrap;
  overflow-x: auto;
  max-height: 300px;
}

@media (max-width: 768px) {
  .error-actions {
    flex-direction: column;
  }
  
  .error-actions .el-button {
    width: 100%;
  }
}
</style>
