/**
 * BrainBoost Games Engine
 * Implements logic for all 10 Memory Exercises & Daily Challenge Mode.
 */

class GamesEngine {
  constructor() {
    this.currentGame = null;
    this.currentDifficulty = 'easy';
    this.gameTimer = null;
    this.startTime = null;
    this.datasets = {};
    this.activeIntervals = [];
    this.activeTimeouts = [];
  }

  async loadDatasets() {
    try {
      const [wordsRes, storiesRes, patternsRes, facesRes, questionsRes] = await Promise.all([
        fetch('./data/words.json').then(r => r.json()).catch(() => ({ easy: ['Apple', 'Book', 'Tree', 'Star', 'Cloud'] })),
        fetch('./data/stories.json').then(r => r.json()).catch(() => ([])),
        fetch('./data/patterns.json').then(r => r.json()).catch(() => ({})),
        fetch('./data/faces.json').then(r => r.json()).catch(() => ([])),
        fetch('./data/questions.json').then(r => r.json()).catch(() => ([]))
      ]);

      this.datasets = {
        words: wordsRes,
        stories: storiesRes,
        patterns: patternsRes,
        faces: facesRes,
        questions: questionsRes
      };
    } catch (e) {
      console.warn('Dataset loading fallback initialized');
    }
  }

  registerTimeout(fn, delayMs) {
    const id = setTimeout(() => {
      fn();
      this.activeTimeouts = this.activeTimeouts.filter(t => t !== id);
    }, delayMs);
    this.activeTimeouts.push(id);
    return id;
  }

  registerInterval(fn, delayMs) {
    const id = setInterval(fn, delayMs);
    this.activeIntervals.push(id);
    return id;
  }

  clearAllTimers() {
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }
    this.activeIntervals.forEach(id => clearInterval(id));
    this.activeTimeouts.forEach(id => clearTimeout(id));
    this.activeIntervals = [];
    this.activeTimeouts = [];
  }

  exitGame() {
    if (typeof soundSynth !== 'undefined' && soundSynth.playClick) {
      soundSynth.playClick();
    }
    this.clearAllTimers();
    this.currentGame = null;

    const arena = document.getElementById('game-arena-content');
    if (arena) arena.innerHTML = '';

    // Navigate back to games hub — router.navigate() now handles hash sync internally
    if (window.router && window.router.navigate) {
      window.router.navigate('games');
    }
  }

  updateArenaHeader(gameTitle) {
    const titleEl = document.getElementById('game-live-title');
    const diffEl = document.getElementById('game-live-diff');
    const timerEl = document.getElementById('game-live-timer');

    if (titleEl) titleEl.textContent = gameTitle;
    if (diffEl) {
      diffEl.textContent = this.currentDifficulty.toUpperCase();
      diffEl.style.color = 
        this.currentDifficulty === 'easy' ? '#10b981' :
        this.currentDifficulty === 'medium' ? '#06b6d4' :
        this.currentDifficulty === 'hard' ? '#f59e0b' : '#ef4444';
    }

    if (timerEl) {
      timerEl.textContent = '00:00';
      this.gameTimer = setInterval(() => {
        if (!this.startTime) return;
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const secs = String(elapsed % 60).padStart(2, '0');
        timerEl.textContent = `${mins}:${secs}`;
      }, 1000);
      this.activeIntervals.push(this.gameTimer);
    }
  }

  initGame(gameId, difficulty = 'easy') {
    this.clearAllTimers();
    this.currentGame = gameId;
    this.currentDifficulty = difficulty;

    const arena = document.getElementById('game-arena-content');
    if (!arena) return;

    soundSynth.playClick();
    this.startTime = Date.now();

    const titles = {
      cardMatching: '1. Card Matching',
      sequenceMemory: '2. Sequence Memory',
      numberRecall: '3. Number Recall',
      wordRecall: '4. Word Recall',
      imageMemory: '5. Image Memory',
      patternMemory: '6. Pattern Memory',
      faceMemory: '7. Face Memory',
      emojiRecall: '8. Emoji Recall',
      soundMemory: '9. Sound Memory',
      storyRecall: '10. Story Recall',
      dailyChallenge: 'Daily Challenge'
    };

    this.updateArenaHeader(titles[gameId] || 'Memory Exercise');

    switch (gameId) {
      case 'cardMatching':
        this.startCardMatching(arena);
        break;
      case 'sequenceMemory':
        this.startSequenceMemory(arena);
        break;
      case 'numberRecall':
        this.startNumberRecall(arena);
        break;
      case 'wordRecall':
        this.startWordRecall(arena);
        break;
      case 'imageMemory':
        this.startImageMemory(arena);
        break;
      case 'patternMemory':
        this.startPatternMemory(arena);
        break;
      case 'faceMemory':
        this.startFaceMemory(arena);
        break;
      case 'emojiRecall':
        this.startEmojiRecall(arena);
        break;
      case 'soundMemory':
        this.startSoundMemory(arena);
        break;
      case 'storyRecall':
        this.startStoryRecall(arena);
        break;
      case 'dailyChallenge':
        this.startDailyChallenge(arena);
        break;
      default:
        arena.innerHTML = `<p>Game Engine Initializing...</p>`;
    }
  }

  /* ---------------- 1. CARD MATCHING GAME ---------------- */
  startCardMatching(arena) {
    const icons = ['fa-brain', 'fa-bolt', 'fa-gem', 'fa-star', 'fa-fire', 'fa-rocket', 'fa-lightbulb', 'fa-heart', 'fa-eye', 'fa-compass', 'fa-crown', 'fa-atom'];
    let pairCount = 4; // easy
    if (this.currentDifficulty === 'medium') pairCount = 6;
    if (this.currentDifficulty === 'hard') pairCount = 8;
    if (this.currentDifficulty === 'expert') pairCount = 12;

    const selectedIcons = icons.slice(0, pairCount);
    const deck = [...selectedIcons, ...selectedIcons].sort(() => 0.5 - Math.random());

    let flippedCards = [];
    let matchedPairs = 0;
    let moves = 0;

    arena.innerHTML = `
      <h3 style="margin-bottom:0.5rem;">Card Matching (${this.currentDifficulty.toUpperCase()})</h3>
      <p style="color:var(--text-secondary); margin-bottom:1.5rem;">Find all ${pairCount} matching pairs in minimum moves.</p>
      <div class="cards-grid" style="grid-template-columns: repeat(${pairCount <= 4 ? 4 : (pairCount <= 8 ? 4 : 6)}, 1fr);">
        ${deck.map((icon, idx) => `
          <div class="memory-card" data-index="${idx}" data-icon="${icon}">
            <div class="memory-card-inner">
              <div class="memory-card-front"><i class="fas fa-question"></i></div>
              <div class="memory-card-back"><i class="fas ${icon}"></i></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    const cardEls = arena.querySelectorAll('.memory-card');
    cardEls.forEach(card => {
      card.addEventListener('click', () => {
        if (flippedCards.length >= 2 || card.classList.contains('flipped') || card.classList.contains('matched')) return;
        
        soundSynth.playClick();
        card.classList.add('flipped');
        flippedCards.push(card);

        if (flippedCards.length === 2) {
          moves++;
          const [c1, c2] = flippedCards;
          if (c1.dataset.icon === c2.dataset.icon) {
            c1.classList.add('matched');
            c2.classList.add('matched');
            soundSynth.playSuccess();
            matchedPairs++;
            flippedCards = [];
            if (matchedPairs === pairCount) {
              const durationSec = ((Date.now() - this.startTime) / 1000).toFixed(1);
              const accuracy = Math.max(20, Math.round((pairCount / moves) * 100));
              this.finishGame('cardMatching', accuracy, parseFloat(durationSec));
            }
          } else {
            soundSynth.playError();
            this.registerTimeout(() => {
              c1.classList.remove('flipped');
              c2.classList.remove('flipped');
              flippedCards = [];
            }, 800);
          }
        }
      });
    });
  }

  /* ---------------- 2. SEQUENCE MEMORY (SIMON SAYS) ---------------- */
  startSequenceMemory(arena) {
    let sequence = [];
    let playerStep = 0;
    let round = 1;
    const maxRounds = this.currentDifficulty === 'easy' ? 4 : (this.currentDifficulty === 'medium' ? 7 : (this.currentDifficulty === 'hard' ? 10 : 14));
    const speedMs = this.currentDifficulty === 'easy' ? 700 : (this.currentDifficulty === 'medium' ? 500 : 350);

    arena.innerHTML = `
      <h3 style="margin-bottom:0.5rem;">Sequence Memory (${this.currentDifficulty.toUpperCase()})</h3>
      <p id="simon-status" style="color:var(--accent-tertiary); font-weight:600; margin-bottom:1.5rem;">Watch the pattern carefully...</p>
      <div class="simon-grid">
        <div class="simon-btn simon-red" data-id="0"></div>
        <div class="simon-btn simon-blue" data-id="1"></div>
        <div class="simon-btn simon-green" data-id="2"></div>
        <div class="simon-btn simon-yellow" data-id="3"></div>
      </div>
    `;

    const btns = arena.querySelectorAll('.simon-btn');
    const statusEl = arena.querySelector('#simon-status');

    const nextRound = () => {
      playerStep = 0;
      statusEl.textContent = `Round ${round}/${maxRounds}: Watch sequence`;
      sequence.push(Math.floor(Math.random() * 4));
      
      let i = 0;
      const interval = this.registerInterval(() => {
        if (i >= sequence.length) {
          clearInterval(interval);
          statusEl.textContent = `Your Turn! (${sequence.length} steps)`;
          return;
        }
        const btnIdx = sequence[i];
        if (btns[btnIdx]) {
          btns[btnIdx].classList.add('active');
          soundSynth.playSimonNote(btnIdx);
          this.registerTimeout(() => btns[btnIdx].classList.remove('active'), speedMs / 2);
        }
        i++;
      }, speedMs);
    };

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        soundSynth.playSimonNote(id);
        btn.classList.add('active');
        this.registerTimeout(() => btn.classList.remove('active'), 200);

        if (id === sequence[playerStep]) {
          playerStep++;
          if (playerStep === sequence.length) {
            round++;
            if (round > maxRounds) {
              const durationSec = ((Date.now() - this.startTime) / 1000).toFixed(1);
              this.finishGame('sequenceMemory', 100, parseFloat(durationSec));
            } else {
              this.registerTimeout(nextRound, 800);
            }
          }
        } else {
          soundSynth.playError();
          statusEl.textContent = "Incorrect Sequence!";
          const durationSec = ((Date.now() - this.startTime) / 1000).toFixed(1);
          const acc = Math.min(100, Math.round((round / maxRounds) * 100));
          this.registerTimeout(() => this.finishGame('sequenceMemory', acc, parseFloat(durationSec)), 1000);
        }
      });
    });

    this.registerTimeout(nextRound, 1000);
  }

  /* ---------------- 3. NUMBER RECALL ---------------- */
  startNumberRecall(arena) {
    let digitCount = 4;
    let flashMs = 3500;
    if (this.currentDifficulty === 'medium') { digitCount = 7; flashMs = 2800; }
    if (this.currentDifficulty === 'hard') { digitCount = 10; flashMs = 2200; }
    if (this.currentDifficulty === 'expert') { digitCount = 14; flashMs = 1800; }

    let targetNumber = '';
    for (let i = 0; i < digitCount; i++) {
      targetNumber += Math.floor(Math.random() * 10);
    }

    arena.innerHTML = `
      <h3>Number Recall (${digitCount} Digits - ${this.currentDifficulty.toUpperCase()})</h3>
      <p style="color:var(--text-secondary);">Memorize the digits before they disappear!</p>
      <div id="number-box" class="flash-display-box">${targetNumber}</div>
      <div id="recall-input-area" style="display:none; width:100%; max-width:400px; text-align:center;">
        <input type="number" id="number-user-input" class="glass-card" style="width:100%; font-size:1.8rem; text-align:center; padding:0.75rem; color:#fff; margin-bottom:1rem;" placeholder="Type the number..." />
        <button id="submit-number-btn" class="btn btn-primary" style="width:100%;">Submit Recall</button>
      </div>
    `;

    this.registerTimeout(() => {
      const box = arena.querySelector('#number-box');
      const inputArea = arena.querySelector('#recall-input-area');
      if (box && inputArea) {
        box.textContent = '••••••••';
        inputArea.style.display = 'block';
        const inputField = arena.querySelector('#number-user-input');
        inputField.focus();

        arena.querySelector('#submit-number-btn').onclick = () => {
          const val = inputField.value.trim();
          const durationSec = ((Date.now() - this.startTime) / 1000).toFixed(1);
          let correct = 0;
          for (let i = 0; i < targetNumber.length; i++) {
            if (val[i] === targetNumber[i]) correct++;
          }
          const accuracy = Math.round((correct / targetNumber.length) * 100);
          this.finishGame('numberRecall', accuracy, parseFloat(durationSec));
        };
      }
    }, flashMs);
  }

  /* ---------------- 4. WORD RECALL ---------------- */
  startWordRecall(arena) {
    const wordList = (this.datasets.words && this.datasets.words[this.currentDifficulty]) || ['Apple', 'River', 'Clock', 'Galaxy', 'Feather'];
    const count = this.currentDifficulty === 'easy' ? 4 : (this.currentDifficulty === 'medium' ? 7 : (this.currentDifficulty === 'hard' ? 10 : 14));
    const flashMs = this.currentDifficulty === 'easy' ? 5000 : (this.currentDifficulty === 'medium' ? 4000 : 3000);
    const targetWords = wordList.slice(0, count);

    arena.innerHTML = `
      <h3>Word Recall (${count} Words - ${this.currentDifficulty.toUpperCase()})</h3>
      <p style="color:var(--text-secondary);">Memorize these words before time expires!</p>
      <div id="words-container" style="display:flex; flex-wrap:wrap; gap:0.75rem; justify-content:center; margin:1.5rem 0;">
        ${targetWords.map(w => `<span class="glass-card" style="font-size:1.2rem; font-weight:700; padding:0.5rem 1.25rem;">${w}</span>`).join('')}
      </div>
      <div id="word-recall-form" style="display:none; width:100%; max-width:500px;">
        <p style="margin-bottom:1rem;">Type all words you remember (separated by spaces or commas):</p>
        <textarea id="word-input" class="glass-card" style="width:100%; height:100px; color:#fff; padding:0.75rem; font-size:1.1rem;" placeholder="Type words..."></textarea>
        <button id="submit-words-btn" class="btn btn-primary" style="width:100%; margin-top:1rem;">Submit Recall</button>
      </div>
    `;

    this.registerTimeout(() => {
      const container = arena.querySelector('#words-container');
      const form = arena.querySelector('#word-recall-form');
      if (container && form) {
        container.style.display = 'none';
        form.style.display = 'block';

        arena.querySelector('#submit-words-btn').onclick = () => {
          const text = arena.querySelector('#word-input').value.toLowerCase();
          const durationSec = ((Date.now() - this.startTime) / 1000).toFixed(1);
          let recalled = 0;
          targetWords.forEach(w => {
            if (text.includes(w.toLowerCase())) recalled++;
          });
          const accuracy = Math.round((recalled / targetWords.length) * 100);
          this.finishGame('wordRecall', accuracy, parseFloat(durationSec));
        };
      }
    }, flashMs);
  }

  /* ---------------- 5. IMAGE MEMORY ---------------- */
  startImageMemory(arena) {
    const pack = (this.datasets.questions && this.datasets.questions[0]) || {
      items: [
        { id: "i1", icon: "fa-sun", color: "#f59e0b", label: "Golden Sun" },
        { id: "i2", icon: "fa-moon", color: "#8b5cf6", label: "Crescent Moon" },
        { id: "i3", icon: "fa-tree", color: "#10b981", label: "Pine Tree" },
        { id: "i4", icon: "fa-water", color: "#3b82f6", label: "Ocean Wave" }
      ],
      questions: [
        { question: "Was the Pine Tree present in the grid?", options: ["Yes", "No"], answer: "Yes" }
      ]
    };

    const flashMs = this.currentDifficulty === 'easy' ? 4500 : (this.currentDifficulty === 'medium' ? 3500 : 2500);

    arena.innerHTML = `
      <h3>Image Memory Challenge (${this.currentDifficulty.toUpperCase()})</h3>
      <p style="color:var(--text-secondary);">Memorize the icons and their colors!</p>
      <div id="image-grid" style="display:grid; grid-template-columns:repeat(4, 1fr); gap:1rem; margin:1.5rem 0;">
        ${pack.items.map(item => `
          <div class="glass-card" style="text-align:center; padding:1rem;">
            <i class="fas ${item.icon}" style="font-size:2.5rem; color:${item.color};"></i>
            <div style="font-size:0.85rem; margin-top:0.5rem;">${item.label}</div>
          </div>
        `).join('')}
      </div>
      <div id="quiz-area" style="display:none; max-width:500px; width:100%;"></div>
    `;

    this.registerTimeout(() => {
      const grid = arena.querySelector('#image-grid');
      const quizArea = arena.querySelector('#quiz-area');
      if (grid && quizArea) {
        grid.style.display = 'none';
        quizArea.style.display = 'block';

        const q = pack.questions[0];
        quizArea.innerHTML = `
          <h4 style="margin-bottom:1rem;">${q.question}</h4>
          <div style="display:flex; flex-direction:column; gap:0.75rem;">
            ${q.options.map(opt => `<button class="btn btn-secondary opt-btn" data-val="${opt}">${opt}</button>`).join('')}
          </div>
        `;

        quizArea.querySelectorAll('.opt-btn').forEach(btn => {
          btn.onclick = () => {
            const isCorrect = btn.dataset.val === q.answer;
            const durationSec = ((Date.now() - this.startTime) / 1000).toFixed(1);
            this.finishGame('imageMemory', isCorrect ? 100 : 0, parseFloat(durationSec));
          };
        });
      }
    }, flashMs);
  }

  /* ---------------- 6. PATTERN MEMORY ---------------- */
  startPatternMemory(arena) {
    const size = this.currentDifficulty === 'easy' ? 3 : (this.currentDifficulty === 'medium' ? 4 : (this.currentDifficulty === 'hard' ? 5 : 6));
    const totalCells = size * size;
    const activeCount = size + 1;
    const flashMs = this.currentDifficulty === 'easy' ? 2500 : (this.currentDifficulty === 'medium' ? 2000 : 1500);

    let activeIndices = [];
    while (activeIndices.length < activeCount) {
      const r = Math.floor(Math.random() * totalCells);
      if (!activeIndices.includes(r)) activeIndices.push(r);
    }

    arena.innerHTML = `
      <h3>Pattern Memory (${size}x${size} Grid - ${this.currentDifficulty.toUpperCase()})</h3>
      <p style="color:var(--text-secondary); margin-bottom:1rem;">Memorize the lit pattern!</p>
      <div class="pattern-grid" style="grid-template-columns:repeat(${size}, 1fr); max-width:${size * 65}px;">
        ${Array.from({ length: totalCells }).map((_, idx) => `
          <div class="pattern-cell ${activeIndices.includes(idx) ? 'active-flash' : ''}" data-idx="${idx}"></div>
        `).join('')}
      </div>
    `;

    this.registerTimeout(() => {
      const cells = arena.querySelectorAll('.pattern-cell');
      cells.forEach(c => c.classList.remove('active-flash'));

      let userSelected = [];
      cells.forEach(c => {
        c.onclick = () => {
          const idx = parseInt(c.dataset.idx);
          if (userSelected.includes(idx)) return;
          
          userSelected.push(idx);
          if (activeIndices.includes(idx)) {
            c.classList.add('user-selected');
            soundSynth.playClick();
          } else {
            c.classList.add('wrong-selected');
            soundSynth.playError();
          }

          if (userSelected.length === activeCount) {
            let correct = userSelected.filter(i => activeIndices.includes(i)).length;
            const durationSec = ((Date.now() - this.startTime) / 1000).toFixed(1);
            const accuracy = Math.round((correct / activeCount) * 100);
            this.registerTimeout(() => this.finishGame('patternMemory', accuracy, parseFloat(durationSec)), 500);
          }
        };
      });
    }, flashMs);
  }

  /* ---------------- 7. FACE MEMORY ---------------- */
  startFaceMemory(arena) {
    const faces = this.datasets.faces || [];
    const target = faces[Math.floor(Math.random() * faces.length)] || {
      name: "Sarah Jenkins",
      profession: "Architect",
      city: "Seattle",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
    };
    const flashMs = this.currentDifficulty === 'easy' ? 5000 : (this.currentDifficulty === 'medium' ? 3800 : 2800);

    arena.innerHTML = `
      <h3>Face & Detail Recall (${this.currentDifficulty.toUpperCase()})</h3>
      <p style="color:var(--text-secondary);">Memorize this person's details!</p>
      <div class="glass-card" style="display:flex; align-items:center; gap:1.5rem; max-width:450px; margin:1.5rem 0;">
        <img src="${target.avatar}" style="width:90px; height:90px; border-radius:50%; background:var(--bg-secondary);" />
        <div>
          <h4 style="font-size:1.2rem;">${target.name}</h4>
          <p style="color:var(--accent-tertiary); font-weight:600;">${target.profession}</p>
          <p style="font-size:0.9rem; color:var(--text-secondary);">City: ${target.city}</p>
        </div>
      </div>
      <div id="face-quiz" style="display:none; max-width:450px; width:100%;"></div>
    `;

    this.registerTimeout(() => {
      const card = arena.querySelector('.glass-card');
      const quiz = arena.querySelector('#face-quiz');
      if (card && quiz) {
        card.style.display = 'none';
        quiz.style.display = 'block';

        quiz.innerHTML = `
          <h4>What was the profession of ${target.name}?</h4>
          <div style="display:flex; flex-direction:column; gap:0.75rem; margin-top:1rem;">
            ${['Architect', 'Neuroscientist', 'Software Engineer', 'Pianist'].map(p => `
              <button class="btn btn-secondary face-opt" data-prof="${p}">${p}</button>
            `).join('')}
          </div>
        `;

        quiz.querySelectorAll('.face-opt').forEach(btn => {
          btn.onclick = () => {
            const isCorrect = btn.dataset.prof === target.profession;
            const durationSec = ((Date.now() - this.startTime) / 1000).toFixed(1);
            this.finishGame('faceMemory', isCorrect ? 100 : 0, parseFloat(durationSec));
          };
        });
      }
    }, flashMs);
  }

  /* ---------------- 8. EMOJI RECALL ---------------- */
  startEmojiRecall(arena) {
    const emojis = ['🚀', '🧠', '⚡', '💎', '🔥', '🌟', '🎨', '🎯', '🔮', '🏆'];
    const count = this.currentDifficulty === 'easy' ? 4 : (this.currentDifficulty === 'medium' ? 6 : (this.currentDifficulty === 'hard' ? 8 : 10));
    const targetEmojis = emojis.slice(0, count).sort(() => 0.5 - Math.random());
    const flashMs = this.currentDifficulty === 'easy' ? 3500 : (this.currentDifficulty === 'medium' ? 2500 : 1800);

    arena.innerHTML = `
      <h3>Emoji Order Recall (${count} Emojis - ${this.currentDifficulty.toUpperCase()})</h3>
      <p style="color:var(--text-secondary);">Remember the exact sequence of emojis!</p>
      <div id="emoji-display" style="font-size:2.5rem; gap:0.75rem; display:flex; flex-wrap:wrap; margin:2rem 0;">
        ${targetEmojis.map(e => `<span>${e}</span>`).join('')}
      </div>
      <div id="emoji-recreate" style="display:none;">
        <p style="margin-bottom:1rem;">Click emojis in the correct sequence:</p>
        <div id="user-sequence" style="font-size:2.2rem; min-height:60px; margin-bottom:1rem; border-bottom:2px dashed var(--glass-border);"></div>
        <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
          ${[...targetEmojis].sort(() => 0.5 - Math.random()).map(e => `
            <button class="btn btn-secondary emoji-pick-btn" style="font-size:1.8rem; padding:0.5rem 1rem;">${e}</button>
          `).join('')}
        </div>
      </div>
    `;

    this.registerTimeout(() => {
      const display = arena.querySelector('#emoji-display');
      const recreate = arena.querySelector('#emoji-recreate');
      if (display && recreate) {
        display.style.display = 'none';
        recreate.style.display = 'block';

        let userOrder = [];
        const userSeqEl = arena.querySelector('#user-sequence');

        arena.querySelectorAll('.emoji-pick-btn').forEach(btn => {
          btn.onclick = () => {
            soundSynth.playClick();
            userOrder.push(btn.textContent.trim());
            userSeqEl.textContent = userOrder.join(' ');

            if (userOrder.length === count) {
              const isMatch = JSON.stringify(userOrder) === JSON.stringify(targetEmojis);
              const durationSec = ((Date.now() - this.startTime) / 1000).toFixed(1);
              this.finishGame('emojiRecall', isMatch ? 100 : 0, parseFloat(durationSec));
            }
          };
        });
      }
    }, flashMs);
  }

  /* ---------------- 9. SOUND MEMORY ---------------- */
  startSoundMemory(arena) {
    let sequence = this.currentDifficulty === 'easy' ? [0, 2, 1, 3] : (this.currentDifficulty === 'medium' ? [0, 2, 1, 3, 0] : [0, 2, 1, 3, 2, 0, 1]);
    let userStep = 0;

    arena.innerHTML = `
      <h3 style="margin-bottom:0.5rem;">Sound Pitch Memory (${sequence.length} Notes - ${this.currentDifficulty.toUpperCase()})</h3>
      <p style="color:var(--text-secondary); margin-bottom:1.5rem;">Listen to the pitch sequence and repeat it in order.</p>
      <button id="play-sound-seq-btn" class="btn btn-gold" style="margin-bottom:2rem; font-size:1.1rem; padding:0.85rem 1.8rem;">
        <i class="fas fa-volume-up"></i> Play Pitch Sequence
      </button>
      <div style="display:flex; gap:1rem; flex-wrap:wrap; justify-content:center; width:100%;">
        <button class="pitch-btn" data-idx="0"><i class="fas fa-music" style="color:#3b82f6;"></i> Pitch Low (C4)</button>
        <button class="pitch-btn" data-idx="1"><i class="fas fa-music" style="color:#10b981;"></i> Pitch Mid (E4)</button>
        <button class="pitch-btn" data-idx="2"><i class="fas fa-music" style="color:#f59e0b;"></i> Pitch High (G4)</button>
        <button class="pitch-btn" data-idx="3"><i class="fas fa-bolt" style="color:#ec4899;"></i> Pitch Max (C5)</button>
      </div>
    `;

    const playBtn = arena.querySelector('#play-sound-seq-btn');
    playBtn.onclick = () => {
      playBtn.disabled = true;
      let i = 0;
      const interval = this.registerInterval(() => {
        if (i >= sequence.length) {
          clearInterval(interval);
          playBtn.disabled = false;
          return;
        }
        soundSynth.playSimonNote(sequence[i]);
        i++;
      }, 600);
    };

    arena.querySelectorAll('.pitch-btn').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx);
        soundSynth.playSimonNote(idx);

        if (idx === sequence[userStep]) {
          userStep++;
          if (userStep === sequence.length) {
            const durationSec = ((Date.now() - this.startTime) / 1000).toFixed(1);
            this.finishGame('soundMemory', 100, parseFloat(durationSec));
          }
        } else {
          soundSynth.playError();
          const durationSec = ((Date.now() - this.startTime) / 1000).toFixed(1);
          this.finishGame('soundMemory', 0, parseFloat(durationSec));
        }
      };
    });
  }

  /* ---------------- 10. STORY RECALL ---------------- */
  startStoryRecall(arena) {
    const stories = this.datasets.stories || [];
    const storyItem = stories[0] || {
      title: "The Quantum Lab",
      story: "Dr. Elena Vance arrived at 8:15 AM wearing a blue coat...",
      questions: [{ question: "What time did Dr. Vance arrive?", options: ["8:15 AM", "9:00 AM"], answer: "8:15 AM" }]
    };

    arena.innerHTML = `
      <h3>${storyItem.title} (${this.currentDifficulty.toUpperCase()})</h3>
      <p class="glass-card" style="font-size:1.05rem; line-height:1.7; margin:1.5rem 0;">${storyItem.story}</p>
      <button id="start-story-quiz-btn" class="btn btn-primary">I'm ready for questions</button>
      <div id="story-quiz-container" style="display:none; margin-top:1.5rem;"></div>
    `;

    arena.querySelector('#start-story-quiz-btn').onclick = () => {
      arena.querySelector('p.glass-card').style.display = 'none';
      arena.querySelector('#start-story-quiz-btn').style.display = 'none';
      const container = arena.querySelector('#story-quiz-container');
      container.style.display = 'block';

      const q = storyItem.questions[0];
      container.innerHTML = `
        <h4 style="margin-bottom:1rem;">${q.question}</h4>
        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          ${q.options.map(opt => `<button class="btn btn-secondary story-opt" data-ans="${opt}">${opt}</button>`).join('')}
        </div>
      `;

      container.querySelectorAll('.story-opt').forEach(btn => {
        btn.onclick = () => {
          const isCorrect = btn.dataset.ans === q.answer;
          const durationSec = ((Date.now() - this.startTime) / 1000).toFixed(1);
          this.finishGame('storyRecall', isCorrect ? 100 : 0, parseFloat(durationSec));
        };
      });
    };
  }

  /* ---------------- DAILY CHALLENGE MODE ---------------- */
  startDailyChallenge(arena) {
    this.startWordRecall(arena);
  }

  /* ---------------- GAME COMPLETION & METRICS COMPUTATION ---------------- */
  finishGame(gameId, accuracy, speedSec) {
    this.clearAllTimers();
    soundSynth.playSuccess();

    const memIndex = calculateMemoryIndex(accuracy, speedSec, 85, this.currentDifficulty);
    const xpAwarded = Math.round(accuracy * (this.currentDifficulty === 'expert' ? 3 : (this.currentDifficulty === 'hard' ? 2 : 1.5)));

    gamification.awardXP(xpAwarded);

    const record = {
      id: 'g_' + Date.now(),
      gameId,
      score: Math.round(accuracy * 10),
      accuracy,
      speedSec,
      difficulty: this.currentDifficulty,
      memoryIndex: memIndex,
      timestamp: new Date().toISOString()
    };

    storage.addGameHistory(record);
    gamification.checkBadgeUnlocks(record);

    if (storage.get().settings.autoDifficulty) {
      const nextDiff = getAdaptedDifficulty(this.currentDifficulty, accuracy);
      if (nextDiff !== this.currentDifficulty) {
        showToast(`Adaptive Difficulty updated to ${nextDiff.toUpperCase()}`, 'info');
      }
    }

    this.showPerformanceModal(record, xpAwarded);
  }

  showPerformanceModal(record, xpAwarded) {
    const modal = document.getElementById('performance-modal');
    if (!modal) return;

    modal.querySelector('#modal-accuracy').textContent = `${record.accuracy}%`;
    modal.querySelector('#modal-speed').textContent = `${record.speedSec}s`;
    modal.querySelector('#modal-memory-index').textContent = record.memoryIndex;
    modal.querySelector('#modal-xp').textContent = `+${xpAwarded} XP`;

    modal.classList.add('active');

    modal.querySelector('#close-modal-btn').onclick = () => {
      modal.classList.remove('active');
      if (window.router) window.router.navigate('dashboard');
    };
  }
}

window.gamesEngine = new GamesEngine();
