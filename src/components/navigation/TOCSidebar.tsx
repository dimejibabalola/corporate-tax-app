/**
 * TOCSidebar - Slide-out Table of Contents
 * 
 * Shows hierarchical navigation: Part > Chapter > Section
 * With page ranges and current location highlighting
 */

import React from 'react';
import { useNavigationStore, TOCItem } from '@/stores/navigation-store';
import { cn } from '@/lib/utils';
import { X, ChevronRight, ChevronDown, BookOpen } from 'lucide-react';

// ============================================================================
// TOC ITEM COMPONENT
// ============================================================================

interface TOCItemProps {
    item: TOCItem;
    currentSectionId: string;
    onNavigate: (pageNumber: number) => void;
    depth?: number;
}

function TOCItemRow({ item, currentSectionId, onNavigate, depth = 0 }: TOCItemProps) {
    const [isExpanded, setIsExpanded] = React.useState(
        // Auto-expand if current section is within this item
        item.children.some(c => c.id === currentSectionId || c.children.some(s => s.id === currentSectionId))
    );
    
    const isCurrentSection = item.id === currentSectionId;
    const hasChildren = item.children.length > 0;
    
    const handleClick = () => {
        if (hasChildren) {
            setIsExpanded(!isExpanded);
        } else {
            onNavigate(item.startPage);
        }
    };
    
    const handleNavigate = (e: React.MouseEvent) => {
        e.stopPropagation();
        onNavigate(item.startPage);
    };
    
    return (
        <div className="select-none">
            <div
                className={cn(
                    "flex items-center gap-2 px-3 py-2 cursor-pointer rounded-md transition-colors",
                    "hover:bg-slate-100 dark:hover:bg-slate-800",
                    isCurrentSection && "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
                    depth === 0 && "font-semibold text-slate-900 dark:text-slate-100",
                    depth === 1 && "font-medium text-slate-800 dark:text-slate-200 ml-2",
                    depth === 2 && "text-sm text-slate-600 dark:text-slate-400 ml-4"
                )}
                onClick={handleClick}
                style={{ paddingLeft: `${12 + depth * 12}px` }}
            >
                {/* Expand/collapse icon */}
                {hasChildren ? (
                    <span className="w-4 h-4 flex items-center justify-center text-slate-400">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                ) : (
                    <span className="w-4 h-4" />
                )}
                
                {/* Title */}
                <span 
                    className="flex-1 truncate"
                    onClick={handleNavigate}
                >
                    {item.title}
                </span>
                
                {/* Page range */}
                <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    {item.startPage === item.endPage 
                        ? `p. ${item.startPage}`
                        : `pp. ${item.startPage}–${item.endPage}`
                    }
                </span>
            </div>
            
            {/* Children */}
            {hasChildren && isExpanded && (
                <div className="ml-2">
                    {item.children.map(child => (
                        <TOCItemRow
                            key={child.id}
                            item={child}
                            currentSectionId={currentSectionId}
                            onNavigate={onNavigate}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TOCSidebar() {
    const { 
        isTOCOpen, 
        setTOCOpen, 
        tocItems, 
        currentSectionId,
        goToPage,
    } = useNavigationStore();
    
    const handleNavigate = (pageNumber: number) => {
        goToPage(pageNumber, true);
        setTOCOpen(false);
    };
    
    // Close on escape
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isTOCOpen) {
                setTOCOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isTOCOpen, setTOCOpen]);
    
    return (
        <>
            {/* Backdrop */}
            {isTOCOpen && (
                <div 
                    className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 transition-opacity"
                    onClick={() => setTOCOpen(false)}
                />
            )}
            
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white dark:bg-slate-900 shadow-xl z-50",
                    "transform transition-transform duration-300 ease-out",
                    "flex flex-col",
                    isTOCOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <BookOpen size={20} className="text-blue-600 dark:text-blue-400" />
                        <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                            Table of Contents
                        </h2>
                    </div>
                    <button
                        onClick={() => setTOCOpen(false)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Close table of contents"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto py-2">
                    {tocItems.length === 0 ? (
                        <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                            <p>No table of contents available.</p>
                            <p className="text-sm mt-2">Load a textbook to see navigation.</p>
                        </div>
                    ) : (
                        tocItems.map(item => (
                            <TOCItemRow
                                key={item.id}
                                item={item}
                                currentSectionId={currentSectionId}
                                onNavigate={handleNavigate}
                            />
                        ))
                    )}
                </div>
            </aside>
        </>
    );
}

// ============================================================================
// TOC TOGGLE BUTTON
// ============================================================================

export function TOCToggleButton() {
    const { toggleTOC } = useNavigationStore();
    
    return (
        <button
            onClick={toggleTOC}
            className={cn(
                "p-2 rounded-lg",
                "bg-white dark:bg-slate-800",
                "border border-slate-200 dark:border-slate-700",
                "shadow-sm hover:shadow",
                "transition-all",
                "text-slate-600 dark:text-slate-300",
                "hover:text-blue-600 dark:hover:text-blue-400"
            )}
            aria-label="Open table of contents"
            title="Table of Contents"
        >
            <BookOpen size={20} />
        </button>
    );
}
