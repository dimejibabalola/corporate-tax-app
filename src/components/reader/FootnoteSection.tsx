/**
 * FootnoteSection Component
 * 
 * Renders footnotes at the bottom of a page block
 */

import { Footnote } from '@/services/text-cleaner';

interface FootnoteSectionProps {
    footnotes: Footnote[];
}

export const FootnoteSection = ({ footnotes }: FootnoteSectionProps) => {
    if (footnotes.length === 0) return null;

    return (
        <div className="page-footnotes mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Footnotes
            </h5>
            <div className="space-y-2">
                {footnotes.map((fn) => (
                    <div key={fn.number} className="footnote text-sm text-gray-600 dark:text-gray-400">
                        <sup className="font-semibold text-blue-600 dark:text-blue-400 mr-1">
                            {fn.number}
                        </sup>
                        <span dangerouslySetInnerHTML={{ __html: formatFootnoteText(fn.text) }} />
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * Format footnote text with proper citation styling
 */
function formatFootnoteText(text: string): string {
    let html = text;

    // Style I.R.C. references
    html = html.replace(
        /I\.R\.C\.\s*§\s*(\d+[A-Za-z]?(?:\([a-z0-9]+\))?)/g,
        '<span class="statute-ref">I.R.C. § $1</span>'
    );

    // Style case citations (italicize case names)
    html = html.replace(
        /([A-Z][a-z]+(?:\s+[A-Z]\.?\s*[a-z]*)?)\s+v\.\s+(Commissioner|United States|[A-Z][a-z]+)/g,
        '<em class="case-ref">$1 v. $2</em>'
    );

    // Style Rev. Rul. references
    html = html.replace(
        /Rev\.\s*Rul\.\s*(\d{2,4}-\d+)/g,
        '<span class="ruling-ref">Rev. Rul. $1</span>'
    );

    // Style Treas. Reg. references
    html = html.replace(
        /Treas\.\s*Reg\.\s*§?\s*([\d.-]+)/g,
        '<span class="reg-ref">Treas. Reg. § $1</span>'
    );

    return html;
}

export default FootnoteSection;
