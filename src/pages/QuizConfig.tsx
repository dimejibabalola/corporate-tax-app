import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_CHAPTERS } from "@/lib/mock-data";
import { Brain, CheckCircle2, ChevronRight, Layers } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const QuizConfig = () => {
  const [questionCount, setQuestionCount] = useState([10]);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);

  const toggleChapter = (id: string) => {
    if (selectedChapters.includes(id)) {
      setSelectedChapters(selectedChapters.filter(c => c !== id));
    } else {
      setSelectedChapters([...selectedChapters, id]);
    }
  };

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
                Select Content
            </CardTitle>
            <CardDescription>Choose what material you want to cover.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="chapters">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="chapters">By Chapter</TabsTrigger>
                <TabsTrigger value="weak-areas">Weak Areas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chapters" className="space-y-4">
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                    {MOCK_CHAPTERS.map((chapter) => (
                        <div 
                            key={chapter.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedChapters.includes(chapter.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-gray-300'}`}
                            onClick={() => toggleChapter(chapter.id)}
                        >
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedChapters.includes(chapter.id) ? 'bg-primary border-primary' : 'border-gray-400'}`}>
                                {selectedChapters.includes(chapter.id) && <CheckCircle2 size={14} className="text-white" />}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-sm">{chapter.number}. {chapter.title}</p>
                            </div>
                        </div>
                    ))}
                </div>
              </TabsContent>
              
              <TabsContent value="weak-areas">
                <div className="p-8 text-center border rounded-lg border-dashed">
                    <Brain className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                    <h3 className="font-medium">Smart Review</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        We've identified 3 sections where your accuracy is below 70%.
                    </p>
                    <Button variant="secondary">Select Weak Areas Automatically</Button>
                </div>
              </TabsContent>
            </Tabs>
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
                    max={50} 
                    min={5} 
                    step={5} 
                    className="py-2"
                />
            </div>

            <div className="space-y-3">
                <Label>Difficulty</Label>
                <RadioGroup defaultValue="intermediate" className="grid grid-cols-3 gap-4">
                    <div>
                        <RadioGroupItem value="basic" id="basic" className="peer sr-only" />
                        <Label
                            htmlFor="basic"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                            <span className="font-semibold">Basic</span>
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="intermediate" id="intermediate" className="peer sr-only" />
                        <Label
                            htmlFor="intermediate"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                            <span className="font-semibold">Standard</span>
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="exam" id="exam" className="peer sr-only" />
                        <Label
                            htmlFor="exam"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                            <span className="font-semibold">Exam Level</span>
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            <div className="space-y-4 pt-4 border-t">
                <Label>Question Types</Label>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                        <Switch id="mc" defaultChecked />
                        <Label htmlFor="mc">Multiple Choice</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="sa" defaultChecked />
                        <Label htmlFor="sa">Short Answer</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="tf" />
                        <Label htmlFor="tf">True/False</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="issue" />
                        <Label htmlFor="issue">Issue Spotter</Label>
                    </div>
                </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full h-12 text-lg" disabled={selectedChapters.length === 0}>
                Generate Quiz <ChevronRight className="ml-2" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default QuizConfig;