'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, File, FileText, Calendar, Tag, FolderTree, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface Category {
  id: string
  name: string
}

interface CreateTicketFormProps {
  currentUser: {
    id: string
    role: string
  }
}

// Función para obtener fecha y hora actual en formato ISO local
const getCurrentDateTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export default function CreateTicketForm({ currentUser }: CreateTicketFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    customerId: currentUser.id,
    subject: '',
    description: '',
    impact: '',
    dueDate: getCurrentDateTime(),
    closureCriteria: '',
    priority: 'NORMAL',
    type: '',
    categoryId: '',
    tags: '',
  })
  const [attachments, setAttachments] = useState<File[]>([])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachments(prev => [...prev, ...newFiles])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = []

    for (const file of files) {
      try {
        uploadedUrls.push(file.name)
      } catch (error) {
        console.error('Error uploading file:', error)
      }
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const attachmentUrls = await uploadFiles(attachments)

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          type: formData.type || null,
          categoryId: formData.categoryId || null,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          attachments: attachmentUrls
        }),
      })

      if (response.ok) {
        const ticket = await response.json()
        router.push(`/dashboard/tickets/${ticket.id}`)
      } else {
        setError('Error al crear el ticket')
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
      setError('Error al crear el ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-gray-50 dark:bg-slate-950 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Crear Nuevo Ticket
          </h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
            Completa la información para registrar tu solicitud al Área de Sistemas
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Nombre de la solicitud */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Nombre de la solicitud <span className="text-red-500">*</span>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Título claro y descriptivo del requerimiento
                  </p>
                </div>
              </div>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Ej: Actualización del sistema de reportes"
                className="w-full px-4 py-3 text-sm lg:text-base border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Descripción */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Descripción del requerimiento <span className="text-red-500">*</span>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Detalla el problema o necesidad que requiere atención
                  </p>
                </div>
              </div>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe el problema o solicitud con el mayor detalle posible..."
                rows={5}
                className="w-full px-4 py-3 text-sm lg:text-base border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          </div>

          {/* Alcance e Impacto */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Alcance e impacto */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <FolderTree className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Alcance e impacto
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Áreas y procesos afectados
                  </p>
                </div>
              </div>
              <textarea
                value={formData.impact}
                onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                placeholder="Describe qué áreas o procesos se verán afectados..."
                rows={4}
                className="w-full px-4 py-3 text-sm lg:text-base border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            {/* Criterio de cierre */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Criterio de cierre
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Condición para dar por concluido
                  </p>
                </div>
              </div>
              <textarea
                value={formData.closureCriteria}
                onChange={(e) => setFormData({ ...formData, closureCriteria: e.target.value })}
                placeholder="¿Cómo sabremos que está completo?..."
                rows={4}
                className="w-full px-4 py-3 text-sm lg:text-base border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          </div>

          {/* Fecha y Archivos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Fecha objetivo */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Fecha objetivo <span className="text-red-500">*</span>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Cuándo necesitas el entregable
                  </p>
                </div>
              </div>
              <input
                type="datetime-local"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-3 text-sm lg:text-base border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Archivos adjuntos */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                  <Upload className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Archivos adjuntos
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Evidencias o documentos de apoyo
                  </p>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-4 text-center hover:border-primary-400 dark:hover:border-primary-500 transition-colors">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Haz clic para subir archivos
                  </span>
                </label>
              </div>

              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <File className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <span className="text-xs text-gray-900 dark:text-gray-100 truncate">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Clasificación */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Prioridad */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Prioridad
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Nivel de urgencia
                  </p>
                </div>
              </div>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 text-sm lg:text-base border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="LOW">Baja</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>

            {/* Tipo */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                  <FolderTree className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Tipo
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Categoría del ticket
                  </p>
                </div>
              </div>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 text-sm lg:text-base border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar...</option>
                <option value="INCIDENT">Incidente</option>
                <option value="CHANGE_REQUEST">Solicitud de cambio</option>
                <option value="PROJECT">Proyecto</option>
              </select>
            </div>

            {/* Categoría */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Tag className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Categoría
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Área específica
                  </p>
                </div>
              </div>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-3 text-sm lg:text-base border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Etiquetas */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                <Tag className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Etiquetas
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Palabras clave para organizar (separadas por comas)
                </p>
              </div>
            </div>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Ej: bug, urgente, producción"
              className="w-full px-4 py-3 text-sm lg:text-base border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <Link
              href="/dashboard/tickets"
              className="px-6 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? 'Creando ticket...' : 'Crear Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
