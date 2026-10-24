/**
 * PathSync AI - Placement Readiness Assessment Type Definitions
 * 
 * Supports AI-powered dynamic question generation, multiple question types,
 * strict anti-repetition tracking, deterministic grading, and performance analytics.
 */

import { AssessmentSectionId, AssessmentResult } from './index';

export type QuestionType =
  | 'mcq'             // Multiple Choice (Single Correct)
  | 'multiple_select' // Multiple Select (Check all that apply)
  | 'numerical'       // Exact Number or Float with tolerance
  | 'code_output'     // Code snippet output prediction
  | 'debugging'       // Identify bug line or corrected expression
  | 'short_answer';   // Concise technical keyword/concept answer

export type AssessmentDifficulty = 'easy' | 'medium' | 'hard' | 'mixed';

export type AssessmentType = 'full_placement' | 'topic_practice';

export interface AssessmentConfig {
  type: AssessmentType;
  sections: AssessmentSectionId[];
  difficulty: AssessmentDifficulty;
  questionCount: number;
  durationMinutes: number;
  preferredLanguage?: 'javascript' | 'python' | 'java' | 'cpp';
  negativeMarking?: boolean;
  negativeMarkRatio?: number; // e.g. 0.25 (25% penalty for wrong answer)
}

export interface AssessmentQuestion {
  id: string;
  sectionId: AssessmentSectionId;
  sectionTitle: string;
  topic: string;
  subtopic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: QuestionType;
  question: string;
  codeSnippet?: string;
  options?: string[];
  correctAnswer: number | number[] | string;
  explanation: string;
  marks: number;
  negativeMarks: number;
  conceptSignature: string; // Used to prevent repetition across attempts
  rubricKeywords?: string[]; // For short technical answer validation
  numericalTolerance?: number; // Allowed delta for float answers
}

/** Client-safe question snapshot stripped of answer keys before submission */
export type ClientAssessmentQuestion = Omit<
  AssessmentQuestion,
  'correctAnswer' | 'explanation' | 'rubricKeywords'
>;

export interface StudentResponse {
  questionId: string;
  answer: number | number[] | string | null;
  markedForReview?: boolean;
  timeSpentSeconds?: number;
}

export interface ActiveAssessmentSession {
  attemptId: string;
  userId: string;
  config: AssessmentConfig;
  questions: ClientAssessmentQuestion[];
  responses: Record<string, any>;
  reviewFlags: Record<string, boolean>;
  currentQuestionIndex: number;
  remainingSeconds: number;
  startedAt: string;
  aiProviderUsed: string;
  isLiveAiGenerated: boolean;
  answerKeyStorageKey: string; // Session reference for deterministic server/local evaluation
}

export interface QuestionResultBreakdown {
  questionId: string;
  question: string;
  codeSnippet?: string;
  sectionId: AssessmentSectionId;
  sectionTitle: string;
  topic: string;
  subtopic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: QuestionType;
  options?: string[];
  studentAnswer: any;
  correctAnswer: any;
  isCorrect: boolean;
  marksAwarded: number;
  maxMarks: number;
  explanation: string;
}

export interface ReadinessLevelInfo {
  tier: 'Tier-1 Product Companies' | 'Tier-2 Competitive Tech' | 'Foundational Preparation Needed';
  badgeColor: string;
  description: string;
  benchmarkPercent: number;
}

export interface AIAssessmentAnalysis {
  readinessSummary: string;
  actionableRoadmap: string[];
  suggestedResources: {
    title: string;
    type: 'course' | 'practice' | 'documentation' | 'book';
    url: string;
    topic: string;
  }[];
  nextRecommendedAssessment: {
    title: string;
    type: AssessmentType;
    sectionId?: AssessmentSectionId;
    difficulty: AssessmentDifficulty;
    rationale: string;
  };
}

export interface AIAssessmentResult extends AssessmentResult {
  config: AssessmentConfig;
  totalMarks: number;
  scoredMarks: number;
  incorrectAnswers: number;
  unansweredCount: number;
  timeTakenSeconds: number;
  difficultyScores: Record<'easy' | 'medium' | 'hard', { score: number; total: number; percentage: number }>;
  readinessLevel: ReadinessLevelInfo;
  questionBreakdown: QuestionResultBreakdown[];
  aiAnalysis: AIAssessmentAnalysis;
  aiProviderUsed: string;
  isLiveAiGenerated: boolean;
}

export interface AIProviderConfig {
  provider: 'gemini' | 'openai' | 'custom_gateway' | 'pathsync_engine';
  apiKey?: string;
  modelName?: string;
  endpointUrl?: string;
}
