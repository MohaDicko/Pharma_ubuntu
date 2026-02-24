import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const { id } = await params;

        const tx = await prisma.transaction.findUnique({
            where: { id },
            include: {
                movements: {
                    include: {
                        product: true
                    }
                },
                user: {
                    select: {
                        name: true
                    }
                },
                insurance: true
            }
        });

        if (!tx) {
            return NextResponse.json({ error: "Désolé, cette transaction est introuvable." }, { status: 404 });
        }

        // RBAC Check supplémentaire au niveau de l'API
        if (session.user.role !== 'ADMIN' && session.user.id !== tx.userId) {
            return NextResponse.json({ error: "Accès refusé aux détails de cette transaction." }, { status: 403 });
        }

        // Grouper les mouvements par produit pour le ticket (au cas où le FEFO a splitté un produit en plusieurs lots)
        const itemsMap = new Map();
        tx.movements.forEach((m: any) => {
            const existing = itemsMap.get(m.productId);
            if (existing) {
                existing.quantity += Math.abs(m.quantity);
            } else {
                itemsMap.set(m.productId, {
                    name: m.product.name,
                    quantity: Math.abs(m.quantity),
                    price: Number(m.product.sellingPrice)
                });
            }
        });

        const formatted = {
            id: tx.id,
            date: tx.createdAt,
            type: tx.type,
            amount: Number(tx.amount),
            paymentMethod: tx.paymentMethod,
            cashierName: tx.user?.name || 'Admin',
            insuranceName: tx.insurance?.name,
            insurancePart: Number(tx.insurancePart),
            patientPart: Number(tx.patientPart),
            items: Array.from(itemsMap.values())
        };

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Single Transaction API Error:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
