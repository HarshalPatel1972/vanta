"use client";

import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { HandGesture } from "@/hooks/useGestures";

export type RoomDimensions = {
  width: number;
  height: number;
  depth: number;
};

interface RoomBuilderProps {
  gestures: HandGesture[];
  scene: THREE.Scene | null;
  onConfirm: (dims: RoomDimensions) => void;
}

type BuilderState = "GUIDE" | "WIDTH_SETTING" | "HEIGHT_SETTING" | "CONFIRM";

export const RoomBuilder: React.FC<RoomBuilderProps> = ({ gestures, scene, onConfirm }) => {
  const [state, setState] = useState<BuilderState>("GUIDE");
  const [dims, setDims] = useState<RoomDimensions>({ width: 5, height: 3, depth: 4 });
  const wireframeRef = useRef<THREE.LineSegments | null>(null);
  const confirmTimer = useRef<number | null>(null);

  // Initialize wireframe
  useEffect(() => {
    if (!scene) return;

    const geometry = new THREE.BoxGeometry(dims.width, dims.height, dims.depth);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ 
      color: 0x4AF0C8, // --pulse
      transparent: true,
      opacity: 0.2
    });
    const wireframe = new THREE.LineSegments(edges, material);
    wireframe.position.y = dims.height / 2; // Floor at y=0
    scene.add(wireframe);
    wireframeRef.current = wireframe;

    return () => {
      scene.remove(wireframe);
    };
  }, [scene]);

  // Update wireframe when dims change
  useEffect(() => {
    if (wireframeRef.current) {
      wireframeRef.current.scale.set(dims.width / 5, dims.height / 3, dims.depth / 4);
      wireframeRef.current.position.y = dims.height / 2;
    }
  }, [dims]);

  // State transitions and dimension logic
  useEffect(() => {
    if (gestures.length === 0) return;

    if (state === "GUIDE") {
      if (gestures.length === 2) setState("WIDTH_SETTING");
    } else if (state === "WIDTH_SETTING") {
      if (gestures.length === 2) {
        const left = gestures.find(g => g.isLeft);
        const right = gestures.find(g => !g.isLeft);
        if (left && right) {
          const dist = Math.abs(right.position.x - left.position.x);
          const width = THREE.MathUtils.mapLinear(dist, 0.3, 0.9, 2, 8);
          // Only update if difference is meaningful (> 1cm)
          if (Math.abs(dims.width - width) > 0.01) {
            setDims(prev => ({ ...prev, width }));
          }
        }
      }
      const right = gestures.find(g => !g.isLeft);
      if (right?.type === "PINCH") setState("HEIGHT_SETTING");
    } else if (state === "HEIGHT_SETTING") {
      const right = gestures.find(g => !g.isLeft);
      if (right) {
        const height = THREE.MathUtils.mapLinear(right.position.y, 0.1, 0.9, 5, 2);
        if (Math.abs(dims.height - height) > 0.01) {
          setDims(prev => ({ ...prev, height }));
        }
      }
      if (gestures.length === 2 && gestures.every(g => g.type === "PALM")) {
        setState("CONFIRM");
      }
    } else if (state === "CONFIRM") {
      if (gestures.length === 2 && gestures.every(g => g.type === "PALM")) {
        if (!confirmTimer.current) {
          confirmTimer.current = window.setTimeout(() => {
            onConfirm(dims);
          }, 1000);
        }
      } else {
        if (confirmTimer.current) {
          window.clearTimeout(confirmTimer.current);
          confirmTimer.current = null;
        }
        setState("HEIGHT_SETTING");
      }
    }
  }, [gestures, state, dims, onConfirm]);

  return (
    <div className="fixed inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center space-y-4 mb-32">
        {state === "GUIDE" && (
          <h2 className="text-3xl font-bebas text-[var(--bone)] tracking-widest text-center">
            SPREAD YOUR HANDS TO SET THE ROOM WIDTH
          </h2>
        )}
        
        {state === "WIDTH_SETTING" && (
          <div className="flex flex-col items-center">
            <h2 className="text-3xl font-bebas text-[var(--bone)] tracking-widest mb-2">SET WIDTH</h2>
            <div className="text-xl font-mono text-[var(--pulse)]">WIDTH: {dims.width.toFixed(1)}M</div>
            <p className="text-[11px] font-dm text-[var(--ghost)] mt-4">PINCH WITH RIGHT HAND TO SET HEIGHT</p>
          </div>
        )}

        {state === "HEIGHT_SETTING" && (
          <div className="flex flex-col items-center">
            <h2 className="text-3xl font-bebas text-[var(--bone)] tracking-widest mb-2">SET HEIGHT</h2>
            <div className="text-xl font-mono text-[var(--pulse)]">HEIGHT: {dims.height.toFixed(1)}M</div>
            <p className="text-[11px] font-dm text-[var(--ghost)] mt-4">OPEN BOTH PALMS TO CONFIRM</p>
          </div>
        )}

        {state === "CONFIRM" && (
          <div className="flex flex-col items-center">
            <h2 className="text-3xl font-bebas text-[var(--bone)] tracking-widest mb-2">HOLD TO CONFIRM</h2>
            <div className="w-48 h-1 bg-[var(--muted)] mt-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-[var(--pulse)] animate-fill-bar" />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .font-bebas { font-family: var(--font-bebas-neue); }
        .font-dm { font-family: var(--font-dm-sans); }
        .font-mono { font-family: var(--font-jetbrains-mono); }
        @keyframes fill-bar {
          from { width: 0; }
          to { width: 100%; }
        }
        .animate-fill-bar {
          animation: fill-bar 1s linear forwards;
        }
      `}</style>
    </div>
  );
};
