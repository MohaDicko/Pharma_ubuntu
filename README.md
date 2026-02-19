# Sahel Store - Système de Gestion Pharmacie Clinique 🏥💊

## 🚀 Démarrage Rapide

1.  **Installation** :
    ```bash
    npm install
    ```

2.  **Base de Données** (Initialisation) :
    ```bash
    cd packages/database
    npx prisma db push
    ```

3.  **Lancer le Serveur** :
    ```bash
    # Depuis la racine
    npm run dev
    ```
    Accesible sur [http://localhost:3000](http://localhost:3000)

4.  **Peupler la Base (Données de Test)** :
    Ouvrir dans le navigateur : [http://localhost:3000/api/seed](http://localhost:3000/api/seed)
    *Cela va créer des produits (Doliprane, Spasfon...), des lots, et du stock initial.*

## 🔑 Connexion (Simulation)

*   **Admin** : Accès complet (Dashboard, Users, Finance).
*   **Pharmacien** : Accès Vente (POS) et Stock (Lecture).
*   **Magasinier** : Accès Stock (Entrée/Sortie).

*(Utilisez les boutons "Démo Rapide" sur la page de login)*

## 📦 Fonctionnalités Clés

### 1. Point de Vente (POS) `/pos`
*   Recherche rapide (Nom, DCI).
*   Ajout au panier.
*   Encaissement (Déstockage FEFO automatique).
*   **Impression Ticket** : Ouvre un ticket format 80mm prêt à imprimer.

### 2. Gestion des Stocks `/inventory`
*   Vue globale des produits et quantité totale.
*   Alertes péremption (FEFO).
*   **Réception Commande** (`/inventory/receive`) : Ajouter du stock (Nouveau lot ou réassort).

### 3. Finances `/transactions`
*   Historique des ventes et achats.
*   Détail des produits vendus.

### 4. Admin `/settings` & `/users`
*   Configuration de la pharmacie.
*   Gestion de l'équipe.

## 🛠️ Stack Technique

*   **Frontend** : Next.js 15 (App Router), React 19, Tailwind CSS, Shadcn UI.
*   **Backend** : Next.js API Routes (Serverless functions).
*   **Database** : SQLite (Dev) / PostgreSQL (Prod), Prisma ORM.
*   **Architecture** : Turborepo Monorepo.

---
*Développé avec ❤️ pour l'Afrique de l'Ouest.*
