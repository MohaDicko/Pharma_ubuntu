import { render, screen, waitFor } from '@testing-library/react'
import InventoryManager from './InventoryManager'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// ── Mocks de modules ──────────────────────────────────────────────────────────

// next/navigation — requis par les sous-composants (Link, usePathname...)
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
    usePathname: () => '/',
}))

// next-auth/react — évite le besoin d'un SessionProvider réel
vi.mock('next-auth/react', () => ({
    useSession: () => ({ data: null, status: 'unauthenticated' }),
    signOut: vi.fn(),
}))

// useAuth — retourne un utilisateur ADMIN directement, sans contexte
vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({
        user: { id: '1', name: 'Admin Test', email: 'admin@test.com', role: 'ADMIN' },
        loading: false,
        logout: vi.fn(),
        hasRole: () => true,
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// toast — évite les erreurs d'appels UI hors contexte navigateur
vi.mock('@/components/ui/toast', () => ({
    toast: vi.fn(),
}))

// ── Données de test ───────────────────────────────────────────────────────────

const mockProducts = [
    {
        id: '1',
        name: 'Doliprane',
        dci: 'Paracétamol',
        category: 'Médicament',
        sellingPrice: 1000,
        stock: 50,
        minThreshold: 10,
        status: 'ACTIF',
        inventoryStatus: 'OK',
        nextExpiry: '2025-12-31',
        batchesCount: 1,
    },
]

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('InventoryManager', () => {
    beforeEach(() => {
        // CRITIQUE : stubber fetch AVANT le render pour que la promesse soit prête
        // dès le useEffect initial du composant
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockProducts),
        }))
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.clearAllMocks()
    })

    it('affiche le titre et charge les produits', async () => {
        render(<InventoryManager />)

        // Le titre est immédiatement présent dans le DOM (rendu synchrone)
        expect(screen.getByText('Gestion des Stocks')).toBeInTheDocument()

        // Attendre que fetch se résolve et que les données s'affichent
        await waitFor(() => {
            expect(screen.getAllByText('Doliprane').length).toBeGreaterThan(0)
        }, { timeout: 3000 })

        expect(screen.getAllByText('Paracétamol').length).toBeGreaterThan(0)
        // 50 apparaît dans plusieurs endroits (stock, etc.)
        expect(screen.getAllByText('50').length).toBeGreaterThan(0)
    })
})
