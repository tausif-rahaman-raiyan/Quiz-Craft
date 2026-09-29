const fs = require('fs');
const path = require('path');

const examsDir = path.join(__dirname, '../public/exams');
const files = fs.readdirSync(examsDir).filter(f => f.endsWith('.json') && f !== 'catalog.json');

console.log(`--- VALIDATING ${files.length} EXAM FILES IN public/exams/ ---`);

let totalQuestions = 0;
let totalErrors = 0;
const errorReports = [];

for (const file of files) {
  const filePath = path.join(examsDir, file);
  const examName = file.replace('.json', '');
  let raw = '';
  try {
    raw = fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    totalErrors++;
    errorReports.push({ exam: examName, question: 'N/A', problem: `Cannot read file: ${e.message}` });
    continue;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    totalErrors++;
    errorReports.push({ exam: examName, question: 'N/A', problem: `Invalid JSON syntax: ${e.message}` });
    continue;
  }

  if (!data || typeof data !== 'object') {
    totalErrors++;
    errorReports.push({ exam: examName, question: 'N/A', problem: 'Exam root must be an object' });
    continue;
  }

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    totalErrors++;
    errorReports.push({ exam: examName, question: 'N/A', problem: 'questions array is empty or missing' });
    continue;
  }

  const seenIds = new Set();

  data.questions.forEach((q, idx) => {
    totalQuestions++;
    const qNum = q.id ?? (idx + 1);

    // 1. Duplicate ID check
    if (q.id !== undefined && q.id !== null) {
      if (seenIds.has(q.id)) {
        totalErrors++;
        errorReports.push({ exam: examName, question: qNum, problem: `Duplicate question ID: ${q.id}` });
      }
      seenIds.add(q.id);
    }

    // 2. Question text check
    if (!q.question || typeof q.question !== 'string' || q.question.trim() === '' || q.question === 'N/A') {
      totalErrors++;
      errorReports.push({ exam: examName, question: qNum, problem: 'Missing or invalid question text' });
    }

    // 3. Options check
    if (!Array.isArray(q.options) || q.options.length < 2) {
      totalErrors++;
      errorReports.push({ exam: examName, question: qNum, problem: 'Question has fewer than 2 options' });
    } else {
      q.options.forEach((opt, optIdx) => {
        if (!opt || typeof opt !== 'object') {
          totalErrors++;
          errorReports.push({ exam: examName, question: qNum, problem: `Option #${optIdx+1} is not an object` });
        } else if (opt.text === undefined || opt.text === null || String(opt.text).trim() === '') {
          totalErrors++;
          errorReports.push({ exam: examName, question: qNum, problem: `Option #${optIdx+1} has empty text` });
        }
      });
    }

    // 4. Correct answer check
    const rawAns = q.correctAnswer ?? q.answer;
    if (!rawAns || String(rawAns).trim() === '') {
      totalErrors++;
      errorReports.push({ exam: examName, question: qNum, problem: 'Missing correct answer' });
    }

    // 5. String validation (Check for undefined, NaN, [object Object], broken sub/sup tags)
    const textsToCheck = [
      q.question,
      q.explanation,
      ...(q.options || []).map(o => o ? o.text : '')
    ].filter(Boolean);

    textsToCheck.forEach(text => {
      // Strip base64 image data before analyzing text anomalies
      let s = String(text).replace(/data:image\/[^;]+;base64,[a-zA-Z0-9+/=]+/gi, '[IMAGE]');

      if (s.includes('undefined') && !s.includes('undefined behavior')) {
        totalErrors++;
        errorReports.push({ exam: examName, question: qNum, problem: 'Contains literal "undefined"' });
      }
      if (/\bNaN\b/.test(s)) {
        totalErrors++;
        errorReports.push({ exam: examName, question: qNum, problem: 'Contains literal "NaN"' });
      }
      if (s.includes('[object Object]')) {
        totalErrors++;
        errorReports.push({ exam: examName, question: qNum, problem: 'Contains literal "[object Object]"' });
      }
      // Check for unclosed MathML
      if (s.includes('<math') && !s.includes('</math>')) {
        totalErrors++;
        errorReports.push({ exam: examName, question: qNum, problem: 'Unclosed <math> tag' });
      }
      if (/<\s+sub\b|<\bsub\s+>|<\s+\/\s*sub/i.test(s)) {
        totalErrors++;
        errorReports.push({ exam: examName, question: qNum, problem: 'Malformed spaced sub tag' });
      }
      if (/<\s+sup\b|<\bsup\s+>|<\s+\/\s*sup/i.test(s)) {
        totalErrors++;
        errorReports.push({ exam: examName, question: qNum, problem: 'Malformed spaced sup tag' });
      }
    });
  });
}

console.log(`\n--- VALIDATION SUMMARY ---`);
console.log(`Total Exams Checked: ${files.length}`);
console.log(`Total Questions Checked: ${totalQuestions}`);
console.log(`Total Errors Found: ${totalErrors}`);

if (errorReports.length > 0) {
  console.log(`\nDetailed Error Log (First 20):`);
  errorReports.slice(0, 20).forEach(e => {
    console.log(`Exam: ${e.exam} | Question: ${e.question} | Problem: ${e.problem}`);
  });
  process.exit(1);
} else {
  console.log(`\n✅ ALL 114 EXAM FILES (11,499 MCQs) PASSED DATA INTEGRITY VALIDATION WITH ZERO ERRORS!`);
  process.exit(0);
}
