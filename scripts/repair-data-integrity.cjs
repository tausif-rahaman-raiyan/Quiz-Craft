const fs = require('fs');
const path = require('path');

const examsDir = path.join(__dirname, '../public/exams');

console.log('--- REPAIRING DATA INTEGRITY ANOMALIES ---');

// 1. Fix blog-page_52 Q12 & blog-page_77 Q49: Option D
['blog-page_52.json', 'blog-page_77.json'].forEach(file => {
  const p = path.join(examsDir, file);
  if (!fs.existsSync(p)) return;
  const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
  data.questions.forEach(q => {
    if (q.question && q.question.includes('দু’ঞŸি ফোটন') || q.question.includes('ফোটন পরস্পরের বিপরীত')) {
      q.question = 'দুটি ফোটন পরস্পরের বিপরীত দিকে চলছে। একটির সাপেক্ষে অপরটির আপেক্ষিক বেগ কত হবে?';
      if (Array.isArray(q.options) && q.options.length >= 4) {
        if (!q.options[3].text || q.options[3].text.trim() === '') {
          q.options[3].text = '0';
        }
      }
    }
  });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ Repaired photon velocity question in ${file}`);
});

// 2. Fix blog-page_16 Q20: Option D
{
  const p = path.join(examsDir, 'blog-page_16.json');
  if (fs.existsSync(p)) {
    const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
    const q = data.questions.find(x => x.id === 20);
    if (q && Array.isArray(q.options) && q.options.length >= 4) {
      if (!q.options[3].text || q.options[3].text.trim() === '') {
        q.options[3].text = 'কোনটিই নয়';
      }
    }
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ Repaired blog-page_16 Q20`);
  }
}

// 3. Fix unclosed <math> tags in blog-page_51 and blog-page_85
['blog-page_51.json', 'blog-page_85.json'].forEach(file => {
  const p = path.join(examsDir, file);
  if (!fs.existsSync(p)) return;
  let raw = fs.readFileSync(p, 'utf-8');
  // Fix unclosed math tag if <math is present without closing </math>
  const data = JSON.parse(raw);
  data.questions.forEach(q => {
    ['question', 'explanation'].forEach(field => {
      if (q[field] && typeof q[field] === 'string') {
        if (q[field].includes('<math') && !q[field].includes('</math>')) {
          q[field] = q[field] + '</math>';
        }
      }
    });
    if (Array.isArray(q.options)) {
      q.options.forEach(opt => {
        if (opt.text && opt.text.includes('<math') && !opt.text.includes('</math>')) {
          opt.text = opt.text + '</math>';
        }
      });
    }
  });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ Repaired unclosed math tags in ${file}`);
});

// 4. Fix N/A questions in blog-page_231, blog-page_27, blog-page_36, blog-page_71
['blog-page_231.json', 'blog-page_27.json', 'blog-page_36.json', 'blog-page_71.json'].forEach(file => {
  const p = path.join(examsDir, file);
  if (!fs.existsSync(p)) return;
  const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
  data.questions.forEach((q, idx) => {
    if (!q.question || q.question === 'N/A' || !Array.isArray(q.options) || q.options.length < 2) {
      if (q.explanation && q.explanation.includes('দ্বিচক্রী সংবহন')) {
        q.question = 'মানুষের রক্তসংবহন প্রক্রিয়াকে দ্বিচক্রী সংবহন বলা হয় কেন?';
        q.options = [
          { key: 'A', letter: 'A', text: 'পালমোনারি ও সিস্টেমিক সংবহনের কারণে' },
          { key: 'B', letter: 'B', text: 'পোর্টাল ও করোনারি সংবহনের কারণে' },
          { key: 'C', letter: 'C', text: 'হৃৎপিণ্ডের দুটি অলিন্দের উপস্থিতির জন্য' },
          { key: 'D', letter: 'D', text: 'রক্তচাপের দুটি পর্যায়ের জন্য' }
        ];
        q.correctAnswer = 'A';
      } else if (q.explanation && q.explanation.includes('ভেন্ট্রিকলের সিস্টোল')) {
        q.question = 'ট্রাইকাসপিড ও বাইকাসপিড ভাল্ব বন্ধ হয়ে যাওয়ার পর রক্ত ভেন্ট্রিকল থেকে পালমোনারি আর্টারি ও অ্যাওর্টায় প্রবেশ করে কোন পর্যায়ে?';
        if (!q.options || q.options.length < 4) {
          q.options = [
            { key: 'A', letter: 'A', text: 'ভেন্ট্রিকলের সিস্টোল' },
            { key: 'B', letter: 'B', text: 'অ্যাট্রিয়ামের সিস্টোল' },
            { key: 'C', letter: 'C', text: 'ভেন্ট্রিকলের ডায়াস্টোল' },
            { key: 'D', letter: 'D', text: 'অ্যাট্রিয়ামের ডায়াস্টোল' }
          ];
        }
        q.correctAnswer = 'A';
      } else if (q.explanation && q.explanation.includes('লোহিত রক্তকণিকা')) {
        q.question = 'লোহিত রক্তকণিকা (RBC)-এর গঠন ও আকৃতি সংক্রান্ত কোন তথ্যটি সঠিক?';
        q.options = [
          { key: 'A', letter: 'A', text: 'দ্বি-অবতল ও নিউক্লিয়াসবিহীন' },
          { key: 'B', letter: 'B', text: 'গোলাকার ও নিউক্লিয়াসযুক্ত' },
          { key: 'C', letter: 'C', text: 'বহুতলীয় ও চ্যাপ্টা' },
          { key: 'D', letter: 'D', text: 'দীর্ঘাকার ও রোমযুক্ত' }
        ];
        q.correctAnswer = 'A';
      } else if (q.explanation && q.explanation.includes('রক্ত তঞ্চন') || (q.explanation && q.explanation.includes('থ্রম্বোপ্লাস্টিন'))) {
        q.question = 'রক্ত জমাট বাঁধার প্রক্রিয়ায় নিষ্ক্রিয় প্রোথ্রম্বিনকে সক্রিয় থ্রম্বিনে পরিণত করে কোনটি?';
        q.options = [
          { key: 'A', letter: 'A', text: 'ফাইব্রিন ও হেপারিন' },
          { key: 'B', letter: 'B', text: 'থ্রম্বোপ্লাস্টিন ও Ca²⁺ আয়ন' },
          { key: 'C', letter: 'C', text: 'অ্যালবুমিন ও গ্লোবিউলিন' },
          { key: 'D', letter: 'D', text: 'হিমোগ্লোবিন ও আয়রন' }
        ];
        q.correctAnswer = 'B';
      }
    }
  });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ Repaired N/A questions in ${file}`);
});
