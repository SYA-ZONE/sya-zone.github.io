/**
 * BrainBoost LocalStorage Manager
 * Handles local state persistence, export/import, default schema initialization.
 */

const STORAGE_KEY = 'brainboost';

const DEFAULT_STATE = {
  profile: {
    username: "Brain Athlete",
    joinedDate: new Date().toISOString()
  },
  stats: {
    xp: 0,
    level: 1,
    memoryIndex: 50,
    streak: 0,
    longestStreak: 0,
    lastVisitDate: null,
    totalGamesPlayed: 0,
    coins: 100,
    trainingMinutes: 0,
    lastSpinDate: null,
    lastSpinPrize: 0
  },
  games: {
    cardMatching: { played: 0, bestScore: 0, avgAccuracy: 0 },
    sequenceMemory: { played: 0, bestScore: 0, avgAccuracy: 0 },
    numberRecall: { played: 0, bestScore: 0, avgAccuracy: 0 },
    wordRecall: { played: 0, bestScore: 0, avgAccuracy: 0 },
    imageMemory: { played: 0, bestScore: 0, avgAccuracy: 0 },
    patternMemory: { played: 0, bestScore: 0, avgAccuracy: 0 },
    faceMemory: { played: 0, bestScore: 0, avgAccuracy: 0 },
    emojiRecall: { played: 0, bestScore: 0, avgAccuracy: 0 },
    soundMemory: { played: 0, bestScore: 0, avgAccuracy: 0 },
    storyRecall: { played: 0, bestScore: 0, avgAccuracy: 0 }
  },
  achievements: [], // Array of unlocked badge IDs
  history: [], // Array of game attempt objects { id, gameId, score, accuracy, speedSec, difficulty, timestamp }
  subSkills: {
    visual: 50,
    working: 50,
    sequence: 50,
    spatial: 50,
    focus: 50,
    speed: 50
  },
  settings: {
    theme: "dark",
    sound: true,
    soundVolume: 0.5,
    autoDifficulty: true
  }
};

class StorageManager {
  constructor() {
    this.state = this.loadState();
  }

  mergeState(defaultState, incomingState) {
    if (Array.isArray(defaultState)) return defaultState;
    const merged = { ...defaultState };

    Object.entries(incomingState || {}).forEach(([key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value) && typeof merged[key] === 'object' && !Array.isArray(merged[key])) {
        merged[key] = this.mergeState(merged[key], value);
      } else {
        merged[key] = value;
      }
    });

    return merged;
  }

  loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return this.saveState(DEFAULT_STATE);
      }
      const parsed = JSON.parse(raw);
      return this.mergeState(DEFAULT_STATE, parsed);
    } catch (e) {
      console.error('Failed to load local storage state:', e);
      return DEFAULT_STATE;
    }
  }

  saveState(stateToSave = this.state) {
    try {
      this.state = stateToSave;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      if (window.driveManager) window.driveManager.autoSync();
      return this.state;
    } catch (e) {
      console.error('Failed to save to local storage:', e);
      return this.state;
    }
  }

  get() {
    return this.state;
  }

  update(pathStr, value) {
    const keys = pathStr.split('.');
    let current = this.state;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    this.saveState();
  }

  addGameHistory(gameRecord) {
    this.state.history.unshift(gameRecord);
    if (this.state.history.length > 100) {
      this.state.history.pop(); // keep last 100 entries
    }

    // Update game specific statistics
    const gKey = gameRecord.gameId;
    if (this.state.games[gKey]) {
      const g = this.state.games[gKey];
      g.played += 1;
      if (gameRecord.score > g.bestScore) g.bestScore = gameRecord.score;
      g.avgAccuracy = Math.round((g.avgAccuracy * (g.played - 1) + gameRecord.accuracy) / g.played);
    }
    this.state.stats.totalGamesPlayed += 1;
    this.saveState();
  }

  exportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `brainboost_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.stats && parsed.games) {
        this.saveState(this.mergeState(DEFAULT_STATE, parsed));
        return true;
      }
    } catch (e) {
      console.error('Invalid JSON import:', e);
    }
    return false;
  }

  resetAllData() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.saveState(DEFAULT_STATE);
  }
}

window.storage = new StorageManager();
