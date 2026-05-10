"use client";

import React, { useState, useEffect, useRef } from "react";
import { getOnboardingState, markHintAsSeen } from "@/lib/onboarding/userState";

interface Hint {
  id: string;
  text: string;
  position: "center" | "right-hand" | "bottom" | "top";
  icon?: React.ReactNode;
}

const HINTS: Hint[] = [
  { id: "hint_pinch", text: "Pinch to place", position: "center" },
  { id: "hint_draw", text: "Draw a shape to create an object", position: "right-hand" },
  { id: "hint_throw", text: "Grip it. Throw it.", position: "bottom" },
  { id: "hint_voice", text: "Try speaking", position: "top" },
  { id: "hint_type", text: "Pinch letters to type in the air", position: "center" },
];

interface HintSystemProps {
  handsDetected: boolean;
  isPinching: boolean;
  objectCount: number;
  rightHandPos: { x: number; y: number } | null;
}

export const HintSystem: React.FC<HintSystemProps> = ({ 
  handsDetected, isPinching, objectCount, rightHandPos 
}) => {
  const [activeHint, setActiveHint] = useState<Hint | null>(null);
  const [startTime] = useState(Date.now());
  const onboardingState = useRef(getOnboardingState());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pinchDetected = useRef(false);

  useEffect(() => {
    if (onboardingState.current.isReturning && onboardingState.current.completedTutorial) return;

    const checkHints = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const seen = onboardingState.current.hasSeenHints;

      // Current logic ensures only one hint at a time
      if (activeHint) return;

      // 1. Pinch hint: Hands detected, no action for 3s
      if (!seen.includes("hint_pinch") && handsDetected && elapsed > 3 && !pinchDetected.current) {
        showHint("hint_pinch");
        return;
      }

      // 2. Draw hint: First pinch detected (handled via isPinching prop)
      if (seen.includes("hint_pinch") && !seen.includes("hint_draw") && isPinching) {
        showHint("hint_draw");
        return;
      }

      // 3. Throw hint: First object created
      if (seen.includes("hint_draw") && !seen.includes("hint_throw") && objectCount > 0) {
        showHint("hint_throw");
        return;
      }

      // 4. Voice hint: 30s elapsed
      if (seen.includes("hint_throw") && !seen.includes("hint_voice") && elapsed > 30) {
        showHint("hint_voice");
        return;
      }

      // 5. Type hint: 60s elapsed
      if (seen.includes("hint_voice") && !seen.includes("hint_type") && elapsed > 60) {
        showHint("hint_type");
        return;
      }
    };

    const interval = setInterval(checkHints, 1000);
    return () => clearInterval(interval);
  }, [handsDetected, isPinching, objectCount, startTime, activeHint]);

  const showHint = (id: string) => {
    const hint = HINTS.find(h => h.id === id);
    if (hint) {
      setActiveHint(hint);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        dismissHint(id);
      }, 8000);
    }
  };

  const dismissHint = (id: string) => {
    if (activeHint?.id === id) {
      markHintAsSeen(id);
      setActiveHint(null);
    }
  };

  // Dismiss triggers
  useEffect(() => {
    if (!activeHint) return;
    if (activeHint.id === "hint_pinch" && isPinching) {
      pinchDetected.current = true;
      dismissHint("hint_pinch");
    }
    if (activeHint.id === "hint_draw" && objectCount > 0) dismissHint("hint_draw");
    // Other hints are auto-dismissed after 8s as per rule 91
  }, [isPinching, objectCount, activeHint]);

  if (!activeHint) return null;

  const getPosStyles = (): React.CSSProperties => {
    switch (activeHint.position) {
      case "center": return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
      case "right-hand": 
        if (rightHandPos) return { top: `${rightHandPos.y * 100}%`, left: `${rightHandPos.x * 100}%`, transform: "translate(-50%, -120%)" };
        return { top: "50%", left: "70%" };
      case "bottom": return { bottom: "20%", left: "50%", transform: "translateX(-50%)" };
      case "top": return { top: "20%", left: "50%", transform: "translateX(-50%)" };
      default: return {};
    }
  };

  return (
    <div 
      className="fixed z-50 pointer-events-none transition-opacity duration-400 flex items-center space-x-2"
      style={getPosStyles()}
    >
      <svg className="w-4 h-4 text-[var(--ghost)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
        <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
        <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
      </svg>
      <span className="text-[13px] text-[var(--ghost)] font-light font-dm tracking-wide">
        {activeHint.text}
      </span>
    </div>
  );
};
