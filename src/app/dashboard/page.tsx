import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import SignOutButton from "@/app/components/SignOutButton"

export default async function Dashboard() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/auth/signin")
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-indigo-600">Membros</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-slate-600">
                                Olá, <span className="font-semibold text-slate-900">{session.user?.name || session.user?.email}</span>
                            </span>
                            <SignOutButton />
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 bg-white border-b border-gray-200">
                        <h2 className="text-2xl font-bold mb-4">Painel de Controle</h2>
                        <p className="text-gray-600">
                            Bem-vindo à área exclusiva de membros. Aqui você pode gerenciar suas informações e visualizar conteúdos exclusivos.
                        </p>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
                            <h3 className="font-semibold text-indigo-800 mb-2">Status</h3>
                            <p className="text-indigo-600">Ativo</p>
                        </div>
                        <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-100">
                            <h3 className="font-semibold text-emerald-800 mb-2">Doações</h3>
                            <p className="text-emerald-600">R$ 0,00</p>
                        </div>
                        <div className="bg-amber-50 p-6 rounded-lg border border-amber-100">
                            <h3 className="font-semibold text-amber-800 mb-2">Campanhas</h3>
                            <p className="text-amber-600">0 campanhas apoiadas</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
