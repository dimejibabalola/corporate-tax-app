/**
 * SectionProgressBar - Visual progress indicator within current section
 * 
 * Features:
 * - Clickable progress bar to jump to position
 * - Page dots mini-map
 * - Section start/end quick buttons
 */

import React from 'react';
import { useNavigationStore } from '@/stores/navigation-store';
import { cn } from '@/lib/utils';
import { ChevronFirst, ChevronLast } from 'lucide-react';

// ============================================================================
// PROGRESS BAR
// ============================================================================

export function SectionProgressBar() {
    const {
        sectionPageIndex,
        sectionPageCount,
        sectionStartPage,
        goToPage,
        goToSectionStart,
        goToSectionEnd,
    } = useNavigationStore();
    
    const progressPercent = sectionPageCount > 1 
        ? (sectionPageIndex / (sectionPageCount - 1)) * 100 
        : 100;
    
    const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = clickX / rect.width;
        const targetIndex = Math.round(percent * (sectionPageCount - 1));
        const targetPage = sectionStartPage + targetIndex;
        goToPage(targetPage, false);
    };
    
    if (sectionPageCount <= 1) {
        return null;
    }
    
    return (
        <div className="flex items-center gap-2">
            {/* Section start button */}
            <button
                onClick={goToSectionStart}
                disabled={sectionPageIndex === 0}
                className={cn(
                    "p-1.5 rounded transition-colors",
                    "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
                    "disabled:opacity-30 disabled:cursor-not-allowed"
                )}
                aria-label="Go to section start"
                title="Section start"
            >
                <ChevronFirst size={16} />
            </button>
            
            {/* Progress bar */}
            <div 
                className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer relative overflow-hidden group"
                onClick={handleBarClick}
                role="slider"
                aria-valuenow={sectionPageIndex + 1}
                aria-valuemin={1}
                aria-valuemax={sectionPageCount}
                aria-label={`Page ${sectionPageIndex + 1} of ${sectionPageCount} in section`}
            >
                {/* Progress fill */}
                <div 
                    className="absolute inset-y-0 left-0 bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-150"
                    style={{ width: `${progressPercent}%` }}
                />
                
                {/* Hover indicator */}
                <div className="absolute inset-0 bg-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            {/* Section end button */}
            <button
                onClick={goToSectionEnd}
                disabled={sectionPageIndex === sectionPageCount - 1}
                className={cn(
                    "p-1.5 rounded transition-colors",
                    "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
                    "disabled:opacity-30 disabled:cursor-not-allowed"
                )}
                aria-label="Go to section end"
                title="Section end"
            >
                <ChevronLast size={16} />
            </button>
        </div>
    );
}

// ============================================================================
// PAGE DOTS MINI-MAP
// ============================================================================

export function PageDotsMiniMap() {
    const {
        sectionPageIndex,
        sectionPageCount,
        sectionStartPage,
        goToPage,
    } = useNavigationStore();
    
    if (sectionPageCount <= 1) {
        return null;
    }
    
    // Limit to max 20 dots, show subset if more
    const maxDots = 20;
    const showAllDots = sectionPageCount <= maxDots;
    
    const dots = [];
    
    if (showAllDots) {
        for (let i = 0; i < sectionPageCount; i++) {
            dots.push(i);
        }
    } else {
        // Show first few, current area, and last few
        const firstCount = 3;
        const lastCount = 3;
        const aroundCurrent = 2;
        
        // First pages
        for (let i = 0; i < firstCount; i++) {
            dots.push(i);
        }
        
        // Around current (if not overlapping with first/last)
        const currentStart = Math.max(firstCount, sectionPageIndex - aroundCurrent);
        const currentEnd = Math.min(sectionPageCount - lastCount - 1, sectionPageIndex + aroundCurrent);
        
        if (currentStart > firstCount) {
            dots.push(-1); // Ellipsis marker
        }
        
        for (let i = currentStart; i <= currentEnd; i++) {
            if (!dots.includes(i)) {
                dots.push(i);
            }
        }
        
        if (currentEnd < sectionPageCount - lastCount - 1) {
            dots.push(-2); // Ellipsis marker
        }
        
        // Last pages
        for (let i = sectionPageCount - lastCount; i < sectionPageCount; i++) {
            if (!dots.includes(i)) {
                dots.push(i);
            }
        }
    }
    
    return (
        <div className="flex items-center gap-1 flex-wrap justify-center">
            {dots.map((pageIndex, i) => {
                if (pageIndex < 0) {
                    return (
                        <span key={`ellipsis-${i}`} className="text-slate-400 px-1">
                            ···
                        </span>
                    );
                }
                
                const isCurrent = pageIndex === sectionPageIndex;
                const targetPage = sectionStartPage + pageIndex;
                
                return (
                    <button
                        key={pageIndex}
                        onClick={() => goToPage(targetPage, false)}
                        className={cn(
                            "w-2 h-2 rounded-full transition-all",
                            isCurrent 
                                ? "bg-blue-500 dark:bg-blue-400 scale-125" 
                                : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500"
                        )}
                        aria-label={`Go to page ${targetPage}`}
                        title={`Page ${targetPage}`}
                    />
                );
            })}
        </div>
    );
}

// ============================================================================
// COMBINED SECTION NAVIGATOR
// ============================================================================

export function SectionNavigator() {
    const { sectionPageIndex, sectionPageCount, currentBreadcrumb } = useNavigationStore();
    
    const sectionTitle = currentBreadcrumb[currentBreadcrumb.length - 1] || 'Current Section';
    
    return (
        <div className="space-y-2">
            {/* Section title and position */}
            <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium">{sectionTitle}</span>
                {sectionPageCount > 1 && (
                    <span className="ml-2">
                        ({sectionPageIndex + 1} of {sectionPageCount})
                    </span>
                )}
            </div>
            
            {/* Progress bar */}
            <SectionProgressBar />
            
            {/* Page dots (only for reasonable section sizes) */}
            {sectionPageCount > 1 && sectionPageCount <= 30 && (
                <div className="pt-1">
                    <PageDotsMiniMap />
                </div>
            )}
        </div>
    );
}
