'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DonationPageProps {
    params: {
        campanhaId: string
    }
}

export default function DonationPage({ params }: DonationPageProps) {
    const router = useRouter()
    const [amount, setAmount] = useState<number>(0)
    const [customAmount, setCustomAmount] = useState<string>('')

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        document: '',
        phone: ''
    })

    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<'amount' | 'details' | 'payment'>('amount')
    const [pixData, setPixData] = useState<{ qrCode: string; emv: string; expiresAt: string } | null>(null)

    const predefinedAmounts = [20, 50, 100, 200, 500]

    const handleAmountSelect = (val: number) => {
        setAmount(val)
        setCustomAmount('')
    }

    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomAmount(e.target.value)
        setAmount(Number(e.target.value))
    }

    const handleNextStep = () => {
        if (step === 'amount' && amount > 0) {
            setStep('details')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/donations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campaignId: params.campanhaId,
                    amount: amount,
                    donorName: formData.name,
                    donorEmail: formData.email,
                    donorDocument: formData.document,
                    donorPhone: formData.phone
                })
            })

            const data = await res.json()

            if (!res.ok) {
                alert(data.error || 'Erro ao processar doação')
                setLoading(false)
                return
            }

            setPixData(data.pix)
            setStep('payment')
        } catch (err) {
            console.error(err)
            alert('Erro de conexão')
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (pixData?.emv) {
            navigator.clipboard.writeText(pixData.emv)
            alert('Código Pix copiado!')
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
                <div className="bg-blue-600 p-6 text-center text-white">
                    <h1 className="text-2xl font-bold">Realizar Doação</h1>
                    <p className="text-blue-100 mt-1">Sua contribuição muda vidas.</p>
                </div>

                <div className="p-8">
                    {step === 'amount' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-700 text-center">Quanto você quer doar?</h2>

                            <div className="grid grid-cols-3 gap-3">
                                {predefinedAmounts.map((val) => (
                                    <button
                                        key={val}
                                        onClick={() => handleAmountSelect(val)}
                                        className={`py-3 rounded-lg font-bold border transition-all ${amount === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}
                                    >
                                        R$ {val}
                                    </button>
                                ))}
                            </div>

                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                                <input
                                    type="number"
                                    placeholder="Outro valor"
                                    value={customAmount}
                                    onChange={handleCustomAmountChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            <button
                                onClick={handleNextStep}
                                disabled={amount <= 0}
                                className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Continuar
                            </button>
                        </div>
                    )}

                    {step === 'details' && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <h2 className="text-lg font-semibold text-gray-700 text-center mb-4">Seus dados</h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                                <input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ (Opcional)</label>
                                <input
                                    type="text"
                                    value={formData.document}
                                    onChange={e => setFormData({ ...formData, document: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStep('amount')}
                                    className="flex-1 py-3 border border-gray-300 text-gray-600 font-semibold rounded-lg hover:bg-gray-50"
                                >
                                    Voltar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                                >
                                    {loading ? 'Gerando Pix...' : 'Pagar com Pix'}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 'payment' && pixData && (
                        <div className="text-center space-y-6">
                            <div className="bg-green-50 text-green-800 p-4 rounded-lg text-sm">
                                QR Code gerado com sucesso!
                            </div>

                            <div className="flex justify-center">
                                {/* Em um app real, usaríamos uma lib de QR Code React ou a imagem base64 retornada */}
                                {pixData.qrCode.startsWith('data:image') ? (
                                    <img src={pixData.qrCode} alt="QR Code Pix" className="w-48 h-48 border p-2 rounded" />
                                ) : (
                                    // Fallback para mock/sandbox que não retorna imagem real
                                    <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                                        QR Code Mock
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase">Pix Copia e Cola</label>
                                <div className="flex gap-2">
                                    <input
                                        readOnly
                                        value={pixData.emv}
                                        className="flex-1 bg-gray-100 text-gray-600 text-xs p-2 rounded border"
                                    />
                                    <button
                                        onClick={copyToClipboard}
                                        className="bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm font-semibold hover:bg-blue-200"
                                    >
                                        Copiar
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-gray-500">
                                Após o pagamento, você receberá a confirmação por e-mail.
                            </p>

                            <Link href="/" className="block text-blue-600 font-semibold hover:underline mt-4">
                                Voltar para o Início
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
