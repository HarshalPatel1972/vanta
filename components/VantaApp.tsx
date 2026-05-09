"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { LoadScreen } from "./ui/LoadScreen";
import { HandTracker } from "./tracking/HandTracker";
import { LandmarkOverlay } from "./tracking/LandmarkOverlay";
import { RoomBuilder, RoomDimensions } from "./room/RoomBuilder";
import { RoomPhysics } from "./room/RoomPhysics";
import { ThreeScene, ThreeSceneHandle } from "./canvas/ThreeScene";
import { PhysicsWorld } from "./canvas/PhysicsWorld";
import { usePhysicsWorld } from "@/hooks/usePhysicsWorld";
import * as THREE from "three";
import { useHandTracking } from "@/hooks/useHandTracking";
import { useGestures } from "@/hooks/useGestures";
import { ClayObject } from "./canvas/ClayObject";
import { landmarkToWorld } from "@/lib/utils/coordinates";
import { ShareButton } from "./ui/ShareButton";
import { downloadImage, shareImage } from "@/lib/utils/snapshot";

export const VantaApp: React.FC = () => {
  const [permissionState, setPermissionState] = useState<"requesting" | "granted" | "denied" | "tracking">("requesting");
  const [status, setStatus] = useState("Requesting camera access...");
  const [error, setError] = useState<string | null>(null);
  const [showLoadScreen, setShowLoadScreen] = useState(true);
  
  const [roomConfirmed, setRoomConfirmed] = useState(false);
  const [roomDims, setRoomDims] = useState<RoomDimensions>({ width: 5, height: 3, depth: 4 });
  
  const threeRef = useRef<ThreeSceneHandle>(null);
  const { results, isTracking, handleResults, handleReady } = useHandTracking();
  const gestures = useGestures(results);
  const { world, RAPIER, isReady: physicsReady } = usePhysicsWorld();

  const [objects, setObjects] = useState<{ id: number; pos: THREE.Vector3; radius: number }[]>([]);
  const [drawingPoints, setDrawingPoints] = useState<THREE.Vector3[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    if (isTracking && permissionState !== "tracking") {
      setPermissionState("tracking");
      setTimeout(() => setShowLoadScreen(false), 600);
    }
  }, [isTracking, permissionState]);

  const onCameraReady = useCallback(() => {
    setPermissionState("granted");
    setStatus("Waiting for hand detection...");
    handleReady();
  }, [handleReady]);

  const onRoomConfirm = useCallback((dims: RoomDimensions) => {
    setRoomDims(dims);
    setRoomConfirmed(true);
  }, []);

  const onTear = useCallback((id: number, p1: THREE.Vector3, p2: THREE.Vector3, r: number) => {
    setObjects(prev => {
      const filtered = prev.filter(o => o.id !== id);
      return [
        ...filtered,
        { id: nextId.current++, pos: p1, radius: r },
        { id: nextId.current++, pos: p2, radius: r }
      ];
    });
  }, []);

  const onShare = useCallback(async () => {
    if (!threeRef.current) return;
    const { renderer, scene, camera } = threeRef.current;
    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL("image/png");
    
    // Create watermark canvas
    const img = new Image();
    img.src = dataUrl;
    await new Promise(resolve => img.onload = resolve);

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      
      // Watermark
      ctx.font = "italic 40px 'Bebas Neue', sans-serif";
      ctx.fillStyle = "rgba(245, 245, 240, 0.4)"; // --bone with opacity
      ctx.textAlign = "right";
      ctx.fillText("VANTA", canvas.width - 40, canvas.height - 40);
    }

    const watermarkedUrl = canvas.toDataURL("image/png");
    const blob = await (await fetch(watermarkedUrl)).blob();
    const shared = await shareImage(blob, "vanta-creation.png");
    if (!shared) downloadImage(watermarkedUrl, "vanta-creation.png");
  }, []);

  // Drawing logic
  useEffect(() => {
    if (!roomConfirmed || gestures.length === 0 || !results) return;

    const rightHandIndex = gestures.findIndex(g => !g.isLeft);
    const rightHand = gestures[rightHandIndex];

    if (rightHand && rightHand.type === "PINCH") {
      const worldPos = landmarkToWorld(results.multiHandLandmarks[rightHandIndex][8], roomDims);
      
      setDrawingPoints(prev => {
        const newPoints = [...prev, worldPos];
        
        // Check for closure within the state update
        if (newPoints.length > 20) {
          const start = newPoints[0];
          const dist = worldPos.distanceTo(start);
          if (dist < 0.1) {
            const box = new THREE.Box3().setFromPoints(newPoints);
            const size = new THREE.Vector3();
            box.getSize(size);
            const radius = Math.max(size.x, size.y, size.z) / 2;
            const center = new THREE.Vector3();
            box.getCenter(center);
            
            // Note: setObjects is called asynchronously from here
            setTimeout(() => {
              setObjects(obs => [...obs, { id: nextId.current++, pos: center, radius: Math.max(radius, 0.1) }]);
              setDrawingPoints([]);
            }, 0);
            
            return prev; // Return prev to avoid adding the closure point to drawingPoints before clearing
          }
        }
        return newPoints;
      });
    } else {
      setDrawingPoints(prev => (prev.length > 0 ? [] : prev));
    }
  }, [gestures, roomConfirmed, results, roomDims]);

  // Render drawing path
  useEffect(() => {
    if (threeRef.current && drawingPoints.length > 1) {
      const { scene } = threeRef.current;
      const name = "drawing_line";
      const oldLine = scene.getObjectByName(name);
      if (oldLine) scene.remove(oldLine);
      const geo = new THREE.BufferGeometry().setFromPoints(drawingPoints);
      const mat = new THREE.LineBasicMaterial({ color: 0x4AF0C8, transparent: true, opacity: 0.5 });
      const line = new THREE.Line(geo, mat);
      line.name = name;
      scene.add(line);
      return () => { scene.remove(line); };
    }
  }, [drawingPoints]);

  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    const isEdge = /Edg/.test(navigator.userAgent);
    const isDesktop = window.innerWidth >= 1024;
    
    if (!(isChrome || isEdge) || !isDesktop) {
      setIsSupported(false);
    }
  }, []);

  if (!isSupported) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[var(--void)] text-[var(--bone)] p-8 text-center">
        <h1 className="text-6xl font-bebas mb-2 tracking-[0.12em]">VANTA</h1>
        <p className="text-fog font-dm mb-12">Shape the air.</p>
        <p className="text-ghost font-dm text-sm">Best experienced in Chrome or Edge on a laptop.</p>
        <style jsx>{`.font-bebas { font-family: var(--font-bebas-neue); } .font-dm { font-family: var(--font-dm-sans); }`}</style>
      </div>
    );
  }

  if (permissionState === "denied") {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--void)] text-[var(--bone)] p-8 text-center">
        <h1 className="text-4xl font-bebas mb-4 tracking-widest">ACCESS DENIED</h1>
        <p className="text-fog font-dm max-w-md mb-8">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 border border-muted hover:border-pulse font-bebas tracking-widest">RETRY</button>
      </div>
    );
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[var(--void)]">
      <ThreeScene ref={threeRef} />
      {roomConfirmed && (
        <>
          <PhysicsWorld world={world} />
          <RoomPhysics world={world} RAPIER={RAPIER} dims={roomDims} scene={threeRef.current?.scene || null} />
          {world && RAPIER && threeRef.current && objects.map(obj => (
            <ClayObject 
              key={obj.id} 
              id={obj.id}
              world={world} 
              RAPIER={RAPIER} 
              scene={threeRef.current!.scene} 
              position={obj.pos} 
              radius={obj.radius} 
              gestures={gestures} 
              roomDims={roomDims} 
              handLandmarks={results?.multiHandLandmarks || []} 
              onTear={onTear}
            />
          ))}
        </>
      )}
      <HandTracker onResults={handleResults} onReady={onCameraReady} />
      <LandmarkOverlay results={results} />
      {permissionState === "tracking" && !roomConfirmed && (
        <RoomBuilder gestures={gestures} scene={threeRef.current?.scene || null} onConfirm={onRoomConfirm} />
      )}
      {showLoadScreen && (
        <div className={`transition-opacity duration-600 ${permissionState === "tracking" ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
          <LoadScreen status={status} />
        </div>
      )}
      <div className="absolute top-4 left-6 z-10 opacity-40 font-bebas text-lg tracking-wider pointer-events-none">VANTA</div>
      {permissionState === "tracking" && (
        <div className="absolute top-4 right-6 z-10 flex items-center space-x-2 pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-[var(--pulse)] animate-pulse" />
          <span className="text-[11px] font-dm font-light tracking-widest">TRACKING</span>
        </div>
      )}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <span className="text-lg font-bebas text-[var(--fog)] opacity-60 tracking-[0.08em]">
          {roomConfirmed ? "VOID MODE" : "SETTING UP SPACE"}
        </span>
      </div>
      <ShareButton onClick={onShare} visible={objects.length > 0} />

      <style jsx>{`
        .font-bebas { font-family: var(--font-bebas-neue); }
        .font-dm { font-family: var(--font-dm-sans); }
      `}</style>
    </main>
  );
};
