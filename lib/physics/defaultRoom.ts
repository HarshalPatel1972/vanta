import type * as RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";

export const DEFAULT_ROOM_DIMS = {
  width: 5,
  height: 4,
  depth: 3,
};

export const initDefaultRoom = (world: RAPIER.World, RAPIER_LIB: typeof RAPIER, scene: THREE.Scene | null) => {
  const { width, height, depth } = DEFAULT_ROOM_DIMS;
  const halfW = width / 2;
  const halfH = height / 2;
  const halfD = depth / 2;

  // Floor
  const floorDesc = RAPIER_LIB.ColliderDesc.cuboid(halfW, 0.1, halfD)
    .setTranslation(0, -0.1, 0)
    .setRestitution(0.6)
    .setFriction(0.4);
  world.createCollider(floorDesc);

  // Ceiling
  const ceilingDesc = RAPIER_LIB.ColliderDesc.cuboid(halfW, 0.1, halfD)
    .setTranslation(0, height + 0.1, 0);
  world.createCollider(ceilingDesc);

  // Walls (6 walls total in physics, prompt says 6-wall room colliders)
  // Back Wall
  const backWallDesc = RAPIER_LIB.ColliderDesc.cuboid(halfW, halfH * 2, 0.1)
    .setTranslation(0, halfH, -halfD - 0.1);
  world.createCollider(backWallDesc);

  // Front Wall (near camera)
  const frontWallDesc = RAPIER_LIB.ColliderDesc.cuboid(halfW, halfH * 2, 0.1)
    .setTranslation(0, halfH, halfD + 0.1);
  world.createCollider(frontWallDesc);

  // Left Wall
  const leftWallDesc = RAPIER_LIB.ColliderDesc.cuboid(0.1, halfH * 2, halfD)
    .setTranslation(-halfW - 0.1, halfH, 0);
  world.createCollider(leftWallDesc);

  // Right Wall
  const rightWallDesc = RAPIER_LIB.ColliderDesc.cuboid(0.1, halfH * 2, halfD)
    .setTranslation(halfW + 0.1, halfH, 0);
  world.createCollider(rightWallDesc);

  // Floor Grid Visual (0.04 opacity, --border color)
  if (scene) {
    const grid = new THREE.GridHelper(Math.max(width, depth), 20, 0x1A1A24, 0x1A1A24);
    grid.position.y = 0.01;
    const material = grid.material as THREE.LineBasicMaterial;
    material.transparent = true;
    material.opacity = 0.04;
    scene.add(grid);
  }
};
