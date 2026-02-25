# Blueprint 2.1.1 - Programacao + Comercial + Seguranca de Producao

## 0) Objetivo real da versao 2.1.1

Entregar independencia operacional para o time comercial e de eventos, sem depender de desenvolvedor para:

1. cadastrar e divulgar eventos (release, flyer, atracoes);
2. configurar preco por data e por produto;
3. abrir/fechar reservas de forma controlada;
4. operar lotes antecipados;
5. habilitar mesas (restaurante/praia) por data;
6. manter estoque com hold em `PENDING` sem overbooking.

Restricao principal: sistema em producao com reservas ativas, sem perda de dados e sem downtime planejado.

Protecao operacional para ambiente local conectado em producao:
- `APP_READ_ONLY_MODE=1` bloqueia metodos mutaveis (`POST/PATCH/PUT/DELETE`) nas rotas `/api`.

## 1) Auditoria do que ja existe no projeto

### 1.1 Funcional existente preservada

- Reservas online continuam em fluxo atual (checkout + aprovacao manual via WhatsApp/comprovante).
- Estoque continua sendo consumido em `PENDING`, `CONFIRMED`, `CHECKED_IN`, `IN_PROGRESS`.
- Estrutura principal de `Reservation`, `Cabin`, `Event`, `ClosedDate` permanece intacta.

### 1.2 O que foi adicionado na 2.1.1

- Novo dominio `ReservationDayConfig` (configuracao comercial por data).
- Novo status `DayConfigStatus` (`NORMAL`, `EVENT`, `PRIVATE_EVENT`, `BLOCKED`).
- Modulo admin separado em:
  - `Programacao` (`/admin/eventos`)
  - `Comercial` (`/admin/calendario`)
- API publica de calendario comercial (`/api/day-configs`).
- Integracao de regras comerciais no fluxo de reserva (`/api/reservations`).
- Disponibilidade dinamica por tipo de espaco (inclui mesas).
- Home com secao de proximos eventos (3 proximos, destaque do mais proximo).

### 1.3 Ajustes de UX ja aplicados

- Remocao de hardcode de Carnaval/Fevereiro na pagina de reservas.
- Data clicavel com contexto (titulo/release/lotes) no calendario.
- Mesas visiveis no card de espacos e liberadas por regra da data.

## 2) Arquitetura funcional (clara e objetiva)

### 2.1 Modulo 1: Programacao de Eventos (`/admin/eventos`)

Responsabilidade: conteudo e marketing do evento.

Campos operacionais:
- titulo, slug, tipo;
- data/hora inicio e fim;
- release curto e completo;
- flyer (poster), banner;
- atracao principal (DJ) e atracoes adicionais;
- valor de ingresso/couvert;
- ativo e destaque.

Saida: informacao editorial para site, home e divulgacao.

### 2.2 Modulo 2: Comercial por Data (`/admin/calendario`)

Responsabilidade: regra de venda e reserva por data.

Campos operacionais:
- status do dia (`NORMAL`, `EVENT`, `PRIVATE_EVENT`, `BLOCKED`);
- reservas habilitadas (sim/nao);
- titulo/release/flyer daquela data;
- destaque na home (opcional);
- itens reservaveis (bangalos, sunbeds, mesas, day use);
- sobrescrita de preco/consumacao por produto;
- lotes (1, 2, 3...) com data limite, valor e esgotado.

Saida: governanca comercial sem deploy.

### 2.3 Encadeamento entre modulos

- Em `Programacao`, cada card tem atalho para `Comercial` ja com `date/title/release/flyer` pre-preenchidos.
- Fluxo operacional padrao:
  1. cria evento;
  2. abre comercial da data;
  3. configura lotes, precos e itens liberados;
  4. publica e divulga.

## 3) Modelo de dados e compatibilidade

### 3.1 Entidades

- `Event` (existente): conteudo do evento.
- `ReservationDayConfig` (novo): regra comercial da data.

`ReservationDayConfig`:
- `date` (unico, `@db.Date`);
- `status`, `reservationsEnabled`;
- `title`, `release`, `flyerImageUrl`, `highlightOnHome`;
- `priceOverrides` (JSON por produto);
- `ticketLots` (JSON de lotes);
- `reservableItems` (JSON de liberacao).

### 3.2 Compatibilidade retroativa

- Mudanca aditiva: nao remove tabela/campo antigo.
- Se nao existir configuracao para a data, o sistema segue regra padrao atual.
- `closed-dates` legado continua funcionando junto com bloqueio novo.

## 4) Regras criticas de negocio

### 4.1 Estoque e hold (nao pode quebrar)

- Reserva em `PENDING` ja reduz disponibilidade imediatamente.
- So retorna estoque quando a reserva sai dos status que travam unidade.
- Mesas usam mesma logica de estoque das outras unidades.
- Controle opcional de expiracao de hold por ambiente:
  - `PENDING_HOLD_MINUTES=0` (padrao): comportamento atual, sem expiracao automatica.
  - `PENDING_HOLD_MINUTES>0`: pendencias antigas deixam de bloquear estoque nas consultas de disponibilidade/conflito.

### 4.2 Preco

Precedencia aplicada:
1. `priceOverrides` da data/produto;
2. preco de feriado (se houver);
3. preco base do espaco.

### 4.3 Bloqueio de data

- Se `status = BLOCKED` ou `reservationsEnabled = false`, o POST de reserva retorna indisponivel.
- Calendario publico mostra motivo da indisponibilidade.

### 4.4 Lotes

- Lotes sao configurados por data com corte (`endsAt`) e sinalizacao de `soldOut`.
- Exibicao no calendario orienta o cliente antes do checkout.

### 4.5 Itens reservaveis por data

- Ativacao granular para:
  - bangalos;
  - sunbeds;
  - mesas restaurante;
  - mesas praia;
  - day use.

## 5) Produtos reservaveis e convencao de estoque

Slugs suportados:
- `bangalo-lateral`
- `bangalo-piscina`
- `bangalo-frente-mar`
- `bangalo-central`
- `sunbed-casal`
- `mesa-restaurante`
- `mesa-praia`
- `day-use-praia`

Convencao de cadastro das unidades em `Cabin`:
- `Mesa Restaurante 1..N`
- `Mesa Praia 1..N`
- `Day Use Praia 1..N`

Sem unidades fisicas cadastradas em `Cabin`, o tipo fica indisponivel (comportamento seguro).

## 6) APIs envolvidas (mapa de impacto)

Publicas:
- `GET /api/day-configs`
- `GET /api/closed-dates`
- `GET /api/reservations/availability`

Admin:
- `GET/POST /api/admin/day-configs`
- `PATCH/DELETE /api/admin/day-configs/[id]`
- `GET/POST/PATCH/DELETE /api/events` e `/api/events/[slug]`

Reserva:
- `POST /api/reservations` com validacao de bloqueio e aplicacao de override de preco.

## 7) Plano de deploy sem perda de dados (obrigatorio)

### 7.1 Etapa A: backup antes de qualquer alteracao

1. Snapshot completo do banco (dump SQL) imediatamente antes do rollout.
2. Backup logico de tabelas criticas:
   - `Reservation`
   - `Payment`
   - `Cabin`
   - `Event`
   - `ClosedDate`

### 7.2 Etapa B: migracao aditiva

- Criar apenas enum/tabela nova e indices da 2.1.1.
- Nao alterar nem deletar estrutura de reservas existentes.
- Nao executar comandos destrutivos (`drop`, reset total, truncate).

### 7.3 Etapa C: deploy de aplicacao

- Deploy da versao nova apos migracao concluida.
- Como mudanca e aditiva, reservas ativas seguem operando.

### 7.4 Etapa D: smoke test de producao

Executar em janela controlada:
1. consultar calendario publico;
2. criar reserva teste e confirmar status `PENDING`;
3. validar deducao de estoque;
4. validar data bloqueada impedindo reserva;
5. validar override de preco no checkout.

### 7.5 Etapa E: rollback

- Se houver falha de app: rollback de versao de codigo.
- A tabela nova pode permanecer sem afetar dados antigos.
- Restauracao de backup completa somente em incidente grave com corrupcao (cenario extremo).

## 8) Operacao imediata para evento critico

Data critica informada: **14 de marco de 2026 (sabado)**.

Checklist operacional:
1. cadastrar o evento em `/admin/eventos` com release, flyer e atracoes;
2. abrir `Configurar precos/lotes`;
3. no `/admin/calendario`, definir:
   - `status = EVENT` ou `PRIVATE_EVENT` (conforme venda);
   - lotes com datas limite;
   - preco especial (exemplo: `180` com consumacao `100`, se validado comercialmente);
   - liberacao de `mesa-restaurante` e `mesa-praia` se a operacao permitir;
   - destaque na home (se for prioridade de divulgacao);
4. validar no front publico antes de anunciar no Instagram.

## 9) Criterios de aceite 2.1.1

1. Existe modulo claro de cadastro de evento (release/flyer/atracoes).
2. Existe modulo claro de gestao comercial por data (preco/lote/regras/mesas).
3. Hardcodes sazonais de Carnaval/Fevereiro foram removidos da reserva publica.
4. Reservas ativas e fluxo de `PENDING` permanecem intactos.
5. Time operacional consegue ajustar eventos e precos sem acionar desenvolvimento.

## 10) Pendencias controladas para fechamento total

1. Gerar e versionar SQL de migracao oficial da 2.1.1 (projeto hoje sem pasta `prisma/migrations`).
2. Confirmar no banco vivo a existencia das unidades `Mesa Restaurante` e `Mesa Praia` em `Cabin`.
3. Executar checklist de homologacao com usuario de operacao antes do anuncio comercial.
