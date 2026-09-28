export interface Option {
  id: string; // 'A', 'B', 'C', 'D' etc.
  text: string;
}

export interface Question {
  id: number;
  question: string;
  options: Option[];
  correctAnswer: string; // 'A', 'B', 'C', etc. (uppercase)
  explanation: string;
  rawText?: string;
}

export interface UserAnswer {
  questionId: number;
  selectedOption: string; // 'A', 'B', etc.
  isCorrect: boolean;
  answeredAt: number; // timestamp
}

export type ExamStatus = 'setup' | 'in_progress' | 'completed';

export interface ExamSettings {
  secondsPerQuestion: number; // default: 30s (50 questions = 25m, 100 questions = 50m)
  soundEnabled: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  title: string;
}

export interface ParseResult {
  questions: Question[];
  errors: string[];
  warnings: string[];
  totalParsed: number;
}
