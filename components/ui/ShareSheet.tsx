"use client";

import React from "react";

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (format: "PNG" | "PDF") => void;
}

export const ShareSheet: React.FC<ShareSheetProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-[var(--void)] bg-opacity-80 backdrop-blur-sm">
      <div className="bg-[var(--void_alt)] border border-[var(--border)] p-8 rounded-lg flex flex-col items-center space-y-6 max-w-xs w-full">
        <h3 className="font-bebas text-2xl tracking-[0.15em] text-[var(--bone)]">SHARE CREATION</h3>
        
        <div className="grid grid-cols-2 gap-4 w-full">
          <button 
            onClick={() => onSelect("PNG")}
            className="flex flex-col items-center justify-center p-6 border border-[var(--muted)] hover:border-[var(--pulse)] transition-colors space-y-2 group"
          >
            <svg className="w-8 h-8 text-[var(--fog)] group-hover:text-[var(--bone)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-bebas text-xs tracking-widest text-[var(--fog)]">PNG</span>
          </button>

          <button 
            onClick={() => onSelect("PDF")}
            className="flex flex-col items-center justify-center p-6 border border-[var(--muted)] hover:border-[var(--pulse)] transition-colors space-y-2 group"
          >
            <svg className="w-8 h-8 text-[var(--fog)] group-hover:text-[var(--bone)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              <path d="M9 15h6M9 11h6M9 19h6" />
            </svg>
            <span className="font-bebas text-xs tracking-widest text-[var(--fog)]">PDF</span>
          </button>
        </div>

        <button onClick={onClose} className="text-[var(--fog)] font-dm text-[11px] tracking-widest hover:text-[var(--bone)]">CANCEL</button>
      </div>

      <style jsx>{`
        .font-bebas { font-family: var(--font-bebas-neue); }
        .font-dm { font-family: var(--font-dm-sans); }
      `}</style>
    </div>
  );
};
