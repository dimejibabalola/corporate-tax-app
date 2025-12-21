import Dexie, { Table } from 'dexie';

export interface Textbook {
  id: string;
  title: string;
  fileName: string;
  totalPages: number;
  uploadDate: Date;
  processed: boolean;
  fileData?: Blob; // Storing the actual PDF for now (be careful with size)
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
    this.version(1).stores({
      textbooks: 'id, title',
      chapters: 'id, textbookId, number',
      chunks: 'id, textbookId, chapterId, sequenceOrder'
    });
  }
}

export const db = new TaxPrepDB();