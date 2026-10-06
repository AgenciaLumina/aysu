import { formatCurrency } from '@/lib/utils'
import { CANCELLATION_TERMS, type BookingQuote, type SpaceCondition } from '@/lib/reservation-commercial'

export function CommercialConditions({ condition, maxParticipants, minimum = 1 }: { condition: SpaceCondition; maxParticipants?: number; minimum?: number }) {
    return <div className="space-y-2 text-sm text-[#5C3D2E]">
        {condition.poolAccess !== undefined && condition.poolAccess !== null && <p className="font-semibold">{condition.poolAccess ? 'Piscina incluída' : 'Não inclui acesso à piscina'}</p>}
        {maxParticipants && <p>Capacidade máxima: {maxParticipants} {maxParticipants === 1 ? 'pessoa' : 'pessoas'}.</p>}
        {minimum > 1 && <p>Cobrança mínima equivalente a {minimum} pessoas, mesmo com um grupo menor.</p>}
        {condition.text && <p className="whitespace-pre-line leading-relaxed">{condition.text}</p>}
    </div>
}

export function QuoteSummary({ quote }: { quote: BookingQuote }) {
    return <div className="space-y-3">
        <p className="font-medium text-[#2a2a2a]">{quote.participantCount} {quote.participantCount === 1 ? 'pessoa' : 'pessoas'}{quote.pricingMode === 'PER_PERSON' ? ` · ${formatCurrency(quote.unitPrice)} por pessoa` : ''}</p>
        <CommercialConditions condition={quote.condition} maxParticipants={quote.maxParticipants} minimum={quote.pricingMode === 'PER_PERSON' ? quote.condition.minBillableParticipants : 1} />
        <p className="text-sm text-[#5C3D2E]">Chegada entre {quote.condition.arrivalStart} e {quote.condition.arrivalEnd}. Após esse horário, sem check-in ou atraso autorizado pelo Aysú, a estrutura poderá ser liberada.</p>
        {quote.eventRelease && <p className="whitespace-pre-line text-sm leading-relaxed text-[#5C3D2E]">{quote.eventRelease}</p>}
        <p className="text-sm text-[#5C3D2E]">{quote.cancellationPolicy || CANCELLATION_TERMS}</p>
        <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4"><dt>Crédito de consumação</dt><dd className="font-semibold">{formatCurrency(quote.consumptionCredit)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Parcela sem consumação</dt><dd>{formatCurrency(quote.nonConsumableAmount)}</dd></div>
            <div className="flex justify-between gap-4 border-t border-[#e0d5c7] pt-3"><dt className="font-semibold">Total da reserva</dt><dd className="text-lg font-bold">{formatCurrency(quote.totalPrice)}</dd></div>
        </dl>
    </div>
}
