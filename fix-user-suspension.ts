import { prisma } from './lib/prisma'

async function checkAndFixUser() {
    const userId = 346 // Ricardo Aguirre Pineda

    console.log(`Checking WordPress user ${userId}...`)

    const user = await prisma.wordPressUser.findUnique({
        where: { id: userId }
    })

    if (!user) {
        console.log('❌ User not found in local database')
        return
    }

    console.log('Current state:', {
        id: user.id,
        email: user.email,
        isSuspended: user.isSuspended,
        suspensionReason: user.suspensionReason,
        suspendedAt: user.suspendedAt
    })

    if (user.isSuspended) {
        console.log('\n🔧 Fixing suspension status...')
        const updated = await prisma.wordPressUser.update({
            where: { id: userId },
            data: {
                isSuspended: false,
                suspendedBy: null,
                suspendedAt: null,
                suspensionReason: null
            }
        })
        console.log('✅ User unsuspended successfully!')
        console.log('New state:', {
            id: updated.id,
            isSuspended: updated.isSuspended
        })
    } else {
        console.log('✅ User is already active (not suspended)')
    }

    await prisma.$disconnect()
}

checkAndFixUser().catch(console.error)
