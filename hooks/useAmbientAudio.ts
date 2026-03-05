import { useRef, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

function buildWebAudio(soundId: string): (() => void) | null {
  const ACtx = (window as any).AudioContext ?? (window as any).webkitAudioContext;
  if (!ACtx) return null;

  const ctx = new ACtx() as AudioContext;
  const master = ctx.createGain();
  master.connect(ctx.destination);

  const nodes: { stop?: () => void; disconnect: () => void }[] = [];

  const mkNoise = (type: 'white' | 'pink' | 'brown') => {
    const rate = ctx.sampleRate;
    const buf = ctx.createBuffer(1, 2 * rate, rate);
    const d = buf.getChannelData(0);
    if (type === 'white') {
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } else if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < d.length; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520; b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    } else {
      let last = 0;
      for (let i = 0; i < d.length; i++) {
        const w = Math.random() * 2 - 1;
        d[i] = (last + 0.02 * w) / 1.02; last = d[i]; d[i] *= 3.5;
      }
    }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    return src;
  };

  const addOsc = (freq: number, type: OscillatorType = 'sine', gainVal = 0.5) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    g.gain.value = gainVal;
    osc.connect(g); g.connect(master);
    osc.start();
    nodes.push({ stop: () => osc.stop(), disconnect: () => { osc.disconnect(); g.disconnect(); } });
    return osc;
  };

  const addNoise = (type: 'white' | 'pink' | 'brown', lpFreq: number, gainVal: number) => {
    const src = mkNoise(type);
    const flt = ctx.createBiquadFilter();
    const g = ctx.createGain();
    flt.type = 'lowpass'; flt.frequency.value = lpFreq; flt.Q.value = 0.5;
    g.gain.value = gainVal;
    src.connect(flt); flt.connect(g); g.connect(master);
    src.start();
    nodes.push({ stop: () => src.stop(), disconnect: () => { src.disconnect(); flt.disconnect(); g.disconnect(); } });
    return { src, flt };
  };

  const addLFO = (target: AudioParam, freq: number, depth: number) => {
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    lfo.frequency.value = freq; lg.gain.value = depth;
    lfo.connect(lg); lg.connect(target); lfo.start();
    nodes.push({ stop: () => lfo.stop(), disconnect: () => { lfo.disconnect(); lg.disconnect(); } });
  };

  master.gain.value = 0;
  master.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5);

  switch (soundId) {
    case 'rain': {
      const { flt } = addNoise('pink', 900, 0.35);
      addLFO(flt.frequency, 0.05, 150);
      addNoise('white', 5000, 0.06);
      break;
    }
    case 'ocean': {
      const { flt } = addNoise('brown', 500, 0.3);
      addLFO(flt.frequency, 0.12, 300);
      addNoise('pink', 200, 0.08);
      break;
    }
    case 'white-noise':
      addNoise('white', 8000, 0.22);
      break;
    case 'forest': {
      addNoise('pink', 1800, 0.22);
      addNoise('pink', 4000, 0.07);
      break;
    }
    case 'brown-noise':
      addNoise('brown', 280, 0.38);
      break;
    case 'bowls': {
      addOsc(432, 'sine', 0.18);
      addOsc(864, 'sine', 0.07);
      addOsc(648, 'sine', 0.05);
      addLFO(master.gain, 0.07, 0.06);
      break;
    }
    case 'delta': {
      addOsc(200, 'sine', 0.1);
      addOsc(202.5, 'sine', 0.1);
      addNoise('brown', 200, 0.04);
      break;
    }
    case 'focus': {
      addNoise('pink', 3500, 0.14);
      addOsc(40, 'sine', 0.04);
      addOsc(528, 'sine', 0.04);
      break;
    }
    case 'morning': {
      addOsc(528, 'sine', 0.1);
      addOsc(1056, 'sine', 0.04);
      addNoise('pink', 2000, 0.06);
      addLFO(master.gain, 0.06, 0.07);
      break;
    }
    case 'rest': {
      const { flt } = addNoise('brown', 320, 0.24);
      addLFO(flt.frequency, 0.08, 80);
      addOsc(174, 'sine', 0.06);
      break;
    }
    case 'anxiety': {
      addNoise('pink', 600, 0.14);
      addOsc(396, 'sine', 0.07);
      addLFO(master.gain, 0.05, 0.05);
      break;
    }
    case 'creative': {
      addOsc(432, 'sine', 0.1);
      addOsc(648, 'sine', 0.05);
      addNoise('pink', 2500, 0.08);
      break;
    }
    case 'golden': {
      const { flt } = addNoise('brown', 700, 0.2);
      addLFO(flt.frequency, 0.06, 120);
      addOsc(528, 'sine', 0.06);
      addLFO(master.gain, 0.04, 0.06);
      break;
    }
    default:
      addNoise('pink', 1000, 0.2);
  }

  return () => {
    try {
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      setTimeout(() => {
        nodes.forEach(n => { try { n.stop?.(); n.disconnect(); } catch (_) {} });
        try { ctx.close(); } catch (_) {}
      }, 900);
    } catch (_) {}
  };
}

export function useAmbientAudio() {
  const cleanupRef = useRef<(() => void) | null>(null);

  const play = useCallback((soundId: string) => {
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
    if (Platform.OS === 'web') {
      cleanupRef.current = buildWebAudio(soundId);
    }
  }, []);

  const stop = useCallback(() => {
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
  }, []);

  useEffect(() => () => { cleanupRef.current?.(); }, []);

  return { play, stop };
}
