/**
 * ReaderBlock Component
 * 
 * Renders individual content blocks with proper styling
 */

import { ContentBlock } from '@/types/reader';
import { Scale, AlertTriangle, BookOpen, FileText } from 'lucide-react';

interface ReaderBlockProps {
    block: ContentBlock;
    onClick?: (block: ContentBlock) => void;
}

export const ReaderBlock = ({ block, onClick }: ReaderBlockProps) => {
    switch (block.type) {
        case 'heading': {
            const Tag = `h${block.level}` as keyof JSX.IntrinsicElements;
            const classes = {
                2: 'text-2xl font-bold mt-8 mb-4 pb-2 border-b-2 border-gray-200 dark:border-gray-700',
                3: 'text-xl font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-200',
                4: 'text-lg font-semibold mt-5 mb-2 text-gray-700 dark:text-gray-300'
            };
            return (
                <Tag id={block.anchor} className={classes[block.level]}>
                    {block.text}
                </Tag>
            );
        }

        case 'paragraph':
            return (
                <p
                    className="leading-relaxed mb-4 text-gray-700 dark:text-gray-300 text-justify hyphens-auto"
                    dangerouslySetInnerHTML={{ __html: block.html }}
                />
            );

        case 'case_header':
            return (
                <div
                    className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 border-l-4 border-blue-500 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => onClick?.(block)}
                >
                    <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-blue-500" />
                        <span className="font-bold text-base tracking-wide" style={{ fontVariant: 'small-caps' }}>
                            {block.name}
                        </span>
                    </div>
                    {block.citation && (
                        <span className="text-sm text-muted-foreground italic ml-6">{block.citation}</span>
                    )}
                </div>
            );

        case 'ruling_header':
            return (
                <div
                    className="mt-5 p-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                    onClick={() => onClick?.(block)}
                >
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-600" />
                        <span className="font-semibold">Revenue Ruling {block.number}</span>
                    </div>
                </div>
            );

        case 'problem':
            return (
                <div className="mt-5 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-r-lg">
                    <div className="flex items-center gap-2 font-semibold text-green-700 dark:text-green-400 mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Problem {block.number ? `#${block.number}` : ''}</span>
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {block.content}
                    </div>
                </div>
            );

        case 'note':
            return (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-sm">
                    <div className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-400 mb-1">
                        <BookOpen className="w-4 h-4" />
                        <span>Note</span>
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                        {block.content}
                    </div>
                </div>
            );

        case 'statute_block':
            return (
                <pre className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-sm whitespace-pre-wrap overflow-x-auto">
                    {block.section && (
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">§ {block.section}</span>
                    )}
                    {block.text}
                </pre>
            );

        case 'blockquote':
            return (
                <blockquote className="mt-4 pl-4 border-l-4 border-gray-300 dark:border-gray-600 italic text-gray-600 dark:text-gray-400">
                    <p>"{block.content}"</p>
                    {block.source && (
                        <cite className="text-sm not-italic">— {block.source}</cite>
                    )}
                </blockquote>
            );

        case 'list':
            const ListTag = block.ordered ? 'ol' : 'ul';
            return (
                <ListTag className={`mt-3 mb-4 pl-6 space-y-1 ${block.ordered ? 'list-decimal' : 'list-disc'}`}>
                    {block.items.map((item, i) => (
                        <li key={i} className="text-gray-700 dark:text-gray-300">{item}</li>
                    ))}
                </ListTag>
            );

        case 'check_prompt':
            // Handled separately by CheckPromptCard
            return null;

        default:
            return null;
    }
};

export default ReaderBlock;