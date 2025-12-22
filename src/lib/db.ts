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

export interface Section {
  id: string;
  textbookId: string;
  chapterId: string;
  letter: string;           // "A", "B", "C"...
  title: string;
  startPage: number;
  endPage: number;
}

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
  type: 'LOGIN' | 'VIEW_TEXTBOOK' | 'START_QUIZ' | 'GENERATE_QUIZ' | 'COMPLETE_QUIZ' | 'READ_CHAPTER' | 'COURSE_RESET';
  details?: string;
  timestamp: Date;
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

  // Activity
  activityLogs!: Table<ActivityLog>;

  // Enhanced Reader
  annotations!: Table<Annotation>;
  bookmarks!: Table<Bookmark>;
  readingProgress!: Table<ReadingProgress>;
  checkPromptResponses!: Table<CheckPromptResponse>;
  searchHistory!: Table<SearchHistory>;

  constructor() {
    super('TaxPrepDB');

    // Version 1-3 were previous iterations
    // Version 4: Complete schema overhaul for structured reader
    this.version(4).stores({
      // Structure
      textbooks: 'id, userId, title',
      parts: 'id, textbookId, number',
      chapters: 'id, textbookId, partId, number',
      sections: 'id, textbookId, chapterId, letter',
      subsections: 'id, textbookId, sectionId, number',
      subsubsections: 'id, textbookId, subsectionId, letter',
      contentMarkers: 'id, textbookId, chapterId, type, startPage',
      chunks: 'id, textbookId, partId, chapterId, sectionId, sequenceOrder',

      // Activity
      activityLogs: '++id, userId, type, timestamp',

      // Enhanced Reader
      annotations: 'id, userId, sectionId, type, createdAt',
      bookmarks: 'id, userId, sectionId, chapterId, createdAt',
      readingProgress: 'id, userId, sectionId, chapterId, completed, lastReadAt',
      checkPromptResponses: 'id, userId, promptId, sectionId, respondedAt',
      searchHistory: 'id, userId, searchedAt'
    });
  }
}

export const db = new TaxPrepDB();