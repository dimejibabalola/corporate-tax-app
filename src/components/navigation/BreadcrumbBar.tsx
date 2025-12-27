/**
 * BreadcrumbBar - Persistent top navigation bar
 * 
 * Shows:
 * - Clickable breadcrumb path (Part > Chapter > Section)
 * - Current page number
 * - Position within section
 * - Back/Forward navigation
 */

import React from 'react';
import { useNavigationStore } from '@/stores/navigation-store';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronLeft, ChevronRight as Forward, Menu } from 'lucide-react';
import { TOCToggleButton } from './TOCSidebar';

export function BreadcrumbBar() {
    const {
        currentPage,
        currentBreadcrumb,
        sectionPageIndex,
        sectionPageCount,
        totalPages,
        goBack,
        goForward,
        canGoBack,
        canGoForward,
        goToSection,
        pages,
        toggleTOC,
    } = useNavigationStore();
    
    // Find section/chapter to navigate to when clicking breadcrumb
    const handleBreadcrumbClick = (index: number) => {
        // Get the partial breadcrumb up to this level
        const targetBreadcrumb = currentBreadcrumb.slice(0, index + 1).join(' > ');
        
        // Find first page matching this breadcrumb prefix
        const targetPage = pages.find(p => p.content.startsWith(targetBreadcrumb));
        if (targetPage) {
            goToSection(targetPage.sectionId);
        }
    };
    
    return (
        <div className={cn(
            "sticky top-0 z-30",
            "bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm",
            "border-b border-slate-200 dark:border-slate-700",
            "px-3 py-2"
        )}>
            <div className="flex items-center gap-2">
                {/* TOC Toggle */}
                <button
                    onClick={toggleTOC}
                    className={cn(
                        "p-1.5 rounded-lg",
                        "text-slate-500 dark:text-slate-400",
                        "hover:bg-slate-100 dark:hover:bg-slate-800",
                        "transition-colors"
                    )}
                    aria-label="Open table of contents"
                >
                    <Menu size={18} />
                </button>
                
                {/* Back/Forward */}
                <div className="flex items-center">
                    <button
                        onClick={goBack}
                        disabled={!canGoBack()}
                        className={cn(
                            "p-1.5 rounded-l-lg border border-r-0 border-slate-200 dark:border-slate-700",
                            "text-slate-500 dark:text-slate-400",
                            "hover:bg-slate-100 dark:hover:bg-slate-800",
                            "disabled:opacity-30 disabled:cursor-not-allowed",
                            "transition-colors"
                        )}
                        aria-label="Go back"
                        title="Go back"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={goForward}
                        disabled={!canGoForward()}
                        className={cn(
                            "p-1.5 rounded-r-lg border border-slate-200 dark:border-slate-700",
                            "text-slate-500 dark:text-slate-400",
                            "hover:bg-slate-100 dark:hover:bg-slate-800",
                            "disabled:opacity-30 disabled:cursor-not-allowed",
                            "transition-colors"
                        )}
                        aria-label="Go forward"
                        title="Go forward"
                    >
                        <Forward size={16} />
                    </button>
                </div>
                
                {/* Breadcrumb */}
                <nav className="flex-1 min-w-0 flex items-center gap-1 text-sm overflow-x-auto">
                    {currentBreadcrumb.map((segment, index) => (
                        <React.Fragment key={index}>
                            {index > 0 && (
                                <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />
                            )}
                            <button
                                onClick={() => handleBreadcrumbClick(index)}
                                className={cn(
                                    "truncate max-w-[150px] px-1 py-0.5 rounded",
                                    "hover:bg-slate-100 dark:hover:bg-slate-800",
                                    "transition-colors",
                                    index === currentBreadcrumb.length - 1
                                        ? "text-slate-900 dark:text-slate-100 font-medium"
                                        : "text-slate-500 dark:text-slate-400"
                                )}
                                title={segment}
                            >
                                {segment}
                            </button>
                        </React.Fragment>
                    ))}
                </nav>
                
                {/* Page info */}
                <div className="flex-shrink-0 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                        {currentPage}
                    </span>
                    <span className="text-slate-400">of</span>
                    <span>{totalPages}</span>
                    
                    {sectionPageCount > 1 && (
                        <>
                            <span className="text-slate-300 dark:text-slate-600">|</span>
                            <span>
                                {sectionPageIndex + 1}/{sectionPageCount}
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// COMPACT BREADCRUMB (for mobile)
// ============================================================================

export function CompactBreadcrumb() {
    const {
        currentPage,
        currentBreadcrumb,
        sectionPageIndex,
        sectionPageCount,
        toggleTOC,
    } = useNavigationStore();
    
    // Show only last segment on mobile
    const currentSection = currentBreadcrumb[currentBreadcrumb.length - 1] || 'Loading...';
    
    return (
        <div className={cn(
            "sticky top-0 z-30",
            "bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm",
            "border-b border-slate-200 dark:border-slate-700",
            "px-3 py-2"
        )}>
            <div className="flex items-center gap-2">
                {/* TOC Toggle */}
                <button
                    onClick={toggleTOC}
                    className={cn(
                        "p-1.5 rounded-lg",
                        "text-slate-500 dark:text-slate-400",
                        "hover:bg-slate-100 dark:hover:bg-slate-800",
                        "transition-colors"
                    )}
                    aria-label="Open table of contents"
                >
                    <Menu size={18} />
                </button>
                
                {/* Current section */}
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {currentSection}
                    </div>
                </div>
                
                {/* Page info */}
                <div className="flex-shrink-0 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                        p. {currentPage}
                    </span>
                    {sectionPageCount > 1 && (
                        <span className="ml-1">
                            ({sectionPageIndex + 1}/{sectionPageCount})
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
