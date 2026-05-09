import { Point, getDistance } from "../utils/coordinates";

export const isPinching = (landmarks: Point[]): boolean => {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const distance = getDistance(thumbTip, indexTip);
  return distance < 0.04;
};
