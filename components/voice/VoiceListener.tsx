"use client";

import React, { useEffect, useRef } from "react";
import { createSpeechRecognition } from "@/lib/voice/speechRecognition";

interface VoiceListenerProps {
  isActive: boolean;
  onResult: (text: string, isFinal: boolean) => void;
}

export const VoiceListener: React.FC<VoiceListenerProps> = ({ isActive, onResult }) => {
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isActive) {
      if (!recognitionRef.current) {
        recognitionRef.current = createSpeechRecognition();
        if (recognitionRef.current) {
          recognitionRef.current.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }

            if (finalTranscript) onResult(finalTranscript, true);
            if (interimTranscript) onResult(interimTranscript, false);
          };
          
          recognitionRef.current.onerror = (err: any) => {
            console.error("Speech Recognition Error:", err);
          };

          recognitionRef.current.onend = () => {
            if (isActive) recognitionRef.current.start(); // Keep listening
          };
        }
      }
      
      try {
        recognitionRef.current?.start();
      } catch (e) {
        // Already started
      }
    } else {
      recognitionRef.current?.stop();
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, [isActive]);

  return null;
};
