# Runbook de Deploy - Sprint 2.1.1

## Objetivo

Publicar a versao 2.1.1 sem perda de dados e sem impacto em reservas ativas.

## Escopo atual

- Modo local: validacao e preparacao tecnica.
- Sem deploy automatico.
- Sem aplicar migracao enquanto nao houver autorizacao explicita.
- Se a base conectada for producao em ambiente local, usar `APP_READ_ONLY_MODE=1`.

## Pre-condicoes

- Janela de deploy definida com responsavel tecnico e operacional.
- Acesso ao banco PostgreSQL de producao.
- Variaveis `DATABASE_URL` e `DIRECT_URL` validas no ambiente de deploy.
- Build da aplicacao validado localmente.
- Definicao operacional para `PENDING_HOLD_MINUTES`:
  - `0` para manter comportamento atual;
  - valor maior que `0` para liberar estoque de pendencias antigas automaticamente nas consultas.
- Em ambiente local com banco de producao:
  - `APP_READ_ONLY_MODE=1` para bloquear `POST/PATCH/PUT/DELETE` em `/api`.

## Etapa 1 - Backup obrigatorio

1. Snapshot completo:

```bash
pg_dump "$DATABASE_URL" --format=custom --file="backup-pre-v211-$(date +%Y%m%d-%H%M).dump"
```

2. Backup logico das tabelas criticas:

```bash
pg_dump "$DATABASE_URL" \
  --data-only \
  --table='"Reservation"' \
  --table='"Payment"' \
  --table='"Cabin"' \
  --table='"Event"' \
  --table='"ClosedDate"' \
  --file="backup-dados-criticos-pre-v211-$(date +%Y%m%d-%H%M).sql"
```

## Etapa 2 - Pre-flight de producao

Executar checklist antes de migrar:

1. Existem reservas `PENDING/CONFIRMED/CHECKED_IN/IN_PROGRESS` ativas.
2. Cadastro de unidades em `Cabin` confere com operacao:
- `Mesa Restaurante 1..N`
- `Mesa Praia 1..N`
- `Day Use Praia 1..N` (se usado)
3. Nao ha bloqueios de manutencao no banco.

## Etapa 3 - Migracao aditiva

Aplicar migracao versionada:

```bash
npx prisma migrate deploy
```

Migracao incluida:
- `prisma/migrations/20260224143000_v211_day_config/migration.sql`

## Etapa 4 - Deploy da aplicacao

Publicar a versao do app com APIs e telas da 2.1.1.

Checklist minimo:
1. `/admin/eventos` abre e salva.
2. `/admin/calendario` abre e salva.
3. `/reservas` carrega calendario sem hardcode de carnaval.

## Etapa 5 - Smoke test pos-deploy (obrigatorio)

1. Criar configuracao para data teste em `/admin/calendario`.
2. Validar no publico:
- data com release/lotes;
- bloqueio de data funcionando;
- mesas habilitadas/desabilitadas por regra.
3. Criar reserva teste:
- status inicial `PENDING`;
- estoque reduzido imediatamente;
- preco respeita override por data/produto.
4. Cancelar reserva teste e validar retorno de estoque.

## Etapa 6 - Rollback

Se erro funcional sem corrupcao de dados:
1. rollback da versao da aplicacao;
2. manter migracao aditiva no banco.

Se incidente grave de dados (cenario extremo):
1. congelar operacoes;
2. restaurar backup completo;
3. executar reconciliacao de reservas.

## Observacoes criticas

- Esta sprint **nao** remove tabelas ou colunas existentes.
- Evitar qualquer comando destrutivo (`drop`, `truncate`, reset).
- Com banco em producao, toda mudanca deve passar por backup + smoke test.
