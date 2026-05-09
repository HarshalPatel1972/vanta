"use client";

import { useRef, useMemo, useCallback } from "react";
import { Point, getDistance } from "../lib/utils/coordinates";
import { isPinching } from "../lib/gestures/pinch";
import { isGripping } from "../lib/gestures/grip";
import { isPalmOpen } from "../lib/gestures/palm";

export type GestureType = "NONE" | "PINCH" | "GRIP" | "PALM" | "PUNCH" | "THROW";

export interface HandGesture {
  type: GestureType;
  position: Point;
  velocity: Point;
  isLeft: boolean;
}

export const useGestures = (trackingResults: any) => {
  const lastLandmarks = useRef<any[]>([]);
  const gestureStates = useRef<any[]>([]);

  const gestures = useMemo(() => {
    if (!trackingResults || !trackingResults.multiHandLandmarks) {
      return [];
    }

    const newGestures: HandGesture[] = trackingResults.multiHandLandmarks.map((landmarks: any, index: number) => {
      const isLeft = trackingResults.multiHandedness[index].label === "Left";
      const currentPos = landmarks[0];
      
      let velocity = { x: 0, y: 0, z: 0 };
      if (lastLandmarks.current[index]) {
        const lastPos = lastLandmarks.current[index][0];
        velocity = {
          x: currentPos.x - lastPos.x,
          y: currentPos.y - lastPos.y,
          z: currentPos.z - lastPos.z,
        };
      }

      // Detect raw gesture
      let rawType: GestureType = "NONE";
      if (isPinching(landmarks)) rawType = "PINCH";
      else if (isGripping(landmarks)) {
        rawType = "GRIP";
        if (velocity.z < -0.04) rawType = "PUNCH";
      } else if (isPalmOpen(landmarks)) rawType = "PALM";

      // Debounce logic
      if (!gestureStates.current[index]) {
        gestureStates.current[index] = { type: "NONE", count: 0, lastRawType: "NONE" };
      }

      const state = gestureStates.current[index];
      if (rawType === state.lastRawType) {
        state.count++;
      } else {
        state.count = 1;
        state.lastRawType = rawType;
      }

      if (state.count >= 3 && state.type !== rawType) {
        state.type = rawType;
      }

      return {
        type: state.type,
        position: currentPos,
        velocity,
        isLeft
      };
    });

    lastLandmarks.current = trackingResults.multiHandLandmarks;
    return newGestures;
  }, [trackingResults]);

  return gestures;
};
