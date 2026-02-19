# 🚀 Guide de Déploiement Production - Sahel Ubuntu Pharm

Ce guide explique comment préparer et déployer l'application en environnement de production.

## 1. Pré-requis

*   **Node.js** v20+
*   **PostgreSQL** (Base de données)
*   **Nginx** (Recommandé comme Reverse Proxy)
*   **PM2** (Pour gérer le processus Node.js) ou **Docker**

## 2. Configuration (`.env`)

Créez un fichier `.env` à la racine du projet (copier `.env.example` s'il existe) et configurez les variables suivantes :

```env
# URL de la base de données PostgreSQL
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
DATABASE_URL="postgresql://sahel_user:password_secure@localhost:5432/sahel_db?schema=public"

# Secret pour l'authentification (Générer avec `openssl rand -base64 32`)
AUTH_SECRET="votre_secret_super_long_et_aleatoire"

# URL de l'application (ex: https://pharmacie.ubuntu.com)
NEXTAUTH_URL="http://localhost:3000"
```

## 3. Installation et Build

```bash
# 1. Installer les dépendances
npm install

# 2. Générer le client Prisma
npx turbo run db:generate

# 3. Mettre à jour la base de données (Schéma)
cd packages/database
npx prisma db push
# OU pour une migration stricte : npx prisma migrate deploy

# 4. Initialiser les données (Admin par défaut)
# Lancez cette commande une seule fois pour créer l'admin
curl http://localhost:3000/api/seed
# Admin par défaut : admin@ubuntu.com / admin123
```

## 4. Lancement en Production

### Option A : PM2 (Classique)

```bash
# Builder l'application
npx turbo run build

# Lancer avec PM2
cd apps/web
pm2 start npm --name "sahel-pharm" -- start
```

### Option B : Docker (Conteneur)

Utilisez le `docker-compose.yml` fourni pour lancer la base de données et l'application (nécessite un Dockerfile pour l'app web, à créer).

## 5. Sécurité

*   **Changez le mot de passe Admin** dès la première connexion via la base de données ou une interface de gestion (à venir).
*   Activez le **HTTPS** (avec Certbot/LetsEncrypt).
*   Ne jamais commiter le fichier `.env` sur Git.

## 6. Maintenance

*   **Sauvegardes** : Configurez un dump quotidien de la base PostgreSQL.
    ```bash
    pg_dump -U sahel_user sahel_db > backup_$(date +%F).sql
    ```
