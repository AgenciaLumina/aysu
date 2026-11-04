# Aysú Beach Lounge

Site, reservas e administração em Next.js 16, React 19 e Prisma 6. Usar Node 22
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
