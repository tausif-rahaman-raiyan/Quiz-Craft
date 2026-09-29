const fs = require('fs');
const path = require('path');

// Target directories
const searchDirs = [
  path.join(__dirname, '../public/exams'),
  path.join(__dirname, '../exams')
].filter(d => fs.existsSync(d));

console.log('--- STARTING COMPREHENSIVE EXAM AUDIT & AUTO-REPAIR ---');
console.log('Scanning directories:', searchDirs);

let totalFilesChecked = 0;
let totalQuestionsChecked = 0;
let totalCorrectionsMade = 0;
let corruptedFilesFixed = 0;

function cleanString(str) {
  if (typeof str !== 'string') return '';
  return str.trim();
}

function normalizeOptions(options, rawAnswer) {
  let corrections = 0;
  let normalized = [];

  if (!Array.isArray(options)) {
    // If missing or not array, create dummy options
    options = [
      { key: 'A', text: 'Option A' },
      { key: 'B', text: 'Option B' },
      { key: 'C', text: 'Option C' },
      { key: 'D', text: 'Option D' }
    ];
    corrections++;
  }

  const defaultKeys = ['A', 'B', 'C', 'D', 'E', 'F'];

  normalized = options.map((opt, idx) => {
    const key = defaultKeys[idx] || String.fromCharCode(65 + idx);
    if (typeof opt === 'string') {
      return { key: key, text: cleanString(opt) };
    } else if (typeof opt === 'object' && opt !== null) {
      return {
        key: opt.key ? cleanString(opt.key).toUpperCase() : key,
        text: cleanString(opt.text || opt.value || opt.option || '')
      };
    }
    return { key: key, text: `Option ${key}` };
  });

  // Ensure all keys are populated
  normalized.forEach((opt, idx) => {
    if (!opt.key) {
      opt.key = defaultKeys[idx] || String.fromCharCode(65 + idx);
      corrections++;
    }
  });

  return { options: normalized, corrections };
}

function normalizeAnswer(rawAnswer, options) {
  let corrections = 0;
  if (!rawAnswer) {
    return { answer: 'A', corrections: 1 };
  }

  let ans = String(rawAnswer).trim().toUpperCase();

  // If answer is full text matching an option
  const matchedByKey = options.find(o => o.key.toUpperCase() === ans);
  if (matchedByKey) {
    return { answer: matchedByKey.key, corrections: 0 };
  }

  const matchedByText = options.find(o => o.text && o.text.trim().toLowerCase() === String(rawAnswer).trim().toLowerCase());
  if (matchedByText) {
    return { answer: matchedByText.key, corrections: 1 };
  }

  // If numeric index (0, 1, 2, 3 or 1, 2, 3, 4)
  if (/^[0-9]+$/.test(ans)) {
    const num = parseInt(ans, 10);
    if (num >= 1 && num <= options.length) {
      return { answer: options[num - 1].key, corrections: 1 };
    } else if (num >= 0 && num < options.length) {
      return { answer: options[num].key, corrections: 1 };
    }
  }

  // Default to first option if unrecognized
  const validKeys = options.map(o => o.key.toUpperCase());
  if (!validKeys.includes(ans)) {
    return { answer: options[0] ? options[0].key : 'A', corrections: 1 };
  }

  return { answer: ans, corrections: 0 };
}

function auditAndRepairFile(filePath) {
  totalFilesChecked++;
  let fileCorrections = 0;
  let rawContent;

  try {
    rawContent = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error(`Cannot read file: ${filePath}`, err);
    return;
  }

  let data;
  try {
    data = JSON.parse(rawContent);
  } catch (err) {
    console.warn(`Attempting to repair malformed JSON in ${filePath}...`);
    // Basic repair for trailing commas or escape errors
    try {
      const sanitized = rawContent
        .replace(/,\s*([\]}])/g, '$1') // remove trailing commas
        .replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // remove non-printable control chars
      data = JSON.parse(sanitized);
      fileCorrections++;
      corruptedFilesFixed++;
    } catch (e2) {
      console.error(`Unrecoverable JSON error in ${filePath}:`, e2.message);
      return;
    }
  }

  if (typeof data !== 'object' || data === null) {
    console.error(`Invalid structure in ${filePath}`);
    return;
  }

  // Handle if data is just an array of questions or full exam object
  let isArray = Array.isArray(data);
  let examObj = isArray ? { questions: data } : data;

  if (!Array.isArray(examObj.questions)) {
    examObj.questions = [];
    fileCorrections++;
  }

  // Validate questions
  const repairedQuestions = [];
  for (let i = 0; i < examObj.questions.length; i++) {
    totalQuestionsChecked++;
    const rawQ = examObj.questions[i];
    if (!rawQ || typeof rawQ !== 'object') continue;

    let qText = cleanString(rawQ.question || rawQ.title || rawQ.q || '');
    if (!qText) {
      qText = `Question ${i + 1}`;
      fileCorrections++;
    }

    const { options, corrections: optCorr } = normalizeOptions(rawQ.options, rawQ.correctAnswer || rawQ.answer);
    fileCorrections += optCorr;

    const rawAns = rawQ.correctAnswer || rawQ.answer || rawQ.correct || 'A';
    const { answer, corrections: ansCorr } = normalizeAnswer(rawAns, options);
    fileCorrections += ansCorr;

    const explanation = cleanString(rawQ.explanation || rawQ.explain || rawQ.solution || '');

    repairedQuestions.push({
      id: i + 1,
      question: qText,
      options: options,
      correctAnswer: answer,
      explanation: explanation
    });
  }

  examObj.questions = repairedQuestions;

  // Metadata verification
  if (!examObj.title && !isArray) {
    examObj.title = path.basename(filePath, '.json');
    fileCorrections++;
  }
  if (!examObj.durationMinutes) {
    examObj.durationMinutes = 50;
  }
  if (!examObj.negativeMarking && examObj.negativeMarking !== 0) {
    examObj.negativeMarking = 0.25;
  }
  if (!examObj.totalMarks) {
    examObj.totalMarks = repairedQuestions.length;
  }

  // Write back if corrected or if format needed clean standard JSON
  const outputJson = JSON.stringify(examObj, null, 2);
  if (fileCorrections > 0 || outputJson !== rawContent) {
    fs.writeFileSync(filePath, outputJson, 'utf-8');
    totalCorrectionsMade += fileCorrections;
  }
}

// 1. Run audit on all exam files
for (const dir of searchDirs) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'catalog.json');
  for (const f of files) {
    auditAndRepairFile(path.join(dir, f));
  }
}

// 2. Audit and update catalog.json
const catalogPath = path.join(__dirname, '../public/exams/catalog.json');
if (fs.existsSync(catalogPath)) {
  try {
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
    let catalogCorrections = 0;
    for (const item of catalog) {
      const examFile = path.join(__dirname, '../public', item.file || `exams/${item.id}.json`);
      if (fs.existsSync(examFile)) {
        try {
          const exData = JSON.parse(fs.readFileSync(examFile, 'utf-8'));
          if (exData.questions) {
            if (item.questionCount !== exData.questions.length) {
              item.questionCount = exData.questions.length;
              catalogCorrections++;
            }
          }
        } catch (e) {}
      }
    }
    if (catalogCorrections > 0) {
      fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf-8');
      console.log(`Updated catalog.json with ${catalogCorrections} count syncs.`);
    }
  } catch (err) {
    console.error('Error syncing catalog:', err);
  }
}

console.log('\n=========================================');
console.log('✅ EXAM AUDIT & REPAIR COMPLETED!');
console.log(`- Total Files Audited: ${totalFilesChecked}`);
console.log(`- Total Questions Audited: ${totalQuestionsChecked.toLocaleString()}`);
console.log(`- Total Auto-Corrections Made: ${totalCorrectionsMade}`);
console.log(`- Corrupted Files Repaired: ${corruptedFilesFixed}`);
console.log('=========================================\n');
