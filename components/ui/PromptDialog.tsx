'use client'

import { useState } from 'react'
import Modal from './Modal'

interface PromptDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (value: string) => void
  title: string
  message: string
  placeholder?: string
  defaultValue?: string
  confirmText?: string
  cancelText?: string
  required?: boolean
}

export default function PromptDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  placeholder = '',
  defaultValue = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  required = false,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue)

  const handleConfirm = () => {
    if (required && !value.trim()) {
      return
    }
    onConfirm(value)
    onClose()
    setValue('')
  }

  const handleClose = () => {
    onClose()
    setValue('')
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-gray-700 dark:text-gray-300">
          {message}
        </p>

        <div>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none"
            autoFocus
          />
          {required && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              * Campo requerido
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={required && !value.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
