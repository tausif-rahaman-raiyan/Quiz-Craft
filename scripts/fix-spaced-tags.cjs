const fs = require('fs');
const path = require('path');

const examsDir = path.join(__dirname, '../public/exams');
const files = fs.readdirSync(examsDir).filter(f => f.endsWith('.json') && f !== 'catalog.json');

console.log('--- REPAIRING SPACED HTML TAGS & FORMULAS ACROSS ALL JSON EXAMS ---');

function fixSpacedHtmlTags(str) {
  if (!str || typeof str !== 'string') return str;
  let s = str
    .replace(/<\s*sub\s*>/gi, '<sub>')
    .replace(/<\s*\/\s*sub\s*>/gi, '</sub>')
    .replace(/<\s*sup\s*>/gi, '<sup>')
    .replace(/<\s*\/\s*sup\s*>/gi, '</sup>')
    .replace(/<\s*strong\s*>/gi, '<strong>')
    .replace(/<\s*\/\s*strong\s*>/gi, '</strong>')
    .replace(/<\s*b\s*>/gi, '<b>')
    .replace(/<\s*\/\s*b\s*>/gi, '</b>')
    .replace(/<\s*em\s*>/gi, '<em>')
    .replace(/<\s*\/\s*em\s*>/gi, '</em>')
    .replace(/<\s*i\s*>/gi, '<i>')
    .replace(/<\s*\/\s*i\s*>/gi, '</i>')
    .replace(/<\s*br\s*\/?\s*>/gi, '<br>')
    .replace(/<\s*\/?\s*(?:div|p|span)\s*>/gi, ' ');

  // Trim whitespace inside sub and sup
  s = s.replace(/<sub>\s*([^<]+?)\s*<\/sub>/gi, '<sub>$1</sub>');
  s = s.replace(/<sup>\s*([^<]+?)\s*<\/sup>/gi, '<sup>$1</sup>');
  s = s.replace(/([a-zA-Z0-9\)])\s+<sub>/g, '$1<sub>');
  s = s.replace(/<\/sub>\s+([a-zA-Z0-9\(\[])/g, '</sub>$1');
  s = s.replace(/([a-zA-Z0-9\)])\s+<sup>/g, '$1<sup>');
  s = s.replace(/<\/sup>\s+([a-zA-Z0-9\(\[])/g, '</sup>$1');

  s = s.replace(/[ \t]{2,}/g, ' ').trim();
  return s;
}

let modifiedFiles = 0;
let totalReplaced = 0;

for (const f of files) {
  const filePath = path.join(examsDir, f);
  let raw = fs.readFileSync(filePath, 'utf-8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    continue;
  }

  let changed = false;

  if (Array.isArray(data.questions)) {
    for (const q of data.questions) {
      const origQ = q.question;
      const cleanQ = fixSpacedHtmlTags(origQ);
      if (origQ !== cleanQ) {
        q.question = cleanQ;
        changed = true;
        totalReplaced++;
      }

      if (Array.isArray(q.options)) {
        for (const opt of q.options) {
          const origOpt = opt.text;
          const cleanOpt = fixSpacedHtmlTags(origOpt);
          if (origOpt !== cleanOpt) {
            opt.text = cleanOpt;
            changed = true;
            totalReplaced++;
          }
        }
      }

      if (q.explanation) {
        const origExp = q.explanation;
        const cleanExp = fixSpacedHtmlTags(origExp);
        if (origExp !== cleanExp) {
          q.explanation = cleanExp;
          changed = true;
          totalReplaced++;
        }
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    modifiedFiles++;
  }
}

console.log(`✅ Normalized spaced tags in ${totalReplaced} fields across ${modifiedFiles} JSON files.`);
