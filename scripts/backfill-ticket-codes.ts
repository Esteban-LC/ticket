import { prisma } from '../lib/prisma'
import { generateTicketCode } from '../lib/ticket-code'

async function main() {
  const tickets = await prisma.ticket.findMany({
    where: {
      ticketCode: null,
    },
    include: {
      customer: {
        select: {
          department: {
            select: {
              name: true,
            }
          }
        }
      }
    },
    orderBy: [
      { createdAt: 'asc' },
      { number: 'asc' },
    ],
  })

  console.log(`Tickets sin folio: ${tickets.length}`)

  for (const ticket of tickets) {
    const ticketCode = await prisma.$transaction(async (tx) => {
      const generatedCode = await generateTicketCode(tx, {
        area: ticket.requesterArea || ticket.customer.department?.name || null,
        createdAt: ticket.createdAt,
      })

      await tx.ticket.update({
        where: { id: ticket.id },
        data: { ticketCode: generatedCode },
      })

      return generatedCode
    })

    console.log(`Ticket ${ticket.number} -> ${ticketCode}`)
  }
}

main()
  .catch((error) => {
    console.error('Error backfilling ticket codes:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
