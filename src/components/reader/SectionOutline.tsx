/**
 * SectionOutline Component
 * 
 * Floating mini-TOC showing headings in current section
 */

import { ContentBlock } from '@/types/reader';
import { ScrollText } from 'lucide-react';

interface SectionOutlineProps {
    blocks: ContentBlock[];
    className?: string;
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50);
}

export const SectionOutline = ({ blocks, className = '' }: SectionOutlineProps) => {
    const headings = blocks.filter(
        b => b.type === 'heading' || b.type === 'case_header' || b.type === 'ruling_header'
    );

    if (headings.length === 0) return null;

    return (
        <nav className={`section-outline ${className}`}>
            <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                <ScrollText className="w-4 h-4" />
                <h4 className="text-sm font-semibold uppercase">In this section</h4>
            </div>
            <ul className="space-y-1">
                {headings.map((h, i) => {
                    let text = '';
                    let anchor = '';
                    let indent = 0;

                    if (h.type === 'heading') {
                        text = h.text;
                        anchor = h.anchor;
                        indent = h.level === 3 ? 1 : h.level === 4 ? 2 : 0;
                    } else if (h.type === 'case_header') {
                        text = h.name;
                        anchor = slugify(h.name);
                        indent = 1;
                    } else if (h.type === 'ruling_header') {
                        text = `Rev. Rul. ${h.number}`;
                        anchor = slugify(text);
                        indent = 1;
                    }

                    return (
                        <li
                            key={i}
                            className={`text-sm ${indent === 1 ? 'pl-3' : indent === 2 ? 'pl-6' : ''}`}
                        >
                            <a
                                href={`#${anchor}`}
                                className="text-muted-foreground hover:text-foreground transition-colors block py-0.5 truncate"
                                title={text}
                            >
                                {text.length > 40 ? `${text.slice(0, 37)}...` : text}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};

export default SectionOutline;