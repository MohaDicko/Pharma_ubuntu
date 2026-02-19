# 🏥 Sahel CPMS - Système de Gestion de Pharmacie Clinique

**Version:** 0.1.0 - Grade Industriel (MVP Seed)
**Date:** 15 Février 2026

## 🌟 État du Projet

Nous avons transformé le projet initial en une application **Web Moderne Full Stack** prête pour des tests réels.

### ✅ Fonctionnalités Implémentées

| Module | Statut | Description |
| :--- | :--- | :--- |
| **Architecture** | 🟢 Complet | Monorepo Turborepo (Next.js 15 + NestJS + Prisma). |
| **Design** | 🟢 Complet | Shadcn UI + Tailwind CSS (Thème Bleu Clinique/Dark Mode). |
| **Sécurité** | 🟡 Partiel | Page Login & Middleware (Simulation Auth Biométrique). |
| **Dashboard** | 🟢 Complet | KPIs financiers, graphiques et alertes péremption. |
| **Inventaire** | 🟢 Complet | Vue temps réel connecté à SQLite (FEFO & Lots). |
| **Point de Vente** | 🟡 UI Seule | Interface caissière prête (logique d'achat à connecter). |
| **Données** | 🟢 Seed | Script pour injecter 50 produits et lots de test. |

---

## 🛠️ Guide de Démarrage Rapide

### 1. Lancer l'Application (Frontend + API Next.js)

Ouvrez un terminal dans le dossier racine et lancez :

```bash
cd apps/web
npm run dev
```

L'application sera accessible sur : 👉 **[http://localhost:3000](http://localhost:3000)**

### 2. Réinitialiser les Données (Seed)

Si vous voulez remettre la base de données à zéro avec de nouveaux produits :

Ouvrez un **deuxième terminal** (PowerShell) et lancez :

```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/seed -Method POST
```
*(Ou visitez simplement l'URL dans le navigateur si vous n'êtes pas à l'aise avec la commande, bien que ce soit une méthode POST normalement).*

---

## 🏗️ Structure Technique

```
sahel-store/
├── apps/
│   ├── web/                 # Frontend Next.js (Dashboard, POS, Inventory)
│   │   ├── app/api/         # API Routes (Products, Seed, Auth)
│   │   ├── components/ui/   # Composants Shadcn (Button, Card...)
│   │   └── middleware.ts    # Sécurité des routes
│   └── api/                 # Backend NestJS (Architecture Hexagonale - En attente Docker)
├── packages/
│   └── database/            # Prisma Schema & Client (SQLite)
└── turbo.json               # Orchestrateur de build
```

## 🚀 Prochaines Étapes (Roadmap)

1.  **Backend NestJS** : Activer le vrai serveur API avec Docker (PostgreSQL).
2.  **Ventes Réelles** : Connecter le bouton "Payer" du POS à l'API de transaction.
3.  **Impression** : Générer les reçus PDF/Thermiques.
4.  **Tests** : Écrire les tests unitaires avec Jest.

---

*Généré par Antigravity - Assistant IA Google DeepMind*
