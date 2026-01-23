import prisma from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props {
    params: {
        donationId: string
    }
}

export const revalidate = 0

async function getDonation(id: string) {
    return await prisma.donation.findUnique({
        where: { id },
        include: { campaign: true, receipt: true }
    })
}

export default async function ConfirmationPage({ params }: Props) {
    const donation = await getDonation(params.donationId)

    if (!donation) {
        notFound()
    }

    const isPaid = donation.status === 'COMPLETED'
    const isPending = donation.status === 'PENDING'

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden p-8 text-center">

                {isPaid ? (
                    <div className="text-green-600 mb-6">
                        <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <h1 className="text-3xl font-bold mt-4">Doação Confirmada!</h1>
                        <p className="text-gray-600 mt-2">Muito obrigado pela sua generosidade.</p>
                    </div>
                ) : (
                    <div className="text-yellow-600 mb-6">
                        <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <h1 className="text-3xl font-bold mt-4">Aguardando Pagamento</h1>
                        <p className="text-gray-600 mt-2">Assim que o Pix for compensado, você receberá a confirmação.</p>
                    </div>
                )}

                <div className="bg-gray-100 rounded-lg p-6 mb-8 text-left">
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Campanha:</span>
                        <span className="font-semibold text-gray-900">{donation.campaign.title}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Valor:</span>
                        <span className="font-semibold text-gray-900">R$ {Number(donation.amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-600">ID da Transação:</span>
                        <span className="font-mono text-sm text-gray-500">{donation.id.slice(-8)}</span>
                    </div>
                    {donation.receipt && (
                        <div className="flex justify-between mt-4 border-t pt-4">
                            <span className="text-gray-600">Recibo:</span>
                            <Link href={donation.receipt.url || '#'} className="text-blue-600 hover:underline text-sm font-semibold">Download PDF</Link>
                        </div>
                    )}
                </div>

                <Link
                    href="/"
                    className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition-colors"
                >
                    Voltar para Home
                </Link>
            </div>
        </div>
    )
}
