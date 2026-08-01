/**
 * BrainBoost Analytics & Charts Module
 * Chart.js integrations for Memory Index history, accuracy trends, reaction times, and Cognitive Radar.
 */

class AnalyticsManager {
  constructor() {
    this.charts = {};
  }

  renderAllCharts() {
    const data = storage.get();
    const history = data.history || [];

    this.renderMemoryIndexChart(history);
    this.renderAccuracyChart(history);
    this.renderCognitiveRadar(data.subSkills);
  }

  renderMemoryIndexChart(history) {
    const canvas = document.getElementById('chart-memory-index');
    if (!canvas) return;

    if (this.charts.memoryIndex) this.charts.memoryIndex.destroy();

    const labels = history.slice(0, 10).reverse().map((h, i) => `Ex ${i + 1}`);
    const scores = history.slice(0, 10).reverse().map(h => h.memoryIndex || 50);

    const ctx = canvas.getContext('2d');
    this.charts.memoryIndex = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.length ? labels : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'],
        datasets: [{
          label: 'Memory Index (0-100)',
          data: scores.length ? scores : [50, 58, 65, 72, 80],
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { min: 0, max: 100, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  renderAccuracyChart(history) {
    const canvas = document.getElementById('chart-accuracy-speed');
    if (!canvas) return;

    if (this.charts.accuracy) this.charts.accuracy.destroy();

    const labels = history.slice(0, 7).reverse().map((_, i) => `T-${7 - i}`);
    const accData = history.slice(0, 7).reverse().map(h => h.accuracy);

    const ctx = canvas.getContext('2d');
    this.charts.accuracy = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['T-5', 'T-4', 'T-3', 'T-2', 'T-1'],
        datasets: [{
          label: 'Accuracy %',
          data: accData.length ? accData : [75, 80, 90, 85, 95],
          backgroundColor: '#10b981',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { min: 0, max: 100, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  renderCognitiveRadar(subSkills) {
    const canvas = document.getElementById('chart-cognitive-radar');
    if (!canvas) return;

    if (this.charts.radar) this.charts.radar.destroy();

    const ctx = canvas.getContext('2d');
    this.charts.radar = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Visual', 'Working Memory', 'Sequential', 'Spatial', 'Focus', 'Speed'],
        datasets: [{
          label: 'Skill Proficiency',
          data: [
            subSkills.visual || 65,
            subSkills.working || 70,
            subSkills.sequence || 60,
            subSkills.spatial || 75,
            subSkills.focus || 80,
            subSkills.speed || 68
          ],
          backgroundColor: 'rgba(236, 72, 153, 0.25)',
          borderColor: '#ec4899',
          pointBackgroundColor: '#ec4899'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            pointLabels: { color: '#9ca3af', font: { size: 12 } },
            ticks: { display: false },
            min: 0,
            max: 100
          }
        }
      }
    });
  }
}

window.analyticsManager = new AnalyticsManager();
