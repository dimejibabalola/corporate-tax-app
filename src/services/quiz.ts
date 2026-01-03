/**
 * Quiz Service
 * 
 * Provides quiz generation, evaluation, and demo questions
 */

import { v4 as uuidv4 } from 'uuid';
import {
    Question,
    MCQuestion,
    TrueFalseQuestion,
    FillBlankQuestion,
    ShortAnswerQuestion,
    QuizConfig,
    EvaluationResult,
    QuestionType,
    Difficulty
} from '@/types/quiz';
import { db, Question as DBQuestion, QuizAttempt, Answer, ChapterProgress, getMasteryLevel } from '@/lib/db';
import { TEXTBOOK_STRUCTURE } from '@/lib/textbook/structure';

// ============================================================================
// DEMO QUESTIONS - Sample questions for each chapter (no AI required)
// ============================================================================

const DEMO_QUESTIONS: Question[] = [
    // Chapter 1: Overview
    {
        id: 'demo-1-mc-1',
        type: 'MC',
        difficulty: 'basic',
        question: 'What is the primary difference between a C corporation and an S corporation for tax purposes?',
        options: {
            A: 'C corps can have unlimited shareholders, S corps cannot',
            B: 'C corps are subject to double taxation, S corps pass through income to shareholders',
            C: 'S corps must be publicly traded, C corps can be private',
            D: 'C corps cannot issue preferred stock, S corps can'
        },
        correctAnswer: 'B',
        explanation: 'C corporations are subject to entity-level taxation, meaning the corporation pays tax on its income, and shareholders pay tax again on dividends (double taxation). S corporations are pass-through entities where income is taxed only at the shareholder level.',
        sourcePages: [3, 12],
        chapterId: 'ch-1'
    },
    {
        id: 'demo-1-tf-1',
        type: 'TRUE_FALSE',
        difficulty: 'basic',
        statement: 'Under the check-the-box regulations, a domestic eligible entity with two or more members is classified as a partnership by default.',
        correctAnswer: true,
        question: 'Under the check-the-box regulations, a domestic eligible entity with two or more members is classified as a partnership by default.',
        explanation: 'Treas. Reg. § 301.7701-3(b)(1) provides that a domestic eligible entity is classified as a partnership if it has two or more members, unless it elects to be classified as a corporation.',
        sourcePages: [30, 31],
        chapterId: 'ch-1'
    },
    {
        id: 'demo-1-fb-1',
        type: 'FILL_BLANK',
        difficulty: 'intermediate',
        question: 'The current corporate income tax rate under IRC § 11 is _____ percent.',
        correctAnswer: '21',
        acceptableAnswers: ['21', '21%', 'twenty-one', '21 percent'],
        explanation: 'The Tax Cuts and Jobs Act of 2017 established a flat 21% corporate income tax rate, replacing the prior graduated rate structure.',
        sourcePages: [23, 24],
        chapterId: 'ch-1'
    },

    // Chapter 2: Formation
    {
        id: 'demo-2-mc-1',
        type: 'MC',
        difficulty: 'basic',
        question: 'Under IRC § 351, what percentage of stock must the transferors own immediately after the exchange to qualify for nonrecognition?',
        options: {
            A: '50% or more',
            B: 'More than 50%',
            C: '80% or more',
            D: '100%'
        },
        correctAnswer: 'C',
        explanation: 'IRC § 351(a) requires that transferors be in "control" of the corporation immediately after the exchange. Control is defined in § 368(c) as ownership of at least 80% of the total voting power and 80% of each class of nonvoting stock.',
        sourcePages: [55, 60],
        chapterId: 'ch-2'
    },
    {
        id: 'demo-2-mc-2',
        type: 'MC',
        difficulty: 'intermediate',
        question: 'In a § 351 exchange, what is the tax treatment when a transferor receives boot in addition to stock?',
        options: {
            A: 'The entire transaction becomes taxable',
            B: 'Gain is recognized to the extent of the boot received',
            C: 'Boot is always tax-free',
            D: 'Loss may be recognized to the extent of boot'
        },
        correctAnswer: 'B',
        explanation: 'Under § 351(b), if boot is received in addition to stock, gain is recognized to the extent of the boot received (but not in excess of the realized gain). Loss is never recognized in a § 351 exchange.',
        sourcePages: [70, 73],
        chapterId: 'ch-2'
    },
    {
        id: 'demo-2-tf-1',
        type: 'TRUE_FALSE',
        difficulty: 'basic',
        statement: 'Services rendered to a corporation can qualify as "property" for purposes of IRC § 351.',
        correctAnswer: false,
        question: 'Services rendered to a corporation can qualify as "property" for purposes of IRC § 351.',
        explanation: 'IRC § 351(d)(1) explicitly provides that stock issued for services is not treated as issued in exchange for property. Thus, a person who contributes only services cannot be part of a control group for § 351 purposes.',
        sourcePages: [66, 67],
        chapterId: 'ch-2'
    },

    // Chapter 3: Capital Structure
    {
        id: 'demo-3-mc-1',
        type: 'MC',
        difficulty: 'basic',
        question: 'What is the primary tax advantage of debt financing over equity financing for a corporation?',
        options: {
            A: 'Interest payments create basis in stock',
            B: 'Interest payments are deductible by the corporation',
            C: 'Debt holders have no voting rights',
            D: 'Debt can be converted to equity tax-free'
        },
        correctAnswer: 'B',
        explanation: 'Interest payments on debt are generally deductible under IRC § 163, reducing the corporation\'s taxable income. Dividend payments on equity, by contrast, are not deductible and are paid from after-tax earnings.',
        sourcePages: [115, 119],
        chapterId: 'ch-3'
    },

    // Chapter 4: Distributions
    {
        id: 'demo-4-mc-1',
        type: 'MC',
        difficulty: 'basic',
        question: 'A distribution from a corporation to its shareholders is a taxable dividend to the extent of:',
        options: {
            A: 'The corporation\'s accumulated earnings and profits',
            B: 'The corporation\'s current earnings and profits',
            C: 'The corporation\'s current and accumulated earnings and profits',
            D: 'The fair market value of property distributed'
        },
        correctAnswer: 'C',
        explanation: 'Under IRC § 316, a dividend is defined as a distribution of property made by a corporation to its shareholders out of its earnings and profits (E&P). Distributions are sourced first from current E&P, then from accumulated E&P.',
        sourcePages: [153, 160],
        chapterId: 'ch-4'
    },
    {
        id: 'demo-4-tf-1',
        type: 'TRUE_FALSE',
        difficulty: 'intermediate',
        statement: 'When a corporation distributes appreciated property, it recognizes gain as if the property were sold at fair market value.',
        correctAnswer: true,
        question: 'When a corporation distributes appreciated property, it recognizes gain as if the property were sold at fair market value.',
        explanation: 'Under IRC § 311(b), when a corporation distributes property with a fair market value in excess of its adjusted basis, the corporation recognizes gain as if the property were sold for its fair market value. This reversed the prior General Utilities doctrine.',
        sourcePages: [168, 170],
        chapterId: 'ch-4'
    },

    // Chapter 5: Redemptions
    {
        id: 'demo-5-mc-1',
        type: 'MC',
        difficulty: 'intermediate',
        question: 'A redemption will qualify as "substantially disproportionate" under § 302(b)(2) if the shareholder owns less than what percentage of voting stock after the redemption?',
        options: {
            A: '50% of their pre-redemption percentage',
            B: '80% of their pre-redemption percentage',
            C: '75% of their pre-redemption percentage',
            D: '30% of their pre-redemption percentage'
        },
        correctAnswer: 'B',
        explanation: 'Under § 302(b)(2), a redemption is substantially disproportionate if (1) after the redemption the shareholder owns less than 50% of voting power, AND (2) the shareholder\'s ownership percentage is less than 80% of the pre-redemption percentage.',
        sourcePages: [207, 209],
        chapterId: 'ch-5'
    },

    // More chapters...
    {
        id: 'demo-7-mc-1',
        type: 'MC',
        difficulty: 'basic',
        question: 'In a complete liquidation, shareholders generally:',
        options: {
            A: 'Recognize ordinary income equal to the amount received',
            B: 'Recognize capital gain or loss on the exchange of stock for assets',
            C: 'Do not recognize any gain or loss',
            D: 'Recognize gain but never loss'
        },
        correctAnswer: 'B',
        explanation: 'Under IRC § 331, amounts received by shareholders in a complete liquidation are treated as received in exchange for their stock, resulting in capital gain or loss measured by the difference between the amount received and stock basis.',
        sourcePages: [325, 326],
        chapterId: 'ch-7'
    },

    // Chapter 9: Reorganizations
    {
        id: 'demo-9-mc-1',
        type: 'MC',
        difficulty: 'exam',
        question: 'In a Type A reorganization, what is the minimum percentage of consideration that must be paid in acquirer stock to satisfy the continuity of interest requirement under current regulations?',
        options: {
            A: '50%',
            B: '40%',
            C: '80%',
            D: '100%'
        },
        correctAnswer: 'B',
        explanation: 'Rev. Proc. 77-37 established a 50% guideline for ruling purposes, but the regulations (Treas. Reg. § 1.368-1(e)(2)(v), Example 1) provide a safe harbor of 40% stock consideration for continuity of interest.',
        sourcePages: [396, 399],
        chapterId: 'ch-9'
    },

    // Chapter 15: S Corporations
    {
        id: 'demo-15-mc-1',
        type: 'MC',
        difficulty: 'basic',
        question: 'What is the maximum number of shareholders an S corporation may have?',
        options: {
            A: '75',
            B: '100',
            C: 'Unlimited',
            D: '35'
        },
        correctAnswer: 'B',
        explanation: 'IRC § 1361(b)(1)(A) limits S corporations to 100 shareholders. Family members, as defined in § 1361(c)(1), are treated as one shareholder for this purpose.',
        sourcePages: [667, 669],
        chapterId: 'ch-15'
    },
    {
        id: 'demo-15-tf-1',
        type: 'TRUE_FALSE',
        difficulty: 'basic',
        statement: 'A partnership can be a shareholder of an S corporation.',
        correctAnswer: false,
        question: 'A partnership can be a shareholder of an S corporation.',
        explanation: 'IRC § 1361(b)(1)(B) provides that an S corporation cannot have a partnership as a shareholder. Only individuals, estates, and certain trusts and tax-exempt organizations may be S corporation shareholders.',
        sourcePages: [669, 671],
        chapterId: 'ch-15'
    }
];

// ============================================================================
// QUIZ GENERATION
// ============================================================================

/**
 * Generate a quiz with demo questions (no AI required)
 */
export function generateDemoQuiz(config: QuizConfig): Question[] {
    let questions = [...DEMO_QUESTIONS];

    // Filter by chapter if specified
    if (config.chapterId) {
        questions = questions.filter(q => q.chapterId === config.chapterId);

        // Filter by section if specified (and chapter matches)
        if (config.sectionId) {
            questions = questions.filter(q => q.sectionId === config.sectionId);
        }
    }

    // Filter by question types
    if (config.questionTypes.length > 0) {
        questions = questions.filter(q => config.questionTypes.includes(q.type));
    }

    // Filter by difficulty
    if (config.difficulty !== 'exam') {
        questions = questions.filter(q =>
            q.difficulty === config.difficulty ||
            (config.difficulty === 'intermediate' && q.difficulty === 'basic')
        );
    }

    // Shuffle and limit
    const shuffled = questions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, config.count);
}

/**
 * Get all available demo questions for a chapter
 */
export function getDemoQuestionsForChapter(chapterId: string): Question[] {
    return DEMO_QUESTIONS.filter(q => q.chapterId === chapterId);
}

// ============================================================================
// ANSWER EVALUATION
// ============================================================================

/**
 * Evaluate an objective answer (MC, T/F, Fill-blank)
 */
export function evaluateObjective(userAnswer: string, question: Question): EvaluationResult {
    switch (question.type) {
        case 'MC': {
            const mcQ = question as MCQuestion;
            const isCorrect = userAnswer.toUpperCase() === mcQ.correctAnswer;
            return {
                isCorrect,
                feedback: isCorrect
                    ? `Correct! ${mcQ.explanation}`
                    : `Incorrect. The correct answer is ${mcQ.correctAnswer}. ${mcQ.explanation}`
            };
        }

        case 'TRUE_FALSE': {
            const tfQ = question as TrueFalseQuestion;
            const userBool = userAnswer.toLowerCase() === 'true';
            const isCorrect = userBool === tfQ.correctAnswer;
            return {
                isCorrect,
                feedback: isCorrect
                    ? `Correct! ${tfQ.explanation}`
                    : `Incorrect. The statement is ${tfQ.correctAnswer ? 'TRUE' : 'FALSE'}. ${tfQ.explanation}`
            };
        }

        case 'FILL_BLANK': {
            const fbQ = question as FillBlankQuestion;
            const normalized = userAnswer.trim().toLowerCase();
            const isCorrect = fbQ.acceptableAnswers.some(a => a.toLowerCase() === normalized);
            return {
                isCorrect,
                feedback: isCorrect
                    ? `Correct! ${fbQ.explanation}`
                    : `Incorrect. The correct answer is "${fbQ.correctAnswer}". ${fbQ.explanation}`
            };
        }

        default:
            return { isCorrect: false, feedback: 'Cannot evaluate this question type objectively.' };
    }
}

/**
 * Evaluate a short answer (simplified - checks for key points)
 */
export function evaluateShortAnswer(userAnswer: string, question: ShortAnswerQuestion): EvaluationResult {
    const answer = userAnswer.toLowerCase();
    const keyPointsFound = question.keyPoints.filter(point =>
        answer.includes(point.toLowerCase())
    );

    const coverage = keyPointsFound.length / question.keyPoints.length;

    let score: 'full' | 'partial' | 'minimal' | 'miss';
    if (coverage >= 0.8) score = 'full';
    else if (coverage >= 0.5) score = 'partial';
    else if (coverage > 0) score = 'minimal';
    else score = 'miss';

    return {
        isCorrect: score === 'full' || score === 'partial',
        score,
        feedback: `Key points addressed: ${keyPointsFound.length}/${question.keyPoints.length}. Model answer: ${question.modelAnswer}`,
        pointsAddressed: keyPointsFound,
        pointsMissed: question.keyPoints.filter(p => !keyPointsFound.includes(p))
    };
}

// ============================================================================
// QUIZ PERSISTENCE
// ============================================================================

/**
 * Save a quiz attempt to the database
 */
export async function saveQuizAttempt(
    userId: string,
    textbookId: string,
    chapterId: string | undefined,
    questions: Question[],
    answers: { questionId: string; userAnswer: string; isCorrect: boolean; feedback?: string }[]
): Promise<string> {
    const attemptId = uuidv4();
    const correctCount = answers.filter(a => a.isCorrect).length;

    const attempt: QuizAttempt = {
        id: attemptId,
        userId,
        textbookId,
        chapterId,
        questionIds: questions.map(q => q.id),
        score: (correctCount / questions.length) * 100,
        totalQuestions: questions.length,
        correctCount,
        startedAt: new Date(),
        completedAt: new Date()
    };

    await db.quizAttempts.add(attempt);

    // Save individual answers
    for (const ans of answers) {
        const dbAnswer: Answer = {
            id: uuidv4(),
            quizAttemptId: attemptId,
            questionId: ans.questionId,
            userAnswer: ans.userAnswer,
            isCorrect: ans.isCorrect,
            feedback: ans.feedback,
            answeredAt: new Date()
        };
        await db.answers.add(dbAnswer);
    }

    // Update chapter progress if applicable
    if (chapterId) {
        await updateChapterProgress(userId, textbookId, chapterId);
    }

    return attemptId;
}

/**
 * Update chapter progress after a quiz
 */
async function updateChapterProgress(userId: string, textbookId: string, chapterId: string) {
    const existingProgress = await db.chapterProgress
        .where({ userId, chapterId })
        .first();

    // Get all answers for this chapter
    const attempts = await db.quizAttempts
        .where({ userId, chapterId })
        .toArray();

    const allAnswers = await db.answers
        .where('quizAttemptId')
        .anyOf(attempts.map(a => a.id))
        .toArray();

    const totalAttempted = allAnswers.length;
    const totalCorrect = allAnswers.filter(a => a.isCorrect).length;
    const accuracy = totalAttempted > 0 ? totalCorrect / totalAttempted : 0;

    // Simple mastery calculation (will be refined)
    const coverage = Math.min(totalAttempted / 20, 1); // Assume 20 questions per chapter for full coverage
    const masteryScore = (coverage * 0.4) + (accuracy * 0.6);

    const progress: ChapterProgress = {
        id: existingProgress?.id || uuidv4(),
        userId,
        textbookId,
        chapterId,
        coverageScore: coverage,
        accuracyScore: accuracy,
        retentionScore: 0, // Will be updated by SRS
        masteryScore,
        masteryLevel: getMasteryLevel(masteryScore),
        questionsAttempted: totalAttempted,
        questionsCorrect: totalCorrect,
        lastActivityAt: new Date()
    };

    await db.chapterProgress.put(progress);
}

/**
 * Update streak when user completes a quiz
 */
export async function updateStreak(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];

    let streak = await db.streaks.where({ userId }).first();

    if (!streak) {
        streak = {
            id: uuidv4(),
            userId,
            currentStreak: 1,
            longestStreak: 1,
            lastActivityDate: today
        };
        await db.streaks.add(streak);
        return 1;
    }

    if (streak.lastActivityDate === today) {
        // Already logged activity today
        return streak.currentStreak;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (streak.lastActivityDate === yesterdayStr) {
        // Continuous streak
        streak.currentStreak += 1;
        streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
    } else {
        // Streak broken
        streak.currentStreak = 1;
    }

    streak.lastActivityDate = today;
    await db.streaks.put(streak);

    return streak.currentStreak;
}
