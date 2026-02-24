# Architecture & Structure du Projet (CPMS)

Pour répondre aux exigences de "Grade Industriel" et permettre une séparation claire entre le Frontend (Next.js) et le Backend (NestJS), voici la structure recommandée en Monorepo.

Nous utiliserons **Turborepo** pour gérer ce monorepo, car il est natif à l'écosystème JS/TS et parfait pour Next.js + NestJS.

## Structure des Dossiers

```
ubuntu-clinical-pharmacy/
├── apps/
│   ├── api/                 # Backend NestJS (Hexagonal Architecture)
│   │   ├── src/
│   │   │   ├── core/        # Domain logic & Interfaces (Port)
│   │   │   ├── infra/       # Database, External APIs (Adapters)
│   │   │   ├── modules/     # NestJS Modules (Stock, Auth, Sales)
│   │   │   └── main.ts      # Entry point
│   │   ├── prisma/          # Schéma de base de données (si géré par l'API)
│   │   ├── test/            # E2E Tests
│   │   └── package.json
│   │
│   └── web/                 # Frontend Next.js 15 (App Router)
│       ├── app/             # App Router pages (Dashboard, POS, Inventory)
│       ├── components/      # Shadcn UI, Recharts, TanStack Query
│       ├── lib/             # Utils & Hooks
│       └── package.json
│
├── packages/                # Code partagé (Optionnel mais recommandé)
│   ├── database/            # Client Prisma partagé typé
│   ├── ui/                  # Composants UI partagés si besoin
│   ├── ts-config/           # Config TypeScript commune
│   └── types/               # Types TypeScript partagés (DTOs)
│
├── turbo.json               # Configuration du pipeline de build
├── package.json             # Root package.json
└── README.md
```

## Choix Techniques

1.  **Apps Separation**:
    *   `apps/web`: Focus uniquement sur l'UI/UX, le rendu Next.js, et la gestion de l'état client (TanStack Query).
    *   `apps/api`: Focus sur la logique métier complexe (FEFO, PAMP, Transactions ACID), la sécurité, et l'accès aux données.

2.  **Shared Packages**:
    *   Le package `database` permet d'avoir un client Prisma généré et typé accessible à la fois par le backend (pour l'écriture) et potentiellement par le frontend (si utilisation de Server Actions, bien que l'architecture demande un Backend NestJS distinct).
    *   Le package `types` assure que le Frontend et le Backend parlent le même langage (interfaces TypeScript partagées).

## Prochaines Étapes pour l'Initialisation

1.  Initialiser un workspace Turborepo : `npx create-turbo@latest`
2.  Copier le schéma Prisma dans `packages/database` ou `apps/api`.
3.  Installer NestJS CLI dans `apps/api`.
4.  Installer Next.js 15 dans `apps/web`.
