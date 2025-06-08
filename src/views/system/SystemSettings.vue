<template>
  <div class="system-settings">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>系统设置</h2>
          <p>管理系统的基本配置和安全设置</p>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="settings-tabs">
        <!-- 基本设置 -->
        <el-tab-pane label="基本设置" name="basic">
          <el-form
            :model="basicSettings"
            :rules="basicRules"
            ref="basicFormRef"
            label-width="120px"
            class="settings-form"
          >
            <el-form-item label="系统名称" prop="systemName">
              <el-input 
                v-model="basicSettings.systemName"
                placeholder="请输入系统名称"
                maxlength="50"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="系统版本" prop="systemVersion">
              <el-input 
                v-model="basicSettings.systemVersion"
                placeholder="请输入系统版本"
                readonly
              />
            </el-form-item>

            <el-form-item label="系统描述" prop="systemDescription">
              <el-input 
                type="textarea"
                v-model="basicSettings.systemDescription"
                placeholder="请输入系统描述"
                :rows="3"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="维护状态">
              <el-switch
                v-model="basicSettings.maintenanceMode"
                active-text="维护中"
                inactive-text="正常运行"
              />
              <div class="form-tip">开启后，除管理员外其他用户无法访问系统</div>
            </el-form-item>

            <el-form-item label="维护公告" v-if="basicSettings.maintenanceMode">
              <el-input 
                type="textarea"
                v-model="basicSettings.maintenanceNotice"
                placeholder="请输入维护公告"
                :rows="3"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="saveBasicSettings" :loading="loading">
                保存设置
              </el-button>
              <el-button @click="resetBasicSettings">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 安全设置 -->
        <el-tab-pane label="安全设置" name="security">
          <el-form
            :model="securitySettings"
            :rules="securityRules"
            ref="securityFormRef"
            label-width="160px"
            class="settings-form"
          >
            <el-form-item label="密码最小长度" prop="passwordMinLength">
              <el-input-number
                v-model="securitySettings.passwordMinLength"
                :min="6"
                :max="20"
                controls-position="right"
              />
              <div class="form-tip">密码最小长度，建议8位以上</div>
            </el-form-item>

            <el-form-item label="密码复杂度要求">
              <el-checkbox-group v-model="securitySettings.passwordComplexity">
                <el-checkbox label="uppercase">必须包含大写字母</el-checkbox>
                <el-checkbox label="lowercase">必须包含小写字母</el-checkbox>
                <el-checkbox label="number">必须包含数字</el-checkbox>
                <el-checkbox label="special">必须包含特殊字符</el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item label="密码有效期（天）" prop="passwordExpireDays">
              <el-input-number
                v-model="securitySettings.passwordExpireDays"
                :min="30"
                :max="365"
                controls-position="right"
              />
              <div class="form-tip">密码过期时间，0表示永不过期</div>
            </el-form-item>

            <el-form-item label="登录失败锁定阈值" prop="loginFailThreshold">
              <el-input-number
                v-model="securitySettings.loginFailThreshold"
                :min="3"
                :max="10"
                controls-position="right"
              />
              <div class="form-tip">连续登录失败多少次后锁定账户</div>
            </el-form-item>

            <el-form-item label="账户锁定时长（分钟）" prop="lockoutDuration">
              <el-input-number
                v-model="securitySettings.lockoutDuration"
                :min="5"
                :max="1440"
                controls-position="right"
              />
              <div class="form-tip">账户被锁定的时长</div>
            </el-form-item>

            <el-form-item label="会话超时时间（分钟）" prop="sessionTimeout">
              <el-input-number
                v-model="securitySettings.sessionTimeout"
                :min="10"
                :max="480"
                controls-position="right"
              />
              <div class="form-tip">用户无操作多长时间后自动退出</div>
            </el-form-item>

            <el-form-item label="启用验证码">
              <el-switch
                v-model="securitySettings.enableCaptcha"
                active-text="开启"
                inactive-text="关闭"
              />
              <div class="form-tip">登录时是否需要输入验证码</div>
            </el-form-item>

            <el-form-item label="IP白名单模式">
              <el-switch
                v-model="securitySettings.enableIpWhitelist"
                active-text="开启"
                inactive-text="关闭"
              />
              <div class="form-tip">开启后只有白名单IP可以访问系统</div>
            </el-form-item>

            <el-form-item label="IP白名单" v-if="securitySettings.enableIpWhitelist">
              <el-input 
                type="textarea"
                v-model="securitySettings.ipWhitelist"
                placeholder="每行一个IP地址或IP段，例如：192.168.1.1 或 192.168.1.0/24"
                :rows="5"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="saveSecuritySettings" :loading="loading">
                保存设置
              </el-button>
              <el-button @click="resetSecuritySettings">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 日志设置 -->
        <el-tab-pane label="日志设置" name="logging">
          <el-form
            :model="loggingSettings"
            ref="loggingFormRef"
            label-width="140px"
            class="settings-form"
          >
            <el-form-item label="日志级别">
              <el-select v-model="loggingSettings.logLevel" placeholder="请选择日志级别">
                <el-option label="错误 (ERROR)" value="ERROR" />
                <el-option label="警告 (WARN)" value="WARN" />
                <el-option label="信息 (INFO)" value="INFO" />
                <el-option label="调试 (DEBUG)" value="DEBUG" />
              </el-select>
              <div class="form-tip">设置系统记录日志的详细程度</div>
            </el-form-item>

            <el-form-item label="日志保留天数">
              <el-input-number
                v-model="loggingSettings.logRetentionDays"
                :min="7"
                :max="365"
                controls-position="right"
              />
              <div class="form-tip">日志文件保留的天数，超过后自动删除</div>
            </el-form-item>

            <el-form-item label="启用审计日志">
              <el-switch
                v-model="loggingSettings.enableAuditLog"
                active-text="开启"
                inactive-text="关闭"
              />
              <div class="form-tip">记录用户的所有操作行为</div>
            </el-form-item>

            <el-form-item label="启用登录日志">
              <el-switch
                v-model="loggingSettings.enableLoginLog"
                active-text="开启"
                inactive-text="关闭"
              />
              <div class="form-tip">记录用户登录登出信息</div>
            </el-form-item>

            <el-form-item label="启用性能日志">
              <el-switch
                v-model="loggingSettings.enablePerformanceLog"
                active-text="开启"
                inactive-text="关闭"
              />
              <div class="form-tip">记录系统性能指标</div>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="saveLoggingSettings" :loading="loading">
                保存设置
              </el-button>
              <el-button @click="resetLoggingSettings">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 备份设置 -->
        <el-tab-pane label="备份设置" name="backup">
          <div class="backup-section">
            <el-form
              :model="backupSettings"
              ref="backupFormRef"
              label-width="140px"
              class="settings-form"
            >
              <el-form-item label="自动备份">
                <el-switch
                  v-model="backupSettings.enableAutoBackup"
                  active-text="开启"
                  inactive-text="关闭"
                />
                <div class="form-tip">开启后系统将定期自动备份数据</div>
              </el-form-item>

              <el-form-item label="备份频率" v-if="backupSettings.enableAutoBackup">
                <el-select v-model="backupSettings.backupFrequency" placeholder="请选择备份频率">
                  <el-option label="每天" value="daily" />
                  <el-option label="每周" value="weekly" />
                  <el-option label="每月" value="monthly" />
                </el-select>
              </el-form-item>

              <el-form-item label="备份时间" v-if="backupSettings.enableAutoBackup">
                <el-time-picker
                  v-model="backupSettings.backupTime"
                  format="HH:mm"
                  placeholder="选择备份时间"
                />
              </el-form-item>

              <el-form-item label="备份保留数量">
                <el-input-number
                  v-model="backupSettings.backupRetentionCount"
                  :min="1"
                  :max="30"
                  controls-position="right"
                />
                <div class="form-tip">最多保留多少个备份文件</div>
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="saveBackupSettings" :loading="loading">
                  保存设置
                </el-button>
                <el-button @click="resetBackupSettings">重置</el-button>
              </el-form-item>
            </el-form>

            <el-divider />

            <div class="backup-actions">
              <h3>备份操作</h3>
              <div class="action-buttons">
                <el-button type="success" @click="createBackup" :loading="backupLoading">
                  <el-icon><Download /></el-icon>
                  立即备份
                </el-button>
                <el-button type="warning" @click="showRestoreDialog = true">
                  <el-icon><Upload /></el-icon>
                  恢复备份
                </el-button>
                <el-button type="info" @click="downloadBackup">
                  <el-icon><FolderOpened /></el-icon>
                  下载备份
                </el-button>
              </div>
            </div>

            <div class="backup-list">
              <h3>备份历史</h3>
              <el-table :data="backupHistory" stripe>
                <el-table-column prop="filename" label="文件名" />
                <el-table-column prop="size" label="大小" />
                <el-table-column prop="createTime" label="创建时间" />
                <el-table-column label="操作" width="200">
                  <template #default="{ row }">
                    <el-button size="small" @click="downloadBackupFile(row)">
                      下载
                    </el-button>
                    <el-button size="small" type="danger" @click="deleteBackup(row)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 恢复备份对话框 -->
    <el-dialog
      v-model="showRestoreDialog"
      title="恢复备份"
      width="500px"
      :before-close="handleRestoreClose"
    >
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :limit="1"
        accept=".sql,.zip"
        drag
      >
        <el-icon class="el-icon--upload"><Upload /></el-icon>
        <div class="el-upload__text">
          将备份文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            只能上传.sql或.zip格式的备份文件
          </div>
        </template>
      </el-upload>

      <template #footer>
        <el-button @click="showRestoreDialog = false">取消</el-button>
        <el-button type="primary" @click="restoreBackup" :loading="restoreLoading">
          确定恢复
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Upload, FolderOpened } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'

const activeTab = ref('basic')
const loading = ref(false)
const backupLoading = ref(false)
const restoreLoading = ref(false)
const showRestoreDialog = ref(false)

// 表单引用
const basicFormRef = ref<FormInstance>()
const securityFormRef = ref<FormInstance>()
const loggingFormRef = ref<FormInstance>()
const backupFormRef = ref<FormInstance>()

// 基本设置
const basicSettings = reactive({
  systemName: '学籍信息管理系统',
  systemVersion: '1.0.0',
  systemDescription: '面向高等学校的学籍信息管理系统，支持学生信息管理、导师管理、学院管理等功能。',
  maintenanceMode: false,
  maintenanceNotice: ''
})

// 安全设置
const securitySettings = reactive({
  passwordMinLength: 8,
  passwordComplexity: ['uppercase', 'lowercase', 'number', 'special'],
  passwordExpireDays: 90,
  loginFailThreshold: 5,
  lockoutDuration: 30,
  sessionTimeout: 30,
  enableCaptcha: true,
  enableIpWhitelist: false,
  ipWhitelist: ''
})

// 日志设置
const loggingSettings = reactive({
  logLevel: 'INFO',
  logRetentionDays: 30,
  enableAuditLog: true,
  enableLoginLog: true,
  enablePerformanceLog: false
})

// 备份设置
const backupSettings = reactive({
  enableAutoBackup: true,
  backupFrequency: 'daily',
  backupTime: new Date(),
  backupRetentionCount: 7
})

// 备份历史
const backupHistory = ref([
  {
    id: 1,
    filename: 'backup_20250609_120000.sql',
    size: '2.5MB',
    createTime: '2025-06-09 12:00:00'
  }
])

// 表单验证规则
const basicRules: FormRules = {
  systemName: [
    { required: true, message: '请输入系统名称', trigger: 'blur' }
  ],
  systemVersion: [
    { required: true, message: '请输入系统版本', trigger: 'blur' }
  ]
}

const securityRules: FormRules = {
  passwordMinLength: [
    { required: true, message: '请设置密码最小长度', trigger: 'blur' }
  ],
  loginFailThreshold: [
    { required: true, message: '请设置登录失败锁定阈值', trigger: 'blur' }
  ]
}

// 保存基本设置
const saveBasicSettings = async () => {
  if (!basicFormRef.value) return
  
  try {
    await basicFormRef.value.validate()
    loading.value = true
    
    // 调用API保存设置
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟API调用
    
    ElMessage.success('基本设置保存成功')
  } catch (error) {
    console.error('保存基本设置失败:', error)
    ElMessage.error('保存设置失败')
  } finally {
    loading.value = false
  }
}

// 保存安全设置
const saveSecuritySettings = async () => {
  if (!securityFormRef.value) return
  
  try {
    await securityFormRef.value.validate()
    loading.value = true
    
    // 调用API保存设置
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟API调用
    
    ElMessage.success('安全设置保存成功')
  } catch (error) {
    console.error('保存安全设置失败:', error)
    ElMessage.error('保存设置失败')
  } finally {
    loading.value = false
  }
}

// 保存日志设置
const saveLoggingSettings = async () => {
  try {
    loading.value = true
    
    // 调用API保存设置
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟API调用
    
    ElMessage.success('日志设置保存成功')
  } catch (error) {
    console.error('保存日志设置失败:', error)
    ElMessage.error('保存设置失败')
  } finally {
    loading.value = false
  }
}

// 保存备份设置
const saveBackupSettings = async () => {
  try {
    loading.value = true
    
    // 调用API保存设置
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟API调用
    
    ElMessage.success('备份设置保存成功')
  } catch (error) {
    console.error('保存备份设置失败:', error)
    ElMessage.error('保存设置失败')
  } finally {
    loading.value = false
  }
}

// 重置设置
const resetBasicSettings = () => {
  basicFormRef.value?.resetFields()
}

const resetSecuritySettings = () => {
  securityFormRef.value?.resetFields()
}

const resetLoggingSettings = () => {
  loggingFormRef.value?.resetFields()
}

const resetBackupSettings = () => {
  backupFormRef.value?.resetFields()
}

// 创建备份
const createBackup = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要立即创建数据备份吗？',
      '确认备份',
      { type: 'warning' }
    )
    
    backupLoading.value = true
    
    // 调用API创建备份
    await new Promise(resolve => setTimeout(resolve, 3000)) // 模拟备份过程
    
    ElMessage.success('数据备份创建成功')
    // 刷新备份历史
  } catch (error) {
    if (error !== 'cancel') {
      console.error('创建备份失败:', error)
      ElMessage.error('创建备份失败')
    }
  } finally {
    backupLoading.value = false
  }
}

// 恢复备份
const restoreBackup = async () => {
  try {
    await ElMessageBox.confirm(
      '恢复备份将覆盖当前数据，此操作不可逆，确定要继续吗？',
      '警告',
      { type: 'warning' }
    )
    
    restoreLoading.value = true
    
    // 调用API恢复备份
    await new Promise(resolve => setTimeout(resolve, 5000)) // 模拟恢复过程
    
    ElMessage.success('备份恢复成功')
    showRestoreDialog.value = false
  } catch (error) {
    if (error !== 'cancel') {
      console.error('恢复备份失败:', error)
      ElMessage.error('恢复备份失败')
    }
  } finally {
    restoreLoading.value = false
  }
}

// 下载备份
const downloadBackup = () => {
  // 实现下载备份逻辑
  ElMessage.info('正在准备下载...')
}

// 下载备份文件
const downloadBackupFile = (backup: any) => {
  // 实现下载指定备份文件逻辑
  ElMessage.info(`正在下载 ${backup.filename}...`)
}

// 删除备份
const deleteBackup = async (backup: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除备份文件 ${backup.filename} 吗？`,
      '确认删除',
      { type: 'warning' }
    )
    
    // 调用API删除备份
    ElMessage.success('备份文件删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除备份失败:', error)
      ElMessage.error('删除备份失败')
    }
  }
}

// 关闭恢复对话框
const handleRestoreClose = () => {
  showRestoreDialog.value = false
}

// 加载设置
const loadSettings = async () => {
  try {
    // 调用API加载设置
    console.log('加载系统设置')
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.system-settings {
  max-width: 1200px;
  margin: 0 auto;
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

.settings-tabs {
  margin-top: 20px;
}

.settings-form {
  max-width: 800px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.backup-section {
  max-width: 800px;
}

.backup-actions {
  margin: 20px 0;
}

.backup-actions h3 {
  margin: 0 0 16px 0;
  color: #303133;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.backup-list {
  margin-top: 32px;
}

.backup-list h3 {
  margin: 0 0 16px 0;
  color: #303133;
}

@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
}
</style>
