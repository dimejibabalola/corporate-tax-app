
import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SECTIONS = [
    {
        id: 'introduction-to-taxation-of-business-entities',
        letter: 'A',
        title: 'Introduction to Taxation of Business Entities',
        subsections: []
    },
    {
        id: 'influential-policies',
        letter: 'B',
        title: 'Influential Policies',
        subsections: []
    },
    {
        id: 'introduction-to-choice-of-business-entity',
        letter: 'C',
        title: 'Introduction to Choice of Business Entity',
        subsections: []
    },
    {
        id: 'the-corporation-as-a-taxable-entity',
        letter: 'D',
        title: 'The Corporation as a Taxable Entity',
        subsections: [
            { id: 'the-corporate-income-tax', number: '1', title: 'The Corporate Income Tax' },
            { id: 'multiple-and-affiliated-corporations', number: '2', title: 'Multiple and Affiliated Corporations' },
        ]
    },
    {
        id: 'corporate-classification',
        letter: 'E',
        title: 'Corporate Classification',
        subsections: [
            { id: 'in-general', number: '1', title: 'In General' },
            { id: 'corporations-vs-partnerships', number: '2', title: 'Corporations vs. Partnerships' },
            { id: 'corporations-vs-trusts', number: '3', title: 'Corporations vs. Trusts' },
        ]
    },
    {
        id: 'the-common-law-of-corporate-taxation',
        letter: 'F',
        title: 'The Common Law of Corporate Taxation',
        subsections: []
    },
    {
        id: 'recognition-of-the-corporate-entity',
        letter: 'G',
        title: 'Recognition of the Corporate Entity',
        subsections: []
    },
    {
        id: 'tax-policy-issues',
        letter: 'H',
        title: 'Tax Policy Issues',
        subsections: [
            { id: 'introduction', number: '1', title: 'Introduction' },
            { id: 'corporate-integration', number: '2', title: 'Corporate Integration' },
            { id: 'other-corporate-tax-reform-options', number: '3', title: 'Other Corporate Tax Reform Options' },
        ]
    },
];

export default function Chapter1() {
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
    const [sectionHtml, setSectionHtml] = useState('');
    const [fullHtml, setFullHtml] = useState('');
    const contentRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Load the new strict HTML file
        fetch('/Ch1_complete.html')
            .then(r => r.text())
            .then(content => {
                // Extract body content
                const bodyMatch = content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
                setFullHtml(bodyMatch ? bodyMatch[1] : content);
            });
    }, []);

    useEffect(() => {
        if (!fullHtml) return;

        const currentId = SECTIONS[currentSectionIndex].id;
        const nextId = SECTIONS[currentSectionIndex + 1]?.id;

        // Ensure we match the exact H2 ID
        // The script generates <h2 class="main-section" id="...">
        const startMarker = `id="${currentId}"`;
        const startIndex = fullHtml.indexOf(startMarker);

        if (startIndex === -1) {
            console.error(`Section ID ${currentId} not found in HTML`);
            setSectionHtml('<p>Section not found.</p>');
            return;
        }

        // Find the start of the <h2 tag containing this ID
        // We look backwards from startIndex to find '<h2'
        const tagStart = fullHtml.lastIndexOf('<h2', startIndex);

        // Find end index
        let endIndex = -1;
        if (nextId) {
            const nextMarker = `id="${nextId}"`;
            const nextIndex = fullHtml.indexOf(nextMarker);
            if (nextIndex !== -1) {
                // Look backwards for the start of the next section's tag
                endIndex = fullHtml.lastIndexOf('<h2', nextIndex);
            }
        }

        let content = '';
        if (endIndex !== -1) {
            content = fullHtml.substring(tagStart, endIndex);
        } else {
            content = fullHtml.substring(tagStart);
            // Remove closing body/html tags if present (unlikely if we extracted body, but safe)
            content = content.replace(/<\/body>|<\/html>/gi, '');
        }

        setSectionHtml(content);

        // Scroll to top when section changes
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [fullHtml, currentSectionIndex]);

    const handleSubsectionClick = (subId: string) => {
        // Scroll to the subsection
        // Element ID in the injected HTML inside contentRef?
        // We need to wait for render?
        setTimeout(() => {
            const element = document.getElementById(subId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
                <div className="p-4 border-b border-gray-200 bg-indigo-600 text-white">
                    <button
                        onClick={() => navigate('/textbook')}
                        className="flex items-center text-sm hover:text-indigo-100 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Textbook
                    </button>
                    <h1 className="text-xl font-bold">Chapter 1</h1>
                    <p className="text-sm text-indigo-100 mt-1">Overview of Corporate Taxation</p>
                </div>
                <div className="py-2">
                    {SECTIONS.map((section, index) => (
                        <div key={section.id}>
                            <button
                                onClick={() => setCurrentSectionIndex(index)}
                                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${currentSectionIndex === index
                                        ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="font-bold mr-2">{section.letter}.</span>
                                {section.title}
                            </button>

                            {/* Subsections - only show for current section */}
                            {currentSectionIndex === index && section.subsections.length > 0 && (
                                <div className="bg-gray-50 mb-2">
                                    {section.subsections.map((sub) => (
                                        <button
                                            key={sub.id}
                                            onClick={() => handleSubsectionClick(sub.id)}
                                            className="w-full text-left pl-10 pr-4 py-2 text-xs text-gray-600 hover:text-indigo-600 hover:bg-gray-100 transition-colors flex items-start"
                                        >
                                            <span className="font-medium mr-1.5 mt-0.5">{sub.number}.</span>
                                            <span>{sub.title}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full bg-white">
                <div
                    ref={contentRef}
                    className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full"
                >
                    <div
                        className="prose prose-indigo max-w-none text-gray-800 leading-relaxed font-serif"
                        dangerouslySetInnerHTML={{ __html: sectionHtml }}
                        style={{
                            maxWidth: '65ch',
                            margin: '0 auto',
                            fontSize: '1.125rem'
                        }}
                    />
                </div>

                {/* Navigation Footer */}
                <div className="border-t border-gray-200 bg-white p-4">
                    <div className="max-w-4xl mx-auto flex justify-between items-center">
                        <button
                            onClick={() => setCurrentSectionIndex(Math.max(0, currentSectionIndex - 1))}
                            disabled={currentSectionIndex === 0}
                            className={`flex items-center px-4 py-2 rounded-md transition-colors ${currentSectionIndex === 0
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Previous Section
                        </button>

                        <span className="text-sm font-medium text-gray-500">
                            Section {SECTIONS[currentSectionIndex].letter} of {SECTIONS[SECTIONS.length - 1].letter}
                        </span>

                        <button
                            onClick={() => setCurrentSectionIndex(Math.min(SECTIONS.length - 1, currentSectionIndex + 1))}
                            disabled={currentSectionIndex === SECTIONS.length - 1}
                            className={`flex items-center px-4 py-2 rounded-md transition-colors ${currentSectionIndex === SECTIONS.length - 1
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Next Section
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
