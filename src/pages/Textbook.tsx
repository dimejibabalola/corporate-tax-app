import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Upload, Trash2, Edit2, Loader2, Save, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { db, Textbook as ITextbook, Chapter as IChapter } from "@/lib/db";
import { detectStructureFromText, generateChunksFromText } from "@/lib/parser";
import { v4 as uuidv4 } from 'uuid';
import { useLiveQuery } from "dexie-react-hooks";
import { useOutletContext } from "react-router-dom";

const TextbookPage = () => {
  const { userId } = useOutletContext<{ userId: string }>();
  
  // Filter textbooks by the current logged-in user
  const textbooks = useLiveQuery(
    () => db.textbooks.where('userId').equals(userId).toArray(),
    [userId]
  );
  
  // Upload State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  
  // Selection State
  const [activeTextbook, setActiveTextbook] = useState<ITextbook | null>(null);
  
  // Editing State
  const [chapters, setChapters] = useState<IChapter[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // If books change (e.g. one deleted), reset active if it's gone
    if (activeTextbook && textbooks) {
        const stillExists = textbooks.find(b => b.id === activeTextbook.id);
        if (!stillExists) setActiveTextbook(null);
    }
  }, [textbooks]);

  useEffect(() => {
    if (activeTextbook) {
        db.chapters.where('textbookId').equals(activeTextbook.id).toArray().then(setChapters);
    } else {
        setChapters([]);
    }
  }, [activeTextbook]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);
    setStatus("Reading file...");

    try {
        const text = await file.text();
        const textbookId = uuidv4();
        
        setStatus("Analyzing structure...");
        setProgress(30);
        
        // 1. Structure
        const structure = detectStructureFromText(text);
        
        setStatus("Saving textbook...");
        setProgress(50);

        // 2. Save Textbook
        const newTextbook: ITextbook = {
            id: textbookId,
            userId: userId,
            title: file.name.replace('.txt', ''),
            fileName: file.name,
            totalPages: Math.ceil(text.length / 3000), // Approximation for display
            uploadDate: new Date(),
            processed: true
        };
        
        await db.textbooks.add(newTextbook);
        
        // 3. Save Chapters
        const newChapters = structure.chapters.map(c => ({
            id: uuidv4(),
            textbookId,
            number: c.number,
            title: c.title,
            startPage: c.startLine, // We use Line numbers as proxies for pages in text mode
            endPage: c.endLine
        }));
        
        await db.chapters.bulkAdd(newChapters);
        
        setStatus("Indexing content (Case Law & Statutes)...");
        setProgress(70);

        // 4. Generate & Save Chunks
        // We need to map the newChapters back to the structure the chunker expects
        // But here we can pass the ID-hydrated chapters directly if we modify the helper or just map
        const chunks = generateChunksFromText(text, newChapters.map(nc => ({
            ...nc,
            startLine: nc.startPage,
            endLine: nc.endPage
        })), textbookId);

        await db.chunks.bulkAdd(chunks);
        
        setProgress(100);
        setStatus("Complete!");
        setActiveTextbook(newTextbook);
        
    } catch (err) {
        console.error(err);
        setStatus("Error processing file: " + err);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    await db.transaction('rw', db.textbooks, db.chapters, db.chunks, async () => {
        await db.textbooks.delete(id);
        await db.chapters.where('textbookId').equals(id).delete();
        await db.chunks.where('textbookId').equals(id).delete();
    });
    if (activeTextbook?.id === id) setActiveTextbook(null);
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Textbook Library</h1>
            <p className="text-muted-foreground">Manage your study materials.</p>
        </div>
        {activeTextbook && (
            <Button variant="outline" onClick={() => setActiveTextbook(null)}>
                Upload New
            </Button>
        )}
      </div>

      {!activeTextbook && (!textbooks || textbooks.length === 0) ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            {isProcessing ? (
                <div className="w-full max-w-md space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                    <p className="text-lg font-medium">{status}</p>
                    <Progress value={progress} className="w-full" />
                </div>
            ) : (
                <>
                    <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Upload Textbook (Text File)</h3>
                    <p className="text-muted-foreground max-w-sm mb-6">
                    Please upload the <b>Fundamentals of Corporate Tax</b> text file (.txt).
                    We will auto-detect chapters, case law citations, and statutory references.
                    </p>
                    <div className="flex flex-col gap-4 w-full max-w-xs">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="textbook">Select File</Label>
                        <Input id="textbook" type="file" accept=".txt" onChange={handleUpload} />
                    </div>
                    </div>
                </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-4">
            {/* Sidebar List */}
            <Card className="md:col-span-1 h-fit">
                <CardHeader>
                    <CardTitle>My Books</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {textbooks?.map(book => (
                        <div 
                            key={book.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${activeTextbook?.id === book.id ? 'bg-primary/10 border-primary' : 'hover:bg-secondary'}`}
                            onClick={() => setActiveTextbook(book)}
                        >
                            <div className="flex justify-between items-start">
                                <div className="overflow-hidden">
                                    <p className="font-medium truncate">{book.title}</p>
                                    <p className="text-xs text-muted-foreground">Processed {new Date(book.uploadDate).toLocaleDateString()}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(book.id); }}>
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {!activeTextbook && textbooks?.length > 0 && (
                        <Button className="w-full mt-4" variant="outline" onClick={() => setActiveTextbook(null)}>
                            <Upload className="mr-2 h-4 w-4" /> Upload New
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Main Content: Chapter Editor */}
            {activeTextbook ? (
                <Card className="md:col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>{activeTextbook.title}</CardTitle>
                            <CardDescription>Detected Chapters & Structure</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            {isEditing ? (
                                <Button onClick={saveChapters} size="sm" className="gap-2">
                                    <Save size={16} /> Save Changes
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
                                    <TableHead className="w-[100px]">Start Line</TableHead>
                                    <TableHead className="w-[100px]">End Line</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {chapters.sort((a,b) => a.number - b.number).map((chapter) => (
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
                                                <span className="font-medium">{chapter.number}</span>
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
                                                <span>{chapter.title}</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isEditing ? (
                                                <Input 
                                                    type="number" 
                                                    value={chapter.startPage} 
                                                    onChange={(e) => handleChapterUpdate(chapter, 'startPage', parseInt(e.target.value))}
                                                    className="h-8 w-20" 
                                                />
                                            ) : (
                                                <span className="text-muted-foreground">{chapter.startPage}</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isEditing ? (
                                                <Input 
                                                    type="number" 
                                                    value={chapter.endPage} 
                                                    onChange={(e) => handleChapterUpdate(chapter, 'endPage', parseInt(e.target.value))}
                                                    className="h-8 w-20" 
                                                />
                                            ) : (
                                                <span className="text-muted-foreground">{chapter.endPage}</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : (
                <div className="md:col-span-3 flex items-center justify-center text-muted-foreground bg-secondary/20 rounded-lg">
                    Select a book from the sidebar to view details
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default TextbookPage;