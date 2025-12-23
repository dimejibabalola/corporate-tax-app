import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, AlertCircle, Clock, CheckCircle2, BookOpen, Flame, Target, Zap, Trophy } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useTracker } from "@/hooks/use-tracker";
import { useMemo } from "react";
import { db, ChapterProgress, getMasteryLevel, MasteryLevel, Streak, Answer } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { TEXTBOOK_STRUCTURE, countContentTypes } from "@/lib/textbook/structure";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Mastery level styling
const MASTERY_STYLES: Record<MasteryLevel, { bg: string; text: string; label: string }> = {
  'NOT_STARTED': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', label: 'Not Started' },
  'NEEDS_WORK': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', label: 'Needs Work' },
  'DEVELOPING': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', label: 'Developing' },
  'PROFICIENT': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', label: 'Proficient' },
  'MASTERED': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', label: 'Mastered' },
};

// Get chapters from hardcoded structure - ALWAYS available
const ALL_CHAPTERS = TEXTBOOK_STRUCTURE.flatMap(part =>
  part.chapters.map(ch => ({
    ...ch,
    id: `ch-${ch.number}`,  // Generate ID from chapter number
    partNumber: part.number,
    partTitle: part.title,
  }))
);

const Dashboard = () => {
  const { userId } = useOutletContext<{ userId: string }>();
  const { logActivity } = useTracker(userId);

  // ============================================================================
  // INDEPENDENT DATA LOADING - Each loads separately, dashboard renders immediately
  // ============================================================================

  // Progress data - can be loading, will show defaults
  const chapterProgress = useLiveQuery(() =>
    db.chapterProgress.where('userId').equals(userId).toArray()
    , [userId]);
  const progressLoading = chapterProgress === undefined;

  // Streak data - can be loading
  const streak = useLiveQuery(() =>
    db.streaks.where('userId').equals(userId).first()
    , [userId]);
  const streakLoading = streak === undefined;

  // Answers for total count
  const answers = useLiveQuery(() =>
    db.answers.toArray()
    , []);
  const answersLoading = answers === undefined;

  // ============================================================================
  // DERIVED VALUES - Use defaults when loading
  // ============================================================================

  const stats = countContentTypes();
  const totalQuestions = answers?.length || 0;
  const currentStreak = streak?.currentStreak || 0;
  const chaptersStarted = progressLoading ? 0 : chapterProgress?.filter(p => p.masteryScore > 0).length || 0;

  // Create progress map for quick lookup
  const progressMap = useMemo(() =>
    new Map((chapterProgress || []).map(p => [p.chapterId, p]))
    , [chapterProgress]);

  // Get mastery for a chapter
  const getChapterMastery = (chapterId: string) => {
    const progress = progressMap.get(chapterId);
    return {
      score: progress?.masteryScore || 0,
      level: progress?.masteryLevel || 'NOT_STARTED' as MasteryLevel,
      questions: progress?.questionsAttempted || 0,
      accuracy: progress?.questionsAttempted ? Math.round((progress.questionsCorrect / progress.questionsAttempted) * 100) : 0
    };
  };

  // Exam readiness calculation
  const examReadiness = useMemo(() => {
    if (progressLoading) return { score: 0, label: 'Calculating...' };
    if (!chapterProgress || chapterProgress.length === 0) return { score: 0, label: 'Not Started' };

    let totalMastery = 0;
    let chaptersWithProgress = 0;

    chapterProgress.forEach(progress => {
      if (progress.masteryScore > 0) {
        totalMastery += progress.masteryScore;
        chaptersWithProgress++;
      }
    });

    const coverage = chaptersWithProgress / ALL_CHAPTERS.length;
    const avgMastery = chaptersWithProgress > 0 ? totalMastery / chaptersWithProgress : 0;
    const score = (coverage * 0.25) + (avgMastery * 0.50) + (coverage * 0.25);
    const percentage = Math.round(score * 100);

    let label = 'Not Ready';
    if (percentage >= 85) label = 'Exam Ready! 🎉';
    else if (percentage >= 70) label = 'On Track';
    else if (percentage >= 50) label = 'Getting There';
    else if (percentage > 0) label = 'Just Starting';

    return { score: percentage, label };
  }, [chapterProgress, progressLoading]);

  // Weak chapters
  const weakChapters = useMemo(() => {
    if (progressLoading || !chapterProgress) return [];
    return chapterProgress
      .filter(p => p.masteryLevel === 'NEEDS_WORK' || (p.masteryScore > 0 && p.masteryScore < 0.6))
      .map(p => {
        const chapter = ALL_CHAPTERS.find(c => c.id === p.chapterId);
        return chapter ? { ...chapter, mastery: p } : null;
      })
      .filter(Boolean)
      .slice(0, 3);
  }, [chapterProgress, progressLoading]);

  const readinessData = [
    { name: 'Ready', value: examReadiness.score },
    { name: 'Remaining', value: 100 - examReadiness.score },
  ];

  // ============================================================================
  // RENDER - Never blocked, always shows structure immediately
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Corporate Tax Dashboard</h1>
          <p className="text-muted-foreground">
            {progressLoading ? 'Loading your progress...' :
              examReadiness.score > 0 ? `${examReadiness.label} - Keep up the great work!` : 'Start studying to track your progress'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/textbook">View Textbook</Link>
          </Button>
          <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600">
            <Link to="/quiz">
              <Zap size={16} className="mr-2" />
              Start Quiz
            </Link>
          </Button>
        </div>
      </div>

      {/* Top Stats Row - Show skeletons or values */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/30 dark:to-neutral-900 border-orange-100 dark:border-orange-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
            <Flame className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            {streakLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <div className="text-3xl font-bold text-orange-600">{currentStreak} Days</div>
            )}
            <p className="text-xs text-muted-foreground">
              {currentStreak > 0 ? 'Keep it going! 🔥' : 'Start studying today!'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-neutral-900 border-purple-100 dark:border-purple-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions Answered</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            {answersLoading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <div className="text-3xl font-bold text-purple-600">{totalQuestions}</div>
            )}
            <p className="text-xs text-muted-foreground">
              of {stats.problems}+ practice problems
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/30 dark:to-neutral-900 border-green-100 dark:border-green-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chapters Covered</CardTitle>
            <BookOpen className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            {progressLoading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <div className="text-3xl font-bold text-green-600">
                {chaptersStarted} / {ALL_CHAPTERS.length}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              chapters with activity
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-950/30 dark:to-neutral-900 border-red-100 dark:border-red-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weak Areas</CardTitle>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            {progressLoading ? (
              <Skeleton className="h-9 w-8" />
            ) : (
              <div className="text-3xl font-bold text-red-600">{weakChapters.length}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {weakChapters.length > 0 ? 'Focus on these next' : 'No weak spots yet!'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Main Progress Area - ALWAYS renders all chapters from hardcoded TOC */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target size={20} />
              Chapter Progress
            </CardTitle>
            <CardDescription>
              Your mastery across all {ALL_CHAPTERS.length} chapters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {TEXTBOOK_STRUCTURE.map((part) => (
                <div key={part.number} className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Part {part.number}: {part.title}
                  </h3>
                  {part.chapters.map((chapter) => {
                    const mastery = getChapterMastery(chapter.id);
                    const style = MASTERY_STYLES[mastery.level];

                    return (
                      <div key={chapter.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate max-w-[200px] md:max-w-md">
                            Ch {chapter.number}. {chapter.title}
                          </span>
                          {progressLoading ? (
                            <Skeleton className="h-5 w-20" />
                          ) : (
                            <Badge className={`${style.bg} ${style.text} border-0`}>
                              {style.label}
                            </Badge>
                          )}
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          {progressLoading ? (
                            <Skeleton className="h-full w-full" />
                          ) : (
                            <div
                              className={`h-full transition-all duration-500 ${mastery.level === 'NOT_STARTED' ? 'bg-gray-300' :
                                mastery.level === 'NEEDS_WORK' ? 'bg-red-500' :
                                  mastery.level === 'DEVELOPING' ? 'bg-yellow-500' :
                                    mastery.level === 'PROFICIENT' ? 'bg-green-500' :
                                      'bg-blue-500'
                                }`}
                              style={{ width: `${Math.max(mastery.score * 100, 3)}%` }}
                            />
                          )}
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{mastery.questions} questions</span>
                          <span>{mastery.accuracy > 0 ? `${mastery.accuracy}% accuracy` : 'No attempts'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Side Panel: Exam Readiness */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy size={20} />
              Exam Readiness
            </CardTitle>
            <CardDescription>{examReadiness.label}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[180px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={readinessData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    <Cell fill={examReadiness.score >= 70 ? '#22c55e' : examReadiness.score >= 40 ? '#f59e0b' : '#6b7280'} />
                    <Cell fill="#e5e7eb" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {progressLoading ? (
                  <Skeleton className="h-10 w-12" />
                ) : (
                  <span className="text-4xl font-bold">{examReadiness.score}</span>
                )}
                <span className="text-xs text-muted-foreground">SCORE</span>
              </div>
            </div>

            <div className="mt-4 w-full space-y-3">
              <h4 className="text-sm font-semibold">Recommended Actions</h4>

              {weakChapters.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium text-sm mb-1">
                    <AlertCircle size={14} />
                    <span>Focus: Weak Spot</span>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-300 mb-2">
                    Review Ch {(weakChapters[0] as any).number}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-700 border-red-200 hover:bg-red-100"
                    asChild
                  >
                    <Link to="/quiz">
                      Take Quiz <ArrowRight size={12} className="ml-1" />
                    </Link>
                  </Button>
                </div>
              )}

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-medium text-sm mb-1">
                  <BookOpen size={14} />
                  <span>Continue Learning</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-300 mb-2">
                  Start with Chapter 1: Overview
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-blue-700 border-blue-200 hover:bg-blue-100"
                  asChild
                >
                  <Link to="/textbook">
                    Open Textbook <ArrowRight size={12} className="ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;