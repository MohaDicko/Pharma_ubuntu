-- ============================================================
-- Ubuntu Pharm — Row Level Security (RLS)
-- À exécuter dans Supabase SQL Editor
-- ============================================================
-- Contexte :
--   Prisma se connecte directement via DATABASE_URL avec le rôle
--   "postgres" (service_role équivalent), qui BYPASSE LE RLS par
--   défaut. Les policies ci-dessous bloquent donc uniquement les
--   accès non authentifiés via PostgREST (anon, authenticated)
--   tout en laissant Prisma/backend fonctionner normalement.
-- ============================================================


-- ============================================================
-- 1. ACTIVER RLS SUR TOUTES LES TABLES
-- ============================================================

ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurances      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs      ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 2. FORCER RLS MÊME POUR LE SUPER-UTILISATEUR "postgres"
--    (optionnel mais recommandé pour une sécurité maximale)
-- ============================================================
-- Si vous voulez que Prisma (rôle postgres) soit aussi soumis
-- au RLS, décommentez les lignes ci-dessous :
-- ALTER TABLE public.users           FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.products        FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.batches         FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.stock_movements FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.transactions    FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.insurances      FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit_logs      FORCE ROW LEVEL SECURITY;


-- ============================================================
-- 3. POLICIES — Bloquer tout accès via PostgREST (anon / authenticated)
--    et autoriser uniquement le service_role (utilisé par Prisma/backend)
-- ============================================================

-- ── users ────────────────────────────────────────────────────
CREATE POLICY "service_role_only" ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── products ─────────────────────────────────────────────────
CREATE POLICY "service_role_only" ON public.products
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── batches ──────────────────────────────────────────────────
CREATE POLICY "service_role_only" ON public.batches
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── stock_movements ──────────────────────────────────────────
CREATE POLICY "service_role_only" ON public.stock_movements
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── transactions ─────────────────────────────────────────────
CREATE POLICY "service_role_only" ON public.transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── insurances ───────────────────────────────────────────────
CREATE POLICY "service_role_only" ON public.insurances
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── audit_logs ───────────────────────────────────────────────
CREATE POLICY "service_role_only" ON public.audit_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ============================================================
-- 4. VÉRIFICATION — Confirmer que RLS est bien activé
-- ============================================================
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'products', 'batches',
    'stock_movements', 'transactions',
    'insurances', 'audit_logs'
  )
ORDER BY tablename;
