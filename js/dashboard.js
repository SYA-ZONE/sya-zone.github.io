/**
 * BrainBoost Dashboard Manager
 * Controls user statistics, level progression UI, recent exercise history, and data backup.
 */

class DashboardManager {
  renderDashboard() {
    const data = storage.get();

    // Render Stats Badges & Headers
    const levelInfo = gamification.getLevelFromXP(data.stats.xp);

    const levelEl = document.getElementById('dash-user-level');
    if (levelEl) levelEl.textContent = levelInfo.level;

    const streakEl = document.getElementById('dash-streak');
    if (streakEl) streakEl.textContent = `${data.stats.streak} Days`;

    const indexEl = document.getElementById('dash-memory-index');
    if (indexEl) indexEl.textContent = data.stats.memoryIndex;

    const coinsEl = document.getElementById('dash-coins');
    if (coinsEl) coinsEl.textContent = data.stats.coins;

    const progressFill = document.getElementById('dash-xp-progress-fill');
    if (progressFill) progressFill.style.width = `${levelInfo.progressPercent}%`;

    const xpText = document.getElementById('dash-xp-text');
    if (xpText) xpText.textContent = `${levelInfo.currentLevelXP} / ${levelInfo.nextLevelXP} XP`;

    // Render Recent Activity History Table
    this.renderHistoryTable(data.history);

    // Render Badges
    this.renderBadges(data.achievements);

    // Refresh AI Coach
    aiCoach.renderCoachWidget('dashboard-coach-container');

    // Refresh Analytics Charts
    analyticsManager.renderAllCharts();
  }

  renderHistoryTable(history) {
    const tableBody = document.getElementById('recent-history-table');
    if (!tableBody) return;

    if (!history || history.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No exercises completed yet. Play your first game!</td></tr>`;
      return;
    }

    const gameNames = {
      cardMatching: 'Card Matching',
      sequenceMemory: 'Sequence Memory',
      numberRecall: 'Number Recall',
      wordRecall: 'Word Recall',
      imageMemory: 'Image Memory',
      patternMemory: 'Pattern Memory',
      faceMemory: 'Face Memory',
      emojiRecall: 'Emoji Recall',
      soundMemory: 'Sound Memory',
      storyRecall: 'Story Recall'
    };

    tableBody.innerHTML = history.slice(0, 8).map(h => `
      <tr style="border-bottom: 1px solid var(--glass-border);">
        <td style="padding:0.75rem 0; font-weight:600;">${gameNames[h.gameId] || h.gameId}</td>
        <td style="padding:0.75rem 0;"><span class="difficulty-badge">${(h.difficulty || 'easy').toUpperCase()}</span></td>
        <td style="padding:0.75rem 0; color:var(--accent-success); font-weight:700;">${h.accuracy}%</td>
        <td style="padding:0.75rem 0;">${h.speedSec}s</td>
        <td style="padding:0.75rem 0; font-weight:700; color:var(--accent-primary);">${h.memoryIndex}</td>
      </tr>
    `).join('');
  }

  renderBadges(unlockedIds = []) {
    const container = document.getElementById('dashboard-badges-container');
    if (!container) return;

    container.innerHTML = BADGES.map(b => {
      const isUnlocked = unlockedIds.includes(b.id);
      return `
        <div class="glass-card" style="text-align:center; padding:1rem; opacity:${isUnlocked ? '1' : '0.4'}; border-color:${isUnlocked ? 'var(--accent-gold)' : 'var(--glass-border)'}">
          <i class="fas ${b.icon}" style="font-size:2rem; color:${isUnlocked ? 'var(--accent-gold)' : 'var(--text-muted)'}; margin-bottom:0.5rem;"></i>
          <div style="font-size:0.9rem; font-weight:700;">${b.title}</div>
          <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.25rem;">${b.desc}</div>
        </div>
      `;
    }).join('');
  }

  exportPerformanceReportPDF() {
    window.print();
  }
}

window.dashboardManager = new DashboardManager();
