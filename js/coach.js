/**
 * BrainBoost AI Coach Module
 * Analyzes local performance history and sub-skills to generate personalized cognitive feedback.
 */

class AICoach {
  constructor() {
    this.tips = [
      "Chunking information into groups of 3 or 4 dramatically increases short-term memory capacity.",
      "Visualizing vivid, unusual associations makes abstract words 70% easier to recall.",
      "Taking short 5-minute cognitive rest breaks between exercises consolidates memory formation.",
      "Spaced repetition is key: practicing 10 minutes daily beats 2 hours once a week.",
      "Saying numbers out loud engages auditory memory pathways alongside visual cues."
    ];
  }

  generateInsight() {
    const data = storage.get();
    const history = data.history;

    if (history.length === 0) {
      return {
        title: "Welcome to BrainBoost!",
        message: "Complete your first memory exercise to receive your personalized cognitive analysis.",
        recommendation: "Try 'Card Matching' or 'Number Recall' to start training your baseline memory index.",
        tip: this.tips[0]
      };
    }

    const recent = history.slice(0, 5);
    const avgAcc = Math.round(recent.reduce((sum, h) => sum + h.accuracy, 0) / recent.length);
    const avgSpeed = (recent.reduce((sum, h) => sum + h.speedSec, 0) / recent.length).toFixed(1);

    let title = "Cognitive Analysis & Feedback";
    let message = "";
    let recommendation = "";

    // Analyze Sub-skills
    const subSkills = data.subSkills;
    let lowestSkill = "visual";
    let lowestVal = 100;
    for (let skill in subSkills) {
      if (subSkills[skill] < lowestVal) {
        lowestVal = subSkills[skill];
        lowestSkill = skill;
      }
    }

    if (avgAcc >= 85) {
      message = `Outstanding accuracy (${avgAcc}%) over your last ${recent.length} exercises! Your working memory precision is sharp.`;
    } else if (avgAcc >= 65) {
      message = `Good steady performance (${avgAcc}% accuracy). Your reaction speed is averaging ${avgSpeed}s per item.`;
    } else {
      message = `Your recall accuracy is currently ${avgAcc}%. Focus on slowing down slightly during the observation phase to improve retention.`;
    }

    // Recommendation mapping
    const gameRecs = {
      visual: "Image Memory or Card Matching to sharpen visual icon retention.",
      working: "Number Recall to expand active working memory capacity.",
      sequence: "Sequence Memory (Simon Says) to train sequential recall.",
      spatial: "Pattern Memory grid challenges to train spatial orientation.",
      focus: "Story Recall to enhance sustained focus and comprehension.",
      speed: "Emoji Recall to practice high-speed visual recognition."
    };

    recommendation = `Targeted Focus: We recommend practicing ${gameRecs[lowestSkill] || 'daily exercises'}`;

    const randomTip = this.tips[Math.floor(Math.random() * this.tips.length)];

    return {
      title,
      message,
      recommendation,
      tip: randomTip,
      subSkillFocus: lowestSkill
    };
  }

  renderCoachWidget(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const insight = this.generateInsight();

    container.innerHTML = `
      <div class="coach-card glass-card">
        <div class="coach-header">
          <div class="coach-avatar"><i class="fas fa-brain"></i></div>
          <div>
            <h3 style="margin:0;">AI Memory Coach</h3>
            <span style="font-size:0.85rem; color:var(--text-secondary);">Personalized Insights</span>
          </div>
        </div>
        <p style="font-size:0.95rem; margin-bottom:0.75rem;"><strong>${insight.message}</strong></p>
        <p style="font-size:0.9rem; color:var(--accent-tertiary); margin-bottom:0.75rem;">
          <i class="fas fa-lightbulb"></i> ${insight.recommendation}
        </p>
        <div style="background:rgba(255,255,255,0.05); padding:0.75rem; border-radius:var(--radius-md); font-size:0.85rem; color:var(--text-secondary);">
          <i class="fas fa-quote-left" style="color:var(--accent-primary);"></i> ${insight.tip}
        </div>
      </div>
    `;
  }
}

window.aiCoach = new AICoach();
