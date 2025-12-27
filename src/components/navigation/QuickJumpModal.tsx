/**
 * QuickJumpModal - Cmd/Ctrl+G quick navigation modal
 * 
 * Features:
 * - Type page number to jump directly
 * - Type IRC section (e.g., "351") to find matching content
 * - Fuzzy search on section titles
 */

import React from 'react';
import { useNavigationStore, PageData } from '@/stores/navigation-store';
import { cn } from '@/lib/utils';
import { Search, Hash, FileText, X } from 'lucide-react';

export function QuickJumpModal() {
    const {
        isQuickJumpOpen,
        setQuickJumpOpen,
        totalPages,
        goToPage,
        searchPages,
    } = useNavigationStore();
    
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState<PageData[]>([]);
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const inputRef = React.useRef<HTMLInputElement>(null);
    
    // Focus input when opened
    React.useEffect(() => {
        if (isQuickJumpOpen) {
            setQuery('');
            setResults([]);
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isQuickJumpOpen]);
    
    // Search as user types
    React.useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        
        // Check if it's a page number
        const pageNum = parseInt(query);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
            setResults([]);
            return;
        }
        
        // Search for matching content
        const matches = searchPages(query);
        setResults(matches);
        setSelectedIndex(0);
    }, [query, searchPages, totalPages]);
    
    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setQuickJumpOpen(false);
            return;
        }
        
        if (e.key === 'Enter') {
            e.preventDefault();
            
            // Direct page number
            const pageNum = parseInt(query);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                goToPage(pageNum, true);
                setQuickJumpOpen(false);
                return;
            }
            
            // Select from results
            if (results.length > 0 && selectedIndex < results.length) {
                goToPage(results[selectedIndex].pageNumber, true);
                setQuickJumpOpen(false);
                return;
            }
        }
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        }
        
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        }
    };
    
    if (!isQuickJumpOpen) {
        return null;
    }
    
    const isValidPageNumber = !isNaN(parseInt(query)) && parseInt(query) >= 1 && parseInt(query) <= totalPages;
    
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/40 dark:bg-black/60"
                onClick={() => setQuickJumpOpen(false)}
            />
            
            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden">
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                    <Search size={20} className="text-slate-400 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Page number, § section, or search..."
                        className={cn(
                            "flex-1 bg-transparent outline-none",
                            "text-slate-900 dark:text-slate-100",
                            "placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        )}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                    />
                    <button
                        onClick={() => setQuickJumpOpen(false)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X size={18} className="text-slate-400" />
                    </button>
                </div>
                
                {/* Results */}
                <div className="max-h-64 overflow-y-auto">
                    {/* Direct page jump hint */}
                    {isValidPageNumber && (
                        <button
                            onClick={() => {
                                goToPage(parseInt(query), true);
                                setQuickJumpOpen(false);
                            }}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 text-left",
                                "bg-blue-50 dark:bg-blue-900/30",
                                "hover:bg-blue-100 dark:hover:bg-blue-900/50",
                                "transition-colors"
                            )}
                        >
                            <Hash size={18} className="text-blue-500 flex-shrink-0" />
                            <div>
                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                    Go to page {query}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                    Press Enter to jump
                                </div>
                            </div>
                        </button>
                    )}
                    
                    {/* Search results */}
                    {results.map((page, index) => (
                        <button
                            key={page.pageNumber}
                            onClick={() => {
                                goToPage(page.pageNumber, true);
                                setQuickJumpOpen(false);
                            }}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 text-left",
                                "hover:bg-slate-50 dark:hover:bg-slate-800",
                                "transition-colors",
                                index === selectedIndex && "bg-slate-100 dark:bg-slate-800"
                            )}
                        >
                            <FileText size={18} className="text-slate-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                                <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                                    {page.content.split(' > ').pop()}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                    {page.content}
                                </div>
                            </div>
                            <div className="text-sm text-slate-400 flex-shrink-0">
                                p. {page.pageNumber}
                            </div>
                        </button>
                    ))}
                    
                    {/* Empty state */}
                    {query && !isValidPageNumber && results.length === 0 && (
                        <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                            No matching sections found
                        </div>
                    )}
                    
                    {/* Help text when empty */}
                    {!query && (
                        <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400 space-y-2">
                            <p>
                                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">123</kbd>
                                {' '}Jump to page number
                            </p>
                            <p>
                                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">§ 351</kbd>
                                {' '}Find IRC section references
                            </p>
                            <p>
                                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">debt</kbd>
                                {' '}Search section titles
                            </p>
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>
                            <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono">↑↓</kbd>
                            {' '}to navigate
                        </span>
                        <span>
                            <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono">Enter</kbd>
                            {' '}to select
                        </span>
                        <span>
                            <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono">Esc</kbd>
                            {' '}to close
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
