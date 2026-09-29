const fs = require('fs');
const path = require('path');

const examsDir = path.join(__dirname, '../public/exams');
const files = fs.readdirSync(examsDir).filter(f => f.endsWith('.json') && f !== 'catalog.json');

console.log('--- COMPREHENSIVE SANITIZATION OF ALL EXAMS ---');

function fixMojibake(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/স্টোà¦•[’'`]à¦¸/g, 'স্টোক্স')
    .replace(/স্টোà¦•à¦¸/g, 'স্টোক্স')
    .replace(/হুক[’'`]à¦¸/g, 'হুক্স')
    .replace(/à¦•[’'`]à¦¸/g, 'ক্স')
    .replace(/à¦¨[’'`]à¦¸/g, 'ন্স')
    .replace(/à¦²[’'`]à¦¸/g, 'ল্স')
    .replace(/à¦®[’'`]à¦¸/g, 'মস')
    .replace(/à¦°[’'`]à¦¸/g, 'র্স')
    .replace(/à¦·”/g, 'ষ"')
    .replace(/à¦¸”/g, 'স"')
    .replace(/à¦®”/g, 'ম"')
    .replace(/à¦²”/g, 'ল"')
    .replace(/à¦¸à¦°/g, 'সর')
    .replace(/à¦¸à¦®à¦¸/g, 'সমস')
    .replace(/à¦£à¦¬/g, 'ণব')
    .replace(/à¦ªà¦°/g, 'পর')
    .replace(/à¦¬à¦²/g, 'বল')
    .replace(/à¦\x8Fà¦¨/g, 'এন')
    .replace(/à¦\x8F/g, 'এ')
    .replace(/à¦•/g, 'ক')
    .replace(/à¦–/g, 'খ')
    .replace(/à¦—/g, 'গ')
    .replace(/à¦˜/g, 'ঘ')
    .replace(/à¦™/g, 'ঙ')
    .replace(/à¦š/g, 'চ')
    .replace(/à¦›/g, 'ছ')
    .replace(/à¦œ/g, 'জ')
    .replace(/à¦/g, 'ঝ')
    .replace(/à¦/g, 'ঞ')
    .replace(/à¦Ÿ/g, 'ট')
    .replace(/à¦/g, 'ঠ')
    .replace(/à¦/g, 'ড')
    .replace(/à¦/g, 'ঢ')
    .replace(/à¦£/g, 'ণ')
    .replace(/à¦¤/g, 'ত')
    .replace(/à¦¥/g, 'থ')
    .replace(/à¦¦/g, 'দ')
    .replace(/à¦§/g, 'ধ')
    .replace(/à¦¨/g, 'ন')
    .replace(/à¦ª/g, 'প')
    .replace(/à¦ph/g, 'ফ')
    .replace(/à¦«/g, 'ফ')
    .replace(/à¦¬/g, 'ব')
    .replace(/à¦­/g, 'ভ')
    .replace(/à¦®/g, 'ম')
    .replace(/à¦¯/g, 'য')
    .replace(/à¦°/g, 'র')
    .replace(/à¦²/g, 'ল')
    .replace(/à¦¶/g, 'শ')
    .replace(/à¦·/g, 'ষ')
    .replace(/à¦¸/g, 'স')
    .replace(/à¦¹/g, 'হ')
    .replace(/à¦¼/g, '়')
    .replace(/à¦½/g, 'ঽ')
    .replace(/à¦¾/g, 'া')
    .replace(/à¦¿/g, 'ি')
    .replace(/à§\x80/g, 'ী')
    .replace(/à§\x81/g, 'ু')
    .replace(/à§\x82/g, 'ূ')
    .replace(/à§\x83/g, 'ৃ')
    .replace(/à§\x87/g, 'ে')
    .replace(/à§\x88/g, 'ৈ')
    .replace(/à§\x8B/g, 'ো')
    .replace(/à§\x8C/g, 'ৌ')
    .replace(/à§\x8D/g, '্')
    .replace(/à§\x97/g, 'ৗ');
}

function sanitizeText(str) {
  if (!str || typeof str !== 'string') return '';
  let s = str;

  // 1. First fix mojibake
  s = fixMojibake(s);

  // 2. Remove all outer wrapper tags: <div>, <p>, <span>, < div >, < /div >, < p >, < /p >, < span >, < /span >
  s = s.replace(/<\s*\/?\s*(?:div|p|span)\s*>/gi, ' ');

  // 3. Fix and normalize MathML tags (remove interior whitespace in tags)
  s = s.replace(/<\s*math[^>]*>/gi, '<math xmlns="http://www.w3.org/1998/Math/MathML">');
  s = s.replace(/<\s*\/\s*math\s*>/gi, '</math>');
  s = s.replace(/<\s*mi\s*>/gi, '<mi>').replace(/<\s*\/\s*mi\s*>/gi, '</mi>');
  s = s.replace(/<\s*mn\s*>/gi, '<mn>').replace(/<\s*\/\s*mn\s*>/gi, '</mn>');
  s = s.replace(/<\s*mo\s*>/gi, '<mo>').replace(/<\s*\/\s*mo\s*>/gi, '</mo>');
  s = s.replace(/<\s*msup\s*>/gi, '<msup>').replace(/<\s*\/\s*msup\s*>/gi, '</msup>');
  s = s.replace(/<\s*msub\s*>/gi, '<msub>').replace(/<\s*\/\s*msub\s*>/gi, '</msub>');
  s = s.replace(/<\s*mrow\s*>/gi, '<mrow>').replace(/<\s*\/\s*mrow\s*>/gi, '</mrow>');
  s = s.replace(/<\s*mfrac\s*>/gi, '<mfrac>').replace(/<\s*\/\s*mfrac\s*>/gi, '</mfrac>');
  s = s.replace(/<\s*msqrt\s*>/gi, '<msqrt>').replace(/<\s*\/\s*msqrt\s*>/gi, '</msqrt>');
  s = s.replace(/<\s*mspace[^>]*>\s*<\s*\/\s*mspace\s*>/gi, '<mspace width="0.3em"/>');
  s = s.replace(/<\s*mspace[^>]*\/?\s*>/gi, '<mspace width="0.3em"/>');
  s = s.replace(/<\s*\/\s*mspace\s*>/gi, '');

  // 4. Fix standard HTML tags: <b>, <strong>, <br>
  s = s.replace(/<\s*b\s*>/gi, '<b>').replace(/<\s*\/\s*b\s*>/gi, '</b>');
  s = s.replace(/<\s*strong\s*>/gi, '<strong>').replace(/<\s*\/\s*strong\s*>/gi, '</strong>');
  s = s.replace(/<\s*br\s*\/?\s*>/gi, '<br>');

  // 5. Clean extra spaces while preserving math markup
  s = s.replace(/[ \t]{2,}/g, ' ').trim();

  return s;
}

let modifiedCount = 0;

for (const f of files) {
  const filePath = path.join(examsDir, f);
  let raw = fs.readFileSync(filePath, 'utf-8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    continue;
  }

  let fileChanged = false;

  if (Array.isArray(data.questions)) {
    for (const q of data.questions) {
      const origQ = q.question;
      const cleanQ = sanitizeText(origQ);
      if (origQ !== cleanQ) {
        q.question = cleanQ;
        fileChanged = true;
      }

      if (Array.isArray(q.options)) {
        for (const opt of q.options) {
          const origOpt = opt.text;
          const cleanOpt = sanitizeText(origOpt);
          if (origOpt !== cleanOpt) {
            opt.text = cleanOpt;
            fileChanged = true;
          }
        }
      }

      if (q.explanation) {
        const origExp = q.explanation;
        const cleanExp = sanitizeText(origExp);
        if (origExp !== cleanExp) {
          q.explanation = cleanExp;
          fileChanged = true;
        }
      }
    }
  }

  if (fileChanged) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    modifiedCount++;
  }
}

console.log(`✅ Completed! Sanitized ${modifiedCount} files.`);
