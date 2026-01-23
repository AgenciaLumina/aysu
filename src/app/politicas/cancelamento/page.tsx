'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronUp, AlertCircle, CheckCircle, X, Phone, Mail } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function PoliticaCancelamentoPage() {
    return (
        <>
            <Header variant="solid" />

            <main className="min-h-screen bg-gradient-to-b from-[#fdfbf8] to-white pt-24 pb-16">
                <div className="max-w-4xl mx-auto px-6 lg:px-8">
                    {/* Breadcrumb */}
                    <div className="mb-8">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-[#8a5c3f] hover:text-[#d4a574] transition-colors text-sm"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Voltar ao início
                        </Link>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-12">
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#2a2a2a] mb-4">
                            Política de Cancelamento
                        </h1>
                        <p className="text-[#8a5c3f] max-w-2xl mx-auto">
                            Condições climáticas, estrutura dos bangalôs e regras de cancelamento para reservas no Aysú Beach Lounge.
                        </p>
                    </div>

                    {/* Content */}
                    <div className="space-y-8 text-[#4a4a4a]">

                        {/* Seção: Bangalôs */}
                        <section className="bg-white rounded-2xl shadow-sm border border-[#e0d5c7] p-6 md:p-8">
                            <h2 className="text-xl font-semibold text-[#2a2a2a] mb-4">
                                Estrutura dos Bangalôs
                            </h2>
                            <div className="space-y-4 text-sm leading-relaxed">
                                <p>
                                    Os bangalôs do Aysú Beach Lounge são estruturas abertas, ao ar livre, sem cobertura fixa.
                                    Por se tratar de um espaço em contato direto com a natureza, eventuais chuvas, ventos ou
                                    mudanças climáticas fazem parte da experiência.
                                </p>
                                <p>
                                    Em caso de chuva ou instabilidade climática, o Aysú disponibiliza áreas cobertas fora dos
                                    bangalôs para abrigo e conforto dos clientes, <strong>não estando incluída cobertura sobre os bangalôs</strong>.
                                </p>
                            </div>
                        </section>

                        {/* Seção: Condições Climáticas */}
                        <section className="bg-[#FFF8E1] rounded-2xl border-l-4 border-[#FFC107] p-6 md:p-8 shadow-sm">
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="bg-white p-3 rounded-full shadow-sm flex-shrink-0 mx-auto md:mx-0">
                                    <AlertCircle className="h-8 w-8 text-[#FFC107]" />
                                </div>
                                <div className="text-center md:text-left">
                                    <h2 className="text-2xl font-serif font-bold text-[#5D4037] mb-4">
                                        Condições Climáticas
                                    </h2>
                                    <div className="space-y-4 text-[#5D4037]">
                                        <p className="text-lg leading-relaxed font-medium">
                                            Condições climáticas como chuva, garoa, vento ou tempestade <span className="text-[#D84315] font-black underline decoration-[#D84315]/30 underline-offset-4">não caracterizam motivo</span> para cancelamento, reagendamento ou reembolso da reserva.
                                        </p>
                                        <p className="text-base text-[#8D6E63] border-t border-[#FFC107]/20 pt-4 mt-4">
                                            O serviço contratado permanece disponível e a política de cancelamento segue válida independentemente das condições do tempo.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Seção: Mobiliário */}
                        <section className="bg-white rounded-2xl shadow-sm border border-[#e0d5c7] p-6 md:p-8">
                            <h2 className="text-xl font-semibold text-[#2a2a2a] mb-4">
                                Estrutura e Mobiliário
                            </h2>
                            <div className="space-y-4 text-sm leading-relaxed">
                                <p>
                                    Por estar localizado à beira-mar, o Aysú Beach Lounge está sujeito à ação de intempéries
                                    naturais, como sol intenso, chuva, vento e maresia, que podem demandar ajustes operacionais
                                    ou substituição de mobiliários.
                                </p>
                                <ul className="space-y-3 mt-4">
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#d4a574] font-bold text-lg">•</span>
                                        <span>O mobiliário dos bangalôs poderá sofrer alterações sem aviso prévio, por necessidade operacional, manutenção ou preservação da segurança e qualidade do serviço.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#d4a574] font-bold text-lg">•</span>
                                        <span>Tais alterações não comprometem o padrão de conforto, a qualidade da experiência nem o número de assentos contratados, que será sempre respeitado.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-[#d4a574] font-bold text-lg">•</span>
                                        <span>Alterações estéticas ou de layout não caracterizam descumprimento do serviço contratado, nem motivo para cancelamento, reembolso ou abatimento de valores.</span>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* Seção: Política de Cancelamento */}
                        <section className="bg-white rounded-2xl shadow-sm border border-[#e0d5c7] p-6 md:p-8">
                            <h2 className="text-xl font-semibold text-[#2a2a2a] mb-4">
                                Política de Cancelamento
                            </h2>
                            <p className="text-sm leading-relaxed mb-6">
                                A reserva do bangalô garante a exclusividade do espaço na data e horário escolhidos,
                                implicando organização operacional, equipe e indisponibilidade para outros clientes.
                            </p>

                            <div className="grid gap-4">
                                <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                                    <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-green-800">Até 72 horas de antecedência</p>
                                        <p className="text-sm text-green-700">100% reembolsável</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                    <AlertCircle className="h-8 w-8 text-amber-600 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-amber-800">Até 48 horas de antecedência</p>
                                        <p className="text-sm text-amber-700">50% reembolsável</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <X className="h-8 w-8 text-red-600 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-red-800">Menos de 24 horas ou no-show</p>
                                        <p className="text-sm text-red-700">Não reembolsável</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Seção: Exceções */}
                        <section className="bg-[#f5f0e8] rounded-2xl p-6 md:p-8">
                            <h2 className="text-xl font-semibold text-[#2a2a2a] mb-4">
                                Exceções
                            </h2>
                            <p className="text-sm leading-relaxed text-[#4a4a4a]">
                                Somente em situações de impossibilidade operacional por parte do Aysú Beach Lounge
                                (como interdição do espaço ou fechamento da casa por decisão da administração),
                                o valor poderá ser reagendado ou reembolsado, conforme avaliação da administração.
                            </p>
                        </section>

                        {/* Aceite */}
                        <section className="bg-[#2a2a2a] text-white rounded-2xl p-6 md:p-8 text-center">
                            <p className="font-medium">
                                Ao efetuar a reserva, o cliente declara estar ciente e de acordo com todas as condições acima.
                            </p>
                        </section>

                        {/* Contato */}
                        <section className="text-center pt-8">
                            <p className="text-sm text-[#8a5c3f] mb-4">Dúvidas sobre nossa política?</p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <a
                                    href="tel:+5512991234567"
                                    className="inline-flex items-center gap-2 text-[#d4a574] hover:text-[#bc8e5e] transition-colors"
                                >
                                    <Phone className="h-4 w-4" />
                                    (12) 98289-6301
                                </a>
                                <a
                                    href="mailto:contato@aysubeachlounge.com.br"
                                    className="inline-flex items-center gap-2 text-[#d4a574] hover:text-[#bc8e5e] transition-colors"
                                >
                                    <Mail className="h-4 w-4" />
                                    contato@aysubeachlounge.com.br
                                </a>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    )
}
