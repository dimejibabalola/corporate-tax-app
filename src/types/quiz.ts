/**
 * Quiz Engine Types
 * 
 * Defines all question types and quiz-related interfaces
 */

// Question Types
export type QuestionType = 'MC' | 'SHORT_ANSWER' | 'FILL_BLANK' | 'ISSUE_SPOTTER' | 'TRUE_FALSE';
export type Difficulty = 'basic' | 'intermediate' | 'exam';
export type SubjectiveScore = 'full' | 'partial' | 'minimal' | 'miss';

// Base Question Interface
export interface BaseQuestion {
    id: string;
    type: QuestionType;
    difficulty: Difficulty;
    question: string;
    explanation: string;
    sourcePages: number[];
    chapterId?: string;
    sectionId?: string;
}

// Multiple Choice
export interface MCQuestion extends BaseQuestion {
    type: 'MC';
    options: { A: string; B: string; C: string; D: string };
    correctAnswer: 'A' | 'B' | 'C' | 'D';
}

// True/False
export interface TrueFalseQuestion extends BaseQuestion {
    type: 'TRUE_FALSE';
    statement: string;
    correctAnswer: boolean;
}

// Fill in the Blank
export interface FillBlankQuestion extends BaseQuestion {
    type: 'FILL_BLANK';
    correctAnswer: string;
    acceptableAnswers: string[];
}

// Short Answer
export interface ShortAnswerQuestion extends BaseQuestion {
    type: 'SHORT_ANSWER';
    modelAnswer: string;
    keyPoints: string[];
}

// Issue Spotter
export interface IssueSpotterQuestion extends BaseQuestion {
    type: 'ISSUE_SPOTTER';
    factPattern: string;
    issues: { issue: string; analysis: string; conclusion: string }[];
    modelAnswer: string;
}

// Union type for all questions
export type Question = MCQuestion | TrueFalseQuestion | FillBlankQuestion | ShortAnswerQuestion | IssueSpotterQuestion;

// Quiz Configuration
export interface QuizConfig {
    chapterId?: string;
    sectionId?: string;
    questionTypes: QuestionType[];
    difficulty: Difficulty;
    count: number;
}

// Quiz Attempt
export interface QuizAttemptResult {
    id: string;
    questions: Question[];
    answers: UserAnswer[];
    score: number;
    totalQuestions: number;
    correctCount: number;
    startedAt: Date;
    completedAt: Date;
}

// User Answer
export interface UserAnswer {
    questionId: string;
    userAnswer: string;
    isCorrect?: boolean;
    score?: SubjectiveScore;
    feedback?: string;
    timeSpent?: number; // seconds
}

// Answer Evaluation Result
export interface EvaluationResult {
    isCorrect: boolean;
    score?: SubjectiveScore;
    feedback: string;
    pointsAddressed?: string[];
    pointsMissed?: string[];
}

// Quiz Stats
export interface QuizStats {
    totalAttempted: number;
    totalCorrect: number;
    accuracyPercentage: number;
    averageTimePerQuestion: number;
    byType: Record<QuestionType, { attempted: number; correct: number }>;
    byDifficulty: Record<Difficulty, { attempted: number; correct: number }>;
}
