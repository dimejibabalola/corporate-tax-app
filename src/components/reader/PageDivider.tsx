/**
 * PageDivider Component
 * 
 * Visual page separator showing page number and section context
 */

interface PageDividerProps {
    pageNumber: number;
    chapterNumber?: number;
    sectionTitle?: string;
    onViewPdf?: (page: number) => void;
}

export const PageDivider = ({
    pageNumber,
    chapterNumber,
    sectionTitle,
    onViewPdf
}: PageDividerProps) => {
    return (
        <div className="page-divider flex justify-between items-center px-4 py-2 my-6 bg-slate-50 dark:bg-slate-900 border-l-4 border-blue-500 text-sm text-slate-600 dark:text-slate-400">
            <span className="page-number font-semibold">
                Page {pageNumber}
            </span>
            {(chapterNumber || sectionTitle) && (
                <span className="page-context italic">
                    {chapterNumber && `Chapter ${chapterNumber}`}
                    {chapterNumber && sectionTitle && ' · '}
                    {sectionTitle}
                </span>
            )}
            {onViewPdf && (
                <button
                    onClick={() => onViewPdf(pageNumber)}
                    className="text-xs text-blue-500 hover:text-blue-700 hover:underline ml-2"
                >
                    View in PDF
                </button>
            )}
        </div>
    );
};

export default PageDivider;
