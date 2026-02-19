import { render, screen, waitFor } from '@testing-library/react'
import InventoryManager from './InventoryManager'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock de fetch
global.fetch = vi.fn()

describe('InventoryManager', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('affiche le titre et charge les produits', async () => {
        const mockProducts = [
            {
                id: '1',
                name: 'Doliprane',
                dci: 'Paracétamol',
                stock: 50,
                minThreshold: 10,
                status: 'OK',
                nextExpiry: '2025-12-31',
                batchesCount: 1
            }
        ]

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ; (fetch as any).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockProducts)
            })

        render(<InventoryManager />)

        expect(screen.getByText('Gestion des Stocks')).toBeInTheDocument()

        await waitFor(() => {
            expect(screen.getByText('Doliprane')).toBeInTheDocument()
        })

        expect(screen.getByText('Paracétamol')).toBeInTheDocument()
        expect(screen.getByText('50')).toBeInTheDocument()
    })
})
