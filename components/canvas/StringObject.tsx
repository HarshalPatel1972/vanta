"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { RAPIER as RapierType } from "@/hooks/usePhysicsWorld";

interface StringObjectProps {
  world: any;
  RAPIER: typeof RapierType;
  scene: THREE.Scene;
  startPos: THREE.Vector3;
  length: number;
}

export const StringObject: React.FC<StringObjectProps> = ({ 
  world, RAPIER, scene, startPos, length 
}) => {
  const segmentsRef = useRef<{ body: any; mesh: THREE.Mesh }[]>([]);

  useEffect(() => {
    const segments: { body: any; mesh: THREE.Mesh }[] = [];
    const segmentCount = 12;
    const segmentLength = length / segmentCount;
    const radius = 0.01;

    let prevBody: any = null;

    for (let i = 0; i < segmentCount; i++) {
      const pos = startPos.clone().add(new THREE.Vector3(0, -i * segmentLength, 0));
      
      const bodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(pos.x, pos.y, pos.z);
      const body = world.createRigidBody(bodyDesc);
      
      const colliderDesc = RAPIER.ColliderDesc.capsule(segmentLength / 2, radius);
      world.createCollider(colliderDesc, body);

      const geo = new THREE.CapsuleGeometry(radius, segmentLength, 4, 8);
      const mat = new THREE.MeshStandardMaterial({ color: 0xF5F5F0, metalness: 0.1, roughness: 0.8 });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);

      segments.push({ body, mesh });

      if (prevBody) {
        const jointParams = RAPIER.JointData.ball(
          { x: 0, y: segmentLength / 2, z: 0 },
          { x: 0, y: -segmentLength / 2, z: 0 }
        );
        world.createImpulseJoint(jointParams, prevBody, body, true);
      } else {
        // Anchor the first segment (optional, for demo)
        // body.setBodyType(RAPIER.RigidBodyType.Fixed);
      }

      prevBody = body;
    }

    segmentsRef.current = segments;

    return () => {
      segments.forEach(s => {
        world.removeRigidBody(s.body);
        scene.remove(s.mesh);
      });
    };
  }, []);

  useEffect(() => {
    const update = () => {
      segmentsRef.current.forEach(s => {
        const t = s.body.translation();
        const r = s.body.rotation();
        s.mesh.position.set(t.x, t.y, t.z);
        s.mesh.quaternion.set(r.x, r.y, r.z, r.w);
      });
      requestAnimationFrame(update);
    };
    update();
  }, []);

  return null;
};
