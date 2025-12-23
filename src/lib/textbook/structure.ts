/**
 * HARDCODED TEXTBOOK STRUCTURE
 * 
 * This file contains the complete Table of Contents for:
 * "Fundamentals of Corporate Taxation" - Lind/Schwarz/Lathrope/Rosenberg
 * 
 * THE TOC IS THE GROUND TRUTH. Do not auto-detect structure.
 */

// ============================================================================
// Types for Structure Definition
// ============================================================================

export interface ContentEntry {
    type: 'problem' | 'note' | 'case' | 'revenue_ruling' | 'joint_committee' | 'text';
    title?: string;
    page: number;
}

export interface SubSubsectionDef {
    letter: string;
    title: string;
    startPage: number;
    content?: ContentEntry[];
}

export interface SubsectionDef {
    number: number;
    title: string;
    startPage: number;
    subsubsections?: SubSubsectionDef[];
    content?: ContentEntry[];
}

export interface SectionDef {
    letter: string;
    title: string;
    startPage: number;
    subsections?: SubsectionDef[];
    content?: ContentEntry[];
}

export interface ChapterDef {
    id?: string;         // Optional for backwards compatibility
    number: number;
    title: string;
    startPage: number;
    endPage: number;
    sections: SectionDef[];
}

export interface PartDef {
    number: string;
    title: string;
    startPage: number;
    endPage: number;
    chapters: ChapterDef[];
}

// ============================================================================
// COMPLETE TABLE OF CONTENTS
// ============================================================================

export const TEXTBOOK_STRUCTURE: PartDef[] = [
    // =========================================================================
    // PART ONE: INTRODUCTION
    // =========================================================================
    {
        number: 'ONE',
        title: 'INTRODUCTION',
        startPage: 3,
        endPage: 54,
        chapters: [
            {
                number: 1,
                title: 'An Overview of the Taxation of Corporations and Shareholders',
                startPage: 3,
                endPage: 54,
                sections: [
                    {
                        letter: 'A',
                        title: 'Introduction to Taxation of Business Entities',
                        startPage: 3,
                        content: [{ type: 'text', page: 3 }]
                    },
                    {
                        letter: 'B',
                        title: 'Influential Policies',
                        startPage: 6,
                        content: [{ type: 'text', page: 6 }]
                    },
                    {
                        letter: 'C',
                        title: 'Introduction to Choice of Business Entity',
                        startPage: 12,
                        content: [{ type: 'text', page: 12 }]
                    },
                    {
                        letter: 'D',
                        title: 'The Corporation as a Taxable Entity',
                        startPage: 23,
                        subsections: [
                            {
                                number: 1,
                                title: 'The Corporate Income Tax',
                                startPage: 23
                            },
                            {
                                number: 2,
                                title: 'Multiple and Affiliated Corporations',
                                startPage: 27,
                                content: [{ type: 'problem', page: 28 }]
                            }
                        ]
                    },
                    {
                        letter: 'E',
                        title: 'Corporate Classification',
                        startPage: 28,
                        subsections: [
                            {
                                number: 1,
                                title: 'In General',
                                startPage: 28
                            },
                            {
                                number: 2,
                                title: 'Corporations vs. Partnerships',
                                startPage: 30,
                                subsubsections: [
                                    { letter: 'a', title: '"Check-the-Box" Regulations', startPage: 30 },
                                    { letter: 'b', title: 'Publicly Traded Partnerships', startPage: 33 }
                                ]
                            },
                            {
                                number: 3,
                                title: 'Corporations vs. Trusts',
                                startPage: 34
                            }
                        ]
                    },
                    {
                        letter: 'F',
                        title: 'The Common Law of Corporate Taxation',
                        startPage: 35
                    },
                    {
                        letter: 'G',
                        title: 'Recognition of the Corporate Entity',
                        startPage: 38,
                        content: [
                            { type: 'case', title: 'Commissioner v. Bollinger', page: 38 }
                        ]
                    },
                    {
                        letter: 'H',
                        title: 'Tax Policy Issues',
                        startPage: 43,
                        subsections: [
                            { number: 1, title: 'Introduction', startPage: 43 },
                            {
                                number: 2,
                                title: 'Corporate Integration',
                                startPage: 43,
                                content: [
                                    { type: 'joint_committee', title: 'Present Law and Background Relating to Selected Business Tax Issues', page: 45 },
                                    { type: 'note', page: 49 }
                                ]
                            },
                            { number: 3, title: 'Other Corporate Tax Reform Options', startPage: 50 }
                        ]
                    }
                ]
            }
        ]
    },

    // =========================================================================
    // PART TWO: TAXATION OF C CORPORATIONS
    // =========================================================================
    {
        number: 'TWO',
        title: 'TAXATION OF C CORPORATIONS',
        startPage: 55,
        endPage: 665,
        chapters: [
            // Chapter 2: Formation of a Corporation
            {
                number: 2,
                title: 'Formation of a Corporation',
                startPage: 55,
                endPage: 114,
                sections: [
                    {
                        letter: 'A',
                        title: 'Introduction to Section 351',
                        startPage: 55,
                        content: [{ type: 'problem', page: 59 }]
                    },
                    {
                        letter: 'B',
                        title: 'Requirements for Nonrecognition of Gain or Loss Under Section 351',
                        startPage: 60,
                        subsections: [
                            {
                                number: 1,
                                title: '"Control" Immediately After the Exchange',
                                startPage: 60,
                                content: [
                                    { type: 'case', title: 'Intermountain Lumber Co. v. Commissioner', page: 61 },
                                    { type: 'note', page: 65 },
                                    { type: 'problem', page: 66 }
                                ]
                            },
                            { number: 2, title: 'Transfers of "Property" and Services', startPage: 66 },
                            {
                                number: 3,
                                title: 'Solely for "Stock"',
                                startPage: 68,
                                content: [{ type: 'problem', page: 69 }]
                            }
                        ]
                    },
                    {
                        letter: 'C',
                        title: 'Treatment of Boot',
                        startPage: 70,
                        subsections: [
                            {
                                number: 1,
                                title: 'In General',
                                startPage: 70,
                                content: [
                                    { type: 'revenue_ruling', title: 'Revenue Ruling 68-55', page: 73 },
                                    { type: 'note', page: 75 }
                                ]
                            },
                            {
                                number: 2,
                                title: 'Timing of Section 351(b) Gain',
                                startPage: 76,
                                content: [{ type: 'problem', page: 79 }]
                            }
                        ]
                    },
                    {
                        letter: 'D',
                        title: 'Assumption of Liabilities',
                        startPage: 80,
                        content: [
                            { type: 'case', title: 'Peracchi v. Commissioner', page: 84 },
                            { type: 'note', page: 94 },
                            { type: 'problem', page: 98 }
                        ]
                    },
                    {
                        letter: 'E',
                        title: 'Incorporation of a Going Business',
                        startPage: 99,
                        content: [
                            { type: 'case', title: 'Hempt Brothers, Inc. v. United States', page: 99 },
                            { type: 'revenue_ruling', title: 'Revenue Ruling 95-74', page: 103 },
                            { type: 'note', page: 106 },
                            { type: 'problem', page: 108 }
                        ]
                    },
                    {
                        letter: 'F',
                        title: 'Collateral Issues',
                        startPage: 110,
                        subsections: [
                            { number: 1, title: 'Contributions to Capital', startPage: 110 },
                            { number: 2, title: 'Intentional Avoidance of Section 351', startPage: 111 },
                            {
                                number: 3,
                                title: 'Organizational and Start-up Expenses',
                                startPage: 113,
                                content: [{ type: 'problem', page: 114 }]
                            }
                        ]
                    }
                ]
            },

            // Chapter 3: Capital Structure
            {
                number: 3,
                title: 'Capital Structure',
                startPage: 115,
                endPage: 152,
                sections: [
                    {
                        letter: 'A',
                        title: 'Introduction',
                        startPage: 115,
                        subsections: [
                            { number: 1, title: 'Tax Consequences of Debt and Equity', startPage: 115 },
                            { number: 2, title: 'Limitation on Deduction of Business Interest', startPage: 119 },
                            { number: 3, title: 'Other Limitations on the Corporate Interest Deduction', startPage: 122 }
                        ]
                    },
                    {
                        letter: 'B',
                        title: 'Debt vs. Equity',
                        startPage: 124,
                        subsections: [
                            {
                                number: 1,
                                title: 'Common Law Standards',
                                startPage: 124,
                                content: [
                                    { type: 'case', title: 'Indmar Products Co., Inc. v. Commissioner', page: 128 }
                                ]
                            },
                            {
                                number: 2,
                                title: 'Hybrid Instruments',
                                startPage: 139,
                                content: [
                                    { type: 'joint_committee', title: 'Present Law and Background Relating to the Tax Treatment of Business Debt', page: 140 }
                                ]
                            },
                            {
                                number: 3,
                                title: 'Section 385',
                                startPage: 143,
                                content: [{ type: 'problem', page: 147 }]
                            }
                        ]
                    },
                    {
                        letter: 'C',
                        title: 'Character of Gain or Loss on Corporate Investment',
                        startPage: 148,
                        content: [{ type: 'problem', page: 152 }]
                    }
                ]
            },

            // Chapter 4: Nonliquidating Distributions
            {
                number: 4,
                title: 'Nonliquidating Distributions',
                startPage: 153,
                endPage: 200,
                sections: [
                    {
                        letter: 'A',
                        title: 'Introduction',
                        startPage: 153,
                        subsections: [
                            { number: 1, title: 'Dividends: In General', startPage: 153 },
                            { number: 2, title: 'Qualified Dividends', startPage: 156 },
                            { number: 3, title: 'Economic Impact of Dividend Rate Reductions', startPage: 158 }
                        ]
                    },
                    {
                        letter: 'B',
                        title: 'Earnings and Profits',
                        startPage: 160,
                        content: [{ type: 'problem', page: 163 }]
                    },
                    {
                        letter: 'C',
                        title: 'Distributions of Cash',
                        startPage: 163,
                        content: [
                            { type: 'revenue_ruling', title: 'Revenue Ruling 74-164', page: 165 },
                            { type: 'note', page: 167 },
                            { type: 'problem', page: 168 }
                        ]
                    },
                    {
                        letter: 'D',
                        title: 'Distributions of Property',
                        startPage: 168,
                        subsections: [
                            {
                                number: 1,
                                title: 'Consequences to the Distributing Corporation',
                                startPage: 168,
                                subsubsections: [
                                    { letter: 'a', title: 'Background: The General Utilities Doctrine', startPage: 168 },
                                    { letter: 'b', title: 'Corporate Gain or Loss', startPage: 170 },
                                    { letter: 'c', title: 'Effect on Earnings and Profits', startPage: 171 },
                                    { letter: 'd', title: 'Distributions of Own Obligations', startPage: 172 }
                                ]
                            },
                            {
                                number: 2,
                                title: 'Consequences to the Shareholders',
                                startPage: 172,
                                content: [{ type: 'problem', page: 173 }]
                            }
                        ]
                    },
                    {
                        letter: 'E',
                        title: 'Constructive Distributions',
                        startPage: 173,
                        content: [
                            { type: 'case', title: 'Nicholls, North, Buse Co. v. Commissioner', page: 174 },
                            { type: 'note', page: 178 }
                        ]
                    },
                    {
                        letter: 'F',
                        title: 'Anti-Avoidance Limitations on Dividends Received Deduction',
                        startPage: 180,
                        subsections: [
                            { number: 1, title: 'In General', startPage: 180 },
                            { number: 2, title: 'Special Holding Period Requirements', startPage: 181 },
                            { number: 3, title: 'Extraordinary Dividends: Basis Reduction', startPage: 182 },
                            { number: 4, title: 'Debt-Financed Portfolio Stock', startPage: 184 },
                            {
                                number: 5,
                                title: 'Section 301(e)',
                                startPage: 186,
                                content: [{ type: 'problem', page: 187 }]
                            }
                        ]
                    },
                    {
                        letter: 'G',
                        title: 'Use of Dividends in Bootstrap Sales',
                        startPage: 188,
                        content: [
                            { type: 'case', title: 'TSN Liquidating Corp. v. United States', page: 188 },
                            { type: 'note', page: 196 },
                            { type: 'problem', page: 200 }
                        ]
                    }
                ]
            },

            // Chapter 5: Redemptions and Partial Liquidations
            {
                number: 5,
                title: 'Redemptions and Partial Liquidations',
                startPage: 201,
                endPage: 296,
                sections: [
                    { letter: 'A', title: 'Introduction', startPage: 201 },
                    {
                        letter: 'B',
                        title: 'Constructive Ownership of Stock',
                        startPage: 205,
                        content: [{ type: 'problem', page: 206 }]
                    },
                    {
                        letter: 'C',
                        title: 'Redemptions Tested at the Shareholder Level',
                        startPage: 207,
                        subsections: [
                            {
                                number: 1,
                                title: 'Substantially Disproportionate Redemptions',
                                startPage: 207,
                                content: [
                                    { type: 'revenue_ruling', title: 'Revenue Ruling 85-14', page: 209 },
                                    { type: 'problem', page: 211 }
                                ]
                            },
                            {
                                number: 2,
                                title: 'Complete Termination of Interest',
                                startPage: 211,
                                subsubsections: [
                                    {
                                        letter: 'a',
                                        title: 'Waiver of Family Attribution',
                                        startPage: 211,
                                        content: [
                                            { type: 'case', title: 'Lynch v. Commissioner', page: 212 },
                                            { type: 'revenue_ruling', title: 'Revenue Ruling 59-119', page: 220 },
                                            { type: 'revenue_ruling', title: 'Revenue Ruling 77-293', page: 221 },
                                            { type: 'note', page: 223 }
                                        ]
                                    },
                                    {
                                        letter: 'b',
                                        title: 'Waiver of Attribution by Entities',
                                        startPage: 227,
                                        content: [{ type: 'problem', page: 228 }]
                                    }
                                ]
                            },
                            {
                                number: 3,
                                title: 'Redemptions Not Essentially Equivalent to Dividend',
                                startPage: 230,
                                content: [
                                    { type: 'case', title: 'United States v. Davis', page: 230 },
                                    { type: 'revenue_ruling', title: 'Revenue Ruling 85-106', page: 236 },
                                    { type: 'note', page: 239 },
                                    { type: 'problem', page: 243 }
                                ]
                            }
                        ]
                    },
                    {
                        letter: 'D',
                        title: 'Redemptions at Corporate Level: Partial Liquidations',
                        startPage: 244,
                        content: [
                            { type: 'revenue_ruling', title: 'Revenue Ruling 79-184', page: 247 },
                            { type: 'problem', page: 248 }
                        ]
                    },
                    {
                        letter: 'E',
                        title: 'Consequences to the Distributing Corporation',
                        startPage: 249,
                        subsections: [
                            { number: 1, title: 'Distributions of Appreciated Property', startPage: 249 },
                            {
                                number: 2,
                                title: 'Effect on Earnings and Profits',
                                startPage: 250,
                                content: [{ type: 'problem', page: 252 }]
                            },
                            { number: 3, title: 'Stock Reacquisition Expenses', startPage: 252 }
                        ]
                    },
                    {
                        letter: 'F',
                        title: 'Redemption Planning Techniques',
                        startPage: 254,
                        subsections: [
                            {
                                number: 1,
                                title: 'Bootstrap Acquisitions',
                                startPage: 254,
                                content: [
                                    { type: 'revenue_ruling', title: 'Revenue Ruling 75-447', page: 254 },
                                    { type: 'note', page: 256 },
                                    { type: 'problem', page: 256 }
                                ]
                            },
                            {
                                number: 2,
                                title: 'Buy-Sell Agreements',
                                startPage: 257,
                                subsubsections: [
                                    { letter: 'a', title: 'In General', startPage: 257 },
                                    {
                                        letter: 'b',
                                        title: 'Constructive Dividend Issues',
                                        startPage: 259,
                                        content: [
                                            { type: 'revenue_ruling', title: 'Revenue Ruling 69-608', page: 259 },
                                            { type: 'problem', page: 263 }
                                        ]
                                    },
                                    {
                                        letter: 'c',
                                        title: 'Redemptions Incident to Divorce',
                                        startPage: 263,
                                        content: [
                                            { type: 'case', title: 'Arnes v. United States', page: 263 },
                                            { type: 'note', page: 268 },
                                            { type: 'problem', page: 271 }
                                        ]
                                    }
                                ]
                            },
                            {
                                number: 3,
                                title: 'Charitable Contribution and Redemption',
                                startPage: 272,
                                content: [
                                    { type: 'case', title: 'Grove v. Commissioner', page: 272 },
                                    { type: 'note', page: 279 },
                                    { type: 'problem', page: 280 }
                                ]
                            }
                        ]
                    },
                    {
                        letter: 'G',
                        title: 'Redemptions Through Related Corporations',
                        startPage: 280,
                        content: [
                            { type: 'case', title: 'Niedermeyer v. Commissioner', page: 285 },
                            { type: 'problem', page: 292 }
                        ]
                    },
                    {
                        letter: 'H',
                        title: 'Redemptions to Pay Death Taxes',
                        startPage: 293,
                        content: [{ type: 'problem', page: 295 }]
                    }
                ]
            },

            // Chapter 6: Stock Dividends and Section 306 Stock
            {
                number: 6,
                title: 'Stock Dividends and Section 306 Stock',
                startPage: 297,
                endPage: 324,
                sections: [
                    { letter: 'A', title: 'Introduction', startPage: 297 },
                    {
                        letter: 'B',
                        title: 'Taxation of Stock Dividends Under Section 305',
                        startPage: 299,
                        content: [
                            { type: 'joint_committee', title: 'Senate Finance Committee Report on Tax Reform Act of 1969', page: 302 },
                            { type: 'revenue_ruling', title: 'Revenue Ruling 78-60', page: 305 },
                            { type: 'note', page: 308 },
                            { type: 'problem', page: 310 }
                        ]
                    },
                    {
                        letter: 'C',
                        title: 'Section 306 Stock',
                        startPage: 311,
                        subsections: [
                            { number: 1, title: 'The Preferred Stock Bailout', startPage: 311 },
                            {
                                number: 2,
                                title: 'The Operation of Section 306',
                                startPage: 312,
                                subsubsections: [
                                    { letter: 'a', title: 'Section 306 Stock Defined', startPage: 312 },
                                    { letter: 'b', title: 'Dispositions of Section 306 Stock', startPage: 314 },
                                    {
                                        letter: 'c',
                                        title: 'Dispositions Exempt from Section 306',
                                        startPage: 316,
                                        content: [
                                            { type: 'case', title: 'Fireoved v. United States', page: 317 },
                                            { type: 'problem', page: 323 }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },

            // Chapter 7: Complete Liquidations
            {
                number: 7,
                title: 'Complete Liquidations',
                startPage: 325,
                endPage: 356,
                sections: [
                    { letter: 'A', title: 'Introduction', startPage: 325 },
                    {
                        letter: 'B',
                        title: 'Complete Liquidations Under Section 331',
                        startPage: 326,
                        subsections: [
                            {
                                number: 1,
                                title: 'Consequences to the Shareholders',
                                startPage: 326,
                                content: [{ type: 'problem', page: 329 }]
                            },
                            {
                                number: 2,
                                title: 'Consequences to the Liquidating Corporation',
                                startPage: 330,
                                subsubsections: [
                                    {
                                        letter: 'a',
                                        title: 'Background',
                                        startPage: 330,
                                        content: [
                                            { type: 'case', title: 'Commissioner v. Court Holding Co.', page: 331 },
                                            { type: 'case', title: 'United States v. Cumberland Public Service Co.', page: 333 },
                                            { type: 'note', page: 336 }
                                        ]
                                    },
                                    { letter: 'b', title: 'Liquidating Distributions and Sales', startPage: 338 },
                                    {
                                        letter: 'c',
                                        title: 'Limitations on Recognition of Loss',
                                        startPage: 338,
                                        content: [{ type: 'problem', page: 342 }]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        letter: 'C',
                        title: 'Liquidation of a Subsidiary',
                        startPage: 343,
                        subsections: [
                            {
                                number: 1,
                                title: 'Consequences to the Shareholders',
                                startPage: 343,
                                content: [{ type: 'case', title: 'George L. Riggs, Inc. v. Commissioner', page: 345 }]
                            },
                            {
                                number: 2,
                                title: 'Consequences to the Liquidating Subsidiary',
                                startPage: 352,
                                content: [{ type: 'problem', page: 354 }]
                            }
                        ]
                    }
                ]
            },

            // Chapter 8: Taxable Corporate Acquisitions
            {
                number: 8,
                title: 'Taxable Corporate Acquisitions',
                startPage: 357,
                endPage: 388,
                sections: [
                    { letter: 'A', title: 'Introduction', startPage: 357 },
                    {
                        letter: 'B',
                        title: 'Asset Acquisitions',
                        startPage: 359,
                        subsections: [
                            { number: 1, title: 'Tax Consequences to the Parties', startPage: 359 },
                            { number: 2, title: 'Allocation of Purchase Price', startPage: 360 }
                        ]
                    },
                    {
                        letter: 'C',
                        title: 'Stock Acquisitions',
                        startPage: 365,
                        subsections: [
                            {
                                number: 1,
                                title: 'Background',
                                startPage: 365,
                                content: [
                                    { type: 'case', title: 'Kimbell-Diamond Milling Co. v. Commissioner', page: 366 },
                                    { type: 'note', page: 368 }
                                ]
                            },
                            { number: 2, title: 'Operation of Section 338', startPage: 369 },
                            { number: 3, title: 'Acquisition of Stock of a Subsidiary', startPage: 376 },
                            { number: 4, title: 'Section 336(e)', startPage: 378 }
                        ]
                    },
                    {
                        letter: 'D',
                        title: 'Comparison of Acquisition Methods',
                        startPage: 380,
                        content: [{ type: 'problem', page: 382 }]
                    },
                    { letter: 'E', title: 'Tax Treatment of Acquisition Expenses', startPage: 384 }
                ]
            },

            // Chapter 9: Acquisitive Reorganizations
            {
                number: 9,
                title: 'Acquisitive Reorganizations',
                startPage: 389,
                endPage: 452,
                sections: [
                    {
                        letter: 'A',
                        title: 'Introduction',
                        startPage: 389,
                        subsections: [
                            { number: 1, title: 'Historical Background', startPage: 389 },
                            { number: 2, title: 'Overview of Reorganizations', startPage: 391 }
                        ]
                    },
                    {
                        letter: 'B',
                        title: 'Types of Acquisitive Reorganizations',
                        startPage: 394,
                        subsections: [
                            {
                                number: 1,
                                title: 'Type A: Statutory Mergers and Consolidations',
                                startPage: 394,
                                subsubsections: [
                                    { letter: 'a', title: 'Merger or Consolidation Requirement', startPage: 394 },
                                    {
                                        letter: 'b',
                                        title: 'Continuity of Proprietary Interest',
                                        startPage: 396,
                                        content: [
                                            { type: 'case', title: 'Southwest Natural Gas Co. v. Commissioner', page: 396 },
                                            { type: 'revenue_ruling', title: 'Revenue Ruling 66-224', page: 398 },
                                            { type: 'note', page: 399 }
                                        ]
                                    },
                                    { letter: 'c', title: 'Identifying Shareholders for Continuity', startPage: 402 },
                                    {
                                        letter: 'd',
                                        title: 'Post-Acquisition Continuity',
                                        startPage: 404,
                                        content: [{ type: 'revenue_ruling', title: 'Revenue Ruling 99-58', page: 405 }]
                                    },
                                    { letter: 'e', title: 'Relationship to Taxable Acquisitions', startPage: 406 },
                                    {
                                        letter: 'f',
                                        title: 'Continuity of Business Enterprise',
                                        startPage: 408,
                                        content: [
                                            { type: 'case', title: 'Bentsen v. Phinney', page: 408 },
                                            { type: 'revenue_ruling', title: 'Revenue Ruling 81-25', page: 411 },
                                            { type: 'note', page: 411 }
                                        ]
                                    }
                                ]
                            },
                            { number: 2, title: 'Type B: Stock for Voting Stock', startPage: 412 },
                            {
                                number: 3,
                                title: 'Type C: Assets for Voting Stock',
                                startPage: 415,
                                content: [{ type: 'revenue_ruling', title: 'Revenue Ruling 67-274', page: 418 }]
                            },
                            { number: 4, title: 'Triangular Reorganizations', startPage: 419 },
                            {
                                number: 5,
                                title: 'Multi-Step Acquisitions',
                                startPage: 422,
                                content: [
                                    { type: 'revenue_ruling', title: 'Revenue Ruling 2001-26', page: 423 },
                                    { type: 'revenue_ruling', title: 'Revenue Ruling 2008-25', page: 426 },
                                    { type: 'note', page: 431 },
                                    { type: 'problem', page: 432 }
                                ]
                            }
                        ]
                    },
                    {
                        letter: 'C',
                        title: 'Treatment of the Parties',
                        startPage: 435,
                        subsections: [
                            { number: 1, title: 'Consequences to Shareholders and Security Holders', startPage: 435 },
                            { number: 2, title: 'Consequences to the Target Corporation', startPage: 441 },
                            {
                                number: 3,
                                title: 'Consequences to the Acquiring Corporation',
                                startPage: 443,
                                content: [{ type: 'problem', page: 446 }]
                            }
                        ]
                    },
                    {
                        letter: 'D',
                        title: 'Tax Policy Issues',
                        startPage: 447,
                        content: [
                            { type: 'joint_committee', title: 'Present Law and Background Relating to Selected Business Tax Issues', page: 448 }
                        ]
                    }
                ]
            },

            // Chapter 10: Corporate Divisions
            {
                number: 10,
                title: 'Corporate Divisions',
                startPage: 453,
                endPage: 522,
                sections: [
                    {
                        letter: 'A',
                        title: 'Introduction',
                        startPage: 453,
                        subsections: [
                            { number: 1, title: 'Types of Corporate Divisions', startPage: 453 },
                            { number: 2, title: 'Nontax Motives for Corporate Divisions', startPage: 455 },
                            {
                                number: 3,
                                title: 'Historical Background of Section 355',
                                startPage: 457,
                                content: [
                                    { type: 'case', title: 'Gregory v. Helvering', page: 457 },
                                    { type: 'note', page: 460 }
                                ]
                            },
                            {
                                number: 4,
                                title: 'Overview of Section 355',
                                startPage: 461,
                                subsubsections: [
                                    { letter: 'a', title: 'Statutory and Judicial Requirements', startPage: 461 },
                                    { letter: 'b', title: 'Taxation of the Parties', startPage: 463 },
                                    { letter: 'c', title: 'Advance Rulings', startPage: 464 }
                                ]
                            }
                        ]
                    },
                    {
                        letter: 'B',
                        title: 'The Active Trade or Business Requirement',
                        startPage: 464,
                        content: [
                            { type: 'case', title: "Lockwood's Estate v. Commissioner", page: 465 },
                            { type: 'revenue_ruling', title: 'Revenue Ruling 2003-38', page: 470 },
                            { type: 'revenue_ruling', title: 'Revenue Ruling 2007-42', page: 473 },
                            { type: 'note', page: 476 },
                            { type: 'problem', page: 483 }
                        ]
                    },
                    {
                        letter: 'C',
                        title: 'Judicial and Statutory Limitations',
                        startPage: 484,
                        subsections: [
                            { number: 1, title: 'Business Purpose', startPage: 484 },
                            { number: 2, title: 'Continuity of Interest', startPage: 487 },
                            {
                                number: 3,
                                title: 'The "Device" Limitation',
                                startPage: 489,
                                subsubsections: [
                                    { letter: 'a', title: 'In General', startPage: 489 },
                                    { letter: 'b', title: 'Device Factors', startPage: 491 },
                                    { letter: 'c', title: 'Nondevice Factors', startPage: 494 }
                                ]
                            },
                            {
                                number: 4,
                                title: 'Distributions with Significant Nonbusiness Assets',
                                startPage: 494,
                                subsubsections: [
                                    { letter: 'a', title: 'Cash-Rich Split-Offs', startPage: 494 },
                                    {
                                        letter: 'b',
                                        title: 'Spin-Offs of Significant Nonbusiness Assets',
                                        startPage: 496,
                                        content: [{ type: 'problem', page: 499 }]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        letter: 'D',
                        title: 'Tax Treatment of the Parties',
                        startPage: 500,
                        subsections: [
                            { number: 1, title: 'Introduction', startPage: 501 },
                            {
                                number: 2,
                                title: 'Consequences to Shareholders and Security Holders',
                                startPage: 502,
                                content: [{ type: 'revenue_ruling', title: 'Revenue Ruling 93-62', page: 504 }]
                            },
                            { number: 3, title: 'Consequences to Distributing and Controlled Corporations', startPage: 507 },
                            {
                                number: 4,
                                title: 'Consequences of Failed Divisions',
                                startPage: 509,
                                content: [{ type: 'problem', page: 510 }]
                            }
                        ]
                    },
                    {
                        letter: 'E',
                        title: 'Use of Section 355 in Corporate Acquisitions',
                        startPage: 511,
                        subsections: [
                            {
                                number: 1,
                                title: 'Limitations in Taxable Acquisitions',
                                startPage: 511,
                                subsubsections: [
                                    { letter: 'a', title: 'Introduction', startPage: 511 },
                                    {
                                        letter: 'b',
                                        title: 'Dispositions of Recently Acquired Businesses',
                                        startPage: 511,
                                        content: [{ type: 'problem', page: 513 }]
                                    },
                                    { letter: 'c', title: 'Divisive Transactions with Changes of Ownership', startPage: 513 }
                                ]
                            },
                            {
                                number: 2,
                                title: 'Dispositions of Unwanted Assets in Tax-Free Reorgs',
                                startPage: 518,
                                content: [{ type: 'problem', page: 521 }]
                            }
                        ]
                    }
                ]
            },

            // Chapter 11: Nonacquisitive, Nondivisive Reorganizations
            {
                number: 11,
                title: 'Nonacquisitive, Nondivisive Reorganizations',
                startPage: 523,
                endPage: 558,
                sections: [
                    {
                        letter: 'A',
                        title: 'Type E: Recapitalizations',
                        startPage: 523,
                        subsections: [
                            { number: 1, title: 'Introduction', startPage: 523 },
                            {
                                number: 2,
                                title: 'Types of Recapitalizations',
                                startPage: 524,
                                subsubsections: [
                                    { letter: 'a', title: 'Bonds Exchanged for Stock', startPage: 524 },
                                    { letter: 'b', title: 'Bonds for Bonds', startPage: 524 },
                                    {
                                        letter: 'c',
                                        title: 'Stock for Stock',
                                        startPage: 525,
                                        content: [{ type: 'revenue_ruling', title: 'Revenue Ruling 84-114', page: 526 }]
                                    },
                                    {
                                        letter: 'd',
                                        title: 'Stock Exchanged for Bonds',
                                        startPage: 530,
                                        content: [
                                            { type: 'case', title: 'Bazley v. Commissioner', page: 530 },
                                            { type: 'note', page: 533 },
                                            { type: 'problem', page: 534 }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        letter: 'B',
                        title: 'Nondivisive Type D Reorganizations',
                        startPage: 534,
                        content: [
                            { type: 'case', title: 'Smothers v. United States', page: 536 },
                            { type: 'note', page: 543 },
                            { type: 'problem', page: 546 }
                        ]
                    },
                    {
                        letter: 'C',
                        title: 'Type F: Mere Change in Identity, Form, or Place',
                        startPage: 546,
                        content: [
                            { type: 'revenue_ruling', title: 'Revenue Ruling 96-29', page: 549 },
                            { type: 'problem', page: 551 }
                        ]
                    },
                    {
                        letter: 'D',
                        title: 'Type G: Insolvency Reorganizations',
                        startPage: 552,
                        content: [
                            { type: 'joint_committee', title: 'Report of Senate Finance Committee on Bankruptcy Tax Bill of 1980', page: 552 },
                            { type: 'problem', page: 557 }
                        ]
                    }
                ]
            },

            // Chapter 12: Carryovers of Corporate Tax Attributes
            {
                number: 12,
                title: 'Carryovers of Corporate Tax Attributes',
                startPage: 559,
                endPage: 594,
                sections: [
                    { letter: 'A', title: 'Introduction', startPage: 559 },
                    {
                        letter: 'B',
                        title: 'Section 381 Carryover Rules',
                        startPage: 560,
                        content: [{ type: 'problem', page: 562 }]
                    },
                    {
                        letter: 'C',
                        title: 'Limitations on NOL Carryforwards: Section 382',
                        startPage: 563,
                        subsections: [
                            { number: 1, title: 'Introduction', startPage: 563 },
                            {
                                number: 2,
                                title: 'The Ownership Change Requirements',
                                startPage: 566,
                                content: [
                                    { type: 'case', title: 'Garber Industries Holding Co. v. Commissioner', page: 570 },
                                    { type: 'problem', page: 580 }
                                ]
                            },
                            {
                                number: 3,
                                title: 'Results of an Ownership Change',
                                startPage: 581,
                                content: [{ type: 'problem', page: 587 }]
                            }
                        ]
                    },
                    { letter: 'D', title: 'Limitations on Other Tax Attributes: Section 383', startPage: 588 },
                    {
                        letter: 'E',
                        title: 'Other Loss Limitations',
                        startPage: 588,
                        subsections: [
                            { number: 1, title: 'Acquisitions Made to Evade Tax: Section 269', startPage: 588 },
                            {
                                number: 2,
                                title: 'Limitations on Preacquisition Losses: Section 384',
                                startPage: 589,
                                content: [{ type: 'problem', page: 592 }]
                            },
                            { number: 3, title: 'Consolidated Return Rules', startPage: 593 }
                        ]
                    }
                ]
            },

            // Chapter 13: Affiliated Corporations
            {
                number: 13,
                title: 'Affiliated Corporations',
                startPage: 595,
                endPage: 618,
                sections: [
                    {
                        letter: 'A',
                        title: 'Restrictions on Affiliated Corporations',
                        startPage: 595,
                        subsections: [
                            { number: 1, title: 'Introduction', startPage: 595 },
                            { number: 2, title: 'Limitations on Accumulated Earnings Credit', startPage: 595 },
                            {
                                number: 3,
                                title: 'Section 482',
                                startPage: 598,
                                subsubsections: [
                                    { letter: 'a', title: 'Introduction', startPage: 598 },
                                    { letter: 'b', title: 'Statutory Elements', startPage: 599 },
                                    { letter: 'c', title: 'Allocation Standard and Methods', startPage: 600 },
                                    { letter: 'd', title: 'Collateral Adjustments', startPage: 601 },
                                    { letter: 'e', title: 'Common Transactions', startPage: 602 },
                                    { letter: 'f', title: 'Other Issues', startPage: 603 }
                                ]
                            }
                        ]
                    },
                    {
                        letter: 'B',
                        title: 'Consolidated Returns',
                        startPage: 605,
                        subsections: [
                            { number: 1, title: 'Introduction', startPage: 605 },
                            {
                                number: 2,
                                title: 'Eligibility and Election',
                                startPage: 606,
                                subsubsections: [
                                    { letter: 'a', title: 'Eligibility', startPage: 606 },
                                    { letter: 'b', title: 'Election and Related Matters', startPage: 607 }
                                ]
                            },
                            {
                                number: 3,
                                title: 'Computation of Consolidated Taxable Income',
                                startPage: 608,
                                subsubsections: [
                                    { letter: 'a', title: 'Overview', startPage: 608 },
                                    { letter: 'b', title: 'Computation of Separate Taxable Income', startPage: 609 },
                                    { letter: 'c', title: 'Consolidated Items', startPage: 613 },
                                    { letter: 'd', title: 'Allocation of Tax Liability', startPage: 614 }
                                ]
                            },
                            { number: 4, title: 'Stock Basis Adjustments', startPage: 615 },
                            {
                                number: 5,
                                title: 'Advantages and Disadvantages',
                                startPage: 616,
                                content: [{ type: 'problem', page: 616 }]
                            }
                        ]
                    }
                ]
            },

            // Chapter 14: Anti-Avoidance Rules
            {
                number: 14,
                title: 'Anti-Avoidance Rules',
                startPage: 619,
                endPage: 665,
                sections: [
                    { letter: 'A', title: 'Introduction', startPage: 619 },
                    {
                        letter: 'B',
                        title: 'The Economic Substance Doctrine',
                        startPage: 619,
                        subsections: [
                            {
                                number: 1,
                                title: 'Background: Corporate Tax Shelters',
                                startPage: 619,
                                content: [
                                    { type: 'case', title: 'United Parcel Service of America, Inc. v. Commissioner', page: 621 },
                                    { type: 'note', page: 627 }
                                ]
                            },
                            {
                                number: 2,
                                title: 'Common Law Roots',
                                startPage: 627,
                                content: [
                                    { type: 'joint_committee', title: 'General Explanation of Tax Legislation Enacted in the 111th Congress', page: 628 }
                                ]
                            },
                            {
                                number: 3,
                                title: 'Codification',
                                startPage: 631,
                                content: [{ type: 'problem', page: 635 }]
                            }
                        ]
                    },
                    {
                        letter: 'C',
                        title: 'The Accumulated Earnings Tax',
                        startPage: 636,
                        subsections: [
                            { number: 1, title: 'Introduction', startPage: 636 },
                            { number: 2, title: 'The Proscribed Tax Avoidance Purpose', startPage: 637 },
                            {
                                number: 3,
                                title: 'The Reasonable Needs of the Business',
                                startPage: 640,
                                content: [
                                    { type: 'case', title: "Myron's Enterprises v. United States", page: 640 },
                                    { type: 'note', page: 645 }
                                ]
                            },
                            {
                                number: 4,
                                title: 'Calculation of Accumulated Taxable Income',
                                startPage: 650,
                                content: [{ type: 'problem', page: 651 }]
                            }
                        ]
                    },
                    {
                        letter: 'D',
                        title: 'The Personal Holding Company Tax',
                        startPage: 652,
                        subsections: [
                            { number: 1, title: 'Introduction', startPage: 652 },
                            {
                                number: 2,
                                title: 'Definition of a Personal Holding Company',
                                startPage: 653,
                                subsubsections: [
                                    { letter: 'a', title: 'Stock Ownership Requirement', startPage: 654 },
                                    {
                                        letter: 'b',
                                        title: 'Income Test',
                                        startPage: 654,
                                        content: [{ type: 'revenue_ruling', title: 'Revenue Ruling 75-67', page: 658 }]
                                    }
                                ]
                            },
                            {
                                number: 3,
                                title: 'Taxation of Personal Holding Companies',
                                startPage: 659,
                                subsubsections: [
                                    { letter: 'a', title: 'Adjustments to Taxable Income', startPage: 659 },
                                    {
                                        letter: 'b',
                                        title: 'Dividends Paid Deduction',
                                        startPage: 660,
                                        content: [{ type: 'problem', page: 662 }]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },

    // =========================================================================
    // PART THREE: TAXATION OF S CORPORATIONS
    // =========================================================================
    {
        number: 'THREE',
        title: 'TAXATION OF S CORPORATIONS',
        startPage: 667,
        endPage: 735,
        chapters: [
            {
                number: 15,
                title: 'S Corporations',
                startPage: 667,
                endPage: 735,
                sections: [
                    { letter: 'A', title: 'Introduction', startPage: 667 },
                    {
                        letter: 'B',
                        title: 'Eligibility for S Corporation Status',
                        startPage: 669,
                        content: [{ type: 'problem', page: 676 }]
                    },
                    {
                        letter: 'C',
                        title: 'Election, Revocation and Termination',
                        startPage: 677,
                        content: [{ type: 'problem', page: 681 }]
                    },
                    {
                        letter: 'D',
                        title: 'Treatment of the Shareholders',
                        startPage: 682,
                        subsections: [
                            {
                                number: 1,
                                title: 'Pass-Through of Income and Losses: Basic Rules',
                                startPage: 682,
                                content: [{ type: 'problem', page: 685 }]
                            },
                            {
                                number: 2,
                                title: 'Deduction for Qualified Business Income',
                                startPage: 686,
                                content: [{ type: 'problem', page: 695 }]
                            },
                            {
                                number: 3,
                                title: 'Loss Limitations',
                                startPage: 696,
                                subsubsections: [
                                    { letter: 'a', title: 'In General', startPage: 696 },
                                    {
                                        letter: 'b',
                                        title: 'Basis of S Corporation Debt to a Shareholder',
                                        startPage: 697,
                                        content: [
                                            { type: 'case', title: 'Harris v. United States', page: 697 },
                                            { type: 'note', page: 703 }
                                        ]
                                    },
                                    {
                                        letter: 'c',
                                        title: 'Subchapter S Precontribution Losses and Section 362(e)(2)',
                                        startPage: 704,
                                        content: [{ type: 'problem', page: 706 }]
                                    }
                                ]
                            },
                            { number: 4, title: 'Sale of S Corporation Stock', startPage: 706 }
                        ]
                    },
                    {
                        letter: 'E',
                        title: 'Distributions to Shareholders',
                        startPage: 708,
                        content: [{ type: 'problem', page: 710 }]
                    },
                    {
                        letter: 'F',
                        title: 'Taxation of the S Corporation',
                        startPage: 711,
                        content: [{ type: 'problem', page: 716 }]
                    },
                    {
                        letter: 'G',
                        title: 'Coordination with Other Income Tax Provisions',
                        startPage: 718,
                        subsections: [
                            { number: 1, title: 'Subchapter C', startPage: 718 },
                            { number: 2, title: 'Net Investment Income Tax', startPage: 724 },
                            {
                                number: 3,
                                title: 'State and Local Taxes',
                                startPage: 724,
                                content: [{ type: 'problem', page: 725 }]
                            }
                        ]
                    },
                    {
                        letter: 'H',
                        title: 'Compensation Issues',
                        startPage: 725,
                        content: [
                            { type: 'case', title: 'Joseph Radtke, S.C. v. United States', page: 727 },
                            { type: 'note', page: 730 }
                        ]
                    },
                    {
                        letter: 'I',
                        title: 'Tax Policy Issues: Subchapter K vs. Subchapter S',
                        startPage: 731,
                        content: [
                            { type: 'joint_committee', title: 'Review of Selected Entity Classification and Partnership Tax Issues', page: 731 },
                            { type: 'note', page: 734 }
                        ]
                    }
                ]
            }
        ]
    }
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all chapters flattened from all parts
 */
export function getAllChapters(): ChapterDef[] {
    return TEXTBOOK_STRUCTURE.flatMap(part => part.chapters);
}

/**
 * Get a chapter by number
 */
export function getChapterByNumber(num: number): ChapterDef | undefined {
    return getAllChapters().find(ch => ch.number === num);
}

/**
 * Get the part containing a chapter
 */
export function getPartForChapter(chapterNum: number): PartDef | undefined {
    return TEXTBOOK_STRUCTURE.find(part =>
        part.chapters.some(ch => ch.number === chapterNum)
    );
}

/**
 * Calculate end pages for sections (next section start - 1)
 */
export function getSectionEndPage(chapter: ChapterDef, sectionLetter: string): number {
    const sections = chapter.sections;
    const idx = sections.findIndex(s => s.letter === sectionLetter);
    if (idx === -1) return chapter.endPage;
    if (idx === sections.length - 1) return chapter.endPage;
    return sections[idx + 1].startPage - 1;
}

/**
 * Count all content types across the textbook
 */
export function countContentTypes(): { problems: number; cases: number; rulings: number; notes: number } {
    let problems = 0, cases = 0, rulings = 0, notes = 0;

    function countInContent(content?: ContentEntry[]) {
        content?.forEach(c => {
            if (c.type === 'problem') problems++;
            if (c.type === 'case') cases++;
            if (c.type === 'revenue_ruling') rulings++;
            if (c.type === 'note') notes++;
        });
    }

    for (const part of TEXTBOOK_STRUCTURE) {
        for (const chapter of part.chapters) {
            for (const section of chapter.sections) {
                countInContent(section.content);
                for (const subsection of section.subsections || []) {
                    countInContent(subsection.content);
                    for (const subsubsection of subsection.subsubsections || []) {
                        countInContent(subsubsection.content);
                    }
                }
            }
        }
    }

    return { problems, cases, rulings, notes };
}