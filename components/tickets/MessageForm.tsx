'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Sparkles, X, Reply, Lock, Smile, File as LucideFile, Video, Mic, Square } from 'lucide-react'

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

interface PendingAttachment {
  id: string
  file: File
  previewUrl?: string
  sourceKind?: 'recording' | 'upload'
  displayInline?: boolean
}

const EMOJI_GROUPS = [
  {
    label: 'Expresiones',
    emojis: ['😀','😂','🥰','😍','🤩','😎','🥳','😢','😭','😤','😡','🤔','😴','🤣','😊','😇','🤗','😏','🫡','🥹'],
  },
  {
    label: 'Gestos y simbolos',
    emojis: ['👍','👎','✌️','🤞','👌','🤙','👏','🙌','🤝','💪','🙏','👋','🫶','❤️','💔','💯','🔥','✅','⚡','🎯'],
  },
  {
    label: 'Naturaleza',
    emojis: ['🌸','🌺','🌻','🌈','⭐','🌙','☀️','🌊','🍀','🦋','🐶','🐱','🦊','🐸','🦁','🐼','🐻','🦄','🐝','🌴'],
  },
  {
    label: 'Objetos y actividades',
    emojis: ['🎉','🎊','🎁','🏆','🎸','📸','💻','📱','🚀','💡','🔑','📚','💰','🎓','🏠','🌍','⚽','🎮','🍕','☕'],
  },
]

function revokeIfBlob(url?: string) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
}

function isImageFile(file: File) {
  return file.type.startsWith('image/')
}

function isVideoFile(file: File) {
  return file.type.startsWith('video/')
}

function isAudioFile(file: File) {
  return file.type.startsWith('audio/')
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(size / 1024))} KB`
}

export default function MessageForm({ ticketId, replyTo, onClearReply, onMessageSent, ticketStatus }: MessageFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [canRecordAudio, setCanRecordAudio] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const typingThrottleRef = useRef<NodeJS.Timeout | null>(null)
  const dragCounterRef = useRef(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (replyTo) textareaRef.current?.focus()
  }, [replyTo])

  useEffect(() => {
    if (!lightboxUrl) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxUrl(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [lightboxUrl])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setCanRecordAudio(Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== 'undefined')
  }, [])

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      mediaStreamRef.current?.getTracks().forEach(track => track.stop())
    }
  }, [])

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

  const addAttachmentFile = useCallback((
    file: File,
    options?: {
      sourceKind?: 'recording' | 'upload'
      displayInline?: boolean
    }
  ) => {
    const id = Math.random().toString(36).slice(2)
    const sourceKind = options?.sourceKind || 'upload'
    const displayInline = options?.displayInline ?? (isImageFile(file) || isVideoFile(file) || isAudioFile(file))
    const previewUrl = displayInline && (isImageFile(file) || isVideoFile(file) || isAudioFile(file))
      ? URL.createObjectURL(file)
      : undefined
    setPendingAttachments(prev => [...prev, { id, file, previewUrl, sourceKind, displayInline }])
  }, [])

  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach((file) => addAttachmentFile(file, { sourceKind: 'upload', displayInline: false }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find(item => item.kind === 'file' && item.type.startsWith('image/'))
    if (!imageItem) return
    e.preventDefault()
    const file = imageItem.getAsFile()
    if (file) addAttachmentFile(file, { sourceKind: 'upload', displayInline: true })
  }, [addAttachmentFile])

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
    const files = Array.from(e.dataTransfer.files)
    files.forEach((file) => addAttachmentFile(file, {
      sourceKind: 'upload',
      displayInline: isImageFile(file),
    }))
  }, [addAttachmentFile])

  const stopMediaStream = () => {
    mediaStreamRef.current?.getTracks().forEach(track => track.stop())
    mediaStreamRef.current = null
  }

  const startAudioRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        audioInputRef.current?.click()
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const mimeType =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : ''

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }

      recorder.onstop = () => {
        if (!chunks.length) {
          stopMediaStream()
          return
        }

        const blobType = recorder.mimeType || 'audio/webm'
        const extension = blobType.includes('mp4') ? 'm4a' : blobType.includes('ogg') ? 'ogg' : 'webm'
        const file = new File([new Blob(chunks, { type: blobType })], `audio-${Date.now()}.${extension}`, {
          type: blobType,
        })

        addAttachmentFile(file, { sourceKind: 'recording', displayInline: true })
        stopMediaStream()
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setRecording(true)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('No se pudo iniciar la grabacion:', error)
      alert('No se pudo acceder al microfono')
      stopMediaStream()
    }
  }

  const stopAudioRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }

    setRecording(false)
    setRecordingTime(0)

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    } else {
      stopMediaStream()
    }
  }

  const formatRecordingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
  }

  const uploadAttachments = async () => {
    const uploadedAttachments = await Promise.all(
      pendingAttachments.map(async (attachment) => {
        const formData = new FormData()
        formData.append('file', attachment.file)
        formData.append('ticketId', ticketId)
        formData.append('attachmentKind', attachment.sourceKind || 'upload')
        formData.append('displayInline', attachment.displayInline ? 'true' : 'false')

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Error al subir ${attachment.file.name}`)
        }

        const data = await response.json()
        if (typeof data.serializedAttachment !== 'string') {
          throw new Error(`Respuesta invalida al subir ${attachment.file.name}`)
        }

        return data.serializedAttachment
      })
    )

    return uploadedAttachments
  }

  const clearPendingAttachments = () => {
    pendingAttachments.forEach(attachment => revokeIfBlob(attachment.previewUrl))
    setPendingAttachments([])
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!content.trim() && pendingAttachments.length === 0) return

    setLoading(true)

    try {
      const uploadedAttachments = await uploadAttachments()
      const hasAiMention = content.toLowerCase().includes('@ia')

      if (hasAiMention) {
        const userMsgRes = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId,
            content,
            isInternal: true,
            attachments: uploadedAttachments,
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
          const errorData = await aiRes.json().catch(() => ({}))
          console.error('Error de IA:', errorData)
        }
      } else {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId,
            content,
            attachments: uploadedAttachments,
            ...(replyTo && replyTo.id !== 'description' ? { replyToId: replyTo.id } : {}),
          }),
        })

        if (!res.ok) throw new Error('Error al enviar mensaje')
        const message = await res.json()
        onMessageSent?.(message)
      }

      setContent('')
      clearPendingAttachments()
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
      <div className="shrink-0 bg-transparent px-6 py-5">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500">
          <Lock className="h-4 w-4" />
          <span>
            Este ticket esta{' '}
            <span className="font-medium">{ticketStatus === 'CLOSED' ? 'cerrado' : 'resuelto'}</span>
            {' '}y no se pueden enviar mas mensajes.
          </span>
        </div>
      </div>
    )
  }

  const canSend = !loading && !aiLoading && (content.trim().length > 0 || pendingAttachments.length > 0)

  return (
    <div
      className="shrink-0 relative bg-transparent p-2.5 sm:p-3"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-primary-50/90 dark:bg-primary-900/60 border-2 border-dashed border-primary-400 rounded-lg pointer-events-none">
          <LucideFile className="h-8 w-8 text-primary-500 mb-1" />
          <span className="text-sm font-medium text-primary-600 dark:text-primary-400">Suelta los archivos aqui</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
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

        {pendingAttachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {pendingAttachments.map((attachment) => (
              <div key={attachment.id} className="relative group">
                {(() => {
                  const isImage = attachment.previewUrl && isImageFile(attachment.file)
                  const isVideo = attachment.previewUrl && isVideoFile(attachment.file)
                  const isAudio = attachment.previewUrl && isAudioFile(attachment.file)
                  const containerClass = isImage || isVideo
                    ? 'h-20 w-20 cursor-zoom-in'
                    : isAudio
                      ? 'min-w-[220px] max-w-[280px] p-3'
                      : 'min-w-[180px] max-w-[240px] p-3'

                  return (
                <div
                  className={`rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 ${containerClass}`}
                  onClick={() => (isImage || isVideo) && attachment.previewUrl && setLightboxUrl(attachment.previewUrl)}
                >
                  {isImage && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={attachment.previewUrl} alt={attachment.file.name} className="h-full w-full object-cover hover:opacity-90 transition-opacity" />
                    </>
                  )}
                  {isVideo && (
                    <div className="relative h-full w-full">
                      <video src={attachment.previewUrl} className="h-full w-full object-cover" muted />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Video className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  )}
                  {isAudio && (
                    <div className="w-full">
                      <div className="flex items-center gap-2 mb-2 text-gray-700 dark:text-gray-200">
                        <Mic className="h-4 w-4 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{attachment.file.name}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">{formatFileSize(attachment.file.size)}</p>
                        </div>
                      </div>
                      <audio controls className="w-full">
                        <source src={attachment.previewUrl} type={attachment.file.type} />
                      </audio>
                    </div>
                  )}
                  {!attachment.previewUrl && (
                    <div className="flex items-center gap-2">
                      <LucideFile className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-100 truncate">{attachment.file.name}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{formatFileSize(attachment.file.size)}</p>
                      </div>
                    </div>
                  )}
                </div>
                  )
                })()}
                <button
                  type="button"
                  onClick={() => {
                    revokeIfBlob(attachment.previewUrl)
                    setPendingAttachments(prev => prev.filter(item => item.id !== attachment.id))
                  }}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          {content.toLowerCase().includes('@ia') && (
            <div className="absolute bottom-full left-3 mb-2 flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400 px-2 py-1 rounded-lg">
              <Sparkles className="h-3.5 w-3.5" />
              <span>El asistente IA analizara el ticket</span>
            </div>
          )}

          <div className="mx-auto flex items-center gap-2 w-full max-w-5xl">
            <div className="flex-1 h-14 flex items-center gap-1.5 rounded-[1.75rem] border border-white/10 bg-[#31424d] px-2.5 sm:px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="relative flex items-center" ref={emojiPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(prev => !prev)}
                  className="h-9 w-9 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Emojis"
                >
                  <Smile className="h-5 w-5" />
                </button>

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

              <div className="flex-1 h-full flex items-center relative">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value)
                    if (e.target.value) emitTyping()
                  }}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder="Escribe un mensaje..."
                  rows={1}
                  className="w-full min-h-[24px] max-h-32 px-2 py-0 bg-transparent text-white placeholder:text-[#aebac1] border-0 focus:outline-none resize-none text-sm leading-6 align-middle"
                />
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 w-9 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Adjuntar archivos"
              >
                <LucideFile className="h-5 w-5" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                onChange={handleAttachmentSelect}
                multiple
                className="hidden"
              />

              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                capture
                onChange={handleAttachmentSelect}
                className="hidden"
              />
            </div>

            <button
              type={canSend ? 'submit' : 'button'}
              onClick={canSend ? undefined : (recording ? stopAudioRecording : startAudioRecording)}
              disabled={loading || aiLoading}
              className={`flex-shrink-0 h-14 w-14 flex items-center justify-center rounded-full border border-white/10 bg-[#31424d] text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${
                recording ? 'hover:bg-[#7a3340]' : 'hover:bg-[#3a4d59]'
              }`}
              title={canSend ? 'Enviar mensaje' : recording ? 'Detener grabacion' : canRecordAudio ? 'Grabar audio' : 'Adjuntar audio'}
            >
              {aiLoading ? (
                <Sparkles className="h-5 w-5 animate-pulse" />
              ) : loading ? (
                <Send className="h-5 w-5 animate-pulse" />
              ) : canSend ? (
                <Send className="h-5 w-5" />
              ) : recording ? (
                <Square className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5 text-white" />
              )}
            </button>
          </div>
        </div>

        {recording && (
          <div className="mx-auto mt-2 flex items-center gap-2 text-xs text-red-400 w-full max-w-5xl px-1">
            <span className="inline-flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span>Grabando audio {formatRecordingTime(recordingTime)}</span>
          </div>
        )}
      </form>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxUrl}
              alt="archivo"
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
