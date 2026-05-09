"use client";

import React, { useRef, useEffect } from "react";

interface LandmarkOverlayProps {
  results: any;
  isPinching?: boolean;
}

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // index
  [5, 9], [9, 10], [10, 11], [11, 12], // middle
  [9, 13], [13, 14], [14, 15], [15, 16], // ring
  [13, 17], [17, 18], [18, 19], [19, 20], // pinky
  [0, 17] // palm
];

export const LandmarkOverlay: React.FC<LandmarkOverlayProps> = ({ results, isPinching }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results && results.multiHandLandmarks) {
      results.multiHandLandmarks.forEach((landmarks: any) => {
        // Draw connections
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(74, 240, 200, 0.3)"; // --pulse with 0.3 opacity
        ctx.beginPath();
        HAND_CONNECTIONS.forEach(([start, end]) => {
          const startPt = landmarks[start];
          const endPt = landmarks[end];
          ctx.moveTo((1 - startPt.x) * canvas.width, startPt.y * canvas.height);
          ctx.lineTo((1 - endPt.x) * canvas.width, endPt.y * canvas.height);
        });
        ctx.stroke();

        // Draw landmarks
        landmarks.forEach((landmark: any, index: number) => {
          ctx.beginPath();
          ctx.arc((1 - landmark.x) * canvas.width, landmark.y * canvas.height, 2, 0, 2 * Math.PI);
          
          const isPinchPoint = isPinching && (index === 4 || index === 8);
          ctx.fillStyle = isPinchPoint ? "rgba(255, 255, 255, 1)" : "rgba(74, 240, 200, 0.6)";
          ctx.fill();
        });
      });
    }
  }, [results, isPinching]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[2] pointer-events-none"
    />
  );
};
