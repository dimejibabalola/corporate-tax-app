import Dexie, { Table } from 'dexie';

export interface Textbook {
  id: string;
  userId: string; // Added for multi-user support
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

export class TaxPrepDB extends Dexie {
  textbooks!: Table<Textbook>;
  chapters!: Table<Chapter>;
  chunks!: Table<Chunk>;

  constructor() {
    super('TaxPrepDB');
    // Version 1 (Old)
    this.version(1).stores({
      textbooks: 'id, title',
      chapters: 'id, textbookId, number',
      chunks: 'id, textbookId, chapterId, sequenceOrder'
    });
    
    // Version 2 (New - adds userId index)
    // We upgrade the schema to index userId for fast filtering
    this.version(2).stores({
      textbooks: 'id, userId, title',
      chapters: 'id, textbookId, number',
      chunks: 'id, textbookId, chapterId, sequenceOrder'
    });
  }
}

export const db = new TaxPrepDB();