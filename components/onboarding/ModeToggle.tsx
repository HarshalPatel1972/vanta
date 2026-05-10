"use client";

import React from "react";

export type InteractionMode = "NONE" | "TYPING" | "VOICE";

interface ModeToggleProps {
  activeMode: InteractionMode;
  onModeChange: (mode: InteractionMode) => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({ activeMode, onModeChange }) => {
  return (
    <div className="absolute bottom-6 left-8 z-[101] flex items-center space-x-4 opacity-30 hover:opacity-100 transition-opacity">
      {/* Keyboard Icon */}
      <button 
        onClick={() => onModeChange(activeMode === "TYPING" ? "NONE" : "TYPING")}
        className={`p-2 transition-colors ${activeMode === "TYPING" ? "text-[var(--pulse)]" : "text-[var(--muted)] hover:text-[var(--bone)]"}`}
        title="Air Typing Mode"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10" />
        </svg>
      </button>

      {/* Mic Icon */}
      <button 
        onClick={() => onModeChange(activeMode === "VOICE" ? "NONE" : "VOICE")}
        className={`p-2 transition-colors ${activeMode === "VOICE" ? "text-[var(--pulse)]" : "text-[var(--muted)] hover:text-[var(--bone)]"}`}
        title="Voice Mode"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>
    </div>
  );
};
