import { format } from 'date-fns';

export const generateInventoryPDF = async (report: any) => {
    // Import dynamique pour éviter les erreurs SSR (window is not defined)
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF() as any;
    const dateStr = format(new Date(), 'dd/MM/yyyy HH:mm');

    // 1. En-tête
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('CABINET UBUNTU - SAHEL PHARM', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.text('RAPPORT D\'INVENTAIRE ET VALORISATION DU STOCK', 105, 30, { align: 'center' });
    doc.text(`Généré le: ${dateStr}`, 200, 35, { align: 'right' });

    // 2. Résumé KPIs
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RÉSUMÉ EXÉCUTIF', 14, 55);

    doc.autoTable({
        startY: 60,
        head: [['Indicateur', 'Valeur']],
        body: [
            ['Valeur Totale du Stock (Achat)', `${report.summary.totalStockValue.toLocaleString()} FCFA`],
            ['Nombre d\'articles en stock', `${report.summary.itemCount} références`],
            ['Produits en rupture / alerte', `${report.summary.lowStockCount} produits`],
            ['Lots critiques (peremption < 6 mois)', `${report.summary.expiringCount} lots`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [71, 85, 105] }
    });

    // 3. Table des Ruptures
    doc.text('PRODUITS EN ALERTE STOCK', 14, doc.lastAutoTable.finalY + 15);
    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Produit', 'Stock Actuel', 'Seuil Alerte', 'Status']],
        body: report.lowStockProducts.map((p: any) => [
            p.name,
            p.currentQty,
            p.minThreshold,
            p.currentQty === 0 ? 'RUPTURE' : 'CRITIQUE'
        ]),
        headStyles: { fillColor: [217, 119, 6] } // Amber 600
    });

    // 4. Table des Péremptions
    doc.text('SUIVI DES PÉREMPTIONS (Période 6 mois)', 14, doc.lastAutoTable.finalY + 15);
    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Produit', 'Quantité', 'Date Péremption', 'Urgence']],
        body: report.expiringSoon.map((b: any) => [
            b.product,
            b.qty,
            format(new Date(b.expiryDate), 'dd/MM/yyyy'),
            b.status
        ]),
        headStyles: { fillColor: [225, 29, 72] } // Rose 600
    });

    // Pied de page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Cabinet Ubuntu Pharm - Rapport Confidentiel - Page ${i}/${pageCount}`, 105, 285, { align: 'center' });
    }

    doc.save(`Rapport_Inventaire_Ubuntu_${format(new Date(), 'yyyyMMdd')}.pdf`);
};
