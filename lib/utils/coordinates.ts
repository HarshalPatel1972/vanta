import * as THREE from "three";
import { RoomDimensions } from "@/components/room/RoomBuilder";

export interface Point {
  x: number;
  y: number;
  z: number;
}

export const getDistance = (p1: Point, p2: Point): number => {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) + 
    Math.pow(p1.y - p2.y, 2) + 
    Math.pow(p1.z - p2.z, 2)
  );
};

export const getPalmCenter = (landmarks: Point[]): Point => {
  const indices = [0, 5, 9, 13, 17];
  let x = 0, y = 0, z = 0;
  indices.forEach(i => {
    x += landmarks[i].x;
    y += landmarks[i].y;
    z += landmarks[i].z;
  });
  return { x: x / indices.length, y: y / indices.length, z: z / indices.length };
};

export const landmarkToWorld = (lm: Point, room: RoomDimensions): THREE.Vector3 => {
  // Mirroring was handled in LandmarkOverlay and HandTracker (scaleX(-1))
  // So we assume lm.x is already mirrored if we want "selfie" mapping.
  // Actually, MediaPipe returns raw x. If we mirrored video, we should mirror x.
  const mirroredX = 1 - lm.x;
  
  const x = (mirroredX - 0.5) * room.width;
  const y = (1 - lm.y) * room.height;
  // Z in MediaPipe is relative to wrist. We'll map it to a reasonable depth range.
  // Front of room is depth/2. We'll put the "interactive plane" slightly inside.
  const z = room.depth / 2 - (lm.z + 0.5) * (room.depth / 2); 
  
  return new THREE.Vector3(x, y, z);
};
