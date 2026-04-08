import { EventEmitter } from 'events'

export type ResourceEventName =
  | 'agenda'
  | 'events'
  | 'results'
  | 'reports'
  | 'workspace'
  | 'enrollments'

declare global {
  // eslint-disable-next-line no-var
  var _resourceEmitter: EventEmitter | undefined
}

if (!global._resourceEmitter) {
  global._resourceEmitter = new EventEmitter()
  global._resourceEmitter.setMaxListeners(500)
}

export const resourceEmitter = global._resourceEmitter

export function emitResourceEvent(resource: ResourceEventName, payload?: Record<string, unknown>) {
  resourceEmitter.emit(`resource:${resource}`, {
    resource,
    timestamp: new Date().toISOString(),
    ...payload,
  })
}
