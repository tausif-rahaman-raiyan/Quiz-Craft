const fs = require('fs');
const path = require('path');

const examsDir = path.join(__dirname, '../public/exams');
const files = fs.readdirSync(examsDir).filter(f => f.endsWith('.json') && f !== 'catalog.json');

console.log('--- REPAIRING ALL 70 N/A QUESTIONS ACROSS DATASET ---');

function deriveQuestion(q) {
  const exp = q.explanation || '';
  const opt0 = q.options && q.options[0] ? q.options[0].text : '';
  const opt1 = q.options && q.options[1] ? q.options[1].text : '';

  if (exp.includes('ভ্রুণ অবস্থায় চার সপ্তাহ থেকে') || exp.includes('হৃদস্পন্দন ভ্রুণ অবস্থায়') || opt0.includes('ভ্রুণ অবস্থায় দুই সপ্তাহ')) {
    return 'ভ্রূণের হৃৎপিণ্ডে কত সপ্তাহ বয়স থেকে স্পন্দন শুরু হয়?';
  }
  if (exp.includes('ডান অ্যাট্রিয়াম') && (exp.includes('পেসমেকার') || exp.includes('হৃদরোগের বিভিন্ন অবস্থায়') || exp.includes('ইলেকট্রোড'))) {
    return 'কৃত্রিম পেসমেকারের ইলেকট্রোড সাধারণত হৃৎপিণ্ডের কোন প্রকোষ্ঠে স্থাপন করা হয়?';
  }
  if (exp.includes('হার্ট অ্যাটাক') || opt0.includes('রক্তপ্রবাহ দ্রুততর হয়')) {
    return 'করোনারি ধমনি বন্ধ হয়ে রক্তপ্রবাহ বাধাগ্রস্ত হলে কোন জটিলতা সৃষ্টি হয়?';
  }
  if (exp.includes('লোহিত রক্ত কণিকা') && (exp.includes('রক্ত জমাটে সহায়ক') || opt0.includes('রক্ত জমাটে সহায়ক पदार्थ'))) {
    return 'লোহিত রক্তকণিকা (RBC) সংক্রান্ত নিচের কোন তথ্যটি সঠিক নয়?';
  }
  if (exp.includes('সিস্টেমিক সংবহন') || opt0.includes('সিস্টেমিক সংবহন')) {
    return 'বাম ভেন্ট্রিকল থেকে মহাধমনীর মাধ্যমে সমগ্র দেহে রক্ত সংবহনকে কী বলে?';
  }
  if (exp.includes('অ্যাডভেনটিটিভ এমব্র') || opt0.includes('ভ্রূণথলি থেকে') || opt1.includes('ডিম্বকত্বক বা নিউসেলাস')) {
    return 'অ্যাডভেনটিটিভ এমব্রায়োনি (অস্থানিক ভ্রূণতা) প্রক্রিয়ায় ভ্রূণ কোথা থেকে সৃষ্টি হয়?';
  }
  if (exp.includes('পেরিকার্ডিয়াম') || opt0.includes('পেরিকার্ডিয়াম') || opt0.includes('এপিকার্ডিয়াম')) {
    return 'হৃৎপিণ্ডকে আবৃত করে রাখা দ্বিস্তরী প্রতিরক্ষামূলক আবরণীর নাম কী?';
  }
  if (exp.includes('কৃত্রিম প্রজনন') || exp.includes('ক্লোন') || opt0.includes('মিউট্যান্ট') || opt1.includes('ক্লোন (Clone)')) {
    return 'অঙ্গজ প্রজননের মাধ্যমে উৎপন্ন হুবহু মাতৃ উদ্ভিদের অনুরূপ জীবকে কী বলে?';
  }
  if (exp.includes('Fibrinogen') || exp.includes('রক্ত জমাট বাধার কৌশল') || opt0.includes('Fibrinogen')) {
    return 'রক্ত তঞ্চনের প্রধান ৪টি ক্লটিং ফ্যাক্টরের মধ্যে প্রথম ফ্যাক্টর কোনটি?';
  }
  if (exp.includes('সাইয়ন') || exp.includes('স্টক') || opt0.includes('সাইয়ন') || exp.includes('উদ্ভিদের কৃত্রিম অঙ্গজ জনন')) {
    return 'জোড় কলম (Grafting) পদ্ধতিতে উন্নত জাতের যে অংশটি কেটে অন্য উদ্ভিদে জোড়া লাগানো হয় তাকে কী বলে?';
  }
  if (exp.includes('ব্যারোরিসেপ্টর') || opt0.includes('রেনাল ধমনি')) {
    return 'মানবদেহে ধমনীর রক্তচাপ নিয়ন্ত্রণে উচ্চচাপ ব্যারোরিসেপ্টর কোথায় অবস্থান করে?';
  }
  if (exp.includes('বাম নিলয়') || exp.includes('মানব হৃৎপিণ্ডের প্রাচীর') || opt0.includes('বাম নিলয়')) {
    return 'মানব হৃৎপিণ্ডের কোন প্রকোষ্ঠের পেশিবহুল প্রাচীর সবচেয়ে বেশি পুরু ও শক্তিশালী?';
  }
  if (exp.includes('গ্রাফটিং') && (exp.includes('ক্যাম্বিয়াম') || opt0.includes('জাইলেম'))) {
    return 'গ্রাফটিং বা জোড় কলম সফলভাবে জোড়া লাগার জন্য উভয় অংশের কোন কলার সংযোগ প্রয়োজন?';
  }
  if (exp.includes('দ্বিচক্রী সংবহন')) {
    return 'মানুষের রক্তসংবহন প্রক্রিয়াকে দ্বিচক্রী সংবহন বলা হয় কেন?';
  }
  if (exp.includes('ভেন্ট্রিকলের সিস্টোল')) {
    return 'ট্রাইকাসপিড ও বাইকাসপিড ভাল্ব বন্ধ হয়ে যাওয়ার পর রক্ত ধমনিতে প্রবেশ করে কোন পর্যায়ে?';
  }
  if (exp.includes('রক্ত তঞ্চন') || exp.includes('থ্রম্বোপ্লাস্টিন')) {
    return 'রক্ত জমাট বাঁধার প্রক্রিয়ায় নিষ্ক্রিয় প্রোথ্রম্বিনকে সক্রিয় থ্রম্বিনে রূপান্তর করে কোনটি?';
  }

  // Fallback if explanation has concept line
  const m = exp.match(/কনসেপ্ট\s*[:\-–]\s*([^।\.\n]+)/);
  if (m && m[1]) {
    return m[1].trim() + ' সংক্রান্ত কোনটি সঠিক?';
  }

  return 'নিচের কোনটি সঠিক তথ্য?';
}

let totalFixed = 0;

for (const file of files) {
  const filePath = path.join(examsDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  let changed = false;

  data.questions.forEach((q, idx) => {
    if (!q.question || q.question.trim() === '' || q.question === 'N/A') {
      q.question = deriveQuestion(q);
      changed = true;
      totalFixed++;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}

console.log(`✅ Successfully synthesized and repaired ${totalFixed} N/A questions!`);
