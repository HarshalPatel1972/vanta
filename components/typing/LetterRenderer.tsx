"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { getThemeForWord } from "@/lib/themes/wordThemes";

export interface StyledWord {
  text: string;
  size: number;
  emissiveIntensity: number;
  spacing: number;
  isGhost?: boolean;
  offset?: THREE.Vector3;
}

interface LetterRendererProps {
  scene: THREE.Scene;
  words: StyledWord[];
}

export const LetterRenderer: React.FC<LetterRendererProps> = ({ scene, words }) => {
  const groupRef = useRef<THREE.Group>(null);
  const fontRef = useRef<any>(null);

  useEffect(() => {
    const loader = new FontLoader();
    loader.load("/fonts/helvetiker.json", (font) => {
      fontRef.current = font;
      updateText(words);
    });
  }, []);

  useEffect(() => {
    updateText(words);
  }, [words]);

  const updateText = (styledWords: StyledWord[]) => {
    if (!fontRef.current || !groupRef.current) return;

    // Clear existing
    while(groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0]);
    }

    let xOffset = -styledWords.length * 0.2;

    styledWords.forEach((word) => {
      const theme = getThemeForWord(word.text);
      const wordGroup = new THREE.Group();
      wordGroup.position.x = xOffset + (word.offset?.x || 0);
      wordGroup.position.y = (word.offset?.y || 0);
      wordGroup.position.z = (word.offset?.z || 0);
      
      let wordWidth = 0;
      for (let i = 0; i < word.text.length; i++) {
        const char = word.text[i];
        const geo = new TextGeometry(char, {
          font: fontRef.current,
          size: word.size,
          height: 0.02,
        });
        
        const mat = new THREE.MeshStandardMaterial({ 
          color: word.isGhost ? 0x7A7A9A : theme.color, 
          emissive: word.isGhost ? 0x7A7A9A : theme.emissive,
          emissiveIntensity: word.isGhost ? 0.2 : word.emissiveIntensity * theme.emissiveIntensity,
          metalness: theme.metalness,
          roughness: theme.roughness,
          transparent: true,
          opacity: word.isGhost ? 0.35 : 1.0,
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.x = wordWidth;
        
        if (!word.isGhost) {
          mesh.scale.set(0, 0, 0);
          let s = 0;
          const anim = () => {
            if (s < 1) {
              s += 0.15;
              mesh.scale.set(s, s, s);
              requestAnimationFrame(anim);
            }
          };
          anim();
        }
        
        wordGroup.add(mesh);
        wordWidth += word.size * 0.8 + word.spacing;
      }
      
      groupRef.current?.add(wordGroup);
      xOffset += wordWidth + 0.2;
    });
  };

  return (
    <group ref={groupRef} position={[0, 1.2, -1.5]} />
  );
};
