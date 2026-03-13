'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Sparkles, X, Reply, Lock, Smile, Image as LucideImage } from 'lucide-react'

interface ReplyTo {
  id: string
  content: string
  author: { id: string; name: string | null; email: string }
}

interface MessageFormProps {
  ticketId: string
  currentUserId: string
  replyTo?: ReplyTo | null
  onClearReply?: () => void
  onMessageSent?: (message?: any) => void
  ticketStatus?: string
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const EMOJI_GROUPS = [
  {
    label: 'Expresiones',
    emojis: ['😀','😂','🥰','😍','🤩','😎','🥳','😢','😭','😤','😡','🤔','😴','🤣','😊','😇','🤗','😏','🫡','🥹'],
  },
  {
    label: 'Gestos & Símbolos',
    emojis: ['👍','👎','✌️','🤞','👌','🤙','👏','🙌','🤝','💪','🙏','👋','🫶','❤️','💔','💯','🔥','✅','⚡','🎯'],
  },
  {
    label: 'Naturaleza',
    emojis: ['🌸','🌺','🌻','🌈','⭐','🌙','☀️','🌊','🍀','🦋','🐶','🐱','🦊','🐸','🦁','🐼','🐻','🦄','🐝','🌴'],
  },
  {
    label: 'Objetos & Actividades',
    emojis: ['🎉','🎊','🎁','🏆','🎸','📸','💻','📱','🚀','💡','🔑','📖','💰','🎓','🏠','🌍','⚽','🎮','🍕','☕'],
  },
]

function revokeIfBlob(url: string) {
  if (url.startsWith('blob:')) URL.revokeObjectURL(url)
}

export default function MessageForm({ ticketId, replyTo, onClearReply, onMessageSent, ticketStatus }: MessageFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [pendingImages, setPendingImages] = useState<{ id: string; previewUrl: string; file: File }[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const typingThrottleRef = useRef<NodeJS.Timeout | null>(null)
  const dragCounterRef = useRef(0)

  useEffect(() => {
    if (replyTo) textareaRef.current?.focus()
  }, [replyTo])

  useEffect(() => {
    if (!lightboxUrl) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxUrl(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [lightboxUrl])

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const emitTyping = () => {
    if (typingThrottleRef.current) return
    fetch(`/api/tickets/${ticketId}/typing`, { method: 'POST' }).catch(() => {})
    typingThrottleRef.current = setTimeout(() => {
      typingThrottleRef.current = null
    }, 2000)
  }

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      setContent(prev => prev + emoji)
      setShowEmojiPicker(false)
      return
    }
    const start = textarea.selectionStart ?? content.length
    const end = textarea.selectionEnd ?? content.length
    const newContent = content.slice(0, start) + emoji + content.slice(end)
    setContent(newContent)
    setShowEmojiPicker(false)
    setTimeout(() => {
      textarea.setSelectionRange(start + emoji.length, start + emoji.length)
      textarea.focus()
    }, 0)
  }

  const addImageFile = useCallback((file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return
    const id = Math.random().toString(36).slice(2)
    const previewUrl = URL.createObjectURL(file)
    setPendingImages(prev => [...prev, { id, previewUrl, file }])
  }, [])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    addImageFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find(item => item.kind === 'file' && ALLOWED_IMAGE_TYPES.includes(item.type))
    if (!imageItem) return
    e.preventDefault()
    const file = imageItem.getAsFile()
    if (file) addImageFile(file)
  }, [addImageFile])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current++
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current = 0
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter(f => ALLOWED_IMAGE_TYPES.includes(f.type))
    files.forEach(file => addImageFile(file))
  }, [addImageFile])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!content.trim() && pendingImages.length === 0) return

    setLoading(true)
    try {
      // Upload all pending images now
      const uploadedUrls: string[] = []
      for (const img of pendingImages) {
        const formData = new FormData()
        formData.append('file', img.file)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al subir imagen')
        }
        const { url } = await res.json()
        uploadedUrls.push(url)
      }

      const hasAiMention = content.toLowerCase().includes('@ia')

      if (hasAiMention) {
        const userMsgRes = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId,
            content,
            isInternal: true,
            attachments: uploadedUrls,
            ...(replyTo && replyTo.id !== 'description' ? { replyToId: replyTo.id } : {}),
          }),
        })
        if (!userMsgRes.ok) throw new Error('Error al enviar mensaje')
        const userMsg = await userMsgRes.json()
        onMessageSent?.(userMsg)

        setAiLoading(true)
        const aiRes = await fetch('/api/ai/ticket-assist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId, userMessage: content }),
        })
        if (!aiRes.ok) {
          const errorData = await aiRes.json()
          console.error('Error de IA:', errorData)
        }
      } else {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId,
            content,
            attachments: uploadedUrls,
            ...(replyTo && replyTo.id !== 'description' ? { replyToId: replyTo.id } : {}),
          }),
        })
        if (!res.ok) throw new Error('Error al enviar mensaje')
        const message = await res.json()
        onMessageSent?.(message)
      }

      setContent('')
      pendingImages.forEach(img => revokeIfBlob(img.previewUrl))
      setPendingImages([])
      onClearReply?.()
    } catch (error: any) {
      console.error('Error sending message:', error)
      alert(error.message || 'Error al enviar el mensaje')
    } finally {
      setLoading(false)
      setAiLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const isClosed = ticketStatus === 'CLOSED' || ticketStatus === 'SOLVED'

  if (isClosed) {
    return (
      <div className="bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-6 py-5">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500">
          <Lock className="h-4 w-4" />
          <span>
            Este ticket está{' '}
            <span className="font-medium">{ticketStatus === 'CLOSED' ? 'cerrado' : 'resuelto'}</span>
            {' '}— no se pueden enviar más mensajes.
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className="bg-gray-50 dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-4 relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag-and-drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-primary-50/90 dark:bg-primary-900/60 border-2 border-dashed border-primary-400 rounded-lg pointer-events-none">
          <LucideImage className="h-8 w-8 text-primary-500 mb-1" />
          <span className="text-sm font-medium text-primary-600 dark:text-primary-400">Suelta la imagen aquí</span>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {/* Reply preview */}
        {replyTo && (
          <div className="mb-2 flex items-start gap-2 pl-3 border-l-2 border-primary-400 bg-white dark:bg-slate-700 rounded-r-lg p-2.5">
            <Reply className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-0.5">
                {replyTo.author.name || replyTo.author.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{replyTo.content}</p>
            </div>
            <button type="button" onClick={onClearReply} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Pending image previews */}
        {pendingImages.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {pendingImages.map((img) => (
              <div key={img.id} className="relative group">
                <div
                  className="h-20 w-20 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-zoom-in"
                  onClick={() => setLightboxUrl(img.previewUrl)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.previewUrl} alt="imagen adjunta" className="h-full w-full object-cover hover:opacity-90 transition-opacity" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    revokeIfBlob(img.previewUrl)
                    setPendingImages(prev => prev.filter(i => i.id !== img.id))
                  }}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea */}
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => { setContent(e.target.value); if (e.target.value) emitTyping() }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Escribe un mensaje..."
              rows={2}
              className="w-full px-3 py-2.5 pr-10 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm"
            />
            {content.toLowerCase().includes('@ia') && (
              <div className="absolute bottom-full left-0 mb-1 flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400 px-2 py-1 rounded-lg">
                <Sparkles className="h-3.5 w-3.5" />
                <span>El asistente IA analizará el ticket</span>
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={loading || aiLoading || (!content.trim() && pendingImages.length === 0)}
            className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiLoading ? (
              <Sparkles className="h-5 w-5 animate-pulse" />
            ) : loading ? (
              <Send className="h-5 w-5 animate-pulse" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Toolbar */}
        <div className="mt-2 flex items-center gap-1 relative" ref={emojiPickerRef}>
          {/* Emoji button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(prev => !prev)}
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Emojis"
          >
            <Smile className="h-5 w-5" />
          </button>

          {/* Image button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Enviar imagen"
          >
            <LucideImage className="h-5 w-5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Emoji picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="h-64 overflow-y-auto p-2">
                {EMOJI_GROUPS.map((group) => (
                  <div key={group.label} className="mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 px-1">
                      {group.label}
                    </p>
                    <div className="grid grid-cols-10 gap-0.5">
                      {group.emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => insertEmoji(emoji)}
                          className="h-7 w-7 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Image lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxUrl}
              alt="imagen"
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
            />
            <div className="absolute top-2 right-2 flex gap-1.5">
              <button
                onClick={() => setLightboxUrl(null)}
                className="h-8 w-8 flex items-center justify-center bg-black/60 text-white rounded-full hover:bg-black/90 transition-colors"
                title="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
