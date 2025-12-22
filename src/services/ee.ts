/**
 * Examples & Explanations (E&E) Service
 * 
 * Generates E&E-style content for each section with:
 * - The Rule (statement + statutory basis)
 * - Examples (basic → advanced)
 * - Common Mistakes
 * - Exam Tips
 */

import { v4 as uuidv4 } from 'uuid';
import { db, EEContent } from '@/lib/db';
import { TEXTBOOK_STRUCTURE, getAllChapters, SectionDef, ChapterDef } from '@/lib/textbook/structure';

// ============================================================================
// E&E Content Interface (re-export from types)
// ============================================================================

export interface EEExample {
    number: number;
    title: string;
    difficulty: 'basic' | 'intermediate' | 'advanced';
    facts: string;
    question: string;
    analysis: { step: number; issue: string; analysis: string; conclusion: string }[];
    result: string;
    keyTakeaway: string;
}

export interface EERule {
    statement: string;
    statutoryBasis: string;
    keyRequirements: string[];
}

export interface EEContentData {
    id: string;
    sectionId: string;
    chapterId: string;
    topic: string;
    rule: EERule;
    examples: EEExample[];
    commonMistakes: string[];
    examTips: string[];
    relatedTopics: { sectionId: string; title: string; relationship: string }[];
    sourcePages: number[];
}

// ============================================================================
// DEMO E&E CONTENT - Pre-generated for key sections
// ============================================================================

const DEMO_EE_CONTENT: Record<string, EEContentData> = {
    // Chapter 2, Section A: Introduction to Section 351
    'ch-2-A': {
        id: 'ee-ch2-A',
        sectionId: 'ch-2-A',
        chapterId: 'ch-2',
        topic: 'Section 351 Nonrecognition',
        rule: {
            statement: 'No gain or loss is recognized when property is transferred to a corporation solely in exchange for stock, if the transferors are in control of the corporation immediately after the exchange.',
            statutoryBasis: 'IRC § 351(a)',
            keyRequirements: [
                'Transfer of "property" (not services)',
                'Solely in exchange for "stock" (not debt)',
                'Transferors must have "control" (80% voting + 80% each class)',
                'Control must exist "immediately after" the exchange'
            ]
        },
        examples: [
            {
                number: 1,
                title: 'Basic § 351 Exchange',
                difficulty: 'basic',
                facts: 'Alice transfers land worth $100,000 (basis $40,000) to Newco in exchange for 100% of Newco stock.',
                question: 'What are the tax consequences to Alice and Newco?',
                analysis: [
                    { step: 1, issue: 'Is this property?', analysis: 'Land is property under § 351.', conclusion: 'Yes, property requirement met.' },
                    { step: 2, issue: 'Is Alice in control?', analysis: 'Alice owns 100% of stock immediately after.', conclusion: 'Yes, 80% control test satisfied.' },
                    { step: 3, issue: 'Any boot received?', analysis: 'Alice received only stock.', conclusion: 'No boot, so no gain recognized.' }
                ],
                result: 'Alice recognizes no gain. Her basis in Newco stock is $40,000 (substituted basis). Newco takes a $40,000 transferred basis in the land.',
                keyTakeaway: 'When § 351 applies and no boot is received, the transfer is completely tax-free with basis carryover.'
            },
            {
                number: 2,
                title: 'Adding Boot to the Mix',
                difficulty: 'intermediate',
                facts: 'Bob transfers equipment worth $80,000 (basis $30,000) to Newco in exchange for stock worth $60,000 and $20,000 cash.',
                question: 'What gain, if any, must Bob recognize?',
                analysis: [
                    { step: 1, issue: 'Realized gain calculation', analysis: 'FMV received ($80,000) - Basis ($30,000) = $50,000 realized gain.', conclusion: 'Bob has $50,000 realized gain.' },
                    { step: 2, issue: 'Boot received?', analysis: 'Bob received $20,000 cash, which is boot under § 351(b).', conclusion: 'Yes, $20,000 boot.' },
                    { step: 3, issue: 'Gain recognized', analysis: 'Under § 351(b), gain recognized = lesser of realized gain or boot.', conclusion: 'Bob recognizes $20,000 gain (boot amount).' }
                ],
                result: 'Bob recognizes $20,000 gain. His stock basis is $30,000 + $20,000 gain - $20,000 boot = $30,000.',
                keyTakeaway: 'Boot triggers gain recognition, but only up to the amount of boot received—never more than the realized gain.'
            },
            {
                number: 3,
                title: 'The Control Trap',
                difficulty: 'advanced',
                facts: 'Carol transfers property to an existing corporation where she will own 70% after the exchange. Existing shareholders own 30%.',
                question: 'Does § 351 apply?',
                analysis: [
                    { step: 1, issue: 'Who are the "transferors"?', analysis: 'Only Carol is transferring property in this exchange.', conclusion: 'Carol is the sole transferor.' },
                    { step: 2, issue: 'Control test', analysis: 'Carol owns only 70% immediately after. Control requires 80%.', conclusion: '80% control not met by Carol alone.' },
                    { step: 3, issue: 'Can existing shareholders help?', analysis: 'Existing shareholders are not "transferors" unless they transfer additional property.', conclusion: 'No, § 351 does not apply.' }
                ],
                result: 'Carol recognizes gain on the transfer because § 351 control requirement is not satisfied. This is a fully taxable exchange.',
                keyTakeaway: 'Watch for the 80% control trap! Prior shareholders only count toward control if they also transfer property in the same transaction.'
            }
        ],
        commonMistakes: [
            'Forgetting that services are not "property"—stock issued for services is taxable compensation',
            'Counting existing shareholders toward control when they don\'t transfer property',
            'Assuming all debt qualifies as boot—securities (long-term debt) have special rules',
            'Ignoring the "immediately after" timing requirement when there are prearranged dispositions'
        ],
        examTips: [
            'Always check the 80% control calculation first—if control fails, nothing else matters',
            'Boot recognition is the lesser of realized gain OR boot received—never creates a loss',
            'Transferred basis flows to the corporation; substituted basis goes to the shareholder\'s stock'
        ],
        relatedTopics: [
            { sectionId: 'ch-2-D', title: 'Assumption of Liabilities', relationship: 'Liabilities assumed may be treated as boot' },
            { sectionId: 'ch-3-B', title: 'Debt vs. Equity', relationship: 'Character of what shareholder receives matters' }
        ],
        sourcePages: [55, 56, 57, 58, 59]
    },

    // Chapter 4, Section A: Introduction to Distributions
    'ch-4-A': {
        id: 'ee-ch4-A',
        sectionId: 'ch-4-A',
        chapterId: 'ch-4',
        topic: 'Corporate Distributions',
        rule: {
            statement: 'A distribution of property by a corporation to its shareholders is a dividend to the extent of the corporation\'s earnings and profits (E&P). Distributions exceeding E&P reduce stock basis, then are taxed as capital gain.',
            statutoryBasis: 'IRC §§ 301, 316',
            keyRequirements: [
                'Distribution must be "with respect to stock"',
                'Dividend status depends on E&P, not book income',
                'Current E&P is applied first, then accumulated E&P',
                'Qualified dividends taxed at preferential rates (0/15/20%)'
            ]
        },
        examples: [
            {
                number: 1,
                title: 'Basic Cash Distribution',
                difficulty: 'basic',
                facts: 'XYZ Corp has $50,000 accumulated E&P. It distributes $30,000 cash to sole shareholder Dan (stock basis $20,000).',
                question: 'How is the distribution taxed to Dan?',
                analysis: [
                    { step: 1, issue: 'Is there E&P?', analysis: 'Yes, $50,000 accumulated E&P.', conclusion: 'Distribution can be a dividend.' },
                    { step: 2, issue: 'Dividend amount?', analysis: '$30,000 distribution ≤ $50,000 E&P.', conclusion: 'Entire $30,000 is a dividend.' },
                    { step: 3, issue: 'Tax rate?', analysis: 'Assuming qualified dividend requirements met.', conclusion: 'Taxed at preferential rates (0/15/20%).' }
                ],
                result: 'Dan has $30,000 dividend income. His stock basis remains $20,000. XYZ\'s E&P is reduced to $20,000.',
                keyTakeaway: 'Distributions are dividends to the extent of E&P—check E&P balance before anything else.'
            },
            {
                number: 2,
                title: 'Distribution Exceeding E&P',
                difficulty: 'intermediate',
                facts: 'ABC Corp has $10,000 current E&P and zero accumulated E&P. It distributes $40,000 to shareholder Eve (stock basis $15,000).',
                question: 'What are the tax consequences to Eve?',
                analysis: [
                    { step: 1, issue: 'Dividend portion?', analysis: 'Only $10,000 of E&P available.', conclusion: '$10,000 is dividend.' },
                    { step: 2, issue: 'Return of capital?', analysis: '$30,000 remains. Eve has $15,000 basis.', conclusion: '$15,000 reduces basis to zero (tax-free).' },
                    { step: 3, issue: 'Excess?', analysis: '$40,000 - $10,000 - $15,000 = $15,000 excess.', conclusion: '$15,000 is capital gain.' }
                ],
                result: 'Eve has: $10,000 dividend + $15,000 capital gain. Her stock basis is now zero.',
                keyTakeaway: 'The ordering rule is: (1) dividend to extent of E&P → (2) return of capital reducing basis → (3) capital gain.'
            }
        ],
        commonMistakes: [
            'Confusing E&P with retained earnings—E&P is a tax concept with its own adjustments',
            'Forgetting that current E&P is allocated ratably across all distributions during the year',
            'Treating all excess distributions as ordinary income instead of capital gain',
            'Missing the constructive dividend rules for shareholder benefits'
        ],
        examTips: [
            'Always ask "what is E&P?" before characterizing a distribution',
            'Remember the ordering: E&P → basis reduction → capital gain',
            'Constructive dividends (excessive compensation, bargain sales) are common exam topics'
        ],
        relatedTopics: [
            { sectionId: 'ch-4-D', title: 'Property Distributions', relationship: 'Different rules when distributing property vs. cash' },
            { sectionId: 'ch-5-A', title: 'Redemptions', relationship: 'Redemptions can be dividend or exchange treatment' }
        ],
        sourcePages: [153, 154, 155, 156, 157, 158]
    },

    // Chapter 5, Section C: Redemptions Tested at Shareholder Level
    'ch-5-C': {
        id: 'ee-ch5-C',
        sectionId: 'ch-5-C',
        chapterId: 'ch-5',
        topic: 'Stock Redemptions',
        rule: {
            statement: 'A redemption of stock will be treated as a sale or exchange (capital gain) rather than a dividend if it meets one of the § 302(b) safe harbors: substantially disproportionate, complete termination, or not essentially equivalent to a dividend.',
            statutoryBasis: 'IRC § 302(a), (b)',
            keyRequirements: [
                'Must meet a § 302(b) test to get exchange treatment',
                'Constructive ownership rules (§ 318) apply',
                'Substantially disproportionate: < 50% voting AND < 80% of pre-redemption %',
                'Complete termination: family attribution can be waived'
            ]
        },
        examples: [
            {
                number: 1,
                title: 'Substantially Disproportionate Test',
                difficulty: 'intermediate',
                facts: 'Frank owns 60 of 100 shares of Corp X. Corp X redeems 25 of Frank\'s shares for $50,000. Frank\'s basis in those shares is $20,000.',
                question: 'Is this a sale or a dividend?',
                analysis: [
                    { step: 1, issue: 'Before: Frank\'s %?', analysis: '60/100 = 60% before redemption.', conclusion: 'Pre-redemption: 60%.' },
                    { step: 2, issue: 'After: Frank\'s %?', analysis: '35/75 = 46.67% after redemption.', conclusion: 'Post-redemption: 46.67%.' },
                    { step: 3, issue: '80% test?', analysis: '46.67% < 80% of 60% (48%)?', conclusion: 'Yes, 46.67% < 48%.' },
                    { step: 4, issue: '50% test?', analysis: '46.67% < 50%?', conclusion: 'Yes, < 50% voting after.' }
                ],
                result: 'Both tests met. Frank has sale treatment: $50,000 - $20,000 = $30,000 capital gain.',
                keyTakeaway: 'For substantially disproportionate, check BOTH: (1) less than 80% of prior % AND (2) less than 50% after.'
            },
            {
                number: 2,
                title: 'Constructive Ownership Trap',
                difficulty: 'advanced',
                facts: 'Mother owns 60 shares, Son owns 40 shares of Family Corp. Mother\'s 60 shares are redeemed.',
                question: 'Can Mother get sale treatment under complete termination?',
                analysis: [
                    { step: 1, issue: 'Actual ownership after?', analysis: 'Mother owns 0 shares directly.', conclusion: 'Actually terminated.' },
                    { step: 2, issue: 'Constructive ownership?', analysis: 'Under § 318, Mother is deemed to own Son\'s 40 shares.', conclusion: 'Mother constructively owns 100% after!' },
                    { step: 3, issue: 'Waiver available?', analysis: 'Family attribution can be waived under § 302(c)(2) if requirements met.', conclusion: 'Must file agreement, no interest for 10 years, etc.' }
                ],
                result: 'Without waiver: dividend treatment. With valid § 302(c)(2) waiver: sale treatment.',
                keyTakeaway: 'Family attribution kills many redemptions—always check § 318 and consider waiver under § 302(c)(2).'
            }
        ],
        commonMistakes: [
            'Forgetting to apply § 318 constructive ownership rules',
            'Calculating the 80% test incorrectly (it\'s 80% OF prior %, not 80% ownership)',
            'Missing the 50% voting requirement in addition to the 80% test',
            'Not knowing waiver requirements for family attribution'
        ],
        examTips: [
            'Draw a diagram showing before/after ownership percentages',
            'Apply § 318 attribution FIRST before any § 302(b) test',
            'If substantially disproportionate fails, check "not essentially equivalent to dividend" (meaningful reduction)'
        ],
        relatedTopics: [
            { sectionId: 'ch-5-B', title: 'Constructive Ownership', relationship: 'Must apply § 318 before testing § 302(b)' },
            { sectionId: 'ch-5-D', title: 'Partial Liquidations', relationship: 'Alternative path to exchange treatment' }
        ],
        sourcePages: [207, 208, 209, 210, 211]
    }
};

// ============================================================================
// E&E SERVICE FUNCTIONS
// ============================================================================

/**
 * Get E&E content for a section (from cache or generate demo)
 */
export async function getEEContent(
    textbookId: string,
    chapterId: string,
    sectionId: string
): Promise<EEContentData | null> {
    // Check cache first
    const cached = await db.eeContent
        .where({ textbookId, sectionId })
        .first();

    if (cached && new Date(cached.expiresAt) > new Date()) {
        // Return cached content (parse from JSON string if needed)
        return parseCachedEE(cached);
    }

    // Try to get demo content
    const demoKey = sectionId;
    if (DEMO_EE_CONTENT[demoKey]) {
        // Save to cache
        await cacheEEContent(textbookId, DEMO_EE_CONTENT[demoKey]);
        return DEMO_EE_CONTENT[demoKey];
    }

    // Generate placeholder content for sections without demo
    const chapter = getAllChapters().find(c => c.id === chapterId || `ch-${c.number}` === chapterId);
    const section = chapter?.sections.find(s => s.letter === sectionId.split('-').pop());

    if (section) {
        return generatePlaceholderEE(textbookId, chapterId, sectionId, section);
    }

    return null;
}

/**
 * Get all available E&E content for a chapter
 */
export function getAvailableEEForChapter(chapterId: string): string[] {
    const prefix = chapterId.startsWith('ch-') ? chapterId : `ch-${chapterId}`;
    return Object.keys(DEMO_EE_CONTENT).filter(key => key.startsWith(prefix));
}

/**
 * Cache E&E content
 */
async function cacheEEContent(textbookId: string, content: EEContentData): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30-day cache

    await db.eeContent.put({
        id: content.id,
        textbookId,
        sectionId: content.sectionId,
        topic: content.topic,
        rule: content.rule,
        examples: content.examples,
        commonMistakes: content.commonMistakes,
        examTips: content.examTips,
        relatedTopics: content.relatedTopics,
        sourcePages: content.sourcePages,
        generatedAt: new Date(),
        expiresAt
    });
}

/**
 * Parse cached E&E content
 */
function parseCachedEE(cached: any): EEContentData {
    return {
        id: cached.id,
        sectionId: cached.sectionId,
        chapterId: cached.sectionId.split('-').slice(0, 2).join('-'),
        topic: cached.topic,
        rule: cached.rule,
        examples: cached.examples,
        commonMistakes: cached.commonMistakes,
        examTips: cached.examTips,
        relatedTopics: cached.relatedTopics,
        sourcePages: cached.sourcePages
    };
}

/**
 * Generate placeholder E&E for sections without demo content
 */
function generatePlaceholderEE(
    textbookId: string,
    chapterId: string,
    sectionId: string,
    section: SectionDef
): EEContentData {
    return {
        id: `ee-${sectionId}`,
        sectionId,
        chapterId,
        topic: section.title,
        rule: {
            statement: `This section covers ${section.title}. See textbook pages ${section.startPage}+ for the detailed rules.`,
            statutoryBasis: 'See textbook',
            keyRequirements: [
                'Review the textbook for specific requirements',
                'Note any statutory citations',
                'Identify the key tests or standards'
            ]
        },
        examples: [
            {
                number: 1,
                title: 'Example from Textbook',
                difficulty: 'basic',
                facts: 'Refer to the examples in the textbook for this section.',
                question: 'What are the tax consequences?',
                analysis: [
                    { step: 1, issue: 'Identify the issue', analysis: 'Apply the rules from the section.', conclusion: 'See textbook for analysis.' }
                ],
                result: 'Review the textbook examples for complete analysis.',
                keyTakeaway: 'Master the core rules before tackling complex variations.'
            }
        ],
        commonMistakes: [
            'Not reading the full section before attempting problems',
            'Missing related sections that affect the analysis'
        ],
        examTips: [
            'Focus on the statutory requirements',
            'Work through the textbook problems'
        ],
        relatedTopics: [],
        sourcePages: [section.startPage]
    };
}

/**
 * Generate more examples for "Go Deeper" feature
 */
export async function generateMoreExamples(
    sectionId: string,
    existingCount: number,
    difficulty: 'intermediate' | 'advanced' | 'exam'
): Promise<EEExample[]> {
    // For now, return placeholder indicating AI generation needed
    return [
        {
            number: existingCount + 1,
            title: `Additional ${difficulty} Example`,
            difficulty: difficulty === 'exam' ? 'advanced' : difficulty,
            facts: 'AI-generated examples require Claude API key. Configure in Settings to enable.',
            question: 'What are the tax consequences under these more complex facts?',
            analysis: [
                { step: 1, issue: 'AI Generation', analysis: 'This feature requires Claude API integration.', conclusion: 'Configure API key to enable.' }
            ],
            result: 'Enable AI generation for additional examples.',
            keyTakeaway: 'The "Go Deeper" feature will generate new examples when Claude API is configured.'
        }
    ];
}
