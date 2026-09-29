const fs = require('fs');
const path = require('path');

const examsDir = path.join(__dirname, '../public/exams');
const files = fs.readdirSync(examsDir).filter(f => f.endsWith('.json') && f !== 'catalog.json');

console.log('--- REPAIRING FORMULA FORMATTING ACROSS ALL EXAM JSONS ---');

function repairFormulaString(str) {
  if (!str || typeof str !== 'string') return str;
  let s = str;

  // Fix spaced chemical symbols
  s = s.replace(/\bS\s+O(?=[0-9_]|\b)/g, 'SO');
  s = s.replace(/\bC\s+O(?=[0-9_]|\b)/g, 'CO');
  s = s.replace(/\bN\s+H(?=[0-9_]|\b)/g, 'NH');
  s = s.replace(/\bC\s+H(?=[0-9_]|\b)/g, 'CH');
  s = s.replace(/\bC\s+l(?=[0-9_]|\b)/g, 'Cl');
  s = s.replace(/\bH\s+C\s+l\b/g, 'HCl');
  s = s.replace(/\bH\s+N\s+O(?=[0-9_]|\b)/g, 'HNO');
  s = s.replace(/\bH\s+S\s+O(?=[0-9_]|\b)/g, 'HSO');
  s = s.replace(/\bN\s+a\b/g, 'Na');
  s = s.replace(/\bM\s+g\b/g, 'Mg');
  s = s.replace(/\bC\s+a\b/g, 'Ca');
  s = s.replace(/\bF\s+e\b/g, 'Fe');
  s = s.replace(/\bA\s+l\b/g, 'Al');
  s = s.replace(/\bB\s+a\b/g, 'Ba');

  // Fix escaped comparison slashes
  s = s.replace(/\\\s*<\s*\\?/g, ' < ');
  s = s.replace(/\\\s*>\s*\\?/g, ' > ');
  s = s.replace(/\\\s*≤\s*\\?/g, ' ≤ ');
  s = s.replace(/\\\s*≥\s*\\?/g, ' ≥ ');
  s = s.replace(/\\\s*=\s*\\?/g, ' = ');

  // Fix common unicode entities & arrows
  s = s.replace(/⇨|&#x21E8;|&#8680;|&rArr;|\u21E8|\u2192/g, '→');

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
      const cleanQ = repairFormulaString(origQ);
      if (origQ !== cleanQ) {
        q.question = cleanQ;
        changed = true;
        totalReplaced++;
      }

      if (Array.isArray(q.options)) {
        for (const opt of q.options) {
          const origOpt = opt.text;
          const cleanOpt = repairFormulaString(origOpt);
          if (origOpt !== cleanOpt) {
            opt.text = cleanOpt;
            changed = true;
            totalReplaced++;
          }
        }
      }

      if (q.explanation) {
        const origExp = q.explanation;
        const cleanExp = repairFormulaString(origExp);
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

console.log(`✅ Repaired formulas in ${totalReplaced} fields across ${modifiedFiles} JSON files.`);
