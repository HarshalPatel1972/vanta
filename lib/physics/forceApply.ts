import * as THREE from "three";
import type * as RAPIER from "@dimforge/rapier3d-compat";

export const applyHandForce = (
  body: RAPIER.RigidBody,
  handPos: THREE.Vector3,
  handVelocity: THREE.Vector3,
  strength: number = 1.0
) => {
  const bodyPos = body.translation();
  const bodyVec = new THREE.Vector3(bodyPos.x, bodyPos.y, bodyPos.z);
  const dist = handPos.distanceTo(bodyVec);

  if (dist < 0.5) {
    // Apply impulse in direction of velocity
    const impulse = {
      x: handVelocity.x * strength,
      y: handVelocity.y * strength,
      z: handVelocity.z * strength
    };
    body.applyImpulse(impulse, true);
  }
};
