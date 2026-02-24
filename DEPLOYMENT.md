# 🚀 Guide de Déploiement Production - Ubuntu Pharm

Ce guide explique comment préparer et déployer l'application en environnement de production, avec un focus particulier sur **Vercel** et les bonnes pratiques de sécurité.

## 1. Pré-requis

*   **Node.js** v20+
*   **PostgreSQL** (Base de données) compatible Serverless (Neon, Supabase, ou via Prisma Accelerate/PgBouncer)
*   **Redis** (Upstash recommandé pour Vercel) pour le Rate Limiting

## 2. Configuration (`.env`)

Copiez `.env.example` et remplissez les valeurs. **Ne commitez jamais ce fichier.**

### Variables Critiques
*   `DATABASE_URL`: Connection string PostgreSQL **avec pooling** (ex: `postgres://user:pass@host:6543/db?pgbouncer=true`).
    *   Utilisée par l'application pour supporter la charge Serverless.
*   `DIRECT_URL`: Connection string PostgreSQL **directe** (sans pooling, port 5432).
    *   Utilisée par `prisma migrate` et `prisma db seed` pour éviter les erreurs de prepared statements.
*   `AUTH_SECRET`: Clé 32 bytes (Générer: `openssl rand -base64 32`).
*   `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`: Pour le rate limiting distribué (obligatoire sur Vercel).
*   `NODE_ENV`: Doit être `production`.

### Variables Seed (Temporaire)
*   `ADMIN_EMAIL` & `ADMIN_PASSWORD`: Utilisés uniquement lors de l'initialisation de la DB via CLI.

## 3. Déploiement sur Vercel (Recommandé)

### A. Base de Données
1.  Créez une base Postgres (Supabase, Neon, Railway).
2.  Obtenez l'URL de connexion (Mode Transaction/Pooling recommandé) ainsi que l'URL Directe (Session Mode).

### B. Configuration Vercel
1.  Importez le projet depuis GitHub.
2.  **Settings > Environment Variables** : Ajoutez toutes les variables ci-dessus.
3.  **Build Command** : `prisma generate && next build` (Déjà configuré dans `apps/web/package.json`).
4.  **Install Command** : `npm install` (Standard).

### C. Migrations & Seed (Hors Runtime !)
⚠️ **Ne jamais lancer `prisma migrate` ou seed dans le code de l'application.**

**Sur votre machine locale (connectée à la DB de prod via .env.production.local ou variables exportées) :**

Assurez-vous que `DATABASE_URL` (Pooling) et `DIRECT_URL` (Direct) sont bien définies dans votre environnement.

1.  Appliquer le schéma :
    ```bash
    # Prisma utilisera automatiquement DIRECT_URL si définie dans le schéma
    npx prisma migrate deploy
    ```

2.  Créer l'Admin (Une seule fois) :
    ```bash
    # Exporter les variables si nécessaire
    # export ADMIN_EMAIL="..."
    # export ADMIN_PASSWORD="..."
    npx prisma db seed
    ```

## 4. Déploiement Classique (VPS / Docker)

### Option A : PM2
```bash
# 1. Build
npm install
npx prisma generate
npm run build

# 2. Start
pm2 start npm --name "sahel-pharm" -- start
```

### Option B : Docker
Utilisez le `docker-compose.yml` fourni. Assurez-vous de persister les volumes de la base de données.

## 5. Maintenance & Sécurité

*   **Rate Limiting** : Si `UPSTASH_REDIS_...` n'est pas configuré, le système passera en mode "mémoire" (inefficace sur Serverless/Vercel) et affichera un avertissement.
*   **Seed** : La route `/api/seed` est **totalement désactivée** en production (VERCEL_ENV=production).
*   **Sauvegardes** : Configurez des snapshots automatiques côté fournisseur de base de données (Supabase/Neon le font automatiquement).

## 6. Vérification Finale (Post-Déploiement)

Après le déploiement en production, vérifiez impérativement :

1.  **Sécurité Seed** : Accéder à `/api/seed` doit retourner **404 Not Found**.
2.  **Santé Système** : Accéder à `/api/health` doit retourner **200 OK**.
3.  **Protection Routes** : Tenter d'accéder à `/api/sales` sans session doit retourner **401 Unauthorized**.
4.  **Cookies** : Inspectez les cookies dans le navigateur. Ils doivent avoir les flags `Secure`, `HttpOnly`, et `SameSite=Lax`.
5.  **Rate Limit** : Spammez le login (10+ fois). Vous devez recevoir une erreur **429 Too Many Requests**.

Si tout est vert, le système est prêt. 🚀
