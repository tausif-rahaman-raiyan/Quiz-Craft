import React, { useState } from 'react';
import { X, Copy, Check, Info, Clock, Lock, CheckCircle2, FileText } from 'lucide-react';
import { STANDARD_TEMPLATE_3_OPTIONS, STANDARD_TEMPLATE_ENGLISH } from '../utils/parser';

interface FormatGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: string) => void;
}

export const FormatGuideModal: React.FC<FormatGuideModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">প্রশ্ন ইনপুট ফরম্যাট ও নিয়মাবলী</h2>
              <p className="text-xs text-slate-400">Question Input Format & Exam Rules Guide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {/* Highlighted Rules Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3">
              <Lock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-wider">১-ক্লিক লক</h4>
                <p className="text-xs text-indigo-300/80 mt-1">
                  যে কোনো অপশনে একবার ক্লিক করলে আর পরিবর্তন করা যাবে না।
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wider">অটো-টাইমার</h4>
                <p className="text-xs text-amber-300/80 mt-1">
                  প্রতি প্রশ্নে ৩০ সেকেন্ড (৫০ প্রশ্নে ২৫ মি, ১০০ প্রশ্নে ৫০ মি)। সময় শেষে অটো-সাবমিট।
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-200 uppercase tracking-wider">সম্পূর্ণ ব্যাখ্যা</h4>
                <p className="text-xs text-emerald-300/80 mt-1">
                  সাবমিটের পর সঠিক উত্তর ও পূর্ণাঙ্গ ব্যাখ্যা (Explanation) প্রদর্শিত হবে।
                </p>
              </div>
            </div>
          </div>

          {/* Standard Bengali Format Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                বাংলা ফরম্যাট (৩টি অপশন ও ব্যাখ্যাসহ নমুনা):
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(STANDARD_TEMPLATE_3_OPTIONS, 'bn')}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  {copiedType === 'bn' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>কপি করুন</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    onApplyTemplate(STANDARD_TEMPLATE_3_OPTIONS);
                    onClose();
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  ইনপুটে বসান
                </button>
              </div>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs leading-relaxed overflow-x-auto selection:bg-indigo-600">
{STANDARD_TEMPLATE_3_OPTIONS}
            </pre>
          </div>

          {/* Format Explanation Breakdown */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400" />
              ফরম্যাটের মূল নিয়মগুলো:
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>
                  <strong className="text-slate-200">প্রশ্ন:</strong> প্রতিটি প্রশ্ন নম্বরিং দিয়ে শুরু করুন (যেমন: <code>1. প্রশ্ন: ...</code> বা <code>১. ...</code> বা <code>Question 1: ...</code>)।
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>
                  <strong className="text-slate-200">অপশন:</strong> ৩টি অপশন দিতে <code>A)</code>, <code>B)</code>, <code>C)</code> অথবা <code>ক)</code>, <code>খ)</code>, <code>গ)</code> ব্যবহার করুন। (৪টি অপশনও সমর্থিত)।
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>
                  <strong className="text-slate-200">সঠিক উত্তর:</strong> <code>উত্তর: A</code> বা <code>উত্তর: খ</code> বা <code>Ans: B</code> বা <code>Answer: C</code> লিখুন।
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>
                  <strong className="text-slate-200">ব্যাখ্যা:</strong> <code>ব্যাখ্যা: ...</code> বা <code>Exp: ...</code> বা <code>Explanation: ...</code> লিখুন। এটি পরীক্ষার পর বিস্তারিত দেখানো হবে।
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">•</span>
                <span>
                  <strong className="text-slate-200">ফাঁকা লাইন:</strong> প্রতিটি প্রশ্নের মাঝে একটি ফাঁকা লাইন (Empty line) রাখুন।
                </span>
              </li>
            </ul>
          </div>

          {/* English Template Option */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                English Format (3 Options with Explanations):
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(STANDARD_TEMPLATE_ENGLISH, 'en')}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  {copiedType === 'en' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    onApplyTemplate(STANDARD_TEMPLATE_ENGLISH);
                    onClose();
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  Use Template
                </button>
              </div>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs leading-relaxed overflow-x-auto">
{STANDARD_TEMPLATE_ENGLISH}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 flex justify-end bg-slate-900/90">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            বুঝেছি, বন্ধ করুন (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
