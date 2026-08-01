/**
 * BrainBoost Main Controller & Router
 * Manages view switching, theme engine, interactive brain canvas, spin wheel, and startup tasks.
 */

class Router {
  constructor() {
    this.routes = ['home', 'games', 'game-arena', 'dashboard', 'rewards', 'settings'];
    this.currentRoute = 'home';
  }

  init() {
    window.addEventListener('hashchange', () => this.handleHashChange());
    this.handleHashChange();
  }

  handleHashChange() {
    let hash = window.location.hash.replace('#', '') || 'home';
    if (!this.routes.includes(hash)) hash = 'home';
    this.navigate(hash);
  }

  navigate(routeName, params = {}) {
    this.currentRoute = routeName;
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    
    const targetSection = document.getElementById(`view-${routeName}`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    // Update Navbar Link States
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('href') === `#${routeName}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Always sync the hash — prevents exitGame from being stuck when hash was already #games
    const expectedHash = `#${routeName}`;
    if (window.location.hash !== expectedHash) {
      window.location.hash = routeName;
    }

    window.scrollTo(0, 0);

    // Contextual Actions
    if (routeName === 'dashboard' || routeName === 'rewards') {
      dashboardManager.renderDashboard();
    }
  }
}

window.router = new Router();

// Interactive Brain Canvas Visualizer Animation
function initBrainCanvas() {
  const canvas = document.getElementById('brain-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = 480;
  canvas.height = 280;

  const nodes = [];
  const nodeCount = 35;

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2.5 + 1.5
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 85) {
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(99, 102, 241, ${1 - dist / 85})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    nodes.forEach(node => {
      node.x += node.vx;
      node.y += node.vy;

      if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
      if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ec4899';
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  draw();
}

// Spin Wheel Rendering
function initSpinWheel() {
  const canvas = document.getElementById('spin-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = 300;
  canvas.height = 300;

  const slices = ['50 Coins', '100 Coins', '150 Coins', '200 Coins', '300 Coins', '500 Coins'];
  const colors = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#10b981', '#8b5cf6'];
  const sliceAngle = (2 * Math.PI) / slices.length;

  for (let i = 0; i < slices.length; i++) {
    const angle = i * sliceAngle;
    ctx.beginPath();
    ctx.moveTo(150, 150);
    ctx.arc(150, 150, 140, angle, angle + sliceAngle);
    ctx.fillStyle = colors[i];
    ctx.fill();

    ctx.save();
    ctx.translate(150, 150);
    ctx.rotate(angle + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Inter';
    ctx.fillText(slices[i], 120, 5);
    ctx.restore();
  }
}

function updateSpinButtonState() {
  const spinBtn = document.getElementById('spin-wheel-btn');
  const spinStatusEl = document.getElementById('spin-status');
  if (!spinBtn) return;

  const todayStr = new Date().toISOString().slice(0, 10);
  const data = storage.get();
  const canSpin = data.stats.lastSpinDate !== todayStr;

  spinBtn.disabled = !canSpin;
  spinBtn.innerHTML = canSpin
    ? '<i class="fas fa-arrows-rotate"></i> Spin Daily Wheel'
    : '<i class="fas fa-check-circle"></i> Claimed Today';

  if (spinStatusEl) {
    spinStatusEl.textContent = canSpin
      ? 'Spin once every 24 hours to claim bonus Brain Coins.'
      : 'You already claimed today\'s reward. Come back tomorrow for another spin.';
  }
}

// Mobile Navigation Menu Toggle
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const navMenu = document.querySelector('.nav-menu');
  if (!menuBtn || !navMenu) return;

  const closeMenu = () => {
    navMenu.classList.remove('open');
    menuBtn.classList.remove('active');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    const isOpen = navMenu.classList.toggle('open');
    menuBtn.classList.toggle('active', isOpen);
    menuBtn.setAttribute('aria-expanded', String(isOpen));
    menuBtn.innerHTML = isOpen ? '<i class="fas fa-xmark"></i>' : '<i class="fas fa-bars"></i>';
  };

  menuBtn.addEventListener('click', toggleMenu);

  navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', (e) => {
    if (navMenu.classList.contains('open') && !navMenu.contains(e.target) && !menuBtn.contains(e.target)) {
      closeMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeMenu();
  });
}

// App Initialization Entry
document.addEventListener('DOMContentLoaded', async () => {
  await gamesEngine.loadDatasets();
  router.init();
  initMobileMenu();

  initBrainCanvas();
  initSpinWheel();
  gamification.checkStreak();
  updateSpinButtonState();

  const theme = storage.get().settings.theme || 'dark';
  document.documentElement.setAttribute('data-theme', theme);

  // Theme Selector Event Listeners
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedTheme = btn.dataset.theme;
      document.documentElement.setAttribute('data-theme', selectedTheme);
      storage.update('settings.theme', selectedTheme);
      soundSynth.playClick();
      showToast(`Theme updated to ${selectedTheme.toUpperCase()}`, 'info');
    });
  });

  // Difficulty Selector Buttons Click Listeners (glassmorphic pill buttons)
  document.querySelectorAll('.diff-selector-container').forEach(selector => {
    selector.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        soundSynth.playClick();
        selector.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  });

  // Game Launcher Click Handlers
  document.querySelectorAll('.launch-game-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const gameId = btn.dataset.game;
      const card = btn.closest('.game-card');
      let diff = 'easy';
      
      if (card) {
        const activeBtn = card.querySelector('.diff-btn.active');
        if (activeBtn) diff = activeBtn.dataset.diff;
      }
      
      router.navigate('game-arena');
      gamesEngine.initGame(gameId, diff);
    });
  });

  // Exit Game Button Handler
  const exitGameBtn = document.getElementById('exit-game-btn');
  if (exitGameBtn) {
    exitGameBtn.addEventListener('click', () => {
      gamesEngine.exitGame();
    });
  }

  // Daily Challenge CTA
  const dailyBtn = document.getElementById('daily-challenge-btn');
  if (dailyBtn) {
    dailyBtn.addEventListener('click', () => {
      router.navigate('game-arena');
      gamesEngine.initGame('dailyChallenge', 'medium');
    });
  }

  // Daily Spin Wheel Trigger
  const spinBtn = document.getElementById('spin-wheel-btn');
  if (spinBtn) {
    spinBtn.addEventListener('click', () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      const data = storage.get();

      if (data.stats.lastSpinDate === todayStr) {
        showToast('You already claimed your daily spin today. Come back tomorrow!', 'info');
        updateSpinButtonState();
        return;
      }

      soundSynth.playClick();
      const canvas = document.getElementById('spin-canvas');
      let rotation = 0;
      const targetRotation = 1440 + Math.random() * 360;
      
      spinBtn.disabled = true;
      const interval = setInterval(() => {
        rotation += 30;
        if (canvas) canvas.style.transform = `rotate(${rotation}deg)`;
        if (rotation >= targetRotation) {
          clearInterval(interval);
          const result = gamification.spinDailyWheel();
          if (!result.alreadySpun) {
            showToast(`🎁 Congratulations! You won ${result.prize} Coins!`, 'success');
            soundSynth.playSuccess();
            if (typeof confetti === 'function') confetti();
          }
          updateSpinButtonState();
          dashboardManager.renderDashboard();
        }
      }, 20);
    });
  }

  // Backup & Import Data Listeners
  const exportBtn = document.getElementById('export-data-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => storage.exportJSON());
  }

  const importInput = document.getElementById('import-data-file');
  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (storage.importJSON(event.target.result)) {
            showToast('Backup restored successfully!', 'success');
            setTimeout(() => location.reload(), 1000);
          } else {
            showToast('Invalid backup file format.', 'error');
          }
        };
        reader.readAsText(file);
      }
    });
  }

  const resetBtn = document.getElementById('reset-data-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all your BrainBoost stats and history?')) {
        storage.resetAllData();
        showToast('All user progress reset.', 'warning');
        setTimeout(() => location.reload(), 1000);
      }
    });
  }

  // Google Drive Sync Handlers
  if (window.driveManager) {
    const driveConnectBtn = document.getElementById('drive-connect-btn');
    const driveSaveBtn = document.getElementById('drive-save-btn');
    const driveLoadBtn = document.getElementById('drive-load-btn');

    if (driveConnectBtn) {
      driveConnectBtn.addEventListener('click', async () => {
        if (!driveManager.isConfigured()) {
          showToast('Add your Google OAuth Client ID in js/drive.js first (see setup steps at the top of the file).', 'info');
          return;
        }
        if (driveManager.ready) {
          driveManager.disconnect();
          showToast('Disconnected from Google Drive.', 'info');
        } else {
          const ok = await driveManager.init();
          if (!ok) {
            showToast('Could not load Google sign-in.', 'error');
            return;
          }
          const authed = await driveManager.authenticate();
          if (authed) {
            showToast('Connected! Saving your progress to Drive...', 'success');
            driveManager.saveToDrive();
          } else {
            showToast('Google sign-in was cancelled or failed.', 'info');
          }
        }
      });
    }

    if (driveSaveBtn) {
      driveSaveBtn.addEventListener('click', () => driveManager.saveToDrive());
    }

    if (driveLoadBtn) {
      driveLoadBtn.addEventListener('click', () => driveManager.loadFromDrive());
    }

    driveManager.updateUI();
  }
});
