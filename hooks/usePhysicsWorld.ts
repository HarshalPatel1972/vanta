"use client";

import { useEffect, useRef, useState } from "react";
import type * as RAPIER from "@dimforge/rapier3d-compat";

export const usePhysicsWorld = () => {
  const [isReady, setIsReady] = useState(false);
  const worldRef = useRef<RAPIER.World | null>(null);
  const rapierRef = useRef<typeof RAPIER | null>(null);

  useEffect(() => {
    const initPhysics = async () => {
      const RAPIER = await import("@dimforge/rapier3d-compat");
      await RAPIER.init();
      
      const gravity = { x: 0.0, y: -9.81, z: 0.0 };
      const world = new RAPIER.World(gravity);
      
      rapierRef.current = RAPIER;
      worldRef.current = world;
      setIsReady(true);
    };

    initPhysics();

    return () => {
      if (worldRef.current) {
        worldRef.current.free();
      }
    };
  }, []);

  return { world: worldRef.current, RAPIER: rapierRef.current, isReady };
};
