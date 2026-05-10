"use client";

import React, { useState, useEffect } from "react";
import { saveOnboardingState, getOnboardingState } from "@/lib/onboarding/userState";

interface TutorialStep {
  id: string;
  text: string;
  icon: string;
  check: (gestures: any[], objects: number, typed: string, mode: string) => boolean;
}

const STEPS: TutorialStep[] = [
  { id: "step_pinch", text: "Pinch your index finger and thumb to interact", icon: "pinch", check: (gs) => gs.some(g => g.type === "PINCH") },
  { id: "step_draw", text: "Draw a shape in the air to create a clay ball", icon: "draw", check: (_, obj) => obj > 0 },
  { id: "step_grip", text: "Grip the ball. Open your palm to throw.", icon: "grip", check: (gs) => gs.some(g => g.type === "PALM") },
  { id: "step_bounce", text: "Watch it come back. Physics is always active.", icon: "physics", check: (_, obj) => obj > 0 }, // Passive, advance immediately or on delay
  { id: "step_voice", text: "Say anything. Speak louder to make it bigger.", icon: "voice", check: (_, __, ___, mode) => mode === "VOICE" },
  { id: "step_type", text: "Pinch letters to type in the air", icon: "type", check: (_, __, typed) => typed.length > 0 },
  { id: "step_share", text: "Tap the share icon when you've made something worth keeping", icon: "share", check: () => false }, // Manual exit or click
];

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  gestures: any[];
  objectCount: number;
  typedText: string;
  activeMode: string;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ 
  isOpen, onClose, gestures, objectCount, typedText, activeMode 
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const step = STEPS[currentStepIndex];
    if (step.check(gestures, objectCount, typedText, activeMode)) {
      if (currentStepIndex < STEPS.length - 1) {
        setTimeout(() => setCurrentStepIndex(prev => prev + 1), 1000);
      } else {
        complete();
      }
    }
  }, [gestures, objectCount, typedText, activeMode, currentStepIndex, isOpen]);

  const complete = () => {
    const state = getOnboardingState();
    state.completedTutorial = true;
    saveOnboardingState(state);
    onClose();
  };

  if (!isOpen) return null;

  const currentStep = STEPS[currentStepIndex];

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[var(--void)] bg-opacity-95 text-[var(--bone)]">
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 text-[var(--fog)] font-bebas text-sm tracking-widest hover:text-[var(--bone)] transition-colors"
      >
        SKIP
      </button>

      <div className="flex flex-col items-center space-y-12 max-w-md text-center px-6">
        <div className="font-mono text-[12px] text-[var(--fog)] tracking-widest">
          {currentStepIndex + 1} / {STEPS.length}
        </div>

        <div className="w-32 h-32 text-[var(--pulse)] animate-pulse">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
             <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
             <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
             <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
             <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
           </svg>
        </div>

        <p className="text-lg font-light font-dm leading-relaxed">
          {currentStep.text}
        </p>
      </div>

      <style jsx>{`
        .font-bebas { font-family: var(--font-bebas-neue); }
        .font-dm { font-family: var(--font-dm-sans); }
      `}</style>
    </div>
  );
};
