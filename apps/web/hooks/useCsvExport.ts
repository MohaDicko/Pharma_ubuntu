import { useCallback } from 'react';

/**
 * Hook personnalisé pour exporter des données JSON en CSV
 */
export function useCsvExport() {

    const downloadCsv = useCallback((data: any[], filename = 'export.csv') => {
        if (!data || data.length === 0) {
            console.warn("Aucune donnée à exporter");
            return;
        }

        // 1. Récupérer les en-têtes (clés du premier objet)
        const headers = Object.keys(data[0]);

        // 2. Transformer les données en lignes CSV
        const csvContent = [
            headers.join(','), // Ligne d'en-tête
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header];
                    // Échapper les guillemets et gérer les chaînes contenant des virgules
                    const stringValue = value === null || value === undefined ? '' : String(value);
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }).join(',')
            )
        ].join('\n');

        // 3. Créer le Blob et le lien de téléchargement
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();

        // Nettoyage
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, []);

    return { downloadCsv };
}
