/**
 * MinerU Block Renderer (Placeholder)
 * 
 * MinerU content rendering has been temporarily disabled.
 * This file provides stub components for compatibility.
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface MinerUBlock {
    type: string;
    text?: string;
    text_level?: number;
    bbox?: [number, number, number, number];
    page_idx: number;
}

interface BlockProps {
    block: MinerUBlock;
    chapterNum?: number;
}

/**
 * Render a single MinerU block - currently shows placeholder
 */
export function MinerUBlockRenderer({ block }: BlockProps) {
    if (!block.text) return null;
    
    return (
        <p className="leading-relaxed mb-4 text-stone-700 dark:text-stone-300">
            {block.text}
        </p>
    );
}

// ============================================================================
// PAGE RENDERER
// ============================================================================

interface PageRendererProps {
    blocks: MinerUBlock[];
    chapterNum?: number;
    showPageDividers?: boolean;
}

/**
 * Render multiple blocks
 */
export function MinerUPageRenderer({
    blocks,
    chapterNum = 1,
}: PageRendererProps) {
    return (
        <article className="mineru-content prose prose-stone prose-lg max-w-none dark:prose-invert">
            {blocks.map((block, index) => (
                <MinerUBlockRenderer
                    key={index}
                    block={block}
                    chapterNum={chapterNum}
                />
            ))}
        </article>
    );
}

export default MinerUPageRenderer;
