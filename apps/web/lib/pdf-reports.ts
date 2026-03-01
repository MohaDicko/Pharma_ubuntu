import { format } from 'date-fns';

// ─── Types ───────────────────────────────────────────────────────────────────
interface InventoryReport {
    summary: {
        totalStockValue: number;
        itemCount: number;
        lowStockCount: number;
        expiringCount: number;
    };
    lowStockProducts: Array<{ name: string; currentQty: number; minThreshold: number }>;
    expiringSoon: Array<{ product: string; qty: number; expiryDate: string; status: string }>;
}

interface TransactionReport {
    transactions: Array<{
        id: string;
        date: string;
        type: string;
        amount: number;
        paymentMethod: string;
        products: string;
        status: string;
    }>;
    dateRange?: string;
}

// ─── Helper : charge jsPDF + autoTable et retourne les deux ─────────────────
async function loadPdfLibs() {
    const { default: jsPDF } = await import('jspdf');
    // autoTable doit être importé comme fonction, pas comme side-effect
    const { default: autoTable } = await import('jspdf-autotable');
    return { jsPDF, autoTable };
}

// ─── Rapport Inventaire PDF ──────────────────────────────────────────────────
export const generateInventoryPDF = async (report: InventoryReport) => {
    const { jsPDF, autoTable } = await loadPdfLibs();
    const doc = new jsPDF();
    const dateStr = format(new Date(), 'dd/MM/yyyy HH:mm');

    // ── En-tête ──
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('CABINET UBUNTU - PHARM', 105, 18, { align: 'center' });
    doc.setFontSize(10);
    doc.text("RAPPORT D'INVENTAIRE ET VALORISATION DU STOCK", 105, 28, { align: 'center' });
    doc.text(`Généré le : ${dateStr}`, 200, 36, { align: 'right' });

    // ── Résumé KPIs ──
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('RÉSUMÉ EXÉCUTIF', 14, 54);

    autoTable(doc, {
        startY: 58,
        head: [['Indicateur', 'Valeur']],
        body: [
            ['Valeur Totale du Stock (Achat)', `${report.summary.totalStockValue.toLocaleString('fr-FR')} FCFA`],
            ["Nombre d'articles en stock", `${report.summary.itemCount} références`],
            ['Produits en rupture / alerte', `${report.summary.lowStockCount} produits`],
            ['Lots critiques (péremption < 6 mois)', `${report.summary.expiringCount} lots`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [71, 85, 105] },
    });

    // ── Produits en alerte ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const afterSummary = (doc as any).lastAutoTable.finalY + 14;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUITS EN ALERTE STOCK', 14, afterSummary);

    if (report.lowStockProducts.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Aucun produit en alerte.', 14, afterSummary + 8);
        doc.setTextColor(0, 0, 0);
    } else {
        autoTable(doc, {
            startY: afterSummary + 4,
            head: [['Produit', 'Stock Actuel', 'Seuil Alerte', 'Statut']],
            body: report.lowStockProducts.map((p) => [
                p.name,
                p.currentQty,
                p.minThreshold,
                p.currentQty === 0 ? 'RUPTURE' : 'CRITIQUE',
            ]),
            headStyles: { fillColor: [217, 119, 6] },
        });
    }

    // ── Suivi Péremptions ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const afterLow = (doc as any).lastAutoTable.finalY + 14;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SUIVI DES PÉREMPTIONS (6 mois)', 14, afterLow);

    if (report.expiringSoon.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Aucun lot critique dans les 6 prochains mois.', 14, afterLow + 8);
    } else {
        autoTable(doc, {
            startY: afterLow + 4,
            head: [['Produit', 'Quantité', 'Date Péremption', 'Urgence']],
            body: report.expiringSoon.map((b) => [
                b.product,
                b.qty,
                format(new Date(b.expiryDate), 'dd/MM/yyyy'),
                b.status,
            ]),
            headStyles: { fillColor: [225, 29, 72] },
        });
    }

    // ── Pied de page ──
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Cabinet Ubuntu Pharm - Rapport Confidentiel - Page ${i}/${pageCount}`,
            105, 285, { align: 'center' }
        );
    }

    doc.save(`Rapport_Inventaire_Ubuntu_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
};

// ─── Rapport Transactions PDF ────────────────────────────────────────────────
export const generateTransactionsPDF = async (data: TransactionReport) => {
    const { jsPDF, autoTable } = await loadPdfLibs();
    const doc = new jsPDF('landscape');
    const dateStr = format(new Date(), 'dd/MM/yyyy HH:mm');

    // ── En-tête ──
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('CABINET UBUNTU - PHARM', 148, 16, { align: 'center' });
    doc.setFontSize(9);
    doc.text('JOURNAL DES TRANSACTIONS FINANCIÈRES', 148, 25, { align: 'center' });
    if (data.dateRange) {
        doc.text(`Période : ${data.dateRange}`, 148, 31, { align: 'center' });
    }
    doc.text(`Généré le : ${dateStr}`, 285, 31, { align: 'right' });

    // ── Table ──
    autoTable(doc, {
        startY: 42,
        head: [['#', 'Date & Heure', 'Type', 'Produits / Motif', 'Méthode Paiem.', 'Statut', 'Montant (FCFA)']],
        body: data.transactions.map((tx, i) => [
            i + 1,
            format(new Date(tx.date), 'dd/MM/yyyy HH:mm'),
            tx.type === 'SALE' ? 'Vente' : tx.type === 'PURCHASE' ? 'Achat' : tx.type,
            tx.products || '—',
            tx.paymentMethod,
            tx.status,
            `${tx.type === 'SALE' ? '+' : '-'} ${tx.amount.toLocaleString('fr-FR')}`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            6: { halign: 'right', fontStyle: 'bold' },
        },
    });

    // ── Totaux ──
    const totalVentes = data.transactions.filter(t => t.type === 'SALE').reduce((s, t) => s + t.amount, 0);
    const totalAchats = data.transactions.filter(t => t.type === 'PURCHASE').reduce((s, t) => s + t.amount, 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Ventes : +${totalVentes.toLocaleString('fr-FR')} FCFA`, 14, finalY);
    doc.text(`Total Achats : -${totalAchats.toLocaleString('fr-FR')} FCFA`, 14, finalY + 7);
    doc.setTextColor(16, 185, 129);
    doc.text(`Bilan Net : ${(totalVentes - totalAchats).toLocaleString('fr-FR')} FCFA`, 14, finalY + 14);

    // ── Pied de page ──
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Cabinet Ubuntu Pharm - Document Confidentiel - Page ${i}/${pageCount}`,
            148, 205, { align: 'center' }
        );
    }

    doc.save(`Transactions_Ubuntu_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
};
