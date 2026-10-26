# Aysú Beach Lounge

Site, reservas e administração em Next.js 16, React 19 e Prisma 6. Usar Node 22
e `npm ci`, preservando o lockfile. A configuração de implantação fica em
[RUNBOOK-DEPLOY-2.1.1.md](RUNBOOK-DEPLOY-2.1.1.md#preparacao-vercel-e-loki-em-26102026).

Em 26/10/2026 foi preparada a arquitetura Vercel para o app e PostgreSQL no Loki.
O projeto Vercel e uma cópia isolada do banco estão preparados; a produção continua
no Thor. Não executar migrações no build nem vincular previews ao banco operacional.
Verificar o runbook antes da publicação.

`npm run build` compila localmente. `npm run build:vercel` verifica primeiro as
variáveis do destino, sem exibir valores nem conectar ao banco. Esse preflight não
substitui testes funcionais, conectividade, backup ou autorização de publicação.

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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
