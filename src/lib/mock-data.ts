export interface Chapter {
  id: string;
  number: number;
  title: string;
  pageRange: string;
  masteryLevel: 'not-started' | 'needs-work' | 'developing' | 'proficient' | 'mastered';
  progress: number; // 0-100
  accuracy: number; // 0-100
  questionsAnswered: number;
  lastActivity?: string;
}

export const MOCK_CHAPTERS: Chapter[] = [
  {
    id: "c1",
    number: 1,
    title: "Introduction to Corporate Taxation",
    pageRange: "1-28",
    masteryLevel: "mastered",
    progress: 100,
    accuracy: 92,
    questionsAnswered: 45,
    lastActivity: "2024-03-10"
  },
  {
    id: "c2",
    number: 2,
    title: "Formation of a Corporation (§ 351)",
    pageRange: "29-84",
    masteryLevel: "proficient",
    progress: 85,
    accuracy: 82,
    questionsAnswered: 120,
    lastActivity: "2024-03-12"
  },
  {
    id: "c3",
    number: 3,
    title: "Capital Structure",
    pageRange: "85-112",
    masteryLevel: "developing",
    progress: 60,
    accuracy: 68,
    questionsAnswered: 35,
    lastActivity: "2024-03-14"
  },
  {
    id: "c4",
    number: 4,
    title: "Non-Liquidating Distributions (§ 301)",
    pageRange: "113-160",
    masteryLevel: "needs-work",
    progress: 30,
    accuracy: 45,
    questionsAnswered: 20,
    lastActivity: "2024-03-15"
  },
  {
    id: "c5",
    number: 5,
    title: "Redemptions and Partial Liquidations",
    pageRange: "161-210",
    masteryLevel: "not-started",
    progress: 0,
    accuracy: 0,
    questionsAnswered: 0,
  },
  {
    id: "c6",
    number: 6,
    title: "Stock Dividends and § 306 Stock",
    pageRange: "211-240",
    masteryLevel: "not-started",
    progress: 0,
    accuracy: 0,
    questionsAnswered: 0,
  },
  {
    id: "c7",
    number: 7,
    title: "Complete Liquidations",
    pageRange: "241-290",
    masteryLevel: "not-started",
    progress: 0,
    accuracy: 0,
    questionsAnswered: 0,
  }
];

export const MASTERY_COLORS = {
  'not-started': 'bg-gray-200 dark:bg-neutral-800 text-gray-400',
  'needs-work': 'bg-red-500 text-white',
  'developing': 'bg-yellow-500 text-white',
  'proficient': 'bg-green-500 text-white',
  'mastered': 'bg-blue-600 text-white',
};

export const MASTERY_LABELS = {
  'not-started': 'Not Started',
  'needs-work': 'Needs Work',
  'developing': 'Developing',
  'proficient': 'Proficient',
  'mastered': 'Mastered',
};