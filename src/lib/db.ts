import Dexie, { Table } from 'dexie';

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

export interface Chapter {
  id: string;
  textbookId: string;
  number: number;
  title: string;
  startPage: number;
  endPage: number;
}

export interface Chunk {
  id: string;
  textbookId: string;
  chapterId: string;
  content: string;
  pageNumbers: number[];
  tokenCount: number;
  statutoryRefs: string[];
  caseRefs: string[];
  sequenceOrder: number;
}

export interface ActivityLog {
  id?: number; // Auto-increment
  userId: string;
  type: 'LOGIN' | 'VIEW_TEXTBOOK' | 'START_QUIZ' | 'GENERATE_QUIZ' | 'COMPLETE_QUIZ' | 'READ_CHAPTER' | 'COURSE_RESET';
  details?: string; // JSON string for extra metadata (e.g., chapter ID, score)
  timestamp: Date;
}

export class TaxPrepDB extends Dexie {
  textbooks!: Table<Textbook>;
  chapters!: Table<Chapter>;
  chunks!: Table<Chunk>;
  activityLogs!: Table<ActivityLog>;

  constructor() {
    super('TaxPrepDB');
    
    // Version 3: Added activityLogs
    this.version(3).stores({
      textbooks: 'id, userId, title',
      chapters: 'id, textbookId, number',
      chunks: 'id, textbookId, chapterId, sequenceOrder',
      activityLogs: '++id, userId, type, timestamp'
    });
  }
}

export const db = new TaxPrepDB();