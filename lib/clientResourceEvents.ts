'use client'

import type { ResourceEventName } from '@/lib/resourceEvents'

const CHANNEL_NAME = 'tilm-resource-events'

export function emitClientResourceEvent(resource: ResourceEventName, payload?: Record<string, unknown>) {
  if (typeof window === 'undefined') {
    return
  }
  const currentWindow: Window = window

  const message = {
    resource,
    timestamp: new Date().toISOString(),
    ...payload,
  }

  if ('BroadcastChannel' in currentWindow) {
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channel.postMessage(message)
    channel.close()
    return
  }

  currentWindow.dispatchEvent(new CustomEvent(CHANNEL_NAME, { detail: message }))
}
