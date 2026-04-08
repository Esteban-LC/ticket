import { EventEmitter } from 'events'

declare global {
  // eslint-disable-next-line no-var
  var _ticketEmitter: EventEmitter | undefined
}

if (!global._ticketEmitter) {
  global._ticketEmitter = new EventEmitter()
  global._ticketEmitter.setMaxListeners(200)
}

export const ticketEmitter = global._ticketEmitter
