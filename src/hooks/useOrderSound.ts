"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type ToneType = "beep" | "chime" | "pulse";

interface UseOrderSoundReturn {
  playBeep: (frequency?: number, duration?: number) => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  volume: number;
  setVolume: (v: number) => void;
  toneType: ToneType;
  setToneType: (t: ToneType) => void;
}

export function useOrderSound(): UseOrderSoundReturn {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolumeState] = useState(0.2);
  const [toneType, setToneTypeState] = useState<ToneType>("beep");
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Sync state values to refs for stable reference of playBeep hook
  const soundEnabledRef = useRef(soundEnabled);
  const volumeRef = useRef(volume);
  const toneTypeRef = useRef(toneType);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    toneTypeRef.current = toneType;
  }, [toneType]);

  // Load preferences on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedVolume = localStorage.getItem("oasis_sound_volume");
    if (storedVolume !== null) {
      const parsed = parseFloat(storedVolume);
      setVolumeState(parsed);
      volumeRef.current = parsed;
    }
    const storedTone = localStorage.getItem("oasis_sound_tone");
    if (storedTone !== null) {
      const parsed = storedTone as ToneType;
      setToneTypeState(parsed);
      toneTypeRef.current = parsed;
    }
    const storedEnabled = localStorage.getItem("oasis_sound_enabled");
    if (storedEnabled !== null) {
      const parsed = storedEnabled === "true";
      setSoundEnabled(parsed);
      soundEnabledRef.current = parsed;
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    const vol = Math.max(0, Math.min(1, v));
    setVolumeState(vol);
    volumeRef.current = vol;
    localStorage.setItem("oasis_sound_volume", vol.toString());
  }, []);

  const setToneType = useCallback((t: ToneType) => {
    setToneTypeState(t);
    toneTypeRef.current = t;
    localStorage.setItem("oasis_sound_tone", t);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundEnabledRef.current = next;
      localStorage.setItem("oasis_sound_enabled", next.toString());
      return next;
    });
  }, []);

  const playBeep = useCallback(
    (frequency: number = 880, duration: number = 0.4) => {
      if (!soundEnabledRef.current) return;
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") ctx.resume();

        const playTone = (freq: number, start: number, dur: number, oscType: OscillatorType = "sine") => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = oscType;
          
          gain.gain.setValueAtTime(volumeRef.current, ctx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + start + dur
          );
          
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + dur);
        };

        if (toneTypeRef.current === "chime") {
          // Double note chime
          playTone(frequency, 0, duration / 2);
          playTone(frequency * 1.25, duration / 4, duration / 2);
        } else if (toneTypeRef.current === "pulse") {
          // 3 fast pulses
          playTone(frequency, 0, 0.08, "triangle");
          playTone(frequency, 0.12, 0.08, "triangle");
          playTone(frequency, 0.24, 0.08, "triangle");
        } else {
          // Standard beep
          playTone(frequency, 0, duration);
        }
      } catch {
        // Audio not available
      }
    },
    []
  );

  // Resume AudioContext on first user gesture (browser autoplay policy)
  useEffect(() => {
    const resume = () => {
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      }
    };
    document.addEventListener("click", resume);
    document.addEventListener("touchstart", resume);
    document.addEventListener("keydown", resume);
    return () => {
      document.removeEventListener("click", resume);
      document.removeEventListener("touchstart", resume);
      document.removeEventListener("keydown", resume);
    };
  }, []);

  // Cleanup AudioContext on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return { playBeep, soundEnabled, toggleSound, volume, setVolume, toneType, setToneType };
}










