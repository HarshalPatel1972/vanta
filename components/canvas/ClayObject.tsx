"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import type * as RAPIER from "@dimforge/rapier3d-compat";

import { HandGesture } from "@/hooks/useGestures";
import { landmarkToWorld } from "@/lib/utils/coordinates";
import { RoomDimensions } from "@/components/room/RoomBuilder";

interface ClayObjectProps {
  id: number;
  world: RAPIER.World;
  RAPIER: typeof RAPIER;
  scene: THREE.Scene;
  position: THREE.Vector3;
  radius: number;
  gestures: HandGesture[];
  roomDims: RoomDimensions;
  handLandmarks: any;
  onTear?: (id: number, p1: THREE.Vector3, p2: THREE.Vector3, r: number) => void;
}

export const ClayObject: React.FC<ClayObjectProps> = ({ 
  id, world, RAPIER, scene, position, radius, gestures, roomDims, handLandmarks, onTear
}) => {
  const meshRef = useRef<THREE.Mesh | null>(null);
  const bodyRef = useRef<RAPIER.RigidBody | null>(null);
  const isTearing = useRef(false);

  useEffect(() => {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0xC17A4A,
      roughness: 0.85,
      metalness: 0.0,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    scene.add(mesh);
    meshRef.current = mesh;

    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(position.x, position.y, position.z)
      .setLinearDamping(0.5)
      .setAngularDamping(0.5);
    const body = world.createRigidBody(bodyDesc);
    const colliderDesc = RAPIER.ColliderDesc.ball(radius)
      .setRestitution(0.6)
      .setFriction(0.4);
    world.createCollider(colliderDesc, body);
    bodyRef.current = body;

    return () => {
      scene.remove(mesh);
      world.removeRigidBody(body);
    };
  }, [world, RAPIER, scene, radius]); // removed position to avoid re-init

  useEffect(() => {
    let animationFrameId: number;
    const sync = () => {
      if (!meshRef.current || !bodyRef.current || isTearing.current) return;

      const body = bodyRef.current;
      const mesh = meshRef.current;

      const grippers: number[] = [];
      gestures.forEach((gesture, handIndex) => {
        const landmarks = handLandmarks[handIndex];
        if (!landmarks) return;
        const handPos = landmarkToWorld(landmarks[0], roomDims);
        const dist = handPos.distanceTo(mesh.position);

        if (gesture.type === "GRIP" && dist < radius * 2) {
          grippers.push(handIndex);
        } else if (gesture.type === "PUNCH" && dist < radius * 3) {
          const punchImpulse = {
            x: gesture.velocity.x * 50,
            y: gesture.velocity.y * 50,
            z: gesture.velocity.z * 100
          };
          body.applyImpulse(punchImpulse, true);
        }
      });

      if (grippers.length === 1) {
        const handIndex = grippers[0];
        const handPos = landmarkToWorld(handLandmarks[handIndex][0], roomDims);
        body.setTranslation({ x: handPos.x, y: handPos.y, z: handPos.z }, true);
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        mesh.scale.lerp(new THREE.Vector3(0.85, 0.85, 0.85), 0.1);
      } else if (grippers.length === 2) {
        const h1 = landmarkToWorld(handLandmarks[0][0], roomDims);
        const h2 = landmarkToWorld(handLandmarks[1][0], roomDims);
        const dist = h1.distanceTo(h2);
        
        const scale = Math.max(1, dist / (radius * 2));
        mesh.scale.set(scale, scale, scale);
        
        const center = new THREE.Vector3().addVectors(h1, h2).multiplyScalar(0.5);
        body.setTranslation({ x: center.x, y: center.y, z: center.z }, true);
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);

        if (scale > 2.5 && onTear) {
          isTearing.current = true;
          onTear(id, h1, h2, radius * 0.7);
        }
      } else {
        mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }

      const pos = body.translation();
      const rot = body.rotation();
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
      
      animationFrameId = requestAnimationFrame(sync);
    };
    sync();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gestures, handLandmarks, roomDims, radius, id, onTear]);

  return null;
};
