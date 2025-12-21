import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Check, BookOpen, Scale, ScrollText, AlertCircle, Save, Edit2 } from "lucide-react";
import { useState, useEffect } from "react";
import { db, Textbook as ITextbook, Chapter as IChapter } from "@/lib/db";
import { detectStructureFromText, generateChunksFromText } from "@/lib/parser";
import { v4 as uuidv4 } from 'uuid';
import { useLiveQuery } from "dexie-react-hooks";
import { useOutletContext } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const TextbookPage = () => {
  const { userId } = useOutletContext<{ userId: string }>();
  
  // We only care about ONE master textbook for the course
  const textbooks = useLiveQuery(
    () => db.textbooks.where('userId').equals(userId).toArray(),
    [userId]
  );
  
  const masterBook = textbooks?.[0];
  const [chapters, setChapters] = useState<IChapter[]>([]);
  
  // Stats
  const [stats, setStats] = useState({ cases: 0, statutes: 0, chunks: 0 });

  // Upload/Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  
  // Editing State
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (masterBook) {
        db.chapters.where('textbookId').equals(masterBook.id).toArray().then((chaps) => {
             setChapters(chaps.sort((a,b) => a.number - b.number));
        });
        
        // Calculate stats from chunks
        db.chunks.where('textbookId').equals(masterBook.id).toArray().then(chunks => {
            let cases = 0;
            let statutes = 0;
            chunks.forEach(c => {
                cases += c.caseRefs?.length || 0;
                statutes += c.statutoryRefs?.length || 0;
            });
            setStats({ cases, statutes, chunks: chunks.length });
        });
    }
  }, [masterBook]);

  const handleInitializeCourse = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress(5);
    setStatus("Loading Source Text...");

    try {
        const text = await file.text();
        const textbookId = uuidv4();
        
        setStatus("Analyzing Legal Structure...");
        setProgress(25);
        
        // 1. Structure Detection
        const structure = detectStructureFromText(text);
        
        setStatus("Creating Master Record...");
        setProgress(50);

        // 2. Save Master Textbook
        const newTextbook: ITextbook = {
            id: textbookId,
            userId: userId,
            title: "Fundamentals of Corporate Tax",
            fileName: file.name,
            totalPages: Math.ceil(text.length / 3000), 
            uploadDate: new Date(),
            processed: true
        };
        
        await db.textbooks.clear(); // Ensure only one exists
        await db.textbooks.add(newTextbook);
        
        // 3. Save Chapters
        const newChapters = structure.chapters.map(c => ({
            id: uuidv4(),
            textbookId,
            number: c.number,
            title: c.title,
            startPage: c.startLine,
            endPage: c.endLine
        }));
        
        await db.chapters.clear();
        await db.chapters.bulkAdd(newChapters);
        
        setStatus("Indexing Case Law & Statutes...");
        setProgress(75);

        // 4. Generate Chunks & Extract Entities
        const chunks = generateChunksFromText(text, newChapters.map(nc => ({
            ...nc,
            startLine: nc.startPage,
            endLine: nc.endPage
        })), textbookId);

        await db.chunks.clear();
        await db.chunks.bulkAdd(chunks);
        
        setProgress(100);
        setStatus("Course Initialized Successfully");
        
    } catch (err) {
        console.error(err);
        setStatus("Error: " + err);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleChapterUpdate = async (chapter: IChapter, field: keyof IChapter, value: any) => {
    const updated = { ...chapter, [field]: value };
    const newChapters = chapters.map(c => c.id === chapter.id ? updated : c);
    setChapters(newChapters);
  };

  const saveChapters = async () => {
    await db.chapters.bulkPut(chapters);
    setIsEditing(false);
  };

  // ----------------------------------------------------------------------
  // VIEW: INITIALIZATION (No book loaded)
  // ----------------------------------------------------------------------
  if (!masterBook && !isProcessing) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-3xl mx-auto text-center space-y-8">
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">Initialize Course Material</h1>
                <p className="text-xl text-muted-foreground">
                    Upload the <span className="font-semibold text-primary">"Fundamentals of Corporate Tax"</span> text file to begin.
                </p>
            </div>

            <Card className="w-full border-dashed border-2">
                <CardContent className="pt-10 pb-10 space-y-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <FileText className="h-10 w-10 text-primary" />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="upload-master" className="cursor-pointer">
                            <div className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-md font-medium transition-colors inline-flex items-center gap-2">
                                <Upload size={18} />
                                Select Master Text File
                            </div>
                            <Input 
                                id="upload-master" 
                                type="file" 
                                accept=".txt" 
                                className="hidden" 
                                onChange={handleInitializeCourse} 
                            />
                        </Label>
                        <p className="text-xs text-muted-foreground mt-4">
                            Accepts .txt format only. This will overwrite any existing course data.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
      );
  }

  // ----------------------------------------------------------------------
  // VIEW: PROCESSING
  // ----------------------------------------------------------------------
  if (isProcessing) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center space-y-6">
            <h2 className="text-2xl font-bold">Initializing Course...</h2>
            <Progress value={progress} className="w-full h-3" />
            <p className="text-muted-foreground animate-pulse">{status}</p>
        </div>
      );
  }

  // ----------------------------------------------------------------------
  // VIEW: COURSE CONTENT (Book loaded)
  // ----------------------------------------------------------------------
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Course Material</h1>
            <p className="text-muted-foreground">Fundamentals of Corporate Taxation</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => {
                if(confirm("Are you sure? This will delete all course data and progress.")) {
                    db.textbooks.clear();
                    db.chapters.clear();
                    db.chunks.clear();
                    window.location.reload();
                }
            }}>
                Reset Course Data
            </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
            <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <BookOpen size={24} />
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Chapters</p>
                    <h3 className="text-2xl font-bold">{chapters.length}</h3>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                    <Scale size={24} />
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Case Law Citations</p>
                    <h3 className="text-2xl font-bold">{stats.cases}</h3>
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                    <ScrollText size={24} />
                </div>
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Statutory Refs</p>
                    <h3 className="text-2xl font-bold">{stats.statutes}</h3>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Structure Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Course Structure</CardTitle>
                <CardDescription>Detected hierarchy from source text</CardDescription>
            </div>
            <div className="flex gap-2">
                {isEditing ? (
                    <Button onClick={saveChapters} size="sm" className="gap-2">
                        <Save size={16} /> Save Structure
                    </Button>
                ) : (
                    <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="gap-2">
                        <Edit2 size={16} /> Edit Structure
                    </Button>
                )}
            </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Ch #</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="w-[120px]">Lines</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {chapters.map((chapter) => (
                        <TableRow key={chapter.id}>
                            <TableCell>
                                {isEditing ? (
                                    <Input 
                                        type="number" 
                                        value={chapter.number} 
                                        onChange={(e) => handleChapterUpdate(chapter, 'number', parseInt(e.target.value))}
                                        className="h-8 w-12" 
                                    />
                                ) : (
                                    <span className="font-bold text-muted-foreground">{chapter.number}</span>
                                )}
                            </TableCell>
                            <TableCell>
                                {isEditing ? (
                                    <Input 
                                        value={chapter.title} 
                                        onChange={(e) => handleChapterUpdate(chapter, 'title', e.target.value)}
                                        className="h-8" 
                                    />
                                ) : (
                                    <span className="font-medium">{chapter.title}</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <span className="text-xs text-muted-foreground font-mono">
                                    {chapter.startPage} - {chapter.endPage}
                                </span>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                                    <Check size={10} className="mr-1" /> Ready
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TextbookPage;