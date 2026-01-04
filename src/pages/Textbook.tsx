import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Check, BookOpen, Scale, ScrollText, BookOpenCheck, ChevronDown, FileText, Gavel, AlertCircle, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { db, Textbook as ITextbook, Chapter as IChapter, Part as IPart, Section as ISection, ContentMarker } from "@/lib/db";
import type { TextbookPage, PageFootnote } from "@/lib/db";
import { getPagesByRange, getFootnotesForPages } from "@/lib/import-textbook";
import { v4 as uuidv4 } from 'uuid';
import { useLiveQuery } from "dexie-react-hooks";
import { useOutletContext } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useTracker } from "@/hooks/use-tracker";
import { EnhancedReader } from "@/components/reader";
import { importTextbookFromJSON } from "@/lib/import-textbook";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";

import { supabase } from "@/integrations/supabase/client";

const TextbookPage = () => {
    // Debug Log: Component Mount
    console.log("Component mounted");

    const { userId } = useOutletContext<{ userId: string }>();
    const { logActivity } = useTracker(userId);

    const textbooks = useLiveQuery(
        () => db.textbooks.where('userId').equals(userId).toArray(),
        [userId]
    );

    const masterBook = textbooks?.[0];
    const [parts, setParts] = useState<IPart[]>([]);
    const [chapters, setChapters] = useState<IChapter[]>([]);
    const [sections, setSections] = useState<ISection[]>([]);
    const [contentMarkers, setContentMarkers] = useState<ContentMarker[]>([]);

    // Stats
    const [stats, setStats] = useState({ problems: 0, cases: 0, rulings: 0 });

    // Upload/Processing State
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState("");

    // Deep Dive Inspection State
    const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
    const [expandedPart, setExpandedPart] = useState<string | null>(null);

    // Full Content Reading State (Section-based)
    const [readingSection, setReadingSection] = useState<ISection | null>(null);
    const [readingChapter, setReadingChapter] = useState<IChapter | null>(null);
    const [sectionPages, setSectionPages] = useState<TextbookPage[]>([]);
    const [pageFootnotes, setPageFootnotes] = useState<Map<string, PageFootnote[]>>(new Map());
    const [loadingContent, setLoadingContent] = useState(false);
    const [chapterSections, setChapterSections] = useState<ISection[]>([]); // For navigation within reader

    // Enable Realtime Sync
    useRealtimeSync(true);

    // Initialize Data (Background Sync)
    const hasInitialized = useRef(false);
    useEffect(() => {
        const initData = async () => {
            if (hasInitialized.current) return;
            hasInitialized.current = true;

            // Check if we have data to decide if we show loading state
            const localDataExists = await db.textbooks.count() > 0;

            if (!localDataExists) {
                setIsProcessing(true);
                setStatus("Downloading course content...");
            }

            // Always run sync to ensure fresh data (per user request)
            console.log("Starting background sync...");
            try {
                // improved loader handles Supabase -> Local fallback automatically
                await importTextbookFromJSON();
                if (!localDataExists) {
                    toast.success("Download complete");
                }
            } catch (e) {
                console.error("Sync failed", e);
                if (!localDataExists) {
                    toast.error("Failed to download content. Please refresh.");
                }
            } finally {
                setIsProcessing(false);
                setProgress(100);
            }
        };

        initData();
    }, []);


    // Debug Logs
    console.group("Textbook Debug Probe");
    console.log("Current User ID:", userId);
    console.log("Dexie Query State:", {
        textbooksCount: textbooks?.length,
        masterBookId: masterBook?.id,
        isProcessing,
        hasInitialized: hasInitialized.current
    });

    // Direct Supabase Probe (Rule out Network/RLS)
    useEffect(() => {
        const probeSupabase = async () => {
            console.log("📡 Probing Supabase directly...");
            const { data, error } = await supabase
                .from('textbooks')
                .select('*')
                .limit(5);

            if (error) console.error("❌ Supabase Probe Failed:", error);
            else console.log("✅ Supabase Probe Success:", data);

            // Check specific user access
            if (userId) {
                const { count } = await supabase
                    .from('textbooks')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId);
                console.log(`👤 User ${userId} has ${count} textbooks in Supabase`);
            }
        };
        probeSupabase();
    }, [userId]);
    console.groupEnd();

    // Load data from database
    useEffect(() => {
        if (masterBook) {
            console.log("MasterBook found, loading details for:", masterBook.id);
            // Load Parts
            db.parts.where('textbookId').equals(masterBook.id).toArray().then(p => {
                console.log("Loaded Parts:", p.length, p);
                // Sort parts roughly if they have numbers or just use DB order
                setParts(p);
                // Default expand first part if available
                if (p.length > 0 && !expandedPart) setExpandedPart(p[0].id);
            }).catch(e => console.error("Error loading parts:", e));

            // Load Chapters
            db.chapters.where('textbookId').equals(masterBook.id).toArray().then((chaps) => {
                console.log("Loaded Chapters:", chaps.length);
                setChapters(chaps.sort((a, b) => a.number - b.number));
            }).catch(e => console.error("Error loading chapters:", e));

            // Load All Sections (for TOC)
            db.sections.where('textbookId').equals(masterBook.id).toArray().then(secs => {
                console.log("Loaded Sections:", secs.length);
                setSections(secs);
            });

            // Debug check for pages
            db.textbookPages.count().then(c => console.log("Total Textbook Pages in DB:", c));


            db.contentMarkers.where('textbookId').equals(masterBook.id).toArray().then(markers => {
                setContentMarkers(markers);
                // Calculate stats
                setStats({
                    problems: markers.filter(m => m.type === 'problem').length,
                    cases: markers.filter(m => m.type === 'case').length,
                    rulings: markers.filter(m => m.type === 'revenue_ruling').length
                });
            });
        }
    }, [masterBook]);

    // Load section content for enhanced reader
    const loadSectionContent = async (section: ISection, chapter: IChapter) => {
        setLoadingContent(true);
        setReadingSection(section);
        setReadingChapter(chapter);

        try {
            // Get all sections for this chapter for navigation
            const currentChapterSections = sections
                .filter(s => s.chapterId === chapter.id)
                .sort((a, b) => a.id.localeCompare(b.id)); // Crude sort by ID strings usually works for "ch-1-a", "ch-1-b"

            setChapterSections(currentChapterSections);

            // Query pages from database for this section's page range or ID
            let pages = await getPagesByRange(section.startPage, section.endPage);

            if (pages.length === 0) {
                // Fallback: try to get pages by sectionId
                pages = await db.textbookPages
                    .where('sectionId')
                    .equals(section.id)
                    .sortBy('pageNumber');
            }

            if (pages.length > 0) {
                setSectionPages(pages);
                const footnotes = await getFootnotesForPages(pages.map(p => p.id));
                const footnotesMap = new Map<string, PageFootnote[]>();
                for (const fn of footnotes) {
                    if (!footnotesMap.has(fn.pageId)) {
                        footnotesMap.set(fn.pageId, []);
                    }
                    footnotesMap.get(fn.pageId)!.push(fn);
                }
                setPageFootnotes(footnotesMap);
                logActivity('READ_CHAPTER', { sectionId: section.id, sectionTitle: section.title });
            } else {
                toast.error("No content found for this section");
                // Don't clear state immediately to allow retry or navigation, but maybe show empty state
                setSectionPages([]);
            }

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

        const currentIndex = chapterSections.findIndex(s => s.id === readingSection.id);
        const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;

        if (newIndex >= 0 && newIndex < chapterSections.length) {
            loadSectionContent(chapterSections[newIndex], readingChapter);
        }
    };

    // Get content markers for a chapter
    const getChapterMarkers = (chapterId: string) => {
        return contentMarkers.filter(m => m.chapterId === chapterId);
    };

    // Loading Screen
    if (!masterBook && !isProcessing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center space-y-6">
                <BookOpen className="h-16 w-16 text-primary animate-pulse" />
                <h2 className="text-2xl font-bold">Loading Course Material...</h2>
                <p className="text-muted-foreground">Syncing data from Cloud...</p>
                <Button onClick={() => window.location.reload()}>Retry / Reload</Button>
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

    // Reader View
    if (readingSection && readingChapter) {
        const currentSectionIndex = chapterSections.findIndex(s => s.id === readingSection.id);

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
                            hasNext={currentSectionIndex < chapterSections.length - 1}
                        />
                    </>
                )}
            </div>
        );
    }

    // TOC View
    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Course Material</h1>
                    <p className="text-muted-foreground">Fundamentals of Corporate Taxation</p>
                </div>
            </div>

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
                    {/* Placeholder for Rulings/Other stats */}
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

            {/* Dynamic TOC */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Course Structure
                    </CardTitle>
                    <CardDescription>
                        {parts.length} Parts • {chapters.length} Chapters • {sections.length} Sections
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {parts.map((part) => {
                            // Correctly map chapters that belong to this Part
                            // Assuming part.id is like 'part-ONE' or similar and chapter.partId matches
                            // Or use a simpler check if your DB structure varies
                            const partChapters = chapters.filter(c => c.partId === part.id);

                            // If no chapters (or using default part ID), maybe show all or handling orphans?
                            // For now assume strictly linked

                            return (
                                <Collapsible
                                    key={part.id}
                                    open={expandedPart === part.id}
                                    onOpenChange={(open) => setExpandedPart(open ? part.id : null)}
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
                                                <span>{partChapters.length} Chapter{partChapters.length !== 1 ? 's' : ''}</span>
                                                <span className="font-mono">pp. {part.startPage}-{part.endPage}</span>
                                                <ChevronDown className={`h-4 w-4 transition-transform ${expandedPart === part.id ? 'rotate-180' : ''}`} />
                                            </div>
                                        </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="pt-2 pl-4 space-y-2">
                                        {partChapters.map((chapter) => {
                                            const CH1_SECTIONS: ISection[] = [
                                                { id: 'ch1-A', textbookId: masterBook?.id || '', chapterId: 'ch-1', letter: 'A', title: 'Tax Treatment of Corporations and Shareholders', startPage: 3, endPage: 6 },
                                                { id: 'ch1-B', textbookId: masterBook?.id || '', chapterId: 'ch-1', letter: 'B', title: 'Tax Treatment of Partnerships and S Corporations', startPage: 6, endPage: 11 },
                                                { id: 'ch1-C', textbookId: masterBook?.id || '', chapterId: 'ch-1', letter: 'C', title: 'Taxation of Corporate Income in the United States', startPage: 12, endPage: 18 },
                                                { id: 'ch1-D', textbookId: masterBook?.id || '', chapterId: 'ch-1', letter: 'D', title: 'Choice of Business Entity', startPage: 18, endPage: 32 },
                                                { id: 'ch1-E', textbookId: masterBook?.id || '', chapterId: 'ch-1', letter: 'E', title: 'Classification of Business Entities', startPage: 33, endPage: 47 },
                                                { id: 'ch1-F', textbookId: masterBook?.id || '', chapterId: 'ch-1', letter: 'F', title: 'Integration of Corporate and Individual Taxes', startPage: 47, endPage: 60 },
                                                { id: 'ch1-G', textbookId: masterBook?.id || '', chapterId: 'ch-1', letter: 'G', title: 'Tax Expenditure Analysis', startPage: 60, endPage: 64 },
                                                { id: 'ch1-H', textbookId: masterBook?.id || '', chapterId: 'ch-1', letter: 'H', title: 'Tax Planning and Business Strategies', startPage: 64, endPage: 68 },
                                            ];

                                            const chapterSections = chapter.number === 1
                                                ? CH1_SECTIONS
                                                : sections.filter(s => s.chapterId === chapter.id);
                                            const markers = getChapterMarkers(chapter.id);
                                            const problemCount = markers.filter(m => m.type === 'problem').length;
                                            const caseCount = markers.filter(m => m.type === 'case').length;

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
                                                        {/* Sections List */}
                                                        <div>
                                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                                                Sections ({chapterSections.length}) - Click to read
                                                            </h4>
                                                            <div className="space-y-1">
                                                                {chapterSections.map((section) => (
                                                                    <div
                                                                        key={section.id}
                                                                        className="flex items-center gap-2 p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors group"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (chapter.number === 1) {
                                                                                window.location.href = `/chapter/1#section-${section.letter}`;
                                                                            } else {
                                                                                loadSectionContent(section, chapter);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Badge variant="outline" className="font-mono text-xs bg-blue-50 group-hover:bg-blue-100">
                                                                            {section.letter}.
                                                                        </Badge>
                                                                        <span className="text-sm group-hover:text-blue-700 dark:group-hover:text-blue-300">{section.title}</span>
                                                                        <span className="text-xs text-muted-foreground ml-auto font-mono">
                                                                            p. {section.startPage}
                                                                        </span>
                                                                        <BookOpenCheck size={14} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            );
                                        })}
                                    </CollapsibleContent>
                                </Collapsible>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-center pt-8 pb-4">
                <Button
                    variant="outline"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={async () => {
                        if (confirm("Are you sure? This will delete all local textbook data and re-download it.")) {
                            const { clearTextbook } = await import('@/lib/import-textbook');
                            await clearTextbook();
                            window.location.reload();
                        }
                    }}
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Reset Course Data (Force Re-download)
                </Button>
            </div>
        </div >
    );
};

export default TextbookPage;