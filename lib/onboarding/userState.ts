"use client";

const ONBOARDING_KEY = 'vanta_onboarding_v1';

export type OnboardingState = {
  hasSeenHints: string[];
  isReturning: boolean;
  completedTutorial: boolean;
};

export const getOnboardingState = (): OnboardingState => {
  if (typeof window === 'undefined') {
    return { hasSeenHints: [], isReturning: false, completedTutorial: false };
  }
  const data = localStorage.getItem(ONBOARDING_KEY);
  if (!data) {
    return { hasSeenHints: [], isReturning: false, completedTutorial: false };
  }
  try {
    return JSON.parse(data);
  } catch {
    return { hasSeenHints: [], isReturning: false, completedTutorial: false };
  }
};

export const saveOnboardingState = (state: OnboardingState) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ ...state, isReturning: true }));
};

export const markHintAsSeen = (hintId: string) => {
  const state = getOnboardingState();
  if (!state.hasSeenHints.includes(hintId)) {
    state.hasSeenHints.push(hintId);
    saveOnboardingState(state);
  }
};
