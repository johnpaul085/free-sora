import { ToastType } from '@/components/UI/Toast'

declare global {
  interface Window {
    showToast?: (toast: {
      message: string
      type: ToastType
      duration?: number
    }) => void
  }
}

export {}
