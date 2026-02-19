import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/50 flex items-center px-8 justify-between z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Vue d'ensemble</h2>
                        <p className="text-sm text-slate-500">Bienvenue dans votre espace de gestion</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="p-2 text-slate-400 hover:text-orange-600 transition-colors relative">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="h-8 w-px bg-slate-200"></div>
                        <div className="flex items-center gap-4 pl-2 cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-400 to-orange-600 p-[2px]">
                                <div className="w-full h-full rounded-full bg-white p-[2px] overflow-hidden">
                                    <img src="https://ui-avatars.com/api/?name=Admin+User&background=0f172a&color=fff" alt="User" className="w-full h-full rounded-full object-cover" />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">Administrator</p>
                                <p className="text-xs text-orange-600 font-medium">Super Admin</p>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-8 relative">
                    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
