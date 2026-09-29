const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../index.html');
let html = fs.readFileSync(indexPath, 'utf-8');

console.log('--- WIRING UP EXAM CONTROLLER, ERROR BANK, RETAKE & ANALYTICS ---');

// Search normalization supporting Banglish & Romanized Bengali
const searchNormalizationCode = `
      normalizeSearchText(text) {
        if (!text) return '';
        let s = String(text).toLowerCase().normalize("NFKC");

        // Common Romanized Bengali / Banglish aliases
        const aliases = {
          'vowtojogot': 'ভৌতজগত', 'voutojogot': 'ভৌতজগত', 'porimap': 'পরিমাপ', 'measurement': 'পরিমাপ',
          'vector': 'ভেক্টর', 'goti': 'গতিবিদ্যা', 'dynamics': 'গতিবিদ্যা', 'bol': 'বলবিদ্যা',
          'kaj': 'কাজ শক্তি ক্ষমতা', 'shokti': 'শক্তি', 'mohakorsho': 'মহাকর্ষ', 'gravitation': 'মহাকর্ষ',
          'poddartho': 'পদার্থের গাঠনিক ধর্ম', 'porzay': 'পর্যায়বৃত্ত গতি', 'torongo': 'তরঙ্গ',
          'tap': 'তাপগতিবিদ্যা', 'thermodynamics': 'তাপগতিবিদ্যা', 'sthit': 'স্থির তড়িৎ', 'chol': 'চল তড়িৎ',
          'alok': 'আলোকবিজ্ঞান', 'optics': 'আলোকবিজ্ঞান', 'poromanu': 'পরমাণু মডেল', 'nuclear': 'নিউক্লিয়ার',
          'semiconductor': 'সেমিকন্ডাক্টর', 'roshayon': 'রসায়ন', 'chemistry': 'রসায়ন', 'gunogoto': 'গুণগত রসায়ন',
          'porjaybritto': 'পর্যায়বৃত্ত ধর্ম', 'poribesh': 'পরিবেশ রসায়ন', 'poriman': 'পরিমাণগত রসায়ন',
          'organic': 'জৈব রসায়ন', 'zoibo': 'জৈব রসায়ন', 'electro': 'তড়িৎ রসায়ন', 'torit': 'তড়িৎ রসায়ন',
          'rokto': 'রক্ত ও সঞ্চালন', 'shoshon': 'শ্বসন ও শ্বাসক্রিয়া', 'chalon': 'চলন ও অঙ্গচালনা',
          'hritpindo': 'হৃদপিণ্ড', 'kos': 'কোষ ও এর গঠন', 'genetics': 'জিনতত্ত্ব ও বিবর্তন'
        };

        for (const [key, val] of Object.entries(aliases)) {
          if (s.includes(key)) s += ' ' + val;
        }

        return s
          .replace(/[।,;:;!?()[\\]{}"'\`]/g, " ")
          .replace(/\\s+/g, " ")
          .trim();
      },
`;

// Insert or replace app controller methods
const controllerMethods = `
      ${searchNormalizationCode}

      // ----------------------------------------------------
      // EXAM INSTRUCTIONS & START MODAL
      // ----------------------------------------------------
      openExamInstructions(examId) {
        const item = this.catalog.find(c => c.id === examId);
        if (!item) return;

        this.pendingExamId = examId;
        document.getElementById('instExamTitle').textContent = item.title;
        document.getElementById('instSubjectBadge').textContent = item.category || 'Medical Admission';
        document.getElementById('instQuestionCount').textContent = item.questionCount || 100;
        document.getElementById('instDuration').textContent = (item.durationMinutes || 60) + ' Min';
        const neg = item.negativeMark !== undefined ? item.negativeMark : 0.25;
        document.getElementById('instNegativeMark').textContent = '-' + neg.toFixed(2);
        document.getElementById('instPenaltyBullet').textContent = neg.toFixed(2);

        document.getElementById('instructionsModal').classList.add('active');
      },

      closeInstructions() {
        document.getElementById('instructionsModal').classList.remove('active');
        this.pendingExamId = null;
      },

      // ----------------------------------------------------
      // START EXAM ENGINE (SINGLE-QUESTION FOCUS + PALETTE)
      // ----------------------------------------------------
      async startExamFromCatalog(examId) {
        this.closeInstructions();
        const item = this.catalog.find(c => c.id === examId);
        if (!item) return;

        try {
          const data = await this.fetchExamJson(examId);
          if (!data || !data.questions) throw new Error('Invalid exam structure');

          this.questions = (data.questions || []).map((q, idx) => ({
            id: idx + 1,
            question: q.question,
            options: q.options,
            answer: q.correctAnswer || q.answer,
            explanation: q.explanation,
            subject: data.category || item.category || 'General'
          }));

          this.examTitle = data.title || item.title;
          this.currentExamId = examId;
          this.currentExamCategory = data.category || item.category;
          this.currentExamCode = item.code || '';
          this.negativeMark = item.negativeMark !== undefined ? item.negativeMark : (data.negativeMark || 0.25);
          this.totalTimeSeconds = (data.durationMinutes || item.durationMinutes || 60) * 60;
          this.remainingSeconds = this.totalTimeSeconds;
          this.timerStartedAt = Date.now();
          this.currentQuestionIndex = 0;
          this.userAnswers = {};
          this.markedQuestions = {};
          this.isErrorBankRetake = false;

          this.startExamCommon();
        } catch (err) {
          console.error('Failed to load exam:', err);
          alert('Could not load exam data. Please try again.');
        }
      },

      startExamCommon() {
        this.examStatus = 'in_progress';
        document.getElementById('activeExamTitle').textContent = this.examTitle;
        document.getElementById('activeExamCodeText').textContent = this.currentExamCategory || 'Medical Test';

        // Render Question 1
        this.renderCurrentQuestion();

        // Render Sidebar Palette
        this.renderFocusPalette();

        // Start centralized accurate timer
        this.startCentralTimer();

        // Auto-save state
        this.saveActiveExamState();

        // Header controls visibility
        document.getElementById('headerExamControls').style.display = 'flex';
        document.getElementById('headerSubmitBtn').style.display = 'inline-flex';
        document.getElementById('headerCatalogBtn').style.display = 'inline-flex';

        this.showScreen('screenExam');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },

      // ----------------------------------------------------
      // FOCUSED SINGLE QUESTION RENDERING
      // ----------------------------------------------------
      renderCurrentQuestion() {
        if (!this.questions || this.questions.length === 0) return;
        const q = this.questions[this.currentQuestionIndex];
        const qNum = this.currentQuestionIndex + 1;
        const totalQ = this.questions.length;

        // Badge & Meta
        document.getElementById('activeQNumberBadge').textContent = \`Question \${qNum} / \${totalQ}\`;
        document.getElementById('focusQuestionTitle').innerHTML = this.processQuestionContent(q.question);

        // Mark for Review state
        const isMarked = !!this.markedQuestions[q.id];
        const markBtn = document.getElementById('btnToggleMarkReview');
        if (isMarked) {
          markBtn.style.background = 'rgba(245, 158, 11, 0.2)';
          markBtn.style.borderColor = '#f59e0b';
          markBtn.style.color = '#d97706';
          document.getElementById('markReviewText').textContent = 'Marked for Review ✓';
        } else {
          markBtn.style.background = 'var(--card)';
          markBtn.style.borderColor = 'var(--border)';
          markBtn.style.color = 'var(--text)';
          document.getElementById('markReviewText').textContent = 'Mark for Review';
        }

        // Render 4 clickable option cards
        const optionsGrid = document.getElementById('focusOptionsGrid');
        optionsGrid.innerHTML = (q.options || []).map((opt, oIdx) => {
          const optKey = opt.key || opt.id || opt.letter || String.fromCharCode(65 + oIdx);
          const optText = opt.text !== undefined ? opt.text : (typeof opt === 'string' ? opt : '');
          const isSelected = String(this.userAnswers[q.id] || '').toUpperCase() === String(optKey).toUpperCase();
          const selectedClass = isSelected ? 'is-selected' : '';
          const formattedText = this.processQuestionContent(optText);

          return \`
            <button 
              type="button" 
              class="focus-option-btn \${selectedClass}" 
              data-qid="\${q.id}" 
              data-opt="\${optKey}"
              onclick="app.selectOption('\${q.id}', '\${optKey}')"
            >
              <span class="opt-circle">\${optKey}</span>
              <span style="flex: 1;">\${formattedText}</span>
            </button>
          \`;
        }).join('');

        // Update Prev / Next button states
        document.getElementById('btnPrevQuestion').disabled = this.currentQuestionIndex === 0;
        const nextBtn = document.getElementById('btnNextQuestion');
        if (this.currentQuestionIndex === totalQ - 1) {
          nextBtn.innerHTML = \`<span>Submit</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>\`;
        } else {
          nextBtn.innerHTML = \`<span>Next</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>\`;
        }

        // Update palette active indicator
        this.updatePaletteActiveItem();
      },

      /**
       * CRITICAL RULE: Selecting an answer does NOT move to next question.
       * Question stays on screen, updates answer, updates palette.
       */
      selectOption(qId, optKey) {
        if (this.examStatus !== 'in_progress') return;
        
        // If clicking the already selected option, keep it or allow re-selection
        this.userAnswers[qId] = optKey;

        // Re-render only options and palette state
        this.renderCurrentQuestion();
        this.renderFocusPalette();
        this.saveActiveExamState();
      },

      nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
          this.currentQuestionIndex++;
          this.renderCurrentQuestion();
          this.saveActiveExamState();
        } else {
          // On last question, clicking next triggers submit confirmation
          this.openSubmitConfirmation();
        }
      },

      prevQuestion() {
        if (this.currentQuestionIndex > 0) {
          this.currentQuestionIndex--;
          this.renderCurrentQuestion();
          this.saveActiveExamState();
        }
      },

      goToQuestion(idx) {
        if (idx >= 0 && idx < this.questions.length) {
          this.currentQuestionIndex = idx;
          this.renderCurrentQuestion();
          this.saveActiveExamState();
        }
      },

      toggleMarkForReview() {
        const q = this.questions[this.currentQuestionIndex];
        if (!q) return;

        if (this.markedQuestions[q.id]) {
          delete this.markedQuestions[q.id];
        } else {
          this.markedQuestions[q.id] = true;
        }

        this.renderCurrentQuestion();
        this.renderFocusPalette();
        this.saveActiveExamState();
      },

      // ----------------------------------------------------
      // QUESTION PALETTE & VISUAL STATES
      // ----------------------------------------------------
      renderFocusPalette() {
        const grid = document.getElementById('focusPaletteGrid');
        if (!grid || !this.questions) return;

        let answeredCount = 0;
        let markedCount = 0;

        grid.innerHTML = this.questions.map((q, idx) => {
          const isCurrent = idx === this.currentQuestionIndex;
          const isAnswered = this.userAnswers[q.id] !== undefined;
          const isMarked = !!this.markedQuestions[q.id];

          if (isAnswered) answeredCount++;
          if (isMarked) markedCount++;

          let stateClass = '';
          if (isMarked && isAnswered) {
            stateClass = 'p-marked-answered';
          } else if (isMarked) {
            stateClass = 'p-marked';
          } else if (isAnswered) {
            stateClass = 'p-answered';
          }
          if (isCurrent) stateClass += ' p-current';

          const flagDot = isMarked ? '<span class="p-flag-dot"></span>' : '';

          return \`
            <button 
              type="button" 
              class="palette-btn \${stateClass}" 
              onclick="app.goToQuestion(\${idx})"
              aria-label="Question \${idx + 1}"
            >
              \${String(idx + 1).padStart(2, '0')}
              \${flagDot}
            </button>
          \`;
        }).join('');

        const totalQ = this.questions.length;
        document.getElementById('sidebarAnsweredBadge').textContent = \`\${answeredCount} / \${totalQ}\`;
        const mobPalCount = document.getElementById('btnPalCount');
        if (mobPalCount) mobPalCount.textContent = \`\${answeredCount}/\${totalQ}\`;
      },

      updatePaletteActiveItem() {
        const grid = document.getElementById('focusPaletteGrid');
        if (!grid) return;
        const btns = grid.querySelectorAll('.palette-btn');
        btns.forEach((btn, idx) => {
          if (idx === this.currentQuestionIndex) {
            btn.classList.add('p-current');
          } else {
            btn.classList.remove('p-current');
          }
        });
      },

      // ----------------------------------------------------
      // ACCURATE CENTRALIZED TIMER & WARNING STATES
      // ----------------------------------------------------
      startCentralTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);

        const updateTimerDisplay = () => {
          if (this.examStatus !== 'in_progress') return;

          const elapsedSec = Math.floor((Date.now() - this.timerStartedAt) / 1000);
          this.remainingSeconds = Math.max(0, this.totalTimeSeconds - elapsedSec);

          const mm = Math.floor(this.remainingSeconds / 60);
          const ss = this.remainingSeconds % 60;
          const timeStr = \`\${String(mm).padStart(2, '0')}:\${String(ss).padStart(2, '0')}\`;

          const timerElem = document.getElementById('examCountdownTimer');
          if (timerElem) {
            timerElem.textContent = timeStr;

            // Timer Warning styling
            timerElem.className = '';
            if (this.remainingSeconds <= 60) {
              timerElem.classList.add('timer-critical');
            } else if (this.remainingSeconds <= 300) {
              timerElem.classList.add('timer-urgent');
            } else if (this.remainingSeconds <= 600) {
              timerElem.classList.add('timer-warning');
            } else {
              timerElem.classList.add('timer-normal');
            }
          }

          if (this.remainingSeconds <= 0) {
            clearInterval(this.timerInterval);
            this.autoSubmitOnTimeout();
          }
        };

        updateTimerDisplay();
        this.timerInterval = setInterval(updateTimerDisplay, 1000);
      },

      autoSubmitOnTimeout() {
        alert('⏰ পরীক্ষার নির্ধারিত সময় সমাপ্ত হয়েছে! আপনার উত্তরপত্রটি স্বয়ংক্রিয়ভাবে জমা নেওয়া হচ্ছে।');
        this.submitExamFinal(true);
      },

      // ----------------------------------------------------
      // AUTO-SAVE & RESUME EXAM PROGRESS
      // ----------------------------------------------------
      saveActiveExamState() {
        if (this.examStatus !== 'in_progress' || !this.currentExamId) return;
        const payload = {
          examId: this.currentExamId,
          examTitle: this.examTitle,
          currentQuestionIndex: this.currentQuestionIndex,
          userAnswers: this.userAnswers,
          markedQuestions: this.markedQuestions,
          totalTimeSeconds: this.totalTimeSeconds,
          timerStartedAt: this.timerStartedAt,
          savedAt: Date.now()
        };
        try {
          localStorage.setItem('medical_active_exam', JSON.stringify(payload));
        } catch (e) {}
      },

      checkResumePrompt() {
        try {
          const raw = localStorage.getItem('medical_active_exam');
          if (!raw) return;
          const data = JSON.parse(raw);
          if (data && data.examId && (Date.now() - data.savedAt < 24 * 3600 * 1000)) {
            document.getElementById('resumeExamTitle').textContent = data.examTitle || 'Medical Model Test';
            document.getElementById('resumeExamModal').classList.add('active');
          }
        } catch (e) {}
      },

      async resumeActiveExam() {
        document.getElementById('resumeExamModal').classList.remove('active');
        try {
          const raw = localStorage.getItem('medical_active_exam');
          if (!raw) return;
          const data = JSON.parse(raw);

          const examData = await this.fetchExamJson(data.examId);
          if (!examData || !examData.questions) return;

          this.questions = examData.questions.map((q, idx) => ({
            id: idx + 1,
            question: q.question,
            options: q.options,
            answer: q.correctAnswer || q.answer,
            explanation: q.explanation,
            subject: examData.category || 'General'
          }));

          this.examTitle = data.examTitle || examData.title;
          this.currentExamId = data.examId;
          this.currentQuestionIndex = data.currentQuestionIndex || 0;
          this.userAnswers = data.userAnswers || {};
          this.markedQuestions = data.markedQuestions || {};
          this.totalTimeSeconds = data.totalTimeSeconds || 3600;
          this.timerStartedAt = data.timerStartedAt || Date.now();

          this.startExamCommon();
        } catch (e) {
          console.error(e);
        }
      },

      discardResume() {
        document.getElementById('resumeExamModal').classList.remove('active');
        localStorage.removeItem('medical_active_exam');
      },

      // ----------------------------------------------------
      // SUBMIT CONFIRMATION & RESULTS CALCULATION
      // ----------------------------------------------------
      openSubmitConfirmation() {
        if (!this.questions) return;
        const total = this.questions.length;
        const answered = Object.keys(this.userAnswers).length;
        const unanswered = total - answered;
        const marked = Object.keys(this.markedQuestions).length;

        document.getElementById('subConfAnswered').textContent = answered;
        document.getElementById('subConfUnanswered').textContent = unanswered;
        document.getElementById('subConfMarked').textContent = marked;

        document.getElementById('submitConfirmModal').classList.add('active');
      },

      closeSubmitConfirmation() {
        document.getElementById('submitConfirmModal').classList.remove('active');
      },

      submitExamFinal(isTimeout = false) {
        this.closeSubmitConfirmation();
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.examStatus = 'completed';

        // Clear active auto-save
        localStorage.removeItem('medical_active_exam');

        let correctCount = 0;
        let wrongCount = 0;
        let skippedCount = 0;
        const wrongQuestionsList = [];

        const penaltyRate = this.negativeMark !== undefined ? this.negativeMark : 0.25;

        this.questions.forEach(q => {
          const userAns = this.userAnswers[q.id];
          const correctAns = this.normalizeLetter(q.answer || q.correctAnswer);

          if (userAns === undefined || userAns === null || userAns === '') {
            skippedCount++;
          } else if (this.normalizeLetter(userAns) === correctAns) {
            correctCount++;
          } else {
            wrongCount++;
            wrongQuestionsList.push({
              examId: this.currentExamId,
              examTitle: this.examTitle,
              questionId: q.id,
              question: q.question,
              options: q.options,
              selectedAnswer: userAns,
              correctAnswer: correctAns,
              explanation: q.explanation,
              subject: q.subject || this.currentExamCategory || 'General',
              timestamp: Date.now()
            });
          }
        });

        const totalQ = this.questions.length;
        const penaltyDeducted = wrongCount * penaltyRate;
        const netScore = Math.max(0, (correctCount * 1.0) - penaltyDeducted);
        const attempted = correctCount + wrongCount;
        const accuracy = attempted > 0 ? ((correctCount / attempted) * 100).toFixed(1) : 0;

        // Auto-save wrong questions to Error Bank
        this.saveToErrorBank(wrongQuestionsList);

        // Record attempt in History
        this.recordAttemptHistory({
          examId: this.currentExamId,
          examTitle: this.examTitle,
          score: netScore.toFixed(2),
          correct: correctCount,
          wrong: wrongCount,
          skipped: skippedCount,
          accuracy: accuracy + '%',
          totalQ,
          date: new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        });

        // Render Results Screen
        document.getElementById('resultExamTitle').textContent = this.examTitle;
        document.getElementById('resultNetScore').textContent = netScore.toFixed(2);
        document.getElementById('resTotalQ').textContent = totalQ;
        document.getElementById('resCorrect').textContent = correctCount;
        document.getElementById('resWrong').textContent = wrongCount;
        document.getElementById('resNegDeducted').textContent = '-' + penaltyDeducted.toFixed(2);
        document.getElementById('resSkipped').textContent = skippedCount;
        document.getElementById('resPercentage').textContent = ((netScore / totalQ) * 100).toFixed(1) + '%';
        document.getElementById('resMarks').textContent = netScore.toFixed(2);

        // Gauge Ring
        const ringPercent = Math.max(0, Math.min(100, Math.round((netScore / totalQ) * 100)));
        document.getElementById('resultRingGauge').style.setProperty('--percent', ringPercent);

        // Render Detailed Question-by-Question Review
        this.renderDetailedReview();

        // Header controls
        document.getElementById('headerExamControls').style.display = 'none';
        document.getElementById('headerSubmitBtn').style.display = 'none';

        this.showScreen('screenResult');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },

      // ----------------------------------------------------
      // ERROR BANK ENGINE (ভুল উত্তরের খাতা)
      // ----------------------------------------------------
      saveToErrorBank(newErrors) {
        if (!newErrors || newErrors.length === 0) return;
        try {
          const raw = localStorage.getItem('medical_error_bank') || '[]';
          let bank = JSON.parse(raw);
          if (!Array.isArray(bank)) bank = [];

          newErrors.forEach(err => {
            const existingIdx = bank.findIndex(b => b.examId === err.examId && b.questionId === err.questionId);
            if (existingIdx >= 0) {
              bank[existingIdx].attemptCount = (bank[existingIdx].attemptCount || 1) + 1;
              bank[existingIdx].wrongAttempts = (bank[existingIdx].wrongAttempts || 1) + 1;
              bank[existingIdx].selectedAnswer = err.selectedAnswer;
              bank[existingIdx].timestamp = Date.now();
            } else {
              bank.push({
                ...err,
                attemptCount: 1,
                wrongAttempts: 1,
                correctAttempts: 0
              });
            }
          });

          localStorage.setItem('medical_error_bank', JSON.stringify(bank));
        } catch (e) {
          console.error('Error saving to Error Bank:', e);
        }
      },

      openErrorBank() {
        const modal = document.getElementById('errorBankModal');
        if (!modal) return;
        
        this.renderErrorBankQuestions('all');
        modal.classList.add('active');
      },

      closeErrorBank() {
        document.getElementById('errorBankModal').classList.remove('active');
      },

      renderErrorBankQuestions(subjectFilter = 'all') {
        const raw = localStorage.getItem('medical_error_bank') || '[]';
        let bank = JSON.parse(raw);
        if (!Array.isArray(bank)) bank = [];

        document.getElementById('errBankTotalCount').textContent = bank.length;

        const filtered = subjectFilter === 'all' 
          ? bank 
          : bank.filter(b => (b.subject || '').toLowerCase().includes(subjectFilter.toLowerCase()));

        const container = document.getElementById('errorBankQuestionsList');
        if (filtered.length === 0) {
          container.innerHTML = \`
            <div style="text-align: center; padding: 40px; color: var(--muted);">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 12px; opacity: 0.5;"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              <div style="font-size: 1.1rem; font-weight: 700; color: var(--text);">কোনো ভুল উত্তর নেই!</div>
              <p style="font-size: 0.85rem; margin-top: 4px;">পরীক্ষায় ভুল হওয়া প্রশ্নগুলো স্বয়ংক্রিয়ভাবে এখানে সংরক্ষিত হবে।</p>
            </div>
          \`;
          return;
        }

        container.innerHTML = filtered.map((err, idx) => {
          const cleanQ = this.processQuestionContent(err.question);
          const cleanExp = this.processQuestionContent(err.explanation, true);

          return \`
            <div style="background: var(--bg-surface); padding: 18px 20px; border-radius: var(--radius-md); border: 1px solid var(--border); margin-bottom: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span class="badge badge-primary">\${err.subject || 'Medical'} • Q\${err.questionId}</span>
                <span style="font-size: 0.78rem; color: var(--danger); font-weight: 700;">Missed \${err.wrongAttempts || 1} time(s)</span>
              </div>
              <div style="font-weight: 700; font-size: 0.98rem; color: var(--text); margin-bottom: 12px;">\${cleanQ}</div>
              <div style="display: flex; gap: 10px; font-size: 0.85rem; margin-bottom: 10px;">
                <span style="color: var(--danger); font-weight: 700;">আপনার উত্তর: \${err.selectedAnswer || 'N/A'}</span>
                <span style="color: var(--success); font-weight: 700;">সঠিক উত্তর: \${err.correctAnswer}</span>
              </div>
              \${cleanExp ? \`<div class="explanation-box" style="font-size: 0.88rem; line-height: 1.6;">\${cleanExp}</div>\` : ''}
            </div>
          \`;
        }).join('');
      },

      startErrorBankRetake() {
        const raw = localStorage.getItem('medical_error_bank') || '[]';
        let bank = JSON.parse(raw);
        if (!Array.isArray(bank) || bank.length === 0) {
          alert('Error Bank এ কোনো প্রশ্ন নেই!');
          return;
        }

        this.closeErrorBank();

        this.questions = bank.map((b, idx) => ({
          id: idx + 1,
          question: b.question,
          options: b.options,
          answer: b.correctAnswer,
          explanation: b.explanation,
          subject: b.subject || 'Error Bank'
        }));

        this.examTitle = 'Error Bank Retake Session';
        this.currentExamId = 'error_bank_retake';
        this.currentExamCategory = 'Error Bank';
        this.currentExamCode = 'ERR';
        this.negativeMark = 0.25;
        this.totalTimeSeconds = this.questions.length * 60;
        this.remainingSeconds = this.totalTimeSeconds;
        this.timerStartedAt = Date.now();
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.markedQuestions = {};
        this.isErrorBankRetake = true;

        this.startExamCommon();
      },

      // ----------------------------------------------------
      // PERFORMANCE ANALYTICS & ATTEMPT HISTORY
      // ----------------------------------------------------
      recordAttemptHistory(attempt) {
        try {
          const raw = localStorage.getItem('medical_exam_history') || '[]';
          let history = JSON.parse(raw);
          if (!Array.isArray(history)) history = [];
          history.unshift(attempt);
          if (history.length > 50) history = history.slice(0, 50);
          localStorage.setItem('medical_exam_history', JSON.stringify(history));
        } catch (e) {}
      },

      openAnalytics() {
        const modal = document.getElementById('analyticsModal');
        if (!modal) return;

        try {
          const raw = localStorage.getItem('medical_exam_history') || '[]';
          const history = JSON.parse(raw) || [];

          const totalTests = history.length;
          let totalScore = 0;
          let bestScore = 0;
          let totalCorrect = 0;
          let totalAttempted = 0;

          history.forEach(h => {
            const sc = parseFloat(h.score) || 0;
            totalScore += sc;
            if (sc > bestScore) bestScore = sc;
            totalCorrect += (h.correct || 0);
            totalAttempted += ((h.correct || 0) + (h.wrong || 0));
          });

          const avgScore = totalTests > 0 ? (totalScore / totalTests).toFixed(1) : '0.00';
          const overallAcc = totalAttempted > 0 ? ((totalCorrect / totalAttempted) * 100).toFixed(1) + '%' : '0%';

          document.getElementById('anaTestsTaken').textContent = totalTests;
          document.getElementById('anaAvgScore').textContent = avgScore;
          document.getElementById('anaBestScore').textContent = bestScore.toFixed(1);
          document.getElementById('anaAccuracy').textContent = overallAcc;

          const historyList = document.getElementById('analyticsHistoryList');
          if (history.length === 0) {
            historyList.innerHTML = '<div style="text-align: center; color: var(--muted); padding: 20px;">No exam attempts recorded yet.</div>';
          } else {
            historyList.innerHTML = history.map(h => \`
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-md);">
                <div>
                  <div style="font-weight: 700; color: var(--text); font-size: 0.95rem;">\${h.examTitle}</div>
                  <div style="font-size: 0.78rem; color: var(--muted); margin-top: 2px;">\${h.date} • Correct: \${h.correct}, Wrong: \${h.wrong}, Skipped: \${h.skipped}</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 1.15rem; font-weight: 800; color: var(--primary);">\${h.score}</div>
                  <div style="font-size: 0.75rem; color: #8b5cf6; font-weight: 700;">\${h.accuracy}</div>
                </div>
              </div>
            \`).join('');
          }
        } catch (e) {}

        modal.classList.add('active');
      },

      closeAnalytics() {
        document.getElementById('analyticsModal').classList.remove('active');
      },
`;

// Insert the new methods before init()
const initRegex = /init\(\)\s*\{/;
html = html.replace(initRegex, `${controllerMethods}\n\n      init() {`);

// Add event bindings in init()
const bindingCode = `
        // Instructions modal bindings
        document.getElementById('btnCloseInstructions')?.addEventListener('click', () => this.closeInstructions());
        document.getElementById('btnCancelInstructions')?.addEventListener('click', () => this.closeInstructions());
        document.getElementById('btnConfirmStartExam')?.addEventListener('click', () => {
          if (this.pendingExamId) this.startExamFromCatalog(this.pendingExamId);
        });

        // Submit confirmation bindings
        document.getElementById('btnCloseSubmitConfirm')?.addEventListener('click', () => this.closeSubmitConfirmation());
        document.getElementById('btnContinueExam')?.addEventListener('click', () => this.closeSubmitConfirmation());
        document.getElementById('btnFinalSubmitExam')?.addEventListener('click', () => this.submitExamFinal(false));
        document.getElementById('headerSubmitBtn')?.addEventListener('click', () => this.openSubmitConfirmation());
        document.getElementById('sidebarSubmitBtn')?.addEventListener('click', () => this.openSubmitConfirmation());

        // Resume bindings
        document.getElementById('btnCloseResumeModal')?.addEventListener('click', () => this.discardResume());
        document.getElementById('btnDiscardResume')?.addEventListener('click', () => this.discardResume());
        document.getElementById('btnConfirmResume')?.addEventListener('click', () => this.resumeActiveExam());

        // Error bank & Analytics bindings
        document.getElementById('btnCloseErrorBank')?.addEventListener('click', () => this.closeErrorBank());
        document.getElementById('btnStartErrorBankRetake')?.addEventListener('click', () => this.startErrorBankRetake());
        document.getElementById('btnCloseAnalytics')?.addEventListener('click', () => this.closeAnalytics());

        // Single-Question navigation bindings
        document.getElementById('btnNextQuestion')?.addEventListener('click', () => this.nextQuestion());
        document.getElementById('btnPrevQuestion')?.addEventListener('click', () => this.prevQuestion());
        document.getElementById('btnToggleMarkReview')?.addEventListener('click', () => this.toggleMarkForReview());

        // Keyboard Shortcuts (A, B, C, D, Left, Right, M)
        window.addEventListener('keydown', (e) => {
          if (this.examStatus !== 'in_progress') return;
          const tag = (e.target.tagName || '').toLowerCase();
          if (tag === 'input' || tag === 'textarea') return;

          const key = e.key.toUpperCase();
          if (['A', 'B', 'C', 'D'].includes(key)) {
            const q = this.questions[this.currentQuestionIndex];
            if (q) this.selectOption(q.id, key);
          } else if (e.key === 'ArrowRight') {
            this.nextQuestion();
          } else if (e.key === 'ArrowLeft') {
            this.prevQuestion();
          } else if (key === 'M') {
            this.toggleMarkForReview();
          }
        });

        // Check for resume on load
        setTimeout(() => this.checkResumePrompt(), 500);
`;

html = html.replace('// Initialize app', `${bindingCode}\n        // Initialize app`);

fs.writeFileSync(indexPath, html, 'utf-8');
console.log('✅ Exam controller methods and event bindings successfully wired into index.html');
