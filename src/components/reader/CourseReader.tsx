/**
 * CourseReader Component
 * 
 * Professional legal/academic markdown reader using react-markdown with Tailwind Typography.
 * Features:
 * - prose-stone theme (neutral gray/black, no blue)
 * - Serif fonts for headings (legal style)
 * - "Eyebrow" pattern: ***CHAPTER X*** renders as small uppercase label
 * - Proper heading hierarchy with H1 for titles, H2 for sections
 * - Dark mode support
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import type { Components } from 'react-markdown';

interface CourseReaderProps {
    /** The markdown content to render */
    markdownContent: string;
    /** Additional CSS classes to apply to the article wrapper */
    className?: string;
    /** Size variant for prose */
    size?: 'sm' | 'base' | 'lg' | 'xl';
}

/**
 * CourseReader renders MinerU markdown output with professional legal typography.
 * Uses prose-stone for neutral gray/black theme instead of blue.
 * 
 * Special patterns:
 * - ***CHAPTER X*** → Small uppercase eyebrow label
 * - # Title → Massive H1 (text-5xl)
 * - ## Section → Bold H2 (text-2xl)
 * - ### Subsection → Semibold H3 (text-xl)
 */
export function CourseReader({
    markdownContent,
    className = '',
    size = 'lg'
}: CourseReaderProps) {
    // Prose size classes
    const sizeClasses = {
        sm: 'prose-sm',
        base: 'prose-base',
        lg: 'prose-lg',
        xl: 'prose-xl',
    };

    // Custom component renderers
    const components: Components = {
        // H1: Massive title (the REAL title like "AN OVERVIEW OF...")
        h1: ({ children, ...props }) => (
            <h1
                className="text-5xl font-serif font-black tracking-tight leading-tight mb-8 mt-4 text-stone-900 dark:text-stone-100"
                {...props}
            >
                {children}
            </h1>
        ),

        // H2: Section headers (A. INTRODUCTION, B. INFLUENTIAL POLICIES, etc.)
        h2: ({ children, ...props }) => (
            <h2
                className="text-2xl font-serif font-bold mt-10 mb-4 pb-2 border-b border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200"
                {...props}
            >
                {children}
            </h2>
        ),

        // H3: Subsections (1. The Corporate Tax, 2. Multiple Corporations, etc.)
        h3: ({ children, ...props }) => (
            <h3
                className="text-xl font-serif font-semibold mt-8 mb-3 text-stone-800 dark:text-stone-200"
                {...props}
            >
                {children}
            </h3>
        ),

        // H4: Sub-subsections
        h4: ({ children, ...props }) => (
            <h4
                className="text-lg font-semibold mt-6 mb-2 text-stone-700 dark:text-stone-300"
                {...props}
            >
                {children}
            </h4>
        ),

        // EYEBROW PATTERN: ***text*** (strong inside em) renders as small uppercase label
        // This catches "CHAPTER 1" and "PART ONE" eyebrow headers
        em: ({ children, ...props }) => {
            // Check if this is a strong-inside-em pattern (***text***)
            const childArray = Array.isArray(children) ? children : [children];
            const hasStrong = childArray.some(
                (child: unknown) => typeof child === 'object' && child !== null && 'type' in child && (child as { type: string }).type === 'strong'
            );

            // If it contains <strong>, extract the text and style as eyebrow
            if (hasStrong) {
                // Get the text content
                const getText = (node: unknown): string => {
                    if (typeof node === 'string') return node;
                    if (typeof node === 'object' && node !== null && 'props' in node) {
                        const nodeWithProps = node as { props?: { children?: unknown } };
                        return getText(nodeWithProps.props?.children);
                    }
                    if (Array.isArray(node)) return node.map(getText).join('');
                    return '';
                };
                const text = getText(children);

                // Style as eyebrow (small, uppercase, gray, wide tracking)
                return (
                    <span
                        className="block text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-2 mt-8"
                    >
                        {text}
                    </span>
                );
            }

            // Regular italics
            return <em className="italic" {...props}>{children}</em>;
        },

        // Paragraphs with justified text
        p: ({ children, ...props }) => (
            <p
                className="text-justify hyphens-auto leading-relaxed mb-4 text-stone-700 dark:text-stone-300"
                {...props}
            >
                {children}
            </p>
        ),

        // Blockquotes for legal citations
        blockquote: ({ children, ...props }) => (
            <blockquote
                className="border-l-4 border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-900 py-2 px-4 my-4 not-italic"
                {...props}
            >
                {children}
            </blockquote>
        ),

        // Links - understated styling
        a: ({ children, href, ...props }) => (
            <a
                href={href}
                className="text-stone-700 dark:text-stone-300 underline underline-offset-2 decoration-stone-400 hover:text-stone-900 hover:dark:text-stone-100"
                {...props}
            >
                {children}
            </a>
        ),
    };

    return (
        <article
            className={`
                prose 
                ${sizeClasses[size]}
                prose-stone
                max-w-none 
                dark:prose-invert
                
                /* Tables */
                prose-table:text-sm
                prose-th:bg-stone-100
                prose-th:dark:bg-stone-800
                prose-th:font-semibold
                prose-th:text-left
                prose-td:py-2
                
                /* Code */
                prose-code:before:content-none
                prose-code:after:content-none
                prose-code:bg-stone-100
                prose-code:dark:bg-stone-800
                prose-code:px-1.5
                prose-code:py-0.5
                prose-code:rounded
                prose-code:font-normal
                
                /* Custom class for additional styling */
                ${className}
            `}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeRaw, rehypeKatex]}
                components={components}
            >
                {markdownContent}
            </ReactMarkdown>
        </article>
    );
}

export default CourseReader;
