// AISSU Beach Lounge - Feriados Brasileiros 2026
// Lista completa de feriados prolongados e pontes

export interface Holiday {
    date: string // YYYY-MM-DD
    name: string
    type: 'nacional' | 'ponte' | 'alta_temporada'
    isExtended: boolean // Feriado prolongado
    days?: number // Dias do feriado/ponte
}

// Feriados Nacionais + Pontes 2026
export const holidays2026: Holiday[] = [
    // Carnaval (Sábado a Quarta de Cinzas) - Feriadão de Carnaval
    { date: '2026-02-14', name: 'Feriadão de Carnaval', type: 'nacional', isExtended: true, days: 5 },
    { date: '2026-02-15', name: 'Feriadão de Carnaval', type: 'nacional', isExtended: true },
    { date: '2026-02-16', name: 'Feriadão de Carnaval', type: 'nacional', isExtended: true },
    { date: '2026-02-17', name: 'Terça de Carnaval', type: 'nacional', isExtended: true },
    { date: '2026-02-18', name: 'Quarta de Cinzas', type: 'nacional', isExtended: true },

    // Semana Santa (Sexta da Paixão + Páscoa)
    { date: '2026-04-03', name: 'Sexta-feira Santa', type: 'nacional', isExtended: true, days: 4 },
    { date: '2026-04-04', name: 'Sábado de Aleluia', type: 'nacional', isExtended: true },
    { date: '2026-04-05', name: 'Páscoa', type: 'nacional', isExtended: true },

    // Tiradentes (Terça) - Ponte na Segunda
    { date: '2026-04-20', name: 'Ponte Tiradentes', type: 'ponte', isExtended: true, days: 4 },
    { date: '2026-04-21', name: 'Tiradentes', type: 'nacional', isExtended: true },

    // Dia do Trabalho (Sexta) - Feriadão natural
    { date: '2026-05-01', name: 'Dia do Trabalho', type: 'nacional', isExtended: true, days: 3 },
    { date: '2026-05-02', name: 'Ponte Trabalho', type: 'ponte', isExtended: true },
    { date: '2026-05-03', name: 'Fim de Semana', type: 'ponte', isExtended: true },

    // Corpus Christi (Quinta) - Ponte na Sexta
    { date: '2026-06-04', name: 'Corpus Christi', type: 'nacional', isExtended: true, days: 4 },
    { date: '2026-06-05', name: 'Ponte Corpus Christi', type: 'ponte', isExtended: true },
    { date: '2026-06-06', name: 'Sábado', type: 'ponte', isExtended: true },
    { date: '2026-06-07', name: 'Domingo', type: 'ponte', isExtended: true },

    // Independência (Segunda) - Feriadão natural
    { date: '2026-09-05', name: 'Sábado', type: 'ponte', isExtended: true, days: 3 },
    { date: '2026-09-06', name: 'Domingo', type: 'ponte', isExtended: true },
    { date: '2026-09-07', name: 'Independência', type: 'nacional', isExtended: true },

    // Nossa Senhora Aparecida (Segunda) - Feriadão natural
    { date: '2026-10-10', name: 'Sábado', type: 'ponte', isExtended: true, days: 3 },
    { date: '2026-10-11', name: 'Domingo', type: 'ponte', isExtended: true },
    { date: '2026-10-12', name: 'N. Sra. Aparecida', type: 'nacional', isExtended: true },

    // Finados (Segunda) - Feriadão natural  
    { date: '2026-10-31', name: 'Sábado', type: 'ponte', isExtended: true, days: 3 },
    { date: '2026-11-01', name: 'Domingo', type: 'ponte', isExtended: true },
    { date: '2026-11-02', name: 'Finados', type: 'nacional', isExtended: true },

    // Proclamação da República (Domingo)
    { date: '2026-11-15', name: 'Proclamação República', type: 'nacional', isExtended: false },

    // Natal e Ano Novo - Alta Temporada
    { date: '2026-12-24', name: 'Véspera Natal', type: 'alta_temporada', isExtended: true, days: 9 },
    { date: '2026-12-25', name: 'Natal', type: 'nacional', isExtended: true },
    { date: '2026-12-26', name: 'Recesso', type: 'alta_temporada', isExtended: true },
    { date: '2026-12-27', name: 'Recesso', type: 'alta_temporada', isExtended: true },
    { date: '2026-12-28', name: 'Recesso', type: 'alta_temporada', isExtended: true },
    { date: '2026-12-29', name: 'Recesso', type: 'alta_temporada', isExtended: true },
    { date: '2026-12-30', name: 'Recesso', type: 'alta_temporada', isExtended: true },
    { date: '2026-12-31', name: 'Véspera Ano Novo', type: 'alta_temporada', isExtended: true },
]

// Helpers
export function isHoliday(date: string | Date): Holiday | undefined {
    let dateStr: string
    if (typeof date === 'string') {
        dateStr = date
    } else {
        // Usa data LOCAL para evitar problemas de fuso horário (ignora horas)
        // Isso resolve o problema de datas voltarem 1 dia quando usa toISOString()
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        dateStr = `${year}-${month}-${day}`
    }
    return holidays2026.find(h => h.date === dateStr)
}

export function isExtendedHoliday(date: string | Date): boolean {
    const holiday = isHoliday(date)
    return holiday?.isExtended ?? false
}

export function getHolidayName(date: string | Date): string | undefined {
    return isHoliday(date)?.name
}

export function getHolidaysInMonth(year: number, month: number): Holiday[] {
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
    return holidays2026.filter(h => h.date.startsWith(monthStr))
}

// Resumo dos feriados prolongados para exibição
export const extendedHolidaysSummary = [
    { name: 'Feriadão de Carnaval', dates: '14-18 Fev', days: 5, emoji: '🎭' },
    { name: 'Semana Santa', dates: '03-05 Abr', days: 3, emoji: '✝️' },
    { name: 'Tiradentes', dates: '20-21 Abr', days: 4, emoji: '🏛️' },
    { name: 'Dia do Trabalho', dates: '01-03 Mai', days: 3, emoji: '👷' },
    { name: 'Corpus Christi', dates: '04-07 Jun', days: 4, emoji: '⛪' },
    { name: 'Independência', dates: '05-07 Set', days: 3, emoji: '🇧🇷' },
    { name: 'N. Sra. Aparecida', dates: '10-12 Out', days: 3, emoji: '🙏' },
    { name: 'Finados', dates: '31 Out - 02 Nov', days: 3, emoji: '🕯️' },
    { name: 'Natal/Ano Novo', dates: '24-31 Dez', days: 8, emoji: '🎄' },
]
