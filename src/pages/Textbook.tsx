import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Check, BookOpen, Scale, ScrollText, BookOpenCheck, ChevronDown, FileText, Gavel, AlertCircle, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { db, Textbook as ITextbook, Chapter as IChapter, Part as IPart, Section as ISection, ContentMarker } from "@/lib/db";
import type { TextbookPage, PageFootnote } from "@/lib/db";
import { TEXTBOOK_STRUCTURE, getAllChapters, getPartForChapter, getSectionEndPage, countContentTypes, SectionDef } from "@/lib/textbook/structure";
import { importTextbookFromJSON, getPagesByRange, getFootnotesForPages } from "@/lib/import-textbook";
import { v4 as uuidv4 } from 'uuid';
import { useLiveQuery } from "dexie-react-hooks";
import { useOutletContext } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useTracker } from "@/hooks/use-tracker";
import { EnhancedReader } from "@/components/reader";

const TextbookPage = () => {
    const { userId } = useOutletContext<{ userId: string }>();
    const { logActivity } = useTracker(userId);

    const textbooks = useLiveQuery(
        () => db.textbooks.where('userId').equals(userId).toArray(),
        [userId]
    );

    const masterBook = textbooks?.[0];
    const [parts, setParts] = useState<IPart[]>([]);
    const [chapters, setChapters] = useState<IChapter[]>([]);
    const [contentMarkers, setContentMarkers] = useState<ContentMarker[]>([]);

    // Stats from the hardcoded structure
    const stats = countContentTypes();

    // Upload/Processing State
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("");

    // Deep Dive Inspection State
    const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
    const [expandedPart, setExpandedPart] = useState<string | null>("part-ONE");

    // Full Content Reading State (Section-based)
    const [readingSection, setReadingSection] = useState<ISection | null>(null);
    const [readingChapter, setReadingChapter] = useState<IChapter | null>(null);
    const [sectionPages, setSectionPages] = useState<TextbookPage[]>([]);
    const [pageFootnotes, setPageFootnotes] = useState<Map<string, PageFootnote[]>>(new Map());
    const [loadingContent, setLoadingContent] = useState(false);
    const [allSections, setAllSections] = useState<ISection[]>([]);
    const [importReady, setImportReady] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);

    // Import textbook JSON on mount - must complete before loading data
    const hasImported = useRef(false);
    useEffect(() => {
        if (!hasImported.current) {
            hasImported.current = true;
            importTextbookFromJSON().then(result => {
                if (result.success) {
                    if (!result.alreadyImported) {
                        console.log(`[Textbook] ${result.message}`);
                    }
                } else {
                    console.error(`[Textbook] Import failed: ${result.message}`);
                    setImportError(result.message);
                }
                // Mark import as ready so DB queries can proceed
                setImportReady(true);
            }).catch((err) => {
                console.error('[Textbook] Critical import error:', err);
                setImportError(`Critical error: ${err.message}`);
                setImportReady(true);
            });
        }
    }, []);

    // Load data from database - only after import is ready
    useEffect(() => {
        if (!importReady) return; // Wait for import to complete

        if (masterBook) {
            db.parts.where('textbookId').equals(masterBook.id).toArray().then(setParts);
            db.chapters.where('textbookId').equals(masterBook.id).toArray().then((chaps) => {
                setChapters(chaps.sort((a, b) => a.number - b.number));
            });
            db.contentMarkers.where('textbookId').equals(masterBook.id).toArray().then(setContentMarkers);
        }
        // Don't clear state when masterBook is undefined - prevents flash during import
    }, [masterBook, importReady]);

    // Initialize from hardcoded structure
    const initializeCourse = async () => {
        setIsProcessing(true);
        setProgress(5);
        setStatus("Initializing Course Structure...");

        try {
            const textbookId = uuidv4();

            setStatus("Building Structure from TOC...");
            setProgress(25);

            const newTextbook: ITextbook = {
                id: textbookId,
                userId: userId,
                title: "Fundamentals of Corporate Tax",
                fileName: "corporate-tax-textbook.json",
                totalPages: 735,
                uploadDate: new Date(),
                processed: true
            };

            // Transaction to populate database from hardcoded structure
            await db.transaction('rw', [db.textbooks, db.parts, db.chapters, db.sections, db.contentMarkers], async () => {
                // Clear old data for this user
                const oldBooks = await db.textbooks.where('userId').equals(userId).toArray();
                for (const b of oldBooks) {
                    await db.parts.where('textbookId').equals(b.id).delete();
                    await db.chapters.where('textbookId').equals(b.id).delete();
                    await db.sections.where('textbookId').equals(b.id).delete();
                    await db.contentMarkers.where('textbookId').equals(b.id).delete();
                }
                await db.textbooks.where('userId').equals(userId).delete();

                setProgress(40);
                setStatus("Creating Parts and Chapters...");

                await db.textbooks.add(newTextbook);

                // Create Parts from hardcoded structure
                const newParts: IPart[] = TEXTBOOK_STRUCTURE.map(part => ({
                    id: `part-${part.number}`,
                    textbookId,
                    number: part.number,
                    title: part.title,
                    startPage: part.startPage,
                    endPage: part.endPage
                }));
                await db.parts.bulkAdd(newParts);

                setProgress(50);
                setStatus("Creating Chapters and Sections...");

                // Create Chapters
                const newChapters: IChapter[] = [];
                const newSections: ISection[] = [];
                const newMarkers: ContentMarker[] = [];

                for (const part of TEXTBOOK_STRUCTURE) {
                    for (const chapter of part.chapters) {
                        const chapterId = `ch-${chapter.number}`;
                        newChapters.push({
                            id: chapterId,
                            textbookId,
                            partId: `part-${part.number}`,
                            number: chapter.number,
                            title: chapter.title,
                            startPage: chapter.startPage,
                            endPage: chapter.endPage
                        });

                        // Create Sections
                        for (const section of chapter.sections) {
                            const sectionId = `${chapterId}-${section.letter}`;
                            const sectionEndPage = getSectionEndPage(chapter, section.letter);

                            newSections.push({
                                id: sectionId,
                                textbookId,
                                chapterId,
                                letter: section.letter,
                                title: section.title,
                                startPage: section.startPage,
                                endPage: sectionEndPage
                            });

                            // Extract content markers from section
                            section.content?.forEach(c => {
                                newMarkers.push({
                                    id: uuidv4(),
                                    textbookId,
                                    chapterId,
                                    sectionId,
                                    type: c.type,
                                    title: c.title,
                                    startPage: c.page
                                });
                            });

                            // Extract from subsections
                            section.subsections?.forEach(sub => {
                                sub.content?.forEach(c => {
                                    newMarkers.push({
                                        id: uuidv4(),
                                        textbookId,
                                        chapterId,
                                        sectionId,
                                        type: c.type,
                                        title: c.title,
                                        startPage: c.page
                                    });
                                });

                                // Extract from sub-subsections
                                sub.subsubsections?.forEach(subsub => {
                                    subsub.content?.forEach(c => {
                                        newMarkers.push({
                                            id: uuidv4(),
                                            textbookId,
                                            chapterId,
                                            sectionId,
                                            type: c.type,
                                            title: c.title,
                                            startPage: c.page
                                        });
                                    });
                                });
                            });
                        }
                    }
                }

                await db.chapters.bulkPut(newChapters);
                await db.sections.bulkPut(newSections);
                await db.contentMarkers.bulkPut(newMarkers);

                setProgress(90);
            });

            logActivity('VIEW_TEXTBOOK', { action: 'initialize' });
            setProgress(100);
            setStatus("Course Initialized Successfully");
            toast.success(`Loaded ${getAllChapters().length} chapters with ${stats.problems} problems!`);

        } catch (err) {
            console.error('[Textbook] Error initializing course:', err);
            setStatus("Error: " + String(err));
            toast.error("Failed to load course material");
        } finally {
            setIsProcessing(false);
        }
    };

    // Auto-initialize if no book is found - use ref to prevent double-init
    const hasInitialized = useRef(false);
    useEffect(() => {
        if (!masterBook && !isProcessing && !hasInitialized.current && textbooks !== undefined) {
            hasInitialized.current = true;
            initializeCourse();
        }
    }, [masterBook, textbooks]);

    // Reset course data
    const resetCourseData = async () => {
        if (masterBook) {
            await db.transaction('rw', [db.textbooks, db.parts, db.chapters, db.sections, db.contentMarkers, db.textbookPages, db.pageFootnotes], async () => {
                await db.parts.where('textbookId').equals(masterBook.id).delete();
                await db.chapters.where('textbookId').equals(masterBook.id).delete();
                await db.sections.where('textbookId').equals(masterBook.id).delete();
                await db.contentMarkers.where('textbookId').equals(masterBook.id).delete();
                await db.textbooks.delete(masterBook.id);

                // Clear imported content to force re-import of new Markdown/JSON
                await db.textbookPages.clear();
                await db.pageFootnotes.clear();
            });
            toast.info("Course data and content cache cleared. Reloading...");
            setTimeout(() => window.location.reload(), 500);
        }
    };

    // Load section content for enhanced reader - now from database
    const loadSectionContent = async (section: ISection, chapter: IChapter) => {
        setLoadingContent(true);
        setReadingSection(section);
        setReadingChapter(chapter);

        try {
            // Load all sections for this chapter for navigation
            const chapterSections = await db.sections.where('chapterId').equals(chapter.id).sortBy('letter');
            setAllSections(chapterSections);

            // Query pages from database for this section's page range
            const pages = await getPagesByRange(section.startPage, section.endPage);

            if (pages.length === 0) {
                // Fallback: try to get pages by sectionId if range didn't work
                const sectionPages = await db.textbookPages
                    .where('sectionId')
                    .equals(section.id)
                    .sortBy('pageNumber');

                if (sectionPages.length > 0) {
                    setSectionPages(sectionPages);
                    // Get footnotes for these pages and convert to Map
                    const footnotes = await getFootnotesForPages(sectionPages.map(p => p.id));
                    const footnotesMap = new Map<string, PageFootnote[]>();
                    for (const fn of footnotes) {
                        if (!footnotesMap.has(fn.pageId)) {
                            footnotesMap.set(fn.pageId, []);
                        }
                        footnotesMap.get(fn.pageId)!.push(fn);
                    }
                    setPageFootnotes(footnotesMap);
                } else {
                    toast.error("No content found for this section");
                    setReadingSection(null);
                    setReadingChapter(null);
                    return;
                }
            } else {
                setSectionPages(pages);
                // Get footnotes for these pages and convert to Map
                const footnotes = await getFootnotesForPages(pages.map(p => p.id));
                const footnotesMap = new Map<string, PageFootnote[]>();
                for (const fn of footnotes) {
                    if (!footnotesMap.has(fn.pageId)) {
                        footnotesMap.set(fn.pageId, []);
                    }
                    footnotesMap.get(fn.pageId)!.push(fn);
                }
                setPageFootnotes(footnotesMap);
            }

            logActivity('READ_CHAPTER', { sectionId: section.id, sectionTitle: section.title });
        } catch (err) {
            console.error(err);
            toast.error("Failed to load section content");
            setReadingSection(null);
            setReadingChapter(null);
        } finally {
            setLoadingContent(false);
        }
    };

    // Navigate to previous/next section
    const navigateSection = (direction: 'prev' | 'next') => {
        if (!readingSection || !readingChapter) return;

        const currentIndex = allSections.findIndex(s => s.id === readingSection.id);
        const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;

        if (newIndex >= 0 && newIndex < allSections.length) {
            loadSectionContent(allSections[newIndex], readingChapter);
        }
    };

    // Get content markers for a chapter
    const getChapterMarkers = (chapterId: string) => {
        return contentMarkers.filter(m => m.chapterId === chapterId);
    };

    // Get section definitions from structure for display
    const getChapterSections = (chapterNum: number): SectionDef[] => {
        const chapter = getAllChapters().find(c => c.number === chapterNum);
        return chapter?.sections || [];
    };

    // Loading state
    if (!masterBook && !isProcessing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center space-y-6">
                <BookOpen className="h-16 w-16 text-primary animate-pulse" />
                <h2 className="text-2xl font-bold">Loading Course Material...</h2>
                <p className="text-muted-foreground">Initializing Fundamentals of Corporate Tax</p>
            </div>
        );
    }

    if (isProcessing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center space-y-6">
                <h2 className="text-2xl font-bold">Initializing Course...</h2>
                <Progress value={progress} className="w-full h-3" />
                <p className="text-muted-foreground animate-pulse">{status}</p>
            </div>
        );
    }

    // If reading a section, show the EnhancedReader
    if (readingSection && readingChapter) {
        const currentSectionIndex = allSections.findIndex(s => s.id === readingSection.id);

        return (
            <div className="max-w-7xl mx-auto py-4 px-4">
                {loadingContent ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                        <BookOpen className="h-12 w-12 text-primary animate-pulse" />
                        <p className="text-muted-foreground">Loading section content...</p>
                    </div>
                ) : (
                    <>
                        <Button
                            variant="ghost"
                            className="mb-4"
                            onClick={() => {
                                setReadingSection(null);
                                setReadingChapter(null);
                                setSectionPages([]);
                                setPageFootnotes(new Map());
                            }}
                        >
                            ← Back to Course
                        </Button>
                        <EnhancedReader
                            chunks={sectionPages.map((page, i) => ({
                                id: page.id,
                                textbookId: masterBook?.id || '',
                                partId: '',
                                chapterId: readingChapter.id,
                                sectionId: readingSection.id,
                                content: page.content,
                                pageNumbers: [page.pageNumber],
                                tokenCount: 0,
                                statutoryRefs: [],
                                caseRefs: [],
                                contentTypes: [],
                                sequenceOrder: i
                            }))}
                            section={readingSection}
                            chapterNumber={readingChapter.number}
                            sectionLetter={readingSection.letter}
                            userId={userId}
                            onPrevious={() => navigateSection('prev')}
                            onNext={() => navigateSection('next')}
                            hasPrevious={currentSectionIndex > 0}
                            hasNext={currentSectionIndex < allSections.length - 1}
                        />
                    </>
                )}
            </div>
        );
    }

    // Main course view
    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Course Material</h1>
                    <p className="text-muted-foreground">Fundamentals of Corporate Taxation</p>
                </div>
            </div>

            {importError && (
                <div className="bg-destructive/15 text-destructive p-4 rounded-md border border-destructive/20">
                    <h3 className="font-semibold flex items-center gap-2">
                        <span className="text-lg">⚠️</span> Import Failed
                    </h3>
                    <p>{importError}</p>
                </div>
            )}


            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/50 dark:to-neutral-900">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <BookOpen className="h-8 w-8 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold">{chapters.length}</p>
                                <p className="text-xs text-muted-foreground">Chapters</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/50 dark:to-neutral-900">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-8 w-8 text-amber-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.problems}</p>
                                <p className="text-xs text-muted-foreground">Problems</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/50 dark:to-neutral-900">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <Gavel className="h-8 w-8 text-purple-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.cases}</p>
                                <p className="text-xs text-muted-foreground">Cases</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/50 dark:to-neutral-900">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <ScrollText className="h-8 w-8 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.rulings}</p>
                                <p className="text-xs text-muted-foreground">Rev. Rulings</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Parts and Chapters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Course Structure
                    </CardTitle>
                    <CardDescription>
                        3 Parts • {chapters.length} Chapters • Pages 3-735
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {TEXTBOOK_STRUCTURE.map((part) => (
                            <Collapsible
                                key={part.number}
                                open={expandedPart === `part-${part.number}`}
                                onOpenChange={(open) => setExpandedPart(open ? `part-${part.number}` : null)}
                            >
                                <CollapsibleTrigger className="w-full">
                                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-lg hover:from-slate-200 hover:to-slate-100 dark:hover:from-slate-700 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="font-mono">
                                                PART {part.number}
                                            </Badge>
                                            <span className="font-semibold">{part.title}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <span>{part.chapters.length} Chapter{part.chapters.length > 1 ? 's' : ''}</span>
                                            <span className="font-mono">pp. {part.startPage}-{part.endPage}</span>
                                            <ChevronDown className={`h-4 w-4 transition-transform ${expandedPart === `part-${part.number}` ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="pt-2 pl-4 space-y-2">
                                    {part.chapters.map((chapterDef) => {
                                        const chapter = chapters.find(c => c.number === chapterDef.number);
                                        if (!chapter) return null;

                                        const markers = getChapterMarkers(chapter.id);
                                        const problemCount = markers.filter(m => m.type === 'problem').length;
                                        const caseCount = markers.filter(m => m.type === 'case').length;
                                        const sections = getChapterSections(chapter.number);

                                        return (
                                            <Collapsible
                                                key={chapter.id}
                                                open={expandedChapter === chapter.id}
                                                onOpenChange={(open) => {
                                                    setExpandedChapter(open ? chapter.id : null);
                                                    if (open) logActivity('READ_CHAPTER', { chapterId: chapter.id });
                                                }}
                                            >
                                                <CollapsibleTrigger className="w-full">
                                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <Badge className="bg-blue-600 text-white font-mono">
                                                                Ch. {chapter.number}
                                                            </Badge>
                                                            <span className="font-medium text-left">{chapter.title}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex gap-1">
                                                                {problemCount > 0 && (
                                                                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 text-xs">
                                                                        {problemCount} Problems
                                                                    </Badge>
                                                                )}
                                                                {caseCount > 0 && (
                                                                    <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50 text-xs">
                                                                        {caseCount} Cases
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <span className="text-xs text-muted-foreground font-mono">
                                                                pp. {chapter.startPage}-{chapter.endPage}
                                                            </span>
                                                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedChapter === chapter.id ? 'rotate-180' : ''}`} />
                                                        </div>
                                                    </div>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="border-l-2 border-blue-200 ml-4 mt-2 pl-4 space-y-4">
                                                    {/* Sections */}
                                                    <div>
                                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                                            Sections ({sections.length}) - Click to read
                                                        </h4>
                                                        <div className="space-y-1">
                                                            {sections.map((sectionDef) => {
                                                                // Get the actual section from database
                                                                const sectionId = `${chapter.id}-${sectionDef.letter}`;
                                                                const dbSection: ISection = {
                                                                    id: sectionId,
                                                                    textbookId: masterBook?.id || '',
                                                                    chapterId: chapter.id,
                                                                    letter: sectionDef.letter,
                                                                    title: sectionDef.title,
                                                                    startPage: sectionDef.startPage,
                                                                    endPage: sectionDef.startPage + 10 // Approximate
                                                                };

                                                                return (
                                                                    <div
                                                                        key={sectionDef.letter}
                                                                        className="flex items-center gap-2 p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors group"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            loadSectionContent(dbSection, chapter);
                                                                        }}
                                                                    >
                                                                        <Badge variant="outline" className="font-mono text-xs bg-blue-50 group-hover:bg-blue-100">
                                                                            {sectionDef.letter}.
                                                                        </Badge>
                                                                        <span className="text-sm group-hover:text-blue-700 dark:group-hover:text-blue-300">{sectionDef.title}</span>
                                                                        <span className="text-xs text-muted-foreground ml-auto font-mono">
                                                                            p. {sectionDef.startPage}
                                                                        </span>
                                                                        <BookOpenCheck size={14} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Content Markers */}
                                                    {markers.length > 0 && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {/* Problems */}
                                                            {markers.filter(m => m.type === 'problem').length > 0 && (
                                                                <div>
                                                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-2 flex items-center gap-1">
                                                                        <AlertCircle size={12} /> Problems
                                                                    </h4>
                                                                    <div className="space-y-1">
                                                                        {markers.filter(m => m.type === 'problem').map((m, i) => (
                                                                            <div key={i} className="text-xs p-1 bg-amber-50 rounded">
                                                                                Page {m.startPage}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {/* Cases */}
                                                            {markers.filter(m => m.type === 'case').length > 0 && (
                                                                <div>
                                                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-600 mb-2 flex items-center gap-1">
                                                                        <Gavel size={12} /> Cases
                                                                    </h4>
                                                                    <div className="space-y-1">
                                                                        {markers.filter(m => m.type === 'case').map((m, i) => (
                                                                            <div key={i} className="text-xs p-1 bg-purple-50 rounded">
                                                                                {m.title} <span className="text-muted-foreground">(p. {m.startPage})</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </CollapsibleContent>
                                            </Collapsible>
                                        );
                                    })}
                                </CollapsibleContent>
                            </Collapsible>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div >
    );
};

export default TextbookPage;