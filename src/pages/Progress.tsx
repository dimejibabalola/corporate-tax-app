import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLiveQuery } from "dexie-react-hooks";
import { useOutletContext, Link } from "react-router-dom";
import { db, ChapterProgress, MasteryLevel, getMasteryLevel } from "@/lib/db";
import { TEXTBOOK_STRUCTURE, getAllChapters } from "@/lib/textbook/structure";
import {
    TrendingUp,
    Target,
    Clock,
    Flame,
    Trophy,
    Brain,
    ChevronRight,
    Calendar,
    Zap
} from "lucide-react";
import { useMemo } from "react";

// Mastery level colors
const MASTERY_COLORS: Record<MasteryLevel, string> = {
    'NOT_STARTED': '#6b7280',
    'NEEDS_WORK': '#ef4444',
    'DEVELOPING': '#f59e0b',
    'PROFICIENT': '#22c55e',
    'MASTERED': '#3b82f6'
};

const MASTERY_EMOJI: Record<MasteryLevel, string> = {
    'NOT_STARTED': '⚫',
    'NEEDS_WORK': '🔴',
    'DEVELOPING': '🟡',
    'PROFICIENT': '🟢',
    'MASTERED': '🔵'
};

const Progress = () => {
    const { userId } = useOutletContext<{ userId: string }>();

    // Get data
    const textbook = useLiveQuery(() =>
        db.textbooks.where('userId').equals(userId).first()
        , [userId]);

    const chapters = useLiveQuery(() =>
        textbook ? db.chapters.where('textbookId').equals(textbook.id).sortBy('number') : []
        , [textbook]);

    const chapterProgress = useLiveQuery(() =>
        textbook ? db.chapterProgress.where('textbookId').equals(textbook.id).toArray() : []
        , [textbook]);

    const streak = useLiveQuery(() =>
        db.streaks.where('userId').equals(userId).first()
        , [userId]);

    const quizAttempts = useLiveQuery(() =>
        db.quizAttempts.where('userId').equals(userId).toArray()
        , [userId]);

    const answers = useLiveQuery(() =>
        db.answers.toArray()
        , []);

    // Calculate stats
    const stats = useMemo(() => {
        const totalQuestions = answers?.length || 0;
        const correctAnswers = answers?.filter(a => a.isCorrect).length || 0;
        const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

        const progressMap = new Map((chapterProgress || []).map(p => [p.chapterId, p]));
        const chaptersStarted = chapterProgress?.filter(p => p.masteryScore > 0).length || 0;
        const chaptersMastered = chapterProgress?.filter(p => p.masteryLevel === 'MASTERED' || p.masteryLevel === 'PROFICIENT').length || 0;

        const avgMastery = chapterProgress && chapterProgress.length > 0
            ? chapterProgress.reduce((sum, p) => sum + p.masteryScore, 0) / chapterProgress.length
            : 0;

        return {
            totalQuestions,
            correctAnswers,
            accuracy,
            chaptersStarted,
            chaptersMastered,
            totalChapters: chapters?.length || 15,
            avgMastery: Math.round(avgMastery * 100),
            currentStreak: streak?.currentStreak || 0,
            longestStreak: streak?.longestStreak || 0
        };
    }, [answers, chapterProgress, chapters, streak]);

    // Chart data
    const chartData = useMemo(() => {
        if (!chapters) return [];
        const progressMap = new Map((chapterProgress || []).map(p => [p.chapterId, p]));

        return chapters.map(c => {
            const progress = progressMap.get(c.id);
            return {
                name: `Ch ${c.number}`,
                fullName: c.title,
                accuracy: progress ? Math.round(progress.accuracyScore * 100) : 0,
                coverage: progress ? Math.round(progress.coverageScore * 100) : 0,
                mastery: progress ? Math.round(progress.masteryScore * 100) : 0
            };
        });
    }, [chapters, chapterProgress]);

    // Heat map data (chapters x sections)
    const heatMapData = useMemo(() => {
        if (!chapters) return [];
        const progressMap = new Map((chapterProgress || []).map(p => [p.chapterId, p]));

        return TEXTBOOK_STRUCTURE.map(part => ({
            part: part.number,
            chapters: part.chapters.map(ch => {
                const chapter = chapters.find(c => c.number === ch.number);
                const progress = chapter ? progressMap.get(chapter.id) : null;
                return {
                    number: ch.number,
                    title: ch.title.slice(0, 30),
                    level: progress?.masteryLevel || 'NOT_STARTED' as MasteryLevel
                };
            })
        }));
    }, [chapters, chapterProgress]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Progress Analytics</h1>
                    <p className="text-muted-foreground">Track your mastery and identify areas for improvement</p>
                </div>
                <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600">
                    <Link to="/quiz">
                        <Zap size={16} className="mr-2" />
                        Practice Now
                    </Link>
                </Button>
            </div>

            {/* Top Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                        <Brain className="h-5 w-5 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.totalQuestions}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.correctAnswers} correct ({stats.accuracy}% accuracy)
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/30 dark:to-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Chapters Mastered</CardTitle>
                        <Trophy className="h-5 w-5 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.chaptersMastered} / {stats.totalChapters}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.chaptersStarted} chapters started
                        </p>
                        <ProgressBar
                            value={(stats.chaptersMastered / stats.totalChapters) * 100}
                            className="mt-2 h-2"
                        />
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/30 dark:to-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
                        <Flame className="h-5 w-5 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.currentStreak} Days</div>
                        <p className="text-xs text-muted-foreground">
                            Longest: {stats.longestStreak} days
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-neutral-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Mastery</CardTitle>
                        <Target className="h-5 w-5 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.avgMastery}%</div>
                        <p className="text-xs text-muted-foreground">
                            Across all chapters
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp size={20} />
                        Performance by Chapter
                    </CardTitle>
                    <CardDescription>
                        Accuracy and coverage metrics for each chapter
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis domain={[0, 100]} />
                                <Tooltip
                                    formatter={(value: number, name: string) => [`${value}%`, name]}
                                    labelFormatter={(label) => {
                                        const data = chartData.find(d => d.name === label);
                                        return data?.fullName || label;
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="accuracy" name="Accuracy %" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="coverage" name="Coverage %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="mastery" name="Mastery %" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Heat Map */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar size={20} />
                        Mastery Heat Map
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                        <span>Visual overview of your progress across all chapters</span>
                        <div className="flex items-center gap-2 text-xs">
                            {Object.entries(MASTERY_EMOJI).map(([level, emoji]) => (
                                <span key={level} className="flex items-center gap-1">
                                    {emoji} {level.replace('_', ' ')}
                                </span>
                            ))}
                        </div>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {heatMapData.map((part) => (
                            <div key={part.part}>
                                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                                    Part {part.part}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {part.chapters.map((ch) => (
                                        <div
                                            key={ch.number}
                                            className="group relative"
                                        >
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm transition-all hover:scale-110 cursor-pointer"
                                                style={{ backgroundColor: MASTERY_COLORS[ch.level] }}
                                            >
                                                {ch.number}
                                            </div>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                Ch {ch.number}: {ch.title}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Study Recommendations */}
            <Card>
                <CardHeader>
                    <CardTitle>Recommended Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                        {chapterProgress?.filter(p => p.masteryLevel === 'NEEDS_WORK').slice(0, 2).map((p, i) => {
                            const chapter = chapters?.find(c => c.id === p.chapterId);
                            if (!chapter) return null;
                            return (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                                >
                                    <div>
                                        <Badge variant="destructive" className="mb-1">Needs Work</Badge>
                                        <p className="font-medium">Ch {chapter.number}. {chapter.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {Math.round(p.accuracyScore * 100)}% accuracy
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link to="/quiz">
                                            Review <ChevronRight size={14} className="ml-1" />
                                        </Link>
                                    </Button>
                                </div>
                            );
                        })}

                        {(!chapterProgress || chapterProgress.filter(p => p.masteryLevel === 'NEEDS_WORK').length === 0) && (
                            <div className="p-4 border rounded-lg border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20 col-span-2">
                                <p className="font-medium text-green-700 dark:text-green-300">
                                    🎉 No weak areas detected! Keep up the great work!
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Continue practicing to maintain your mastery levels.
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Progress;