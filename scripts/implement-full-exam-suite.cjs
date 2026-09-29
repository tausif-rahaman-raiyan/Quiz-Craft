const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../index.html');
let html = fs.readFileSync(indexPath, 'utf-8');

console.log('--- IMPLEMENTING FULL ADMISSION EXAM ENGINE & SUITE ---');

// 1. Ensure CSS has all necessary styles for single-question view, palette states, timer warnings, error bank & analytics
const extraCss = `
  /* Single Question Focus & Palette Styles */
  .exam-focus-layout {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 24px;
    align-items: start;
    max-width: 1400px;
    margin: 0 auto;
    padding: 16px 20px 40px;
  }
  @media (max-width: 1024px) {
    .exam-focus-layout {
      grid-template-columns: 1fr;
      padding: 12px 14px 100px;
    }
  }

  .focus-q-card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 28px 32px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  }
  @media (max-width: 640px) {
    .focus-q-card {
      padding: 18px 16px;
    }
  }

  .focus-q-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
    gap: 10px;
  }

  .focus-q-title {
    font-size: 1.18rem;
    font-weight: 700;
    line-height: 1.6;
    color: var(--text);
    margin-bottom: 24px;
  }

  .focus-options-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }

  .focus-option-btn {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 18px;
    border-radius: var(--radius-md);
    background: var(--card);
    border: 1.5px solid var(--border);
    color: var(--text);
    font-size: 1rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.15s ease;
    width: 100%;
    user-select: none;
  }
  .focus-option-btn:hover {
    border-color: var(--primary);
    background: var(--primary-light);
  }
  .focus-option-btn.is-selected {
    border-color: var(--primary);
    background: var(--primary-light);
    box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.2);
    font-weight: 600;
  }
  .focus-option-btn .opt-circle {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 700;
    flex-shrink: 0;
    background: var(--bg-surface);
    color: var(--text);
    transition: all 0.15s ease;
  }
  .focus-option-btn.is-selected .opt-circle {
    background: var(--primary);
    border-color: var(--primary);
    color: #fff;
  }

  /* Palette grid items & 5 distinct states */
  .palette-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    max-height: 380px;
    overflow-y: auto;
    padding: 4px;
  }
  .palette-btn {
    aspect-ratio: 1;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--bg-surface);
    color: var(--text);
    font-size: 0.82rem;
    font-weight: 700;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    transition: all 0.15s ease;
  }
  .palette-btn:hover {
    border-color: var(--primary);
  }
  .palette-btn.p-current {
    box-shadow: 0 0 0 2px var(--primary);
    border-color: var(--primary);
  }
  .palette-btn.p-answered {
    background: var(--primary);
    border-color: var(--primary);
    color: #fff;
  }
  .palette-btn.p-marked {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.15);
    color: #d97706;
  }
  .palette-btn.p-marked-answered {
    background: #8b5cf6;
    border-color: #7c3aed;
    color: #fff;
  }
  .palette-btn .p-flag-dot {
    position: absolute;
    top: 3px;
    right: 3px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #f59e0b;
  }

  /* Timer Warning Colors */
  .timer-normal { color: var(--primary); }
  .timer-warning { color: #d97706; background: rgba(217, 119, 6, 0.1); }
  .timer-urgent { color: #ea580c; background: rgba(234, 88, 12, 0.15); }
  .timer-critical { color: #dc2626; background: rgba(220, 38, 38, 0.2); animation: pulse 1s infinite; }
`;

if (!html.includes('.exam-focus-layout')) {
  html = html.replace('</style>', `${extraCss}\n</style>`);
}

// 2. Add Instructions Modal, Resume Modal, Submit Confirmation Modal, Error Bank Modal, Analytics Modal
const modalsHtml = `
  <!-- ==========================================================================
       MODALS: INSTRUCTIONS, RESUME, SUBMIT CONFIRMATION, ERROR BANK, ANALYTICS
       ========================================================================== -->

  <!-- Exam Start Instructions Modal -->
  <div class="modal-backdrop" id="instructionsModal" role="dialog" aria-modal="true">
    <div class="modal-card" style="max-width: 540px;">
      <div class="modal-header">
        <div>
          <span class="badge badge-primary" id="instSubjectBadge">Medical Admission</span>
          <h3 style="font-size: 1.3rem; font-weight: 800; margin-top: 4px; color: var(--text);" id="instExamTitle">Exam Instructions</h3>
        </div>
        <button class="btn btn-icon" id="btnCloseInstructions" aria-label="Close">✕</button>
      </div>
      <div style="padding: 20px 24px;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
          <div style="background: var(--card); padding: 12px; border-radius: var(--radius-md); text-align: center; border: 1px solid var(--border);">
            <div style="font-size: 0.75rem; color: var(--muted); text-transform: uppercase;">Questions</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--text);" id="instQuestionCount">100</div>
          </div>
          <div style="background: var(--card); padding: 12px; border-radius: var(--radius-md); text-align: center; border: 1px solid var(--border);">
            <div style="font-size: 0.75rem; color: var(--muted); text-transform: uppercase;">Duration</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--primary);" id="instDuration">60 Min</div>
          </div>
          <div style="background: var(--card); padding: 12px; border-radius: var(--radius-md); text-align: center; border: 1px solid var(--border);">
            <div style="font-size: 0.75rem; color: var(--muted); text-transform: uppercase;">Penalty</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--danger);" id="instNegativeMark">-0.25</div>
          </div>
        </div>

        <div style="font-size: 0.9rem; line-height: 1.7; color: var(--text); background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 18px; margin-bottom: 22px;">
          <strong style="color: var(--text); display: block; margin-bottom: 6px;">পরীক্ষার নিয়মাবলী ও নির্দেশিকা:</strong>
          <ul style="margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 4px; color: var(--text-secondary);">
            <li>প্রতিটি সঠিক উত্তরের জন্য <strong style="color: var(--success);">+১.০০</strong> নম্বর যোগ হবে।</li>
            <li>প্রতিটি ভুল উত্তরের জন্য <strong style="color: var(--danger);"><span id="instPenaltyBullet">০.২৫</span></strong> নেগেটিভ মার্ক কর্তন হবে।</li>
            <li>কোনো উত্তর না দিলে (Skip) কোনো নেগেটিভ মার্ক কাটা যাবে না।</li>
            <li>সাবমিট করার পূর্ব পর্যন্ত যেকোনো সময় উত্তর পরিবর্তন বা Review-র জন্য Mark করা যাবে।</li>
            <li>নির্দিষ্ট সময় শেষ হলে স্বয়ংক্রিয়ভাবে পরীক্ষা সাবমিট হয়ে যাবে।</li>
          </ul>
        </div>

        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="btn btn-secondary" id="btnCancelInstructions">বাতিল</button>
          <button class="btn btn-primary" id="btnConfirmStartExam" style="padding: 10px 24px; font-weight: 700;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span>Start Exam</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Submit Confirmation Modal -->
  <div class="modal-backdrop" id="submitConfirmModal" role="dialog" aria-modal="true">
    <div class="modal-card" style="max-width: 480px;">
      <div class="modal-header">
        <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text);">Submit Examination?</h3>
        <button class="btn btn-icon" id="btnCloseSubmitConfirm">✕</button>
      </div>
      <div style="padding: 20px 24px;">
        <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 16px;">
          আপনি কি নিশ্চিত যে পরীক্ষাটি সমাপ্ত করে সাবমিট করতে চান?
        </p>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 22px;">
          <div style="background: rgba(13, 148, 136, 0.1); padding: 12px; border-radius: var(--radius-md); text-align: center; border: 1px solid rgba(13, 148, 136, 0.2);">
            <div style="font-size: 0.72rem; color: var(--muted); text-transform: uppercase;">Answered</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--primary);" id="subConfAnswered">0</div>
          </div>
          <div style="background: rgba(239, 68, 68, 0.1); padding: 12px; border-radius: var(--radius-md); text-align: center; border: 1px solid rgba(239, 68, 68, 0.2);">
            <div style="font-size: 0.72rem; color: var(--muted); text-transform: uppercase;">Unanswered</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--danger);" id="subConfUnanswered">0</div>
          </div>
          <div style="background: rgba(245, 158, 11, 0.1); padding: 12px; border-radius: var(--radius-md); text-align: center; border: 1px solid rgba(245, 158, 11, 0.2);">
            <div style="font-size: 0.72rem; color: var(--muted); text-transform: uppercase;">Marked</div>
            <div style="font-size: 1.25rem; font-weight: 800; color: #d97706;" id="subConfMarked">0</div>
          </div>
        </div>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="btn btn-secondary" id="btnContinueExam">Continue Exam</button>
          <button class="btn btn-primary" id="btnFinalSubmitExam" style="background: var(--danger); border-color: var(--danger); font-weight: 700;">
            Yes, Submit Now
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Resume Exam Modal -->
  <div class="modal-backdrop" id="resumeExamModal" role="dialog" aria-modal="true">
    <div class="modal-card" style="max-width: 460px;">
      <div class="modal-header">
        <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text);">Resume In-Progress Exam?</h3>
        <button class="btn btn-icon" id="btnCloseResumeModal">✕</button>
      </div>
      <div style="padding: 20px 24px;">
        <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 16px;">
          আপনার পূর্বের একটি পরীক্ষা অসম্পূর্ণ অবস্থায় রয়েছে (<strong id="resumeExamTitle"></strong>)। আপনি কি সেখান থেকে পরীক্ষা চালিয়ে যেতে চান?
        </p>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="btn btn-secondary" id="btnDiscardResume">Start Fresh</button>
          <button class="btn btn-primary" id="btnConfirmResume">Resume Exam</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Error Bank Modal -->
  <div class="modal-backdrop" id="errorBankModal" role="dialog" aria-modal="true">
    <div class="modal-card" style="max-width: 800px; max-height: 85vh; display: flex; flex-direction: column;">
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text); margin: 0;">Error Bank (ভুল উত্তরের খাতা)</h3>
            <span style="font-size: 0.8rem; color: var(--muted);"><span id="errBankTotalCount">0</span> Questions saved for revision</span>
          </div>
        </div>
        <button class="btn btn-icon" id="btnCloseErrorBank">✕</button>
      </div>
      <div style="padding: 16px 24px; border-bottom: 1px solid var(--border); display: flex; gap: 10px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
        <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="errBankSubjectFilters">
          <button class="btn btn-xs btn-primary err-filter-btn" data-subject="all">All</button>
          <button class="btn btn-xs btn-secondary err-filter-btn" data-subject="Physics">Physics</button>
          <button class="btn btn-xs btn-secondary err-filter-btn" data-subject="Chemistry">Chemistry</button>
          <button class="btn btn-xs btn-secondary err-filter-btn" data-subject="Biology">Biology</button>
        </div>
        <button class="btn btn-primary btn-sm" id="btnStartErrorBankRetake" style="font-weight: 700;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>Retake Wrong Questions</span>
        </button>
      </div>
      <div style="padding: 20px 24px; overflow-y: auto; flex: 1;" id="errorBankQuestionsList">
        <!-- Error items injected dynamically -->
      </div>
    </div>
  </div>

  <!-- Performance Analytics Modal -->
  <div class="modal-backdrop" id="analyticsModal" role="dialog" aria-modal="true">
    <div class="modal-card" style="max-width: 750px; max-height: 85vh; overflow-y: auto;">
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text); margin: 0;">Performance & Analytics Dashboard</h3>
            <span style="font-size: 0.8rem; color: var(--muted);">Real-time tracking of test performance</span>
          </div>
        </div>
        <button class="btn btn-icon" id="btnCloseAnalytics">✕</button>
      </div>
      <div style="padding: 20px 24px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 24px;">
          <div style="background: var(--card); padding: 14px; border-radius: var(--radius-md); text-align: center; border: 1px solid var(--border);">
            <div style="font-size: 0.75rem; color: var(--muted); text-transform: uppercase;">Tests Taken</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--text);" id="anaTestsTaken">0</div>
          </div>
          <div style="background: var(--card); padding: 14px; border-radius: var(--radius-md); text-align: center; border: 1px solid var(--border);">
            <div style="font-size: 0.75rem; color: var(--muted); text-transform: uppercase;">Average Score</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--primary);" id="anaAvgScore">0.00</div>
          </div>
          <div style="background: var(--card); padding: 14px; border-radius: var(--radius-md); text-align: center; border: 1px solid var(--border);">
            <div style="font-size: 0.75rem; color: var(--muted); text-transform: uppercase;">Best Score</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--success);" id="anaBestScore">0.00</div>
          </div>
          <div style="background: var(--card); padding: 14px; border-radius: var(--radius-md); text-align: center; border: 1px solid var(--border);">
            <div style="font-size: 0.75rem; color: var(--muted); text-transform: uppercase;">Accuracy</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: #8b5cf6;" id="anaAccuracy">0%</div>
          </div>
        </div>

        <h4 style="font-size: 1rem; font-weight: 800; margin-bottom: 12px; color: var(--text);">Exam History (বিগত পরীক্ষার রেকর্ড)</h4>
        <div id="analyticsHistoryList" style="display: flex; flex-direction: column; gap: 8px;">
          <!-- Past attempts rendered here -->
        </div>
      </div>
    </div>
  </div>
`;

if (!html.includes('id="instructionsModal"')) {
  html = html.replace('</body>', `${modalsHtml}\n</body>`);
}

// 3. Upgrade screenExam HTML with single question focus + responsive palette
const newScreenExamHtml = `  <!-- ==========================================================================
       SCREEN 2: REAL ADMISSION EXAM INTERFACE (SINGLE QUESTION FOCUS + PALETTE)
       ========================================================================== -->
  <main class="screen" id="screenExam">
    <div class="exam-focus-layout">
      <!-- Main Active Question Container -->
      <section class="focus-q-card">
        <div class="focus-q-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span class="badge badge-primary" id="activeQNumberBadge" style="font-size: 0.88rem; font-weight: 800; padding: 6px 12px;">Question 1 / 100</span>
            <span style="font-size: 0.82rem; color: var(--muted);" id="activeExamCodeText">Medical Test</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <button class="btn btn-sm" id="btnToggleMarkReview" style="background: var(--card); border: 1px solid var(--border); font-size: 0.82rem;">
              <span id="markReviewIcon">🔖</span> <span id="markReviewText">Mark for Review</span>
            </button>
          </div>
        </div>

        <!-- Question Statement -->
        <div class="focus-q-title" id="focusQuestionTitle">Loading question...</div>

        <!-- 4 Clickable Options -->
        <div class="focus-options-grid" id="focusOptionsGrid"></div>

        <!-- Navigation Buttons -->
        <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 20px; flex-wrap: wrap; gap: 10px;">
          <button class="btn btn-secondary" id="btnPrevQuestion" style="padding: 10px 20px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            <span>Previous</span>
          </button>
          
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" id="btnMobilePaletteToggle" style="display: none;">
              <span>📋 Palette (<span id="btnPalCount">0/100</span>)</span>
            </button>
            <button class="btn btn-primary" id="btnNextQuestion" style="padding: 10px 22px;">
              <span>Next</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </section>

      <!-- Question Palette Sidebar -->
      <aside class="exam-sidebar-sticky" id="examSidebarPalette">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <span style="font-weight: 800; font-size: 0.95rem; color: var(--text);">Question Palette</span>
          <span class="badge badge-primary" id="sidebarAnsweredBadge">0 / 100</span>
        </div>

        <!-- Palette Grid -->
        <div class="palette-grid" id="focusPaletteGrid"></div>

        <!-- Palette Legend -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.72rem; color: var(--text-secondary); border-top: 1px solid var(--border); padding-top: 10px; margin-top: 12px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="width: 10px; height: 10px; border-radius: 2px; background: var(--primary);"></span>
            <span>Answered</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="width: 10px; height: 10px; border-radius: 2px; background: var(--bg-surface); border: 1px solid var(--border);"></span>
            <span>Unanswered</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="width: 10px; height: 10px; border-radius: 2px; background: rgba(245, 158, 11, 0.2); border: 1px solid #f59e0b;"></span>
            <span>Marked</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="width: 10px; height: 10px; border-radius: 2px; background: #8b5cf6;"></span>
            <span>Ans + Marked</span>
          </div>
        </div>

        <button class="btn btn-primary" id="sidebarSubmitBtn" style="width: 100%; margin-top: 14px; background: var(--danger); border-color: var(--danger); font-weight: 700;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Submit Exam</span>
        </button>
      </aside>
    </div>
  </main>`;

const screenExamRegex = /<main class="screen" id="screenExam">[\s\S]*?<\/main>/;
html = html.replace(screenExamRegex, newScreenExamHtml);

fs.writeFileSync(indexPath, html, 'utf-8');
console.log('✅ Updated index.html markup with single-question view, modals, and palette');
