import { Point, getDistance, getPalmCenter } from "../utils/coordinates";

export const isPalmOpen = (landmarks: Point[]): boolean => {
  const palmCenter = getPalmCenter(landmarks);
  const fingerTips = [8, 12, 16, 20];
  
  return fingerTips.every(tipIndex => {
    const distance = getDistance(landmarks[tipIndex], palmCenter);
    return distance > 0.15; // Fingers extended
  });
};
