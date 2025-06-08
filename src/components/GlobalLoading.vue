<template>
  <div class="global-loading" v-if="loading">
    <div class="loading-content">
      <el-icon class="loading-icon" :size="40">
        <Loading />
      </el-icon>
      <p class="loading-text">{{ loadingText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Loading } from '@element-plus/icons-vue'

const loading = ref(false)
const loadingText = ref('加载中...')

const show = (text?: string) => {
  loading.value = true
  loadingText.value = text || '加载中...'
}

const hide = () => {
  loading.value = false
}

defineExpose({
  show,
  hide
})
</script>

<style scoped>
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  color: #409eff;
}

.loading-icon {
  animation: spin 2s linear infinite;
  margin-bottom: 16px;
}

.loading-text {
  font-size: 16px;
  margin: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
