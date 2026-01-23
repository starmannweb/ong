
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const args = process.argv.slice(2)
    const [email, password, name, role] = args

    if (!email || !password || !name) {
        console.error('Usage: tsx prisma/create-user.ts <email> <password> <name> [role]')
        process.exit(1)
    }

    const userRole = role || 'member' // Default to 'member' if not specified

    console.log(`Creating user: ${email} with role: ${userRole}`)

    try {
        const passwordHash = await bcrypt.hash(password, 10)

        // Try to find organization if needed, or leave null/default
        // For now, we won't assign organization unless we query for it or pass it.
        // Assuming loose user or first org.

        // Find default org if exists
        const org = await prisma.organization.findFirst()

        const user = await prisma.user.create({
            data: {
                email,
                name,
                passwordHash,
                role: userRole,
                organizationId: org?.id
            }
        })

        console.log(`User created successfully: ${user.id}`)
    } catch (e) {
        console.error('Error creating user:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
