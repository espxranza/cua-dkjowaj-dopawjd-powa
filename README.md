# MeuSite - Next.js + Tailwind + TypeScript

Template profissional para deploy instantâneo na Vercel.

## Stack

- **Next.js 14** (App Router, Server Components)
- **Tailwind CSS** (Dark mode nativo, design system)
- **TypeScript** (Strict mode)
- **ESLint** + **Prettier** (configurado)

## Comandos

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview local da build
npm run start

# Lint
npm run lint
```

## Deploy na Vercel (grátis, 2 min)

1. **Push para GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/seu-repo.git
   git push -u origin main
   ```

2. **Conecte na Vercel**
   - Acesse [vercel.com/new](https://vercel.com/new)
   - Importe seu repositório GitHub
   - Clique **Deploy** — a Vercel detecta Next.js automaticamente

3. **Pronto!** Seu site está no ar com:
   - HTTPS automático
   - CDN global
   - Preview deployments em cada PR
   - Analytics opcional

## Estrutura

```
src/
├── app/
│   ├── globals.css      # Tailwind + variáveis CSS
│   ├── layout.tsx       # Root layout + metadata SEO
│   └── page.tsx         # Landing page completa
├── components/          # Seus componentes (crie aqui)
└── lib/                 # Utils, hooks, API clients
```

## Personalização

- **Cores**: Edite `tailwind.config.ts` ou use classes `bg-blue-600`, `text-gray-900`, etc.
- **Fontes**: `layout.tsx` usa Geist (Google Fonts) — troque por `Inter`, `Roboto`, etc.
- **Metadata SEO**: `layout.tsx` → `export const metadata`
- **Componentes**: Crie em `src/components/` e importe nas pages

## Dark Mode

Funciona automático via `prefers-color-scheme`. Para toggle manual, adicione `class` strategy no `tailwind.config.ts` e um provider de tema.

## Licença

MIT — use livremente.
