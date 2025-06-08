<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span>个人信息</span>
          <el-button type="primary" @click="editMode = !editMode">
            {{ editMode ? '取消编辑' : '编辑信息' }}
          </el-button>
        </div>
      </template>

      <div class="profile-content">
        <!-- 头像部分 -->
        <div class="avatar-section">
          <el-avatar :size="120" :src="profile?.avatar" fit="cover">
            {{ profile?.name?.charAt(0) }}
          </el-avatar>
          <div v-if="editMode" class="avatar-upload">
            <el-upload
              :action="uploadUrl"
              :headers="uploadHeaders"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :before-upload="beforeAvatarUpload"
            >
              <el-button type="text">更换头像</el-button>
            </el-upload>
          </div>
        </div>

        <!-- 基础信息 -->
        <div class="info-section">
          <el-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-width="120px"
            :disabled="!editMode"
          >
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="学号">
                  <el-input v-model="profile?.studentId" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="姓名">
                  <el-input v-model="profile?.name" disabled />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="性别">
                  <el-input v-model="profile?.gender" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="身份证号">
                  <el-input v-model="maskedIdNumber" disabled />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="学院">
                  <el-input v-model="profile?.college?.name" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="专业">
                  <el-input v-model="profile?.major?.name" disabled />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="学位类型">
                  <el-input v-model="profile?.degreeType" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="导师">
                  <el-input v-model="profile?.supervisor?.name" disabled />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="入学日期">
                  <el-input v-model="profile?.enrollmentDate" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="预计毕业日期">
                  <el-date-picker
                    v-model="formData.expectedGraduationDate"
                    type="date"
                    placeholder="选择预计毕业日期"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">联系信息</el-divider>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="formData.email" placeholder="请输入邮箱" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="手机号" prop="phone">
                  <el-input v-model="formData.phone" placeholder="请输入手机号" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="家庭住址" prop="address">
              <el-input
                v-model="formData.address"
                type="textarea"
                :rows="2"
                placeholder="请输入家庭住址"
              />
            </el-form-item>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="紧急联系人" prop="emergencyContact">
                  <el-input v-model="formData.emergencyContact" placeholder="请输入紧急联系人" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="紧急联系电话" prop="emergencyPhone">
                  <el-input v-model="formData.emergencyPhone" placeholder="请输入紧急联系电话" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">教育经历</el-divider>

            <el-form-item label="本科教育背景" prop="previousEducation">
              <el-input
                v-model="formData.previousEducation"
                type="textarea"
                :rows="3"
                placeholder="请输入本科教育背景"
              />
            </el-form-item>

            <el-form-item label="工作经历" prop="workExperience">
              <el-input
                v-model="formData.workExperience"
                type="textarea"
                :rows="3"
                placeholder="请输入工作经历"
              />
            </el-form-item>

            <el-form-item label="研究方向" prop="researchDirection">
              <el-input
                v-model="formData.researchDirection"
                type="textarea"
                :rows="3"
                placeholder="请输入研究方向"
              />
            </el-form-item>

            <div v-if="editMode" class="form-actions">
              <el-button type="primary" @click="handleSubmit" :loading="loading">
                保存
              </el-button>
              <el-button @click="handleReset">重置</el-button>
            </div>
          </el-form>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getMyProfile, updateMyProfile, uploadStudentPhoto } from '@/api/student'
import type { StudentProfile, StudentUpdateForm } from '@/types/student'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const editMode = ref(false)
const loading = ref(false)
const profile = ref<StudentProfile | null>(null)

// 表单数据
const formData = ref<StudentUpdateForm>({
  email: '',
  phone: '',
  address: '',
  emergencyContact: '',
  emergencyPhone: '',
  previousEducation: '',
  workExperience: '',
  researchDirection: ''
})

// 上传相关
const uploadUrl = computed(() => `${import.meta.env.VITE_API_BASE_URL}/student-profile/upload-avatar`)
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${authStore.token}`
}))

// 脱敏身份证号
const maskedIdNumber = computed(() => {
  if (!profile.value?.idNumber) return ''
  const idNumber = profile.value.idNumber
  return idNumber.substring(0, 6) + '********' + idNumber.substring(14)
})

// 表单验证规则
const rules = {
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

// 获取个人信息
const fetchProfile = async () => {
  try {
    const response = await getMyProfile()
    profile.value = response.data
    
    // 初始化表单数据
    Object.assign(formData.value, {
      email: profile.value.user?.email || '',
      phone: profile.value.user?.phone || '',
      address: profile.value.address || '',
      emergencyContact: profile.value.emergencyContact || '',
      emergencyPhone: profile.value.emergencyPhone || '',
      expectedGraduationDate: profile.value.expectedGraduationDate || '',
      researchDirection: profile.value.researchDirection || ''
    })
  } catch (error) {
    ElMessage.error('获取个人信息失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  loading.value = true
  try {
    await updateMyProfile(formData.value)
    ElMessage.success('信息更新成功')
    editMode.value = false
    await fetchProfile()
  } catch (error) {
    ElMessage.error('信息更新失败')
  } finally {
    loading.value = false
  }
}

// 重置表单
const handleReset = () => {
  if (profile.value) {
    Object.assign(formData.value, {
      email: profile.value.user.email || '',
      phone: profile.value.user.phone || '',
      address: profile.value.address || '',
      emergencyContact: profile.value.emergencyContact || '',
      emergencyPhone: profile.value.emergencyPhone || '',
      previousEducation: profile.value.previousEducation || '',
      workExperience: profile.value.workExperience || '',
      researchDirection: profile.value.researchDirection || ''
    })
  }
}

// 头像上传成功回调
const handleAvatarSuccess = (response: any) => {
  if (response.success) {
    ElMessage.success('头像更新成功')
    fetchProfile()
  } else {
    ElMessage.error(response.message || '头像上传失败')
  }
}

// 头像上传前验证
const beforeAvatarUpload = (file: File) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJpgOrPng) {
    ElMessage.error('头像只能是 JPG/PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }
  return true
}

onMounted(() => {
  fetchProfile()
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.profile-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-content {
  display: flex;
  gap: 30px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-width: 150px;
}

.avatar-upload {
  margin-top: 10px;
}

.info-section {
  flex: 1;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

@media (max-width: 768px) {
  .profile-content {
    flex-direction: column;
    align-items: center;
  }
}
</style>
