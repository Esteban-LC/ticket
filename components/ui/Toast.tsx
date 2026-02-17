'use client'

import { useEffect } from 'react'
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-500',
      iconColor: 'text-green-600 dark:text-green-400',
      textColor: 'text-green-900 dark:text-green-200',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-500',
      iconColor: 'text-red-600 dark:text-red-400',
      textColor: 'text-red-900 dark:text-red-200',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-500',
      iconColor: 'text-orange-600 dark:text-orange-400',
      textColor: 'text-orange-900 dark:text-orange-200',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-500',
      iconColor: 'text-blue-600 dark:text-blue-400',
      textColor: 'text-blue-900 dark:text-blue-200',
    },
  }

  const typeConfig = config[type]
  const Icon = typeConfig.icon

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-l-4 ${typeConfig.bgColor} ${typeConfig.borderColor} animate-slide-in`}>
      <Icon className={`h-5 w-5 ${typeConfig.iconColor}`} />
      <p className={`text-sm font-medium ${typeConfig.textColor}`}>
        {message}
      </p>
      <button
        onClick={onClose}
        className={`ml-2 ${typeConfig.iconColor} hover:opacity-70 transition-opacity`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
