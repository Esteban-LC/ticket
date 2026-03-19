'use client'

import { useState } from 'react'
import TicketHeader from './TicketHeader'
import TicketBody from './TicketBody'

interface TicketDetailClientProps {
  ticket: any
  messages: any[]
  initialHasMoreMessages?: boolean
  currentUserId: string
  interactions: any[]
  isRequester: boolean
  canDelete?: boolean
  isCoordinator?: boolean
  isAdminDept?: boolean
}

export default function TicketDetailClient({
  ticket,
  messages,
  initialHasMoreMessages,
  currentUserId,
  interactions,
  isRequester,
  canDelete,
  isCoordinator,
  isAdminDept,
}: TicketDetailClientProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <>
      <TicketHeader
        ticket={ticket}
        isRequester={isRequester}
        canDelete={canDelete}
        isCoordinator={isCoordinator}
        isAdminDept={isAdminDept}
        currentUserId={currentUserId}
        onOpenDetails={() => setDetailsOpen(true)}
      />

      <TicketBody
        ticket={ticket}
        messages={messages}
        initialHasMoreMessages={initialHasMoreMessages}
        currentUserId={currentUserId}
        interactions={interactions}
        isRequester={isRequester}
        detailsOpen={detailsOpen}
        onOpenDetails={() => setDetailsOpen(true)}
        onCloseDetails={() => setDetailsOpen(false)}
      />
    </>
  )
}
