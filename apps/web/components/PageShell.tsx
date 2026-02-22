// Wrapper universel pour toutes les pages — padding adaptatif par écran
// mobile: p-3, tablet: p-5, desktop: p-6 lg:p-8
export function PageShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="p-3 sm:p-5 md:p-6 lg:p-8 pb-10 space-y-4 sm:space-y-6 min-h-full">
            {children}
        </div>
    )
}
