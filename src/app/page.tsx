import prisma from '@/lib/prisma'
import Link from 'next/link'

// Revalidate a cada 60 segundos
export const revalidate = 60

async function getCampaigns() {
  return await prisma.campaign.findMany({
    where: { status: 'ACTIVE' },
    include: { organization: true },
    orderBy: { isHighlighted: 'desc' }
  })
}

export default async function Home() {
  const campaigns = await getCampaigns()

  // Converte Decimal para Number para evitar erro no cliente (Next.js serialização)
  const formattedCampaigns = campaigns.map(c => ({
    ...c,
    goalAmount: Number(c.goalAmount),
    currentAmount: Number(c.currentAmount)
  }))

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header Simples */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="font-bold text-2xl text-blue-600">DoaFácil</div>
          <nav className="flex space-x-4">
            <Link href="/admin/login" className="text-gray-500 hover:text-gray-900">Area da ONG</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold sm:text-5xl md:text-6xl">
            Faça a diferença hoje
          </h1>
          <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
            Conectamos você a causas que precisam de ajuda. Doe com segurança via Pix e transforme vidas.
          </p>
        </div>
      </section>

      {/* Campanhas Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold mb-8">Campanhas em Destaque</h2>

        {formattedCampaigns.length === 0 ? (
          <p className="text-gray-500">Nenhuma campanha ativa no momento.</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {formattedCampaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Imagem Placeholder se não tiver cover */}
                <div className="h-48 bg-gray-200 w-full object-cover flex items-center justify-center text-gray-400">
                  {campaign.coverImage ? (
                    <img src={campaign.coverImage} alt={campaign.title} className="w-full h-full object-cover" />
                  ) : (
                    <span>Sem imagem</span>
                  )}
                </div>

                <div className="p-6">
                  <div className="text-sm text-blue-600 font-semibold mb-2">{campaign.organization.name}</div>
                  <h3 className="text-xl font-bold mb-2">{campaign.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{campaign.shortDesc || campaign.description}</p>

                  {/* Barra de Progresso */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-gray-700">R$ {campaign.currentAmount.toLocaleString('pt-BR')}</span>
                      <span className="text-gray-500">de R$ {campaign.goalAmount.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <Link
                    href={`/campanhas/${campaign.slug}`}
                    className="block w-full text-center bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                  >
                    Quero Ajudar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-gray-800 text-blue-100 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>© 2026 Starmann Web. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
