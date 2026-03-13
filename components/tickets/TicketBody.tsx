'use client'

import { useState } from 'react'
import { MessageSquare, Info } from 'lucide-react'
import TicketConversation from './TicketConversation'
import TicketSidebar from './TicketSidebar'
import { InteractionType, TicketType } from '@prisma/client'

interface TicketBodyProps {
  ticket: {
    id: string
    description: string | null
    createdAt: Date
    updatedAt: Date
    status: string
    type: TicketType | null
    hours: number | null
    pinnedMessageId?: string | null
    customer: {
      id: string
      name: string | null
      email: string
      avatar: string | null
      phone: string | null
      location: string | null
      createdAt: Date
    }
    category: { id: string; name: string } | null
    assignee: { id: string; name: string | null; email: string } | null
    tags: string[]
  }
  messages: any[]
  currentUserId: string
  interactions: Array<{
    id: string
    type: InteractionType
    title: string
    createdAt: Date
    user: { id: string; name: string | null }
  }>
  isRequester: boolean
}

export default function TicketBody({
  ticket,
  messages,
  currentUserId,
  interactions,
  isRequester,
}: TicketBodyProps) {
  const [activeTab, setActiveTab] = useState<'conversation' | 'details'>('conversation')

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Mobile tab bar */}
      <div className="flex lg:hidden shrink-0 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <button
          onClick={() => setActiveTab('conversation')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'conversation'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Conversación
        </button>
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'details'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Info className="h-4 w-4" />
          Detalles
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Conversation panel */}
        <div className={`flex-1 flex flex-col overflow-hidden min-h-0 ${activeTab !== 'conversation' ? 'hidden lg:flex' : 'flex'}`}>
          <TicketConversation
            ticket={ticket}
            messages={messages}
            currentUserId={currentUserId}
            pinnedMessageId={ticket.pinnedMessageId}
          />
        </div>

        {/* Sidebar panel */}
        <div className={`overflow-y-auto bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 ${
          activeTab !== 'details'
            ? 'hidden lg:block lg:w-80 lg:shrink-0 lg:border-l'
            : 'flex-1'
        }`}>
          <TicketSidebar
            ticket={ticket}
            interactions={interactions}
            isRequester={isRequester}
          />
        </div>
      </div>
    </div>
  )
}
