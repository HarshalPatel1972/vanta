"use client";

import { useState, useCallback, useMemo } from "react";

export interface TrackingResults {
  multiHandLandmarks: any[];
  multiHandedness: any[];
}

export const useHandTracking = () => {
  const [results, setResults] = useState<TrackingResults | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const handleResults = useCallback((newResults: TrackingResults) => {
    setResults(newResults);
    const hasHands = newResults.multiHandLandmarks.length > 0;
    setIsTracking(prev => (prev !== hasHands ? hasHands : prev));
  }, []);

  const handleReady = useCallback(() => {
    console.log("Hand tracking ready");
  }, []);

  return useMemo(() => ({
    results,
    isTracking,
    handleResults,
    handleReady,
  }), [results, isTracking, handleResults, handleReady]);
};
