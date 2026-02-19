import React from 'react';
import { format } from 'date-fns';
import { Separator } from "@/components/ui/separator";
import { CabinetUbuntuLogo } from '../CabinetUbuntuLogo';  // Adapter le chemin si nécessaire

interface ReceiptProps {
    transactionId: string;
    date: Date;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    total: number;
    paymentMethod?: string;
    cashierName?: string;
    pharmacyInfo?: {
        name: string;
        address: string;
        phone: string;
        email?: string;
        taxId?: string;
    };
}

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({
    transactionId,
    date,
    items,
    total,
    paymentMethod = 'ESPÈCES',
    cashierName = 'Caissier',
    pharmacyInfo = {
        name: "CABINET UBUNTU",
        address: "Doumanzana, Rue 339, Porte 52, Bamako, Mali",
        phone: "+223 75 12 25 25",
        email: "contact@cabinet-ubuntu.com"
    }
}, ref) => {
    // Calculs
    const totalHT = Math.round(total / 1.18);
    const totalTVA = total - totalHT;

    return (
        <div ref={ref} className="bg-white p-4 w-[80mm] max-w-[80mm] mx-auto text-xs font-mono text-black leading-tight print:w-full print:max-w-none print:mx-0 print:p-0">
            {/* 1. Logo & En-tête */}
            <div className="flex flex-col items-center mb-3">
                <CabinetUbuntuLogo className="w-12 h-12 mb-2" />
                <h1 className="text-xl font-black uppercase tracking-wider mb-1">{pharmacyInfo.name}</h1>
                <p className="text-[10px] uppercase text-center w-full">{pharmacyInfo.address}</p>
                <p className="text-[10px]">Tél: {pharmacyInfo.phone}</p>
                {pharmacyInfo.email && <p className="text-[10px]">{pharmacyInfo.email}</p>}
                {pharmacyInfo.taxId && <p className="text-[10px] mt-1 font-bold">{pharmacyInfo.taxId}</p>}
            </div>

            <Separator className="my-2 border-black border-dashed" />

            {/* 2. Infos Ticket */}
            <div className="grid grid-cols-2 gap-1 text-[10px] mb-2">
                <div>
                    <span className="block text-gray-500">DATE</span>
                    <span className="font-bold">{format(date, 'dd/MM/yyyy')}</span>
                </div>
                <div className="text-right">
                    <span className="block text-gray-500">HEURE</span>
                    <span className="font-bold">{format(date, 'HH:mm')}</span>
                </div>
                <div>
                    <span className="block text-gray-500">TICKET #</span>
                    <span className="font-bold">#{transactionId.slice(-6).toUpperCase()}</span>
                </div>
                <div className="text-right">
                    <span className="block text-gray-500">CAISSIER</span>
                    <span className="font-bold uppercase">{cashierName}</span>
                </div>
            </div>

            <Separator className="my-2 border-black border-dashed" />

            {/* 3. Liste des Articles */}
            <table className="w-full mb-2 text-[10px]">
                <thead>
                    <tr className="border-b border-black border-dashed">
                        <th className="py-1 text-left w-[45%]">ARTICLE</th>
                        <th className="py-1 text-center w-[15%]">QTÉ</th>
                        <th className="py-1 text-right w-[20%]">P.U.</th>
                        <th className="py-1 text-right w-[20%]">TOTAL</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-dotted divide-gray-300">
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td className="py-1 pr-1 align-top font-medium uppercase truncate max-w-[30mm]">{item.name}</td>
                            <td className="py-1 text-center align-top">{item.quantity}</td>
                            <td className="py-1 text-right align-top">{item.price.toLocaleString()}</td>
                            <td className="py-1 text-right align-top font-bold">{(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Separator className="my-2 border-black border-dashed" />

            {/* 4. Totaux & Taxes */}
            <div className="space-y-1 mb-3 pr-1">
                <div className="flex justify-between text-[10px]">
                    <span>Total HT</span>
                    <span>{totalHT.toLocaleString()} F</span>
                </div>
                <div className="flex justify-between text-[10px]">
                    <span>TVA (18%)</span>
                    <span>{totalTVA.toLocaleString()} F</span>
                </div>

                <div className="flex justify-between items-end mt-2 pt-2 border-t border-black border-dashed">
                    <span className="font-bold text-sm">NET À PAYER</span>
                    <span className="font-black text-xl">{total.toLocaleString()} <span className="text-sm font-normal">FCFA</span></span>
                </div>
            </div>

            <div className="border border-black p-2 mb-4 text-center">
                <p className="text-[10px] uppercase mb-1">Mode de Règlement</p>
                <p className="font-bold text-sm uppercase">{paymentMethod || 'ESPÈCES'}</p>
            </div>

            {/* 5. Pied de page */}
            <div className="text-center space-y-2">
                <p className="font-bold text-sm uppercase">MERCI DE VOTRE VISITE !</p>
                <p className="text-[10px] italic">Les médicaments ne sont ni repris ni échangés.</p>
                <p className="text-[10px] italic">Bon rétablissement.</p>

                {/* Code barre simulé (CSS) */}
                <div className="mt-4 flex justify-center opacity-80">
                    <div className="h-10 w-full max-w-[180px] flex items-end justify-center space-x-[2px] bg-transparent overflow-hidden">
                        {/* Génération aléatoire de barres pour l'effet visuel */}
                        {Array.from({ length: 40 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-black"
                                style={{
                                    height: `${Math.random() > 0.5 ? '100%' : '70%'}`,
                                    width: `${Math.random() > 0.7 ? '3px' : '1px'}`
                                }}
                            />
                        ))}
                    </div>
                </div>
                <p className="text-[8px] mt-1 tracking-widest">{transactionId.toUpperCase()}</p>

                <p className="mt-3 text-[8px] text-gray-400">Powered by Sahel Ubuntu Pharm</p>
            </div>
        </div>
    );
});

Receipt.displayName = "Receipt";
