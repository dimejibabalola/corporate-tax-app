import React, { useState } from 'react';
import { CourseReader } from './reader/CourseReader';

export interface ChapterPageData {
  pageNumber: number;
  content: string;
}

interface ChapterReaderProps {
  pages: ChapterPageData[];
  chapterTitle: string;
  onClose: () => void;
}

export const ChapterReader: React.FC<ChapterReaderProps> = ({ pages, chapterTitle, onClose }) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  if (pages.length === 0) {
    return (
      <div className="chapter-reader-empty">
        No content available for this chapter.
      </div>
    );
  }

  const currentPage = pages[currentPageIndex];
  const totalPages = pages.length;

  const goToPrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const goToPage = (pageNum: number) => {
    const idx = pages.findIndex(p => p.pageNumber === pageNum);
    if (idx !== -1) {
      setCurrentPageIndex(idx);
    }
  };

  return (
    <div className="chapter-reader">
      {/* Header */}
      <div className="chapter-reader-header">
        <button className="close-btn" onClick={onClose}>← Back to Chapters</button>
        <h2>{chapterTitle}</h2>
      </div>

      {/* Navigation Bar */}
      <div className="chapter-reader-nav">
        <button
          onClick={goToPrevPage}
          disabled={currentPageIndex === 0}
          className="nav-btn"
        >
          ← Previous
        </button>

        <div className="page-selector">
          <span>Page </span>
          <select
            value={currentPage.pageNumber}
            onChange={(e) => goToPage(parseInt(e.target.value))}
          >
            {pages.map(p => (
              <option key={p.pageNumber} value={p.pageNumber}>
                {p.pageNumber}
              </option>
            ))}
          </select>
          <span> of {pages[pages.length - 1].pageNumber}</span>
        </div>

        <button
          onClick={goToNextPage}
          disabled={currentPageIndex === totalPages - 1}
          className="nav-btn"
        >
          Next →
        </button>
      </div>

      {/* Page Content - Using CourseReader for Markdown */}
      <div className="chapter-reader-content">
        <div className="page-number-header">
          — Page {currentPage.pageNumber} —
        </div>
        <CourseReader
          markdownContent={currentPage.content}
          size="base"
          className="px-2"
        />
      </div>

      {/* Bottom Navigation */}
      <div className="chapter-reader-footer">
        <span>
          Page {currentPageIndex + 1} of {totalPages} pages in this chapter
        </span>
      </div>

      <style>{`
        .chapter-reader {
          background: #faf9f7;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          max-width: 900px;
          margin: 0 auto;
          padding: 0;
          overflow: hidden;
        }
        
        .chapter-reader-header {
          background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
          color: white;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .chapter-reader-header h2 {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 600;
        }
        
        .close-btn {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        
        .close-btn:hover {
          background: rgba(255,255,255,0.2);
        }
        
        .chapter-reader-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 24px;
          background: #e8e6e3;
          border-bottom: 1px solid #d0cdc8;
        }
        
        .nav-btn {
          background: #fff;
          border: 1px solid #bbb;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        
        .nav-btn:hover:not(:disabled) {
          background: #f0f0f0;
          border-color: #888;
        }
        
        .nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        
        .page-selector {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.95rem;
        }
        
        .page-selector select {
          padding: 6px 12px;
          border-radius: 4px;
          border: 1px solid #bbb;
          font-size: 0.95rem;
        }
        
        .chapter-reader-content {
          padding: 32px 48px;
          min-height: 500px;
          max-height: 70vh;
          overflow-y: auto;
          background: #fff;
        }
        
        .page-number-header {
          text-align: center;
          color: #666;
          font-size: 0.85rem;
          margin-bottom: 24px;
          letter-spacing: 2px;
        }
        
        .page-text {
          font-family: 'Times New Roman', Georgia, serif;
          font-size: 1.05rem;
          line-height: 1.7;
          color: #1a1a1a;
          text-align: justify;
        }
        
        .content-line {
          margin-bottom: 0.3em;
        }
        
        .content-line:empty {
          height: 1em;
        }
        
        .section-header {
          font-weight: 700;
          font-size: 1.15rem;
          margin: 1.5em 0 0.8em 0;
          color: #1a365d;
        }
        
        .footnote-text {
          font-size: 0.85rem;
          color: #555;
          margin: 0.4em 0;
          padding-left: 1.5em;
          text-indent: -1.5em;
          border-top: 1px solid transparent;
        }
        
        .footnote-text:first-of-type {
          margin-top: 2em;
          padding-top: 1em;
          border-top: 1px solid #ddd;
        }
        
        .footnote-text sup {
          font-weight: 600;
          color: #1a365d;
        }
        
        .chapter-reader-footer {
          background: #e8e6e3;
          padding: 12px 24px;
          text-align: center;
          color: #666;
          font-size: 0.85rem;
          border-top: 1px solid #d0cdc8;
        }
        
        .chapter-reader-empty {
          padding: 48px;
          text-align: center;
          color: #666;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default ChapterReader;
