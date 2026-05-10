"use client";

import React from "react";

interface LoadScreenProps {
  status: string;
}

export const LoadScreen: React.FC<LoadScreenProps> = ({ status }) => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--void)] text-[var(--bone)]">
      <div className="flex flex-col items-center space-y-6">
        {/* Wordmark */}
        <h1 className="text-7xl font-normal tracking-[0.12em] text-[var(--bone)] font-bebas animate-pulse-slow">
          VANTA
        </h1>

        {/* Slogan */}
        <p className="text-base font-light text-[var(--fog)] font-dm">
          Shape the air.
        </p>

        {/* Rule */}
        <div className="h-[2px] w-[120px] bg-[var(--muted)]" />

        {/* Status and Icon */}
        <div className="flex flex-col items-center space-y-4">
          <svg
            className="w-6 h-6 text-[var(--fog)] animate-pulse-slow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <p className="text-[13px] text-[var(--ghost)] font-dm">
            {status}
          </p>
        </div>
      </div>

      {/* Privacy Note */}
      <div className="absolute bottom-8 text-[11px] text-[var(--fog)] font-dm">
        Your camera never leaves your device.
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        .font-bebas {
          font-family: var(--font-bebas-neue);
        }
        .font-dm {
          font-family: var(--font-dm-sans);
        }
      `}</style>
    </div>
  );
};
