-- STRESS TEST SCRIPT: 50,000 Stock Movements
-- Objectif : Tester les performances de la vue agrégée et des requêtes FEFO

BEGIN;

-- 1. Création de Produits de Test (100 produits)
INSERT INTO "products" ("id", "dci", "name", "category", "minThreshold", "updatedAt")
SELECT 
    gen_random_uuid(),
    'Molecule-' || i, 
    'Product-' || i, 
    'TEST_CATEGORY', 
    10,
    NOW()
FROM generate_series(1, 100) AS i;

-- 2. Création de Lots (Batches) pour ces produits (5 lots par produit = 500 lots)
INSERT INTO "batches" ("id", "batchNumber", "expiryDate", "costPrice", "quantity", "productId", "updatedAt")
SELECT 
    gen_random_uuid(),
    'BATCH-' || p.name || '-' || i,
    NOW() + (i * INTERVAL '30 days'), -- Dates échelonnées
    (RANDOM() * 1000)::numeric(10,2),
    1000, -- Stock initial élevé
    p.id,
    NOW()
FROM "products" p
CROSS JOIN generate_series(1, 5) AS i
WHERE p.category = 'TEST_CATEGORY';

-- 3. Génération massive de Mouvements de Stock (50,000 lignes)
-- Simulation de ventes (OUT) aléatoires sur les lots existants
INSERT INTO "stock_movements" ("id", "type", "quantity", "reason", "userId", "productId", "batchId", "timestamp")
SELECT 
    gen_random_uuid(),
    'OUT',
    - (floor(random() * 5) + 1)::int, -- Vente entre 1 et 5 unités
    'STRESS_TEST_SALE',
    'admin-user-id',
    b."productId",
    b.id,
    NOW() - (random() * INTERVAL '365 days') -- Répartition sur 1 an
FROM "batches" b, generate_series(1, 100)
LIMIT 50000;

COMMIT;

-- ANALYSE DE PERFORMANCE
EXPLAIN ANALYSE SELECT * FROM "stock_movements" WHERE "reason" = 'STRESS_TEST_SALE';

-- TEST AGREGATION (Stock Virtuel)
EXPLAIN ANALYSE 
SELECT 
    p.name, 
    SUM(sm.quantity) as physical_stock 
FROM "products" p
JOIN "stock_movements" sm ON p.id = sm."productId"
GROUP BY p.id;
