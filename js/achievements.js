/**
 * BrainBoost Gamification System
 * XP, Levels, Achievements, Daily Streak, Mystery Box & Spin Wheel.
 */

const BADGES = [
  { id: 'first_game', title: 'First Steps', desc: 'Completed your 1st memory exercise', icon: 'fa-shoe-prints' },
  { id: 'games_10', title: 'Getting Started', desc: 'Completed 10 memory exercises', icon: 'fa-play' },
  { id: 'games_25', title: 'Dedicated Mind', desc: 'Completed 25 total memory exercises', icon: 'fa-dumbbell' },
  { id: 'streak_3', title: 'Momentum', desc: 'Maintained a 3-day training streak', icon: 'fa-fire' },
  { id: 'streak_7', title: 'Week Warrior', desc: 'Maintained a 7-day training streak', icon: 'fa-calendar-week' },
  { id: 'accuracy_90', title: 'Precision Pro', desc: 'Maintained 90%+ accuracy across 5 recent games', icon: 'fa-bullseye' },
  { id: 'coins_500', title: 'Coin Collector', desc: 'Accumulated 500 Brain Coins', icon: 'fa-coins' },
  { id: 'xp_1000', title: 'Rising Scholar', desc: 'Earned 1000 total XP', icon: 'fa-star' },
  { id: 'level_5', title: 'Level 5', desc: 'Reached Level 5', icon: 'fa-medal' },
  { id: 'memory_80', title: 'Sharp Memory', desc: 'Reached Memory Index 80+', icon: 'fa-brain' },
  { id: 'daily_spin_1', title: 'Lucky Spin', desc: 'Claimed your first daily spin reward', icon: 'fa-dice' },
  { id: 'perfect_score', title: 'Flawless Recall', desc: 'Achieved 100% accuracy on a Hard/Expert game', icon: 'fa-crown' },
  { id: 'fast_thinker', title: 'Lightning Fast', desc: 'Average reaction speed under 1.5 seconds', icon: 'fa-bolt' },
  { id: 'brain_master', title: 'Brain Master', desc: 'Reached Level 10 & Memory Index 85+', icon: 'fa-medal' }
];

class GamificationManager {
  constructor() {
    this.badges = BADGES;
  }

  // Level Formula: Level 1 = 0 XP, Level 2 = 150 XP, Level 3 = 350 XP, Level 4 = 600 XP...
  getLevelFromXP(xp) {
    let level = 1;
    let requiredXP = 0;
    while (xp >= requiredXP + (level * 150)) {
      requiredXP += level * 150;
      level++;
    }
    const currentLevelXP = xp - requiredXP;
    const nextLevelXP = level * 150;
    const progressPercent = Math.min(100, Math.round((currentLevelXP / nextLevelXP) * 100));

    return { level, currentLevelXP, nextLevelXP, progressPercent };
  }

  awardXP(amount) {
    const data = storage.get();
    const oldLevelInfo = this.getLevelFromXP(data.stats.xp);
    
    data.stats.xp += amount;
    data.stats.coins += Math.round(amount / 5);

    const newLevelInfo = this.getLevelFromXP(data.stats.xp);
    data.stats.level = newLevelInfo.level;
    storage.saveState();

    // Level Up Trigger
    if (newLevelInfo.level > oldLevelInfo.level) {
      soundSynth.playSuccess();
      showToast(`🎉 Level Up! You reached Level ${newLevelInfo.level}!`, 'success');
      if (typeof confetti === 'function') {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }
  }

  checkStreak() {
    const data = storage.get();
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastVisit = data.stats.lastVisitDate;

    if (!lastVisit) {
      data.stats.streak = 1;
      data.stats.longestStreak = 1;
      data.stats.lastVisitDate = todayStr;
    } else if (lastVisit !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      if (lastVisit === yesterdayStr) {
        data.stats.streak += 1;
        if (data.stats.streak > data.stats.longestStreak) {
          data.stats.longestStreak = data.stats.streak;
        }
      } else {
        data.stats.streak = 1; // Streak reset if missed a day
      }
      data.stats.lastVisitDate = todayStr;
    }
    storage.saveState();
  }

  checkBadgeUnlocks(lastGameResult = null) {
    const data = storage.get();
    const unlocked = new Set(data.achievements || []);
    let newlyUnlocked = [];

    // Check conditions
    if (data.stats.totalGamesPlayed >= 1 && !unlocked.has('first_game')) {
      newlyUnlocked.push('first_game');
    }
    if (data.stats.totalGamesPlayed >= 10 && !unlocked.has('games_10')) {
      newlyUnlocked.push('games_10');
    }
    if (data.stats.totalGamesPlayed >= 25 && !unlocked.has('games_25')) {
      newlyUnlocked.push('games_25');
    }
    if (data.stats.streak >= 3 && !unlocked.has('streak_3')) {
      newlyUnlocked.push('streak_3');
    }
    if (data.stats.streak >= 7 && !unlocked.has('streak_7')) {
      newlyUnlocked.push('streak_7');
    }
    const recentGames = (data.history || []).slice(0, 5);
    if (recentGames.length >= 5) {
      const avgAccuracy = Math.round(recentGames.reduce((sum, game) => sum + (game.accuracy || 0), 0) / recentGames.length);
      if (avgAccuracy >= 90 && !unlocked.has('accuracy_90')) {
        newlyUnlocked.push('accuracy_90');
      }
    }
    if (data.stats.coins >= 500 && !unlocked.has('coins_500')) {
      newlyUnlocked.push('coins_500');
    }
    if (data.stats.xp >= 1000 && !unlocked.has('xp_1000')) {
      newlyUnlocked.push('xp_1000');
    }
    if (data.stats.level >= 5 && !unlocked.has('level_5')) {
      newlyUnlocked.push('level_5');
    }
    if (data.stats.memoryIndex >= 80 && !unlocked.has('memory_80')) {
      newlyUnlocked.push('memory_80');
    }
    if (data.stats.lastSpinDate && !unlocked.has('daily_spin_1')) {
      newlyUnlocked.push('daily_spin_1');
    }
    if (lastGameResult && lastGameResult.accuracy === 100 && (lastGameResult.difficulty === 'hard' || lastGameResult.difficulty === 'expert')) {
      if (!unlocked.has('perfect_score')) newlyUnlocked.push('perfect_score');
    }
    if (lastGameResult && lastGameResult.speedSec <= 1.5 && !unlocked.has('fast_thinker')) {
      newlyUnlocked.push('fast_thinker');
    }
    if (data.stats.level >= 10 && data.stats.memoryIndex >= 85 && !unlocked.has('brain_master')) {
      newlyUnlocked.push('brain_master');
    }

    if (newlyUnlocked.length > 0) {
      newlyUnlocked.forEach(badgeId => {
        data.achievements.push(badgeId);
        const b = BADGES.find(item => item.id === badgeId);
        if (b) {
          showToast(`🏆 Badge Unlocked: ${b.title}!`, 'success');
        }
      });
      storage.saveState();
      soundSynth.playSuccess();
    }
  }

  spinDailyWheel() {
    const todayStr = new Date().toISOString().slice(0, 10);
    const data = storage.get();

    if (data.stats.lastSpinDate === todayStr) {
      return { prize: 0, alreadySpun: true };
    }

    const prizes = [50, 100, 150, 200, 300, 500]; // Coin prizes
    const prize = prizes[Math.floor(Math.random() * prizes.length)];
    data.stats.coins += prize;
    data.stats.lastSpinDate = todayStr;
    data.stats.lastSpinPrize = prize;
    storage.saveState();
    this.checkBadgeUnlocks();
    return { prize, alreadySpun: false };
  }
}

window.gamification = new GamificationManager();
