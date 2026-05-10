"use client";

import * as THREE from "three";

export type ThemeType = "void" | "gossip" | "assemble" | "spell" | "fire" | "love" | "glitch" | "ghost" | "ocean" | "king" | "chaos";

export interface ThemeConfig {
  color: number;
  emissive: number;
  emissiveIntensity: number;
  metalness: number;
  roughness: number;
}

const THEMES: Record<ThemeType, ThemeConfig> = {
  void: { color: 0x050508, emissive: 0x050508, emissiveIntensity: 0.1, metalness: 0, roughness: 1 },
  gossip: { color: 0xC9A84C, emissive: 0xC9A84C, emissiveIntensity: 0.8, metalness: 0.8, roughness: 0.2 },
  assemble: { color: 0x880000, emissive: 0xCCCCCC, emissiveIntensity: 1.2, metalness: 0.9, roughness: 0.1 },
  spell: { color: 0x5B2D8E, emissive: 0x5B2D8E, emissiveIntensity: 1.5, metalness: 0.2, roughness: 0.5 },
  fire: { color: 0xFF4500, emissive: 0xFF0000, emissiveIntensity: 2.0, metalness: 0, roughness: 0.1 },
  love: { color: 0xE8739A, emissive: 0xE8739A, emissiveIntensity: 0.5, metalness: 0, roughness: 0.9 },
  glitch: { color: 0x4AF0C8, emissive: 0x4AF0C8, emissiveIntensity: 3.0, metalness: 0, roughness: 0 },
  ghost: { color: 0x7A7A9A, emissive: 0x7A7A9A, emissiveIntensity: 0.2, metalness: 0, roughness: 0.5 },
  ocean: { color: 0x0077BE, emissive: 0x0077BE, emissiveIntensity: 0.6, metalness: 0.5, roughness: 0.2 },
  king: { color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 1.0, metalness: 1, roughness: 0.1 },
  chaos: { color: 0xFFFFFF, emissive: 0xFFFFFF, emissiveIntensity: 1.0, metalness: 0, roughness: 0.5 }
};

export const getThemeForWord = (word: string): ThemeConfig => {
  const normalized = word.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
  if (normalized === "gossip") return THEMES.gossip;
  if (normalized === "assemble") return THEMES.assemble;
  if (normalized === "spell") return THEMES.spell;
  if (normalized === "fire") return THEMES.fire;
  if (normalized === "love") return THEMES.love;
  if (normalized === "glitch") return THEMES.glitch;
  if (normalized === "ghost") return THEMES.ghost;
  if (normalized === "ocean") return THEMES.ocean;
  if (normalized === "king") return THEMES.king;
  if (normalized === "chaos") return THEMES.chaos;
  return THEMES.void;
};
