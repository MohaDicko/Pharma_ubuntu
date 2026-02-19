import { Package, TrendingUp, Users, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard
                    title="Total Produits"
                    value="1,240"
                    trend="+12%"
                    trendUp={true}
                    icon={Package}
                    color="bg-blue-500"
                    gradient="from-blue-500 to-blue-600"
                />
                <DashboardCard
                    title="Ventes du Mois"
                    value="3.4M FCFA"
                    trend="+8.5%"
                    trendUp={true}
                    icon={TrendingUp}
                    color="bg-emerald-500"
                    gradient="from-emerald-500 to-emerald-600"
                />
                <DashboardCard
                    title="Clients / Fournis."
                    value="128"
                    trend="-2.4%"
                    trendUp={false}
                    icon={Users}
                    color="bg-violet-500"
                    gradient="from-violet-500 to-violet-600"
                />
                <DashboardCard
                    title="Stock Critique"
                    value="5 Items"
                    subtitle="Nécessite attention"
                    icon={AlertCircle}
                    color="bg-orange-500"
                    gradient="from-orange-500 to-orange-600"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Aperçu des Ventes</h3>
                        <select className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500/20">
                            <option>Cette Semaine</option>
                            <option>Ce Mois</option>
                            <option>Cette Année</option>
                        </select>
                    </div>
                    <div className="h-80 w-full bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400">
                        <p>Graphique des ventes ici</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Activités Récentes</h3>
                    <div className="space-y-6">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">
                                    {i % 2 === 0 ? '📦' : '💰'}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">
                                        {i % 2 === 0 ? 'Nouvelle entrée de stock' : 'Vente #1234 confirmée'}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">Il y a {i * 10} minutes</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function DashboardCard({ title, value, subtitle, trend, trendUp, icon: Icon, color, gradient }: any) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon size={80} className="text-slate-800" />
            </div>

            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br ${gradient}`}>
                    <Icon size={22} className="stroke-[2.5]" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {trend}
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
                {subtitle && <p className="text-xs text-orange-500 font-medium mt-2">{subtitle}</p>}
            </div>
        </div>
    )
}
