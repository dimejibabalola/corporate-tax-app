import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MOCK_CHAPTERS, MASTERY_COLORS, MASTERY_LABELS } from "@/lib/mock-data";
import { ArrowRight, TrendingUp, AlertCircle, Clock, CheckCircle2, BookOpen } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useTracker } from "@/hooks/use-tracker";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";

const READINESS_DATA = [
  { name: 'Ready', value: 64 },
  { name: 'Remaining', value: 36 },
];

const Dashboard = () => {
  const { userId } = useOutletContext<{ userId: string }>();
  const { logActivity } = useTracker(userId);
  
  // Real Stats State
  const [streak, setStreak] = useState(0);
  const [totalActions, setTotalActions] = useState(0);

  // Calculate Streak from Activity Logs
  const logs = useLiveQuery(() => 
    db.activityLogs.where('userId').equals(userId).reverse().sortBy('timestamp')
  , [userId]);

  useEffect(() => {
    if (logs && logs.length > 0) {
        setTotalActions(logs.length);
        
        // Simple streak calculation (consecutive days with activity)
        let currentStreak = 0;
        let lastDate = new Date();
        lastDate.setHours(0,0,0,0); // Start of today
        
        // Check today first
        const hasActivityToday = logs.some(l => {
            const d = new Date(l.timestamp);
            d.setHours(0,0,0,0);
            return d.getTime() === lastDate.getTime();
        });

        if (hasActivityToday) currentStreak = 1;

        // Check previous days... (Simplified logic for now)
        // In a real app, we'd iterate backwards checking for gaps < 24h
        setStreak(hasActivityToday ? 1 : 0); 
    }
  }, [logs]);

  const activeChapters = MOCK_CHAPTERS.filter(c => c.progress > 0);
  const weakAreas = activeChapters.filter(c => c.accuracy < 70);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-muted-foreground">You're on track to finish Corporate Tax by May 1st.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" asChild onClick={() => logActivity('VIEW_TEXTBOOK')}>
                <Link to="/textbook">View Textbook</Link>
            </Button>
            <Button asChild onClick={() => logActivity('START_QUIZ')}>
                <Link to="/quiz">Start Session</Link>
            </Button>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exam Readiness</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">64%</div>
            <p className="text-xs text-muted-foreground">+2% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity Count</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActions}</div>
            <p className="text-xs text-muted-foreground">Actions logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{streak} Days</div>
            <p className="text-xs text-muted-foreground">Keep it up!</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weak Areas</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weakAreas.length}</div>
            <p className="text-xs text-muted-foreground">Focus on these next</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Main Progress Area */}
        <Card className="md:col-span-5">
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
            <CardDescription>
              Your mastery across all chapters based on coverage and accuracy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {MOCK_CHAPTERS.map((chapter) => (
                <div key={chapter.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate max-w-[200px] md:max-w-md">
                      {chapter.number}. {chapter.title}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${MASTERY_COLORS[chapter.masteryLevel]} bg-opacity-90`}>
                      {MASTERY_LABELS[chapter.masteryLevel]}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${MASTERY_COLORS[chapter.masteryLevel]} transition-all duration-500`} 
                      style={{ width: `${Math.max(chapter.progress, 5)}%` }} 
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{chapter.questionsAnswered} questions</span>
                    <span>{chapter.accuracy > 0 ? `${chapter.accuracy}% Accuracy` : 'No attempts'}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Side Panel: Exam Readiness Visualization */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Readiness Score</CardTitle>
            <CardDescription>Weighted calculation</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={READINESS_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    <Cell fill="hsl(var(--primary))" />
                    <Cell fill="hsl(var(--secondary))" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">64</span>
                <span className="text-xs text-muted-foreground">SCORE</span>
              </div>
            </div>
            
            <div className="mt-6 w-full space-y-3">
              <h4 className="text-sm font-semibold mb-2">Next Steps</h4>
              {weakAreas.length > 0 ? (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-md">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium text-sm mb-1">
                    <AlertCircle size={14} />
                    <span>Improve Weak Spot</span>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-300">
                    Review {weakAreas[0].title}
                  </p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-red-700 dark:text-red-400 text-xs mt-1"
                    onClick={() => logActivity('START_QUIZ', { context: 'weak_spot' })}
                  >
                    Start Quiz <ArrowRight size={10} className="ml-1" />
                  </Button>
                </div>
              ) : null}
              
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-md">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-medium text-sm mb-1">
                  <BookOpen size={14} />
                  <span>Continue Reading</span>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  Chapter 4: Non-Liquidating Distributions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;