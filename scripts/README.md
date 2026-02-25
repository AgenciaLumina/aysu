# Scripts de Manutenção - AISSU Beach Lounge

## 🔍 Auditoria e Correção de Reservas

### `audit-and-fix-reservations.mjs`

Script para identificar e corrigir problemas em reservas existentes:
- ✅ Identifica reservas com valores incorretos
- ✅ Detecta se o valor foi multiplicado por horas (erro antigo)
- ✅ Gera relatório detalhado com severidade
- ✅ Oferece correção automática com dry-run

---

## 🚦 Pre-flight de Produção (Sprint 2.1.1)

### `preflight-v211.mjs`

Script de validação para rodar **antes do deploy**:
- ✅ Lista reservas por status
- ✅ Conta reservas que travam estoque (`PENDING/CONFIRMED/CHECKED_IN/IN_PROGRESS`)
- ✅ Detecta pendentes antigas (>24h)
- ✅ Valida se existem unidades ativas para `Mesa Restaurante` e `Mesa Praia`
- ✅ Informa se a tabela `ReservationDayConfig` já está disponível

Execução:

```bash
ALLOW_DB_READ=1 node scripts/preflight-v211.mjs
```

Resultado:
- `exit 0`: pre-flight aprovado
- `exit 2`: bloqueante (faltam unidades obrigatórias em `Cabin`)
- `exit 1`: erro de execução
- `exit 3`: bloqueado por modo seguro (faltou `ALLOW_DB_READ=1`)
- `exit 4`: bloqueado por variáveis de banco ausentes (`DATABASE_URL`/`DIRECT_URL`)

---

## 📋 Como Usar

### 1. **Apenas Auditoria** (Recomendado primeiro)

Executa a auditoria e mostra o que SERIA corrigido (sem alterar nada):

```bash
ALLOW_DB_READ=1 node scripts/audit-and-fix-reservations.mjs
```

**Saída exemplo:**
```
🔍 Iniciando auditoria de reservas...
📊 Total de reservas encontradas: 15

================================================================================
📋 RELATÓRIO DE AUDITORIA - RESERVAS COM PROBLEMAS
================================================================================

🔴 Alta prioridade: 2
🟡 Média prioridade: 1
📊 Total de problemas: 3

────────────────────────────────────────────────────────────────────────────────

🔴 Problema #1 - PRICE_MULTIPLIED
   ID: a1b2c3d4...
   Cliente: Bruno Silva
   Bangalô: Bangalô Lateral 1
   Data: 2026-02-13
   Valor atual: R$ 1333.36
   Valor esperado: R$ 1000.00
   Diferença: R$ 333.36
```

---

### 2. **Aplicar Correções** (Produção)

⚠️ **CUIDADO**: Isso MODIFICA o banco de dados em produção!

```bash
ALLOW_DB_READ=1 ALLOW_DB_WRITE=1 node scripts/audit-and-fix-reservations.mjs --apply --i-understand-this-writes
```

**O que acontece:**
1. Executa auditoria completa
2. Mostra relatório de problemas
3. Mostra dry-run (o que seria feito)
4. **Aplica as correções no banco**
5. Confirma quantas reservas foram corrigidas

---

## 📊 Tipos de Problemas Detectados

### 🔴 **PRICE_MULTIPLIED** (Alta prioridade)
- **Causa**: Valor foi multiplicado por 8 horas (bug antigo)
- **Exemplo**: R$ 166.67 × 8 = R$ 1.333,36 em vez de R$ 600
- **Ação**: Corrige para o preço fixo da diária

### 🟡 **PRICE_INCORRECT** (Média prioridade)
- **Causa**: Valor está errado mas não sabemos exatamente por quê
- **Exemplo**: R$ 650 em vez de R$ 600
- **Ação**: Corrige para o preço correto

---

## 🎯 Preços Corretos de Referência

### Dia Normal:
- Bangalô Lateral: **R$ 600** (R$ 500 consumação)
- Bangalô Piscina: **R$ 600** (R$ 500 consumação)
- Bangalô Frente Mar: **R$ 720** (R$ 600 consumação)
- Bangalô Central: **R$ 1.500** (R$ 1.200 consumação)
- Sunbed Casal: **R$ 250** (R$ 200 consumação)

### Carnaval (13-18 fev):
- Bangalô Lateral: **R$ 1.000** (R$ 700 consumação)
- Bangalô Piscina: **R$ 1.800** (R$ 1.300 consumação)
- Bangalô Frente Mar: **R$ 1.800** (R$ 1.300 consumação)
- Bangalô Central: **R$ 2.500** (R$ 2.000 consumação)
- Sunbed Casal: **R$ 500** (R$ 350 consumação)

---

## ⚠️ Importante

1. **Sempre execute sem `--apply` primeiro** para ver o relatório
2. **Revise o relatório** antes de aplicar correções
3. **Faça backup do banco** antes de aplicar em produção
4. O script tem **tolerância de R$ 1** para arredondamentos
5. **Registre os IDs** das reservas corrigidas para auditoria

---

## 🛡️ Segurança

- ✅ **Modo dry-run por padrão**: nunca altera sem `--apply`
- ✅ **Relatório detalhado**: você vê exatamente o que será mudado
- ✅ **Severidade**: problemas classificados por impacto
- ✅ **Rastreável**: IDs de reservas registrados no log

---

## 📝 Logs

Recomendado salvar a saída para auditoria:

```bash
# Auditoria apenas
ALLOW_DB_READ=1 node scripts/audit-and-fix-reservations.mjs > audit-report.txt

# Correção com log
ALLOW_DB_READ=1 ALLOW_DB_WRITE=1 node scripts/audit-and-fix-reservations.mjs --apply --i-understand-this-writes > fix-log.txt
```

---

## 🔧 Manutenção

Se novos tipos de bangalô forem adicionados ou preços mudarem, edite:

```typescript
const CORRECT_PRICES: Record<string, PriceConfig> = {
    // Adicionar novos tipos aqui
}

const HOLIDAY_DATES = [
    // Adicionar novos feriados aqui
]
```
