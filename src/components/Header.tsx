import React from 'react';
import { BookOpenCheck, Volume2, VolumeX, HelpCircle, Sparkles } from 'lucide-react';
import { soundEffects } from '../utils/audio';

interface HeaderProps {
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  onOpenGuide: () => void;
  onOpenAIModal?: () => void;
  examStatus: 'setup' | 'in_progress' | 'completed';
}

export const Header: React.FC<HeaderProps> = ({
  soundEnabled,
  onToggleSound,
  onOpenGuide,
  onOpenAIModal,
  examStatus,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
            <BookOpenCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                QuizCraft
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                MCQ Master
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              কাস্টম ফরম্যাট • ১-ক্লিক লক • টাইমার ও সম্পূর্ণ ব্যাখ্যা
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {examStatus === 'setup' && onOpenAIModal && (
            <button
              onClick={onOpenAIModal}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 border border-purple-500/30 text-purple-200 transition-all shadow-sm"
              title="Generate questions using Gemini AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>AI প্রশ্ন জেনারেটর</span>
            </button>
          )}

          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="ইনপুট ফরম্যাট গাইড"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">ফরম্যাট নির্দেশিকা</span>
            <span className="sm:hidden">ফরম্যাট</span>
          </button>

          <button
            onClick={() => {
              const next = !soundEnabled;
              onToggleSound(next);
              soundEffects.setEnabled(next);
              if (next) soundEffects.playOptionLock();
            }}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-400 hover:bg-indigo-900/50'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={soundEnabled ? 'সাউন্ড বন্ধ করুন (Mute Sound)' : 'সাউন্ড চালু করুন (Enable Sound)'}
            aria-label="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
