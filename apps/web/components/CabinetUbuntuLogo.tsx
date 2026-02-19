import React from 'react';

export const CabinetUbuntuLogo = ({ className = "w-12 h-12" }: { className?: string }) => {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Cercle d'unité (Ubuntu) */}
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" className="text-black" />

            {/* Croix Médicale Stylisée (4 personnes se rejoignant) */}
            <path
                d="M50 20V80 M20 50H80"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                className="text-black"
            />

            {/* Têtes (symbolisant l'humanité autour du centre) */}
            <circle cx="35" cy="35" r="4" fill="currentColor" className="text-black" />
            <circle cx="65" cy="35" r="4" fill="currentColor" className="text-black" />
            <circle cx="65" cy="65" r="4" fill="currentColor" className="text-black" />
            <circle cx="35" cy="65" r="4" fill="currentColor" className="text-black" />
        </svg>
    );
};
