import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ticketEmitter } from '@/lib/sseEmitter'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  ticketEmitter.emit(`ticket:${params.id}`, {
    type: 'typing',
    userId: session.user.id,
    userName: session.user.name || session.user.email || 'Alguien',
  })

  return NextResponse.json({ ok: true })
}
