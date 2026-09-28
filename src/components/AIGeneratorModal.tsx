import React, { useState } from 'react';
import { Sparkles, X, Loader2, AlertCircle } from 'lucide-react';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppendQuestions: (generatedText: string) => void;
}

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({
  isOpen,
  onClose,
  onAppendQuestions,
}) => {
  const [topic, setTopic] = useState('বাংলাদেশ ও আন্তর্জাতিক সাধারণ জ্ঞান');
  const [count, setCount] = useState(5);
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');
  const [optionsCount, setOptionsCount] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim() || 'General Knowledge',
          count,
          language,
          optionsCount,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'প্রশ্ন তৈরিতে সমস্যা হয়েছে।');
      }

      if (data.text) {
        onAppendQuestions(data.text);
        onClose();
      } else {
        throw new Error('কোনো প্রশ্ন জেনারেট হয়নি। আবার চেষ্টা করুন।');
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'একটি ত্রুটি ঘটেছে। দয়া করে পুনরায় চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  const quickTopics = [
    'বাংলাদেশ বিষয়াবলী (BCS/জব প্রস্তুতি)',
    'আন্তর্জাতিক বিষয়াবলী ও সমসাময়িক বিশ্ব',
    'সাধারণ বিজ্ঞান ও প্রযুক্তি',
    'ভূগোল ও পরিবেশ বিজ্ঞান',
    'কম্পিউটার ও আইসিটি জ্ঞান',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI দিয়ে প্রশ্ন জেনারেট করুন</h2>
              <p className="text-xs text-slate-400">Gemini দিয়ে স্বয়ংক্রিয় ৩-অপশন ও ব্যাখ্যাসহ প্রশ্ন তৈরি</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm text-slate-300">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              বিষয় বা টপিক (Topic):
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="যেমন: বাংলাদেশ মুক্তিযুদ্ধ, পদার্থবিজ্ঞান, সাধারণ জ্ঞান..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickTopics.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className="px-2 py-0.5 text-[11px] rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                প্রশ্ন সংখ্যা:
              </label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value={3}>৩ টি</option>
                <option value={5}>৫ টি</option>
                <option value={10}>১০ টি</option>
                <option value={15}>১৫ টি</option>
                <option value={20}>২০ টি</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                অপশন সংখ্যা:
              </label>
              <select
                value={optionsCount}
                onChange={(e) => setOptionsCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value={3}>৩ টি অপশন (A, B, C)</option>
                <option value={4}>৪ টি অপশন (A, B, C, D)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                ভাষা:
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'bn' | 'en')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="bn">বাংলা (Bengali)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300/90 leading-relaxed">
            💡 জেনারেট হওয়া প্রশ্নগুলোতে স্বয়ংক্রিয়ভাবে ৩টি অপশন, সঠিক উত্তর এবং পূর্ণাঙ্গ ব্যাখ্যা সংযুক্ত থাকবে।
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-900/90">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
          >
            বাতিল
          </button>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-90 text-white shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>তৈরি হচ্ছে...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>প্রশ্ন তৈরি করুন</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
