'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import MessageList from './MessageList'
import MessageForm from './MessageForm'
import { ChevronUp, Loader2 } from 'lucide-react'

interface ReplyTo {
  id: string
  content: string
  author: { id: string; name: string | null; email: string }
}

interface TicketConversationProps {
  ticket: {
    id: string
    status: string
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
  messages: any[]
  initialHasMoreMessages?: boolean
  currentUserId: string
  pinnedMessageId?: string | null
}

export default function TicketConversation({ ticket, messages: initialMessages, initialHasMoreMessages, currentUserId, pinnedMessageId: initialPinned }: TicketConversationProps) {
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null)
  const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(initialPinned ?? null)
  const [messages, setMessages] = useState<any[]>(initialMessages)
  const [hasMore, setHasMore] = useState(initialHasMoreMessages ?? false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map())
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const loadOlderMessages = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return
    setLoadingMore(true)
    try {
      const oldest = messages[0]
      const res = await fetch(`/api/messages?ticketId=${ticket.id}&before=${oldest.id}&limit=50`)
      if (!res.ok) return
      const data = await res.json()
      setMessages(prev => [...data.messages, ...prev])
      setHasMore(data.hasMore)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, messages, ticket.id])

  useEffect(() => {
    const es = new EventSource(`/api/tickets/${ticket.id}/stream`)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'message') {
          setMessages(prev => (prev.some(m => m.id === data.message.id) ? prev : [...prev, data.message]))
        } else if (data.type === 'reaction') {
          setMessages(prev =>
            prev.map(message =>
              message.id === data.messageId
                ? { ...message, reactions: data.reactions }
                : message
            )
          )
        } else if (data.type === 'delete') {
          setMessages(prev => prev.filter(m => m.id !== data.messageId))
        } else if (data.type === 'typing' && data.userId !== currentUserId) {
          const existing = typingTimeoutsRef.current.get(data.userId)
          if (existing) clearTimeout(existing)

          setTypingUsers(prev => new Map(prev).set(data.userId, data.userName))

          const timeout = setTimeout(() => {
            setTypingUsers(prev => {
              const next = new Map(prev)
              next.delete(data.userId)
              return next
            })
            typingTimeoutsRef.current.delete(data.userId)
          }, 3000)

          typingTimeoutsRef.current.set(data.userId, timeout)
        }
      } catch {
        // Ignore parse errors from malformed SSE payloads.
      }
    }

    return () => es.close()
  }, [ticket.id, currentUserId])

  const handleMessageSent = useCallback((message?: any) => {
    if (message?.id) {
      setMessages(prev => (prev.some(m => m.id === message.id) ? prev : [...prev, message]))
    }
  }, [])

  const handleDeleteMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id))
  }, [])

  const typingUserNames = Array.from(typingUsers.values())
  const chatBackdropStyle = {
    backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
    backgroundSize: '22px 22px',
  } satisfies React.CSSProperties

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#efeae2] dark:bg-[#0b141a]">
      <div className="flex-1 min-h-0 overflow-y-auto" style={chatBackdropStyle}>
        <div className="max-w-5xl mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
          {hasMore && (
            <div className="flex justify-center mb-3">
              <button
                onClick={loadOlderMessages}
                disabled={loadingMore}
                className="flex items-center gap-1.5 rounded-full bg-white/80 dark:bg-slate-700/80 px-4 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 shadow hover:bg-white dark:hover:bg-slate-700 disabled:opacity-60 transition-colors"
              >
                {loadingMore
                  ? <><Loader2 className="h-3 w-3 animate-spin" /> Cargando...</>
                  : <><ChevronUp className="h-3 w-3" /> Cargar mensajes anteriores</>
                }
              </button>
            </div>
          )}
          <MessageList
            ticketId={ticket.id}
            ticket={ticket}
            messages={messages}
            currentUserId={currentUserId}
            pinnedMessageId={pinnedMessageId}
            onReply={(message) => setReplyTo(message)}
            onPinChange={(id) => setPinnedMessageId(id)}
            onDeleteMessage={handleDeleteMessage}
          />
        </div>
      </div>

      {typingUsers.size > 0 ? (
        <div
          className="shrink-0 px-4 py-1.5 text-xs text-gray-500 select-none dark:text-gray-400"
          style={chatBackdropStyle}
        >
          <div className="max-w-5xl mx-auto flex items-center gap-2">
            <span>
              ({typingUserNames.join(', ')}) {typingUsers.size === 1 ? 'esta escribiendo' : 'estan escribiendo'}...
            </span>
            <span className="flex gap-0.5 items-center">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce [animation-delay:300ms]" />
            </span>
          </div>
        </div>
      ) : (
        <div className="shrink-0 h-0" />
      )}

      <div className="shrink-0" style={chatBackdropStyle}>
        <div className="max-w-5xl mx-auto">
          <MessageForm
            ticketId={ticket.id}
            currentUserId={currentUserId}
            replyTo={replyTo}
            onClearReply={() => setReplyTo(null)}
            onMessageSent={handleMessageSent}
            ticketStatus={ticket.status}
          />
        </div>
      </div>
    </div>
  )
}
