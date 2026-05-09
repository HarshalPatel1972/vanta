"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import type * as RAPIER from "@dimforge/rapier3d-compat";
import { RoomDimensions } from "./RoomBuilder";

interface RoomPhysicsProps {
  world: RAPIER.World | null;
  RAPIER: typeof RAPIER | null;
  dims: RoomDimensions;
  scene: THREE.Scene | null;
}

export const RoomPhysics: React.FC<RoomPhysicsProps> = ({ world, RAPIER, dims, scene }) => {
  const collidersRef = useRef<RAPIER.Collider[]>([]);
  const gridRef = useRef<THREE.GridHelper | null>(null);

  useEffect(() => {
    if (!world || !RAPIER || !scene) return;

    // Remove old colliders
    collidersRef.current.forEach(c => world.removeCollider(c, true));
    collidersRef.current = [];

    // Floor
    const floorDesc = RAPIER.ColliderDesc.cuboid(dims.width / 2, 0.05, dims.depth / 2)
      .setTranslation(0, -0.05, 0)
      .setRestitution(0.6)
      .setFriction(0.4);
    collidersRef.current.push(world.createCollider(floorDesc));

    // Ceiling
    const ceilingDesc = RAPIER.ColliderDesc.cuboid(dims.width / 2, 0.05, dims.depth / 2)
      .setTranslation(0, dims.height + 0.05, 0);
    collidersRef.current.push(world.createCollider(ceilingDesc));

    // Left Wall
    const leftWallDesc = RAPIER.ColliderDesc.cuboid(0.05, dims.height / 2, dims.depth / 2)
      .setTranslation(-dims.width / 2 - 0.05, dims.height / 2, 0);
    collidersRef.current.push(world.createCollider(leftWallDesc));

    // Right Wall
    const rightWallDesc = RAPIER.ColliderDesc.cuboid(0.05, dims.height / 2, dims.depth / 2)
      .setTranslation(dims.width / 2 + 0.05, dims.height / 2, 0);
    collidersRef.current.push(world.createCollider(rightWallDesc));

    // Front Wall (near camera/user)
    const frontWallDesc = RAPIER.ColliderDesc.cuboid(dims.width / 2, dims.height / 2, 0.05)
      .setTranslation(0, dims.height / 2, dims.depth / 2 + 0.05);
    collidersRef.current.push(world.createCollider(frontWallDesc));

    // Back Wall
    const backWallDesc = RAPIER.ColliderDesc.cuboid(dims.width / 2, dims.height / 2, 0.05)
      .setTranslation(0, dims.height / 2, -dims.depth / 2 - 0.05);
    collidersRef.current.push(world.createCollider(backWallDesc));

    // Floor Grid Visual
    if (gridRef.current) scene.remove(gridRef.current);
    const grid = new THREE.GridHelper(Math.max(dims.width, dims.depth), 10, 0x1A1A24, 0x1A1A24);
    grid.position.y = 0.01;
    scene.add(grid);
    gridRef.current = grid;

    return () => {
      collidersRef.current.forEach(c => world.removeCollider(c, true));
      if (gridRef.current) scene.remove(gridRef.current);
    };
  }, [world, RAPIER, dims, scene]);

  return null;
};
