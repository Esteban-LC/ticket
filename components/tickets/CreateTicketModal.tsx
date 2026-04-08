'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

const STOP_WORDS = new Set([
  'a', 'al', 'con', 'de', 'del', 'e', 'el', 'en', 'es', 'esta', 'este', 'esto',
  'la', 'las', 'le', 'les', 'lo', 'los', 'más', 'me', 'mi', 'no', 'o', 'para',
  'por', 'que', 'se', 'si', 'sin', 'su', 'sus', 'te', 'tu', 'un', 'una', 'uno',
  'y', 'ya', 'yo', 'nos', 'ha', 'hay', 'como', 'ser', 'son', 'fue', 'sea',
])

function extractTagSuggestions(fields: string[], existingTags: string[]): string[] {
  const text = fields.join(' ')
  const existing = new Set(existingTags.map(t => t.toLowerCase().trim()))
  const seen = new Set<string>()
  const suggestions: string[] = []

  const words = text.split(/[\s,;:.!?()[\]{}\-/\\]+/)
  for (const word of words) {
    const clean = word.replace(/[^a-záéíóúüñA-ZÁÉÍÓÚÜÑ]/g, '').toLowerCase()
    if (clean.length >= 4 && !STOP_WORDS.has(clean) && !seen.has(clean) && !existing.has(clean)) {
      seen.add(clean)
      suggestions.push(clean)
    }
    if (suggestions.length >= 8) break
  }
  return suggestions
}

interface CreateTicketModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateTicketModal({ isOpen, onClose }: CreateTicketModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    tags: '',
  })

  const existingTags = useMemo(
    () => formData.tags.split(',').map(t => t.trim()).filter(Boolean),
    [formData.tags]
  )

  const tagSuggestions = useMemo(
    () => extractTagSuggestions([formData.subject, formData.description], existingTags),
    [formData.subject, formData.description, existingTags]
  )

  const addSuggestedTag = (tag: string) => {
    const current = formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    if (!current.includes(tag)) {
      setFormData({ ...formData, tags: [...current, tag].join(', ') })
    }
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })

      if (response.ok) {
        const ticket = await response.json()
        onClose()
        router.push(`/dashboard/tickets/${ticket.id}`)
        router.refresh()
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-30" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Crear Nuevo Ticket</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asunto *
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe el problema brevemente"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Proporciona más detalles sobre el problema"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Etiquetas
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Separa las etiquetas con comas"
              />
              {tagSuggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400 mb-1.5">Sugerencias:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tagSuggestions.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => addSuggestedTag(tag)}
                        className="px-2 py-0.5 text-xs bg-teal-50 text-teal-700 border border-teal-200 rounded-full hover:bg-teal-100 transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear Ticket'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
