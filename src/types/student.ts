// 学位类型
export type DegreeType = 'master' | 'doctor'

// 性别
export type Gender = 'male' | 'female'

// 学籍状态
export type StudentStatus = 'active' | 'graduated' | 'suspended' | 'expelled'

// 学生基础信息
export interface StudentInfo {
  id: string
  studentNumber: string
  name: string
  gender: Gender
  idCard: string
  collegeId: string
  collegeName: string
  majorId: string
  majorName: string
  degreeType: DegreeType
  teacherId: string
  teacherName: string
  status: StudentStatus
  enrollmentYear: number
  graduationYear?: number
  avatar?: string
  
  // 扩展信息
  phone?: string
  email?: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  
  // 教育经历
  educationHistory?: EducationHistory[]
  
  // 工作经历
  workExperience?: WorkExperience[]
  
  // 时间戳
  createdAt: string
  updatedAt: string
}

// 教育经历
export interface EducationHistory {
  id: string
  school: string
  major: string
  degree: string
  startDate: string
  endDate: string
  gpa?: string
}

// 工作经历
export interface WorkExperience {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string
  description?: string
}

// 导师信息
export interface TeacherInfo {
  id: string
  teacherNumber: string
  name: string
  gender: Gender
  phone?: string
  email?: string
  collegeId: string
  collegeName: string
  title: string
  researchDirection: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

// 学院信息
export interface CollegeInfo {
  id: string
  name: string
  code: string
  description?: string
}

// 专业信息
export interface MajorInfo {
  id: string
  name: string
  code: string
  collegeId: string
  degreeTypes: DegreeType[]
}

// 学生查询条件
export interface StudentQuery {
  keyword?: string
  collegeId?: string
  majorId?: string
  degreeType?: DegreeType
  status?: StudentStatus
  teacherId?: string
  enrollmentYear?: number
  page: number
  pageSize: number
}

// 分页响应
export interface PageResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
