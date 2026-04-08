'use client'

import { useEffect, useRef } from 'react'
import type { ResourceEventName } from '@/lib/resourceEvents'

export function useResourceStream(resource: ResourceEventName, onEvent: () => void) {
  const onEventRef = useRef(onEvent)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    const es = new EventSource(`/api/stream/${resource}`)
    let channel: BroadcastChannel | null = null
    const currentWindow: Window | null = typeof window !== 'undefined' ? window : null

    const handleLocalMessage = (payload?: { resource?: string }) => {
      if (!payload || payload.resource !== resource) {
        return
      }
      onEventRef.current()
    }

    es.onmessage = () => {
      onEventRef.current()
    }

    if (currentWindow && 'BroadcastChannel' in currentWindow) {
      channel = new BroadcastChannel('tilm-resource-events')
      channel.onmessage = (event) => handleLocalMessage(event.data)
    } else if (currentWindow) {
      const listener = (event: Event) => handleLocalMessage((event as CustomEvent).detail)
      currentWindow.addEventListener('tilm-resource-events', listener)

      return () => {
        es.close()
        currentWindow.removeEventListener('tilm-resource-events', listener)
      }
    }

    return () => {
      es.close()
      if (channel) {
        channel.close()
      }
    }
  }, [resource])
}
