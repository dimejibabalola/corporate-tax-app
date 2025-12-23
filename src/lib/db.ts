import Dexie, { Table } from 'dexie';

// ============================================================================
// INTERFACES - 5-Level Hierarchy
// ============================================================================

export interface Part {
  id: string;
  textbookId: string;
  number: string;           // "ONE", "TWO", "THREE"
  title: string;            // "INTRODUCTION", "TAXATION OF C CORPORATIONS"
  startPage: number;
  endPage: number;
}

export interface Chapter {
  id: string;
  textbookId: string;
  partId: string;
  number: number;           // 1, 2, 3...15
  title: string;
  startPage: number;
  endPage: number;
}

// Alias for compatibility
export type IChapter = Chapter;
export type IPart = Part;

export interface Section {
  id: string;
  textbookId: string;
  chapterId: string;
  letter: string;           // "A", "B", "C"...
  title: string;
  startPage: number;
  endPage: number;
}

export type ISection = Section;

export interface Subsection {
  id: string;
  textbookId: string;
  sectionId: string;
  number: number;           // 1, 2, 3...
  title: string;
  startPage: number;
  endPage: number;
}

export interface SubSubsection {
  id: string;
  textbookId: string;
  subsectionId: string;
  letter: string;           // "a", "b", "c"...
  title: string;
  startPage: number;
  endPage: number;
}

// ============================================================================
// Content Type Markers (Problems, Cases, Rulings, Notes)
// ============================================================================

export type ContentType = 'problem' | 'note' | 'case' | 'revenue_ruling' | 'joint_committee' | 'text';

export interface ContentMarker {
  id: string;
  textbookId: string;
  chapterId: string;
  sectionId?: string;
  subsectionId?: string;
  subsubsectionId?: string;
  type: ContentType;
  title?: string;           // Case name, ruling number, etc.
  startPage: number;
  endPage?: number;
}

// ============================================================================
// Core Data Types
// ============================================================================

export interface Textbook {
  id: string;
  userId: string;
  title: string;
  fileName: string;
  totalPages: number;
  uploadDate: Date;
  processed: boolean;
  fileData?: Blob;
}

export interface Chunk {
  id: string;
  textbookId: string;
  partId: string;
  chapterId: string;
  sectionId?: string;
  subsectionId?: string;
  subsubsectionId?: string;
  content: string;
  pageNumbers: number[];
  tokenCount: number;
  statutoryRefs: string[];
  caseRefs: string[];
  contentTypes: ContentType[];
  sequenceOrder: number;
}

export interface ActivityLog {
  id?: number;
  userId: string;
  type: 'LOGIN' | 'VIEW_TEXTBOOK' | 'START_QUIZ' | 'GENERATE_QUIZ' | 'COMPLETE_QUIZ' | 'READ_CHAPTER' | 'COURSE_RESET' | 'STUDY_SESSION';
  details?: string;
  timestamp: Date;
}

// ============================================================================
// QUIZ ENGINE - Question Types
// ============================================================================

export type QuestionType = 'MC' | 'SHORT_ANSWER' | 'FILL_BLANK' | 'ISSUE_SPOTTER' | 'TRUE_FALSE';
export type Difficulty = 'basic' | 'intermediate' | 'exam';

export interface Question {
  id: string;
  textbookId: string;
  chapterId: string;
  sectionId?: string;
  type: QuestionType;
  difficulty: Difficulty;
  question: string;
  // For MC
  options?: { A: string; B: string; C: string; D: string };
  correctAnswer?: string;     // 'A'|'B'|'C'|'D' for MC, 'true'|'false' for T/F, or text
  // For Fill-in-blank
  acceptableAnswers?: string[];
  // For Short Answer / Issue Spotter
  modelAnswer?: string;
  keyPoints?: string[];
  // For Issue Spotter
  factPattern?: string;
  issues?: { issue: string; analysis: string; conclusion: string }[];
  // Common
  explanation: string;
  sourcePages: number[];
  createdAt: Date;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  textbookId: string;
  chapterId?: string;
  sectionId?: string;
  questionIds: string[];
  score?: number;
  totalQuestions: number;
  correctCount?: number;
  startedAt: Date;
  completedAt?: Date;
}

export interface Answer {
  id: string;
  quizAttemptId: string;
  questionId: string;
  userAnswer: string;
  isCorrect?: boolean;
  score?: 'full' | 'partial' | 'minimal' | 'miss';  // For subjective
  feedback?: string;
  answeredAt: Date;
}

// ============================================================================
// E&E GENERATOR
// ============================================================================

export interface EEExample {
  number: number;
  title: string;
  difficulty: Difficulty;
  facts: string;
  question: string;
  analysis: { step: number; issue: string; analysis: string; conclusion: string }[];
  result: string;
  keyTakeaway: string;
}

export interface EEContent {
  id: string;
  textbookId: string;
  sectionId: string;
  topic: string;
  rule: {
    statement: string;
    statutoryBasis: string;
    keyRequirements: string[];
  };
  examples: EEExample[];
  commonMistakes: string[];
  examTips: string[];
  relatedTopics: { sectionId: string; title: string; relationship: string }[];
  sourcePages: number[];
  generatedAt: Date;
  expiresAt: Date;
}

// ============================================================================
// PROGRESS TRACKER
// ============================================================================

export type MasteryLevel = 'NOT_STARTED' | 'NEEDS_WORK' | 'DEVELOPING' | 'PROFICIENT' | 'MASTERED';

export interface ChapterProgress {
  id: string;
  userId: string;
  textbookId: string;
  chapterId: string;
  coverageScore: number;      // 0-1: How much content has been quizzed
  accuracyScore: number;      // 0-1: Weighted recent performance
  retentionScore: number;     // 0-1: SRS performance
  masteryScore: number;       // 0-1: Combined score
  masteryLevel: MasteryLevel;
  questionsAttempted: number;
  questionsCorrect: number;
  lastActivityAt: Date;
}

export interface SectionProgress {
  id: string;
  userId: string;
  chapterId: string;
  sectionId: string;
  questionsAttempted: number;
  questionsCorrect: number;
  masteryScore: number;
  lastActivityAt: Date;
}

// ============================================================================
// SPACED REPETITION (SRS)
// ============================================================================

export interface SRSCard {
  id: string;
  userId: string;
  questionId: string;
  nextReviewAt: Date;
  intervalDays: number;
  easeFactor: number;
  consecutiveCorrect: number;
  lastReviewedAt?: Date;
}

// ============================================================================
// GAMIFICATION
// ============================================================================

export interface Streak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;   // YYYY-MM-DD format
}

export interface Milestone {
  id: string;
  milestoneId: string;        // 'first_quiz', 'first_chapter', etc.
  userId: string;
  earnedAt: Date;
}

export interface StudySession {
  id: string;
  userId: string;
  startedAt: Date;
  endedAt?: Date;
  durationMinutes?: number;
  questionsAnswered: number;
  chaptersStudied: string[];
}

// ============================================================================
// ENHANCED READER
// ============================================================================

export type AnnotationType = 'highlight' | 'underline';
export type AnnotationColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange';

export interface Annotation {
  id: string;
  userId: string;
  sectionId: string;
  type: AnnotationType;
  color: AnnotationColor;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  note?: string;
  createdAt: Date;
}

export interface Bookmark {
  id: string;
  userId: string;
  sectionId: string;
  chapterId: string;
  pageNumber?: number;
  title: string;
  note?: string;
  createdAt: Date;
}

export interface StatuteReference {
  section: string;           // "351", "368(c)"
  fullText: string;          // Actual IRC language
  summary: string;           // Plain English
  coveredInSections: string[]; // Section IDs where discussed
}

export interface CaseReference {
  name: string;              // "Peracchi v. Commissioner"
  citation?: string;         // "143 F.3d 487 (9th Cir. 1998)"
  holding: string;
  factsSummary: string;
  textbookPage: number;
  sectionId: string;
}

export interface RulingReference {
  number: string;            // "68-55"
  summary: string;
  keyTakeaway: string;
  textbookPage: number;
  sectionId: string;
}

export interface ReadingProgress {
  id: string;
  userId: string;
  sectionId: string;
  chapterId: string;
  completed: boolean;
  checkPromptsSeen: number;
  checkPromptsFlagged: number;  // "Need to review" count
  timeSpentSeconds: number;
  lastReadAt: Date;
}

export interface CheckPromptResponse {
  id: string;
  userId: string;
  promptId: string;
  sectionId: string;
  action: 'revealed' | 'got_it' | 'need_review';
  respondedAt: Date;
}

export interface SearchHistory {
  id: string;
  userId: string;
  query: string;
  resultCount: number;
  searchedAt: Date;
}

// ============================================================================
// TEXTBOOK PAGES (Imported from JSON)
// ============================================================================

export interface TextbookPage {
  id: string;
  pageNumber: number;
  chapterId: string;
  sectionId: string;
  sectionTitle: string;
  content: string;
  startsNewSection: boolean;
}

export interface PageFootnote {
  id: string;
  pageId: string;
  footnoteNumber: number;
  text: string;
}

// ============================================================================
// Database Class
// ============================================================================


export class TaxPrepDB extends Dexie {
  // Structure
  textbooks!: Table<Textbook>;
  parts!: Table<Part>;
  chapters!: Table<Chapter>;
  sections!: Table<Section>;
  subsections!: Table<Subsection>;
  subsubsections!: Table<SubSubsection>;
  contentMarkers!: Table<ContentMarker>;
  chunks!: Table<Chunk>;

  // Quiz Engine
  questions!: Table<Question>;
  quizAttempts!: Table<QuizAttempt>;
  answers!: Table<Answer>;

  // E&E
  eeContent!: Table<EEContent>;

  // Progress
  chapterProgress!: Table<ChapterProgress>;
  sectionProgress!: Table<SectionProgress>;

  // SRS
  srsCards!: Table<SRSCard>;

  // Gamification
  streaks!: Table<Streak>;
  milestones!: Table<Milestone>;
  studySessions!: Table<StudySession>;

  // Activity
  activityLogs!: Table<ActivityLog>;

  // Enhanced Reader
  annotations!: Table<Annotation>;
  bookmarks!: Table<Bookmark>;
  readingProgress!: Table<ReadingProgress>;
  checkPromptResponses!: Table<CheckPromptResponse>;
  searchHistory!: Table<SearchHistory>;

  // Textbook Pages (from JSON import)
  textbookPages!: Table<TextbookPage>;
  pageFootnotes!: Table<PageFootnote>;

  constructor() {
    super('TaxPrepDB');

    // Version 8: Added textbook pages from JSON import
    this.version(8).stores({
      // Structure
      textbooks: 'id, userId, title',
      parts: 'id, textbookId, number',
      chapters: 'id, textbookId, partId, number',
      sections: 'id, textbookId, chapterId, letter',
      subsections: 'id, textbookId, sectionId, number',
      subsubsections: 'id, textbookId, subsectionId, letter',
      contentMarkers: 'id, textbookId, chapterId, type, startPage',
      chunks: 'id, textbookId, partId, chapterId, sectionId, sequenceOrder',

      // Quiz Engine
      questions: 'id, textbookId, chapterId, sectionId, type, difficulty, createdAt',
      quizAttempts: 'id, userId, textbookId, chapterId, startedAt, completedAt',
      answers: 'id, quizAttemptId, questionId, answeredAt',

      // E&E
      eeContent: 'id, textbookId, sectionId, generatedAt, expiresAt',

      // Progress
      chapterProgress: 'id, userId, textbookId, chapterId, masteryLevel, lastActivityAt',
      sectionProgress: 'id, userId, chapterId, sectionId, lastActivityAt',

      // SRS
      srsCards: 'id, userId, questionId, nextReviewAt',

      // Gamification
      streaks: 'id, userId',
      milestones: 'id, milestoneId, userId, earnedAt',
      studySessions: 'id, userId, startedAt',

      // Activity
      activityLogs: '++id, userId, type, timestamp',

      // Enhanced Reader
      annotations: 'id, userId, sectionId, type, createdAt',
      bookmarks: 'id, userId, sectionId, chapterId, createdAt',
      readingProgress: 'id, userId, sectionId, chapterId, completed, lastReadAt',
      checkPromptResponses: 'id, userId, promptId, sectionId, respondedAt',
      searchHistory: 'id, userId, searchedAt',

      // Textbook Pages (from JSON import)
      textbookPages: 'id, pageNumber, chapterId, sectionId',
      pageFootnotes: 'id, pageId, footnoteNumber'
    });
  }
}

export const db = new TaxPrepDB();

// ============================================================================
// Helper Functions
// ============================================================================

export function getMasteryLevel(score: number): MasteryLevel {
  if (score === 0) return 'NOT_STARTED';
  if (score < 0.60) return 'NEEDS_WORK';
  if (score < 0.80) return 'DEVELOPING';
  if (score < 0.90) return 'PROFICIENT';
  return 'MASTERED';
}

export function getMasteryColor(level: MasteryLevel): string {
  switch (level) {
    case 'NOT_STARTED': return 'gray';
    case 'NEEDS_WORK': return 'red';
    case 'DEVELOPING': return 'yellow';
    case 'PROFICIENT': return 'green';
    case 'MASTERED': return 'blue';
  }
}