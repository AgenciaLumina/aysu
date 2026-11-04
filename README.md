# Aysú Beach Lounge

Site, reservas e administração em Next.js 16, React 19 e Prisma 7. Usar Node 22
e `npm ci`, preservando o lockfile. A configuração atual fica em
[wrangler.jsonc](wrangler.jsonc). O [runbook anterior](RUNBOOK-DEPLOY-2.1.1.md) preserva o histórico da migração.

## Produção Cloudflare e D1

Desde 02/11/2026, a aplicação usa o Worker `aysu` e o D1 configurado em `wrangler.jsonc`, com mídia no R2. Domínio: https://aysubeachlounge.com.br. Loki/PostgreSQL e a execução anterior na Vercel são referências históricas. Preserve as reservas mais recentes do D1 ao consultar ou reconciliar a origem; não restaure um dump antigo sobre o banco ativo.

Reservas usam o batch nativo em `src/lib/reservation-booking.ts`. Capacidade, confirmação, check-in e cancelamento são protegidos contra concorrência e repetição. O segredo JWT vem do binding da requisição. Instantes são persistidos em UTC e datas comerciais usam `America/Sao_Paulo`. Build para Cloudflare: `npm run cf:build`; não executar migrações no build nem apontar testes para o banco operacional.

Em 03/11/2026 foram restauradas 10 chaves estrangeiras e 13 verificações de enumerações de origem. Os registros atuais são copiados e comparados dentro de um único batch; índices, valores e a guarda das reservas são preservados. O operador privado `scripts/apply-d1-integrity.cjs` começa em leitura e exige banco exato, hash revisado e backup restaurado com menos de 30 minutos para aplicar. A reversão de esquema foi ensaiada mantendo novos registros; reverter infraestrutura exige conciliar as escritas novas e controlar os escritores.

Regressões isoladas: `node scripts/test-d1-integrity.cjs` e `node scripts/test-d1-booking.cjs`. O teste de reservas usa o esquema completo com as restrições nativas. Os comandos históricos `build:vercel` e o runbook anterior não definem o destino atual.

## Upload de imagens

Todos os seletores administrativos usam `src/lib/upload-client.ts`: a imagem é convertida para AVIF em um Web Worker no navegador, inclusive arquivos pequenos, com codecs servidos pelo próprio site. O lado maior fica limitado a 2200 px e o arquivo convertido a 4 MB; transparência e orientação são preservadas. HEIC/HEIF usam decodificador local quando o navegador não os lê diretamente. Lotes são convertidos em sequência para limitar o uso de memória. Não há envio a um serviço externo de conversão.

`/api/upload` exige autenticação e valida o contêiner AVIF antes da gravação. Upload, listagem e exclusão utilizam o binding `MEDIA_BUCKET` do R2 no Cloudflare, sem Sharp nativo nem credenciais S3 nessas operações em produção. Os arquivos existentes não são reconvertidos. A biblioteca e o seletor percorrem todas as páginas do R2, sem truncar em 200 arquivos, e exibem os uploads mais recentes primeiro. A listagem usa `nextCursor` e `Cache-Control: private, no-store`; mudanças de pasta cancelam leituras anteriores. Após um envio concluído, o painel atualiza a biblioteca e limpa a busca para deixar o novo arquivo visível. Após atualizar uma versão antiga do painel, recarregue a página para receber o conversor. Teste isolado, sem recursos de produção: `node scripts/test-image-upload.cjs`.

## Fotos dos espaços e reserva em duas etapas

Em **Espaços > Editar**, o cliente pode enviar várias fotos, escolher arquivos existentes, ordenar, definir a capa e incluir legendas (até 20 fotos). Salvar publica a galeria na página de reservas. Remover uma foto da galeria apenas desfaz o vínculo; não apaga o arquivo do R2. A imagem anterior permanece como capa inicial. As fotos devem representar o espaço cadastrado. Os Bangalôs Laterais 1 a 6 têm cadastros, descrições, galerias e disponibilidade individuais; o visitante escolhe exatamente qual reservar. Cada cadastro numerado representa uma única unidade. Os preços, a consumação e as condições do Calendário Comercial continuam sendo herdados de Bangalô Lateral, incluindo exceções por data. Links antigos da categoria continuam alocando uma das unidades livres.

O campo `Cabin.galleryImages` é acrescentado pela migração aditiva `scripts/sql/20261104-cabin-gallery.sql`. Antes de aplicar, conferir a coluna, guardar/restaurar um backup e ensaiar a preservação dos valores existentes. Aplicar uma vez, fora do build. O código anterior continua compatível com essa coluna adicional; em rollback de aplicação, mantenha os dados e não restaure um banco antigo. POST/PATCH de espaços usam `src/lib/d1-cabins.ts`, exigem ADMIN/MANAGER ativo e revalidam leituras/permissões no batch nativo. PATCH de fotos não redefine estoque, categoria, preço ou visibilidade. Teste: `node scripts/test-d1-cabins.cjs`.

O checkout agora separa **dados e aceite** de **pagamento**. “Seguir com a reserva” aguarda a gravação de uma reserva PENDING e o bloqueio de disponibilidade antes de abrir `/reservas/sucesso` com o token do comprovante. Só uma reserva pendente e vigente mostra o Pix. Recarregar a página de pagamento consulta a mesma reserva; repetir uma solicitação mantém seu identificador e não duplica o registro. O WhatsApp abre apenas quando a pessoa clicar em enviar comprovante. A chave, o destinatário, as condições comerciais, a aprovação manual e `PENDING_HOLD_MINUTES` permanecem como configurados. Não interpretar a exibição do Pix ou o clique no WhatsApp como pagamento confirmado. Testes isolados: `node scripts/test-two-step-reservation.cjs` e `node scripts/test-d1-booking.cjs`.

O texto sobre acomodação do Day Use é editável em **Calendário Comercial > Configuração padrão (dia a dia) > Condições da reserva por categoria > Day Use Praia > Texto de acomodação do Day Use > Salvar padrão**. A configuração de uma data/período pode substituir esse texto; campo vazio herda o padrão. Sem personalização, permanece a mensagem anterior. O campo `accommodationText` integra as condições contratadas das novas reservas; editar o padrão não reescreve reservas anteriores. Teste isolado: `node scripts/test-day-use-accommodation.cjs`.

A separação das seis unidades reaproveita os IDs existentes, sem acrescentar estoque e sem apagar ou reescrever reservas. O planejador operacional `scripts/lib/individualize-lateral.cjs` exige seis registros no formato anterior e ausência de reservas futuras ativas, guarda os valores lidos e aplica o conjunto em um batch atômico. Uma reserva nova ou edição concorrente cancela a operação. Antes de aplicar, exportar e restaurar um backup, comparar os dados, publicar primeiro o código compatível e revalidar as condições. A reversão dos seis cadastros também exige verificação de reservas futuras e valores atuais; nunca restaurar o banco inteiro sobre reservas novas nem voltar a um Worker que reagrupe as unidades. Fotos existentes são preservadas até o cliente personalizar cada galeria. Testes: `node scripts/test-numbered-cabins.cjs` e `node scripts/test-individualize-lateral.cjs`.

O catálogo aceita novos nomes, Sunbeds numerados e outros espaços, com cadastros independentes. Criar um espaço acrescenta o estoque informado, sem substituir os existentes; novos formulários começam em **Oculto** para preparar fotos e descrições. Em **Calendário Comercial > Condições da reserva por categoria e espaço**, cada item pode usar o padrão, ser oferecido ou ficar fora das reservas. A escolha específica tem prioridade sobre a liberação geral por categoria; a regra da data tem prioridade sobre o dia a dia. **Oculto** no cadastro impede a exibição em todas as datas. Para oferecer somente em algumas datas, usar **Disponível** no cadastro, **Não oferecer para reserva** no padrão e **Oferecer para reserva** na data desejada. Preços e consumação também aceitam exceções por item, com herança da categoria. O calendário lê o catálogo, preserva regras já salvas e não depende de uma lista fixa de produtos. Um produto geral que ainda possui cadastro mantém seu próprio estoque; ele não vende as vagas dos novos produtos numerados. Não foram criados novos espaços comerciais nem alteradas reservas para disponibilizar essa funcionalidade. Teste isolado: `node scripts/test-flexible-catalog.cjs`.

Depois que as liberações individuais forem configuradas, não reverter o Worker para uma versão que ignore `commercialConditions.*.reservationsEnabled`, pois isso reabriria espaços retirados do catálogo. Manter uma versão compatível ou corrigir adiante, preservando as regras salvas.

## Desenvolvimento local

Este projeto usa [Next.js](https://nextjs.org).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel (histórico)

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


### Gravação do calendário no D1

Os handlers de período, data individual, exclusão e padrões comerciais usam `src/lib/d1-calendar.ts`. Leituras, permissão vigente e decisões sobre eventos são revalidadas no mesmo batch que grava as alterações. Falha em qualquer data desfaz o período todo; confirmação perdida é conferida sem repetir o batch. Datas impossíveis retornam 400 e conflito persistente retorna 409. Não liberar `WAITING_RELEASE` por um PATCH parcial. Esta adaptação não altera reservas existentes nem substitui os demais testes administrativos. Regressão isolada: `node scripts/test-d1-calendar.cjs`; regressão de reservas: `node scripts/test-d1-booking.cjs`.
