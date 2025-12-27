/**
 * Navigation Store - Zustand store for textbook navigation
 * 
 * Handles:
 * - Current page/section tracking
 * - Navigation history (back/forward)
 * - TOC structure derived from content breadcrumbs
 * - Session persistence (resume reading)
 * - Quick-jump functionality
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export interface PageData {
    pageNumber: number;
    chapterId: string;
    sectionId: string;
    content: string;  // Breadcrumb string like "TAXATION > Chapter 3 > B. Debt vs. Equity"
    footnotes: string[];
}

export interface TOCItem {
    id: string;
    title: string;
    level: 'part' | 'chapter' | 'section';
    startPage: number;
    endPage: number;
    pageCount: number;
    children: TOCItem[];
}

export interface NavigationHistoryEntry {
    pageNumber: number;
    sectionId: string;
    scrollY: number;
    timestamp: number;
}

export interface RecentLocation {
    pageNumber: number;
    sectionId: string;
    sectionTitle: string;
    timestamp: number;
}

export interface NavigationState {
    // Current position
    currentPage: number;
    currentChapterId: string;
    currentSectionId: string;
    currentBreadcrumb: string[];
    
    // Pages data
    pages: PageData[];
    totalPages: number;
    
    // TOC structure (derived from pages)
    tocItems: TOCItem[];
    
    // Section info
    sectionStartPage: number;
    sectionEndPage: number;
    sectionPageIndex: number;  // 0-based index within section
    sectionPageCount: number;
    
    // Navigation history
    historyStack: NavigationHistoryEntry[];
    historyIndex: number;  // Current position in history (-1 = at latest)
    
    // Recent locations (for resume)
    recentLocations: RecentLocation[];
    
    // UI state
    isTOCOpen: boolean;
    isQuickJumpOpen: boolean;
}

export interface NavigationActions {
    // Initialize with page data
    setPages: (pages: PageData[]) => void;
    
    // Navigation
    goToPage: (pageNumber: number, addToHistory?: boolean) => void;
    goToSection: (sectionId: string) => void;
    goToNextPage: () => void;
    goToPrevPage: () => void;
    goToNextSection: () => void;
    goToPrevSection: () => void;
    goToSectionStart: () => void;
    goToSectionEnd: () => void;
    
    // History navigation
    goBack: () => void;
    goForward: () => void;
    canGoBack: () => boolean;
    canGoForward: () => boolean;
    
    // Quick jump
    searchPages: (query: string) => PageData[];
    
    // UI toggles
    toggleTOC: () => void;
    setTOCOpen: (open: boolean) => void;
    toggleQuickJump: () => void;
    setQuickJumpOpen: (open: boolean) => void;
    
    // Persistence
    saveCurrentPosition: (scrollY: number) => void;
    getResumePosition: () => RecentLocation | null;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Parse breadcrumb string into array
 * "TAXATION > Chapter 3 > B. Debt vs. Equity" → ["TAXATION", "Chapter 3", "B. Debt vs. Equity"]
 */
function parseBreadcrumb(content: string): string[] {
    return content.split(' > ').map(s => s.trim()).filter(Boolean);
}

/**
 * Build TOC structure from pages data
 */
function buildTOC(pages: PageData[]): TOCItem[] {
    const tocMap = new Map<string, TOCItem>();
    
    for (const page of pages) {
        const breadcrumb = parseBreadcrumb(page.content);
        if (breadcrumb.length < 2) continue;
        
        const partTitle = breadcrumb[0];
        const chapterTitle = breadcrumb[1];
        const sectionTitle = breadcrumb[2] || '';
        
        // Part level
        const partId = partTitle.toLowerCase().replace(/\s+/g, '-');
        if (!tocMap.has(partId)) {
            tocMap.set(partId, {
                id: partId,
                title: partTitle,
                level: 'part',
                startPage: page.pageNumber,
                endPage: page.pageNumber,
                pageCount: 1,
                children: [],
            });
        } else {
            const part = tocMap.get(partId)!;
            part.endPage = Math.max(part.endPage, page.pageNumber);
            part.pageCount = part.endPage - part.startPage + 1;
        }
        
        // Chapter level
        const chapterId = page.chapterId || `${partId}-${chapterTitle.toLowerCase().replace(/\s+/g, '-')}`;
        const part = tocMap.get(partId)!;
        let chapter = part.children.find(c => c.id === chapterId);
        
        if (!chapter) {
            chapter = {
                id: chapterId,
                title: chapterTitle,
                level: 'chapter',
                startPage: page.pageNumber,
                endPage: page.pageNumber,
                pageCount: 1,
                children: [],
            };
            part.children.push(chapter);
        } else {
            chapter.endPage = Math.max(chapter.endPage, page.pageNumber);
            chapter.pageCount = chapter.endPage - chapter.startPage + 1;
        }
        
        // Section level
        if (sectionTitle) {
            const sectionId = page.sectionId || `${chapterId}-${sectionTitle.toLowerCase().replace(/\s+/g, '-')}`;
            let section = chapter.children.find(s => s.id === sectionId);
            
            if (!section) {
                section = {
                    id: sectionId,
                    title: sectionTitle,
                    level: 'section',
                    startPage: page.pageNumber,
                    endPage: page.pageNumber,
                    pageCount: 1,
                    children: [],
                };
                chapter.children.push(section);
            } else {
                section.endPage = Math.max(section.endPage, page.pageNumber);
                section.pageCount = section.endPage - section.startPage + 1;
            }
        }
    }
    
    return Array.from(tocMap.values());
}

/**
 * Get section info for a page
 */
function getSectionInfo(pages: PageData[], pageNumber: number): {
    sectionId: string;
    startPage: number;
    endPage: number;
    pageIndex: number;
    pageCount: number;
} {
    const currentPage = pages.find(p => p.pageNumber === pageNumber);
    if (!currentPage) {
        return { sectionId: '', startPage: pageNumber, endPage: pageNumber, pageIndex: 0, pageCount: 1 };
    }
    
    const sectionId = currentPage.sectionId;
    const sectionPages = pages.filter(p => p.sectionId === sectionId);
    
    if (sectionPages.length === 0) {
        return { sectionId, startPage: pageNumber, endPage: pageNumber, pageIndex: 0, pageCount: 1 };
    }
    
    const startPage = Math.min(...sectionPages.map(p => p.pageNumber));
    const endPage = Math.max(...sectionPages.map(p => p.pageNumber));
    const pageIndex = pageNumber - startPage;
    
    return {
        sectionId,
        startPage,
        endPage,
        pageIndex,
        pageCount: sectionPages.length,
    };
}

// ============================================================================
// STORE
// ============================================================================

export const useNavigationStore = create<NavigationState & NavigationActions>()(
    persist(
        (set, get) => ({
            // Initial state
            currentPage: 1,
            currentChapterId: '',
            currentSectionId: '',
            currentBreadcrumb: [],
            pages: [],
            totalPages: 0,
            tocItems: [],
            sectionStartPage: 1,
            sectionEndPage: 1,
            sectionPageIndex: 0,
            sectionPageCount: 1,
            historyStack: [],
            historyIndex: -1,
            recentLocations: [],
            isTOCOpen: false,
            isQuickJumpOpen: false,

            // Initialize with page data
            setPages: (pages) => {
                const tocItems = buildTOC(pages);
                const sectionInfo = pages.length > 0 ? getSectionInfo(pages, 1) : {
                    sectionId: '',
                    startPage: 1,
                    endPage: 1,
                    pageIndex: 0,
                    pageCount: 1,
                };
                const firstPage = pages[0];
                
                set({
                    pages,
                    totalPages: pages.length,
                    tocItems,
                    currentPage: 1,
                    currentChapterId: firstPage?.chapterId || '',
                    currentSectionId: firstPage?.sectionId || '',
                    currentBreadcrumb: firstPage ? parseBreadcrumb(firstPage.content) : [],
                    sectionStartPage: sectionInfo.startPage,
                    sectionEndPage: sectionInfo.endPage,
                    sectionPageIndex: sectionInfo.pageIndex,
                    sectionPageCount: sectionInfo.pageCount,
                });
            },

            // Go to specific page
            goToPage: (pageNumber, addToHistory = true) => {
                const { pages, currentPage, currentSectionId, historyStack, historyIndex } = get();
                const targetPage = pages.find(p => p.pageNumber === pageNumber);
                
                if (!targetPage) return;
                
                const sectionInfo = getSectionInfo(pages, pageNumber);
                
                // Add to history if this is a significant navigation (different section)
                let newHistoryStack = historyStack;
                let newHistoryIndex = historyIndex;
                
                if (addToHistory && currentSectionId !== sectionInfo.sectionId) {
                    // Truncate forward history if we're not at the end
                    if (historyIndex < historyStack.length - 1) {
                        newHistoryStack = historyStack.slice(0, historyIndex + 1);
                    }
                    
                    // Add current position to history
                    newHistoryStack = [...newHistoryStack, {
                        pageNumber: currentPage,
                        sectionId: currentSectionId,
                        scrollY: window.scrollY,
                        timestamp: Date.now(),
                    }];
                    newHistoryIndex = newHistoryStack.length - 1;
                }
                
                set({
                    currentPage: pageNumber,
                    currentChapterId: targetPage.chapterId,
                    currentSectionId: targetPage.sectionId,
                    currentBreadcrumb: parseBreadcrumb(targetPage.content),
                    sectionStartPage: sectionInfo.startPage,
                    sectionEndPage: sectionInfo.endPage,
                    sectionPageIndex: sectionInfo.pageIndex,
                    sectionPageCount: sectionInfo.pageCount,
                    historyStack: newHistoryStack,
                    historyIndex: newHistoryIndex,
                });
            },

            // Go to section by ID
            goToSection: (sectionId) => {
                const { pages } = get();
                const sectionPage = pages.find(p => p.sectionId === sectionId);
                if (sectionPage) {
                    get().goToPage(sectionPage.pageNumber, true);
                }
            },

            // Navigation helpers
            goToNextPage: () => {
                const { currentPage, totalPages } = get();
                if (currentPage < totalPages) {
                    get().goToPage(currentPage + 1, false);
                }
            },

            goToPrevPage: () => {
                const { currentPage } = get();
                if (currentPage > 1) {
                    get().goToPage(currentPage - 1, false);
                }
            },

            goToNextSection: () => {
                const { pages, currentSectionId } = get();
                const currentIndex = pages.findIndex(p => p.sectionId === currentSectionId);
                
                // Find first page of next section
                for (let i = currentIndex + 1; i < pages.length; i++) {
                    if (pages[i].sectionId !== currentSectionId) {
                        get().goToPage(pages[i].pageNumber, true);
                        return;
                    }
                }
            },

            goToPrevSection: () => {
                const { pages, currentSectionId, sectionStartPage } = get();
                
                // If not at section start, go to section start
                const { currentPage } = get();
                if (currentPage > sectionStartPage) {
                    get().goToPage(sectionStartPage, true);
                    return;
                }
                
                // Find previous section
                const currentIndex = pages.findIndex(p => p.pageNumber === sectionStartPage);
                if (currentIndex > 0) {
                    const prevPage = pages[currentIndex - 1];
                    const prevSectionInfo = getSectionInfo(pages, prevPage.pageNumber);
                    get().goToPage(prevSectionInfo.startPage, true);
                }
            },

            goToSectionStart: () => {
                const { sectionStartPage } = get();
                get().goToPage(sectionStartPage, false);
            },

            goToSectionEnd: () => {
                const { sectionEndPage } = get();
                get().goToPage(sectionEndPage, false);
            },

            // History navigation
            goBack: () => {
                const { historyStack, historyIndex } = get();
                if (historyIndex >= 0 && historyStack.length > 0) {
                    const entry = historyStack[historyIndex];
                    set({ historyIndex: historyIndex - 1 });
                    get().goToPage(entry.pageNumber, false);
                    window.scrollTo(0, entry.scrollY);
                }
            },

            goForward: () => {
                const { historyStack, historyIndex } = get();
                if (historyIndex < historyStack.length - 1) {
                    const entry = historyStack[historyIndex + 1];
                    set({ historyIndex: historyIndex + 1 });
                    get().goToPage(entry.pageNumber, false);
                    window.scrollTo(0, entry.scrollY);
                }
            },

            canGoBack: () => {
                const { historyStack, historyIndex } = get();
                return historyIndex >= 0 && historyStack.length > 0;
            },

            canGoForward: () => {
                const { historyStack, historyIndex } = get();
                return historyIndex < historyStack.length - 1;
            },

            // Search
            searchPages: (query) => {
                const { pages } = get();
                const normalizedQuery = query.toLowerCase().trim();
                
                // Check for IRC section reference (e.g., "351", "§ 351")
                const ircMatch = normalizedQuery.match(/§?\s*(\d+)/);
                if (ircMatch) {
                    const sectionNum = ircMatch[1];
                    return pages.filter(p => 
                        p.content.toLowerCase().includes(`§ ${sectionNum}`) ||
                        p.content.toLowerCase().includes(`section ${sectionNum}`)
                    );
                }
                
                // Fuzzy search on content
                return pages.filter(p => 
                    p.content.toLowerCase().includes(normalizedQuery)
                ).slice(0, 20);
            },

            // UI toggles
            toggleTOC: () => set(state => ({ isTOCOpen: !state.isTOCOpen })),
            setTOCOpen: (open) => set({ isTOCOpen: open }),
            toggleQuickJump: () => set(state => ({ isQuickJumpOpen: !state.isQuickJumpOpen })),
            setQuickJumpOpen: (open) => set({ isQuickJumpOpen: open }),

            // Persistence
            saveCurrentPosition: (scrollY) => {
                const { currentPage, currentSectionId, currentBreadcrumb, recentLocations } = get();
                
                const newLocation: RecentLocation = {
                    pageNumber: currentPage,
                    sectionId: currentSectionId,
                    sectionTitle: currentBreadcrumb[currentBreadcrumb.length - 1] || '',
                    timestamp: Date.now(),
                };
                
                // Keep last 5 unique locations
                const filtered = recentLocations.filter(l => l.sectionId !== currentSectionId);
                const updated = [newLocation, ...filtered].slice(0, 5);
                
                set({ recentLocations: updated });
                
                // Also save to localStorage directly for quick resume
                localStorage.setItem('textbook-last-position', JSON.stringify({
                    ...newLocation,
                    scrollY,
                }));
            },

            getResumePosition: () => {
                const stored = localStorage.getItem('textbook-last-position');
                if (stored) {
                    try {
                        return JSON.parse(stored);
                    } catch {
                        return null;
                    }
                }
                return null;
            },
        }),
        {
            name: 'textbook-navigation',
            partialize: (state) => ({
                recentLocations: state.recentLocations,
            }),
        }
    )
);

// ============================================================================
// KEYBOARD SHORTCUTS HOOK
// ============================================================================

export function useNavigationKeyboard() {
    const { 
        goToNextPage, 
        goToPrevPage, 
        goToNextSection, 
        goToPrevSection,
        goBack,
        goForward,
        toggleQuickJump,
        canGoBack,
        canGoForward,
    } = useNavigationStore();

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Cmd/Ctrl + G = Quick Jump
            if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
                e.preventDefault();
                toggleQuickJump();
                return;
            }

            // Arrow keys for page navigation
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                goToNextPage();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                goToPrevPage();
            }

            // [ and ] for section navigation
            if (e.key === '[') {
                e.preventDefault();
                goToPrevSection();
            } else if (e.key === ']') {
                e.preventDefault();
                goToNextSection();
            }

            // Backspace or Alt+Left for history back
            if (e.key === 'Backspace' || (e.altKey && e.key === 'ArrowLeft')) {
                if (canGoBack()) {
                    e.preventDefault();
                    goBack();
                }
            }

            // Alt+Right for history forward
            if (e.altKey && e.key === 'ArrowRight') {
                if (canGoForward()) {
                    e.preventDefault();
                    goForward();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToNextPage, goToPrevPage, goToNextSection, goToPrevSection, goBack, goForward, toggleQuickJump, canGoBack, canGoForward]);
}

// Need React for the hook
import React from 'react';
