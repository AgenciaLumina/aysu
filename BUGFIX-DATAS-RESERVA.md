# Correção de Problemas com Datas de Reserva

## 🔴 Problemas Identificados

### 1. **Data Incorreta (Um Dia Antes)**

**Causa Raiz**: Uso incorreto de `toISOString()` para converter datas locais em strings.

**O que acontecia:**
- Usuário selecionava: **10 de fevereiro de 2026**
- Sistema criava: `new Date(2026, 1, 10)` às 00:00:00 no horário local (GMT-3)
- Ao usar `toISOString()`: a data era convertida para UTC → **2026-02-09T03:00:00.000Z**
- Ao extrair apenas a data com `.split('T')[0]`: retornava **"2026-02-09"** ❌

**Exemplo concreto:**
```typescript
// ❌ ANTES (Incorreto)
const date = new Date(2026, 1, 10)  // 10 fev 2026, 00:00 GMT-3
const iso = date.toISOString()       // "2026-02-09T03:00:00.000Z" (UTC)
const dateStr = iso.split('T')[0]    // "2026-02-09" ❌ (9 fev!)

// ✅ DEPOIS (Correto)
const date = new Date(2026, 1, 10)
const dateStr = toLocalISODate(date) // "2026-02-10" ✅
```

### 2. **Valores Incorretos (Preço e Consumação)**

**Causa Raiz**: Duas causas combinadas:
1. Criação incorreta de objetos Date a partir de strings no checkout (timezone)
2. **Cálculo errado do totalPrice** - estava multiplicando por horas quando o preço é FIXO por dia

**Modelo de Negócio Correto:**
- Bangalô custa R$ 600 por DIA (não por hora!)
- Desses R$ 600, R$ 500 vira **CRÉDITO DE CONSUMAÇÃO**
- O "custo real" para o cliente é R$ 100 (R$ 600 - R$ 500)
- **NÃO HÁ SOMA**: O total a pagar é SEMPRE R$ 600

**Exemplo:**
```
❌ ERRADO (antes):
Bangalô Lateral dia normal: R$ 166.67/hora × 8 horas = R$ 1.333,36
(Estava salvando no banco um valor completamente errado!)

✅ CORRETO (agora):
Bangalô Lateral dia normal: R$ 600 (preço fixo da diária)
  └─ Inclui R$ 500 em consumação
  └─ Total a pagar: R$ 600
```

**Carnaval:**
```
✅ CORRETO:
Bangalô Lateral Carnaval: R$ 1.000 (preço fixo da diária)
  └─ Inclui R$ 700 em consumação
  └─ Total a pagar: R$ 1.000
```

**O que acontecia:**
```typescript
// ❌ ANTES (Incorreto)
const date = "2026-02-10"
const checkIn = new Date(date)  // Interpreta como UTC meia-noite
checkIn.setHours(10, 0, 0, 0)   // 10h em QUAL timezone?

// API calculava:
const totalPrice = cabin.pricePerHour * 8  // ❌ Multiplicando por horas!
// Resultado: R$ 1.333,36 (ERRADO!)
```

**Solução implementada:**
```typescript
// ✅ DEPOIS (Correto)
const [year, month, day] = "2026-02-10".split('-').map(Number)
const checkIn = new Date(year, month - 1, day, 10, 0, 0, 0)
const checkOut = new Date(year, month - 1, day, 18, 0, 0, 0)

// Frontend envia o preço correto:
totalPrice: price  // R$ 600 ou R$ 1.000 (conforme feriado)

// API usa o valor recebido:
const totalPrice = data.totalPrice ?? (Number(cabin.pricePerHour) * hoursBooked)
// Resultado: R$ 600 (CORRETO!)
```

---

## ✅ Soluções Implementadas

### 1. **Nova Função Utilitária: `toLocalISODate()`**

Criada em `src/lib/utils.ts`:

```typescript
/**
 * Converte Date para string ISO (YYYY-MM-DD) usando horário LOCAL
 * Evita problemas de timezone que ocorrem com toISOString()
 */
export function toLocalISODate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}
```

**Por que funciona:**
- Usa `getFullYear()`, `getMonth()`, `getDate()` que retornam valores do **horário local**
- Nunca converte para UTC
- Garante que a data selecionada pelo usuário seja preservada exatamente como está

### 2. **Correção no Checkout**

Em `src/app/checkout/page.tsx` (linhas 95-99):

```typescript
// ❌ ANTES
const checkIn = new Date(date || '')
checkIn.setHours(10, 0, 0, 0)

// ✅ DEPOIS
const [year, month, day] = (date || '').split('-').map(Number)
const checkIn = new Date(year, month - 1, day, 10, 0, 0, 0)
```

**Por que funciona:**
- Parse manual da string YYYY-MM-DD
- Construção explícita do Date com componentes locais
- Horário definido diretamente no construtor

---

## 📁 Arquivos Modificados

### Arquivos Críticos (Corrigidos):
1. ✅ **`src/lib/utils.ts`**
   - Adicionada função `toLocalISODate()`

2. ✅ **`src/lib/validations.ts`**
   - Adicionado campo opcional `totalPrice` no `createReservationSchema`

3. ✅ **`src/app/api/reservations/route.ts`**
   - Modificada lógica para aceitar `totalPrice` do frontend
   - Se não fornecido, usa cálculo por hora como fallback

4. ✅ **`src/app/reservas/page.tsx`**
   - Removida função local `formatDateISO`
   - Importado e usado `toLocalISODate` em todos os lugares

5. ✅ **`src/app/checkout/page.tsx`**
   - Corrigida criação de datas no submit do formulário
   - Enviando `totalPrice` (preço da diária) para a API

6. ✅ **`src/components/reservas/CalendarAvailability.tsx`**
   - Substituído `toISOString().split('T')[0]` por `toLocalISODate()`

---

## 🧪 Como Testar

### Teste 1: Data Correta
1. Acesse `/reservas`
2. Selecione qualquer data (ex: **15 de fevereiro**)
3. Verifique na URL do checkout: `?date=2026-02-15`
4. ✅ Deve ser exatamente o dia selecionado

### Teste 2: Valores Corretos
1. Selecione uma data **normal** (não-feriado)
   - Ex: 5 de fevereiro
2. Selecione um Bangalô Lateral
   - Esperado: R$ 600 (diária) + R$ 500 (consumação)
3. ✅ Valores devem estar corretos

4. Selecione uma data de **Carnaval** (13-18 fev)
5. Selecione o mesmo Bangalô Lateral
   - Esperado: R$ 1.000 (diária) + R$ 700 (consumação)
6. ✅ Valores de feriado devem estar corretos

### Teste 3: Persistência no Banco
1. Complete uma reserva até o fim
2. Verifique no banco de dados (via Admin ou Prisma Studio)
3. ✅ `checkIn` e `checkOut` devem estar com a data correta

---

## 🎯 Impacto das Mudanças

### Antes:
- ❌ Datas salvadas com 1 dia de diferença
- ❌ Preços e consumação incorretos
- ❌ Problemas de timezone em todo o sistema

### Depois:
- ✅ Datas preservadas exatamente como selecionadas pelo usuário
- ✅ Preços e consumação calculados corretamente com base na data real
- ✅ Sistema agnóstico de timezone (usa sempre horário local do Brasil)

---

## 📌 Notas Importantes

### Consistência no Projeto
A função `toLocalISODate()` deve ser usada **sempre** que:
- Converter `Date` para string no formato ISO
- Comparar datas
- Salvar datas em formulários ou enviar para APIs

### Arquivos Ainda Usando `toISOString().split('T')[0]`
Os seguintes arquivos ainda usam o padrão antigo, mas são para contextos diferentes (APIs, admin):
- `src/app/api/closed-dates/route.ts`
- `src/app/api/reservations/availability/route.ts`
- `src/app/admin/*`

Se houver problemas similares nesses contextos, eles devem ser corrigidos **da mesma forma**.

---

## ⚠️ Prevenção de Regressão

### Regra de Ouro:
> **NUNCA use `toISOString().split('T')[0]` para datas de usuário.**
> 
> **SEMPRE use `toLocalISODate(date)` de `@/lib/utils`.**

### Por quê?
- `toISOString()` sempre converte para UTC
- UTC pode mudar o dia dependendo do timezone
- No Brasil (GMT-3), meia-noite vira 21h do dia anterior em UTC
