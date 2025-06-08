<template>
  <div class="not-found">
    <div class="not-found-content">
      <div class="not-found-icon">
        <el-icon :size="120" color="#e6a23c">
          <WarnTriangleFilled />
        </el-icon>
      </div>
      
      <h1 class="not-found-title">404</h1>
      <h2 class="not-found-subtitle">页面不存在</h2>
      <p class="not-found-description">
        抱歉，您访问的页面不存在或已被删除。
      </p>
      
      <div class="not-found-actions">
        <el-button type="primary" @click="goHome">
          <el-icon><House /></el-icon>
          返回首页
        </el-button>
        <el-button @click="goBack">
          <el-icon><Back /></el-icon>
          返回上页
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { WarnTriangleFilled, House, Back } from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/dashboard')
}

const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.not-found-content {
  text-align: center;
  color: white;
  max-width: 500px;
  padding: 40px;
}

.not-found-icon {
  margin-bottom: 30px;
}

.not-found-title {
  font-size: 120px;
  font-weight: bold;
  margin: 0 0 20px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.not-found-subtitle {
  font-size: 36px;
  font-weight: 500;
  margin: 0 0 20px 0;
}

.not-found-description {
  font-size: 18px;
  margin: 0 0 40px 0;
  opacity: 0.9;
  line-height: 1.5;
}

.not-found-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.not-found-actions .el-button {
  padding: 12px 24px;
  font-size: 16px;
}

@media (max-width: 768px) {
  .not-found-content {
    padding: 20px;
  }
  
  .not-found-title {
    font-size: 80px;
  }
  
  .not-found-subtitle {
    font-size: 24px;
  }
  
  .not-found-description {
    font-size: 16px;
  }
  
  .not-found-actions {
    flex-direction: column;
  }
  
  .not-found-actions .el-button {
    width: 100%;
  }
}
</style>
