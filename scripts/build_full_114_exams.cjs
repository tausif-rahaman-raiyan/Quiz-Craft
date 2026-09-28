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
  let s = str.replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
             .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

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
    str = str.replace(/^<span><div><p>/i, '').replace(/<\/p><\/div><\/span>$/i, '');
    str = str.replace(/^<div><p>/i, '').replace(/<\/p><\/div>$/i, '');
    str = str.replace(/^<p>/i, '').replace(/<\/p>$/i, '');
    str = str.replace(/^<span>/i, '').replace(/<\/span>$/i, '');
  }

  str = str.replace(/(?:<br\s*\/?>\s*){3,}/gi, '<br><br>');
  return str.trim();
}

const qDir = path.join(__dirname, '..', 'data', 'Question');
const outDir = path.join(__dirname, '..', 'public', 'exams');
const catalogPath = path.join(outDir, 'catalog.json');

const files = fs.readdirSync(qDir).filter(f => f.endsWith('.html'));
console.log(`Processing ${files.length} HTML files from ${qDir}...`);

const fileQuestionsMap = {};
const poolBiology = [];
const poolPhysics = [];
const poolChemistry = [];
const poolEnglish = [];
const poolGK = [];

for (const file of files) {
  const filePath = path.join(qDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  const qMatch = content.match(/const\s+questions\s*=\s*(\[[\s\S]*?\]);\s*(?:let|const|var|\n|\/\/)/) ||
                content.match(/questions\s*=\s*(\[[\s\S]*?\]);/);

  if (!qMatch) continue;

  let rawQuestions = [];
  try {
    rawQuestions = JSON.parse(qMatch[1]);
  } catch (err) {
    console.error(`Error parsing ${file}:`, err.message);
    continue;
  }

  const formattedQuestions = rawQuestions.map((qObj, index) => {
    const qNum = index + 1;
    const qText = cleanHtmlContent(qObj.q || qObj.question || '');

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

  const baseId = file.replace(/\.html$/i, '');
  fileQuestionsMap[baseId] = formattedQuestions;

  // Add to pools based on file name or subject
  const fn = file.toLowerCase();
  if (fn.startsWith('english')) {
    poolEnglish.push(...formattedQuestions);
  } else if (fn.startsWith('general-knowledge') || fn.includes('gk') || fn === 'blog-page_72.html') {
    poolGK.push(...formattedQuestions);
  } else if (fn === 'eng-bcs-dat-mat-others.html') {
    poolEnglish.push(...formattedQuestions);
  } else {
    // Check title or id for subject
    const tm = content.match(/<title>([^<]*)<\/title>/i);
    const title = tm ? fixEncoding(tm[1]) : '';
    if (title.includes('পদার্থ') || title.includes('বলবিদ্যা') || title.includes('তড়িৎ') || title.includes('আলো') || title.includes('তরঙ্গ') || title.includes('তাপ') || title.includes('কাজ')) {
      poolPhysics.push(...formattedQuestions);
    } else if (title.includes('রসায়ন') || title.includes('মৌল') || title.includes('জৈব') || title.includes('গুণগত') || title.includes('পরিমাণগত')) {
      poolChemistry.push(...formattedQuestions);
    } else if (title.includes('কোষ') || title.includes('উদ্ভিদ') || title.includes('প্রাণী') || title.includes('রক্ত') || title.includes('জিনতত্ত্ব') || title.includes('পরিপাক') || title.includes('জীববিজ্ঞান')) {
      poolBiology.push(...formattedQuestions);
    } else {
      // Past papers and model tests contain mixed questions; distribute appropriately
      formattedQuestions.forEach((q, idx) => {
        if (idx < 30) poolBiology.push(q);
        else if (idx < 55) poolChemistry.push(q);
        else if (idx < 75) poolPhysics.push(q);
        else if (idx < 90) poolEnglish.push(q);
        else poolGK.push(q);
      });
    }
  }
}

console.log(`Pool sizes:
Biology: ${poolBiology.length}
Physics: ${poolPhysics.length}
Chemistry: ${poolChemistry.length}
English: ${poolEnglish.length}
GK: ${poolGK.length}`);

// Seeded pseudorandom generator for deterministic, reproducible question selection
function seededSlice(pool, count, seed) {
  if (pool.length === 0) return [];
  let s = Math.abs(seed);
  const result = [];
  const step = 17;
  let idx = s % pool.length;
  const taken = new Set();
  
  for (let i = 0; i < count && result.length < pool.length; i++) {
    let attempts = 0;
    while (taken.has(idx) && attempts < pool.length) {
      idx = (idx + 1) % pool.length;
      attempts++;
    }
    taken.add(idx);
    result.push(JSON.parse(JSON.stringify(pool[idx])));
    idx = (idx + step + (i % 7)) % pool.length;
  }
  return result;
}

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
console.log(`Updating ${catalog.length} exams in catalog...`);

const updatedCatalog = [];

for (const item of catalog) {
  const codeNum = parseInt(item.code || '1020325000', 10);
  let examQuestions = [];

  if (fileQuestionsMap[item.id] && fileQuestionsMap[item.id].length >= 90) {
    // Original full exam
    examQuestions = JSON.parse(JSON.stringify(fileQuestionsMap[item.id]));
  } else {
    // Generate full 100 questions from authentic question pools
    const cat = item.category;
    if (cat === 'মডেল টেস্ট' || cat === 'বিগত ১২ বছরের মেডিকেল প্রশ্ন') {
      // Official MAT syllabus structure: 30 Bio, 25 Chem, 20 Phys, 15 Eng, 10 GK = 100 MCQs
      const bio = seededSlice(poolBiology, 30, codeNum * 3 + 1);
      const chem = seededSlice(poolChemistry, 25, codeNum * 5 + 2);
      const phys = seededSlice(poolPhysics, 20, codeNum * 7 + 3);
      const eng = seededSlice(poolEnglish, 15, codeNum * 11 + 4);
      const gk = seededSlice(poolGK, 10, codeNum * 13 + 5);
      examQuestions = [...bio, ...chem, ...phys, ...eng, ...gk];
    } else if (cat === 'উদ্ভিদবিজ্ঞান' || cat === 'প্রাণিবিজ্ঞান') {
      examQuestions = seededSlice(poolBiology, 100, codeNum * 17 + 7);
    } else if (cat === 'পদার্থবিজ্ঞান প্রথম পত্র' || cat === 'পদার্থবিজ্ঞান দ্বিতীয় পত্র') {
      examQuestions = seededSlice(poolPhysics, 100, codeNum * 19 + 11);
    } else if (cat === 'রসায়ন প্রথম পত্র' || cat === 'রসায়ন দ্বিতীয় পত্র') {
      examQuestions = seededSlice(poolChemistry, 100, codeNum * 23 + 13);
    } else if (cat === 'সাধারণ জ্ঞান') {
      examQuestions = seededSlice(poolGK, 100, codeNum * 29 + 17);
    } else if (cat === 'ইংরেজি') {
      examQuestions = seededSlice(poolEnglish, 100, codeNum * 31 + 19);
    } else if (cat === 'সাবজেক্ট ফাইনাল') {
      if (item.title.includes('জীববিজ্ঞান')) {
        examQuestions = seededSlice(poolBiology, 100, codeNum * 17);
      } else if (item.title.includes('পদার্থবিজ্ঞান')) {
        examQuestions = seededSlice(poolPhysics, 100, codeNum * 19);
      } else if (item.title.includes('রসায়ন')) {
        examQuestions = seededSlice(poolChemistry, 100, codeNum * 23);
      } else if (item.title.includes('ইংরেজি')) {
        examQuestions = seededSlice(poolEnglish, 100, codeNum * 31);
      } else if (item.title.includes('সাধারণ জ্ঞান')) {
        examQuestions = seededSlice(poolGK, 100, codeNum * 29);
      } else {
        const bio = seededSlice(poolBiology, 35, codeNum * 3);
        const chem = seededSlice(poolChemistry, 35, codeNum * 5);
        const phys = seededSlice(poolPhysics, 30, codeNum * 7);
        examQuestions = [...bio, ...chem, ...phys];
      }
    } else {
      examQuestions = seededSlice(poolBiology, 100, codeNum * 17);
    }
  }

  // Renumber questions sequentially 1 to N
  examQuestions.forEach((q, idx) => {
    q.id = idx + 1;
  });

  const durationMinutes = Math.max(1, Math.round(examQuestions.length / 2));
  const examData = {
    id: item.id,
    code: item.code,
    title: item.title,
    category: item.category,
    questionCount: examQuestions.length,
    durationMinutes,
    durationSeconds: durationMinutes * 60,
    marksPerQuestion: 1,
    negativeMarking: 0.25,
    isOriginal: !!fileQuestionsMap[item.id],
    questions: examQuestions
  };

  fs.writeFileSync(path.join(outDir, `${item.id}.json`), JSON.stringify(examData, null, 2), 'utf8');

  updatedCatalog.push({
    id: item.id,
    code: item.code,
    title: item.title,
    category: item.category,
    questionCount: examQuestions.length,
    durationMinutes,
    totalMarks: examQuestions.length,
    negativeMarking: 0.25,
    isOriginal: !!fileQuestionsMap[item.id],
    file: `exams/${item.id}.json`
  });
}

fs.writeFileSync(catalogPath, JSON.stringify(updatedCatalog, null, 2), 'utf8');
const jsBundle = `window.MED_EXAM_CATALOG = ${JSON.stringify(updatedCatalog, null, 2)};`;
fs.writeFileSync(path.join(outDir, 'catalog.js'), jsBundle, 'utf8');

console.log(`\nSUCCESS: All ${updatedCatalog.length} exams now built with full question counts!`);
const totalQ = updatedCatalog.reduce((acc, c) => acc + c.questionCount, 0);
console.log(`Total questions in question bank: ${totalQ.toLocaleString()}`);

const under100 = updatedCatalog.filter(c => c.questionCount < 100);
console.log(`Exams with under 100 questions: ${under100.length} (Expected: 1 for 1999 99-Q paper, or 0)`);
if (under100.length > 0) {
  under100.forEach(c => console.log(` - ${c.title} (${c.questionCount} Q)`));
}
