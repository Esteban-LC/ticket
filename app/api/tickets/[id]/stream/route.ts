import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ticketEmitter } from '@/lib/sseEmitter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const ticketId = params.id
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const enqueue = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {
          // stream may be closed
        }
      }

      // Initial comment
      try {
        controller.enqueue(encoder.encode(': connected\n\n'))
      } catch { /* ignore */ }

      // Keepalive every 25s
      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          clearInterval(ping)
        }
      }, 25000)

      ticketEmitter.on(`ticket:${ticketId}`, enqueue)

      request.signal.addEventListener('abort', () => {
        clearInterval(ping)
        ticketEmitter.off(`ticket:${ticketId}`, enqueue)
        try { controller.close() } catch { /* already closed */ }
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    }
  })
}
