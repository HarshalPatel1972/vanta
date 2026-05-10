"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";

const KEYS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
  ["SPACE", "BACKSPACE"]
];

interface VirtualKeyboardProps {
  scene: THREE.Scene;
  gestures: any[];
  visible: boolean;
  onKeyPress: (key: string) => void;
  roomDims: { width: number; height: number; depth: number };
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ 
  scene, gestures, visible, onKeyPress, roomDims
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const lastPressTime = useRef<number>(0);

  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.visible = visible;
  }, [visible]);

  useEffect(() => {
    if (!groupRef.current) return;
    
    // Clear existing
    while(groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0]);
    }

    const keySize = 0.08;
    const gap = 0.01;
    const rowGap = 0.02;

    KEYS.forEach((row, rowIndex) => {
      const rowWidth = row.length * (keySize + gap);
      row.forEach((key, keyIndex) => {
        const x = keyIndex * (keySize + gap) - rowWidth / 2;
        const y = -rowIndex * (keySize + rowGap);
        
        const isSpace = key === "SPACE";
        const isBS = key === "BACKSPACE";
        const width = isSpace ? keySize * 3 : (isBS ? keySize * 1.5 : keySize);

        const geo = new THREE.PlaneGeometry(width, keySize);
        const mat = new THREE.MeshStandardMaterial({ 
          color: 0x0D0D12, 
          emissive: 0x1A1A24,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, 0);
        mesh.userData = { key, width, height: keySize };
        groupRef.current?.add(mesh);
      });
    });
  }, []);

  // Update logic (hover, press)
  useEffect(() => {
    if (!visible || !gestures.length || !groupRef.current) return;

    const rightHand = gestures.find(g => !g.isLeft);
    if (!rightHand) return;

    // Map hand position to keyboard local space
    // Keyboard is at [0, 0.8, -1.5]
    const kbPos = new THREE.Vector3(0, 0.8, -1.5);
    const handWorldPos = new THREE.Vector3(
      (rightHand.position.x - 0.5) * roomDims.width,
      (0.5 - rightHand.position.y) * roomDims.height + roomDims.height/2,
      -rightHand.position.z * roomDims.depth
    );

    const localHandPos = handWorldPos.clone().sub(kbPos);
    
    let foundHover: string | null = null;
    groupRef.current.children.forEach((obj) => {
      const mesh = obj as THREE.Mesh;
      const { key, width, height } = mesh.userData;
      const dx = Math.abs(localHandPos.x - mesh.position.x);
      const dy = Math.abs(localHandPos.y - mesh.position.y);
      const dz = Math.abs(localHandPos.z);

      if (dx < width/2 && dy < height/2 && dz < 0.05) {
        foundHover = key;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissive.setHex(0x4A4A5C); // --ghost
        mat.opacity = 1.0;

        if (rightHand.type === "PINCH" && Date.now() - lastPressTime.current > 300) {
          mat.emissive.setHex(0xFFFFFF); // --snap
          onKeyPress(key);
          lastPressTime.current = Date.now();
          setTimeout(() => {
            if (mesh.parent) mat.emissive.setHex(0x4A4A5C);
          }, 80);
        }
      } else {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissive.setHex(0x1A1A24); // --border
        mat.opacity = 0.8;
      }
    });

    setHoveredKey(foundHover);
  }, [gestures, visible, roomDims]);

  return (
    <group ref={groupRef} position={[0, 0.8, -1.5]} visible={visible} />
  );
};
