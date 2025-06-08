import type { App, DirectiveBinding } from 'vue'
import { useAuthStore } from '@/stores/auth'

// 权限指令
export const permission = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    checkPermission(el, binding)
  },
  updated(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    checkPermission(el, binding)
  }
}

// 角色指令
export const role = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    checkRole(el, binding)
  },
  updated(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    checkRole(el, binding)
  }
}

function checkPermission(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
  const authStore = useAuthStore()
  const { value } = binding
  
  if (!value) {
    console.warn('v-permission directive requires a permission value')
    return
  }
  
  if (!authStore.hasPermission(value)) {
    el.style.display = 'none'
    // 或者直接移除元素
    // el.parentNode?.removeChild(el)
  } else {
    el.style.display = ''
  }
}

function checkRole(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
  const authStore = useAuthStore()
  const { value } = binding
  
  if (!value) {
    console.warn('v-role directive requires a role value')
    return
  }
  
  if (!authStore.hasRole(value)) {
    el.style.display = 'none'
    // 或者直接移除元素
    // el.parentNode?.removeChild(el)
  } else {
    el.style.display = ''
  }
}

// 安装指令
export default function installDirectives(app: App) {
  app.directive('permission', permission)
  app.directive('role', role)
}
