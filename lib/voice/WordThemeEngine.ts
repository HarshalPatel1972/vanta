"use client";

import * as THREE from "three";

export type ThemeType = "void" | "glitch" | "fire" | "gold" | "pulse" | "bone" | "fog" | "ghost" | "snap" | "void_alt";

export interface ThemeConfig {
  color: number;
  emissive: number;
  emissiveIntensity: number;
  metalness: number;
  roughness: number;
}

const THEMES: Record<ThemeType, ThemeConfig> = {
  void: { color: 0x050508, emissive: 0x050508, emissiveIntensity: 0.1, metalness: 0, roughness: 1 },
  glitch: { color: 0x4AF0C8, emissive: 0x4AF0C8, emissiveIntensity: 2.0, metalness: 0, roughness: 0 },
  fire: { color: 0xFF4500, emissive: 0xFF0000, emissiveIntensity: 1.5, metalness: 0, roughness: 0.5 },
  gold: { color: 0xFFD700, emissive: 0xAA8800, emissiveIntensity: 0.5, metalness: 1, roughness: 0.1 },
  pulse: { color: 0x4AF0C8, emissive: 0x4AF0C8, emissiveIntensity: 1.0, metalness: 0, roughness: 0.5 },
  bone: { color: 0xF5F5F0, emissive: 0xF5F5F0, emissiveIntensity: 0.2, metalness: 0, roughness: 0.8 },
  fog: { color: 0x7A7A9A, emissive: 0x7A7A9A, emissiveIntensity: 0.3, metalness: 0, roughness: 0.9 },
  ghost: { color: 0x4A4A5C, emissive: 0x4A4A5C, emissiveIntensity: 0.1, metalness: 0.2, roughness: 0.5 },
  snap: { color: 0xFFFFFF, emissive: 0xFFFFFF, emissiveIntensity: 3.0, metalness: 0, roughness: 0 },
  void_alt: { color: 0x0D0D12, emissive: 0x1A1A24, emissiveIntensity: 0.2, metalness: 0.1, roughness: 0.9 }
};

export const getThemeForWord = (word: string): ThemeConfig => {
  const normalized = word.toLowerCase().trim();
  if (normalized === "glitch") return THEMES.glitch;
  if (normalized === "fire") return THEMES.fire;
  if (normalized === "gold") return THEMES.gold;
  if (normalized === "pulse") return THEMES.pulse;
  if (normalized === "bone") return THEMES.bone;
  if (normalized === "fog") return THEMES.fog;
  if (normalized === "ghost") return THEMES.ghost;
  if (normalized === "snap") return THEMES.snap;
  return THEMES.void_alt;
};
