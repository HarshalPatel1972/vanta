import { Point, getDistance, getPalmCenter } from "../utils/coordinates";

export const isGripping = (landmarks: Point[]): boolean => {
  const palmCenter = getPalmCenter(landmarks);
  const fingerTips = [8, 12, 16, 20]; // excluding thumb for tighter grip check, or including all?
  // Prompt says "All finger tips"
  const allTips = [4, 8, 12, 16, 20];
  
  return allTips.every(tipIndex => {
    const distance = getDistance(landmarks[tipIndex], palmCenter);
    return distance < 0.12; // Adjusted from 0.08 for better reliability with different hand sizes
  });
};
