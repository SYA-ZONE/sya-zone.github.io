/**
 * BrainBoost Utility Functions
 * Web Audio Synthesizer, Memory Index Calculator, Adaptive Difficulty, & Toasts.
 */

// Web Audio API Sound Synthesizer
class SoundSynth {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playTone(freq, type = 'sine', durationSec = 0.2, gainVal = 0.15) {
    if (!storage.get().settings.sound) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, this.ctx.currentTime + durationSec);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + durationSec);
  }

  playClick() {
    this.playTone(600, 'sine', 0.05, 0.1);
  }

  playSuccess() {
    this.playTone(523.25, 'triangle', 0.1, 0.2); // C5
    setTimeout(() => this.playTone(659.25, 'triangle', 0.1, 0.2), 100); // E5
    setTimeout(() => this.playTone(783.99, 'triangle', 0.25, 0.25), 200); // G5
  }

  playError() {
    this.playTone(220, 'sawtooth', 0.2, 0.15); // A3
    setTimeout(() => this.playTone(180, 'sawtooth', 0.3, 0.15), 150);
  }

  playSimonNote(index) {
    const freqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C4, E4, G4, C5, E5, G5
    const freq = freqs[index % freqs.length];
    this.playTone(freq, 'sine', 0.3, 0.25);
  }
}

window.soundSynth = new SoundSynth();

// Memory Index Formula (0 - 100) per PRD Section 11:
// Memory Index = Accuracy * 0.45 + SpeedScore * 0.25 + Consistency * 0.20 + DifficultyScore * 0.10
function calculateMemoryIndex(accuracy, speedSec, consistency, difficultyLevel) {
  // Speed Score: lower seconds = higher score (bounded 0 to 100)
  // Target benchmark: <= 1.5s = 100 score; 10s = 20 score
  let speedScore = Math.max(10, Math.min(100, Math.round(110 - (speedSec * 9))));
  
  let diffMultiplier = 1; // Easy = 50, Medium = 75, Hard = 90, Expert = 100
  if (difficultyLevel === 'medium') diffMultiplier = 75;
  else if (difficultyLevel === 'hard') diffMultiplier = 90;
  else if (difficultyLevel === 'expert') diffMultiplier = 100;
  else diffMultiplier = 50;

  const score = (accuracy * 0.45) + (speedScore * 0.25) + (consistency * 0.20) + (diffMultiplier * 0.10);
  return Math.min(100, Math.max(0, Math.round(score)));
}

// Adaptive Difficulty adjustment helper
function getAdaptedDifficulty(currentDiff, accuracyPercent) {
  const levels = ['easy', 'medium', 'hard', 'expert'];
  let idx = levels.indexOf(currentDiff);
  if (idx === -1) idx = 0;

  if (accuracyPercent >= 90 && idx < levels.length - 1) {
    return levels[idx + 1];
  } else if (accuracyPercent < 50 && idx > 0) {
    return levels[idx - 1];
  }
  return currentDiff;
}

// Custom Toast System
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-check-circle';
  if (type === 'warning') icon = 'fa-exclamation-triangle';
  if (type === 'error') icon = 'fa-times-circle';

  toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;
  document.body.appendChild(container);
  return container;
}

window.calculateMemoryIndex = calculateMemoryIndex;
window.getAdaptedDifficulty = getAdaptedDifficulty;
window.showToast = showToast;
