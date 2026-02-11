// Generate calling sounds using Web Audio API — soft, pleasant, premium feel

let audioCtx: AudioContext | null = null;
let ringtoneInterval: number | null = null;
let ringingInterval: number | null = null;

function getCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

/** Caller hears this while waiting — soft, gentle double-beep */
export function startRingingSound() {
  stopRingingSound();
  const play = () => {
    try {
      const ctx = getCtx();
      // Soft sine wave — pleasant "boop-boop"
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 392; // G4 — warm tone
      gain.gain.value = 0;
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime);

      // Fade in gently
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + 0.4);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);

      // Second beep
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = 440; // A4
      gain2.gain.value = 0;
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.7);
      gain2.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.75);
      gain2.gain.setValueAtTime(0.08, ctx.currentTime + 1.1);
      gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.3);

      osc.stop(ctx.currentTime + 0.7);
      osc2.stop(ctx.currentTime + 1.4);
    } catch (e) {}
  };
  play();
  ringingInterval = window.setInterval(play, 3000);
}

export function stopRingingSound() {
  if (ringingInterval) { clearInterval(ringingInterval); ringingInterval = null; }
}

/** Incoming call ringtone — melodic, pleasant chime like premium phone */
export function startRingtone() {
  stopRingtone();
  const play = () => {
    try {
      const ctx = getCtx();
      // Three-note ascending chime — C5, E5, G5
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = 0;
        osc.connect(gain).connect(ctx.destination);
        const start = ctx.currentTime + i * 0.18;
        osc.start(start);
        gain.gain.linearRampToValueAtTime(0.12, start + 0.03);
        gain.gain.setValueAtTime(0.12, start + 0.25);
        gain.gain.linearRampToValueAtTime(0, start + 0.4);
        osc.stop(start + 0.45);
      });
    } catch (e) {}
  };
  play();
  ringtoneInterval = window.setInterval(play, 2000);
}

export function stopRingtone() {
  if (ringtoneInterval) { clearInterval(ringtoneInterval); ringtoneInterval = null; }
}

/** Short notification sound — soft chime */
export function playNotificationSound() {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 587.33; // D5
    gain.gain.value = 0;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.1, ctx.currentTime + 0.12);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {}
}

/** Splash screen sound — ultra-soft, premium "bloom" */
export function playSplashSound() {
  try {
    const ctx = getCtx();
    // Soft harmonic bloom
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 440;
    gain.gain.value = 0;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.06, ctx.currentTime + 0.2);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);

    // Subtle overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 880;
    gain2.gain.value = 0;
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.05);
    gain2.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.15);
    gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    osc2.stop(ctx.currentTime + 0.45);
  } catch (e) {}
}
