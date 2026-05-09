"use client";

import React, { useEffect, useRef, useCallback } from "react";

interface HandTrackerProps {
  onResults: (results: any) => void;
  onReady: () => void;
}

export const HandTracker: React.FC<HandTrackerProps> = ({ onResults, onReady }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const onResultsRef = useRef(onResults);
  const onReadyRef = useRef(onReady);
  const isInitializing = useRef(false);

  useEffect(() => {
    onResultsRef.current = onResults;
    onReadyRef.current = onReady;
  }, [onResults, onReady]);

  const initMediaPipe = useCallback(async () => {
    if (typeof window === "undefined" || !videoRef.current || isInitializing.current) return;
    if (handsRef.current) return; // Already initialized

    isInitializing.current = true;

    // @ts-ignore
    const Hands = window.Hands;
    // @ts-ignore
    const Camera = window.Camera;

    if (!Hands || !Camera) {
      console.error("MediaPipe Hands or Camera not loaded from CDN");
      isInitializing.current = false;
      return;
    }

    try {
      handsRef.current = new Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      handsRef.current.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.6,
      });

      handsRef.current.onResults((results: any) => {
        onResultsRef.current(results);
      });

      cameraRef.current = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && handsRef.current) {
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width: 1280,
        height: 720,
      });

      await cameraRef.current.start();
      onReadyRef.current();
    } catch (err) {
      console.error("Failed to initialize MediaPipe:", err);
    } finally {
      isInitializing.current = false;
    }
  }, []); // No dependencies

  useEffect(() => {
    // Wait for CDN scripts to be ready
    const checkMediaPipe = setInterval(() => {
      // @ts-ignore
      if (window.Hands && window.Camera) {
        clearInterval(checkMediaPipe);
        initMediaPipe();
      }
    }, 100);

    return () => {
      clearInterval(checkMediaPipe);
      if (cameraRef.current) cameraRef.current.stop();
      if (handsRef.current) handsRef.current.close();
      cameraRef.current = null;
      handsRef.current = null;
    };
  }, [initMediaPipe]);

  return (
    <video
      ref={videoRef}
      className="fixed inset-0 w-full h-screen object-cover pointer-events-none z-[1] opacity-[0.15]"
      style={{ 
        mixBlendMode: "screen",
        transform: "scaleX(-1)"
      }}
      playsInline
      muted
    />
  );
};
