import { Question, Option, ParseResult } from '../types/quiz';

// Bengali letter to standard letter converter
const BENGALI_MAP: Record<string, string> = {
  'ক': 'A',
  'খ': 'B',
  'গ': 'C',
  'ঘ': 'D',
  'ঙ': 'E',
  '১': 'A',
  '২': 'B',
  '৩': 'C',
  '৪': 'D',
  '1': 'A',
  '2': 'B',
  '3': 'C',
  '4': 'D',
};

export const STANDARD_TEMPLATE_3_OPTIONS = `1. প্রশ্ন: বাংলাদেশের জাতীয় সংগীতের রচয়িতা কে?
A) কাজী নজরুল ইসলাম
B) রবীন্দ্রনাথ ঠাকুর
C) জীবনানন্দ দাশ
উত্তর: B
ব্যাখ্যা: "আমার সোনার বাংলা" গানটি রবীন্দ্রনাথ ঠাকুর ১৯০৫ সালে বঙ্গভঙ্গ আন্দোলনের সময় লিখেছিলেন।

2. প্রশ্ন: সৌরজগতের সবচেয়ে বৃহত্তম গ্রহ কোনটি?
A) শনি গ্রহ
B) বৃহস্পতি গ্রহ
C) মঙ্গল গ্রহ
উত্তর: B
ব্যাখ্যা: বৃহস্পতি সৌরজগতের বৃহত্তম গ্রহ, যার ব্যাস পৃথিবীর প্রায় ১১ গুণ।

3. প্রশ্ন: আলোর গতিবেগ প্রতি সেকেন্ডে প্রায় কত?
A) ৩ লক্ষ কিলোমিটার
B) ২ লক্ষ কিলোমিটার
C) ৫ লক্ষ কিলোমিটার
উত্তর: A
ব্যাখ্যা: শূন্যস্থানে আলোর বেগ প্রতি সেকেন্ডে প্রায় ৩,০০,০০০ কিমি (৩ × ১০^৮ মিটার/সেকেন্ড)।`;

export const STANDARD_TEMPLATE_ENGLISH = `1. Question: What is the primary function of chlorophyll in plants?
A) Absorbing water from soil
B) Absorbing sunlight for photosynthesis
C) Releasing oxygen during respiration
Ans: B
Exp: Chlorophyll absorbs light energy, primarily in the blue and red wavelengths, driving the process of photosynthesis.

2. Question: Which programming language runs natively in web browsers?
A) Python
B) JavaScript
C) C++
Ans: B
Exp: JavaScript is the core scripting language executed by modern web browsers for client-side functionality.

3. Question: What is the SI unit of electric current?
A) Volt
B) Ampere
C) Ohm
Ans: B
Exp: The Ampere (symbol: A) is the base unit of electric current in the International System of Units (SI).`;

export const DEMO_BCS_QUESTIONS = `1. প্রশ্ন: বাংলাদেশের সংবিধান কবে কার্যকর হয়?
A) ২৬ মার্চ ১৯৭২
B) ১৬ ডিসেম্বর ১৯৭২
C) ৭ মার্চ ১৯৭২
উত্তর: B
ব্যাখ্যা: ১৯৭২ সালের ৪ নভেম্বর বাংলাদেশের সংবিধান গৃহীত হয় এবং ১৬ ডিসেম্বর ১৯৭২ থেকে এটি কার্যকর হয়।

2. প্রশ্ন: 'পদ্মা সেতু' এর দৈর্ঘ্য কত কিলোমিটার?
A) ৬.১৫ কিমি
B) ৫.৮০ কিমি
C) ৭.২০ কিমি
উত্তর: A
ব্যাখ্যা: পদ্মা সেতুর মূল দৈর্ঘ্য ৬.১৫ কিলোমিটার এবং সংযোগ সড়কসহ এটি আরও দীর্ঘ।

3. প্রশ্ন: জাতিসংঘের সদর দপ্তর কোথায় অবস্থিত?
A) জেনেভা, সুইজারল্যান্ড
B) নিউইয়র্ক, যুক্তরাষ্ট্র
C) প্যারিস, ফ্রান্স
উত্তর: B
ব্যাখ্যা: জাতিসংঘের মূল সদর দপ্তর মার্কিন যুক্তরাষ্ট্রের নিউইয়র্ক শহরের ম্যানহাটনে অবস্থিত।

4. প্রশ্ন: মানবদেহের সবচেয়ে বড় অঙ্গ কোনটি?
A) লিভার (যকৃৎ)
B) ত্বক (চামড়া)
C) হৃৎপিণ্ড
উত্তর: B
ব্যাখ্যা: মানবদেহের বৃহত্তম অঙ্গ হলো ত্বক (Skin)। তবে যদি বৃহত্তম অভ্যন্তরীণ গ্রন্থি বলা হয় তবে তা যকৃৎ (Liver)।

5. প্রশ্ন: কম্পিউটারের মস্তিষ্ক হিসেবে কোনটি পরিচিত?
A) RAM
B) CPU
C) Hard Disk
উত্তর: B
ব্যাখ্যা: CPU (Central Processing Unit) কম্পিউটারের সকল গণনা ও নির্দেশ প্রক্রিয়াকরণ পরিচালনা করে।`;

export function normalizeOptionId(raw: string): string {
  const trimmed = raw.trim().toUpperCase();
  if (['A', 'B', 'C', 'D', 'E', 'F'].includes(trimmed)) return trimmed;
  if (BENGALI_MAP[trimmed]) return BENGALI_MAP[trimmed];
  return trimmed;
}

export function parseQuestionsText(input: string): ParseResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const questions: Question[] = [];

  if (!input || !input.trim()) {
    return { questions: [], errors: ['অনুগ্রহ করে প্রশ্ন টেক্সট ইনপুট দিন (Please enter quiz text)'], warnings: [], totalParsed: 0 };
  }

  // Split into raw question blocks using double newlines or question delimiters
  const lines = input.split(/\r?\n/);
  const blocks: string[][] = [];
  let currentBlock: string[] = [];

  const isQuestionStart = (line: string): boolean => {
    const t = line.trim();
    // Matches: "1.", "১.", "Q1:", "Question 1:", "প্রশ্ন ১:", "# 1", etc.
    return /^(?:(?:\d+|[০-৯]+)[\.\)]|Q(?:ues(?:tion)?)?\s*(?:\d+|[০-৯]+)[:\.]?|প্রশ্ন\s*(?:\d+|[০-৯]+)?[:\.]?|#\s*\d+)/i.test(t);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      // Empty line could be block boundary
      if (currentBlock.length > 0) {
        // If next non-empty line starts a new question or current block already has ans/exp
        const nextNonEmpty = lines.slice(i + 1).find(l => l.trim().length > 0);
        if (!nextNonEmpty || isQuestionStart(nextNonEmpty)) {
          blocks.push(currentBlock);
          currentBlock = [];
        }
      }
      continue;
    }

    if (isQuestionStart(trimmed) && currentBlock.length > 0) {
      blocks.push(currentBlock);
      currentBlock = [];
    }

    currentBlock.push(line);
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock);
  }

  // Now parse each block
  blocks.forEach((blockLines, index) => {
    let questionText = '';
    const options: Option[] = [];
    let correctAnswer = '';
    let explanation = '';

    let parsingState: 'question' | 'options' | 'explanation' = 'question';

    for (let i = 0; i < blockLines.length; i++) {
      const line = blockLines[i].trim();
      if (!line) continue;

      // Check for Answer line
      const ansMatch = line.match(/^(?:উত্তর|সঠিক\s*উত্তর|Ans(?:wer)?|Correct\s*Ans(?:wer)?)\s*[:=\-–]?\s*(.+)$/i);
      if (ansMatch) {
        parsingState = 'question'; // reset or ready for explanation
        const rawAns = ansMatch[1].trim();
        // check single letter: A, B, C or ক, খ, গ
        const letterMatch = rawAns.match(/^([A-Za-zক-ঙ1-5১-৫])[\.\)\s]*$/);
        if (letterMatch) {
          correctAnswer = normalizeOptionId(letterMatch[1]);
        } else {
          // Maybe it wrote full option text or "B) ঢাকা"
          const optPrefixMatch = rawAns.match(/^([A-Za-zক-ঙ1-5১-৫])[\.\)]\s*(.*)$/);
          if (optPrefixMatch) {
            correctAnswer = normalizeOptionId(optPrefixMatch[1]);
          } else {
            // Store raw to match against option text later
            correctAnswer = rawAns;
          }
        }
        continue;
      }

      // Check for Explanation line
      const expMatch = line.match(/^(?:ব্যাখ্যা|নোট|কারণ|Exp(?:lanation)?|Note|Reason)\s*[:=\-–]?\s*(.*)$/i);
      if (expMatch) {
        parsingState = 'explanation';
        explanation = expMatch[1].trim();
        continue;
      }

      if (parsingState === 'explanation') {
        // Append multiline explanation
        explanation += (explanation ? ' ' : '') + line;
        continue;
      }

      // Check for Option line
      // Matches: "A) ...", "A. ...", "(A) ...", "ক) ...", "1) ..."
      const optionMatch = line.match(/^(?:\(?([A-Za-zক-ঙ1-5১-৫])[\.\)]\s*|\b([A-Za-zক-ঙ1-5১-৫])[:\-\.]\s+)(.+)$/);
      if (optionMatch) {
        parsingState = 'options';
        const optLetter = normalizeOptionId(optionMatch[1] || optionMatch[2]);
        const optText = (optionMatch[3] || '').trim();
        options.push({
          id: optLetter,
          text: optText,
        });
        continue;
      }

      // If we haven't seen options yet, this belongs to the question
      if (options.length === 0) {
        // Strip leading question markers like "1. ", "প্রশ্ন ১: ", "Q2: "
        let cleanLine = line;
        if (!questionText) {
          cleanLine = cleanLine.replace(/^(?:(?:\d+|[০-৯]+)[\.\)]\s*|Q(?:ues(?:tion)?)?\s*(?:\d+|[০-৯]+)?[:\.]\s*|প্রশ্ন\s*(?:\d+|[০-৯]+)?[:\.]\s*|#\s*\d+\s*)/i, '').trim();
          // Also strip "প্রশ্ন:" if present
          cleanLine = cleanLine.replace(/^(?:প্রশ্ন|Question)\s*[:\-]\s*/i, '').trim();
        }
        questionText += (questionText ? ' ' : '') + cleanLine;
      } else {
        // If we are in options, but this doesn't match standard option pattern:
        // Could be a multiline option text for the last option
        if (options.length > 0 && !correctAnswer) {
          options[options.length - 1].text += ' ' + line;
        }
      }
    }

    // Post-processing for answer if it wasn't a direct letter
    if (correctAnswer && correctAnswer.length > 1) {
      const matchedOpt = options.find(
        (o) => o.text.toLowerCase().trim() === correctAnswer.toLowerCase().trim() ||
               correctAnswer.toLowerCase().includes(o.text.toLowerCase().trim())
      );
      if (matchedOpt) {
        correctAnswer = matchedOpt.id;
      }
    }

    // Default letter fallback if option id not standard
    options.forEach((opt, idx) => {
      const expectedId = String.fromCharCode(65 + idx); // 'A', 'B', 'C'
      if (!opt.id) {
        opt.id = expectedId;
      }
    });

    // Validation checks
    const qNum = index + 1;
    if (!questionText.trim()) {
      warnings.push(`প্রশ্ন #${qNum}: কোনো প্রশ্নের বিবরণ পাওয়া যায়নি (Skipping empty question)`);
      return;
    }

    if (options.length < 2) {
      errors.push(`প্রশ্ন #${qNum} ("${questionText.slice(0, 30)}..."): অন্তত ৩টি বা ২টি অপশন থাকা আবশ্যক (Found only ${options.length} options)`);
      return;
    }

    if (!correctAnswer) {
      // Default to 'A' with a warning
      correctAnswer = options[0].id;
      warnings.push(`প্রশ্ন #${qNum}: সঠিক উত্তর (উত্তর/Ans) উল্লেখ নেই, ডিফল্ট হিসেবে প্রথম অপশন (${options[0].id}) সেট করা হয়েছে।`);
    } else {
      // Check if correctAnswer exists in options
      const hasOpt = options.some(o => o.id === correctAnswer);
      if (!hasOpt) {
        // Maybe correctAnswer was letter from 1 to N
        const firstOpt = options[0].id;
        warnings.push(`প্রশ্ন #${qNum}: উত্তর '${correctAnswer}' অপশনগুলোর মধ্যে মেলেনি। প্রথম অপশন '${firstOpt}' ধরা হয়েছে।`);
        correctAnswer = firstOpt;
      }
    }

    if (!explanation) {
      explanation = 'এই প্রশ্নের জন্য কোনো অতিরিক্ত ব্যাখ্যা দেওয়া হয়নি। (No explanation provided)';
    }

    questions.push({
      id: qNum,
      question: questionText.trim(),
      options,
      correctAnswer,
      explanation: explanation.trim(),
      rawText: blockLines.join('\n'),
    });
  });

  return {
    questions,
    errors,
    warnings,
    totalParsed: questions.length,
  };
}
