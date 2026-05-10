"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { LoadScreen } from "./ui/LoadScreen";
import { HandTracker } from "./tracking/HandTracker";
import { LandmarkOverlay } from "./tracking/LandmarkOverlay";
import { initDefaultRoom, DEFAULT_ROOM_DIMS } from "@/lib/physics/defaultRoom";
import { ThreeScene, ThreeSceneHandle } from "./canvas/ThreeScene";
import { PhysicsWorld } from "./canvas/PhysicsWorld";
import { usePhysicsWorld } from "@/hooks/usePhysicsWorld";
import * as THREE from "three";
import { useHandTracking } from "@/hooks/useHandTracking";
import { useGestures } from "@/hooks/useGestures";
import { ClayObject } from "./canvas/ClayObject";
import { StringObject } from "./canvas/StringObject";
import { StickObject } from "./canvas/StickObject";
import { landmarkToWorld } from "@/lib/utils/coordinates";
import { ShareButton } from "./ui/ShareButton";
import { ShareSheet } from "./ui/ShareSheet";
import { captureCanvas, downloadImage, shareImage } from "@/lib/utils/snapshot";
import { exportToPDF } from "@/lib/utils/pdfExport";
import { HintSystem } from "./onboarding/HintSystem";
import { TutorialOverlay } from "./onboarding/TutorialOverlay";
import { ModeToggle, InteractionMode } from "./onboarding/ModeToggle";
import { VirtualKeyboard } from "./typing/VirtualKeyboard";
import { LetterRenderer, StyledWord } from "./typing/LetterRenderer";
import { getPrediction } from "@/lib/typing/localDictionary";
import { getContextualPrediction } from "@/lib/typing/contextPredictor";
import { VoiceListener } from "./voice/VoiceListener";
import { AudioAnalyser } from "@/lib/voice/audioAnalyser";
import { mapVolumeToTypography } from "@/lib/voice/typographyMapper";

export const VantaApp: React.FC = () => {
  const [permissionState, setPermissionState] = useState<"requesting" | "granted" | "denied" | "tracking">("requesting");
  const [status, setStatus] = useState("Requesting camera access...");
  const [error, setError] = useState<string | null>(null);
  const [showLoadScreen, setShowLoadScreen] = useState(true);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<InteractionMode>("NONE");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [styledWords, setStyledWords] = useState<StyledWord[]>([]);
  const [typedText, setTypedText] = useState("");
  const [ghostText, setGhostText] = useState("");
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  
  const roomDims = DEFAULT_ROOM_DIMS;
  const roomInitialized = useRef(false);
  const palmHoldStartTime = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastGestureTime = useRef<number>(0);
  const audioAnalyser = useRef<AudioAnalyser | null>(null);
  
  const threeRef = useRef<ThreeSceneHandle>(null);
  const { results, isTracking, handleResults, handleReady } = useHandTracking();
  const gestures = useGestures(results);
  const { world, RAPIER, isReady: physicsReady } = usePhysicsWorld();

  const [objects, setObjects] = useState<{ id: number; type: 'CLAY' | 'STRING' | 'STICK'; pos: THREE.Vector3; radius?: number; length?: number }[]>([]);
  const [drawingPoints, setDrawingPoints] = useState<THREE.Vector3[]>([]);
  const nextId = useRef(0);
  const stickRefs = useRef<Map<number, any>>(new Map());

  useEffect(() => {
    if (isTracking && permissionState !== "tracking") {
      setPermissionState("tracking");
      setTimeout(() => setShowLoadScreen(false), 600);
    }
  }, [isTracking, permissionState]);

  useEffect(() => {
    if (world && RAPIER && threeRef.current && !roomInitialized.current) {
      initDefaultRoom(world, RAPIER, threeRef.current.scene);
      roomInitialized.current = true;
    }
  }, [world, RAPIER, physicsReady]);

  // Stick Snapping
  useEffect(() => {
    if (!world || !RAPIER) return;
    const interval = setInterval(() => {
      const sticks = objects.filter(o => o.type === 'STICK');
      for (let i = 0; i < sticks.length; i++) {
        for (let j = i + 1; j < sticks.length; j++) {
          const s1 = sticks[i]; const s2 = sticks[j];
          const b1 = stickRefs.current.get(s1.id); const b2 = stickRefs.current.get(s2.id);
          if (!b1 || !b2) continue;
          const t1 = b1.translation(); const t2 = b2.translation();
          const dist = Math.sqrt((t1.x-t2.x)**2 + (t1.y-t2.y)**2 + (t1.z-t2.z)**2);
          if (dist < 0.1) {
            const jointData = RAPIER.JointData.fixed({ x: 0, y: (s1.length||0.5)/2, z: 0 }, { x: 0, y: -(s2.length||0.5)/2, z: 0 }, { x: 0, y: 0, z: 0, w: 1 });
            world.createImpulseJoint(jointData, b1, b2, true);
          }
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [objects, world, RAPIER]);

  // Audio Analyser
  useEffect(() => {
    if (activeMode === "VOICE") {
      audioAnalyser.current = new AudioAnalyser();
      audioAnalyser.current.start();
    } else {
      audioAnalyser.current?.stop();
    }
    return () => audioAnalyser.current?.stop();
  }, [activeMode]);

  // Prediction Logic
  useEffect(() => {
    if (!typedText) { setGhostText(""); return; }
    const words = typedText.split(" ");
    const lastWord = words[words.length - 1];
    if (!lastWord) { setGhostText(""); return; }
    const localPred = getPrediction(lastWord);
    setGhostText(localPred || "");
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const timeout = setTimeout(async () => {
      const groqPred = await getContextualPrediction(typedText, lastWord, abortControllerRef.current!.signal);
      if (groqPred) setGhostText(groqPred);
    }, 400);
    return () => {
      clearTimeout(timeout);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [typedText]);

  // Gesture handling
  useEffect(() => {
    if (Date.now() - lastGestureTime.current < 500) return;
    const swipeRight = gestures.find(g => g.type === "SWIPE_RIGHT");
    if (swipeRight && ghostText) {
      setTypedText(prev => prev + ghostText + " ");
      setGhostText("");
      lastGestureTime.current = Date.now();
    }
    const swipeLeft = gestures.find(g => g.type === "SWIPE_LEFT");
    if (swipeLeft && typedText) {
      setTypedText(prev => prev.slice(0, -1));
      lastGestureTime.current = Date.now();
    }
  }, [gestures, ghostText, typedText]);

  // Summon Keyboard
  useEffect(() => {
    const hasPalm = gestures.some(g => g.type === "PALM");
    if (hasPalm) {
      if (palmHoldStartTime.current === null) palmHoldStartTime.current = Date.now();
      else if (Date.now() - palmHoldStartTime.current > 1200) {
        setKeyboardVisible(prev => !prev);
        palmHoldStartTime.current = null;
      }
    } else {
      palmHoldStartTime.current = null;
    }
  }, [gestures]);

  const onCameraReady = useCallback(() => {
    setPermissionState("granted");
    setStatus("Waiting for hand detection...");
    handleReady();
  }, [handleReady]);

  const onTear = useCallback((id: number, p1: THREE.Vector3, p2: THREE.Vector3, r: number) => {
    setObjects(prev => {
      const filtered = prev.filter(o => o.id !== id);
      return [
        ...filtered,
        { id: nextId.current++, type: 'CLAY', pos: p1, radius: r },
        { id: nextId.current++, type: 'CLAY', pos: p2, radius: r }
      ];
    });
  }, []);

  const handleShareChoice = async (format: "PNG" | "PDF") => {
    if (!threeRef.current) return;
    setIsShareSheetOpen(false);
    const { renderer, scene, camera } = threeRef.current;
    const dataUrl = await captureCanvas(renderer, scene, camera);
    if (format === "PDF") await exportToPDF(dataUrl, "vanta-creation.pdf");
    else {
      const img = new Image();
      img.src = dataUrl;
      await new Promise(resolve => img.onload = resolve);
      const canvas = document.createElement("canvas");
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        ctx.font = "italic 40px 'Bebas Neue', sans-serif";
        ctx.fillStyle = "rgba(245, 245, 240, 0.4)";
        ctx.textAlign = "right";
        ctx.fillText("VANTA", canvas.width - 40, canvas.height - 40);
      }
      const watermarkedUrl = canvas.toDataURL("image/png");
      const blob = await (await fetch(watermarkedUrl)).blob();
      const shared = await shareImage(blob, "vanta-creation.png");
      if (!shared) downloadImage(watermarkedUrl, "vanta-creation.png");
    }
  };

  const handleKeyPress = (key: string) => {
    if (key === "BACKSPACE") setTypedText(prev => prev.slice(0, -1));
    else if (key === "SPACE") setTypedText(prev => prev + " ");
    else setTypedText(prev => prev + key);
  };

  const onVoiceResult = (text: string, isFinal: boolean) => {
    if (isFinal) {
      const rms = audioAnalyser.current?.getRMS() || 0;
      const settings = mapVolumeToTypography(rms);
      const newWords = text.trim().split(" ").map(w => ({
        text: w, size: settings.size, emissiveIntensity: settings.emissiveIntensity, spacing: settings.spacing, isGhost: false, offset: new THREE.Vector3(0, 0, 0)
      }));
      if (settings.size > 0.2) {
        setStyledWords(prev => prev.map(w => ({ ...w, size: w.size * 0.5, offset: new THREE.Vector3(w.offset?.x || 0 - 1, 0, 0) })));
      }
      setStyledWords(prev => [...prev, ...newWords]);
      setTypedText(prev => prev + text + " ");
    } else {
      setGhostText(text);
    }
  };

  const recognizeShape = (points: THREE.Vector3[]) => {
    if (points.length < 10) return null;
    const start = points[0]; const end = points[points.length - 1];
    const dist = start.distanceTo(end);
    if (dist < 0.15 && points.length > 20) return "CLAY";
    const totalDist = points.reduce((acc, p, i) => i === 0 ? 0 : acc + p.distanceTo(points[i-1]), 0);
    const straightness = dist / totalDist;
    if (straightness > 0.85) return "STICK";
    return "STRING";
  };

  // Drawing logic
  useEffect(() => {
    if (gestures.length === 0 || !results) return;
    const rightHandIndex = gestures.findIndex(g => !g.isLeft);
    const rightHand = gestures[rightHandIndex];
    if (rightHand && rightHand.type === "PINCH") {
      const worldPos = landmarkToWorld(results.multiHandLandmarks[rightHandIndex][8], roomDims);
      setDrawingPoints(prev => [...prev, worldPos]);
    } else if (drawingPoints.length > 0) {
      const shapeType = recognizeShape(drawingPoints);
      if (shapeType) {
        const box = new THREE.Box3().setFromPoints(drawingPoints);
        const center = new THREE.Vector3(); box.getCenter(center);
        const size = new THREE.Vector3(); box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        if (shapeType === "CLAY") setObjects(obs => [...obs, { id: nextId.current++, type: "CLAY", pos: center, radius: Math.max(maxDim/2, 0.1) }]);
        else if (shapeType === "STICK") setObjects(obs => [...obs, { id: nextId.current++, type: "STICK", pos: center, length: Math.max(maxDim, 0.2) }]);
        else setObjects(obs => [...obs, { id: nextId.current++, type: "STRING", pos: drawingPoints[0], length: Math.max(maxDim, 0.5) }]);
      }
      setDrawingPoints([]);
    }
  }, [gestures, results, roomDims, drawingPoints]);

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
    if (!(isChrome || isEdge) || !isDesktop) setIsSupported(false);
  }, []);

  const rightHandPos = results?.multiHandLandmarks?.[gestures.findIndex(g => !g.isLeft)]?.[0] || null;
  const isPinching = gestures.some(g => g.type === "PINCH");

  const getStatusLabel = () => {
    if (isTutorialOpen) return "TUTORIAL";
    if (drawingPoints.length > 0) return "DRAWING";
    if (activeMode === "TYPING") return "AIR TYPE";
    if (activeMode === "VOICE") return "LISTENING";
    return "READY";
  };

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
      <PhysicsWorld world={world} />
      
      {world && RAPIER && threeRef.current && objects.map(obj => {
        if (obj.type === 'CLAY') return (
          <ClayObject key={obj.id} id={obj.id} world={world} RAPIER={RAPIER} scene={threeRef.current!.scene} position={obj.pos} radius={obj.radius || 0.1} gestures={gestures} roomDims={roomDims} handLandmarks={results?.multiHandLandmarks || []} onTear={onTear} />
        );
        if (obj.type === 'STRING') return (
          <StringObject key={obj.id} world={world} RAPIER={RAPIER} scene={threeRef.current!.scene} startPos={obj.pos} length={obj.length || 1} />
        );
        if (obj.type === 'STICK') return (
          <StickObject key={obj.id} id={obj.id} world={world} RAPIER={RAPIER} scene={threeRef.current!.scene} position={obj.pos} length={obj.length || 0.5} onBodyInit={(b) => stickRefs.current.set(obj.id, b)} />
        );
        return null;
      })}

      {threeRef.current?.scene && (
        <>
          <VirtualKeyboard scene={threeRef.current.scene} gestures={gestures} visible={keyboardVisible} onKeyPress={handleKeyPress} roomDims={roomDims} />
          <LetterRenderer scene={threeRef.current.scene} words={styledWords} />
        </>
      )}

      <HandTracker onResults={handleResults} onReady={onCameraReady} />
      <LandmarkOverlay results={results} />
      <VoiceListener isActive={activeMode === "VOICE"} onResult={onVoiceResult} />
      
      <HintSystem handsDetected={isTracking} isPinching={isPinching} objectCount={objects.length} rightHandPos={rightHandPos ? { x: 1 - rightHandPos.x, y: rightHandPos.y } : null} />
      <TutorialOverlay 
        isOpen={isTutorialOpen} 
        onClose={() => setIsTutorialOpen(false)} 
        gestures={gestures} 
        objectCount={objects.length} 
        typedText={typedText} 
        activeMode={activeMode} 
      />
      
      <ModeToggle activeMode={activeMode} onModeChange={setActiveMode} />
      <ShareSheet isOpen={isShareSheetOpen} onClose={() => setIsShareSheetOpen(false)} onSelect={handleShareChoice} />
      
      {drawingPoints.length > 5 && rightHandPos && (
        <div className="absolute pointer-events-none" style={{ left: (1 - rightHandPos.x) * 100 + '%', top: rightHandPos.y * 100 + '%' }}>
           <div className="flex -translate-x-1/2 -translate-y-16 space-x-4 opacity-40">
             <div className="w-6 h-6 rounded-full border border-[var(--clay)]" />
             <div className="w-6 h-6 border-b-2 border-[var(--pulse)] rotate-12" />
             <div className="w-6 h-6 border-b-2 border-[var(--bone)]" />
           </div>
        </div>
      )}

      {showLoadScreen && (
        <div className={`transition-opacity duration-600 ${permissionState === "tracking" ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
          <LoadScreen status={status} />
        </div>
      )}
      <div className="absolute top-4 left-6 z-10 opacity-40 font-bebas text-lg tracking-wider pointer-events-none">VANTA</div>
      <div className="absolute top-4 right-6 z-[101] flex items-center space-x-6">
        <button onClick={() => setIsTutorialOpen(true)} className="text-[11px] font-bebas text-[var(--fog)] tracking-[0.1em] opacity-30 hover:opacity-100 transition-opacity">TUTORIAL</button>
        {permissionState === "tracking" && (
          <div className="flex items-center space-x-2 pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-[var(--pulse)] animate-pulse" />
            <span className="text-[11px] font-dm font-light tracking-widest">TRACKING</span>
          </div>
        )}
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <span className={`text-lg font-bebas tracking-[0.08em] transition-colors duration-300 ${getStatusLabel() === "READY" ? "text-[var(--fog)] opacity-60" : "text-[var(--pulse)] opacity-90"}`}>
          {getStatusLabel()}
        </span>
      </div>
      <ShareButton onClick={() => setIsShareSheetOpen(true)} visible={objects.length > 0 || styledWords.length > 0} />
      <style jsx>{`.font-bebas { font-family: var(--font-bebas-neue); } .font-dm { font-family: var(--font-dm-sans); }`}</style>
    </main>
  );
};
