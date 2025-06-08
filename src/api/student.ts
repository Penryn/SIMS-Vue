import request from '@/utils/request'
import type { StudentInfo } from '@/types/student'

/**
 * 获取学生列表（分页）
 */
export function getStudentList(params: {
  page?: number
  size?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  collegeId?: number
  majorId?: number
  keyword?: string
}) {
  return request({
    url: '/api/student-profiles',
    method: 'get',
    params
  })
}

/**
 * 根据ID获取学生详情
 */
export function getStudentById(id: number) {
  return request({
    url: `/api/student-profiles/${id}`,
    method: 'get'
  })
}

/**
 * 创建学生信息
 */
export function createStudent(data: any) {
  return request({
    url: '/api/student-profiles',
    method: 'post',
    data
  })
}

/**
 * 更新学生信息
 */
export function updateStudent(id: number, data: any) {
  return request({
    url: `/api/student-profiles/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除学生信息
 */
export function deleteStudent(id: number) {
  return request({
    url: `/api/student-profiles/${id}`,
    method: 'delete'
  })
}

/**
 * 批量导入学生信息
 */
export function batchImportStudents(data: any[]) {
  return request({
    url: '/api/student-profiles/batch',
    method: 'post',
    data
  })
}

/**
 * 通过Excel文件导入学生信息
 */
export function importStudentsFromExcel(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/api/student-profiles/import',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 审批学生信息
 */
export function approveStudent(id: number, approved: boolean, reason?: string) {
  return request({
    url: `/api/student-profiles/${id}/approve`,
    method: 'put',
    data: { approved, reason }
  })
}

/**
 * 获取待审批学生列表
 */
export function getPendingApprovals() {
  return request({
    url: '/api/student-profiles/pending-approvals',
    method: 'get'
  })
}

/**
 * 搜索学生信息
 */
export function searchStudents(params: any) {
  return request({
    url: '/api/student-profiles/search',
    method: 'get',
    params
  })
}

/**
 * 导出学生信息
 */
export function exportStudents(params?: any) {
  return request({
    url: '/api/student-profiles/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

/**
 * 上传学生照片
 */
export function uploadStudentPhoto(id: number, file: File) {
  const formData = new FormData()
  formData.append('photo', file)
  return request({
    url: `/api/student-profiles/${id}/photo`,
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 获取学生照片
 */
export function getStudentPhoto(id: number) {
  return request({
    url: `/api/student-profiles/${id}/photo`,
    method: 'get',
    responseType: 'blob'
  })
}

/**
 * 获取当前学生的个人信息
 */
export function getMyProfile() {
  return request({
    url: '/api/student-profiles/my-profile',
    method: 'get'
  })
}

/**
 * 更新当前学生的个人信息
 */
export function updateMyProfile(data: any) {
  return request({
    url: '/api/student-profiles/my-profile',
    method: 'put',
    data
  })
}
