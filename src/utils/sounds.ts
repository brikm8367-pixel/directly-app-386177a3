// Generate calling sounds using Web Audio API — no external files needed

let audioCtx: AudioContext | null = null;
let ringtoneInterval: number | null = null;
let ringingInterval: number | null = null;

function getCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

/** Caller hears this while waiting for answer — classic "ring-ring" */
export function startRingingSound() {
  stopRingingSound();
  const play = () => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 440;
    gain.gain.value = 0.15;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.setValueAtTime(480, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.15, ctx.currentTime + 1);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
    osc.stop(ctx.currentTime + 1.2);
  };
  play();
  ringingInterval = window.setInterval(play, 3000);
}

export function stopRingingSound() {
  if (ringingInterval) { clearInterval(ringingInterval); ringingInterval = null; }
}

/** Incoming call ringtone — louder, more urgent */
export function startRingtone() {
  stopRingtone();
  const play = () => {
    const ctx = getCtx();
    // Two-tone ring like a phone
    [523.25, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0.25;
      osc.connect(gain).connect(ctx.destination);
      const start = ctx.currentTime + i * 0.15;
      osc.start(start);
      gain.gain.setValueAtTime(0.25, start + 0.4);
      gain.gain.linearRampToValueAtTime(0, start + 0.5);
      osc.stop(start + 0.5);
    });
  };
  play();
  ringtoneInterval = window.setInterval(play, 1500);
}

export function stopRingtone() {
  if (ringtoneInterval) { clearInterval(ringtoneInterval); ringtoneInterval = null; }
}

/** Short notification sound */
export function playNotificationSound() {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 800;
    gain.gain.value = 0.2;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.15);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Ignore — may fail if no user interaction yet
  }
}
