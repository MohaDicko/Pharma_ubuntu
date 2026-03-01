import { useCallback } from 'react';

/**
 * Hook personnalisé pour exporter des données JSON en CSV
 * - BOM UTF-8 inclus pour compatibilité Excel/LibreOffice
 * - Séparateur point-virgule (norme FR)
 * - Gestion des valeurs nulles/undefined/objets
 */
export function useCsvExport() {

    const downloadCsv = useCallback((data: Record<string, unknown>[], filename = 'export.csv') => {
        if (!data || data.length === 0) {
            console.warn('Aucune donnée à exporter');
            return;
        }

        // 1. Récupérer les en-têtes (clés du premier objet)
        const headers = Object.keys(data[0]);

        // 2. Transformer les données en lignes CSV
        const rows = data.map(row =>
            headers.map(header => {
                const value = row[header];
                // Sérialiser les objets/tableaux en JSON string
                let str: string;
                if (value === null || value === undefined) {
                    str = '';
                } else if (typeof value === 'object') {
                    str = JSON.stringify(value);
                } else {
                    str = String(value);
                }
                // Échapper les guillemets et encadrer chaque valeur
                return `"${str.replace(/"/g, '""')}"`;
            }).join(';')
        );

        // 3. Construire le contenu CSV avec BOM UTF-8 pour Excel
        const BOM = '\uFEFF';
        const csvContent = BOM + [headers.map(h => `"${h}"`).join(';'), ...rows].join('\r\n');

        // 4. Créer le Blob et déclencher le téléchargement
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();

        // Nettoyage
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);

    }, []);

    return { downloadCsv };
}
