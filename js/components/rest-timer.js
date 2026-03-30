// js/components/rest-timer.js
// Renders a full-screen overlay countdown with SVG ring, vibrate, beep.

import { t } from '../app.js';

const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

let timerInterval = null;

export function startRestTimer(seconds, onDone) {
  stopRestTimer(); // clear any existing

  const overlay = document.createElement('div');
  overlay.id = 'rest-timer-overlay';
  overlay.className = 'rest-timer-overlay';
  overlay.innerHTML = `
    <div style="text-align:center">
      <div class="rest-timer-label" style="margin-bottom:12px">${t('workout.restTimer')}</div>
      <div class="rest-timer-ring">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx="90" cy="90" r="${RADIUS}" fill="none" stroke="var(--surface2)" stroke-width="10"/>
          <circle id="timer-arc" cx="90" cy="90" r="${RADIUS}" fill="none"
            stroke="var(--accent)" stroke-width="10"
            stroke-dasharray="${CIRCUMFERENCE}"
            stroke-dashoffset="0"
            stroke-linecap="round"/>
        </svg>
        <div class="rest-timer-display">
          <div class="rest-timer-seconds" id="timer-count">${seconds}</div>
          <div class="rest-timer-label">sec</div>
        </div>
      </div>
      <button class="btn btn-secondary" id="skip-rest" style="margin-top:24px;width:160px">
        ${t('workout.skipRest')}
      </button>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('skip-rest').addEventListener('click', () => {
    stopRestTimer();
    onDone?.();
  });

  const arc = document.getElementById('timer-arc');
  const countEl = document.getElementById('timer-count');
  let remaining = seconds;
  const total = seconds;

  timerInterval = setInterval(() => {
    remaining--;
    countEl.textContent = remaining;
    const progress = remaining / total;
    arc.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);

    if (remaining <= 0) {
      stopRestTimer();
      playBeep();
      vibrate();
      onDone?.();
    }
  }, 1000);
}

export function stopRestTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  document.getElementById('rest-timer-overlay')?.remove();
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
    setTimeout(() => ctx.close(), 1000);
  } catch (e) { console.warn('Audio not available', e); }
}

function vibrate() {
  try { navigator.vibrate?.([200, 100, 200]); } catch {}
}
