const fs = require('fs');
const path = require('path');

const examsDir = path.join(__dirname, '../public/exams');
const files = fs.readdirSync(examsDir).filter(f => f.endsWith('.json') && f !== 'catalog.json');

console.log('--- REPAIRING ALL MOJIBAKE AND ENCODING ANOMALIES ---');

const replacements = [
  [/‘ঞŸ্রুথ সোশ্যাঞ²/g, '‘ট্রুথ সোশ্যাল’'],
  [/ঞŸ্রুথ/g, 'ট্রুথ'],
  [/সোশ্যাঞ²/g, 'সোশ্যাল'],
  [/ঞ¬ঞ°েন্দ্রভূমি/g, 'বরেন্দ্রভূমি'],
  [/ঞ¬ঞ°/g, 'বর'],
  [/এঞ«–à§­/g, 'এফ-৭'],
  [/স্টোà¦•[’'`]à¦¸/g, 'স্টোক্স'],
  [/স্টোà¦•à¦¸/g, 'স্টোক্স'],
  [/হুক[’'`]à¦¸/g, 'হুক্স'],
  [/à¦•[’'`]à¦¸/g, 'ক্স'],
  [/à¦¨[’'`]à¦¸/g, 'ন্স'],
  [/à¦²[’'`]à¦¸/g, 'ল্স'],
  [/à¦®[’'`]à¦¸/g, 'মস'],
  [/à¦°[’'`]à¦¸/g, 'র্স'],
  [/à¦·”/g, 'ষ"'],
  [/à¦¸”/g, 'স"'],
  [/à¦®”/g, 'ম"'],
  [/à¦²”/g, 'ল"'],
  [/à¦¸à¦°/g, 'সর'],
  [/à¦¸à¦®à¦¸/g, 'সমস'],
  [/à¦£à¦¬/g, 'ণব'],
  [/à¦ªà¦°/g, 'পর'],
  [/à¦¬à¦²/g, 'বল'],
  [/à¦\x8Fà¦¨/g, 'এন'],
  [/à¦\x8F/g, 'এ'],
  [/à¦•/g, 'ক'],
  [/à¦–/g, 'খ'],
  [/à¦—/g, 'গ'],
  [/à¦˜/g, 'ঘ'],
  [/à¦™/g, 'ঙ'],
  [/à¦š/g, 'চ'],
  [/à¦›/g, 'ছ'],
  [/à¦œ/g, 'জ'],
  [/à¦ /g, 'ঝ'],
  [/à¦/g, 'ঞ'],
  [/à¦Ÿ/g, 'ট'],
  [/à¦/g, 'ঠ'],
  [/à¦/g, 'ড'],
  [/à¦/g, 'ঢ'],
  [/à¦£/g, 'ণ'],
  [/à¦¤/g, 'ত'],
  [/à¦¥/g, 'থ'],
  [/à¦¦/g, 'দ'],
  [/à¦§/g, 'ধ'],
  [/à¦¨/g, 'ন'],
  [/à¦ª/g, 'প'],
  [/à¦ph/g, 'ফ'],
  [/à¦«/g, 'ফ'],
  [/à¦¬/g, 'ব'],
  [/à¦­/g, 'ভ'],
  [/à¦®/g, 'ম'],
  [/à¦¯/g, 'য'],
  [/à¦°/g, 'র'],
  [/à¦²/g, 'ল'],
  [/à¦¶/g, 'শ'],
  [/à¦·/g, 'ষ'],
  [/à¦¸/g, 'স'],
  [/à¦¹/g, 'হ'],
  [/à¦¼/g, '়'],
  [/à¦½/g, 'ঽ'],
  [/à¦¾/g, 'া'],
  [/à¦¿/g, 'ি'],
  [/à§\x80/g, 'ী'],
  [/à§\x81/g, 'ু'],
  [/à§\x82/g, 'ূ'],
  [/à§\x83/g, 'ৃ'],
  [/à§\x87/g, 'ে'],
  [/à§\x88/g, 'ৈ'],
  [/à§\x8B/g, 'ো'],
  [/à§\x8C/g, 'ৌ'],
  [/à§\x8D/g, '্'],
  [/à§\x97/g, 'ৗ']
];

function cleanMojibakeDeep(text) {
  if (!text || typeof text !== 'string') return text;
  let res = text;
  for (const [regex, rep] of replacements) {
    res = res.replace(regex, rep);
  }
  return res;
}

let modifiedFiles = 0;

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
      const cleanQ = cleanMojibakeDeep(origQ);
      if (origQ !== cleanQ) {
        q.question = cleanQ;
        changed = true;
      }

      if (Array.isArray(q.options)) {
        for (const opt of q.options) {
          const origOpt = opt.text;
          const cleanOpt = cleanMojibakeDeep(origOpt);
          if (origOpt !== cleanOpt) {
            opt.text = cleanOpt;
            changed = true;
          }
        }
      }

      if (q.explanation) {
        const origExp = q.explanation;
        const cleanExp = cleanMojibakeDeep(origExp);
        if (origExp !== cleanExp) {
          q.explanation = cleanExp;
          changed = true;
        }
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    modifiedFiles++;
  }
}

console.log(`✅ Finished! Mojibake cleaned across ${modifiedFiles} files.`);
