# Runbook de Deploy - Sprint 2.1.1

> Estado atual em 26/10/2026: produção na Vercel e no Loki. A aplicação e o banco
> da Aysú no Thor estão parados. A seção final
> [Produção Vercel e Loki](#producao-vercel-e-loki-concluida-em-26102026)
> prevalece sobre os registros históricos de preparação e publicação no Thor.

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

## Correção do calendário de 07/10/2026

Desmarcar um produto em **Produtos liberados para esta data** retira a categoria da
seleção pública daquela data. A disponibilidade diária, mensal e por horário passa
a respeitar a mesma configuração usada pela cotação e pela criação da reserva.
Editar parcialmente uma data preserva status, liberação e destaque não enviados.

Em **Calendário Comercial**, editar a data e escolher **Status do dia → Aguarde
programação**. Esse status impede novas reservas e informa
ao público que a programação ainda será divulgada. A opção de reservas online fica
desmarcada e bloqueada enquanto o status estiver ativo. Para liberar, selecionar
o status adequado e marcar **Reservas online habilitadas**. Uma programação especial
liberada mantém a precedência existente sobre um bloqueio antigo de evento fechado;
operação normal continua respeitando esses bloqueios antigos.

Não há conversão automática de datas bloqueadas ou eventos privados. Aplicações de
condições por período preservam datas independentes que aguardam programação.
A migração `20261007130000_waiting_reservation_release` somente acrescenta o valor
`WAITING_RELEASE` ao enum, sem alterar registros comerciais ou reservas.

Backup desta correção: `/root/aysu-ops/20261007-calendar/rollback/`; imagem anterior:
`aysu:rollback-20261007-calendar`. Antes de reverter para uma imagem sem esse status,
verificar se já existem datas `WAITING_RELEASE`. Se existirem, salvar seus registros
em arquivo privado e representá-las temporariamente como `BLOCKED`, mantendo
`reservationsEnabled=false`, pois o cliente Prisma antigo não conhece o novo valor.
Não remover o valor do enum nem restaurar o banco inteiro para uma reversão de código.

Publicada a imagem `sha-8a4f0c6e4a6873636b218b6dfca2ac6ccdf3c1e5` com 46 verificações
comerciais em banco isolado, tipos/lint/build aprovados e conferência de desktop e
celular na imagem compilada. A seleção pública de 11/10/2026 foi verificada com
Mesa Praia oculta, estoque zero para essa categoria e Day Use ainda habilitado.
As 1.373 reservas e os demais registros comerciais preservaram todos os valores.
Evidências privadas: `/root/aysu-ops/20261007-calendar/verification.json`.

Após a troca do container, validar primeiro `/api/ready` internamente e depois o
domínio público. O proxy pode retornar `503 no available server` brevemente após
o container ficar saudável. Usar tentativas limitadas durante até 30 segundos para
permitir a atualização da rota; nesta implantação a segunda tentativa, após dois
segundos, respondeu HTTP 200. Se não recuperar, restaurar a imagem anterior com as
precauções para o novo status acima. Um HTTP 200 interno isolado não conclui o deploy.


## Seleção de participantes

Na seleção pública, a quantidade de pessoas aparece diretamente abaixo do espaço
escolhido e na barra antes de continuar. **Alterar** leva novamente ao seletor;
selecionar o mesmo espaço preserva a quantidade já escolhida.

Day Use limita pessoas pelas vagas restantes e pelo máximo por reserva. Estruturas
continuam distinguindo capacidade de integrantes e número de unidades. Se o estoque
cair, a quantidade é ajustada com aviso. Sem vagas, o seletor e Continuar ficam
bloqueados. **Consultar novamente** permite atualizar a consulta. Continuar confere
novamente a disponibilidade antes de avançar; respostas antigas de cotação são
descartadas. O botão do WhatsApp não cobre Continuar.

A alteração preserva preços, consumação, capacidade total, regras e reservas
existentes e utiliza o schema atual, sem migração.

Para conferir a interface, usar larguras de 320, 390, 768 e 1280 pixels e cenários
isolados de uma vaga restante, esgotamento, redução de estoque e resposta atrasada.
Verificar a quantidade na barra, a ação Alterar e o avanço ao checkout. Interceptar
as APIs com fixtures sintéticas em testes visuais para não criar reservas nem
pagamentos reais. Consultas reais somente de leitura devem ser registradas
separadamente; uma data de teste não comprova um incidente de data desconhecida.

## Preparacao Vercel e Loki em 26/10/2026

O pedido atual define Vercel para site, APIs e painel, e Loki para PostgreSQL.
Esta seção substitui o destino Thor apenas para a futura implantação deste projeto.
**A produção permanece no Thor. Esta preparação não publica nem altera DNS.**
As imagens persistentes continuam no bucket R2 `aysu` e na CDN existente.
Não foi encontrada dependência de volume local ou worker contínuo na aplicação.

### Origem e preservação

- Origem conferida: app Coolify `aclqgsecaugacfoijjslivtg`, imagem
  `ghcr.io/agencialumina/aysu:sha-da3bdd05c160bec0176dd44c9af5223f2615f186`.
- O código de preparação parte de `origin/main` em `619e192`, incluindo a correção
  de seleção de participantes. A branch local é `codex/preparacao-vercel-loki`.
- Banco original: container `gyyqmlviiyip8eeecvgqkfjk`, PostgreSQL 17.11, database
  `aysu`. Snapshot com 19 tabelas, 1.505 reservas, 55 espaços e zero pagamentos.
- O dump e as assinaturas de todas as tabelas usam o mesmo snapshot exportado em
  transação `REPEATABLE READ READ ONLY`. Nenhuma reserva foi congelada ou alterada.
- SHA-256 do dump de ensaio:
  `54208d1f1d289a3201a50a4e495d3e35897e0f698bbf5cf320bda2a9c4cdfa85`.
- Evidências privadas e backup: `/root/aysu-ops/20261026-vercel-loki/` em Thor e
  Loki; cópia local em `~/.local/share/aysu-ops/20261026-vercel-loki/`.
  Os diretórios têm acesso restrito. Não anexar dumps, configurações de autenticação
  ou arquivos `*private*` e `*env*` ao Git, chamados ou relatórios públicos.

### Destino preparado

- Vercel: projeto `aysu`, equipe `agencialuminaportoalegre02-7627s-projects`,
  Node `22.x`, Next.js, região `gru1` e funções de API com limite de 60 segundos.
  Sem vínculo Git, deployments ou domínio de produção nesta preparação.
  `vercel.json` desativa deploys automáticos por Git; ativá-los exige decisão própria.
- Build Vercel: `npm run build:vercel`. Instalação: `npm ci --no-audit --no-fund`.
  `prisma generate` faz parte do build; `prisma migrate deploy` não faz.
- Loki: cópia `aysu_rehearsal_20261026` no cluster PostgreSQL 17, porta local 5417.
  Owner exclusivo sem login `aysu_stage_owner_20261026`; login exclusivo
  `aysu_preview_20261026` com SELECT e transações somente leitura, sem privilégios
  administrativos. As 19 assinaturas conferem integralmente após a restauração.
- PgBouncer 1.26.1: alias `aysu_rehearsal`, modo transaction, pool de 3 conexões,
  máximo de 4 para a base. Foram acrescentadas somente a entrada e a credencial
  desta cópia, com backup das configurações anteriores e reload, sem restart.
- Endpoint `db-loki.agencialumina.com.br:6432`, certificado TLS válido para o host.
  Prisma usa `sslmode=require&sslaccept=strict&connection_limit=2&pool_timeout=20&connect_timeout=15`.
  `max_prepared_statements=100` já está habilitado; não foi necessário `pgbouncer=true`.
- SSH direto apresentou intermitência; a rota `ssh -J thor loki` funcionou.
  Nenhum alias SSH ou regra de firewall foi alterado.

### Variáveis e isolamento

As sete variáveis de Preview estão configuradas: `DATABASE_URL`, `DIRECT_URL`,
`JWT_SECRET`, `APP_READ_ONLY_MODE=1`, `PENDING_HOLD_MINUTES=0`, `MAINTENANCE_MODE=false`
e `R2_PUBLIC_URL`. As três primeiras estão marcadas como Secret na Vercel.
Preview usa a cópia isolada e JWT próprio. Não recebeu chaves de R2, Resend ou Rede.
Não há credenciais de produção cadastradas no projeto Vercel nesta etapa.

Na Vercel, `DIRECT_URL` repete a URL pooled apenas para satisfazer a configuração
Prisma; ela **não serve para migrar**. Operações Prisma de schema devem usar conexão
direta pela porta 5417 através de túnel SSH, com credencial operacional apropriada.
O usuário de Preview não pode migrar nem gravar. Nenhuma porta PostgreSQL direta
foi exposta publicamente.

`npm run deploy:check` não acessa serviços. Verifica variáveis obrigatórias, TLS,
limites de conexão, segredo JWT e modo de escrita. Bloqueia Preview com credenciais
de serviços operacionais e Production sem R2, Resend ou escrita explicitamente
habilitada. O exemplo completo está em `.env.example`, sem valores secretos.

### Validação executada

O teste com login somente leitura encontrou DDL legado em consultas de reservas
e nas rotas de galeria: `CREATE TYPE`, `ALTER TABLE` e `CREATE INDEX` eram executados
mesmo com as migrações aplicadas. Essa inicialização redundante foi retirada dessas
rotas, que agora dependem das migrações versionadas já presentes no banco restaurado.
Não foram alterados layout, preços, regras de reserva ou dados comerciais.
Outros fallbacks legados para bancos incompletos permanecem fora desta correção;
o deploy deve restaurar o schema completo, nunca iniciar sobre uma base vazia.

- `npm run build` e `npm run typecheck` aprovados.
- `vercel build` de Preview executado localmente: instalação pelo lockfile,
  preflight, compilação e geração das funções aprovados. Não é execução remota.
  Não publicar o artefato prebuilt gerado neste Mac; a publicação final deve ser
  recompilada no ambiente Linux da Vercel com as variáveis de Production.
- `npm run lint`: zero erros e 35 avisos preexistentes, preservados nesta mudança.
- `node scripts/test-reservation-logic.mjs`: 46 cenários aprovados em PostgreSQL 17
  descartável, database local `aysu_isolated`, sem dados reais, e-mails ou pagamentos.
  Reexecutados com sucesso após retirar o DDL das requisições.
- `node scripts/test-read-only-preview.mjs`: 16 verificações aprovadas com o app
  compilado em localhost e a cópia real no Loki. Disponibilidade, conteúdo e galeria
  consultados; APIs privadas negaram acesso e as quatro tentativas de escrita com
  payload vazio foram bloqueadas pelo middleware. Nenhum dado pessoal foi exibido.
- Galeria em banco sintético: sete verificações de permissão, criação, duplicação,
  leitura pública, edição, exclusão e registro inexistente aprovadas. Sem upload.
- Sete casos do preflight conferidos: Preview válido, TLS ausente, JWT ausente,
  Preview com escrita, Preview com e-mail, Production incompleta e URL inválida.
- Conexão externa ao Loki validada com certificado e hostname (`verify-full` no
  psql e `sslaccept=strict` no Prisma). Contagem de 1.505 reservas confirmada.
- Três transações Prisma concorrentes com trava transacional passaram pelo pool.
  Uma tentativa de UPDATE sem linhas afetadas foi recusada pelo usuário de leitura.
- Após os testes, as 19 assinaturas da cópia permaneceram idênticas ao snapshot.
  O endpoint público `/api/ready` da produção no Thor continuou respondendo 200.
  Leitura final da Vercel confirmou zero deployments e nenhuma variável Production.
  Os servidores de teste e o PostgreSQL descartável local foram encerrados.

`prisma migrate diff` somente de leitura, pela conexão direta via túnel SSH,
identificou divergências **preexistentes** entre o banco restaurado e o schema:
coluna adicional `Event.spacePricesOverrides`, defaults `now()` em `updatedAt`
de cinco tabelas e default `{}` em `SiteContentConfig.content`.
O retorno 2 desse comando indica essas diferenças; não foi aplicado SQL.
Todos esses campos/defaults e os nove registros de migração foram preservados.
Não usar `db push` nem aplicar o SQL sugerido pelo diff, que removeria a coluna.
O escopo desta transferência é restaurar fielmente o banco operacional existente.

### Publicação futura e reversão

1. Autorizar a janela de publicação. Validar a capacidade agregada do Loki, pois
   o cluster e PgBouncer atendem outros projetos. Não aumentar limites globais
   ou reiniciar serviços compartilhados como parte desta loja.
2. Criar destino operacional separado da cópia de ensaio, com usuário de aplicação
   exclusivo e limites dimensionados. Não promover o login somente leitura.
3. Congelar temporariamente as escritas do app Thor, com responsável operacional.
   Gerar **novo** snapshot consistente e fingerprints. O dump desta preparação
   envelhece enquanto novas reservas entram no Thor e não pode ser o backup final.
4. Restaurar no destino operacional vazio, conferir todas as tabelas, schema e
   histórico de migrações. Nunca usar reset, db push ou restore destrutivo na origem.
5. Configurar Production na Vercel: banco operacional, JWT atual do Thor para
   preservar sessões, R2 e Resend atuais, contatos existentes, hold `0`, manutenção
   `false` e `APP_READ_ONLY_MODE=0`. Não habilitar Rede: suas credenciais não estavam
   presentes na produção conferida e o fluxo atual tem aprovação manual.
6. Fazer novo build Production e publicar somente após esses itens. Não promover
   diretamente o artefato de Preview, que utiliza somente leitura e JWT próprio.
   Conferir no runtime Vercel: readiness com
   banco, login/permissões, disponibilidade/cotação, cabeçalhos sem cache nas rotas
   privadas e upload respeitando o limite existente de 4 MB após otimização.
   Testes com envio de e-mail, upload real ou operação financeira exigem escopo
   próprio. Não gerar reservas de teste na operação sem controle explícito.
7. Só então trocar o domínio e validar acesso externo. Manter a imagem e os dados
   do Thor para reversão, com apenas um banco aceitando novas reservas de produção.
8. Antes de qualquer escrita no Loki, a reversão pode devolver tráfego ao Thor.
   Depois de novas reservas no Loki, não apontar simplesmente ao banco antigo:
   congelar escritas, reconciliar os registros e definir a única fonte válida.

Para desfazer somente o ensaio, remover apenas o alias/login `aysu_rehearsal` do
PgBouncer e recarregar, após conferir que não há conexões. Não restaurar o arquivo
global de backup por cima de alterações de outros projetos. A exclusão da cópia
e das roles fica para uma limpeza explicitamente autorizada.

Referências técnicas consultadas:
[configuração Vercel](https://vercel.com/docs/project-configuration/vercel-json),
[limites de funções](https://vercel.com/docs/functions/limitations) e
[Prisma 6 com PgBouncer](https://www.prisma.io/docs/orm/v6/prisma-client/setup-and-configuration/databases-connections/pgbouncer).

## Producao Vercel e Loki concluida em 26/10/2026

Paulo confirmou diretamente a conclusão da migração, incluindo DNS e retirada do
Thor, e depois autorizou cadastrar e verificar o domínio na mesma conta Resend.
O corte final ocorreu às 13:28 UTC, 10:28 BRT. O DNS foi conferido após 13:29 UTC.
A primeira tentativa foi revertida automaticamente por interrupção SSH antes da
troca do DNS. A tentativa final abriu uma sessão SSH direta persistente para o
Loki antes de pausar a origem e gerou um novo snapshot consistente.

### Arquitetura operacional

| Componente | Destino atual |
| --- | --- |
| Aplicação | Vercel, projeto `aysu`, Node 22, funções em `iad1` |
| Revisão publicada | `02dee22`, branch `codex/preparacao-vercel-loki` |
| Deployment | `dpl_7pm7KQwpDJ3Z22WLry7eT7p5ctmi` |
| Domínio principal | `https://aysubeachlounge.com.br` |
| PostgreSQL | Loki, versão 17, database `aysu_production_20261026` |
| Conexão da aplicação | TLS estrito em `db-loki.agencialumina.com.br:6432`, alias `aysu` |
| Porta PostgreSQL interna | `127.0.0.1:5417`, administração por SSH |
| Papéis exclusivos | `aysu_prod_owner` sem login; `aysu_app` sem superusuário |
| Limites do pool | 4 conexões padrão, máximo 6; Prisma usa 2 por instância |
| Mídia | R2, bucket `aysu`, CDN existente preservado |
| Preview | Banco `aysu_rehearsal_20261026`, leitura, JWT separado, sem chaves operacionais |

As credenciais administrativas e hashes de senha foram preservados integralmente
na cópia. O JWT original foi mantido para preservar sessões. A proteção dos URLs
`vercel.app` permanece ativa; os domínios próprios atendem o público. O deployment
Production foi compilado na Vercel; não foi usado artefato prebuilt do Mac.

### DNS efetivamente aplicado

| Nome | Tipo | Destino | TTL / estado |
| --- | --- | --- | --- |
| `aysubeachlounge.com.br` | A | `216.150.1.1` | 60 s, somente DNS |
| `www` | CNAME | `369d8df2484618cf.vercel-dns-016.com` | 60 s, somente DNS |
| `_vercel` | TXT | Verificação de controle de domínio fornecida pela Vercel, para apex e www | Verificados |
| `rsend` | CNAME | `send.forge.rmta.net` | Automático, somente DNS, verificado no Resend |

O `www` redireciona com HTTP 308 para o apex, preservando caminho e consulta.
Os nameservers Cloudflare e os registros de recebimento de e-mail foram mantidos.
Antes da troca, os dois registros web apontavam para `179.198.126.210`, TTL 600 s.
A exportação BIND anterior está no diretório privado de evidências.

### Variáveis e integrações

Production contém 17 variáveis de aplicação conferidas: `DATABASE_URL`,
`DIRECT_URL`, `DATABASE_URL_UNPOOLED`, `JWT_SECRET`, `R2_ACCOUNT_ID`,
`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`,
`R2_PUBLIC_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CONTACT_TO_EMAIL`,
`MAINTENANCE_MODE`, `APP_READ_ONLY_MODE`, `PENDING_HOLD_MINUTES` e
`NEXT_PUBLIC_APP_URL`. Credenciais e URLs com senha foram cadastradas como Secret.
Variáveis de sistema como `NODE_ENV`, `PORT` e `HOSTNAME` pertencem à plataforma.

- Os três nomes de conexão apontam para Loki com certificado estrito,
  `connection_limit=2`, `pool_timeout=20` e `connect_timeout=15`.
- `DIRECT_URL` e `DATABASE_URL_UNPOOLED` são aliases de compatibilidade do runtime
  e também usam PgBouncer. **Não executar migrações por essas URLs.** Usar conexão
  operacional local no Loki para uma migração futura explicitamente planejada.
- `APP_READ_ONLY_MODE=0`, `PENDING_HOLD_MINUTES=0`, `MAINTENANCE_MODE=false`.
- `NEXT_PUBLIC_APP_URL` preserva o valor anterior com `www`; o redirecionamento
  canônico mantém o acesso ao domínio principal.
- JWT, R2, remetente e destinatários foram reaproveitados da origem. Não foram
  habilitadas credenciais Rede. O checkout Pix com aprovação manual foi preservado.
- Preview mantém somente sete variáveis, banco de leitura e bloqueio de escrita.
  Nenhuma chave R2 privada, Resend ou Rede foi fornecida ao preview.

A chave Resend anterior não apresentava o domínio Aysú na listagem. Após aprovação
específica, foi cadastrado `aysubeachlounge.com.br`, região `sa-east-1`, na mesma
conta acessada pela chave já configurada no Thor. Não foi criada ou trocada chave.
Identificador do domínio no provedor: `d9ee9c5c-40e9-44af-a8a9-4445140a0245`.
A API usada não retornou nome ou ID da conta; não se deve inferi-lo do outro domínio
listado. O efeito da alteração é autenticar o envio da Aysú; recebimento permanece
desabilitado no Resend e os MX da caixa postal não foram alterados.

| Registro de envio | Tipo | Conteúdo/finalidade | Verificação |
| --- | --- | --- | --- |
| `resend._domainkey` | TXT | Chave pública DKIM já presente, conferida com o retorno da API | Verificado |
| `send` | MX | Prioridade 10, `feedback-smtp.sa-east-1.amazonses.com`, retorno de envio | Verificado, preservado |
| `send` | TXT | `v=spf1 include:amazonses.com ~all` | Verificado, preservado |
| `rsend` | CNAME | `send.forge.rmta.net`, autenticação da infraestrutura de envio | Verificado, adicionado |

Status final do domínio no Resend: `verified`, quatro registros verificados.
Não foram enviados e-mails reais. Cadastro e verificação seguem a
[API de domínios do Resend](https://resend.com/docs/api-reference/domains/verify-domain).

### Integridade, validação e limites do aceite

O snapshot final preservou as 19 tabelas e seus fingerprints, 1.505 reservas,
55 espaços, dois usuários e nove migrações. Divergências preexistentes de schema
foram mantidas. Não foi aplicado `db push`, reset ou migração na origem.
SHA-256 do dump final:
`35c76680d3c6b972d075ff4c36dcae27ec325303d153509a6c79c0145a93e1a7`.

A inicialização da primeira candidata criou uma configuração padrão no destino
novo, ainda sem tráfego público. Essa tabela foi preservada em dump privado antes
da restauração integral. A comparação final confirmou os valores da origem.

Evidências adicionais aos testes isolados documentados na preparação:

- 13 verificações na prévia real da Vercel: consultas públicas, acesso indevido e
  bloqueio das escritas com payload vazio. Readiness confirmou Loki conectado.
- Nove verificações na candidata Production: readiness, espaços, configuração,
  conteúdo, galeria, disponibilidade e restrição de rotas privadas.
- Oito verificações no domínio público: sessão JWT curta de administrador validada
  contra usuário existente, leitura administrativa e conteúdo, acesso não autenticado
  negado, payloads inválidos de contato/reserva/pagamento recusados com 400.
  O token de validação expirou em dois minutos e não foi documentado.
- Escrita no Loki verificada por UPDATE dentro de transação com ROLLBACK, sem
  persistir alteração de cliente. Não foram criadas reservas fictícias em produção.
- Fluxo renderizado no Chrome: home, calendário, disponibilidade para 30/10,
  cotação de Bangalô Lateral e checkout com resumo e campos de cliente. Sem envio
  do pedido, pagamento ou comprovante. Nenhuma mudança de layout foi realizada.
- R2 autenticado, listagem e leitura de metadados de objeto existentes bem-sucedidas.
  Upload e exclusão reais não foram executados.
- TLS público válido, `server: Vercel`, função em `iad1`, `/api/ready` 200 e banco
  conectado, inclusive após parar aplicação **e banco** da Aysú no Thor.
- DNS validado no autoritativo e nos resolvedores 1.1.1.1 e 8.8.8.8.
- Inspeção de cinco páginas e 21 arquivos JavaScript públicos não encontrou os
  valores das credenciais de banco, JWT, R2 ou Resend cadastradas em Production.
- Consulta dos logs entre 13:29 e 13:35 UTC: nenhum erro de runtime e nenhum HTTP
  5xx retornado pela Vercel. Essa evidência é limitada à janela consultada.

Os testes isolados anteriores continuam sendo a evidência de criação, concorrência
transacional e idempotência. O aceite da migração não representa cobrança real,
entrega de e-mail, teste de senha digitada pelo usuário ou validação visual mobile.

### Backup e independência do Thor

Os containers antigos `aclqgsecaugacfoijjslivtg` (app) e
`gyyqmlviiyip8eeecvgqkfjk` (banco) estão `exited`, com restart `no`.
Volumes, imagens e configuração de reversão foram preservados. O servidor Thor
como um todo não foi desligado e os projetos de terceiros não foram alterados.
O acesso operacional e a transferência final usaram SSH direto ao Loki.

- Backup pgBackRest do cluster 17 concluído após a migração:
  `20261025-140955F_20261026-133422D`, incluindo WAL confirmado.
- O banco pertence ao cluster já coberto pelos timers `loki-db-backup.timer` e
  `loki-drive-backup.timer`; nenhuma configuração global desses serviços foi editada.
- Pacote dedicado Aysú criptografado e enviado ao remoto de backup existente do Loki:
  `aysu-recovery-20261026T133540Z.tar.gpg`, 189.847 bytes. Inclui dump atual do Loki,
  variáveis de aplicação, configuração dos papéis e manifesto do corte.
- Upload e leitura de retorno confirmaram SHA-256
  `040a00e022bc868e47f3412916dd711dbda04f2ab4edb3fbe27b80dec555ecb1`.
  A descriptografia também foi conferida, com a lista dos arquivos esperados.
  Chave de recuperação guardada separadamente no Mac e no Loki; não está no Git
  nem no pacote enviado. Variáveis futuras exigem renovar esse pacote de configuração.

Evidências privadas, com dados e segredos fora do repositório:
`~/.local/share/aysu-ops/20261026-cutover/` no Mac;
`/root/aysu-ops/20261026-cutover-final/` e
`/root/aysu-ops/recovery-20261026/` no Loki.

### Publicações e recuperação a partir deste estado

1. Usar a revisão atual do repositório, Node 22, `npm ci`, lint/tipos e testes
   isolados proporcionais à alteração. Manter `iad1` e o pool exclusivo da Aysú.
2. Publicar com build Linux na Vercel e as variáveis Production. Não incluir `.env`,
   dumps ou chaves no upload. Usar `--skip-domain` para validar antes da promoção.
3. Conferir domínio público, logs, autenticação e banco após a promoção. Não executar
   migração de schema automaticamente no build ou reaplicar o dump de 26/10.
4. Para falha de código, preferir uma versão Vercel compatível com o banco Loki atual.
   A prévia de leitura não é candidata de rollback operacional.
5. Para recuperação de dados, restaurar primeiro em banco separado e validar
   fingerprints e operação. Desde o corte, Loki é a única fonte operacional.
6. **Não reativar simplesmente o Thor nem restaurar seu DNS.** Novas operações
   podem ter ocorrido no Loki. Congelar escrita e reconciliar os dados antes de uma
   eventual volta de infraestrutura; manter somente um banco operacional.
