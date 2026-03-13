'use client'

import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { MessageType, UserRole } from '@prisma/client'
import { Reply, Pin, PinOff, Trash2, Download, X as XIcon } from 'lucide-react'

function getUserColor(userId: string) {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) & 0xffff
  }
  const hue = Math.round((hash * 137) % 360)
  return {
    borderColor: `hsl(${hue}, 70%, 55%)`,
    nameColor:   `hsl(${hue}, 70%, 65%)`,
    avatarBg:    `hsl(${hue}, 45%, 18%)`,
    avatarText:  `hsl(${hue}, 75%, 78%)`,
  }
}

// Detect if a string is purely emoji characters (for big display)
function isEmojiOnly(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed || trimmed.length > 12) return false
  // Remove emoji and whitespace — if nothing remains, it's emoji-only
  return !/[^\p{Emoji}\u200d\ufe0f\s]/u.test(trimmed)
}

// Render text with clickable URLs
const URL_REGEX = /https?:\/\/[^\s<>"]+/g
function renderTextWithLinks(text: string, isOwn: boolean) {
  const parts = text.split(URL_REGEX)
  const matches = text.match(URL_REGEX) || []
  return parts.reduce<React.ReactNode[]>((acc, part, i) => {
    if (part) acc.push(part)
    if (matches[i]) acc.push(
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
    return acc
  }, [])
}

// Check if an attachment URL is an image
function isImageAttachment(url: string): boolean {
  return url.startsWith('/uploads/messages/') || /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url)
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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!lightboxUrl) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxUrl(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [lightboxUrl])

  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
    prevLengthRef.current = messages.length
  }, [messages.length])

  const handlePin = async (messageId: string) => {
    const newPinned = pinnedMessageId === messageId ? null : messageId
    onPinChange?.(newPinned)
    await fetch(`/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinnedMessageId: newPinned }),
    })
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('¿Eliminar este mensaje?')) return
    onDeleteMessage?.(messageId)
    await fetch(`/api/messages/${messageId}`, { method: 'DELETE' })
  }

  const customerColor = getUserColor(ticket.customer.id)
  const pinnedMessage = pinnedMessageId ? messages.find((m) => m.id === pinnedMessageId) : null

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
    <div className={`hidden group-hover:flex items-center gap-0.5 self-center flex-shrink-0
      bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600
      rounded-md shadow-sm px-1 py-0.5 ${isOwn ? 'order-first' : 'order-last'}`}
    >
      {onReply && (
        <button
          onClick={() => onReply({ id: messageId, content: message.content, author: message.author })}
          className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-100 rounded hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
          title="Responder"
        >
          <Reply className="h-3.5 w-3.5" />
        </button>
      )}
      {onPinChange && (
        <button
          onClick={() => handlePin(messageId)}
          className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors ${
            isPinned ? 'text-amber-500' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-100'
          }`}
          title={isPinned ? 'Desfijar' : 'Fijar'}
        >
          {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
        </button>
      )}
      {isOwn && onDeleteMessage && (
        <button
          onClick={() => handleDeleteMessage(messageId)}
          className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
          title="Eliminar"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )

  const renderAttachments = (attachments: string[], isOwn: boolean) => {
    if (!attachments.length) return null
    return (
      <div className="mt-1.5 space-y-1.5">
        {attachments.map((url, i) =>
          isImageAttachment(url) ? (
            <div
              key={i}
              className="rounded-lg overflow-hidden max-w-[240px] cursor-zoom-in"
              onClick={() => setLightboxUrl(url)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="imagen adjunta"
                className="max-w-full rounded-lg hover:opacity-90 transition-opacity"
              />
            </div>
          ) : (
            <div key={i} className={`flex items-center gap-1 text-xs ${isOwn ? 'opacity-80' : 'text-primary-600'}`}>
              <span>📎 {url.split('/').pop()}</span>
            </div>
          )
        )}
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
        <div key={message.id} className="flex justify-end group">
          <div className="flex items-end gap-1.5 max-w-[75%]">
            <ActionButtons messageId={message.id} message={message} isPinned={isPinned} isOwn />

            {bigEmoji ? (
              <div className="text-5xl leading-none select-none px-1">
                {message.content.trim()}
              </div>
            ) : (
              <div className={`relative rounded-2xl rounded-br-sm px-3 py-2 shadow-sm
                ${isInternal
                  ? 'bg-yellow-200 dark:bg-yellow-800/50 text-yellow-900 dark:text-yellow-100'
                  : 'bg-primary-600 dark:bg-primary-700 text-white'
                }
                ${isPinned ? 'ring-2 ring-amber-400' : ''}
              `}>
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
      <div key={message.id} className="flex justify-start group">
        <div className="flex items-end gap-1.5 max-w-[75%]">
          <div className="flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center self-end mb-0.5"
               style={{ backgroundColor: color.avatarBg }}>
            <span className="text-xs font-medium" style={{ color: color.avatarText }}>
              {message.author.name?.[0] || message.author.email[0].toUpperCase()}
            </span>
          </div>

          {bigEmoji ? (
            <>
              <div className="text-5xl leading-none select-none px-1">
                {message.content.trim()}
              </div>
              <ActionButtons messageId={message.id} message={message} isPinned={isPinned} isOwn={false} />
            </>
          ) : (
            <>
              <div className={`relative rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm border-t border-r border-b border-t-gray-200 border-r-gray-200 border-b-gray-200 dark:border-t-slate-700 dark:border-r-slate-700 dark:border-b-slate-700 border-l-4
                ${isInternal ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-white dark:bg-slate-800'}
                ${isPinned ? 'ring-2 ring-amber-400' : ''}
              `} style={{ borderLeftColor: color.borderColor }}>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-semibold" style={{ color: color.nameColor }}>
                    {message.author.name || message.author.email}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {format(new Date(message.createdAt), 'p', { locale: es })}
                  </span>
                  {isInternal && (
                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">• Nota interna</span>
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
        <div className="flex justify-start group">
          <div className="flex items-end gap-1.5 max-w-[75%]">
            <div className="flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center self-end mb-0.5"
                 style={{ backgroundColor: customerColor.avatarBg }}>
              <span className="text-xs font-medium" style={{ color: customerColor.avatarText }}>
                {ticket.customer.name?.[0] || ticket.customer.email[0].toUpperCase()}
              </span>
            </div>
            <div className="relative rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm border-t border-r border-b border-t-gray-200 border-r-gray-200 border-b-gray-200 dark:border-t-slate-700 dark:border-r-slate-700 dark:border-b-slate-700 border-l-4 bg-white dark:bg-slate-800"
                 style={{ borderLeftColor: customerColor.borderColor }}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs font-semibold" style={{ color: customerColor.nameColor }}>
                  {ticket.customer.name || ticket.customer.email}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  {format(new Date(ticket.createdAt), 'p', { locale: es })}
                </span>
                <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400">Descripción</span>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-snug">
                {renderTextWithLinks(ticket.description, false)}
              </p>
            </div>
            {onReply && (
              <div className="hidden group-hover:flex items-center self-center flex-shrink-0
                bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600
                rounded-md shadow-sm px-1 py-0.5">
                <button
                  onClick={() => onReply({
                    id: 'description',
                    content: ticket.description!,
                    author: { id: ticket.customer.id, name: ticket.customer.name, email: ticket.customer.email },
                  })}
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
              <a
                href={lightboxUrl}
                download
                onClick={e => e.stopPropagation()}
                className="h-8 w-8 flex items-center justify-center bg-black/60 text-white rounded-full hover:bg-black/90 transition-colors"
                title="Descargar"
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
    </div>
  )
}
