import { PrismaClient } from '@prisma/client'
import { encrypt } from '../src/lib/crypto'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
    // 1. Criar Organização
    const org = await prisma.organization.upsert({
        where: { slug: 'ong-esperanca' },
        update: {},
        create: {
            name: 'ONG Esperança',
            slug: 'ong-esperanca',
            email: 'contato@ongesperanca.org',
            description: 'Levando esperança para quem mais precisa.',
            pagouApiKey: 'test_api_key_123',
            pagouSecretKey: encrypt('test_secret_key_456'), // Encriptado
            pagouWebhookSecret: 'test_webhook_secret_789'
        }
    })

    // 2. Criar Usuário Admin
    const passwordHash = await bcrypt.hash('123456', 10)

    await prisma.user.upsert({
        where: { email: 'admin@ongesperanca.org' },
        update: {},
        create: {
            email: 'admin@ongesperanca.org',
            name: 'Admin User',
            passwordHash,
            role: 'ORG_ADMIN',
            organizationId: org.id
        }
    })

    // 3. Criar Campanha
    await prisma.campaign.upsert({
        where: {
            organizationId_slug: {
                organizationId: org.id,
                slug: 'inverno-solidario'
            }
        },
        update: {},
        create: {
            organizationId: org.id,
            title: 'Inverno Solidário 2026',
            slug: 'inverno-solidario',
            description: 'Ajude-nos a aquecer o inverno de centenas de famílias.',
            shortDesc: 'Doação de cobertores e agasalhos.',
            goalAmount: 50000.00,
            currentAmount: 1250.00,
            startDate: new Date(),
            status: 'ACTIVE',
            isHighlighted: true
        }
    })

    console.log('Seed executed successfully!')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
