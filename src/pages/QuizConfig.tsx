import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, CheckCircle2, ChevronRight, Layers, XCircle, ArrowLeft, ArrowRight, RotateCcw, Trophy, Flame } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useTracker } from "@/hooks/use-tracker";
import { useOutletContext } from "react-router-dom";
import { db, Chapter } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { TEXTBOOK_STRUCTURE } from "@/lib/textbook/structure";
import { Question, QuestionType, Difficulty, MCQuestion, TrueFalseQuestion, FillBlankQuestion } from "@/types/quiz";
import { generateDemoQuiz, evaluateObjective, saveQuizAttempt, updateStreak } from "@/services/quiz";
import { toast } from "sonner";

type QuizPhase = 'config' | 'taking' | 'results';

const QuizConfig = () => {
  const { userId } = useOutletContext<{ userId: string }>();
  const { logActivity } = useTracker(userId);

  // Get textbook and chapters
  const textbook = useLiveQuery(() =>
    db.textbooks.where('userId').equals(userId).first()
    , [userId]);

  const chapters = useLiveQuery(() =>
    textbook ? db.chapters.where('textbookId').equals(textbook.id).sortBy('number') : []
    , [textbook]);

  // Quiz Configuration State
  const [questionCount, setQuestionCount] = useState([10]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [questionTypes, setQuestionTypes] = useState<Record<QuestionType, boolean>>({
    'MC': true,
    'TRUE_FALSE': true,
    'FILL_BLANK': true,
    'SHORT_ANSWER': false,
    'ISSUE_SPOTTER': false
  });

  // Quiz Taking State  
  const [phase, setPhase] = useState<QuizPhase>('config');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [evaluations, setEvaluations] = useState<Record<string, { isCorrect: boolean; feedback: string }>>({});

  // Results State
  const [results, setResults] = useState<{ score: number; correct: number; total: number; streak: number } | null>(null);

  const currentQuestion = questions[currentIndex];
  const hasAnswered = currentQuestion && answers[currentQuestion.id] !== undefined;
  const isEvaluated = currentQuestion && evaluations[currentQuestion.id] !== undefined;


  // Derive available sections based on selected chapter
  const availableSections = useMemo(() => {
    if (!selectedChapterId) return [];

    // Find the chapter definition in TEXTBOOK_STRUCTURE
    for (const part of TEXTBOOK_STRUCTURE) {
      const chapterDef = part.chapters.find(c => {
        // Try to find matching chapter by number or ID if possible. 
        // Since chapters from DB have IDs, we need to map back.
        // Let's assume selectedChapterId is the DB ID.
        const dbChapter = chapters?.find(dbC => dbC.id === selectedChapterId);
        return dbChapter && c.number === dbChapter.number;
      });

      if (chapterDef) {
        return chapterDef.sections;
      }
    }
    return [];
  }, [selectedChapterId, chapters]);

  const toggleQuestionType = (type: QuestionType) => {
    setQuestionTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleGenerate = () => {
    const activeTypes = (Object.entries(questionTypes) as [QuestionType, boolean][])
      .filter(([_, enabled]) => enabled)
      .map(([type]) => type);

    if (activeTypes.length === 0) {
      toast.error("Please select at least one question type");
      return;
    }

    // Generate quiz from demo questions
    const generatedQuestions = generateDemoQuiz({
      chapterId: selectedChapterId || undefined,
      sectionId: selectedSectionId || undefined,
      questionTypes: activeTypes,

      difficulty,
      count: questionCount[0]
    });

    if (generatedQuestions.length === 0) {
      toast.error("No questions available for selected criteria. Try different options.");
      return;
    }

    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setAnswers({});
    setEvaluations({});
    setShowExplanation(false);
    setPhase('taking');
    logActivity('GENERATE_QUIZ', {
      chapterId: selectedChapterId,
      sectionId: selectedSectionId,
      count: generatedQuestions.length,
      difficulty
    });
  };

  const submitAnswer = () => {
    if (!currentQuestion || !answers[currentQuestion.id]) return;

    const userAnswer = answers[currentQuestion.id];
    const evaluation = evaluateObjective(userAnswer, currentQuestion);

    setEvaluations(prev => ({
      ...prev,
      [currentQuestion.id]: evaluation
    }));
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    setShowExplanation(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Quiz complete - calculate results
      finishQuiz();
    }
  };

  const prevQuestion = () => {
    setShowExplanation(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const finishQuiz = async () => {
    const evaluatedAnswers = Object.entries(evaluations).map(([questionId, eval_]) => ({
      questionId,
      userAnswer: answers[questionId] || '',
      isCorrect: eval_.isCorrect,
      feedback: eval_.feedback
    }));

    const correct = evaluatedAnswers.filter(a => a.isCorrect).length;
    const total = questions.length;
    const score = Math.round((correct / total) * 100);

    // Save to database
    if (textbook) {
      await saveQuizAttempt(
        userId,
        textbook.id,
        selectedChapterId || undefined,
        questions,
        evaluatedAnswers
      );
    }

    // Update streak
    const newStreak = await updateStreak(userId);

    setResults({ score, correct, total, streak: newStreak });
    setPhase('results');

    logActivity('COMPLETE_QUIZ', { score, correct, total });
    toast.success(`Quiz complete! You scored ${score}%`);
  };

  const resetQuiz = () => {
    setPhase('config');
    setQuestions([]);
    setAnswers({});
    setEvaluations({});
    setResults(null);
    setCurrentIndex(0);
    setShowExplanation(false);
  };

  // Render Question based on type
  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case 'MC':
        return renderMCQuestion(question as MCQuestion);
      case 'TRUE_FALSE':
        return renderTFQuestion(question as TrueFalseQuestion);
      case 'FILL_BLANK':
        return renderFillBlankQuestion(question as FillBlankQuestion);
      default:
        return <p>Unsupported question type</p>;
    }
  };

  const renderMCQuestion = (q: MCQuestion) => (
    <div className="space-y-4">
      <p className="text-lg font-medium">{q.question}</p>
      <RadioGroup
        value={answers[q.id] || ''}
        onValueChange={(val) => setAnswers(prev => ({ ...prev, [q.id]: val }))}
        disabled={isEvaluated}
      >
        {(['A', 'B', 'C', 'D'] as const).map((letter) => {
          const isCorrect = isEvaluated && letter === q.correctAnswer;
          const isWrong = isEvaluated && answers[q.id] === letter && letter !== q.correctAnswer;

          return (
            <div
              key={letter}
              className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${isCorrect ? 'bg-green-50 border-green-500' :
                isWrong ? 'bg-red-50 border-red-500' :
                  answers[q.id] === letter ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'
                }`}
            >
              <RadioGroupItem value={letter} id={`${q.id}-${letter}`} />
              <Label htmlFor={`${q.id}-${letter}`} className="flex-1 cursor-pointer">
                <span className="font-semibold mr-2">{letter}.</span>
                {q.options[letter]}
              </Label>
              {isCorrect && <CheckCircle2 className="text-green-600" size={20} />}
              {isWrong && <XCircle className="text-red-600" size={20} />}
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );

  const renderTFQuestion = (q: TrueFalseQuestion) => (
    <div className="space-y-4">
      <p className="text-lg font-medium">{q.statement}</p>
      <RadioGroup
        value={answers[q.id] || ''}
        onValueChange={(val) => setAnswers(prev => ({ ...prev, [q.id]: val }))}
        disabled={isEvaluated}
        className="flex gap-4"
      >
        {[{ value: 'true', label: 'True' }, { value: 'false', label: 'False' }].map(({ value, label }) => {
          const isCorrect = isEvaluated && (value === 'true') === q.correctAnswer;
          const isWrong = isEvaluated && answers[q.id] === value && (value === 'true') !== q.correctAnswer;

          return (
            <div
              key={value}
              className={`flex-1 flex items-center justify-center space-x-2 p-6 border rounded-lg transition-colors cursor-pointer ${isCorrect ? 'bg-green-50 border-green-500' :
                isWrong ? 'bg-red-50 border-red-500' :
                  answers[q.id] === value ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'
                }`}
            >
              <RadioGroupItem value={value} id={`${q.id}-${value}`} />
              <Label htmlFor={`${q.id}-${value}`} className="text-lg font-semibold cursor-pointer">
                {label}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );

  const renderFillBlankQuestion = (q: FillBlankQuestion) => (
    <div className="space-y-4">
      <p className="text-lg font-medium">{q.question}</p>
      <input
        type="text"
        value={answers[q.id] || ''}
        onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
        disabled={isEvaluated}
        placeholder="Type your answer..."
        className={`w-full p-4 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${isEvaluated
          ? evaluations[q.id]?.isCorrect
            ? 'bg-green-50 border-green-500'
            : 'bg-red-50 border-red-500'
          : ''
          }`}
      />
      {isEvaluated && !evaluations[q.id]?.isCorrect && (
        <p className="text-green-600 font-medium">Correct answer: {q.correctAnswer}</p>
      )}
    </div>
  );

  // PHASE: Configuration
  if (phase === 'config') {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Practice Session</h1>
          <p className="text-muted-foreground">Configure your quiz parameters.</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Select Material
              </CardTitle>
              <CardDescription>Choose the chapter and section you want to study.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Chapter</Label>
                <Select
                  value={selectedChapterId || "all"}
                  onValueChange={(val) => {
                    if (val === "all") {
                      setSelectedChapterId(null);
                      setSelectedSectionId(null);
                    } else {
                      setSelectedChapterId(val);
                      setSelectedSectionId(null);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a Chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Chapters</SelectItem>
                    {TEXTBOOK_STRUCTURE.map((part) => (
                      <div key={part.number}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                          Part {part.number}: {part.title}
                        </div>
                        {part.chapters.map((chapterDef) => {
                          const chapter = chapters?.find(c => c.number === chapterDef.number);
                          if (!chapter) return null;
                          return (
                            <SelectItem key={chapter.id} value={chapter.id}>
                              Ch {chapter.number}: {chapter.title}
                            </SelectItem>
                          );
                        })}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className={!selectedChapterId ? "text-muted-foreground" : ""}>Section (Optional)</Label>
                <Select
                  value={selectedSectionId || "all"}
                  onValueChange={(val) => setSelectedSectionId(val === "all" ? null : val)}
                  disabled={!selectedChapterId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={!selectedChapterId ? "Select a chapter first" : "All Sections"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {availableSections.map((section) => (
                      <SelectItem key={section.letter} value={section.letter}>
                        Section {section.letter}: {section.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quiz Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Number of Questions</Label>
                  <span className="text-sm font-medium">{questionCount[0]}</span>
                </div>
                <Slider
                  value={questionCount}
                  onValueChange={setQuestionCount}
                  max={20}
                  min={5}
                  step={5}
                  className="py-2"
                />
              </div>

              <div className="space-y-3">
                <Label>Difficulty</Label>
                <RadioGroup
                  value={difficulty}
                  onValueChange={(v) => setDifficulty(v as Difficulty)}
                  className="grid grid-cols-3 gap-4"
                >
                  {[
                    { value: 'basic', label: 'Basic' },
                    { value: 'intermediate', label: 'Standard' },
                    { value: 'exam', label: 'Exam Level' }
                  ].map(({ value, label }) => (
                    <div key={value}>
                      <RadioGroupItem value={value} id={value} className="peer sr-only" />
                      <Label
                        htmlFor={value}
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <span className="font-semibold">{label}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label>Question Types</Label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { type: 'MC' as QuestionType, label: 'Multiple Choice' },
                    { type: 'TRUE_FALSE' as QuestionType, label: 'True/False' },
                    { type: 'FILL_BLANK' as QuestionType, label: 'Fill in Blank' },
                    { type: 'SHORT_ANSWER' as QuestionType, label: 'Short Answer' }
                  ].map(({ type, label }) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Switch
                        id={type}
                        checked={questionTypes[type]}
                        onCheckedChange={() => toggleQuestionType(type)}
                      />
                      <Label htmlFor={type}>{label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-indigo-600"
                onClick={handleGenerate}
              >
                Start Quiz <ChevronRight className="ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // PHASE: Taking Quiz
  if (phase === 'taking' && currentQuestion) {
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Progress Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={resetQuiz}>
            <ArrowLeft size={16} className="mr-2" /> Exit Quiz
          </Button>
          <div className="text-center">
            <span className="text-sm text-muted-foreground">Question</span>
            <span className="ml-2 font-bold">{currentIndex + 1} / {questions.length}</span>
          </div>
          <Badge variant="outline">{currentQuestion.difficulty}</Badge>
        </div>

        <Progress value={progress} className="h-2" />

        {/* Question Card */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700">
                {currentQuestion.type === 'MC' ? 'Multiple Choice' :
                  currentQuestion.type === 'TRUE_FALSE' ? 'True/False' :
                    currentQuestion.type === 'FILL_BLANK' ? 'Fill in Blank' : 'Question'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Pages {currentQuestion.sourcePages.join(', ')}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {renderQuestion(currentQuestion)}

            {/* Explanation */}
            {showExplanation && evaluations[currentQuestion.id] && (
              <div className={`mt-6 p-4 rounded-lg ${evaluations[currentQuestion.id].isCorrect
                ? 'bg-green-50 border border-green-200'
                : 'bg-amber-50 border border-amber-200'
                }`}>
                <h4 className={`font-semibold mb-2 ${evaluations[currentQuestion.id].isCorrect ? 'text-green-700' : 'text-amber-700'
                  }`}>
                  {evaluations[currentQuestion.id].isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                </h4>
                <p className="text-sm text-gray-700">{currentQuestion.explanation}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevQuestion}
              disabled={currentIndex === 0}
            >
              <ArrowLeft size={16} className="mr-2" /> Previous
            </Button>

            {!isEvaluated ? (
              <Button
                onClick={submitAnswer}
                disabled={!hasAnswered}
                className="bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                Check Answer
              </Button>
            ) : (
              <Button onClick={nextQuestion}>
                {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next'} <ArrowRight size={16} className="ml-2" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  // PHASE: Results
  if (phase === 'results' && results) {
    const isPassing = results.score >= 70;

    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Card className="text-center border-2">
          <CardHeader>
            <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center ${isPassing ? 'bg-green-100' : 'bg-amber-100'
              }`}>
              {isPassing ? (
                <Trophy className="w-12 h-12 text-green-600" />
              ) : (
                <Brain className="w-12 h-12 text-amber-600" />
              )}
            </div>
            <CardTitle className="text-3xl mt-4">
              {isPassing ? 'Great Job!' : 'Keep Practicing!'}
            </CardTitle>
            <CardDescription>
              {isPassing
                ? 'You demonstrated solid understanding of the material.'
                : "Review the explanations and try again to improve your score."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-6xl font-bold text-primary">{results.score}%</div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">{results.correct}</div>
                <div className="text-xs text-muted-foreground">Correct</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-red-600">{results.total - results.correct}</div>
                <div className="text-xs text-muted-foreground">Incorrect</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-1">
                  <Flame size={20} /> {results.streak}
                </div>
                <div className="text-xs text-muted-foreground">Day Streak</div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-4 justify-center">
            <Button variant="outline" onClick={resetQuiz}>
              <RotateCcw size={16} className="mr-2" /> New Quiz
            </Button>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600">
              <a href="/">View Dashboard</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return null;
};

export default QuizConfig;