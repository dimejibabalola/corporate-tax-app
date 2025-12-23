/**
 * EnhancedReader Component
 * 
 * Main reader component with structured content, check prompts, and navigation
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { ReaderBlock } from './ReaderBlock';
import { MinerUBlockRenderer, MinerUBlock } from './MinerUBlockRenderer';
import { CheckPromptCard } from './CheckPromptCard';
import { SectionOutline } from './SectionOutline';
import { ContentBlock, FormattedContent, CheckPrompt, Reference } from '@/types/reader';
import { formatSectionContent, getCheckPromptsForSection } from '@/services/content-parser';
import { Chunk, Section, db } from '@/lib/db';
import {
    ChevronLeft,
    ChevronRight,
    BookOpen,
    FileText,
    Bookmark,
    BookmarkCheck,
    List
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useLiveQuery } from 'dexie-react-hooks';

interface EnhancedReaderProps {
    chunks: Chunk[];
    section: Section;
    chapterNumber: number;
    sectionLetter: string;
    userId: string;
    onPrevious?: () => void;
    onNext?: () => void;
    hasPrevious?: boolean;
    hasNext?: boolean;
}

export const EnhancedReader = ({
    chunks,
    section,
    chapterNumber,
    sectionLetter,
    userId,
    onPrevious,
    onNext,
    hasPrevious = false,
    hasNext = false
}: EnhancedReaderProps) => {
    const [showOutline, setShowOutline] = useState(true);
    const [startTime] = useState(Date.now());

    // Get existing bookmark
    const bookmark = useLiveQuery(() =>
        db.bookmarks.where({ userId, sectionId: section.id }).first()
        , [userId, section.id]);

    // Parse content into blocks - try JSON first, fall back to text parsing
    const { mineruBlocks, formattedContent, isJsonContent } = useMemo(() => {
        // Try to parse first chunk as JSON (raw MinerU blocks)
        let allMineruBlocks: MinerUBlock[] = [];
        let hasJsonContent = false;

        for (const chunk of chunks) {
            try {
                const parsed = JSON.parse(chunk.content);
                if (Array.isArray(parsed) && parsed.length > 0 && 'type' in parsed[0]) {
                    allMineruBlocks = allMineruBlocks.concat(parsed);
                    hasJsonContent = true;
                }
            } catch {
                // Not JSON - will use formatSectionContent fallback
            }
        }

        // Always compute formatted content for legacy support
        const formatted = formatSectionContent(
            chunks,
            section.id,
            section.chapterId,
            section.title,
            sectionLetter
        );

        return {
            mineruBlocks: allMineruBlocks,
            formattedContent: formatted,
            isJsonContent: hasJsonContent
        };
    }, [chunks, section, sectionLetter]);

    // Get check prompts for this section
    const checkPrompts = useMemo(() => {
        return getCheckPromptsForSection(`ch-${chapterNumber}-${sectionLetter}`);
    }, [chapterNumber, sectionLetter]);

    // Calculate page range
    const pageRange = useMemo(() => {
        const pages = formattedContent.pageNumbers;
        if (pages.length === 0) return 'N/A';
        if (pages.length === 1) return `p. ${pages[0]}`;
        return `pp. ${pages[0]}–${pages[pages.length - 1]}`;
    }, [formattedContent.pageNumbers]);

    // Track reading progress on unmount or navigation
    useEffect(() => {
        return () => {
            const timeSpent = Math.round((Date.now() - startTime) / 1000);
            if (timeSpent > 10) { // Only track if spent more than 10 seconds
                updateReadingProgress(timeSpent);
            }
        };
    }, [section.id]);

    const updateReadingProgress = async (timeSpent: number) => {
        const existing = await db.readingProgress.where({ userId, sectionId: section.id }).first();

        if (existing) {
            await db.readingProgress.update(existing.id, {
                timeSpentSeconds: existing.timeSpentSeconds + timeSpent,
                lastReadAt: new Date()
            });
        } else {
            await db.readingProgress.add({
                id: uuidv4(),
                userId,
                sectionId: section.id,
                chapterId: section.chapterId,
                completed: false,
                checkPromptsSeen: 0,
                checkPromptsFlagged: 0,
                timeSpentSeconds: timeSpent,
                lastReadAt: new Date()
            });
        }
    };

    const toggleBookmark = async () => {
        if (bookmark) {
            await db.bookmarks.delete(bookmark.id);
        } else {
            await db.bookmarks.add({
                id: uuidv4(),
                userId,
                sectionId: section.id,
                chapterId: section.chapterId,
                pageNumber: formattedContent.pageNumbers[0],
                title: `Ch ${chapterNumber}.${sectionLetter}. ${section.title}`,
                createdAt: new Date()
            });
        }
    };

    const markComplete = async () => {
        const existing = await db.readingProgress.where({ userId, sectionId: section.id }).first();

        if (existing) {
            await db.readingProgress.update(existing.id, {
                completed: true,
                lastReadAt: new Date()
            });
        } else {
            await db.readingProgress.add({
                id: uuidv4(),
                userId,
                sectionId: section.id,
                chapterId: section.chapterId,
                completed: true,
                checkPromptsSeen: 0,
                checkPromptsFlagged: 0,
                timeSpentSeconds: Math.round((Date.now() - startTime) / 1000),
                lastReadAt: new Date()
            });
        }

        if (hasNext) {
            onNext?.();
        }
    };

    // Interleave content blocks with check prompts
    const renderContent = () => {
        const elements: JSX.Element[] = [];
        let promptIndex = 0;

        // If we have JSON MinerU blocks, use MinerUBlockRenderer
        if (isJsonContent && mineruBlocks.length > 0) {
            mineruBlocks.forEach((block, i) => {
                elements.push(
                    <MinerUBlockRenderer
                        key={`mineru-${i}`}
                        block={block}
                        chapterNum={chapterNumber}
                    />
                );

                // Insert check prompts after text blocks
                if (block.type === 'text' && !block.text_level && checkPrompts[promptIndex]?.afterParagraph === i) {
                    elements.push(
                        <CheckPromptCard
                            key={`prompt-${promptIndex}`}
                            prompt={checkPrompts[promptIndex]}
                            userId={userId}
                        />
                    );
                    promptIndex++;
                }
            });
        } else {
            // Fallback: use old ReaderBlock for non-JSON content
            formattedContent.blocks.forEach((block, i) => {
                elements.push(<ReaderBlock key={`block-${i}`} block={block} />);

                if (block.type === 'paragraph' && checkPrompts[promptIndex]?.afterParagraph === i) {
                    elements.push(
                        <CheckPromptCard
                            key={`prompt-${promptIndex}`}
                            prompt={checkPrompts[promptIndex]}
                            userId={userId}
                        />
                    );
                    promptIndex++;
                }
            });
        }

        // Add remaining check prompts at the end
        while (promptIndex < checkPrompts.length) {
            elements.push(
                <CheckPromptCard
                    key={`prompt-${promptIndex}`}
                    prompt={checkPrompts[promptIndex]}
                    userId={userId}
                />
            );
            promptIndex++;
        }

        return elements;
    };

    return (
        <div className="enhanced-reader flex gap-6">
            {/* Main Content */}
            <div className="flex-1 max-w-3xl">
                {/* Header */}
                <div className="mb-6 pb-4 border-b">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span>Chapter {chapterNumber}</span>
                        <ChevronRight className="w-4 h-4" />
                        <span>Section {sectionLetter}</span>
                        <span className="ml-auto">📖 {pageRange}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">{section.title}</h1>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowOutline(!showOutline)}
                                title="Toggle outline"
                            >
                                <List className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleBookmark}
                                title={bookmark ? 'Remove bookmark' : 'Add bookmark'}
                            >
                                {bookmark ? (
                                    <BookmarkCheck className="w-4 h-4 text-primary" />
                                ) : (
                                    <Bookmark className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* References badges */}
                    {formattedContent.references.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                            {formattedContent.references.slice(0, 5).map((ref, i) => (
                                <Badge key={i} variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80">
                                    {ref.type === 'statute' && `§ ${ref.section}`}
                                    {ref.type === 'case' && ref.name.split(' v.')[0]}
                                    {ref.type === 'ruling' && `Rev. Rul. ${ref.number}`}
                                    {ref.type === 'regulation' && `Reg. § ${ref.section}`}
                                </Badge>
                            ))}
                            {formattedContent.references.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                    +{formattedContent.references.length - 5} more
                                </Badge>
                            )}
                        </div>
                    )}
                </div>

                {/* Reader Content */}
                <div className="reader-content prose prose-slate dark:prose-invert max-w-none">
                    {renderContent()}
                </div>

                {/* Navigation Footer */}
                <div className="mt-8 pt-6 border-t">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            onClick={onPrevious}
                            disabled={!hasPrevious}
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Previous Section
                        </Button>

                        <Button
                            onClick={markComplete}
                            className="bg-gradient-to-r from-green-600 to-emerald-600"
                        >
                            {hasNext ? 'Mark Complete & Next' : 'Mark Complete'}
                            {hasNext && <ChevronRight className="w-4 h-4 ml-2" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Sidebar Outline */}
            {showOutline && (
                <div className="hidden lg:block w-64 shrink-0">
                    <div className="sticky top-4">
                        <Card>
                            <CardContent className="p-4">
                                <SectionOutline blocks={formattedContent.blocks} />

                                {checkPrompts.length > 0 && (
                                    <div className="mt-4 pt-4 border-t">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <FileText className="w-4 h-4" />
                                            <span>{checkPrompts.length} check prompt{checkPrompts.length > 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedReader;