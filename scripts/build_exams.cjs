const fs = require('fs');
const path = require('path');

const win1252Map = {
  '\u20AC': 0x80, '\u201A': 0x82, '\u0192': 0x83, '\u201E': 0x84,
  '\u2026': 0x85, '\u2020': 0x86, '\u2021': 0x87, '\u02C6': 0x88,
  '\u2030': 0x89, '\u0160': 0x8A, '\u2039': 0x8B, '\u0152': 0x8C,
  '\u017D': 0x8E, '\u2018': 0x91, '\u2019': 0x92, '\u201C': 0x93,
  '\u201D': 0x94, '\u2022': 0x95, '\u2013': 0x96, '\u2014': 0x97,
  '\u02DC': 0x98, '\u2122': 0x99, '\u0161': 0x9A, '\u203A': 0x9B,
  '\u0153': 0x9C, '\u017E': 0x9E, '\u0178': 0x9F
};

function fixEncoding(str) {
  if (!str || typeof str !== 'string') return '';
  // 1. Decode numeric and hex HTML entities
  let s = str.replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
             .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

  // 2. Decode mojibake bytes (UTF-8 bytes read as windows-1252/latin1)
  s = s.replace(/(?:[\u0080-\u00FF]|\u20AC|\u201A|\u0192|\u201E|\u2026|\u2020|\u2021|\u02C6|\u2030|\u0160|\u2039|\u0152|\u017D|\u2018|\u2019|\u201C|\u201D|\u2022|\u2013|\u2014|\u02DC|\u2122|\u0161|\u203A|\u0153|\u017E|\u0178)+/g, (match) => {
    const bytes = [];
    for (let i = 0; i < match.length; i++) {
      const ch = match[i];
      if (win1252Map[ch] !== undefined) {
        bytes.push(win1252Map[ch]);
      } else {
        bytes.push(ch.charCodeAt(0) & 0xFF);
      }
    }
    try {
      const decoded = Buffer.from(bytes).toString('utf8');
      return decoded.includes('\uFFFD') ? match : decoded;
    } catch (e) {
      return match;
    }
  });

  return s;
}

function cleanHtmlContent(html, isOption = false) {
  if (!html) return '';
  let str = fixEncoding(html).trim();

  // Strip empty tags
  str = str.replace(/<(?:p|div|span)[^>]*>\s*(?:<br\s*\/?>)?\s*<\/(?:p|div|span)>/gi, '');

  if (isOption) {
    // For options: unwrap outer divs/spans/p but leave inner tags (b, i, math, sub, sup)
    str = str.replace(/^<span><div><p>/i, '').replace(/<\/p><\/div><\/span>$/i, '');
    str = str.replace(/^<div><p>/i, '').replace(/<\/p><\/div>$/i, '');
    str = str.replace(/^<p>/i, '').replace(/<\/p>$/i, '');
    str = str.replace(/^<span>/i, '').replace(/<\/span>$/i, '');
  }

  // Strip excessive breaks
  str = str.replace(/(?:<br\s*\/?>\s*){3,}/gi, '<br><br>');
  return str.trim();
}

function categorizeExam(title, filename) {
  const t = title.toLowerCase();
  const f = filename.toLowerCase();

  if (t.includes('মডেল টেস্ট') || f.includes('model')) {
    return { category: 'Model Tests', subject: 'মডেল টেস্ট (Model Test)', icon: 'award' };
  }
  if (t.includes('মেডিকেল প্রশ্নপত্র') || t.includes('medical') || f.includes('mat') || f.includes('dat')) {
    return { category: 'Medical Past Papers', subject: 'মেডিকেল বিগত বছর (Medical MAT)', icon: 'file-text' };
  }
  if (t.includes('পদার্থ') || t.includes('বলবিদ্যা') || t.includes('তড়িৎ') || t.includes('আলো') || t.includes('গতি') || t.includes('তরঙ্গ') || t.includes('তাপ') || t.includes('কাজ, শক্তি')) {
    return { category: 'Physics', subject: 'পদার্থবিজ্ঞান (Physics)', icon: 'zap' };
  }
  if (t.includes('রসায়ন') || t.includes('রসায়ন') || t.includes('মৌল') || t.includes('জৈব') || t.includes('পরিবেশ রসায়ন')) {
    return { category: 'Chemistry', subject: 'রসায়ন (Chemistry)', icon: 'flask-conical' };
  }
  if (t.includes('কোষ') || t.includes('উদ্ভিদ') || t.includes('প্রাণী') || t.includes('রক্ত') || t.includes('জিনতত্ত্ব') || t.includes('পরিপাক') || t.includes('জীববিজ্ঞান') || t.includes('সমন্বয়') || t.includes('টিস্যু')) {
    return { category: 'Biology', subject: 'জীববিজ্ঞান (Biology)', icon: 'dna' };
  }
  if (f.includes('english') || f.includes('eng') || t.includes('english')) {
    return { category: 'English', subject: 'ইংরেজি (English)', icon: 'book-open' };
  }
  if (f.includes('general-knowledge') || f.includes('gk') || t.includes('বাংলাদেশ') || t.includes('আন্তর্জাতিক') || t.includes('সাধারণ জ্ঞান') || t.includes('মানবিক')) {
    return { category: 'General Knowledge', subject: 'সাধারণ জ্ঞান (GK)', icon: 'globe' };
  }

  return { category: 'General', subject: 'সাধারণ পরীক্ষা (General)', icon: 'layers' };
}

const qDir = path.join(__dirname, '..', 'data', 'Question');
const outDir = path.join(__dirname, '..', 'public', 'exams');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const files = fs.readdirSync(qDir).filter(f => f.endsWith('.html'));
console.log(`Processing ${files.length} HTML files...`);

const catalog = [];

for (const file of files) {
  const filePath = path.join(qDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Title
  const tm = content.match(/<title>([^<]*)<\/title>/i);
  let rawTitle = tm ? tm[1].trim() : file;
  let decodedTitle = fixEncoding(rawTitle);

  // Clean "Secret file: " prefix
  let cleanTitle = decodedTitle.replace(/^Secret file:\s*/i, '').trim();

  // Extract questions array
  const qMatch = content.match(/const\s+questions\s*=\s*(\[[\s\S]*?\]);\s*(?:let|const|var|\n|\/\/)/) ||
                content.match(/questions\s*=\s*(\[[\s\S]*?\]);/);

  if (!qMatch) {
    console.warn(`No questions array in ${file}`);
    continue;
  }

  let rawQuestions;
  try {
    rawQuestions = JSON.parse(qMatch[1]);
  } catch (err) {
    console.error(`Error parsing JSON in ${file}:`, err.message);
    continue;
  }

  // Format questions
  const formattedQuestions = rawQuestions.map((qObj, index) => {
    const qNum = index + 1;
    const qText = cleanHtmlContent(qObj.q || qObj.question || '');

    // Options
    const optList = [];
    const keys = ['a', 'b', 'c', 'd', 'e'];
    for (const k of keys) {
      if (qObj[k] !== undefined && qObj[k] !== null && String(qObj[k]).trim() !== '') {
        optList.push({
          id: k.toUpperCase(),
          text: cleanHtmlContent(qObj[k], true)
        });
      }
    }

    // Determine correct answer letter
    let ans = String(qObj.ans || qObj.answer || 'A').trim().toUpperCase();
    if (ans.length > 1) {
      const match = ans.match(/^[A-E]/);
      if (match) ans = match[0];
    }

    const expText = cleanHtmlContent(qObj.exp || qObj.explanation || '');

    return {
      id: qNum,
      question: qText,
      options: optList,
      correctAnswer: ans,
      explanation: expText
    };
  });

  const examId = file.replace(/\.html$/i, '');
  const { category, subject, icon } = categorizeExam(cleanTitle, file);
  const durationMinutes = Math.max(1, Math.round(formattedQuestions.length / 2));

  const examData = {
    id: examId,
    title: cleanTitle,
    category,
    subject,
    icon,
    questionCount: formattedQuestions.length,
    durationMinutes,
    durationSeconds: durationMinutes * 60,
    marksPerQuestion: 1,
    negativeMarking: 0.25,
    questions: formattedQuestions
  };

  // Write individual exam JSON
  const examOutPath = path.join(outDir, `${examId}.json`);
  fs.writeFileSync(examOutPath, JSON.stringify(examData, null, 2), 'utf8');

  // Add to catalog summary
  catalog.push({
    id: examId,
    title: cleanTitle,
    category,
    subject,
    icon,
    questionCount: formattedQuestions.length,
    durationMinutes,
    totalMarks: formattedQuestions.length,
    negativeMarking: 0.25,
    file: `exams/${examId}.json`
  });
}

// Sort catalog: Model Tests first, then Medical Past Papers, then Sciences, then English & GK
const categoryOrder = {
  'Model Tests': 1,
  'Medical Past Papers': 2,
  'Physics': 3,
  'Chemistry': 4,
  'Biology': 5,
  'English': 6,
  'General Knowledge': 7,
  'General': 8
};

catalog.sort((a, b) => {
  const orderA = categoryOrder[a.category] || 99;
  const orderB = categoryOrder[b.category] || 99;
  if (orderA !== orderB) return orderA - orderB;
  return a.title.localeCompare(b.title, 'bn');
});

// Write catalog JSON
fs.writeFileSync(path.join(outDir, 'catalog.json'), JSON.stringify(catalog, null, 2), 'utf8');

// Also write a bundled mini-catalog for fast inline loading in index.html
const jsBundle = `window.MED_EXAM_CATALOG = ${JSON.stringify(catalog, null, 2)};`;
fs.writeFileSync(path.join(outDir, 'catalog.js'), jsBundle, 'utf8');

console.log(`Successfully built ${catalog.length} exams into ${outDir}`);
console.log(`Total questions processed: ${catalog.reduce((acc, c) => acc + c.questionCount, 0)}`);
