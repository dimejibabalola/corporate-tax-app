/**
 * Spaced Repetition Service (SRS)
 * 
 * Implements SM-2 algorithm for optimal review scheduling
 * Tracks streaks and milestones
 */

import { v4 as uuidv4 } from 'uuid';
import { db, SRSCard, Milestone, Streak } from '@/lib/db';

// ============================================================================
// SM-2 ALGORITHM
// ============================================================================

/**
 * Update SRS card after a review
 * SM-2 inspired algorithm with simplified intervals
 */
export async function updateSRSCard(
    userId: string,
    questionId: string,
    correct: boolean
): Promise<SRSCard> {
    let card = await db.srsCards.where({ userId, questionId }).first();

    if (!card) {
        // Create new card
        card = {
            id: uuidv4(),
            userId,
            questionId,
            nextReviewAt: new Date(),
            intervalDays: 1,
            easeFactor: 2.5,
            consecutiveCorrect: 0,
            lastReviewedAt: new Date()
        };
    }

    if (correct) {
        card.consecutiveCorrect += 1;

        // Calculate new interval based on consecutive correct answers
        if (card.intervalDays === 1) {
            card.intervalDays = 3;
        } else if (card.intervalDays === 3) {
            card.intervalDays = 7;
        } else if (card.intervalDays === 7) {
            card.intervalDays = 14;
        } else {
            // After 14 days, use ease factor
            card.intervalDays = Math.round(card.intervalDays * card.easeFactor);
        }

        // Increase ease factor slightly for consistent performance
        if (card.consecutiveCorrect >= 3) {
            card.easeFactor = Math.min(card.easeFactor + 0.1, 3.0);
        }
    } else {
        // Reset on incorrect
        card.consecutiveCorrect = 0;
        card.intervalDays = 1;

        // Decrease ease factor
        card.easeFactor = Math.max(card.easeFactor - 0.2, 1.3);
    }

    // Set next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + card.intervalDays);
    card.nextReviewAt = nextReview;
    card.lastReviewedAt = new Date();

    await db.srsCards.put(card);
    return card;
}

/**
 * Get cards due for review
 */
export async function getDueCards(userId: string, limit: number = 20): Promise<SRSCard[]> {
    const now = new Date();

    return db.srsCards
        .where('userId')
        .equals(userId)
        .filter(card => new Date(card.nextReviewAt) <= now)
        .limit(limit)
        .toArray();
}

/**
 * Get SRS stats for a user
 */
export async function getSRSStats(userId: string): Promise<{
    totalCards: number;
    dueToday: number;
    learning: number;
    mature: number;
}> {
    const allCards = await db.srsCards.where('userId').equals(userId).toArray();
    const now = new Date();

    return {
        totalCards: allCards.length,
        dueToday: allCards.filter(c => new Date(c.nextReviewAt) <= now).length,
        learning: allCards.filter(c => c.intervalDays < 7).length,
        mature: allCards.filter(c => c.intervalDays >= 21).length
    };
}

// ============================================================================
// MILESTONES
// ============================================================================

export interface MilestoneDef {
    id: string;
    name: string;
    description: string;
    icon: string;
    check: (stats: UserStats) => boolean;
}

interface UserStats {
    totalQuestions: number;
    totalQuizzes: number;
    currentStreak: number;
    longestStreak: number;
    masteredChapters: number;
    examReadiness: number;
}

export const MILESTONES: MilestoneDef[] = [
    {
        id: 'first_quiz',
        name: 'First Steps',
        description: 'Complete your first quiz',
        icon: '🎯',
        check: (stats) => stats.totalQuizzes >= 1
    },
    {
        id: '10_questions',
        name: 'Getting Started',
        description: 'Answer 10 questions',
        icon: '📝',
        check: (stats) => stats.totalQuestions >= 10
    },
    {
        id: '50_questions',
        name: 'Dedicated Learner',
        description: 'Answer 50 questions',
        icon: '📚',
        check: (stats) => stats.totalQuestions >= 50
    },
    {
        id: '100_questions',
        name: 'Century',
        description: 'Answer 100 questions',
        icon: '💯',
        check: (stats) => stats.totalQuestions >= 100
    },
    {
        id: '3_day_streak',
        name: 'On a Roll',
        description: 'Maintain a 3-day study streak',
        icon: '🔥',
        check: (stats) => stats.currentStreak >= 3 || stats.longestStreak >= 3
    },
    {
        id: '7_day_streak',
        name: 'Week Warrior',
        description: 'Maintain a 7-day study streak',
        icon: '⚡',
        check: (stats) => stats.currentStreak >= 7 || stats.longestStreak >= 7
    },
    {
        id: '14_day_streak',
        name: 'Fortnight Fighter',
        description: 'Maintain a 14-day study streak',
        icon: '🏆',
        check: (stats) => stats.currentStreak >= 14 || stats.longestStreak >= 14
    },
    {
        id: 'first_mastery',
        name: 'Chapter Champion',
        description: 'Master your first chapter',
        icon: '🌟',
        check: (stats) => stats.masteredChapters >= 1
    },
    {
        id: 'five_mastery',
        name: 'Knowledge Builder',
        description: 'Master 5 chapters',
        icon: '📖',
        check: (stats) => stats.masteredChapters >= 5
    },
    {
        id: 'exam_ready',
        name: 'Exam Ready',
        description: 'Reach 85% exam readiness',
        icon: '🎓',
        check: (stats) => stats.examReadiness >= 85
    }
];

/**
 * Check and award new milestones
 */
export async function checkMilestones(userId: string): Promise<MilestoneDef[]> {
    const earnedMilestones = await db.milestones
        .where('userId')
        .equals(userId)
        .toArray();

    const earnedIds = new Set(earnedMilestones.map(m => m.milestoneId));

    // Get user stats
    const stats = await getUserStats(userId);

    // Check for new milestones
    const newMilestones: MilestoneDef[] = [];

    for (const milestone of MILESTONES) {
        if (!earnedIds.has(milestone.id) && milestone.check(stats)) {
            // Award the milestone
            await db.milestones.add({
                id: uuidv4(),
                milestoneId: milestone.id,
                userId,
                earnedAt: new Date()
            });
            newMilestones.push(milestone);
        }
    }

    return newMilestones;
}

/**
 * Get user stats for milestone checking
 */
async function getUserStats(userId: string): Promise<UserStats> {
    const textbook = await db.textbooks.where('userId').equals(userId).first();

    const quizAttempts = await db.quizAttempts.where('userId').equals(userId).toArray();
    const answers = await db.answers.toArray();
    const streak = await db.streaks.where('userId').equals(userId).first();

    const chapterProgress = textbook
        ? await db.chapterProgress.where('textbookId').equals(textbook.id).toArray()
        : [];

    const masteredChapters = chapterProgress.filter(
        p => p.masteryLevel === 'MASTERED' || p.masteryLevel === 'PROFICIENT'
    ).length;

    // Calculate exam readiness (simplified)
    const totalChapters = await db.chapters.where('textbookId').equals(textbook?.id || '').count();
    const avgMastery = chapterProgress.length > 0
        ? chapterProgress.reduce((sum, p) => sum + p.masteryScore, 0) / chapterProgress.length
        : 0;
    const coverage = chapterProgress.filter(p => p.masteryScore > 0).length / (totalChapters || 15);
    const examReadiness = Math.round(((coverage * 0.3) + (avgMastery * 0.7)) * 100);

    return {
        totalQuestions: answers.length,
        totalQuizzes: quizAttempts.length,
        currentStreak: streak?.currentStreak || 0,
        longestStreak: streak?.longestStreak || 0,
        masteredChapters,
        examReadiness
    };
}

/**
 * Get all earned milestones for a user
 */
export async function getEarnedMilestones(userId: string): Promise<(MilestoneDef & { earnedAt: Date })[]> {
    const earned = await db.milestones.where('userId').equals(userId).toArray();

    return earned.map(m => {
        const def = MILESTONES.find(md => md.id === m.milestoneId);
        return def ? { ...def, earnedAt: m.earnedAt } : null;
    }).filter(Boolean) as (MilestoneDef & { earnedAt: Date })[];
}

/**
 * Get unearned milestones with progress
 */
export async function getUnearnedMilestones(userId: string): Promise<(MilestoneDef & { progress: number })[]> {
    const earnedIds = new Set(
        (await db.milestones.where('userId').equals(userId).toArray()).map(m => m.milestoneId)
    );

    const stats = await getUserStats(userId);

    return MILESTONES
        .filter(m => !earnedIds.has(m.id))
        .map(m => ({
            ...m,
            progress: calculateProgress(m, stats)
        }));
}

function calculateProgress(milestone: MilestoneDef, stats: UserStats): number {
    switch (milestone.id) {
        case 'first_quiz':
            return Math.min(stats.totalQuizzes / 1, 1) * 100;
        case '10_questions':
            return Math.min(stats.totalQuestions / 10, 1) * 100;
        case '50_questions':
            return Math.min(stats.totalQuestions / 50, 1) * 100;
        case '100_questions':
            return Math.min(stats.totalQuestions / 100, 1) * 100;
        case '3_day_streak':
            return Math.min(Math.max(stats.currentStreak, stats.longestStreak) / 3, 1) * 100;
        case '7_day_streak':
            return Math.min(Math.max(stats.currentStreak, stats.longestStreak) / 7, 1) * 100;
        case '14_day_streak':
            return Math.min(Math.max(stats.currentStreak, stats.longestStreak) / 14, 1) * 100;
        case 'first_mastery':
            return Math.min(stats.masteredChapters / 1, 1) * 100;
        case 'five_mastery':
            return Math.min(stats.masteredChapters / 5, 1) * 100;
        case 'exam_ready':
            return Math.min(stats.examReadiness / 85, 1) * 100;
        default:
            return 0;
    }
}
