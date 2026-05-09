"use client";

import React from "react";

interface ShareButtonProps {
  onClick: () => void;
  visible: boolean;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ onClick, visible }) => {
  if (!visible) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 flex items-center space-x-2 group focus:outline-none"
    >
      <div className="flex flex-col items-end">
        <span className="text-[11px] font-bebas tracking-[0.15em] text-[var(--bone)] opacity-40 group-hover:opacity-100 group-hover:text-[var(--pulse)] transition-all">
          SHARE
        </span>
      </div>
      <div className="w-10 h-10 border border-[var(--muted)] group-hover:border-[var(--pulse)] flex items-center justify-center transition-all">
        <svg
          className="w-5 h-5 text-[var(--bone)] group-hover:text-[var(--pulse)] transition-all"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </div>

      <style jsx>{`
        .font-bebas { font-family: var(--font-bebas-neue); }
      `}</style>
    </button>
  );
};
