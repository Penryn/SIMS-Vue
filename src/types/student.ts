// 学位类型
export type DegreeType = 'master' | 'doctor'

// 性别
export type Gender = 'male' | 'female'

// 学籍状态
export type StudentStatus = 'active' | 'graduated' | 'suspended' | 'expelled'

// 完整的学生档案信息（匹配后端 StudentProfile 实体）
export interface StudentProfile {
  id: number
  studentId: string
  name: string
  gender: Gender
  idNumber: string
  college: {
    id: number
    name: string
    code?: string
  }
  major: {
    id: number
    name: string
    code?: string
    collegeId: number
  }
  degreeType: DegreeType
  supervisor: {
    id: number
    name: string
    email?: string
    phone?: string
  }
  enrollmentDate: string
  expectedGraduationDate?: string
  currentStatus: StudentStatus
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  researchDirection?: string
  user?: {
    id: number
    email?: string
    phone?: string
  }
  createdAt: string
  updatedAt: string
}

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

// 学生更新表单
export interface StudentUpdateForm {
  email?: string
  phone?: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  expectedGraduationDate?: string
  researchDirection?: string
}
