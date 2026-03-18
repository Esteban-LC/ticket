'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import MessageList from './MessageList'
import MessageForm from './MessageForm'

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
    createdAt: Date
    customer: {
      id: string
      name: string | null
      email: string
      avatar: string | null
    }
  }
  messages: any[]
  currentUserId: string
  pinnedMessageId?: string | null
}

export default function TicketConversation({ ticket, messages: initialMessages, currentUserId, pinnedMessageId: initialPinned }: TicketConversationProps) {
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null)
  const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(initialPinned ?? null)
  const [messages, setMessages] = useState<any[]>(initialMessages)
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map())
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // SSE for real-time updates — replaces polling
  useEffect(() => {
    const es = new EventSource(`/api/tickets/${ticket.id}/stream`)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'message') {
          setMessages(prev =>
            prev.some(m => m.id === data.message.id) ? prev : [...prev, data.message]
          )
        } else if (data.type === 'delete') {
          setMessages(prev => prev.filter(m => m.id !== data.messageId))
        } else if (data.type === 'typing' && data.userId !== currentUserId) {
          // Clear existing timeout for this user
          const existing = typingTimeoutsRef.current.get(data.userId)
          if (existing) clearTimeout(existing)

          setTypingUsers(prev => new Map(prev).set(data.userId, data.userName))

          // Auto-clear after 3s of no new typing events
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
        // ignore parse errors
      }
    }

    return () => es.close()
  }, [ticket.id, currentUserId])

  const handleMessageSent = useCallback((message?: any) => {
    if (message?.id) {
      setMessages(prev =>
        prev.some(m => m.id === message.id) ? prev : [...prev, message]
      )
    }
  }, [])

  const handleDeleteMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id))
  }, [])

  const typingUserNames = Array.from(typingUsers.values())

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4">
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

      {/* Typing indicator */}
      {typingUsers.size > 0 && (
        <div className="px-4 py-1 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 select-none">
          <span>
            ({typingUserNames.join(', ')}){' '}
            {typingUsers.size === 1 ? 'está escribiendo' : 'están escribiendo'}...
          </span>
          <span className="flex gap-0.5 items-center">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce [animation-delay:300ms]" />
          </span>
        </div>
      )}

      <MessageForm
        ticketId={ticket.id}
        currentUserId={currentUserId}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
        onMessageSent={handleMessageSent}
        ticketStatus={ticket.status}
      />
    </div>
  )
}
