import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
    params: {
        slug: string
    }
}

// Revalidate a cada 60 segundos
export const revalidate = 60

async function getCampaign(slug: string) {
    return await prisma.campaign.findFirst({
        where: {
            slug: slug,
            status: 'ACTIVE'
        },
        include: {
            organization: true,
            images: { orderBy: { order: 'asc' } }
        }
    })
}

export default async function CampaignPage({ params }: Props) {
    const campaign = await getCampaign(params.slug)

    if (!campaign) {
        notFound()
    }

    const percentage = Math.min((Number(campaign.currentAmount) / Number(campaign.goalAmount)) * 100, 100)

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="font-bold text-2xl text-blue-600 hover:text-blue-700 transition">DoaFácil</Link>
                    <nav className="flex space-x-4">
                        <Link href="/" className="text-gray-500 hover:text-gray-900">Voltar para Home</Link>
                    </nav>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">

                    {/* Cover Image */}
                    <div className="h-64 sm:h-96 bg-gray-200 relative">
                        {campaign.coverImage ? (
                            <img
                                src={campaign.coverImage}
                                alt={campaign.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">Sem imagem de capa</div>
                        )}
                    </div>

                    <div className="p-8">
                        <div className="text-sm font-semibold text-blue-600 mb-2 uppercase tracking-wide">
                            {campaign.organization.name}
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{campaign.title}</h1>

                        {/* Progress Section */}
                        <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-100">
                            <div className="flex flex-col sm:flex-row justify-between items-baseline mb-2">
                                <span className="text-3xl font-bold text-green-600">
                                    R$ {Number(campaign.currentAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-gray-500">
                                    meta de R$ {Number(campaign.goalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                                <div
                                    className="bg-green-500 h-4 rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                            <div className="text-right text-sm text-gray-500 font-medium">
                                {percentage.toFixed(1)}% alcançado
                            </div>
                        </div>

                        {/* Description */}
                        <div className="prose max-w-none text-gray-700 mb-10">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Sobre a campanha</h3>
                            <p className="whitespace-pre-line">{campaign.description}</p>
                        </div>

                        {/* CTA */}
                        <div className="flex justify-center sticky bottom-4 z-40 sm:static">
                            <Link
                                href={`/doar/${campaign.id}`}
                                className="w-full sm:w-auto px-12 py-4 bg-blue-600 text-white text-xl font-bold rounded-full shadow-xl hover:bg-blue-700 transform hover:scale-105 transition-all text-center ring-4 ring-white sm:ring-0"
                            >
                                Quero Doar Agora
                            </Link>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    )
}
