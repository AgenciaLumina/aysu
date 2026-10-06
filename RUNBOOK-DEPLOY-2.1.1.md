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

## Atualização de reservas de 06/10/2026

A implantação foi autorizada por Paulo. Produção: `ssh thor`, aplicação Coolify
`aclqgsecaugacfoijjslivtg`, banco PostgreSQL `gyyqmlviiyip8eeecvgqkfjk`, database `aysu`.
A imagem é construída com `Dockerfile`; `.github/workflows/image.yml` publica a imagem
no GHCR por commit. Fixar o commit no Coolify evita retorno a uma versão antiga.

### Operação das condições

Em **Calendário Comercial**, abra as condições da categoria no padrão ou em uma data.
Preços e consumação podem ser por pessoa ou por estrutura. Day Use Praia é sempre por
pessoa e permite inicialmente 1 a 6 participantes por reserva. Seu estoque é de pessoas;
um grupo não compra uma Mesa de Praia exclusiva. A acomodação continua com a equipe.
O máximo por reserva e as vagas totais podem ser configurados. Não foram cadastrados
preços ou datas fictícios para a temporada, nem ativadas categorias antes desativadas.

O campo **Aplicar até** inclui a data final. Eventos e bloqueios independentes são
preservados. Datas pertencentes ao mesmo período podem ser alteradas em conjunto;
para criar uma exceção individual, remova o fim do período ao editar aquela data.
Campos vazios usam os padrões. Por pessoa, o mínimo cobrado também determina o
crédito de consumação; confira o resumo antes de oferecer a condição ao público.
A chegada padrão é 10h a 12h. No-show e liberação continuam sendo decisões da equipe.

Cada nova reserva registra quantidade, valores, regras, acesso à piscina e horários
contratados. Editar as condições não recalcula reservas existentes. Registros antigos
mantêm os valores e ocupam uma unidade de estoque; sua quantidade de integrantes
não é inferida. Novas reservas de estruturas recebem número interno de unidade.

O checkout consulta e recalcula o preço no servidor. Valores na URL não são aceitos
como preço. Criação, aprovação, check-in e remarcação usam trava transacional por
categoria; alterações comerciais usam as mesmas travas. Reativação, remarcação e
aprovação de reserva pendente cujo prazo de retenção expirou revalidam estoque.
Aprovar uma reserva que ainda ocupa estoque preserva as condições contratadas,
inclusive após redução da capacidade futura. Reenvio com o mesmo `requestId`
não duplica reservas. O recibo utiliza token aleatório e não expõe dados pessoais.
A solicitação permanece PENDING até validação do comprovante pela equipe.

### Migração e verificação

Aplicar `20261006160000_reservation_participants_conditions` com backup prévio. A
migração somente adiciona colunas e índices. Não muda preços, liberações ou reservas.
Executar `prisma migrate deploy` no ambiente de produção; nunca `db push` ou reset.

`node scripts/test-reservation-logic.mjs` exige banco descartável `aysu_isolated`, app
em localhost, `DATABASE_URL`, `JWT_SECRET` de teste e opcionalmente `TEST_BASE_URL`.
O script apaga exclusivamente os dados desse banco de teste e usa fixtures sintéticas.
Não executa pagamentos nem envia mensagens. Valida grupos, preço adulterado, aceite,
estoque, concorrência, reenvio, unidades legadas, cancelamento, reativação, remarcação,
condições por data e atualização de períodos com preservação de exceções.

Backup e imagem de reversão ficam no Thor em
`/root/aysu-ops/20261006-conditions/rollback/` e `aysu:rollback-20261006-conditions`.
Contêm material privado e não devem ser anexados nem copiados ao repositório.
Em falha de aplicação, restaurar a imagem e o compose anterior; manter a migração
aditiva. Restauração de banco exige reconciliação de novas reservas após o backup.

A checagem do Coolify exige `GET /api/health` com HTTP 200. Validar essa rota na
imagem candidata com o mesmo comando de healthcheck antes de substituir a aplicação.
Ela confirma liveness; consultas de configuração/cotação confirmam acesso ao banco.

Preservar também `GET /api/ready`, que consulta o banco e retorna HTTP 503 se ele
não estiver acessível. Comparar os manifests de rotas da imagem anterior e candidata
para detectar outras divergências entre repositório e produção antes de implantar.

Em 06/10/2026, a imagem `sha-d29251f02c2b1d772a24f8f5e7c625ba803b71ec`
foi verificada em produção com healthcheck saudável e `/api/health` e `/api/ready`
respondendo HTTP 200. Os 33 cenários comerciais passaram em banco isolado. A seleção
e o checkout públicos foram conferidos no celular sem criar reservas reais. As 1.356
reservas e os demais dados comerciais mantiveram todos os valores anteriores; o Day
Use permaneceu desativado globalmente. O registro privado da verificação fica em
`/root/aysu-ops/20261006-conditions/verification.json`.
