'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Truck, Users, Settings, LogOut, BarChart3, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Produits', href: '/products', icon: Package },
    { name: 'Entrées Stock', href: '/incoming', icon: Truck },
    { name: 'Sorties Stock', href: '/outgoing', icon: ShoppingCart },
    { name: 'Fournisseurs', href: '/suppliers', icon: Users },
    { name: 'Rapports', href: '/reports', icon: BarChart3 },
    { name: 'Utilisateurs', href: '/users', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white w-72 shadow-xl z-10">
            <div className="p-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                    SAHEL STORE
                </h1>
                <p className="text-xs text-slate-400 mt-2 font-medium tracking-wide">SYSTEME DE GESTION</p>
            </div>

            <nav className="flex-1 px-4 space-y-3 py-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group font-medium',
                                isActive
                                    ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg shadow-orange-900/20 translate-x-1'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 mr-4 transition-colors", isActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                            <span className="text-sm tracking-wide">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-6 border-t border-slate-800/50">
                <button className="flex items-center w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all group">
                    <LogOut className="w-5 h-5 mr-3 group-hover:stroke-red-400" />
                    <span className="font-medium text-sm">Déconnexion</span>
                </button>
            </div>
        </div>
    );
}
