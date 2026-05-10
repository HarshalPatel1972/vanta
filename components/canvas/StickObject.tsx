"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { RAPIER as RapierType } from "@/hooks/usePhysicsWorld";

interface StickObjectProps {
  id: number;
  world: any;
  RAPIER: typeof RapierType;
  scene: THREE.Scene;
  position: THREE.Vector3;
  length: number;
  onBodyInit?: (body: any) => void;
}

export const StickObject: React.FC<StickObjectProps> = ({ 
  id, world, RAPIER, scene, position, length, onBodyInit 
}) => {
  const bodyRef = useRef<any>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const radius = 0.02;
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(position.x, position.y, position.z);
    const body = world.createRigidBody(bodyDesc);
    
    const colliderDesc = RAPIER.ColliderDesc.cylinder(length / 2, radius);
    world.createCollider(colliderDesc, body);
    bodyRef.current = body;
    if (onBodyInit) onBodyInit(body);

    const geo = new THREE.CylinderGeometry(radius, radius, length, 12);
    const mat = new THREE.MeshStandardMaterial({ color: 0xF5F5F0, metalness: 0, roughness: 0.9 });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    (meshRef as any).current = mesh;

    return () => {
      world.removeRigidBody(body);
      scene.remove(mesh);
    };
  }, []);

  useEffect(() => {
    const update = () => {
      if (!bodyRef.current || !meshRef.current) return;
      const t = bodyRef.current.translation();
      const r = bodyRef.current.rotation();
      meshRef.current.position.set(t.x, t.y, t.z);
      meshRef.current.quaternion.set(r.x, r.y, r.z, r.w);
      requestAnimationFrame(update);
    };
    update();
  }, []);

  return null;
};
