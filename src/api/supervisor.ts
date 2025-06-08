import request from '@/utils/request'

// 获取导师信息
export const getSupervisorList = (params?: any) => {
  return request({
    url: '/supervisor/list',
    method: 'get',
    params
  })
}

// 获取我指导的学生
export const getMyStudents = (params?: any) => {
  return request({
    url: '/supervisor/my-students',
    method: 'get',
    params
  })
}

// 创建导师
export const createSupervisor = (data: any) => {
  return request({
    url: '/supervisor/create',
    method: 'post',
    data
  })
}

// 更新导师信息
export const updateSupervisor = (id: number, data: any) => {
  return request({
    url: `/supervisor/${id}`,
    method: 'put',
    data
  })
}

// 删除导师
export const deleteSupervisor = (id: number) => {
  return request({
    url: `/supervisor/${id}`,
    method: 'delete'
  })
}
