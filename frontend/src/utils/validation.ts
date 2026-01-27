// 表单验证工具函数

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export function validateField(value: any, rules: ValidationRule, fieldName: string): string | null {
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return `${fieldName}不能为空`
  }

  if (value && typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return `${fieldName}至少需要${rules.minLength}个字符`
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return `${fieldName}最多${rules.maxLength}个字符`
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return `${fieldName}格式不正确`
    }
  }

  if (rules.custom) {
    return rules.custom(value)
  }

  return null
}

export function validateForm(
  data: Record<string, any>,
  rules: Record<string, ValidationRule>
): ValidationResult {
  const errors: Record<string, string> = {}

  Object.keys(rules).forEach((key) => {
    const error = validateField(data[key], rules[key], key)
    if (error) {
      errors[key] = error
    }
  })

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// 常用验证规则
export const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    required: true,
    minLength: 6,
    maxLength: 20,
  },
  phone: {
    required: true,
    pattern: /^1[3-9]\d{9}$/,
  },
  username: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
  },
}
