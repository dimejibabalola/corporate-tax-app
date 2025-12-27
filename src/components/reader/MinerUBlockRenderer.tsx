/**
 * MinerU Block Renderer
 * 
 * Renders MinerU 2.6 content_list.json blocks directly as JSX.
 * NO markdown. NO HTML parsing (except tables).
 * Just JSON → JSX.
 */

import React from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';

// ============================================================================
// TYPES - MinerU 2.6 Block Schema
// ============================================================================

export interface MinerUBlock {
    type: 'text' | 'title' | 'table' | 'image' | 'equation' | 'list' | 'code' | 'page_footnote' | 'discarded';
    text?: string;
    text_level?: number;  // 0=body, 1+=heading
    bbox?: [number, number, number, number];  // [x0, y0, x1, y1]
    page_idx: number;

    // Table-specific
    table_body?: string;  // HTML for tables
    table_caption?: string[];
    table_footnote?: string[];

    // Image-specific
    img_path?: string;
    image_caption?: string[];
    image_footnote?: string[];

    // Equation-specific (LaTeX)
    text_format?: string;
}

// ============================================================================
// HEIGHT THRESHOLDS for heading levels
// ============================================================================

function getHeadingLevel(bbox: [number, number, number, number] | undefined): 1 | 2 | 3 {
    if (!bbox) return 2;
    const height = bbox[3] - bbox[1];

    if (height > 50) return 1;  // Large titles
    if (height > 21) return 2;  // Section headers
    return 3;  // Subsections
}

function isEyebrow(text: string, bbox: [number, number, number, number] | undefined): boolean {
    if (!bbox) return false;
    const height = bbox[3] - bbox[1];
    const upper = text.toUpperCase();
    return (upper.startsWith('CHAPTER') || upper.startsWith('PART')) && height < 40;
}

/**
 * Parse a single footnote text that starts with a number.
 * Handles format: "N text..." where N is the footnote number.
 * 
 * Returns { number, text } or null if not a valid footnote.
 */
function parseFootnote(text: string): { number: number; text: string } | null {
    const trimmed = text.trim();
    if (!trimmed) return null;

    // Match: number at start, followed by space and text
    // The number must be 1-3 digits and followed by a space
    const match = trimmed.match(/^(\d{1,3})\s+([\s\S]+)$/);
    if (!match) return null;

    const num = parseInt(match[1]);
    // Validate footnote number range (1-200 is reasonable)
    if (num < 1 || num > 200) return null;

    return {
        number: num,
        text: match[2].trim()
    };
}

/**
 * Convert inline footnote reference numbers to clickable superscript links.
 * 
 * In legal/academic texts, footnote markers appear as numbers directly after
 * words or punctuation (e.g., "partners7" or "interest.8").
 * 
 * Pattern matches: letter/punctuation followed by 1-3 digit number, then space/punctuation
 * Excludes: § references, Section references, dates, standalone numbers
 */
function renderTextWithFootnoteLinks(text: string, chapterNum: number): React.ReactNode[] {
    // Match footnote patterns: word/punct + number + space/punct
    // e.g., "partners7 " or "interest.8 " or "twice.10"
    // Captures: (preceding char)(number)
    const footnoteRefPattern = /([a-zA-Z.,;:!?)\]"])(\d{1,3})(?=\s|[.,;:!?)\]"]|$)/g;
    
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    
    footnoteRefPattern.lastIndex = 0;
    
    while ((match = footnoteRefPattern.exec(text)) !== null) {
        const num = parseInt(match[2]);
        const precedingChar = match[1];
        
        // Skip numbers that are too large or too small
        if (num < 1 || num > 200) {
            continue;
        }
        
        // Get context before the match to check for exclusion patterns
        const contextStart = Math.max(0, match.index - 15);
        const beforeContext = text.slice(contextStart, match.index + 1);
        
        // Skip if this looks like a statute reference (§ 351, Section 243, etc.)
        if (/§\s*\d*$/.test(beforeContext) || /Section\s+\d*$/i.test(beforeContext)) {
            continue;
        }
        
        // Skip if preceded by "I.R.C." or "Reg." - these are code/reg references
        if (/I\.R\.C\.\s*[§$]?\s*\d*$/.test(beforeContext) || /Reg\.\s*[§$]?\s*\d*$/.test(beforeContext)) {
            continue;
        }
        
        // Skip year-like numbers (1900-2099)
        if (num >= 1900 && num <= 2099) {
            continue;
        }
        
        // Add text before this match (including the preceding char)
        if (match.index + 1 > lastIndex) {
            parts.push(text.slice(lastIndex, match.index + 1));
        }
        
        // Create clickable footnote reference with better mobile styling
        const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const target = document.getElementById(`fn-${chapterNum}-${num}`);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Highlight animation
                target.classList.add('footnote-highlight');
                setTimeout(() => target.classList.remove('footnote-highlight'), 2500);
            }
        };
        
        parts.push(
            <a
                key={key++}
                href={`#fn-${chapterNum}-${num}`}
                className="footnote-ref inline-flex items-baseline cursor-pointer touch-manipulation"
                aria-label={`Go to footnote ${num}`}
                onClick={handleClick}
                onTouchEnd={handleClick}
            >
                <sup className="text-[0.65em] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-0.5 rounded -top-1 relative select-none">
                    {num}
                </sup>
            </a>
        );
        
        lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }
    
    // If no footnote refs found, return original text
    if (parts.length === 0) {
        return [text];
    }
    
    return parts;
}

// ============================================================================
// BLOCK RENDERERS
// ============================================================================

interface BlockProps {
    block: MinerUBlock;
    chapterNum?: number;
}

/**
 * Render a single MinerU block as JSX
 */
export function MinerUBlockRenderer({ block, chapterNum = 1 }: BlockProps) {
    switch (block.type) {
        case 'title':
        case 'text': {
            const text = block.text || '';

            // If text_level > 0, it's a heading
            if (block.text_level && block.text_level > 0) {
                // Check for eyebrow pattern (CHAPTER X, PART X)
                if (isEyebrow(text, block.bbox)) {
                    return (
                        <div className="chapter-eyebrow text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-2 mt-10">
                            {text}
                        </div>
                    );
                }

                // Regular heading - use bbox height for level
                const level = getHeadingLevel(block.bbox);

                switch (level) {
                    case 1:
                        return (
                            <h1 className="text-4xl font-serif font-bold mt-10 mb-6 pb-4 border-b-2 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 tracking-tight">
                                {text}
                            </h1>
                        );
                    case 2:
                        return (
                            <h2 className="text-2xl font-serif font-bold mt-8 mb-4 pb-2 border-b border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200">
                                {text}
                            </h2>
                        );
                    case 3:
                        return (
                            <h3 className="text-xl font-serif font-semibold mt-6 mb-3 text-stone-800 dark:text-stone-200">
                                {text}
                            </h3>
                        );
                }
            }

            // Body text - paragraph with clickable footnote references
            return (
                <p className="leading-relaxed mb-4 text-stone-700 dark:text-stone-300 text-justify hyphens-auto">
                    {renderTextWithFootnoteLinks(text, chapterNum)}
                </p>
            );
        }

        case 'table': {
            return (
                <figure className="my-6 overflow-x-auto">
                    {/* Table - only place we use dangerouslySetInnerHTML */}
                    <div
                        className="mineru-table prose prose-sm prose-stone dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: block.table_body || '' }}
                    />

                    {/* Table caption */}
                    {block.table_caption && block.table_caption.length > 0 && (
                        <figcaption className="mt-2 text-sm text-stone-500 dark:text-stone-400 italic">
                            {block.table_caption.join(' ')}
                        </figcaption>
                    )}

                    {/* Table footnotes */}
                    {block.table_footnote && block.table_footnote.length > 0 && (
                        <div className="mt-2 text-xs text-stone-500 dark:text-stone-400 border-t border-stone-200 dark:border-stone-700 pt-2">
                            {block.table_footnote.map((fn, i) => (
                                <small key={i} className="block">{fn}</small>
                            ))}
                        </div>
                    )}
                </figure>
            );
        }

        case 'image': {
            const imgSrc = block.img_path
                ? `/data/mineru/Ch${chapterNum}/${block.img_path}`
                : '';

            return (
                <figure className="my-6">
                    <img
                        src={imgSrc}
                        alt={block.image_caption?.[0] || 'Figure'}
                        className="max-w-full h-auto mx-auto rounded shadow-sm"
                        loading="lazy"
                    />

                    {/* Image caption */}
                    {block.image_caption && block.image_caption.length > 0 && (
                        <figcaption className="mt-2 text-sm text-stone-500 dark:text-stone-400 italic text-center">
                            {block.image_caption.join(' ')}
                        </figcaption>
                    )}

                    {/* Image footnotes */}
                    {block.image_footnote && block.image_footnote.length > 0 && (
                        <div className="mt-1 text-xs text-stone-500 dark:text-stone-400 text-center">
                            {block.image_footnote.map((fn, i) => (
                                <small key={i} className="block">{fn}</small>
                            ))}
                        </div>
                    )}
                </figure>
            );
        }

        case 'equation': {
            const latex = block.text || '';

            if (!latex) {
                // Fallback to image if no LaTeX
                if (block.img_path) {
                    const imgSrc = `/data/mineru/Ch${chapterNum}/${block.img_path}`;
                    return (
                        <figure className="my-4 text-center">
                            <img src={imgSrc} alt="Equation" className="inline-block" loading="lazy" />
                        </figure>
                    );
                }
                return null;
            }

            // Render LaTeX with KaTeX
            try {
                const html = katex.renderToString(latex, {
                    throwOnError: false,
                    displayMode: true,
                });
                return (
                    <div
                        className="my-4 text-center overflow-x-auto"
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                );
            } catch {
                // Fallback: show raw LaTeX
                return (
                    <pre className="my-4 p-2 bg-stone-100 dark:bg-stone-800 rounded overflow-x-auto text-sm">
                        <code>{latex}</code>
                    </pre>
                );
            }
        }

        case 'list': {
            // Split text into list items
            const items = block.text?.split('\n').filter(Boolean) || [];
            const isOrdered = /^\d+\./.test(items[0] || '');

            const ListTag = isOrdered ? 'ol' : 'ul';
            return (
                <ListTag className="my-4 pl-6 space-y-1 text-stone-700 dark:text-stone-300">
                    {items.map((item, i) => (
                        <li key={i}>{item.replace(/^[\d]+\.\s*|^[-•]\s*/, '')}</li>
                    ))}
                </ListTag>
            );
        }

        case 'code': {
            return (
                <pre className="my-4 p-4 bg-stone-100 dark:bg-stone-800 rounded overflow-x-auto">
                    <code className="text-sm font-mono text-stone-800 dark:text-stone-200">
                        {block.text}
                    </code>
                </pre>
            );
        }

        case 'page_footnote': {
            // Parse the footnote text (format: "N text...")
            const parsed = parseFootnote(block.text || '');
            
            if (!parsed) {
                // Fallback: render as generic note if parsing fails
                return (
                    <aside className="page-footnote mt-2 py-2 pl-4 text-sm text-stone-600 dark:text-stone-400 border-l-2 border-stone-300 dark:border-stone-600 transition-colors duration-300">
                        {block.text}
                    </aside>
                );
            }

            // Render single footnote with ID for linking
            return (
                <aside
                    id={`fn-${chapterNum}-${parsed.number}`}
                    className="footnote text-sm text-stone-600 dark:text-stone-400 mb-2 leading-relaxed transition-colors duration-300 scroll-mt-20 pt-2 first:border-t first:border-stone-200 dark:first:border-stone-700 first:mt-4"
                >
                    <sup className="font-semibold text-stone-700 dark:text-stone-300 mr-1">
                        {parsed.number}
                    </sup>
                    <span>{parsed.text}</span>
                </aside>
            );
        }

        case 'discarded':
            // Don't render discarded blocks
            return null;

        default:
            // Unknown type - render as paragraph
            return block.text ? (
                <p className="leading-relaxed mb-4 text-stone-700 dark:text-stone-300">
                    {block.text}
                </p>
            ) : null;
    }
}

// ============================================================================
// PAGE RENDERER - Groups blocks by page_idx
// ============================================================================

interface PageRendererProps {
    blocks: MinerUBlock[];
    chapterNum?: number;
    showPageDividers?: boolean;
}

/**
 * Render multiple blocks grouped by page
 */
export function MinerUPageRenderer({
    blocks,
    chapterNum = 1,
    showPageDividers = true
}: PageRendererProps) {
    // Group blocks by page_idx
    const pageGroups = new Map<number, MinerUBlock[]>();

    for (const block of blocks) {
        const pageIdx = block.page_idx ?? 0;
        if (!pageGroups.has(pageIdx)) {
            pageGroups.set(pageIdx, []);
        }
        pageGroups.get(pageIdx)!.push(block);
    }

    // Sort pages
    const sortedPages = [...pageGroups.entries()].sort((a, b) => a[0] - b[0]);

    return (
        <article className="mineru-content prose prose-stone prose-lg max-w-none dark:prose-invert">
            {sortedPages.map(([pageIdx, pageBlocks], pageIndex) => (
                <div key={pageIdx} className="mineru-page">
                    {/* Page divider (except for first page) */}
                    {showPageDividers && pageIndex > 0 && (
                        <div className="page-divider flex items-center gap-4 my-8 text-xs text-stone-400">
                            <div className="flex-1 border-t border-stone-200 dark:border-stone-700" />
                            <span>Page {pageIdx + 1}</span>
                            <div className="flex-1 border-t border-stone-200 dark:border-stone-700" />
                        </div>
                    )}

                    {/* Render blocks for this page */}
                    {pageBlocks.map((block, blockIndex) => (
                        <MinerUBlockRenderer
                            key={`${pageIdx}-${blockIndex}`}
                            block={block}
                            chapterNum={chapterNum}
                        />
                    ))}
                </div>
            ))}
        </article>
    );
}

export default MinerUPageRenderer;
