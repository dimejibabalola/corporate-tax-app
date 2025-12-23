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
            // Legal/academic styling with stone colors (no blue)
            const classes: Record<number, string> = {
                1: 'text-4xl font-serif font-bold mt-10 mb-6 pb-4 border-b-2 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 tracking-tight',
                2: 'text-2xl font-serif font-bold mt-8 mb-4 pb-2 border-b border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200',
                3: 'text-xl font-serif font-semibold mt-6 mb-3 text-stone-800 dark:text-stone-200',
                4: 'text-lg font-semibold mt-4 mb-2 text-stone-700 dark:text-stone-300'
            };
            return (
                <Tag id={block.anchor} className={classes[block.level] || classes[2]}>
                    {block.text}
                </Tag>
            );
        }

        // EYEBROW: Small uppercase label like "CHAPTER 1" above the real title
        case 'eyebrow':
            return (
                <span className="block text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-2 mt-8">
                    {block.text}
                </span>
            );

        case 'paragraph':
            return (
                <p
                    className="leading-relaxed mb-4 text-stone-700 dark:text-stone-300 text-justify hyphens-auto"
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

        case 'table':
            return (
                <div className="my-6 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                                {block.headers.map((h, i) => (
                                    <th
                                        key={i}
                                        scope="col"
                                        className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-xs"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                            {block.rows.map((row, i) => (
                                <tr key={i} className="even:bg-slate-50/50 dark:even:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    {row.map((cell, j) => (
                                        <td key={j} className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {block.caption && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-center text-xs text-muted-foreground italic">{block.caption}</p>
                        </div>
                    )}
                </div>
            );

        case 'check_prompt':
            // Handled separately by CheckPromptCard
            return null;

        // MinerU 2.6 Block Types
        case 'htmlTable':
            return (
                <div className="my-6 overflow-x-auto">
                    <div
                        className="mineru-table prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: block.html }}
                    />
                    {block.caption && (
                        <p className="text-center text-xs text-muted-foreground italic mt-2">{block.caption}</p>
                    )}
                    {block.footnotes && block.footnotes.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-2 pl-4 border-l-2 border-gray-200">
                            {block.footnotes.map((fn, i) => (
                                <p key={i}>{fn}</p>
                            ))}
                        </div>
                    )}
                </div>
            );

        case 'image':
            return (
                <figure className="my-6 flex flex-col items-center">
                    <img
                        src={block.src}
                        alt={block.alt || block.caption || 'Figure'}
                        className="max-w-full h-auto rounded-lg shadow-sm"
                        loading="lazy"
                    />
                    {block.caption && (
                        <figcaption className="mt-2 text-sm text-muted-foreground italic text-center">
                            {block.caption}
                        </figcaption>
                    )}
                    {block.footnotes && block.footnotes.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-2">
                            {block.footnotes.map((fn, i) => (
                                <p key={i}>{fn}</p>
                            ))}
                        </div>
                    )}
                </figure>
            );

        case 'equation':
            return (
                <div className="my-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg overflow-x-auto">
                    {block.latex ? (
                        <pre className="font-mono text-sm text-center">{block.latex}</pre>
                    ) : block.imageSrc ? (
                        <img
                            src={block.imageSrc}
                            alt="Equation"
                            className="mx-auto max-w-full h-auto"
                            loading="lazy"
                        />
                    ) : (
                        <span className="text-muted-foreground italic">Equation</span>
                    )}
                </div>
            );

        default:
            return null;
    }
};

export default ReaderBlock;