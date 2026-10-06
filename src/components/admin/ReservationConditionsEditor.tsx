'use client'

import type { CommercialConditions, SpaceCondition } from '@/lib/reservation-commercial'
import { SPACE_SLUG_PREFIX } from '@/lib/space-slugs'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

export function ReservationConditionsEditor({ value, onChange }: { value: CommercialConditions; onChange: (value: CommercialConditions) => void }) {
    const patch = (id: string, change: Partial<SpaceCondition>) => onChange({ ...value, [id]: { ...value[id], ...change } })
    const number = (raw: string) => raw === '' ? undefined : Number(raw)
    return <section className="space-y-3" aria-label="Condições comerciais por categoria">
        <div>
            <h3 className="font-semibold text-[#2a2a2a]">Condições da reserva por categoria</h3>
            <p className="mt-1 text-sm text-[#8a5c3f]">Preencha somente o que deseja definir. Na configuração por data, os campos vazios usam as condições padrão. Os valores são definidos na seção de preços.</p>
        </div>
        {Object.entries(SPACE_SLUG_PREFIX).map(([id, label]) => {
            const rule = value[id] ?? {}
            return <details key={id} className="rounded-xl border border-[#e0d5c7] p-4">
                <summary className="cursor-pointer font-medium text-[#2a2a2a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8a5c3f]">{label}</summary>
                <div className="mt-4 space-y-4">
                    <Textarea label="Regras e observações exibidas ao cliente" value={rule.text ?? ''} onChange={event => patch(id, { text: event.target.value })} rows={3} maxLength={5000} placeholder="Benefícios, restrições e condições desta categoria." />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-sm font-medium text-[#2a2a2a]">Acesso à piscina
                            <select className="mt-1 block w-full rounded-lg border border-[#e0d5c7] bg-white p-3 focus-visible:outline-2 focus-visible:outline-[#8a5c3f]" value={rule.poolAccess === true ? 'yes' : rule.poolAccess === false ? 'no' : ''} onChange={event => patch(id, { poolAccess: event.target.value === '' ? undefined : event.target.value === 'yes' })}>
                                <option value="">Usar padrão / não informar</option><option value="yes">Piscina incluída</option><option value="no">Não inclui piscina</option>
                            </select>
                        </label>
                        <label className="text-sm font-medium text-[#2a2a2a]">Forma de cobrança
                            <select className="mt-1 block w-full rounded-lg border border-[#e0d5c7] bg-white p-3 focus-visible:outline-2 focus-visible:outline-[#8a5c3f]" value={rule.pricingMode ?? ''} onChange={event => patch(id, { pricingMode: event.target.value === '' ? undefined : event.target.value as SpaceCondition['pricingMode'] })}>
                                <option value="">Padrão: {id === 'day-use-praia' ? 'por pessoa' : 'por estrutura'}</option><option value="PER_PERSON">Por pessoa</option>{id !== 'day-use-praia' && <option value="PER_RESERVATION">Por estrutura</option>}
                            </select>
                        </label>
                        <Input label={id === 'day-use-praia' ? 'Máximo de pessoas por reserva (padrão: 6)' : 'Capacidade máxima de participantes'} type="number" min={1} max={10000} value={rule.maxParticipants ?? ''} onChange={event => patch(id, { maxParticipants: number(event.target.value) })} />
                        <Input label="Mínimo de pessoas cobradas (por pessoa)" type="number" min={1} max={10000} value={rule.minBillableParticipants ?? ''} onChange={event => patch(id, { minBillableParticipants: number(event.target.value) })} />
                        <Input label="Chegada a partir de (padrão: 10h)" type="time" value={rule.arrivalStart ?? ''} onChange={event => patch(id, { arrivalStart: event.target.value || undefined })} />
                        <Input label="Chegada até (padrão: 12h)" type="time" value={rule.arrivalEnd ?? ''} onChange={event => patch(id, { arrivalEnd: event.target.value || undefined })} />
                        {id === 'day-use-praia' && <Input label="Total de vagas de pessoas nesta data/período" type="number" min={0} max={10000} value={rule.dayUseCapacity ?? ''} onChange={event => patch(id, { dayUseCapacity: number(event.target.value) })} />}
                    </div>
                    {id === 'day-use-praia' && <p className="text-sm text-[#8a5c3f]">A reserva é de entrada por pessoa. A acomodação do grupo é organizada pela equipe, sem venda de uma mesa exclusiva. O total de vagas vazio mantém o estoque cadastrado em Espaços.</p>}
                </div>
            </details>
        })}
    </section>
}
