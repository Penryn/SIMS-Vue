// 用户角色类型
export type UserRole = 
  | 'student'         // 研究生
  | 'teacher'         // 导师
  | 'college_admin'   // 学院研究生秘书
  | 'college_leader'  // 学院领导
  | 'grad_admin'      // 研究生院管理员
  | 'grad_leader'     // 研究生院领导
  | 'school_leader'   // 学校领导
  | 'system_admin'    // 系统管理员
  | 'audit_admin'     // 审计管理员

// 登录表单
export interface LoginForm {
  username: string
  password: string
}

// 用户信息
export interface UserInfo {
  id: string
  username: string
  name: string
  role: UserRole
  collegeId?: string
  collegeName?: string
  isFirstLogin: boolean
  avatar?: string
}

// 修改密码表单
export interface ChangePasswordForm {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}
