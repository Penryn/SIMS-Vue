import request from '@/utils/request'

// 获取学院列表
export const getCollegeList = () => {
  return request({
    url: '/college/list',
    method: 'get'
  })
}

// 获取专业列表
export const getMajorList = (collegeId?: number) => {
  return request({
    url: '/college/majors',
    method: 'get',
    params: { collegeId }
  })
}

// 创建学院
export const createCollege = (data: any) => {
  return request({
    url: '/college/create',
    method: 'post',
    data
  })
}

// 创建专业
export const createMajor = (data: any) => {
  return request({
    url: '/college/create-major',
    method: 'post',
    data
  })
}
