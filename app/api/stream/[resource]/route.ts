import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { resourceEmitter, type ResourceEventName } from '@/lib/resourceEvents'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_RESOURCES = new Set<ResourceEventName>([
  'agenda',
  'events',
  'results',
  'reports',
  'workspace',
  'enrollments',
])

export async function GET(
  request: Request,
  { params }: { params: { resource: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const resource = params.resource as ResourceEventName
  if (!ALLOWED_RESOURCES.has(resource)) {
    return new Response('Not found', { status: 404 })
  }

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

      try {
        controller.enqueue(encoder.encode(': connected\n\n'))
      } catch {
        // ignore
      }

      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          clearInterval(ping)
        }
      }, 25000)

      resourceEmitter.on(`resource:${resource}`, enqueue)

      request.signal.addEventListener('abort', () => {
        clearInterval(ping)
        resourceEmitter.off(`resource:${resource}`, enqueue)
        try {
          controller.close()
        } catch {
          // already closed
        }
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
