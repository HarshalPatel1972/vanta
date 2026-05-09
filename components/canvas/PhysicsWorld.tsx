"use client";

import React, { useEffect } from "react";
import type * as RAPIER from "@dimforge/rapier3d-compat";

interface PhysicsWorldProps {
  world: RAPIER.World | null;
  onStep?: () => void;
}

export const PhysicsWorld: React.FC<PhysicsWorldProps> = ({ world, onStep }) => {
  useEffect(() => {
    if (!world) return;

    let animationFrameId: number;
    const step = () => {
      world.step();
      if (onStep) onStep();
      animationFrameId = requestAnimationFrame(step);
    };

    step();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [world, onStep]);

  return null;
};
