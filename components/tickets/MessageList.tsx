'use client'

import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { MessageType, UserRole } from '@prisma/client'
import { Reply, Pin, PinOff, Trash2, Download, X as XIcon, Video, Mic, SmilePlus, FileBadge2, Search, FileText, FileSpreadsheet, FileArchive, FileCode2, Presentation, NotebookText } from 'lucide-react'
import { isImageAttachment, isRecordedAudioAttachment, isVideoAttachment, parseAttachmentRef } from '@/lib/attachments'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

const DEFAULT_REACTIONS = [
  String.fromCodePoint(0x1F44D),
  '\u2764\uFE0F',
  String.fromCodePoint(0x1F602),
  String.fromCodePoint(0x1F62E),
  String.fromCodePoint(0x1F622),
  String.fromCodePoint(0x1F64F),
] as const

const EXTRA_REACTIONS = [
  String.fromCodePoint(0x1F525),
  String.fromCodePoint(0x1F389),
  String.fromCodePoint(0x1F44F),
  String.fromCodePoint(0x1F914),
  String.fromCodePoint(0x1F60E),
  String.fromCodePoint(0x1F62D),
  String.fromCodePoint(0x1F631),
  String.fromCodePoint(0x1F44C),
  String.fromCodePoint(0x1F680),
  String.fromCodePoint(0x1F4AA),
  String.fromCodePoint(0x1F91D),
  String.fromCodePoint(0x1F4AF),
  String.fromCodePoint(0x1F60A),
  String.fromCodePoint(0x1F601),
  String.fromCodePoint(0x1F923),
  String.fromCodePoint(0x1F60D),
  String.fromCodePoint(0x1F970),
  String.fromCodePoint(0x1F609),
  String.fromCodePoint(0x1F618),
  String.fromCodePoint(0x1F62C),
  String.fromCodePoint(0x1F61B),
  String.fromCodePoint(0x1F928),
  String.fromCodePoint(0x1F644),
  String.fromCodePoint(0x1F62A),
  String.fromCodePoint(0x1F60F),
  String.fromCodePoint(0x1F973),
  String.fromCodePoint(0x1F4A1),
  String.fromCodePoint(0x1F64C),
  String.fromCodePoint(0x1F44B),
  String.fromCodePoint(0x1F31F),
  String.fromCodePoint(0x1F381),
  String.fromCodePoint(0x1F3AF),
  String.fromCodePoint(0x1F984),
  String.fromCodePoint(0x1F42F),
  String.fromCodePoint(0x1F436),
  String.fromCodePoint(0x1F431),
  String.fromCodePoint(0x1F308),
  String.fromCodePoint(0x1F49B),
  String.fromCodePoint(0x1F49A),
  String.fromCodePoint(0x1F499),
  String.fromCodePoint(0x1F49C),
  String.fromCodePoint(0x1F9E1),
  String.fromCodePoint(0x1F497),
  String.fromCodePoint(0x1F496),
  String.fromCodePoint(0x1F495),
  String.fromCodePoint(0x1F48B),
  String.fromCodePoint(0x1F444),
  String.fromCodePoint(0x1F445),
  String.fromCodePoint(0x1FAC0),
  String.fromCodePoint(0x1FAC1),
  String.fromCodePoint(0x1FA78),
  String.fromCodePoint(0x1F443),
  String.fromCodePoint(0x1F440),
  String.fromCodePoint(0x1F9E0),
  String.fromCodePoint(0x1F9B7),
  String.fromCodePoint(0x1F9B4),
  String.fromCodePoint(0x1F9B5),
  String.fromCodePoint(0x1F9B6),
  String.fromCodePoint(0x1F44E),
  String.fromCodePoint(0x1F590),
  String.fromCodePoint(0x1F596),
  String.fromCodePoint(0x1F918),
  String.fromCodePoint(0x1F91F),
  String.fromCodePoint(0x270C),
  String.fromCodePoint(0x1FAF6),
  String.fromCodePoint(0x1FAF0),
  String.fromCodePoint(0x1F64B),
  String.fromCodePoint(0x1F91A),
  String.fromCodePoint(0x1F44A),
  String.fromCodePoint(0x1F91B),
  String.fromCodePoint(0x1F91C),
] as const

const ALL_REACTIONS = [...DEFAULT_REACTIONS, ...EXTRA_REACTIONS]
const REACTION_USAGE_STORAGE_KEY = 'ticket-reaction-usage'

function getUserColor(userId: string) {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) & 0xffff
  }
  const hue = Math.round((hash * 137) % 360)
  return {
    borderColor: `hsl(${hue}, 70%, 55%)`,
    nameColor: `hsl(${hue}, 70%, 65%)`,
    avatarBg: `hsl(${hue}, 45%, 18%)`,
    avatarText: `hsl(${hue}, 75%, 78%)`,
  }
}

function isEmojiOnly(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed || trimmed.length > 12) return false
  return !/[^\u00a9\u00ae\u200d\u203c-\u3299\ud83c-\udbff\udc00-\udfff\s\ufe0f]/.test(trimmed)
}

const URL_REGEX = /https?:\/\/[^\s<>"]+/g
function renderTextWithLinks(text: string, isOwn: boolean) {
  const parts = text.split(URL_REGEX)
  const matches = text.match(URL_REGEX) || []
  return parts.reduce<React.ReactNode[]>((acc, part, i) => {
    if (part) acc.push(part)
    if (matches[i]) {
      acc.push(
        <a
          key={i}
          href={matches[i]}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline break-all ${isOwn ? 'text-white/90 hover:text-white' : 'text-primary-600 dark:text-primary-400 hover:text-primary-800'}`}
          onClick={e => e.stopPropagation()}
        >
          {matches[i]}
        </a>
      )
    }
    return acc
  }, [])
}

function formatFileSize(size?: number) {
  if (!size) return null
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(size / 1024))} KB`
}

function getAttachmentLabel(name: string, mimeType?: string) {
  const extension = name.split('.').pop()?.toUpperCase()
  if (extension) return extension
  if (mimeType?.startsWith('video/')) return 'VIDEO'
  if (mimeType?.startsWith('audio/')) return 'AUDIO'
  return 'FILE'
}

function getAttachmentAppearance(label: string, mimeType?: string) {
  const normalized = label.toUpperCase()

  if (mimeType?.startsWith('video/')) {
    return {
      icon: Video,
      badgeClass: 'border border-fuchsia-300/20 bg-fuchsia-500/15 text-fuchsia-200',
      iconClass: 'text-fuchsia-200',
    }
  }

  if (mimeType?.startsWith('audio/')) {
    return {
      icon: Mic,
      badgeClass: 'border border-emerald-300/20 bg-emerald-500/15 text-emerald-200',
      iconClass: 'text-emerald-200',
    }
  }

  if (['PDF'].includes(normalized)) {
    return {
      icon: FileBadge2,
      badgeClass: 'border border-rose-300/20 bg-rose-500/15 text-rose-200',
      iconClass: 'text-rose-200',
    }
  }

  if (['XLS', 'XLSX', 'CSV'].includes(normalized)) {
    return {
      icon: FileSpreadsheet,
      badgeClass: 'border border-emerald-300/20 bg-emerald-500/15 text-emerald-200',
      iconClass: 'text-emerald-200',
    }
  }

  if (['DOC', 'DOCX', 'RTF'].includes(normalized)) {
    return {
      icon: FileText,
      badgeClass: 'border border-blue-300/20 bg-blue-500/18 text-blue-100',
      iconClass: 'text-blue-100',
    }
  }

  if (['TXT', 'MD'].includes(normalized)) {
    return {
      icon: NotebookText,
      badgeClass: 'border border-slate-200/15 bg-slate-400/18 text-slate-100',
      iconClass: 'text-slate-100',
    }
  }

  if (['PPT', 'PPTX', 'KEY'].includes(normalized)) {
    return {
      icon: Presentation,
      badgeClass: 'border border-orange-300/20 bg-orange-500/18 text-orange-100',
      iconClass: 'text-orange-100',
    }
  }

  if (['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(normalized)) {
    return {
      icon: FileArchive,
      badgeClass: 'border border-amber-300/20 bg-amber-500/15 text-amber-200',
      iconClass: 'text-amber-200',
    }
  }

  if (['JSON', 'XML', 'JS', 'TS', 'HTML', 'CSS', 'SQL'].includes(normalized)) {
    return {
      icon: FileCode2,
      badgeClass: 'border border-violet-300/20 bg-violet-500/15 text-violet-200',
      iconClass: 'text-violet-200',
    }
  }

  return {
    icon: FileBadge2,
    badgeClass: 'border border-slate-300/20 bg-slate-500/15 text-slate-200',
    iconClass: 'text-slate-100',
  }
}

function getAttachmentCardTone(label: string, mimeType: string | undefined, isOwn: boolean) {
  const normalized = label.toUpperCase()

  if (mimeType?.startsWith('video/')) {
    return isOwn ? 'bg-[#2a1940]/85' : 'bg-[#241833]/95'
  }
  if (mimeType?.startsWith('audio/')) {
    return isOwn ? 'bg-[#12312e]/85' : 'bg-[#102926]/95'
  }
  if (['PDF'].includes(normalized)) {
    return isOwn ? 'bg-[#3a2230]/85' : 'bg-[#301d29]/95'
  }
  if (['XLS', 'XLSX', 'CSV'].includes(normalized)) {
    return isOwn ? 'bg-[#15362b]/85' : 'bg-[#112c23]/95'
  }
  if (['DOC', 'DOCX', 'RTF'].includes(normalized)) {
    return isOwn ? 'bg-[#1b3050]/85' : 'bg-[#172945]/95'
  }
  if (['PPT', 'PPTX', 'KEY'].includes(normalized)) {
    return isOwn ? 'bg-[#442717]/85' : 'bg-[#382113]/95'
  }
  if (['TXT', 'MD'].includes(normalized)) {
    return isOwn ? 'bg-[#2d3440]/85' : 'bg-[#252b35]/95'
  }
  if (['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(normalized)) {
    return isOwn ? 'bg-[#43320f]/85' : 'bg-[#38290d]/95'
  }
  if (['JSON', 'XML', 'JS', 'TS', 'HTML', 'CSS', 'SQL'].includes(normalized)) {
    return isOwn ? 'bg-[#30244d]/85' : 'bg-[#281f40]/95'
  }

  return isOwn ? 'bg-black/20' : 'bg-[#111b21]/95 dark:bg-[#111b21]/95'
}

interface ReplyTo {
  id: string
  content: string
  author: { id: string; name: string | null; email: string }
}

interface Message {
  id: string
  content: string
  type: MessageType
  isInternal: boolean
  createdAt: Date
  attachments: string[]
  replyTo?: ReplyTo | null
  reactions?: Array<{
    id: string
    emoji: string
    user: {
      id: string
      name: string | null
      email: string
    }
  }>
  author: {
    id: string
    name: string | null
    email: string
    avatar: string | null
    role: UserRole
  }
}

interface MessageListProps {
  ticketId: string
  ticket: {
    id: string
    description: string | null
    attachments?: string[]
    createdAt: Date
    customer: {
      id: string
      name: string | null
      email: string
      avatar: string | null
    }
  }
  messages: Message[]
  currentUserId: string
  pinnedMessageId?: string | null
  onReply?: (message: ReplyTo) => void
  onPinChange?: (messageId: string | null) => void
  onDeleteMessage?: (id: string) => void
}

export default function MessageList({
  ticketId,
  ticket,
  messages,
  currentUserId,
  pinnedMessageId,
  onReply,
  onPinChange,
  onDeleteMessage,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevLengthRef = useRef(messages.length)
  const reactionPickerRef = useRef<HTMLDivElement>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [activeReactionPicker, setActiveReactionPicker] = useState<string | null>(null)
  const [expandedReactionPicker, setExpandedReactionPicker] = useState<string | null>(null)
  const [reactionSearch, setReactionSearch] = useState('')
  const [reactionOverrides, setReactionOverrides] = useState<Record<string, Message['reactions']>>({})
  const [quickReactions, setQuickReactions] = useState<string[]>([...DEFAULT_REACTIONS])
  const [failedImages, setFailedImages] = useState<Record<string, true>>({})
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [messagePendingDelete, setMessagePendingDelete] = useState<string | null>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!lightboxUrl) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxUrl(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [lightboxUrl])

  useEffect(() => {
    if (!activeReactionPicker) return

    const handlePointerDown = (event: MouseEvent) => {
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target as Node)) {
        setActiveReactionPicker(null)
        setExpandedReactionPicker(null)
        setReactionSearch('')
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [activeReactionPicker])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(max-width: 639px)')
    const syncViewportMode = () => setIsMobileViewport(mediaQuery.matches)

    syncViewportMode()
    mediaQuery.addEventListener('change', syncViewportMode)
    return () => mediaQuery.removeEventListener('change', syncViewportMode)
  }, [])

  useEffect(() => {
    if (!activeActionMenu) return

    const handlePointerDown = () => {
      setActiveActionMenu(null)
    }

    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('mousedown', handlePointerDown)

    return () => {
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [activeActionMenu])

  useEffect(() => {
    try {
      const rawUsage = window.localStorage.getItem(REACTION_USAGE_STORAGE_KEY)
      if (!rawUsage) return

      const usage = JSON.parse(rawUsage) as Record<string, number>
      const sortedReactions = [...ALL_REACTIONS]
        .sort((left, right) => (usage[right] || 0) - (usage[left] || 0))
      const uniqueQuick = Array.from(new Set(sortedReactions)).slice(0, DEFAULT_REACTIONS.length)
      if (uniqueQuick.length) setQuickReactions(uniqueQuick)
    } catch {
      // Ignore malformed local storage values.
    }
  }, [])

  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
    prevLengthRef.current = messages.length
  }, [messages.length])

  const handlePin = async (messageId: string) => {
    setActiveActionMenu(null)
    const newPinned = pinnedMessageId === messageId ? null : messageId
    onPinChange?.(newPinned)
    await fetch(`/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinnedMessageId: newPinned }),
    })
  }

  const handleDeleteMessage = async (messageId: string) => {
    setActiveActionMenu(null)
    onDeleteMessage?.(messageId)
    await fetch(`/api/messages/${messageId}`, { method: 'DELETE' })
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      setActiveActionMenu(null)
      setActiveReactionPicker(null)
      setExpandedReactionPicker(null)
      setReactionSearch('')
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      })

      if (!response.ok) {
        throw new Error('No se pudo actualizar la reaccion')
      }

      const data = await response.json()
      setReactionOverrides((prev) => ({
        ...prev,
        [messageId]: Array.isArray(data.reactions) ? data.reactions : prev[messageId],
      }))

      try {
        const rawUsage = window.localStorage.getItem(REACTION_USAGE_STORAGE_KEY)
        const usage = rawUsage ? JSON.parse(rawUsage) as Record<string, number> : {}
        usage[emoji] = (usage[emoji] || 0) + 1
        window.localStorage.setItem(REACTION_USAGE_STORAGE_KEY, JSON.stringify(usage))

        const nextQuick = [...ALL_REACTIONS]
          .sort((left, right) => (usage[right] || 0) - (usage[left] || 0))
          .slice(0, DEFAULT_REACTIONS.length)
        setQuickReactions(Array.from(new Set(nextQuick)))
      } catch {
        // Ignore local storage errors without affecting reactions.
      }
    } catch (error) {
      console.error('Error updating reaction:', error)
    }
  }

  const customerColor = getUserColor(ticket.customer.id)
  const pinnedMessage = pinnedMessageId ? messages.find((m) => m.id === pinnedMessageId) : null

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const bindLongPress = (messageId: string) => {
    if (!isMobileViewport) return {}

    return {
      onTouchStart: () => {
        clearLongPressTimer()
        longPressTimerRef.current = setTimeout(() => {
          setActiveActionMenu(messageId)
          if (navigator.vibrate) navigator.vibrate(10)
        }, 450)
      },
      onTouchEnd: clearLongPressTimer,
      onTouchCancel: clearLongPressTimer,
      onTouchMove: clearLongPressTimer,
      onContextMenu: (event: React.MouseEvent) => {
        event.preventDefault()
        setActiveActionMenu(messageId)
      },
    }
  }

  const ActionButtons = ({
    messageId,
    message,
    isPinned,
    isOwn,
  }: {
    messageId: string
    message: Message
    isPinned: boolean
    isOwn: boolean
  }) => (
    <div
      onClick={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      className={`${activeReactionPicker === messageId || activeActionMenu === messageId ? 'flex' : 'hidden'} ${isMobileViewport ? '' : 'sm:group-hover:flex'} max-w-full flex-shrink-0 items-center gap-0.5 self-start rounded-md border border-gray-200 bg-white px-1 py-0.5 shadow-sm dark:border-slate-600 dark:bg-slate-700 ${isOwn ? 'order-last sm:order-first' : 'order-last'} mt-1 sm:mt-0 sm:self-center`}
    >
      <div className="relative" ref={activeReactionPicker === messageId ? reactionPickerRef : null}>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            const nextId = activeReactionPicker === messageId ? null : messageId
            setActiveReactionPicker(nextId)
            if (nextId === null) {
              setExpandedReactionPicker(null)
              setReactionSearch('')
            }
          }}
          className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-100 rounded hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
          title="Reaccionar"
        >
          <SmilePlus className="h-3.5 w-3.5" />
        </button>

        {activeReactionPicker === messageId && (
          <div
            className={`absolute z-30 ${isOwn ? 'right-0' : 'left-0'} bottom-full mb-2 flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white px-2 py-2 shadow-xl dark:border-slate-600 dark:bg-slate-800`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-1">
              {quickReactions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={(event) => { event.stopPropagation(); handleReaction(messageId, emoji) }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition-transform hover:scale-110 hover:bg-gray-100 dark:hover:bg-slate-700"
                  title={`Reaccionar con ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setExpandedReactionPicker((prev) => {
                    const nextValue = prev === messageId ? null : messageId
                    if (nextValue === null) setReactionSearch('')
                    return nextValue
                  })
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700"
                title="Mas reacciones"
              >
                +
              </button>
            </div>

            {expandedReactionPicker === messageId && (
              <div className="w-[22rem] max-w-[80vw] border-t border-gray-200 pt-2 dark:border-slate-600">
                <div className="relative mb-3">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={reactionSearch}
                    onChange={(event) => setReactionSearch(event.target.value)}
                    placeholder="Buscar"
                    className="w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 outline-none transition-colors focus:border-primary-400 dark:border-slate-600 dark:bg-slate-900 dark:text-gray-100"
                  />
                </div>

                <div className="max-h-72 overflow-y-auto pr-1">
                  <div className="mb-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      Uso frecuente
                    </p>
                    <div className="grid grid-cols-7 gap-1">
                      {quickReactions.map((emoji) => (
                        <button
                          key={`quick-${emoji}`}
                          type="button"
                          onClick={(event) => { event.stopPropagation(); handleReaction(messageId, emoji) }}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-xl transition-transform hover:scale-110 hover:bg-gray-100 dark:hover:bg-slate-700"
                          title={`Usar ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      Todas las reacciones
                    </p>
                    <div className="grid grid-cols-7 gap-1">
                      {ALL_REACTIONS.filter((emoji) => !reactionSearch || emoji.includes(reactionSearch)).map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={(event) => { event.stopPropagation(); handleReaction(messageId, emoji) }}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-xl transition-transform hover:scale-110 hover:bg-gray-100 dark:hover:bg-slate-700"
                          title={`Usar ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {onReply && (
        <button
          onClick={() => {
            setActiveActionMenu(null)
            onReply({ id: messageId, content: message.content, author: message.author })
          }}
          className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-100 rounded hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
          title="Responder"
        >
          <Reply className="h-3.5 w-3.5" />
        </button>
      )}
      {onPinChange && (
        <button
          onClick={() => handlePin(messageId)}
          className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors ${isPinned ? 'text-amber-500' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-100'}`}
          title={isPinned ? 'Desfijar' : 'Fijar'}
        >
          {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
        </button>
      )}
      {isOwn && onDeleteMessage && (
        <button
          onClick={() => setMessagePendingDelete(messageId)}
          className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
          title="Eliminar"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )

  const renderReactions = (message: Message, isOwn: boolean) => {
    const reactions = reactionOverrides[message.id] ?? message.reactions

    if (!reactions?.length) return null

    const groupedReactions = reactions.reduce<Array<{
      emoji: string
      count: number
      reactedByCurrentUser: boolean
      label: string
    }>>((acc, reaction) => {
      const existingGroup = acc.find((item) => item.emoji === reaction.emoji)
      const displayName = reaction.user.name || reaction.user.email

      if (existingGroup) {
        existingGroup.count += 1
        existingGroup.reactedByCurrentUser = existingGroup.reactedByCurrentUser || reaction.user.id === currentUserId
        existingGroup.label = `${existingGroup.label}, ${displayName}`
        return acc
      }

      acc.push({
        emoji: reaction.emoji,
        count: 1,
        reactedByCurrentUser: reaction.user.id === currentUserId,
        label: displayName,
      })
      return acc
    }, [])

    return (
      <div className={`mt-2 flex flex-wrap gap-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        {groupedReactions.map((reaction) => (
          <button
            key={reaction.emoji}
            type="button"
            onClick={() => handleReaction(message.id, reaction.emoji)}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition-colors ${
              reaction.reactedByCurrentUser
                ? 'border-primary-400/60 bg-primary-500/15 text-primary-100'
                : isOwn
                  ? 'border-white/15 bg-white/10 text-white/90 hover:bg-white/15'
                  : 'border-gray-200 bg-white/90 text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-700/80 dark:text-gray-200 dark:hover:bg-slate-700'
            }`}
            title={reaction.label}
          >
            <span>{reaction.emoji}</span>
            <span>{reaction.count}</span>
          </button>
        ))}
      </div>
    )
  }

  const renderAttachments = (attachments: string[], isOwn: boolean) => {
    if (!attachments.length) return null

    const fileMetaClass = isOwn ? 'text-white/65' : 'text-slate-300'
    const fileIconClass = isOwn ? 'bg-white/10 text-white' : 'bg-white/10 text-slate-100'
    const fileDownloadClass = isOwn
      ? 'text-white/80 hover:bg-white/10 hover:text-white'
      : 'text-slate-200 hover:bg-white/10 hover:text-white'

    return (
      <div className="mt-1.5 space-y-2 max-w-full">
        {attachments.map((rawAttachment, index) => {
          const attachment = parseAttachmentRef(rawAttachment)
          const previewUrl = attachment.previewUrl || attachment.url
          const downloadUrl = attachment.downloadUrl || attachment.url
          const attachmentKey = `${attachment.fileId || attachment.url}-${index}`
          const fileSize = formatFileSize(attachment.size)
          const attachmentLabel = getAttachmentLabel(attachment.name, attachment.mimeType)
          const attachmentAppearance = getAttachmentAppearance(attachmentLabel, attachment.mimeType)
          const fileCardClass = `${getAttachmentCardTone(attachmentLabel, attachment.mimeType, isOwn)} text-white`
          const AttachmentIcon = attachmentAppearance.icon
          const shouldRenderInlineImage = attachment.displayInline !== false && isImageAttachment(attachment) && !failedImages[attachmentKey]

          const fileCard = (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex w-full max-w-full min-w-0 items-center gap-3 rounded-2xl px-3 py-3 text-xs shadow-none ring-0 outline-none ${fileCardClass}`}
              onClick={e => e.stopPropagation()}
            >
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 ${fileIconClass}`}>
                <AttachmentIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex flex-shrink-0 items-center rounded-md px-2 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase ${attachmentAppearance.badgeClass}`}>
                    {attachmentLabel}
                  </span>
                </div>
                <p className="mt-2 truncate text-sm font-semibold leading-tight">{attachment.name}</p>
                <div className={`mt-1 flex items-center gap-2 text-[11px] ${fileMetaClass}`}>
                  {fileSize && <span>{fileSize}</span>}
                  {!fileSize && <span>Archivo adjunto</span>}
                </div>
              </div>
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-105 ${fileDownloadClass}`}>
                <Download className="h-4 w-4" />
              </div>
            </a>
          )

          if (shouldRenderInlineImage) {
            return (
              <div key={index} className="max-w-full sm:max-w-[280px]">
                <div
                  className="rounded-lg overflow-hidden cursor-zoom-in"
                  onClick={() => setLightboxUrl(previewUrl)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={attachment.name}
                    className="max-w-full rounded-lg hover:opacity-90 transition-opacity"
                    onError={() => {
                      setFailedImages((prev) => ({
                        ...prev,
                        [attachmentKey]: true,
                      }))
                    }}
                  />
                </div>
              </div>
            )
          }

          if (isVideoAttachment(attachment)) {
            return (
              <div key={index} className="max-w-full sm:max-w-[360px]">
                {fileCard}
              </div>
            )
          }

          if (attachment.mimeType?.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|webm)$/i.test(attachment.name)) {
            if (isRecordedAudioAttachment(attachment)) {
              return (
                <div key={index} className="w-full max-w-full sm:max-w-[360px]">
                  <div className={`w-full min-w-[260px] max-w-full rounded-xl px-3 py-3 sm:min-w-[320px] ${fileCardClass}`}>
                    <audio controls preload="metadata" className="block h-10 w-full min-w-0 max-w-full">
                      <source src={previewUrl} type={attachment.mimeType || 'audio/mpeg'} />
                      Tu navegador no puede reproducir este audio.
                    </audio>
                  </div>
                </div>
              )
            }

            return (
              <div key={index} className="max-w-full sm:max-w-[360px]">
                <div className={`rounded-xl px-3 py-3 ${fileCardClass}`}>
                  <div className="flex items-center gap-2">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${fileIconClass}`}>
                      <Mic className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium leading-tight">{attachment.name}</p>
                      <div className={`mt-1 flex items-center gap-2 text-[11px] ${fileMetaClass}`}>
                        <span>{attachmentLabel}</span>
                        {fileSize && <span>{fileSize}</span>}
                      </div>
                    </div>
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border ${fileDownloadClass}`}
                      onClick={e => e.stopPropagation()}
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div key={index} className="max-w-full sm:max-w-[360px]">
              {fileCard}
            </div>
          )
        })}
      </div>
    )
  }

  const renderMessage = (message: Message) => {
    const isSystem = message.type === 'SYSTEM'
    const isInternal = message.isInternal
    const isOwn = message.author.id === currentUserId
    const color = getUserColor(message.author.id)
    const isPinned = pinnedMessageId === message.id
    const bigEmoji = !message.attachments.length && isEmojiOnly(message.content)

    if (isSystem) {
      return (
        <div key={message.id} className="flex items-center gap-2 py-1">
          <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
          <p className="text-xs text-gray-400 dark:text-gray-500 px-2">
            <span className="font-medium">{message.author.name || message.author.email}</span>: {message.content}
          </p>
          <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
        </div>
      )
    }

    if (isOwn) {
      return (
        <div key={message.id} className="flex justify-end group" {...bindLongPress(message.id)}>
          <div className="flex max-w-[calc(100vw-4.5rem)] flex-col items-end gap-1 sm:max-w-[75%] sm:flex-row sm:items-end sm:gap-1.5">
            <ActionButtons messageId={message.id} message={message} isPinned={isPinned} isOwn />

            {bigEmoji ? (
              <div className="text-5xl leading-none select-none px-1">{message.content.trim()}</div>
            ) : (
              <div
                className={`relative min-w-0 max-w-full overflow-hidden rounded-2xl rounded-br-sm px-3 py-2 shadow-sm ${isInternal ? 'bg-yellow-200 text-yellow-900 dark:bg-yellow-800/50 dark:text-yellow-100' : 'bg-primary-600 text-white dark:bg-primary-700'} ${isPinned ? 'ring-2 ring-amber-400' : ''}`}
              >
                {message.replyTo && (
                  <div className="mb-1.5 pl-2 border-l-2 border-white/40 opacity-80">
                    <p className="text-xs font-medium line-clamp-1">
                      {message.replyTo.author.name || message.replyTo.author.email}
                    </p>
                    <p className="text-xs line-clamp-1 italic">{message.replyTo.content}</p>
                  </div>
                )}
                {isInternal && (
                  <span className="block text-xs font-medium text-yellow-700 dark:text-yellow-300 mb-1">
                    Nota interna
                  </span>
                )}
                {message.content && (
                  <p className="text-sm whitespace-pre-wrap leading-snug">{renderTextWithLinks(message.content, true)}</p>
                )}
                {renderAttachments(message.attachments, true)}
                {renderReactions(message, true)}
                <p className="text-right text-[10px] mt-1 opacity-60">
                  {format(new Date(message.createdAt), 'p', { locale: es })}
                </p>
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
        <div key={message.id} className="flex justify-start group" {...bindLongPress(message.id)}>
          <div className="flex max-w-[calc(100vw-4.5rem)] flex-col items-start gap-1 sm:max-w-[75%] sm:flex-row sm:items-end sm:gap-1.5">
            <div className="flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center self-end mb-0.5" style={{ backgroundColor: color.avatarBg }}>
              <span className="text-xs font-medium" style={{ color: color.avatarText }}>
                {message.author.name?.[0] || message.author.email[0].toUpperCase()}
            </span>
          </div>

          {bigEmoji ? (
            <>
              <div className="text-5xl leading-none select-none px-1">{message.content.trim()}</div>
              <ActionButtons messageId={message.id} message={message} isPinned={isPinned} isOwn={false} />
            </>
          ) : (
            <>
              <div
                className={`relative min-w-0 max-w-full overflow-hidden rounded-2xl rounded-bl-sm border-b border-l-4 border-r border-t border-b-gray-200 border-r-gray-200 border-t-gray-200 px-3 py-2 shadow-sm dark:border-b-slate-700 dark:border-r-slate-700 dark:border-t-slate-700 ${isInternal ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-white dark:bg-slate-800'} ${isPinned ? 'ring-2 ring-amber-400' : ''}`}
                style={{ borderLeftColor: color.borderColor }}
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-semibold" style={{ color: color.nameColor }}>
                    {message.author.name || message.author.email}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {format(new Date(message.createdAt), 'p', { locale: es })}
                  </span>
                  {isInternal && (
                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">â€¢ Nota interna</span>
                  )}
                </div>
                {message.replyTo && (
                  <div className="mb-1.5 pl-2 border-l-2 border-gray-300 dark:border-slate-500 opacity-70">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 line-clamp-1">
                      {message.replyTo.author.name || message.replyTo.author.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-1 italic">
                      {message.replyTo.content}
                    </p>
                  </div>
                )}
                {message.content && (
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-snug">
                    {renderTextWithLinks(message.content, false)}
                  </p>
                )}
                {renderAttachments(message.attachments, false)}
                {renderReactions(message, false)}
              </div>
              <ActionButtons messageId={message.id} message={message} isPinned={isPinned} isOwn={false} />
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {pinnedMessage && (
        <div className="sticky top-0 z-10 mb-2 flex items-start gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <Pin className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              {pinnedMessage.author.name || pinnedMessage.author.email}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-300 line-clamp-1">{pinnedMessage.content}</p>
          </div>
          <button onClick={() => handlePin(pinnedMessage.id)} className="flex-shrink-0 text-amber-400 hover:text-amber-600">
            <PinOff className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {ticket.description && (
        <div className="flex justify-start group" {...bindLongPress('description')}>
          <div className="flex max-w-[calc(100vw-4.5rem)] flex-col items-start gap-1 sm:max-w-[75%] sm:flex-row sm:items-end sm:gap-1.5">
            <div className="flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center self-end mb-0.5" style={{ backgroundColor: customerColor.avatarBg }}>
              <span className="text-xs font-medium" style={{ color: customerColor.avatarText }}>
                {ticket.customer.name?.[0] || ticket.customer.email[0].toUpperCase()}
              </span>
            </div>
            <div
              className="relative min-w-0 max-w-full overflow-hidden rounded-2xl rounded-bl-sm border-b border-l-4 border-r border-t border-b-gray-200 border-r-gray-200 border-t-gray-200 bg-white px-3 py-2 shadow-sm dark:border-b-slate-700 dark:border-r-slate-700 dark:border-t-slate-700 dark:bg-slate-800"
              style={{ borderLeftColor: customerColor.borderColor }}
            >
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs font-semibold" style={{ color: customerColor.nameColor }}>
                  {ticket.customer.name || ticket.customer.email}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  {format(new Date(ticket.createdAt), 'p', { locale: es })}
                </span>
                <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400">Descripcion</span>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-snug">
                {renderTextWithLinks(ticket.description, false)}
              </p>
              {renderAttachments(ticket.attachments || [], false)}
            </div>
            {onReply && (
              <div
                onClick={(event) => event.stopPropagation()}
                onTouchStart={(event) => event.stopPropagation()}
                className={`${activeActionMenu === 'description' ? 'flex' : 'hidden'} ${isMobileViewport ? '' : 'sm:group-hover:flex'} items-center self-center flex-shrink-0 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md shadow-sm px-1 py-0.5`}
              >
                <button
                  onClick={() => {
                    setActiveActionMenu(null)
                    onReply({
                      id: 'description',
                      content: ticket.description!,
                      author: { id: ticket.customer.id, name: ticket.customer.name, email: ticket.customer.email },
                    })
                  }}
                  className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-100 rounded hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  title="Responder"
                >
                  <Reply className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {messages.map(renderMessage)}

      <div ref={bottomRef} />

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
              <a
                href={lightboxUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="h-8 w-8 flex items-center justify-center bg-black/60 text-white rounded-full hover:bg-black/90 transition-colors"
                title="Abrir"
              >
                <Download className="h-4 w-4" />
              </a>
              <button
                onClick={() => setLightboxUrl(null)}
                className="h-8 w-8 flex items-center justify-center bg-black/60 text-white rounded-full hover:bg-black/90 transition-colors"
                title="Cerrar"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(messagePendingDelete)}
        onClose={() => setMessagePendingDelete(null)}
        onConfirm={() => {
          if (messagePendingDelete) {
            void handleDeleteMessage(messagePendingDelete)
          }
        }}
        title="Eliminar mensaje"
        message="¿Estás seguro de que deseas eliminar este mensaje?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  )
}




