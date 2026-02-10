'use client'

import { useState } from 'react'
import { X, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface CancellationPolicyModalProps {
    isOpen: boolean
    onClose: () => void
}

export function CancellationPolicyModal({ isOpen, onClose }: CancellationPolicyModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-[#e0d5c7] p-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-[#2a2a2a]">
                        Política de Cancelamento
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[#f5f0e8] transition-colors"
                    >
                        <X className="h-5 w-5 text-[#8a5c3f]" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)] space-y-6 text-[#4a4a4a]">
                    {/* Intro */}
                    <section>
                        <h3 className="font-semibold text-[#2a2a2a] mb-3">
                            Condições Climáticas e Estrutura – Bangalôs
                        </h3>
                        <p className="text-sm leading-relaxed">
                            Os bangalôs do Aysú Beach Lounge são estruturas abertas, ao ar livre, sem cobertura fixa.
                            Por se tratar de um espaço em contato direto com a natureza, eventuais chuvas, ventos ou
                            mudanças climáticas fazem parte da experiência.
                        </p>
                        <p className="text-sm leading-relaxed mt-3">
                            Em caso de chuva ou instabilidade climática, o Aysú disponibiliza áreas cobertas fora dos
                            bangalôs para abrigo e conforto dos clientes, não estando incluída cobertura sobre os bangalôs.
                        </p>
                    </section>

                    {/* Condições Climáticas */}
                    <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-amber-800 mb-2">Importante:</p>
                                <ul className="space-y-1 text-amber-700">
                                    <li>• Condições climáticas como chuva, garoa, vento ou tempestade <strong>não caracterizam motivo</strong> para cancelamento, reagendamento ou reembolso.</li>
                                    <li>• A política de cancelamento segue válida independentemente das condições climáticas.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Estrutura e Mobiliário */}
                    <section>
                        <h3 className="font-semibold text-[#2a2a2a] mb-3">Estrutura e Mobiliário</h3>
                        <p className="text-sm leading-relaxed">
                            Por estar localizado à beira-mar, o Aysú Beach Lounge está sujeito à ação de intempéries
                            naturais, que podem demandar ajustes operacionais ou substituição de mobiliários.
                        </p>
                        <ul className="text-sm mt-3 space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="text-[#d4a574]">•</span>
                                O mobiliário poderá sofrer alterações sem aviso prévio, por necessidade operacional.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#d4a574]">•</span>
                                Tais alterações não comprometem o padrão de conforto nem o número de assentos contratados.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#d4a574]">•</span>
                                Alterações estéticas não caracterizam descumprimento do serviço contratado.
                            </li>
                        </ul>
                    </section>

                    {/* Capacidade - Bangalô Frente Mar */}
                    <section className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-blue-800 mb-2">Capacidade - Bangalô Frente Mar:</p>
                                <ul className="space-y-1 text-blue-700">
                                    <li>• O Bangalô Frente Mar comporta de <strong>6 a 8 pessoas</strong>.</li>
                                    <li>• O valor da reserva informado é referente à ocupação mínima de <strong>6 pessoas</strong>.</li>
                                    <li>• Para ocupação superior a 6 pessoas (até o limite máximo de 8), será cobrado o valor de <strong>Day Use Tradicional</strong> por pessoa excedente.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Política de Cancelamento */}
                    <section>
                        <h3 className="font-semibold text-[#2a2a2a] mb-3">Política de Cancelamento</h3>
                        <p className="text-sm leading-relaxed mb-4">
                            A reserva garante a exclusividade do espaço na data e horário escolhidos, implicando
                            organização operacional, equipe e indisponibilidade para outros clientes.
                        </p>

                        <div className="grid gap-3">
                            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                                <div className="text-sm">
                                    <span className="font-medium text-green-800">Até 72h de antecedência:</span>
                                    <span className="text-green-700 ml-1">100% reembolsável</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                                <div className="text-sm">
                                    <span className="font-medium text-amber-800">Até 48h de antecedência:</span>
                                    <span className="text-amber-700 ml-1">50% reembolsável</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <X className="h-5 w-5 text-red-600 flex-shrink-0" />
                                <div className="text-sm">
                                    <span className="font-medium text-red-800">Menos de 24h ou no-show:</span>
                                    <span className="text-red-700 ml-1">Não reembolsável</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Exceções */}
                    <section className="text-sm text-[#8a5c3f] italic">
                        <p>
                            Somente em situações de impossibilidade operacional por parte do Aysú Beach Lounge
                            (como interdição do espaço ou fechamento da casa por decisão da administração),
                            o valor poderá ser reagendado ou reembolsado, conforme avaliação da administração.
                        </p>
                    </section>

                    {/* Final */}
                    <section className="bg-[#f5f0e8] rounded-xl p-4 text-sm text-center">
                        <p className="font-medium text-[#2a2a2a]">
                            Ao efetuar a reserva, o cliente declara estar ciente e de acordo com todas as condições acima.
                        </p>
                    </section>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-[#e0d5c7] p-4">
                    <Button onClick={onClose} className="w-full">
                        Entendi
                    </Button>
                </div>
            </div>
        </div>
    )
}

// Compact inline version for checkout
interface CancellationPolicyCheckboxProps {
    checked: boolean
    onChange: (checked: boolean) => void
    onOpenPolicy: () => void
}

export function CancellationPolicyCheckbox({ checked, onChange, onOpenPolicy }: CancellationPolicyCheckboxProps) {
    return (
        <div className="bg-[#f5f0e8] rounded-xl p-4 border border-[#e0d5c7]">
            <label className="flex items-start gap-3 cursor-pointer">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-[#d4a574] text-[#d4a574] focus:ring-[#d4a574]"
                />
                <span className="text-sm text-[#4a4a4a]">
                    Li e concordo com a{' '}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            onOpenPolicy()
                        }}
                        className="text-[#d4a574] font-medium underline hover:text-[#bc8e5e]"
                    >
                        Política de Cancelamento
                    </button>
                    , condições climáticas e estrutura dos bangalôs.
                </span>
            </label>
        </div>
    )
}

// Collapsible summary for inline display
export function CancellationPolicySummary() {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div className="border border-[#e0d5c7] rounded-xl overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between bg-[#fdfbf8] hover:bg-[#f5f0e8] transition-colors"
            >
                <span className="font-medium text-[#2a2a2a]">Política de Cancelamento</span>
                {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-[#8a5c3f]" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-[#8a5c3f]" />
                )}
            </button>

            {isExpanded && (
                <div className="p-4 bg-white border-t border-[#e0d5c7] text-sm space-y-3 text-[#4a4a4a]">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span><strong>Até 72h:</strong> 100% reembolsável</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <span><strong>Até 48h:</strong> 50% reembolsável</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span><strong>Menos de 24h:</strong> Não reembolsável</span>
                    </div>
                    <p className="text-xs text-[#8a5c3f] mt-2">
                        Condições climáticas não caracterizam motivo para cancelamento ou reembolso.
                    </p>
                </div>
            )}
        </div>
    )
}
