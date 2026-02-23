import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Web Audio API sound system — pure oscillators, no audio files required.
 */
export default function useSoundSystem() {
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const audioCtxRef = useRef(null);

  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    setIsReady(true);
  }, []);

  useEffect(() => {
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });
    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
  }, [initAudio]);

  const playNote = useCallback((freq, duration, volume, startDelay = 0) => {
    if (isMuted || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = ctx.currentTime + startDelay;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.01);
    gain.gain.setValueAtTime(volume, t + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.01);
  }, [isMuted]);

  const playThreat = useCallback(() => {
    playNote(520, 0.28, 0.35);
    playNote(640, 0.18, 0.28, 0.22);
  }, [playNote]);

  const playConnect = useCallback(() => {
    if (!audioCtxRef.current || isMuted) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(350, t);
    osc.frequency.linearRampToValueAtTime(700, t + 0.35);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.05);
    gain.gain.linearRampToValueAtTime(0, t + 0.35);
    osc.start(t);
    osc.stop(t + 0.36);
  }, [isMuted]);

  const playDisconnect = useCallback(() => {
    if (!audioCtxRef.current || isMuted) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.linearRampToValueAtTime(200, t + 0.4);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.05);
    gain.gain.linearRampToValueAtTime(0, t + 0.4);
    osc.start(t);
    osc.stop(t + 0.41);
  }, [isMuted]);

  const playClear = useCallback(() => {
    playNote(660, 0.09, 0.12);
  }, [playNote]);

  const playMultiZone = useCallback(() => {
    playNote(440, 0.5, 0.14);
    playNote(550, 0.5, 0.14, 0.1);
    playNote(660, 0.5, 0.14, 0.2);
  }, [playNote]);

  const toggleMute = useCallback(() => {
    setIsMuted(m => !m);
  }, []);

  return {
    playThreat,
    playConnect,
    playDisconnect,
    playClear,
    playMultiZone,
    isMuted,
    toggleMute,
    isReady,
  };
}
