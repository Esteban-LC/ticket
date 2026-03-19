'use client'
import { Info, X } from 'lucide-react'
import TicketConversation from './TicketConversation'
import TicketSidebar from './TicketSidebar'
import { InteractionType, TicketType } from '@prisma/client'

interface TicketBodyProps {
  ticket: {
    id: string
    description: string | null
    attachments?: string[]
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
  initialHasMoreMessages?: boolean
  currentUserId: string
  interactions: Array<{
    id: string
    type: InteractionType
    title: string
    createdAt: Date
    user: { id: string; name: string | null }
  }>
  isRequester: boolean
  detailsOpen: boolean
  onOpenDetails: () => void
  onCloseDetails: () => void
}

export default function TicketBody({
  ticket,
  messages,
  initialHasMoreMessages,
  currentUserId,
  interactions,
  isRequester,
  detailsOpen,
  onOpenDetails,
  onCloseDetails,
}: TicketBodyProps) {
  return (
    <div className="relative flex-1 min-h-0 overflow-hidden">
      <div className="h-full min-h-0">
        <TicketConversation
          ticket={ticket}
          messages={messages}
          initialHasMoreMessages={initialHasMoreMessages}
          currentUserId={currentUserId}
          pinnedMessageId={ticket.pinnedMessageId}
        />
      </div>

      {detailsOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm"
          onClick={onCloseDetails}
        >
          <div
            className="absolute inset-y-0 right-0 w-full sm:w-[24rem] lg:w-[28rem] bg-gray-50 dark:bg-slate-800 shadow-2xl flex flex-col border-l border-gray-200 dark:border-slate-700"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Detalles del ticket</h3>
              </div>
              <button
                onClick={onCloseDetails}
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <TicketSidebar
                ticket={ticket}
                interactions={interactions}
                isRequester={isRequester}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
